import Image from '@theme/IdealImage';

# 健康檢查 {#health-checks}

有兩件事會消耗閘道的健康狀態。您的協調器（Kubernetes、負載平衡器、uptime 監控）會輪詢輕量型探測端點，以判斷程序是否已啟動並準備好接受流量。您，作為營運者，則會檢查每個已設定的 LLM 是否 實際能夠提供請求服務。本頁涵蓋這兩者。

## 探測端點 {#probe-endpoints}

這些端點會回答「閘道程序是否已啟動且能夠提供流量？」而不會發出任何 LLM 請求。它們是閘道的正式存活與就緒契約。

| 端點 | 驗證 | 回傳 | 意義 |
|----------|------|---------|---------|
| `GET /health/liveliness` | 無 | `"I'm alive!"`（200），或在平滑關機期間回傳 `{"status": "shutting_down"}`（503） | 程序已啟動。未檢查任何相依項目。`GET /health/liveness` 是採用 Kubernetes 拼法的別名；兩者都是真實路由 |
| `GET /health/readiness` | 無 | 已就緒時回傳 `{"status": "healthy", "db": ...}`（200）；當已設定的資料庫無法連線時回傳 503，但設定 `allow_requests_on_db_unavailable: true` 時除外 | 工作程序已準備好接受流量。當未設定資料庫時，`db` 欄位為 `"connected"`、`"disconnected"`，或 `"Not connected"` |

`db` 值可讓協調器區分健康的工作程序與已啟動但無法連線到資料庫的工作程序。當已設定資料庫但無法連線時，就緒檢查會回傳 503，因此該 pod 會從輪替中移除，但設定 `allow_requests_on_db_unavailable: true` 時除外。

預設的就緒回應內容刻意維持低細節，因此即使對未經驗證的探測公開也安全。若要取得完整診斷（回呼、快取、版本），可將 `general_settings.allow_public_health_readiness_details: true` 設為展開 `/health/readiness` 本身，或呼叫已驗證的 `GET /health/readiness/details` 端點。

在閘道 4000 埠上的最小 Kubernetes 探測組合：

```yaml
livenessProbe:
  httpGet:
    path: /health/liveliness
    port: 4000
readinessProbe:
  httpGet:
    path: /health/readiness
    port: 4000
```

如需完整部署資訊清單，請參閱 [Production Deployment 指南](./deploy.md) 與 [生產環境檢查清單](./prod.md)。

## Admin UI 中的模型健康狀態 {#model-health-in-the-admin-ui}

檢查模型是否正在提供服務的主要方式是使用 Admin UI。前往 Models + Endpoints，開啟 Health Status 分頁，然後按一下 Run All Checks。每個模型都會顯示狀態、失敗時的錯誤詳細資訊，以及上次檢查與上次成功的時間。

<Image img={require('../../img/ui_health_status.png')} alt="Model Health Status tab showing a healthy model after Run All Checks" />

