# 自訂模型成本對照表 {#custom-model-cost-map}

LiteLLM 會根據其模型成本對照表為每個請求定價，該表是一個 JSON 檔案，將每個模型對應到每 token 費率、上下文限制與功能。預設情況下，proxy 會在啟動時從 GitHub 取得最新對照表，因此新模型的定價可在不升級 LiteLLM 的情況下到達。當您的部署有錯誤或缺失的價格（例如區域價格變體、議定費率，或預設對照表尚未收錄的全新層級）時，您有兩種方式修正：在設定檔中覆寫特定部署的定價，或以您自己代管的副本取代整張對照表。

若要做有限範圍的修正，請優先使用每個部署的覆寫。它只會變更您指定的部署，會在每次上游對照表更新後保留，不需要檔案代管，也沒有備援失敗模式。只有當修正涵蓋的模型多到每個部署的設定已難以維護時，才改用完整自訂對照表。

## 選項 1：每個部署的定價覆寫（建議） {#option-1-per-deployment-pricing-overrides-recommended}

成本對照表中的任何定價鍵都可以直接在 `litellm_params` 中設定到某個部署上，包括形如 `input_cost_per_token_above_{N}k_tokens` 的分級長上下文鍵。當輸入 token 數跨越門檻時，LiteLLM 會以該級費率計算整個請求。

範例：一個按區域價格變體計費的 Azure 部署（例如 US Data Zone），其長上下文級別在預設對照表中缺失：

```yaml
model_list:
  - model_name: gpt-5.5
    litellm_params:
      model: azure/<your-deployment-name>
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      input_cost_per_token: 0.0000055        # base rate for your price variant
      output_cost_per_token: 0.000044
      input_cost_per_token_above_272k_tokens: 0.000011   # long-context tier
      output_cost_per_token_above_272k_tokens: 0.0000495
      cache_read_input_token_cost: 0.00000055
      cache_read_input_token_cost_above_272k_tokens: 0.0000011
```

可覆寫鍵的完整集合包括基礎每 token 費率、每秒費率、快取讀取與快取建立費率，以及每一項的 `above_128k`、`above_200k`、`above_272k` 級別變體，外加 `_priority` 服務層級變體。上述數字僅供說明；請從您的提供者價目表取得實際費率。一般覆寫機制請參見 [自訂 LLM 定價](./custom_pricing)。

分級定價無需變更程式碼即可套用；成本引擎會讀取解析後定價所帶有的任何級別鍵。

### 部分覆寫不會回退到預設定價 {#partial-overrides-do-not-fall-back-to-default-pricing}

設定任何自訂定價欄位都會讓該部署與預設成本對照表條目脫鉤：LiteLLM 會為該部署建立獨立的定價條目，並只依此計費。若您覆寫 `input_cost_per_token` 但未設定 `input_cost_per_token_above_272k_tokens`，該部署就完全沒有級別邊界，因此超過 272k token 的請求會以您的自訂基礎費率計費。未設定的級別鍵不會繼承預設對照表的級別價格，且 LiteLLM 絕不會將您的基礎費率與預設級別加價混用。

唯一刻意保留的例外是快取定價。當您覆寫基礎輸入費率時，缺少的快取欄位（`cache_read_input_token_cost`、`cache_creation_input_token_cost` 及其 `above_1hr` 和 `above_200k` 變體）會從後端模型的預設條目繼承，以免快取讀取在不知不覺間被以零計費。請注意，這些繼承值是預設價格，不是您的價格變體，因此區域或議定費率表也應一併覆寫快取鍵。

請將覆寫區塊視為該部署的完整費率表：基礎輸入與輸出費率、長上下文級別鍵，以及快取鍵。部分覆寫會在剛好昂貴的請求上悄悄少算費用。

## 選項 2：代管您自己的成本對照表 {#option-2-serve-your-own-cost-map}

使用以下方式將 proxy 指向您自己的對照表副本：

```bash
export LITELLM_MODEL_COST_MAP_URL="https://your-host.example.com/model_prices.json"
```

該對照表會在啟動時讀取一次，逾時為 5 秒，因此該變數必須在 proxy 啟動前設定，變更也需要重新啟動。URL 必須是 HTTP(S)；不支援 `file://` 路徑。若要完全離線執行，請改設 `LITELLM_LOCAL_MODEL_COST_MAP=True`，它會跳過抓取並使用套件內附的備份對照表（`litellm/model_prices_and_context_window_backup.json`），您可在自己的映像檔中覆寫該檔案。

### 從完整的上游檔案開始 {#start-from-the-full-upstream-file}

請始終以完整的 [model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 作為自訂對照表的分支，並將您的修正編輯進去。只包含您模型的小檔案會被拒絕：抓取到的對照表必須至少包含 50 個模型條目，且至少要有內建備份的一半條目數，否則 LiteLLM 會丟棄它。如果您接受有損壞對照表通過驗證的風險，則可透過 `MODEL_COST_MAP_MIN_MODEL_COUNT` 和 `MODEL_COST_MAP_MAX_SHRINK_RATIO` 調整這兩個門檻。

### 備援語意：請監控它們 {#fallback-semantics-monitor-them}

如果抓取失敗、逾時，或檔案驗證失敗，proxy 不會當機。它會記錄警告並靜默回退到內建備份對照表，這表示請求會依該備份所載的價格計費。對於正式環境部署，這是需要監看的失敗模式：在 pod 啟動時發生的暫時性網路錯誤，會悄悄讓您所有的定價修正回復原狀。

可使用管理端點確認實際載入的是哪一份對照表：

```bash
curl -s http://localhost:4000/model/cost_map/source \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

回應會回報 `source`（"remote" 或 "local"）、嘗試的 `url`、可供人閱讀的 `fallback_reason`（成功時為 null），以及 `model_count`。當 `source` 不是 `remote`，或 `fallback_reason` 不為 null 時，請發出警示。

### 正式環境檢查清單 {#production-checklist}

1. 將檔案作為版本化成品代管在您可控的基礎架構上（CDN 後方的物件儲存或內部端點），且每個 proxy pod 都能在 5 秒內連到。
2. 當 `/model/cost_map/source` 回報備援時發出警示。
3. 設定與上游對照表重新同步的週期，避免新釋出模型的定價在分支建立時就被凍結。
4. 在可行時將自訂對照表視為暫時方案：將您的修正回饋到預設對照表，然後移除分支。

## 應該選哪個選項 {#which-option-to-choose}

自訂對照表會取代整個定價資料庫。您將接管每個條目，且在重新同步前不再接收上游定價更新；其失敗模式（靜默備援）會在不讓健康檢查失敗的情況下回復您的修正。每個部署的覆寫則完全沒有這些風險，但其規模會隨著您必須修正的部署數量線性成長。若要修正少數幾個部署，請在設定中修正；若要修正整個叢集，則使用分支對照表加上監控；無論哪種情況，都請將修正回饋上游，讓此權宜之計得以退場。
