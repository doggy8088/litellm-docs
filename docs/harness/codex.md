---
title: Codex
sidebar_label: Codex
---

# Codex {#codex}

`Harness.CODEX` 會在您的 sandbox 內執行 OpenAI 的 Codex CLI 並使用 `codex exec --json`，再將其 JSONL events 轉換為 events。

## 安裝 {#install}

```bash
pip install litellm starlette uvicorn
npm install -g @openai/codex   # inside the sandbox
```

`codex` binary 必須已存在於 sandbox 的 `PATH` 上。如果沒有，該呼叫會引發 `HarnessInstallFailed`。

## 使用 {#usage}

```python
import litellm
from litellm import Harness, CodexOptions, sandbox

result = litellm.agent(
    Harness.CODEX,
    "Upgrade pydantic to v2 and make the tests pass.",
    sandbox=sandbox.docker("my-agents:latest", mounts={"./repo": "/workspace"}),
    model="litellm_proxy/gpt",
    options=CodexOptions(reasoning_effort="high"),
)
```

## 與 LiteLLM AI Gateway 一起使用 {#use-with-litellm-ai-gateway}

Codex 使用 OpenAI Responses API，因此最適合搭配 OpenAI reasoning model，而閘道會在 `/v1/responses` 原生提供該模型。您也可以提供 Claude 或 Gemini group；閘道會將 Responses 請求轉換為該提供者的格式，不過像 reasoning summaries 這類 Codex 專屬功能可能不會傳遞過去。

```yaml title="config.yaml"
model_list:
  - model_name: gpt
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt
    litellm_params:
      model: azure/gpt-5
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2025-04-01-preview"

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
```

建立一個範圍限定於該 group 的 virtual key。

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"models": ["gpt"], "key_alias": "codex"}'
```

接著使用 `litellm_proxy/` prefix 執行。將閘道設定在環境中，或在呼叫時傳入。

```python
import litellm
from litellm import Harness, CodexOptions, sandbox

result = litellm.agent(
    Harness.CODEX,
    "Upgrade pydantic to v2 and make the tests pass.",
    sandbox=sandbox.docker("my-agents:latest", mounts={"./repo": "/workspace"}),
    model="litellm_proxy/gpt",
    api_base="http://localhost:4000",  # or LITELLM_PROXY_API_BASE
    api_key="sk-...",                  # or LITELLM_PROXY_API_KEY
    options=CodexOptions(reasoning_effort="high"),
    metadata={"ticket": "ENG-412"},
)
```

Codex 會呼叫 `/v1/responses`。閘道會看到每個請求都設定了 `model` 為 `gpt`、header `x-litellm-tags: harness,codex`，以及您的 `metadata` 為 `x-litellm-spend-logs-metadata`，因此花費記錄列同時帶有兩者。

`reasoning_effort` 會在每次呼叫時傳送給模型，且對品質與成本都有最大的影響。`"high"` 適合移轉與棘手的錯誤；例行編輯時請保持未設定。它只會在其模型支援 reasoning effort 的 group 上生效，而位於 translation 之後的 group 可能會忽略它。

## 選項 {#options}

```python
@dataclass(frozen=True)
class CodexOptions:
    reasoning_effort: Literal["low", "medium", "high", "xhigh"] | None = None
    web_search: bool = False
    config: Mapping[str, Any] = field(default_factory=dict)  # extra -c config keys, passed through
    env: Mapping[str, str] = field(default_factory=dict)
```

`config` 會將原生 key 不加型別地直接傳遞，因為 Codex 的設定經常變動。LiteLLM 自行管理的 key，例如 `model_provider`、`model_providers` 和 `approval_policy`，會引發 `OptionsMismatch`。

## 模型 {#models}

Codex 使用 OpenAI Responses API。此 adapter 會註冊一個 `litellm` model provider，並將 `wire_api="responses"` 指向該 session 的本機 endpoint，同時將 `CODEX_HOME` 設為暫存目錄，如此便永遠不會使用您自己的 Codex 設定與登入資訊。使用 `litellm_proxy/` model 時，endpoint 會將 `/v1/responses` 與 `harness,codex` tags 一起轉送到閘道，而閘道會為非 OpenAI model groups 進行轉換。若沒有閘道，則會呼叫 `litellm.aresponses`。

`OPENAI_API_KEY` 與 `CODEX_API_KEY` 絕不會轉送到 sandbox 內。

## 內建工具 {#built-in-tools}

Shell commands 會顯示為 `bash`，web searches 則顯示為 `web_search`。檔案編輯會以來自 sandbox snapshot 的 `FileChange` events 顯示，不論 Codex 是否將其回報為 tool call。

## 權限 {#permissions}

| Mode | Codex |
|---|---|
| `"read-only"` | `--sandbox read-only` |
| `"full"`（預設） | 在 `sandbox.docker` 中的 `--dangerously-bypass-approvals-and-sandbox`；在 `sandbox.local` 中使用 `approval_policy=never` 的 `--sandbox workspace-write` |

Codex 會在 `sandbox.local` 中維持其自己的 OS-level sandbox 開啟，以保護您的電腦。在 Docker 中則會關閉，因為容器本身已是邊界，而巢狀 sandboxing 常常會失敗。`"edit"` 與 `"ask"` 會引發 `CapabilityUnsupported`。

## Skills、輸出與工作階段 {#skills-output-and-sessions}

Skills 會被複製到 `$CODEX_HOME/skills/<name>/`。結構化輸出使用 Codex 的原生 `--output-schema`。工作階段後續輪次會使用 `codex exec resume`，並帶入第一輪的 thread id。

## 限制 {#limits}

Codex 無法過濾其內建工具，因此 `disable_tools=` 會引發 `CapabilityUnsupported`。自訂 Python `tools=` 與 `history()` 無法使用。
