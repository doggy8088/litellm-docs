---
title: UI 部署選取器
sidebar_label: UI 部署選取器
description: 使用現有的 worker 登錄，從單一管理 UI 管理彼此獨立的 LiteLLM 部署。
---

import { ControlPlaneArchitecture } from '@site/src/components/ControlPlaneArchitecture';

# UI 部署選取器 {#ui-deployment-selector}

{/* keep-version-note */}

本指南涵蓋現有的 `worker_registry` UI。新的管理 API 請參閱[全域控制平面](../global_control_plane.md)。

部署單一 LiteLLM UI，以管理多個彼此獨立的 LiteLLM proxy 執行個體，每個執行個體都有自己的資料庫、Redis 與主金鑰。

<EnterpriseFeature />

## 何時使用此功能 {#when-to-use-this}

使用此 UI 管理彼此獨立的部署。每個 worker 保有自己的金鑰、團隊與預算。在某個 worker 上建立的金鑰無法在另一個 worker 上驗證。

對於共用同一個資料庫的區域 proxy，請使用[專用管理執行個體](../multi_region.md#optional-dedicated-admin-instance)。

## 架構 {#architecture}

<ControlPlaneArchitecture />

**UI 執行個體**提供管理 UI 並列出已註冊的 worker。瀏覽器會直接連線至所選的 worker 進行管理請求。

每個 **worker** 都是完全獨立的 LiteLLM proxy，負責處理其區域或團隊的 LLM 請求。Worker 擁有自己的資料庫、Redis、使用者、金鑰、團隊與預算。

## 設定 {#setup}

### 1. UI 設定 {#1-ui-configuration}

將每個 worker 加入 `worker_registry`，並填入其 `worker_id`、`name` 與 `url`：

```yaml title="cp_config.yaml"
model_list: []

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL

worker_registry:
  - worker_id: "worker-a"
    name: "Worker A"
    url: "http://localhost:4001"
  - worker_id: "worker-b"
    name: "Worker B"
    url: "http://localhost:4002"
```

啟動 UI 執行個體：

```bash
litellm --config cp_config.yaml --port 4000
```

### 2. Worker 設定 {#2-worker-configuration}

每個 worker 都需要在其 `general_settings` 中設定 `control_plane_url`。這會在 worker 上啟用 `/v3/login` 和 `/v3/login/exchange` 端點，讓控制平面 UI 能以跨來源方式對其進行驗證。每個 worker 也必須設定 `PROXY_BASE_URL`，以便 SSO 回呼重新導向能正確解析。

```yaml title="worker_a_config.yaml"
model_list: []

general_settings:
  master_key: os.environ/WORKER_A_MASTER_KEY
  database_url: os.environ/WORKER_A_DATABASE_URL # unique per worker
  control_plane_url: "http://localhost:4000"
```

```bash
PROXY_BASE_URL=http://localhost:4001 litellm --config worker_a_config.yaml --port 4001
```

對每個 worker 重複此操作，各自使用自己的主金鑰、資料庫 URL 與埠號。worker 設定請參閱[正式環境最佳實務](../prod.md)。

:::important
每個 worker 都必須有自己的 `master_key` 與 `database_url`。
:::

:::info
如果某個 worker 在負載平衡器後方執行多個執行個體，請在該 worker 上設定 Redis（其組態中的 `cache` 區段）。`/v3/login` 發出的登入代碼會儲存在伺服器端，因此若沒有共用 Redis，交換可能會落到不同的執行個體並以 401 失敗
:::

### 3. SSO {#3-sso}

SSO 在控制平面執行個體上的設定方式與標準 LiteLLM proxy 相同。完整操作請參閱 [SSO 設定指南](../admin_ui_sso.md)。如果您使用 SSO，請在 SSO 提供者的儀表板中將每個 worker URL 與控制平面 URL 註冊為允許的回呼 URL。

當控制平面與至少一個 worker 都在執行時，請開啟 `http://localhost:4000/ui`。您應該會在登入頁面上看到 worker 選擇器。

## 登入流程 {#login-flow}

載入時，UI 會讀取控制平面的 `/.well-known/litellm-ui-config` 端點；當 `worker_registry` 已設定時，該端點會回報 `is_control_plane: true`，以及已註冊的 worker（其 ID、名稱與 URL）。登入頁面會顯示 worker 選擇器。

使用者選擇一個 worker，然後以使用者名稱/密碼或 SSO 登入。UI 會透過呼叫所選 worker 的 `/v3/login` 端點來對其進行驗證，該端點會回傳一次性代碼，接著在該 worker 的 `/v3/login/exchange` 兌換此代碼以取得 JWT。從那時起，後續所有 API 呼叫都會指向該 worker，因此金鑰、團隊、模型與預算都會透過控制平面 UI 在所選 worker 上進行管理。

登入後，使用者可從導覽列下拉選單切換 worker，而不必離開 UI。切換時會重新導向回登入頁面，以便對新的 worker 進行驗證。
