---
title: "Vercel AI SDK (Python)"
description: "執行 Vercel AI SDK (Python) 範例，並將其代理程式追蹤傳送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/vercel-ai-sdk-py"
sidebar_label: "Vercel AI SDK (Python)"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/vercel-ai-sdk-py/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/vercel-ai-sdk-py/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Vercel AI SDK (Python) {#vercel-ai-sdk-python}

使用本儲存庫中的可執行範例，將 Vercel AI SDK (Python) 追蹤傳送到 [LiteLLM Lens](/docs/proxy/lens)。

## 先決條件 {#prerequisites}

您需要一個已啟用[追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy)的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的模型別名。群蜂範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；檢視追蹤不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新的檢出版本：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/vercel-ai-sdk-py
cp .env.example .env
```

如果您已經複製了儲存庫，請從 `vercel-ai-sdk-py/` 執行其餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/vercel-ai-sdk-py/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，結尾不要有斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

已檢入的值會指向本機開發閘道。請將其替換為您的部署。保留 `.env.example` 的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用 LiteLLM 金鑰作為持有人權杖，將追蹤傳送到 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份追蹤副本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請讓 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會使用 Python ai 套件回答一個問題。

```bash
uv run --env-file .env --package lens-vercel-ai-sdk-py-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/vercel-ai-sdk-py/simple/main.py)。

### 代理程式群蜂 {#agent-swarm}

協調器會透過執行 `search_agent` 和 `writer_agent` 的工具進行委派。

```bash
uv run --env-file .env --package lens-vercel-ai-sdk-py-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/vercel-ai-sdk-py/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出其答案後，請在您的閘道上開啟 **Lens > Traces**，然後選取新的執行。尋找與 `research_agent` 相關聯的執行。檢視輸入、輸出和模型 span。對於群蜂，請檢視上方所述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

Python ai 套件的實驗性 telemetry adapter 會匯出代理程式、工具和模型 span。本機 adapter 會將模型 span 保留在作用中文內文中，因此共用閘道傳輸可以在其下方巢狀排列 request-attempt span。

請參閱 [shared gateway transport](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md) 以了解 request-attempt 和 spend-correlation 的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果答案有出現但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認同一個閘道上已啟用追蹤。模型呼叫成功不代表其追蹤匯出也成功。

此範例使用 Python ai 套件及其實驗性 telemetry API。其相依性與設定方式與 TypeScript 範例不同。
