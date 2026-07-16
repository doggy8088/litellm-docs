---
slug: mcp-stdio-command-injection-april-2026
title: "安全更新：CVE-2026-30623 — 透過 Anthropic 的 MCP SDK 進行命令注入"
date: 2026-04-21T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "CVE-2026-30623（透過 MCP stdio 傳輸進行的已驗證 RCE）已修復。請升級至 v1.83.6-nightly 或 v1.83.7-stable 或更新版本。"
tags: [security]
hide_table_of_contents: false
---

2026 年 4 月 15 日，[OX Security](https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/) 發布了一則公告，說明 **Anthropic 的 MCP SDK 的 stdio 傳輸中的命令注入**（`StdioServerParameters` 會執行它拿到的任何 `command`）。LiteLLM 自 `v1.83.6-nightly` 起已修復此問題。

此修補已在 [commit `7b7f304`](https://github.com/BerriAI/litellm/commit/7b7f304675)（PR [#25343](https://github.com/BerriAI/litellm/pull/25343)）中完成，且自 `v1.83.6-nightly` 起的每個版本都已包含。`v1.83.7-stable` 也包含此修補。

## 重點摘要； {#tldr}

- **未經驗證的使用者無法利用此問題。** 受影響的端點（MCP server 建立與 `/mcp-rest/test/*` 預覽端點）都位於 LiteLLM 的驗證之後。攻擊者必須先具備有效的 LiteLLM API 金鑰——而且在套用修補後，還需要 `PROXY_ADMIN` 角色——才能 पहुँच पहुँच到這段程式路徑。
- **此修補自 `v1.83.6-nightly` 起已上線。** 含有修補的第一個 stable 版本是 **`v1.83.7-stable`**。完整的已修補版本清單請見[下方](#versions-with-the-fix)。
- **如果您發現其他漏洞，請告訴我們。** 我們有[漏洞賞金計畫](https://github.com/BerriAI/litellm/security)，並會針對 P0（供應鏈）與 P1（未驗證的 proxy 存取）問題發放獎金。請參閱我們[先前的安全更新](https://docs.litellm.ai/blog/security-hardening-april-2026#bug-bounty-program)以查看目前的獎金表。

{/* truncate */}

## 問題是什麼 {#what-was-the-issue}

根據 OX Security 的公告：

> LiteLLM 在其 MCP server 建立功能中存在已驗證的遠端命令執行漏洞。此應用程式允許使用者透過 JSON 設定新增 MCP server，該設定可指定任意 command 與 args 值。LiteLLM 會在未經驗證的情況下於主機上執行這些值，使攻擊者能夠執行任意作業系統命令。

具體來說：在使用 `transport: stdio` 新增 MCP server 時，`command` 欄位會直接傳遞給 `StdioServerParameters`，並以 proxy 主機上的子程序執行。具備建立 MCP server 權限的已驗證使用者，可以以 LiteLLM 程序的身分執行任意命令。

- **CVE：** [CVE-2026-30623](https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/)
- **嚴重性：** Critical
- **需要驗證：** 是（已驗證 RCE，而非未驗證）
- **受影響範圍：**
  - MCP server 建立／更新（`NewMCPServerRequest`、`UpdateMCPServerRequest`）
  - `/mcp-rest/test/connection` 與 `/mcp-rest/test/tools/list` 預覽端點
  - 執行時從設定或資料庫重新載入的伺服器

## 修補做了什麼 {#what-the-fix-does}

Commit [`7b7f304`](https://github.com/BerriAI/litellm/commit/7b7f304675) 帶來四項變更：

1. **stdio 傳輸的命令允許清單。** 新增常數 `MCP_STDIO_ALLOWED_COMMANDS`，將 stdio `command` 值限制為少數已知的 MCP 啟動器：

    ```python
    MCP_STDIO_ALLOWED_COMMANDS = frozenset(
        {"npx", "uvx", "python", "python3", "node", "docker", "deno"}
    )
    ```

    若您需要允許其他二進位檔，可在部署時透過 `LITELLM_MCP_STDIO_EXTRA_COMMANDS` 環境變數（以逗號分隔）擴充此清單。

2. **Pydantic 層級驗證。** 現在 `NewMCPServerRequest` 與 `UpdateMCPServerRequest` 都會拒絕其 `command` basename 不在允許清單中的設定——因此不良輸入甚至不會通過請求解析。

3. **執行時的深層防禦。** `_create_mcp_client` 在建立 stdio client 時會重新驗證命令，因此任何由舊版資料庫列或設定檔（早於允許清單）重建的 `MCPServer`，在啟動時也會被阻擋。

4. **封鎖預覽端點。** `/mcp-rest/test/connection` 與 `/mcp-rest/test/tools/list` 現在需要 `PROXY_ADMIN` 角色。這些「先試再新增」端點是最容易在不持久化任何內容的情況下觸發命令執行的方法。

## 含有修補的版本 {#versions-with-the-fix}

此修補存在於自 `v1.83.6-nightly` 起標記的每個 LiteLLM 版本中。發表時已確認的標記如下：

| Version | 類型 |
|---------|------|
| `v1.83.6-nightly` | 含有修補的第一個版本 |
| `v1.83.7.rc.1` | Release candidate |
| `v1.83.7-stable` | Stable |
| `v1.83.8-nightly` | Nightly |
| `v1.83.9-nightly` | Nightly |
| `v1.83.10-nightly` | Nightly |

任何比這些版本更新的 LiteLLM 版本也都包含此修補。

## 您應該怎麼做 {#what-you-should-do}

- **升級。** 請升級至 `v1.83.7-stable` 或更新版本。如果您追蹤 nightly，任何 `>= v1.83.6-nightly` 的版本都已修補。
- **稽核現有的 MCP server。** 如果您在升級前已設定 stdio MCP server，任何其 `command` basename 不在允許清單中的資料列現在都會無法啟動。請更新設定以使用允許的啟動器（例如 `npx`、`uvx`、`python`），或將該二進位檔加入 `LITELLM_MCP_STDIO_EXTRA_COMMANDS`。
- **檢視誰擁有 `PROXY_ADMIN`。** 現在 stdio 測試端點僅限管理員使用。如果您先前曾將 MCP 測試授權給非管理員使用者，他們現在會收到 403。

## 感謝 {#credit}

感謝 OX Security 研究團隊——**Moshe Siman Tov Bustan**、**Mustafa Naamnih** 與 **Nir Zadok**——揭露此問題。他們完整的跨生態系統說明可見於[這裡](https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/)。

如果您在 LiteLLM 中發現安全問題，請透過我們的[漏洞賞金計畫](https://github.com/BerriAI/litellm/security)回報。
