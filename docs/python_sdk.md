---
id: python_sdk
title: LiteLLM Python SDK
sidebar_label: 總覽
description: 使用 LiteLLM SDK 從 Python 呼叫 100+ 個 LLM 提供者並執行代理程式任務。使用 completion() 進行模型呼叫，並使用 agent() 執行代理程式任務。
---

import NavigationCards from '@site/src/components/NavigationCards';

# LiteLLM Python SDK {#litellm-python-sdk}

LiteLLM Python SDK 讓您以單一介面，以 OpenAI 格式呼叫 100+ 個 LLM 提供者，例如 OpenAI、Anthropic、Vertex AI 與 Bedrock。同一個套件可以執行[使用 `litellm.agent()` 的代理程式](/docs/harness)，包括 Claude Code、Codex、OpenCode、Pi、Deep Agents 與 Tool Loop。

您將 SDK 匯入應用程式碼中。您不需要運作伺服器。

## 安裝 SDK {#install-the-sdk}

```shell
uv add litellm
```

您也可以使用 `pip install litellm`。

若要更精簡的預設安裝，請在全新環境中使用 [LiteLLM Core](./litellm_core.md)。它保留相同的 `litellm` 匯入方式，並讓 AWS 與 Python Hugging Face tokenizer 相依性成為選用。每個環境只安裝一個發行版：`litellm` 與 `litellm-core` 無法共存

## 發出請求 {#make-a-request}

設定您的提供者 API 金鑰。然後以 `provider/model` 格式的模型名稱呼叫 `completion()`：

```python
from litellm import completion
import os

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

response = completion(
    model="anthropic/{{anthropic}}",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)
print(response.choices[0].message.content)
```

若要使用不同的提供者，請變更模型名稱與 API 金鑰。請求與回應的程式碼保持不變。完整流程請參閱 [快速入門](/docs/learn/sdk_quickstart)。

## SDK 的功能 {#what-the-sdk-does}

- **單一介面。** 每個提供者使用相同的 `completion()` 函式與相同的參數。
- **單一輸出格式。** 每個回應都是 OpenAI 格式，適用於所有提供者。
- **代理程式。** 使用 `agent()` 執行代理程式任務、串流事件，並以 `agent_session()` 保持多輪工作階段。為每項任務選擇執行框架與模型。
- **例外對應。** SDK 會將提供者錯誤轉換為 OpenAI 例外類型。您攔截 OpenAI 例外的程式碼也能攔截每個提供者的錯誤。
- **自動路由。** 建立 [Python 中的 Autorouter](/docs/autorouter_sdk)，依每個請求的複雜度選擇模型。
- **路由。** [Router](/docs/routing) 讓您在各部署之間進行重試、備援與負載平衡。
- **回呼。** 只需一行程式碼，即可將記錄與成本傳送至 Langfuse、MLflow、Helicone 與其他工具。

## SDK 函式 {#sdk-functions}

每個函式都有一個帶有前綴 `a` 的非同步版本。例如，`completion()` 的非同步版本是 `acompletion()`。

| 函式 | 用途 | 參考 |
|---|---|---|
| `completion()` | 將聊天訊息傳送至模型 | [completion()](/docs/completion/input) |
| `agent()` | 以您選擇的執行框架與模型執行代理程式任務 | [LiteLLM SDK 中的代理程式](/docs/harness) |
| `responses()` | 使用 OpenAI Responses API 格式 | [responses()](/docs/response_api) |
| `embedding()` | 取得文字的向量嵌入 | [embedding()](/docs/embedding/supported_embedding) |
| `image_generation()` | 依文字提示產生圖片 | [image_generation()](/docs/image_generation) |
| `transcription()` | 將語音音訊轉換為文字 | [transcription()](/docs/audio_transcription) |
| `speech()` | 將文字轉換為語音音訊 | [speech()](/docs/text_to_speech) |
| `rerank()` | 依與查詢的相關性排序文件 | [rerank()](/docs/rerank) |

LiteLLM 支援的所有端點，請參閱 [支援的端點](/docs/supported_endpoints)。

## 常見工作 {#frequent-tasks}

| 工作 | 頁面 |
|---|---|
| 設定 API 金鑰、API 基礎 URL 與 API 版本 | [設定金鑰](/docs/set_keys) |
| 以串流方式取得回應 | [串流](/docs/completion/stream) |
| 攔截提供者錯誤 | [例外對應](/docs/exception_mapping) |
| 將記錄傳送至可觀測性工具 | [回呼](/docs/observability/callbacks) |
| 計算 token 用量與成本 | [Token 用量](/docs/completion/token_usage) |
| 加入重試、備援與負載平衡 | [Router](/docs/routing) |
| 快取回應 | [快取](/docs/caching/all_caches) |
| 從 Python 執行代理程式 | [LiteLLM SDK 中的代理程式](/docs/harness) |

## 執行緒與並行 {#threads-and-concurrency}

SDK 不是執行緒安全的。`litellm.api_key`、`litellm.callbacks`、`litellm.cache` 等設定以及記錄設定，都是程序全域的，且 SDK 不會將它們鎖定。

不支援自由執行緒（no-GIL）的 Python 建置版本。

若要同時傳送許多請求，請在單一事件迴圈上使用非同步函式，例如 `acompletion()`。您也可以將請求傳送至 [AI Gateway](/docs/simple_proxy)。

## SDK 或 AI Gateway {#sdk-or-ai-gateway}

若您從單一 Python 應用程式向 LLM 傳送請求，請使用 SDK。若有多個應用程式傳送請求，或需要虛擬金鑰、用量追蹤，或集中在一處的記錄，請使用 [AI Gateway](/docs/simple_proxy)。

SDK 也可以將請求傳送至 AI Gateway。在模型名稱加上前綴 `litellm_proxy/`。請參閱 [將 LiteLLM Proxy 作為提供者](/docs/providers/litellm_proxy)。

## 後續步驟 {#next-steps}

<NavigationCards
columns={3}
items={[
{
title: "快速入門",
description: "安裝 SDK 並發出您的第一個請求。",
to: "/docs/learn/sdk_quickstart",
},
{
title: "提供者",
description: "查詢每個提供者的模型名稱、憑證與參數。",
to: "/docs/providers",
},
{
title: "Router",
description: "在您的應用程式碼中加入重試、備援與負載平衡。",
to: "/docs/routing",
},
]}
/>
