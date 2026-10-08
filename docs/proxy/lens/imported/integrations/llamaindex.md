---
title: "LlamaIndex"
description: "執行 LlamaIndex 範例，並將其代理程式追蹤送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/llamaindex"
sidebar_label: "LlamaIndex"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/llamaindex/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/llamaindex/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# LlamaIndex {#llamaindex}

使用本儲存庫中的可執行範例，將 LlamaIndex 追蹤送到 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用[追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy)的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；檢視追蹤不需要。

安裝 uv。它會使用已檢入版本的 Python，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/llamaindex
cp .env.example .env
```

如果您已經複製了儲存庫，請從 `llamaindex/` 執行剩餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/llamaindex/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上已設定的模型別名                                                       |

檢入的值是針對本機開發閘道。請針對您的部署加以取代。請保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤送到 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算將額外的追蹤副本送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡易代理程式 {#simple-agent}

一個 `FunctionAgent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-llamaindex-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/llamaindex/simple/main.py)。

### 代理程式群組 {#agent-swarm}

一個 `AgentWorkflow` 會從 `research_agent` 交接到 `search_agent`，接著再到 `writer_agent`。

```bash
uv run --env-file .env --package lens-llamaindex-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/llamaindex/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢視輸入、輸出與模型 span。對於 swarm，請檢視上方所述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

在匯入框架之前，先啟用 LlamaIndex instrumentor。這些範例將程序標記為 research\_agent，並停用框架串流；專家名稱會出現在 workflow 與 handoff 資料中。

## 疑難排解 {#troubleshooting}

如果模型請求失敗，請檢查閘道 URL、金鑰和模型別名。如果已出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認在同一個閘道上已啟用追蹤。模型請求成功不代表其追蹤匯出成功。

多個與模型相關的 span 可能代表一次模型請求。專家名稱與模型請求費用取決於框架匯出的屬性，以及閘道如何將其正規化。
