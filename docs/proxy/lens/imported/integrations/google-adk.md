---
title: "Google ADK"
description: "執行 Google ADK 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/google-adk"
sidebar_label: "Google ADK"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/google-adk/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/google-adk/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Google ADK {#google-adk}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用本儲存庫中的可執行範例，將 Google ADK 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用檢查入庫的 Python 版本，並從其 uv workspace 解析每個範例的相依項目。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/google-adk
cp .env.example .env
```

如果您已經複製了此儲存庫，請從 `google-adk/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/google-adk/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| Variable              | Value                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型金鑰                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

檢查入庫的值是針對本機開發閘道。請為您的部署替換它們。保留 `.env.example` 的 exporter 設定；這些範例會在程式碼中設定其追蹤 exporter。它們會使用追蹤金鑰作為 bearer token，將追蹤傳送至 `LENS_URL/v1/traces`。

除非您打算額外將一份追蹤副本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### Simple agent {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-google-adk-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/google-adk/simple/main.py)。

### Agent swarm {#agent-swarm}

一個協調器會將 `search_agent` 和 `writer_agent` 作為 AgentTool 工具來呼叫。

```bash
uv run --env-file .env --package lens-google-adk-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/google-adk/swarm/main.py)。

### Streaming {#streaming}

在任一範例中設定 `LITELLM_STREAM=1` 即可啟用串流：

```bash
LITELLM_STREAM=1 uv run --env-file .env --package lens-google-adk-simple simple/main.py
```

### 請求嘗試驗證 {#request-attempt-validation}

`validate_attempts.py` 會透過傳遞給 `gateway_http_client(transport=...)` 的故障注入 `httpx` transport 執行 simple agent，以檢查計費嘗試如何關聯。`retry` 會在讀取第一個成功的閘道回應本文後將其轉為 503，因此 OpenAI 用戶端會重試一次，且 trace 中會包含兩個 `gateway.request` span 與兩筆支出記錄。`response-loss` 會保留真實的狀態與標頭，但讓本文串流失敗，因此單一計費嘗試會被記錄為用戶端錯誤，而其支出仍會被解析。

```bash
uv run --env-file .env --package lens-google-adk-simple validate_attempts.py retry
uv run --env-file .env --package lens-google-adk-simple validate_attempts.py response-loss
```

## 驗證追蹤 {#verify-the-trace}

範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。找出與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上述所描述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

OpenInference 會對 ADK 呼叫、代理程式、模型呼叫與工具進行監測。共享閘道傳輸會在模型呼叫下記錄請求嘗試次數與閘道呼叫 ID。

請參閱 [共享閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md) 以了解請求嘗試與支出關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果答案已顯示但追蹤缺失，請檢查終端機中的 exporter 錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。模型呼叫成功並不代表其追蹤匯出也成功。
