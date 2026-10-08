---
title: Claude Code
sidebar_label: Claude Code
---

# Claude Code {#claude-code}

`Harness.CLAUDE_CODE` 會在您的沙箱內執行 Anthropic 的 Claude Code CLI 與 `claude -p --output-format stream-json`，並將其 stream-json 輸出轉換為事件。

## 安裝 {#install}

```bash
pip install litellm starlette uvicorn
npm install -g @anthropic-ai/claude-code   # inside the sandbox
```

`claude` 二進位檔必須已存在於沙箱的 `PATH` 上。若不存在，該呼叫會引發 `HarnessInstallFailed`。

## 使用 {#usage}

```python
import litellm
from litellm import Harness, sandbox

result = litellm.agent(
    Harness.CLAUDE_CODE,
    "Find why tests/test_router.py is flaky and fix it.",
    sandbox=sandbox.docker("my-agents:latest", mounts={"./repo": "/workspace"}),
    model="litellm_proxy/claude",
    permissions="edit",
)
```

## 與 LiteLLM AI Gateway 搭配使用 {#use-with-litellm-ai-gateway}

Claude Code 使用 Anthropic Messages API，因此最適合搭配 Claude 模型群組，而該閘道可在 `/v1/messages` 上原生提供。Bedrock 與 Vertex Claude 部署的行為與 Anthropic 直接使用相同，因此您可以在同一個群組中對它們進行負載平衡。

```yaml title="config.yaml"
model_list:
  - model_name: claude
    litellm_params:
      model: anthropic/claude-sonnet-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude
    litellm_params:
      model: bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0
      aws_region_name: us-west-2

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
```

建立一個範圍限定於該群組的虛擬金鑰。

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"models": ["claude"], "key_alias": "claude-code"}'
```

接著以 `litellm_proxy/` 前綴執行。可在環境中設定閘道，或在呼叫時傳入。

```python
import litellm
from litellm import Harness, sandbox

result = litellm.agent(
    Harness.CLAUDE_CODE,
    "Find why tests/test_router.py is flaky and fix it.",
    sandbox=sandbox.docker("my-agents:latest", mounts={"./repo": "/workspace"}),
    model="litellm_proxy/claude",
    api_base="http://localhost:4000",  # or LITELLM_PROXY_API_BASE
    api_key="sk-...",                  # or LITELLM_PROXY_API_KEY
    permissions="edit",
    metadata={"ticket": "ENG-412"},
)
```

Claude Code 會呼叫 `/v1/messages`。閘道會看到每個請求，其 `model` 設為 `claude`、標頭 `x-litellm-tags: harness,claude_code`，以及您的 `metadata` 作為 `x-litellm-spend-logs-metadata`，因此費用記錄列會同時帶有兩者。

Claude Code 也會進行一些小型背景呼叫，例如標題與摘要。它們會前往與 `model` 相同的群組，就像 OpenCode 一樣，因此其計費與標記方式相同。

## 選項 {#options}

```python
@dataclass(frozen=True)
class ClaudeCodeOptions:
    config: Mapping[str, Any] = field(default_factory=dict)  # extra settings.json keys, passed with --settings
    env: Mapping[str, str] = field(default_factory=dict)
```

`config` 會將原生 Claude Code 設定以未型別方式傳遞，因為這些設定經常變動。LiteLLM 自行管理的鍵，例如 `env`、`apiKeyHelper`、`model` 和 `permissions`，會引發 `OptionsMismatch`。在呼叫時使用 `max_turns=` 來限制工具迴圈，與其他每個 harness 相同。

## 模型 {#models}

Claude Code 支援 Anthropic Messages。它會取得 `ANTHROPIC_BASE_URL`，指向工作階段的本機端點，且 `ANTHROPIC_AUTH_TOKEN` 設為工作階段權杖，而 `CLAUDE_CONFIG_DIR` 則指向一個包含 `--setting-sources user` 的暫存目錄，因此您自己的 Claude Code 登入、設定與儲存庫的 `.claude/settings.json` 絕不會被使用。使用 `litellm_proxy/` 模型時，端點會將 `/v1/messages` 以及 `harness,claude_code` 標籤轉送到閘道。沒有閘道時，則會呼叫 `litellm.anthropic.messages.acreate`。

`ANTHROPIC_API_KEY` 在執行階段會設為空字串，而遙測與非必要流量會關閉。

## 內建工具 {#built-in-tools}

工具會顯示為 `read`、`write`、`edit`、`bash`、`glob`、`grep` 和 `web_search`。該集合以外的工具，例如 `Task` 和 `TodoWrite`，會保留其原生名稱。`disable_tools=` 會對應至 `--disallowedTools`。

## 權限 {#permissions}

| 模式 | Claude Code |
|---|---|
| `"read-only"` | `--permission-mode plan` |
| `"edit"` | `--permission-mode acceptEdits` |
| `"full"`（預設） | `--permission-mode bypassPermissions` |

`"ask"` 會引發 `CapabilityUnsupported`。

## 技能、輸出與工作階段 {#skills-output-and-sessions}

技能會複製到 `$CLAUDE_CONFIG_DIR/skills/<name>/`。結構化輸出是透過指示模型以符合您 schema 的單一 JSON 物件作答，之後再進行驗證。工作階段中的後續回合會使用 `--resume`，並帶入第一回合中的工作階段 id。

## 限制 {#limits}

自訂 Python `tools=` 和 `history()` 會引發 `CapabilityUnsupported`。不會使用訂閱登入（Claude Max），因為每次模型呼叫都會經過 LiteLLM。
