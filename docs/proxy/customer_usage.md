import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 客戶使用情況 {#customer-usage}

直接在儀表板中追蹤並視覺化終端使用者支出。監控客戶層級的使用分析、支出記錄與活動指標，以了解您的客戶如何使用您的 LLM 服務。

此功能在 **v1.80.8-stable 及以上版本** 可用。

## 概覽 {#overview}

Customer Usage 讓您能透過在 API 請求中傳遞 ID，追蹤個別客戶（終端使用者）的支出與使用情況。這讓您可以：

- 自動追蹤每位客戶的支出
- 在 Admin UI 中查看客戶層級的使用分析
- 依客戶 ID 篩選支出記錄與活動指標
- 為每位客戶設定預算與速率限制
- 監控客戶使用模式與趨勢

<Image img={require('../../img/customer_usage.png')} />

## 如何追蹤支出 {#how-to-track-spend}

可在 API 請求中加入 `user` 欄位，或傳遞客戶 ID 標頭來追蹤客戶支出。系統會自動追蹤客戶 ID，並將其與該請求的所有支出關聯。

<Tabs>
<TabItem value="body" label="請求主體" default>

### 使用請求主體 {#using-request-body}

使用包含您客戶 ID 的 `user` 欄位發出 `/chat/completions` 呼叫：

```bash showLineNumbers title="Track spend with customer ID in body"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk-1234' \
  --data '{
    "model": "gpt-3.5-turbo",
    "user": "customer-123",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ]
  }'
```

</TabItem>
<TabItem value="header" label="請求標頭">

### 使用請求標頭 {#using-request-headers}

您也可以透過 HTTP 標頭傳遞客戶 ID。這對支援自訂標頭但不允許修改請求主體的工具很有用（例如帶有 `ANTHROPIC_CUSTOM_HEADERS` 的 Claude Code）。

LiteLLM 會自動辨識這些標準標頭（無需設定）：
- `x-litellm-customer-id`
- `x-litellm-end-user-id`

```bash showLineNumbers title="Track spend with customer ID in header"
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'x-litellm-customer-id: customer-123' \
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

#### 與 Claude Code 搭配使用 {#using-with-claude-code}

Claude Code 可透過 `ANTHROPIC_CUSTOM_HEADERS` 環境變數支援自訂標頭。請將其設定為傳遞您的客戶 ID：

```bash title="Configure Claude Code with customer tracking"
export ANTHROPIC_BASE_URL="http://0.0.0.0:4000/v1/messages"
export ANTHROPIC_API_KEY="sk-1234"
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-customer-id: my-customer-id"
```

現在來自 Claude Code 的所有請求都會自動將支出記錄在 `my-customer-id` 之下。

</TabItem>
</Tabs>

客戶 ID 會隨著新支出自動 upsert 到資料庫中。如果客戶 ID 已存在，支出將會累加。

### 使用 OpenWebUI 的範例 {#example-using-openwebui}

請參閱 [Open WebUI 教學](../tutorials/openweb_ui.md)，以取得將 Open WebUI 連接到 LiteLLM 並追蹤客戶使用情況的詳細說明。

## 如何查看支出 {#how-to-view-spend}

### 在 Admin UI 中查看支出 {#view-spend-in-admin-ui}

前往 Admin UI 中的 Customer Usage 分頁，以查看客戶層級的支出分析：

#### 1. 存取 Customer Usage {#1-access-customer-usage}

前往 Admin UI（`PROXY_BASE_URL/ui/?login=success&page=new_usage`）的 Usage 頁面，並點選 **Customer Usage** 分頁。

<Image img={require('../../img/customer_usage_ui_navigation.png')} />

#### 2. 查看客戶分析 {#2-view-customer-analytics}

Customer Usage 儀表板提供：

- **每位客戶的總支出**：查看所有客戶彙總後的支出
- **每日支出趨勢**：查看客戶支出如何隨時間變化
- **模型使用分解**：了解每位客戶使用哪些模型
- **活動指標**：追蹤每位客戶的請求、token 與成功率

<Image img={require('../../img/customer_usage_analytics.png')} />

#### 3. 依客戶篩選 {#3-filter-by-customer}

使用客戶篩選下拉選單查看特定客戶的支出：

- 從下拉選單選取一個或多個客戶 ID
- 查看篩選後的分析、支出記錄與活動指標
- 比較不同客戶之間的支出

<Image img={require('../../img/customer_usage_filter.png')} />

## 使用案例 {#use-cases}

### 客戶計費 {#customer-billing}

追蹤每位客戶的支出，以便精準向您的終端使用者收費：

- 監控個別客戶使用情況
- 根據實際支出產生帳單
- 為每位客戶設定支出上限

### 使用分析 {#usage-analytics}

了解不同客戶如何使用您的服務：

- 識別高價值客戶
- 分析使用模式
- 最佳化資源配置

---

## 相關功能 {#related-features}

- [客戶／終端使用者預算](./customers.md) - 為客戶設定預算與速率限制
- [成本追蹤](./cost_tracking.md) - 全面的成本追蹤與分析
- [計費](./billing.md) - 根據客戶的使用情況向其收費
