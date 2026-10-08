---
title: "[Beta] Rust AI Gateway"
description: 在 Rust 核心上執行 LiteLLM 請求轉譯。可在您既有的 Python 伺服器上為每個模型啟用，或執行獨立的 Axum 伺服器。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# [Beta] Rust AI Gateway {#beta-rust-ai-gateway}

:::info

這是一項 beta 功能，且其涵蓋範圍仍在持續擴充。Rust 核心採取 opt-in，預設為關閉；任何失敗或尚未支援的 Rust 路徑都會自動回退到既有的 Python 路徑，因此啟用它不會破壞 Python 已經能處理的請求。

Anthropic `/v1/messages` 路由的每個模型 `rust: true` 旗標可在 `v1.94.0` 及以上版本使用；它首次隨 `v1.94.0-rc.1` 釋出。

`anthropic` 上的 `/chat/completions` 與 `bedrock` 涵蓋範圍較新，並將在即將推出的版本中發布

在 `/chat/completions` 上，該自動回退涵蓋 Rust 路徑未接受的請求；這是在呼叫提供者之前決定的。已經到達提供者並隨後失敗的呼叫，會回傳其錯誤，而不是回退到 Python 路徑重試

:::

LiteLLM 正在將其請求／回應轉譯移植到 Rust 核心（`litellm-rust` 工作區，隨 LiteLLM wheel 一併提供）。目標是在 Python 持續負責驗證、設定、路由、記錄、回呼與支出追蹤的同時，降低每個請求的 CPU 與延遲，直到每條 Rust 路徑都具備等效覆蓋。

有兩種採用方式。

## 模式 1：在您既有的 Python 伺服器上啟用 Rust（低風險） {#mode-1-enable-rust-on-your-existing-python-server-low-risk}

模式 1 會保留您目前的部署。Python proxy 仍會終結請求、執行驗證與路由，並呼叫您的回呼；只有下列受支援路由的提供者轉譯與網路呼叫會透過 Rust 核心執行。由於它是針對每個模型 opt-in，且在任何錯誤時都會回退到 Python，因此這是建議的起始方式。

在模型的 `litellm_params` 中設定 `rust: true`。部署的其他部分維持不變。

```yaml title="config.yaml"
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      rust: true            # run this deployment through the Rust core

  - model_name: azure-claude
    litellm_params:
      model: azure_ai/{{anthropic}}
      api_base: os.environ/AZURE_AI_API_BASE
      api_key: os.environ/AZURE_AI_API_KEY
      rust: true
```

由 Rust 核心提供的回應會帶有 `x-litellm-rust: true` 標頭，因此您可以針對每個請求確認路徑：

```bash
curl -i http://localhost:4000/v1/messages \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "{{anthropic}}",
    "max_tokens": 128,
    "messages": [{"role": "user", "content": "hello from rust"}]
  }'
```

請在回應標頭中尋找 `x-litellm-rust: true`。如果標頭不存在，表示該請求是由 Python 路徑提供的（可能是因為該路由／提供者尚未移植到 Rust，或是因為 Rust 錯誤觸發了自動回退）。

### 目前 `rust: true` 涵蓋哪些內容 {#what-rust-true-covers-today}

Rust 核心涵蓋的路由子集持續增加。當某個路由或提供者未列出時，即使已設定 `rust: true`，該部署仍會透明地留在 Python 路徑上。

| 路由 | Rust 路徑上的提供者 |
| --- | --- |
| `/chat/completions` | `anthropic`、`bedrock`（Converse） |
| Anthropic `/v1/messages` | `anthropic`、`azure_ai` |
| 音訊轉錄 | `bedrock` |
| Responses API WebSockets | `openai` |

Anthropic `/v1/messages` 路由支援串流；需要 agentic completion hook 的請求會留在 Python 路徑上，以便該 hook 仍能執行。

在 `/chat/completions` 上，Rust 核心會處理非串流文字對話。當每則訊息都是 `system`、`user` 或 `assistant` 訊息，且其內容為字串或非空的 `{"type": "text", "text": ...}` 部件清單，對話以使用者輪次開啟，且唯一設定的取樣參數為 `max_tokens`、`temperature`、`top_p`、`stop`，以及在 `anthropic` 上的 `top_k` 時，該請求會在 Rust 上執行。Bedrock 透過 Converse 提供服務，這是 Bedrock 上 Claude 模型的預設路由，且另外需要對話以使用者輪次結束，因為 Converse 沒有 assistant prefill

哪條路徑會提供該請求，是在呼叫提供者之前決定的，因此任何超出該子集的內容都會由 Python 提供服務，不需要變更設定也不會產生錯誤。這涵蓋任何帶有 `stream: true` 的請求、tool calls 和 tool results、圖片與其他非文字內容部件、內容清單為空的訊息、`response_format` 與 JSON mode、extended thinking、prompt caching、`top_k` on `bedrock`、高於 1 的 `n`，以及 Rust 路徑無法識別的其他任何參數。在這條路由上，一旦 provider 呼叫已送出，選擇就成為最終結果：此後的失敗會回傳錯誤，而不是在 Python 上重試，因為重試會再次送出相同的 provider 呼叫並重複計費

回應本文在兩條路徑上都相同，包括 token 計數，因此標頭是唯一的區分方式：Rust 提供的回應會帶有 `x-litellm-rust: true`，而 Python 提供的回應則不會帶有此類標頭

## 模式 2：執行獨立的 Axum 伺服器 {#mode-2-run-the-standalone-axum-server}

模式 2 以 Rust `litellm-ai-gateway` Axum 伺服器二進位檔取代 Python 主機，因此路由與網路 I/O 會完全在 Rust 中執行。這是吞吐量上限更高的選項，但目前涵蓋的路由比 Python 主機少，且尚未具備完整的 proxy 功能集。

:::note[待處理]

目前尚未發布 Axum 伺服器的預建 Docker 映像。這一節會在該映像推出後，補上映像參考與部署範例。期間您可以使用 `litellm-rust` 工作區搭配 `server` 功能自行建置伺服器；若您想提前試用，請在社群頻道與我們聯絡。

:::
