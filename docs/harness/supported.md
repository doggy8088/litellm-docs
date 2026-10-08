---
title: 支援的 harness
sidebar_label: 支援的 harness
---

# 支援的 harness {#supported-harnesses}

此版本支援五種 harness。每一種都透過各自的程式化介面驅動，從不透過擷取終端機

```python
from enum import Enum

class Harness(Enum):
    CLAUDE_CODE = "claude_code"
    CODEX = "codex"
    OPENCODE = "opencode"
    DEEPAGENTS = "deepagents"
    TOOL_LOOP = "tool_loop"
```

`Harness` 是一個純粹的 `Enum`。`StrEnum` 成員會與其字串相等，並允許 `"codex"` 通過，因此 `litellm.agent()` 和其他進入點會檢查 `isinstance(harness, Harness)`，否則便會引發 `TypeError`。

## 能力 {#capabilities}

| 能力 | Claude Code | Codex | OpenCode | Deep Agents | Tool Loop |
|---|:-:|:-:|:-:|:-:|:-:|
| 任何 gateway 模型群組 | 是 | 是 | 是 | 是 | 是 |
| 成本追蹤 | 是 | 是 | 是 | 是 | 是 |
| Skills | 是 | 是 | 是 | 是 | 否 |
| 結構化輸出 | 是 | 是 | 是 | 是 | 是 |
| 分離並恢復 | 是 | 是 | 是 | 是 | 否 |
| 內建工具篩選（`disable_tools=`） | 是 | 否 | 是 | 是 | 否 |
| 自訂 Python 工具（`tools=`） | 否 | 否 | 否 | 是 | 是 |
| 歷史紀錄（`s.history()`） | 否 | 否 | 否 | 是 | 是 |
| 權限模式 | `read-only`, `edit`, `full` | `read-only`, `full` | `read-only`, `edit`, `full` | `read-only`, `edit`, `full` | `ask`, `full` |

`permissions="ask"` 搭配互動式核准在此版本的 CLI harness 上不可用。向 harness 要求它不支援的功能時，會在執行階段開始前引發 `CapabilityUnsupported`，而且絕不會退回到較寬鬆的模式。您可以在程式碼中讀到相同的表格。

```python
caps = litellm.agent_capabilities(Harness.CODEX)
caps.tool_filtering     # False
caps.permission_modes   # frozenset({'read-only', 'full'})
```

## 每一種的驅動方式 {#how-each-one-is-driven}

| Harness | 透過以下方式驅動 | 與其模型通訊 | 執行於 | 沙箱中需要 |
|---|---|---|---|---|
| `CLAUDE_CODE` | `claude -p --output-format stream-json` | Anthropic Messages | sandbox | `claude` |
| `CODEX` | `codex exec --json` | OpenAI Responses | sandbox | `codex` |
| `OPENCODE` | `opencode run --format json` | OpenAI Chat Completions | sandbox | `opencode` |
| `DEEPAGENTS` | `deepagents` Python API | LangChain chat model | 您的程序 | 無需任何 |
| `TOOL_LOOP` | LiteLLM tool loop | OpenAI Chat Completions | 您的程序 | 無需任何 |

此版本不會為您安裝執行階段二進位檔。請將它們放入您的 sandbox 映像中，或放在您的 `PATH` 上以供 `sandbox.local` 使用。若二進位檔遺失，該呼叫會引發 `HarnessInstallFailed`，並指出其名稱。

每個 harness 都會接受一個型別化的 options 類別，用於僅對該執行階段有意義的設定。傳入其他 harness 的 options 會引發 `OptionsMismatch`。

```python
from litellm import Harness, CodexOptions

litellm.agent(
    Harness.CODEX, task, sandbox=box,
    options=CodexOptions(reasoning_effort="high"),
)
```
