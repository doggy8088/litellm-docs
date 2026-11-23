---
title: "Lens MCP 伺服器"
description: "將程式碼代理程式連接至唯讀的 Lens MCP 端點，以列出 trace、開啟附有步驟與費用的執行，並讀取其回合。"
slug: "/proxy/lens/mcp"
---

# Lens MCP 伺服器 {#lens-mcp-server}

{/* keep-version-note: The MCP endpoint ships with the Lens server, independent of a LiteLLM release. */}

Lens 在 `/lens/mcp` 提供一個唯讀的 [MCP](https://modelcontextprotocol.io) 端點，讓程式碼代理程式可以查詢自己的執行：列出 trace、開啟附有步驟與費用的執行，並讀取其回合。它是 Lens 伺服器的一部分，因此不需要安裝任何東西，而且永遠與您的 Lens 版本一致。

## 將它加入 Claude Code {#add-it-to-claude-code}

若使用獨立 Lens，請使用 Lens 位址與 `LENS_ADMIN_TOKEN`：

```bash
claude mcp add --transport http lens http://localhost:4318/lens/mcp \
  --header "Authorization: Bearer <LENS_ADMIN_TOKEN>"
```

若 Lens 已連接至 LiteLLM，請改用您的閘道位址與一把 LiteLLM 金鑰。閘道會以該金鑰的使用者身分登入，將請求轉送至 Lens：

```bash
claude mcp add --transport http lens https://<your-litellm-proxy>/lens/mcp \
  --header "Authorization: Bearer <your LiteLLM key>"
```

請執行 `claude mcp list`，確認 `lens` 顯示為已連接。接著提出一個需要 trace 資料的問題，例如「Use Lens to find my most recent trace and tell me what it cost」。

任何支援 Streamable HTTP 的 MCP 用戶端都可以用相同方式運作：使用 `POST` 將 JSON-RPC 傳送至 `/lens/mcp`，並附上相同的 `Authorization` 標頭。

## 憑證 {#credentials}

此端點接受與 trace 讀取 API 相同的憑證。`LENS_ADMIN_TOKEN` 可以讀取每一個 trace，由執行 Lens 部署的人持有。透過閘道時，LiteLLM 金鑰只會傳回[其使用者與其團隊有權查看](./api.md#access) 的 trace。追蹤金鑰只能傳送 trace，因此會在此處被以 `401` 拒絕。

## 工具 {#tools}

| 工具 | 傳回的內容 |
| --- | --- |
| `list_agents` | 傳送 trace 的代理程式，附有執行與失敗次數 |
| `list_traces` | 最新的 trace，最新者優先，附有輸入預覽、狀態、模型、token 數量與費用。使用 `agent` 篩選，以 `hours` 擴大時間範圍（預設為 24），並以 `cursor` 分頁 |
| `get_trace` | 一個 trace：附有總費用的摘要、其代理程式，以及依序排列的 span。使用 `cursor` 與 `page_size` 分頁 |
| `get_trace_conversation` | trace 所屬工作階段的較早回合：每次先前的使用者輸入及其代理程式的回答，最舊者優先。trace 本身的輸入與輸出位於 `get_trace` 與 `get_span` |
| `get_span` | 一個 span，附有其完整的輸入、輸出與屬性。其費用位於 `get_trace` 中的該 span 上 |

費用是 `spend` 欄位，以美元計。當呼叫透過 LiteLLM 閘道時才會填入，因為價格是在該處得知。

每個工具都是唯讀的。端點會以一個 JSON 回應回答每個請求，或每批最多 16 個請求。它不會在請求之間保留工作階段，也不會開啟事件串流，因此 `GET /lens/mcp` 會傳回 `405`。
