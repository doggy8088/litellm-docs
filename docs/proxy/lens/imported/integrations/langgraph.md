---
title: "LangGraph"
description: "執行 LangGraph 範例，並將其 agent trace 傳送到 LiteLLM Lens。"
slug: "/proxy/lens/integrations/langgraph"
sidebar_label: "LangGraph"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/langgraph/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/langgraph/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# LangGraph {#langgraph}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用此存放庫中的可執行範例，將 LangGraph trace 傳送到 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用已檢入的 Python 版本，並從其 uv workspace 解決每個範例的依賴項。

## 設定 {#configuration}

全新檢出後：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/langgraph
cp .env.example .env
```

如果您已經複製了存放庫，請從 `langgraph/` 執行其餘命令。如果 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/langgraph/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道 base URL，不要以尾端斜線或 `/v1` 結尾，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型key                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 在您的閘道上設定的 model alias                                                       |

已檢入的值是針對本機開發用閘道。請在您的部署中替換它們。請保留 `.env.example` 中的 exporter 設定；範例會在程式碼中設定其 trace exporter。它們會使用追蹤金鑰作為 bearer token，將 trace 傳送到 `LENS_URL/v1/traces`。

除非您打算額外將一份 trace 複本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡單 agent {#simple-agent}

單一節點圖會回答一個問題。

```bash
uv run --env-file .env --package lens-langgraph-simple simple/main.py
```

實作請參閱 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/langgraph/simple/main.py)。

### agent 群 {#agent-swarm}

`research_agent` 圖會執行 `search_agent` 和 `writer_agent` 子圖。

```bash
uv run --env-file .env --package lens-langgraph-swarm swarm/main.py
```

實作請參閱 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/langgraph/swarm/main.py)。

## 驗證 trace {#verify-the-trace}

範例印出其答案後，請在您的閘道上開啟 **Lens > Traces** 並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出和模型 span。對於 swarm，請檢查上文所述的專家活動；其確切的 span 版面配置取決於 framework。

## tracing 的運作方式 {#how-tracing-works}

OpenInference 會為編譯後的圖及其節點進行 instrumentation。每個專家都是編譯後的子圖；其包裝器節點使用不同名稱，以避免將同一個 agent 計算兩次。

## 疑難排解 {#troubleshooting}

如果 model 呼叫失敗，請檢查閘道 URL、key 和 model alias。如果有答案出現但 trace 缺失，請檢查終端機中的 exporter 錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。model 呼叫成功不代表其 trace 匯出也成功。
