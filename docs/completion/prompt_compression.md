# 提示壓縮 (`compress()`) {#prompt-compression-compress}

:::info Beta

此功能目前為 beta 版。在正式可用之前，API 與行為可能會變更。

:::

在呼叫 `completion()` 之前，使用 `litellm.compress()` 來縮減冗長的對話歷史。

此函式會保留高相關性與最近的內容，以輕量級 stub 取代低相關性內容，並回傳一個檢索工具，讓模型僅在需要時才可要求完整內容。

對於希望由外部服務在伺服器端處理壓縮，而不是透過進程內呼叫處理的 proxy 使用者，請參閱 [Headroom](/docs/proxy/headroom)。

## 快速入門 {#quickstart}

```python
import litellm
from litellm.types.utils import CallTypes

messages = [
    {"role": "system", "content": "You are a coding assistant."},
    {"role": "user", "content": "# auth.py\n" + "def authenticate():\n    pass\n" * 2000},
    {"role": "user", "content": "# utils.py\n" + "def helper():\n    pass\n" * 2000},
    {"role": "user", "content": "Fix the bug in auth.py"},
]

compressed = litellm.compress(
    messages=messages,
    model="gpt-4o",
    call_type=CallTypes.completion,
    compression_trigger=1000,
    compression_target=500,
)

response = litellm.completion(
    model="gpt-4o",
    messages=compressed["messages"],
    tools=compressed["tools"],
)
```

## 它會回傳什麼 {#what-it-returns}

`compress()` 會回傳一個字典，包含：

- `messages`：壓縮後的對話訊息
- `original_tokens`：壓縮前的 token 數
- `compressed_tokens`：壓縮後的 token 數
- `compression_ratio`：移除的 token 比例
- `cache`：stub key -> 原始完整內容的鍵值對映
- `tools`：用於按需還原的檢索工具定義（`litellm_content_retrieve`）

## 參數 {#parameters}

- `messages`（`List[dict]`，必填）：輸入的對話訊息
- `model`（`str`，必填）：用於 token 計數的模型名稱
- `call_type`（`CallTypes`，預設 `CallTypes.completion`）：這些訊息所遵循的 LiteLLM 呼叫類型，其訊息 schema。支援的值：`CallTypes.completion` / `CallTypes.acompletion`（OpenAI chat-completions 形狀）以及 `CallTypes.anthropic_messages`（Anthropic Messages 形狀）
- `compression_trigger`（`int`，預設 `200000`）：只有在輸入 token 數超過此值時才進行壓縮
- `compression_target`（`Optional[int]`，預設 `70% of compression_trigger`）：期望的壓縮後 token 預算
- `embedding_model`（`Optional[str]`）：若設定，則結合 BM25 + embedding 相關性評分
- `embedding_model_params`（`Optional[dict]`）：傳遞給 `litellm.embedding()` 的額外 kwargs
- `compression_cache`（`Optional[DualCache]`）：embedding 評分使用的選用快取

## 行為注意事項 {#behavior-notes}

- 低於 `compression_trigger` 的訊息會原樣通過。
- 系統訊息、最後一則使用者訊息，以及最後一則 assistant 訊息一律保留。
- 如果相關訊息無法完全符合剩餘預算，`compress()` 可能會保留其截斷版本。
- 被壓縮移除的內容不會遺失；它會儲存在 `cache` 中，並可透過 `litellm_content_retrieve` 存取。

## 處理檢索工具呼叫 {#handling-retrieval-tool-calls}

如果模型呼叫 `litellm_content_retrieve`，請在 `compressed["cache"]` 中查找所請求的 key，並將該值作為工具輸出回傳。

```python
import json

tool_call = response.choices[0].message.tool_calls[0]
args = json.loads(tool_call.function.arguments)
full_content = compressed["cache"][args["key"]]
```

## 伺服器端回呼迴圈 (`/v1/messages`) {#server-side-callback-loop-v1messages}

您可以啟用基於回呼的壓縮攔截，讓檢索迴圈
對 Anthropic Messages 呼叫而言是透明的：

```yaml
litellm_settings:
  callbacks: ["compression_interception"]
  compression_interception_params:
    enabled: true
    compression_trigger: 10000
    compression_target: 7000
```

啟用後，LiteLLM 會執行以下伺服器端流程：

1. 在第一次提供者呼叫前壓縮傳入訊息。
2. 注入 `litellm_content_retrieve` 工具。
3. 偵測模型回應中的檢索 `tool_use` 區塊。
4. 從壓縮快取中解析檢索 keys。
5. 透過代理式迴圈重新執行模型並回傳最終答案。

## 效能 {#performance}

以 [SWE-bench Lite](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite_bm25_27K) 進行基準測試（真實 GitHub 問題，每個問題約有 27k tokens 的由 BM25 檢索的 repo 上下文）。

### Claude Opus — 5 個問題，trigger=10k {#claude-opus--5-problems-trigger10k}

| 指標 | 基準值 | 壓縮後 | 差異 |
|---|---|---|---|
| 檔案重疊 | 1.000 | 1.000 | +0.000 |
| 完全相符的檔案 | 100% | 100% | +0.0% |
| Hunk 重疊 | 0.582 | 0.361 | -0.221 |
| 內容相似度 | 0.367 | 0.373 | +0.006 |
| 平均 prompt tokens | 30,828 | 6,890 | -77.7% |
| 平均成本/問題 | $0.488 | $0.136 | **-72.0%** |

**重點結論：**

- **檔案層級的定位完全保留** — 無論是否壓縮，模型都會編輯相同的檔案。
- **內容相似度與基準值一致** — 實際變更的行內容具有可比性。
- **Hunk 重疊小幅下降**（-0.221）— 模型會定位到正確的檔案，但在較少上下文下，可能會編輯稍有不同的行區間。
- **72% 成本節省**，token 減少 78%。

### 指標說明 {#metrics-explained}

| 指標 | 衡量內容 |
|---|---|
| **檔案重疊** | gold-patch 檔案中出現在生成 patch 的比例 |
| **完全相符的檔案** | 生成的 patch 是否剛好觸及同一組檔案 |
| **Hunk 重疊** | gold hunk 行範圍中被生成 hunks 涵蓋的比例 |
| **內容相似度** | gold 與生成 patch 之間變更行（新增/刪除）的 Jaccard 相似度 |

### 執行 SWE-bench 評估 {#running-the-swe-bench-eval}

```bash
# 5-problem quick check
python tests/eval_swe_bench.py --model claude-opus-4-20250514 --problems 5

# Custom trigger/target
python tests/eval_swe_bench.py --model gpt-4o --problems 20 \
    --compression-trigger 15000 --compression-target 10000

# With embedding scoring
python tests/eval_swe_bench.py --model gpt-4o --problems 10 \
    --embedding-model text-embedding-3-small
```

### 執行 HumanEval 風格評估 {#running-the-humaneval-style-eval}

```bash
python scripts/eval_compression.py --model gpt-4o --problems 5
```
