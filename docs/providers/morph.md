---
title: "透過 LiteLLM 使用 Morph API：聊天與 Fast Apply"
sidebar_label: "Morph"
description: "執行 Morph 的開放權重 Kimi K3、GLM-5.3 與 DeepSeek V4.1 Flash，支援工具、reasoning effort 與前綴快取，或使用 Fast Apply 套用程式碼編輯。"
---

# Morph {#morph}

透過 LiteLLM 使用 [Morph](https://www.morphllm.com/) 的開放權重聊天模型與 Fast Apply 程式碼編輯。設定 `MORPH_API_KEY`，並在模型 ID 前加上 `morph/` 前綴。LiteLLM 預設使用 `https://api.morphllm.com/v1`。

## 快速開始 {#quickstart}

在 [Morph 儀表板](https://www.morphllm.com/dashboard/api-keys) 建立金鑰，然後在您的環境中設定它。

```bash
pip install -U 'litellm[proxy]'
export MORPH_API_KEY="<your-morph-api-key>"
```

```python
from litellm import completion

response = completion(
    model="morph/morph-dsv41flash",
    messages=[{"role": "user", "content": "Write a Python function that adds two numbers."}],
)
print(response.choices[0].message.content)
```

## 開放權重模型 {#open-weight-models}

Morph 文件記載這些模型具有 1M token 的上下文視窗。在 SDK 呼叫或 proxy 設定中使用確切的 LiteLLM 模型字串。

| 模型 | LiteLLM 模型字串 |
| --- | --- |
| Kimi K3 | `morph/morph-kimik3` |
| Kimi K3 Fast | `morph/morph-kimik3-fast` |
| GLM-5.3 | `morph/morph-glm53-744b` |
| GLM-5.3-Flash | `morph/morph-glm53flash` |
| DeepSeek V4.1 Flash | `morph/morph-dsv41flash` |
| DeepSeek V4.1 Flash 1017 | `morph/morph-dsv41flash-1017` |
| DeepSeek V4.1 Flash Abliterated | `morph/morph-dsv41flash-abliterated` |
| DeepSeek V4 Flash 0731 | `morph/morph-dsv4flash` |


abliterated 模型需要 [Morph 的核准](https://docs.morphllm.com/sdk/components/fast-models#deepseek-uncensored)。模型存取也取決於您的帳號配額與可用的提供者容量。

開放權重模型接受工具、`response_format` 與 `reasoning_effort`。DeepSeek V4.1 Flash 預設啟用推理。使用 `reasoning_effort="none"` 可將其停用，或省略該參數以使用 Morph 的預設值。

## 使用 AI Gateway {#use-the-ai-gateway}

將此部署加入 `config.yaml`。

```yaml
model_list:
  - model_name: morph-deepseek
    litellm_params:
      model: morph/morph-dsv41flash
      api_key: os.environ/MORPH_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

產生一組 gateway 金鑰，然後在同一個環境中匯出兩組金鑰並啟動 gateway。Morph 金鑰驗證上游請求；LiteLLM 金鑰則驗證您的應用程式對 gateway 的存取。

```bash
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
litellm --config config.yaml --port 4000
```

將請求傳送至本機 gateway。回應在 `choices[0].message.content` 中包含模型的回答，並在 `usage` 中包含 token 計數。

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "morph-deepseek",
    "messages": [{"role": "user", "content": "Reply with exactly OK."}],
    "reasoning_effort": "none"
  }'
```

對於共用部署，請給應用程式[虛擬金鑰](../proxy/virtual_keys.md)，而不是 gateway 的 master key。

## 串流與前綴快取 {#streaming-and-prefix-caching}

Morph 會自動快取相符的 prompt 前綴。在各回合之間保持 system prompt、工具定義與既有訊息不變。為每個對話傳送唯一的 `x-session-id`，以改善 worker 親和性。

```python
from uuid import uuid4
from litellm import completion

session_id = str(uuid4())

response = completion(
    model="morph/morph-dsv41flash",
    messages=[{"role": "user", "content": "Explain Python generators."}],
    extra_headers={"x-session-id": session_id},
    stream=True,
    stream_options={"include_usage": True},
)

for chunk in response:
    if chunk.choices:
        print(chunk.choices[0].delta.content or "", end="")
    if chunk.usage:
        print(chunk.usage)
```

在該對話的後續回合中重複使用 `session_id`。不要在不相關的對話之間共用同一個值。`prompt_cache_key` 也受支援，但 Morph 文件將它記載為區域放置提示，而 `x-session-id` 則是選取 worker。

`usage.prompt_tokens` 包含已快取與未快取的輸入。`usage.prompt_tokens_details.cached_tokens` 計算重複使用的 token。LiteLLM 依模型的型錄費率計算成本：

```text
uncached input = prompt_tokens - cached_tokens
cost = uncached input * input rate
     + cached_tokens * cache-read rate
     + completion_tokens * output rate
```

Morph 對新前綴以一般輸入費率收費，沒有快取寫入附加費。它在本文測試的 Chat Completions 回應上不回報個別的快取建立 token 計數。LiteLLM 不會推斷每個未快取的 token 都已儲存。推理 token 計入計費輸出。

請參閱 Morph 的[定價頁面](https://www.morphllm.com/pricing)與[快取指南](https://docs.morphllm.com/sdk/components/caching)。型錄使用的是直接的定價頁面與快取指南。Morph 的[機器可讀型錄](https://www.morphllm.com/api/models/json)目前對數個模型列出不同的費率。在 Morph 調和這些來源之前，請將 LiteLLM 計算的成本視為估計值，並對照您的 Morph 帳號核對費用。

## 工具與結構化輸出 {#tools-and-structured-output}

`tools` 與 `tool_choice` 使用 OpenAI 工具格式。若要嚴格的回應形狀，傳入 JSON schema。

```python
from litellm import completion

response = completion(
    model="morph/morph-dsv41flash",
    messages=[{"role": "user", "content": "Return JSON with status equal to ok."}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "status",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {"status": {"type": "string", "enum": ["ok"]}},
                "required": ["status"],
                "additionalProperties": False,
            },
        },
    },
)
print(response.choices[0].message.content)
```

## Fast Apply {#fast-apply}

`morph/morph-v3-fast` 與 `morph/morph-v3-large` 將編輯套用到現有程式碼。給它們一條指令、原始程式碼與提議的更新。它們使用與聊天模型不同的 prompt，且不支援上述僅限聊天的選項。

```python
from litellm import completion

response = completion(
    model="morph/morph-v3-fast",
    messages=[{
        "role": "user",
        "content": """<instruction>Change the greeting to Hello, world!</instruction>
<code>print("Hello")</code>
<update>print("Hello, world!")</update>""",
    }],
)
print(response.choices[0].message.content)
```

使用 `stream=True` 串流編輯結果。prompt 需求請參閱 [Morph 的 Fast Apply 指南](https://docs.morphllm.com/sdk/components/fast-apply)。

## 端點與錯誤處理 {#endpoint-and-error-handling}

以 `api_base` 或 `MORPH_API_BASE` 覆寫 API base。當您不使用環境變數時，以 `api_key` 傳入明確的金鑰。

`401` 表示驗證問題。帶有 `Monthly quota exceeded` 的 `402` 需要更多 Morph 配額。`429` 可能表示速率限制或模型容量不可用；請遵循提供者的重試指引。
