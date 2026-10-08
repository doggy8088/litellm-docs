---
title: OpenCode
sidebar_label: OpenCode
---

# OpenCode {#opencode}

`Harness.OPENCODE` 會在您的沙箱中使用 `opencode run --format json` 執行 OpenCode CLI，並將其 JSON 事件轉換為事件。

## 安裝 {#install}

```bash
pip install litellm starlette uvicorn
npm install -g opencode-ai   # inside the sandbox
```

`opencode` 二進位檔必須已經存在於沙箱的 `PATH` 上。如果沒有，呼叫會引發 `HarnessInstallFailed`。

## 使用方式 {#usage}

```python
import litellm
from litellm import Harness, OpenCodeOptions, sandbox

result = litellm.agent(
    Harness.OPENCODE,
    "Add a /health endpoint with a test.",
    sandbox=sandbox.docker("my-agents:latest", mounts={"./api": "/workspace"}),
    model="litellm_proxy/gemini",
    permissions="edit",
    options=OpenCodeOptions(agent="build"),
)
```

## 與 LiteLLM AI Gateway 搭配使用 {#use-with-litellm-ai-gateway}

OpenCode 使用標準 Chat Completions，因此任何模型群組都可運作：Gemini、Claude、GPT，或自架模型。這使它成為其他 CLI 未為其設計之模型的自然 harness。

```yaml title="config.yaml"
model_list:
  - model_name: gemini
    litellm_params:
      model: gemini/gemini-2.5-pro
      api_key: os.environ/GEMINI_API_KEY
  - model_name: qwen-coder
    litellm_params:
      model: hosted_vllm/Qwen/Qwen3-Coder-30B-A3B-Instruct
      api_base: http://gpu-01:8000/v1

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
```

建立一個僅限於這些群組的 virtual key。

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"models": ["gemini", "qwen-coder"], "key_alias": "opencode"}'
```

接著使用 `litellm_proxy/` 前綴執行。將 gateway 設定在環境中，或在呼叫時傳入。

```python
import litellm
from litellm import Harness, sandbox

result = litellm.agent(
    Harness.OPENCODE,
    "Add a /health endpoint with a test.",
    sandbox=sandbox.docker("my-agents:latest", mounts={"./api": "/workspace"}),
    model="litellm_proxy/qwen-coder",
    api_base="http://localhost:4000",  # or LITELLM_PROXY_API_BASE
    api_key="sk-...",                  # or LITELLM_PROXY_API_KEY
    permissions="edit",
    metadata={"ticket": "ENG-412"},
)
```

OpenCode 會以 `stream: true` 呼叫 `/v1/chat/completions`。gateway 會看到每個請求，其中 `model` 設為您的群組、標頭 `x-litellm-tags: harness,opencode`，以及您的 `metadata` 作為 `x-litellm-spend-logs-metadata`，因此費用記錄列會同時保留兩者。

由於每個回應都會串流，`result.cost` 和 token 計數都來自每個串流結尾的 usage chunk。託管提供者會送出一個。對於自架群組，請確認伺服器在以 `stream_options: {"include_usage": true}` 要求時會回傳 usage；否則該群組的 token 與成本會顯示為 0。OpenCode 也會將其小型背景呼叫（標題、摘要）送到相同群組，因為 LiteLLM 會將其 `small_model` 設為 `model`。

## 選項 {#options}

```python
@dataclass(frozen=True)
class OpenCodeOptions:
    agent: str = "build"                                     # which OpenCode agent runs the turn
    config: Mapping[str, Any] = field(default_factory=dict)  # extra opencode.json keys, merged under LiteLLM's
    env: Mapping[str, str] = field(default_factory=dict)
```

## 模型 {#models}

此 adapter 會寫入一個 `opencode.json`，其中包含一個提供者 `litellm`，使用 `@ai-sdk/openai-compatible` 並將其 base URL 設為工作階段的本機端點，並將 `OPENCODE_CONFIG` 指向它。`XDG_CONFIG_HOME` 和 `XDG_DATA_HOME` 會指向暫存目錄，因此不會使用您自己的 OpenCode 提供者與驗證。OpenCode 使用 OpenAI Chat Completions。對於 `litellm_proxy/` 模型，端點會將 `/v1/chat/completions` 與 `harness,opencode` 標籤轉送到 gateway；沒有 gateway 時則會呼叫 `litellm.acompletion`，因此每個 LiteLLM 提供者都可運作。

## 內建工具 {#built-in-tools}

`read`、`write`、`edit`、`bash`、`glob` 和 `grep` 會保留原名稱，而 `webfetch` 會顯示為 `web_search`。其他工具會保留其原生名稱。`disable_tools=` 會在產生的設定中關閉工具。

## 權限 {#permissions}

`"read-only"`、`"edit"` 和 `"full"`（預設值）會對應到 OpenCode 的 `permission` 設定。`"ask"` 在此版本中會引發 `CapabilityUnsupported`，而 `config` 中的權限鍵會被拒絕，因此無法放寬您設定的模式。

## 技能、輸出與工作階段 {#skills-output-and-sessions}

技能會複製到工作目錄中的 `.opencode/skill/<name>/`。結構化輸出則是透過指示模型以符合您 schema 的單一 JSON 物件作答。當 OpenCode 回報 session id 時，工作階段會以該 session id 繼續。

## 限制 {#limits}

自訂 Python `tools=` 和 `history()` 會引發 `CapabilityUnsupported`。
