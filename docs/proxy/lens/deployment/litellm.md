---
title: "將 Lens 新增至 LiteLLM"
description: "將執行中的 Lens 服務連接到您的閘道，並從 LiteLLM 側邊欄開啟它。"
slug: "/proxy/lens/deployment/litellm"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 將 Lens 新增至 LiteLLM {#add-lens-to-litellm}

將 Lens 服務連接到您的閘道，讓使用者可以在 LiteLLM 側邊欄中開啟 **Lens**。他們使用現有的 LiteLLM 工作階段。獨立 Lens URL 仍然可用。

本指南也會連接 **現有的 Lens 部署**，包含託管在 Render 上的部署。保留其資料、ClickHouse 設定、管理員 token 和追蹤金鑰。

您需要存取這兩個服務的環境設定。只連接屬於同一個受信任工作區的閘道：其管理員在 Lens 中具有管理員存取權。

:::info Gateway version
這些步驟需要獨立的 Lens 配接器和 UI，它們已在 [PR #45529](https://github.com/BerriAI/litellm/pull/45529) 中合併到 LiteLLM。已發佈的 `v1.106.0-dev.3` 版本早於該變更。請使用包含它的閘道建置。在該建置部署之前，您可以透過其獨立 URL 使用 Lens。請參閱 [版本與映像](./releases.md)。
:::

## 1. 取得 Lens 位址 {#1-get-the-lens-address}

如果 Lens 已在執行，請使用其現有的 URL 並繼續步驟 2。例如，Render 服務使用其公開的 HTTPS URL。使用應用程式 URL，而不是 Render 儀表板 URL。

如果您尚未安裝 Lens，請先完成 [獨立快速入門](./local.md)、[伺服器設定](./server.md) 或 [Helm 設定](./kubernetes.md#new-deployment)。然後回到這裡。

檢查 Lens 是否就緒。將範例 URL 替換為您的 URL：

```sh
curl --fail https://lens.example.com/health/ready
```

預期為 HTTP 200。閘道也必須能夠連線到此服務。閘道容器無法使用 `localhost` 連線到另一個容器或另一台主機上的 Lens。

## 2. 建立兩個連線密鑰 {#2-create-the-two-connection-secrets}

如果 Lens 已連接到閘道，請重複使用其現有的 `LITELLM_LENS_SERVICE_TOKEN` 和 `LENS_GATEWAY_SECRET`。不要在新增此連線時輪替它們。

對於新連線，在私密的終端機中產生兩個不同的密鑰：

```sh
openssl rand -hex 32
openssl rand -hex 32
```

將第一個儲存為 `LITELLM_LENS_SERVICE_TOKEN`，第二個儲存為 `LENS_GATEWAY_SECRET`，存放在您的密鑰管理工具中。您會為這兩個服務提供同一組值。

| 值 | 用途 |
| --- | --- |
| `LITELLM_LENS_SERVICE_TOKEN` | 驗證從 LiteLLM 到 Lens 的內部請求 |
| `LENS_GATEWAY_SECRET` | 讓 Lens 驗證 LiteLLM 傳送的使用者身分 |

這些與 Lens 管理員 token、代理程式追蹤金鑰和 LiteLLM 模型金鑰是分開的。不要將它們的值放入 Git、瀏覽器程式碼或共用的記錄中。

## 3. 將密鑰新增至 Lens {#3-add-the-secrets-to-lens}

將這些環境變數新增至 **現有的 Lens 服務**：

```dotenv
LITELLM_LENS_SERVICE_TOKEN=YOUR_SERVICE_SECRET
LENS_GATEWAY_SECRET=YOUR_SIGNING_SECRET
```

將每個預留位置替換為步驟 2 中的值。讓其他 Lens 設定保持不變。

<Tabs groupId="lens-host">
<TabItem value="render" label="Render">

在 Render 儀表板中開啟您的 Lens 服務。選取 **Environment**，新增這兩個變數，然後儲存並重新部署該服務。等待部署變成 **Live**。

</TabItem>
<TabItem value="compose" label="Docker Compose">

將這兩個變數新增至您 Lens 檢出中的 `deploy/lens/.env`。從儲存庫根目錄套用它們：

```sh
docker compose -f deploy/lens/compose.yaml up -d --wait
```

</TabItem>
<TabItem value="other" label="Helm 或其他平台">

對於 Helm，請使用 [Lens chart 的閘道設定](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md#connect-a-gateway) 來參考這兩個密鑰。對於其他平台，請透過其環境設定將這兩個變數新增至 Lens 服務，然後重新部署它。

</TabItem>
</Tabs>

部署完成後，重複步驟 1 的就緒檢查。

## 4. 設定 LiteLLM {#4-configure-litellm}

將這些變數新增至 LiteLLM 服務。在分割式閘道/後端部署中，將它們同時提供給這兩個服務：

```dotenv
LITELLM_LENS_URL=https://lens.example.com
LITELLM_LENS_PUBLIC_URL=https://lens.example.com
LITELLM_LENS_SERVICE_TOKEN=YOUR_SERVICE_SECRET
LENS_GATEWAY_SECRET=YOUR_SIGNING_SECRET
```

使用您的 Lens URL 和步驟 2 中的同一組密鑰。兩個 URL 都不以 `/ui/` 或 `/v1/traces` 結尾。

`LITELLM_LENS_URL` 是閘道呼叫的位址。`LITELLM_LENS_PUBLIC_URL` 是顯示給代理程式匯出器的位址。它們可以是同一個 HTTPS URL。如果您為第一個值使用私密位址，第二個值仍必須可供您的代理程式連線。

將此區塊合併到閘道現有的 `config.yaml` 中。保留其模型清單和其他設定：

```yaml
general_settings:
  tracing:
    store:
      type: lens
```

透過您一般的閘道部署套用此變更。對於 Compose，請依照 [Compose 步驟](./docker-compose.md#2-apply-the-gateway-settings)。對於 Helm，請使用 [外部 Lens 模式](./kubernetes.md#existing-deployment)。Helm 會從 chart 值和 Secret 參考提供這四個環境變數。

## 5. 在閘道中開啟 Lens {#5-open-lens-in-the-gateway}

以閘道管理員身分登入您的 LiteLLM 儀表板，並在側邊欄中選取 **Lens**。您應該會看到已連接的 Lens 工作區，或其第一次追蹤設定頁面。您不應該被要求提供獨立 Lens 管理員 token。

如果服務已連接但沒有追蹤，請從此內嵌頁面依照 [傳送您的第一個 trace](../first-trace.md)。在這裡建立追蹤金鑰會套用閘道使用者的存取範圍。連接閘道時，現有的獨立追蹤不會重新指派給不同的使用者或團隊。

透過您的閘道發出一個一般的模型請求，檢查其現有的模型連線是否仍可運作。Lens 設定不需要變更您的代理程式使用的模型端點或模型金鑰。

## 如果連線無法運作 {#if-the-connection-does-not-work}

| 您看到的情況 | 要檢查的項目 |
| --- | --- |
| Lens 仍顯示安裝說明 | 確認所有四個閘道變數都已傳達到執行中的服務，然後檢查其版本。 |
| Lens 已設定但無法使用 | 檢查 `/health/ready`、閘道到 Lens 的網路存取，以及這兩個密鑰是否相符。 |
| 您可以開啟 Lens 但無法傳送追蹤 | 檢查公開的接收 URL，並使用代理程式追蹤金鑰，而不是任何一個連線密鑰。 |
| 某位使用者看不到現有的追蹤 | 檢查追蹤金鑰的使用者和團隊範圍。使用管理員帳戶檢查工作區。 |

對於 API 連線檢查，請使用 LiteLLM 管理員憑證在閘道上呼叫 `GET /lens/service`。就緒的連線會回報 `connected: true`、`status.storage_ready: true`、`status.credentials_ready: true` 和 `status.public_contract: 1`。讓該憑證保持私密。

**選擇性：** 如需協助將這些步驟調整為您的部署，請將 [現有 LiteLLM 設定提示](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#add-lens-to-existing-litellm) 複製到您的程式碼代理程式中。告訴它 Lens 已在執行，並提供服務 URL。透過您的密鑰管理工具共用密鑰。
