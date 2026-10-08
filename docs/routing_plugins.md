# 路由外掛 {#routing-plugins}

:::info

Routing plugin 可從 **v1.92.x**（週四的版本）開始使用。設計仍在演進中，因此如果您想知道會如何使用它，以及接下來在 GitHub 上的 autorouter 討論中會想要什麼，請告訴我們：[#32168](https://github.com/BerriAI/litellm/discussions/32168)。

:::

Routing plugin 是一條管線，每個 plugin 都會接收 routing context、加以豐富，然後在最終 routing decision 之前傳遞給下一個 plugin。

有兩個設定介面：

- **Python SDK。** 將實例傳給 `Router(plugins=[...])`。每次 routing decision 都會執行。
- **Proxy YAML。** `complexity_router_config.plugins` 接受 dotted-path 參照。會在 complexity router 的 tier-pick 內執行，並針對該 tier 的實際 candidate pool。

Plugin 不會取代 router。它們會先以標準化方式豐富 routing context，然後再由 router 做出最終決策。

complexity auto-router 會另外使用第二個、獨立的 plugin 來處理決策的另一半：classifier plugin 會命名 tier，而不是縮小 pool。使用相同的 context object，但介面不同，兩者可組合。請參閱 [Classifier plugins：選擇 tier](#classifier-plugins-choosing-the-tier)。

## 外掛能做與不能做的事 {#what-plugins-can-and-cant-do}

Plugin 可以：

- **縮小 `candidate_models`。** 移除項目會限制 Router 可選擇哪些 deployment。新增項目沒有影響；只有初始 deployment pool 可供派送。
- **發布 `signals`。** 後續 plugin 會從 `context.signals` 讀取；Router 與下游策略（auto-router、complexity-router、adaptive-router、quality-router）會從 `metadata["routing_plugin_signals"]` 讀取。
- **停止管線。** 從 `run()` raise 可短路該請求。縮小到零個 candidate 也會中止（raise `ValueError`）。
- **讀取 `raw_messages` 或 `structured_messages`。** 只讀。兩者都不會寫回外送 request。讀取 `structured_messages` 可取得與提供者無關的 OpenAI chat 格式形狀；讀取 `raw_messages` 可取得原始 wire payload（`/chat/completions`、`/v1/messages`、Responses API `input` 等）。

Plugin 不能：

- **變更 request body。** 變更 `context.raw_messages` 或 `context.structured_messages` 不會重寫送往提供者的 messages。若要重寫 prompt，請使用 pre-call hook 或 guardrail；routing plugin 對 request 是唯讀的。
- **直接變更 request metadata。** `context.metadata` 是一份副本。請改用 `context.signals` 發布；Router 會在 `metadata["routing_plugin_signals"]` 上呈現它們。
- **將 deployment 新增到 candidate pool。** 篩選僅支援 include/exclude。新增到 `candidate_models` 但不在 Router 的 `model_list` 中的 model 不會有任何影響。
- **選擇 complexity router 的 tier。** routing plugin 是針對已經分類好的 tier 執行。若要決定 tier 本身，請撰寫 [classifier plugin](#classifier-plugins-choosing-the-tier)。

## 具體的端到端範例 {#concrete-end-to-end-example}

1. 使用者送出請求。
2. 語言 plugin 偵測到 `en`。
3. domain classifier 將其標記為 `coding`，信心值為 0.93。
4. tenant policy 將允許的提供者限制為 OpenAI 和 Anthropic。
5. budget plugin 移除超出 tenant 成本政策的 model。
6. Router 接收已豐富的 routing context，並選出剩餘的最佳 model。

## 快速入門 {#quick-start}

```python
from litellm import Router
from litellm.types.router import RoutingContext


class LanguageDetector:
    async def run(self, context: RoutingContext) -> RoutingContext:
        context.signals["language-detector"] = {"lang": "en"}
        return context


class DomainClassifier:
    async def run(self, context: RoutingContext) -> RoutingContext:
        context.signals["domain-classifier"] = {"domain": "coding", "confidence": 0.93}
        return context


class TenantPolicy:
    ALLOWED = {"acme-corp": {"openai", "anthropic"}}

    async def run(self, context: RoutingContext) -> RoutingContext:
        tenant = context.metadata.get("tenant", "default")
        allowed = self.ALLOWED.get(tenant, {"openai", "anthropic", "self-hosted"})
        context.candidate_models = [
            m for m in context.candidate_models if m.split("/")[0] in allowed
        ]
        return context


class BudgetPolicy:
    COST_CAP_PER_TOKEN = 0.000001
    COST_BY_MODEL = {
        "openai/{{openai_small}}": 0.0000002,
        "anthropic/{{anthropic}}": 0.000002,
        "openai/{{openai_large}}": 0.000002,
    }

    async def run(self, context: RoutingContext) -> RoutingContext:
        context.candidate_models = [
            m for m in context.candidate_models
            if self.COST_BY_MODEL.get(m, 0) <= self.COST_CAP_PER_TOKEN
        ]
        return context


router = Router(
    model_list=[
        {"model_name": "smart-router", "litellm_params": {"model": "openai/{{openai_small}}"}},
        {"model_name": "smart-router", "litellm_params": {"model": "anthropic/{{anthropic}}"}},
        {"model_name": "smart-router", "litellm_params": {"model": "openai/{{openai_large}}"}},
        {"model_name": "smart-router", "litellm_params": {"model": "ollama/llama-3-70b"}},
    ],
    plugins=[LanguageDetector(), DomainClassifier(), TenantPolicy(), BudgetPolicy()],
)

response = await router.acompletion(
    model="smart-router",
    messages=[{"role": "user", "content": "Write a function to reverse a linked list."}],
    metadata={"tenant": "acme-corp"},
)
```

## 路由內容 {#the-routing-context}

Plugin 作者不應該需要理解每個提供者的 request 格式。請以穩定的介面運作：

```python
class RoutingContext(BaseModel):
    raw_messages: list[dict[str, Any]]         # original request payload, read-only
    structured_messages: list[dict[str, Any]]  # normalized to OpenAI chat format, read-only
    candidate_models: list[str]                # provider/model; narrow to restrict Router
    metadata: dict[str, Any]                   # tenant, user, session info (copy; not writable back)
    signals: dict[str, Any]                    # write here to pass output downstream
```

Plugin 可以是任何具有 `async def run(self, context) -> RoutingContext` 的物件。

## 請求生命週期 {#request-lifecycle}

Plugin 會在 auto-routing 之前執行。`async_pre_routing_hook` 內的順序如下：

1. Request 進入 `acompletion()`（或其他 async Router 進入點）。
2. **Routing-plugin 管線依清單順序執行。** 每個 plugin 的 `run()` 都會看到前一個 plugin 的變更。
3. Auto-router / complexity-router / adaptive-router / quality-router 進行派送，若它們依賴 plugin 輸出，則會讀取 `metadata["routing_plugin_signals"]`。
4. 健康 deployment 篩選會強制套用縮小後的 `candidate_models`，位置與基於標籤的 routing 相同。
5. Routing 策略（`simple-shuffle`、`usage-based-routing-v2`、`cost-based-routing`、`latency-based-routing`、`least-busy`）從剩餘項目中選擇一個 deployment。
6. 觸發提供者呼叫。

該管線每個請求只會執行一次。縮小到零個會 raise `ValueError`；若 plugin 不回傳任何 candidate，這是政策決策，而悄悄回退到未篩選的 pool 會破壞此政策。

## 與複雜度自動路由器結合 {#combining-with-the-complexity-auto-router}

Plugin 與 complexity auto-router 的組合方式有兩種：

**提供給 router 消費的訊號。** Plugin 寫入 `context.signals` 的任何內容，都會在 router 執行前呈現在 `metadata["routing_plugin_signals"]` 上，因此 domain-classifier plugin 可以發布其標籤，而 router 可以依此做路由。

**以 candidate 縮減作為硬性政策閘門。** Plugin 會縮小該 tier 的實際 candidate pool。若 plugin 將某個 tier 的所有 candidate 都移除，該呼叫就會 raise；router 不會回退到 `default_model`，因為那樣會成為繞過政策的無條件逃逸通道。

### 在代理程式上（YAML） {#on-the-proxy-yaml}

在 `complexity_router_config` 下新增 `plugins`。每個項目都是指向 `RoutingPlugin` 實例的 dotted path，解析方式與 `litellm_settings.callbacks` 相同（路徑相對於 `config.yaml` 的目錄）。

```yaml
model_list:
  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE: ["{{openai_small}}"]
          MEDIUM: ["{{openai_small}}"]
          COMPLEX: ["{{openai_large}}", "{{openai_small}}"]
          REASONING: ["{{openai_large}}", "{{openai_small}}"]
        default_model: {{openai_small}}
        plugins:
          - plugins.cost_ceiling_plugin.cost_ceiling_plugin

  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
```

同層 `plugins/cost_ceiling_plugin.py`：

```python
class CostCeilingPlugin:
    def __init__(self, max_cost_per_token: float, cost_by_model: dict):
        self.max_cost_per_token = max_cost_per_token
        self.cost_by_model = cost_by_model

    async def run(self, context):
        context.candidate_models = [
            m for m in context.candidate_models
            if self.cost_by_model.get(m, 0.0) <= self.max_cost_per_token
        ]
        context.signals["cost-ceiling-plugin"] = {"max_cost_per_token": self.max_cost_per_token}
        return context


cost_ceiling_plugin = CostCeilingPlugin(
    max_cost_per_token=0.000001,
    cost_by_model={"{{openai_small}}": 2e-07, "{{openai_large}}": 2e-06},
)
```

Proxy 會在啟動時解析每個 dotted path，驗證結果必須是 `RoutingPlugin`（否則會以清楚的錯誤使啟動失敗），並將該實例接到每個 tier-pick 位置：加權評分、`keyword_tier_rules` 覆寫，以及沒有使用者訊息的預設 tier 路徑。沒有任何路由會繞過這條管線。

對於路由到 `["{{openai_large}}", "{{openai_small}}"]` tier 的 `COMPLEX` 請求，`CostCeilingPlugin` 會移除 `{{openai_large}}`（高於上限）；每次派送都會落在 `{{openai_small}}`。

在 Proxy 上將 plugin 與 complexity router 一起使用時，有兩個行為需要知道：

- **`session_affinity` 在設定了 plugin 時會停用。** 否則快取會鎖定一個 session 的第一輪 model，並在後續回合略過 plugin 管線，因此中途政策變更（例如超過 budget 上限）只會套用到第一輪。
- **`adaptive=True` 搭配 `plugins` 會在設定驗證時 raise。** bandit 選擇器尚未消耗經 plugin 縮小的 pool。

### 從 SDK {#from-the-sdk}

相同的接線方式，將 plugin 以實例傳給 `Router(plugins=[...])`。規則相同：candidate 縮減會針對已分類的 tier pool 執行，存活數為零會 raise，`default_model` 不是逃逸通道。

```python
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "{{openai_small}}", "litellm_params": {"model": "openai/{{openai_small}}"}},
        {"model_name": "{{openai_large}}", "litellm_params": {"model": "openai/{{openai_large}}"}},
        {
            "model_name": "smart-router",
            "litellm_params": {
                "model": "auto_router/complexity_router",
                "complexity_router_config": {
                    "tiers": {
                        "SIMPLE": ["{{openai_small}}"],
                        "COMPLEX": ["{{openai_large}}", "{{openai_small}}"],
                    },
                    "default_model": "{{openai_small}}",
                },
            },
        },
    ],
    plugins=[cost_ceiling_plugin],
)
```

## 分類器外掛：選擇層級 {#classifier-plugins-choosing-the-tier}

routing plugin 會縮小 router 從中挑選的 pool。classifier plugin 則決定那個 pool 是哪一個。它取代了 complexity router 的分類步驟，因此不是由 heuristic scorer、LLM classifier 或 keyword 規則來決定 tier，而是由您的程式命名，然後 router 服務該 tier 的 model。

當 tier 不是從讀取 prompt 就能推導出來時，請使用它：依 team 或 tenant plan 路由、依您在自己服務中持有的 entitlement 路由、依您在事故期間切換的旗標路由。呼叫端身分會出現在 `context.metadata`（`user_api_key_team_id`、`user_api_key_team_alias`、`user_api_key_user_id`）上，因此以 team 或 tenant 為基礎的 tiering 不需要額外的 plumbing。

:::info

Classifier plugin 將隨 **v1.99.x** 發布（[PR #37249](https://github.com/BerriAI/litellm/pull/37249)）。僅限設定檔，和 `plugins` 一樣的封閉性：live object 不會透過 HTTP 傳輸，因此無法透過 model-management API 或 UI 設定這兩個 key。

:::

設定 `classifier_type: custom`，並將 `classifier_plugin` 指向一個 `ClassifierPlugin` 實例的 dotted path，其在啟動時的解析方式與 `plugins` 項目完全相同（相對於 `config.yaml` 的目錄）。`classifier_plugin_timeout_ms` 會限制該呼叫，預設為 3000。

```yaml title="config.yaml"
model_list:
  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        classifier_type: custom
        classifier_plugin: plugins.tier_by_team.tier_by_team
        classifier_plugin_timeout_ms: 3000
        tiers:
          SIMPLE: ["{{openai_small}}"]
          REASONING: ["{{openai_large}}", "{{openai_small}}"]
        default_model: {{openai_small}}

  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
```

同層 `plugins/tier_by_team.py`：

```python
class TierByTeam:
    async def classify(self, context):
        team = context.metadata.get("user_api_key_team_alias")
        if team == "research":
            return "REASONING"
        if team == "support":
            return "SIMPLE"
        return None


tier_by_team = TierByTeam()
```

分類器插件是任何具有 `async def classify(self, context) -> str | None` 的物件。它接收與路由插件相同的 `RoutingContext`，並回傳某個層級的名稱：內建層級（`SIMPLE`、`MEDIUM`、`COMPLEX`、`REASONING`）或其 `tier_labels` 顯示名稱。回傳 `None` 會拒絕該請求並將其交給已設定的備援。

### 它與路由外掛有何不同 {#how-it-differs-from-a-routing-plugin}

`ClassifierPlugin` 是一個獨立的介面，而不是 `RoutingPlugin` 的多載；其差異源自於各自所決定的內容。

路由器只有一個分類器和一個路由插件清單。`classifier_plugin` 接受單一的點記號路徑，`plugins` 則接受會以管線方式執行的清單；當問題在於層級時，沒有什麼需要串接，因為第一個答案就是答案。

`candidate_models` 在此僅供參考。它會以每個層級模型的快照形式傳入，讓分類器能看到路由器提供哪些服務，但您回傳的層級會決定所選的池，因此篩選清單不會產生作用。縮減範圍是路由管線的工作。

失敗在每個銜接處代表的意義相反。將範圍縮減為零的路由插件會直接拋出例外，因為縮減到無物是一種政策決定，而悄悄擴大池子會破壞這項決定。分類器若拒絕、拋出例外、超過 `classifier_plugin_timeout_ms`，或指定路由器不識別的層級，都表示未形成任何政策，因此請求會像 LLM 分類器失敗時一樣進入備援：`classifier_fallback` 會將其送往啟發式評分器，或送往 `default_model`。當機的分類器插件會讓路由降級；它不會讓請求失敗。

設定錯誤會在啟動時浮現，而不是在第一個被分類的請求時才出現。無法解析為具有非同步 `classify` 之物件的點記號路徑會被拒絕，並標示出設定鍵；`classifier_type: custom` 沒有插件就會拋出例外，而留在任何其他 `classifier_type` 下的 `classifier_plugin` 也會拋出例外，因為它永遠不會執行。

### 組合兩者 {#composing-the-two}

這兩個鍵都位於同一個 `complexity_router_config` 上，而且路由器可以同時設定兩者。分類器先選擇層級，接著路由管線再篩選該層級的池，因此以團隊為基礎的分類器與成本上限路由插件可以疊加，而彼此都不需要知道對方的存在。

上文對 `plugins` 所述的兩項限制，僅適用於候選項縮減，不適用於分類器插件。`session_affinity` 仍可正常運作，因為分類器只會在已被分類的回合上執行，而 pin 會略過分類而非政策。`adaptive: true` 也可組合使用，在分類器回傳的任一層級中進行 Thompson sampling，其中 `adaptive` 與 `plugins` 的組合仍會在設定驗證時拋出例外。

路由器上的其他一切行為都如文件所述：`keyword_tier_rules` 會先於分類器而短路，升級關鍵字仍可將其回傳的層級升級，且 `classifier_context_*` 設定仍僅供 LLM 分類器使用，因為插件會自行讀取訊息。每個決策都會記錄為 `cause=classifier_plugin`。完整欄位參考請見 [Auto Routing](./proxy/auto_routing.md#classification) 頁面。

## 限制 {#limitations}

僅支援非同步。當配置了插件時，同步 `Router.completion()` 會拋出例外。支援的策略：`simple-shuffle`、`usage-based-routing-v2`、`cost-based-routing`、`latency-based-routing`、`least-busy`，以及 `auto_router/*`（目前為 complexiy router）。舊版 `usage-based-routing`（v1）會拋出例外。

Proxy YAML 設定目前已連接到 complexity router。其他自動路由器（adaptive、semantic、quality）仍需要 SDK。

目前的候選項篩選僅限於包含/排除。加權評分則是讓插件表達偏好（「偏好 Claude」、「懲罰昂貴模型」），而不是完全移除模型，這不在第一版範圍內。

## 參考資料 {#reference}

設定：[`router_settings.plugins`](./proxy/config_settings#router_settings---reference)。
PR： [#32972](https://github.com/BerriAI/litellm/pull/32972)（SDK）、[#33251](https://github.com/BerriAI/litellm/pull/33251)（complexity router 的 proxy YAML）、[#37249](https://github.com/BerriAI/litellm/pull/37249)（分類器插件）。討論：[#32168](https://github.com/BerriAI/litellm/discussions/32168)。

## 加入討論 {#join-the-discussion}

可自 **v1.92.x**（週四的版本）起使用。我們正在積極規劃路由插件與 autorouter 的下一步方向，也希望聽到您想撰寫哪些插件、您想要哪些訊號，以及您會使用哪些路由策略。歡迎分享您的使用案例，並在 GitHub 上的 autorouter 討論中持續關注：[#32168](https://github.com/BerriAI/litellm/discussions/32168)。
