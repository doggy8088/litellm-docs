# 健康檢查 {#health-checks}
使用此功能可檢查您 config.yaml 中定義的所有 LLM 的健康狀態

## 何時使用各個端點 {#when-to-use-each-endpoint}

| 端點 | 使用情境 | 目的 |
|----------|----------|---------|
| `/health/liveliness` | **容器存活探測** | 基本存活檢查 - 用於容器重新啟動決策 |
| `/health/readiness` | **負載平衡器健康檢查** | 可接受流量 - 包含資料庫連線狀態 |
| `/health` | **模型健康監控** | 全面的 LLM 模型健康狀態 - 會實際呼叫 API |
| `/health/services` | **服務偵錯** | 檢查特定整合（datadog、langfuse 等） |
| `/health/shared-status` | **多個 pod 協調** | 監控跨 pod 的共享健康檢查狀態 |

## 摘要  {#summary}

proxy 會提供： 
* /health 端點，回傳 LLM API 的健康狀態  
* /health/readiness 端點，回傳 proxy 是否已準備好接受請求 
* /health/liveliness 端點，回傳 proxy 是否存活
* /health/shared-status 端點，用於監控跨 pod 的共享健康檢查協調

## 共享健康檢查狀態 {#shared-health-check-state}

當執行多個 LiteLLM proxy pod 時，您可以啟用共享健康檢查狀態，以協調跨 pod 的健康檢查並避免重複的 API 呼叫。這對 Gemini 2.5-pro 這類昂貴模型特別有幫助。

**主要優點：**
- 減少跨 pod 的重複健康檢查
- 節省昂貴模型 API 呼叫的成本
- 減少監控雜訊與記錄
- 提升資源效率

**需求：**
- 用於共享狀態協調的 Redis
- 已啟用背景健康檢查
- 多個 proxy pod

如需詳細設定與使用方式，請參閱 [共享健康檢查狀態](./shared_health_check.md)。 

## `/health` {#health}
#### 請求 {#request}
對 proxy 發出 `/health` 請求

:::info
**此端點會對每個模型發出 LLM API 呼叫，以檢查其是否健康。**
:::

```shell
curl --location 'http://0.0.0.0:4000/health' -H "Authorization: Bearer sk-1234"
```

您也可以執行 `litellm -health`，它會替您向 `http://0.0.0.0:4000/health` 發出 `get` 請求
```
litellm --health
```
#### 回應 {#response}
```shell
{
    "healthy_endpoints": [
        {
            "model": "azure/gpt-35-turbo",
            "api_base": "https://my-endpoint-canada-berri992.openai.azure.com/"
        },
        {
            "model": "azure/gpt-35-turbo",
            "api_base": "https://my-endpoint-europe-berri-992.openai.azure.com/"
        }
    ],
    "unhealthy_endpoints": [
        {
            "model": "azure/gpt-35-turbo",
            "api_base": "https://openai-france-1234.openai.azure.com/"
        }
    ]
}
```

### 嵌入模型  {#embedding-models}

若要執行嵌入健康檢查，請在相關模型的設定中將模式指定為 "embedding"。

```yaml
model_list:
  - model_name: azure-embedding-model
    litellm_params:
      model: azure/azure-embedding-model
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      mode: embedding # 👈 ADD THIS
```

### 圖像生成模型  {#image-generation-models}

若要執行圖像生成健康檢查，請在相關模型的設定中將模式指定為 "image_generation"。

```yaml
model_list:
  - model_name: dall-e-3
    litellm_params:
      model: azure/dall-e-3
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      mode: image_generation # 👈 ADD THIS
```

#### 自訂健康檢查提示詞 {#custom-health-check-prompt}

預設情況下，健康檢查會使用提示詞 `"test from litellm"`。您可以透過設定環境變數全域自訂此提示詞，或透過設定檔針對單一模型自訂：

```bash
DEFAULT_HEALTH_CHECK_PROMPT="this is a test prompt"
```

### 文字完成模型  {#text-completion-models}

若要執行 `/completions` 健康檢查，請在相關模型的設定中將模式指定為 "completion"。

