---
title: "Google ADK"
description: "執行 Google ADK 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/google-adk"
sidebar_label: "Google ADK"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/google-adk/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/google-adk/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Google ADK {#google-adk}

使用本儲存庫中的可執行範例，將 Google ADK 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的模型別名。群集範例需要支援工具呼叫的模型。調查時需要 Lens worker；檢視追蹤不需要。

安裝 uv。它會使用檢查入庫的 Python 版本，並從其 uv workspace 解析每個範例的相依項目。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/google-adk
cp .env.example .env
```

如果您已經複製了此儲存庫，請從 `google-adk/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/google-adk/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| Variable              | Value                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

檢查入庫的值是針對本機開發閘道。請為您的部署替換它們。保留 `.env.example` 的 exporter 設定；這些範例會在程式碼中設定其追蹤 exporter。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份追蹤副本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### Simple agent {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-google-adk-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/google-adk/simple/main.py)。

### Agent swarm {#agent-swarm}

一個協調器會將 `search_agent` 和 `writer_agent` 作為 AgentTool 工具來呼叫。

```bash
uv run --env-file .env --package lens-google-adk-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/google-adk/swarm/main.py)。

### Streaming {#streaming}

在任一範例中設定 `LITELLM_STREAM=1` 即可啟用串流：

```bash
LITELLM_STREAM=1 uv run --env-file .env --package lens-google-adk-simple simple/main.py
```

## 驗證追蹤 {#verify-the-trace}

範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。找出與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上述所描述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

OpenInference 會對 ADK 呼叫、代理程式、模型呼叫與工具進行監測。共享閘道傳輸會在模型呼叫下記錄請求嘗試次數與閘道呼叫 ID。

請參閱 [共享閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md) 以了解請求嘗試與支出關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果答案已顯示但追蹤缺失，請檢查終端機中的 exporter 錯誤，並確認在同一個閘道上已啟用追蹤。模型呼叫成功並不代表其追蹤匯出也成功。
