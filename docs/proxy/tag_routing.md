import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 基於 Tag 的路由 {#tag-based-routing}

## 快速開始 {#quick-start}

### 1. 在 config.yaml 上定義 tags {#1-define-tags-on-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["free"] # 👈 Key Change
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["paid"] # 👈 Key Change
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["default"] # OPTIONAL - All untagged requests will get routed to this

router_settings:
  enable_tag_filtering: True # 👈 Key Change

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 2. 使用 `tags=["free"]` 發出請求 {#2-make-request-with-tagsfree}

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [
      {"role": "user", "content": "Hello, Claude gm!"}
    ],
    "tags": ["free"]
  }'
```

**回應：**

```json
{
  "id": "chatcmpl-33c534e3d70148218e2d62496b81270b",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "\n\nHello there, how may I assist you today?",
        "role": "assistant"
      }
    }
  ],
  "model": "{{openai_large}}",
  "object": "chat.completion",
  "usage": {"completion_tokens": 12, "prompt_tokens": 9, "total_tokens": 21}
}
```

### 3. 使用 `tags=["paid"]` 發出請求 {#3-make-request-with-tagspaid}

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [
      {"role": "user", "content": "Hello, Claude gm!"}
    ],
    "tags": ["paid"]
  }'
```

**回應：**

```json
{
  "id": "chatcmpl-9maCcqQYTqdJrtvfakIawMOIUbEZx",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "Good morning! How can I assist you today?",
        "role": "assistant"
      }
    }
  ],
  "model": "{{openai_large}}",
  "object": "chat.completion",
  "usage": {"completion_tokens": 10, "prompt_tokens": 12, "total_tokens": 22}
}
```

## 透過 Request Header 呼叫 {#calling-via-request-header}

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'x-litellm-tags: free,my-custom-tag' \
-d '{
  "model": "{{openai_large}}",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how'\''s it going?"
    }
  ]
}'
```

## 設定預設 tags {#setting-default-tags}

### 1. 在 yaml 上設定預設 tag {#1-set-default-tag-on-yaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["default"] # 👈 Key Change - All untagged requests will get routed to this
    model_info:
      id: "default-model"
```

### 2. 啟動 proxy {#2-start-proxy}

```bash
$ litellm --config /path/to/config.yaml
```

### 3. 在沒有 tags 的情況下發出請求 {#3-make-request-with-no-tags}

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello, Claude gm!"}
    ]
  }'
```

## 否定 tags（拒絕清單） {#negation-tags-denylist}

在任何 tag 前加上 `!`，即可**排除**帶有該精確 tag 的 deployments。當您想避免特定提供者或模型家族，但又不想逐一列出所有允許的替代項時，這會很有用。

### 快速範例 {#quick-example}

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["!provider:anthropic"]}
  }'
```

任何標記為 `provider:anthropic` 的 deployment 都會在路由前從候選池中移除。其餘所有 deployments 皆可被選用。

### 設定範例 {#config-example}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chat
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["provider:anthropic"]

  - model_name: chat
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai"]

  - model_name: chat
    litellm_params:
      model: vertex_ai/{{gemini_flash}}
      api_key: os.environ/VERTEX_API_KEY
      tags: ["provider:vertex"]

router_settings:
  enable_tag_filtering: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 結合正向與否定 tags {#combining-positive-and-negation-tags}

使用正向 tags 選取某個層級，再用否定 tags 排除該層級中的提供者：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["paid", "!provider:anthropic"]}
  }'
```

### 排除多個提供者 {#excluding-multiple-providers}

傳送多個 `!` tags，以排除多於一個 deployment 群組：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["!provider:anthropic", "!provider:openai"]}
  }'
```

只有 vertex deployment 會保留為可選。

### 與備援鏈搭配的否定 {#negation-with-fallback-chains}

當主要模型群組被封鎖時，路由器會自動落入已設定的備援：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: primary
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["provider:anthropic"]

  - model_name: fallback
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai"]

router_settings:
  enable_tag_filtering: true
  fallbacks:
    - {"primary": ["fallback"]}

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "primary",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["!provider:anthropic"]}
  }'
