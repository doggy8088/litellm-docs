---
title: "Lens 容器"
description: "使用 ClickHouse 執行獨立的 Lens 容器，並可選擇連接 LiteLLM。"
slug: "/proxy/lens/deployment/docker"
---

# Lens 容器 {#lens-containers}

Lens 的執行階段映像包含其 Rust API、背景處理、靜態 UI 和計算沙箱。它需要搭配 KeeperMap 的 ClickHouse，以及它自己的管理員憑證。使用 [原始碼 Compose 快速入門](./local.md) 取得最短的完整容器安裝，或在 Kubernetes 中使用 [原始碼 Helm chart](./kubernetes.md)

對於受管理的容器平台，請使用目前的 [執行階段 Dockerfile](https://github.com/BerriAI/lens/blob/main/deploy/runtime/Dockerfile) 和 [Compose 設定](https://github.com/BerriAI/lens/blob/main/deploy/lens/compose.yaml) 作為部署參考。[從原始碼建置](./development.md#try-backend-changes) 會產生本機映像；獨立發佈的成品仍在驗證中

## 設定 Lens {#2-configure-lens}

透過私密的部署設定提供 `LENS_ADMIN_TOKEN`、正確的 `LENS_PUBLIC_URL`，以及其 ClickHouse 連線。[儲存需求](./storage.md#external-clickhouse) 包含單一伺服器拓撲、Keeper 設定和權限。在更換容器時保留憑證和儲存空間

保留隨附的非 root 使用者、唯讀檔案系統、有界限的暫存空間、已捨棄的能力和沙箱設定。調查時，請使用原生 Linux 以及 [計算沙箱](https://github.com/BerriAI/lens/blob/main/docs/sandbox.md) 所需的能力

## 連接現有的閘道 {#1-configure-litellm}

相容的 LiteLLM 閘道可以在可連線的 HTTP 或 HTTPS 位址連接到執行中的 Lens 服務。使用 [將 Lens 新增至 LiteLLM](./litellm.md) 中的憑證和 URL 設定，透過您現有的容器環境和重新建立命令提供。讓兩個容器保持在持久的使用者定義網路上，或使用另一個可連線的私密位址

Lens 的公開位址供代理程式和瀏覽器使用。其服務和簽署憑證會驗證閘道連線；代理程式追蹤金鑰和模型憑證則保持分開。現有由閘道託管的 Lens 中繼資料，在新的執行階段接管擁有權之前，需要先進行 [已記錄的遷移](https://github.com/BerriAI/lens/blob/main/docs/migration.md)

## 啟動與檢查 {#3-start-lens}

在連接埠 4318 上，將 `/health/live` 設為處理程序健康狀態，`/health/ready` 設為就緒狀態。依照 [伺服器指南](./server.md#3-route-https-traffic)，透過您的 HTTPS 代理路由獨立 UI 和 API

## 驗證有用的運作 {#4-check-the-installation}

在 `/ui/` 登入獨立 Lens，或使用已連接閘道的 `/ui/lens/` 頁面。完成 [第一次追蹤檢查](../deployment.md#check-the-installation)，重新啟動 Lens 容器，並確認儲存的追蹤仍然可以存取。若要復原，請使用同時保留 ClickHouse 承載資料和 Keeper 狀態的備份程序
