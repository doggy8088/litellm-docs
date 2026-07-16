import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MCP 部署指南 {#mcp-deployment-guide}

如何將 LiteLLM 部署為 LLM、MCP 伺服器與代理程式的中央閘道。

---

## 核心概念 {#the-core-idea}

LiteLLM 是三種資源類型的單一控制平面：

| 資源 | 註冊為 |
|----------|--------------|
| **LLM** | `model_list`，可在設定檔中或透過 API |
| **MCP Server** | `mcp_servers`，可在設定檔中或透過 UI |
| **Agent** | A2A 路由 |

三者共用相同的驗證（LiteLLM API 金鑰）、速率限制與用量儀表板——一個不需分開註冊的中央目錄。

---

## 部署拓樸 {#deployment-topologies}

### 選項 A：單一閘道（建議） {#option-a-single-gateway-recommended}

一個 LiteLLM 執行個體處理 LLM 路由、MCP 工具呼叫與 A2A 代理程式呼叫。

```
Agents / AI clients
        │
        ▼
┌───────────────────────────────────┐
│         LiteLLM Gateway           │
│  /v1/chat/completions  (LLMs)     │
│  /mcp                  (tools)    │
│  /a2a                  (agents)   │
└───────┬───────┬──────────┬────────┘
        │       │          │
   OpenAI   MCP servers  Downstream
   Bedrock  (internal)    agents
   Azure    (public)
```

一個服務、一份設定、一組 API 金鑰。使用[公網過濾器](./mcp_public_internet.md)來控制哪些 MCP 伺服器對外部呼叫者（Claude Desktop、ChatGPT）可見，以及哪些僅限內部使用。

```yaml title="config.yaml" showLineNumbers
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  store_model_in_db: true
  mcp_internal_ip_ranges:
    - "10.0.0.0/8"
    - "172.16.0.0/12"
    - "192.168.0.0/16"
    - "100.64.0.0/10"   # VPN/Tailscale range

model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

mcp_servers:
  - server_name: internal-db
    url: http://db-mcp.internal:8000/mcp
    transport: http
    available_on_public_internet: false  # internal callers only

  - server_name: web-search
    url: https://mcp.exa.ai/mcp
    transport: http
    available_on_public_internet: true   # visible to ChatGPT / Claude Desktop
```

---

### 選項 B：分離的 LLM 閘道與 MCP 閘道 {#option-b-separate-llm-gateway-and-mcp-gateway}

分成兩個 LiteLLM 部署：一個用於 LLM 路由（不對外網暴露），一個用於 MCP 服務（可選擇對外網開放）。

```
Internal AI clients             External AI clients
        │                       (ChatGPT, Claude Desktop)
        │                               │
        ▼                               ▼
┌────────────────────┐     ┌────────────────────────┐
│  LLM Gateway       │     │  MCP Gateway           │
│  (no public port)  │     │  (port 443 / public)   │
│  /v1/chat/...      │     │  /mcp                  │
└────────┬───────────┘     └──────────┬─────────────┘
         │                            │
    LLM providers              MCP servers
    (OpenAI, Bedrock, …)       (internal + public)
```

LLM API 金鑰保留在防火牆之後。即使 MCP 閘道遭到入侵，也不會暴露這些金鑰。當需要外部 MCP 存取，但 LLM 憑證必須完全保持私密時，請使用此選項。

---

## 中央目錄 {#central-catalog}

LiteLLM 透過標準端點公開所有資源類型：

| 端點 | 回傳 |
|----------|---------|
| `GET /v1/models` | 所有已註冊的 LLM |
| `GET /v1/mcp/server` | 所有 MCP 伺服器 |
| `GET /mcp` | 所有 MCP 工具（跨所有伺服器） |
| `GET /.well-known/agent.json` | A2A 代理程式卡片 |

**MCP 註冊表**（選用）——為 Claude Desktop / Cursor 提供探索端點：

```yaml title="config.yaml"
general_settings:
  enable_mcp_registry: true
```

```json title="Claude Desktop config"
{
  "mcpServers": {
    "litellm": {
      "url": "https://your-litellm.example.com/mcp",
      "headers": { "Authorization": "Bearer sk-..." }
    }
  }
}
```

---

## 安全性考量 {#security-considerations}

### 開放埠問題 {#the-open-port-problem}

如果您將 LiteLLM 的連接埠暴露到網際網路（供 Claude Desktop / ChatGPT 使用），`/v1/chat/completions` 也會對外可達。LLM 憑證仍由金鑰驗證保護，但請審慎處理。

**緩解方式：**
1. **分離部署**（選項 B）— LLM 閘道永遠不會有公開埠
2. **防火牆** — 在網路層阻擋來自公用 IP 的 `/v1/chat/completions`
3. **短效範圍化金鑰** — 若金鑰外洩，可限制影響範圍

### MCP 伺服器可以連到公網 {#mcp-servers-can-reach-the-public-internet}

當您註冊外部 MCP URL（例如 `https://mcp.exa.ai/mcp`）時，LiteLLM 會在每次工具呼叫時對其發出外向請求。請確認您的網路政策允許此操作，且您的資安團隊對資料離開邊界感到放心。

對於隔離網路：只在您的邊界內註冊 MCP 伺服器，並保留 `available_on_public_internet: false`（預設值）。

### 存取控制 {#access-controls}

預設情況下，所有已驗證的呼叫者都可以呼叫所有 MCP 工具。使用以下方式進行限制：

| 控制項 | 位置 |
|---------|-------|
| 每個金鑰的工具存取 | [金鑰層級 MCP 權限](./mcp_control.md) |
| 每個團隊的工具存取 | [團隊層級 MCP 權限](./mcp_control.md) |
| 對外部呼叫者隱藏內部伺服器 | [available_on_public_internet](./mcp_public_internet.md) |
| 驗證請求是否經由 LiteLLM 傳入 | [MCP Zero Trust (JWT)](./mcp_zero_trust.md) |
| 在回應中阻擋敏感資料 | [MCP 防護欄](./mcp_guardrail.md) |

---

## 相關內容 {#related}

- [MCP 總覽](./mcp.md)
- [公網過濾器](./mcp_public_internet.md)
- [MCP 存取控制](./mcp_control.md)
- [MCP Zero Trust](./mcp_zero_trust.md)
- [MCP 防護欄](./mcp_guardrail.md)
