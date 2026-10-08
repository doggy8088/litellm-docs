import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 端點活動 {#endpoint-activity}

直接在儀表板中追蹤並視覺化 API 端點使用情況。監控端點層級的活動分析、支出拆分與效能指標，以了解哪些端點接收最多流量，以及它們的表現如何。

## 總覽 {#overview}

端點活動可讓您自動追蹤個別 API 端點的支出與使用情況。每次透過 LiteLLM proxy 呼叫端點時，系統都會自動追蹤並彙總活動。這可讓您：

- 自動追蹤每個端點的支出
- 在 Admin UI 中查看端點層級的使用分析
- 依端點監控 token 消耗
- 分析每個端點的成功與失敗率
- 找出哪些端點的活動最多
- 查看顯示端點使用隨時間變化的趨勢資料

<Image img={require('../../img/ui_endpoint_activity.png')} />

## 端點活動的運作方式 {#how-endpoint-activity-works}

每當您透過 LiteLLM proxy 發出 API 請求時，端點活動都會**自動追蹤**。不需要額外設定，只要照常呼叫您的端點即可，系統就會追蹤活動。

### API 呼叫範例 {#example-api-call}

當您對任何端點發出請求時，系統會自動記錄活動：

```bash showLineNumbers title="Endpoint activity is automatically tracked"
# /chat/completions: 👈 ENDPOINT AUTOMATICALLY TRACKED
# Authorization: 👈 YOUR PROXY KEY
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $LITELLM_API_KEY" \
  --data '{
    "model": "{{openai_small}}",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ]
  }'
```

該端點（`/chat/completions`）將會自動追蹤以下資訊：

- token 數量（提示 token、完成 token、總 token）
- 該請求的支出
- 請求狀態（成功或失敗）
- 時間戳記與其他中繼資料

## 如何查看端點活動 {#how-to-view-endpoint-activity}

### 在 Admin UI 中查看活動 {#view-activity-in-admin-ui}

前往 Admin UI 中的端點活動分頁，查看端點層級分析：

#### 1. 存取端點活動 {#1-access-endpoint-activity}

前往 Admin UI（`PROXY_BASE_URL/ui/?login=success&page=new_usage`）中的 Usage 頁面，然後點選 **Endpoint Activity** 分頁。

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-10/67601fc0-8415-49b4-8e55-0673d37540c2/ascreenshot_f609a506dfe745c5aadccd332681c32d_text_export.jpeg)

#### 2. 查看端點分析 {#2-view-endpoint-analytics}

Endpoint Activity 儀表板提供：

- **端點使用表格**：查看所有端點及其彙總指標，包括：
  - 總請求數（成功與失敗）
  - 成功率百分比
  - 已消耗總 token 數
  - 每個端點的總支出
- **成功與失敗請求圖表**：依端點視覺化請求成功與失敗率
- **使用趨勢**：透過每日趨勢資料查看端點活動如何隨時間變化

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-10/41b2b158-3ab3-4154-a0d0-7233451d3f2b/ascreenshot_ff46db6e09b54ea9bf34ae9028aff58a_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-10/bce32f99-f0ba-4502-8a3a-76257ff5e47a/ascreenshot_2273d3a94acd42e983ad7d6436722c2a_text_export.jpeg)

#### 3. 了解端點指標 {#3-understand-endpoint-metrics}

每個端點會顯示以下指標：

- **成功請求數**：成功完成的請求數量
- **失敗請求數**：發生錯誤的請求數量
- **總請求數**：成功與失敗請求的總和
- **成功率**：成功請求所占百分比
- **總 token 數**：提示與完成 token 的總和
- **支出**：該端點所有請求的總成本

## 閘道請求計數 {#gateway-request-counts}

「**成功請求**」與「**失敗請求**」磁磚，以及其下方的「**依端點分類的閘道請求**」圖表，都是由 proxy 本身計算，而不是從 spend logs 推導而來。LiteLLM 的 request-metrics middleware 位於 ASGI 邊緣，會分類每個傳入的 LLM、MCP 與 A2A 請求，並記錄閘道回傳的狀態。這些計數會彙整到 `LiteLLM_DailyGatewayRequests` 表中，並以日期、類別與路由作為索引。此鍵值不包含呼叫端提供的任何內容，也沒有任何 per-key、per-user 或 per-deployment 維度，因此此表的成長只取決於您的部署服務了多少種路由類別以及已執行多久，絕不會隨流量成長

