import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';
import { MultiRegionArchitecture } from '@site/src/components/CloudArchitecture';

# 多區域部署 {#multi-region-deployment}

在同一家雲端提供者的多個區域中執行 LiteLLM proxy 執行個體，全部連接到同一個共享的 PostgreSQL 資料庫。用戶端會被路由到最近的區域以降低延遲，而金鑰、團隊、使用者與花費追蹤則會因為只有單一事實來源而在各處保持一致。

本頁涵蓋支援的拓撲、授權如何跨區域運作，以及逐步設定。若要在各區域部署 proxy 本身，請參閱 [部署到雲端（AWS、GCP、Azure）](./deploy_cloud.md)。

## 架構 {#architecture}

<MultiRegionArchitecture />

此拓撲有三項規則：

1. **一個資料庫。** 每個區域的 proxy 執行個體都指向 `DATABASE_URL` 同一個 PostgreSQL 資料庫，該資料庫託管在您的主要區域。這就是讓某個區域建立的金鑰能在所有區域運作的原因，也是讓預算與花費追蹤在全域保持一致的原因。
2. **每個區域一個 Redis。** Redis 處理某個區域內各執行個體之間的速率限制、路由器狀態與回應快取。請保持在同區域內；將單一 Redis 放在跨區域連線後方，會讓每次速率限制檢查都多一次網路往返。
3. **一個雲端提供者。** 在同一家雲端提供者中執行所有區域。

相同的拓撲可採 active-active（DNS 將每個用戶端路由到最近的區域；目標是延遲）或 active-passive（所有流量都在一個區域上，第二個區域已部署但在 DNS 故障轉移記錄後方閒置；目標是災難復原）運作。設定完全相同；只有 DNS 政策不同。

## 跨區域授權 {#licensing-across-regions}

只要所有區域共用一個資料庫，單一 LiteLLM Enterprise 授權即可涵蓋所有區域。

每個 proxy 執行個體都會獨立驗證其接收到的 `LITELLM_LICENSE` 金鑰（離線對已簽署的負載，或對授權伺服器），而授權檢查中不會計算執行個體或區域數量。授權所帶有的數量限制，也就是最大使用者數與最大團隊數，會從資料庫計算。當每個區域共用同一個資料庫時，這些計數只存在一份，因此授權也只會在全域強制一次。

推論很簡單：每個區域各自一個資料庫就是各自獨立的部署，而每個部署都需要自己的授權。兩個資料庫就代表兩組使用者與團隊計數、兩組金鑰，以及兩份授權。

| 拓撲 | 資料庫 | 需要的授權 |
|---|---|---|
| 多區域，共用資料庫（本頁） | 1 | 1 |
| 每個區域各自獨立部署 | 每個區域 1 個 | 每個區域 1 份 |
| [高可用控制平面](./high_availability_control_plane.md)（BETA） | 每個 worker 1 個 | 每個 worker 1 份 |

如果您想要每個區域都有完全獨立的部署（自己的資料庫、Redis、master key 與授權），並由單一 UI 管理，請改用 [高可用控制平面](./high_availability_control_plane.md)（BETA、Enterprise），而不是本頁。它以全域一致性換取爆炸半徑隔離：某個區域的資料庫中斷不會影響另一個區域，但金鑰與預算不會跨區域共享。

## 需求 {#requirements}

每個區域中的每個 proxy 執行個體都必須共用下列項目。若這些項目在區域之間有任何差異，部署就會以難以除錯的方式出錯（無法解密已儲存憑證的執行個體、某個區域中驗證失敗的金鑰、座位限制在各處強制不一致）。

| 設定 | 必須為 | 原因 |
|---|---|---|
| `DATABASE_URL` | 每個區域使用相同的資料庫 | 金鑰、團隊、使用者、花費與授權座位數的單一事實來源 |
| `LITELLM_MASTER_KEY` | 每個區域都相同 | 金鑰會對共享資料庫進行驗證；master key 在各處都必須一致 |
| `LITELLM_SALT_KEY` | 每個區域都相同，且設定完成後不得變更 | 加密與解密儲存在資料庫中的 LLM 憑證。使用不同 salt key 的執行個體無法讀取已儲存的模型憑證 |
| `LITELLM_LICENSE` | 每個區域使用相同的授權金鑰 | 每個執行個體都會獨立驗證授權；一把金鑰可啟用所有執行個體 |
| `DISABLE_SCHEMA_UPDATE` | 所有 proxy 執行個體上的 `true` | Schema migration 必須且只能執行一次（作為一個 job），不能被每個區域中的每個執行個體競態執行 |

每個區域另外還要執行一個 Redis 執行個體，並在該區域的 proxy 設定中將其設定好（`router_settings` 與快取設定）。Redis 狀態是區域性的：速率限制與已快取回應都只屬於處理該請求的區域。

:::info

速率限制（key、team 和 user 的 TPM/RPM）是透過 Redis 強制執行。每個區域一個 Redis 時，100 RPM 的限制代表每個區域 100 RPM，而不是全域 100 RPM。若您需要嚴格的全域速率限制，所有執行個體都必須共用一個 Redis，這會讓遠端區域的請求路徑多一次跨區域往返。多數部署會接受每個區域各自強制執行。

