---
title: "OpenTelemetry"
description: "執行 OpenTelemetry 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/opentelemetry"
sidebar_label: "OpenTelemetry"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/opentelemetry/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/opentelemetry/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# OpenTelemetry {#opentelemetry}

使用本儲存庫中的可執行範例，將 OpenTelemetry 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

如需您的 coding agent 提供選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一筆真實的追蹤

## 必要條件 {#prerequisites}

您需要 [Lens](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md)，可獨立搭配 ClickHouse 執行，或連接到 LiteLLM。如果設定面板尚未開啟，請開啟 **Traces** 並選擇 **Set up tracing**。然後建立一組追蹤金鑰，並複製 **Traces endpoint**。請將提供者憑證與該遙測金鑰分開保存。這些範例支援直接呼叫 OpenAI，或透過現有的 LiteLLM 閘道呼叫

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用檢入的 Python 版本，並從其 uv workspace 解析每個範例的相依性。

## 設定 {#configuration}

對於新的 checkout：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/opentelemetry
cp .env.direct.example .env
```

如果您已經複製過此儲存庫，請從 `opentelemetry/` 執行其餘指令。若要直接呼叫提供者，請在 `.env` 中設定 `OPENAI_API_KEY` 與 `OPENAI_MODEL`，然後依下文所述設定 `LENS_URL` 與 `LENS_TRACING_KEY`。請讓 `LITELLM_GATEWAY_URL` 保持未設定。您的模型請求會送往 OpenAI，遙測則送往 Lens

若要透過閘道呼叫，請改用 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/opentelemetry/.env.example)，並設定三個 `LITELLM_*` 值。這些範例保留了閘道的請求嘗試與支出關聯行為

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

檢入的值是針對本機開發閘道。請針對您的部署加以替換。保留 `.env.example` 的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用追蹤金鑰作為 bearer token，將追蹤傳送至 `LENS_URL/v1/traces`

除非您打算額外將一份追蹤複本送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請保持 `MOCK_LITELLM_GATEWAY_URL` 未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個手動的 `research_agent` span 包覆一次 OpenAI 模型呼叫。

```bash
uv run --env-file .env --package lens-opentelemetry-simple simple/main.py
```

請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/opentelemetry/simple/main.py) 以了解實作。

### 代理程式群集 {#agent-swarm}

一個 `research_agent` span 包含 `search_agent` 和 `writer_agent` 子 span，每個都會進行一次模型呼叫。

```bash
uv run --env-file .env --package lens-opentelemetry-swarm swarm/main.py
```

請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/opentelemetry/swarm/main.py) 以了解實作。

## 驗證追蹤 {#verify-the-trace}

在範例列印出其答案後，請在您獨立或內嵌的 Lens UI 中開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢視輸入、輸出，以及模型 span。對於 swarm，請檢視上述描述的專家活動；其確切的 span 版面配置取決於該框架。

## 追蹤如何運作 {#how-tracing-works}

這些範例會手動建立代理程式 span，並設定其名稱、輸入與輸出。OpenInference 會對 OpenAI 用戶端加上 instrument；設定閘道時，共用的閘道傳輸會加入帶有閘道呼叫 ID 的請求嘗試 span。

請參閱 [共用的閘道 transport](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md) 以取得 request-attempt 與 spend-correlation 的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查提供者金鑰與模型名稱；使用閘道時，請檢查閘道 URL、模型金鑰與別名。如果已出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 擷取服務。模型呼叫成功，不代表其追蹤匯出也成功。
