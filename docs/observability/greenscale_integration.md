# Greenscale {#greenscale}

:::tip

這是由社群維護，若您遇到錯誤，請提出 issue
https://github.com/BerriAI/litellm

:::

[Greenscale](https://greenscale.ai/) 是一個適用於您的 LLM 驅動應用程式的正式環境監控平台，為您提供關於 GenAI 支出與負責任使用的細緻關鍵洞察。Greenscale 僅擷取中繼資料，以將個人識別資訊（PII）的暴露風險降至最低。

## 開始使用 {#getting-started}

使用 Greenscale 來記錄跨所有 LLM 提供者的請求

liteLLM 提供 `callbacks`，讓您能依據回應狀態輕鬆記錄資料。

## 使用回呼 {#using-callbacks}

首先，寄信給 `hello@greenscale.ai` 以取得 API_KEY。

只需 1 行程式碼，即可立即使用 Greenscale 記錄您在**跨所有提供者**的回應：

```python
litellm.success_callback = ["greenscale"]
```

### 完整程式碼 {#complete-code}

```python
from litellm import completion

## set env variables
os.environ['GREENSCALE_API_KEY'] = 'your-greenscale-api-key'
os.environ['GREENSCALE_ENDPOINT'] = 'greenscale-endpoint'
os.environ["OPENAI_API_KEY"]= ""

# set callback
litellm.success_callback = ["greenscale"]

#openai call
response = completion(
  model="gpt-3.5-turbo",
  messages=[{"role": "user", "content": "Hi 👋 - i'm openai"}]
  metadata={
    "greenscale_project": "acme-project",
    "greenscale_application": "acme-application"
  }
)
```

## 中繼資料中的其他資訊 {#additional-information-in-metadata}

您可以透過在 completion 中使用 `metadata` 欄位，以及 `greenscale_` 前綴，將任何額外資訊傳送給 Greenscale。這對於傳送關於請求的中繼資料很有用，例如專案與應用程式名稱、customer_id、environment，或任何您想追蹤使用情況的其他資訊。`greenscale_project` 和 `greenscale_application` 是必填欄位。

```python
#openai call with additional metadata
response = completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ],
  metadata={
    "greenscale_project": "acme-project",
    "greenscale_application": "acme-application",
    "greenscale_customer_id": "customer-123"
  }
)
```

## 與 Greenscale 團隊取得支援與聯繫 {#support--talk-with-greenscale-team}

- [預約示範 👋](https://calendly.com/nandesh/greenscale)
- [網站 💻](https://greenscale.ai)
- 我們的電子郵件 ✉️ `hello@greenscale.ai`
