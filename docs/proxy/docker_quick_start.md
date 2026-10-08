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

LiteLLM 以可立即執行的閘道形式提供。您只需用一個指令（或一次點擊）啟動它，接著就在瀏覽器中完成其他所有工作：連接提供者、新增模型、建立金鑰，以及從內建的 Admin UI 傳送測試請求。本指南不需要任何設定檔。

<QuickStartBox variant="gateway" showTitle={false} heading="Up and running in a minute" source="docker-quickstart">

當指令完成後，開啟 Admin UI。接著您可以[新增模型](#3-add-your-first-model)、[建立虛擬金鑰](#5-create-a-virtual-key)，以及[從您的應用程式呼叫閘道](#6-call-the-gateway-from-your-app)。

</QuickStartBox>

如需詳細的安裝步驟，請依照本指南後續內容操作。到最後，您將會讓 LiteLLM 在 `http://localhost:4000` 上執行，連接一個模型、發出一個虛擬金鑰，並透過閘道處理一筆請求。

## 1. 啟動 LiteLLM {#1-start-litellm}

```bash
curl -sSLO https://github.com/BerriAI/litellm/raw/main/docker/docker-compose.quickstart.yml
printf 'LITELLM_MASTER_KEY=sk-%s\nLITELLM_SALT_KEY=sk-%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > .env
docker compose -f docker-compose.quickstart.yml up -d
```

這會啟動埠號 4000 上的閘道，以及一個儲存您的模型、金鑰和支出記錄的 Postgres 資料庫。[compose 檔案](https://github.com/BerriAI/litellm/blob/main/docker/docker-compose.quickstart.yml)只定義了這兩個服務，且現在位於您的工作目錄中，因此您可以在啟動前閱讀它，並在之後編輯它以鎖定特定的發行標記。

第二個指令會產生您的主金鑰，這是您在下方每個請求都會使用的憑證。若沒有它，proxy 無法啟動。請保管好 `.env` 檔案：重新產生 `LITELLM_SALT_KEY` 會讓資料庫中已儲存的憑證無法讀取。

<OneClickDeploy source="docker-quickstart" />

:::warning[兩個金鑰的用途]
在本機執行時，上面的指令會將兩者都產生到 `.env`，而 compose 檔案若沒有它們則無法啟動。在一鍵部署中，請將它們設定在提供者的環境中。

`LITELLM_MASTER_KEY` 是閘道的根憑證：它可授權每一個管理 API 呼叫，且預設也會同時作為 Admin UI 密碼。持有它的人擁有完整管理權限，因此請像保管 root 密碼一樣保管它，避免放入原始碼控制，並在它外洩時輪替。產生值中的 `sk-` 前綴是一種慣例，並非必要

`LITELLM_SALT_KEY` 會加密您在 UI 中新增的提供者 API 金鑰。它無法就地輪替，因此請保留產生出的值：若之後變更它，所有已儲存的憑證都會變得無法讀取，直到您重新輸入為止。請參閱 [金鑰輪替](./master_key_rotations) 以了解這兩個金鑰之間的關係。
:::

## 2. 登入 Admin UI {#2-log-in-to-the-admin-ui}

開啟 [http://localhost:4000/ui](http://localhost:4000/ui)。使用者名稱是 `admin`，密碼是您的 `LITELLM_MASTER_KEY` 值，也就是您剛剛產生的 `.env` 檔案中的那個值。

<Image img={require('../../img/ui_quickstart_login.png')} dark={require('../../img/ui_quickstart_login_dark.png')} alt="LiteLLM Admin UI login page" />

## 3. 新增您的第一個模型 {#3-add-your-first-model}

前往 **Models + Endpoints**，開啟 **Add Model** 分頁，選擇您的提供者和您要公開的模型，然後貼上您的提供者 API 金鑰。LiteLLM 會隨附每個提供者的模型目錄，因此您是選擇模型，而不是手動輸入。

<Image img={require('../../img/ui_quickstart_add_model.png')} dark={require('../../img/ui_quickstart_add_model_dark.png')} alt="Add Model form with OpenAI provider and gpt-5.5 selected" />

按一下 **Test Connect** 以驗證該金鑰對提供者是否有效，然後按 **Add Model**。它會出現在 **Deployed Models** 下方，並且已經映射好定價：

<Image img={require('../../img/ui_quickstart_models_list.png')} dark={require('../../img/ui_quickstart_models_list_dark.png')} alt="Deployed Models list showing the newly added model with cost data" />

:::tip[將提供者金鑰保留在 UI 之外]
如果您偏好將提供者金鑰作為環境變數管理，請下載 compose 檔案，將它們加入 `litellm` 服務（例如 `OPENAI_API_KEY: ${OPENAI_API_KEY}`），並在 API key 欄位中輸入 `os.environ/OPENAI_API_KEY`，而不是直接輸入原始金鑰。
:::

## 4. 傳送測試訊息 {#4-send-a-test-message}

前往 **Playground**，選擇您的模型，然後傳送一則訊息。請求會經由閘道送到您的提供者，而回應會連同延遲時間與 token 數量一起返回：

<Image img={require('../../img/ui_quickstart_playground.png')} dark={require('../../img/ui_quickstart_playground_dark.png')} alt="Playground showing a live response from the model with latency and token metrics" />

您的閘道已端到端正常運作。Playground 中的 **Get Code** 按鈕會為您的語言產生對應的 API 呼叫。

## 5. 建立虛擬金鑰 {#5-create-a-virtual-key}

虛擬金鑰是您提供給應用程式與同事使用的，而不是原始提供者金鑰。每個金鑰都可以有自己的預算、速率限制與模型存取權，且所有支出都會自動追蹤。

前往 **Virtual Keys**，按一下 **+ Create New Key**，為它命名，然後按 **Create Key**：

<Image img={require('../../img/ui_quickstart_create_key.png')} dark={require('../../img/ui_quickstart_create_key_dark.png')} alt="Save your Key modal showing the newly created virtual key" />

現在請複製這個金鑰；它只會顯示一次。

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

如果您只需要 OpenAI 相容 API（不需要 Admin UI 的模型管理、虛擬金鑰或支出追蹤），您可以改用設定檔執行純 `litellm` 映像：

```yaml
# litellm_config.yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
```

```bash
docker run \
  -v $(pwd)/litellm_config.yaml:/app/config.yaml \
  -e OPENAI_API_KEY=<your-openai-key> \
  -e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm:latest \
  --config /app/config.yaml
```

請求使用主金鑰驗證。請參閱[完整設定參考](./configs.md)，了解該檔案支援的所有內容。

:::warning[未連接資料庫時不會強制執行預算]

`litellm_settings.max_budget` 在這條路徑中不是支出上限。載入 proxy 的全域支出需要資料庫用戶端，因此沒有資料庫時，執行中的總額會保持未知，而全域預算檢查也永遠不會觸發；若 proxy 設定了 `max_budget: 100`，它會在超過 100 美元後仍持續處理請求，不會有逐請求錯誤，也不會有預算警示。當設定了預算但未連接資料庫時，proxy 會在啟動時記錄一次警告，而那一行啟動訊息就是您唯一會得到的訊號

在這裡，金鑰與團隊預算也不是替代方案，因為虛擬金鑰本身就需要資料庫（攜帶虛擬金鑰的請求會以 `No connected db.` 失敗），因此主金鑰是唯一的憑證，而且它本身沒有預算

如果預算是您界定支出的方式之一，請如本頁上方所示，搭配資料庫執行 LiteLLM。若沒有資料庫，請在上游改以您提供者自身的支出上限來限制支出

:::

## 後續步驟 {#next-steps}

要進入正式環境：[Production Deployment guide](./deploy.md) 涵蓋了 AWS、GCP 和 Azure 上的 Helm、Terraform 與 Kubernetes，而[production checklist](./prod.md) 涵蓋了加固與調校。完整的容器與資料庫選項，包括 Redis 和 Prometheus，都收錄在 repo 的 [docker-compose.yml](https://github.com/BerriAI/litellm/blob/main/docker-compose.yml) 中。
