import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 電子郵件通知  {#email-notifications}

<Image 
  img={require('../../img/email_2_0.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>
  LiteLLM 電子郵件通知
</p>

## 總覽 {#overview}

為 LiteLLM Proxy 使用者傳送特定事件的電子郵件。

| 類別 | 詳細資訊 |
|----------|---------|
| 支援的事件 | • 使用者被新增為 LiteLLM Proxy 的使用者<br/>• 為使用者建立 Proxy API 金鑰<br/>• 為使用者輪替 Proxy API 金鑰 |
| 支援的電子郵件整合 | • Resend API<br/>• SMTP |

## 使用方式 {#usage}

### 1. 設定電子郵件整合 {#1-configure-email-integration}

<Tabs>
  <TabItem value="smtp" label="SMTP">

取得 SMTP 憑證以進行設定

```yaml showLineNumbers title="proxy_config.yaml"
litellm_settings:
    callbacks: ["smtp_email"]
```

將以下內容加入您的 proxy 環境變數

```shell showLineNumbers
SMTP_HOST="smtp.resend.com"
SMTP_TLS="True"
SMTP_PORT="587"
SMTP_USERNAME="resend"
SMTP_SENDER_EMAIL="notifications@alerts.litellm.ai"
SMTP_PASSWORD="xxxxx"
```

  </TabItem>
  <TabItem value="resend" label="Resend API">

將 `resend_email` 加入您的 proxy config.yaml 中的 `litellm_settings` 下方

設定以下環境變數

```shell showLineNumbers
RESEND_API_KEY="re_1234"
```

```yaml showLineNumbers title="proxy_config.yaml"
litellm_settings:
    callbacks: ["resend_email"]
```

  </TabItem>
  <TabItem value="sendgrid" label="SendGrid API">

將 `sendgrid_email` 加入您的 proxy config.yaml 中的 `litellm_settings` 下方

設定以下環境變數

```shell showLineNumbers
SENDGRID_API_KEY="SG.1234"
SENDGRID_SENDER_EMAIL="notifications@your-domain.com"
```

```yaml showLineNumbers title="proxy_config.yaml"
litellm_settings:
  callbacks: ["sendgrid_email"]
```

  </TabItem>
</Tabs>

### 2. 建立新使用者 {#2-create-a-new-user}

在 LiteLLM Proxy UI 中，前往 users > create a new user。 

建立新使用者後，系統會向您在建立使用者時指定的電子郵件地址寄送邀請信。 

### 3. 設定預算警示（選用） {#3-configure-budget-alerts-optional}

在您的 proxy 設定中，將 "email" 加入 `alerts` 清單，即可啟用預算警示電子郵件：

```yaml showLineNumbers title="proxy_config.yaml"
general_settings:
  alerts: ["email"]
```

#### 預算警示類型 {#budget-alert-types}

**軟性預算警示**：當金鑰超過其軟性預算上限時自動觸發。這些警示可協助您在達到關鍵門檻前監控支出。

**最大預算警示**：當金鑰達到其最大預算指定百分比時自動觸發（預設：80%）。這些警示會在您接近預算耗盡時提醒您。

兩種警示類型最多每 24 小時傳送一封電子郵件，以避免垃圾郵件。

#### 設定選項 {#configuration-options}

您可以使用以下環境變數自訂預算警示行為：

```yaml showLineNumbers title=".env"
# Percentage of max budget that triggers alerts (as decimal: 0.8 = 80%)
EMAIL_BUDGET_ALERT_MAX_SPEND_ALERT_PERCENTAGE=0.8

# Time-to-live for alert deduplication in seconds (default: 24 hours)
EMAIL_BUDGET_ALERT_TTL=86400
```

## 電子郵件範本  {#email-templates}

### 1. 使用者被新增為 LiteLLM Proxy 的使用者 {#1-user-added-as-a-user-on-litellm-proxy}

當您在 LiteLLM Proxy 中建立新使用者時，系統會傳送這封電子郵件。

<Image 
  img={require('../../img/email_event_1.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

**如何觸發此事件**

在 LiteLLM Proxy UI 中，前往 Users > Create User > 輸入使用者的電子郵件地址 > Create User。

<Image 
  img={require('../../img/new_user_email.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

### 2. 為使用者建立 Proxy API 金鑰 {#2-proxy-api-key-created-for-user}

當您在 LiteLLM Proxy 中為使用者建立新的 API 金鑰時，系統會傳送這封電子郵件。

<Image 
  img={require('../../img/email_event_2.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

**如何觸發此事件**

在 LiteLLM Proxy UI 中，前往 Virtual Keys > Create API Key > 選取 User ID

<Image 
  img={require('../../img/key_email.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

在 Create Key Modal 中，選取 Advanced Settings > 將 Send Email 設為 True。

<Image 
  img={require('../../img/key_email_2.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

### 3. 為使用者輪替 Proxy API 金鑰 {#3-proxy-api-key-rotated-for-user}

當您為 LiteLLM Proxy 中的使用者輪替 API 金鑰時，系統會傳送這封電子郵件。

<Image 
  img={require('../../img/email_regen2.png')}
  style={{maxHeight: '600px', width: 'auto', display: 'block', margin: '0 0 2rem 0'}}
/>

**如何觸發此事件**

在 LiteLLM Proxy UI 中，前往 Virtual Keys > 點選某個金鑰 > 點選 "Regenerate Key"

:::info

請確保該金鑰已附加 `user_id`。這會在建立金鑰時設定。

:::

<Image 
  img={require('../../img/email_regen.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

重新產生金鑰後，使用者將會收到包含以下內容的電子郵件通知：
- 以安全性為重點的輪替訊息
- 新的 API 金鑰（若 `EMAIL_INCLUDE_API_KEY=false`，則顯示預留位置）
- 更新應用程式的說明
- 安全最佳實務

## 電子郵件自訂 {#email-customization}

:::info

自訂電子郵件品牌識別是企業版功能 [請與我們聯絡以取得免費試用](https://enterprise.litellm.ai/demo)

:::

LiteLLM 讓您可自訂電子郵件通知的各個面向。以下是所有可自訂欄位的完整參考：

| 欄位 | 環境變數 | 類型 | 預設值 | 範例 | 說明 |
|-------|-------------------|------|---------------|---------|-------------|
| Logo URL | `EMAIL_LOGO_URL` | string | LiteLLM logo | `"https://your-company.com/logo.png"` | 您公司 logo 的公開 URL |
| Support Contact | `EMAIL_SUPPORT_CONTACT` | string | support@berri.ai | `"support@your-company.com"` | 使用者支援的電子郵件地址 |
| Email Signature | `EMAIL_SIGNATURE` | string (HTML) | Standard LiteLLM footer | `"<p>Best regards,<br/>Your Team</p><p><a href='https://your-company.com'>Visit us</a></p>"` | 所有電子郵件的 HTML 格式頁尾 |
| Invitation Subject | `EMAIL_SUBJECT_INVITATION` | string | "LiteLLM: New User Invitation" | `"Welcome to Your Company!"` | 邀請電子郵件的主旨列 |
| Key Creation Subject | `EMAIL_SUBJECT_KEY_CREATED` | string | "LiteLLM: API Key Created" | `"Your New API Key is Ready"` | 建立金鑰電子郵件的主旨列 |
| Key Rotation Subject | `EMAIL_SUBJECT_KEY_ROTATED` | string | "LiteLLM: API Key Rotated" | `"Your API Key Has Been Rotated"` | 金鑰輪替電子郵件的主旨列 |
| Include API Key | `EMAIL_INCLUDE_API_KEY` | boolean | true | `"false"` | 是否在電子郵件中包含實際 API 金鑰（設為 false 可提升安全性） |
| Proxy Base URL | `PROXY_BASE_URL` | string | http://0.0.0.0:4000 | `"https://proxy.your-company.com"` | LiteLLM Proxy 的基底 URL（用於電子郵件連結） |

## 電子郵件簽章中的 HTML 支援 {#html-support-in-email-signature}

`EMAIL_SIGNATURE` 欄位支援 HTML 格式，可用於製作具品牌感的豐富電子郵件頁尾。以下是您可以包含的內容範例：

```html
<p>Best regards,<br/>The LiteLLM Team</p>
<p>
  <a href='https://docs.litellm.ai'>Documentation</a> |
  <a href='https://github.com/BerriAI/litellm'>GitHub</a>
</p>
<p style='font-size: 12px; color: #666;'>
  This is an automated message from LiteLLM Proxy
</p>
```

支援的 HTML 功能：
- 文字格式（粗體、斜體等）
- 換行（`<br/>`）
- 連結（`<a href='...'>`）
- 段落（`<p>`）
- 基本行內樣式
- 公司資訊與社群媒體連結
- 法律免責聲明或服務條款連結

## 環境變數 {#environment-variables}

您可以透過環境變數自訂電子郵件的以下面向：

```bash
# Email Branding
EMAIL_LOGO_URL="https://your-company.com/logo.png"  # Custom logo URL
EMAIL_SUPPORT_CONTACT="support@your-company.com"     # Support contact email
EMAIL_SIGNATURE="<p>Best regards,<br/>Your Company Team</p><p><a href='https://your-company.com'>Visit our website</a></p>"  # Custom HTML footer/signature

# Email Subject Lines
EMAIL_SUBJECT_INVITATION="Welcome to Your Company!"  # Subject for invitation emails
EMAIL_SUBJECT_KEY_CREATED="Your API Key is Ready"    # Subject for key creation emails
EMAIL_SUBJECT_KEY_ROTATED="Your API Key Has Been Rotated"  # Subject for key rotation emails

# Security Settings
EMAIL_INCLUDE_API_KEY="false"  # Set to false to hide API keys in emails (default: true)

# Proxy Configuration
PROXY_BASE_URL="https://proxy.your-company.com"      # Base URL for the LiteLLM Proxy (used in email links)
```

## 安全性：在電子郵件中隱藏 API 金鑰 {#security-hiding-api-keys-in-emails}

為了提升安全性，您可以將 LiteLLM 設定為在電子郵件通知中**不**包含實際 API 金鑰。這在以下情況很有用：

- 您希望降低透過電子郵件攔截而外洩金鑰的風險
- 您的安全政策要求金鑰只能從安全的儀表板擷取
- 您擔心電子郵件轉寄或儲存的安全性

停用後，電子郵件將顯示：`[Key hidden for security - retrieve from dashboard]`，而非實際 API 金鑰。

**設定：**

```bash
# Hide API keys in emails (enhanced security)
EMAIL_INCLUDE_API_KEY="false"

# Include API keys in emails (default behavior)
EMAIL_INCLUDE_API_KEY="true"  # or omit this variable
```

**行為：**

| 設定 | 建立金鑰電子郵件 | 輪替金鑰電子郵件 |
|---------|------------------|-------------------|
| `true`（預設） | 顯示實際 `sk-xxxxx` 金鑰 | 顯示實際 `sk-xxxxx` 金鑰 |
| `false` | 顯示預留位置訊息 | 顯示預留位置訊息 |

使用者始終可以從 LiteLLM Proxy 儀表板擷取其金鑰。

## 電子郵件簽章中的 HTML 支援 {#html-support-in-email-signature-1}

`EMAIL_SIGNATURE` 環境變數支援 HTML 格式，讓您可以建立具品牌感的豐富電子郵件頁尾。您可以包含：

- 文字格式（粗體、斜體等）
- 使用 `<br/>` 的換行
- 使用 `<a href='...'>` 的連結
- 使用 `<p>` 的段落
- 公司資訊與社群媒體連結
- 法律免責聲明或服務條款連結

範例 HTML 簽章：
```html
<p>Best regards,<br/>The LiteLLM Team</p>
<p>
  <a href='https://docs.litellm.ai'>Documentation</a> |
  <a href='https://github.com/BerriAI/litellm'>GitHub</a>
</p>
<p style='font-size: 12px; color: #666;'>
  This is an automated message from LiteLLM Proxy
</p>
```

## 預設範本 {#default-templates}

如果未設定環境變數，LiteLLM 將使用預設範本：

- 預設標誌：LiteLLM 標誌
- 預設支援聯絡方式：support@berri.ai
- 預設簽名：標準 LiteLLM 頁尾
- 預設主旨： "LiteLLM: \{event_message\}"（會以實際事件訊息取代）

## 範本變數 {#template-variables}

設定自訂電子郵件主旨時，您可以使用會被實際值取代的範本變數：

```bash
# Examples of template variable usage
EMAIL_SUBJECT_INVITATION="Welcome to \{company_name\}!"
EMAIL_SUBJECT_KEY_CREATED="Your \{company_name\} API Key"
```

系統在傳送電子郵件時，會自動將 `\{event_message\}` 及其他範本變數取代為其實際值。

## 常見問題  {#faq}

### 為什麼我在電子郵件連結中看到 `http://0.0.0.0:4000`？ {#why-do-i-see-http00004000-in-the-email-links}

`PROXY_BASE_URL` 環境變數用於建構電子郵件連結。如果您在本機環境中使用 LiteLLM Proxy，您會在電子郵件連結中看到 `http://0.0.0.0:4000`。

如果您在正式環境中使用 LiteLLM Proxy，您會看到 LiteLLM Proxy 的實際基礎 URL。

您可以將 `PROXY_BASE_URL` 環境變數設定為 LiteLLM Proxy 的實際基礎 URL。

```bash
PROXY_BASE_URL="https://proxy.your-company.com"
```
