---
title: "Claude Agent SDK"
description: "執行 Claude Agent SDK 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/claude-agent-sdk"
sidebar_label: "Claude Agent SDK"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/claude-agent-sdk/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/claude-agent-sdk/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Claude Agent SDK {#claude-agent-sdk}

使用本儲存庫中的可執行範例，將 Claude Agent SDK 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必備條件 {#prerequisites}

您需要一個已啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一個 LiteLLM 金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；檢視追蹤則不需要。

安裝 uv。它會使用已檢入的 Python 版本，並從其 uv 工作區解析每個範例的相依性。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/claude-agent-sdk
cp .env.example .env
```

如果您已經複製了儲存庫，請從 `claude-agent-sdk/` 執行其餘命令。將 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/claude-agent-sdk/.env.example) 複製到 `.env`，如果它不存在，然後設定：

| 變數              | 值                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基底 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 您的閘道上已設定的模型別名                                                       |

已檢入的值是針對本機開發閘道。請為您的部署加以取代。保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用 LiteLLM 金鑰作為 bearer token，將追蹤傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算將額外的追蹤副本傳送到本機 [記錄器](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請讓 `MOCK_LITELLM_GATEWAY_URL` 保持未設定。

## 執行範例 {#run-an-example}

### 簡易代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
uv run --env-file .env --package lens-claude-agent-sdk-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/claude-agent-sdk/simple/main.py)。

### 代理程式群組 {#agent-swarm}

一個協調器會委派給 `search_agent` 和 `writer_agent` 子代理程式。

```bash
uv run --env-file .env --package lens-claude-agent-sdk-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/claude-agent-sdk/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，然後選取新的執行。尋找與 `research_agent` 相關聯的執行。檢視輸入、輸出與模型 span。對於 swarm，請檢視上方所述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤如何運作 {#how-tracing-works}

OpenInference 會記錄 SDK 查詢與工具 span。隨附的 CLI 也會使用範例中設定的追蹤環境變數匯出其模型與工具 span。模型呼叫使用閘道的 Anthropic messages 端點。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與模型別名。如果答案已出現但追蹤缺失，請檢查終端機中的匯出器錯誤，並確認在同一個閘道上已啟用追蹤。模型呼叫成功並不代表其追蹤匯出已成功。

swarm 範例針對其已設定的 Agent 工具使用 bypassPermissions。在新增可修改檔案或執行命令的工具之前，請先檢視該範例。

## 將模型呼叫對應到花費 {#match-model-calls-to-spend}

本機 [adapter](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/claude-agent-sdk/gateway.py) 會將實際的 Anthropic 訊息 ID 加入 `request-id` 回應標頭，而 CLI 會將其記錄在模型 span 上。串流回應位元組會保持不變地通過。

請在與 `claude-agent-sdk/` 分開的終端機中啟動它，並使用 `.env` 中設定的閘道：

```bash
uv run --env-file .env --package lens-claude-agent-sdk-simple gateway.py
```

對 adapter 執行這些範例。針對這些命令，請保持 `MOCK_LITELLM_GATEWAY_URL` 為空，因為 adapter 會處理任何額外的記錄器匯出：

```bash
LITELLM_GATEWAY_URL=http://localhost:4319 MOCK_LITELLM_GATEWAY_URL= \
  uv run --env-file .env --package lens-claude-agent-sdk-simple simple/main.py

LITELLM_GATEWAY_URL=http://localhost:4319 MOCK_LITELLM_GATEWAY_URL= \
  uv run --env-file .env --package lens-claude-agent-sdk-swarm swarm/main.py
```

adapter 會繫結到 localhost。`CLAUDE_GATEWAY_PORT` 會變更其預設連接埠 `4319`；請更新範例 URL 以符合。若要將追蹤匯出複製到可選的記錄器，請在啟動 adapter 時設定 `MOCK_LITELLM_GATEWAY_URL=http://localhost:4318`。

請從這個資料夾執行 adapter 檢查：

```bash
uv run --package lens-claude-agent-sdk-simple python -m unittest discover -s . -p test_gateway.py
```

## 參考資料 {#references}

[Claude Agent SDK 可觀測性](https://code.claude.com/docs/en/agent-sdk/observability)。
