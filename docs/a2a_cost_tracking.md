import Image from '@theme/IdealImage';

# A2A 代理程式成本追蹤 {#a2a-agent-cost-tracking}

LiteLLM 支援為 A2A 代理程式新增自訂成本追蹤。您可以設定：

- **每次查詢固定成本** - 針對每個代理程式請求收取固定成本
- **依輸入/輸出 token 計費** - 根據 token 使用量變動的成本

這可讓您在整個組織中追蹤並歸屬代理程式使用成本，方便查看各團隊或專案在代理程式呼叫上的支出。

## 快速開始 {#quick-start}

### 1. 前往 Agents {#1-navigate-to-agents}

從側邊欄點選「Agents」以開啟代理程式管理頁面。

![前往 Agents](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/f9ac0752-6936-4dda-b7ed-f536fefcc79a/ascreenshot.jpeg?tl_px=208,326&br_px=2409,1557&force_format=jpeg&q=100&width=1120.0)

### 2. 建立新的代理程式 {#2-create-a-new-agent}

點選「+ Add New Agent」以開啟建立表單。您需要提供幾個基本細節：

- **Agent Name** - 您代理程式的唯一識別碼（用於 API 呼叫）
- **Display Name** - 在 UI 中顯示的人類可讀名稱

![輸入 Agent Name](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/f5bacfeb-67a0-4644-a400-b3d50b6b9ce5/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1463&force_format=jpeg&q=100&width=1120.0)

![輸入 Display Name](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/6db6422b-fe85-4a8b-aa5c-39319f0d4621/ascreenshot.jpeg?tl_px=0,27&br_px=2617,1490&force_format=jpeg&q=100&width=1120.0)

### 3. 設定成本設定 {#3-configure-cost-settings}

向下捲動並點選「Cost Configuration」以展開成本設定面板。您可以在這裡定義代理程式使用要收取多少費用。

![點選 Cost Configuration](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/a3019ae8-629c-431b-b2d8-2743cc517be7/ascreenshot.jpeg?tl_px=0,653&br_px=2201,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=388,416)

### 4. 設定每次查詢成本 {#4-set-cost-per-query}

輸入每次查詢的成本金額（以美元計）。例如，輸入 `0.05` 表示對此代理程式的每次請求將收取 $0.05。

![設定每次查詢成本](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/91159f8a-1f66-4555-a166-600e4bdecc68/ascreenshot.jpeg?tl_px=0,653&br_px=2201,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=372,281)

![輸入成本金額](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/2add2f69-fd72-462e-9335-1e228c7150da/ascreenshot.jpeg?tl_px=0,420&br_px=2617,1884&force_format=jpeg&q=100&width=1120.0)

### 5. 建立代理程式 {#5-create-the-agent}

完成所有設定後，點選「Create Agent」以儲存。您的代理程式現在已可使用，且已啟用成本追蹤。

![建立代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/1876cf29-b8a7-4662-b944-2b86a8b7cd2e/ascreenshot.jpeg?tl_px=416,653&br_px=2618,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=706,523)

## 測試成本追蹤 {#testing-cost-tracking}

讓我們透過 Playground 傳送測試請求，確認成本追蹤是否正常運作。

### 1. 前往 Playground {#1-go-to-playground}

點選側邊欄中的「Playground」以開啟互動式測試介面。

![前往 Playground](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/7d5d8338-6393-49a5-b255-86aef5bf5dfa/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=41,98)

### 2. 選取 A2A Endpoint {#2-select-a2a-endpoint}

預設情況下，Playground 使用 chat completions endpoint。若要測試您的代理程式，請點選「Endpoint Type」並從下拉選單中選取 `/v1/a2a/message/send`。

![選取 Endpoint Type](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/4d066510-0878-4e0b-8abf-0b074fe2a560/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=325,238)

![選取 A2A Endpoint](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/fe2f8957-4e8a-4331-b177-d5093480cf60/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=333,261)

