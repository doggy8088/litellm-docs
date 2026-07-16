import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 遷移至 OpenTelemetry v2 {#migrating-to-opentelemetry-v2}

OpenTelemetry v2 是 LiteLLM 追蹤的重寫版本。HTTP 伺服器 span 由標準 FastAPI instrumentation 管理，而不是由 LiteLLM 管理；span 模型是有型別的，且提供者屬性詞彙表透過 mapper 鏈進行組合。本指南說明從 [v1 OpenTelemetry 整合](./opentelemetry_integration) 移至 [v2](./opentelemetry_v2) 時會有哪些變更，以及如何在不破壞現有儀表板的情況下完成遷移。

## 啟用 {#turn-it-on}

設定功能旗標並重新啟動 proxy：

```shell
LITELLM_OTEL_V2=true
```

您現有的 `OTEL_*` 環境變數與回呼仍可運作，因此對許多設定來說，這是唯一需要的變更。此旗標只會在啟動時讀取一次。

## 變更內容 {#what-changes}

這些差異都不會是靜默的；每一項都可以在儀表板中搜尋到，因此請遷移依賴它的查詢。

### 根 span 名稱 {#the-root-span-name}

v1 記錄器會自行建立根 span，並將其命名為 `Received Proxy Server Request`。v2 則讓 FastAPI instrumentation 擁有根 span，並以路由為其命名，例如 `POST /v1/chat/completions`，且會在其上標記 `http.route`。任何以字面值 `Received Proxy Server Request` 為篩選條件的已儲存查詢或警示，都需要改為使用路由名稱或 `http.route`。

### 防護欄 span 移動 {#the-guardrail-span-moves}

在 v1 中，防護欄 span 是 `litellm_request` span 的子項。在 v2 中，它是 LLM 呼叫 span 的同層項目，直接位於請求根之下，因為前置呼叫防護欄是在 LLM 呼叫存在之前執行的。若查詢是透過從推論 span 往下走來找出防護欄 span，則應改為指向請求根。

### 推論 span 名稱與種類 {#the-inference-span-name-and-kind}

v1 預設將推論 span 命名為 `litellm_request`，只有在您啟用實驗性的 semantic conventions 時才會使用 `{operation} {model}`。v2 一律將其命名為 `{operation} {model}`，例如 `chat gpt-4o`，span 種類為 `CLIENT`。

### 提供者選擇 {#vendor-selection}

v1 會透過屬性程式碼中的分支，根據回呼名稱挑選提供者屬性樣式。v2 則透過 mapper 鏈組合詞彙表：canonical `genai` mapper 一定存在，而 preset 會在上層加上提供者 mapper。設定 preset callback 仍然是選擇提供者的方式；底層機制已改變，而現在它可讓您在同一個 span 上疊加多種詞彙表。

### 身分標記 {#identity-stamping}

v1 會以明確的逐 span 程式碼，將團隊與金鑰身分標記到每個 span 上。v2 則先將一小組允許清單中的身分值一次性寫入 OpenTelemetry Baggage，接著由 span processor 將其複製到每個 span 上。這通常對儀表板是不可見的，因為產生的鍵（`litellm.team.id`、`litellm.api_key.hash` 等）概念相同；差異在於現在這組值是明確且可設定的允許清單。請參閱 [身分 baggage](./opentelemetry_v2#identity-baggage)。

### 成功狀態 {#success-status}

v1 會將成功的 span 狀態設為 `OK`。v2 則保留為 `UNSET`，這是與 FastAPI server span 相符的 semantic-convention 預設值，只有在真正發生錯誤時才會設為 `ERROR`。以狀態 `OK` 為依據的警示，應改為統計非錯誤 span。

## 在切換期間保留舊的屬性名稱 {#keep-the-old-attribute-names-during-the-cutover}

v2 預設附帶一個舊版相容 mapper（`LITELLM_OTEL_LEGACY_COMPAT=true`），會在 canonical keys 之外，額外以較舊的 Traceloop key 名稱（`gen_ai.system`、`gen_ai.usage.prompt_tokens`、`gen_ai.usage.completion_tokens`、`llm.is_streaming` 等）輸出相同資料。這就是能夠逐步遷移的原因：啟用 v2 後，讀取舊 token 數與提供者 key 的儀表板仍可正常運作。您可以依自己的步調，將每個查詢遷移到 canonical `gen_ai.*` keys，然後將 `LITELLM_OTEL_LEGACY_COMPAT=false` 設為停用以移除重複項目。

## 安全上線 {#a-safe-rollout}

1. 在 staging 中啟用 v2，設定 `LITELLM_OTEL_V2=true`，並保持 `legacy_compat` 開啟（預設值）。
2. 確認 traces 有送達，且樹狀結構正確：每個請求有一個 server span，LLM 呼叫 span 位於其下方，防護欄則為同層項目。
3. 針對變更後的 span 名稱與成功狀態變更，更新儀表板與警示。
4. 將屬性查詢從舊版 key 名稱遷移到 canonical `gen_ai.*` keys。
5. 將 `LITELLM_OTEL_LEGACY_COMPAT=false` 設為停用，並確認沒有任何問題。
6. 推出至 production。

## 回復 {#rolling-back}

設定 `LITELLM_OTEL_V2=false`（或將其取消設定）並重新啟動。LiteLLM 會回退到 v1 記錄器，使用您已設定的相同 `OTEL_*` 環境變數與回呼，因此回復不需要其他變更。
