---
title: "DeepAgents"
description: "執行 DeepAgents 範例並將其 agent trace 傳送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/deepagents"
sidebar_label: "DeepAgents"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/deepagents/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/deepagents/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# DeepAgents {#deepagents}

使用此存放庫中的可執行範例，將 DeepAgents trace 傳送到 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個啟用 [tracing](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的 model alias。swarm 範例需要支援 tool call 的模型。進行調查時需要 Lens worker；檢視 trace 不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv workspace 解決每個範例的相依性。

## 設定 {#configuration}

對於全新的 checkout：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/deepagents
cp .env.example .env
```

如果您已經複製了該存放庫，請從 `deepagents/` 執行其餘命令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/deepagents/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 已在您的閘道上設定的 model alias                                                       |

已檢入的值會指向本機開發閘道。請在您的部署中將它們替換掉。保留 `.env.example` 中的 exporter 設定；這些範例會在程式碼中設定其 trace exporter。它們會使用 LiteLLM 金鑰作為 bearer token，將 trace 傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算將額外的一份 trace 複本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請勿設定 `MOCK_LITELLM_GATEWAY_URL`。

## 執行範例 {#run-an-example}

### 單一 agent {#simple-agent}

單一 deep agent 會回答一個問題。

```bash
uv run --env-file .env --package lens-deepagents-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/deepagents/simple/main.py)。

### agent swarm {#agent-swarm}

協調器會透過內建的 `task` 工具，將工作委派給 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-deepagents-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/deepagents/swarm/main.py)。

## 驗證 trace {#verify-the-trace}

在範例印出回答後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上方所述的專家活動；其精確的 span 版面配置取決於框架。

## tracing 的運作方式 {#how-tracing-works}

OpenInference 會為 DeepAgents 使用的 LangChain 執行進行 instrumentation。這些範例明確使用 Responses API；subagent 執行會巢狀地位於協調器的 task tool call 之下。

## 疑難排解 {#troubleshooting}

如果 model call 失敗，請檢查閘道 URL、金鑰與 model alias。如果已出現回答但 trace 不見了，請檢查終端機中的 exporter 錯誤，並確認同一個閘道已啟用 tracing。model call 成功不代表其 trace 匯出成功。

請使用支援 Responses API 與 tool call 的閘道 model alias。
