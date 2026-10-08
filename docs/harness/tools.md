---
title: 工具與技能
sidebar_label: 工具與技能
---

# 工具與技能 {#tools-and-skills}

## 關閉內建工具 {#turning-off-built-in-tools}

```python
litellm.agent(Harness.CLAUDE_CODE, task, sandbox=box, model="litellm_proxy/coder", disable_tools=["web_search", "bash"])
```

使用 [Events](./events.md#tool-names) 中的標準化名稱。Codex 無法篩選其內建工具，因此在那裡這會引發 `CapabilityUnsupported`。

## 自訂工具 {#custom-tools}

Deep Agents 和 Tool Loop 支援自訂 Python 工具。它們是會在您的程序中執行的普通函式

```python
from typing import Literal

def lookup_owner(path: str) -> str:
    """Return the CODEOWNERS entry for a file path."""
    return codeowners.match(path)

async def open_ticket(title: str, body: str, severity: Literal["low", "high"]) -> str:
    """File a ticket in the tracker. Returns the ticket URL."""
    return await tracker.create(title=title, body=body, severity=severity)

litellm.agent(
    Harness.DEEPAGENTS,
    "Triage the failing test and file a ticket.",
    tools=[lookup_owner, open_ticket],
    sandbox=box,
    model="litellm_proxy/coder",
)
```

型別提示與 docstring 會成為工具的 schema。同步函式會在工作執行緒中執行，非同步函式則會被 await。將 `tools=` 傳給 Claude Code、Codex 或 OpenCode 會引發 `CapabilityUnsupported`

## 技能 {#skills}

技能是包含 `SKILL.md` 及其所需任何檔案的本機資料夾。傳入資料夾路徑後，適配器會將每個資料夾複製到沙箱中，執行階段會在其中尋找技能。

```python
litellm.agent(Harness.CLAUDE_CODE, "Ship the fix.", sandbox=box, model="litellm_proxy/coder", skills=["./skills/release-checklist"])
```

| Harness | 安裝至 |
|---|---|
| `CLAUDE_CODE` | 工作目錄中的 `.claude/skills/<name>/` |
| `CODEX` | `$CODEX_HOME/skills/<name>/` |
| `OPENCODE` | 工作目錄中的 `.opencode/skill/<name>/` |
| `DEEPAGENTS` | 傳遞給代理程式 |
| `TOOL_LOOP` | 不支援 |

技能會在工作階段開始時複製一次。
