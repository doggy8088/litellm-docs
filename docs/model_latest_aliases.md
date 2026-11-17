---
sidebar_label: "最新模型別名"
description: "在新版本推出時保持使用同一個模型名稱。在 LiteLLM SDK 與 AI Gateway 中使用 -latest 別名。"
---

# 最新模型別名 {#latest-model-aliases}

<SinceVersion v="1.109.0" />

像 `openai/gpt-luna-latest` 這樣的別名會指向該系列中的一個模型。目標由 LiteLLM 維護。當 LiteLLM 將別名移至較新的模型時，您的應用程式會保持使用相同的模型字串。

請使用下表中的完整 `provider/model-latest` 名稱。您不需要建立別名對應。每個提供者頁面也會列出該提供者的別名。

如果您想直接使用新的提供者模型 ID 而非別名，請參閱 [備援泛化](./fallback_generalizations.md)。符合的 ID 可以在還沒有精確的成本對照表項目時就先解析，且不會使用猜測的定價。

## Python SDK {#python-sdk}

使用 `pip install litellm` 安裝 `litellm`，並將 `OPENAI_API_KEY` 設定為您的 [OpenAI API 金鑰](./providers/openai.md#required-api-keys)。

```python
from litellm import completion

response = completion(
    model="openai/gpt-luna-latest",
    messages=[{"role": "user", "content": "Say hello."}],
)
print(response.choices[0].message.content)
```

成功呼叫會印出別名背後模型的問候語。

## AI Gateway {#ai-gateway}

對於 [現有的 gateway](./proxy/docker_quick_start.md)，請在 gateway 環境中設定 `OPENAI_API_KEY`。將此項目加入 `config.yaml` 的 `model_list` 之下，然後以該設定重新啟動 gateway。

```yaml
model_list:
  - model_name: openai/gpt-luna-latest
    litellm_params:
      model: openai/gpt-luna-latest
      api_key: os.environ/OPENAI_API_KEY
```

如果您的 gateway 已經透過 [萬用字元部署](./wildcard_routing.md) 路由 `openai/*`，您可以直接使用此別名，無需加入模型項目。

將 `LITELLM_PROXY_API_BASE` 設定為您 gateway 的 base URL，例如 `http://localhost:4000`，並將 `LITELLM_PROXY_API_KEY` 設定為可存取此模型的 LiteLLM 金鑰。從您的用戶端電腦傳送請求。

```bash
curl "$LITELLM_PROXY_API_BASE/chat/completions" \
  -H "Authorization: Bearer $LITELLM_PROXY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-luna-latest","messages":[{"role":"user","content":"Say hello."}]}'
```

成功的回應會在 `choices[0].message.content` 中包含問候語。gateway 回應的 `model` 欄位可能會顯示別名。LiteLLM 會使用實際提供請求的模型來計算成本。

## 支援的別名 {#supported-aliases}

這些別名會呼叫各提供者自己的 API。

| 提供者 | 模型名稱 |
| --- | --- |
| OpenAI | `openai/gpt-luna-latest`, `openai/gpt-sol-latest`, `openai/gpt-terra-latest`, `openai/gpt-astra-latest`, `openai/gpt-mini-latest` |
| Anthropic | `anthropic/claude-opus-latest`, `anthropic/claude-sonnet-latest`, `anthropic/claude-haiku-latest`, `anthropic/claude-fable-latest` |
| xAI | `xai/grok-latest` |
| Moonshot | `moonshot/kimi-latest` |
| Z.AI | `zai/glm-latest`, `zai/glm-flash-latest` |
| DeepSeek | `deepseek/deepseek-pro-latest`, `deepseek/deepseek-flash-latest` |
| DashScope | `dashscope/qwen-max-latest`, `dashscope/qwen-flash-latest` |
| MiniMax | `minimax/minimax-latest` |

Gemini、Mistral 以及 DashScope 的 `qwen-plus-latest` 已經有提供者管理的最新名稱。LiteLLM 會直接透傳這些名稱。

### 託管別名 {#hosted-aliases}

相同的模型系列也可以透過這些託管提供者使用。別名使用託管方的 prefix，LiteLLM 會傳送託管方自己的模型 ID。例如，`bedrock/claude-haiku-latest` 會以 `global.anthropic.claude-haiku-5-5` 傳送至 Bedrock，`vertex_ai/claude-haiku-latest` 會以 `claude-haiku-5-5` 傳送至 Vertex AI。Bedrock 別名指向 `global.` 跨區域推論設定檔。Azure OpenAI 別名會將目標模型名稱作為部署名稱傳送。

| 提供者 | 模型名稱 |
| --- | --- |
| Azure OpenAI | `azure/gpt-luna-latest`, `azure/gpt-sol-latest`, `azure/gpt-terra-latest`, `azure/gpt-astra-latest`, `azure/gpt-mini-latest` |
| Azure AI Foundry | `azure_ai/gpt-luna-latest`, `azure_ai/gpt-sol-latest`, `azure_ai/gpt-terra-latest`, `azure_ai/gpt-astra-latest`, `azure_ai/gpt-mini-latest`, `azure_ai/claude-opus-latest`, `azure_ai/claude-sonnet-latest`, `azure_ai/claude-haiku-latest`, `azure_ai/claude-fable-latest`, `azure_ai/grok-latest`, `azure_ai/kimi-latest`, `azure_ai/glm-latest`, `azure_ai/glm-flash-latest`, `azure_ai/deepseek-pro-latest`, `azure_ai/deepseek-flash-latest`, `azure_ai/minimax-latest` |
| Amazon Bedrock | `bedrock/gpt-luna-latest`, `bedrock/gpt-sol-latest`, `bedrock/gpt-terra-latest`, `bedrock/gpt-astra-latest`, `bedrock/claude-opus-latest`, `bedrock/claude-sonnet-latest`, `bedrock/claude-haiku-latest`, `bedrock/claude-fable-latest`, `bedrock/grok-latest`, `bedrock/kimi-latest`, `bedrock/glm-latest` |
| Bedrock Mantle | `bedrock_mantle/gpt-luna-latest`, `bedrock_mantle/gpt-sol-latest`, `bedrock_mantle/gpt-terra-latest`, `bedrock_mantle/gpt-astra-latest`, `bedrock_mantle/claude-opus-latest`, `bedrock_mantle/claude-sonnet-latest`, `bedrock_mantle/claude-haiku-latest`, `bedrock_mantle/grok-latest` |
| Vertex AI | `vertex_ai/claude-opus-latest`, `vertex_ai/claude-sonnet-latest`, `vertex_ai/claude-haiku-latest`, `vertex_ai/claude-fable-latest`, `vertex_ai/grok-latest` |
| Databricks | `databricks/gpt-luna-latest`, `databricks/gpt-sol-latest`, `databricks/gpt-terra-latest`, `databricks/gpt-astra-latest`, `databricks/gpt-mini-latest`, `databricks/claude-opus-latest`, `databricks/claude-sonnet-latest`, `databricks/claude-haiku-latest`, `databricks/claude-fable-latest`, `databricks/grok-latest`, `databricks/kimi-latest`, `databricks/glm-latest`, `databricks/glm-flash-latest` |
| GitHub Copilot | `github_copilot/gpt-luna-latest`, `github_copilot/gpt-sol-latest`, `github_copilot/gpt-terra-latest`, `github_copilot/gpt-astra-latest`, `github_copilot/claude-opus-latest`, `github_copilot/claude-sonnet-latest`, `github_copilot/claude-haiku-latest`, `github_copilot/claude-fable-latest`, `github_copilot/grok-latest`, `github_copilot/kimi-latest` |
| Baseten | `baseten/kimi-latest`, `baseten/glm-latest`, `baseten/glm-flash-latest`, `baseten/deepseek-pro-latest`, `baseten/deepseek-flash-latest` |
| Fireworks AI | `fireworks_ai/kimi-latest`, `fireworks_ai/minimax-latest` |
| Together AI | `together_ai/kimi-latest`, `together_ai/glm-latest`, `together_ai/glm-flash-latest`, `together_ai/deepseek-pro-latest`, `together_ai/qwen-flash-latest` |

只有在託管方有提供該模型，且該託管方的列尚未超過其棄用日期時，才會獲得別名，因此有些系列出現在較少的託管方之下。

每個別名都是 [模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中的獨立項目，其 `alias_of` 欄位會命名目標模型，例如 `"claude-haiku-latest": {"alias_of": "claude-haiku-5-5"}`，因此別名會以目標模型的價格計費。若要控制更換模型的時機，請改用特定的模型 ID。較新的目標可能會改變定價與模型行為。
