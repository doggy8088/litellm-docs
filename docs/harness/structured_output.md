---
title: 結構化輸出
---

# 結構化輸出 {#structured-output}

將 Pydantic model 作為 `output=` 傳入。執行階段會照常運作，並將其最終答案驗證為 `result.output`。

```python
from typing import Literal
from pydantic import BaseModel

class Review(BaseModel):
    verdict: Literal["approve", "request_changes"]
    issues: list[str]

r = litellm.agent(
    Harness.CLAUDE_CODE,
    "Review the staged diff.",
    output=Review,
    permissions="read-only",
    sandbox=box,
    model="litellm_proxy/coder",
)
r.output.verdict  # "request_changes"
```

| Harness | 結構描述如何被強制執行 |
|---|---|
| `CLAUDE_CODE` | 要求回答一個符合結構描述的 JSON 物件，然後進行驗證 |
| `CODEX` | Codex 的原生 `--output-schema` |
| `OPENCODE` | 要求回答一個符合結構描述的 JSON 物件，然後進行驗證 |
| `DEEPAGENTS` | `create_deep_agent(response_format=Review)` |
| `TOOL_LOOP` | `litellm.acompletion(response_format=Review)` |

如果驗證失敗，呼叫會引發 `OutputInvalid`。該例外會攜帶 `.raw`，其中包含模型的文字，以及 `.result`，其中包含該輪其餘內容，因此工作不會遺失。
