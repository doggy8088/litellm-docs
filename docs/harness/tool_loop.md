---
title: Tool Loop
sidebar_label: Tool Loop
---

# Tool Loop {#tool-loop}

`Harness.TOOL_LOOP` 在您的 Python 處理程序中執行最小化的工具呼叫迴圈。它會呼叫 `litellm.acompletion()`、根據您的 Python 函式簽章驗證工具引數、執行這些函式，並將結果傳回模型，直到模型回傳最終答案

## 安裝 {#install}

Tool Loop 只需要一般的 `litellm` 套件。不需要安裝額外套件或執行階段二進位檔

## 使用您自己的 Python 工具 {#use-your-own-python-tools}

在 `tools=` 中傳入同步或非同步 Python 函式。型別提示與 docstring 會定義每個工具的 schema。Tool Loop 會在工作執行緒中執行同步函式，並等待非同步函式完成

```python
from typing import Literal

import litellm
from pydantic import BaseModel

from litellm import Harness, sandbox

def search_code(query: str, path: str = ".") -> list[str]:
    """Find matching lines in the repository."""
    ...

def read_file(path: str) -> str:
    """Read a text file from the repository."""
    ...

class Review(BaseModel):
    summary: str
    verdict: Literal["approve", "request_changes"]
    findings: list[str]

result = litellm.agent(
    Harness.TOOL_LOOP,
    "Review the changes in this repository. Search for relevant code, read files as needed, and return your findings.",
    sandbox=sandbox.local("./repo"),
    model="litellm_proxy/coder",
    tools=[search_code, read_file],
    output=Review,
)

print(result.output)
```

此迴圈會將工具例外、未知的工具名稱與無效引數以工具錯誤的形式回傳給模型，因此模型可以復原或說明問題。工具呼叫會依序執行

您的函式會在執行 LiteLLM 的 Python 處理程序中執行，而不是在 sandbox 內。請傳入 sandbox，因為這是通用 agent API 的一部分，並讓您的工具強制執行所需的任何檔案或網路邊界

## 與 LiteLLM AI Gateway 搭配使用 {#use-with-litellm-ai-gateway}

在 gateway model group 前加上 `litellm_proxy/`。請求會透過 LiteLLM 的 Chat Completions API，並帶有 `harness,tool_loop` 標籤。virtual key 會由執行 Tool Loop 的 Python 處理程序使用

```python
result = litellm.agent(
    Harness.TOOL_LOOP,
    "Find the owner of the authentication module and summarize their recent changes.",
    sandbox=sandbox.local("./repo"),
    model="litellm_proxy/coder",
    tools=[search_code, read_file],
    metadata={"task": "code-review"},
)
```

若沒有前綴，Tool Loop 會透過 LiteLLM SDK 呼叫提供者。請使用 `api_key=` 與 `api_base=` 傳入提供者憑證，或使用標準的提供者環境變數

## Completion 選項 {#completion-options}

使用 `ToolLoopOptions` 將額外的關鍵字引數傳遞給每次 `litellm.acompletion()` 呼叫。由 harness 管理的模型與路由值優先於 `completion_kwargs` 中的值

```python
import litellm
from litellm import Harness, ToolLoopOptions, sandbox

result = litellm.agent(
    Harness.TOOL_LOOP,
    "Summarize the latest changes.",
    sandbox=sandbox.local("./repo"),
    model="litellm_proxy/coder",
    tools=[search_code, read_file],
    options=ToolLoopOptions(
        completion_kwargs={"temperature": 0.2, "reasoning_effort": "high"}
    ),
)
```

`ToolLoopOptions` 是凍結的，且預設為空對應。此迴圈支援透過 `output=` 傳入 Pydantic model 的結構化輸出、透過 `permissions="ask"` 的核准，以及透過 `session.history()` 的 OpenAI 格式對話歷史

## 權限與限制 {#permissions-and-limitations}

Tool Loop 支援 `permissions="full"` 與 `permissions="ask"`。在 ask 模式下，每次呼叫自訂工具都需要透過 `on_approval` 或串流中的 `Approval` 事件取得核准

Tool Loop 不提供內建的檔案或 shell 工具、skills、session resume，或 `disable_tools=`。請將任務所需的 Python 函式加入 `tools=`
