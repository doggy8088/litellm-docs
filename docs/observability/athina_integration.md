import Image from '@theme/IdealImage';

# Athina {#athina}

:::tip

這是由社群維護的文件；如果您遇到錯誤，請建立 issue
https://github.com/BerriAI/litellm

:::

[Athina](https://athina.ai/) 是一個適用於您的 LLM 驅動應用程式的評估框架與正式環境監控平台。Athina 旨在透過即時監控、細緻分析，以及即插即用的評估，提升 AI 應用程式的效能與可靠性。

<Image img={require('../../img/athina_dashboard.png')} />

## 開始使用 {#getting-started}

使用 Athina 來記錄跨所有 LLM 提供者（OpenAI、Azure、Anthropic、Cohere、Replicate、PaLM）的請求

liteLLM 提供 `callbacks`，讓您能夠依據回應狀態輕鬆記錄資料。

## 使用回呼 {#using-callbacks}

首先，請在 [Athina 儀表板](https://app.athina.ai) 註冊以取得 API_KEY。

只需 1 行程式碼，即可使用 Athina 立即記錄您**跨所有提供者**的回應：

```python
litellm.success_callback = ["athina"]
```

### 完整程式碼 {#complete-code}

```python
from litellm import completion

## set env variables
os.environ["ATHINA_API_KEY"] = "your-athina-api-key"
os.environ["OPENAI_API_KEY"]= ""

# set callback
litellm.success_callback = ["athina"]

#openai call
response = completion(
  model="gpt-3.5-turbo", 
  messages=[{"role": "user", "content": "Hi 👋 - i'm openai"}]
) 
```

## 中繼資料中的額外資訊 {#additional-information-in-metadata}
您可以透過 completion 中的 `metadata` 欄位，傳送一些額外資訊給 Athina。這對於傳送請求的中繼資料很有用，例如 customer_id、prompt_slug，或任何您想追蹤的其他資訊。

```python
#openai call with additional metadata
response = completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata={
    "environment": "staging",
    "prompt_slug": "my_prompt_slug/v1"
  }
)
```

以下是 metadata 中允許的欄位、其型別與說明：

* `environment: Optional[str]` - 您的應用程式執行所在的環境（例如：production、staging 等）。這對於依環境區分推論請求很有用。
* `prompt_slug: Optional[str]` - 用於推論的 prompt 識別碼。這對於依 prompt 區分推論請求很有用。
* `customer_id: Optional[str]` - 這是您的 customer ID。這對於依客戶區分推論請求很有用。
* `customer_user_id: Optional[str]` - 這是 end user ID。這對於依最終使用者區分推論請求很有用。
* `session_id: Optional[str]` - 這是 session 或 conversation ID。這用於將不同的推論分組成一段對話或鏈。［閱讀更多］(https://docs.athina.ai/logging/grouping_inferences)
* `external_reference_id: Optional[str]` - 如果您想將自己的內部識別碼與記錄到 Athina 的推論關聯起來，這會很有用。
* `context: Optional[Union[dict, str]]` - 這是作為 prompt 資訊使用的 context。對於 RAG 應用程式，這是「檢索到的」資料。您可以將 context 記錄為字串或物件（dictionary）。
* `expected_response: Optional[str]` - 這是供評估用途比較的參考回應。這對於依預期回應區分推論請求很有用。
* `user_query: Optional[str]` - 這是使用者的查詢。對於對話式應用程式，這是使用者的最後一則訊息。
* `tags: Optional[list]` - 這是一個標籤清單。這對於依標籤區分推論請求很有用。
* `user_feedback: Optional[str]` - 最終使用者的回饋。
* `model_options: Optional[dict]` - 這是一個 model 選項的 dictionary。這對於取得模型行為如何影響您的最終使用者的洞察很有用。
* `custom_attributes: Optional[dict]` - 這是一個自訂屬性的 dictionary。這對於推論的額外資訊很有用。

## 使用自架部署的 Athina {#using-a-self-hosted-deployment-of-athina}

如果您使用的是自架部署的 Athina，您需要將 `ATHINA_BASE_URL` 環境變數設定為指向您的自架部署。

```python
...
os.environ["ATHINA_BASE_URL"]= "http://localhost:9000"
...
```

## 支援與 Athina 團隊交流 {#support--talk-with-athina-team}

- [預約示範 👋](https://cal.com/shiv-athina/30min)
- [網站 💻](https://athina.ai/?utm_source=litellm&utm_medium=website)
- [文件 📖](https://docs.athina.ai/?utm_source=litellm&utm_medium=website)
- [示範影片 📺](https://www.loom.com/share/d9ef2c62e91b46769a39c42bb6669834?sid=711df413-0adb-4267-9708-5f29cef929e3)
- 我們的電子郵件 ✉️ shiv@athina.ai, akshat@athina.ai, vivek@athina.ai
