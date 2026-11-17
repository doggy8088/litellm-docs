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

### Python SDK {#python-sdk}

針對 [issue #49217](https://github.com/BerriAI/litellm/issues/49217) 的原始碼實作位於 [SDK PR #49469](https://github.com/BerriAI/litellm/pull/49469)，疊加在 [endpoint PR #49460](https://github.com/BerriAI/litellm/pull/49460) 之上，新增了 `litellm.guardrails.apply`。在正式發布之前，SDK 與 gateway 請使用同時包含這兩項變更的 checkout。

只需設定一次連線，然後呼叫您已設定的防護欄：

```python
import os
import litellm

litellm.api_base = os.environ["LITELLM_API_BASE"]
litellm.api_key = os.environ["LITELLM_API_KEY"]

verdict = await litellm.guardrails.apply(
    "answer-grounding",
    response=answer,
    messages=source_messages,
)
```

傳入 `response=` 可檢查產生的輸出，傳入 `input=` 可檢查使用者輸入。兩者只能擇一提供。SDK 會推斷 `input_type`，並請求 native 結構化 findings。`messages` 為 grounding 等檢查提供 context；不需要 context 的檢查可省略。您可以在個別呼叫中覆寫 `api_base`、`api_key` 或 `timeout`。

結果會遵循所設定防護欄的 schema，並在既有的 reporting 清理移除敏感欄位之後呈現。防護欄必須透過 `add_standard_logging_guardrail_information_to_request_data` 回報結構化 findings；對於未回報任何 findings 的防護欄，SDK 不會建立 verdict。如需可執行的 agent、自訂防護欄與 chat UI，請參閱 [grounding 教學](/blog/grounded-agent)。
---

<Tabs>
<TabItem value="presidio" label="Presidio PII 防護欄" default>

在此範例中 `mask_pii` 是在 LiteLLM 上設定的 Presidio 防護欄。

```bash showLineNumbers title="Example calling the endpoint"
curl -X POST 'http://localhost:4000/guardrails/apply_guardrail' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer ${LITELLM_API_KEY}" \
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
-H "Authorization: Bearer ${LITELLM_API_KEY}" \
-d '{
    "guardrail_name": "bedrock-content-guard",
    "text": "This is potentially harmful content that should be blocked",
    "language": "en"
}'
```

**注意**：對於 Bedrock 防護欄，`entities` 參數不會使用，因為 Bedrock 會根據其自身政策處理內容審核。

</TabItem>
<TabItem value="custom" label="Custom Guardrail with metadata">

參數化自訂防護欄會從 `request_data["metadata"]` 讀取每次請求的設定。請在請求本文中傳送可選的 `metadata`，它會轉送至您的防護欄 `apply_guardrail` 方法。在此範例中，`my-topic-guardrail` 是一個自訂防護欄，會封鎖提及任何在 `metadata` 中傳入之 `forbidden_topics` 的文字。

```bash showLineNumbers title="Example calling the endpoint"
curl -X POST 'http://localhost:4000/guardrails/apply_guardrail' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer ${LITELLM_API_KEY}" \
-d '{
    "guardrail_name": "my-topic-guardrail",
    "text": "What are tax loopholes?",
    "metadata": {
        "forbidden_topics": ["tax", "finance"]
    }
}'
```

只有當用戶端傳送 `metadata` 時才會轉送，因此不依賴每次請求設定的防護欄，在省略它時仍可維持不變地運作。

</TabItem>
</Tabs>

## 從管理員 UI 測試 {#testing-from-the-admin-ui}
---

防護欄測試遊樂場（在管理員 UI 中的 `Guardrails` -> `Test Playground`）在輸入文字下方提供一個可選的 **Metadata** 欄位。輸入一個 JSON 物件後，它會作為請求的 `metadata` 欄位傳送，讓您無需離開儀表板即可測試參數化自訂防護欄。無效的 JSON 會在請求送出前於欄位內被拒絕。

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

#### 可選欄位 {#optional-fields}
- **language** (string):  
  輸入文字的語言（例如，英文為 "en"）。
- **entities** (array of strings):  
  要處理或篩選的特定實體（例如，["NAME", "EMAIL"]）。
- **metadata** (object):  
  轉送至防護欄作為 `request_data["metadata"]` 的每次請求設定。覆寫 `apply_guardrail` 的自訂防護欄負責讀取它。僅在存在時才會轉送，因此省略它可保留現有行為。

REST API 也接受 `input_type`（`request` 或 `response`）與 `response_format`（`standard` 或 `native`）。SDK 會從 `input=` 或 `response=` 推導方向，並選擇 `native`。

## 回應格式 {#response-format}
---

回應將包含套用防護欄後處理過的文字。

使用 `response_format: "native"` 時，回應改為包含防護欄所回報、經清理後的結構化 findings。單一 finding 會回傳其物件或陣列；多個回報的 findings 則回傳陣列。欄位名稱取決於防護欄。若它未回報任何結構化 findings，endpoint 會回傳 HTTP 422，而不是捏造一個通過結果。既有的封鎖與提供者錯誤行為仍照常適用。

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