# primary is banned -> falls through to fallback (provider:openai)
```

### 否定語義 {#negation-semantics}

| 行為 | 詳細說明 |
|----------|--------|
| 比對 | 完全符合 tag 字串。`!provider:anthropic` 只會移除標記為完全符合 `provider:anthropic` 的 deployments |
| 不支援 regex | 否定 tags 是純字串，不是 regex 模式。`!provider:(anthropic\|openai)` 只會排除標記為完全符合 `provider:(anthropic\|openai)` 的 deployment。若要排除多個提供者，請分別送出不同的 tags：`["!provider:anthropic", "!provider:openai"]`。注意：deployment 設定中的 `tag_regex` 是 regex，但那是由操作者設定，與用戶端提供的否定 tags 無關 |
| 只封鎖請求 | 如果請求只帶有 `!` tags，且沒有任何正向 tags，則基礎候選池會反映未標記請求的行為：若存在預設 tag 的 deployments，則使用它們；否則使用所有 deployments。之後再將排除集合套用到該候選池之上 |
| 全部排除 | 如果否定 tags 移除了所有候選項，請求會以 `no_deployments_with_tag_routing` 失敗 |
| 未標記的 deployments | 沒有 `tags` 欄位的 deployments 不會被否定 tags 排除 |
| 標頭 | 否定 tags 也可透過 `x-litellm-tags` header 運作：`-H 'x-litellm-tags: !provider:anthropic'` |

## 必要標籤（AND） {#required-tags-and}

在任何標籤前加上 `&` 即可將其設為必要。請求中的每個 `&` 前綴標籤都必須具備，該部署才會成為候選；這與一般標籤只需要命中一個即可不同。這對於結合彼此獨立的條件很有用，例如「必須具有高推理能力，且必須來自 Anthropic」，而一般 OR 標籤則可能改為匹配低推理的 Anthropic 部署，或高推理但非 Anthropic 的部署。

### 快速範例 {#quick-example-1}

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["&reasoning_type:high", "&provider:anthropic"]}
  }'
```

只有同時具有 `reasoning_type:high` 和 `provider:anthropic` 的部署才符合資格。

### 設定範例 {#config-example-1}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chat
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["reasoning_type:high", "provider:anthropic"]

  - model_name: chat
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["reasoning_type:high", "provider:openai"]

router_settings:
  enable_tag_filtering: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 結合必要、否定與一般標籤 {#combining-required-negation-and-plain-tags}

`!` 排除會先套用，接著 `&` 必要標籤會縮小剩餘範圍，最後一般標籤再對存活者套用通常的 OR 偏好：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["&reasoning_type:high", "provider:anthropic", "provider:openai", "!inference:cerebras"]}
  }'
# must be high-reasoning, AND (anthropic OR openai), AND not cerebras-hosted
```

### 必要 AND 語義 {#required-and-semantics}

| 行為 | 詳細說明 |
|----------|--------|
| 比對 | 完全相同的標籤字串比對，與否定標籤相同。不是 regex |
| 僅必要標籤請求 | 如果請求只帶有 `&` 標籤（沒有一般或否定標籤），基礎池會鏡像未標籤請求的行為：若存在預設標籤的部署，則使用這些部署；否則使用所有部署。之後再把必要標籤過濾套用在該池之上 |
| regex/header 偏好不會稀釋必要 AND 請求 | 僅必要 AND 的請求一定會回傳所有符合必要標籤的部署，即使其中一個也剛好符合不相關的 `tag_regex`/User-Agent 偏好。它絕不會被縮減成只剩 regex 命中的部署 |
| 全部淘汰 | 如果必要標籤淘汰了所有候選，請求會以 `no_deployments_with_tag_routing` 失敗，除非模型群組選擇啟用 [`allow_fail_open`](#fail-open-fallback-allow_fail_open) |
| 標頭 | 必要標籤也可透過 `x-litellm-tags` 標頭運作：`-H 'x-litellm-tags: &reasoning_type:high'` |

## 失敗開放備援（`allow_fail_open`） {#fail-open-fallback-allow_fail_open}

預設情況下，當 `!` 或 `&` 標籤淘汰了模型群組中的每個部署時，請求會以 `no_deployments_with_tag_routing` 失敗。在群組中的每個部署上，將 `allow_fail_open: true` 設定於 `model_info` 中，即可在請求失敗前改為回退到預設標籤池。

這是明確的選擇加入。若未啟用，行為維持不變：無法滿足的 `!` 或 `&` 條件一律會拋出，完全如同現行的否定行為。

### 設定範例 {#config-example-2}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chat
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["provider:anthropic"]
    model_info:
      allow_fail_open: true

  - model_name: chat
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai", "default"]
    model_info:
      allow_fail_open: true

router_settings:
  enable_tag_filtering: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 未使用 `allow_fail_open` 時 {#without-allow_fail_open}

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["!provider:anthropic", "!provider:openai"]}
  }'
# both deployments banned, allow_fail_open unset -> fails with no_deployments_with_tag_routing
```

