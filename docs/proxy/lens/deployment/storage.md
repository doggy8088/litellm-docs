---
title: "儲存與密鑰"
description: "設定支援的 ClickHouse 儲存、Lens 憑證和 GitOps。"
slug: "/proxy/lens/deployment/storage"
---

# 儲存與密鑰 {#storage-and-secrets}

獨立 Lens 啟動器和 Helm chart 包含搭配 Keeper 的 ClickHouse，並產生私密憑證。在提供外部儲存或密鑰時使用本頁。[Lens Helm 指南](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md#use-existing-clickhouse) 擁有完整的儲存需求

關於 Kubernetes 儲存的必要條件和大小，請參閱 [Helm 設定](./kubernetes.md)。處於 Pending 狀態的磁碟區會使 ClickHouse 無法啟動。閘道的受管理 PostgreSQL 是分開的，兩個 chart 都不提供它

## ClickHouse 連線 {#clickhouse-connection}

使用 ClickHouse HTTP(S) 端點，憑證中的特殊字元需經過 URL 編碼：

```text
https://lens_user:URL_ENCODED_PASSWORD@clickhouse.example.com:8443
```

一般的私密 HTTP 連接埠是 8123；連接埠 9000 使用原生通訊協定，不是 Lens HTTP 連線。將 URL 保留在您的密鑰管理工具中。獨立 Lens 預設使用資料庫 `lens`；現有的閘道安裝可以保留 `litellm`。保留包含您記錄的資料庫

Lens 在接受請求之前，會先初始化其結構描述和應用程式狀態。其憑證必須允許資料庫、資料表和具體化檢視的建立、讀取、插入和變更，以供發佈和清理。唯讀的分析帳戶無法執行 Lens

## 外部 ClickHouse {#external-clickhouse}

支援的外部儲存是一個可連線到一台 ClickHouse 伺服器的穩定端點，由 Lens 複本共用。該伺服器必須支援搭配 Keeper 的 KeeperMap，並設定 `keeper_map_path_prefix`。使用 [隨附的 Keeper 設定](https://github.com/BerriAI/lens/blob/main/deploy/clickhouse/keeper.xml) 作為單一伺服器參考

Lens 承載資料表是該伺服器的本機資料表。共用的 Keeper 不會在 ClickHouse 節點之間複寫它們。不支援多伺服器負載平衡、分散式資料表，以及自動容錯移轉到另一台 ClickHouse 伺服器。在選擇受管理的資料庫之前，請確認您的提供者實際的引擎、協調和權限支援

對於獨立 Helm，請建立包含已驗證 URL 的 Kubernetes Secret，然後在頂層參考它：

```yaml
clickhouseSecret:
  name: lens-clickhouse
  key: url
clickhouseDatabase: lens
retentionDays: 14
```

此參考會抑制隨附的 ClickHouse 資源。提供您實際的密鑰和資料庫名稱。在獨立的 Lens chart 上設定這些儲存值。LiteLLM chart 只設定與 Lens 的連線。將 ClickHouse 承載資料和 Keeper 中繼資料一起備份和還原。

## 服務與管理員憑證 {#service-token}

獨立 chart 可以為具有叢集存取權的 Helm 安裝產生其管理員憑證。若要自行提供，請佈建 Secret 並設定：

```yaml
adminTokenSecret:
  name: lens-admin
  key: admin-token
```

連接閘道還需要 [服務與簽署憑證](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md#connect-a-gateway)。在這兩個服務上重複使用相同的值，每個至少 32 個字元。這些憑證與管理員 token、代理程式追蹤金鑰和模型提供者金鑰是分開的

當 Lens 和 LiteLLM 使用不同的命名空間時，請在兩者中佈建具有相符 `gateway-secret` 和 `service-token` 金鑰的 `lens-connection`。閘道在其命名空間中也需要自己的主金鑰和 PostgreSQL 憑證

在升級過程中保留現有的密鑰。舊的已註冊 worker token 屬於先前的閘道控制平面，不授權新的獨立執行階段

## GitOps {#gitops}

沒有叢集存取權的 Helm 轉譯器無法使用 `lookup` 在轉譯之間保留產生的密鑰。對於此流程，請在應用程式同步之前，透過您的密鑰管理工具佈建 Lens 管理員憑證和外部 ClickHouse 連線。連接閘道時，也請佈建其服務與簽署憑證

在 `adminTokenSecret`、`clickhouseSecret` 和選擇性的閘道設定中參考現有的密鑰，而不是提交明文值。獨立於閘道選取並固定映像或 chart 成品。讓每個資源保持一個版本或應用程式擁有者

對於現有的安裝，在變更控制器之前，請先依照 [寫入者遷移](https://github.com/BerriAI/lens/blob/main/docs/migration.md) 和 [資源擁有權轉移](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md#select-versions-independently)。在交接後驗證已儲存的追蹤、資料集和調查
