---
title: 透過 LiteLLM 使用您的 Cursor 訂閱
sidebar_label: Cursor CLI 訂閱
description: 透過 LiteLLM 路由已登入的 Cursor CLI 代理程式工作階段。Cursor 登入保留在用戶端，另以獨立的 LiteLLM 金鑰存取閘道。
---

# 透過 LiteLLM 使用您的 Cursor 訂閱 {#use-your-cursor-subscription-through-litellm}

{/* keep-version-note */}

使用您自己的 Cursor 登入，透過 LiteLLM 傳送 Cursor CLI 代理程式請求。Cursor CLI 會保留您的登入狀態並處理權杖刷新。LiteLLM 會原樣轉送原生請求與回應位元組，不進行模型轉換。

**自 1.112 版起提供。**

本指南在 Cursor CLI 中使用您的訂閱。現有的 [Cursor 桌面版整合](./cursor_integration.md) 使用在您的閘道上設定的模型。[Cursor Cloud Agents API](../pass_through/cursor.md) 則有各自的設定方式。

## 前置條件 {#prerequisites}

使用已安裝的 Cursor CLI（`agent`，亦以 `cursor-agent` 名義散佈）以及可存取您所選模型的 Cursor 帳戶。您還需要一個執行 1.112 或更新版本的 [LiteLLM proxy](../proxy/docker_quick_start.md)。每位開發者以自己的 Cursor 帳戶登入。

代理必須允許此不透明中繼。已設定的審核、防護欄或政策引擎規則會停用它，即使請求未選取這些規則也一樣。請勿為了使用此路由而停用必要的安全控制。

## 步驟 1：準備閘道存取 {#step-1-prepare-gateway-access}

請向您的 proxy 管理員索取不受限制的 LiteLLM 虛擬金鑰。該金鑰及其繼承的使用者、團隊、組織、專案、成員與標籤範圍不得有模型限制、權杖上限、支出預算，或其他不受支援的推論控制。繫結代理程式與繫結客戶的金鑰、JWT、自訂驗證與個人金鑰繼承均不受支援。Master key 也可用於管理員的本機測試，但請勿將其散發給開發者。

代理上不需要 `model_list` 項目或 `CURSOR_API_KEY`。Cursor 會選擇模型並強制執行訂閱存取權。請在將啟動 Cursor CLI 的終端機中設定您的閘道金鑰。

```bash
export LITELLM_PROXY_API_BASE="https://gateway.example.com"
export LITELLM_PROXY_API_KEY="sk-<your-litellm-virtual-key>"
```

遠端 proxy 請使用 HTTPS，因為請求同時攜帶閘道與 Cursor 憑證。請使用不含 `/v1` 或 `/cursor-cli` 的 proxy 根 URL。本機測試請使用 `http://localhost:4000`。

## 步驟 2：登入 Cursor {#step-2-sign-in-to-cursor}

請保持 Cursor 的登入端點不變。請從此終端機移除任何 `CURSOR_API_KEY` 覆寫，並以官方 CLI 登入。若您已登入，請保持該登入狀態。

```bash
unset CURSOR_API_KEY
agent login
```

請勿將 `CURSOR_API_KEY` 設為您的 LiteLLM 金鑰。請勿使用 `--endpoint` 或 `CURSOR_API_ENDPOINT` 將其指向 LiteLLM。這些設定會變更 Cursor 登入後端，而此中繼並未實作該後端。

## 步驟 3：啟用 HTTP/1.1 代理程式傳輸 {#step-3-enable-http11-agent-transport}

執行一次即可。這會啟用 Cursor 的 HTTP/1.1 代理程式傳輸，並保留您的其他設定。此設定更新需要 Python 3。

```bash
python3 - <<'PYCONFIG'
import json, os
from pathlib import Path

root = Path(os.environ.get("CURSOR_CONFIG_DIR") or (
    str(Path(os.environ["XDG_CONFIG_HOME"]) / "cursor")
    if os.environ.get("XDG_CONFIG_HOME") else str(Path.home() / ".cursor")
))
path = root / "cli-config.json"
config = json.loads(path.read_text()) if path.exists() else {}
config["network"] = {**config.get("network", {}), "useHttp1ForAgent": True}
root.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(config, indent=2) + "\n")
PYCONFIG
```

