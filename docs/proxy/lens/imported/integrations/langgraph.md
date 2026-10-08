---
title: "LangGraph"
description: "執行 LangGraph 範例，並將其 agent trace 傳送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/langgraph"
sidebar_label: "LangGraph"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/langgraph/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/langgraph/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# LangGraph {#langgraph}

使用此存放庫中的可執行範例，將 LangGraph trace 傳送到 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個啟用 [tracing](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一個 LiteLLM key，以及已設定的 model alias。進行調查時需要 Lens worker；檢視 trace 則不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv workspace 解決每個範例的依賴項。

## 設定 {#configuration}

全新檢出後：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/langgraph
cp .env.example .env
```

如果您已經複製了存放庫，請從 `langgraph/` 執行其餘命令。如果 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/langgraph/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道 base URL，不要以尾端斜線或 `/v1` 結尾，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM key                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的 model alias                                                       |

已檢入的值是針對本機開發用閘道。請在您的部署中替換它們。請保留 `.env.example` 中的 exporter 設定；範例會在程式碼中設定其 trace exporter。它們會使用 LiteLLM key 作為 bearer token，將 trace 傳送到 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份 trace 複本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單 agent {#simple-agent}

單一節點圖會回答一個問題。

```bash
uv run --env-file .env --package lens-langgraph-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/langgraph/simple/main.py)。

### agent 群 {#agent-swarm}

`research_agent` 圖會執行 `search_agent` 和 `writer_agent` 子圖。

```bash
uv run --env-file .env --package lens-langgraph-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/langgraph/swarm/main.py)。

## 驗證 trace {#verify-the-trace}

範例印出其答案後，請在您的閘道上開啟 **Lens > Traces** 並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出和模型 span。對於 swarm，請檢查上文所述的專家活動；其確切的 span 版面配置取決於 framework。

## tracing 的運作方式 {#how-tracing-works}

OpenInference 會為編譯後的圖及其節點進行 instrumentation。每個專家都是編譯後的子圖；其包裝器節點使用不同名稱，以避免將同一個 agent 計算兩次。

## 疑難排解 {#troubleshooting}

如果 model 呼叫失敗，請檢查閘道 URL、key 和 model alias。如果有答案出現但 trace 缺失，請檢查終端機中的 exporter 錯誤，並確認在同一個閘道上已啟用 tracing。model 呼叫成功不代表其 trace 匯出也成功。
