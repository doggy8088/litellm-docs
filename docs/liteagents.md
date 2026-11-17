---
id: liteagents
title: liteagents SDK
sidebar_label: liteagents SDK
description: 透過單一 Python SDK 在 DeepAgents、Pydantic AI、Claude Agent SDK、Codex 與 OpenCode 之間切換，使用相同的應用程式程式碼與您選擇的模型。
---

# liteagents SDK {#liteagents-sdk}

liteagents 讓您透過單一 Python SDK 在 **DeepAgents、Pydantic AI、Claude Agent SDK、Codex 與 OpenCode** 之間切換。選擇一個 harness 與一個模型，執行您的代理程式，然後更改 `harness` 就能以相同的應用程式程式碼試用另一個框架。

:::info[預覽]
liteagents 目前為 beta 版。此預覽版從 GitHub release wheel 安裝，因為 PyPI 上的名稱屬於另一個套件。原始碼、完整的 SDK 參考文件與食譜都在 [liteagents 儲存庫](https://github.com/BerriAI/liteagents) 中。
:::

[GitHub](https://github.com/BerriAI/liteagents) · [產品頁面](https://www.litellm.ai/liteagents) · [LiteAgents 介紹](/blog/liteagents-sdk)

## 運作方式 {#how-it-works}

`your app → liteagents → selected harness → LiteLLM → model provider`

Harness 負責代理程式迴圈。liteagents 為它轉換共用的設定、工具與 MCP，然後將輸出正規化。LiteLLM 的 Python SDK 處理模型提供者的轉換。Harness 專屬的控制項仍可透過 `profile.harness_options` 使用。

串流與對話介面仿照 Claude Agent SDK 設計，包含 `query()`、`LiteAgentClient`、`AssistantMessage` 與 `TextBlock`。這些型別來自 `liteagents`，可跨 harness 運作。

## 快速入門 {#quickstart}

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/BerriAI/liteagents/blob/main/cookbook/recipes/00_agent.ipynb)

### 1. 安裝 {#1-install}

liteagents 需要 Python 3.11 或更新版本。此命令會安裝 liteagents 與下方使用的兩個 harness： {/* keep-python-version */}

```sh
python -m pip install "liteagents[pydantic-ai,claude-sdk] @ https://github.com/BerriAI/liteagents/releases/download/v0.3.0a6/liteagents-0.3.0a6-py3-none-any.whl"
```

不需要儲存庫 checkout、閘道或 Temporal 服務。

### 2. 設定您的 API 金鑰 {#2-set-your-api-key}

使用有 API 額度的 [OpenAI API 金鑰](https://platform.openai.com/api-keys)：

```sh
export OPENAI_API_KEY="your-openai-key"
```

### 3. 執行代理程式 {#3-run-an-agent}

將它儲存為 `agent.py` 並執行 `python agent.py`。它會印出代理程式的回答。

```python
import asyncio
from liteagents import ProfileOptions, run

profile = ProfileOptions(
    harness="pydantic-ai",
    model="openai/{{openai_small}}",
)
prompt = "Explain what an agent harness does in one sentence."

async def main():
    result = await run(prompt, profile=profile)
    print(result.text)

asyncio.run(main())
```

`harness` 選擇代理程式框架。`model` 選擇它呼叫的模型。LiteLLM 的 Python SDK 以您的金鑰連接到提供者。在 Colab 中，請使用 `await main()` 而不是 `asyncio.run(main())`。

### 4. 切換 harness {#4-switch-the-harness}

將 `harness="pydantic-ai"` 改為 `harness="claude-sdk"` 並執行相同的範例。Claude Agent SDK 現在會以相同的 OpenAI 模型與金鑰執行您的提示。回應仍以 `result.text` 傳回。

```python
profile.harness = "claude-sdk"
result = await run(prompt, profile=profile)
print(result.text)
```

每次 `run()` 都是獨立的工作。切換不會轉移執行中的工作階段。若要進行共享歷史的後續輪次，請保持 `LiteAgentClient` 開啟。

## 使用其他提供者 {#use-another-provider}

設定對應的金鑰並更改 `profile.model`。Harness 可以保持相同。

| 提供者 | 模型範例 | 金鑰 |
| --- | --- | --- |
| OpenAI | `openai/{{openai_small}}` | `OPENAI_API_KEY` |
| Anthropic | `anthropic/claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |
| OpenRouter | `openrouter/anthropic/claude-sonnet-4.6` | `OPENROUTER_API_KEY` |
| Google Gemini | `gemini/gemini-2.5-flash` | `GEMINI_API_KEY` |
| Groq | `groq/llama-3.3-70b-versatile` | `GROQ_API_KEY` |

[模型設定](https://github.com/BerriAI/liteagents/blob/main/docs/models.md)涵蓋這些提供者，以及 Mistral、DeepSeek、Together AI、xAI、Azure、Bedrock、Vertex AI 與 Ollama。請選擇已為您的帳戶啟用，且支援您所用工具與設定的模型。

## 安裝其他 harness {#install-other-harnesses}

在安裝命令的方括號中選取您需要的整合。liteagents 會重用已安裝的相容套件，且不會在執行期間下載 harness。

| Harness | 安裝額外套件 |
| --- | --- |
| `deepagents` | `deepagents` |
| `pydantic-ai` | `pydantic-ai` |
| `claude-sdk` | `claude-sdk` |
| `codex` | `codex` |
| `opencode-v1` / `opencode-v2` | 任一選取器，另加 `npm install -g opencode-ai@1.18.29` |

Claude 與 Codex 額外套件包含它們的執行環境。`[all]` 會安裝所有 Python 整合。

## 新增您自己的工具 {#add-your-own-tools}

傳入型別化的 Python 函式。liteagents 會產生結構描述，並將相同的工具調整給每個 harness：

```python
def lookup_order(order_id: str) -> str:
    """Look up an order's payment status and total."""
    return f"Order {order_id}: paid, total USD 12"

result = await run("Look up order A123.", profile=profile, tools=[lookup_order])
print(result.text)
```

一般函式與 `async` 函式都可運作。型別提示描述輸入，docstring 描述工具。MCP 伺服器放在 `profile.mcp_servers` 中。

## 使用 LiteLLM 閘道 {#use-a-litellm-gateway}

如果您已使用閘道，請在 profile 中設定它的模型別名、端點與金鑰：

```python
from getpass import getpass

profile = ProfileOptions(
    harness="pydantic-ai",
    model="my-model",
    model_kwargs={
        "api_base": "https://your-gateway.example/v1",
        "api_key": getpass("Gateway API key: "),
    },
)
```

別名會原封不動地送出，包括斜線。您的應用程式使用閘道金鑰而不是提供者金鑰，因此閘道會將其預算、記錄與防護欄套用到每個代理程式輪次。

## 後續步驟 {#next-steps}

| 試用 | 逐步教學 |
| --- | --- |
| 為代理程式提供 Python 工具 | [查詢訂單](https://colab.research.google.com/github/BerriAI/liteagents/blob/main/cookbook/recipes/08_application_tools.ipynb) |
| 串流輸出並保留對話歷史 | [串流與對話](https://colab.research.google.com/github/BerriAI/liteagents/blob/main/cookbook/recipes/01_quickstart.ipynb) |
| 連接 MCP 伺服器 | [MCP 工具](https://colab.research.google.com/github/BerriAI/liteagents/blob/main/cookbook/recipes/02_mcp.ipynb) |
| 保留原生控制項或載入 JSON 與 YAML profiles | [Profiles](https://github.com/BerriAI/liteagents/blob/main/docs/profiles.md) |
| 在 worker 停止後復原工作 | [Temporal 逐步教學](https://colab.research.google.com/github/BerriAI/liteagents/blob/main/cookbook/recipes/06_durable.ipynb) |

[SDK 參考文件](https://github.com/BerriAI/liteagents/blob/main/docs/sdk.md)涵蓋 `run()`、`query()`、`start_run()`、串流事件、核准與持久執行。
