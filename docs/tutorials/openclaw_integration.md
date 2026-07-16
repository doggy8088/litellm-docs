---
sidebar_label: "OpenClaw"
---

# OpenClaw + LiteLLM 整合 {#openclaw--litellm-integration}

[OpenClaw](https://openclaw.ai) 是一個自架式 AI 助理，可將聊天應用程式（WhatsApp、Telegram、Discord 等）連接到 LLM 提供者。透過將 OpenClaw 經由 LiteLLM Proxy 路由，您可以從單一閘道存取 100+ 提供者、成本追蹤、支出上限與自動故障轉移。

## 您將設定的內容 {#what-youll-set-up}

```
Chat apps → OpenClaw Gateway → LiteLLM Proxy → LLM Providers (OpenAI, Anthropic, etc.)
```

## 先決條件 {#prerequisites}

| 需求 | 取得方式 |
|---|---|
| **Node.js 22+** | `node --version` — 如有需要，請從 [nodejs.org](https://nodejs.org) 安裝 |
| **Python 3.8+** | `python --version` |
| **至少一個 LLM API 金鑰** | OpenAI、Anthropic、Gemini 等 |

## 步驟 1 — 安裝 LiteLLM Proxy {#step-1--install-litellm-proxy}

```bash
uv tool install 'litellm[proxy]'
```

## 步驟 2 — 建立 LiteLLM 設定檔 {#step-2--create-a-litellm-config-file}

建立一個包含您要使用之模型的設定檔 `litellm_config.yaml`。以下是使用 OpenAI 的範例：

```yaml title="litellm_config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: sk-your-secret-key  # pick any value — this is YOUR proxy password
```

:::tip 多提供者範例
您可以從不同提供者加入任意多個模型：

```yaml title="litellm_config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gemini-flash
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GEMINI_API_KEY

general_settings:
  master_key: sk-your-secret-key
```

如需所有選項，請參閱 [LiteLLM proxy 設定文件](https://docs.litellm.ai/docs/proxy/configs)。
:::

## 步驟 3 — 啟動 proxy {#step-3--start-the-proxy}

請確保您的 API 金鑰已作為環境變數可用（透過 `export`、`.env` 檔案，或您管理密鑰的任何方式），然後啟動 proxy：

```bash
litellm --config litellm_config.yaml --port 4000
```

## 步驟 4 — 安裝 OpenClaw {#step-4--install-openclaw}

```bash
# macOS / Linux
curl -fsSL https://openclaw.ai/install.sh | bash
```

:::note Windows
在 Windows 上，請使用 PowerShell：`iwr -useb https://openclaw.ai/install.ps1 | iex`

建議使用 WSL2，而非原生 Windows。
:::

## 步驟 5 — 將 OpenClaw 連接到 LiteLLM {#step-5--connect-openclaw-to-litellm}

執行上線精靈：

```bash
openclaw onboard --install-daemon
```

出現提示時：

1. 將 **QuickStart** 或 **Manual** 選為上線模式（兩者都可用 — Manual 提供更多閘道設定選項）
2. 將 **LiteLLM** 選為模型/驗證提供者
3. 輸入步驟 2 中的 LiteLLM `master_key`，並將 base URL 設為您的 proxy 位址（例如：`http://localhost:4000`）
4. 當系統詢問預設模型時，選擇 **Enter model manually**，並輸入您 `litellm_config.yaml` 中的模型名稱（例如：`litellm/gpt-4o`）

您也可以在上線後設定或變更模型：

```bash
openclaw models set litellm/gpt-4o
```

針對腳本 / CI 環境，您可以完全跳過提示：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice litellm-api-key \
  --litellm-api-key "sk-your-secret-key" \
  --custom-base-url "http://localhost:4000" \
  --install-daemon --skip-channels --skip-skills
```

## 步驟 6 — 驗證 {#step-6--verify}

檢查閘道是否健康：

```bash
openclaw health
```

接著傳送測試訊息：

```bash
openclaw dashboard                                           # web UI
openclaw tui                                                 # terminal UI
openclaw agent --agent main -m "Hello, what model are you?"  # one-shot CLI
```

如果您從模型收到回應，整合即已成功運作。

檢查目前啟用的是哪個模型：

```bash
openclaw models status
```

## 設定參考 {#config-reference}

完成上線後，OpenClaw 會將 LiteLLM provider 設定儲存在 `~/.openclaw/openclaw.json`。相關區段大致如下：

```json5 title="~/.openclaw/openclaw.json (excerpt)"
{
  "models": {
    "providers": {
      "litellm": {
        "baseUrl": "http://localhost:4000",
        "apiKey": "sk-your-secret-key",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-4o",
            "name": "GPT-4o via LiteLLM"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "litellm/gpt-4o" }
    }
  }
}
```

您可以直接編輯此檔案，以新增更多模型或變更 `baseUrl`。OpenClaw 會自動熱重載變更。

## 疑難排解 {#troubleshooting}

**連線遭拒 / 無法連上 proxy**

請確認 LiteLLM proxy 正在執行，且您 OpenClaw 設定中的 `baseUrl` 符合：

```bash
curl http://localhost:4000/health -H "Authorization: Bearer sk-your-secret-key"
```

**模型錯誤或 "Invalid model name"**

OpenClaw 中的模型名稱必須符合您 `litellm_config.yaml` 中的 `model_name`。請使用以下方式切換目前啟用的模型：

```bash
openclaw models set litellm/gpt-4o
```

**重新安裝後的閘道配對問題**

如果 CLI 在重新安裝後無法連線到閘道，請停止服務並重新安裝：

```bash
openclaw gateway stop
openclaw gateway install
```

## 參考資料 {#references}

- [OpenClaw 文件](https://docs.openclaw.ai)
- [OpenClaw LiteLLM provider 文件](https://docs.openclaw.ai/providers/litellm)
- [OpenClaw 模型提供者](https://docs.openclaw.ai/concepts/model-providers)
- [LiteLLM proxy 設定](https://docs.litellm.ai/docs/proxy/configs)
