# Sentry {#sentry}
import Image from '@theme/IdealImage';


:::tip

這是由社群維護的內容，如果您遇到錯誤，請提出 issue
https://github.com/BerriAI/litellm

:::

[Sentry](https://sentry.io/) 提供正式環境的錯誤監控。LiteLLM 這個整合可以新增 breadcrumb，並將例外傳送到 Sentry

可追蹤的例外包括：
- litellm.completion() - 100+ LLM 的 completion()
- litellm.acompletion() - 非同步 completion()
- 串流 completion() 與 acompletion() 呼叫

<Image img={require('../../img/sentry.png')} />

## 使用方式 {#usage}

### 設定 SENTRY_DSN 與 callback {#set-sentry_dsn--callback}

```python
import litellm, os
os.environ["SENTRY_DSN"] = "your-sentry-url"
litellm.failure_callback=["sentry"]
```

### 搭配 completion 的 Sentry callback {#sentry-callback-with-completion}
```python
import litellm
from litellm import completion 

litellm.input_callback=["sentry"] # adds sentry breadcrumbing
litellm.failure_callback=["sentry"] # [OPTIONAL] if you want litellm to capture -> send exception to sentry

import os 
os.environ["SENTRY_DSN"] = "your-sentry-url"
os.environ["OPENAI_API_KEY"] = "your-openai-key"

# set bad key to trigger error 
api_key="bad-key"
response = completion(model="{{openai_small}}", messages=[{"role": "user", "content": "Hey!"}], stream=True, api_key=api_key)

print(response)
```

#### 取樣率選項 {#sample-rate-options}

- **SENTRY_API_SAMPLE_RATE**：控制送往 Sentry 的錯誤百分比
  - 數值介於 0 與 1 之間（預設為 1.0，亦即 100% 的錯誤）
  - 範例：0.5 會傳送 50% 的錯誤，0.1 會傳送 10% 的錯誤

- **SENTRY_API_TRACE_RATE**：控制用於效能監控的交易取樣百分比
  - 數值介於 0 與 1 之間（預設為 1.0，亦即 100% 的交易）
  - 範例：0.5 會追蹤 50% 的交易，0.1 會追蹤 10% 的交易

這些選項適合高流量應用程式，在管理成本的同時，對部分錯誤與交易進行取樣仍可提供足夠的可見性。

#### Sentry 環境 {#sentry-environment}
- **SENTRY_ENVIRONMENT**：指定您的 Sentry 事件所屬的環境名稱（例如「production」、「staging」、「development」）
  - 有助於在 Sentry 儀表板中依部署環境組織與篩選錯誤
  - 範例：`os.environ["SENTRY_ENVIRONMENT"] = "staging"`
  - 若未設定，Sentry 會預設使用 'production' 作為環境

## PII 與秘密資料清理 {#pii-and-secret-scrubbing}

預設情況下，LiteLLM 會在送出 `send_default_pii` 關閉的情況下傳送 Sentry 事件，並在它們離開 proxy 之前加以清理，因此 Sentry 附加到例外的 frame locals 絕不會攜帶憑證或使用者身分

秘密資料一律會移除。API 金鑰（任何 `sk-` 值，不論出現於何處）、虛擬金鑰傳入的請求標頭（`Authorization`、`x-api-key`、`api-key`、`x-goog-api-key`、`x-litellm-api-key`）、主金鑰、資料庫 URL、token、cookie，以及讀取到的密碼 `[Filtered]`，無論它們位於頂層變數、巢狀 dict（例如 `general_settings`）中，或是在物件的 repr 內（例如 `UserAPIKeyAuth(token='...')`）

除非您選擇加入，否則使用者身分會被移除。`user_id`、`user_email`、`end_user_id`、雜湊過的虛擬金鑰（`user_api_key_hash`），以及 `user_api_key_*` 中繼資料欄位會以 `[Filtered]` 的方式在相同三個位置讀取，而事件中其他地方留下的任何電子郵件格式值或 64 字元十六進位金鑰雜湊也會一併替換

當您希望 Sentry 顯示錯誤屬於哪位使用者或哪把金鑰時，請設定 `SENTRY_SEND_DEFAULT_PII=true`。此時身分欄位會通過，而秘密資料仍會被過濾

```shell
export SENTRY_SEND_DEFAULT_PII=true
```

## 從 Sentry 記錄中移除訊息、回應內容  {#redacting-messages-response-content-from-sentry-logging}

設定 `litellm.turn_off_message_logging=True` 這將防止訊息與回應被記錄到 sentry，但請求中繼資料仍會被記錄。

如果您需要 Sentry 的任何其他選項，請[告訴我們](https://github.com/BerriAI/litellm/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.yml&title=%5BFeature%5D%3A+)。
