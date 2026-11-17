---
title: "DeepAgents"
description: "執行 DeepAgents 範例並將其 agent trace 傳送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/deepagents"
sidebar_label: "DeepAgents"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/deepagents/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/deepagents/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# DeepAgents {#deepagents}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用此存放庫中的可執行範例，將 DeepAgents trace 傳送到 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用已檢入的 Python 版本，並從其 uv workspace 解決每個範例的相依性。

## 設定 {#configuration}

對於全新的 checkout：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/deepagents
cp .env.example .env
```

如果您已經複製了該存放庫，請從 `deepagents/` 執行其餘命令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/deepagents/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型金鑰                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 已在您的閘道上設定的 model alias                                                       |

已檢入的值會指向本機開發閘道。請在您的部署中將它們替換掉。保留 `.env.example` 中的 exporter 設定；這些範例會在程式碼中設定其 trace exporter。它們會使用追蹤金鑰作為 bearer token，將 trace 傳送至 `LENS_URL/v1/traces`。

除非您打算將額外的一份 trace 複本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請勿設定 `MOCK_LITELLM_GATEWAY_URL`。

## 執行範例 {#run-an-example}

### 單一 agent {#simple-agent}

單一 deep agent 會回答一個問題。

```bash
uv run --env-file .env --package lens-deepagents-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/deepagents/simple/main.py)。

### agent swarm {#agent-swarm}

協調器會透過內建的 `task` 工具，將工作委派給 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-deepagents-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/deepagents/swarm/main.py)。

## 驗證 trace {#verify-the-trace}

在範例印出回答後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上方所述的專家活動；其精確的 span 版面配置取決於框架。

## tracing 的運作方式 {#how-tracing-works}

OpenInference 會為 DeepAgents 使用的 LangChain 執行進行 instrumentation。這些範例明確使用 Responses API；subagent 執行會巢狀地位於協調器的 task tool call 之下。

## 疑難排解 {#troubleshooting}

如果 model call 失敗，請檢查閘道 URL、金鑰與 model alias。如果已出現回答但 trace 不見了，請檢查終端機中的 exporter 錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。model call 成功不代表其 trace 匯出成功。

請使用支援 Responses API 與 tool call 的閘道 model alias。
