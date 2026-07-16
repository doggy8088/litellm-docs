import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI Moderation {#openai-moderation}

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 使用 OpenAI 內建的 Moderation API 偵測並封鎖有害內容，包括仇恨言論、騷擾、自殘、性內容與暴力。 |
| 提供者 | [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation) |
| Supported Actions | `BLOCK`（偵測到違規時會擲出 HTTP 400 例外） |
| 支援的模式 | `pre_call`、`during_call`、`post_call` |
| Streaming Support | ✅ 完整支援串流回應 |
| API Requirements | OpenAI API 金鑰 |

## 快速開始 {#quick-start}

### 1. 在您的 LiteLLM config.yaml 中定義防護欄 {#1-define-guardrails-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的防護欄：

<Tabs>
<TabItem value="config" label="Config.yaml">

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "openai-moderation-pre"
    litellm_params:
      guardrail: openai_moderation
      mode: "pre_call"
      api_key: os.environ/OPENAI_API_KEY  # Optional if already set globally
      model: "omni-moderation-latest"     # Optional, defaults to omni-moderation-latest
      api_base: "https://api.openai.com/v1"  # Optional, defaults to OpenAI API
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 **LLM 呼叫前** 執行，針對 **使用者輸入**
- `during_call` 在 **LLM 呼叫期間** 執行，針對 **使用者輸入**。與 `pre_call` 相同，但會與 LLM 呼叫平行執行。直到防護欄檢查完成前不會回傳回應。
- `post_call` 在 **LLM 呼叫後** 執行，針對 **LLM 回應**

#### 支援的 OpenAI Moderation 模型 {#supported-openai-moderation-models}

- `omni-moderation-latest`（預設）- 最新多模態 moderation 模型
- `text-moderation-latest` - 最新純文字 moderation 模型

</TabItem>

<TabItem value="env" label="環境變數">

設定您的 OpenAI API 金鑰：

```bash title="Setup Environment Variables"
export OPENAI_API_KEY="your-openai-api-key"
```

</TabItem>
</Tabs>

### 2. 啟動 LiteLLM 閘道 {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求 {#3-test-request}

<Tabs>
<TabItem label="被封鎖的請求" value="blocked">

由於請求包含有害內容，預期這會失敗：

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "I hate all people and want to hurt them"}
    ],
    "guardrails": ["openai-moderation-pre"]
  }'
```

失敗時的預期回應：

```json
{
  "error": {
    "message": {
      "error": "Violated OpenAI moderation policy",
      "moderation_result": {
        "violated_categories": ["hate", "violence"],
        "category_scores": {
          "hate": 0.95,
          "violence": 0.87,
          "harassment": 0.12,
          "self-harm": 0.01,
          "sexual": 0.02
        }
      }
    },
    "type": "None",
    "param": "None", 
    "code": "400"
  }
}
```

</TabItem>

<TabItem label="成功的呼叫" value="allowed">

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "guardrails": ["openai-moderation-pre"]
  }'
```

預期回應：

```json
{
  "id": "chatcmpl-4a1c1a4a-3e1d-4fa4-ae25-7ebe84c9a9a2",
  "created": 1741082354,
  "model": "gpt-4",
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "The capital of France is Paris.",
        "role": "assistant"
      }
    }
  ],
  "usage": {
    "completion_tokens": 8,
    "prompt_tokens": 13,
    "total_tokens": 21
  }
}
```

</TabItem>
</Tabs>

## 進階組態 {#advanced-configuration}

### 輸入與輸出的多重防護欄 {#multiple-guardrails-for-input-and-output}

您可以為使用者輸入與 LLM 回應分別設定防護欄：

```yaml showLineNumbers title="Multiple Guardrails Config"
guardrails:
  - guardrail_name: "openai-moderation-input" 
    litellm_params:
      guardrail: openai_moderation
      mode: "pre_call"
      api_key: os.environ/OPENAI_API_KEY
      
  - guardrail_name: "openai-moderation-output"
    litellm_params:
      guardrail: openai_moderation
      mode: "post_call" 
      api_key: os.environ/OPENAI_API_KEY
```

### 自訂 API 組態 {#custom-api-configuration}

設定自訂 OpenAI API 端點或不同模型：

