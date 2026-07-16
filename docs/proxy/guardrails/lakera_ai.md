import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Lakera AI {#lakera-ai}

**支援的端點：** Lakera v2 整合僅支援 **chat completions** 端點（`/v1/chat/completions`）。它不支援 Responses API、`/v1/messages`、MCP、A2A 或其他 proxy 端點。

## 快速開始 {#quick-start}
### 1. 在您的 LiteLLM config.yaml 中定義防護欄  {#1-define-guardrails-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的防護欄

```yaml showLineNumbers title="litellm config.yaml"
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "lakera-guard"
    litellm_params:
      guardrail: lakera_v2  # supported values: "aporia", "bedrock", "lakera"
      mode: "during_call"
      api_key: os.environ/LAKERA_API_KEY
      api_base: os.environ/LAKERA_API_BASE
  - guardrail_name: "lakera-pre-guard"
    litellm_params:
      guardrail: lakera_v2  # supported values: "aporia", "bedrock", "lakera"
      mode: "pre_call"
      api_key: os.environ/LAKERA_API_KEY
      api_base: os.environ/LAKERA_API_BASE
  - guardrail_name: "lakera-monitor"
    litellm_params:
      guardrail: lakera_v2
      mode: "pre_call"
      on_flagged: "monitor"  # Log violations but don't block
      api_key: os.environ/LAKERA_API_KEY
      api_base: os.environ/LAKERA_API_BASE
  
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 LLM 呼叫之前執行，針對 **輸入**
- `post_call` 在 LLM 呼叫之後執行，針對 **輸入與輸出**
- `during_call` 在 LLM 呼叫期間執行，針對 **輸入** 與 `pre_call` 相同，但會與 LLM 呼叫平行執行。回應會等到防護欄檢查完成後才會返回

### 2. 啟動 LiteLLM Gateway  {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求  {#3-test-request}

**[Langchain, OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="未成功的呼叫" value = "not-allowed">

預期這會失敗，因為請求中的 `ishaan@berri.ai` 是 PII

```shell showLineNumbers title="Curl Request"
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["lakera-guard"]
  }'
```

失敗時的預期回應

```shell
{
 "error": {
   "message": {
     "error": "Violated content safety policy",
     "lakera_ai_response": {
       "model": "lakera-guard-1",
       "results": [
         {
           "categories": {
             "prompt_injection": true,
             "jailbreak": false
           },
           "category_scores": {
             "prompt_injection": 0.999,
             "jailbreak": 0.0
           },
           "flagged": true,
           "payload": {}
         }
       ],
       "dev_info": {
         "git_revision": "cb163444",
         "git_timestamp": "2024-08-19T16:00:28+02:00",
         "version": "1.3.53"
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

<TabItem label="成功的呼叫 " value = "allowed">

```shell showLineNumbers title="Curl Request"
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["lakera-guard"]
  }'
```

</TabItem>

</Tabs>

## 支援的參數  {#supported-params}

```yaml
guardrails:
  - guardrail_name: "lakera-guard"
    litellm_params:
      guardrail: lakera_v2  # supported values: "aporia", "bedrock", "lakera"
      mode: "during_call"
      api_key: os.environ/LAKERA_API_KEY
      api_base: os.environ/LAKERA_API_BASE
      ### OPTIONAL ### 
      # project_id: Optional[str] = None,
      # payload: Optional[bool] = True,
      # breakdown: Optional[bool] = True,
      # metadata: Optional[Dict] = None,
      # dev_info: Optional[bool] = True,
      # on_flagged: Optional[str] = "block",  # "block" or "monitor"
```

- `api_base`: (Optional[str]) Lakera 整合的基底。預設為 `https://api.lakera.ai` 
- `api_key`: (str) Lakera 整合的 API 金鑰。
- `project_id`: (Optional[str]) 相關專案的 ID
- `payload`: (Optional[bool]) 設為 true 時，回應將返回一個 payload 物件，其中包含偵測到的任何 PII、髒話或自訂偵測器 regex 比對結果，以及它們在內容中的位置。 
- `breakdown`: (Optional[bool]) 設為 true 時，回應將返回一份 breakdown 清單，列出政策中定義的已執行偵測器，以及每個偵測器是否偵測到任何內容。
- `metadata`: (Optional[Dict]) 中繼資料標籤可作為物件附加到 screening 請求中，該物件可包含任意鍵值對。 
- `dev_info`: (Optional[bool]) 設為 true 時，回應將返回一個包含 Lakera Guard 建置版開發者資訊的物件。
- `on_flagged`: (Optional[str]) 在內容被標記時要採取的動作。預設為 `"block"`。 
  - `"block"`: 偵測到違規時引發 HTTP 400 例外（預設行為）
  - `"monitor"`: 記錄違規但允許請求繼續。適用於在不封鎖合法請求的情況下調整安全政策。
