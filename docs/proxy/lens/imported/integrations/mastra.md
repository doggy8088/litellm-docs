---
title: "Mastra"
description: "執行 Mastra 範例，並將其代理程式追蹤送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/mastra"
sidebar_label: "Mastra"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/mastra/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/mastra/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Mastra {#mastra}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用本儲存庫中的可執行範例，將 Mastra 追蹤送至 [LiteLLM Lens](/docs/proxy/lens)。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

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

如果您已經複製過儲存庫，請從 `mastra/` 執行剩餘的命令。若尚未安裝 workspace 相依性，請從儲存庫根目錄執行 `npm install`。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/mastra/.env.example) 不存在，請將其複製為 `.env`，然後設定：

| 變數              | 值                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含尾端斜線或 `/v1`，例如 `http://localhost:4002` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型金鑰                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

已提交的值是針對本機開發閘道。請為您的部署加以替換。請保留 `.env.example` 中的匯出器設定；這些範例會在程式碼中設定其追蹤匯出器。它們會使用追蹤金鑰作為 bearer token 將追蹤送至 `LENS_URL/v1/traces`。

除非您打算將額外的追蹤副本傳送至本機 [recorder](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/recorder/AGENTS.md)，否則請保持 `MOCK_LITELLM_GATEWAY_URL` 為未設定。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

一個 `research_agent` 會回答一個問題。

```bash
node --env-file=.env simple/main.ts
```

實作請見 [simple/main.ts](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/mastra/simple/main.ts)。

### 代理程式群組 {#agent-swarm}

一個協調器會委派給 `search_agent` 與 `writer_agent` 子代理程式。

```bash
node --env-file=.env swarm/main.ts
```

實作請見 [swarm/main.ts](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/mastra/swarm/main.ts)。

## 驗證追蹤 {#verify-the-trace}

範例列印出答案後，請在您的閘道上開啟 **Lens > Traces**，並選取新的執行。請尋找與 `research_agent` 相關的執行。檢查輸入、輸出與模型 span。對於 swarm，請檢查上方描述的專家活動；其確切的 span 版面配置取決於框架。

## 追蹤運作方式 {#how-tracing-works}

Mastra 的 OtelBridge 會將代理程式、步驟、模型與工具 span 轉換為由 NodeSDK 匯出的 OpenTelemetry span。共用閘道擷取會記錄請求嘗試與閘道呼叫 ID。

請參閱 [共用閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md) 以了解請求嘗試與支出關聯的詳細資訊。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰與模型別名。如果已經出現答案但追蹤遺失，請檢查終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。模型呼叫成功不代表其追蹤匯出也成功。

請從儲存庫根目錄安裝 npm 相依性，讓所有 workspaces 使用相同的 OpenTelemetry API 執行個體。這些一次性範例出現記憶體內儲存警告是預期中的情況。

## 參考資料 {#references}

[Mastra OpenTelemetry 整合](https://mastra.ai/integrations/observability/opentelemetry)。
