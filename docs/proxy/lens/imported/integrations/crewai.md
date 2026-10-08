---
title: "CrewAI"
description: "執行 CrewAI 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/crewai"
sidebar_label: "CrewAI"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/crewai/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/crewai/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# CrewAI {#crewai}

使用此儲存庫中的可執行範例，將 CrewAI 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一個 LiteLLM 金鑰，以及已設定的模型別名。進行調查時需要 Lens worker；僅檢視追蹤不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新的檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/crewai
cp .env.example .env
```

如果您已經複製過該儲存庫，請從 `crewai/` 執行剩餘的命令。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/crewai/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

已檢入的值會指向本機開發用閘道。請在您的部署中將它們替換掉。保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份追蹤副本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請將 `MOCK_LITELLM_GATEWAY_URL` 保持為未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

單一代理程式 `research_crew` 會回答一個問題。

```bash
uv run --env-file .env --package lens-crewai-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/crewai/simple/main.py)。

### 代理程式蜂群 {#agent-swarm}

一個順序式 `research_crew` 會執行 `research_agent`、`search_agent` 和 `writer_agent` 任務。

```bash
uv run --env-file .env --package lens-crewai-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/crewai/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。查看 `research_crew` 及其代理程式任務。檢視輸入、輸出和模型 spans。對於蜂群，請檢視上述描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

OpenInference 會對 CrewAI 代理程式與任務執行進行儀器化。獨立的 OpenAI 儀器化會記錄 CrewAI 用戶端所進行的模型呼叫。蜂群採用順序式，因此其代理程式會以 crew 任務的形式執行。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果答案已出現但追蹤缺失，請檢查終端機中的匯出器錯誤，並確認在同一個閘道上已啟用追蹤。模型呼叫成功並不代表其追蹤匯出也成功。
