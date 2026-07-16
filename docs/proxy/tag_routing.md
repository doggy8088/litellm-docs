import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 基於 Tag 的路由 {#tag-based-routing}

## 快速開始 {#quick-start}

### 1. 在 config.yaml 上定義 tags {#1-define-tags-on-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["free"] # 👈 Key Change
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      tags: ["paid"] # 👈 Key Change
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      tags: ["default"] # OPTIONAL - All untagged requests will get routed to this

router_settings:
  enable_tag_filtering: True # 👈 Key Change

general_settings:
  master_key: sk-1234
```

### 2. 使用 `tags=["free"]` 發出請求 {#2-make-request-with-tagsfree}

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
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
  "model": "gpt-3.5-turbo-0125",
  "object": "chat.completion",
  "usage": {"completion_tokens": 12, "prompt_tokens": 9, "total_tokens": 21}
}
```

### 3. 使用 `tags=["paid"]` 發出請求 {#3-make-request-with-tagspaid}

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
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
  "model": "gpt-4o-2024-05-13",
  "object": "chat.completion",
  "usage": {"completion_tokens": 10, "prompt_tokens": 12, "total_tokens": 22}
}
```

## 透過 Request Header 呼叫 {#calling-via-request-header}

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-H 'x-litellm-tags: free,my-custom-tag' \
-d '{
  "model": "gpt-4",
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
  -H "Authorization: Bearer sk-1234" \
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
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
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
      model: anthropic/claude-haiku-4-5-20251001
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["provider:anthropic"]

  - model_name: chat
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai"]

  - model_name: chat
    litellm_params:
      model: vertex_ai/gemini-2.0-flash
      api_key: os.environ/VERTEX_API_KEY
      tags: ["provider:vertex"]

router_settings:
  enable_tag_filtering: true

general_settings:
  master_key: sk-1234
```

### 結合正向與否定 tags {#combining-positive-and-negation-tags}

使用正向 tags 選取某個層級，再用否定 tags 排除該層級中的提供者：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
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
  -H "Authorization: Bearer sk-1234" \
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
      model: anthropic/claude-haiku-4-5-20251001
      api_key: os.environ/ANTHROPIC_API_KEY
      tags: ["provider:anthropic"]

  - model_name: fallback
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
      tags: ["provider:openai"]

router_settings:
  enable_tag_filtering: true
  fallbacks:
    - {"primary": ["fallback"]}

general_settings:
  master_key: sk-1234
```

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
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

## 基於 regex 的 tag 路由（`tag_regex`） {#regex-based-tag-routing-tag_regex}

在 deployment 上使用 `tag_regex`，即可依照請求的 headers（例如 `User-Agent`）比對進來的請求——不需要用戶端送出明確的 tags。模式由操作者設定並在伺服器端編譯，而不是由呼叫者提供。

:::caution
User-Agent 是可由用戶端提供的 header，任何呼叫者都可以將其設為任意值。請將 `tag_regex` 用於流量分類，而非存取控制強制執行。

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
  master_key: sk-1234
```

### 2. 驗證路由 {#2-verify-routing}

```bash
# Claude Code request (User-Agent set automatically by Claude Code)
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "User-Agent: claude-code/1.2.3" \
  -d '{"model": "claude-sonnet", "messages": [{"role": "user", "content": "hi"}]}'
# -> x-litellm-model-id: claude-code-deployment

# Any other client (no matching User-Agent) -> default deployment
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
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
  master_key: sk-1234
```

### 建立帶有 tags 的團隊 {#create-teams-with-tags}

```bash
# Create Team A
curl -X POST http://0.0.0.0:4000/team/new \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["teamA"]}'

# Create Team B
curl -X POST http://0.0.0.0:4000/team/new \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["teamB"]}'
```

### 為團隊成員產生金鑰 {#generate-keys-for-team-members}

```bash
# Generate key for Team A
curl -X POST http://0.0.0.0:4000/key/generate \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "team_a_id_here"}'

# Generate key for Team B
curl -X POST http://0.0.0.0:4000/key/generate \
  -H "Authorization: Bearer sk-1234" \
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