```yaml
model_list:
  - model_name: azure-text-completion
    litellm_params:
      model: azure/text-davinci-003
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      mode: completion # 👈 ADD THIS
```

### 語音轉文字模型  {#speech-to-text-models}

```yaml
model_list:
  - model_name: whisper
    litellm_params:
      model: whisper-1
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: audio_transcription
```


### 文字轉語音模型  {#text-to-speech-models}

```yaml
# OpenAI Text to Speech Models
  - model_name: tts
    litellm_params:
      model: openai/tts-1
      api_key: "os.environ/OPENAI_API_KEY"
    model_info:
      mode: audio_speech
      health_check_voice: alloy
```

如果您需要使用 "alloy" 以外的聲音，可以指定 `health_check_voice`。

### 重新排序模型  {#rerank-models}

若要執行重新排序健康檢查，請在相關模型的設定中將模式指定為 "rerank"。

```yaml
model_list:
  - model_name: rerank-english-v3.0
    litellm_params:
      model: cohere/rerank-english-v3.0
      api_key: os.environ/COHERE_API_KEY
    model_info:
      mode: rerank
```

### 批次模型（僅 Azure） {#batch-models-azure-only}

對於部署為 'batch' 模型的 Azure 模型，請設定 `mode: batch`。 

```yaml
model_list:
  - model_name: "batch-gpt-4o-mini"
    litellm_params:
      model: "azure/batch-gpt-4o-mini"
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
    model_info:
      mode: batch
```

預期回應 

```bash
{
    "healthy_endpoints": [
        {
            "api_base": "https://...",
            "model": "azure/gpt-4o-mini",
            "x-ms-region": "East US"
        }
    ],
    "unhealthy_endpoints": [],
    "healthy_count": 1,
    "unhealthy_count": 0
}
```

### 即時模型  {#realtime-models}

若要執行即時健康檢查，請在相關模型的設定中將模式指定為 "realtime"。

```yaml
model_list:
  - model_name: openai/gpt-4o-realtime-audio
    litellm_params:
      model: openai/gpt-4o-realtime-audio
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```

### OCR 模型  {#ocr-models}

若要執行 OCR 健康檢查，請在相關模型的設定中將模式指定為 "ocr"。

```yaml
model_list:
  - model_name: mistral/mistral-ocr-latest
    litellm_params:
      model: mistral/mistral-ocr-latest
      api_key: os.environ/MISTRAL_API_KEY
    model_info:
      mode: ocr
```

### 萬用字元路由 {#wildcard-routes}

對於萬用字元路由，您可以在 config.yaml 中指定 `health_check_model`。此模型將用於該萬用字元路由的健康檢查。

在此範例中，當執行 `openai/*` 的健康檢查時，健康檢查將對 `openai/gpt-4o-mini` 發出 `/chat/completions` 請求。

```yaml
model_list:
  - model_name: openai/*
    litellm_params:
      model:  openai/*
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      health_check_model: openai/gpt-4o-mini
  - model_name: anthropic/*
    litellm_params:
      model: anthropic/*
      api_key: os.environ/ANTHROPIC_API_KEY
    model_info:
      health_check_model: anthropic/claude-3-5-sonnet-20240620
```

## 背景健康檢查  {#background-health-checks}

您可以啟用在背景執行的模型健康檢查，以避免透過 `/health` 過於頻繁地查詢每個模型。 

:::info

**這會對每個模型發出 LLM API 呼叫，以檢查其是否健康。**

:::

使用方式如下： 
1. 在 config.yaml 中加入：
```
general_settings: 
  background_health_checks: True # enable background health checks
 health_check_interval: 300 # frequency of background health checks
```

2. 啟動伺服器 
```
$ litellm /path/to/config.yaml
```

3. 查詢健康端點： 
```
 curl --location 'http://0.0.0.0:4000/health'
```

### 停用特定模型的背景健康檢查 {#disable-background-health-checks-for-specific-models}

如果您想停用特定模型的背景健康檢查，請使用此選項。

如果 `background_health_checks` 已啟用，您可以在模型的 `model_info` 中設定 `disable_background_health_check: true`，以略過個別模型。

```yaml
model_list:
  - model_name: openai/gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      disable_background_health_check: true
```

