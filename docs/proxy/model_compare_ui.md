import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 模型比較遊樂場 UI {#model-compare-playground-ui}

在互動式遊樂場介面中並排比較多個 LLM 模型。評估模型回應、效能指標與成本，以便針對您的使用情境做出明智決策，判斷哪些模型最適合。

此功能在 **v1.80.0-stable 及以上版本可用**。

## 概覽 {#overview}

Model Compare Playground UI 可讓您同時並排比較最多 3 個不同的 LLM 模型。設定模型、參數與測試提示詞，並透過包含延遲、token 使用量與成本等詳細指標來評估與比較模型回應。

<Image img={require('../../img/ui_model_compare_overview.png')} />

## 開始使用 {#getting-started}

### 存取 Model Compare UI {#accessing-the-model-compare-ui}

#### 1. 前往遊樂場 {#1-navigate-to-the-playground}

前往 Admin UI 中的 Playground 頁面（`PROXY_BASE_URL/ui/?login=success&page=llm-playground`）

<Image img={require('../../img/ui_playground_navigation.png')} />

#### 2. 切換到 Compare 分頁 {#2-switch-to-compare-tab}

在 Playground 介面中點選 **Compare** 分頁。

## 設定 {#configuration}

### 設定模型 {#setting-up-models}

#### 1. 選取要比較的模型 {#1-select-models-to-compare}

您最多可以同時比較 3 個模型。對於每個比較面板：

- 點選模型下拉選單以查看可用模型
- 從您已設定的端點中選取一個模型
- 模型會從您的 LiteLLM proxy 設定載入

<Image img={require('../../img/ui_model_compare_select_model.png')} />

#### 2. 設定模型參數 {#2-configure-model-parameters}

每個模型面板都支援個別參數設定：

**基本參數：**

- **Temperature**：控制隨機性（0.0 到 2.0）
- **Max Tokens**：回應中的最大 tokens 數

**進階參數：**

- 啟用「Use Advanced Params」以設定額外的模型專屬參數
- 支援所選模型/提供者可用的所有參數

<Image img={require('../../img/ui_model_compare_model_parameters.png')} />

#### 3. 將參數套用至所有模型 {#3-apply-parameters-across-models}

使用「Sync Settings Across Models」切換開關，可在所有比較面板之間同步參數（tags、guardrails、temperature、max tokens 等），以便進行一致的測試。

<Image img={require('../../img/ui_model_compare_sync_across_models.png')} />

### 防護欄 {#guardrails}

直接在遊樂場中設定並測試 guardrails：

1. 在模型面板中點選 guardrails 選擇器
2. 從您已設定的清單中選取一個或多個 guardrails
3. 測試不同模型如何回應 guardrail 篩選
4. 比較各模型的 guardrail 行為

<Image img={require('../../img/ui_model_compare_guardrails_config.png')} />

### 標籤 {#tags}

套用 tags 以整理並篩選您的比較：

1. 從 tag 下拉選單中選取 tags
2. tags 有助於分類與追蹤不同測試情境

<Image img={require('../../img/ui_model_compare_tags_config.png')} />

### 向量儲存 {#vector-stores}

為 RAG（Retrieval Augmented Generation）比較設定 vector store 檢索：

1. 從下拉選單中選取 vector stores
2. 比較不同模型如何運用擷取到的內容
3. 評估各模型的 RAG 效能

<Image img={require('../../img/ui_model_compare_vector_stores_config.png')} />

## 執行比較 {#running-comparisons}

### 1. 輸入您的提示詞 {#1-enter-your-prompt}

在訊息輸入區域輸入您的測試提示詞。您可以：

- 為所有模型輸入單一訊息
- 使用建議提示詞進行快速測試
- 建立多輪對話

<Image img={require('../../img/ui_model_compare_enter_prompt.png')} />

### 2. 傳送請求 {#2-send-request}

點選送出按鈕（或按 Enter）以開始比較。所有已選取的模型會同時處理請求。

### 3. 查看回應 {#3-view-responses}

回應會並排顯示在各模型面板中，方便比較：

- 回應品質與內容
- 回應長度與結構
- 模型專屬格式

<Image img={require('../../img/ui_model_compare_responses.png')} />

## 比較指標 {#comparison-metrics}

每個比較面板都會顯示詳細指標，協助您評估模型效能：

### 首個 token 產生時間（TTFT） {#time-to-first-token-ttft}

測量從送出請求到收到第一個 token 的延遲。數值越低表示初始回應越快。

### Token 使用量 {#token-usage}

- **Input Tokens**：提示詞/請求中的 tokens 數量
- **Output Tokens**：模型回應中的 tokens 數量
- **Reasoning Tokens**：用於推理的 tokens（若適用，例如 o1 models）

### 總延遲 {#total-latency}

從請求到最終回應的完整時間，包括串流時間。

### 成本 {#cost}

如果您的 LiteLLM 設定已啟用成本追蹤，您將會看到：

- 每個請求的成本
- 依 input/output tokens 的成本明細
- 跨模型的成本比較

<Image img={require('../../img/ui_model_compare_cost_metrics.png')} />

## 使用情境 {#use-cases}

### 模型選擇 {#model-selection}

針對相同提示詞比較多個模型，以判斷哪個模型最符合您的特定使用情境：

- 回應品質
- 回應時間
- 成本效益
- Token 使用量

### 參數調校 {#parameter-tuning}

在不同模型之間測試不同參數組態，以找出最佳設定：

- Temperature 變化
- Max token 限制
- 進階參數組合

### Guardrail 測試 {#guardrail-testing}

評估不同模型如何回應安全過濾器與 guardrails：

- 過濾有效性
- 偽陽性率
- 模型專屬的 guardrail 行為

### A/B 測試 {#ab-testing}

使用 tags 與多次比較執行結構化 A/B 測試：

- 比較模型版本
- 測試提示詞變體
- 評估功能逐步推出

---

## 相關功能 {#related-features}

- [Playground Chat UI](./ui.md) - 單一模型測試介面
- [Model Management](./model_management.md) - 設定與管理模型
- [Guardrails](./guardrails/quick_start.md) - 設定安全過濾器
- [AI Hub](./ai_hub.md) - 與您的組織分享模型與代理程式