這會預設更新 `~/.cursor/cli-config.json`，並遵循 `CURSOR_CONFIG_DIR` 與 `XDG_CONFIG_HOME`。登入與代理程式命令請使用相同的設定目錄。請參閱 [Cursor 的設定參考](https://cursor.com/docs/cli/reference/configuration)。

## 步驟 4：透過 LiteLLM 啟動工作階段 {#step-4-start-a-session-through-litellm}

代理程式流量請使用 `--agent-endpoint`，獨立的 LiteLLM 憑證請使用 `--header`。請使用上方設定的 proxy 根 URL。若您的執行檔名為 `cursor-agent`，請改用該名稱。

```bash
agent \
  --agent-endpoint "${LITELLM_PROXY_API_BASE%/}/cursor-cli" \
  --header "x-litellm-api-key: Bearer $LITELLM_PROXY_API_KEY" \
  --model auto
```

Cursor CLI 會在 `Authorization` 中提供其自己的 bearer 權杖。LiteLLM 會驗證 `x-litellm-api-key`，在轉送前移除閘道憑證，並將該請求的 Cursor 權杖傳送到上游。登入、初始化與模型探索仍直接連向 Cursor，而非透過 LiteLLM。

## 步驟 5：驗證請求與工具後續動作 {#step-5-verify-a-request-and-a-tool-follow-up}

在暫存目錄中建立一個含有已知值的檔案，並以互動方式啟動 CLI。

```bash
mkdir -p cursor-litellm-demo
cd cursor-litellm-demo
printf '%s\n' 'Cursor subscription through LiteLLM works.' > proof.txt
agent \
  --agent-endpoint "${LITELLM_PROXY_API_BASE%/}/cursor-cli" \
  --header "x-litellm-api-key: Bearer $LITELLM_PROXY_API_KEY" \
  --model auto --mode ask
```

在 Cursor 中輸入此提示。

```text
Read proof.txt with the read-file tool and quote its contents. Do not run shell commands or change files.
```

請確認 Cursor 讀取該檔案並引述其中的句子。請檢查代理存取記錄，確認對 `/cursor-cli/agent.v1.AgentService/RunSSE` 與 `/cursor-cli/aiserver.v1.BidiService/BidiAppend` 的請求成功。僅有 HTTP 200 並不能證明代理程式已成功。也請在 CLI 中確認結果。

### 儲存啟動命令 {#save-the-launch-command}

若要重複使用此設定，請將此函式加入 `~/.zshrc` 或 `~/.bashrc`，然後開啟新的終端機。請將您的閘道環境變數保留在現有的密鑰載入工作流程中。

```bash
cursor-litellm() {
  command agent \
    --agent-endpoint "${LITELLM_PROXY_API_BASE:?Set your gateway URL}/cursor-cli" \
    --header "x-litellm-api-key: Bearer ${LITELLM_PROXY_API_KEY:?Set your gateway key}" \
    "$@"
}
```

日後的工作階段請執行 `cursor-litellm`。請使用沒有尾端斜線的閘道 URL。端點與標頭是啟動選項，而非 `cli-config.json` 中支援的欄位。帳戶登入請使用 `agent login`。

## 限制與存取控制 {#limits-and-access-controls}

| 功能 | 行為 |
|---|---|
| 原生代理程式流量 | 僅會中繼兩個 POST RPC：`agent.v1.AgentService/RunSSE` 與 `aiserver.v1.BidiService/BidiAppend`。二進位主體與串流回應會完整保留。 |
| 模型選擇 | Cursor 擁有模型選擇權。LiteLLM 模型別名、路由、備援與依模型限制均不適用。 |
| 內容控制 | 不檢查承載內容、不審核、不設防護欄、不執行政策。已設定的控制會使中繼拒絕請求。 |
| 權杖與支出上限 | 帶有權杖上限或支出預算的金鑰或繼承範圍會被拒絕，因為此路由無法衡量這些值。 |
| 使用量與成本 | 不進行權杖記帳或訂閱成本衡量。記錄為零的成本並不代表剩餘的訂閱額度。 |
| 請求上限 | RPM 與並行上限以個別 RPC 計數，而非以代理程式工作階段計數。請允許串流與附加呼叫重疊。並行上限為 1 時可能會阻擋工具後續動作。 |
| 記錄 | 記錄描述 HTTP 傳輸狀態，而非代理程式的結果或已解析的工具活動。 |
| 憑證 | Cursor CLI 擁有登入與刷新。閘道存取與 Cursor 訂閱存取會分別驗證。 |

撤銷 LiteLLM 金鑰即可結束閘道存取。請另外以 Cursor CLI 登出或撤銷 Cursor 工作階段，以結束訂閱存取。

## 疑難排解 {#troubleshooting}

| 問題 | 修正方式 |
|---|---|
| `The provided API key is invalid`（登入時） | 請從 `CURSOR_API_KEY` 移除 LiteLLM 值，並還原 Cursor 的登入端點。請使用 `agent login`，然後僅為該工作階段設定 `--agent-endpoint`。 |
| 閘道回應 401 | 請檢查獨立的 `x-litellm-api-key` 標頭，並確認 LiteLLM 金鑰有效。請將 Cursor 自己的 bearer 權杖保留在 `Authorization` 中。 |
| 閘道回應 403 | 請管理員檢查金鑰與繼承的限制、代理程式或客戶繫結、驗證類型，以及已設定的審核、防護欄或政策。請勿移除必要的控制以繞過拒絕。 |
| `RunSSE` 回應 404 | 請確認 proxy 執行 1.112 或更新版本，且代理程式端點以 `/cursor-cli` 結尾，而非 `/cursor` 或 `/v1`。 |
| 工作階段卡住或工具後續動作失敗 | 請確認作用中 CLI 設定中的 `network.useHttp1ForAgent` 為 true。請檢查 RPC 並行上限與 proxy 串流逾時。 |
| Cursor 拒絕登入或模型 | 請重新以 Cursor 登入，並選擇您的帳戶可用的模型。LiteLLM 無法授予訂閱存取權。 |

請參閱 [其他訂閱設定](../subscriptions.md)，了解 Claude、Codex 與 Copilot。

請參閱 Cursor 的 [CLI 參數](https://cursor.com/docs/cli/reference/parameters)與 [網路設定](https://cursor.com/docs/enterprise/network-configuration#llm-gateways)。原生的 `--agent-endpoint` 選項並非已記錄的訂閱閘道合約，可能會隨 CLI 版本變更。
