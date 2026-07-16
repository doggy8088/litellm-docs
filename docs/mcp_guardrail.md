import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# MCP 防護欄 {#mcp-guardrails}

LiteLLM 支援對 MCP 工具請求套用防護欄，以確保安全性與合規性。您可以設定防護欄在 MCP 請求之前或期間執行，以驗證輸入並封鎖或遮罩敏感資訊。

### 支援的 MCP 防護欄模式 {#supported-mcp-guardrail-modes}

MCP 防護欄支援下列模式：

- `pre_mcp_call`：在 MCP 請求**之前**於**輸入**上執行。當您想要對 MCP 請求套用驗證／遮罩／封鎖時，請使用此模式
- `during_mcp_call`：在 MCP 請求執行**期間**執行。請在需要即時監控與介入時使用此模式

### 設定範例 {#configuration-examples}

設定防護欄在 MCP 工具請求之前執行，以驗證並清理輸入：

```yaml title="config.yaml" showLineNumbers
guardrails:
  - guardrail_name: "mcp-input-validation"
    litellm_params:
      guardrail: presidio  # or other supported guardrails
      mode: "pre_mcp_call" # or during_mcp_call
      pii_entities_config:
        CREDIT_CARD: "BLOCK"  # Will block requests containing credit card numbers
        EMAIL_ADDRESS: "MASK"  # Will mask email addresses
        PHONE_NUMBER: "MASK"   # Will mask phone numbers
      default_on: true
```


### 使用範例 {#usage-examples}

#### 測試 MCP 請求前防護欄 {#testing-pre-mcp-call-guardrails}

使用包含敏感資訊的請求來測試您的 MCP 防護欄：

```bash title="Test MCP Guardrail" showLineNumbers
curl http://localhost:4000/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "My credit card is 4111-1111-1111-1111 and my email is john@example.com"}
    ],
    "guardrails": ["mcp-input-validation"]
  }'
```

請求將如下處理：
1. 信用卡號碼將被封鎖（請求遭拒）
2. 電子郵件地址將被遮罩（例如，替換為 `<EMAIL_ADDRESS>`）

#### 搭配 MCP 工具使用 {#using-with-mcp-tools}

使用 MCP 工具時，防護欄將套用於工具輸入：

```python title="Python Example with MCP Guardrails" showLineNumbers
import openai

client = openai.OpenAI(
    api_key="your-api-key",
    base_url="http://localhost:4000"
)

# This request will trigger MCP guardrails
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Send an email to 555-123-4567 with my SSN 123-45-6789"}
    ],
    tools=[{"type": "mcp", "server_label": "litellm", "server_url": "litellm_proxy"}],
    extra_body={"guardrails": ["mcp-input-validation"]},
)
```

### 支援的防護欄提供者 {#supported-guardrail-providers}

MCP 防護欄可搭配所有 LiteLLM 支援的防護欄提供者使用：

- **Presidio**：PII 偵測與遮罩
- **Bedrock**：AWS Bedrock 防護欄
- **Lakera**：內容審核
- **Aporia**：自訂防護欄
- **Noma**：Noma Security
- **PANW Prisma AIRS**：Prisma AIRS 防護欄
- **Custom**：您自己的防護欄實作
