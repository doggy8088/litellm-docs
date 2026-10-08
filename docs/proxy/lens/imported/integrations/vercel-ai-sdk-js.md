---
title: "Vercel AI SDK (TypeScript)"
description: "執行 Vercel AI SDK (TypeScript) 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/vercel-ai-sdk-js"
sidebar_label: "Vercel AI SDK (TypeScript)"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/vercel-ai-sdk-js/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/vercel-ai-sdk-js/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Vercel AI SDK (TypeScript) {#vercel-ai-sdk-typescript}

使用此存放庫中的可執行範例，將 Vercel AI SDK (TypeScript) 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要一個已啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道、一個 LiteLLM 金鑰，以及已設定的 model alias。swarm 範例需要支援工具呼叫的模型。進行調查時需要 Lens worker；檢視追蹤則不需要。

請使用內建 TypeScript 支援與 npm 的 Node.js。請從存放庫根目錄安裝相依套件，以便可使用共用的 npm workspaces。

## 設定 {#configuration}

對於全新檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example
npm install
cd vercel-ai-sdk-js
cp .env.example .env
```

如果您已經複製此存放庫，請從 `vercel-ai-sdk-js/` 執行其餘指令。若尚未安裝 workspace 相依套件，請從存放庫根目錄執行 `npm install`。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/vercel-ai-sdk-js/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數                 | 值                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基底 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 金鑰                                                                               |
| `LITELLM_MODEL`       | 在您的閘道上設定的 model alias                                                       |

已檢入的值目標為本機開發閘道。請為您的部署加以取代。請保留 `.env.example` 的 exporter 設定；這些範例會在程式碼中設定其追蹤 exporter。它們會使用 LiteLLM 金鑰作為 bearer token 將追蹤傳送至 `LITELLM_GATEWAY_URL/v1/traces`。

除非您打算額外將一份追蹤副本傳送到本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/recorder/AGENTS.md)，否則請保持 `MOCK_LITELLM_GATEWAY_URL` 不設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一次 `generateText` 呼叫會被追蹤為 `research_agent`。

```bash
node --env-file=.env simple/main.ts
```

實作請參見 [simple/main.ts](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/vercel-ai-sdk-js/simple/main.ts)。

### 代理程式群體 {#agent-swarm}

協調器透過工具委派，這些工具會執行 `generateText`，作為 `search_agent` 和 `writer_agent`。

```bash
node --env-file=.env swarm/main.ts
```

實作請參見 [swarm/main.ts](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/vercel-ai-sdk-js/swarm/main.ts)。

## 驗證追蹤 {#verify-the-trace}

在範例列印其答案後，於您的閘道上開啟 **Lens > Traces**，並選取新的執行。尋找與 `research_agent` 相關聯的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上述所描述的專家活動；其確切 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

@ai-sdk/otel 整合會建立 OpenTelemetry span，而 NodeSDK 會將它們匯出至 LiteLLM。這個範例會依據 functionId 命名代理程式 span。共用的閘道擷取會記錄請求嘗試次數與閘道呼叫 ID。

請參閱 [共用閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a6cce7983ec78ef9183627a0b05e0e3ce548b98a/shared/README.md)，以了解 request-attempt 與支出關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與 model alias。如果有答案出現但缺少追蹤，請檢查終端機中的 exporter 錯誤，並確認在同一個閘道上已啟用追蹤。模型呼叫成功並不代表其追蹤匯出也成功。

## 傳輸驗證 {#transport-validation}

從此資料夾執行共用傳輸回歸測試：

```bash
npm test -w gateway-tracing
```

使用以下指令驗證真實閘道串流、重試，以及計費回應遺失：

```bash
node --env-file=.env validate-attempts.ts streaming
node --env-file=.env validate-attempts.ts retry
node --env-file=.env validate-attempts.ts response-loss
```

重試情境會以用戶端端上的 HTTP 503 取代第一個真實的計費回應。回應遺失情境會消耗真實的計費回應，並使用戶端串流失敗。這兩種情境都不會改變閘道或提供者行為。
