import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 將 MCP 伺服器存取授予金鑰與團隊 {#grant-mcp-server-access-to-keys-and-teams}

本指南說明如何將 MCP 伺服器授予虛擬金鑰與團隊，先在 Admin UI 中操作，再透過管理 API 操作，並展示當金鑰與團隊都具有授權時，最終存取如何解析。規則本身（六層交集、`no-mcp-servers`、`require_key_mcp_access_defined`、存取群組、每個實體的工具權限）載於 [MCP 權限管理](./mcp_control)；本頁則是套用這些規則的操作流程。

## 開始前 {#before-you-start}

請先註冊 MCP 伺服器，可在 `config.yaml` 下的 `mcp_servers` 中進行，或從 Admin UI 的 **MCP Servers** 進行（請參見 [MCP Gateway](./mcp#adding-your-mcp)）。以下每個授權都會依其 `server_id`（對於在 UI 中新增的伺服器，這是一個 UUID）或其 `server_name` 別名（設定鍵，例如 `deepwiki`）來指向該伺服器。API 可接受這兩種形式，並會解析為同一個伺服器。

如果有多個伺服器應該總是一起授權，請將它們放入一個 [存取群組](./mcp_control#grouping-mcps-access-groups) 並改為授權該群組。如果金鑰或團隊應只看見跨伺服器手動挑選的一部分工具，請建立一個 [工具集](./mcp_toolsets) 並授權它。

## 授權欄位 {#the-grant-fields}

MCP 存取會儲存在金鑰或團隊的 `object_permission` 區塊中。這四個欄位可同時用於兩者，且它們與 Admin UI **MCP Settings** 區段中的控制項一一對應。

| 欄位 | 類型 | 授予的內容 |
|-------|------|----------------|
| `mcp_servers` | `list[str]` | 實體可存取的伺服器 ID 或別名。哨兵值 `no-mcp-servers` 會封鎖所有 MCP 存取，請參見 [讓金鑰退出](./mcp_control#opting-a-key-out-of-all-mcp-servers-no-mcp-servers) |
| `mcp_access_groups` | `list[str]` | 存取群組名稱。群組中的每個伺服器都會被授予 |
| `mcp_toolsets` | `list[str]` | 工具集 ID。授予工具集所來源的伺服器，但僅限於其所列出的工具 |
| `mcp_tool_permissions` | `dict[str, list[str]]` | 以伺服器 ID 或別名為鍵的逐伺服器工具允許清單。省略某個伺服器即可允許其所有工具。此處列出的伺服器即使未包含於 `mcp_servers` 中，仍視為已授權 |

若金鑰或團隊未設定這些欄位，則其本身沒有 MCP 限制；執行時的意義取決於其他層級，請參見 [金鑰與團隊授權如何解析](#how-key-and-team-grants-resolve)。

## 將 MCP 伺服器授予虛擬金鑰 {#grant-an-mcp-server-to-a-virtual-key}

### Admin UI {#admin-ui}

在左側側邊欄開啟 **Virtual Keys**（`http://localhost:4000/ui/api-keys`），然後按一下 **+ Create New Key**。照常填入擁有者、金鑰名稱與模型，接著向下捲動並展開 **MCP Settings** 手風琴區塊。**Allowed MCP Servers** 選擇器會列出所有已註冊的伺服器、存取群組與工具集，另外還有一個 **No MCP Servers** 項目，可為該金鑰封鎖所有 MCP 存取。

<Image
  img={require('../img/mcp_grant_key_selector.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
  alt="Create New Key 表單上的 Allowed MCP Servers 選擇器，列出 No MCP Servers、一個存取群組、一個 MCP 伺服器與一個工具集"
/>

選取一個或多個項目。每個已選取的伺服器（包含從存取群組解析出的伺服器）都會在下方展開其工具清單，並預設勾選所有工具。取消勾選某個工具即可將其從金鑰中移除；標題會顯示仍允許的工具數量。按一下 **Create Key**，並從確認對話框中複製金鑰。

<Image
  img={require('../img/mcp_grant_key_tools.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
  alt="Create New Key 表單中的 MCP Settings，已選取 deepwiki 伺服器，且三個工具中有兩個被允許"
 />

選擇內容會儲存為 `object_permission.mcp_servers`（或 `mcp_access_groups` / `mcp_toolsets`，視您所選內容而定），工具切換狀態則儲存為 `object_permission.mcp_tool_permissions`。可使用 `GET /key/info?key=<key>` 讀回。

若要變更現有金鑰，請在 **Virtual Keys** 表格中按一下該金鑰，開啟其 **Settings** 分頁，按一下 **Edit Settings**，變更 **MCP Servers / Access Groups** 與工具切換，然後按一下 **Save Changes**。

### API {#api}

`POST /key/generate` 會直接內嵌授權。以下範例授予一個伺服器，並將金鑰限制為其中兩個工具：

```bash title="Create a key with an MCP grant" showLineNumbers
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "wiki-reader",
    "team_id": "<team-id>",
    "object_permission": {
      "mcp_servers": ["deepwiki"],
      "mcp_tool_permissions": {
        "deepwiki": ["read_wiki_structure", "read_wiki_contents"]
      }
    }
  }'
```

`POST /key/update` 會採用相同的區塊，外加要變更的 `key`。您送出的欄位會取代該欄位已儲存的值，而您省略的欄位則會保留，因此在上述金鑰中加入工具集後，`mcp_servers` 與 `mcp_tool_permissions` 會維持原狀：

```bash title="Add a toolset to an existing key" showLineNumbers
curl -X POST "http://localhost:4000/key/update" \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "sk-...",
    "object_permission": {
      "mcp_toolsets": ["<toolset-id>"]
    }
  }'
```

若要授予存取群組中的每個伺服器，請送出 `"mcp_access_groups": ["research"]` 而非 `mcp_servers`。若要封鎖所有 MCP 存取，請送出 `"mcp_servers": ["no-mcp-servers"]`。

可透過用金鑰本身列出工具來確認金鑰可見的內容：

```bash showLineNumbers
curl -s "http://localhost:4000/mcp-rest/tools/list" \
  -H "Authorization: Bearer sk-..." | jq '[.tools[] | .name]'
```

```json
["read_wiki_contents", "read_wiki_structure"]
```

## 將 MCP 伺服器授予團隊 {#grant-an-mcp-server-to-a-team}

### Admin UI {#admin-ui-1}

在左側側邊欄開啟 **Teams**（`http://localhost:4000/ui/teams`），然後按一下 **Create Team**。填入團隊名稱與模型後，展開 **MCP Settings** 手風琴區塊。**Allowed MCP Servers** 選擇器提供與金鑰表單相同的伺服器、存取群組與工具集。選取存取群組時，會顯示其所解析出的每個伺服器，並標示群組名稱，因此您仍可針對每個伺服器切換工具。按一下 **Create Team**。

<Image
  img={require('../img/mcp_grant_team_access_group.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
  alt="Create Team 表單中的 MCP Settings，已選取 research 存取群組，並透過它解析出 deepwiki 伺服器"
 />

若要變更現有團隊，請在 **Teams** 表格中按一下該團隊，開啟其 **Settings** 分頁，按一下 **Edit Settings**，變更 **MCP Servers / Access Groups** 與工具切換，然後按一下 **Save Changes**。屬於該團隊的金鑰會繼承新的授權；金鑰本身無需進行任何編輯。

### API {#api-1}

`POST /team/new` 與 `POST /team/update` 使用與金鑰端點相同的 `object_permission` 區塊，而 `team_id` 則用來在更新時識別團隊：

<Tabs>
<TabItem value="new" label="/team/new">

```bash title="Create a team with an MCP grant" showLineNumbers
curl -X POST "http://localhost:4000/team/new" \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "team_alias": "research-team",
    "object_permission": {
      "mcp_servers": ["deepwiki"],
      "mcp_access_groups": ["research"],
      "mcp_toolsets": ["<toolset-id>"],
      "mcp_tool_permissions": {
        "deepwiki": ["read_wiki_structure", "read_wiki_contents"]
      }
    }
  }'
```

</TabItem>
<TabItem value="update" label="/team/update">

```bash title="Replace the team's server list, keep everything else" showLineNumbers
curl -X POST "http://localhost:4000/team/update" \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "<team-id>",
    "object_permission": {
      "mcp_servers": ["deepwiki"]
    }
  }'
```

</TabItem>
</Tabs>

`/team/update` 的合併方式與 `/key/update` 相同：只有您送出的欄位會被取代。可透過 `GET /team/info?team_id=<team-id>` 讀回已儲存的授權；它會以 `team_info.object_permission` 返回。

## 透過 SCIM 佈建的團隊授予 MCP 存取權 {#grant-mcp-access-through-scim-provisioned-teams}

當您的身分提供者（IdP）透過 [SCIM](./tutorials/scim_litellm) 佈建 LiteLLM 時，讓 IdP 群組取得 MCP 存取權的受支援方式，是透過 SCIM 為該群組建立的 LiteLLM 團隊。SCIM 會將群組同步成團隊並保持其成員資格為最新；您只需在該團隊上授予 MCP 伺服器或存取群組一次，每位成員就能透過屬於該團隊的金鑰存取它們。

```text
IdP group -> SCIM /scim/v2/Groups -> LiteLLM team (team_id, members) -> team object_permission -> team keys
```

### 1. 將群組佈建為團隊 {#1-provision-the-group-as-a-team}

依照 [SCIM with LiteLLM](./tutorials/scim_litellm#3-test-scim-connection) 所述，將群組指派給 IdP 中的 LiteLLM 應用程式。接著 IdP 會送出如下的 SCIM 群組。LiteLLM 會建立一個團隊，其 `team_id` 為群組的 `id`（未送出 `id` 時則為 `externalId`），`team_alias` 為群組的 `displayName`，成員則為群組的 `members`。

```bash title="SCIM group the IdP sends" showLineNumbers
curl -X POST "http://localhost:4000/scim/v2/Groups" \
  -H "Authorization: Bearer <scim-token>" \
  -H "Content-Type: application/scim+json" \
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    "externalId": "6f1c2e1a-entra-research",
    "displayName": "Research Engineers",
    "members": [{"value": "alice@example.com"}]
  }'
```

這會建立 `team_id` 為 `6f1c2e1a-entra-research` 的團隊 `Research Engineers`。可在 Admin UI 的 **Teams** 中查詢，或使用 `GET /team/info?team_id=6f1c2e1a-entra-research`。

### 2. 將 MCP 存取權授予團隊 {#2-grant-mcp-access-to-the-team}

將存取群組（或個別伺服器）授予團隊的方式與其他團隊相同，請參閱 [Grant an MCP server to a team](#grant-an-mcp-server-to-a-team)。在 Admin UI 中，從 **Teams** 開啟該團隊，前往 **Settings**，點選 **Edit Settings**，在 **MCP Servers / Access Groups** 下選取存取群組，然後點選 **Save Changes**。群組中的每台伺服器都會連同其工具列出，並標示其所屬群組。

<Image
  img={require('../img/mcp_scim_team_settings.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
  alt="SCIM 佈建團隊設定中的 MCP Servers / Access Groups，已選取 research 存取群組，且 wiki 伺服器透過它解析"
/>

透過 API 時，使用 SCIM 團隊的 `team_id` 呼叫 `/team/update`：

```bash title="Grant the research access group to the SCIM team" showLineNumbers
curl -X POST "http://localhost:4000/team/update" \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "6f1c2e1a-entra-research",
    "object_permission": {
      "mcp_access_groups": ["research"]
    }
  }'
```

接著團隊的 **Overview** 分頁會在 **Object Permissions** 下顯示該授權，`GET /team/info` 也會在 `team_info.object_permission` 下回傳它。

<Image
  img={require('../img/mcp_scim_team_overview.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
  alt="SCIM 佈建的 Research Engineers 團隊總覽，research 存取群組列於 Object Permissions 的 MCP Servers 之下"
/>

後續的 SCIM 同步會保留此授權。來自 IdP 的群組 `PUT` 與 `PATCH` 請求（重新命名、成員新增或移除）只會更新團隊別名、中繼資料與成員；不會更動 `object_permission`。

### 3. 給成員一組團隊金鑰 {#3-give-members-a-team-key}

成員透過屬於團隊的金鑰存取 MCP：在 **Virtual Keys** 中建立金鑰時選取該團隊，或將 `team_id` 傳給 `/key/generate`。沒有自己 MCP 授權的團隊金鑰會繼承團隊的授權，如 [How key and team grants resolve](#how-key-and-team-grants-resolve) 所述。不屬於該團隊的個人金鑰不會取得團隊的授權，即使其擁有者是成員也一樣。

```bash title="Check what a team key can reach" showLineNumbers
curl "http://localhost:4000/mcp-rest/tools/list" \
  -H "Authorization: Bearer <team-key>"
```

回應只會列出 `research` 存取群組中伺服器的工具。呼叫授權範圍外伺服器上的工具會回傳 `403`，並顯示 `The key is not allowed to access server <server>`。

當 IdP 將使用者從群組中移除時，LiteLLM 會將他們從團隊中移除，並刪除他們在該團隊的金鑰。如果使用者被重新加入，他們需要一組新的團隊金鑰。

如果呼叫者使用 JWT 而非虛擬金鑰進行驗證，token 只有在解析到 SCIM 團隊時才能取得該團隊的 MCP 授權，例如在其 `team_id` 被列在設定為 `team_ids_jwt_field` 的 claim 中，請參閱 [Control model access with Teams](./proxy/access_management/jwt_permissions#control-model-access-with-teams)。

### 不支援直接 claim 對應 {#direct-claim-mapping-is-not-supported}

LiteLLM 不會將 IdP claim 直接對應到 MCP 存取群組，這是刻意的設計。SCIM 的 `groups[].value`、`roles` 或 `entitlements` 值，或是 JWT claim，即使命名了一個 MCP 存取群組，本身也不會授予任何權限：SCIM `groups[].value` 項目會被讀作 LiteLLM `team_id`，`roles` 與 `entitlements` 只會儲存為中繼資料，而且沒有任何 `litellm_jwtauth` 設定會從 token 讀取 MCP 存取群組。讓 IdP 負責誰屬於哪個群組，LiteLLM 團隊的 `object_permission` 負責該群組可以存取什麼，使每個 MCP 授權都有一條可在團隊上檢視的單一可稽核路徑。

## 金鑰與團隊授權如何解析 {#how-key-and-team-grants-resolve}

完整規則集載於 [權限階層](./mcp_control#permission-hierarchy) 與 [每個實體的工具層級權限](./mcp_control#per-entity-tool-level-permissions)。以下案例是在只有金鑰與其團隊具有授權時會遇到的情況，順序依 LiteLLM 套用規則的先後而定。

沒有自己的 MCP 授權的金鑰會繼承團隊的授權。團隊允許的每個伺服器與每個工具都可供該金鑰使用，除此之外沒有其他內容。若在 `general_settings` 中使用 `require_key_mcp_access_defined: true`，相同的金鑰在明確被授予某些 MCP 之前，將完全沒有任何 MCP 伺服器；請參見 [要求金鑰自行定義 MCP 存取](./mcp_control#require-keys-to-define-their-own-mcp-access)。

當金鑰與團隊都列出伺服器時，金鑰可存取其交集。工具權限也會依伺服器進行交集：團隊在 `deepwiki` 上允許兩個工具，而金鑰允許其中一個時，結果只會剩下那一個工具。若只有一方為某伺服器設定 `mcp_tool_permissions`，則該方的清單會原樣套用。

在單一層級內，工具集與直接的 `mcp_tool_permissions` 項目會先聯集，再與其他層級取交集。若某金鑰被授予工具集 `wiki_readonly`（兩個讀取工具）以及 `mcp_tool_permissions: {"deepwiki": ["read_wiki_structure"]}`，它會同時看到兩個讀取工具，而不只是直接命名的那一個。

金鑰上的 `no-mcp-servers` 會覆蓋任何團隊授權。`tools/list` 會回傳空清單，而 `tools/call` 也會遭拒絕，即使團隊允許該伺服器亦然。

團隊中的金鑰只能被授予團隊已允許的伺服器（或標記為 `allow_all_keys` 的伺服器）。`/key/generate` 與 `/key/update` 會在寫入時強制執行此規則（Admin UI 也是透過相同的端點儲存），並回應 `403`：

```text
Key requests MCP servers not allowed by team '<team-id>': ['<server-id>']. Team allows: ['<server-id>']. Global (allow_all_keys) servers: [].
```

不屬於任何團隊的金鑰可由 proxy 管理員授予任何 server；非管理員呼叫者只能將 `allow_all_keys` servers 授予這類金鑰。金鑰已持有的 servers 會在 `/key/update` 中被視為既有權限，因此縮減團隊清單不會破壞既有金鑰，直到您嘗試新增新的 server 為止。

組織、內部使用者、終端使用者與 agent 的授權位於 key 與 team 之上，且只會進一步縮小結果。縮小會在 `tools/list` 時發生一次，並在 `tools/call` 時再次發生，因此超出有效集合的工具既不會被公布，也無法被呼叫。

### 範例演練 {#worked-example}

Team `research-team` 允許 `deepwiki` 搭配 `mcp_tool_permissions: {"deepwiki": ["read_wiki_structure", "read_wiki_contents"]}`，以及 toolset `wiki_readonly`（同樣的兩個工具）。

| Key 授權 | `deepwiki` 上的有效工具 |
|-----------|-------------------------------|
| 無 | `read_wiki_structure`、`read_wiki_contents`（從 team 繼承） |
| `mcp_servers: ["deepwiki"]`、`mcp_tool_permissions: {"deepwiki": ["read_wiki_structure"]}` | `read_wiki_structure`（交集） |
| 上一列再加上 `mcp_toolsets: ["wiki_readonly"]` | `read_wiki_structure`、`read_wiki_contents`（key 層級聯集，然後與 team 取交集） |
| `mcp_servers: ["no-mcp-servers"]` | 無，`tools/list` 為空 |
| `mcp_servers: ["deepwiki_backup"]`（team 不允許） | 寫入被拒絕，錯誤為 `403` |

## 相關 {#related}

[MCP 權限管理](./mcp_control) 可查看規則與其餘層級（組織、內部使用者、終端使用者、agent），[MCP Toolsets](./mcp_toolsets) 可建立 toolsets，[Agent 權限管理](./a2a_agent_permissions) 可查看 agent 授權，以及 [MCP Gateway](./mcp) 可查看註冊 servers。
