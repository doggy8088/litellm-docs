---
title: 快速入門
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 快速入門 {#quickstart}

## 1. 安裝 {#1-install}

`litellm.agent()` 是常規 `litellm` 套件的一部分，且不會為其新增任何依賴。安裝您的 harness 所需項目：

| Harness | Python 套件 | sandbox 上 `PATH` 的執行階段 |
|---|---|---|
| Claude Code | `pip install litellm starlette uvicorn` | `npm install -g @anthropic-ai/claude-code` |
| Codex | `pip install litellm starlette uvicorn` | `npm install -g @openai/codex` |
| OpenCode | `pip install litellm starlette uvicorn` | `npm install -g opencode-ai` |
| Deep Agents | `pip install litellm deepagents langchain-litellm` (Python 3.11+) {/* keep-python-version */} | 無 |
| Tool Loop | `pip install litellm` | 無 |

`starlette` 和 `uvicorn` 會執行 CLI harness 呼叫的小型每工作階段模型端點。如果缺少任何項目，該呼叫會以精確的安裝命令拋出 `HarnessInstallFailed`。

## 2. 指向您的閘道 {#2-point-at-your-gateway}

使用來自您的 [LiteLLM AI Gateway](./gateway.md) 的虛擬金鑰。它會保留在您的主機上。以前綴 `litellm_proxy/` 開頭的模型會傳送到此閘道。

```bash
export LITELLM_PROXY_API_BASE=https://litellm.example.com
export LITELLM_PROXY_API_KEY=sk-...
```

若要跳過閘道，請改為匯出像 `ANTHROPIC_API_KEY` 這類的提供者金鑰，並使用不含該前綴的模型字串，例如 `anthropic/claude-sonnet-4-5`。

## 3. 執行一次回合 {#3-run-one-turn}

<Tabs>
<TabItem value="sync" label="同步">

```python title="fix_flaky.py"
import litellm
from litellm import Harness, sandbox

result = litellm.agent(
    Harness.CLAUDE_CODE,
    "Find why tests/test_router.py is flaky and fix it.",
    sandbox=sandbox.local("./repo"),
    model="litellm_proxy/coder",
)

print(result.text)
print(f"${result.cost:.4f}")
```

</TabItem>
<TabItem value="async" label="非同步">

```python title="fix_flaky.py"
import asyncio
import litellm
from litellm import Harness, sandbox

async def main():
    result = await litellm.aagent(
        Harness.CLAUDE_CODE,
        "Find why tests/test_router.py is flaky and fix it.",
        sandbox=sandbox.local("./repo"),
        model="litellm_proxy/coder",
    )
    print(result.text)

asyncio.run(main())
```

</TabItem>
</Tabs>

權限預設為 `"full"`，因為 sandbox 就是邊界。用於審查時，請使用 `permissions="read-only"`，或對您不信任的程式碼使用 Docker sandbox。

## 4. 串流事件 {#4-stream-events}

```python
import litellm
from litellm import Harness, sandbox
from litellm.harness import Text, FileChange, Done

for event in litellm.agent(
    Harness.CODEX,
    "Add type hints to utils.py",
    sandbox=sandbox.local("./repo"),
    model="litellm_proxy/coder",
    stream=True,
):
    match event:
        case Text(delta=delta):
            print(delta, end="", flush=True)
        case FileChange(path=path):
            print(f"\n  changed {path}")
        case Done(cost=cost):
            print(f"\n${cost:.4f}")
        case _:
            pass
```

## 5. 選擇一個 harness {#5-pick-a-harness}

每個 harness 都使用相同的請求，但各自適合不同的工作與不同類型的模型群組。[選擇 harness](./gateway.md#4-choosing-a-harness) 說明何時該使用哪一個，而閘道會以發出請求的 harness 為每個請求加上標籤，因此您可以比較它們的支出。
