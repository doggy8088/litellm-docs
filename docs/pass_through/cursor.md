import Image from '@theme/IdealImage';

# Cursor Cloud Agents {#cursor-cloud-agents}

適用於 [Cursor Cloud Agents API](https://docs.cursor.com/account/api) 的直通端點 — 以原生格式啟動並管理在您的儲存庫上運作的雲端代理程式（不轉譯）。

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 以 $0.00 記錄（以訂閱為基礎，無每次請求定價） |
| 記錄 | ✅ | 所有請求皆會記錄操作分類 |
| 終端使用者追蹤 | ❌ | [如果您需要這項功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | Cursor API 不使用串流 |

只要將 `https://api.cursor.com` 替換為 `LITELLM_PROXY_BASE_URL/cursor` 🚀

**支援的端點：**

| 端點 | 方法 | 說明 |
|----------|-------------|-------------|
| `/v0/agents` | GET | 列出代理程式 |
| `/v0/agents` | POST | 啟動代理程式 |
| `/v0/agents/{id}` | GET | 代理程式狀態 |
| `/v0/agents/{id}` | DELETE | 刪除代理程式 |
| `/v0/agents/{id}/conversation` | GET | 代理程式對話 |
| `/v0/agents/{id}/followup` | POST | 新增後續訊息 |
| `/v0/agents/{id}/stop` | POST | 停止代理程式 |
| `/v0/me` | GET | API 金鑰資訊 |
| `/v0/models` | GET | 列出模型 |
| `/v0/repositories` | GET | 列出 GitHub 儲存庫 |

## 快速開始 {#quick-start}

### 1. 在 UI 上新增 Cursor API 金鑰 {#1-add-cursor-api-key-on-the-ui}

前往 **Models + Endpoints → LLM Credentials**，然後點選 **Add Credential**。從提供者下拉選單中選取 **Cursor** — 您會看到 Cursor 標誌。輸入您在 [cursor.com/settings](https://cursor.com/settings) 的 API 金鑰。

<Image img={require('../../img/cursor_add_credential.png')} alt="新增帶有標誌的 Cursor 認證" style={{maxWidth: '800px'}} />

### 2. 啟動 Cursor Agent {#2-launch-a-cursor-agent}

```bash
curl -X POST http://0.0.0.0:4000/cursor/v0/agents \
  -H "Authorization: Bearer <your-litellm-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "text": "Add a README.md with installation instructions"
    },
    "source": {
      "repository": "https://github.com/your-org/your-repo",
      "ref": "main"
    },
    "target": {
      "autoCreatePr": true
    }
  }'
```

**預期回應：**

```json
{
  "id": "bc_abc123",
  "name": "Add README Documentation",
  "status": "CREATING",
  "source": {
    "repository": "https://github.com/your-org/your-repo",
    "ref": "main"
  },
  "target": {
    "branchName": "cursor/add-readme-1234",
    "url": "https://cursor.com/agents?id=bc_abc123",
    "autoCreatePr": true
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 3. 檢視記錄 {#3-view-logs}

前往側邊欄中的 **Logs**。以「cursor」篩選即可查看您的代理程式請求。每個請求都會顯示操作類型（例如，`cursor/cursor:agent:create`）、狀態、持續時間與成本。

<Image img={require('../../img/cursor_logs.png')} alt="Logs 頁面中的 Cursor 請求" style={{maxWidth: '800px'}} />

點選任何記錄項目即可查看完整的請求詳細資料，包括提供者、API base 與中繼資料。

<Image img={require('../../img/cursor_log_detail.png')} alt="Cursor 記錄項目詳細資料" style={{maxWidth: '800px'}} />

## 範例 {#examples}

`http://0.0.0.0:4000/cursor` 之後的任何內容都會被視為提供者特定路由，並據此處理。

| **原始端點** | **替換為** |
|---|---|
| `https://api.cursor.com` | `http://0.0.0.0:4000/cursor` (LITELLM_PROXY_BASE_URL) |
| `-u YOUR_API_KEY:` (Basic Auth) | `-H "Authorization: Bearer <your-litellm-key>"` (LiteLLM Virtual Key) |

### 列出可用模型 {#list-available-models}

```bash
curl http://0.0.0.0:4000/cursor/v0/models \
  -H "Authorization: Bearer <your-litellm-key>"
```

### 檢查代理程式狀態 {#check-agent-status}

```bash
curl http://0.0.0.0:4000/cursor/v0/agents/bc_abc123 \
  -H "Authorization: Bearer <your-litellm-key>"
```

### 列出所有代理程式 {#list-all-agents}

```bash
curl http://0.0.0.0:4000/cursor/v0/agents \
  -H "Authorization: Bearer <your-litellm-key>"
```

### 為代理程式新增後續訊息 {#add-follow-up-to-agent}

```bash
curl -X POST http://0.0.0.0:4000/cursor/v0/agents/bc_abc123/followup \
  -H "Authorization: Bearer <your-litellm-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "text": "Also add a section about troubleshooting"
    }
  }'
```

### 停止代理程式 {#stop-an-agent}

```bash
curl -X POST http://0.0.0.0:4000/cursor/v0/agents/bc_abc123/stop \
  -H "Authorization: Bearer <your-litellm-key>"
```

### 刪除代理程式 {#delete-an-agent}

```bash
curl -X DELETE http://0.0.0.0:4000/cursor/v0/agents/bc_abc123 \
  -H "Authorization: Bearer <your-litellm-key>"
```

### 取得 API 金鑰資訊 {#get-api-key-info}

```bash
curl http://0.0.0.0:4000/cursor/v0/me \
  -H "Authorization: Bearer <your-litellm-key>"
```

## 相關 {#related}

- [Cursor Cloud Agents API 文件](https://docs.cursor.com/account/api)
- [直通端點概覽](./intro.md)
- [Virtual Keys](../proxy/virtual_keys.md)
