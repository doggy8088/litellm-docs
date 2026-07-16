# 政策範本 {#policy-templates}

政策範本提供預先設定的防護欄政策，您可以將其作為組織的起點。您不必手動建立政策和防護欄，只要選擇符合您使用案例的範本，並一鍵部署即可。

## 使用政策範本 {#using-policy-templates}

### 在 UI 中 {#in-the-ui}

1. 在 LiteLLM Admin UI 中導覽至 **Policies → Templates** 分頁
2. 瀏覽可用範本（例如：「PII Protection」、「Cost Control」、「HR Compliance」）
3. 在任一範本上按一下 **"Use Template"**
4. 檢閱將會建立的防護欄：
   - 現有防護欄會以綠色勾號標示
   - 新防護欄可以選取／取消選取
5. 按一下 **"Create X Guardrails & Use Template"**
6. 檢閱並自訂預先填入的政策表單
7. 按一下 **"Create Policy"** 以儲存

### 工作流程 {#workflow}

```
Select Template → Review Guardrails → Create Selected → Edit Policy → Save
```

系統會自動：
- ✅ 偵測哪些防護欄已經存在
- ✅ 只建立您選取的缺少防護欄
- ✅ 以範本資料預先填入政策表單
- ✅ 讓您在儲存前自訂

## 可用範本 {#available-templates}

