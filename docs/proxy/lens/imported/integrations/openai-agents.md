---
title: "OpenAI Agents SDK"
description: "執行 OpenAI Agents SDK 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/openai-agents"
sidebar_label: "OpenAI Agents SDK"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/openai-agents/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/openai-agents/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# OpenAI Agents SDK {#openai-agents-sdk}

使用本倉庫中的可執行範例，將 OpenAI Agents SDK 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [tracing](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。調查時需要 Lens worker；檢視追蹤不需要。

請安裝 uv。它會使用檢入的 Python 版本，並從其 uv workspace 解析每個範例的相依性。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/openai-agents
cp .env.example .env
```

如果您已經複製過此儲存庫，請從 `openai-agents/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/openai-agents/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

檢入的值是針對本機開發閘道。請針對您的部署加以替換。保留 `.env.example` 的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算另外將一份追蹤副本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請讓 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

`research_agent` 會在 `research_workflow` 中回答一個問題。

```bash
uv run --env-file .env --package lens-openai-agents-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/openai-agents/simple/main.py)。

### 代理程式群 {#agent-swarm}

協調器會透過 agents-as-tools 呼叫 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-openai-agents-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/openai-agents/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找 `research_workflow` 及其 `research_agent` span。檢查輸入、輸出與模型 spans。對於 swarm，請檢查上述描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

OpenInference 會將 SDK 代理程式與 Responses API spans 匯出至 LiteLLM。共用的閘道傳輸會記錄每個實體模型請求及其閘道呼叫 ID，包括重試。

請參閱 [shared gateway transport](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md) 以了解請求嘗試與花費關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果已出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認同一個閘道上已啟用 tracing。模型呼叫成功，不代表其追蹤匯出也成功。

請使用支援 Responses API 與工具呼叫的閘道模型別名。
