---
title: Gateway Quickstart
sidebar_label: Gateway Quickstart
description: 啟動 LiteLLM Gateway，新增模型與金鑰，然後將應用程式與 SDK 連接到單一共用端點。
---

import NavigationCards from '@site/src/components/NavigationCards';

如果您需要為團隊或平台提供一個共用的 OpenAI 相容端點，請使用此路徑。

如果您需要以 Docker 或資料庫優先的設定，請使用 [Docker + Database 教學](/docs/proxy/docker_quick_start)。否則，請使用以下步驟快速取得可運作的請求。

## 1. 安裝閘道 {#1-install-the-gateway}

```bash
uv tool install 'litellm[proxy]'
```

## 2. 設定一個提供者金鑰 {#2-set-one-provider-key}

```bash
export OPENAI_API_KEY="your-api-key"
```

## 3. 建立 `config.yaml` {#3-create-configyaml}

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: sk-1234
  database_url: postgresql://llmproxy:dbpassword9090@db:5432/litellm
```

## 4. 啟動閘道 {#4-start-the-gateway}

```bash
litellm --config config.yaml
```

您應該會看到 proxy 在 `http://0.0.0.0:4000` 啟動。

## 5. 傳送您的第一個請求 {#5-send-your-first-request}

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello from LiteLLM Gateway"}
    ]
  }'
```

## 6. 檢查回應 {#6-check-the-response}

如果請求成功，proxy 會回傳 `200 OK`，並附上 OpenAI 風格的回應。

助理文字將位於：

```json
choices[0].message.content
```

如果您的閘道路由到 OpenAI，實際回應可能如下所示：

```json
{
  "id": "chatcmpl-abc123",
  "created": 1677858242,
  "model": "gpt-4o-mini-2024-07-18",
  "object": "chat.completion",
  "system_fingerprint": "fp_406d6473f8",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?",
        "tool_calls": null,
        "function_call": null,
        "annotations": []
      }
    }
  ],
  "usage": {
    "completion_tokens": 9,
    "prompt_tokens": 13,
    "total_tokens": 22,
    "completion_tokens_details": {
      "accepted_prediction_tokens": 0,
      "audio_tokens": 0,
      "reasoning_tokens": 0,
      "rejected_prediction_tokens": 0
    },
    "prompt_tokens_details": {
      "audio_tokens": 0,
      "cached_tokens": 0
    }
  },
  "service_tier": "default"
}
```

`id`、`created`、解析後的模型版本、token 數量與訊息文字都會依請求而有所不同。其他提供者可能會回傳較少或略有不同的一組欄位，但 `choices[0].message.content` 是主要需要讀取的欄位。

## 7. 新增金鑰與 UI {#7-add-keys-and-the-ui}

如果您需要虛擬金鑰、支出追蹤或管理 UI，請先新增資料庫。

- 在 `general_settings` 下新增 `database_url`
- 使用 [Virtual keys](/docs/proxy/virtual_keys) 進行金鑰建立與預算管理
- 使用 [Admin UI](/docs/proxy/ui) 管理模型與金鑰
- 如果您想要更完整的設定，請使用 [Docker + Database 教學](/docs/proxy/docker_quick_start)

## 8. 選擇您的下一步 {#8-pick-your-next-step}

<NavigationCards
columns={3}
items={[
  {
    icon: "🖥️",
    title: "進行 LLM 請求",
    description: "將 LiteLLM 或相容於 OpenAI 的用戶端指向閘道。",
    to: "/docs/proxy/user_keys",
  },
  {
    icon: "🎛️",
    title: "模型設定",
    description: "新增更多模型與閘道設定。",
    to: "/docs/proxy/configs",
  },
  {
    icon: "🔑",
    title: "虛擬金鑰",
    description: "建立金鑰、預算與存取控制。",
    to: "/docs/proxy/virtual_keys",
  },
  {
    icon: "📈",
    title: "新增記錄",
    description: "擷取記錄、支出與追蹤。",
    to: "/docs/proxy/logging",
  },
  {
    icon: "🔀",
    title: "負載平衡",
    description: "跨部署、區域或提供者進行路由。",
    to: "/docs/proxy/load_balancing",
  },
  {
    icon: "🛡️",
    title: "新增防護欄",
    description: "新增安全檢查與政策執行。",
    to: "/docs/proxy/guardrails/quick_start",
  },
  {
    icon: "📊",
    title: "可靠性",
    description: "設定重試、備援與逾時。",
    to: "/docs/proxy/reliability",
  },
]}
/>

## 何時改用 SDK 路徑 {#when-to-use-the-sdk-path-instead}

如果您只需要從單一應用程式呼叫模型，且不需要集中式驗證或共用基礎架構，請改從 [SDK Quickstart](/docs/learn/sdk_quickstart) 開始。
