---
title: "新模型的備援泛化規則"
description: "LiteLLM 如何為未對應的模型 ID 推斷提供者與能力、精確條目如何優先，以及如何自訂成本對照表規則。"
---

# 新模型的備援泛化規則 {#fallback-generalizations-for-new-models}

<SinceVersion v="1.92.0" />

LiteLLM 使用 `fallback_generalizations` 規則，在新模型 ID 尚未於模型成本對照表中擁有條目之前就能辨識它們。例如，未對應的 `claude-newfamily-5` 可以解析為 Anthropic 並取得 Claude 的能力預設值，無需等待成本對照表更新。這並不會在提供者處建立模型，也不保證提供者會接受該模型。

這些規則位於 [model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 頂層的 `fallback_generalizations.rules` 陣列中。它們描述的是模型家族，而非個別版本。成本對照表的精確條目永遠優先，包括 `supports_reasoning: false` 這類值。

此功能不會在另一個模型上重試失敗的請求。如需該功能，請參閱 [路由備援](./proxy/reliability.md)。

## 查看未對應模型的解析結果 {#see-an-unmapped-model-resolve}

此範例使用內附的成本對照表，且不會發出推論請求。請在已安裝其 Python 環境的 LiteLLM 原始碼 checkout 中執行。

```bash
LITELLM_LOCAL_MODEL_COST_MAP=True uv run --no-sync python - <<'PY'
import litellm

model = "claude-newfamily-5"
print("Mapped entry:", model in litellm.model_cost)
print("Provider:", litellm.get_llm_provider(model=model)[1])
info = litellm.get_model_info(model=model)
for key in (
    "litellm_provider", "mode", "max_input_tokens", "max_output_tokens",
    "supports_reasoning", "supports_adaptive_thinking", "supports_tool_search",
    "input_cost_per_token", "output_cost_per_token",
):
    print(f"{key}: {info.get(key)}")
PY
```

您的輸出會與此示意相似。能力與 token 上限取決於您的 LiteLLM 安裝所載入的成本對照表。

```text
Mapped entry: False
Provider: anthropic
litellm_provider: anthropic
mode: chat
max_input_tokens: 200000
max_output_tokens: 64000
supports_reasoning: True
supports_adaptive_thinking: True
supports_tool_search: True
input_cost_per_token: 0
output_cost_per_token: 0
```

隨附的能力規則刻意不帶任何定價欄位。比對成功提供的是能力，而不是價格估算。`get_model_info` 對於缺失的輸入與輸出 token 價格會傳回零。這個零並不表示提供者免費提供該模型。當您需要支出追蹤時，請透過 [自訂定價](./proxy/custom_pricing.md) 或 [精確的成本對照表條目](./provider_registration/add_model_pricing.md) 加入經過驗證的費率。

## 比對如何運作 {#how-matching-works}

### 路由規則 {#routing-rules}

路由規則在 `model_info` 中恰好只有一個鍵，即字串 `litellm_provider`。第一條比對成功的路由規則優先。`get_llm_provider` 會在既有的提供者推斷無法辨識某個未知 ID 時，將這些規則作為最後手段。路由規則不會為 `get_model_info` 提供能力。

提供者推斷對於 `anthropic/*` 這類虛擬金鑰存取也很重要。存取檢查會先解析裸 ID 的提供者，再將其與允許的提供者萬用字元比對。因此，路由規則可以讓未對應的裸 Claude ID 符合 `anthropic/*`。它不會繞過金鑰權限，也不會設定部署。請參閱 [萬用字元路由](./wildcard_routing.md)。

### 能力規則 {#capability-rules}

能力規則在 `model_info` 中沒有 `litellm_provider` 鍵。它提供 `mode`、token 上限與 `supports_*` 旗標等欄位。所有比對成功的能力規則會依檔案順序合併，當它們設定相同欄位時，後面的規則優先。

`get_model_info` 會在這些規則之前，先嘗試成本對照表的精確查詢與不分大小寫查詢。若未命中，它會依查詢順序嘗試候選模型名稱，並使用第一個有任何能力比對成功的候選。呼叫端會以解析出或被請求的提供者回填 `litellm_provider`。能力規則本身不會路由裸 ID。若沒有任何規則比對成功，則維持正常的模型未對應行為。

### 為已對應條目填補缺失欄位 {#fill-missing-fields-on-mapped-entries}

能力規則也可以將 `fill_missing_for_providers` 設定為提供者字串清單。對於提供者在該清單中的已對應條目，比對成功的已標記規則只會填補該條目尚未包含的鍵。既有的值，包括 `false` 或 `null`，會被保留。後面的已標記規則在彼此之間優先，但永遠不會覆寫條目的既有值。

此填補適用於 `chat` 與 `responses` 條目，缺少 mode 時視為 `chat`。路由規則永遠不會填補欄位。若沒有這項逐規則的選擇加入，能力規則只會套用到未對應的 ID。

## 規則欄位與驗證 {#rule-fields-and-validation}

`pattern` 是必填的 regex 字串，`model_info` 是必填的物件。LiteLLM 以 `re.IGNORECASE` 編譯模式，並以 `re.search` 進行比對。比對可以發生在候選名稱的任何位置。當您想比對整個名稱時，請使用 `^` 與 `$`。

`name` 會在警告中標示該規則，並讓規則更容易維護。`description` 向讀者說明預期的比對對象，比對引擎會忽略它。`fill_missing_for_providers` 為可選，且必須是提供者字串清單。

請將路由規則與能力規則分開。混合 `litellm_provider` 與能力欄位、使用非字串提供者、regex 無效，或必填欄位格式錯誤的規則，都會被略過並發出警告。舊的 `extends` 格式同樣會被略過並發出警告。請更新舊的自訂成本對照表，不要依賴它從其他規則或模型繼承。

## 自訂規則 {#customize-the-rules}

先複製一份完整且最新的成本對照表。編輯其中的 `fallback_generalizations.rules` 陣列，保留既有的模型條目與您仍需要的任何規則。載入的陣列會取代作用中的規則，而不是附加在其後。

例如，以下兩條獨立的規則會路由一個假設由 Anthropic 託管的 `claude-example-5`，並為其提供推理支援。這是要放入完整對照表中的 JSON 片段，而不是完整的替代成本對照表。

```json
{
  "fallback_generalizations": {
    "rules": [
      {
        "name": "example-routing",
        "pattern": "^claude-example-5$",
        "description": "Route this bare ID to Anthropic.",
        "model_info": {"litellm_provider": "anthropic"}
      },
      {
        "name": "example-capabilities",
        "pattern": "claude-example-5",
        "description": "Enable reasoning for this model under any namespace.",
        "fill_missing_for_providers": ["anthropic"],
        "model_info": {"supports_reasoning": true}
      }
    ]
  }
}
```

將完整的 JSON 文件託管起來，並在匯入 LiteLLM 之前設定 `LITELLM_MODEL_COST_MAP_URL`。例如，將它指向 `https://example.com/model_prices_and_context_window.json`。若啟動時的擷取失敗，會備援回內附的對照表，因此若您的規則未生效，請檢查啟動警告。

`LITELLM_LOCAL_MODEL_COST_MAP=True` 會選用已安裝套件的 `litellm/model_prices_and_context_window_backup.json`，而不是擷取遠端對照表。若要在該模式下使用自訂規則，請將您編輯好的完整對照表打包到該位置。這個旗標不是路徑設定，URL 載入器也不接受本機檔案路徑或 `file://` URL。部署特定的載入行為請參閱 [模型成本對照表載入](./proxy/model_cost_map.md)。

`litellm.register_model` 註冊的是個別模型條目，而不是作用中的泛化規則。它的 URL 註冊路徑會明確移除 `fallback_generalizations` 區塊。目前沒有專用的 proxy `config.yaml` 規則設定。Proxy 部署的 `model_info` 與自訂定價描述的是部署，而不是 regex 規則。請透過載入的成本對照表文件提供規則。

若要為所有人提出預設值，請編輯主成本對照表，並在 [test_fallback_generalizations.py](https://github.com/BerriAI/litellm/blob/main/tests/unit/litellm_core_utils/test_fallback_generalizations.py) 中加入涵蓋範圍。請將路由測試與能力測試分開，並確認已對應條目保留了自己的值。

目前的規則請以 [LiteLLM main 上成本對照表中的 `fallback_generalizations` 區塊](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 為準。

## 實作 {#implementation}

[規則引擎](https://github.com/BerriAI/litellm/blob/main/litellm/litellm_core_utils/fallback_generalizations.py) 定義了驗證與合併順序。[提供者推斷](https://github.com/BerriAI/litellm/blob/main/litellm/litellm_core_utils/get_llm_provider_logic.py) 使用路由規則，[模型資訊解析](https://github.com/BerriAI/litellm/blob/main/litellm/utils.py) 使用能力規則，[成本對照表載入器](https://github.com/BerriAI/litellm/blob/main/litellm/litellm_core_utils/get_model_cost_map.py) 則安裝規則陣列。
