import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Aim Security {#aim-security}

## 快速入門 {#quick-start}
### 1. 建立新的 Aim Guard {#1-create-a-new-aim-guard}

前往 [Aim Application](https://app.aim.security/inventory/custom-ai-apps) 並建立新的 guard。

在提示時，選擇 API 選項，並為您的 guard 命名。

:::note 
如果您想在內部部署環境中託管您的 guard，可以在建立 guard 之前先 [安裝 Aim Outpost](https://app.aim.security/settings/on-prem-deployment)，即可啟用此選項。
:::

### 2. 設定您的 Aim Guard policies {#2-configure-your-aim-guard-policies}

在新建立的 guard 頁面中，您可以找到此 guard 的 prompt policy center 參考資訊。

您可以決定要啟用哪些 detections，並為每個 detection 設定 threshold。

:::info 
當使用 LiteLLM 搭配 virtual keys 時，可以在 Aim 的 guards 頁面中直接設定特定 key 的 policies，只要在建立 guard 時指定 virtual key alias 即可。

傳送給 Aim 的只會是您 virtual keys 的 aliases（而不是實際的 key secrets）。
:::

### 3. 在您的 LiteLLM config.yaml 中加入 Aim Guardrail  {#3-add-aim-guardrail-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的 guardrails
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: aim-protected-app
    litellm_params:
      guardrail: aim
      mode: [pre_call, post_call] # "During_call" is also available
      api_key: os.environ/AIM_API_KEY
      api_base: os.environ/AIM_API_BASE # Optional, use only when using a self-hosted Aim Outpost
      ssl_verify: False # Optional, set to False to disable SSL verification or a string path to a custom CA bundle
```

在 `api_key` 下，填入您獲發的 API key。該 key 可在 guard 的頁面中找到。
您也可以將 `AIM_API_KEY` 設為環境變數。

預設情況下，`api_base` 設為 `https://api.aim.security`。如果您使用的是自架的 Aim Outpost，可以將 `api_base` 設為您 Outpost 的 URL。

### 4. 啟動 LiteLLM Gateway {#4-start-litellm-gateway}
```shell
litellm --config config.yaml
```

### 5. 發出您的第一個請求 {#5-make-your-first-request}

:::note
以下範例依賴於在您的 guard 中啟用 *PII* detection。
您可以調整請求內容，以符合不同 guard 的 policies。
:::

<Tabs>
<TabItem label="成功封鎖的請求" value = "blocked">

:::note
當使用 LiteLLM 搭配 virtual keys 時，需要帶有 virtual key 的 `Authorization` header。
:::

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["aim-protected-app"]
  }'
```

如果設定正確，由於 `ishaan@berri.ai` 會被 Aim Guard 偵測為 PII，您將會收到類似下方的回應，並帶有 `400 Bad Request` 狀態碼：

```json
{
  "error": {
    "message": "\"ishaan@berri.ai\" detected as email",
    "type": "None",
    "param": "None",
    "code": "400"
  }
}
```

</TabItem>

<TabItem label="成功允許的請求" value = "allowed">

:::note
當使用 LiteLLM 搭配 virtual keys 時，需要帶有 virtual key 的 `Authorization` header。
:::

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["aim-protected-app"]
  }'
```

上述請求不應被封鎖，您應該會收到一般的 LLM 回應（為求簡潔已簡化）：

```json
{
  "model": "gpt-3.5-turbo-0125",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "I can’t provide live weather updates without the internet. Let me know if you’d like general weather trends for a location and season instead!",
        "role": "assistant"
      }
    }
  ]
}
```

</TabItem>

</Tabs>

## 進階 {#advanced}

Aim Guard 提供使用者特定的 Guardrail policies，讓您可以為個別使用者套用量身打造的 policies。
若要使用此功能，請在請求 payload 中加入終端使用者的電子郵件，方法是將請求的 `x-aim-user-email` header 設定好。

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-aim-user-email: ishaan@berri.ai" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["aim-protected-app"]
  }'
```
