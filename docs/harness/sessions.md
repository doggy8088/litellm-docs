---
title: Sessions
---

# 工作階段 {#sessions}

工作階段會在各回合之間保留其工作目錄與對話歷史。`litellm.agent()` 會為單一回合建立工作階段，並在之後關閉它。當您需要超過一個回合時，請使用 `litellm.agent_session()`

## 多回合 {#multi-turn}

```python
with litellm.agent_session(Harness.CODEX, sandbox=box, model="litellm_proxy/coder") as s:
    s.run("Install dev deps.")
    s.run("Run the router unit tests and summarize failures.")
    r = s.run("Fix the first failure. Keep the diff small.")
    print(s.cost)  # running total across all turns
```

您傳遞給 `agent_session()` 的選項會套用到每個回合。

## 結束工作階段 {#ending-a-session}

| 方法 | 執行階段 | 沙箱 | 可續接 |
|---|---|---|---|
| `s.close()` | 已停止 | 若工作階段建立了它，則關閉 | 否 |
| `s.detach()` 回傳 `State` | 已停放 | 保持執行中 | 是 |
| `s.stop()` 回傳 `State` | 已停止 | 若工作階段建立了它，則關閉 | 是 |

離開 `with` 區塊時，會呼叫 `close()`，除非您已經呼叫過 `detach()` 或 `stop()`。如果您傳入沙箱，則它屬於您。

## 跨程序 {#across-processes}

對於支援續接的 harness，`State` 會保存 harness、其原生工作階段 ID、工作目錄和模型。它絕不保存憑證。`state.dumps()` 會提供給您位元組，以便儲存在任何地方

```python title="app.py"
from litellm import Harness
from litellm.harness import State

@app.post("/chat/{chat_id}")
async def chat(chat_id: str, msg: str):
    raw = await redis.get(f"harness:{chat_id}")
    box = sandbox.docker("my-agents:latest", name=f"chat-{chat_id}")

    if raw:
        s = await litellm.aagent_resume(State.loads(raw), sandbox=box)
    else:
        s = await litellm.aagent_session(Harness.CLAUDE_CODE, sandbox=box, model="litellm_proxy/coder")

    async with s:
        r = await s.arun(msg)
        await redis.set(f"harness:{chat_id}", (await s.adetach()).dumps())
    return {"text": r.text, "cost": r.cost}
```

當狀態來自不同的 harness 或無法讀取時，`agent_resume()` 會引發 `StateIncompatible`。Tool Loop 不支援續接

## 歷史 {#history}

```python
messages = s.history()  # OpenAI-format messages
```

Deep Agents 和 Tool Loop 在此版本中支援歷史記錄。在其他 harness 上，`history()` 會引發 `CapabilityUnsupported`。Tool Loop 會在同一工作階段中的停止/啟動之間保留其 OpenAI 格式訊息，但不支援分離與續接