### 3. 選取您的代理程式 {#3-select-your-agent}

現在從代理程式下拉選單中選取您剛建立的代理程式。您應該會看到它以顯示名稱列出。

![選取代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/8c7add70-fe72-48cb-ba33-9f53b989fcad/ascreenshot.jpeg?tl_px=0,150&br_px=2201,1381&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=287,277)

### 4. 傳送測試訊息 {#4-send-a-test-message}

輸入訊息並按下送出。您可以使用建議的提示，或自行撰寫。

![傳送訊息](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/2c16acb1-4016-447e-88e9-c4522e408ea2/ascreenshot.jpeg?tl_px=15,653&br_px=2216,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,443)

當代理程式回應後，該請求會以您設定的成本記錄下來。

![代理程式回應](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/2dcf7109-0be4-4d03-8333-ef45759c70c9/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=494,273)

## 在記錄中查看成本 {#viewing-cost-in-logs}

現在讓我們確認成本是否確實已被追蹤。

### 1. 前往記錄 {#1-navigate-to-logs}

點選側邊欄中的「Logs」以查看所有近期請求。

![前往記錄](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/c96abf3c-f06a-4401-ada6-04b6e8040453/ascreenshot.jpeg?tl_px=0,118&br_px=2201,1349&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=41,277)

### 2. 查看成本歸屬 {#2-view-cost-attribution}

在清單中找到您的代理程式請求。您會看到成本欄位顯示您設定的金額。此成本現在已歸屬到發出該請求的 API 金鑰，因此您可以按團隊或專案追蹤支出。

![在記錄中查看成本](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/1ae167ec-1a43-48a3-9251-43d4cb3e57f5/ascreenshot.jpeg?tl_px=335,11&br_px=2536,1242&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,277)

## 在用量頁面查看支出 {#view-spend-in-usage-page}

前往 Admin UI 中的 Agent Usage 分頁以查看代理程式層級的支出分析：

### 1. 存取 Agent Usage {#1-access-agent-usage}

前往 Admin UI（`PROXY_BASE_URL/ui/?login=success&page=new_usage`）中的 Usage 頁面，並點選 **Agent Usage** 分頁。

<Image img={require('../img/agent_usage_ui_navigation.png')} />

### 2. 查看代理程式分析 {#2-view-agent-analytics}

Agent Usage 儀表板提供：

- **每個代理程式的總支出**：查看所有代理程式的彙總支出
- **每日支出趨勢**：查看代理程式支出如何隨時間變化
- **模型使用明細**：了解每個代理程式使用哪些模型
- **活動指標**：追蹤每個代理程式的請求、token 與成功率

<Image img={require('../img/agent_usage_analytics.png')} />

### 3. 依代理程式篩選 {#3-filter-by-agent}

使用代理程式篩選下拉選單查看特定代理程式的支出：

- 從下拉選單中選取一個或多個代理程式 ID
- 查看篩選後的分析、支出記錄與活動指標
- 比較不同代理程式之間的支出

<Image img={require('../img/agent_usage_filter.png')} />

## 成本設定選項 {#cost-configuration-options}

您可以依據您的定價模型混合搭配這些選項：

| 欄位                         | 說明                               |
| ---------------------------- | ---------------------------------- |
| **每次查詢成本 ($)**         | 針對每個代理程式請求收取的固定成本 |
| **每個輸入 token 成本 ($)**  | 每處理一個輸入 token 的成本        |
| **每個輸出 token 成本 ($)**  | 每產生一個輸出 token 的成本        |

對大多數使用情境而言，每次查詢固定成本最為簡單。若您的代理程式成本會因輸入/輸出長度而有顯著差異，請使用以 token 為基礎的定價。

## 相關內容 {#related}

- [A2A Agent Gateway](./a2a.md)
- [Spend Tracking](./proxy/cost_tracking.md)
