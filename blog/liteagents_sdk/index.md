---
slug: liteagents-sdk
title: "介紹 LiteAgents"
date: 2026-09-25T10:00:00-07:00
authors: [moe]
description: "無需重寫您的代理程式即可切換 agent harness。保留您的工具與模型組態，使用原生 harness 控制，並在需要可持久執行時加入 Temporal。"
tags: [agents, sdk]
hide_table_of_contents: true
image: ./hero.png
---

![LiteAgents：切換 harness，保留您的 agent。ProfileOptions 範例將 deepagents 變更為 claude-sdk，同時保留模型、工具與 MCP 連線。](./hero.png)

您已使用自己的工具、提示詞和模型組態建置了一個 agent。現在您想在相同任務上嘗試不同的 harness。

**LiteAgents 讓您無需重寫應用程式即可切換 agent harness。** 其介面以 Claude Agent SDK 為藍本，包括 `query()` 模式與型別化訊息。您可以在保留工具、MCP 連線、模型組態與用戶端程式碼的情況下，選擇 Deep Agents、Pydantic AI、Claude Agent SDK、Codex 或 OpenCode。每個選定的 harness 都會執行自己的 agent loop。

LiteLLM 為模型提供通用介面。LiteAgents 將這種做法帶到 agent harness，並透過 Temporal 提供原生控制與可選的持久性。

{/* truncate */}

## 只要變更一個欄位即可嘗試另一個 harness {#change-one-field-to-try-another-harness}

agent harness 會執行圍繞模型的迴圈：提供上下文、呼叫工具，以及決定何時繼續。不同的 harness 會以不同方式處理這項工作。您應該能夠在自己的任務上比較它們，而無需重建周邊應用程式。

在 LiteAgents 中，harness 是您個人資料中的一個欄位：

```python
import os
from liteagents import LiteAgentClient, LiteAgentOptions, ProfileOptions

profile = ProfileOptions(
    harness="deepagents",  # Try "claude-sdk", "codex", or "pydantic-ai".
    model="my-model",
    model_kwargs={
        "api_base": "https://your-gateway.example/v1",
        "api_key": os.environ["LITELLM_API_KEY"],
    },
)

options = LiteAgentOptions(profile=profile, tools=[lookup_order])
async with LiteAgentClient(options=options) as agent:
    async for message in agent.query("Check the status of order A123."):
        print(message)
```

此節錄使用您現有的 `lookup_order` 工具與 `LITELLM_API_KEY` 環境變數。將 `model` 設為您在閘道上設定的別名，並將 `api_base` 設為其端點。LiteAgents 會原樣傳送該別名；不需要路由前綴。安裝好您想嘗試的 harness 後，只要變更 `harness` 並執行相同的應用程式即可。

只安裝您計畫使用的 harness 整合。像 `[deepagents]` 這類額外套件會提供該 adapter 的相依性，並重複使用您 Python 環境中相容的套件。`[all]` 是用來嘗試每個整合的便利選項；OpenCode 也需要其可執行檔。變更個人資料即可選擇由哪個 harness 執行。

LiteAgents 會將您的工具、MCP 組態與事件調整為各個 harness 所需格式。無論您選擇哪個 harness，應用程式都會接收相同的 `AssistantMessage`、`UserMessage`，以及可選的串流 `TextDelta` 型別。LiteLLM 會在內部處理模型轉譯，因此切換 harness 時仍維持相同的模型連線。若有閘道，閘道會將您的模型別名路由到其提供者。若沒有閘道，請使用 LiteLLM `provider/model` 名稱與提供者憑證；LiteAgents 會透過 LiteLLM Python 函式庫呼叫該提供者。個人資料也可從 JSON 或 YAML 載入。

## 保留 harness 的原生控制項 {#keep-the-harnesss-native-controls}

每個 harness 仍會執行自己的 agent loop。透過 `harness_options`，您可以使用支援的原生設定，例如 Deep Agents 中介軟體與後端，或 Pydantic AI 工具逾時。

共用組態讓切換變得簡單；原生選項則可讓您調校所選的 harness。這些選項仍然是該 harness 專屬的，而您的模型必須支援您要求的設定。切換只會為新執行選定 harness；不會移轉正在進行中的原生工作階段。

## 在需要可持久執行時加入 Temporal {#add-temporal-when-you-need-durable-runs}

簡單的 agent 可在本機執行，而不需要 Temporal 或 PostgreSQL。當某個工作必須在 worker 重新啟動後繼續存在，或在用戶端中斷連線後仍持續執行時，請將 Temporal 加入個人資料並啟動 worker。您的應用程式會維持相同的用戶端 API。

可持久執行可在 worker 失敗後復原已記錄的作業與 checkpoint。您可以先在本機使用 SQLite，之後再改用自架 Temporal 或 Temporal Cloud。即使動作中斷後可能會重試，執行外部動作的工具仍需要冪等性。

## 在您的 agent 上試用 {#try-it-on-your-agent}

此 SDK 目前以預覽版提供。請遵循 [getting-started 指南](https://github.com/BerriAI/liteagents/blob/main/docs/getting-started.md)，或從 [最新預覽版發布](https://github.com/BerriAI/liteagents/releases/tag/v0.3.0a2) 安裝套件。

從 [harness-switching 食譜](https://github.com/BerriAI/liteagents/blob/main/cookbook/recipes/10_harness_switch.py) 開始。它會在全部六個 harness 選擇器上執行相同的模型、Python 工具、MCP 工具與後續追蹤。加入 `--temporal` 以使用可持久執行來嘗試相同任務。[食譜集合](https://github.com/BerriAI/liteagents/blob/main/cookbook/recipes/README.md) 也涵蓋串流、核准、子 agent 與 worker 復原。

在另一個 harness 上試試您的工作流程，並 [告訴我們結果如何](https://github.com/BerriAI/liteagents/issues)。