### 使用 `allow_fail_open` 時 {#with-allow_fail_open}

使用上方設定時，相同請求會改為回退到預設標籤的部署，包括請求原本想要禁止的那一個：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["!provider:openai"]}
  }'
# openai deployment banned; anthropic deployment is not "default"-tagged, so the
# pool falls back to whichever deployment IS "default"-tagged (openai here) -> the
# ban is treated as advisory rather than failing the request
```

:::warning
回退到預設標籤池仍可能回傳請求明確嘗試排除的部署，適用於任何可歸因於呼叫者的條件。只有在模型群組中，當某個無法被滿足的 `allow_fail_open`/`!` 條件可以接受降級而非失敗時，才應將 `&` 設為啟用；若該條件是硬性合規要求，則不要在該群組上啟用（例如：「絕不要將這個帳戶的流量路由到 Provider X」）。

從金鑰或團隊層級原則繼承而來的條件不會被丟棄所影響。代理層會將來自金鑰/團隊中繼資料的標籤與請求本身提供的標籤分開追蹤（`metadata.inherited_tags`），因此 `allow_fail_open` 只會丟棄呼叫者可控制的條件。即使呼叫者也把繼承標籤的完全相同值連同一個衝突值一併重新送出，這種值碰撞也無法像單純的集合相減那樣被區分為真正由呼叫者提供的標籤。若只丟棄呼叫者可控制的部分後仍然沒有可路由的目標，請求會改為拋出，而不是失敗開放。

這項保護需要代理層。繞過代理的直接 SDK `Router` 呼叫（未設定 `metadata.inherited_tags`）會無條件回退到完全不受限制的預設池，完全就像每個標籤都由呼叫者提供一樣。這正是 `allow_fail_open` 一直以來在代理之外的行為。
:::

### allow_fail_open 語義 {#allow_fail_open-semantics}

| 行為 | 詳細說明 |
|----------|--------|
| 位置 | `model_info.allow_fail_open`，不是 `litellm_params`。為了一致的行為，請在共享同一模型群組的每個部署上都設定；路由器會檢查任一成員 |
| 預設值 | 未設定（`false`）。除非群組選擇加入，否則現有的 `!` 否定行為維持不變 |
| 範圍 | 只處理由 `!` 或 `&` 造成的耗盡。一般標籤耗盡維持既有行為：若存在預設池則回退到預設池，否則拋出 |
| 備援池 | 與未標籤及僅禁止請求所使用的相同預設標籤池，不會重新套用請求自身的 `!`/`&` 條件 |
| 繼承標籤保護 | 丟棄是根據標籤來源（`metadata.inherited_tags`，由代理根據金鑰/團隊原則填入）來決定，而不是從總數中扣除呼叫者自己的標籤——即使呼叫者另外提交相同值，金鑰/團隊繼承的條件仍會受到保護 |

## 明確路由指示（`tag_routing_prefix`） {#explicit-routing-directives-tag_routing_prefix}

以標籤為基礎的路由會透過檢查某個部署的字面標籤字串是否剛好匹配，來推斷「這個標籤是否用於路由」。這個經驗法則通常是對的，但呼叫者自訂的 `&`/`!` 標籤若完全不命中任何項目，會被視為可疑雜訊，並且即使呼叫者確實想要的是誠實但無法滿足的請求，也可能阻擋 `allow_fail_open` 的回退（見上文）。設定 `router_settings.tag_routing_prefix` 後，呼叫者就能將特定標籤標記為受信任、無歧義的路由指示，對使用它的標籤徹底消除這種歧義。

任何以已設定前綴開頭的請求標籤都會移除前綴，並使用一般的 `!`/`&`/一般標籤邏輯來比對，因為呼叫者已明確宣告路由意圖，因此不需要詞彙檢查。未加前綴的標籤則維持現有處理方式不變，因此採用此前綴不需要遷移。

### 快速範例 {#quick-example-2}

在設定 `tag_routing_prefix: "route:"` 後：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["feature:demo", "route:!provider:openai"]}
  }'
# feature:demo is untouched attribution, never meant for routing; route:!provider:openai
# is stripped to !provider:openai and matched as an explicit ban
```

