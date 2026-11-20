---
title: 追蹤程式碼代理程式工作階段
description: 設定 Claude Code 或 Codex 將工作階段傳送至 Lens，再於 Traces 開啟記錄的活動。
---

import AgentPrompt from '@site/src/components/Conversion/AgentPrompt';

# 追蹤程式碼代理程式工作階段 {#trace-coding-agent-sessions}

將您的 [Claude Code](#claude-code) 或 [Codex](#codex) 活動傳送至 Lens。您的模型登入與模型端點維持不變。

您需要一個執行中的 Lens 安裝，以及一把專用的 Lens 追蹤金鑰。如果您是從零開始，請遵循 [Lens 部署指南](./deployment/local.md)。您既有的 Claude Code 或 Codex 模型登入仍可繼續運作。

若為本機快速入門，請開啟 `http://localhost:4318/ui/`；若使用 LiteLLM 儀表板，請選取 **Lens**。[產生追蹤金鑰](./first-trace.md#connect-your-agent) 並複製完整的 **Traces endpoint**（包括 `/v1/traces`）。如果您無法自行建立金鑰，請向管理員索取。範例使用本機 Lens；請將位址換成您的端點，並保留任何 `/lens-ingest` 前綴。追蹤金鑰上傳的是遙測資料，而非模型請求。請妥善保管，不要公開。

## Claude Code {#claude-code}

Claude Code 不需要 Lens 外掛程式或輔助工具。其內建的 [OpenTelemetry 匯出器](https://code.claude.com/docs/en/monitoring-usage) 會直接將追蹤 span 與助理回覆記錄傳送至 Lens。模型呼叫可繼續透過您的 Claude 訂閱或您既有的 API 提供者；請保持您的 Claude 登入與模型端點不變。

將此提示複製到您的程式碼代理程式中，以便讓它設定這台機器，或依照下方的手動步驟操作。

<AgentPrompt id="lens-claude-code" />

已使用 Claude Code **2.1.328** 與 Lens **0.1.0** 驗證。請保留 `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1`：僅啟用遙測的標記並不會啟用其 beta 追蹤匯出器。

在您執行 `claude` 的終端機中，將端點與追蹤金鑰貼到前兩行，然後執行此區塊。記錄 URL 使用相同位址，但以 `/v1/logs` 取代 `/v1/traces`：

```bash
export LENS_TRACING_KEY="<paste your Lens tracing key>"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://localhost:4318/v1/traces"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer $LENS_TRACING_KEY"
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT="${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT%/v1/traces}/v1/logs"
export OTEL_EXPORTER_OTLP_LOGS_HEADERS="Authorization=Bearer $LENS_TRACING_KEY"

export CLAUDE_CODE_ENABLE_TELEMETRY=1
export CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1
export OTEL_METRICS_INCLUDE_SESSION_ID=true
export OTEL_TRACES_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_TRACES_PROTOCOL="http/protobuf"
export OTEL_METRICS_EXPORTER=none
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL="http/protobuf"
export OTEL_RESOURCE_ATTRIBUTES="lens.session.capture=true,gen_ai.agent.name=claude-code"

export OTEL_LOG_USER_PROMPTS=1
export OTEL_LOG_ASSISTANT_RESPONSES=1
export OTEL_LOG_TOOL_DETAILS=1
export OTEL_LOG_TOOL_CONTENT=1

claude -p "Reply with exactly: Lens telemetry check."
```

內容標記包含提示、助理回覆、工具引數，以及支援的工具輸出，這些可能包含原始碼或秘密。僅在您打算儲存該內容的 Lens 部署上啟用它們。

在獨立 Lens 中開啟 **Traces**，或在 LiteLLM 中開啟 **Lens > Traces**。依 **claude-code** 篩選，開啟工作階段 trace，並選取 **Conversation** 以查看提示與回覆。若要進行互動式工作階段，請執行不帶 `-p` 的 `claude`。同一工作階段中的新回合會更新其 trace。

`lens.session.capture=true` 會將具有相同 Claude 工作階段 ID 的回合分組為一個 trace，包括恢復的工作階段與背景代理程式回覆。原始 trace ID 會保留在 span 屬性中。若省略此資源屬性，則可保留 Claude 每次互動各自獨立的 trace。如果您已設定 `OTEL_RESOURCE_ATTRIBUTES`，請附加這些值，而不是取代您現有的屬性。

請勿設定 `OTEL_METRICS_INCLUDE_SESSION_ID=false`。儘管名稱如此，它也會從 Claude 的 traces 中移除 `session.id`，並阻止工作階段分組。

<details>
<summary>額外的 Claude Code 內容與持久性設定</summary>

助理回覆使用與追蹤 span 不同的遙測串流。請保持兩個匯出器都啟用。無需白名單中的詳細追蹤端點。請參閱 Claude Code 的 [監控參考](https://code.claude.com/docs/en/monitoring-usage)，了解 beta 匯出器的涵蓋範圍與內容限制。

`/v1/logs` 端點會接收供 Lens 使用的 OpenTelemetry 事件。這些會成為工作階段 trace 的一部分，且不會在一般 LiteLLM **Logs** 畫面中建立項目，也不會產生額外的支出記錄。

Claude 穩定版的工具輸出事件會省略失敗的執行與部分工具種類。若要在下一次模型請求中補足這些缺口，您可以選擇啟用原生 API 主體匯出：

```bash
export OTEL_LOG_RAW_API_BODIES=1
export CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH=1048576
```

這會將完整的 API 主體（包括對話歷史與來源內容）傳送至 Lens 服務。Lens 會擷取 Conversation 的工具結果，並捨棄 body 屬性。較大的限制可避免 Claude 預設的 60 KB 截斷，適用於一般短工作階段，但長工作階段仍可能超出。當 body 不完整時，Lens 會發出警告。從未傳送到另一個模型請求的結果仍無法取得。`file:<dir>` 模式只會在您的機器上寫入 body，無法將其提供給遠端 Lens 服務。

下方的對話包含一個刻意失敗的指令。搭配可選的 body 匯出功能，Lens 會顯示其 stdout 以及失敗資訊與助理的最終回覆。

![顯示失敗指令及其擷取輸出的 Claude Code 對話](/img/lens-coding-agents/claude-after.jpg)

若要進行持久性設定，請將這些變數新增至您使用者層級 `~/.claude/settings.json` 中的 `env` 物件，並保留既有設定。儲存庫層級設定無法啟用遙測或選擇其目的地。受管理的設定可能會覆寫您的本機目的地。

</details>

## Codex {#codex}

請使用 [BerriAI Codex 整合](https://github.com/BerriAI/litellm-lens-codex-integration)，適用於本機 Codex 桌面版與 CLI 工作階段。自動設定目前支援 **macOS**，需要 Python 3.11 或更新版本，以及支援外掛程式的 Codex 版本。請在執行 Codex 的電腦上執行設定。{/* keep-python-version: Codex integration prerequisite */}

將此提示複製到您的程式碼代理程式中，以便讓它安裝並設定整合，或依照下方的手動步驟操作。

<AgentPrompt id="lens-codex" />

在終端機中安裝此外掛程式。同一此外掛程式適用於桌面版與 CLI：

```bash
codex plugin marketplace add BerriAI/litellm-lens-codex-integration
codex plugin add litellm-lens@berriai-lens
```

開始一個**新的 Codex 聊天**並傳送：

```text
Use lens-setup to connect my Codex chats to LiteLLM Lens.
```

在私密的終端機設定視窗中，輸入以下值：

| 設定欄位 | 本機 Lens 值 |
| --- | --- |
| Lens ingestion URL | `http://localhost:4318/v1/traces`，或從 Lens 複製的完整端點 |
| Lens tracing key | 專用的追蹤金鑰，在隱藏提示下輸入 |
| Agent name | `codex` |

確認開始記錄，然後再開始**另一個新的聊天**，讓其 hooks 載入。若要進行 CLI 檢查，請在您的專案中執行：

```bash
codex exec "Reply with exactly: Lens Codex telemetry check."
```

在獨立 Lens 中開啟 **Traces**，或在 LiteLLM 中開啟 **Lens > Traces**，依 **codex** 篩選，並在 **Conversation** 中開啟聊天 trace。請勿將追蹤金鑰貼到 Codex 提示中，也不要將它用作模型金鑰。外掛程式會處理遙測；請勿將 Claude Code 的環境變數複製到 Codex，也不要為同一筆記錄啟用第二個匯出器。

CLI 擷取已使用 Codex **0.170.0** 與外掛程式 **0.4.0** 檢查。每個聊天都有一個 trace，並會在完成或中斷的回合後更新。重新開啟聊天會延續其 trace。外掛程式會提供聊天層級的 trace ID，因此此分組在 Lens **0.1.0** 與 **main** 上都適用，不需要 `lens.session.capture` 或 `lens.session.attribute`。只有設定完成後的活動會被記錄。

外掛程式會讀取新記錄回合中可見的轉錄項目，包括註解、重複訊息、工具結果、模型變更與子代理程式。當缺少完成回呼時，可還原已完成的轉錄回合。請參閱 [涵蓋範圍與隱私詳細資訊](https://github.com/BerriAI/litellm-lens-codex-integration#what-youll-see) 了解其限制。若要暫停記錄，請詢問 Codex：`Use lens-setup to pause recording.`

## 涵蓋範圍與疑難排解 {#coverage-and-troubleshooting}

Lens 會顯示程式碼代理程式匯出的內容。它無法從較舊的 traces 中還原缺失的內容。Claude 的原生遙測不會匯出精確的終端機記錄：圖片、隱藏推理、本機選單、權限對話框與部分工作階段事件可能會缺失。Claude 也會限制匯出內容長度；長的工具結果或回覆可能在 Lens 接收前就被截斷。Codex 會以明確的省略標記取代媒體，並識別不受支援的轉錄項目。這些限制使得無法保證每個工作階段或未來代理程式版本都能呈現完全相同的結果。

如果 Claude 顯示工具但沒有回覆，請檢查 `OTEL_LOGS_EXPORTER`、`OTEL_LOG_ASSISTANT_RESPONSES` 與記錄端點。`404` 對 `/v1/logs` 來說，表示 Lens 服務或擷取路由需要更新。請允許匯出器在回合後完成 flush。請勿啟用原始 API 主體匯出來補償缺少的回覆記錄。

若要變更 Claude 代理程式名稱，請在 `OTEL_RESOURCE_ATTRIBUTES` 中設定 `gen_ai.agent.name`。例如，`gen_ai.agent.name=my-claude-code,developer=alice,lens.session.capture=true`。請在 trace 篩選器以及任何調查的代理程式篩選器中使用完全相同的名稱。僅限於 `claude-code` 的調查不會自動取樣 `my-claude-code`。

對於大型 traces，請在 Conversation 中使用 **Load next steps** 來載入較後面的活動。如果某個步驟載入失敗，請先重試，再載入下一頁。子代理程式分支會保留各自的訊息與工具結果，因此並行代理程式不會看起來像同一位發言者。
