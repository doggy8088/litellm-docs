---
title: "OpenTelemetry"
description: "執行 OpenTelemetry 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/opentelemetry"
sidebar_label: "OpenTelemetry"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/opentelemetry/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/opentelemetry/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# OpenTelemetry {#opentelemetry}

使用本儲存庫中的可執行範例，將 OpenTelemetry 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [追蹤功能](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一個 LiteLLM key，以及已設定的模型別名。進行調查時需要 Lens worker；僅檢視追蹤不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv workspace 解決每個範例的相依性。

## 設定 {#configuration}

對於新的 checkout：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/opentelemetry
cp .env.example .env
```

如果您已經 clone 了儲存庫，請從 `opentelemetry/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/opentelemetry/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道 base URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM key                                                                               |
| `LITELLM_MODEL`       | 您閘道上已設定的模型別名                                                       |

檢入的值是針對本機開發閘道。請將它們替換為您的部署設定。保留 `.env.example` 中的 exporter 設定；這些範例會在程式碼中設定其追蹤 exporter。它們會使用 LiteLLM key 作為 bearer token，將追蹤送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份追蹤複本送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請保持 `MOCK_LITELLM_GATEWAY_URL` 未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個手動的 `research_agent` span 包覆一次 OpenAI 模型呼叫。

```bash
uv run --env-file .env --package lens-opentelemetry-simple simple/main.py
```

請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/opentelemetry/simple/main.py) 以了解實作。

### 代理程式群集 {#agent-swarm}

一個 `research_agent` span 包含 `search_agent` 和 `writer_agent` 子 span，每個都會進行一次模型呼叫。

```bash
uv run --env-file .env --package lens-opentelemetry-swarm swarm/main.py
```

請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/opentelemetry/swarm/main.py) 以了解實作。

## 驗證追蹤 {#verify-the-trace}

在範例列印出其答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢視輸入、輸出，以及模型 span。對於 swarm，請檢視上述描述的專家活動；其確切的 span 版面配置取決於該框架。

## 追蹤如何運作 {#how-tracing-works}

這些範例會手動建立代理程式 span，並設定其名稱、輸入與輸出。OpenInference 會對 OpenAI client 加上 instrument，且共用的閘道 transport 會加入帶有閘道 call ID 的 request-attempt span。

請參閱 [共用的閘道 transport](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md) 以取得 request-attempt 與 spend-correlation 的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、key，以及模型別名。如果有看到答案但缺少追蹤，請檢查終端機中的 exporter 錯誤，並確認同一個閘道上已啟用追蹤功能。模型呼叫成功，不代表其追蹤匯出也成功。
