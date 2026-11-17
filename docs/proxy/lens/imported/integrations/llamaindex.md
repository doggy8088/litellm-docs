---
title: "LlamaIndex"
description: "執行 LlamaIndex 範例，並將其代理程式追蹤送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/llamaindex"
sidebar_label: "LlamaIndex"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/llamaindex/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/llamaindex/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# LlamaIndex {#llamaindex}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用本儲存庫中的可執行範例，將 LlamaIndex 追蹤送到 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用已檢入版本的 Python，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/llamaindex
cp .env.example .env
```

如果您已經複製了儲存庫，請從 `llamaindex/` 執行剩餘指令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/llamaindex/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型金鑰                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 在您的閘道上已設定的模型別名                                                       |

檢入的值是針對本機開發閘道。請針對您的部署加以取代。請保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用追蹤金鑰作為 bearer token，將追蹤送到 `LENS_URL/v1/traces`。

除非您打算將額外的追蹤副本送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡易代理程式 {#simple-agent}

一個 `FunctionAgent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-llamaindex-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/llamaindex/simple/main.py)。

### 代理程式群組 {#agent-swarm}

一個 `AgentWorkflow` 會從 `research_agent` 交接到 `search_agent`，接著再到 `writer_agent`。

```bash
uv run --env-file .env --package lens-llamaindex-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/llamaindex/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢視輸入、輸出與模型 span。對於 swarm，請檢視上方所述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

在匯入框架之前，先啟用 LlamaIndex instrumentor。這些範例將程序標記為 research\_agent，並停用框架串流；專家名稱會出現在 workflow 與 handoff 資料中。

## 疑難排解 {#troubleshooting}

如果模型請求失敗，請檢查閘道 URL、金鑰和模型別名。如果已出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。模型請求成功不代表其追蹤匯出成功。

多個與模型相關的 span 可能代表一次模型請求。專家名稱與模型請求費用取決於框架匯出的屬性，以及閘道如何將其正規化。
