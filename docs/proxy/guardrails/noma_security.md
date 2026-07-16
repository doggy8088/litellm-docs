import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Noma Security {#noma-security}

使用 [Noma Security](https://noma.security/) 透過完整的 AI 內容審核與安全防護欄來保護您的 LLM 應用程式。

:::warning 已棄用：`guardrail: noma`（舊版）
`guardrail: noma` 已棄用，使用者應遷移至 `guardrail: noma_v2`。
舊版 `guardrail: noma` API 將於 2026 年 3 月 31 日後不再支援。

為了更容易遷移既有整合，請保留 `guardrail: noma` 並設定 `use_v2: true`。
使用 `use_v2: true` 時，請求會路由到 `noma_v2`；`monitor_mode` 和 `block_failures` 仍會套用，而 `anonymize_input` 會被忽略。
:::

## Noma v2 防護欄（建議） {#noma-v2-guardrails-recommended}

### 快速開始 {#quick-start}

```yaml showLineNumbers title="litellm config.yaml"
guardrails:
  - guardrail_name: "noma-v2-guard"
    litellm_params:
      guardrail: noma_v2
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      api_base: os.environ/NOMA_API_BASE
```

如果您想在尚未變更防護欄名稱的情況下逐步遷移：

```yaml showLineNumbers title="litellm config.yaml"
guardrails:
  - guardrail_name: "noma-guard"
    litellm_params:
      guardrail: noma
      use_v2: true
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      api_base: os.environ/NOMA_API_BASE
```

### 支援的參數 {#supported-params}

- **`guardrail`**：使用 `noma_v2`（建議），或搭配 `use_v2: true` 使用 `noma` 以便遷移
- **`mode`**：`pre_call`、`post_call`、`during_call`、`pre_mcp_call`、`during_mcp_call`
- **`api_key`**：Noma API 金鑰（Noma SaaS 必填，自行管理部署為選用）
- **`api_base`**：Noma API base URL（預設為 `https://api.noma.security/`）
- **`application_id`**：應用程式識別碼。若未提供，v2 會先檢查動態 `extra_body.application_id`，再檢查已設定/環境變數 `application_id`；否則會省略。
- **`monitor_mode`**：若為 `true`，則以僅監控模式執行，不會阻擋（預設為 `false`）
- **`block_failures`**：若為 `true`，則在防護欄技術性失敗時採 fail-closed（預設為 `true`）
- **`use_v2`**：使用 `guardrail: noma` 時的遷移切換

### 環境變數 {#environment-variables}

```shell
export NOMA_API_KEY="your-api-key-here"
export NOMA_API_BASE="https://api.noma.security/"       # Optional
export NOMA_APPLICATION_ID="my-app"                     # Optional
export NOMA_MONITOR_MODE="false"                        # Optional
export NOMA_BLOCK_FAILURES="true"                       # Optional
```

### 多個防護欄 {#multiple-guardrails}

為輸入與輸出套用不同的 v2 設定：

```yaml showLineNumbers title="litellm config.yaml"
guardrails:
  - guardrail_name: "noma-v2-input"
    litellm_params:
      guardrail: noma_v2
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY

  - guardrail_name: "noma-v2-output"
    litellm_params:
      guardrail: noma_v2
      mode: "post_call"
      api_key: os.environ/NOMA_API_KEY
```

### 傳遞額外參數 {#pass-additional-parameters}

v2 可透過 `extra_body` 支援此功能。  
目前，`noma_v2` 會消耗動態 `application_id`。

```shell showLineNumbers title="Curl Request"
curl 'http://0.0.0.0:4000/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    "guardrails": {
      "noma-v2-guard": {
        "extra_body": {
          "application_id": "my-specific-app-id"
        }
      }
    }
  }'
```
## Noma 防護欄（舊版） {#noma-guardrails-legacy}

## 快速開始 {#quick-start-1}

### 1. 在您的 LiteLLM config.yaml 中定義防護欄 {#1-define-guardrails-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的防護欄：

```yaml showLineNumbers title="litellm config.yaml"
model_list:
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "noma-guard"
    litellm_params:
      guardrail: noma
      mode: "during_call"
      api_key: os.environ/NOMA_API_KEY
      api_base: os.environ/NOMA_API_BASE
  - guardrail_name: "noma-pre-guard"
    litellm_params:
      guardrail: noma
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      api_base: os.environ/NOMA_API_BASE
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 **LLM 呼叫前** 執行，針對 **輸入**
- `post_call` 在 **LLM 呼叫後** 執行，針對 **輸入與輸出**
- `during_call` 在 **LLM 呼叫期間** 執行，針對 **輸入**。與 `pre_call` 相同，但會與 LLM 呼叫平行執行。要等防護欄檢查完成後才會回傳回應
- `pre_mcp_call`：在執行前掃描 MCP 工具呼叫輸入
- `during_mcp_call`：即時監控 MCP 工具呼叫

### 2. 啟動 LiteLLM Gateway {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求 {#3-test-request}

<Tabs>
<TabItem label="失敗的呼叫" value="not-allowed">

由於請求包含有害內容，預期會失敗：

```shell showLineNumbers title="Curl Request"
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Tell me how to hack into someone's email account"}
    ]
  }'
