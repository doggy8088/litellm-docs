---
title: "設定與疑難排解"
description: "設定獨立 Lens 的憑證、網路與選用的 LiteLLM 連線。"
slug: "/proxy/lens/deployment/configuration"
---

# 設定與疑難排解 {#configuration-and-troubleshooting}

部署設定請以 [Lens 安裝指南](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md) 為準。如需協助設定現有專案，[幫我設定](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md) 提供了適用於獨立 Lens、閘道連線與外部儲存的提示

## 憑證 {#credentials}

| 憑證 | 用途 |
| --- | --- |
| Lens 管理員 token | 登入獨立 Lens 並管理其 API |
| Lens 追蹤金鑰 | 在其指派的範圍下上傳代理程式遙測 |
| ClickHouse 憑證 | 讓 Lens 初始化、讀取與寫入其儲存 |
| 分析或評估提供者金鑰 | 讓 Lens 呼叫設定的提供者 |
| 閘道服務與簽署憑證 | 驗證選用的內部連線與委派身分 |
| LiteLLM 使用者或模型金鑰 | 依其現有的驗證與模型規則存取閘道 |

獨立啟動器會在 `deploy/lens/.env` 中建立其管理員 token 與資料庫密碼。獨立的追蹤安裝需要這些憑證與一把追蹤金鑰。調查、Signals 與評估評判需要各自對應的提供者設定。只有在連接 LiteLLM 時才需要閘道連線密鑰

請將部署密鑰保持私密，並與您的復原資料一起保存。閘道保留其自身的資料庫與加密金鑰；這些與 Lens 的 ClickHouse 儲存是分開的

## 發布端點 {#publish-trace-endpoint}

將 `LENS_PUBLIC_URL` 設為瀏覽器來源，例如 `https://lens.example.com`。啟動器將它用於其 UI、產生的追蹤位址與安全的工作階段 cookie。以 [HTTPS 伺服器範例](./server.md#3-route-https-traffic) 將獨立 UI 與 API 轉送到 Lens 連接埠 4318

選用的獨立擷取位址在 Lens 上使用 `LITELLM_LENS_PUBLIC_URL`，或在其 Helm chart 中使用 `ingestionUrl`。它預設為 Lens 公開 URL。保留現有的路徑前綴（例如 `/lens-ingest`），並省略 `/v1/traces`；設定會加上該後綴

閘道另外使用 `LITELLM_LENS_URL` 作為其私有連線，並使用 `LITELLM_LENS_PUBLIC_URL` 作為顯示給使用者的追蹤位址。請從實際的閘道、瀏覽器與代理程式網路驗證可達性

## 搭配 Helm 使用 ingress {#dedicated-ingress}

獨立的 Lens chart 在頂層使用 `publicUrl`、選用的 `ingestionUrl` 與 `ingress`。其 ingress 可以提供獨立 UI 與 API。請使用 [Lens Helm 指南](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md) 設定主機名稱、TLS 與 ingress 控制器

LiteLLM chart 透過 `lens.enabled`、`lens.url`、`lens.publicUrl` 與 Secret 參考連接到獨立的 Lens 部署。請參閱[連接現有的 LiteLLM 部署](./kubernetes.md#existing-deployment)。該 chart 不接受 `lensWorker`，也不會部署 Lens 與 ClickHouse。

## 連接 Docker 網路 {#docker-network}

容器需要可達的服務位址。閘道容器的 `127.0.0.1` 指向它自己。為 Lens 與閘道提供共用的使用者自訂網路（保留 Lens 現有的預設與儲存網路），或透過兩者都可達的另一個私有位址路由

在不更改的情況下檢查現有的閘道網路：

```sh
docker inspect "<your-litellm-container>" --format '{{json .NetworkSettings.Networks}}'
```

讓任何共用網路參考在兩份 Compose 設定中都持久存在，包括每次重新建立服務時的網路覆寫。私有閘道 URL 請使用 Lens 的服務名稱與連接埠，例如 `http://lens:4318`。憑證與應用程式設定請遵循[將 Lens 加入 LiteLLM](./litellm.md)

## 設定參考 {#configuration-reference}

| 設定 | 服務 | 含義 |
| --- | --- | --- |
| `LENS_ADMIN_TOKEN` | Lens | 獨立管理員憑證 |
| `LENS_PUBLIC_URL` | Lens | 瀏覽器來源與預設擷取位址 |
| `LITELLM_LENS_PUBLIC_URL` | Lens 與閘道 | 供代理程式擷取的公開位址 |
| `LITELLM_LENS_URL` | 閘道 | 私有 Lens API 基礎位址 |
| `LITELLM_LENS_SERVICE_TOKEN` | Lens 與閘道 | 共用的內部服務憑證 |
| `LENS_GATEWAY_SECRET` | Lens 與閘道 | 共用的委派身分簽署憑證 |
| `CLICKHOUSE_URL`，或 host/user/password 設定 | Lens | ClickHouse HTTP 連線 |
| `CLICKHOUSE_DATABASE` | Lens | 選取的資料庫，獨立 Lens 中預設為 `lens` |
| `AGENT_TRACING_RETENTION_DAYS` | Lens | Trace 保留，預設 14 天 |

現有的閘道整合可以保留 `litellm` ClickHouse 資料庫。請保留實際存放您記錄的資料庫。伺服器端提供者設定請參閱[分析模型](https://github.com/BerriAI/lens/blob/main/docs/analysis.md) 與 [Signals](https://github.com/BerriAI/lens/blob/main/docs/signals.md)

## 可用性與擴展 {#availability-and-scaling}

獨立 Lens 在接受請求之前，會先初始化其 ClickHouse 結構描述與狀態。缺少 Keeper 設定或權限不足會妨礙就緒。請參閱[外部儲存需求](./storage.md#external-clickhouse)

多個 Lens 複本可以共用一個受支援的 ClickHouse 伺服器。Keeper 協調狀態發布；它不會在伺服器之間複寫本機酬載資料表。外部儲存並不會使多伺服器負載平衡或自動容錯移轉成為受支援的功能

閘道透過有上限的非同步佇列轉送遙測。如果 Lens 無法使用，一般的閘道推論仍會繼續，而遙測在重試或佇列上限後可能會延遲或被捨棄。代理程式匯出器有自己的重試行為。請驗證您選定的部署與匯出器在中斷時的行為

## 疑難排解 {#troubleshooting}

在原始碼 Compose 安裝中：

```sh
docker compose -f deploy/lens/compose.yaml ps
docker compose -f deploy/lens/compose.yaml logs --tail=100 lens clickhouse
curl --fail http://localhost:4318/health/ready
```

| 您看到的現象 | 要檢查的項目 |
| --- | --- |
| Lens 在就緒前失敗 | ClickHouse 連線、KeeperMap 設定與結構描述/寫入權限 |
| 閘道回報 Lens 無法使用 | 私有 API URL、相符的服務與簽署憑證、相容的合約與 Lens 就緒狀態 |
| 代理程式無法上傳 | 可達的擷取位址、保留的前綴與有效的追蹤金鑰 |
| 透過 HTTPS 的獨立登入失敗 | 正確的 `LENS_PUBLIC_URL`、轉送的 HTTPS 資訊與保留的管理員 token |
| 未設定分析提供者 | 套用分析模型設定及其伺服器端憑證，重新啟動並檢查 **Settings > Analysis** |
| 更換後某個已儲存的 trace 遺失 | 驗證原始資料庫、持久磁碟區與目前使用者的範圍 |

解決連線後，請完成[第一個 trace 檢查](../deployment.md#check-the-installation)。健康回應並不驗證已儲存的資料或提供者存取
