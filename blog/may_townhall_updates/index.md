---
slug: may-townhall-updates
title: "5 月 Townhall 更新：安全強化、版本發布編號，以及 Agent 平台"
date: 2026-05-26T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "5 月 LiteLLM town hall 回顧，涵蓋 89 項安全修補、新的版本發布編號、MCP 工具集、效能提升，以及 LiteLLM Agent Platform。"
tags: [townhall, security, performance, product, agents]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

感謝所有參加我們 5 月 town hall 的人。

我們涵蓋了安全強化、版本發布編號變更、新產品發布（MCP 工具集、on-behalf-of OAuth）、效能提升，以及我們迄今最大的一個押注——LiteLLM Agent Platform。

{/* truncate */}

## 安全更新 {#security-updates}

### v1.84.1 推出安全強化 {#v1841-ships-the-security-hardening}

過去 4 週的所有安全修補都已整合進 [v1.84.1](/release_notes/v1.84.1/v1-84-1) —— 這是在 v1.84.0 上的修補版本。您可以的話請盡快升級。

```
pip install --upgrade litellm
```

- 與 v1.83.x 設定向後相容。
- 新的版本發布編號方案（見下文）。

### 懸賞計畫——現已上線 {#bug-bounty--now-live}

我們現在會為安全回報支付獎金。

- **範圍**——LiteLLM 閘道和 SDK。
- **提交方式**：透過 [GitHub 上的私人漏洞回報](https://github.com/BerriAI/litellm/security)。
- **由**維護者與 Veria Labs 安全團隊進行分級處理。

### 每個 PR 的自動化安全審查 {#automated-security-review-on-every-pr}

現在每個 PR 都會透過 Veria AI + zizmor + semgrep 進行自動化安全檢查。請留意 **Veria 掃描** —— 這是必須通過的檢查。誤判會被標記，但不會阻擋合併。

### 過去 4 週：數字一覽 {#last-4-weeks-by-the-numbers}

| 指標 | 數量 |
|--------|-------|
| 已修補的漏洞 | **89** |
| 由 Veria 掃描器回報 | 78 |
| 已修復的 GHSA | 58 |
| 已關閉的 GHSA | 96 |

所有修補都會隨 [v1.84.1](/release_notes/v1.84.1/v1-84-1) 發布。

### 安全性的下一步 {#whats-next-for-security}

- 改進 GHSA 分級處理與驗證流程。
- 進一步改善 CI pipeline。
- 將 zizmor 加入姊妹專案（project-releaser）。
- 定義先前版本的支援期限。

## 穩定性更新 {#stability-updates}

### 版本發布編號——問題所在 {#release-versioning--the-problem}

版本字尾太多：`-nightly`、`-dev`、`-stable`、`-stable-patch`。每週穩定版升版沒有留下 hotfix 的空間，而在搜尋中篩選 `-stable` 的使用者仍然得翻找大量版本。

### 自 v1.84.0 起的新版本編號 {#new-versioning-from-v1840}

現在 PyPI 與 Docker 的版本發布編號已一致。

- **不再使用 `-stable`** —— 穩定版遵循 PEP-440 / SemVer 2.0。現在會顯示為 `v1.84.0`。
- **每週進行 minor 升版** —— 每個排定的穩定版都會增加 MINOR 版本，而不是 PATCH。
- **hotfix 使用 patch** —— 當 `v1.84.0` 需要修補時，會變成 `v1.84.1`。

### 穩定性的下一步 {#whats-next-for-stability}

- EKS 多 Pod 內部部署。
- 捕捉部署回歸與 Claude Code 變更。
- 更高的程式碼涵蓋率 —— 針對 5 個熱點回歸檔案達到 70%。
- 目標：每個穩定版的回歸降到最少。

## 產品更新 {#product-updates}

### 我們發布了什麼 {#what-we-launched}

**路由與記憶體**
- Adaptive Routing
- Memory Management（beta）
- Prompt Compression

**MCP**
- MCP Toolsets
- On-behalf-of MCP OAuth

**品質與安全**
- LLM-as-a-judge guardrails
- Skills Marketplace

### MCP 工具集 {#mcp-toolsets}

MCP Toolsets 可讓您將多個 MCP 伺服器上的工具合併成單一扁平清單。代理程式看到的是一份工具清單，而不是在多個伺服器之間切換。

工具是以名稱範圍區隔，因此跨伺服器的衝突是安全的。

**範例：** 一個 "deploy-flow" 工具集可能會結合來自 GitHub MCP 的 `create_issue`、來自 Slack MCP 的 `post_message`，以及來自 Jira MCP 的 `create_ticket` —— 全部都會以單一工具清單的形式呈現給代理程式。

<Image
  img={require('../../img/may_townhall_mcp_toolsets.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

### MCP 代替授權 OAuth {#mcp-on-behalf-of-oauth}

OAuth 權杖會儲存在 proxy 中——絕不會回傳給用戶端。

- 用戶端送出請求時不帶權杖。
- LiteLLM 在呼叫下游 MCP 伺服器時加入權杖。
- 更新會透明進行。用戶端永遠看不到 401。

<Image
  img={require('../../img/may_townhall_mcp_obo_oauth.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

### 產品的下一步 {#whats-next-for-product}

- MCP — 儲存靜態使用者憑證。
- Claude Code — 自動更新標頭相容性圖表。
- 跨模型與提供者的 reasoning level 支援。
- Claude Code 中完整支援 Bedrock Converse。

## 效能提升 {#performance-wins}

### RPS + TPM 提升 20% {#20-rps--tpm-improvement}

Streaming `/chat/completions` 現在每秒可處理多 20% 的請求數與每分鐘 token 數。

### 已推出的最佳化 {#shipped-optimizations}

<Image
  img={require('../../img/may_townhall_perf_numbers.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

### 效能的下一步 {#whats-next-for-performance}

- Rust 移轉進行中 —— 在 10k concurrency 下可穩定達到 1K+ RPS。
- 專注於在高負載下降低閘道額外負擔。
- 追蹤項目：TTFT、TPM（串流）；RPS、E2E 的 overhead %（非串流）。

## 產品藍圖：LiteLLM Agent Platform {#product-roadmap-the-litellm-agent-platform}

### 我們的押注 {#our-bet}

我們相信未來 3 年內，80% 的 AI 工作負載都會是 agent。

我們看到的訊號：
- OpenClaw 使用量暴增
- 企業需求從聊天轉向 agent
- Claude Code 採用率持續上升

### LiteLLM Agent Platform——執行您真正能治理的 agent {#litellm-agent-platform--run-agents-you-can-actually-govern}

四大支柱。一個控制平面。

<Image
  img={require('../../img/may_townhall_agent_platform.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

- Agent Templates —— 常見任務的預先建置設定。
- Skills —— 在不同 agent 之間上傳並重複使用 skills。
- Projects —— repos + 環境變數，打包後可重複使用。

## 接下來 {#whats-next}

再次感謝所有提問與回饋。隨著這些努力陸續推出，我們會持續分享具體的進展更新。

## 招募 {#hiring}

我們目前正在積極招募多個職位——如果您有興趣，請在[這裡](https://jobs.ashbyhq.com/litellm)申請！
