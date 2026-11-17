import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 資料庫讀取複本 {#database-read-replica}

LiteLLM Proxy 可將唯讀查詢路由到獨立的資料庫端點，同時
寫入仍會送往主要資料庫。這對於提供獨立 reader／writer 端點的
Aurora 風格叢集很有用，將讀取導向 reader 可讓 writer 保留給交易型工作負載。

## 快速開始 {#quick-start}

請將 `DATABASE_URL_READ_REPLICA` 與現有的 `DATABASE_URL` 一起設定：

```shell
export DATABASE_URL=postgresql://user:pass@writer.db.example.com:5432/litellm
export DATABASE_URL_READ_REPLICA=postgresql://user:pass@reader.db.example.com:5432/litellm
```

Proxy 會在啟動時自動偵測環境變數，並將
內部 Prisma 用戶端切換為在兩個
端點之間分流流量的路由模式。若 `DATABASE_URL_READ_REPLICA` 未設定，Proxy 會繼續使用
單一資料庫行為；不需要其他設定。

## 會被路由的內容 {#what-gets-routed}

| Operation | Destination |
| --- | --- |
| `find_first`、`find_many`、`find_unique`（以及 `_or_raise` 變體） | Reader |
| `count`、`group_by` | Reader |
| `query_raw`、`query_first` | Reader |
| `create`、`update`、`upsert`、`delete`、`update_many`、`delete_many` | Writer |
| `execute_raw` | Writer |
| Transactions (`tx`、`batch_`) | Writer |

在程式碼中發起的讀取（例如虛擬金鑰查詢、團隊成員資格、花費
查詢）會在不變更呼叫端的情況下派送到讀取端。路由
包裝器會攔截逐模型的 action 存取器，並依方法選擇
後端。

## Reader 降級 {#reader-degradation}

如果在啟動時無法連線到 reader 端點，Proxy 會記錄警告並
改為在讀取時回退到 writer，而不是啟動失敗：

```
Failed to connect to read replica DB: <error>. Falling back to the writer for
reads until the reader is reachable.
```

若 reader 在重新連線週期中失敗，也會套用相同的回退。下一次成功
重建 reader 後，降級旗標會被清除，讀取會再次開始
命中 reader。

這表示：啟用讀取複本路由**絕不會降低可用性**。最糟
只會退化為單一資料庫效能。

## 基於權杖的資料庫驗證 {#token-based-database-authentication}

當 `IAM_TOKEN_DB_AUTH=True`（AWS RDS IAM）或 `AZURE_POSTGRESQL_AUTH=True`
（Microsoft Entra ID）時，寫入端與讀取端都會各自重新整理其權杖，
並且都會在各自到期前進行。您可以將讀取端提供為單一 `DATABASE_URL_READ_REPLICA`，或由元件變數
（`DATABASE_HOST_READ_REPLICA`、`DATABASE_USER_READ_REPLICA` 等）組成；權杖重新整理
路徑會重新解析產生的讀取端 URL，因此啟動後只會輪替權杖。

在 AWS 上，這會自然搭配 Aurora 的讀取端點，該端點會解析到叢集中的
讀取執行個體。在 Azure 上，則會搭配 Azure Database for PostgreSQL Flexible Server 的
讀取複本。

### 跨區域的 RDS IAM 驗證 {#rds-iam-auth-across-regions}

在 `IAM_TOKEN_DB_AUTH=True` 時，LiteLLM 會獨立簽署寫入端與讀取端的權杖，
因此寫入端與跨區域的讀取複本可以各自在自己的區域中簽署。每個連線的簽署區域
依以下順序解析：該連線的覆寫值、其 RDS 主機名稱中的區域，接著是處理程序的
AWS 區域（`AWS_REGION_NAME`，並以 `AWS_REGION` 作為備援）。寫入端的覆寫值是
`AWS_RDS_REGION`，讀取端的覆寫值是 `AWS_RDS_READ_REPLICA_REGION`。讀取端
永遠不會繼承 `AWS_RDS_REGION`，因此只設定寫入端的覆寫值時，讀取端會維持
自己的解析路徑。空白或僅含空白字元的值視為未設定，解析會繼續使用下一個來源。

對於標準的 RDS 端點，不需要任何覆寫值；主機名稱本身已包含區域。當簽署區域
必須與主機名稱所暗示的不同時，才需要設定覆寫值：

```shell
export IAM_TOKEN_DB_AUTH=true
export DATABASE_HOST=writer.abc123.us-east-1.rds.amazonaws.com
export DATABASE_PORT=5432
export DATABASE_USER=iam_user
export DATABASE_NAME=litellm
export DATABASE_URL_READ_REPLICA=postgresql://iam_user@reader.abc123.ap-northeast-1.rds.amazonaws.com:5432/litellm?sslmode=require
export AWS_RDS_REGION=us-east-1
export AWS_RDS_READ_REPLICA_REGION=ap-northeast-1
```

明確的覆寫值即使與主機名稱不一致也會優先採用，因此錯誤的區域會使該連線的
驗證失敗。讀取端失敗時，會依上方的退化行為改由寫入端處理讀取；寫入端失敗時
則會使啟動失敗。這些覆寫值適用於啟動時的權杖簽發與每一次更新，包括透過
`DATABASE_HOST_READ_REPLICA` 組裝的讀取端，以及容器內 PgBouncer 後方的
寫入端。它們不會影響 Bedrock 或其他 AWS 服務的區域、密碼驗證或 Azure
Entra 驗證。

區域覆寫值只選擇簽署區域；不會改寫權杖簽署所用的主機名稱。AWS 在產生 IAM
權杖時需要實際的 RDS 端點，因此自訂 DNS 名稱（例如 Route 53 記錄）在連線
設定中仍需要標準的 RDS 端點。TLS 主機名稱驗證與區域選擇無關。


## Kubernetes / Helm {#kubernetes--helm}

[LiteLLM chart](./deploy/helm.md) 可接受完整的 reader URL 或分開的連線欄位。兩種情況下都請保留您現有的 `database.writer` 設定。

<Tabs>

<TabItem value="secret" label="從 Kubernetes secret 取得（建議）">

當 reader URL 內嵌憑證時，請使用 `urlKey` 從既有的
`database.reader.passwordSecret.name` Kubernetes Secret 取得。這樣可避免
URL 出現在渲染後的 pod spec 與 Helm release secret 中。

```yaml
database:
  reader:
    passwordSecret:
      name: litellm-reader-secret
      urlKey: read-url # contains the complete PostgreSQL connection URL
```

</TabItem>

<TabItem value="plain" label="分開的連線欄位">

設定 reader 主機與資料庫名稱。引用包含其使用者名稱與密碼的 Secret：

```yaml
database:
  reader:
    host: reader.aurora.local
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-reader-secret
      usernameKey: username
      passwordKey: password
```

若使用權杖驗證，請在 `database.writer` 與 `database.reader` 兩者上都設定 `useIAMAuth: true` 或 `useAzureEntraAuth: true`，並搭配相符的 workload identity。Secret 提供使用者名稱。執行環境會取得密碼權杖。每個部署請只使用一種驗證方法。請勿將分開的連線欄位與 `urlKey` 併用。

</TabItem>

</Tabs>

## Docker Compose {#docker-compose}

將 env var 加入您的 service：

```yaml
services:
  litellm:
    environment:
      DATABASE_URL: postgresql://user:pass@writer:5432/litellm
      DATABASE_URL_READ_REPLICA: postgresql://user:pass@reader:5432/litellm
```

## 何時啟用 {#when-to-enable-it}

read-replica 路由在以下情況最有用：

- 您使用 Aurora（或其他具有 reader 端點的受管 Postgres），並且
  想將 spend / team / key 查詢從 writer 轉移出去。
- 讀取流量占大宗，且 writer 的 CPU / connections 受限。
- 您想要地理位置上更接近的讀取（reader 比 proxy 更近）。

在以下情況則**沒有**幫助：

- 您的主節點與複本是同一個實體端點。
- 您執行的是沒有複本的單節點 Postgres。
- 複寫延遲會使您的應用程式中的一致性假設失效。請注意，
  所有讀取都會路由到讀取端，包括緊接在寫入之後的讀取。

## 複寫延遲 {#replication-lag}

Proxy 不會為讀取端點實作讀寫後一致性。若您的複寫延遲相當明顯（>100ms），且您有先寫入再立刻讀取同一列的流程，這些讀取可能會看到過期資料。
`query_raw` 與 `query_first` 在 Proxy 的 Prisma 用戶端上都會和其他讀取一樣路由到讀取端，因此需要讀取己寫一致性的程式碼應該透過 `WriterPinnedClient`（來自 `litellm.proxy.db.routing_prisma_wrapper`）讀取，或在交易（`tx`）中讀取，兩者都會在寫入端執行

## 相關 env vars {#related-env-vars}

| 環境變數 | 說明 |
| --- | --- |
| `DATABASE_URL` | 寫入端連線 URL（必填）。 |
| `DATABASE_URL_READ_REPLICA` | 讀取端連線 URL（選用）。未設定時，所有讀取都會送到寫入端。 |
| `IAM_TOKEN_DB_AUTH` | 當 `True` 時，寫入端與讀取端都會自動重新整理 AWS RDS IAM 權杖。 |
| `AZURE_POSTGRESQL_AUTH` | 當 `True` 時，寫入端與讀取端都會自動重新整理 Microsoft Entra ID 權杖。 |

請參閱 [environment variables - Reference](./config_settings#environment-variables---reference)
以取得完整清單。
