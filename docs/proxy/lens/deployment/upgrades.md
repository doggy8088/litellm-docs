---
title: "升級 Lens"
description: "獨立更新 Lens，同時保留其記錄、憑證和復原點。"
slug: "/proxy/lens/deployment/upgrades"
---

# 升級 Lens {#upgrade-lens}

選取可用的 [Lens 成品](./releases.md) 並閱讀其遷移需求。當 Lens 與閘道版本的合約相容時，兩者的版本可以不同。內嵌 UI 的變更需要對應的閘道 UI 更新

在變更持久安裝之前，請先 [備份並演練復原](https://github.com/BerriAI/lens/blob/main/docs/backup.md)。保留確切的已安裝映像、原始碼或安裝套件、環境檔案、ClickHouse 資料和 Keeper 狀態。在維護時段之前，暫停排程的工作，並完成或取消進行中的調查

## 從閘道託管的 Lens 遷移 {#move-from-gateway-hosted-lens}

如果 Lens 中繼資料仍位於 PostgreSQL 中，請依照 [中繼資料遷移指南](https://github.com/BerriAI/lens/blob/main/docs/migration.md)。停止舊的寫入者，檢查匯入計畫，套用它，並在啟動新的 Lens 執行階段之前，驗證已儲存的身分和記錄。如果中繼資料已位於 ClickHouse 中，請保留該資料庫及其 Keeper 狀態，而不是在其上執行匯入工具

部署擁有權變更也需要每個資源一個控制器。將隨附的 Lens 部署與閘道版本分開時，請使用 [Helm 擁有權轉移程序](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md#select-versions-independently)。保留現有的資源名稱、選取器、密鑰和磁碟區

## 更新獨立安裝 {#update-an-independent-installation}

對於 Compose，將保留的 `deploy/lens/.env` 中的 `LENS_IMAGE` 更新為已驗證的成品，然後從相符的 Lens 檢出或安裝套件套用它：

```sh
docker compose -f deploy/lens/compose.yaml up -d --wait
```

對於 Helm，保留您的版本名稱、命名空間和值，並透過 [Lens Helm 指南](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md) 更新 Lens 映像或 chart。產生的憑證會由具有叢集存取權的 Helm 重複使用；GitOps 使用 [預先佈建的密鑰](./storage.md#gitops)

完成 [第一次追蹤檢查](../deployment.md#check-the-installation)，開啟先前儲存的追蹤和資料集，並在恢復排程之前執行一個有界限的調查。連接到 LiteLLM 時，也請在內嵌頁面中驗證一般的推論和現有的使用者範圍

## 使用相符的資料回復 {#roll-back-with-the-matching-data}

在驗證完成之前，保留先前的成品和復原點。在切換映像之前，確認回復目標可以讀取目前的狀態。回到會寫入 PostgreSQL 的實作需要相符的快照，以及對任何新寫入的對帳；[遷移指南](https://github.com/BerriAI/lens/blob/main/docs/migration.md#interrupted-import-and-rollback) 說明了該界限

保留環境檔案和 ClickHouse 磁碟區。`docker compose down --volumes` 會刪除儲存的 Lens 資料
