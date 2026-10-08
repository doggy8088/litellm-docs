---
title: Permissions
---

# 權限 {#permissions}

`permissions=` 採用一種模式，而每個 harness 都會設定其權限行為以符合該模式。預設值是 `"full"`。沙箱只會限制在其中執行的操作；Deep Agents 和 Tool Loop 的 Python 工具是在您的程序中執行。請傳入受信任的函式，並強制執行其所需的任何額外存取規則

| 模式 | 讀取檔案 | 編輯檔案 | Shell 與網路 |
|---|:-:|:-:|:-:|
| `"read-only"` | 是 | 否 | 否 |
| `"edit"` | 是 | 是 | 否 |
| `"full"`（預設） | 是 | 是 | 是 |

## Harness 支援 {#harness-support}

如果您要求的模式是 harness 無法強制執行的，該呼叫會在 runtime 開始之前引發 `CapabilityUnsupported`。它絕不會退回到較寬鬆的模式。

| Harness | `read-only` | `edit` | `full` |
|---|:-:|:-:|:-:|
| `CLAUDE_CODE` | 是 | 是 | 是 |
| `CODEX` | 是 | 否 | 是 |
| `OPENCODE` | 是 | 是 | 是 |
| `DEEPAGENTS` | 是 | 是 | 是 |
| `TOOL_LOOP` | 否 | 否 | 是 |

## 核准 {#approvals}

API 也接受帶有 `on_approval` 回呼的 `permissions="ask"`，或串流中的 `Approval` 事件。此版本中的 CLI harness 不支援，並會引發 `CapabilityUnsupported`。Deep Agents 和 Tool Loop 支援自訂 Python 工具的 ask mode。請在依賴它之前先檢查 `litellm.agent_capabilities(harness).tool_approval`

```python
from litellm.harness import Approval

def approve(a: Approval) -> bool:
    return a.tool == "bash" and a.input["command"].startswith("pytest")
```

沒有人回應的請求會被拒絕，回呼引發例外的請求也一樣。
