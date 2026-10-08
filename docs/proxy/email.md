import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 電子郵件通知 {#email-notifications}

<Image 
  img={require('../../img/email_2_0.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>LiteLLM 電子郵件通知</p>

## 概覽 {#overview}

將 LiteLLM Proxy 使用者的特定事件以電子郵件寄送給他們。

| 分類 | 詳細資訊 |
|----------|---------|
| 支援的事件 | • 使用者被新增為 LiteLLM Proxy 的使用者<br/>• 為使用者建立 Proxy API 金鑰<br/>• 為使用者輪替 Proxy API 金鑰<br/>• 虛擬金鑰接近或超過其預算 |
| 支援的電子郵件整合 | • Resend API<br/>• SendGrid API<br/>• SMTP |

## 用法 {#usage}

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

將 `resend_email` 加入您的 proxy config.yaml 中的 `litellm_settings` 之下

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

將 `sendgrid_email` 加入您的 proxy config.yaml 中的 `litellm_settings` 之下

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

在 LiteLLM Proxy UI 中，前往 users > 建立新使用者。 

建立新使用者後，他們會在建立使用者時您指定的電子郵件地址收到邀請信。 

### 3. 設定預算警示（選用） {#3-configure-budget-alerts-optional}

在 proxy 設定中，將「email」加入 `alerting` 清單，以啟用預算警示電子郵件：

```yaml showLineNumbers title="proxy_config.yaml"
general_settings:
  alerting: ["email"]
```

#### 預算警示類型 {#budget-alert-types}

**低預算警示**：當金鑰超過其低預算上限時自動觸發。這些警示可協助您在達到關鍵門檻前監控支出。

**最高預算警示**：當金鑰達到其最高預算指定百分比時自動觸發（預設：80%）。這些警示會在您接近預算耗盡時提醒您。

這兩種警示類型每 24 小時最多寄送一封電子郵件，以避免垃圾信件。

#### 每個金鑰的門檻與收件者 {#per-key-thresholds-and-recipients}

預設情況下，最高預算警示會在單一門檻觸發，且只會寄送給擁有該金鑰的使用者電子郵件，因此沒有擁有者電子郵件的金鑰不會寄送任何通知。若要自行選擇門檻並通知其他人，請在金鑰的 metadata 中設定 `max_budget_alert_emails`。每個項目會將該金鑰的 `max_budget` 百分比對應到當支出超過該門檻時收到通知的收件者。

```shell showLineNumbers
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "max_budget": 100,
    "metadata": {
      "max_budget_alert_emails": {
        "50": ["owner@your-company.com"],
        "75": ["owner@your-company.com", "finance@your-company.com"],
        "100": ["oncall@your-company.com"]
      }
    }
  }'
```

以上述金鑰為例，支出達到 $50 時會寄給擁有者，$75 時會寄給擁有者與財務，$100 時則會寄給 on-call。收件者可以是清單或以逗號分隔的字串，而且無論您設定了誰，金鑰擁有者的電子郵件一律會一併包含。每個門檻每個金鑰在每 `EMAIL_BUDGET_ALERT_TTL` 最多只會寄送一封電子郵件。100% 門檻仍會在耗盡預算的那個請求上觸發，因為警示檢查會在請求被拒絕之前執行。

在金鑰上設定 `max_budget_alert_emails` 會取代該金鑰預設的 80% 警示。若要變更既有金鑰的門檻，請將相同的 `metadata` 區塊送至 `/key/update`。

目前尚未提供 UI 欄位，因此請透過 `/key/generate` 或 `/key/update` 設定。

#### 團隊成員預算門檻與收件者 {#team-member-budget-thresholds-and-recipients}

設定 `team_member_budget` 的團隊會限制每個成員在該團隊內可花費的金額，且預設在成員達到上限之前或當下都不會寄送電子郵件。若要針對成員的預算發出警示，請在團隊的 metadata 中設定 `team_member_max_budget_alert_emails`。每個項目會將 `team_member_budget` 的百分比對應到當該成員在團隊中的支出超過該門檻時收到通知的額外收件者。

```shell showLineNumbers
curl -X POST 'http://0.0.0.0:4000/team/update' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "team_id": "my-team",
    "team_member_budget": 100,
    "metadata": {
      "team_member_max_budget_alert_emails": {
        "50": [],
        "100": ["finance@your-company.com"]
      }
    }
  }'
```

以上述團隊為例，某位成員花費了其 $100 預算中的 $50 時會收到電子郵件，而達到 $100 時，該成員與財務都會收到一封。成員自己的電子郵件（來自其使用者記錄）一律會包含在內，因此空白清單表示只有該成員會收到通知，而沒有留存電子郵件的成員則不會收到任何通知，儘管已設定的收件者仍會收到。警示會在 `EMAIL_BUDGET_ALERT_TTL` 內針對每位成員、每個團隊、每個門檻觸發一次，而 100% 警示會在耗盡預算的那個請求上送出，且在該請求被拒絕之前。當支出達到最低設定門檻時，Slack 與 webhook 目的地也會針對該成員收到一則 `Team Member Budget` 事件，時間點與其他預算類型使用的固定點相同（剩餘 15% 與 5%，以及超過預算），且 `event_group` 設為 `team_member`。

同一區塊也可在 Admin UI 的該團隊 Team Member Settings 下使用，而 `/team/new` 也接受 `metadata`。無效項目（例如不是 1 到 100 之間整數的門檻）會被忽略。

#### 每個金鑰的預設門檻 {#default-thresholds-for-every-key}

設定 `default_key_max_budget_alert_emails` 以套用到所有金鑰的基準。每個金鑰的項目會逐一與全域設定合併，因此金鑰會繼承該門檻的全域收件者，並在其上增加自己的收件者，而不是覆寫它們。

```yaml showLineNumbers title="proxy_config.yaml"
general_settings:
  alerting: ["email"]

litellm_settings:
  default_key_max_budget_alert_emails:
    "80": ["platform-team@your-company.com"]
```

#### 設定選項 {#configuration-options}

使用這些環境變數自訂預算警示行為：

```bash showLineNumbers title=".env"
# Percentage of max budget that triggers alerts (as decimal: 0.8 = 80%)
# Only applies to keys without max_budget_alert_emails configured
EMAIL_BUDGET_ALERT_MAX_SPEND_ALERT_PERCENTAGE=0.8

# Time-to-live for alert deduplication in seconds (default: 24 hours)
EMAIL_BUDGET_ALERT_TTL=86400
```

## 電子郵件範本 {#email-templates}

### 1. 使用者在 LiteLLM Proxy 中新增為使用者 {#1-user-added-as-a-user-on-litellm-proxy}

當您在 LiteLLM Proxy 建立新使用者時，會寄送這封電子郵件。

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

當您在 LiteLLM Proxy 為使用者建立新的 API 金鑰時，會寄送這封電子郵件。

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

當您在 LiteLLM Proxy 為使用者輪替 API 金鑰時，會寄送這封電子郵件。

<Image 
  img={require('../../img/email_regen2.png')}
  style={{maxHeight: '600px', width: 'auto', display: 'block', margin: '0 0 2rem 0'}}
/>

**如何觸發此事件**

在 LiteLLM Proxy UI 中，前往 Virtual Keys > 點選某個金鑰 > 點選 "Regenerate Key"

:::info

請確認該金鑰已附加 `user_id`。這應該是在建立金鑰時設定的。

:::

<Image 
  img={require('../../img/email_regen.png')}
  style={{width: '70%', display: 'block', margin: '0 0 2rem 0'}}
/>

重新產生金鑰後，使用者將會收到包含以下內容的電子郵件通知：
- 關於輪替的安全性訊息
- 新的 API 金鑰（或在 `EMAIL_INCLUDE_API_KEY=false` 時提供的預留位置）
- 更新其應用程式的指示
- 安全最佳實務

## 電子郵件自訂 {#email-customization}

<EnterpriseFeature feature="自訂電子郵件品牌" />

LiteLLM 可讓您自訂電子郵件通知的各個面向。以下是所有可自訂欄位的完整參考：

| 欄位 | 環境變數 | 類型 | 預設值 | 範例 | 說明 |
|-------|-------------------|------|---------------|---------|-------------|
| 標誌 URL | `EMAIL_LOGO_URL` | string | LiteLLM 標誌 | `"https://your-company.com/logo.png"` | 您公司標誌的公開 URL |
| 支援聯絡方式 | `EMAIL_SUPPORT_CONTACT` | string | support@berri.ai | `"support@your-company.com"` | 使用者支援的電子郵件地址 |
| 電子郵件簽章 | `EMAIL_SIGNATURE` | string (HTML) | 標準 LiteLLM 頁尾 | `"<p>Best regards,<br/>Your Team</p><p><a href='https://your-company.com'>Visit us</a></p>"` | 適用於所有電子郵件的 HTML 格式頁尾 |
| 邀請主旨 | `EMAIL_SUBJECT_INVITATION` | string | "LiteLLM: 新使用者邀請" | `"Welcome to Your Company!"` | 邀請電子郵件的主旨行 |
| 金鑰建立主旨 | `EMAIL_SUBJECT_KEY_CREATED` | string | "LiteLLM: API 金鑰已建立" | `"Your New API Key is Ready"` | 金鑰建立電子郵件的主旨行 |
| 金鑰輪換主旨 | `EMAIL_SUBJECT_KEY_ROTATED` | string | "LiteLLM: API 金鑰已輪換" | `"Your API Key Has Been Rotated"` | 金鑰輪換電子郵件的主旨行 |
| 包含 API 金鑰 | `EMAIL_INCLUDE_API_KEY` | boolean | true | `"false"` | 是否在電子郵件中包含實際的 API 金鑰（設為 false 可提升安全性） |
| Proxy 基礎 URL | `PROXY_BASE_URL` | string | http://0.0.0.0:4000 | `"https://proxy.your-company.com"` | LiteLLM Proxy 的基礎 URL（用於電子郵件連結） |

## 電子郵件簽名中的 HTML 支援 {#html-support-in-email-signature}

`EMAIL_SIGNATURE` 欄位支援 HTML 格式，可用於建立豐富且具品牌風格的電子郵件頁尾。以下是可包含的範例：

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

為了提升安全性，您可以設定 LiteLLM 在電子郵件通知中**不**包含實際的 API 金鑰。這在以下情況很有用：

- 您想降低透過電子郵件攔截而暴露金鑰的風險
- 您的安全政策要求只能從安全儀表板擷取金鑰
- 您擔心電子郵件轉寄或儲存的安全性

停用時，電子郵件會顯示：`[Key hidden for security - retrieve from dashboard]`，而不是實際的 API 金鑰。

**設定：**

```bash
# Hide API keys in emails (enhanced security)
EMAIL_INCLUDE_API_KEY="false"

# Include API keys in emails (default behavior)
EMAIL_INCLUDE_API_KEY="true"  # or omit this variable
```

**行為：**

| 設定 | 金鑰建立電子郵件 | 金鑰輪換電子郵件 |
|---------|------------------|-------------------|
| `true`（預設） | 顯示實際的 `sk-xxxxx` 金鑰 | 顯示實際的 `sk-xxxxx` 金鑰 |
| `false` | 顯示預留位置訊息 | 顯示預留位置訊息 |

使用者可隨時從 LiteLLM Proxy 儀表板擷取其金鑰。

## 電子郵件簽名中的 HTML 支援 {#html-support-in-email-signature-1}

`EMAIL_SIGNATURE` 環境變數支援 HTML 格式，讓您可以建立豐富且具品牌風格的電子郵件頁尾。您可以包含：

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
- 預設簽章：標準 LiteLLM 頁尾
- 預設主旨："LiteLLM: \{event_message\}"（會以實際事件訊息取代）

## 範本變數 {#template-variables}

設定自訂電子郵件主旨時，唯一支援的範本變數是 `\{event_message\}`，它會被事件訊息取代（例如「歡迎使用 LiteLLM Proxy」或「API 金鑰已建立」）。任何其他預留位置，例如 `\{company_name\}`，都會在建立電子郵件時導致 `KeyError`，且電子郵件不會送出。其他內容請使用純文字：

```bash
# Examples of template variable usage
EMAIL_SUBJECT_INVITATION="Welcome to Acme! \{event_message\}"
EMAIL_SUBJECT_KEY_CREATED="Your Acme API Key"
```

## 常見問題 {#faq}

### 為什麼我在電子郵件連結中看到「`http://0.0.0.0:4000`」？ {#why-do-i-see-http00004000-in-the-email-links}

`PROXY_BASE_URL` 環境變數用於建構電子郵件連結。如果您在本機環境中使用 LiteLLM Proxy，您會在電子郵件連結中看到「`http://0.0.0.0:4000`」。

如果您在正式環境中使用 LiteLLM Proxy，您會看到 LiteLLM Proxy 的實際基礎 URL。

您可以將 `PROXY_BASE_URL` 環境變數設定為 LiteLLM Proxy 的實際基礎 URL。

```bash
PROXY_BASE_URL="https://proxy.your-company.com"
```
