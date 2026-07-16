import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /guardrails/apply_guardrail {#guardrailsapply_guardrail}

使用此端點可直接呼叫您 LiteLLM 執行個體上已設定的防護欄。當您有需要直接呼叫防護欄的服務時，這非常有用。

## 支援的防護欄類型 {#supported-guardrail-types}

此端點支援多種防護欄類型，包括：
- **Presidio** - PII 偵測與遮罩
- **Bedrock** - 用於內容審核的 AWS Bedrock 防護欄
- **Lakera** - AI 安全防護欄
- **PANW Prisma AIRS** - 威脅偵測、DLP 與政策強制執行
- **自訂防護欄** - 使用者定義的防護欄

## 設定 {#configuration}

### Bedrock 防護欄設定 {#bedrock-guardrail-configuration}

若要在 apply_guardrail 端點使用 Bedrock 防護欄，請在您的 LiteLLM config.yaml 中設定防護欄：

```yaml
guardrails:
  - guardrail_name: "bedrock-content-guard"
    litellm_params:
      guardrail: bedrock
      mode: "pre_call"
      guardrailIdentifier: "your-guardrail-id"  # Your actual Bedrock guardrail ID
      guardrailVersion: "DRAFT"  # or your version number
      aws_region_name: "us-east-1"  # Your AWS region
      aws_role_name: "your-role-arn"  # Your AWS role with Bedrock permissions
      default_on: true
```

**必要的 AWS 設定：**
1. 在 AWS Console 建立 Bedrock 防護欄
2. 取得防護欄 ID 與版本
3. 確保您的 AWS 認證具有 Bedrock 權限
4. 在您的 LiteLLM config 中設定防護欄 

## 使用方式 {#usage}
---

<Tabs>
<TabItem value="presidio" label="Presidio PII 防護欄" default>

在此範例中 `mask_pii` 是在 LiteLLM 上設定的 Presidio 防護欄。

```bash showLineNumbers title="Example calling the endpoint"
curl -X POST 'http://localhost:4000/guardrails/apply_guardrail' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer your-api-key' \
-d '{
    "guardrail_name": "mask_pii",
    "text": "My name is John Doe and my email is john@example.com",
    "language": "en",
    "entities": ["NAME", "EMAIL"]
}'
```

</TabItem>
<TabItem value="bedrock" label="Bedrock 防護欄">

在此範例中 `bedrock-content-guard` 是在 LiteLLM 上設定的 Bedrock 防護欄。

```bash showLineNumbers title="Example calling the endpoint"
curl -X POST 'http://localhost:4000/guardrails/apply_guardrail' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer your-api-key' \
-d '{
    "guardrail_name": "bedrock-content-guard",
    "text": "This is potentially harmful content that should be blocked",
    "language": "en"
}'
```

**注意**：對於 Bedrock 防護欄，`entities` 參數不會使用，因為 Bedrock 會根據其自身政策處理內容審核。

</TabItem>
</Tabs>

## 請求格式 {#request-format}
---

請求主體應遵循 ApplyGuardrailRequest 格式。

#### 請求主體範例 {#example-request-body}

```json
{
    "guardrail_name": "mask_pii",
    "text": "My name is John Doe and my email is john@example.com",
    "language": "en",
    "entities": ["NAME", "EMAIL"]
}
```

#### 必要欄位 {#required-fields}
- **guardrail_name** (string):  
  要套用的防護欄識別碼（例如：「mask_pii」）。
- **text** (string):  
  要透過防護欄處理的輸入文字。

#### 選用欄位 {#optional-fields}
- **language** (string):  
  輸入文字的語言（例如：「en」代表英文）。
- **entities** (array of strings):  
  要處理或篩選的特定實體（例如：["NAME", "EMAIL"]）。

## 回應格式 {#response-format}
---

回應將包含套用防護欄後處理過的文字。

#### 回應範例 {#example-response}

<Tabs>
<TabItem value="presidio" label="Presidio 回應" default>

```json
{
    "response_text": "My name is [REDACTED] and my email is [REDACTED]"
}
```

</TabItem>
<TabItem value="bedrock" label="Bedrock 回應">

```json
{
    "response_text": "This is potentially harmful content that should be blocked"
}
```

**注意**：如果 Bedrock 防護欄封鎖內容，端點將回傳帶有封鎖原因的錯誤。

</TabItem>
</Tabs>

#### 回應欄位 {#response-fields}
- **response_text** (string):  
  套用防護欄後的文字。

#### 錯誤回應 {#error-responses}

如果防護欄封鎖內容（例如：Bedrock 防護欄），端點將回傳錯誤：

```json
{
    "detail": "Content blocked by Bedrock guardrail: Content violates policy"
}
```
