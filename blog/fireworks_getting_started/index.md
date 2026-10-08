---
slug: fireworks-getting-started
title: "在 LiteLLM 上開始使用 Fireworks AI"
date: 2026-09-22T10:00:00
authors:
  - misbah
description: "初學者教學：在 LiteLLM 閘道後方於 Fireworks AI 上執行開放模型，使用您已在用的 OpenAI SDK 呼叫它，然後再新增第二個模型與備援。"
keywords: [fireworks ai, litellm tutorial, ai gateway, open models, getting started, openai compatible, llm proxy]
tags: [tutorial, providers, fireworks, getting-started]
hide_table_of_contents: false
image: ./hero.png
---

Fireworks AI 是最大的開放模型推論平台之一，每天為包括 Uber、Notion、DoorDash 和 Cursor 在內的公司處理超過 40 兆個 token。LiteLLM 是使用最廣泛的開源 AI 閘道，容器拉取次數超過 5 億次。兩者結合後，您可以在單一 OpenAI 相容端點後方使用快速、低成本的開放模型，並追蹤您花費的每個 token。

{/* truncate */}

## Fireworks AI 能為您提供什麼 {#what-fireworks-ai-gives-you}

Fireworks AI 在快速推論基礎架構上提供開放模型。像 DeepSeek、Qwen、GLM、Kimi、MiniMax 和 GPT-OSS 這些系列都可作為無伺服器端點使用，您可以立即用 API 金鑰呼叫。隨著需求成長，您可以在自己的 Fireworks 帳戶內代管模型，保留專用部署以獲得一致的吞吐量，或指向 Fireworks 路由器，讓您保持在模型系列的目前版本。開放模型在 Fireworks 上執行速度快，而且成本只是前沿定價的一小部分；由於權重是開放的，您可以用自己的資料對其微調，並從同一平台提供結果。

## LiteLLM 能為您提供什麼 {#what-litellm-gives-you}

LiteLLM 是一個開源 AI 閘道。您將它部署在模型前方，並為每個提供者提供一個 OpenAI 相容 API。您的應用程式只需向單一端點送出標準的 OpenAI 請求，閘道就會處理提供者特定的細節。它也會追蹤每個請求的 token 用量與成本，發放附帶預算的金鑰，並且在某個模型忙碌時自動備援到另一個模型。

## 一起使用時您能得到什麼 {#what-you-get-together}

您的應用程式程式碼以 OpenAI 格式與單一端點溝通，完全不知道 Fireworks 位於其後。變更哪個模型為某條路由提供服務，只是設定檔中的一行，因此您可以在不重新部署的情況下，將流量移到更便宜或更快的模型。從第一個請求開始，支出就會依金鑰與團隊顯示。當 Fireworks 新增您想要的模型，或您將某條路由移到以自己的資料微調的版本時，只要編輯那一行即可。

## 您需要什麼 {#what-you-need}

來自 [Fireworks 儀表板](https://fireworks.ai) 的 Fireworks API 金鑰、Python 3.10 或更新版本，以及幾分鐘時間。使用 `pip install 'litellm[proxy]'` 安裝閘道。

## 1. 撰寫設定檔 {#1-write-a-config-file}

建立只有一個模型的 `config.yaml`。`model_name` 是您的應用程式會使用的名稱。其下方的 `model` 是真正的 Fireworks 模型，而 `fireworks_ai/` 前綴會告訴閘道要路由到哪個提供者。

```yaml title="config.yaml"
model_list:
  - model_name: my-model
    litellm_params:
      model: fireworks_ai/deepseek-v4p1-flash
      api_key: os.environ/FIREWORKS_AI_API_KEY
```

撰寫 `os.environ/FIREWORKS_AI_API_KEY` 可讓金鑰不會出現在檔案中。閘道會在啟動時從環境中讀取它。

## 2. 啟動閘道 {#2-start-the-gateway}

```bash
export FIREWORKS_AI_API_KEY="your-key-here"
litellm --config config.yaml
```

閘道會在 `http://0.0.0.0:4000` 啟動。

## 3. 送出請求 {#3-send-a-request}

任何相容 OpenAI 的用戶端都可以使用。使用 curl：

```bash
curl http://0.0.0.0:4000/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "my-model",
    "messages": [{"role": "user", "content": "what llm are you"}]
  }'
```

或者使用 OpenAI Python SDK，只需變更 `base_url`：

```python
import openai

client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000",
)

response = client.chat.completions.create(
    model="my-model",
    messages=[{"role": "user", "content": "write a haiku about gateways"}],
)

print(response.choices[0].message.content)
```

請注意，請求中的模型名稱是 `my-model`，也就是您選擇的別名，並已在 config.yaml 檔案中加入。

## 4. 新增第二個模型與備援 {#4-add-a-second-model-and-a-fallback}

您可以新增任意多個模型。在本教學中，它們位於 `config.yaml`，因此請將另一個項目加入 `model_list`，然後告訴路由器在第一個模型無法使用時嘗試第二個模型。一旦連接資料庫，您也可以從閘道儀表板新增與編輯模型，而無需重新啟動。

```yaml title="config.yaml"
model_list:
  - model_name: my-model
    litellm_params:
      model: fireworks_ai/deepseek-v4p1-flash
      api_key: os.environ/FIREWORKS_AI_API_KEY

  - model_name: my-backup
    litellm_params:
      model: fireworks_ai/glm-5p3-flash
      api_key: os.environ/FIREWORKS_AI_API_KEY

router_settings:
  fallbacks: [{"my-model": ["my-backup"]}]
```

重新啟動閘道後，您的應用程式會持續呼叫 `my-model`。速率限制與暫時性錯誤現在會自動路由到備用模型。

## 接下來可以去哪裡 {#where-to-go-next}

一旦基礎功能運作起來，同一個設定檔就是您觸及平台其餘部分的地方。帳戶代管模型使用其完整的 `accounts/fireworks/models/...` 路徑，專用部署會新增 `api_base`，而 Fireworks 路由器會採用 `routers/` 前綴。對 `/v1/responses` 的請求會到達原生 Fireworks Responses API，因此伺服器端 MCP 工具與回應串接可透過閘道運作。文件內嵌可讓不支援視覺功能的模型讀取文件與圖片。嵌入、重新排序與音訊轉錄都會透過同一個金鑰與同一套支出追蹤路由。

若要發放具有各自預算的範圍內金鑰，請連接 Postgres 資料庫並設定主金鑰；請參閱 [虛擬金鑰](/docs/proxy/virtual_keys)。完整的提供者參考文件位於 [Fireworks AI 文件](/docs/providers/fireworks_ai)。