對應的 API 是 [`GET /health`](#model-health-from-the-api)。

## 來自 API 的模型健康狀態 {#model-health-from-the-api}

`GET /health` 會回報呼叫金鑰可見的每個部署為健康或不健康。除非已開啟[背景健康檢查](#background-health-checks)，否則每次呼叫都會對這些部署各發送一次實際測試請求，因此每個部署會消耗少量 token。對 [auto router](./auto_routing.md) 部署的定向檢查，也會對它路由到的每個模型發送測試請求。

```shell
curl 'http://0.0.0.0:4000/health' -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json
{
    "healthy_endpoints": [
        {"model": "openai/{{openai_small}}", "model_id": "openai-small-1", "x-ratelimit-remaining-requests": "29999"}
    ],
    "unhealthy_endpoints": [
        {"model": "anthropic/{{anthropic}}", "model_id": "anthropic-1", "error": "litellm.AuthenticationError: ...", "exception_status": 401}
    ],
    "healthy_count": 1,
    "unhealthy_count": 1
}
```

此端點會將結果限定於呼叫金鑰的範圍、以監控工具可據以行動的狀態碼回應定向檢查，且只回傳一組固定的診斷欄位。以下各節說明截至 v1.102.0 的這項契約，以及截至 v1.109.0 金鑰可以看到哪些部署。

v1.84.0 至 v1.102.0 的版本已將結果限定於金鑰的 `models` 清單範圍，並對沒有健康部署的定向呼叫回應 503，但在幾個方面有所不同。金鑰清單中的存取群組不會被展開，因此只列出群組的金鑰會得到空清單，且非管理員金鑰也會看到其他團隊的部署。超出該金鑰範圍的 `?model_id=` 會被忽略，呼叫會以金鑰自己的部署回應，而不是 403。回應條目也會帶有其他 `litellm_params` 值，例如 `max_tokens` 與 `cache`，而不只是下方列出的欄位。對非管理員金鑰只會移除 `api_base` 與 `api_version`，因此 `aws_bedrock_runtime_endpoint` 仍會顯示，且標頭會顯示 `api_base and api_version are admin-only on this endpoint`。在 v1.84.0 上，金鑰無法呼叫的 `?model=` 會回應 401，而不是 403。

### 金鑰可以看到哪些部署 {#which-deployments-a-key-sees}

<SinceVersion v="1.109.0" />

proxy 管理員，也就是 master key，或使用者具有 `proxy_admin` 或 `proxy_admin_viewer` 角色的金鑰，可以看到每個部署；但如果管理員的金鑰有自己的 `models` 清單，則由該清單決定可見範圍。其他每個金鑰只能看到不屬於其他任何團隊的部署，而且在這些部署中，只能看到使用該金鑰的聊天請求能夠觸及的部署。proxy 會執行與聊天請求相同的模型存取檢查，因此金鑰、其團隊、其專案或其使用者（適用於沒有團隊的金鑰）上的 `models` 限制都會縮小結果範圍，且此呼叫絕不會對金鑰無法呼叫的部署發送測試請求。沒有上述任何限制的金鑰，或清單中包含 `all-proxy-models` 的金鑰，可以看到每個不屬於其他任何團隊的部署。開啟背景健康檢查時，適用相同的範圍。

這些限制中的名稱，會以聊天請求解讀它的方式計算。存取群組名稱與 `all-team-models` 會展開為其模型，而當金鑰持有的存取群組只包含某個模型名稱的部分部署時，金鑰只能看到那些部署。像 `openai/*` 這樣的萬用字元條目涵蓋金鑰可透過它呼叫的每個部署，包括 `openai/*` 部署本身、名為 `openai/{{openai_small}}` 的部署，以及任何其他 `model_name`、其 `litellm_params.model` 符合 `openai/*` 的部署。別名會視為它路由到的模型群組，因此清單中只有 `model_group_alias` 名稱的金鑰，可以看到該別名背後的部署。金鑰所屬組織上的 `models` 清單不會縮小結果範圍，因為聊天請求也不會檢查它。

v1.109.0 之前的版本只會以金鑰自己的 `models` 清單縮小結果範圍。金鑰所屬團隊、使用者、組織或專案上的 `models` 限制，不會縮小那些版本上未定向的結果或 `model_id` 檢查，因此在沒有背景健康檢查時，這類金鑰的未定向呼叫會對它無法呼叫的部署發送測試請求。在那些版本上，萬用字元條目只會比對 `model_name` 恰好是 `openai/*` 的部署，而存取群組持有兩個共用同一模型名稱的部署其中之一的金鑰，會看到兩者。若要在那些版本上限縮金鑰的可見範圍，請給它自己的 `models` 清單，或對團隊金鑰給予 `all-team-models`。

### 檢查單一模型 {#check-one-model}

傳入 `?model=<model_name>` 可檢查該公開模型名稱背後的每個部署。當沒有部署使用該名稱時，proxy 會改為將它與每個部署的 `litellm_params.model` 比對，因此管理員可以傳入 `?model=openai/{{openai_small}}`。傳入 `?model_id=<id>` 可檢查具有該 `model_info.id` 的單一部署，該 id 可由 `GET /v1/model/info` 列出。當請求同時帶有兩者時，由 `model_id` 選定部署，但 `model` 仍必須通過金鑰的模型存取檢查。在 `model` 中使用別名，例如 `model_group_alias` 名稱時，只要透過該別名使用該金鑰發出的聊天請求能夠成功，就會檢查該別名路由到的模型群組的部署，即使金鑰的清單中只有目標名稱。只有萬用字元路由服務的名稱，例如 `anthropic/*` 部署背後的 `anthropic/{{anthropic}}`，對除沒有 `models` 清單的管理員金鑰以外的任何金鑰，都會檢查該萬用字元部署。該管理員金鑰對此名稱比對不到任何部署，會得到 503 與空清單，因此請以 `?model_id=` 或萬用字元名稱本身 `?model=anthropic/*` 檢查該路由。v1.109.0 之前的版本對非管理員金鑰，會就清單中只有別名目標的別名，以及只有萬用字元路由服務的名稱回應 403，因此在那些版本上請改為檢查目標名稱、`model_id` 或萬用字元名稱。

### 狀態碼 {#status-codes}

| 狀態 | 時機 |
|--------|------|
| 200 | 任何未定向的呼叫，即使每個部署都不健康 |
| 200 | 至少有一個健康部署的定向呼叫 |
| 503 | 沒有健康部署的定向呼叫 |
| 403 | 目標超出該金鑰的範圍 |
| 404 | 沒有部署具有該 `model_id` |
| 401 | 金鑰無效 |

503 會帶有正常的回應本文，因此監控工具可以依狀態碼發出告警，同時仍能讀取每個不健康的條目。

403 與 404 的本文有兩種形式。金鑰無法呼叫的 `model` 會被與聊天請求相同的模型存取檢查拒絕，因此本文是標準錯誤物件 `{"error": {"type": "key_model_access_denied", ...}}`，或拒絕它的限制所對應的型別，例如 `team_model_access_denied`、`user_model_access_denied` 或 `project_model_access_denied`。超出該金鑰範圍的 `model_id` 會回應 `{"detail": {"error": "key not allowed to health-check model_id <id>"}}`；通過存取檢查但在範圍內比對不到任何部署的 `model`，則回應 `{"detail": {"error": "key not allowed to health-check model <name>"}}`。未知的 `model_id` 會在任何範圍檢查之前，先以 `{"detail": {"error": "Model with ID <id> not found"}}` 回應 404。沒有 `models` 清單的管理員金鑰，若傳入沒有任何部署服務的 `model`，會得到 503 與空清單。

### 回應欄位 {#response-fields}

每個條目都帶有 `model_id`（該部署的 `model_info.id`）與 `model`（探測所呼叫的模型）。`model` 通常是該部署的 `litellm_params.model`，但 `health_check_model` 或提供者路由（例如模型字串中的 Bedrock 區域）可以改變它，因此請以 `model_id` 將條目對應到部署。條目中的任何其他欄位都來自以下清單，且只有在部署或其探測有設定時才會出現：`custom_llm_provider`、`mode`、`base_model`、`aws_region_name`、`region_name`、`watsonx_region_name`、`vertex_project`、`vertex_location`、`tpm`、`rpm`、`error`、`raw_request_typed_dict`、`x-ratelimit-remaining-requests`、`x-ratelimit-remaining-tokens` 與 `x-ms-region`。不健康的條目通常還會帶有 `exception_status`，即失敗探測的 HTTP 狀態；當錯誤沒有狀態時為 500。條目永遠不會有 `api_key` 欄位或任何其他來自 `litellm_params` 的憑證欄位，它能帶有的其他 `litellm_params` 值只有下方的管理員專用欄位。後續版本可能會在此清單中新增欄位，因此用戶端應忽略它不認識的欄位。

`api_base`、`api_version` 與 `aws_bedrock_runtime_endpoint` 會從非管理員金鑰的每個條目中移除。後續版本在該清單中加入了伺服器端驗證設定，例如 v1.106.0 起的 `anthropic_identity_source`，以及 v1.107.0 起的 `token_exchange_endpoint` 與 `github_copilot_host`。對非管理員金鑰的每個 200 或 503 回應，都帶有一個 `Litellm-Health-Field-Notice` 標頭，列出每個管理員專用欄位，無論該回應中的條目是否帶有這些欄位：

```text
Litellm-Health-Field-Notice: api_base, api_version, aws_bedrock_runtime_endpoint, ... are admin-only on this endpoint
```

請讀取該標頭，而不是使用寫死的清單，因為管理員專用欄位的集合可能會增加。

在不健康的條目上，`error` 保存失敗探測的完整錯誤文字，`raw_request_typed_dict` 則描述探測所發送的請求，包括它呼叫的 URL，該 URL 以部署的 `api_base` 或 Bedrock runtime 端點開頭。兩者都會提供給每個能看到該部署的金鑰，因此移除管理員專用欄位並不會對非管理員金鑰隱藏部署的位址。當非管理員金鑰只應看到每個部署的狀態時，請設定 `health_check_details: false`。

使用 `general_settings.health_check_details: false` 時，每個條目只帶有 `model`、`model_id`，以及不健康條目上的 `exception_status`，不帶 `error`。唯一的例外是無法連通其路由目標模型之一的 [auto router](./auto_routing.md) 部署，它會保留指出該模型名稱的 `error`。管理員專用欄位對 proxy 管理員也會被省略。

## 背景健康檢查 {#background-health-checks}

預設情況下，`/health` 會在每次呼叫時探測每個模型。為避免過於頻繁地查詢模型，請在背景執行檢查，並讓 `/health` 提供最後一次快取結果。在 `general_settings` 中設定此功能：

```yaml
general_settings:
  background_health_checks: true      # run checks in the background
  health_check_interval: 300          # seconds between runs (default 300)
  health_check_details: true          # false trims each entry to model, model_id, and status fields (default true)
```

當 proxy 暴露給廣泛受眾時，將 `health_check_details: false` 設為只回傳[最小條目](#response-fields)。

快取結果遵循與即時檢查相同的規則。每個金鑰只能看到自己的部署；當快取中沒有任何目標部署是健康的時候，定向呼叫會回應 503；非管理員金鑰的管理員專用欄位會被移除。在第一次背景執行完成之前，快取是空的，因此未定向的呼叫會以空清單回應 200，對沒有 `models` 清單的管理員金鑰則回應 `{}`，而每個定向呼叫都會以空清單回應 503。每個 proxy 工作程序與每個 pod 都執行自己的背景迴圈並保存自己的快取。在 proxy 啟動後或工作程序重新啟動後，第一次執行尚未完成的工作程序會以空快取回應，而另一個工作程序已有結果，因此同一個呼叫可能先回應 503，稍後又回應 200。被背景迴圈透過 `disable_background_health_check` 或下方的 `background_health_check_model_groups` 略過的部署，永遠不會出現在快取中，因此它不會出現，對它的定向檢查也永遠以空清單回應 503。

若要將某個模型排除在背景迴圈之外，請在其 `model_info` 中設定 `disable_background_health_check: true`。背景檢查開啟時，`/health` 只讀取快取，因此該部署會如上所述從結果中消失。設定 `general_settings.health_check_skip_disabled_background_models: true`，可另外將那些部署排除在按需檢查（在背景檢查關閉時執行）與共享健康檢查之外。

```yaml
model_list:
  - model_name: openai/{{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      disable_background_health_check: true
```

若要將背景迴圈限定於特定模型群組，而不是逐一排除模型，請將 `general_settings.background_health_check_model_groups` 設為要探測的模型群組名稱清單。只會檢查列出群組中的部署，因此 `/health` 只會回報那些群組，而 [健康檢查路由](./health_check_routing.md) 也只會套用於它們；未列出的群組會保留其已設定的路由行為。之後新增的模型群組在加入清單前不會被探測，而非字串清單的值會在啟動時失敗

```yaml
general_settings:
  background_health_checks: true
  background_health_check_model_groups: ["prod-openai"]
```

若要協調多個 pod 之間的檢查，以免昂貴模型每個 pod 都被探測一次，請參閱 [共用健康檢查狀態](./shared_health_check.md)。

## 模型模式 {#model-modes}

健康檢查會從模型的 `model_info.mode` 中選擇要測試的操作。請將其設定正確，讓探測使用對應的 API 介面；如果保留未設定，LiteLLM 會根據模型能力自動偵測，並回退到聊天完成。

| `mode` | 健康檢查呼叫 |
|--------|--------------------|
| `chat`（預設） | `/chat/completions` |
| `completion` | `/completions` |
| `embedding` | `/embeddings` |
| `image_generation` | 影像生成 |
| `audio_transcription` | 音訊轉錄 |
| `audio_speech` | 文字轉語音（需要 `health_check_voice`） |
| `rerank` | 重新排序 |
| `batch` | 批次（僅 Azure） |
| `realtime` | 即時工作階段 |
| `ocr` | OCR |
| `video_generation` | 影片生成 |
| `image_edit` | 影像編輯 |
| `anthropic_messages` | `/v1/messages` |

Bedrock Mantle 只透過 Anthropic Messages API 提供 Claude 模型，因此 `bedrock_mantle/anthropic.claude-*` 部署在 `mode` 未設定時，會以 `anthropic_messages` 進行探測，而不是聊天完成。明確指定的 `mode` 仍然優先

對於萬用字元路由（`*` 位於 `litellm_params.model` 中），請將 `health_check_model` 設為探測應呼叫的具體模型。當萬用字元路由上的 `mode` 未設定時，`max_tokens` 會在探測請求中維持未設定。

```yaml
model_list:
  - model_name: azure-embedding-model
    litellm_params:
      model: azure/azure-embedding-model
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      mode: embedding
```

### 音訊輸出聊天模型 {#audio-output-chat-models}

<SinceVersion v="1.109.0" />

輸出音訊的 OpenAI 與 Azure 聊天模型，例如 `gpt-audio-1.5` 與 `gpt-audio-mini`，會拒絕輸入或輸出中沒有音訊的請求。聊天探測會向這些模型請求文字加音訊輸出，也就是以 [`health_check_voice`](#health-check-tuning-reference) 語音輸出的 `wav` 片段，因此它們能通過預設探測，無需覆寫 `model_info.health_check_params`。您在 `health_check_params` 中設定的值仍然優先，而其中不含 `"audio"` 的 `modalities` 清單會讓探測維持純文字。

LiteLLM 依 `base_model` 挑選這些模型，先從 `model_info` 讀取，再從 `litellm_params` 讀取，否則依部署的模型名稱。因此，自訂名稱的 Azure 部署只有在 `base_model` 指名其模型時，才會得到音訊探測，如同[成本追蹤](./custom_pricing.md#set-base_model-for-cost-tracking-eg-azure-deployments)的情形。

```yaml
model_list:
  - model_name: gpt-audio
    litellm_params:
      model: azure/my-gpt-audio-deployment
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
    model_info:
      base_model: azure/gpt-audio-1.5
```

## 健康檢查調整參考 {#health-check-tuning-reference}

除非另有註明，請在模型的 `model_info` 下設定這些項目。它們控制探測請求的組成方式。

| 鍵 | 預設值 | 用途 |
|-----|---------|---------|
| `health_check_timeout` | 60s | 探測的每模型逾時 |
| `health_check_max_tokens` | 16（萬用字元路由時未設定） | 探測請求中的 `max_tokens` |
| `health_check_max_tokens_reasoning` | 未設定 | 當 `health_check_max_tokens` 未設定時，供推理模型使用的 `max_tokens` |
| `health_check_max_tokens_non_reasoning` | 未設定 | 當 `health_check_max_tokens` 未設定時，供非推理模型使用的 `max_tokens` |
| `health_check_reasoning_effort` | 未設定 | 探測中的 `reasoning_effort`（僅聊天、完成、批次、回應模式） |
| `health_check_voice` | `alloy` | `audio_speech` 探測的語音，也用於[輸出音訊的 OpenAI 與 Azure 模型](#audio-output-chat-models)的聊天探測 <SinceVersion v="1.109.0" />。Gemini TTS 部署自 v1.107.0 起，會將 `alloy` 與其他 OpenAI 語音名稱對應到 Gemini 預建語音（`alloy` 會變成 `Kore`，請參閱[對應表](../providers/gemini#voice-names)），因此預設值即可通過。設定像 `Kore` 這樣的 Gemini 名稱可直接選用，較早的版本需要這樣做 |
| `health_check_model` | 未設定 | 萬用字元路由所探測的具體模型 |
| `disable_background_health_check` | false | 在背景迴圈中略過此模型 |

推理模型通常需要較高的探測 `max_tokens`，因為提供者會將推理 token 納入完成額度；分開的推理與非推理鍵可讓您提高它，而不必列出每個模型。三個環境變數會設定全域預設值：`DEFAULT_HEALTH_CHECK_PROMPT` 會覆寫預設探測提示詞（`"test from litellm"`），`BACKGROUND_HEALTH_CHECK_MAX_TOKENS` 是全域 `max_tokens` 備援，而 `BACKGROUND_HEALTH_CHECK_MAX_TOKENS_REASONING` 則優先套用於非萬用字元推理模型。

若要將流量導離健康檢查失敗的部署，請參閱 [健康檢查驅動的路由](./health_check_routing.md)。

## 其他健康端點 {#other-health-endpoints}

除非另有註明，以下端點都需要有效金鑰。

- `GET /health/services?service=<name>` 會測試已設定的告警或記錄服務（datadog、slack、langfuse 等）；接受任何有效金鑰
- `GET /health/readiness/details` 會回傳已驗證的就緒診斷資訊（db、cache、callbacks、version）
- `GET /health/history` 會回傳過去的健康檢查結果
- `GET /health/latest` 會回傳最近一次健康檢查結果
- `GET /health/backlog` 會回傳工作程序上進行中的請求數量
- `GET /health/drain` 會為 Kubernetes `preStop` 回呼啟動平滑排空；預設停用（404），除非 `general_settings.enable_drain_endpoint: true`，並在 `X-Drain-Token` 設為 `DRAIN_ENDPOINT_TOKEN` 時由該標頭控管
