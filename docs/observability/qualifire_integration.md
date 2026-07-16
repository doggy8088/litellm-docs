import Image from '@theme/IdealImage';

# Qualifire {#qualifire}

[Qualifire](https://qualifire.ai/) 提供即時的 Agentic 評估、防護欄與可觀測性，適用於正式環境的 AI 應用程式。

**主要功能：**

- **評估** - 系統性地評估 AI 行為，以偵測幻覺、越獄、政策違規及其他漏洞
- **防護欄** - 即時介入以防止品牌損害、資料外洩與合規性違規等風險
- **可觀測性** - 為 RAG pipeline、聊天機器人與 AI 代理程式提供完整的追蹤與記錄
- **Prompt 管理** - 集中式 prompt 管理，具備版本控管與無程式碼工作室

:::tip

在找 Qualifire Guardrails 嗎？請查看 [Qualifire Guardrails 整合](../proxy/guardrails/qualifire.md)，以取得即時內容審核、prompt injection 偵測、PII 檢查等功能。

:::

## 先決條件 {#pre-requisites}

1. 在 [Qualifire](https://app.qualifire.ai/) 建立帳戶
2. 從 Qualifire 儀表板取得您的 API 金鑰與 webhook URL

```bash
uv add litellm
```

## 快速開始 {#quick-start}

只需 2 行程式碼，即可使用 Qualifire 立即記錄您的回應，**涵蓋所有提供者**。

```python
litellm.callbacks = ["qualifire_eval"]
```

```python
import litellm
import os

# Set Qualifire credentials
os.environ["QUALIFIRE_API_KEY"] = "your-qualifire-api-key"
os.environ["QUALIFIRE_WEBHOOK_URL"] = "https://your-qualifire-webhook-url"

# LLM API Keys
os.environ['OPENAI_API_KEY'] = "your-openai-api-key"

# Set qualifire_eval as a callback & LiteLLM will send the data to Qualifire
litellm.callbacks = ["qualifire_eval"]

# OpenAI call
response = litellm.completion(
  model="gpt-5",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

## 搭配 LiteLLM Proxy 使用 {#using-with-litellm-proxy}

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["qualifire_eval"]

general_settings:
  master_key: "sk-1234"

environment_variables:
  QUALIFIRE_API_KEY: "your-qualifire-api-key"
  QUALIFIRE_WEBHOOK_URL: "https://app.qualifire.ai/api/v1/webhooks/evaluations"
```

2. 啟動 proxy

```bash
litellm --config config.yaml
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{ "model": "gpt-4o", "messages": [{"role": "user", "content": "Hi 👋 - i'm openai"}]}'
```

## 環境變數 {#environment-variables}

| 變數                | 說明                                            |
| ----------------------- | ------------------------------------------------------ |
| `QUALIFIRE_API_KEY`     | 您用於驗證的 Qualifire API 金鑰              |
| `QUALIFIRE_WEBHOOK_URL` | 來自您儀表板的 Qualifire webhook 端點 URL |

## 會記錄什麼？ {#what-gets-logged}

[LiteLLM 標準記錄負載](https://docs.litellm.ai/docs/proxy/logging_spec) 會在每次成功的 LLM API 請求時送至您的 Qualifire 端點。

這包括：

- 請求訊息與參數
- 回應內容與中繼資料
- token 使用統計
- 延遲指標
- 模型資訊
- 成本資料

資料進入 Qualifire 後，您可以：

- 執行評估以偵測幻覺、毒性與政策違規
- 設定防護欄以即時封鎖或修改回應
- 檢視整個 AI pipeline 的追蹤
- 隨時間追蹤效能與品質指標
