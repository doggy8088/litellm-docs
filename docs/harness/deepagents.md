---
title: Deep Agents
sidebar_label: Deep Agents
---

# Deep Agents {#deep-agents}

`Harness.DEEPAGENTS` 會在您的 Python 程序中執行 LangChain 的 [Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview)。不需要啟動任何程序，沙箱中也不需要安裝任何東西

## 安裝 {#install}

```bash
pip install litellm deepagents langchain-litellm
```

Deep Agents 需要 Python 3.11 或更新版本，且不需要 `starlette` 或 `uvicorn`。如果缺少 `deepagents` 或 `langchain-litellm`，呼叫會以安裝指令引發 `HarnessInstallFailed`。{/* keep-python-version */}

## 使用方式 {#usage}

```python
import litellm
from litellm import Harness, DeepAgentsOptions, sandbox

def lookup_owner(path: str) -> str:
    """Return the CODEOWNERS entry for a file path."""
    return codeowners.match(path)

result = litellm.agent(
    Harness.DEEPAGENTS,
    "Find the three flakiest tests, write NOTES.md, and name an owner for each.",
    sandbox=sandbox.docker("python:{{python_version}}", mounts={"./repo": "/workspace"}),
    model="litellm_proxy/claude",
    tools=[lookup_owner],
    permissions="edit",
    options=DeepAgentsOptions(recursion_limit=100),
)
```

## 與 LiteLLM AI Gateway 搭配使用 {#use-with-litellm-ai-gateway}

Deep Agents 可與任何支援工具呼叫的模型群組搭配使用。強大的模型對規劃步驟很有幫助，因此 Claude 或 GPT 群組是良好的預設，而較便宜的群組則可用於子代理程式。

```yaml title="config.yaml"
model_list:
  - model_name: claude
    litellm_params:
      model: anthropic/claude-sonnet-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gpt-mini
    litellm_params:
      model: openai/gpt-5-mini
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
```

建立一個限定於這些群組的虛擬金鑰。

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"models": ["claude", "gpt-mini"], "key_alias": "deepagents"}'
```

接著使用 `litellm_proxy/` 前綴執行。將 gateway 設定在環境中，或在呼叫時傳入。

```python
import litellm
from litellm import Harness, sandbox

result = litellm.agent(
    Harness.DEEPAGENTS,
    "Triage the failing test and file a ticket.",
    sandbox=sandbox.local("./repo"),
    model="litellm_proxy/claude",
    api_base="http://localhost:4000",  # or LITELLM_PROXY_API_BASE
    api_key="sk-...",                  # or LITELLM_PROXY_API_KEY
    tools=[lookup_owner, open_ticket],
    metadata={"ticket": "ENG-412"},
)
```

Deep Agents 會透過帶有 `ChatLiteLLM` 模型與 `model="litellm_proxy/claude"` 的 `/v1/chat/completions` 進行呼叫。gateway 會看到每個請求，且 `model` 設為 `claude`、標頭 `x-litellm-tags: harness,deepagents`，以及您的 `metadata` 作為 `x-litellm-spend-logs-metadata`，這與 CLI harness 所取得的歸因相同。

不同於其他 harness，Deep Agents 會在您的 Python 程序中執行並自行呼叫 gateway。沒有本機端點，也沒有 session token，因此虛擬金鑰會存在於您的程序中，而您的程序需要能連線到 gateway。其套件 `pip install deepagents langchain-litellm` 會安裝在執行您程式碼的機器上，而不是沙箱中。

## 選項 {#options}

```python
@dataclass(frozen=True)
class DeepAgentsOptions:
    subagents: Sequence[SubAgent] = ()   # deepagents SubAgent dicts, passed through
    recursion_limit: int | None = None   # LangGraph recursion limit per turn
```

## 對應方式 {#how-it-maps}

此 adapter 每個工作階段呼叫一次 `create_deep_agent()`。

| `litellm.agent()` | `create_deep_agent` |
|---|---|
| `model="litellm_proxy/claude"` | `model=ChatLiteLLM(model="litellm_proxy/claude", api_base=..., api_key=...)` |
| `model="provider/model"` | `model=ChatLiteLLM(model="provider/model")` |
| `instructions=` | `system_prompt=` |
| `tools=` | `tools=` |
| `output=` | `response_format=` |
| `sandbox=` | `backend=`，其會透過沙箱執行檔案與 shell 工具 |
| sessions | 每個工作階段一個執行緒的 `checkpointer=InMemorySaver()` |

## 模型 {#models}

此模型是 `ChatLiteLLM` 聊天模型。使用 `litellm_proxy/` 模型時，請求會直接帶著您的虛擬金鑰送到 gateway，且不需要本機端點。成本與 token 數量來自 LangChain 的 `usage_metadata`。

## 沙箱 {#sandbox}

代理程式迴圈在您的程序中執行，但其檔案工具與 `execute` shell 工具會在您的沙箱上執行。使用 `sandbox.local(path)` 時，檔案存取僅限於 `path`。

## 內建工具 {#built-in-tools}

`read_file`、`write_file`、`edit_file`、`ls`、`glob`、`grep` 和 `execute` 會顯示為 `read`、`write`、`edit`、`ls`、`glob`、`grep` 和 `bash`。`write_todos` 和 `task` 保留其原生名稱。`disable_tools=` 會依據工具的標準化名稱移除工具。

## 權限 {#permissions}

支援 `"read-only"`、`"edit"` 和 `"full"`（預設）。`"read-only"` 會移除 write、edit 和 execute 工具，而 `"edit"` 會移除 `execute`。

## 工作階段與歷史記錄 {#sessions-and-history}

此版本中的 Deep Agents 與 Tool Loop 支援自訂 Python 工具和歷史記錄。Deep Agents 工作階段會保留 LangGraph checkpointer 與 thread id，而 `s.history()` 會以 OpenAI 格式回傳該執行緒的訊息

```python
with litellm.agent_session(Harness.DEEPAGENTS, sandbox=box, model="litellm_proxy/claude") as s:
    s.run("Read the README and list the setup steps.")
    s.run("Now check whether step 3 still works.")
    for m in s.history():
        print(m["role"], m["content"][:80])
```
