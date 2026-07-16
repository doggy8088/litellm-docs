import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Cato Networks {#cato-networks}

## 快速開始 {#quick-start}
### 1. 建立新的 Cato Networks AI Security Guard {#1-create-a-new-cato-networks-ai-security-guard}

前往 [Cato Networks CMA](https://cc.catonetworks.com/) 並建立新的 AI Security guard。

為您的 guard 命名，並選取 AI Gateway 選項。

:::info
當使用 LiteLLM 搭配虛擬金鑰時，請使用虛擬金鑰別名作為 guard 的名稱，才能設定特定金鑰的政策。

只有您的虛擬金鑰別名（而非實際金鑰密鑰）會傳送給 Cato Networks。
:::

### 2. 設定您的 Cato Networks AI Security Guard 政策 {#2-configure-your-cato-networks-ai-security-guard-policies}

建立一個 Engine Profile，選擇要啟用哪些偵測。
建立一條引用此 Engine Profile 與您的 Guard 的 Guard Policy 規則，然後設定要套用的動作。

### 3. 在您的 LiteLLM config.yaml 中新增 Cato Networks Guardrail {#3-add-cato-networks-guardrail-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的 guardrails
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: cato-protected-app
    litellm_params:
      guardrail: cato_networks
      mode: [pre_call, post_call] # "During_call" is also available
      api_key: os.environ/CATO_API_KEY
      api_base: os.environ/CATO_API_BASE
      ssl_verify: False # Optional, set to False to disable SSL verification or a string path to a custom CA bundle
```

在 `api_key` 下方，填入您獲發的 API 金鑰。該金鑰可在 guard 的頁面中找到。
您也可以將 `CATO_API_KEY` 設為環境變數。

預設情況下，`api_base` 設為 `https://api.aisec.catonetworks.com`。請為您的區域設定正確的 URL。
如果您使用的是自架的 Outpost，您可以將 `api_base` 設為您的 Outpost URL。

### 4. 啟動 LiteLLM Gateway {#4-start-litellm-gateway}
```shell
litellm --config config.yaml
```

### 5. 發出您的第一個請求 {#5-make-your-first-request}

:::note
以下範例取決於在您的政策中啟用 *PII* 偵測。
您可以調整請求內容，以符合不同 guard 的政策。
:::

<Tabs>
<TabItem label="成功封鎖的請求" value = "blocked">

:::note
當使用 LiteLLM 搭配虛擬金鑰時，需要帶有虛擬金鑰的 `Authorization` 標頭。
:::

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["cato-protected-app"]
  }'
```

如果設定正確，由於 `ishaan@berri.ai` 會被 Cato Networks AI Security Guard 偵測為 PII，您將會收到類似以下內容、狀態碼為 `400 Bad Request` 的回應：

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
當使用 LiteLLM 搭配虛擬金鑰時，需要帶有虛擬金鑰的 `Authorization` 標頭。
:::

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["cato-protected-app"]
  }'
```

上述請求不應被封鎖，您應該會收到一般的 LLM 回應（為了簡潔起見已簡化）：

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