```

失敗時的預期回應：

```json
{
  "error": {
    "message": "{\n      \"error\": \"Request blocked by Noma guardrail\",\n      \"details\": {\n        \"prompt\": {\n          \"harmfulContent\": {\n            \"result\": true,\n            \"confidence\": 0.95\n          }\n        }\n      }\n    }",
    "type": "None",
    "param": "None",
    "code": "400"
  }
}
```

</TabItem>

<TabItem label="成功的呼叫" value="allowed">

```shell showLineNumbers title="Curl Request"
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

預期回應：

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-params-1}

```yaml
guardrails:
  - guardrail_name: "noma-guard"
    litellm_params:
      guardrail: noma
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      api_base: os.environ/NOMA_API_BASE
      ### OPTIONAL ###
      # application_id: "my-app"
      # monitor_mode: false
      # block_failures: true
      # anonymize_input: false
```

### 必要參數 {#required-parameters}

- **`api_key`**：您的 Noma Security API 金鑰（在 YAML 設定中設為 `os.environ/NOMA_API_KEY`）

### 選用參數 {#optional-parameters}

- **`api_base`**：Noma API base URL（預設為 `https://api.noma.security/`）
- **`application_id`**：您的應用程式識別碼（預設為 `"litellm"`）
- **`monitor_mode`**：若為 `true`，則記錄違規但不阻擋（預設為 `false`）
- **`block_failures`**：若為 `true`，則在防護欄 API 發生失敗時阻擋請求（預設為 `true`）
- **`anonymize_input`**：若為 `true`，則以匿名化版本取代敏感內容（預設為 `false`）

## 環境變數 {#environment-variables-1}

您可以設定這些環境變數，而不是在設定中硬式寫入值：

```shell
export NOMA_API_KEY="your-api-key-here"
export NOMA_API_BASE="https://api.noma.security/"   # Optional
export NOMA_APPLICATION_ID="my-app"                 # Optional
export NOMA_MONITOR_MODE="false"                    # Optional
export NOMA_BLOCK_FAILURES="true"                   # Optional
export NOMA_ANONYMIZE_INPUT="false"                 # Optional
```

## 進階設定 {#advanced-configuration}

### 監控模式 {#monitor-mode}

使用監控模式來測試您的防護欄，而不阻擋請求：

```yaml
guardrails:
  - guardrail_name: "noma-monitor"
    litellm_params:
      guardrail: noma
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      monitor_mode: true  # Log violations but don't block
```

### 處理 API 失敗 {#handling-api-failures}

控制 Noma API 無法使用時的行為：

```yaml
guardrails:
  - guardrail_name: "noma-failopen"
    litellm_params:
      guardrail: noma
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      block_failures: false  # Allow requests to proceed if guardrail API fails
```

### 內容匿名化 {#content-anonymization}

啟用匿名化，以取代敏感內容而不是阻擋：

```yaml
guardrails:
  - guardrail_name: "noma-anonymize"
    litellm_params:
      guardrail: noma
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      anonymize_input: true  # Replace sensitive data with anonymized version
```

### 多個防護欄 {#multiple-guardrails-1}

為輸入與輸出套用不同的設定：

```yaml
guardrails:
  - guardrail_name: "noma-strict-input"
    litellm_params:
      guardrail: noma
      mode: "pre_call"
      api_key: os.environ/NOMA_API_KEY
      block_failures: true

  - guardrail_name: "noma-monitor-output"
    litellm_params:
      guardrail: noma
      mode: "post_call"
      api_key: os.environ/NOMA_API_KEY
      monitor_mode: true
```

## ✨ 傳遞額外參數 {#-pass-additional-parameters}

使用 `extra_body` 將額外參數傳遞給 Noma Security API 呼叫，例如為特定請求動態設定應用程式 ID。

<Tabs>
<TabItem value="openai" label="OpenAI Python">

```python
import openai
client = openai.OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    extra_body={
        "guardrails": {
            "noma-guard": {
                "extra_body": {
                    "application_id": "my-specific-app-id"
                }
            }
        }
    }
)
```
</TabItem>

<TabItem value="curl" label="Curl">

```shell
curl 'http://0.0.0.0:4000/v1/chat/completions' \
    -H 'Content-Type: application/json' \
    -d '{
    "model": "gpt-4o-mini",
    "messages": [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ],
    "guardrails": {
        "noma-guard": {
            "extra_body": {
                "application_id": "my-specific-app-id"
            }
        }
    }
}'
```
</TabItem>
</Tabs>

這可讓您覆寫特定請求的預設 `application_id` 參數，這對於追蹤不同應用程式或元件的使用情況很有用。

## 回應詳細資訊 {#response-details}

當內容被阻擋時，Noma 會在 `message` 欄位中提供 JSON 格式的違規詳細資訊，結構如下：

```json
{
  "error": "Request blocked by Noma guardrail",
  "details": {
    "prompt": {
      "harmfulContent": {
        "result": true,
        "confidence": 0.95
      },
      "sensitiveData": {
        "email": {
          "result": true,
          "entities": ["user@example.com"]
        }
      },
      "bannedTopics": {
        "violence": {
          "result": true,
          "confidence": 0.88
        }
      }
    }
  }
}
```
