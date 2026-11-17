---
title: "Pydantic AI"
description: "執行 Pydantic AI 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/pydantic-ai"
sidebar_label: "Pydantic AI"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/pydantic-ai/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/pydantic-ai/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Pydantic AI {#pydantic-ai}

使用本儲存庫中的可執行範例，將 Pydantic AI 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

如需您的 coding agent 提供選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一筆真實的追蹤

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一起安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、一組具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取這些資訊。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用檢入的 Python 版本，並從其 uv workspace 解析每個範例的相依性。

## 設定 {#configuration}

全新 checkout 後：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/pydantic-ai
cp .env.example .env
```

如果您已經複製過此儲存庫，請從 `pydantic-ai/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/pydantic-ai/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數 | 值 |
| --- | --- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY` | 您的 LiteLLM 模型金鑰 |
| `LENS_URL` | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest` 請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY` | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL` | 在您的閘道上設定的模型別名 |

檢入的值是針對本機開發閘道。請針對您的部署加以替換。保留 `.env.example` 的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用追蹤金鑰作為 bearer token，將追蹤傳送至 `LENS_URL/v1/traces`

除非您打算另外將一份追蹤副本送至本機 [記錄器](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請保留 `MOCK_LITELLM_GATEWAY_URL` 為未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-pydantic-ai-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/pydantic-ai/simple/main.py)。

### 代理程式群組 {#agent-swarm}

一個協調器會透過工具委派給 `search_agent` 和 `writer_agent`。

```bash
uv run --env-file .env --package lens-pydantic-ai-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/pydantic-ai/swarm/main.py)。

### 串流 {#streaming}

設定 `LITELLM_STREAM=1` 以在任一範例中啟用串流：

```bash
LITELLM_STREAM=1 uv run --env-file .env --package lens-pydantic-ai-simple simple/main.py
```

## 驗證嘗試 {#validate-attempts}

`validate_attempts.py` 會透過由 `gateway_http_client(base_url, transport=...)` 包裝的故障注入傳輸執行簡單代理程式：

```bash
uv run --env-file .env --package lens-pydantic-ai-simple validate_attempts.py retry
uv run --env-file .env --package lens-pydantic-ai-simple validate_attempts.py response-loss
```

重試情境會將第一個真實計費回應替換為用戶端 HTTP 503，讓 OpenAI 用戶端（`max_retries=1`）重試一次：兩個 `gateway.request` span、兩筆支出記錄。回應遺失情境會消耗真實計費回應，並讓用戶端串流失敗且不重試：一次嘗試、一筆支出記錄、一次失敗的執行。這兩種情境都不會改變閘道或提供者的行為。

## 驗證追蹤 {#verify-the-trace}

在範例列印出其答案後，請在您的閘道上開啟 **Lens > Traces** 並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，檢查上述描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

Pydantic AI 會透過 Agent.instrument\_all() 發出代理程式、工具與模型 span。共享閘道傳輸會記錄請求嘗試與閘道呼叫 ID，以便將模型呼叫與支出配對。

有關請求嘗試與支出關聯的詳細資訊，請參閱 [共享閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md)。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與模型別名。如果答案已出現但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 擷取服務。模型呼叫成功並不代表其追蹤匯出也成功。
