---
title: "Pydantic AI"
description: "執行 Pydantic AI 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/pydantic-ai"
sidebar_label: "Pydantic AI"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/pydantic-ai/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/pydantic-ai/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Pydantic AI {#pydantic-ai}

使用本儲存庫中的可執行範例，將 Pydantic AI 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一個 LiteLLM 金鑰，以及已設定的 model alias。swarm 範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；僅檢視追蹤不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv workspace 解決每個範例的相依性。

## 設定 {#configuration}

全新 checkout 後：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/pydantic-ai
cp .env.example .env
```

如果您已經 clone 了儲存庫，請從 `pydantic-ai/` 執行剩餘命令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/pydantic-ai/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基底 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上已設定的 model alias                                                       |

檢入的值目標為本機開發閘道。請針對您的部署加以替換。保留 `.env.example` 的 exporter 設定；這些範例會在程式碼中設定其 trace exporter。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算另外將一份追蹤副本送至本機 [記錄器](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請保留 `MOCK_LITELLM_GATEWAY_URL` 為未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-pydantic-ai-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/pydantic-ai/simple/main.py)。

### 代理程式群組 {#agent-swarm}

一個協調器會透過工具委派給 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-pydantic-ai-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/pydantic-ai/swarm/main.py)。

### 串流 {#streaming}

設定 `LITELLM_STREAM=1` 以在任一範例中啟用串流：

```bash
LITELLM_STREAM=1 uv run --env-file .env --package lens-pydantic-ai-simple simple/main.py
```

## 驗證追蹤 {#verify-the-trace}

在範例列印出其答案後，請在您的閘道上開啟 **Lens > Traces** 並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，檢查上述描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

Pydantic AI 會透過 Agent.instrument\_all() 發出代理程式、工具與模型 span。共享閘道傳輸會記錄請求嘗試與閘道呼叫 ID，以便將模型呼叫與支出配對。

有關請求嘗試與支出關聯的詳細資訊，請參閱 [共享閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md)。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與 model alias。如果答案已出現但追蹤遺失，請檢查終端機中的 exporter 錯誤，並確認在同一個閘道上已啟用追蹤。模型呼叫成功並不代表其追蹤匯出也成功。