### 在 `GET /health` 上略過相同模型 {#skip-the-same-models-on-get-health}

預設情況下，`disable_background_health_check: true` 只會略過背景健康迴圈中的那些部署。按需 `GET /health` 仍會探測它們，除非您啟用這個全域旗標：

```yaml
general_settings:
  health_check_skip_disabled_background_models: true
```

當 `true` 時，具有 `model_info.disable_background_health_check: true` 的部署會從按需 `GET /health` 中省略（包括 `?model=` / `?model_id=`），也會從符合 `general_settings` 的健康檢查執行中省略（包括 Redis 支援的共享健康檢查）。

### 隱藏詳細資訊 {#hide-details}

健康檢查回應包含端點 URL、錯誤訊息，以及其他 LiteLLM 參數等詳細資訊。雖然這對偵錯很有幫助，但當 proxy 伺服器對廣大受眾公開時，這可能會造成問題。

您可以將 `health_check_details` 設定為 `False` 來隱藏這些詳細資訊。

```yaml
general_settings: 
  health_check_details: False
```

## 健康檢查驅動的路由 {#health-check-driven-routing}

主動將流量導離不健康的部署——在使用者請求命中之前。支援依錯誤類型設定失敗閾值、暫時性錯誤抑制，以及自動安全機制。

請參閱完整指南：[健康檢查驅動的路由](./health_check_routing.md)

## 健康檢查逾時 {#health-check-timeout}

健康檢查逾時設定於 `litellm/constants.py`，預設為 60 秒。

您可以在 config.yaml 的 model_info 區段中設定 `health_check_timeout` 來覆寫此值。

```yaml
model_list:
  - model_name: openai/gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      health_check_timeout: 10 # 👈 OVERRIDE HEALTH CHECK TIMEOUT
```

## 健康檢查最大 token 數 {#health-check-max-tokens}

預設情況下，健康檢查會使用 `max_tokens=5`，以在可靠性與低成本及低延遲之間取得平衡。對於萬用字元模型，預設值為 `max_tokens=10`。

您可以在 config.yaml 的 `model_info` 區段中設定 `health_check_max_tokens`，以針對單一模型覆寫此值。

```yaml
model_list:
  - model_name: openai/gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      health_check_max_tokens: 5 # 👈 OVERRIDE HEALTH CHECK MAX TOKENS
```

### 推理與非推理預設值 {#reasoning-vs-non-reasoning-defaults}

推理模型（依 model map 中的 `supports_reasoning`）通常需要較高的健康檢查 `max_tokens`，因為提供者會將推理 token 計入完成預算。您可以設定**分開的**限制，而不必列出每個模型：

**每個部署（`model_info`）**—當 `health_check_max_tokens` 未設定時使用。對萬用字元路由（`*` 位於 `litellm_params.model` 中，也就是部署模型字串；不是 `health_check_model`）會被忽略。

```yaml
model_list:
  - model_name: openai-stack
    litellm_params:
      model: openai/gpt-5-nano
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      health_check_max_tokens_reasoning: 128
      health_check_max_tokens_non_reasoning: 1
```

**全域（環境）**：

- `BACKGROUND_HEALTH_CHECK_MAX_TOKENS_REASONING` — 針對非萬用字元推理模型，設定後此值優先
- `BACKGROUND_HEALTH_CHECK_MAX_TOKENS` — 所有模型的全域備援（包含萬用字元路由）

如果兩者都未設定，非萬用字元模型預設為 `5`，而萬用字元路由則不指定 `max_tokens`。

## 健康檢查推理努力程度 {#health-check-reasoning-effort}

對於推理模型（例如 GPT-5、o-series），您可以僅針對**健康檢查請求**，透過 `health_check_reasoning_effort` 在 `model_info` 中設定要使用多少推理量。這會在底層的 completion 呼叫中作為 `reasoning_effort` 傳遞，因此您可以使用最小等級（例如 `none` 或 `minimal`）來降低探測期間的延遲與成本。

適用於 `mode` 未設定（chat），或明確設為 `chat`、`completion`、`batch`，或 `responses`。不會套用於 `embedding`、`audio_*`、`rerank` 等。

