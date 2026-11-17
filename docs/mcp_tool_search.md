import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MCP 工具搜尋 {#mcp-tool-search}

將完整的 MCP 目錄替換為一組固定的虛擬工具（`mcp_tool_search`、`mcp_tool_call`、`agent_search`、`skill_search`），讓一個可存取數百個工具的金鑰在 `tools/list` 上永遠只會暴露四個工具。LLM 依預設以關鍵字搜尋，或在設定嵌入模型後依語意搜尋（請參閱 [排名](#ranking)），取得排名後的符合項目，接著以名稱呼叫找到的工具。對於不應預先收到完整工具 schema 的用戶端，[`/mcp/proxy`](#schema-discovery-endpoint-mcpproxy) 提供另一個三工具介面，可搜尋、取得單一 schema，並以不透明 ID 呼叫。`agent_search` 對 [A2A 代理程式登錄檔](./a2a.md#search-the-registry) 也採用相同做法，而 `skill_search` 則用於 [LiteLLM 託管的技能登錄檔](./skills.md#semantic-search-over-litellm-hosted-skills)，兩者都改以嵌入向量而非關鍵字進行排名。

:::info[相關文件]
- [MCP 總覽](./mcp.md)
- [MCP 權限管理](./mcp_control.md) 適用於底層的 `object_permission` 模型
- [MCP 語意篩選器](./mcp_semantic_filter.md) 適用於在 `/v1/responses` 層套用的 embeddings-based 替代方案
:::

## 快速開始 {#quick-start}

在 `mcp_tool_search_enabled: true` 下使用 `object_permission` 產生一組金鑰，將其與 `mcp_servers`（或 `mcp_access_groups`）配對，讓搜尋有內容可查，接著探索並呼叫。

```bash title="1. Create a key with tool search enabled" showLineNumbers
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "object_permission": {
      "mcp_tool_search_enabled": true,
      "mcp_servers": ["github", "slack"]
    }
  }'
```

```console title="2. tools/list returns only the virtual tools" showLineNumbers
$ curl -s http://localhost:4000/mcp-rest/tools/list \
    -H "Authorization: Bearer $KEY" | jq '[.tools[].name]'
["mcp_tool_search", "mcp_tool_call", "agent_search", "skill_search"]
```

```console title="3. Search discovers the real tools" showLineNumbers
$ curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
    -H "Authorization: Bearer $KEY" \
    -d '{"name":"mcp_tool_search","arguments":{"query":"add numbers"}}' \
  | jq -r '.content[0].text | fromjson | [.[].name]'
["math-add", "math-multiply"]
```

```console title="4. Call a discovered tool" showLineNumbers
$ curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
    -H "Authorization: Bearer $KEY" \
    -d '{"name":"mcp_tool_call","arguments":{"tool_name":"math-add","arguments":{"a":3,"b":4}}}' \
  | jq '{result: .content[0].text, isError}'
{
  "result": "7",
  "isError": false
}
```

同一組金鑰也可透過 streamable-http 協定端點（`/mcp/`）供真正的 MCP 用戶端使用：

```python title="MCP Python SDK against /mcp/" showLineNumbers
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async with streamablehttp_client(
    "http://localhost:4000/mcp/",
    headers={"Authorization": f"Bearer {KEY}"},
) as (read, write, _):
    async with ClientSession(read, write) as session:
        await session.initialize()

        tools = await session.list_tools()
        print([t.name for t in tools.tools])
        # ['mcp_tool_search', 'mcp_tool_call', 'agent_search', 'skill_search']

        found = await session.call_tool("mcp_tool_search", {"query": "add numbers"})
        print(found.content[0].text)

        result = await session.call_tool(
            "mcp_tool_call",
            {"tool_name": "math-add", "arguments": {"a": 3, "b": 4}},
        )
        print(result.content[0].text)  # "7"
```

未加上該旗標的金鑰會維持既有行為不變：`tools/list` 會回傳完整目錄，而這兩個虛擬工具名稱會因 `forbidden` 錯誤而遭拒。

:::note[沒有金鑰的 SSO 使用者]

此旗標是從登入者身上讀取的，因此不限於金鑰。不帶金鑰標頭連線到 `/mcp/` 並透過 SSO 登入的用戶端，會以其 LiteLLM 使用者身分被接納，因此只有在該使用者的 `object_permission` 具有 `mcp_tool_search_enabled: true` 時，才會看到虛擬工具。Admin UI 尚未提供此開關，請使用 `/user/update` 設定：

```bash
curl -X POST http://localhost:4000/user/update \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user id>", "object_permission": {"mcp_tool_search_enabled": true}}'
```

[`/mcp/proxy`](#schema-discovery-endpoint-mcpproxy) 不依賴此旗標，且可使用相同的 SSO 登入。

:::

## 將其設為每個新金鑰的預設值 {#enable-as-a-default-for-every-new-key}

如果您希望每個新金鑰都預設啟用工具搜尋，而不必讓每個呼叫端都記得加上旗標，請將其放在 `litellm_settings.default_key_generate_params.object_permission` 中的 `config.yaml` 下。任何省略該欄位的 `/key/generate` 請求都會合併預設值；若請求設定了部分 `object_permission`（例如只設定 `mcp_servers`），則會保留其明確指定的欄位，並只補上未設定的欄位。

```yaml title="config.yaml" showLineNumbers
litellm_settings:
  default_key_generate_params:
    object_permission:
      mcp_tool_search_enabled: true
      mcp_servers: ["github", "slack"]
```

預設值會在呼叫端範圍驗證完成**之後**才合併，因此不會把一般的非管理員個人金鑰請求變成 403。像 `mcp_servers` 這類以團隊為範圍的欄位，當呼叫端明確設定時，仍會以呼叫端自己的團隊進行檢查；管理員設定的預設值只會套用到已儲存的金鑰，而不會套用到正在驗證的請求。

## 運作方式 {#how-it-works}

當在金鑰的 `object_permission` 上設定 `mcp_tool_search_enabled: true` 時，無論該金鑰可連到多少個 MCP 伺服器，streamable-http 端點（`/mcp/`）與 REST 介面（`/mcp-rest/tools/list`）都只會回傳剛好四個工具：

- `mcp_tool_search(query, top_k=5)` 會回傳符合查詢的實際工具排名清單。
- `mcp_tool_call(tool_name, arguments)` 會執行 LLM 透過搜尋發現的其中一個工具。
- `agent_search(query, top_k=5)` 會回傳金鑰可連到的 A2A 代理程式，並依與 `query` 中描述的任務之語義相似度排序。這需要 `litellm_settings.agent_search_embedding_model`；請參閱 [搜尋登錄檔](./a2a.md#search-the-registry)。
- `skill_search(query, top_k=5)` 會回傳金鑰可連到的 LiteLLM 託管技能（`custom_llm_provider=litellm_proxy`），並依語義相似度排序。這需要 `litellm_settings.skill_search_embedding_model`；請參閱 [LiteLLM 託管技能上的語義搜尋](./skills.md#semantic-search-over-litellm-hosted-skills)。

兩個處理常式都會經過與一般 `/tools/call` 路由相同的已篩選目錄與分派路徑，因此搜尋只會顯示金鑰本來就有權看到的工具，而呼叫仍會透過 `_get_allowed_mcp_servers` 和 `execute_mcp_tool` 進行解析。

### 排名 {#ranking}

`mcp_tool_search` 會以兩種模式之一為呼叫端可存取的工具排名，模式由 `litellm_settings.mcp_tool_search.embedding_model` 決定。兩種模式都會搜尋每個工具的 `name + "\n" + description` 文字。

**關鍵字（預設，`embedding_model` 未設定）。** 不使用嵌入向量，也沒有額外相依性。proxy 會將查詢轉為小寫、以空白切分，並依查詢 token 以子字串形式出現在工具小寫名稱與描述中的數量為每個工具評分。同時包含 `add` 與 `numbers` 的工具分數為 2，只包含 `add` 的分數為 1，分數為 0 的工具會被移除。其餘工具依分數排序，同分時保持目錄順序，並回傳前 `top_k` 個。查詢必須與工具文字共享一個 token，因此 `"exchange"` 能找到描述為 "Get the latest foreign exchange rates" 的工具，但 `"FX"` 不能。

**語意（`embedding_model` 已設定）。** 將 `embedding_model` 指向 `model_list` 中的一個 `model_name`，proxy 便改以語意排名。它會嵌入查詢以及每個可存取工具的名稱加描述，依與查詢的餘弦相似度為每個工具評分，移除低於 `similarity_threshold` 的工具，並回傳最佳的 `top_k` 個，每個結果都帶有 `score` 欄位。工具向量會依嵌入模型快取在記憶體中（每個程序最多 5000 個向量，最久未被搜尋的先淘汰），因此對未變更的目錄重複搜尋時只需嵌入查詢。嵌入呼叫會經過與 `/embeddings` 相同的速率限制、預算與防護欄預先呼叫 hooks，費用計入呼叫端金鑰，並像任何其他嵌入請求一樣出現在支出記錄中。如果嵌入呼叫失敗，搜尋會回傳錯誤結果（`isError: true`，文字以 `embedding the search query failed` 開頭），而不是退回關鍵字排名。

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  mcp_tool_search:
    embedding_model: text-embedding-3-small  # unset = keyword ranking
    top_k: 5
    similarity_threshold: 0.2
    core_tools:
      - treasury-get_rates
```

| 欄位 | 類型 | 預設值 | 說明 |
|-------|------|---------|-------------|
| `embedding_model` | string | `null` | 用於依語意為工具排名的 `model_list` 中的 `model_name`。未設定時保持關鍵字排名。在沒有 `model_list` 的 proxy 上設定它，會使每次搜尋都回傳錯誤。 |
| `top_k` | integer, 1 to 100 | `5` | 一次搜尋最多回傳的排名工具數。`mcp_tool_search` 呼叫上的 `top_k` 參數可以縮小此值但不能放大，因為取兩者中較小者。核心工具不計入此數。 |
| `similarity_threshold` | float, 0.0 to 1.0 | `0.0` | 工具出現在語意結果中所需的最低餘弦相似度。預設值 `0.0` 只會移除相似度為負的工具。在關鍵字模式中會被忽略。 |
| `core_tools` | list of strings | `[]` | 以 `tools/list` 所顯示的 `server-tool` 形式列出的工具名稱，會在每次搜尋時優先回傳且不帶分數。 |

`core_tools` 是混合模式。列出的工具會在每次搜尋時優先回傳，其餘可存取的工具接著排名，依 `embedding_model` 決定使用語意或關鍵字。呼叫端的金鑰、團隊或伺服器權限不允許的核心工具會被省略，因此在此列出工具並不會授予其存取權。空查詢只會回傳核心工具，未設定 `core_tools` 時即為空清單。

嵌入的文字是完整的工具名稱加描述，因此文字長度超過嵌入模型輸入上限的工具（OpenAI `text-embedding-3-*` 為 8192 個 token）無法被嵌入。在包含 [PR #43554](https://github.com/BerriAI/litellm/pull/43554) 的版本（v1.107.0-dev.2 及更新版本）中，該工具會被排除在語意結果之外，目錄其餘部分仍會排名，且 proxy 會在一小時內略過對它的重新嵌入。在較早的版本中，一個過大的工具會使每次語意搜尋都以嵌入提供者的輸入過長錯誤失敗。該情況下的因應方式是在其 MCP 伺服器上以 `disallowed_tools` 隱藏該工具，或不設定 `embedding_model`。

無效的 `mcp_tool_search` 區塊（例如 `top_k: 0`）不會阻止 proxy 啟動。在區塊修正之前，每次搜尋都會以錯誤結果回傳驗證錯誤。

這些設定也可以在執行時從 Admin UI 的 MCP Servers、Tool Search 變更，或透過 `GET /get/mcp_tool_search_settings` 與 `PATCH /update/mcp_tool_search_settings` 變更（更新僅限 proxy 管理員）。以此方式儲存的值會存放在資料庫中，並在大約 10 秒內被每個 pod 採用，無需重新啟動。

## Schema 探索端點（`/mcp/proxy`） {#schema-discovery-endpoint-mcpproxy}

`/mcp/proxy` 是另一個 streamable-http MCP 端點，供應給應逐一探索工具並取得 schema、而不是載入完整目錄的用戶端。與上方的虛擬工具不同，它不依賴 `mcp_tool_search_enabled`。任何可連線到 MCP 伺服器的金鑰都能連線，且 `tools/list` 永遠只回傳三個 meta 工具：

| 工具 | 引數 | 回傳 |
|------|-----------|---------|
| `search_tools` | `query` | 最多 5 個符合的工具，格式為 `{tool_id, name, description}`，在語意模式下另有 `score`。不含輸入 schema。 |
| `get_tool_schema` | `tool_id` | 工具的 `tool_id`、`name`、`description`、`inputSchema`，以及上游伺服器有宣告時的 `outputSchema`。 |
| `call_tool` | `tool_id`、`arguments` | 上游工具結果，`arguments` 會先依工具的 `inputSchema` 驗證。 |

`search_tools` 使用與 `mcp_tool_search` 相同的排名與相同的 `litellm_settings.mcp_tool_search` 區塊，包括 `embedding_model`、`similarity_threshold` 與 `core_tools`。它永遠要求 5 個結果，因此實際上限是 5 與 `top_k` 中較小者。`tool_id` 是所屬 MCP 伺服器與工具名稱的不透明 32 字元雜湊。它對給定的伺服器與工具保持穩定，且只對可存取該工具的金鑰解析，因此未知或未授權的 ID 會回傳 `Unknown or unauthorized tool_id`。`call_tool` 會在聯繫上游伺服器之前，以 `Invalid arguments: ...` 錯誤拒絕未通過 schema 驗證的引數，接著透過與直接 `tools/call` 相同的權限檢查與 `execute_mcp_tool` 路徑分派。

此端點只提供工具。Prompts 與 resources 不會在 `initialize` 中宣告，其方法會回傳 `METHOD_NOT_FOUND` 與 `Operation unavailable on /mcp/proxy`，呼叫三個 meta 工具以外的任何工具都會回傳錯誤結果。

```python title="MCP Python SDK against /mcp/proxy" showLineNumbers
import json

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async with streamablehttp_client(
    "http://localhost:4000/mcp/proxy",
    headers={"Authorization": f"Bearer {KEY}"},
) as (read, write, _):
    async with ClientSession(read, write) as session:
        await session.initialize()
        hits = json.loads((await session.call_tool("search_tools", {"query": "add numbers"})).content[0].text)
        schema = await session.call_tool("get_tool_schema", {"tool_id": hits[0]["tool_id"]})
        result = await session.call_tool("call_tool", {"tool_id": hits[0]["tool_id"], "arguments": {"a": 3, "b": 4}})
```

## 必要條件 {#prerequisites}

工具搜尋需要 <SinceVersion v="1.92.0" />。語意排名、`similarity_threshold`、`core_tools` 與 `/mcp/proxy` 需要 <SinceVersion v="1.102.0" />。語意排名、`similarity_threshold` 與 `core_tools` 還需要在 `model_list` 中有嵌入模型。這些都不需要額外的 Python 相依性。

## 存取控制 {#access-control}

工具搜尋不會擴大存取範圍。`mcp_tool_search` 會走與一般 `tools/list` 處理器相同的已篩選目錄，因此金鑰無法存取的工具對搜尋而言是不可見的。`mcp_tool_call` 會解析呼叫者被允許的伺服器，套用基於請求 IP 的 `filter_server_ids_by_ip` 過濾，並透過 `execute_mcp_tool` 進行派送，而後者會強制執行伺服器允許清單與呼叫者的 `mcp_tool_permissions`。嘗試將 `mcp_tool_call` 路由到金鑰範圍之外的伺服器時，會由保護直接呼叫的同一個防護機制回傳 `403`：

```console
$ curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
    -H "Authorization: Bearer $KEY" \
    -d '{"name":"mcp_tool_call","arguments":{"tool_name":"secret-server-delete_all","arguments":{}}}'
{"detail":"User not allowed to call this tool. Allowed MCP servers: [math]"}
```

在任何具有 `/key/info` 的金鑰上檢查該旗標：

```bash
curl "http://localhost:4000/key/info?key=$KEY" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  | jq '.info.object_permission | {mcp_tool_search_enabled, mcp_servers}'
```

## 何時使用工具搜尋與語意篩選器 {#when-to-use-tool-search-vs-semantic-filter}

這兩項功能都用來解決大型目錄膨脹問題，但它們位於不同層級。工具搜尋是每個金鑰在 MCP 層級的選用功能；LLM 會看到四個虛擬工具，並透過 MCP 協定自行驅動探索，這適合端到端都使用 MCP 的代理程式框架。[語義篩選器](./mcp_semantic_filter.md) 位於 `/v1/responses` 與 `/v1/chat/completions` 上，並在每次請求時使用嵌入向量重寫工具清單，這適合完全不直接接觸 `/mcp/` 的 chat-completion 呼叫端。兩者可以共存；開啟工具搜尋的金鑰即使在上游啟用語義篩選，也只會暴露這四個虛擬工具。
