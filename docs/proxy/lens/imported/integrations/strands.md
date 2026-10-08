---
title: "Strands Agents"
description: "執行 Strands Agents 範例，並將其 agent trace 傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/strands"
sidebar_label: "Strands Agents"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/strands/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/strands/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Strands Agents {#strands-agents}

使用本儲存庫中的可執行範例，將 Strands Agents trace 傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [tracing](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、LiteLLM 金鑰，以及已設定的 model alias。swarm 範例需要支援 tool calls 的模型。進行調查時需要 Lens worker；檢視 trace 不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv workspace 解析每個範例的依賴項。

## 設定 {#configuration}

若為全新的檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/strands
cp .env.example .env
```

如果您已經複製了儲存庫，請從 `strands/` 執行其餘命令。將 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/strands/.env.example) 複製為 `.env`（如果不存在），然後設定：

| 變數              | 值                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，且不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的 model alias                                                       |

已檢入的值是針對本機開發閘道。請在您的部署中加以取代。保留 `.env.example` 中的 exporter 設定；範例會在程式碼中設定其 trace exporter。它們會使用 LiteLLM 金鑰作為 bearer token，將 trace 傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份 trace 複本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-strands-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/strands/simple/main.py)。

### 代理程式群集 {#agent-swarm}

一個協調器會將 `search_agent` 和 `writer_agent` 作為工具來呼叫。

```bash
uv run --env-file .env --package lens-strands-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/strands/swarm/main.py)。

## 驗證 trace {#verify-the-trace}

在範例印出回應之後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查 input、output 和 model spans。對於 swarm，檢查上述描述的專家活動；其精確的 span 佈局取決於 framework。

## tracing 的運作方式 {#how-tracing-works}

Strands 會匯出 agent、tool 和 model spans。共用的閘道 HTTP client 會在 model spans 下記錄請求嘗試，包括串流回應與重試的閘道呼叫 ID。

請參閱 [共用的閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md)，以了解 request-attempt 與 spend-correlation 的細節。

## 疑難排解 {#troubleshooting}

如果 model 呼叫失敗，請檢查閘道 URL、金鑰和 model alias。如果已出現回應但 trace 遺失，請檢查終端機中的 exporter 錯誤，並確認在同一個閘道上已啟用 tracing。model 呼叫成功並不代表其 trace 匯出也成功。

當 Strands 在範例已經初始化 threading instrumentation 之後才初始化它時，可能會出現「Attempting to instrument while already instrumented」警告。
