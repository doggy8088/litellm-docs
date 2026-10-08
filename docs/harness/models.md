---
title: Models and routing
sidebar_label: Models and routing
---

# 模型與路由 {#models-and-routing}

`model=` 的行為與 `litellm.completion` 相同。前綴為 `litellm_proxy/` 的模型會送往閘道，其餘則會透過 LiteLLM SDK 直接呼叫。

## 閘道模式 {#gateway-mode}

在 `model="litellm_proxy/coder"` 中，`coder` 是閘道上的模型群組。閘道位址與虛擬金鑰來自呼叫中的 `api_base=` 與 `api_key=`，或來自 `LITELLM_PROXY_API_BASE` 與 `LITELLM_PROXY_API_KEY`。設定 `litellm.use_litellm_proxy = True` 會將每次呼叫都送到閘道，即使沒有前綴也是如此。沒有 base URL 或金鑰的閘道模型會在呼叫時引發 `ValueError`。金鑰上的負載平衡、備援與速率限制都在閘道上發生。請參閱 [搭配 LiteLLM AI Gateway 使用](./gateway.md)。

## SDK 模式 {#sdk-mode}

`model` 是任何 LiteLLM 模型字串，而提供者金鑰會以與 `litellm.completion` 讀取它相同的方式，在您的主機上讀取。

```python
litellm.agent(Harness.CODEX, task, sandbox=box, model="bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0")

litellm.agent(
    Harness.CLAUDE_CODE, task, sandbox=box,
    model="hosted_vllm/qwen3-coder",
    api_base="http://gpu-01:8000/v1",
)
```

在 SDK 模式下，`api_key=` 與 `api_base=` 會套用到提供者。使用 `model=None` 時，CLI 執行階段會使用自己的預設模型名稱。Tool Loop 需要明確指定模型

## 本機模型端點 {#the-local-model-endpoint}

CLI harness 需要一個 HTTP 端點來呼叫。對於每個工作階段，`litellm.agent()` 都會在 `127.0.0.1` 上啟動一個小型 Starlette 應用程式，使用隨機連接埠，使其可從 sandbox 存取，並將執行階段指向該端點。

| Harness | 使用下列設定 | 路由 | 閘道模式 | SDK 模式 |
|---|---|---|---|---|
| `CLAUDE_CODE` | `ANTHROPIC_BASE_URL` | `/v1/messages` | 轉送至閘道 | `litellm.anthropic.messages.acreate` |
| `CODEX` | `model_providers.litellm` | `/v1/responses` | 轉送至閘道 | `litellm.aresponses` |
| `OPENCODE` | `litellm` 在 `opencode.json` 中的提供者 | `/v1/chat/completions` | 轉送至閘道 | `litellm.acompletion` |

執行階段的 API 金鑰是每個工作階段隨機產生的權杖。端點會以 401 拒絕任何其他權杖，而且該權杖會在工作階段關閉時失效。在閘道模式下，端點會將權杖替換為您的虛擬金鑰，加入 `x-litellm-tags: harness,<name>`，將 `metadata=` 作為 `x-litellm-spend-logs-metadata` 傳送，並原樣串流回應。

Deep Agents 與 Tool Loop 在您的程序中執行，不會使用該端點。Deep Agents 使用 `ChatLiteLLM` 模型，而 Tool Loop 則直接呼叫 `litellm.acompletion()`

## 成本與用量 {#cost-and-usage}

`Result.usage` 具有 `input_tokens`、`output_tokens`、`calls` 與 `total_tokens`，而 `Result.cost` 以 USD 計算。`Session.cost` 是累計總額。在閘道模式下，成本來自閘道的 `x-litellm-response-cost` 標頭，因此會與閘道的支出記錄相符。在 SDK 模式下，則依據 LiteLLM 的模型成本對照表計算，而沒有價格的模型會計為 0.0。
