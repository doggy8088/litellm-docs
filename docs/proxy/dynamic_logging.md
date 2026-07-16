import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# 動態回呼管理 {#dynamic-callback-management}

:::info

✨ 這是企業功能。

[開始使用 LiteLLM Enterprise](https://www.litellm.ai/enterprise)

:::

LiteLLM 的動態回呼管理可讓團隊以每個請求為單位控制記錄行為，而無需變更中央基礎架構。這對於管理大規模服務生態系統的組織而言至關重要，其中：

- **團隊自行管理其合規性** - 服務可以在沒有中央監督的情況下適當處理敏感資料
- **去中心化責任** - 每個團隊在使用共用基礎架構的同時，控制其資料處理方式

您可以在請求中傳遞 `x-litellm-disable-callbacks` 標頭來停用回呼，讓團隊能精細控制其資料被記錄的位置。

## 開始使用：列出與停用回呼 {#getting-started-list-and-disable-callbacks}

管理回呼是一個兩步驟流程：

1. **先列出您已啟用的回呼**，以查看目前哪些功能已開啟
2. **接著視需要停用特定回呼**，以符合您的請求需求

## 1. 列出已啟用的回呼 {#1-list-active-callbacks}

先檢視代理程式上目前所有已啟用的回呼，看看有哪些可供停用。

#### 請求 {#request}

```bash
curl -X 'GET' \
  'http://localhost:4000/callbacks/list' \
  -H 'accept: application/json' \
  -H 'x-litellm-api-key: sk-1234'
```

#### 回應 {#response}

```json
{
  "success": [
    "deployment_callback_on_success",
    "sync_deployment_callback_on_success"
  ],
  "failure": [
    "async_deployment_callback_on_failure",
    "deployment_callback_on_failure"
  ],
  "success_and_failure": [
    "langfuse",
    "datadog"
  ]
}
```

#### 回應欄位 {#response-fields}

回應包含三個陣列，用於分類您已啟用的回呼：
- **`success`** - 只有在請求成功完成時才會執行的回呼。這些回呼會接收來自成功 LLM 回應的資料。
- **`failure`** - 只有在請求失敗或發生錯誤時才會執行的回呼。這些回呼會接收錯誤資訊與失敗的請求資料。
- **`success_and_failure`** - 會在請求成功與失敗時都執行的回呼。這些通常是需要無論結果如何都擷取所有請求資料的記錄/可觀測性工具。

---

## 2. 停用回呼 {#2-disable-callbacks}

既然您已知道哪些回呼處於啟用狀態，就可以使用 `x-litellm-disable-callbacks` 標頭選擇性地將其停用。您可以引用上方列出回應中的任何回呼名稱。

### 停用單一回呼 {#disable-a-single-callback}

使用 `x-litellm-disable-callbacks` 標頭來停用個別請求的特定回呼。

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'x-litellm-disable-callbacks: langfuse' \
    --data '{
    "model": "claude-sonnet-4-20250514",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```

</TabItem>
<TabItem value="OpenAI" label="OpenAI Python SDK">

```python
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-20250514",
    messages=[
        {
            "role": "user",
            "content": "what llm are you"
        }
    ],
    extra_headers={
        "x-litellm-disable-callbacks": "langfuse"
    }
)

print(response)
```

</TabItem>
</Tabs>

### 停用多個回呼 {#disable-multiple-callbacks}

您可以在標頭中提供以逗號分隔的清單來停用多個回呼。可使用您 `/callbacks/list` 回應中的任何回呼名稱組合。

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'x-litellm-disable-callbacks: langfuse,datadog,prometheus' \
    --data '{
    "model": "claude-sonnet-4-20250514",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```

</TabItem>
<TabItem value="OpenAI" label="OpenAI Python SDK">

```python
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-20250514",
    messages=[
        {
            "role": "user",
            "content": "what llm are you"
        }
    ],
    extra_headers={
        "x-litellm-disable-callbacks": "langfuse,datadog,prometheus"
    }
)

print(response)
```

</TabItem>
</Tabs>

## 標頭格式與大小寫敏感性 {#header-format-and-case-sensitivity}

### 預期的標頭格式 {#expected-header-format}

`x-litellm-disable-callbacks` 標頭接受下列格式的回呼名稱（使用 `/callbacks/list` 傳回的確切名稱）：

- **單一回呼**：`x-litellm-disable-callbacks: langfuse`
- **多個回呼**：`x-litellm-disable-callbacks: langfuse,datadog,prometheus`

指定多個回呼時，請使用以逗號分隔的值，逗號前後不要有空格。

### 大小寫敏感性 {#case-sensitivity}

**回呼名稱檢查不區分大小寫。** 這表示以下所有寫法都等效：

```bash
# These are all equivalent
x-litellm-disable-callbacks: langfuse
x-litellm-disable-callbacks: LANGFUSE  
x-litellm-disable-callbacks: LangFuse
x-litellm-disable-callbacks: langFUSE
```

這同樣適用於單一與多個回呼的指定方式：

```bash
# Case insensitive for multiple callbacks
x-litellm-disable-callbacks: LANGFUSE,datadog,PROMETHEUS
x-litellm-disable-callbacks: langfuse,DATADOG,prometheus
```

---

## 停用動態回呼管理（企業） {#disabling-dynamic-callback-management-enterprise}

某些組織有合規需求，要求**所有請求在任何情況下都必須記錄**。對於這些情境，您可以完全停用動態回呼管理，以確保使用者無法停用任何記錄回呼。

### 使用情境 {#use-case}

這是為下列企業情境所設計：
- **合規要求** 規定所有 API 請求都必須記錄
- **稽核軌跡** 必須完整且沒有缺口
- **安全政策** 要求監控所有流量
- **不能有任何例外** 允許停用回呼

### 如何停用 {#how-to-disable}

在您的 config.yaml 中將 `allow_dynamic_callback_disabling` 設為 `false`：

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  allow_dynamic_callback_disabling: false
```

### 效果 {#effect}

停用後：
- `x-litellm-disable-callbacks` 標頭將被**忽略**
- 所有已設定的回呼都會在每個請求中**一律執行**
- 使用者無法透過標頭或請求中繼資料繞過記錄
- 依您的代理程式設定，所有請求都保證會被記錄

### 範例：合規記錄設定 {#example-compliance-logging-setup}

以下是一個需要保證記錄的組織之完整範例：

```yaml showLineNumbers title="config.yaml"
# config.yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["langfuse", "datadog", "s3"]
  # Disable dynamic callback disabling for compliance
  allow_dynamic_callback_disabling: false
```

使用此設定：
- 所有請求都會記錄到 Langfuse、Datadog 和 S3
- 使用者無法透過標頭停用其中任何回呼
- 可保證完整稽核軌跡以符合合規需求

:::info

**預設行為**：動態回呼停用功能預設為**啟用**（`allow_dynamic_callback_disabling: true`）。您必須明確將其設為 `false`，才能強制保證記錄。

:::
