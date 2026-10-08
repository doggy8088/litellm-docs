---
title: "LangChain"
description: "執行 LangChain 範例並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/langchain"
sidebar_label: "LangChain"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/langchain/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/langchain/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# LangChain {#langchain}

使用本儲存庫中的可執行範例，將 LangChain 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用[追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy)的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；檢視追蹤不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新的 checkout：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/langchain
cp .env.example .env
```

如果您已經複製過該儲存庫，請從 `langchain/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/langchain/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基底 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 您的閘道上已設定的模型別名                                                       |

已檢入的值是針對本機開發閘道。請將它們替換為您的部署值。保留 `.env.example` 中的 exporter 設定；這些範例會在程式碼中設定其追蹤 exporter。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算將額外的追蹤副本傳送至本機[記錄器](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請勿設定 `MOCK_LITELLM_GATEWAY_URL`。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個使用 `create_agent` 建立的 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-langchain-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/langchain/simple/main.py)。

### 代理程式 swarm {#agent-swarm}

一個協調器透過搜尋與寫入工具呼叫 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-langchain-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/langchain/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，於您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 spans。對於 swarm，檢查上文所述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

OpenInference 會為 LangChain 執行進行儀器化。每個 create\_agent 圖都有明確的名稱，而委派的執行會繼承協調器的追蹤內容。

## 疑難排解 {#troubleshooting}

如果模型請求失敗，請檢查閘道 URL、金鑰和模型別名。如果答案出現但追蹤遺失，請檢查終端機中的 exporter 錯誤，並確認相同閘道上已啟用追蹤。模型請求成功並不表示其追蹤匯出也成功。
