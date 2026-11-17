---
id: gateway_overview
title: LiteLLM AI Gateway
sidebar_label: LiteLLM Gateway
slug: /simple_proxy
description: LiteLLM AI Gateway 是一台自託管伺服器，為您的應用程式提供單一與 OpenAI 相容的端點，連接 100 多個 LLM 提供者、MCP 工具與 A2A 代理程式。
---

import NavigationCards from '@site/src/components/NavigationCards';
import QuickStartBox from '@site/src/components/QuickStartBox';
import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM AI Gateway {#litellm-ai-gateway}

LiteLLM AI Gateway 是一台自託管伺服器。它為您的應用程式提供單一與 OpenAI 相容的端點，連接 100 多個 LLM 提供者、MCP 工具與 A2A 代理程式。

您的應用程式將請求傳送到閘道。閘道會將每個請求傳送到該模型的提供者。接著，閘道會以 OpenAI 格式將回應傳回您的應用程式。只要用戶端能使用 OpenAI API，就能使用這個閘道。您不需要變更用戶端程式碼。

<QuickStartBox variant="gateway" showTitle={false} heading="立即啟動閘道" source="gateway-overview">

指令完成後，在 `http://localhost:4000/ui` 開啟管理介面。每個步驟請參閱 [快速入門](/docs/proxy/docker_quick_start)。

</QuickStartBox>

## 閘道的功能 {#what-the-gateway-does}

- **存取控制。** 為每個使用者、團隊與專案提供一把虛擬金鑰。每把金鑰都有自己的模型、預算與速率限制。
- **支出追蹤。** 閘道會記錄每個請求的成本。您可以查看每把金鑰、每個團隊、每位使用者與每個標籤的支出。
- **可靠性。** 負載平衡、備援與重試會在提供者發生問題時，將流量在部署之間移動。
- **防護欄。** 對請求與回應套用內容篩選、PII 遮罩與政策。
- **記錄。** 將記錄與指標傳送到 Langfuse、Datadog、OpenTelemetry、Prometheus 與其他工具。
- **管理介面。** 在瀏覽器中新增模型、新增金鑰，並查看支出與記錄。
- **MCP 與代理程式。** 同一個閘道也提供對 [MCP 工具](/docs/mcp) 與 [A2A 代理程式](/docs/a2a) 的存取。它使用相同的金鑰與支出記錄。

## 設定閘道 {#set-up-the-gateway}

本節的頁面依照新部署的步驟安排。請依下表的步驟進行：

| 步驟 | 您要做的事 | 從這裡開始 |
|---|---|---|
| 1. 部署 | 以 Docker、Helm 或 Terraform 啟動閘道。連接一個 Postgres 資料庫。 | [快速入門](/docs/proxy/docker_quick_start)、[正式環境部署](/docs/proxy/deploy) |
| 2. 新增模型與提供者 | 新增您的使用者可以呼叫的模型。如有需要，新增 MCP 工具與代理程式。 | [模型管理](/docs/proxy/model_management)、[提供者](/docs/providers) |
| 3. 連接用戶端 | 在您的應用程式與編碼工具中設定閘道 URL 與一把虛擬金鑰。 | [用戶端設定](/docs/proxy/client_setup/overview) |
| 4. 設定驗證 | 新增虛擬金鑰。連接您的身分提供者以啟用單一登入。 | [虛擬金鑰](/docs/proxy/virtual_keys)、[管理介面 SSO](/docs/proxy/admin_ui_sso) |
| 5. 追蹤支出並設定預算 | 將成本歸屬到團隊與專案。設定預算與速率限制。 | [支出追蹤](/docs/proxy/cost_tracking)、[預算](/docs/proxy/users) |

## 呼叫閘道 {#call-the-gateway}

啟動閘道後，使用帶有閘道 URL 與虛擬金鑰的 OpenAI 用戶端：

```python
import openai

client = openai.OpenAI(api_key="sk-your-virtual-key", base_url="http://localhost:4000")

response = client.chat.completions.create(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "Write a short poem"}],
)
print(response.choices[0].message.content)
```

## 管理介面 {#admin-ui}

管理介面是閘道的一部分。使用它在瀏覽器中設定並監控閘道：

<Tabs>
<TabItem value="models" label="模型" default>

新增來自各提供者的模型。表格會顯示每個模型的輸入與輸出 token 價格。

<Image img={require('../img/ui_tour_models.png')} dark={require('../img/ui_tour_models_dark.png')} alt="模型頁面，包含來自 OpenAI、Anthropic 與 Google 的五個模型，以及每個模型的 token 價格" />

</TabItem>
<TabItem value="keys" label="虛擬金鑰">

為每個應用程式或每個人提供一把虛擬金鑰。每把金鑰都有一個團隊、一個預算與一份模型清單。

<Image img={require('../img/ui_tour_keys.png')} dark={require('../img/ui_tour_keys_dark.png')} alt="虛擬金鑰頁面，包含五把金鑰、每把金鑰的團隊，以及每把金鑰相對於其預算的支出" />

</TabItem>
<TabItem value="mcp" label="MCP 伺服器">

新增 MCP 伺服器。代理程式透過閘道使用這些伺服器的工具，並使用相同的虛擬金鑰。

<Image img={require('../img/ui_tour_mcp.png')} dark={require('../img/ui_tour_mcp_dark.png')} alt="MCP 伺服器頁面，包含兩台已連接的 MCP 伺服器及其健康狀態" />

</TabItem>
<TabItem value="guardrails" label="防護欄">

新增防護欄，在模型收到請求之前檢查請求，例如 PII 遮罩。

<Image img={require('../img/ui_tour_guardrails.png')} dark={require('../img/ui_tour_guardrails_dark.png')} alt="防護欄頁面，包含一個 PII 遮罩防護欄與一個有害內容防護欄" />

</TabItem>
<TabItem value="usage" label="使用量">

查看所有團隊、金鑰與模型的支出、請求與 token。

<Image img={require('../img/ui_tour_usage.png')} dark={require('../img/ui_tour_usage_dark.png')} alt="使用量頁面，包含總支出、請求數量、token 數量與每日支出圖表" />

</TabItem>
<TabItem value="logs" label="記錄">

找出每個請求及其成本、持續時間、團隊、金鑰與模型。

<Image img={require('../img/ui_tour_logs.png')} dark={require('../img/ui_tour_logs_dark.png')} alt="請求記錄頁面，包含請求表格、每個請求的成本，以及傳送該請求的團隊與金鑰" />

</TabItem>
</Tabs>

## 閘道或 Python SDK {#gateway-or-python-sdk}

若有多個應用程式或多人向 LLM 傳送請求，請使用閘道。若需要虛擬金鑰、支出追蹤、集中在一處的記錄或防護欄，也請使用閘道。若您只從一個 Python 應用程式傳送請求，且不需要這些控制，請使用 [Python SDK](/docs/python_sdk)。

## 後續步驟 {#next-steps}

<NavigationCards
columns={3}
items={[
{
title: "快速入門",
description: "在大約五分鐘內啟動閘道並傳送您的第一個請求。",
to: "/docs/proxy/docker_quick_start",
},
{
title: "正式環境部署",
description: "以 Helm 或 Terraform 部署，並為資料庫與 Redis 規劃規模。",
to: "/docs/proxy/deploy",
},
{
title: "用戶端設定",
description: "將 Claude Code、Codex 與其他用戶端連接到閘道。",
to: "/docs/proxy/client_setup/overview",
},
{
title: "MCP 閘道",
description: "透過單一端點讓代理程式存取 MCP 工具。",
to: "/docs/mcp",
},
{
title: "代理程式閘道",
description: "透過閘道新增並呼叫 A2A 代理程式。",
to: "/docs/a2a",
},
{
title: "企業版",
description: "SSO、稽核記錄，以及正式環境部署的支援。",
to: "/docs/enterprise",
},
]}
/>
