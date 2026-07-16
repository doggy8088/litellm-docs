import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Weights & Biases 推論 {#weights--biases-inference}
https://weave-docs.wandb.ai/quickstart-inference

:::tip

LiteLLM 支援 W&B Inference 服務的所有模型。若要使用模型，請將 `model=wandb/<any-model-on-wandb-inference-dashboard>` 設為 litellm 請求的前綴。支援模型的完整清單請見 https://docs.wandb.ai/guides/inference/models/

:::

## API 金鑰 {#api-key}

您可以在 https://wandb.ai/authorize 取得 W&B Inference 的 API 金鑰

```python
import os
# env variable
os.environ['WANDB_API_KEY']
```

## 範例用法：文字生成 {#sample-usage-text-generation}
```python
from litellm import completion
import os

os.environ['WANDB_API_KEY'] = "insert-your-wandb-api-key"
response = completion(
    model="wandb/Qwen/Qwen3-235B-A22B-Instruct-2507",
    messages=[
        {
            "role": "user",
            "content": "What character was Wall-e in love with?",
        }
    ],
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    temperature=0.6,  # either set temperature or `top_p`
    top_p=0.01,  # to get as deterministic results as possible
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['WANDB_API_KEY'] = ""
response = completion(
    model="wandb/Qwen/Qwen3-235B-A22B-Instruct-2507",
    messages=[
        {
            "role": "user",
            "content": "What character was Wall-e in love with?",
        }
    ],
    stream=True,
    max_tokens=10,
    response_format={ "type": "json_object" },
    seed=123,
    temperature=0.6,  # either set temperature or `top_p`
    top_p=0.01,  # to get as deterministic results as possible
)

for chunk in response:
    print(chunk)
```

:::tip

如果模型已離線，上述範例可能無法運作。請在 https://docs.wandb.ai/guides/inference/models/. 查看可用模型的完整清單

:::

## 搭配 LiteLLM Proxy Server 使用 {#usage-with-litellm-proxy-server}

以下說明如何透過 LiteLLM Proxy Server 呼叫 W&B Inference 模型

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: wandb/<your-model-name>  # add wandb/ prefix to use W&B Inference as provider
        api_key: api-key                 # api key to send your model
  ```
2. 啟動 proxy 
  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 向 LiteLLM Proxy Server 發送請求

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="litellm-proxy-key",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="my-model",
      messages = [
          {
              "role": "user",
              "content": "What character was Wall-e in love with?"
          }
      ],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: litellm-proxy-key' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
          "role": "user",
          "content": "What character was Wall-e in love with?"
          }
      ],
  }'
  ```
  </TabItem>

  </Tabs>

## 支援的參數 {#supported-parameters}

W&B Inference 提供者支援以下參數：

### 聊天完成參數 {#chat-completion-parameters}

| 參數 | 類型 | 說明 |
| --------- | ---- | ----------- |
| frequency_penalty | number | 根據文字中出現的頻率來懲罰新 token |
| function_call | string/object | 控制模型如何呼叫函式 |
| functions | array | 模型可能會產生 JSON 輸入的函式清單 |
| logit_bias | map | 修改指定 token 的可能性 |
| max_tokens | integer | 要生成的最大 token 數 |
| n | integer | 要生成的完成數量 |
| presence_penalty | number | 根據 token 到目前為止是否出現在文字中來懲罰它們 |
| response_format | object | 回應格式，例如 `{"type": "json"}` |
| seed | integer | 用於決定性結果的取樣種子 |
| stop | string/array | API 將停止生成 token 的序列 |
| stream | boolean | 是否串流回應 |
| temperature | number | 控制隨機性（0-2） |
| top_p | number | 控制 nucleus sampling |

## 錯誤處理 {#error-handling}

此整合使用標準的 LiteLLM 錯誤處理。此外，以下是 W&B Inference API 常見錯誤清單 - 

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 401 | 驗證失敗 | 您的驗證憑證不正確，或您的 W&B 專案 entity 和/或名稱不正確。 | 請確保您使用的是正確的 API 金鑰，且您的 W&B 專案名稱與 entity 正確。 |
| 403 | 不支援的國家、地區或領土 | 從不支援的位置存取 API。 | 請參閱[地理限制](https://docs.wandb.ai/guides/inference/usage-limits/#geographic-restrictions) |
| 429 | 已達請求的並行限制 | 同時請求過多。 | 減少並行請求數量或提高限制。更多資訊請參閱[使用資訊與限制](https://docs.wandb.ai/guides/inference/usage-limits/)。 |
| 429 | 您已超出目前配額，請檢查您的方案與帳單詳細資料 | 點數不足或已達每月支出上限。 | 取得更多點數或提高限制。更多資訊請參閱[使用資訊與限制](https://docs.wandb.ai/guides/inference/usage-limits/)。 |
| 429 | W&B Inference 不適用於個人帳戶。 | 切換至非個人帳戶。  | 請依照[下方指示](#error-429-personal-entities-unsupported)進行變通處理。 |
| 500 | 伺服器在處理您的請求時發生錯誤 | 內部伺服器錯誤。 | 稍候後重試，若問題持續請聯絡支援。 |
| 503 | 引擎目前負載過高，請稍後再試 | 伺服器正面臨高流量。 | 稍後再重試您的請求。 |

### 錯誤 429：不支援個人 entity {#error-429-personal-entities-unsupported}

使用者使用的是個人帳戶，無法存取 W&B Inference。如果沒有可用的帳戶，請建立 Team 以建立非個人帳戶。 

完成後，請如下所示在您的請求中加入 `openai-project` 標頭：

```python
response = completion(
    model="...",
    extra_headers={"openai-project": "team_name/project_name"},
    ...
```

更多資訊請參閱[不支援個人 entity](https://docs.wandb.ai/guides/inference/usage-limits/#personal-entities-unsupported)。

您可在此找到更多使用 LiteLLM 自訂標頭的方法 - https://docs.litellm.ai/docs/proxy/request_headers.
