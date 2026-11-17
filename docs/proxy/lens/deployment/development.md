---
title: "從原始碼建置"
description: "使用其 Rust 後端、ClickHouse 和共用 UI 開發獨立 Lens。"
slug: "/proxy/lens/deployment/development"
---

# 從原始碼建置 {#build-from-source}

如需從您的程式碼代理程式取得選擇性協助，[Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md) 提供了適用於現有 LiteLLM 部署、獨立 Lens 和外部 ClickHouse 的提示。代理程式在套用本指南前，應先檢查已安裝的版本

從公開的 [Lens 儲存庫](https://github.com/BerriAI/lens) 開發 Lens。它擁有 Rust 後端，以及 LiteLLM 內嵌的共用 UI。您可以搭配 ClickHouse 開發和執行它，不需要閘道或 PostgreSQL

## 啟動開發環境 {#local-development}

安裝 Git、Docker 與 Compose v2、Node.js 24.14.1 或更新版本，以及 npm 11.10.0 或更新版本。從全新的檢出開始：

```sh
git clone https://github.com/BerriAI/lens.git
cd lens
npm ci
npm run dev
```

第一次啟動會建置 Lens、在 `deploy/lens/.env` 中產生私密憑證、啟動 Lens 和 ClickHouse，並在 [http://127.0.0.1:3100/ui/](http://127.0.0.1:3100/ui/) 啟動 UI。使用該檔案中的 `LENS_ADMIN_TOKEN` 登入。在本機讀取它，並避免將它放入共用的記錄中。UI 變更會自動重新載入，開發伺服器會將 API 請求轉送到 Lens 容器

開啟 **Traces**，按一下 **Connect project**，選取您的框架並建立追蹤金鑰。使用產生的設定執行您的代理程式，然後使用 **Check for traces** 並開啟相符的執行。只有在您啟用調查或 Signals 時，才需要提供者設定

如果連接埠 4318 被占用，請使用 `LENS_PORT=4320 LENS_DEV_API_URL=http://127.0.0.1:4320 npm run dev`。UI 使用連接埠 3100，因此請先停止任何使用該連接埠的先前預覽

## 嘗試後端變更 {#try-backend-changes}

從 Lens 儲存庫根目錄，建置完整的執行階段映像，並以開發 UI 啟動它：

```sh
docker build --build-arg LENS_VERSION=local-test \
  -f deploy/runtime/Dockerfile -t lens:local-test .
LENS_IMAGE=lens:local-test npm run dev
```

在變更 Rust 程式碼後，重複建置並重新啟動。容器包含靜態 UI，以及調查所使用的原生 Linux 計算沙箱。Rust 工具鏈、聚焦檢查、UI 套件檢查和儲存庫版面配置，請參閱 [Developing Lens](https://github.com/BerriAI/lens/blob/main/CONTRIBUTING.md)

## 停止與繼續 {#stop-and-resume}

Ctrl-C 會停止 UI 開發伺服器。使用以下命令停止 Lens 和 ClickHouse，同時保留其資料：

```sh
docker compose -f deploy/lens/compose.yaml stop
```

再次執行 `npm run dev` 以繼續。保留環境檔案和 ClickHouse 磁碟區，讓您的憑證和儲存的記錄得以保留

如需不含開發工具的原始碼安裝，請使用 [Run Lens](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md)。該指南也說明了目前已發佈版本的狀態。官方配對版本使用相同的 Lens 和 LiteLLM 版本；連接閘道需要 [閘道整合指南](./docker-compose.md) 中所述的相容配接器和憑證
