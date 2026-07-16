import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MCP 工具搜尋 {#mcp-tool-search}

將完整的 MCP 目錄替換為一對固定的虛擬工具（`mcp_tool_search`、`mcp_tool_call`），如此一來，即使某個金鑰可用的工具多達數百個，也只會在 `tools/list` 上暴露兩個。LLM 會以關鍵字進行搜尋，取得排序後的相符項目，然後以名稱呼叫找到的工具。

:::info 相關文件
- [MCP 總覽](./mcp.md)
- [MCP 權限管理](./mcp_control.md) 適用於底層的 `object_permission` 模型
- [MCP 語意篩選器](./mcp_semantic_filter.md) 適用於在 `/v1/responses` 層套用的 embeddings-based 替代方案
:::

## 快速開始 {#quick-start}

在 `object_permission` 下使用 `mcp_tool_search_enabled: true` 產生一組金鑰，將其與 `mcp_servers`（或 `mcp_access_groups`）配對，讓搜尋有內容可查，接著探索並呼叫。

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
["mcp_tool_search", "mcp_tool_call"]
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
        # ['mcp_tool_search', 'mcp_tool_call']

        found = await session.call_tool("mcp_tool_search", {"query": "add numbers"})
        print(found.content[0].text)

        result = await session.call_tool(
            "mcp_tool_call",
            {"tool_name": "math-add", "arguments": {"a": 3, "b": 4}},
        )
        print(result.content[0].text)  # "7"
```

未加上該旗標的金鑰會維持既有行為不變：`tools/list` 會回傳完整目錄，而這兩個虛擬工具名稱會因 `forbidden` 錯誤而遭拒。

## 將其設為每個新金鑰的預設值 {#enable-as-a-default-for-every-new-key}

如果您希望每個新金鑰都預設啟用工具搜尋，而不必讓每個呼叫端都記得加上旗標，請將其放在 `config.yaml` 中的 `litellm_settings.default_key_generate_params.object_permission` 下。任何省略該欄位的 `/key/generate` 請求都會合併預設值；若請求設定了部分 `object_permission`（例如只設定 `mcp_servers`），則會保留其明確指定的欄位，並只補上未設定的欄位。

```yaml title="config.yaml" showLineNumbers
litellm_settings:
  default_key_generate_params:
    object_permission:
      mcp_tool_search_enabled: true
      mcp_servers: ["github", "slack"]
```

預設值會在呼叫端範圍驗證完成**之後**才合併，因此不會把一般的非管理員個人金鑰請求變成 403。像 `mcp_servers` 這類以團隊為範圍的欄位，當呼叫端明確設定時，仍會以呼叫端自己的團隊進行檢查；管理員設定的預設值只會套用到已儲存的金鑰，而不會套用到正在驗證的請求。

## 運作方式 {#how-it-works}

當在金鑰的 `object_permission` 上設定 `mcp_tool_search_enabled: true` 時，不論該金鑰可存取多少個 MCP 伺服器，streamable-http 端點（`/mcp/`）與 REST 介面（`/mcp-rest/tools/list`）都只會回傳 בדיוק兩個工具：

- `mcp_tool_search(query, top_k=5)` 會回傳與查詢相符的真實工具排序清單。
- `mcp_tool_call(tool_name, arguments)` 會執行 LLM 透過搜尋發現的其中一個工具。

兩個處理常式都會經過與一般 `/tools/call` 路由相同的已篩選目錄與分派路徑，因此搜尋只會顯示金鑰本來就有權看到的工具，而呼叫仍會透過 `_get_allowed_mcp_servers` 和 `execute_mcp_tool` 進行解析。

### 搜尋演算法 {#search-algorithm}

排序是根據工具的 `name` 與 `description` 欄位進行 token 重疊計數；不使用 embeddings，也沒有額外相依性。對於每個請求，proxy 會：

1. 將查詢轉為小寫，並以空白切分成 tokens（`"add numbers"` 會變成 `["add", "numbers"]`）。
2. 對呼叫端可存取的每個工具，建立一個由 `lower(name + " " + description)` 組成的 haystack。
3. 依查詢 tokens 在 haystack 中以子字串形式出現的數量為每個工具評分。若某工具同時包含 `add` 與 `numbers`，則分數為 2；若某工具只包含 `add`，則分數為 1。
4. 移除分數為 0 的項目，依分數由高到低排序，並回傳前 `top_k` 個（預設 5）。

除了「分數 > 0」之外沒有其他相似度門檻，因此即使查詢只命中一個 token，也仍會回傳相符結果。分數相同的工具之間，順序遵循 Python 對底層目錄的穩定排序。空查詢會回傳空清單。`mcp_tool_search` 上的 `top_k` 參數是逐次請求設定的，因此當第一輪結果集太窄時，LLM 可以自行擴大窗口。

## 必要條件 {#prerequisites}

需要 LiteLLM v1.92.x 或更新版本。

## 存取控制 {#access-control}

工具搜尋不會擴大存取範圍。`mcp_tool_search` 會走與一般 `tools/list` 處理常式相同的已篩選目錄，因此金鑰無法到達的工具對搜尋而言是不可見的。`mcp_tool_call` 會解析呼叫端被允許的伺服器，套用以請求 IP 為基礎的 `filter_server_ids_by_ip` 檢查，並透過 `execute_mcp_tool` 分派，該機制會強制執行伺服器允許清單與每個金鑰的 `mcp_tool_permissions`。嘗試將 `mcp_tool_call` 路由到超出金鑰範圍的伺服器，會從保護直接呼叫的同一個防護機制返回 `403`：

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

這兩個功能都用來解決大型目錄爆量問題，但它們位於不同層級。工具搜尋是 MCP 層級、以每個金鑰為單位的選用功能；LLM 會看到兩個工具，並透過 MCP 協定自行驅動探索，適合端到端說 MCP 的代理程式框架。[語意篩選器](./mcp_semantic_filter.md) 位於 `/v1/responses` 與 `/v1/chat/completions`，並在每次請求時使用 embeddings 重寫工具清單，適合從不直接碰觸 `/mcp/` 的 chat-completion 呼叫端。兩者可以並存；啟用工具搜尋的金鑰即使上游啟用了語意篩選，也只會暴露這兩個虛擬工具。
