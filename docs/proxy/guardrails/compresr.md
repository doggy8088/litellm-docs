import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 上下文壓縮（Compresr） {#context-compression-compresr}

[Compresr](https://compresr.ai) 會針對正在提出的問題壓縮 LLM 上下文。它保留對答案有影響的 token，並捨棄其餘部分。作為 LiteLLM 防護欄，它會在工具輸出、擷取的文件、資料庫結果與 RAG 負載到達模型之前先行壓縮，因此您能以更少的輸入 token 得到相同的答案。

此功能可在 `/v1/chat/completions`、`/v1/messages`（Anthropic 格式）以及 `/v1/responses` 上使用。

## 示範 {#demo}

<iframe width="840" height="500" src="https://www.youtube.com/embed/4Ktiwv3ka40" frameBorder="0" allowFullScreen></iframe>

## 運作方式 {#how-it-works}

此防護欄會在 `pre_call` 步驟期間於程序內執行，並呼叫 Compresr 的代管 API（`https://api.compresr.ai`），因此不需要額外部署服務。只有 proxy 會與 Compresr 溝通，而且只會傳送為壓縮所選取的訊息文字；用戶端與上游 LLM 提供者都不會連線到它。只有請求輸入會被重寫；回應則原封不動地通過。

壓縮是逐則訊息進行，並且會感知查詢：

1. **選擇目標。** 預設只有至少 500 個字元的 `tool`/`function` 輸出會被壓縮。系統訊息、先前的歷史訊息，以及最後一則使用者訊息都會逐字通過，除非明確啟用（`compress_system`、`compress_history`、`compress_last_user`）。
2. **為每個目標推導查詢。** 工具輸出會依據產生它的工具呼叫意圖來壓縮：LiteLLM 會透過 `tool_call_id` 找到助理呼叫，並將其渲染為例如 `web_search: {"query": "2026 EV range"}`。其他每個目標都會依最後一則使用者訊息來壓縮。沒有查詢的目標會保持未壓縮。
3. **壓縮。** 目標會傳送至 `{api_base}/api/compress/question-specific/`（若有多個則為 `.../batch`），並透過 `X-API-Key` 驗證。
4. **重寫。** 傳回的 `compressed_context` 會就地取代每個目標的文字。未選取的訊息保持 byte-identical，多模態部分（例如圖片）會被保留，而相同或空白的結果會讓請求原樣轉送。

預設會在 `latte_v2` 上執行壓縮，這是 Compresr 速度最快、專用於查詢的模型。它是抽取式的：會刪除對查詢不重要的片段，並將其他內容完整保留。

### 動態壓縮 {#dynamic-compression}

`dynamic: true` 是預設值：服務會測量每個負載的可壓縮程度，並在 `dynamic_min_ratio`（伺服器預設 1.5x）與 `dynamic_max_ratio`（伺服器預設 10.0x）之間為其選擇一個壓縮比，忽略 `target_compression_ratio`。密集內容會輕度壓縮，稀疏內容則會大幅壓縮。

若要固定比率，請改為設定 `dynamic: false` 與 `target_compression_ratio`：0 到 1 之間的值會移除該比例的 token（0.5 會移除大約一半），大於 1 的值則會以 Nx 因子運作（4 會大致保留四分之一）。請使用支出記錄中的 `tokens_saved` 統計資料來判斷您的工作負載能承受多少。

## 需求 {#requirements}

您只需要一個包含 `compresr` 防護欄的 LiteLLM build，以及來自 [compresr.ai](https://compresr.ai) 的 API 金鑰。若為內部部署，請聯絡 [founders@compresr.ai](mailto:founders@compresr.ai)。

## 快速開始 {#quick-start}

### 1. 在您的設定中定義防護欄 {#1-define-the-guardrail-in-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

guardrails:
  - guardrail_name: compresr-compression
    litellm_params:
      guardrail: compresr
      mode: pre_call
      api_key: os.environ/COMPRESR_API_KEY
#     api_base: https://api.compresr.ai  [OPTIONAL, change only for on-prem]
#     model: latte_v2                    [OPTIONAL, this is the default]
#     unreachable_fallback: fail_open    [OPTIONAL, defaults to fail_closed]
#     default_on: true                   [OPTIONAL]
```

請使用 `mode: pre_call`，因為此防護欄只會轉換請求輸入。`api_key` 為必要欄位，可來自設定或 `COMPRESR_API_KEY` 環境變數。將 `default_on: true` 設為壓縮每個請求，或保持關閉（建議）以讓壓縮僅針對每個金鑰或每個請求按需啟用。

其他所有設定都透過 `optional_params` 進行。完整清單請見［設定參考］(#configuration-reference)：

```yaml showLineNumbers title="config.yaml"
guardrails:
  - guardrail_name: compresr-compression
    litellm_params:
      guardrail: compresr
      mode: pre_call
      api_key: os.environ/COMPRESR_API_KEY
      optional_params:
        compress_tool_outputs: true   # default; tool/function results
        compress_system: false        # default; opt in to compress system prompts
        min_chars_to_compress: 500    # default; shorter messages skipped
        dynamic: true                 # default; service picks ratio per payload
```

這個防護欄也可以在 Admin UI 的 Guardrails 下建立，欄位相同；上方的［示範影片］(#demo) 會帶您走過這個流程。

### 2. 啟動 LiteLLM 閘道 {#2-start-the-litellm-gateway}

```shell
litellm --config config.yaml
```

### 3. 傳送請求 {#3-send-a-request}

<Tabs>
<TabItem label="OpenAI 格式" value="openai">

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{anthropic}}",
    "messages": [
      {"role": "user", "content": "Which filing discusses Q3 revenue?"},
      {"role": "assistant", "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": "search_filings", "arguments": "{\"query\": \"Q3 revenue\"}"}}]},
      {"role": "tool", "tool_call_id": "call_1", "content": "<...tens of thousands of tokens of filing text...>"}
    ],
    "guardrails": ["compresr-compression"]
  }'
```

</TabItem>
<TabItem label="Anthropic 格式" value="anthropic">

```shell
curl -i http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "{{anthropic}}",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Which filing discusses Q3 revenue?"}
    ],
    "litellm_metadata": {"guardrails": ["compresr-compression"]}
  }'
```

</TabItem>
</Tabs>

工具輸出會先依 `search_filings: {"query": "Q3 revenue"}` 壓縮，之後負載才會往上游傳送；其他內容都會保持不變。

## 依金鑰啟用壓縮 {#enabling-compression-per-key}

當未設定 `default_on` 時，壓縮只會對明確啟用的請求執行。典型做法是將防護欄附加到虛擬金鑰，讓使用該金鑰的人都能在不更動用戶端的情況下使用壓縮。

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
        "guardrails": ["compresr-compression"]
      }'
```

使用傳回金鑰送出的每個請求都會經過 `compresr-compression`；若是既有金鑰，請使用相同的 `guardrails` 欄位搭配 `/key/update`。使用虛擬金鑰驗證也會啟用［擷取］(#retrieving-compressed-content-compresr_retrieve)，因為原始內容會依金鑰儲存。未使用虛擬金鑰送出的請求仍會被壓縮，但無法擷取。

## 依請求啟用壓縮 {#enabling-compression-per-request}

用戶端可以在單次呼叫上選擇啟用，無需管理員介入。

<Tabs>
<TabItem label="OpenAI 格式" value="openai-perreq">

在請求主體中傳入 `guardrails` 陣列：

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-..." \
  -d '{
    "model": "{{anthropic}}",
    "messages": [...],
    "guardrails": ["compresr-compression"]
  }'
```

</TabItem>
<TabItem label="Anthropic 格式" value="anthropic-perreq">

`/v1/messages` 沒有頂層的 `guardrails` 欄位，因此請透過 `litellm_metadata` 啟用：

```shell
curl -i http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-..." \
  -d '{
    "model": "{{anthropic}}",
    "max_tokens": 1024,
    "messages": [...],
    "litellm_metadata": {"guardrails": ["compresr-compression"]}
  }'
```

</TabItem>
</Tabs>

回應會包含 `x-litellm-applied-guardrails: compresr-compression` 標頭，讓呼叫端可以確認壓縮確實已執行。

## 在自動路由器之後進行壓縮 {#compression-behind-an-auto-router}

[自動路由器](../auto_routing.md) 所處理的請求會進行兩次呼叫：一次用於分類請求，一次用於其路由到的模型。預設情況下，兩者看到的都是相同的壓縮文字。從 v1.101.0 開始，路由器可以為每一跳指定壓縮防護欄，或針對任一者設為 `none`，搭配 `auto_router_routing_compression` 與 `auto_router_model_compression`。設定任一欄位都會讓路由器自行負責其請求的壓縮，並抑制本頁在金鑰、團隊或請求層級附加的防護欄。請參閱［壓縮］(../auto_routing.md#compression)。

## 推廣到整個團隊 {#rolling-out-to-a-team}

平台管理員可以在不更動任何用戶端的情況下，為整個團隊啟用壓縮。最適合的是代理程式與 RAG 工作負載，且其流量主要由非程式碼工具輸出所構成，例如搜尋結果、擷取文件、工單串、CRM 記錄與逐字稿。

**管理員：在 `config.yaml` 註冊 Compresr。** 依照快速開始內容定義 `compresr-compression`。將 `default_on` 保持關閉，以便只有已啟用的金鑰能使用壓縮。

**管理員：發放綁定 Compresr 的每位開發者金鑰。**

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
        "key_alias": "support-agent-alice",
        "guardrails": ["compresr-compression"],
        "models": ["{{anthropic}}"],
        "metadata": {"team": "compression-rollout"}
      }'
```

**開發者：將用戶端指向 proxy。** 任何相容 OpenAI 或 Anthropic 的用戶端都可使用，因為只需更改 base URL 與金鑰。

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-litellm-proxy.example.com/v1",
    api_key="sk-the-key-the-admin-issued",
)
```

從這裡開始，使用該金鑰送出的每個請求，其工具結果都會在派送前先壓縮。若要在單次請求中略過壓縮（例如比較未壓縮的基準），請在 `optional_params` 中設定 `allow_bypass_header: true`，並在該次呼叫送出 `x-compresr-bypass: true`；除非管理員已啟用，否則該標頭會被忽略，因為任何呼叫端都可以設定標頭。

## 擷取已壓縮內容（`compresr_retrieve`） {#retrieving-compressed-content-compresr_retrieve}

每則已壓縮訊息的原始文字在請求期間都可供使用。當 `enable_retrieval` 開啟時（預設值），每次壓縮都會：

1. 將原始文字儲存在記憶體中，並以其 SHA-256 的前 24 個十六進位字元作為索引。
2. 在壓縮後文字後附加標記：`[compresr hash=<hash>: parts of this content were compressed away. If you need the full original, call the compresr_retrieve tool with this hash.]`
3. 在請求既有工具旁，注入一個 `compresr_retrieve` function tool，並提供一個必要的 `hash` 參數。

當模型呼叫 `compresr_retrieve` 時，LiteLLM 會攔截該呼叫、還原原始內容、附加正確配對的工具往返，並重新送出請求，因此用戶端只會看到一次正常的 completion。這在三種介面上都是格式正確的：Anthropic 的 `tool_use`/`tool_result` 區塊、Responses API 的 `function_call`/`function_call_output` 項目，以及 chat completions 的 `role: tool` messages。如果模型在同一輪中將 `compresr_retrieve` 與真實工具呼叫混用，則只有 retrieve 呼叫會在伺服器端解析；模型會在後續重新規劃其真實呼叫，因此工具呼叫與結果會保持配對。

檢索迴圈有上限：

- **租戶隔離。** 原始上下文會儲存在發出請求的虛擬金鑰下，因此雜湊只會解析為其所發行給的金鑰；其他金鑰不會得到任何內容。沒有虛擬金鑰的請求沒有可用來劃分儲存範圍的身分，因此對它們會停用檢索，且每個程序只會記錄一次警告。
- **放大。** 單一輪最多解析 8 個雜湊，且每個雜湊只會解析一次。虛構的雜湊不會解析出任何內容，也不會觸發後續請求。
- **記憶體。** 原始上下文會在記憶體中保留 15 分鐘。單次呼叫最多可儲存 10 MiB 的內容（`max_bytes_per_call`），而整個程序最多保留 256 次呼叫與 256 MiB，並優先淘汰最舊的。太大而無法儲存的內容不會取得標記。已過期或已被淘汰的內容則會直接無法解析。

儲存區位於 worker 程序中，因此在多 worker 部署中，後續請求可能會落到與完成壓縮的 worker 不同的 worker。請搭配 `--workers 1` 執行，或設定 `enable_retrieval: false`。

## 為什麼 tokens_saved 可能是 0 {#why-tokens_saved-can-be-0}

- 預設只會壓縮 `tool`/`function` messages。沒有至少 `min_chars_to_compress` 個字元工具輸出的請求會原樣通過，不會記錄任何 guardrail 統計資料。
- 無法推導出查詢的目標會保持未壓縮。
- 與輸入相同的壓縮文字屬於無操作。
- 在 Responses API 上，只有在對應關係明確時，壓縮後內容才會鏡像回傳；歧義情況會保持不變，而不是冒著損壞 payload 的風險。
- 當 `allow_bypass_header` 啟用時，bypass 標頭會略過壓縮。

## 失敗語意 {#failure-semantics}

預設為 `fail_closed`：如果 Compresr 服務無法連線、逾時（60 秒預算），或回傳錯誤的狀態或內容，請求會以 `502` 和一般錯誤訊息失敗；上游回應內容會寫入伺服器記錄，而不會傳給用戶端。

設定 `unreachable_fallback: fail_open` 可改為將請求未壓縮地轉送出去，並在 proxy 記錄中留下警告。任何不是精確字串 `fail_open` 的值都會被視為 `fail_closed`。

## 安全性注意事項 {#security-notes}

這項整合已通過多輪稽核。以下各點都已在程式碼中強制執行，並由迴歸測試涵蓋：

- **經 SSRF 驗證的 `api_base`。** 只接受 `http`/`https` schemes，而雲端中繼資料端點（例如 `169.254.169.254`）會在初始化時被拒絕，包含其十進位、十六進位與 IPv4-mapped 編碼。
- **跨租戶隔離** 的檢索儲存區，並明確將偽造的 `user_api_key` 字串視為不受信任。
- **注入安全的透傳。** `compression_params` 會原樣轉送，但保留鍵 `context`、`query` 與 `inputs` 會被移除並記錄警告，且具名設定欄位在衝突時優先。
- **記錄注入防護。** 模型提供的雜湊在回寫至記錄之前，會移除不可列印字元並截斷。
- **錯誤遮罩。** 上游錯誤內容會保留在伺服器記錄中，而用戶端只會取得一般的 502。

## 驗證 Compresr 已執行 {#validate-compresr-ran}

1. `x-litellm-applied-guardrails: compresr-compression` 回應標頭。
2. 花費記錄列上的 `guardrail_information`：`messages_compressed`、`tokens_before`、`tokens_after`、`tokens_saved`、`compression_model`。只有在至少有一則 message 實際被壓縮時才會記錄這些項目。
3. 管理介面：在 **Logs** 中開啟任一請求，捲動到 **Guardrails & Policy Compliance**，即可在 **Request Lifecycle** 下看到 `compresr-compression` 作為一個 `pre-call` 步驟及其延遲，並在 **Evaluation Details** 下看到一筆項目。

## 預期結果 {#what-to-expect}

一般工作負載可在不損失品質的情況下壓縮 2 倍到 10 倍。稀疏內容的壓縮幅度最大，通常甚至遠超過這個範圍：逐字稿、報告、申報文件、工單討論串、記錄與搜尋結果，大多是與特定問題無關的 token。結構化資料（JSON、XML、HTML）也很容易壓縮。目前不會壓縮程式碼。

## 設定參考 {#configuration-reference}

頂層 `litellm_params`：

| 參數                  | 類型 | 說明                                                                                                                    |
| ---------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| `guardrail`            | str  | 必須為 `compresr`。                                                                                                            |
| `mode`                 | str  | 使用 `pre_call`。guardrail 只會轉換請求輸入；回應會原樣通過。                                 |
| `api_key`              | str  | Compresr API 金鑰，作為 `X-API-Key` 傳送。預設回退至 `COMPRESR_API_KEY`。必填；初始化時若缺少則失敗。                      |
| `api_base`             | str  | Compresr API base URL。預設回退至 `COMPRESR_API_BASE`，再回退至 `https://api.compresr.ai`。僅在地端部署時變更。 |
| `model`                | str  | 壓縮模型（不是 LLM）。預設為 `latte_v2`。                                                                       |
| `unreachable_fallback` | str  | `fail_closed`（預設）會在服務失敗時回傳 502；`fail_open` 會將請求未壓縮地轉送。                         |
| `default_on`           | bool | 在每個請求上執行，不需逐次呼叫啟用。預設為 `false`。                                                             |

巢狀 `optional_params`（每個值也可直接在 `litellm_params` 下接受；以巢狀值為準）：

| 參數                      | 類型  | 預設值 | 說明                                                                                                    |
| -------------------------- | ----- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `target_compression_ratio` | float | `0.5`   | 介於 0 和 1 之間：移除的 token 比例。大於 1：Nx 壓縮倍率。當 `dynamic` 啟用時會忽略。     |
| `coarse`                   | bool  | `true`  | 段落層級評分（較快）。將 `false` 設為 token 層級。                                                  |
| `min_chars_to_compress`    | int   | `500`   | 比此值更短的訊息會被略過。                                                                         |
| `compress_tool_outputs`    | bool  | `true`   | 壓縮 `tool`/`function` 結果。                                                                             |
| `compress_system`          | bool  | `false` | 壓縮系統訊息。                                                                                       |
| `compress_history`         | bool  | `false` | 壓縮最後一則之前的使用者訊息。                                                                     |
| `compress_last_user`       | bool  | `false` | 壓縮最後一則使用者訊息，並以其自身文字作為查詢。                                                |
| `enable_retrieval`         | bool  | `true`  | 儲存原始內容、附加標記、注入 `compresr_retrieve` 工具。                                           |
| `max_bytes_per_call`       | int   | `10485760` | 每次請求對已儲存原始內容的上限（10 MiB）。`0` 會停用此上限；負值會被拒絕。               |
| `allow_bypass_header`      | bool  | `false` | 遵循 `x-compresr-bypass: true`。預設為關閉，因為呼叫端會控制標頭。                                |
| `dynamic`                  | bool  | `true`  | 讓服務依每個負載決定比例（`latte_v2`）。                                                        |
| `dynamic_min_ratio`        | float | unset   | 動態模式的下限；伺服器預設為 1.5。                                                               |
| `dynamic_max_ratio`        | float | unset   | 動態模式的上限；伺服器預設為 10.0。                                                              |
| `compression_params`       | dict  | unset   | 其他欄位會原樣轉送至壓縮 API。`context`、`query`、`inputs` 為保留欄位並會被移除。  |

## 環境變數 {#environment-variables}

| 變數            | 說明                                                   |
| ------------------- | ------------------------------------------------------------- |
| `COMPRESR_API_KEY`  | 當防護欄設定中未設定 `api_key` 時的備援。  |
| `COMPRESR_API_BASE` | 當防護欄設定中未設定 `api_base` 時的備援。 |

## 關於 Compresr {#about-compresr}

Compresr 是一家由 YC 支持的公司（W26），由四位 EPFL 研究人員創立，背景來自 Microsoft、Bell Labs 和 UBS。歡迎在 [compresr.ai](https://compresr.ai)、[YC 頁面](https://www.ycombinator.com/companies/compresr) 或 [LinkedIn](https://www.linkedin.com/company/compresr) 找到我們。
