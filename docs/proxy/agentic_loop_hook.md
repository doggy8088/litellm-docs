# 代理式迴圈 Hook {#agentic-loop-hook}

建立一個 `CustomLogger` callback，攔截模型回應、在伺服器端完成工具呼叫，並重新執行模型——對呼叫端而言是透明的。

:::info 支援的呼叫類型
- 僅 `async`（同步呼叫不會觸發此 hook）
- 僅限非串流（串流回應無法檢查工具呼叫）
- 適用於 `/v1/messages` 與 `/v1/chat/completions`
:::

## 實作 callback {#implement-the-callback}

在 `CustomLogger` 上覆寫兩個方法：

```python
from litellm.integrations.custom_logger import CustomLogger
from litellm.types.integrations.custom_logger import AgenticLoopPlan, AgenticLoopRequestPatch

MY_TOOL = "my_tool"

class MyToolCallback(CustomLogger):

    async def async_should_run_agentic_loop(
        self, response, model, messages, tools, stream, custom_llm_provider, kwargs
    ):
        # Return (True, context_dict) if there are tool calls to handle
        content = getattr(response, "content", None) or []
        calls = [b for b in content if isinstance(b, dict)
                 and b.get("type") == "tool_use" and b.get("name") == MY_TOOL]
        if not calls:
            return False, {}
        return True, {"tool_calls": calls}

    async def async_build_agentic_loop_plan(
        self, tools, model, messages, response,
        anthropic_messages_provider_config,
        anthropic_messages_optional_request_params,
        logging_obj, stream, kwargs,
    ):
        calls = tools["tool_calls"]
        results = [f"result for {c['input']}" for c in calls]  # your logic here

        follow_up = messages + [
            {"role": "assistant", "content": [
                {"type": "tool_use", "id": c["id"], "name": c["name"], "input": c["input"]}
                for c in calls
            ]},
            {"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": c["id"], "content": results[i]}
                for i, c in enumerate(calls)
            ]},
        ]
        return AgenticLoopPlan(
            run_agentic_loop=True,
            request_patch=AgenticLoopRequestPatch(messages=follow_up),
        )
```

對於 `/v1/chat/completions`，請改為覆寫 `async_build_chat_completion_agentic_loop_plan`——概念相同，`optional_params` 取代 `anthropic_messages_optional_request_params`。

## 註冊它 {#register-it}

```python
import litellm
litellm.callbacks = [MyToolCallback()]
```

或在 `config.yaml` 中：

```yaml
litellm_settings:
  callbacks: ["my_module.MyToolCallback"]
```

## `AgenticLoopPlan` 欄位 {#agenticloopplan-fields}

| 欄位 | 效果 |
|---|---|
| `run_agentic_loop=True` + `request_patch` | 使用已修補的請求重新執行模型 |
| `response_override` | 直接將此值回傳給呼叫端（不重新執行） |
| `terminate=True` | 停止迴圈，回傳目前回應 |
| `run_agentic_loop=False`（預設） | 略過；接著檢查下一個 callback |

`AgenticLoopRequestPatch` 接受：`model`、`messages`、`tools`、`max_tokens`、`optional_params`、`kwargs`。

## 迴圈安全性 {#loop-safety}

- 預設最大重跑次數：`3`——可透過 `kwargs["max_agentic_loops"]` 針對單一請求覆寫
- 相同的工具呼叫指紋會自動中止迴圈
- 目前深度位於 `kwargs["_agentic_loop_depth"]`

## 本倉庫中的範例 {#examples-in-this-repo}

- `litellm/integrations/compression_interception/handler.py`
- `litellm/integrations/websearch_interception/handler.py`
