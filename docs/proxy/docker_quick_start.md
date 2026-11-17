---
title: 快速入門
description: 使用一個指令或一次點擊啟動 LiteLLM，並在大約五分鐘內從零開始建立您的第一個閘道請求；啟動後的所有操作都使用 Admin UI。
---

import Image from '@theme/IdealImage';
import ThemedVideo from '@site/src/components/ThemedVideo';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import QuickStartBox from '@site/src/components/QuickStartBox';
import {OneClickDeploy} from '@site/src/components/Conversion';

# 快速入門 {#quickstart}

在本機執行 LiteLLM 與 PostgreSQL，然後使用 Admin UI 新增模型、建立金鑰，並傳送您的第一個請求。

<QuickStartBox variant="gateway" showTitle={false} heading="Up and running in a minute" source="docker-quickstart">

當指令完成後，開啟 Admin UI。接著您可以[新增模型](#3-add-your-first-model)、[建立虛擬金鑰](#5-create-a-virtual-key)，以及[從您的應用程式呼叫閘道](#6-call-the-gateway-from-your-app)。

</QuickStartBox>

## 1. 啟動 LiteLLM {#1-start-litellm}

```bash
curl -sSLO https://github.com/BerriAI/litellm/raw/main/litellm/deploy/docker/docker-compose.quickstart.yml
printf 'LITELLM_MASTER_KEY=sk-%s\nLITELLM_SALT_KEY=sk-%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > .env
docker compose -f docker-compose.quickstart.yml up -d
```

[compose 檔案](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/docker/docker-compose.quickstart.yml)會在埠號 4000 上啟動完整的 LiteLLM proxy 與 PostgreSQL。在正式環境使用前，請鎖定經過測試的發行標記或 digest。

若使用 Kubernetes，請參閱 [Helm 指南](./deploy/helm.md)。

<OneClickDeploy source="docker-quickstart" />

:::warning[兩個金鑰的用途]
本機設定會將兩個金鑰都產生到 `.env`。Compose 檔案需要這兩個金鑰。在一鍵部署中，請將它們設定在提供者的環境中。

`LITELLM_MASTER_KEY` 可授權每一個管理 API 呼叫，並作為預設的 Admin UI 密碼。產生值中的 `sk-` 前綴是選用的。

`LITELLM_SALT_KEY` 會加密您在 UI 中新增的提供者 API 金鑰。它無法就地輪替，因此請保留產生出的值：若之後變更它，所有已儲存的憑證都會變得無法讀取，直到您重新輸入為止。請參閱 [金鑰輪替](./master_key_rotations) 以了解這兩個金鑰之間的關係。
:::

## 2. 登入 Admin UI {#2-log-in-to-the-admin-ui}

開啟 [http://localhost:4000/ui](http://localhost:4000/ui)。使用者名稱是 `admin`，密碼是 `.env` 中的 `LITELLM_MASTER_KEY` 值。

<Image img={require('../../img/ui_quickstart_login.png')} dark={require('../../img/ui_quickstart_login_dark.png')} alt="LiteLLM Admin UI login page" />

## 3. 新增您的第一個模型 {#3-add-your-first-model}

前往 **Models + Endpoints**，開啟 **Add Model** 分頁，選擇您的提供者與模型，然後貼上您的提供者 API 金鑰。

<Image img={require('../../img/ui_quickstart_add_model.png')} dark={require('../../img/ui_quickstart_add_model_dark.png')} alt="Add Model form with OpenAI provider and gpt-5.5 selected" />

按一下 **Test Connect** 以驗證該金鑰對提供者是否有效，然後按 **Add Model**。它會出現在 **Deployed Models** 下方，並且已經映射好定價：

<Image img={require('../../img/ui_quickstart_models_list.png')} dark={require('../../img/ui_quickstart_models_list_dark.png')} alt="Deployed Models list showing the newly added model with cost data" />

:::tip[將提供者金鑰保留在 UI 之外]
如果您偏好將提供者金鑰作為環境變數管理，請下載 compose 檔案，將它們加入 `litellm` 服務（例如 `OPENAI_API_KEY: ${OPENAI_API_KEY}`），並在 API key 欄位中輸入 `os.environ/OPENAI_API_KEY`，而不是直接輸入原始金鑰。
:::

## 4. 傳送測試訊息 {#4-send-a-test-message}

前往 **Playground**，選擇您的模型，然後傳送一則訊息。回應包含延遲時間與 token 數量：

<Image img={require('../../img/ui_quickstart_playground.png')} dark={require('../../img/ui_quickstart_playground_dark.png')} alt="Playground showing a live response from the model with latency and token metrics" />

**Get Code** 按鈕會為您的語言產生對應的 API 呼叫。

## 5. 建立虛擬金鑰 {#5-create-a-virtual-key}

虛擬金鑰是您提供給應用程式與同事使用的，而不是原始提供者金鑰。每個金鑰都可以有自己的預算、速率限制與模型存取權，且所有支出都會自動追蹤。

前往 **Virtual Keys**，按一下 **+ Create New Key**，為它命名，然後按 **Create Key**：

<Image img={require('../../img/ui_quickstart_create_key.png')} dark={require('../../img/ui_quickstart_create_key_dark.png')} alt="Save your Key modal showing the newly created virtual key" />

現在請複製這個金鑰。它只會顯示一次。

## 6. 從您的應用程式呼叫閘道 {#6-call-the-gateway-from-your-app}

此閘道與 OpenAI 相容，因此任何 OpenAI SDK 都可以透過將其指向 `http://localhost:4000` 並使用您的虛擬金鑰來運作。

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl http://localhost:4000/v1/chat/completions \
  -H 'Authorization: Bearer sk-<your-virtual-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Say hello in five words."}]
  }'
```

預期回應：

```json
{
  "id": "chatcmpl-DzGKiNRbQ4fe9Mgt8HSHFQ6ApfRJi",
  "model": "{{openai_large}}",
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "Hello, nice to meet you.",
        "role": "assistant"
      }
    }
  ],
  "usage": {
    "completion_tokens": 70,
    "prompt_tokens": 12,
    "total_tokens": 82
  }
}
```

</TabItem>
<TabItem value="python" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-<your-virtual-key>",
)

response = client.chat.completions.create(
    model="{{openai_large}}",
    messages=[{"role": "user", "content": "Say hello in five words."}],
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="js" label="OpenAI JS SDK">

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:4000",
  apiKey: "sk-<your-virtual-key>",
});

const response = await client.chat.completions.create({
  model: "{{openai_large}}",
  messages: [{ role: "user", content: "Say hello in five words." }],
});
console.log(response.choices[0].message.content);
```

