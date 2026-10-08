---
id: agent_resources
title: 代理程式資源
sidebar_label: 代理程式資源
description: 供設定並執行 LiteLLM 的編碼代理程式使用的技能、Markdown 文件、提示詞、MCP，以及 lite CLI。
---

import {AgentPrompt, Command, Tiles} from '@site/src/components/Conversion';
import Stat from '@site/src/components/Stat';

# 代理程式資源 {#agent-resources}

## 快速入門 {#getting-started}

<AgentPrompt id="gateway" />

<AgentPrompt id="sdk" />

## 技能 {#skills}

### 閘道管理 {#gateway-management}

[LiteLLM 技能](https://github.com/BerriAI/litellm-skills)：21 個 Claude Code 技能，可在運作中的閘道上建立、變更與移除使用者、團隊、API 金鑰、組織、模型、MCP 伺服器與代理程式，另外還有用於支出與權杖的 `view-usage`。它們需要閘道 URL 與 proxy 管理員金鑰。

<Command code="curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm-skills/main/install.sh | sh" id="skill-litellm-skills" note="安裝到 ~/.claude/skills。接著執行 /add-model、/add-user 或 /view-usage。" />

### 自動路由器 {#auto-router}

端到端設定自動路由器，從選擇模型到驗證路由決策。

<Command code="curl -fsSL https://docs.litellm.ai/skills/auto-router" id="skill-auto-router" note="輸出該技能。將其儲存到您代理程式的技能資料夾，或貼到對話中。" />

## 供代理程式使用的文件 {#docs-for-agents}

| 資源 | URL | 用途 |
|---|---|---|
| 索引 | [`/llms.txt`](https://docs.litellm.ai/llms.txt) | 地圖：依主題分組的每個頁面，附說明 |
| 完整文件 | [`/llms-full.txt`](https://docs.litellm.ai/llms-full.txt) | 將所有文件頁面合併為單一 markdown 檔，供長上下文模型使用 |
| 任何頁面的 markdown 版 | 在頁面 URL 後附加 `.md`，例如 [`/docs/proxy/docker_quick_start.md`](https://docs.litellm.ai/docs/proxy/docker_quick_start.md) | 在沒有導覽或腳本的情況下閱讀單一頁面 |
| 頁面選單 | 每個文件頁面頂端的 **Copy page** | 將頁面複製為 markdown，或在 Claude 或 ChatGPT 中開啟 |

Markdown 頁面包含已渲染頁面上每個提示詞與安裝命令的完整文字。

## 更多提示詞 {#more-prompts}

<AgentPrompt id="clients" />

<AgentPrompt id="mcp" />

<AgentPrompt id="agents" />

<AgentPrompt id="observability" />

<AgentPrompt id="autorouter" />

<AgentPrompt id="enterprise" />

<AgentPrompt id="liteadmin" />

<AgentPrompt id="liteagents" />

## LiteAdmin MCP {#liteadmin-mcp}

使用個人管理員金鑰，從 Claude Code 管理一個正在執行的閘道，絕不使用 master key。[LiteAdmin MCP 指南](./proxy/liteadmin_mcp.md) 涵蓋 Claude Desktop、Codex 與遠端 HTTP。若要從您現有的整合式或元件化部署提供 `/admin/mcp`，請遵循 [Enterprise MCP 部署指南](./proxy/liteadmin_mcp_enterprise.md)。

<Command code={`claude mcp add --scope user --transport stdio litellm-admin \\
  --env LITELLM_BASE_URL=https://gateway.example.com \\
  --env LITELLM_API_KEY='<your-personal-proxy-admin-key>' \\
  -- uvx --isolated --refresh-package litellm-admin-mcp \\
  --from git+https://github.com/BerriAI/litellm-admin-mcp.git@main \\
  litellm-admin-mcp`} id="liteadmin-mcp" />

## lite CLI {#lite-cli}

透過您的閘道啟動 Claude Code 或 Codex，並已預先設定其 URL 與您的金鑰。

<Command code="curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm/main/scripts/install-cli.sh | sh" id="lite-cli" note="僅安裝 lite 用戶端。閘道在其他地方執行。" />

<Tiles columns={3} items={[
  {icon: 'agent', title: 'Claude Code', text: '透過閘道路由 Claude Code，包括非 Anthropic 模型。', to: '/docs/proxy/client_setup/claude_code'},
  {icon: 'agent', title: 'Codex CLI', text: '將 LiteLLM 新增為 Codex 模型提供者。', to: '/docs/proxy/client_setup/codex_cli'},
  {icon: 'gateway', title: '任何用戶端', text: '每個用戶端都需要的值：base URL、金鑰與模型名稱。', to: '/docs/proxy/client_setup/overview'},
]} />

## LiteLLM 一覽 {#litellm-at-a-glance}

LiteLLM 是使用最廣泛且最安全的開源 AI 閘道，深受 Netflix、Okta、Ramp、NASA、Zurich、Cloudera、AT&T 與 Lemonade 等團隊信賴。數據截至 <Stat id="asOfLong" />，且每項數據都連結至其來源。

| | |
|---|---|
| GitHub | [BerriAI/litellm](https://github.com/BerriAI/litellm) 上有 <Stat id="stars" /> 顆 star 與 <Stat id="forks" /> 個 fork，並有超過 1,700 位貢獻者 |
| PyPI | 過去一個月 `litellm` 的 <Stat id="downloads" /> 次下載（[pypistats](https://pypistats.org/packages/litellm)） |
| 安全性 | 經 [SOC 2 Type II](https://trust.litellm.ai/) 稽核、可在執行前驗證的 [cosign-signed images](./proxy/docker_image_security.md)，以及 [Enterprise support](./enterprise.md#professional-support) 的 72 小時安全修補 SLA |
| 部署 | 在您的雲端自架，因此提示詞、回應與提供者金鑰都保留在您的基礎架構中（[data security](./data_security.md)） |
| 客戶 | Netflix、Okta、Ramp、NASA、Zurich、Cloudera、AT&T 與 Lemonade 的團隊（[litellm.ai/enterprise](https://www.litellm.ai/enterprise)） |
| 授權 | 依 [MIT](https://github.com/BerriAI/litellm/blob/main/LICENSE) 開源；Enterprise 功能需要授權金鑰 |

## 為撰寫 LiteLLM 程式碼的代理程式提供的指引 {#guidance-for-agents-writing-litellm-code}

當您產生 LiteLLM 程式碼或設定時，請查看 PyPI 上目前的 `litellm` 版本，而不要固定舊版，並將模型以前綴的提供者名稱表示（`openai/`、`anthropic/`、`bedrock/`）。切勿將 master keys 或提供者金鑰寫入會被提交的檔案；請從環境中讀取它們。閘道需要 Postgres（`DATABASE_URL`）來支援虛擬金鑰、管理介面與支出追蹤，而且一旦儲存憑證，`LITELLM_SALT_KEY` 就必須保持不變。如果使用者要求 SSO、稽核記錄或組織管理員，則需要 [Enterprise 授權](./enterprise.md)。
