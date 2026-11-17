---
title: "將 Lens 連接到 Docker Compose"
description: "將執行中的 Lens 服務新增至您現有的 LiteLLM Compose 部署。"
slug: "/proxy/lens/deployment/docker-compose"
---

# 將 Lens 連接到 Docker Compose {#connect-lens-to-docker-compose}

當 LiteLLM 已使用 Docker Compose 執行時，請使用本指南。Lens 可以在另一個 Compose 專案中執行、在 Render 上執行，或在另一台可連線的伺服器上執行。保留您閘道現有的服務、模型設定、資料庫和磁碟區。

## 1. 準備連線 {#1-set-the-connection-values}

完成 [將 Lens 新增至 LiteLLM 的步驟 1–3](./litellm.md#1-get-the-lens-address)。您需要一個就緒的 Lens URL，以及兩個已在 Lens 上設定的連線密鑰。

在包含您閘道 Compose 檔案的目錄中，建立私密的 `lens-gateway.env` 檔案，內容如下：

```dotenv
LITELLM_LENS_URL=https://lens.example.com
LITELLM_LENS_PUBLIC_URL=https://lens.example.com
LITELLM_LENS_SERVICE_TOKEN=YOUR_SERVICE_SECRET
LENS_GATEWAY_SECRET=YOUR_SIGNING_SECRET
```

將 URL 和密鑰替換為您的值。讓此檔案不進入 Git，並限制其存取：

```sh
chmod 600 lens-gateway.env
```

當閘道和代理程式都可以連線到公開的 HTTPS Lens URL 時，兩個位址都使用該 URL 即可。對於共用的 Docker 網路，私密 URL 可以改用 `http://lens:4318`。讓公開 URL 保持可供您的代理程式連線。請參閱 [Docker 網路](./configuration.md#docker-network)。

<span id="2-add-lens-to-your-compose-file" />

## 2. 套用閘道設定 {#2-apply-the-gateway-settings}

在您現有的 Compose 檔案中，將環境檔案新增至您的閘道服務。此範例使用服務名稱 `litellm`；請使用您檔案中的名稱。保留任何現有的 `env_file` 項目：

```yaml
services:
  litellm:
    env_file:
      - lens-gateway.env
```

明確的 `environment` 值會覆寫環境檔案中的同名值。請更新這四個 Lens 變數的任何現有定義，使它們一致。在分割式部署中，將該檔案同時新增至閘道和後端/API 服務。

將此區塊合併到閘道現有的 `config.yaml` 中：

```yaml
general_settings:
  tracing:
    store:
      type: lens
```

請勿取代其他 `general_settings` 值或模型清單。

## 3. 重新建立閘道 {#3-start-lens}

從您閘道的 Compose 目錄，列出服務名稱：

```sh
docker compose config --services
```

重新建立閘道服務，讓它載入設定。將 `litellm` 替換為其服務名稱。如果您使用分割式部署，也要包含後端服務：

```sh
docker compose up -d --no-deps litellm
```

保留您的部署通常使用的任何 Compose 檔案或專案旗標。此步驟會重新啟動選取的服務，並可能中斷請求。

## 4. 檢查結果 {#4-check-the-installation}

登入 LiteLLM 並選取 **Lens**。使用 [連線檢查](./litellm.md#5-open-lens-in-the-gateway)，然後 [傳送您的第一個 trace](../first-trace.md)。您現有的模型請求應該繼續運作。
