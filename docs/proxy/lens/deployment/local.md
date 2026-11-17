---
title: "啟動獨立 Lens"
description: "在本機執行 Lens 和 ClickHouse、登入，並在不使用 LiteLLM 閘道的情況下傳送第一個 trace。"
slug: "/proxy/lens/deployment/local"
---

# 啟動獨立 Lens {#start-standalone-lens}

在您的電腦上執行 Lens 以檢查代理程式追蹤。您需要 Git、Docker 和 Docker Compose v2。Docker 必須正在執行。啟動 Lens 不需要 LiteLLM 閘道、PostgreSQL 或模型提供者金鑰。

此快速入門會從 [原始碼儲存庫](https://github.com/BerriAI/lens) 建置 Lens。第一次建置可能需要幾分鐘。已發佈成品的可用性，請參閱 [版本與映像](./releases.md)。

## 1. 啟動 Lens {#1-start-lens}

在終端機中執行這些命令：

```sh
git clone https://github.com/BerriAI/lens.git
cd lens
./deploy/lens/start
```

此指令碼會建置 Lens、在 `deploy/lens/.env` 中產生憑證，並搭配 ClickHouse 啟動 Lens。等待 `Lens is ready at http://localhost:4318/ui/` 出現。

當您再次執行此指令碼時，它會保留現有的憑證和儲存的資料。讓環境檔案保持私密。

## 2. 登入 {#2-sign-in}

開啟 [localhost:4318 上的 Lens](http://localhost:4318/ui/)。在您的編輯器中開啟 `deploy/lens/.env`，並將 `LENS_ADMIN_TOKEN` 值複製到 Lens 登入頁面。

此 token 用於管理員存取。下一步會為您的代理程式建立一個獨立的追蹤金鑰。

## 3. 傳送 trace {#3-send-a-trace}

依照 [傳送您的第一個 trace](../first-trace.md)。此範例會記錄一次模型呼叫。然後使用您的框架指南連接您自己的代理程式。

對於同一台電腦上的代理程式，追蹤端點是 `http://localhost:4318/v1/traces`。位於另一個容器或另一台機器上的代理程式需要一個它可以連線的位址。請勿使用該代理程式的 `localhost` 來指稱您的 Lens 伺服器。

## 4. 選擇您的下一步 {#4-choose-your-next-step}

若要在現有的 LiteLLM 儀表板中使用 Lens，請 [連接此 Lens 部署](./litellm.md#1-get-the-lens-address)。若要讓團隊使用 Lens，請依照 [伺服器上的 Docker Compose](./server.md) 或 [Kubernetes](./kubernetes.md)。

您可以在設定分析模型之前先檢查追蹤。當您希望 Lens 調查它們時，請 [設定分析模型](https://github.com/BerriAI/lens/blob/main/docs/analysis.md) 並 [建立調查](../investigations.md)。

## 停止與重新啟動 {#stop-and-restart}

從 Lens 儲存庫根目錄，停止服務同時保留其資料：

```sh
docker compose -f deploy/lens/compose.yaml down
```

使用 `./deploy/lens/start` 再次啟動它們。保留 `deploy/lens/.env` 和 ClickHouse 磁碟區。在停止命令中加入 `--volumes` 會刪除儲存的 Lens 資料。

如果啟動失敗，請檢查 Docker 和服務記錄：

```sh
docker info
docker compose -f deploy/lens/compose.yaml ps
docker compose -f deploy/lens/compose.yaml logs --tail=100 lens clickhouse
```

如需從程式碼代理程式取得協助，請複製 [獨立設定提示](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#start-standalone-lens)。如需持久資料，請使用 [備份指南](https://github.com/BerriAI/lens/blob/main/docs/backup.md)。