:::

## 設定 {#setup}

以下步驟假設您已經可以部署單區域的正式 proxy（負載平衡器、proxy 執行個體、Postgres、Redis）。如果還沒有，請先從 [部署到雲端](./deploy_cloud.md) 和 [正式環境檢查清單](./prod.md) 開始。

### 1. 佈建共享資料庫 {#1-provision-the-shared-database}

在您的主要區域建立一個 PostgreSQL 資料庫，並使用 [Helm charts](./deploy_cloud.md#deploy-with-helm) 或 [Terraform modules](./deploy_cloud.md#deploy-with-terraform-aws-and-gcp) 中的 migration job，對其執行一次 schema migration。所有區域都會使用這個資料庫的連線字串。

### 2. 連接各區域的網路 {#2-connect-the-regions-networks}

次要區域中的 proxy 執行個體必須透過私有、已路由的連線連到主要區域的資料庫：AWS 上使用 [VPC peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html) 或 [Transit Gateway](https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html)，GCP 上使用 [VPC Network Peering](https://cloud.google.com/vpc/docs/vpc-peering)（具有區域子網路的全球 VPC 也可以），Azure 上使用 [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)。在資料庫的 security group 或 firewall 中，從每個次要區域的 proxy 子網路開放資料庫埠（5432），並要求連線使用 TLS（`sslmode=require`）；這些流量會跨越區域邊界。每一次來自次要區域的未快取資料庫讀取，都會支付跨區域往返成本，這也是第 4 步新增區域內讀複本的原因。

### 3. 在每個區域部署 proxy 執行個體 {#3-deploy-proxy-instances-in-each-region}

在每個區域部署 proxy 的方式與單一區域完全相同，只有兩個差異：將 `DATABASE_URL` 指向主要區域的資料庫，而不是區域內的資料庫；並且只在主要區域執行 schema migrations job（次要區域的 Helm values 中設為 `migrationJob.enabled: false`），如此一來某個區域的 rollout 就不會與另一個區域對共享 schema 的 migration 競態。請從同一個事實來源部署每個區域（單一 Helm values 檔案或 Terraform 設定，只依區域參數化），以避免各區域在版本或設定上漂移。

<Tabs>
<TabItem value="primary" label="主要區域（us-east-1）">

```bash
DATABASE_URL="postgresql://litellm:<password>@db.us-east-1.internal:5432/litellm?sslmode=require"
LITELLM_MASTER_KEY="sk-<same-everywhere>"
LITELLM_SALT_KEY="sk-<same-everywhere-never-rotate>"
LITELLM_LICENSE="<same-everywhere>"
DISABLE_SCHEMA_UPDATE="true"
REDIS_HOST="redis.us-east-1.internal"
REDIS_PORT="6379"
REDIS_PASSWORD="<regional>"
```

</TabItem>
<TabItem value="secondary" label="次要區域（eu-west-1）">

```bash
# Same database as the primary region
DATABASE_URL="postgresql://litellm:<password>@db.us-east-1.internal:5432/litellm?sslmode=require"
LITELLM_MASTER_KEY="sk-<same-everywhere>"
LITELLM_SALT_KEY="sk-<same-everywhere-never-rotate>"
LITELLM_LICENSE="<same-everywhere>"
DISABLE_SCHEMA_UPDATE="true"
# Redis stays regional
REDIS_HOST="redis.eu-west-1.internal"
REDIS_PORT="6379"
REDIS_PASSWORD="<regional>"

# Optional: regional read replica (see next section)
DATABASE_URL_READ_REPLICA="postgresql://litellm:<password>@db-replica.eu-west-1.internal:5432/litellm"
```

</TabItem>
</Tabs>

### 4. 選用：新增區域內讀複本 {#4-optional-add-regional-read-replicas}

每個請求都會先向資料庫驗證其金鑰（並搭配記憶體快取，因此穩態流量不會在每次呼叫時都碰到資料庫）。次要區域仍可透過在區域內執行 PostgreSQL 讀複本，並設定 `DATABASE_URL_READ_REPLICA`，來降低資料庫讀取延遲。LiteLLM 會將唯讀查詢路由到該複本，而所有寫入則送往主資料庫。請參閱 [資料庫讀複本](./db_read_replica.md) 了解哪些路由到哪裡，以及如何處理 replication lag。

寫入（建立金鑰、設定變更、花費更新）一律送往主要區域的資料庫。花費更新會批次處理，因此跨區域寫入延遲不會落在請求路徑中。

### 5. 將用戶端路由到最近的區域 {#5-route-clients-to-the-nearest-region}

在各區域負載平衡器前放置以延遲為基礎或地理位置的 DNS：AWS 上使用 [Route 53 latency-based routing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-latency.html)，GCP 上使用 [Cloud DNS geolocation routing policies](https://cloud.google.com/dns/docs/routing-policies)，Azure 上使用 [Traffic Manager](https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-routing-methods) 或 [Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview)。用戶端使用單一主機名稱，並進入其最近的區域。

對每個區域針對 `/health/liveliness` 進行健康檢查，而不是 `/health/readiness`。Readiness 只要資料庫無法連線就會回傳 503，而且資料庫是共用的：一次故障會同時觸發所有區域的 readiness 檢查，並將所有區域一併從 DNS 轉送中移除；而就在那個時候，`allow_requests_on_db_unavailable` 本可讓它們繼續服務快取流量。Liveliness 則回報該區域的 proxy 是否正常運作，這正是 DNS 故障轉移決策所需要的資訊。

### 6. 驗證 {#6-verify}

1. 開啟主區域的 Admin UI（`https://llm.example.com/ui`），前往 **Virtual Keys**，並建立一個金鑰。

<Image img={require('../../img/ui_create_key_flow.gif')} alt="在 LiteLLM Admin UI 中建立 virtual key" />

2. 直接開啟次區域的 UI（`https://eu.llm.example.com/ui`），前往 **Test Key** playground，貼上您剛建立的金鑰，然後送出請求。這會成功，因為兩個區域都使用同一個資料庫驗證金鑰。

<Image img={require('../../img/ui_playground_navigation.png')} alt="LiteLLM Admin UI 中的 Test Key playground" />

3. 回到 **Virtual Keys**，確認該金鑰顯示的是您透過次區域送出的請求所產生的支出。

## 選用：專用管理實例 {#optional-dedicated-admin-instance}

預設情況下，每個實例同時提供 LLM 流量與管理流量（UI 與管理 API）。在多區域部署中，您可以將某個實例指定為僅供管理使用，並從各區域實例中移除管理介面。這可讓管理存取只經由單一主機名稱，並降低提供 LLM 流量之實例的攻擊面。

:::info

`DISABLE_ADMIN_ENDPOINTS` 和 `DISABLE_LLM_API_ENDPOINTS` 是 Enterprise 功能。[Enterprise Pricing](https://www.litellm.ai/#pricing)

:::

<Tabs>
<TabItem value="admin" label="管理實例">

```bash
# Serves the UI and management APIs, refuses LLM traffic
DISABLE_LLM_API_ENDPOINTS="true"
DATABASE_URL="postgresql://...@db.us-east-1.internal:5432/litellm"
LITELLM_MASTER_KEY="sk-<same-everywhere>"
```

</TabItem>
<TabItem value="worker" label="區域實例">

```bash
# Serve LLM traffic, refuse admin traffic
DISABLE_ADMIN_UI="true"
DISABLE_ADMIN_ENDPOINTS="true"
DATABASE_URL="postgresql://...@db.us-east-1.internal:5432/litellm"
LITELLM_MASTER_KEY="sk-<same-everywhere>"
```

</TabItem>
</Tabs>

| 變數 | 預設值 | 當 `true` 時的影響 |
|---|---|---|
| `DISABLE_ADMIN_UI` | `false` | `/ui` 的網頁 UI 會無法使用 |
| `DISABLE_ADMIN_ENDPOINTS` | `false` | 管理端點（`/key/*`、`/user/*`、`/team/*`、`/model/*`）會回傳錯誤；LLM 端點、`/health`，以及 `/metrics` 會繼續運作 |
| `DISABLE_LLM_API_ENDPOINTS` | `false` | LLM 端點（`/chat/completions`、`/v1/*`、provider pass-through routes）會回傳錯誤；管理端點會繼續運作，且 `/models` 仍可使用，因此 UI 可以列出模型 |

## 常見問題 {#faq}

**我真的需要多區域嗎？**
通常不需要。單區域部署搭配多 AZ 資料庫與 Redis，已足以在可用區故障時維持運作；請參閱 [Production Best Practices](./prod.md)。當您需要為遠端使用者降低延遲，或需要跨區域災難復原時，再新增區域。

**多區域需要 Enterprise 授權嗎？**
共用資料庫拓樸本身可在開源 proxy 上執行。Enterprise 功能在各區域之間由同一份授權涵蓋，詳見 [Licensing across regions](#licensing-across-regions)。

**如果主區域的資料庫故障會怎樣？**
所有區域都會失去資料庫存取：金鑰驗證會回退到快取，而管理操作會失敗，直到資料庫恢復。資料庫是此架構中的單一耦合點。設定 `general_settings.allow_requests_on_db_unavailable: true`，讓 proxy 在故障期間仍可為已快取的金鑰繼續提供流量（請參閱 [graceful DB unavailability](./prod.md#6-if-running-litellm-on-vpc-gracefully-handle-db-unavailability)），以具備自動故障轉移的多 AZ 方式執行資料庫；如果這樣仍不足以提供隔離，則可考慮改用 [High Availability Control Plane](./high_availability_control_plane.md)。

**我可以在不同區域執行不同版本的 LiteLLM 嗎？**
可以，但僅限於 rolling upgrade 期間。請勿在穩定狀態下執行混合版本；共用資料庫 schema 會遵循最新版本，而 migration 應在每次升級時只執行一次。
