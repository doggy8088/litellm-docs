---
title: "Sarvam AI API 與 LiteLLM：Python SDK 與閘道"
sidebar_label: "Sarvam.ai"
description: "以 sarvam/ 前綴將聊天請求傳送至 Sarvam 105B 以及 Sarvam 提供的 GLM、Gemma 與 DeepSeek 模型，再透過 AI 閘道提供給 OpenAI 用戶端與 curl。"
---

# Sarvam.ai {#sarvamai}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 支援 Sarvam 的 OpenAI 相容聊天 API，包含 Sarvam 105B 以及在 Sarvam 基礎架構上提供的開放權重模型（GLM、Gemma 與 DeepSeek）。

## 支援的模型 {#supported-models}

<SinceVersion v="1.112.0" />

| 模型 | 上下文 | 最大輸出 | 輸入 | 每百萬 token 輸入／輸出價格（美元） |
| --- | --- | --- | --- | --- |
| `sarvam/sarvam-105b` | 128K | 128K | 文字 | $0.11 / $0.27 |
| `sarvam/sarvam-105b-conversations` | 32K | 8K | 文字 | $0.11 / $0.27 |
| `sarvam/glm5.3` | 1M | 1M | 文字 | $1.34 / $4.15 |
| `sarvam/glm5.3-flash` | 1M | 1M | 文字、圖片 | $0.14 / $0.48 |
| `sarvam/gemma4` | 256K | 256K | 文字、圖片 | $0.37 / $0.96 |
| `sarvam/deepseekv4.1-flash-1017` | 1M | 1M | 文字、圖片 | $0.15 / $0.59 |
| `sarvam/deepseekv4.1-flash-1017-interactive` | 1M | 1M | 文字、圖片 | $0.27 / $1.12 |

除了 `sarvam-105b-conversations` 之外，最大輸出即為整個上下文視窗，由提示與 `max_tokens` 共用。若提示 token 加上 `max_tokens` 超出上下文，Sarvam 會拒絕該請求。

