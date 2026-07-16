# LiteLLM 技能 {#litellm-skills}

[litellm-skills](https://github.com/BerriAI/litellm-skills) 是一組用於管理即時 LiteLLM proxy 的 [Agent Skills](https://agentskills.io)。只要安裝一次，任何支援 Agent Skills 標準的代理程式（Claude Code、OpenCode、OpenClaw 等）都能透過對您的 proxy 執行 `curl` 指令來建立使用者、團隊、金鑰、模型、MCP 伺服器、代理程式，以及查詢用量。

## 安裝 {#install}

```bash
curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm-skills/main/install.sh | sh
```

## 需求 {#requirements}

- 已安裝 `curl`
- 執行中的 LiteLLM proxy（本機或遠端）
- proxy 管理員金鑰 — 不是範圍限定為 `llm_api_routes` 的虛擬金鑰

## 可用的技能 {#available-skills}

### 使用者 {#users}

| 技能 | 功能 |
|-------|-------------|
| `/add-user` | 建立使用者 — email、角色、預算、模型存取權 |
| `/update-user` | 更新現有使用者的預算、角色或模型 |
| `/delete-user` | 刪除一個或多個使用者 |

### 團隊 {#teams}

| 技能 | 功能 |
|-------|-------------|
| `/add-team` | 建立具有預算與模型限制的團隊 |
| `/update-team` | 更新預算、模型或速率限制 |
| `/delete-team` | 刪除一個或多個團隊 |

### API 金鑰 {#api-keys}

| 技能 | 功能 |
|-------|-------------|
| `/add-key` | 產生範圍限定於使用者、團隊、預算與到期時間的金鑰 |
| `/update-key` | 更新預算、模型或到期時間 |
| `/delete-key` | 依金鑰值或別名刪除 |

### 組織 {#organizations}

| 技能 | 功能 |
|-------|-------------|
| `/add-org` | 建立具有預算與模型存取權的組織 |
| `/delete-org` | 刪除一個或多個組織 |

### 模型 {#models}

| 技能 | 功能 |
|-------|-------------|
| `/add-model` | 新增任何提供者（OpenAI、Azure、Anthropic、Bedrock、Ollama…）並加以測試 |
| `/update-model` | 輪替憑證或切換底層部署 |
| `/delete-model` | 移除模型 |

### MCP 伺服器 {#mcp-servers}

| 技能 | 功能 |
|-------|-------------|
| `/add-mcp` | 註冊 MCP 伺服器（SSE、HTTP 或 stdio） |
| `/update-mcp` | 更新 URL、憑證或允許的工具 |
| `/delete-mcp` | 移除 MCP 伺服器 |

### 代理程式 {#agents}

| 技能 | 功能 |
|-------|-------------|
| `/add-agent` | 建立由模型與可選 MCP 伺服器支援的代理程式 |
| `/update-agent` | 切換模型或更新說明與限制 |
| `/delete-agent` | 移除代理程式 |

### 用量 {#usage}

| 技能 | 功能 |
|-------|-------------|
| `/view-usage` | 每日支出與 token 活動 — 依使用者、團隊、組織或模型 |

## 運作方式 {#how-it-works}

當您呼叫某個技能時，代理程式會要求您的 `LITELLM_BASE_URL` 和管理員金鑰，收集該操作所需的欄位，執行 `curl`，並顯示結果。範例：

```
/add-model
```
→ 代理程式詢問：提供者、公開名稱、憑證。新增模型、執行測試完成、回報通過/失敗。

```
/view-usage
```
→ 代理程式詢問：日期範圍（預設為當月）、可選的團隊/模型篩選條件。列印每日請求、token 與支出的表格。

## 相關內容 {#related}

- [litellm-skills on GitHub](https://github.com/BerriAI/litellm-skills)
- [虛擬金鑰](../proxy/virtual_keys.md) — 在 proxy 上管理 API 金鑰
- [以團隊為基礎的路由](../proxy/team_based_routing.md) — 設定團隊
- [模型管理](../proxy/model_management.md) — 透過設定檔或 API 新增模型
