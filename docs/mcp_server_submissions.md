import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# MCP 伺服器提交 {#mcp-server-submissions}

LiteLLM 支援 MCP 伺服器的提交與核准工作流程。團隊成員可以提交 MCP 伺服器供管理員審查——在管理員核准或拒絕之前，該伺服器會保持在 `pending_review` 狀態。

這讓組織能夠讓團隊成員自助註冊 MCP，而不會立即將尚未核准的伺服器暴露給所有使用者。

:::info 相關文件
- [MCP 總覽](./mcp.md) - 新增與管理 MCP 伺服器
- [MCP 權限管理](./mcp_control.md) - 依金鑰、團隊或組織控制 MCP 存取
:::

## 運作方式 {#how-it-works}

```
Team member submits MCP server via API
        ↓
Server saved as "pending_review" (NOT loaded into registry)
        ↓
Admin reviews in the Submitted MCPs tab
        ↓
Approve → server goes "active" and is loaded into the registry
Reject  → server stays out with optional review notes
```

**必要條件：**
- 必須在您的 proxy 設定中設定 `store_model_in_db: true`（為了持久化 MCP 伺服器所必需）
- 提交的使用者必須使用 **team-scoped API key**（管理員金鑰會繞過此工作流程並直接使用 `POST /v1/mcp/server`）

```yaml title="config.yaml" showLineNumbers
general_settings:
  store_model_in_db: true
```

---

## 使用者：提交 MCP 伺服器 {#user-submit-an-mcp-server}

請使用 team-scoped API key。此端點會拒絕管理員金鑰——管理員應直接使用 `POST /v1/mcp/server`。

<Tabs>
<TabItem value="curl" label="curl">

```bash title="Submit MCP server for review" showLineNumbers
curl -X POST http://localhost:4000/v1/mcp/server/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEAM_API_KEY" \
  -d '{
    "server_name": "github_mcp",
    "url": "https://api.githubcopilot.com/mcp",
    "transport": "sse",
    "description": "GitHub MCP for code search and PR management"
  }'
```

</TabItem>
<TabItem value="python" label="Python">

```python title="Submit MCP server for review" showLineNumbers
import requests

response = requests.post(
    "http://localhost:4000/v1/mcp/server/register",
    headers={
        "Authorization": f"Bearer {team_api_key}",
        "Content-Type": "application/json",
    },
    json={
        "server_name": "github_mcp",
        "url": "https://api.githubcopilot.com/mcp",
        "transport": "sse",
        "description": "GitHub MCP for code search and PR management",
    },
)
print(response.json())
```

</TabItem>
</Tabs>

**回應** — 伺服器會建立為 `pending_review` 狀態：

```json
{
  "server_id": "832d6abc-7a5c-457a-a9f6-cfe4ae05f776",
  "server_name": "github_mcp",
  "url": "https://api.githubcopilot.com/mcp",
  "transport": "sse",
  "approval_status": "pending_review",
  "submitted_by": "7fd77c87-207b-4d6c-9d51-b72efb8962dc",
  "submitted_at": "2026-04-29T18:50:34Z"
}
```

:::note
該伺服器尚**無法**供 MCP 用戶端存取。只有在管理員核准後才會啟用。
:::

---

## 管理員：審查提交內容 {#admin-review-submissions}

### 透過 UI {#via-ui}

前往 **MCP Servers → Submitted MCPs** 分頁。您會看到：
- 提交統計：總提交數、待審查、已啟用、已拒絕
- 每個提交卡片包含伺服器名稱、描述、URL、傳輸方式與提交日期
- 每張卡片上的 **Approve** 與 **Reject** 按鈕

<Image
  img={require('../static/img/mcp/02_submitted_mcps_tab.png')}
  style={{width: '100%', display: 'block', margin: '1rem 0'}}
/>

**核准** 伺服器會跳出確認對話框。點選 **Approve** 即可讓它啟用，並立即載入 MCP 登錄檔。

<Image
  img={require('../static/img/mcp/04_approve_dialog.png')}
  style={{width: '100%', display: 'block', margin: '1rem 0'}}
/>

核准後，卡片徽章會變更為 **Active**，而計數器會更新：

<Image
  img={require('../static/img/mcp/05_after_approve.png')}
  style={{width: '100%', display: 'block', margin: '1rem 0'}}
/>

**拒絕** 會開啟一個對話框，並提供可選的審查備註欄位——適合用來說明為何該提交被拒絕：

<Image
  img={require('../static/img/mcp/03_reject_dialog.png')}
  style={{width: '100%', display: 'block', margin: '1rem 0'}}
/>

### 透過 API {#via-api}

需要 Admin 或 `proxy_admin_viewer` 角色。

<Tabs>
<TabItem value="list" label="List submissions">

```bash title="List all MCP submissions" showLineNumbers
curl http://localhost:4000/v1/mcp/server/submissions \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

回應：

```json
{
  "total": 1,
  "pending_review": 1,
  "active": 0,
  "rejected": 0,
  "items": [
    {
      "server_id": "832d6abc-7a5c-457a-a9f6-cfe4ae05f776",
      "server_name": "github_mcp",
      "approval_status": "pending_review",
      "submitted_by": "7fd77c87-207b-4d6c-9d51-b72efb8962dc",
      "submitted_at": "2026-04-29T18:50:34Z"
    }
  ]
}
```

</TabItem>
<TabItem value="approve" label="Approve">

```bash title="Approve a submitted MCP server" showLineNumbers
curl -X PUT http://localhost:4000/v1/mcp/server/{server_id}/approve \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

伺服器狀態會變更為 `active`，並立即載入 MCP 執行階段登錄檔。

</TabItem>
<TabItem value="reject" label="Reject">

```bash title="Reject a submitted MCP server" showLineNumbers
curl -X PUT http://localhost:4000/v1/mcp/server/{server_id}/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{"review_notes": "This URL is not on the approved vendor list."}'
```

`review_notes` 為選填。伺服器會維持不在登錄檔中。

</TabItem>
</Tabs>

---

## 核准狀態值 {#approval-status-values}

| 狀態 | 含義 |
|--------|---------|
| `pending_review` | 已提交，等待管理員審查。MCP 用戶端無法存取。 |
| `active` | 已核准。已載入 MCP 登錄檔並可供用戶端使用。 |
| `rejected` | 已被管理員拒絕。無法存取。可能包含 `review_notes`。 |

---

## 常見問題 {#faq}

**管理員可以重新核准已被拒絕的伺服器嗎？**

可以。呼叫 `PUT /v1/mcp/server/{id}/approve`——此端點接受處於 `pending_review` 和 `rejected` 狀態的伺服器。

**如果先前已啟用的伺服器被拒絕，會發生什麼事？**

它會立即從執行階段登錄檔中移除——用戶端將不再看到其工具。

**是否需要特殊的設定旗標來啟用提交？**

不需要。只要已設定 `store_model_in_db: true`，提交端點預設即可使用。不需要額外的功能旗標。