美元價格按 1 美元兌 94 盧比，自 Sarvam 的盧比定價換算而來。`sarvam-105b`、`sarvam-105b-conversations` 與 `deepseekv4.1-flash-1017` 顯示的是 Sarvam 的優惠價，適用期至 [2026 年底](https://docs.sarvam.ai/api/getting-started/pricing)。最新盧比定價請見 [Sarvam Token Factory 定價](https://www.sarvam.ai/token-factory/pricing)。

LiteLLM 會將 `sarvam-105b` 與 `sarvam-105b-conversations` 傳送至 `https://api.sarvam.ai/v1`，也就是這兩個模型原本使用的 API，其他模型則傳送至 `https://api.sarvam.ai/v2`。Sarvam 的 `/v1` API 只提供這兩個模型，因此請從其他模型移除任何指向 `https://api.sarvam.ai/v1` 的 `api_base`。在 v1.112.0 之前，LiteLLM 會將所有 `sarvam/` 模型傳送至 `/v1`，因此舊版本上只有 `sarvam-105b` 與 `sarvam-105b-conversations` 可以運作。

Sarvam 已在 `/v1` 與 `/v2` 停用舊版 `sarvam-m` 模型。如果您要從 `sarvam/sarvam-m` 升級，請改用 `sarvam/sarvam-105b`。

在 `/v1` 上，`sarvam-105b-conversations` 最多回傳 8,192 個輸出 token，`max_tokens` 設得更大時，Sarvam 會以 400 錯誤拒絕。

所有模型都支援工具呼叫、串流、結構化輸出（`response_format`）、系統訊息、`tool_choice` 與平行工具呼叫。以下七個模型都支援提示快取：`sarvam-105b`、`sarvam-105b-conversations`、`glm5.3`、`glm5.3-flash`、`gemma4`、`deepseekv4.1-flash-1017` 與 `deepseekv4.1-flash-1017-interactive`。

## 用法 {#usage}

```python
import os
from litellm import completion

# Set your Sarvam API key
os.environ["SARVAM_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Hello"}]

response = completion(
    model="sarvam/sarvam-105b",
    messages=messages,
    max_tokens=1024,
)
print(response)
```

## Responses API {#responses-api}

```python
import os
from litellm import responses

os.environ["SARVAM_API_KEY"] = "your-api-key"

response = responses(
    model="sarvam/sarvam-105b",
    input="Hello",
    max_output_tokens=1024,
)
print(response.output_text)
```

LiteLLM 會將 Responses API 呼叫傳送至 Sarvam 的聊天補全端點，因為 Sarvam 不儲存對話。若要在 proxy 上以 `previous_response_id` 繼續對話，請見 [工作階段管理](../response_api.md#session-management)。

## 搭配 LiteLLM Proxy Server 的用法 {#usage-with-litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 Sarvam.ai 模型。

1. **修改 `config.yaml`：**

    ```yaml
    model_list:
      - model_name: sarvam-105b
        litellm_params:
          model: sarvam/sarvam-105b  # add sarvam/ prefix to route as Sarvam provider
          api_key: os.environ/SARVAM_API_KEY

    general_settings:
      master_key: os.environ/LITELLM_MASTER_KEY
    ```

2. **啟動 proxy：**

    ```bash
    export SARVAM_API_KEY="your-api-key"
    export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
    echo "$LITELLM_MASTER_KEY"
    litellm --config /path/to/config.yaml
    ```

3. **向 LiteLLM Proxy Server 傳送請求：**

    Proxy 會繼續在第一個終端機中執行。開啟新的終端機，設定步驟 2 印出的金鑰：

    ```bash
    export LITELLM_MASTER_KEY="paste-the-key-from-step-2"
    ```

    <Tabs>

    <TabItem value="openai" label="OpenAI Python v1.0.0+">

    ```python
    import os

    import openai

    client = openai.OpenAI(
        api_key=os.environ["LITELLM_MASTER_KEY"],  # or a virtual key
        base_url="http://0.0.0.0:4000"    # litellm-proxy-base url
    )

    response = client.chat.completions.create(
        model="sarvam-105b",
        messages=[
            {
                "role": "user",
                "content": "what llm are you"
            }
        ],
        max_tokens=1024,
    )

    print(response)
    ```
    </TabItem>

    <TabItem value="curl" label="curl">

    ```shell
    curl --location 'http://0.0.0.0:4000/chat/completions' \
        --header "Authorization: Bearer $LITELLM_MASTER_KEY" \
        --header 'Content-Type: application/json' \
        --data '{
        "model": "sarvam-105b",
        "messages": [
            {
            "role": "user",
            "content": "what llm are you"
            }
        ],
        "max_tokens": 1024
    }'
    ```
    </TabItem>

    </Tabs>

## 推理 {#reasoning}

大多數模型會在 `reasoning_content` 中回傳推理內容。推理 token 會計入 `max_tokens`，並按輸出計費。`sarvam-105b-conversations` 不回傳推理內容，因此除非您設定 `drop_params`，LiteLLM 會拒絕對它使用 `reasoning_effort`。在 `gemma4` 上，推理預設為關閉，只有設定 `reasoning_effort` 時才會執行。有些模型只接受部分等級。自 v1.112.0 起，LiteLLM 會將其他等級進位至模型接受的下一個等級，或降至模型最強的等級。`sarvam-105b` 接受 `low`、`medium` 或 `high`，因此 `minimal` 會以 `low` 傳送，`xhigh` 或 `max` 則以 `high` 傳送。`glm5.3` 與 `glm5.3-flash` 接受 `low`、`high` 或 `max`，因此 `medium` 會以 `high` 傳送。LiteLLM 絕不會變更 `reasoning_effort="none"`。在 `sarvam-105b`、`glm5.3` 與 `glm5.3-flash` 上，Sarvam 會以 400 錯誤拒絕它；若您設定 `drop_params`，LiteLLM 會改為捨棄該參數，因此推理保持開啟。若要在 `sarvam-105b` 上關閉推理，請以 `api_base` 將它指向 `https://api.sarvam.ai/v2`，並保持 `drop_params` 關閉。那裡的部分呼叫會停滯，請遵循限制一節中的逾時建議。以下呼叫會要求 `gemma4` 進行推理：

```python
response = completion(
    model="sarvam/gemma4",
    messages=[{"role": "user", "content": "Is 221 a prime number?"}],
    reasoning_effort="low",
    max_tokens=2048,
)
print(response.choices[0].message.reasoning_content)
```

## Token 上限 {#token-limits}

- 未設定 `max_tokens` 時，`glm5.3` 會在 2048 個輸出 token 處停止，且推理可能用掉全部額度，導致 `content` 為空。`gemma4` 與 `deepseekv4.1-flash-1017` 在我們的測試中回傳了較長的答案。請在每個模型上明確設定 `max_tokens`。
- Responses API 遵循相同的預設值，因為 LiteLLM 會將這些呼叫傳送至 Sarvam 的聊天補全端點。請明確設定 `max_output_tokens`。
- 推理 token 會計入輸出額度，並按輸出計費。

## 限制 {#limitations}

- 圖片必須以 base64 data URI 傳送；遠端的 `http(s)` URL 會被拒絕。
- Beta 模型需要 Beta 存取權限，上面未列出。
- 部分傳送至 `sarvam-105b` 的 `/v2` 請求會停滯且沒有回應，因此 LiteLLM 會將 `sarvam-105b` 與 `sarvam-105b-conversations` 保留在 `/v1`。如果您以 `api_base` 將其中任一模型指向 `/v2`，請同時將 `timeout` 設為略高於您預期最長的回應時間，並搭配 `num_retries`，讓 LiteLLM 重試停滯的呼叫，而不是等到預設逾時；SDK 的預設逾時為 600 秒，proxy 為 6000 秒。每次停滯的嘗試仍會等滿整個 `timeout` 才開始重試：

    ```yaml
    model_list:
      - model_name: sarvam-105b
        litellm_params:
          model: sarvam/sarvam-105b
          api_key: os.environ/SARVAM_API_KEY
          api_base: https://api.sarvam.ai/v2
          timeout: 120
          num_retries: 2
    ```
