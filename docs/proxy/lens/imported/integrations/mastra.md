---
title: "Mastra"
description: "執行 Mastra 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/mastra"
sidebar_label: "Mastra"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/mastra/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/mastra/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Mastra {#mastra}

使用本儲存庫中的可執行範例，將 Mastra 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一組 LiteLLM 金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；僅檢視追蹤不需要。

請使用具備內建 TypeScript 支援的 Node.js 與 npm。請從儲存庫根目錄安裝相依性，讓共用的 npm workspaces 可用。

## 設定 {#configuration}

全新檢出後：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example
npm install
cd mastra
cp .env.example .env
```

如果您已經複製過儲存庫，請從 `mastra/` 執行剩餘的命令。若尚未安裝 workspace 相依性，請從儲存庫根目錄執行 `npm install`。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/mastra/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

已提交的值是針對本機開發閘道。請為您的部署加以替換。請保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用 LiteLLM 金鑰作為 bearer token 將追蹤送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算將額外的追蹤副本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請保持 `MOCK_LITELLM_GATEWAY_URL` 為未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
node --env-file=.env simple/main.ts
```

實作請見 [simple/main.ts](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/mastra/simple/main.ts)。

### 代理程式群組 {#agent-swarm}

一個協調器會委派給 `search_agent` 與 `writer_agent` 子代理程式。

```bash
node --env-file=.env swarm/main.ts
```

實作請見 [swarm/main.ts](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/mastra/swarm/main.ts)。

## 驗證追蹤 {#verify-the-trace}

範例列印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。請尋找與 `research_agent` 相關的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上方描述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

Mastra 的 OtelBridge 會將代理程式、步驟、模型與工具 span 轉換為由 NodeSDK 匯出的 OpenTelemetry span。共用閘道擷取會記錄請求嘗試與閘道呼叫 ID。

請參閱 [共用閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md) 以了解請求嘗試與支出關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與模型別名。如果已經出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認在同一個閘道上已啟用追蹤。模型呼叫成功不代表其追蹤匯出也成功。

請從儲存庫根目錄安裝 npm 相依性，讓所有 workspaces 使用相同的 OpenTelemetry API 執行個體。這些一次性範例出現記憶體內儲存警告是預期中的情況。

## 參考資料 {#references}

[Mastra OpenTelemetry 整合](https://mastra.ai/integrations/observability/opentelemetry)。
