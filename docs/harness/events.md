---
title: 事件
---

# 事件 {#events}

`litellm.agent(..., stream=True)` 會產生八種事件。每個 adapter 都會將其執行階段的原生事件轉換為這些事件。

```python
from litellm.harness import (
    Text, Reasoning, ToolCall, ToolResult, FileChange, Compaction, Approval, Done,
)

for event in litellm.agent(Harness.CLAUDE_CODE, "Add type hints to utils.py", sandbox=box, model="litellm_proxy/coder", stream=True):
    match event:
        case Text(delta=d):
            print(d, end="")
        case Reasoning():
            pass
        case ToolCall(name=name, input=args):
            log.info("tool %s %s", name, args)
        case ToolResult(is_error=True, output=out):
            log.warning("tool failed: %s", out)
        case ToolResult():
            pass
        case FileChange(kind=kind, path=path):
            changed.append(path)
        case Compaction():
            pass
        case Approval() as a:
            a.allow() if a.tool == "read" else a.deny("read-only review")
        case Done(cost=cost):
            print(f"\n${cost:.4f}")
```

該 `match` 沒有 `case _`。`Event` 是一個封閉聯集，因此 mypy 和 pyright 都將其視為窮盡。

| 事件 | 欄位 | 備註 |
|---|---|---|
| `Text` | `delta` | 助理文字，串流傳輸。 |
| `Reasoning` | `delta` | 只有在模型與 harness 皆產生時才會出現。 |
| `ToolCall` | `id`, `name`, `native_name`, `input`, `builtin` | `builtin` 是供您自己的 `tools=` 使用的 `False`。 |
| `ToolResult` | `id`, `output`, `is_error` | 與 `ToolCall.id` 配對。 |
| `FileChange` | `path`, `kind`, `diff` | `kind` 是 `"created"`、`"modified"` 或 `"deleted"`。`diff` 是適用於最多 256 KB 文字檔案的統一 diff，否則為 `None`。 |
| `Compaction` | `tokens_before`, `tokens_after` | 執行階段已摘要其自身歷史。 |
| `Approval` | `tool`, `input`, `allow()`, `deny(reason)` | 僅限具有工具核准的 harness。 |
| `Done` | `result`, `usage`, `cost`, `stop_reason` | 永遠是最後一個事件，且只會出現一次。 |

`FileChange` 事件來自於在每個回合前後擷取的沙箱快照進行 diff，因此即使執行階段未將其回報為工具呼叫，編輯仍會顯示出來。

## 工具名稱 {#tool-names}

在每個 harness 中，做相同事情的內建工具都會具有相同的 `name`，因此 UI 程式碼不需要針對每個執行階段分支處理。`native_name` 一律保留執行階段的原始名稱。

| `name` | Claude Code | Codex | OpenCode | Deep Agents | Tool Loop |
|---|---|---|---|---|---|
| `read` | `Read` | | `read` | `read_file` | |
| `write` | `Write` | | `write` | `write_file` | |
| `edit` | `Edit` | | `edit` | `edit_file` | |
| `bash` | `Bash` | command execution | `bash` | `execute` | |
| `glob` | `Glob` | | `glob` | `glob` | |
| `grep` | `Grep` | | `grep` | `grep` | |
| `ls` | `LS` | | `list` | `ls` | |
| `web_search` | `WebSearch` | web search | `webfetch` | | |

不在此表中的工具會在 `name` 中保留其原生名稱。

## 串流結果 {#stream-result}

```python
stream = litellm.agent(Harness.OPENCODE, prompt, sandbox=box, model="litellm_proxy/coder", stream=True)
for event in stream:
    render(event)
result = stream.result  # the same Result the Done event carries
```