```yaml showLineNumbers title="Custom API Config"
guardrails:
  - guardrail_name: "openai-moderation-custom"
    litellm_params:
      guardrail: openai_moderation
      mode: "pre_call"
      api_key: os.environ/OPENAI_API_KEY
      api_base: "https://your-custom-openai-endpoint.com/v1"
      model: "text-moderation-latest"
```

## 串流支援 {#streaming-support}

OpenAI Moderation 防護欄完整支援串流回應。當以 `post_call` 模式使用時，將會：

1. 收集所有串流區塊
2. 組裝完整回應
3. 對完整內容套用 moderation
4. 若偵測到違規，封鎖整個串流
5. 若內容安全，回傳原始串流

```yaml showLineNumbers title="Streaming Config"
guardrails:
  - guardrail_name: "openai-moderation-streaming"
    litellm_params:
      guardrail: openai_moderation
      mode: "post_call"  # Works with streaming responses
      api_key: os.environ/OPENAI_API_KEY
```

## 內容類別 {#content-categories}

OpenAI Moderation API 會偵測以下有害內容類別：

| Category | 說明 |
|----------|-------------|
| `hate` | 表達、煽動或宣揚基於種族、性別、族裔、宗教、國籍、性傾向、身心障礙狀態或種姓的仇恨內容 |
| `harassment` | 騷擾、霸凌或恐嚇個人的內容 |
| `self-harm` | 宣揚、鼓勵或描繪自殘行為的內容 |
| `sexual` | 意圖引發性興奮或推廣性服務的內容 |
| `violence` | 描繪死亡、暴力或身體傷害的內容 |

每個類別都會以布林旗標與信心分數（0.0 到 1.0）進行評估。

## 錯誤處理 {#error-handling}

當內容違反 OpenAI 的 moderation 政策時：

- **HTTP 狀態**：400 Bad Request
- **錯誤類型**：`HTTPException`
- **錯誤詳情**：包含違規類別與信心分數
- **行為**：請求會立即被封鎖

## 最佳實務 {#best-practices}

### 1. 對使用者輸入使用前置呼叫 {#1-use-pre-call-for-user-input}

```yaml
guardrails:
  - guardrail_name: "input-moderation"
    litellm_params:
      guardrail: openai_moderation
      mode: "pre_call"  # Block harmful user inputs early
```

### 2. 對 LLM 回應使用後置呼叫 {#2-use-post-call-for-llm-responses}

```yaml
guardrails:
  - guardrail_name: "output-moderation"
    litellm_params:
      guardrail: openai_moderation  
      mode: "post_call"  # Ensure LLM responses are safe
```

### 3. 與其他防護欄結合 {#3-combine-with-other-guardrails}

```yaml
guardrails:
  - guardrail_name: "openai-moderation"
    litellm_params:
      guardrail: openai_moderation
      mode: "pre_call"
      
  - guardrail_name: "custom-pii-detection"
    litellm_params:
      guardrail: presidio
      mode: "pre_call"
```

## 疑難排解 {#troubleshooting}

### 常見問題 {#common-issues}

1. **無效的 API 金鑰**：請確認您的 OpenAI API 金鑰已正確設定
   ```bash
   export OPENAI_API_KEY="sk-your-actual-key"
   ```

2. **速率限制**：OpenAI Moderation API 有速率限制。在高流量情境下請監控用量。

3. **網路問題**：請驗證與 OpenAI API 端點的連線。

### 除錯模式 {#debug-mode}

啟用詳細記錄以疑難排解問題：

```shell
litellm --config config.yaml --detailed_debug
```

請尋找以 `OpenAI Moderation:` 開頭的記錄，以追蹤防護欄執行流程。

## API 成本 {#api-costs}

OpenAI Moderation API 對於內容政策合規而言是**免費使用**。與其他商業 moderation 服務相比，這使它成為具成本效益的防護欄選項。

## 需要協助嗎？ {#need-help}

如需額外支援：
- 查看 [OpenAI Moderation API 文件](https://platform.openai.com/docs/guides/moderation)
- 閱讀 [LiteLLM 防護欄文件](./quick_start)
- 加入我們的 [Discord 社群](https://discord.gg/wuPM9dRgDw)
