---
title: LiteLLM SDK 中的 Pi 代理程式
sidebar_label: Pi
description: 使用 litellm.agent() 執行 Pi 程式碼代理程式，經由您的閘道路由請求，並使用串流、工作階段、技能與結構化輸出。
---

# Pi {#pi}

<SinceVersion v="1.109.0" />

`Harness.PI` 會在您的沙箱中執行 [Pi 程式碼代理程式](https://github.com/earendil-works/pi)。請使用相同的 `litellm.agent()` API 來處理模型路由、事件、檔案變更、權杖用量與成本。

## 安裝與執行 {#install-and-run}

請在主機上安裝 SDK 相依套件，並在代理程式執行處安裝 Pi CLI。對於本機沙箱，請在您的機器上執行這兩個命令。

```bash
pip install -U litellm starlette uvicorn
npm install -g @earendil-works/pi-coding-agent
pi --version
```

`pi` 二進位檔必須位於沙箱的 `PATH` 上。對於 `sandbox.docker()`，請將它安裝在容器映像檔中。缺少二進位檔會引發 `HarnessInstallFailed`。

請將 `LITELLM_PROXY_API_BASE` 設為您的[閘道 base URL](./gateway.md)，並將 `LITELLM_PROXY_API_KEY` 設為虛擬金鑰。此範例使用名為 `coder` 的閘道模型群組；請將它替換為您的金鑰可存取且支援 Chat Completions 與工具呼叫的群組。

```bash
export LITELLM_PROXY_API_BASE=https://litellm.example.com
export LITELLM_PROXY_API_KEY=sk-your-virtual-key
mkdir -p pi-workspace
```

```python title="run_pi.py"
from pathlib import Path

import litellm
from litellm import Harness, sandbox

result = litellm.agent(
    Harness.PI,
    "Create hello.txt containing exactly hello from Pi.",
    sandbox=sandbox.local("./pi-workspace"),
    model="litellm_proxy/coder",
    permissions="edit",
)

print(result.text)
print(result.usage)
print(result.cost)
assert result.stop_reason == "done"
assert Path("pi-workspace/hello.txt").read_text().strip() == "hello from Pi"
```

請執行 `python run_pi.py`。該斷言會驗證代理程式建立的檔案。`result.files` 會回報工作區的變更。本機沙箱會以您的使用者檔案系統存取權執行；需要容器隔離時，請使用 [Docker 沙箱](./sandboxes.md)。

## 共用的代理程式 API {#shared-agent-apis}

請傳入 `stream=True` 以接收具型別的事件，或使用 `await litellm.aagent(...)` 取得非同步結果。對於多輪任務，請使用 `agent_session()` 與 `session.run()`。Pi 也支援在已儲存的 `State` 上使用 `detach()` 與 `agent_resume()`。Pi 工作階段快取必須在沙箱環境中保持可用；序列化後的狀態並不包含完整的原生工作階段歷史記錄。

請使用 `output=YourPydanticModel` 取得經過驗證的結構化輸出。Pi 會收到回傳 JSON 的指示，而 LiteLLM 會驗證回應。無效的輸出會引發 `OutputInvalid`。請傳入 `skills=["./skills/review"]` 以載入包含 `SKILL.md` 的目錄。

[工作階段指南](./sessions.md)、[事件參考](./events.md)與[結構化輸出指南](./structured_output.md)都使用搭配 `Harness.PI` 的相同 API。進行評估時，請將 `EvalTarget(Harness.PI, model="litellm_proxy/coder")` 傳入[評估 API](./evaluation.md)，並須符合該 API 的 SDK 版本需求。

## 權限與工具 {#permissions-and-tools}

| 模式 | Pi 內建工具 |
|---|---|
| `read-only` | `read`、`grep`、`find`、`ls` |
| `edit` | 唯讀工具加上 `edit`、`write` |
| `full`（預設） | 編輯工具加上 `bash` |

請使用 `disable_tools=("bash", "write")` 從所選模式中移除工具。正規化後的事件名稱與[共用的工具名稱](./events.md#tool-names)相符，包括 `find` 對應 `glob`，以及 `powershell` 對應 `bash`。

自訂 Python `tools=`、`session.history()` 與 `permissions="ask"` 不受支援，並會引發 `CapabilityUnsupported`。若要使用 Python 函式或互動式工具核准，請使用 [Tool Loop](./tool_loop.md)，或比較[能力表](./supported.md)。

## Pi 選項 {#pi-options}

```python
from litellm import PiOptions

options = PiOptions(
    thinking="medium",
    config={"compaction": {"enabled": True}},
)
```

請在您的代理程式或工作階段呼叫中，將此物件作為 `options=` 傳入。

| 欄位 | 用途 |
|---|---|
| `thinking` | `off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max`；所選模型必須支援所要求的層級 |
| `config` | 額外的 Pi 設定；`mcpServers` 會設定原生的 Pi MCP 伺服器 |
| `env` | Pi 程序的額外環境變數 |

LiteLLM 會管理模型選擇、提供者憑證、權限工具、技能與工作階段路徑。覆寫這些控制項或載入套件與擴充功能的設定會被拒絕。請改用對應的 `agent()` 引數。Pi 會以私人設定執行，不會載入您的個人 Pi 設定或專案本機擴充功能。

已設定的 MCP 伺服器在每種權限模式下都會保持可用。它們的工具可能產生超出讀取檔案的影響，因此請在需要時使用 `disable_tools=` 加以篩選。MCP 設定屬於 `PiOptions.config["mcpServers"]`，而不是 Python `tools=`。

## 路由與計費 {#routing-and-accounting}

Pi 會將串流請求傳送到 `/v1/chat/completions`。使用 `model="litellm_proxy/<group>"` 時，LiteLLM 會將它們轉送到閘道，並帶上 `harness,pi` 標籤與您的 `metadata`。您的閘道金鑰會保留在主機上；Pi 收到的是工作階段範圍的權杖。

用量與成本來自模型回應。自架群組必須回傳串流用量，才能完整計算權杖。若要在沒有閘道的情況下使用 SDK 路由，請參閱[模型與路由](./models.md#sdk-mode)。
