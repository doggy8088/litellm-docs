---
title: 追蹤程式碼代理程式工作階段
description: 安裝 LiteLLM Lens 外掛程式，將 Claude Code 或 Codex 的工作階段傳送至 Lens，再於 Traces 開啟記錄的活動。
---

import AgentPrompt from '@site/src/components/Conversion/AgentPrompt';

# 追蹤程式碼代理程式工作階段 {#trace-coding-agent-sessions}

使用 [LiteLLM Lens 外掛程式](https://github.com/BerriAI/litellm-lens-plugins)，將您的 [Claude Code](#claude-code) 與 [Codex](#codex) 工作階段記錄在 Lens 中。每個外掛程式會讀取代理程式已寫在您機器上的轉錄內容，並在每個回合後傳送至 Lens，因此一個工作階段就是一個 trace，包含其提示、回覆、工具呼叫與模型呼叫。您的模型登入與模型端點維持不變。

您需要一個執行中的 Lens 安裝。如果您是從零開始，請遵循 [Lens 部署指南](./deployment/local.md)。

外掛程式需要一個位址與一把金鑰。具體是哪一組，取決於代理程式如何連到 Lens，而 Lens 中的 **Home** 會在 **Connect a new agent** 下方同時提供兩種：

| 代理程式的連接方式 | 外掛程式使用的位址 | 外掛程式使用的金鑰 |
| --- | --- | --- |
| **透過 LiteLLM 閘道**：代理程式的模型呼叫已透過[已連接至 Lens](./deployment/litellm.md) 的閘道 | 您的閘道位址，例如 `http://localhost:4000` | 代理程式已用於模型呼叫的 LiteLLM 金鑰 |
| **獨立 Lens**：代理程式未使用 LiteLLM | 您的 Lens 位址，例如 `http://localhost:4318` | 一把專用的 Lens 追蹤金鑰 |

最快的設定方式是使用 Lens Home 上的提示：選擇路徑、選擇您的 coding agent，然後選取複製按鈕。將複製的說明貼到該 coding agent 中，它就會安裝外掛程式並執行一項真實任務。在獨立路徑上，**Copy instructions with new key** 會為您建立追蹤金鑰。若要手動安裝外掛程式，請依照您代理程式的章節操作。

透過閘道時，閘道會以金鑰的使用者與團隊為每個 trace 加上標記，再轉送至 Lens。追蹤金鑰上傳的是遙測資料。它不會呼叫模型，也不會讀取 trace。請妥善保管，不要公開。請將範例位址換成您自己的位址，並保留任何 `/lens-ingest` 前綴。

## Claude Code {#claude-code}

請使用 [LiteLLM Lens Claude Code 外掛程式](https://github.com/BerriAI/litellm-lens-plugins/tree/main/claude-code)。每個 Claude Code 工作階段都會成為一個 trace，而且不需要遙測變數。此外掛程式需要 Claude Code、位於 `PATH` 上的 Python 3.10 或更新版本，以及 macOS 或 Linux。 {/* keep-python-version: Claude Code plugin prerequisite */}

將此提示複製到 Claude Code 中，讓它安裝並設定外掛程式，或執行下方的指令。

<AgentPrompt id="lens-claude-code" />

請使用您的位址與存放金鑰的環境變數安裝外掛程式。當 Claude Code 已透過您的 LiteLLM 閘道時，就是閘道位址與 `ANTHROPIC_AUTH_TOKEN`：

```bash
claude plugin marketplace add BerriAI/litellm-lens-plugins
claude plugin install litellm-lens@berriai-lens \
  --config lens_url="$ANTHROPIC_BASE_URL" --config lens_key="$ANTHROPIC_AUTH_TOKEN"
```

若使用獨立 Lens，請傳入您的 Lens 位址與一把 Lens 追蹤金鑰：

```bash
export LITELLM_TRACING_KEY="<paste your Lens tracing key>"

claude plugin marketplace add BerriAI/litellm-lens-plugins
claude plugin install litellm-lens@berriai-lens \
  --config lens_url="http://localhost:4318" --config lens_key="$LITELLM_TRACING_KEY"
```

若省略兩個 `--config` 選項，Claude Code 會在下次啟動時詢問位址與金鑰。Claude Code 會將金鑰保存在其安全儲存空間中。重新安裝不會變更已儲存的位址或金鑰，因此若要變更，請先執行 `claude plugin uninstall litellm-lens@berriai-lens`。

執行一項任務，然後重新啟動您已開啟的任何 Claude Code 工作階段，讓它們載入外掛程式：

```bash
claude -p "Reply with exactly: Lens plugin check."
```

在 LiteLLM 中開啟 **Lens > Traces**，或在獨立 Lens 中開啟 **Traces**，並依 **claude-code** 篩選。一個工作階段就是一個 trace。每個提示都是一個回合，附有其回覆；每個工具呼叫都是一個步驟，附有其引數與輸出，包括失敗的工具；每個模型呼叫都是各自的步驟，附有其模型、token 與回覆。子代理程式的步驟會巢狀列於啟動它的回合之下。當 Claude Code 的模型呼叫透過 LiteLLM 閘道時，每個模型呼叫也會顯示其費用。

外掛程式會在每個回合後於背景傳送，且不會印出任何訊息，因此 trace 會在回合完成時更新。模型呼叫步驟顯示的是自上次呼叫以來新增的訊息，而非完整的請求。思考、圖片與文件不會傳送。如果沒有 trace 送達，請閱讀 `~/.claude/plugins/data/litellm-lens-berriai-lens` 中的 `last_error.txt`。

外掛程式會儲存您輸入的內容、回覆，以及 Claude Code 所執行工具的引數與輸出。這些內容可能包含原始碼或秘密，因此僅在您打算保留該內容的 Lens 部署上使用它。

已使用 Claude Code **2.1.330** 在 Linux 上驗證。

### 備援：Claude Code 遙測 {#claude-code-telemetry}

僅在外掛程式無法執行的情況下（例如在 Windows 上，或沒有 Python 時），才使用 Claude Code 自己的 [OpenTelemetry 匯出](https://code.claude.com/docs/en/monitoring-usage)。當 `CLAUDE_CODE_ENABLE_TELEMETRY` 與 `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA` 同時設定時，外掛程式不會傳送任何內容，因此工作階段絕不會被記錄兩次；若要使用外掛程式，請移除這兩個設定。

透過閘道時，此匯出需要 LiteLLM v1.112.0 或更新版本。較舊的閘道會以 `410` 回應 `POST /v1/logs`。 {/* keep-version-note: The first gateway release that forwards agent telemetry is the subject of this note. */}

```bash
export LENS_OTLP_ADDRESS="http://localhost:4000"   # your gateway address, or your Lens address
export LENS_OTLP_KEY="<your LiteLLM key, or your Lens tracing key>"

export CLAUDE_CODE_ENABLE_TELEMETRY=1
export CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1
export CLAUDE_CODE_PROPAGATE_TRACEPARENT=1
export OTEL_TRACES_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_ENDPOINT="$LENS_OTLP_ADDRESS"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer $LENS_OTLP_KEY"
export OTEL_LOG_USER_PROMPTS=1
export OTEL_LOG_ASSISTANT_RESPONSES=1
export OTEL_LOG_TOOL_DETAILS=1
export OTEL_LOG_TOOL_CONTENT=1
export OTEL_LOG_RAW_API_BODIES=1
export CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH=16777216
```

端點是沒有路徑的位址；Claude Code 會自行加上 `/v1/traces` 與 `/v1/logs`。使用遙測時，每個回合都是各自的 `claude_code.interaction` trace，並在 Lens 中按工作階段分組。[Lens Claude Code 指南](https://github.com/BerriAI/lens/blob/main/docs/claude-code.md#fallback-claude-code-telemetry) 說明了每個變數的作用、缺少時 Lens 會顯示什麼，以及如何將設定保留在 `~/.claude/settings.json` 中。

## Codex {#codex}

請使用 [LiteLLM Lens Codex 外掛程式](https://github.com/BerriAI/litellm-lens-plugins/tree/main/codex)，適用於本機 Codex 桌面版與 CLI 工作階段。這是建議的 Codex 設定：每個聊天都是一個 trace，每個模型呼叫都是一個步驟，附有其 token；當 Codex 的模型呼叫透過您的 LiteLLM 閘道時，也會附有其費用。自動設定支援 **macOS 與 Linux**，需要 Python 3.11 或更新版本，以及支援外掛程式的 Codex 版本。請在執行 Codex 的電腦上執行設定。{/* keep-python-version: Codex integration prerequisite */}

將此提示複製到您的程式碼代理程式中，以便讓它安裝並設定整合，或依照下方的手動步驟操作。

<AgentPrompt id="lens-codex" />

在終端機中安裝此外掛程式。同一此外掛程式適用於桌面版與 CLI：

```bash
codex plugin marketplace add BerriAI/litellm-lens-plugins
codex plugin add litellm-lens@berriai-lens
```

開始一個**新的 Codex 聊天**並傳送：

```text
Use lens-setup to connect my Codex chats to LiteLLM Lens.
```

在 macOS 上，Codex 會開啟一個私密的終端機設定視窗。在 Linux 上，Codex 會印出一個 `bash .../scripts/run.sh setup` 指令；請在您自己的終端機中執行它。請輸入以下值：

| 設定欄位 | 本機 Lens 值 |
| --- | --- |
| Lens ingestion URL | `http://localhost:4318`，或從 Lens 複製的位址。結尾的 `/v1/traces` 也可接受 |
| Lens tracing key | 專用的追蹤金鑰，在隱藏提示下輸入 |
| Agent name | `codex` |

確認開始記錄，然後再開始**另一個新的聊天**，讓其 hooks 載入。若要進行 CLI 檢查，請在您的專案中執行：

```bash
codex exec "Reply with exactly: Lens Codex telemetry check."
```

在獨立 Lens 中開啟 **Traces**，或在 LiteLLM 中開啟 **Lens > Traces**，依 **codex** 篩選，並在 **Conversation** 中開啟聊天 trace。請勿將追蹤金鑰貼到 Codex 提示中，也不要將它用作模型金鑰。外掛程式會處理遙測；請勿為同一筆記錄啟用第二個匯出器。

CLI 擷取已使用 Codex **0.171.0** 與外掛程式 **0.5.2** 檢查。如果您是從 `BerriAI/litellm-lens-codex-integration` 安裝此外掛程式，請先執行 `codex plugin marketplace remove berriai-lens`，再執行上方的兩個指令並重新設定一次。每個聊天都有一個 trace，並會在完成或中斷的回合後更新。重新開啟聊天會延續其 trace。只有設定完成後的活動會被記錄。

外掛程式會讀取新記錄回合中可見的轉錄項目，包括註解、重複訊息、工具結果、模型變更與子代理程式。當缺少完成回呼時，可還原已完成的轉錄回合。請參閱 [涵蓋範圍與隱私詳細資訊](https://github.com/BerriAI/litellm-lens-plugins/tree/main/codex#what-youll-see) 了解其限制。若要暫停記錄，請詢問 Codex：`Use lens-setup to pause recording.`

當 Codex 的模型呼叫已透過已連接至 Lens 的 LiteLLM 閘道時，請輸入閘道位址與 Codex 使用的 LiteLLM 金鑰，以取代 Lens 端點與追蹤金鑰。閘道會以金鑰的使用者與團隊為 trace 加上標記，再轉送至 Lens。Codex 自己的 OpenTelemetry 匯出仍可作為外掛程式無法執行時的備援；請參閱 [Lens Codex 指南](https://github.com/BerriAI/lens/blob/main/docs/codex-cli.md)。

## 涵蓋範圍與疑難排解 {#coverage-and-troubleshooting}

Lens 會顯示外掛程式傳送的內容。它無法從較舊的 traces 中還原缺失的內容，且只有設定完成後的活動會被記錄。Claude Code 外掛程式會省略思考、圖片與文件。Codex 會以明確的省略標記取代媒體，並識別不受支援的轉錄項目。本機選單、權限對話框與部分工作階段事件不會出現，因此 trace 並非精確的終端機記錄。

如果沒有 Claude Code trace 送達，請確認 `python3` 位於 `PATH` 上，閱讀 `~/.claude/plugins/data/litellm-lens-berriai-lens` 中的 `last_error.txt`，並確認 `CLAUDE_CODE_ENABLE_TELEMETRY` 與 `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA` 未同時設定於您的 shell 或 `~/.claude/settings.json` 中，因為外掛程式在設定時會保持關閉。該檔案中的 `401` 或 `403` 表示金鑰與位址不符：閘道位址使用 LiteLLM 金鑰，Lens 位址使用 Lens 追蹤金鑰。如果 Lens 只顯示名為 `chat <model>` 的列，表示閘道記錄了模型呼叫，但沒有外掛程式 trace 送達。

對於大型 traces，請使用 **Load more steps** 來載入較後面的活動。如果某個步驟載入失敗，請先重試，再載入下一頁。子代理程式分支會保留各自的訊息與工具結果，因此並行代理程式不會看起來像同一位發言者。
