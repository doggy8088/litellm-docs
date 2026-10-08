---
title: Auto Router OTEL Telemetry
sidebar_label: OTEL Telemetry
description: 追蹤 Auto Router 設定、所選模型、路由原因，以及已復原的分類器失敗。只需在閘道上啟用一次 OpenTelemetry，然後在 Lens 或其他 OTLP 後端中檢視結果。
---

Auto Router 會將 `litellm.routing.*` 屬性加入 OpenTelemetry（OTEL）追蹤中，讓您可以識別是哪個設定在執行、它為何選擇某個模型，以及在請求復原前分類器是否失敗。

**如果您的閘道已經匯出 OTEL 追蹤，就不需要啟用每個 router 的 telemetry 開關。** 請升級到包含下方檢測功能的版本。使用 OTEL v2 來取得路由階段細節與重試/備援事件。呼叫閘道的應用程式不需要額外的 SDK 或不同的推論端點。

:::info 可用性

這些屬性需要包含 [LiteLLM #44926](https://github.com/BerriAI/litellm/pull/44926) 的閘道版本。對較舊版本設定 OTEL 環境變數不會加入這些檢測。此指南涵蓋透過閘道非同步 Router 路徑的推論；儀表板中未儲存的 **Test Routing** 預覽並不是等效的追蹤測試。

:::

## 我需要先設定什麼嗎？ {#do-i-need-to-set-anything-up}

| 您目前的閘道 | 要做什麼 |
| --- | --- |
| OTEL v2 已經匯出追蹤 | 升級到包含檢測功能的版本。現有與新的 routers 都會自動輸出可用欄位。 |
| 一般的 OTEL v1 搭配 `otel` 回呼 | 升級後的版本會將路由屬性加入模型 spans。請啟用 v2 並重新啟動，以取得路由階段屬性與重試/備援事件。請參閱 [遷移指南](/docs/observability/opentelemetry_v2_migration)。 |
| 沒有 OTEL 匯出器 | 使用下方範例在閘道上設定一次追蹤。 |
| Lens 在不同的閘道上執行 | 設定來源閘道的匯出器或其收集器，將追蹤轉送至 Lens。開啟 Lens 並不會將兩個閘道連接起來。 |

您的匯出器、取樣規則與收集器篩選條件仍然會決定哪些追蹤會送達後端。如果收集器只轉送特定 router 名稱，新增 router 時請更新該篩選條件。

## 在閘道上啟用追蹤 {#enable-tracing-on-the-gateway}

請從既有的 [Auto Router 設定](./setup.md) 與閘道可存取的 OTLP 收集器開始。閘道執行環境需要 OpenTelemetry SDK 與 HTTP 匯出器；閘道伺服器 spans 也需要 `opentelemetry-instrumentation-fastapi`。LiteLLM `proxy-runtime` extra 已包含這些相依性。

請在啟動前將下列項目設定於**閘道程序環境**中，然後重新啟動閘道：

```bash
export LITELLM_OTEL_V2=true
export OTEL_EXPORTER=otlp_http
export OTEL_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="litellm-gateway"
export OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=no_content
```

請以您收集器的位址取代端點。對於 OTLP/HTTP，LiteLLM 會將 `/v1/traces` 附加到此基底 URL。若您的收集器需要驗證，請設定 `OTEL_HEADERS`，例如 `Authorization=Bearer <collector-token>`。也請避免將對應的 `OTEL_EXPORTER_OTLP_*` 別名設定為互相衝突的值。

下方完整範例會明確註冊一般的 `otel` 回呼。如果已經設定過，請保留該項目。OTEL v2 也會依據其環境設定在 proxy 上初始化一般匯出器；每個 router 都不需要新的回呼。

```yaml title="config.yaml"
model_list:
  - model_name: efficient
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: capable
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: smart-router
    model_info:
      id: smart-router-config
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_default_model: capable
      complexity_router_config:
        classifier_type: heuristic
        tiers:
          SIMPLE: efficient
          MEDIUM: efficient
          COMPLEX: capable
          REASONING: capable

litellm_settings:
  callbacks: ["otel"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

請透過您部署的密鑰設定提供 `OPENAI_API_KEY` 和 `LITELLM_MASTER_KEY`，然後啟動 proxy：

```bash
litellm --config config.yaml --port 4000
```

還沒有收集器？請使用主控台匯出來檢查閘道輸出中的 spans：

```bash
unset OTEL_ENDPOINT OTEL_TRACES_ENDPOINT
unset OTEL_EXPORTER_OTLP_ENDPOINT OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
export OTEL_EXPORTER=console
```

請清除端點變數，因為即使 `OTEL_EXPORTER=console`，已設定的端點仍會選擇網路匯出。如果您在 `callback_settings.otel` 中也設定了明確的網路匯出器，請一併移除這些設定以供此僅主控台預覽使用。主控台匯出不會將追蹤傳送至 Lens 或其他後端。

這些路由屬性與 span 事件不需要 `LITELLM_OTEL_INTEGRATION_ENABLE_METRICS` 或 `LITELLM_OTEL_INTEGRATION_ENABLE_EVENTS`。

### 將追蹤傳送至 Lens {#send-traces-to-lens}

[在 Lens 閘道上啟用追蹤擷取](/docs/proxy/lens) 並取得一個允許在那裡擷取追蹤的 LiteLLM 金鑰。若要直接從來源閘道匯出，請使用 Lens 閘道的基底 URL 與擷取金鑰：

```bash
export LENS_GATEWAY_URL="https://your-lens-gateway.example"
export LENS_INGEST_KEY="<lens-ingestion-key>"
export OTEL_EXPORTER=otlp_http
export OTEL_ENDPOINT="${LENS_GATEWAY_URL}/v1/traces"
export OTEL_HEADERS="Authorization=Bearer ${LENS_INGEST_KEY}"
```

變更匯出器之後，請保留 `LITELLM_OTEL_V2=true` 並重新啟動來源閘道。如果既有收集器已將追蹤傳送至其他後端，請將 Lens 新增為收集器目的地，以保留兩份副本。應用程式會繼續將推論請求送至來源閘道；只有 telemetry 會轉送至 Lens。請參閱 [Lens OpenTelemetry 整合](/docs/proxy/lens/integrations/opentelemetry) 以取得擷取設定與範例。

## 驗證 Auto Router 請求 {#verify-an-auto-router-request}

請使用具有 `smart-router` 存取權的 LiteLLM 虛擬金鑰作為 `LITELLM_API_KEY`：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"smart-router","messages":[{"role":"user","content":"What is 2+2?"}]}'
```

在您的追蹤後端中，請在服務 `litellm-gateway` 下找到該請求。在 Lens 中，開啟 **Lens > Traces**，選取該請求，選取 **route smart-router**，然後開啟 **Attributes**。請找 `litellm.routing.router_config_id=smart-router-config`、`litellm.routing.routed_model` 和 `litellm.routing.cause`。

| 追蹤位置 | 您可以檢查的資料 |
| --- | --- |
| V2 `route <requested-model>` 階段 | 分類前所選的設定，以及在可用時完成的決策。在做出決策前失敗，仍可能保留該設定。 |
| 模型呼叫 span，v1 或 v2 | 與該模型呼叫相關聯的完整路由決策。span 名稱可以保留請求的 router 別名；請使用 `routed_model` 來查看所選的模型群組。 |
| V2 請求根，或在尚無根之前的目前 span | 含有 router 名稱、錯誤類別與既有重試計數器的路由重試/備援事件。 |

內部分類器與 embedding 呼叫不會繼承尚未完成的外層路由決策。如果失敗的 Auto Router 嘗試改為備援到一般模型，該最終模型 span 會清除先前的決策。請檢查較早的 route 階段以診斷失敗的 router。

## 可用的 telemetry {#available-telemetry}

此表中的所有屬性名稱都以 **`litellm.routing.`** 開頭。欄位是選用的，且只有在所選策略產生純量值時才會出現。欄位缺失不代表零、false 或成功。

| 屬性後綴 | 含義 |
| --- | --- |
| `router_model_name`、`router_type` | 已註冊的 router 身分與已執行的策略類型：`complexity`、`semantic`、`adaptive` 或 `quality`。註冊名稱可能與團隊的公開別名不同。 |
| `router_config_id`、`router_config_updated_at` | 已選擇定義的 ID 與更新時間戳記（如有）。靜態設定可能沒有更新時間戳記。 |
| `router_config_fingerprint` | 在註冊策略時計算出的已設定路由欄位、模型與標籤指紋。 |
| `routed_model`、`cause` | 所選模型群組與其被選中的原因。 |
| `tier`、`tier_label`、`request_type`、`score` | 策略特定的分類。等級可以使用自訂名稱；分數不一定是機率。 |
| `classifier_model`、`classifier_cost`、`classifier_confidence` | 分類器身分、記錄的成本與信心度（如有）。 |
| `classifier_failure_reason`、`classifier_error_type` | 受界限限制的失敗類別與例外類別名稱（當存在例外時）。這些欄位不包含例外訊息。 |
| `classifier_primary_rule`、`classifier_capability_boundary` | 能力分類器回報的規則與能力界限。 |
| `classifier_p_solve`、`classifier_calibrated_p_solve`、`classifier_calibration_version`、`classifier_threshold` | 可用的能力估計、校準身分與閾值。 |
| `classifier_efficient_p_solve`、`classifier_capable_p_solve`、`classifier_calibrated_efficient_p_solve`、`classifier_calibrated_capable_p_solve` | 高效率與高能力模型的可用解題預測。 |
| `classifier_max_quality_gap`、`classifier_prompt_version` | 已設定的品質差距約束與分類器提示版本（如有產生）。 |
| `escalated`、`context_escalated`、`context_escalation_original_tier`、`reasoning_override_min_score` | 升級與推理覆寫細節。 |
| `conversation_continuing` | 此決策是否識別為持續中的對話。 |
| `savings_baseline_model`、`savings_baseline_deployment_id` | 路由決策所使用的基準身分。僅憑這些欄位無法判定節省了多少。 |

指紋不是影響路由的一切內容的完整快照。它不包含參考檔案內容、即時自適應狀態以及外掛實作／狀態。請將其與設定 ID、時間戳記及已部署的閘道版本一併比較。

既有的 model-call 監測資料提供提供者、token 使用量與成本屬性；span 時序提供持續時間。此功能不會建立新的路由指標、儀表板或警示。請參閱 [OTEL v2 參考](/docs/observability/opentelemetry_v2) 以了解周邊的 trace 資料。

### 可回復的分類器失敗 {#classifier-failures-that-recover}

成功的 HTTP 回應可能包含分類器失敗。範例來說，LLM 分類器可能失敗，而已設定的 heuristic 備援仍可選擇模型並完成請求。示意性的決策如下：

```json
{
  "litellm.routing.router_model_name": "smart-router",
  "litellm.routing.router_config_id": "smart-router-config",
  "litellm.routing.routed_model": "efficient",
  "litellm.routing.cause": "heuristic_scorer",
  "litellm.routing.classifier_failure_reason": "classifier_error",
  "litellm.routing.classifier_error_type": "InternalServerError"
}
```

這個回復範例需要 LLM 分類器；上方僅使用 heuristic 的設定不會進行任何分類器模型呼叫。請搜尋 `classifier_failure_reason` 的存在來找出已回復的失敗。若只篩選錯誤 HTTP 狀態或包含 `fallback` 的 `cause`，將會漏掉其中一部分。

![顯示所選設定、分類器錯誤與 heuristic 回復的 Lens 路由 span](/img/auto-router/otel-telemetry.jpg)

| `classifier_failure_reason` | 含義 |
| --- | --- |
| `timeout` | 分類器逾時。 |
| `circuit_open` | 開啟的斷路器阻止了分類器呼叫。 |
| `not_configured` | 必要的分類器設定無法使用。 |
| `unsupported_input` | 分類器無法處理輸入。 |
| `invalid_response` | 分類器結果無法作為有效決策使用。 |
| `declined` | 分類器拒絕選擇層級。 |
| `classifier_error` | 發生了其他分類器例外狀況。 |

路由 `cause` 會保留實際的決策原因，例如 `heuristic_scorer`、`heuristic_v2`、`llm_classifier`、`capability_classifier`、`jev_classifier`、`classifier_plugin` 或 `default_model_fallback`。語意路由器會回報 `semantic_match`、`semantic_no_match` 或 `semantic_error`；一般的未匹配並不是分類器失敗。其他路由政策可以回報各自的原因。

### 重試與備援事件 {#retry-and-fallback-events}

當 Router 記錄自動路由嘗試的 retry/fallback 記帳資訊時，OTEL v2 會記錄 **`litellm.routing.retry`**。該事件包含 `litellm.routing.router_model_name`、`litellm.retry.count` 與 `error.type`，以及在已知時的 `litellm.deployment.model_group` 和 `litellm.deployment.id`。

計數遵循既有的請求重試計數器。事件可以描述已耗盡的嘗試或備援轉換；它不保證會再向外重試一次，也不等於 provider 呼叫的確切數量。設定識別仍保留在 route span 上。

## 資料擷取與效能 {#data-capture-and-performance}

新的純量路由屬性不包含諸如 `signals`、已比對關鍵字與 `classifier_crux` 之類的 prompt 引號欄位，以及原始設定、例外訊息和巢狀預測對映。其他 span 屬性與記錄仍遵循各自的擷取與去識別化設定。尤其是，v1 會保留既有的中繼資料匯出；此 allowlist 不會讓整個 trace 變得沒有 prompt。

Telemetry 會增加屬性處理與較大的 trace 負載。它不會新增分類器或 completion 呼叫，而且設定指紋會在請求之間重複使用。標準網路匯出器會在背景批次處理；console 與明確設定的 simple processors 的行為則不同。請先使用您自己的匯出器與流量測量吞吐量與尾端延遲，再設定效能預期。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查項目 |
| --- | --- |
| 沒有 trace 抵達 | 確認來源閘道已設定 OTEL、目的端接受該協定與憑證，且取樣或 collector 篩選器保留了該請求。成功完成並不代表匯出成功。 |
| trace 抵達但沒有 `litellm.routing.*` | 確認閘道包含 instrumentation、請求經由使用 gateway inference API 的已儲存 router 通過，且您正在檢視 route 或 model-call span。 |
| 有 model 屬性，但沒有 routing 階段細節 | 請在啟動前啟用 v2 並重新啟動。檢查後端或 preset 是否保留非 LLM span，以及是否已安裝閘道 instrumentation 依賴。 |
| 有設定欄位，但沒有選定的模型 | 嘗試可能在產生路由決策之前就已失敗。請檢視該階段及其錯誤。 |
| 最後成功的 span 沒有 routing 欄位 | 純模型備援會清除較早的路由器決策。請檢視前一個 route 階段。 |
| 沒有 fingerprint 或時間戳記 | 某個定義可能沒有時間戳記，而當已設定的定義無法序列化時，fingerprint 也可能不存在。請使用可用的識別欄位。 |
| 已回復的失敗沒有例外類別 | 有些失敗類別是決策，而不是被攔截的例外。請一併檢視 `classifier_failure_reason` 與 `cause`。 |
