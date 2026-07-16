import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { ControlPlaneArchitecture } from '@site/src/components/ControlPlaneArchitecture';

# [BETA] 高可用性控制平面 {#beta-high-availability-control-plane}

部署單一 LiteLLM UI，以管理多個彼此獨立的 LiteLLM proxy 執行個體，每個執行個體都有自己的資料庫、Redis 和主金鑰。

:::info

這是 Enterprise 功能。

[Enterprise 定價](https://www.litellm.ai/#pricing)

[取得免費 7 天試用金鑰](https://www.litellm.ai/enterprise#trial)

:::

## 為什麼採用這個架構？ {#why-this-architecture}

在 [標準多區域設定](./multi_region.md) 中，所有執行個體共用單一資料庫與主金鑰。這種方式可行，但會引入共享相依性。如果資料庫故障，所有執行個體都會受到影響。這也表示一個授權涵蓋所有區域；在本頁的獨立 worker 架構中，每個 worker 都是各自擁有授權的獨立部署。

**高可用性控制平面** 採取不同做法：

| | 共享資料庫（標準） | 高可用性控制平面 |
|---|---|---|
| **資料庫** | 所有執行個體共用單一資料庫 | 每個執行個體都有自己的資料庫 |
| **Redis** | 共享 Redis | 每個執行個體都有自己的 Redis |
| **主金鑰** | 所有執行個體使用相同金鑰 | 每個執行個體都有自己的金鑰 |
| **故障隔離** | 資料庫中斷會影響所有執行個體 | 故障只會隔離到單一執行個體 |
| **使用者管理** | 集中式，單一使用者表 | 獨立式，每個 worker 管理自己的使用者 |
| **UI** | 每個管理員執行個體一個 UI | 單一控制平面 UI 管理所有 worker |

### 優點 {#benefits}

- **真正的高可用性**：沒有共享基礎架構，就沒有單一故障點
- **爆炸半徑控管**：某個 worker 的錯誤設定或中斷不會影響其他 worker
- **區域隔離**：worker 可在不同地區執行，以符合資料駐留需求
- **更簡單的營運**：每個 worker 都是自包含的 LiteLLM 部署

## 架構 {#architecture}

<ControlPlaneArchitecture />

**控制平面** 是一個 LiteLLM 執行個體，提供管理員 UI，並且知道所有 worker 的資訊。它**不是路由器**；它不會代理或路由任何 LLM 請求。它存在的目的只是讓管理員可以在單一 UI 中切換 worker 並進行管理。

每個 **worker** 都是完全獨立的 LiteLLM proxy，負責處理其區域或團隊的 LLM 請求。worker 擁有自己的資料庫、Redis、使用者、金鑰、團隊與預算。worker 之間不共享任何基礎架構。

## 設定 {#setup}

### 1. 控制平面設定 {#1-control-plane-configuration}

控制平面需要一個 `worker_registry`，其中列出所有 worker 執行個體。

```yaml title="cp_config.yaml"
model_list: []

general_settings:
  master_key: sk-1234
  database_url: os.environ/DATABASE_URL

worker_registry:
  - worker_id: "worker-a"
    name: "Worker A"
    url: "http://localhost:4001"
  - worker_id: "worker-b"
    name: "Worker B"
    url: "http://localhost:4002"
```

啟動控制平面：

```bash
litellm --config cp_config.yaml --port 4000
```

### 2. Worker 設定 {#2-worker-configuration}

每個 worker 都需要在其 `general_settings` 中設定 `control_plane_url`，以啟用來自控制平面 UI 的跨來源驗證。

每個 worker 也必須設定 `PROXY_BASE_URL`，以確保 SSO 回呼重新導向能正確解析。

<Tabs>
<TabItem value="worker-a" label="Worker A">

```yaml title="worker_a_config.yaml"
model_list: []

general_settings:
  master_key: sk-worker-a-1234
  database_url: os.environ/WORKER_A_DATABASE_URL
  control_plane_url: "http://localhost:4000"
```

```bash
PROXY_BASE_URL=http://localhost:4001 litellm --config worker_a_config.yaml --port 4001
```

</TabItem>
<TabItem value="worker-b" label="Worker B">

```yaml title="worker_b_config.yaml"
model_list: []

general_settings:
  master_key: sk-worker-b-1234
  database_url: os.environ/WORKER_B_DATABASE_URL
  control_plane_url: "http://localhost:4000"
```

```bash
PROXY_BASE_URL=http://localhost:4002 litellm --config worker_b_config.yaml --port 4002
```

</TabItem>
</Tabs>

:::important
每個 worker 都必須有自己的 `master_key` 和 `database_url`。這個架構的核心就是 worker 彼此獨立。
:::

### 3. SSO 設定（選用） {#3-sso-configuration-optional}

SSO 在 **控制平面** 執行個體上的設定方式與標準 LiteLLM proxy 相同。完整說明請參閱 [SSO 設定指南](./admin_ui_sso.md)。

如果使用 SSO，請務必在您的 SSO 提供者儀表板中，將每個 worker URL 與控制平面 URL 註冊為允許的回呼 URL。

## 運作方式 {#how-it-works}

### 登入流程 {#login-flow}

1. 使用者造訪控制平面 UI（`http://localhost:4000/ui`）
2. 登入頁面會顯示一個 **worker 選擇器** 下拉式選單，列出所有已註冊的 worker
3. 使用者選擇一個 worker（例如「Worker A」），並使用使用者名稱/密碼或 SSO 登入
4. UI 透過 `/v3/login` 端點向 **所選 worker** 進行驗證
5. 成功後，UI 會儲存該 worker 的 JWT，並將後續所有 API 呼叫指向該 worker
6. 使用者現在可以在控制平面 UI 中管理該 worker 上的金鑰、團隊、模型與預算

### 切換 Worker {#switching-workers}

登入後，使用者可以在不離開 UI 的情況下，透過 **導覽列下拉式選單** 切換 worker。切換時會重新導向回登入頁面，以對新 worker 進行驗證。

### 探索 {#discovery}

控制平面會公開一個 `/.well-known/litellm-ui-config` 端點，UI 在載入時會讀取此端點。此端點會回傳：
- `is_control_plane: true`
- 包含其 ID、名稱與 URL 的 worker 清單

登入頁面就是透過這個方式知道要顯示 worker 選擇器。

## 本機測試 {#local-testing}

若要在本機試用，請在各自獨立的終端機中啟動每個執行個體：

```bash
# Terminal 1: Control Plane
litellm --config cp_config.yaml --port 4000

# Terminal 2: Worker A
PROXY_BASE_URL=http://localhost:4001 litellm --config worker_a_config.yaml --port 4001

# Terminal 3: Worker B
PROXY_BASE_URL=http://localhost:4002 litellm --config worker_b_config.yaml --port 4002
```

接著開啟 `http://localhost:4000/ui`。您應該會在登入頁面看到 worker 選擇器。

## 設定參考 {#configuration-reference}

### 控制平面設定 {#control-plane-settings}

| 欄位 | 位置 | 說明 |
|---|---|---|
| `worker_registry` | 頂層設定 | worker 執行個體清單 |
| `worker_registry[].worker_id` | 必填 | worker 的唯一識別碼 |
| `worker_registry[].name` | 必填 | UI 中顯示的名稱 |
| `worker_registry[].url` | 必填 | worker 執行個體的完整 URL |

### Worker 設定 {#worker-settings}

| 欄位 | 位置 | 說明 |
|---|---|---|
| `general_settings.control_plane_url` | 必填 | 控制平面執行個體的 URL。會在此 worker 上啟用 `/v3/login` 與 `/v3/login/exchange` 端點。 |
| `PROXY_BASE_URL` | 環境變數 | worker 自己的外部 URL。SSO 回呼重新導向需要此設定。 |

## 相關文件 {#related-documentation}

- [多區域部署](./multi_region.md) - 共享資料庫架構、跨區域授權
- [SSO 設定](./admin_ui_sso.md) - 為管理員 UI 設定 SSO
- [正式環境部署](./prod.md) - 正式環境最佳實務
