---
title: "啟動 Lens"
description: "使用一個 Docker Compose 檔案啟動 Lens、登入並查看追蹤。不需要 LiteLLM 閘道、Kubernetes 或 Git 檢出。"
slug: "/proxy/lens/deployment/local"
---

# 啟動 Lens {#start-lens}

啟動 Docker，然後在一個空資料夾中執行：

```sh
curl -fsSLO https://raw.githubusercontent.com/BerriAI/lens/main/deploy/lens/compose.yaml && docker compose up --wait && docker compose logs -n1 credentials
```

它會在一分鐘內完成，並印出要開啟的位址和您的設定 token：

```
credentials-1  | Open http://localhost:4318/ui/ and paste this setup token: <your token>
```

開啟 [http://localhost:4318/ui/](http://localhost:4318/ui/)，開啟 **Admin token**，將 token 貼入欄位，然後選取 **Sign in**。若要在沒有 token 的情況下四處看看，請在同一頁面選取 **Explore demo data**。

![Lens 登入頁面，Admin token 區段已開啟。](/img/lens/quickstart-signin.webp)

您需要 Docker 搭配 Docker Compose 2.24 或更新版本，且 Docker 必須正在執行。您不需要 Git、LiteLLM、Kubernetes、PostgreSQL 或模型金鑰。此命令會下載一個 [Compose 檔案](https://github.com/BerriAI/lens/blob/main/deploy/lens/compose.yaml)，並從已發佈的映像啟動 Lens 和 ClickHouse。Lens 會在首次啟動時產生其憑證，並將它們儲存在該檔案旁邊的 `.env` 中，其中 token 是 `LENS_ADMIN_TOKEN`。

## 查看追蹤 {#see-traces}

在右上角開啟 **Demo data**。Lens 會開啟 **Traces**，顯示範例執行以供查看。若要記錄您自己的代理程式，請依照 [傳送您的第一個 trace](../first-trace.md)。

![Lens Traces 頁面，已開啟 Demo data，列出範例支援代理程式執行。](/img/lens/quickstart-demo-traces.webp)

選取一個執行，以查看其步驟、輸入和輸出。

![在 Lens 中開啟的範例執行，顯示其步驟、使用者輸入和助理輸出。](/img/lens/quickstart-demo-trace.webp)

使用 `docker compose down` 停止 Lens。您的資料會保留；加入 `--volumes` 會將它刪除。

下一步：[Claude Code 和 Codex 設定](../coding-agents.md)、[在伺服器上執行 Lens](./server.md)，或 [將 Lens 新增至 LiteLLM](./litellm.md)。如果啟動失敗，請參閱 [疑難排解](./configuration.md#troubleshooting)。
