---
title: "使用 LiteLLM 的 ResetData API：Python SDK 與閘道"
sidebar_label: "ResetData"
description: "從 LiteLLM Python SDK 或 AI 閘道呼叫 ResetData 的 GLM、Qwen、Gemma、DeepSeek 與 Whisper 模型，支援串流與以美元計的支出追蹤。"
---

# ResetData {#resetdata}

[ResetData](https://docs.resetdata.ai) 是澳洲主權 AI 推論平台，提供與 OpenAI 相容的聊天補全與音訊轉錄 API。ResetData 的模型 id 是 `provider/model` 形式的 slug，因此完整的 LiteLLM 模型 id 有三段，例如 `resetdata/zai/glm-5.3`。LiteLLM 在將模型值傳送給 ResetData 之前，只會移除 `resetdata/` 前綴。

<SinceVersion v="1.112.0" />

提供者支援已在 [PR #50819](https://github.com/BerriAI/litellm/pull/50819) 中加入。請使用此版本或包含該提供者的更新建置版本。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者前綴 | `resetdata/` |
| API 金鑰環境變數 | `RESETDATA_API_KEY` |
| 預設 API 基礎網址 | `https://api.resetdata.ai/api/v1` |
| 選用的 API 基礎網址覆寫 | `RESETDATA_API_BASE` 或 `api_base` 參數 |
| 上游端點 | `/chat/completions`、`/audio/transcriptions` |
| 提供者文件 | [ResetData 文件](https://docs.resetdata.ai) |

## 設定 {#setup}

請先在 ResetData 平台建立 API 金鑰並匯出，再啟動 SDK 或閘道：

```bash
export RESETDATA_API_KEY="your-resetdata-api-key"
```

從 ResetData 型錄中挑選一個模型，並在前面加上 `resetdata/` 前綴，例如 `resetdata/zai/glm-5.3`。

## LiteLLM Python SDK {#litellm-python-sdk}

```python
from litellm import completion

response = completion(
    model="resetdata/zai/glm-5.3",
    messages=[{"role": "user", "content": "Say hello in five words"}],
    max_tokens=2000,
)

print(response.choices[0].message.content)
```

如需串流，請傳入 `stream=True` 並逐一處理回應區塊：

```python
from litellm import completion

response = completion(
    model="resetdata/zai/glm-5.3",
    messages=[{"role": "user", "content": "Say hello in five words"}],
    max_tokens=2000,
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

部分 ResetData 模型支援推理，而推理 token 會計入 `max_tokens`。請為兩者預留足夠空間，否則回應可能在出現任何可見文字之前就結束。

LiteLLM 只會接受下表所列推理模型的 `reasoning_effort`。對於其他 ResetData 模型（包括 ResetData 標示支援推理、但未列於下表的模型），LiteLLM 會在呼叫 ResetData 之前，以 `UnsupportedParamsError` 拒絕 `reasoning_effort`。請在呼叫時設定 `drop_params=True`，或在閘道的 `litellm_settings` 下設定 `drop_params: true`，以捨棄該參數並傳送其餘請求。若仍要將 `reasoning_effort` 傳送給 ResetData，請在呼叫時傳入 `allowed_openai_params=["reasoning_effort"]`，或在部署的 `litellm_params` 中設定 `allowed_openai_params: ["reasoning_effort"]`。若模型不支援，ResetData 會回應 400。

## LiteLLM 閘道 {#litellm-gateway}

請使用 `pip install 'litellm[proxy]'` 安裝 proxy。在閘道處理程序上設定 `RESETDATA_API_KEY`，並將 `LITELLM_MASTER_KEY` 設定為一組強金鑰，供閘道用戶端使用。ResetData 金鑰用於驗證上游請求，主金鑰則用於向 LiteLLM 驗證您的用戶端。

```bash
export RESETDATA_API_KEY="your-resetdata-api-key"
export LITELLM_MASTER_KEY="sk-your-strong-master-key"
```

請將此設定儲存為 `config.yaml`：

```yaml
model_list:
  - model_name: resetdata-glm-5.3
    litellm_params:
      model: resetdata/zai/glm-5.3
      api_key: os.environ/RESETDATA_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash
litellm --config config.yaml --port 4000
```

在已設定 `LITELLM_MASTER_KEY` 的第二個終端機中，使用已設定的模型別名傳送請求：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "resetdata-glm-5.3",
    "messages": [{"role": "user", "content": "Say hello in five words"}],
    "max_tokens": 2000
  }'
```

Proxy 會回傳 OpenAI 格式的聊天補全。usage 區塊會分別回報推理 token：

```json
{
  "choices": [{"message": {"role": "assistant", "content": "Hello there, my dear friend!"}}],
  "usage": {
    "completion_tokens": 15,
    "prompt_tokens": 17,
    "total_tokens": 32,
    "completion_tokens_details": {"reasoning_tokens": 7, "text_tokens": 8}
  }
}
```

LiteLLM 也會透過其轉譯層，接受 ResetData 模型的 [Anthropic Messages](/docs/anthropic_unified) 與 [Responses API](/docs/response_api) 請求。這些請求使用 ResetData 的聊天補全端點，而非 ResetData 原生的 Messages 或 Responses 端點。

## 音訊轉錄 {#audio-transcription}

ResetData 在其與 OpenAI 相容的 `/audio/transcriptions` 端點上提供 `openai/whisper-large-v3-turbo`。請將它加入閘道設定：

```yaml
model_list:
  - model_name: resetdata-whisper
    litellm_params:
      model: resetdata/openai/whisper-large-v3-turbo
      api_key: os.environ/RESETDATA_API_KEY
```

接著將音訊檔案傳送至閘道：

```bash
curl http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -F model=resetdata-whisper \
  -F file=@speech.wav
```

閘道會回傳帶有轉錄文字的 `{"text": "..."}`。若使用 SDK，請呼叫 `litellm.transcription(model="resetdata/openai/whisper-large-v3-turbo", file=open("speech.wav", "rb"))`。

## 支援的模型 {#supported-models}

這些 ResetData 模型已列入 LiteLLM 型錄，包含其內容視窗、輸出上限與價格，因此 LiteLLM 會以美元追蹤其支出。ResetData 以澳幣計費，不含 GST。型錄價格是 ResetData 的澳幣價格，按 1 澳幣 = 0.67566 美元換算，依據歐洲中央銀行 2026 年 11 月 16 日的歐元參考匯率。因此，隨著澳幣匯率變動，追蹤到的支出會與您的 ResetData 帳單產生落差，且不包含帳單上加收的 GST。

| 模型 | 內容視窗 | 最大輸出 token 數 | 推理 | 視覺 |
|-------|----------------|-------------------|-----------|--------|
| `resetdata/zai/glm-5.3` | 524,288 | 32,768 | 是 | 否 |
| `resetdata/qwen/qwen3.8-27b` | 262,144 | 32,768 | 是 | 是 |
| `resetdata/qwen/qwen3-coder-30b-a3b-instruct` | 262,144 | 65,536 | 否 | 否 |
| `resetdata/google/gemma-4-26b-a4b-it` | 262,144 | 8,192 | 否 | 是 |
| `resetdata/deepseek/deepseek-v4-flash` | 1,048,576 | 65,536 | 是 | 否 |

`resetdata/openai/whisper-large-v3-turbo` 也已列入型錄。ResetData 的音訊按輸入每分鐘計價，而 LiteLLM 會按音訊每秒、以相同換算匯率追蹤。

`resetdata/qwen/qwen3.8-27b` 接受以 base64 data URL 傳入的圖片。在該模型上傳入圖片 URL 時，ResetData 約兩分鐘後會回應 500 錯誤；而 `resetdata/google/gemma-4-26b-a4b-it` 兩種方式都接受。

若要改以您自己的 ResetData 費率計費，請在部署上設定以美元計的每 token 成本。對於支援提示快取的模型（例如 `resetdata/zai/glm-5.3` 與 `resetdata/deepseek/deepseek-v4-flash`），也請設定 `cache_read_input_token_cost`，否則 LiteLLM 會按型錄費率對快取 token 計費。請為部署指定專屬的 `model_name`，因為 LiteLLM 會對共用同一名稱的部署進行負載平衡。以下數值僅為範例，並非 ResetData 的實際價格：

```yaml
model_list:
  - model_name: resetdata-glm-5.3-own-rates
    litellm_params:
      model: resetdata/zai/glm-5.3
      api_key: os.environ/RESETDATA_API_KEY
      input_cost_per_token: 0.0000006
      output_cost_per_token: 0.0000022
      cache_read_input_token_cost: 0.0000001
```
