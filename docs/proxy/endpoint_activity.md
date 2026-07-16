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
curl -X POST 'http://0.0.0.0:4000/chat/completions' \ # 👈 ENDPOINT AUTOMATICALLY TRACKED
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk-1234' \ # 👈 YOUR PROXY KEY
  --data '{
    "model": "gpt-3.5-turbo",
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

- [Customer Usage](./customer_usage.md) - 追蹤個別客戶的支出與使用情況
- [Cost Tracking](./cost_tracking.md) - 全面的成本追蹤與分析
- [Spend Logs](./cost_tracking.md#-spend-logs-api---individual-transaction-logs) - 詳細的請求層級支出記錄