在邊緣進行計數會改變數字的意義。無論請求最終是否到達 LiteLLM 的 logging callbacks，系統都會記錄它，因此驗證遭拒、速率限制回應與提供者錯誤都會落在失敗欄位，而不會消失不見；每一種狀態都會被計數，而不只是 2xx。單一傳入請求也只會計數一次，不論 LiteLLM 為了服務它而向上游發出多少次呼叫，因此路由重試、備援與內部 fan-out 不會膨脹總數

計數會先累積在記憶體中，並以與 spend batch writer 相同的間隔提交，`proxy_batch_write_at` 預設為 10 秒，因此請求可能要幾秒後才會顯示。提交失敗時會併回並在下一次 flush 時重試，而不是被捨棄，且 accumulator 也會在關閉期間再排空一次。這一切都不受企業授權限制；任何已設定資料庫的部署都會記錄這些計數

### 為什麼閘道計數與依 key 與依模型的細分不同 {#why-gateway-counts-do-not-match-the-per-key-and-per-model-breakdowns}

Usage 頁面上的 per-key、per-model、per-provider 與 per-tag 面板，仍然讀取每日 spend 匯總，而這些匯總是在請求完成後由 spend logs 寫入。這兩種來源回答的是不同問題，因此不預期彼此完全一致

只有當請求進入足夠深、能夠被記錄時，才會存在一筆 spend log 資料列，且它會帶有服務該請求的 key、team 與 model。只要 proxy 有回應，就會產生一筆閘道計數，包括在 key 尚未解析或 model 尚未選定前就被拒絕的請求，這也是閘道表完全不包含 key 或 user 維度的原因。差異會朝兩個方向發生：閘道只計數已分類的 inference、MCP 與 A2A 流量，並將內部 fan-out 壓成一列；而 spend 匯總也涵蓋已記錄的管理與 passthrough 請求，並分別記錄每一次上游嘗試。請將磁磚用於流量量體，將細分用於歸屬 spend

### `/gateway/daily/activity` {#gateway-daily-activity}

閘道計數由其專屬 endpoint 提供。由於底層表是整個部署共用，且沒有 per-key 或 per-user 維度，因此僅限於 `proxy_admin` 與 `proxy_admin_viewer` 角色；任何其他呼叫端都會得到 403。在 Admin UI 中，非管理員只會看到磁磚中的 spend 衍生計數，而不會看到閘道圖表。若管理員的部署尚未記錄任何閘道計數，也會採用同樣的回退行為

`start_date` 與 `end_date` 皆為選填，並接受 `YYYY-MM-DD`；若省略則回傳最近 30 天

```shell title="Gateway request counts" showLineNumbers
curl -L -X GET 'http://localhost:4000/gateway/daily/activity?start_date=2026-07-28&end_date=2026-08-04' \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json title="Gateway request counts response" showLineNumbers
{
  "total_successful_requests": 1284,
  "total_failed_requests": 37,
  "by_date": [
    { "date": "2026-08-03", "successful_requests": 612, "failed_requests": 11 },
    { "date": "2026-08-04", "successful_requests": 672, "failed_requests": 26 }
  ],
  "by_route": [
    { "category": "llm", "route": "/chat/completions", "successful_requests": 1103, "failed_requests": 31 },
    { "category": "llm", "route": "/embeddings", "successful_requests": 141, "failed_requests": 4 },
    { "category": "mcp", "route": "/mcp", "successful_requests": 40, "failed_requests": 2 }
  ]
}
```

`by_date` 由舊到新排序，而 `by_route` 則依成功請求數由高到低排序。`category` 其值為 `llm`、`mcp` 或 `a2a` 之一，而 `route` 是分類器指派的標準化路由，而不是原始請求路徑，因此 `/v1/chat/completions` 與 `/chat/completions` 會合併到同一列。Admin UI 中的圖表會顯示前 15 條路由

## 使用案例 {#use-cases}

### 效能監控 {#performance-monitoring}

監控端點健康狀態與效能：

- 找出失敗率高的端點
- 追蹤哪些端點接收最多流量
- 依端點監控 token 消耗模式
- 偵測端點使用異常

### 成本最佳化 {#cost-optimization}

了解各端點之間的支出分布：

- 找出高成本端點
- 最佳化昂貴的端點
- 依端點使用情況分配預算
- 追蹤隨時間變化的成本趨勢

---

## 相關功能 {#related-features}

- [客戶使用量](./customer_usage.md) - 追蹤個別客戶的 spend 與使用量
- [成本追蹤](./cost_tracking.md) - 成本追蹤與分析
- [Spend Logs](./cost_tracking.md#-spend-logs-api---individual-transaction-logs) - 詳細的請求層級 spend logs