### 設定範例 {#config-example-3}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chat
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["default", "provider:anthropic"]
    model_info:
      allow_fail_open: true

  - model_name: chat
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai"]

router_settings:
  enable_tag_filtering: true
  tag_routing_prefix: "route:" # opt-in: enables the prefix mechanism

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 前綴標籤與未知標籤失敗開放防護 {#prefixed-tags-and-the-unknown-tag-fail-open-guard}

前綴的 `&`/`!` 標籤會被 [未知標籤失敗開放防護](#fail-open-fallback-allow_fail_open) 視為已知，無論是否有任何部署的字面標籤與其匹配，因為呼叫者已明確宣告路由意圖：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["route:&provider:anthropic", "route:&custom-routing-key"]}
  }'
# custom-routing-key matches no deployment's tags, but because it is prefix-marked
# the caller has explicitly declared it a routing directive -- allow_fail_open still
# proceeds to the default-tagged pool instead of being blocked by the "does an
# invented tag hide a satisfiable answer" guard
```

### tag_routing_prefix 語義 {#tag_routing_prefix-semantics}

| 行為 | 詳細說明 |
|----------|--------|
| 位置 | `router_settings.tag_routing_prefix`，字串，預設 `""` |
| 預設值 | `""`。`str.startswith("")` 會匹配每個字串，因此在設定前此機制完全不會作用 |
| 比對 | 完全字面前綴，不會自動附加分隔符。請自行設定尾部分隔符（例如 `"route:"`，而不是 `"route"`）— 沒有分隔符的前綴可能會意外匹配到剛好以相同字元開頭的無關標籤 |
| 剝除順序 | 會先剝除前綴，再進行 `!`/`&` 解析，因此 `route:!provider:x` 與 `route:&provider:x` 都可正常運作 |
| 未加前綴的標籤 | 維持現有處理方式不變：一般標籤會走已知標籤詞彙的經驗法則，而 `!`/`&` 標籤則走未知標籤失敗開放防護 |
| 與失敗開放的互動 | 前綴的 `&`/`!` 標籤會被視為 `allow_fail_open` 的未知標籤防護所認定的已知標籤，不受部署標籤詞彙影響 |

## 依模型群組的標籤過濾（`enable_tag_filtering`） {#per-model-group-tag-filtering-enable_tag_filtering}

將 `enable_tag_filtering` 設定在 `model_info` 中，即可在任一方向上只針對一個 model group 覆寫 `router_settings.enable_tag_filtering`。這會在 model-group 層級進行檢查：路由器會查看所請求 `model_name` group 中的任何 deployment，而如果該 deployment 的 `model_info.enable_tag_filtering` 已設定，就會為該 group 的每一個請求以此取代 router-wide 預設值。請將其一致地設定在共享該 group 的每個 deployment 上，遵循 `allow_fail_open` 已使用的相同慣例。

這對於服務許多彼此無關 model groups 的 proxy 很重要。為了滿足某個 group 由 `router_settings.enable_tag_filtering` 全域啟用而產生的 `&`/`!` 驅動合規路由需求，若對所有其他 group 的請求也開啟 tag 評估，會造成暴露風險。只在該 group 的 deployments 上設定 `model_info.enable_tag_filtering: true` 可避免此問題。反向情況也適用：可以劃出一個不受 tag 影響的全包 catch-all 或 incident-response model group，同時讓 proxy 其餘部分在其他地方都強制執行 tag 篩選。

### 快速範例 {#quick-example-3}

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "chat-compliance",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["&provider:anthropic"]}
  }'
# router_settings.enable_tag_filtering is false, but chat-compliance opts in via
# model_info.enable_tag_filtering: true, so the "&" constraint still applies
```

### 設定範例 {#config-example-4}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chat-compliance
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["provider:anthropic"]
    model_info:
      enable_tag_filtering: true # opt in for this group only

  - model_name: chat-compliance
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai"]
    model_info:
      enable_tag_filtering: true

  - model_name: incident-response
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      enable_tag_filtering: false # opt out for this group only

router_settings:
  enable_tag_filtering: false # router-wide default; chat-compliance overrides it

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

使用此設定時，`chat-compliance` 會在每個請求上評估 tags，儘管 router-wide 預設值是關閉；而其他所有 model groups（包括 `incident-response`）都會忽略 tags，並回退到一般的負載平衡路由。若將 router-wide 預設值改為 `true`，則 `chat-compliance` 仍會照常評估 tags，且不受影響，而 `incident-response` 的明確 `enable_tag_filtering: false` 會使其維持豁免。

### enable_tag_filtering 語意 {#enable_tag_filtering-semantics}

| 行為 | 詳細說明 |
|----------|--------|
| 位置 | `model_info.enable_tag_filtering`，不是 `litellm_params`。請將其設定在共享該 model group 的每個 deployment 上；路由器會檢查任一成員 |
| 優先順序 | 由低到高：`router_settings.enable_tag_filtering`（router-wide 預設值），接著若在所請求的 group 上設定了 `model_info.enable_tag_filtering`，則其會針對該 group 單獨覆寫 router 預設值，最後是來自 key/team 設定的請求層級 `enable_tag_filtering` |
| 僅限請求層級升級 | 由 proxy 根據 key/team 設定所設的請求層級設定只能開啟篩選。即使某個請求層級的 `enable_tag_filtering=True` 會凌駕於自行以 `enable_tag_filtering: false` 選擇退出的 group；沒有任何請求層級的方法可以關閉 router 與 model group 已決定要開啟的篩選 |
| 預設值 | 未設定。model group 會延用 `router_settings.enable_tag_filtering`，與此覆寫存在之前完全相同 |
| 範圍 | 套用於整個 tag 篩選決策，而不只是 `&`/`!` 的處理。關閉篩選的 group 會同時忽略一般、否定與必要 tags |
| 與健康狀態無關 | 由為 model group 設定的每個 deployment 解析，而不只是目前健康的那些 —— 單一 deployment 的冷卻時間不能在唯一帶有覆寫的 deployment 離開輪替時，悄悄地讓整個 group 的 tag 政策失效（或啟用） |

## 基於 regex 的 tag 路由（`tag_regex`） {#regex-based-tag-routing-tag_regex}

在 deployment 上使用 `tag_regex`，可依據傳入請求的標頭（例如 `User-Agent`）進行比對，而不需要用戶端傳送明確的 tags。這些模式由操作員設定，並在伺服器端編譯，不是由呼叫者提供。

:::warning
User-Agent 是用戶端提供的標頭，任何呼叫者都可以將其設為任何值。請將 `tag_regex` 用於流量分類，而不是存取控制強制執行。

基於 header 的路由本身不是安全邊界。只有當請求通過上游驗證層時才有意義（例如：在請求到達 LiteLLM 之前，會驗證憑證並拒絕未經驗證流量的 API gateway 或 reverse proxy）。若沒有這類層級，任何用戶端都可以偽造 User-Agent，並被路由到不應到達的 deployment。
:::

### 1. 設定 {#1-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  # Claude Code traffic → dedicated deployment, matched by User-Agent
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/converse/anthropic-claude-sonnet-4-6
      aws_region_name: us-east-1
      aws_role_name: arn:aws:iam::111122223333:role/LiteLLMClaudeCode
      tag_regex:
        - "^User-Agent: claude-code\\/"   # matches claude-code/1.x, 2.x, etc.
    model_info:
      id: claude-code-deployment
  # All other traffic falls back to the default deployment
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/converse/anthropic-claude-sonnet-4-6
      aws_region_name: us-east-1
      aws_role_name: arn:aws:iam::444455556666:role/LiteLLMDefault
      tags:
        - default
    model_info:
      id: regular-deployment

router_settings:
  enable_tag_filtering: true
  tag_filtering_match_any: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 2. 驗證路由 {#2-verify-routing}

```bash
# Claude Code request (User-Agent set automatically by Claude Code)
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "User-Agent: claude-code/1.2.3" \
  -d '{"model": "claude-sonnet", "messages": [{"role": "user", "content": "hi"}]}'
# -> x-litellm-model-id: claude-code-deployment

# Any other client (no matching User-Agent) -> default deployment
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{"model": "claude-sonnet", "messages": [{"role": "user", "content": "hi"}]}'
# -> x-litellm-model-id: regular-deployment
```

### 比對語義 {#matching-semantics}

| 行為 | 詳細說明 |
|----------|--------|
| 引擎 | Python `re.search` — 除非您要固定在字串的開頭（`^`）或結尾（`$`），否則模式不需要錨定 |
| 輸入格式 | 模式會與 `"Header-Name: value"` 字串進行比對。目前只公開 `User-Agent`：`User-Agent: claude-code/1.2.3` |
| 邏輯 | 一律使用 OR——只要任何一個模式符合，就足以選取該 deployment。`tag_filtering_match_any=False` 只適用於純 `tags`，不適用於 `tag_regex` |
| 無效模式 | 任何未通過 `re.compile` 的模式都會被記錄並略過；它永遠不會導致嚴重錯誤 |
| 與純 tags 的互動 | 當一個 deployment 同時具有 `tags` 與 `tag_regex`，且 `tag_filtering_match_any=False` 時，如果嚴格 tag 檢查已失敗，則 regex 路徑會被封鎖。Regex 無法覆寫嚴格 tag 原則 |
| 可信輸入 | 模式由操作者在 config 中設定，絕不由呼叫者提供。這是它與否定 tags（request metadata 中的 `!foo`）之間的關鍵差異；否定 tags 一律被視為純文字常值 |

### 與否定 tags 的互動 {#interaction-with-negation-tags}

否定排除會先於 `tag_regex` 比對執行。當一個 deployment 同時帶有純 `tags` 清單與 `tag_regex` 時，順序就很重要：

1. 路由器會移除任何其 `tags` 與請求的排除集合有交集的 deployment。
2. `tag_regex` 比對只會在保留下來的候選項上執行。

**情境 1：否定移除了帶有純 tag 的 deployment；`tag_regex` deployment 不受影響**

```yaml
model_list:
  - model_name: chat
    litellm_params:
      tag_regex: ["^User-Agent: claude-code\\/"]   # no plain tags
    model_info: {id: claude-code-deployment}

  - model_name: chat
    litellm_params:
      tags: ["provider:anthropic"]
    model_info: {id: anthropic-deployment}
```

```bash
curl ... -H "User-Agent: claude-code/1.2.3" \
  -d '{"model":"chat","metadata":{"tags":["!provider:anthropic"]}}'
# anthropic-deployment is excluded; claude-code-deployment is matched by User-Agent
# -> x-litellm-model-id: claude-code-deployment
```

**情境 2：否定移除了持有 `tag_regex` 的 deployment；只封鎖請求路徑觸發**

如果被否定的 tag 位於與 `tag_regex` 相同的 deployment 上，該 deployment 會先被排除。當候選池中不再有 `tag_regex` deployments 時，`has_tag_filter` 會變成 `False`，只封鎖請求路徑會觸發，剩餘的 deployments 會直接回傳。

```yaml
model_list:
  - model_name: chat
    litellm_params:
      tag_regex: ["^User-Agent: claude-code\\/"]
      tags: ["group:claude"]   # negation target is on the tag_regex deployment
    model_info: {id: claude-code-deployment}

  - model_name: chat
    litellm_params:
      tags: ["provider:openai"]
    model_info: {id: openai-deployment}
```

```bash
curl ... -H "User-Agent: claude-code/1.2.3" \
  -d '{"model":"chat","metadata":{"tags":["!group:claude"]}}'
# claude-code-deployment excluded; no tag_regex deployments remain
# ban-only path returns openai-deployment regardless of User-Agent
# -> x-litellm-model-id: openai-deployment
```

### 可觀測性 {#observability}

```json
{
  "tag_routing": {
    "matched_via": "tag_regex",
    "matched_value": "^User-Agent: claude-code\\/",
    "user_agent": "claude-code/1.2.3",
    "request_tags": []
  }
}
```

## 基於團隊的 tag 路由（企業版） {#team-based-tag-routing-enterprise}

### 組態 {#configuration}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["teamA"] # 👈 Key Change
    model_info:
      id: "team-a-model"
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["teamB"] # 👈 Key Change
    model_info:
      id: "team-b-model"
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["default"] # OPTIONAL - All untagged requests will get routed to this

router_settings:
  enable_tag_filtering: True # 👈 Key Change

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 建立帶有 tags 的團隊 {#create-teams-with-tags}

```bash
# Create Team A
curl -X POST http://0.0.0.0:4000/team/new \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["teamA"]}'

# Create Team B
curl -X POST http://0.0.0.0:4000/team/new \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["teamB"]}'
```

### 為團隊成員產生金鑰 {#generate-keys-for-team-members}

```bash
# Generate key for Team A
curl -X POST http://0.0.0.0:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "team_a_id_here"}'

# Generate key for Team B
curl -X POST http://0.0.0.0:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "team_b_id_here"}'
```

### 驗證路由 {#verify-routing}

```bash
curl -i -X POST http://0.0.0.0:4000/chat/completions \
  -H "Authorization: Bearer team_a_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```
