---
title: "Strands Agents"
description: "執行 Strands Agents 範例，並將其 agent trace 傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/strands"
sidebar_label: "Strands Agents"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/strands/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/strands/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Strands Agents {#strands-agents}

使用本儲存庫中的可執行範例，將 Strands Agents trace 傳送至 [LiteLLM Lens](/docs/proxy/lens)。

如需您的 coding agent 提供選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一筆真實的追蹤

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一起安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、一組具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取這些資訊。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用檢入的 Python 版本，並從其 uv workspace 解析每個範例的相依性。

## 設定 {#configuration}

若為全新的檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/strands
cp .env.example .env
```

如果您已經複製過此儲存庫，請從 `strands/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/strands/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數 | 值 |
| --- | --- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY` | 您的 LiteLLM 模型金鑰 |
| `LENS_URL` | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest` 請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY` | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL` | 在您的閘道上設定的模型別名 |

檢入的值是針對本機開發閘道。請針對您的部署加以替換。保留 `.env.example` 的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用追蹤金鑰作為 bearer token，將追蹤傳送至 `LENS_URL/v1/traces`

除非您打算額外將一份 trace 複本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-strands-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/strands/simple/main.py)。

### 代理程式群集 {#agent-swarm}

一個協調器會將 `search_agent` 和 `writer_agent` 作為工具來呼叫。

```bash
uv run --env-file .env --package lens-strands-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/strands/swarm/main.py)。

## 驗證 trace {#verify-the-trace}

在範例印出回應之後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查 input、output 和 model spans。對於 swarm，檢查上述描述的專家活動；其精確的 span 佈局取決於 framework。

## tracing 的運作方式 {#how-tracing-works}

Strands 會匯出 agent、tool 和 model spans。共用的閘道 HTTP client 會在 model spans 下記錄請求嘗試，包括串流回應與重試的閘道呼叫 ID。

請參閱 [共用的閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md)，以了解 request-attempt 與 spend-correlation 的細節。

使用 `uv run --env-file .env --package lens-strands-simple validate_attempts.py retry` 或 `... response-loss`，針對真實閘道驗證重試與計費回應遺失。驅動程式會將真實的 `httpx` 傳輸包裝在故障注入傳輸中，並以 `gateway_http_client(base_url, transport=...)` 傳入。重試情境會讀取第一個真實計費回應，並將其替換為用戶端 HTTP 503，讓 OpenAI 用戶端重試一次，產生兩個 `gateway.request` span 與兩筆支出記錄。回應遺失情境會保留真實的狀態與標頭，但在計費本文被消耗後讓串流失敗，產生一次出錯的嘗試，其支出記錄仍可解析。這兩種情境都不會改變閘道或提供者的行為。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與模型別名。如果答案已出現但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 擷取服務。模型呼叫成功並不代表其追蹤匯出也成功。

當 Strands 在範例已經初始化 threading instrumentation 之後才初始化它時，可能會出現「Attempting to instrument while already instrumented」警告。