範本會從 [GitHub](https://raw.githubusercontent.com/BerriAI/litellm/main/policy_templates.json) 取得，並自動回退至本機備份。

### 目前範本 {#current-templates}

#### 1. 進階 PII 保護（澳洲） {#1-advanced-pii-protection-australia}
- **複雜度：** 高
- **使用案例：** 為澳洲組織提供完整的 PII 偵測
- **防護欄：**
  - 澳洲稅務識別碼（TFN、ABN、Medicare）
  - 澳洲護照
  - 國際 PII（SSN、護照、國民身分證）
  - 聯絡資訊（電子郵件、電話、地址）
  - 金融資料（信用卡、IBAN）
  - API 憑證（AWS、GitHub、Slack）- **封鎖** 請求
  - 網路基礎架構（IP 位址）
  - 受保護族群資訊（性別、種族、宗教、身心障礙等）

#### 2. 基準 PII 保護 {#2-baseline-pii-protection}
- **複雜度：** 低
- **使用案例：** 供內部工具與測試使用的基本保護
- **防護欄：**
  - 澳洲稅務識別碼
  - API 憑證
  - 金融資料

## 建立您自己的政策範本 {#creating-your-own-policy-templates}

您可以提供政策範本，供整個 LiteLLM 社群使用。

### 範本結構 {#template-structure}

範本以 JSON 格式定義，結構如下：

```json
{
  "id": "unique-template-id",
  "title": "Display Title",
  "description": "Detailed description of what this template protects",
  "icon": "ShieldCheckIcon",
  "iconColor": "text-purple-500",
  "iconBg": "bg-purple-50",
  "guardrails": [
    "guardrail-name-1",
    "guardrail-name-2"
  ],
  "complexity": "Low|Medium|High",
  "guardrailDefinitions": [
    {
      "guardrail_name": "example-guardrail",
      "litellm_params": {
        "guardrail": "litellm_content_filter",
        "mode": "pre_call",
        "patterns": [
          {
            "pattern_type": "prebuilt",
            "pattern_name": "email",
            "action": "MASK"
          }
        ],
        "pattern_redaction_format": "[{pattern_name}_REDACTED]"
      },
      "guardrail_info": {
        "description": "What this guardrail does"
      }
    }
  ],
  "templateData": {
    "policy_name": "policy-name",
    "description": "Policy description",
    "guardrails_add": ["guardrail-name-1", "guardrail-name-2"],
    "guardrails_remove": []
  }
}
```

### 欄位說明 {#field-descriptions}

#### 顯示欄位 {#display-fields}
- **id**：唯一識別碼（小寫並以連字號分隔）
- **title**：在 UI 中顯示給使用者的名稱
- **description**：詳細說明此範本所保護的內容
- **icon**：圖示名稱（必須可在 UI 圖示對應中使用）
- **iconColor**：Tailwind CSS 文字顏色類別
- **iconBg**：Tailwind CSS 背景顏色類別
- **guardrails**：防護欄名稱陣列（僅供顯示）
- **complexity**：顯示難度的徽章（"Low"、"Medium" 或 "High"）

#### 防護欄定義 {#guardrail-definitions}
- **guardrailDefinitions**：完整防護欄組態的陣列
  - 每一項都必須是可傳送至 `/guardrails` POST 端點的有效防護欄物件
  - 如果某個防護欄已經存在，將會略過
  - 如果範本只使用既有防護欄，則可以為空 `[]`

#### 政策設定 {#policy-configuration}
- **templateData**：預先填入政策表單的物件
  - **policy_name**：建議名稱（使用者可編輯）
  - **description**：政策描述
  - **guardrails_add**：要包含的防護欄名稱陣列
  - **guardrails_remove**：要移除的陣列（通常範本為 `[]`）
  - **inherit**：（選用）繼承所用的父政策名稱

### 範本範例 {#example-template}

以下是一個 HIPAA 合規範本的完整範例：

```json
{
  "id": "hipaa-compliance",
  "title": "HIPAA Compliance Policy",
  "description": "Healthcare compliance policy that masks PHI and enforces HIPAA regulations for healthcare applications.",
  "icon": "ShieldCheckIcon",
  "iconColor": "text-red-500",
  "iconBg": "bg-red-50",
  "guardrails": [
    "phi-detector",
    "medical-record-blocker",
    "patient-id-masker"
  ],
  "complexity": "High",
  "guardrailDefinitions": [
    {
      "guardrail_name": "phi-detector",
      "litellm_params": {
        "guardrail": "litellm_content_filter",
        "mode": "pre_call",
        "patterns": [
          {
            "pattern_type": "prebuilt",
            "pattern_name": "us_ssn",
            "action": "MASK"
          },
          {
            "pattern_type": "prebuilt",
            "pattern_name": "email",
            "action": "MASK"
          },
          {
            "pattern_type": "prebuilt",
            "pattern_name": "us_phone",
            "action": "MASK"
          }
        ],
        "pattern_redaction_format": "[PHI_REDACTED]"
      },
      "guardrail_info": {
        "description": "Detects and masks Protected Health Information (PHI)"
      }
    }
  ],
  "templateData": {
    "policy_name": "hipaa-compliance-policy",
    "description": "HIPAA compliance policy for healthcare applications",
    "guardrails_add": [
      "phi-detector",
      "medical-record-blocker",
      "patient-id-masker"
    ],
    "guardrails_remove": []
  }
}
```

## 貢獻範本 {#contributing-templates}

若要提供一個供所有人使用的政策範本：

### 步驟 1：建立您的範本 JSON {#step-1-create-your-template-json}

1. 依照上述結構建立 JSON 檔案
2. 透過將其新增至您的本機 `policy_templates.json` 進行本機測試
3. 驗證所有防護欄都能正確運作
4. 確保描述清楚且有幫助

### 步驟 2：提交 Pull Request {#step-2-submit-a-pull-request}

1. Fork [LiteLLM repository](https://github.com/BerriAI/litellm)
2. 將您的範本新增至根目錄的 `policy_templates.json`
3. 將您的範本新增至 `litellm/policy_templates_backup.json`（保持兩者同步）
4. 建立包含以下內容的 pull request：
   - 清楚描述此範本所保護的內容
   - 使用案例範例
   - 任何相關的合規框架（HIPAA、GDPR、SOC 2 等）

### 指引 {#guidelines}

**要：**
- ✅ 使用清楚、具描述性的名稱
- ✅ 包含完整的描述
- ✅ 徹底測試所有防護欄
- ✅ 記錄模式來源（例如：「根據 NIST 指引」）
- ✅ 以邏輯方式將相關防護欄分組
- ✅ 考量不同的複雜度層級

**不要：**
- ❌ 不要包含憑證或機密
- ❌ 不要使用過於廣泛、可能造成誤判的模式
- ❌ 不要重複既有範本
- ❌ 不要在未徹底測試下使用自訂程式碼

## 離線使用範本 {#using-templates-offline}

對於隔離網路或離線部署，請設定環境變數：

```bash
export LITELLM_LOCAL_POLICY_TEMPLATES=true
```

這會強制系統使用本機備份（`litellm/policy_templates_backup.json`），而不是從 GitHub 取得。

## 範本來源 {#template-sources}

- **GitHub（預設）：** https://raw.githubusercontent.com/BerriAI/litellm/main/policy_templates.json
- **本機備份：** `litellm/policy_templates_backup.json`

範本會在每次請求時自動從 GitHub 取得，若任何步驟失敗則回退至本機備份。

## 可用的模式類型 {#available-pattern-types}

建立範本用的防護欄時，您可以使用這些預建模式：

### 身分證件 {#identity-documents}
- `passport_australia`、`passport_us`、`passport_uk`、`passport_germany` 等
- `us_ssn`、`us_ssn_no_dash`
- `au_tfn`、`au_abn`、`au_medicare`
- `nl_bsn_contextual`
- `br_cpf`、`br_rg`、`br_cnpj`

### 金融 {#financial}
- `visa`、`mastercard`、`amex`、`discover`、`credit_card`
- `iban`

### 聯絡資訊 {#contact-information}
- `email`
- `us_phone`、`br_phone_landline`、`br_phone_mobile`
- `street_address`
- `br_cep`（巴西郵遞區號）

### 憑證 {#credentials}
- `aws_access_key`、`aws_secret_key`
- `github_token`
- `slack_token`
- `generic_api_key`

### 網路 {#network}
- `ipv4`、`ipv6`

### 受保護族群 {#protected-class}
- `gender_sexual_orientation`
- `race_ethnicity_national_origin`
- `religion`
- `age_discrimination`
- `disability`
- `marital_family_status`
- `military_status`
- `public_assistance`

請參閱[完整模式清單](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/guardrails/guardrail_hooks/litellm_content_filter/patterns.json)以查看所有可用模式。

## 相關文件 {#related-docs}

- [防護欄政策](./guardrail_policies)
- [政策標籤](./policy_tags)
- [內容過濾模式](../hooks/content_filter)
- [自訂程式碼防護欄](../hooks/custom_code)