</TabItem>
</Tabs>

## 整個流程，端到端 {#the-whole-flow-end-to-end}

<ThemedVideo
  src={require('../../img/ui_quickstart_flow.mp4')}
  dark={require('../../img/ui_quickstart_flow_dark.mp4')}
  poster={require('../../img/ui_quickstart_flow_poster.png')}
  darkPoster={require('../../img/ui_quickstart_flow_poster_dark.png')}
  title="Walkthrough: add a model, test it in the Playground, create a virtual key"
/>

## 無資料庫執行 {#running-without-a-database}

若需要 API 存取，但不需要資料庫支援的模型管理、虛擬金鑰或支出追蹤，請使用設定檔執行同一個映像：

```yaml
# litellm_config.yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
```

```bash
export OPENAI_API_KEY="<your-openai-key>"
export LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"

docker run \
  -v "$PWD/litellm_config.yaml:/app/config.yaml:ro" \
  -e OPENAI_API_KEY \
  -e LITELLM_MASTER_KEY \
  -p 127.0.0.1:4000:4000 \
  docker.litellm.ai/berriai/litellm:latest \
  --config /app/config.yaml
```

請求使用主金鑰驗證。請參閱[完整設定參考](./configs.md)，了解該檔案支援的所有內容。

:::warning[未連接資料庫時不會強制執行預算]

`litellm_settings.max_budget` 需要資料庫才能載入支出並強制執行全域預算。沒有資料庫時，`max_budget: 100` 會在超過 100 美元後仍持續處理請求，不會有請求錯誤，也不會有預算警示。Proxy 會在啟動時記錄一次警告。

虛擬金鑰同樣需要資料庫。攜帶虛擬金鑰的請求會以 `No connected db.` 失敗。主金鑰本身沒有預算。

若要強制執行 LiteLLM 預算，請搭配資料庫執行。否則，請在您的提供者端設定支出上限。

:::

## 後續步驟 {#next-steps}

使用[部署指南](./deploy.md)了解 Helm 與 Terraform，並以 [production checklist](./prod.md) 進行加固與調校。Repository 的 [docker-compose.yml](https://github.com/BerriAI/litellm/blob/main/litellm/deploy/compose/docker-compose.yml) 包含資料庫、Redis 與 Prometheus 選項。
