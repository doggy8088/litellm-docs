---
title: "傳送您的第一個 trace"
description: "將代理程式的 instrumentation 連接到 Lens trace 端點，並檢視一次執行。"
slug: "/proxy/lens/first-trace"
---

# 傳送您的第一個 trace {#send-your-first-trace}

## 連接您的代理程式 {#connect-your-agent}

將您的代理程式 OpenTelemetry OTLP/HTTP exporter 指向 LiteLLM：

| 設定 | 值 |
| --- | --- |
| Trace 端點 | `https://<your-litellm-proxy>/v1/traces` |
| HTTP 標頭 | `Authorization: Bearer <your-litellm-key>` |

使用 LiteLLM 金鑰進行驗證。記錄代理程式的任務、步驟、工具呼叫、輸入，以及最終答案。Lens 會使用這些內容來檢查發生了什麼事。

如需可運作的範例，請使用 [DeepLite](https://github.com/BerriAI/deeplite)。在其 `.env` 檔案中設定 `LITELLM_DEV_BASE=https://<your-litellm-proxy>/v1/traces` 和 `LITELLM_DEV_KEY=<your-litellm-key>`，然後執行該代理程式。

## 設定 exporter {#send-your-first-trace}

使用您既有的模型設定。先設定一次 trace 目的地，然後從側邊欄選擇一個整合。將 `research_agent` 替換為您代理程式的名稱。

```bash
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://<your-litellm-proxy>/v1/traces"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer <your-litellm-key>"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_METRICS_EXPORTER="none"
export OTEL_LOGS_EXPORTER="none"
```

從側邊欄開啟整合指南，以取得相依性、設定，以及可執行的 simple-agent 和 swarm 範例。這些範例會將模型請求與 traces 傳送到您的閘道。如果您的應用程式已經設定了 tracer provider，請保留它，並將其 exporter 指向上述目的地。

若要記錄個人編碼工作階段，請依照 [Claude Code 和 Codex 設定](./coding-agents.md)。

## 檢視您的第一個 trace {#view-your-first-trace}

開啟 **Lens > Traces**。選取包含您執行內容的時間範圍，然後開啟它。對於上述範例，請尋找 **research_agent**。在建立調查時，**Agent** 下也可使用相同名稱。選取某個步驟以讀取其輸入、輸出與屬性。

![research_agent trace，包含其問題、模型呼叫與最終答案。](/img/lens/first-agent-trace.png)

確認您可以看到任務、工具結果與最終答案。若這些內容缺失，請在執行調查之前更新您代理程式的 instrumentation。
