---
title: "OpenAI Agents SDK"
description: "執行 OpenAI Agents SDK 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/openai-agents"
sidebar_label: "OpenAI Agents SDK"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/openai-agents/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/openai-agents/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# OpenAI Agents SDK {#openai-agents-sdk}

使用本倉庫中的可執行範例，將 OpenAI Agents SDK 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

如需您的 coding agent 提供選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一筆真實的追蹤

## 必要條件 {#prerequisites}

您需要 [Lens](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md)，可獨立搭配 ClickHouse 執行，或連接到 LiteLLM。如果設定面板尚未開啟，請開啟 **Traces** 並選擇 **Set up tracing**。然後建立一組追蹤金鑰，並複製 **Traces endpoint**。請將提供者憑證與該遙測金鑰分開保存。這些範例支援直接呼叫 OpenAI，或透過現有的 LiteLLM 閘道呼叫

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用檢入的 Python 版本，並從其 uv workspace 解析每個範例的相依性。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/openai-agents
cp .env.direct.example .env
```

如果您已經複製過此儲存庫，請從 `openai-agents/` 執行其餘指令。若要直接呼叫提供者，請在 `.env` 中設定 `OPENAI_API_KEY` 與 `OPENAI_MODEL`，然後依下文所述設定 `LENS_URL` 與 `LENS_TRACING_KEY`。請讓 `LITELLM_GATEWAY_URL` 保持未設定。您的模型請求會送往 OpenAI，遙測則送往 Lens

若要透過閘道呼叫，請改用 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/openai-agents/.env.example)，並設定三個 `LITELLM_*` 值。這些範例保留了閘道的請求嘗試與支出關聯行為

| 變數 | 值 |
| --- | --- |
| `OPENAI_API_KEY` | 您用於直接呼叫的提供者憑證 |
| `OPENAI_MODEL` | 用於直接呼叫的提供者模型名稱 |
| `OPENAI_BASE_URL` | 選擇性的 OpenAI 相容提供者基礎 URL；當該提供者需要時，包含 `/v1` |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY` | 您的 LiteLLM 模型金鑰 |
| `LENS_URL` | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest` 請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY` | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL` | 在您的 LiteLLM 閘道上設定的模型別名 |

閘道範本是針對本機開發閘道。請針對您的部署替換其模型連線值。這些範例會在程式碼中設定其追蹤匯出器，並明確取代 SDK 預設的 OpenAI 追蹤匯出器。它們會使用追蹤金鑰作為 bearer token，將追蹤傳送至 `LENS_URL/v1/traces`

除非您打算另外將一份追蹤副本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請讓 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

`research_agent` 會在 `research_workflow` 中回答一個問題。

```bash
uv run --env-file .env --package lens-openai-agents-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/openai-agents/simple/main.py)。

### 代理程式群 {#agent-swarm}

協調器會透過 agents-as-tools 呼叫 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-openai-agents-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/openai-agents/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您獨立或內嵌的 Lens UI 中開啟 **Lens > Traces**，並選取新的執行。尋找 `research_workflow` 及其 `research_agent` span。檢查輸入、輸出與模型 spans。對於 swarm，請檢查上述描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

OpenInference 會將 SDK 代理程式與 Responses API spans 匯出至 Lens。設定閘道時，共用的閘道傳輸會記錄每個實體模型請求及其閘道呼叫 ID，包括重試。

請參閱 [shared gateway transport](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md) 以了解請求嘗試與花費關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查提供者金鑰與模型名稱；使用閘道時，請檢查閘道 URL、模型金鑰與別名。如果已出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 擷取服務。模型呼叫成功，不代表其追蹤匯出也成功。

請使用支援 Responses API 的模型。swarm 還需要工具呼叫。