```yaml
model_list:
  - model_name: openai/gpt-5-nano
    litellm_params:
      model: openai/gpt-5-nano
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      health_check_reasoning_effort: none # options depend on provider/model map
```

### 檢查您的模型支援哪些 `reasoning_effort` 值 {#checking-which-reasoning_effort-values-your-model-supports}

LiteLLM 會從 [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 讀取每個模型的旗標。對於 reasoning effort，條目可能包含 `supports_none_reasoning_effort`、`supports_minimal_reasoning_effort`、`supports_low_reasoning_effort`、`supports_xhigh_reasoning_effort`、`supports_max_reasoning_effort` 等類似鍵。當某個鍵為 **`true`** 時，LiteLLM 會將該等級視為此模型支援。

使用與 `litellm_params.model` 下相同的模型字串（包含您使用的提供者前綴，例如 `azure/`）呼叫 **`litellm.get_model_info()`**，然後檢查回傳的 `supports_*_reasoning_effort` 欄位：

```python
import litellm

info = litellm.get_model_info("azure/gpt-5.4-mini")
for name in sorted(dir(info)):
    if "reasoning_effort" in name and not name.startswith("_"):
        print(name, getattr(info, name))
```

如果該模型不在 LiteLLM model map 中，`get_model_info` 可能會擲出錯誤。在這種情況下，請在 JSON 中新增或修正該項目，或從您提供者的 API 文件（Azure OpenAI、OpenAI、Anthropic 等）確認允許的值——當 map 尚未跟上新的 SKU 時，以提供者文件為準。

## `/health/readiness` {#healthreadiness}

用於檢查 proxy 是否已準備好接收請求的未保護端點

範例請求：

```bash
curl http://0.0.0.0:4000/health/readiness
```

範例回應：

```json
{
  "status": "connected",
  "db": "connected",
  "cache": null,
  "litellm_version": "1.40.21",
  "success_callbacks": [
    "langfuse",
    "_PROXY_track_cost_callback",
    "response_taking_too_long_callback",
    "_PROXY_MaxParallelRequestsHandler",
    "_PROXY_MaxBudgetLimiter",
    "_PROXY_CacheControlCheck",
    "ServiceLogging"
  ],
  "last_updated": "2024-07-10T18:59:10.616968"
}
```

如果 proxy 未連接到資料庫，則 `"db"` 欄位會是 `"Not connected"`，而 `` instead of ``、`connected`、`` and the ``、`last_updated"` 欄位將不會出現。

## `/health/liveliness` {#healthliveliness}

用於檢查 proxy 是否存活的未保護端點

範例請求：

```
curl -X 'GET' \
  'http://0.0.0.0:4000/health/liveliness' \
  -H 'accept: application/json'
```

範例回應：

```json
"I'm alive!"
```

## `/health/services` {#healthservices}

使用此僅供管理員使用的端點來檢查已連接的服務（datadog/slack/langfuse/etc.）是否健康。

```bash
curl -L -X GET 'http://0.0.0.0:4000/health/services?service=datadog'     -H 'Authorization: Bearer sk-1234'
```

[**API 參考**](https://litellm-api.up.railway.app/#/health/health_services_endpoint_health_services_get)

## 進階 - 呼叫特定模型 {#advanced---call-specific-models}

若要檢查特定模型的健康狀態，以下是呼叫方式：

### 1. 透過 `/model/info` 取得模型 id {#1-get-model-id-via-modelinfo}

```bash
curl -X GET 'http://0.0.0.0:4000/v1/model/info' \
--header 'Authorization: Bearer sk-1234' \
```

**預期回應**

```bash
{
    "model_name": "bedrock-anthropic-claude-3",
    "litellm_params": {
        "model": "anthropic.claude-3-sonnet-20240229-v1:0"
    },
    "model_info": {
        "id": "634b87c444..", # 👈 UNIQUE MODEL ID
}
```

### 2. 透過 `/chat/completions` 呼叫特定模型 {#2-call-specific-model-via-chatcompletions}

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-D '{
  "model": "634b87c444.." # 👈 UNIQUE MODEL ID
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ],
}
'
```
