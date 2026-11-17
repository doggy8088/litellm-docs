---
title: "搭配 LiteLLM 使用 Cloudflare Workers AI API"
sidebar_label: "Cloudflare Workers AI"
description: "透過 LiteLLM Python SDK 呼叫 Llama 2、CodeLlama 等 Cloudflare Workers AI 聊天模型，並支援串流、Clef 決策模型與 Clairic 擷取。"
---

# Cloudflare Workers AI {#cloudflare-workers-ai}

LiteLLM 透過 Python SDK 呼叫 Cloudflare Workers AI 的聊天與決策模型時會加上 `cloudflare/` 前綴，並使用您的 `CLOUDFLARE_API_KEY` 與 `CLOUDFLARE_ACCOUNT_ID`，且支援串流。

https://developers.cloudflare.com/workers-ai/models/text-generation/

## 聊天與決策模型端點 {#chat-and-decision-model-endpoints}

Cloudflare Workers AI 對聊天完成與決策模型使用不同的端點：

| 模型類型 | Workers AI 端點 | 請求格式 |
| --- | --- | --- |
| 聊天完成 | `/ai/v1/chat/completions` | 與 OpenAI 相容的 `model` 與 `messages` |
| 決策（Clef） | `/ai/run/{model}` | Workers AI 原生的 `state`、具型別的 `questions`、支援模型可選的 `images`，以及 `@cf/cloudflare/clef-omni` 可選的[音訊與視訊片段](../decisions.md#audio-and-video-input) |

兩條路徑都以 `https://api.cloudflare.com/client/v4/accounts/{account_id}` 為前綴。

對於聊天完成，LiteLLM 預設使用以 `/ai/v1` 結尾的 `api_base`。如果您提供的聊天 `api_base` 以 `/ai/run` 結尾，LiteLLM 會記錄警告並將其改寫為 `/ai/v1`。

對於 `@cf/cloudflare/clef`、`@cf/cloudflare/clef-flash` 與 `@cf/cloudflare/clef-omni` 等決策模型，LiteLLM 使用原生的 `/ai/run/{model}` 端點。這些模型仍必須使用 `/ai/run` 路徑。明確設定決策部署時，請保留以 `/ai/run` 結尾的獨立 `api_base`；不要為了配合聊天部署而將其改為 `/ai/v1`。

Clef 模型不接受透過 `/ai/v1/chat/completions` 傳送聊天 `messages`。請改用 LiteLLM 的決策 API 處理這些模型；LiteLLM 會將決策請求轉換為 Cloudflare 的原生格式。

## API 金鑰 {#api-key}
```python
# env variable
os.environ['CLOUDFLARE_API_KEY'] = "3dnSGlxxxx"
os.environ['CLOUDFLARE_ACCOUNT_ID'] = "03xxxxx"
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['CLOUDFLARE_API_KEY'] = "3dnSGlxxxx"
os.environ['CLOUDFLARE_ACCOUNT_ID'] = "03xxxxx"

response = completion(
    model="cloudflare/@cf/meta/llama-2-7b-chat-int8", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['CLOUDFLARE_API_KEY'] = "3dnSGlxxxx"
os.environ['CLOUDFLARE_ACCOUNT_ID'] = "03xxxxx"

response = completion(
    model="cloudflare/@hf/thebloke/codellama-7b-instruct-awq", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 支援的模型 {#supported-models}
此處列出的所有模型 https://developers.cloudflare.com/workers-ai/models/text-generation/ 都支援

| 模型名稱                        | 函式呼叫                                            |
|-----------------------------------|----------------------------------------------------------|
| @cf/meta/llama-2-7b-chat-fp16     | `completion(model="mistral/mistral-tiny", messages)`    |
| @cf/meta/llama-2-7b-chat-int8     | `completion(model="mistral/mistral-small", messages)`   |
| @cf/mistral/mistral-7b-instruct-v0.1 | `completion(model="mistral/mistral-medium", messages)` |
| @hf/thebloke/codellama-7b-instruct-awq | `completion(model="codellama/codellama-medium", messages)` |

## Clairic 擷取 {#clairic-extraction}

[Clairic](https://developers.cloudflare.com/workers-ai/models/clairic/) 是 Cloudflare 的具型別擷取模型。使用相同的 `CLOUDFLARE_API_KEY` 與 `CLOUDFLARE_ACCOUNT_ID`，透過 proxy 的 `/v1/extraction` 路由或 `litellm.extraction`，以 `cloudflare/@cf/cloudflare/clairic` 或 `cloudflare/clairic` 呼叫。請求與回應格式、錯誤與定價請參閱 [/v1/extraction](../extraction.md)。 <SinceVersion v="1.108.0" />
