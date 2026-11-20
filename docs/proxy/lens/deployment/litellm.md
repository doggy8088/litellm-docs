---
title: "將 Lens 新增至 LiteLLM"
description: "將執行中的 Lens 服務連接到您的閘道，並從 LiteLLM 側邊欄開啟它。"
slug: "/proxy/lens/deployment/litellm"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 將 Lens 新增至 LiteLLM {#add-lens-to-litellm}

當您的應用程式或代理程式已設定 OpenTelemetry (OTel) 環境變數時，您透過閘道傳送的流量會以附帶成本的 trace 形式出現在 Lens 中。請依照 [應用程式追蹤](../first-trace.md) 或 [程式碼代理程式設定](../coding-agents.md)。Lens 也可以使用您的 LiteLLM 登入，從 LiteLLM 側邊欄開啟。

您需要 LiteLLM v1.108.0 或更新版本、執行中的 Lens，以及這兩者的環境設定存取權。閘道管理員會成為 Lens 管理員，因此請只連接您信任的閘道。 {/* keep-version-note: The minimum gateway release is the subject of this note. */}

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

如果您是使用 [快速入門](./local.md) 啟動 Lens，請將這兩個變數新增至下載的 `compose.yaml` 旁邊的 `.env`。從該資料夾套用它們：

```sh
docker compose up -d --wait
```

如果您執行的是 [發行套件](./server.md)，請改為將它們新增至 `deploy/lens/.env`。從 `lens-0.1.0` 目錄套用它們：

```sh
docker compose -f deploy/lens/compose.yaml up -d --wait
```

</TabItem>
<TabItem value="other" label="Helm 或其他平台">

**Helm。** 在 Lens 命名空間和閘道命名空間中，各建立一個包含這兩個值的 Secret。Secret 參考無法跨命名空間使用。將這兩個預留位置替換為步驟 2 中的值：

```sh
SERVICE_TOKEN=YOUR_SERVICE_SECRET
GATEWAY_SECRET=YOUR_SIGNING_SECRET
for namespace in lens litellm; do
  kubectl --namespace "$namespace" create secret generic lens-connection \
    --from-literal=service-token="$SERVICE_TOKEN" \
    --from-literal=gateway-secret="$GATEWAY_SECRET"
done
```

將這些值新增至 Lens 的 `values.yaml`，並再次執行其 [安裝命令](./kubernetes.md#new-deployment)：

```yaml title="values.yaml"
gateway:
  enabled: true
  secretName: lens-connection
serviceTokenSecret:
  name: lens-connection
```

**另一個平台。** 透過 Lens 服務的環境設定新增這兩個變數，然後重新部署它

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

對於 Kubernetes，請為閘道連線使用私密的 Lens Service 位址，並為匯出器使用可連線的 HTTPS 來源

設定 `LITELLM_LENS_URL` 會開啟 Lens 連線，因此沒有 `config.yaml` 的閘道（例如 [Docker 快速入門](../../docker_quick_start.md)）不需要其他變更。如果您的閘道有 `config.yaml`，您也可以在其中陳述儲存設定。保留其模型清單和其他設定：

```yaml
general_settings:
  tracing:
    store:
      type: lens
```

透過您一般的閘道部署套用此變更

### Helm {#helm}

[LiteLLM chart](../../deploy/helm.md) 會從其值設定這四個變數。將這些內容新增至閘道的 `values.yaml`，保留其其他設定，然後升級該版本。該 chart 不會安裝 Lens：

```yaml title="values.yaml"
lens:
  enabled: true
  url: http://lens.lens.svc.cluster.local:4318
  publicUrl: https://lens.example.com
  gatewaySecret:
    name: lens-connection
  serviceTokenSecret:
    name: lens-connection
gateway:
  config:
    proxy_config:
      general_settings:
        tracing:
          store:
            type: lens
```

`lens.url` 是私密的 Service 位址，`http://<release>.<namespace>.svc.cluster.local:4318`。`lens.publicUrl` 是 Lens 的 Ingress 位址

### Docker Compose {#docker-compose}

Lens 只在主機的 `127.0.0.1` 上發佈連接埠 4318，閘道容器無法連線到它。當兩者在同一台 Docker 主機上執行時，請將閘道連接到 Lens 已建立的網路 `lens_default`。Lens 接著會在閘道容器中以 `http://lens:4318` 回應，且 Lens Compose 檔案保持不變。檢查該網路是否存在：

```sh
docker network inspect lens_default --format '{{.Name}}'
```

在您閘道的 Compose 目錄中，將上述四個變數儲存在 `lens-gateway.env` 中，並設定 `LITELLM_LENS_URL=http://lens:4318`。讓公開 URL 可供代理程式連線。讓該檔案不進入 Git，並使用 `chmod 600 lens-gateway.env` 限制存取。

將此檔案和網路新增至其 Compose 檔案中的現有閘道服務，例如來自 [Docker 快速入門](../../docker_quick_start.md) 的 `docker-compose.quickstart.yml`。保留其其他的 `env_file` 和 `networks` 項目，並保留 `default`，讓閘道仍可連線到其資料庫：

```yaml
services:
  litellm:
    env_file:
      - lens-gateway.env
    networks: [default, lens]

networks:
  lens:
    name: lens_default
    external: true
```

對於位於另一台主機或不同網路配置的閘道，請參閱 [Docker 網路](./configuration.md#docker-network)。

明確的 `environment` 項目會覆寫 `env_file`；請更新四個變數的任何現有定義，讓它們一致。對於分割式部署，請將此檔案同時新增至閘道和後端/API 服務。保留您現有的資料庫、磁碟區和模型設定。

重新建立閘道以載入設定。將 `litellm` 替換為您的服務名稱（`docker compose config --services` 會列出它們），若後端服務是分開的，也請一併包含：

```sh
docker compose up -d --no-deps litellm
```

保留您慣用的 Compose 檔案和專案旗標。這會重新啟動選取的服務，並可能中斷請求。繼續執行下方的連線檢查。

## 5. 在閘道中開啟 Lens {#5-open-lens-in-the-gateway}

以閘道管理員身分登入您的 LiteLLM 儀表板，並在側邊欄中選取 **Lens**。已連接的 Lens 工作區會在 **Traces** 上開啟。您不應該被要求提供獨立 Lens 管理員 token。

如果服務已連接但沒有追蹤，請在 Lens 中選取 **Home**，並從該處依照 [傳送您的第一個 trace](../first-trace.md)。在這裡建立追蹤金鑰會套用閘道使用者的存取範圍。連接閘道時，現有的獨立追蹤不會重新指派給不同的使用者或團隊。

透過您的閘道發出一個一般的模型請求，檢查其現有的模型連線是否仍可運作。Lens 設定不需要變更您的代理程式使用的模型端點或模型金鑰。

## 如果連線無法運作 {#if-the-connection-does-not-work}

| 您看到的情況 | 要檢查的項目 |
| --- | --- |
| Lens 仍顯示安裝說明 | 確認所有四個閘道變數都已傳達到執行中的服務，然後檢查其版本。 |
| Lens 已設定但無法使用 | 檢查 `/health/ready`、閘道到 Lens 的網路存取，以及這兩個密鑰是否相符。 |
| 您可以開啟 Lens 但無法傳送追蹤 | 檢查公開的接收 URL，並使用代理程式追蹤金鑰，而不是任何一個連線密鑰。 |
| 某位使用者看不到現有的追蹤 | 檢查追蹤金鑰的使用者和團隊範圍。使用管理員帳戶檢查工作區。 |

對於 API 連線檢查，請使用 LiteLLM 管理員憑證在閘道上呼叫 `GET /lens/service`。就緒的連線會回報 `connected: true`、`status.storage_ready: true`、`status.credentials_ready: true` 和 `status.public_contract: 1`。讓該憑證保持私密。在 LiteLLM Helm chart 上，請透過 Ingress 或向後端 Service 傳送此請求；閘道 Service 會對此路徑回傳 404。

**選擇性：** 如需協助將這些步驟調整為您的部署，請將 [現有 LiteLLM 設定提示](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#add-lens-to-existing-litellm) 複製到您的程式碼代理程式中。告訴它 Lens 已在執行，並提供服務 URL。透過您的密鑰管理工具共用密鑰。
