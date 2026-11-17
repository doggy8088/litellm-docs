---
title: "CrewAI"
description: "執行 CrewAI 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/crewai"
sidebar_label: "CrewAI"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/crewai/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/crewai/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# CrewAI {#crewai}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用此儲存庫中的可執行範例，將 CrewAI 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。它會使用已檢入的 Python 版本，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新的檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/crewai
cp .env.example .env
```

如果您已經複製過該儲存庫，請從 `crewai/` 執行剩餘的命令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/crewai/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型金鑰                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

已檢入的值會指向本機開發用閘道。請在您的部署中將它們替換掉。保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用追蹤金鑰作為 bearer token，將追蹤送至 `LENS_URL/v1/traces`。

除非您打算額外將一份追蹤副本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持為未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

單一代理程式 `research_crew` 會回答一個問題。

```bash
uv run --env-file .env --package lens-crewai-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/crewai/simple/main.py)。

### 代理程式蜂群 {#agent-swarm}

一個順序式 `research_crew` 會執行 `research_agent`、`search_agent` 和 `writer_agent` 任務。

```bash
uv run --env-file .env --package lens-crewai-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/crewai/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。查看 `research_crew` 及其代理程式任務。檢視輸入、輸出和模型 spans。對於蜂群，請檢視上述描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

OpenInference 會對 CrewAI 代理程式與任務執行進行儀器化。獨立的 OpenAI 儀器化會記錄 CrewAI 用戶端所進行的模型呼叫。蜂群採用順序式，因此其代理程式會以 crew 任務的形式執行。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果答案已出現但追蹤缺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。模型呼叫成功並不代表其追蹤匯出也成功。
