---
title: "搭配 LiteLLM 使用 BigModel（Zhipu AI）API"
sidebar_label: "BigModel (Zhipu AI)"
description: "透過 Python SDK 或 AI 閘道在 BigModel（Zhipu AI）上執行 GLM-5.3、Flash 與 FlashX，並支援 thinking、reasoning effort 以及 Responses 與 Messages API。"
---

# BigModel (Zhipu AI) {#bigmodel-zhipu-ai}

<SinceVersion v="1.109.0" />

中國國內的 BigModel 平台使用 `bigmodel/`，國際版 Z.AI 使用 `zai/`。每個平台使用自己的憑證與預設 URL

## API 金鑰 {#api-key}

在您的 [BigModel 帳戶](https://bigmodel.cn/)中建立 API 金鑰，並在執行 LiteLLM 的環境中設定它

```bash
export BIGMODEL_API_KEY="YOUR_BIGMODEL_API_KEY"
pip install litellm
```

## 範例用法 {#sample-usage}

```python
from litellm import completion

response = completion(
    model="bigmodel/glm-5.3",
    messages=[{"role": "user", "content": "Hello"}],
    thinking={"type": "enabled"},
    reasoning_effort="low",
)
print(response.choices[0].message.content)
print(response.usage)
```

您不需要設定 `api_base`。呼叫成功後會傳回 assistant 回覆與 token 用量

## 範例用法 - 串流 {#sample-usage---streaming}

```python
from litellm import completion

stream = completion(
    model="bigmodel/glm-5.3",
    messages=[{"role": "user", "content": "Hello"}],
    reasoning_effort="low",
    stream=True,
    stream_options={"include_usage": True},
)
for chunk in stream:
    if chunk.choices:
        print(chunk.choices[0].delta.content or "", end="")
    if getattr(chunk, "usage", None):
        print(chunk.usage)
```

## Responses API {#responses-api}

```python
from litellm import responses

response = responses(
    model="bigmodel/glm-5.3",
    input="Hello",
    reasoning={"effort": "low"},
    store=True,
)
print(response.output)
print(response.usage)
```

如果您需要 continuation、retrieval 或 deletion，請設定 `store=True`，並使用 LiteLLM 傳回的 response ID。BigModel 文件記載保留期為七天，且不支援 cancel、compact、原生 WebSocket 或 `file_search`

## Anthropic Messages API {#anthropic-messages-api}

使用非同步的 Messages SDK 入口點

```python
import asyncio
import litellm

async def main() -> None:
    response = await litellm.anthropic.messages.acreate(
        model="bigmodel/glm-5.3",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello"}],
        thinking={"type": "adaptive"},
        output_config={"effort": "low"},
    )
    print(response.content)
    print(response.usage)

asyncio.run(main())
```

每個 API 都保留其原生回應格式與串流事件。Messages 保留原生的 `thinking`、`output_config` 與 `reasoning_effort` 參數

## 模型與定價 {#models-and-pricing}

在模型 ID 前加上 `bigmodel/` 前綴。這三個型錄模型都支援全部三個 API，並使用常時開啟的 thinking。GLM-5.3 接受 `low`、`high` 與 `max` reasoning effort

以下價格為每百萬 token 的人民幣價格，於 2026-10-27 對照[官方定價](https://docs.bigmodel.cn/cn/guide/start/pricing)查核

| 模型 ID | 輸入 | 快取輸入 | 輸出 |
| --- | ---: | ---: | ---: |
| `glm-5.3` | 8 | 2 | 28 |
| `glm-5.3-flash` | 0.8 | 0.23 | 2.8 |
| `glm-5.3-flashx` | 2 | 0.57 | 7 |

LiteLLM 使用靜態的 7.0 CNY/USD 換算儲存 USD/token 價格，來源與查核日期記錄在型錄中繼資料中。部署專屬的合約價格請使用既有的 `litellm_params` 成本欄位

## 搭配 LiteLLM Proxy 使用 {#using-with-litellm-proxy}

以 `pip install 'litellm[proxy]'` 安裝 proxy。在閘道環境中設定 `BIGMODEL_API_KEY` 與強度足夠的 `LITELLM_MASTER_KEY`，然後將以下內容儲存為 `config.yaml`

```yaml
model_list:
  - model_name: glm
    litellm_params:
      model: bigmodel/glm-5.3
      api_key: os.environ/BIGMODEL_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

```bash
litellm --config config.yaml --host 127.0.0.1 --port 4000
```

在已設定閘道金鑰的第二個終端中傳送請求

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm","messages":[{"role":"user","content":"Hello"}],"reasoning_effort":"low"}'

curl http://localhost:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm","input":"Hello","reasoning":{"effort":"low"}}'

curl http://localhost:4000/v1/messages \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm","messages":[{"role":"user","content":"Hello"}],"max_tokens":1024,"thinking":{"type":"adaptive"},"output_config":{"effort":"low"}}'
```

同一個部署名稱服務全部三條路由。每個回應都包含回覆與原生 token 用量。請將 BigModel 金鑰保留在閘道上；用戶端使用 LiteLLM 金鑰

Codex 可透過 `/v1/responses` 使用，無需額外設定，因為 LiteLLM 會轉送它傳送的 `include` 與 `parallel_tool_calls` 欄位

## API Base {#api-base}

`api_base` 為選填，預設為 `https://open.bigmodel.cn`。設定 `BIGMODEL_API_BASE` 可覆寫預設值，或傳入明確的 `api_base` 以覆寫環境值。API 專屬的 base 與完整端點 URL 都會正規化，並保留自訂 proxy 的路徑前綴

GLM Coding Plan 金鑰使用 `https://open.bigmodel.cn/api/coding/paas/v4` 作為其 `api_base`。Chat Completions 接著會呼叫 Coding Plan 端點，而 Responses 與 Messages 保持下表中的端點

| Proxy 端點 | BigModel 端點 |
| --- | --- |
| `/v1/chat/completions` | `/api/paas/v4/chat/completions` |
| `/v1/responses` | `/api/v1/responses` |
| `/v1/messages` | `/api/anthropic/v1/messages` |

在 Admin UI 中，選擇 BigModel (Zhipu AI)。其憑證表單需要 API Key，並提供預設的 API Base

提供者 API 詳細資訊請參閱官方的 [Chat Completions](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction)、[Responses](https://docs.bigmodel.cn/cn/guide/develop/responses/introduction) 與 [Messages](https://docs.bigmodel.cn/cn/guide/develop/claude/introduction) 指南
