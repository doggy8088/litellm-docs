---
title: API reference
---

# API 參考 {#api-reference}

入口點位於頂層的 `litellm` 模組，與 `litellm.completion` 並列。每一個都有一個帶有 `a` 前綴的 async 版本。

```python
import litellm
from litellm import (
    Harness,
    ClaudeCodeOptions,
    CodexOptions,
    OpenCodeOptions,
    DeepAgentsOptions,
    ToolLoopOptions,
    sandbox,
)
from litellm.harness import Text, ToolCall, FileChange, Done, Result, State
```

## 函式 {#functions}

| 函式 | Async | 回傳值 |
|---|---|---|
| `litellm.agent(harness, prompt, *, sandbox, **options)` | `aagent` | `Result` |
| `litellm.agent(harness, prompt, *, sandbox, stream=True, **options)` | `aagent(..., stream=True)` | `EventStream` |
| `litellm.agent_session(harness, *, sandbox, **options)` | `aagent_session` | `Session` |
| `litellm.agent_resume(state, *, sandbox)` | `aagent_resume` | `Session` |
| `litellm.agent_capabilities(harness)` | | `Capabilities` |

## 選項 {#options}

所有選項都僅能以關鍵字指定，且只有 `sandbox` 是必要的。

```python
def agent(
    harness: Harness,
    prompt: str,
    *,
    sandbox: Sandbox,
    model: str | None = None,                # "litellm_proxy/<group>" for the gateway, else any LiteLLM model
    api_key: str | None = None,              # gateway virtual key, or provider key in SDK mode
    api_base: str | None = None,             # gateway root without /v1, or provider base in SDK mode
    stream: bool = False,
    instructions: str | None = None,
    tools: Sequence[Callable[..., Any]] = (),
    skills: Sequence[str | os.PathLike] = (),
    disable_tools: Sequence[str] = (),
    permissions: Literal["read-only", "ask", "edit", "full"] = "full",
    on_approval: Callable[[Approval], bool | Awaitable[bool]] | None = None,
    output: type[BaseModel] | None = None,
    max_turns: int | None = None,
    timeout: float | None = None,
    metadata: Mapping[str, Any] | None = None,   # sent as x-litellm-spend-logs-metadata
    options: (
        ClaudeCodeOptions
        | CodexOptions
        | OpenCodeOptions
        | DeepAgentsOptions
        | ToolLoopOptions
        | None
    ) = None,
    install: bool = False,                   # runtimes must already be in the sandbox
) -> Result | EventStream: ...
```

## `Result` {#result}

```python
@dataclass(frozen=True)
class Result:
    text: str
    output: BaseModel | None
    files: list[FileChange]
    events: list[Event]
    usage: Usage            # input_tokens, output_tokens, calls, total_tokens
    cost: float
    stop_reason: Literal["done", "max_turns", "timeout", "cancelled", "runtime_error"]
    session_id: str
```

## `Session` {#session}

| 成員 | 說明 |
|---|---|
| `cost: float` | 跨回合的累計總和 |
| `run(prompt)` / `arun(prompt)` | 一個回合，回傳 `Result` |
| `stream(prompt)` / `astream(prompt)` | 一個回合，回傳 `EventStream` |
| `history()` | runtime 的逐字稿，格式為 OpenAI 格式的訊息（Deep Agents 和 Tool Loop） |
| `detach()` | 暫停 runtime 並保留 sandbox；回傳 `State` |
| `stop()` | 停止 runtime 但仍可恢復；回傳 `State` |
| `close()` / `aclose()` | 停止會話擁有的所有內容 |

## `EventStream` {#eventstream}

`Event` 的 iterator（來自 `aagent(..., stream=True)` 的 async iterator）。在其耗盡後，`.result` 會持有 `Result`。

## `State` {#state}

`state.dumps()` 會回傳 `bytes`，`State.loads(data)` 會回傳 `State`，而 `state.harness` 會告訴您它屬於哪個 harness。它不包含任何憑證。

## `Capabilities` {#capabilities}

```python
@dataclass(frozen=True)
class Capabilities:
    structured_output: bool
    tool_approval: bool
    tool_filtering: bool
    history: bool
    custom_tools: bool
    skills: bool
    resume: bool
    permission_modes: frozenset[str]
```
