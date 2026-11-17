---
title: 評估代理程式
description: 使用具型別的評估、可重複的執行，以及包含成功、成本與時間的成績卡，在您自己的任務上比較代理程式 harness 與模型。
---

# 評估代理程式 {#evaluate-agents}

{/* keep-version-note */}

:::info 未發布的 API 預覽
`agent_eval()` 與 `aagent_eval()` 尚未出現在已發布的 LiteLLM 版本中。以下範例預覽此 API。本指南在發布前需要已驗證的發布版本與安裝說明。
:::

請使用 `litellm.agent_eval()`，在您自己的任務上比較代理程式 harness 與模型。在 `EvalTask` 中定義工作及其成功檢查，再以 `EvalTarget` 選擇 harness 與模型，並在成績卡中比較通過率、成本與耗時。

## 1. 設定您的 AI Gateway {#1-configure-your-ai-gateway}

請使用可呼叫兩個模型群組的 [LiteLLM AI Gateway](./gateway.md) 虛擬金鑰。此範例稱它們為 `model-a` 與 `model-b`，請將這些名稱換成您的群組。兩個目標都使用 Tool Loop，不需要 CLI 執行環境。

在 Bash 或 Zsh 中設定不含 `/v1` 的閘道根 URL，並在執行 `read` 後輸入您的虛擬金鑰，終端機會隱藏輸入內容：

```bash
export LITELLM_PROXY_API_BASE=https://litellm.example.com
export LITELLM_PROXY_API_KEY
read -rs LITELLM_PROXY_API_KEY
```

如果您的密碼管理工具已設定好 `LITELLM_PROXY_API_KEY`，請跳過 `read` 命令。若要比較 Claude Code 或 Codex 等 CLI harness，請依照[快速入門](./quickstart.md#1-install)安裝它們的相依套件。

## 2. 定義任務與目標 {#2-define-tasks-and-targets}

請將這份完整範例儲存為 `evaluate_agents.py`。

請為每次評估呼叫選擇一個 sandbox factory。此範例對受信任的任務使用 `sandbox.local`，會以您使用者的權限執行。執行器會在每次嘗試時把全新的暫存工作區傳給 factory。

```python title="evaluate_agents.py"
from pathlib import Path

import litellm
from litellm import EvalTarget, EvalTask, Harness, PredicateCheck, sandbox


tasks = [
    EvalTask(
        id="billing-ticket",
        prompt=(
            "Classify this ticket as billing, technical, or sales. "
            "Reply with only the category.\n"
            "Ticket: I was charged twice for my subscription."
        ),
        check=PredicateCheck(
            lambda result: result.text.strip().lower() == "billing"
        ),
    ),
    EvalTask(
        id="technical-ticket",
        prompt=(
            "Classify this ticket as billing, technical, or sales. "
            "Reply with only the category.\n"
            "Ticket: The app crashes whenever I upload a PDF."
        ),
        check=PredicateCheck(
            lambda result: result.text.strip().lower() == "technical"
        ),
    ),
]

targets = [
    EvalTarget(Harness.TOOL_LOOP, "litellm_proxy/model-a", label="model-a"),
    EvalTarget(Harness.TOOL_LOOP, "litellm_proxy/model-b", label="model-b"),
]

report = litellm.agent_eval(
    tasks=tasks,
    targets=targets,
    sandbox=sandbox.local,
    max_concurrency=2,
)

print(report.to_markdown())
Path("scorecard.json").write_text(report.to_json(), encoding="utf-8")
```

`PredicateCheck` 會接收代理程式的 `Result` 並回傳布林值。請檢查最終答案、工具呼叫或結果的其他部分。Predicate 可以是同步或非同步。

每個目標可以使用不同的 harness、模型與 harness 專屬的 `options`。請使用 label 在成績卡中識別每種設定。任務 ID 與解析後的目標 label 必須唯一。

## 3. 執行比較 {#3-run-the-comparison}

請在包含 `evaluate_agents.py` 的目錄中執行：

```bash
python evaluate_agents.py
```

兩個任務與兩個目標會產生四次執行。請在 `model-a` 與 `model-b` 的摘要中確認每個目標各有兩次嘗試。回傳兩個預期分類並以 `done` 停止的目標，會有 `2/2` 次通過的執行。請使用 `scorecard.json` 自行分析。

請設定 `trials=3`，將每項任務與目標重複三次，此範例接著會產生十二次執行。

只有當代理程式以 `stop_reason="done"` 停止且檢查通過時，一次執行才算通過。檢查失敗或達到輪次上限會產生 `fail`。設定失敗、執行階段錯誤、逾時與取消的代理程式執行會產生 `error` 列，其餘執行會繼續進行。當代理程式未以 `done` 結束時，執行器會跳過評分。取消整個套組會停止執行並觸發清理。

## 4. 檢查結果 {#4-inspect-the-results}

不需解析 Markdown，即可讀取具型別的摘要或個別執行：

```python
from litellm import EvalStatus

for summary in report.summaries:
    print(summary.target, summary.pass_rate, summary.cost)

for run in report.runs:
    if run.status is not EvalStatus.PASS:
        print(run.task_id, run.target, run.trial, run.detail)
```

請把這段程式碼加在 `evaluate_agents.py` 的評估呼叫之後。

通過率是通過的執行次數除以排定的執行次數，包含錯誤。總計包含未成功執行中已知的用量。在把成本總計視為完整之前，請先檢查 `metrics_complete`。值為 false 表示部分用量或成本無法取得。

平均耗時涵蓋工作區準備、設定、代理程式執行、評分與清理。由於執行可能重疊，請將它與套組總時間分開比較。

請在不同的欄位中比較代理程式與評判的成本。JSON 匯出包含結果資料與識別碼，但不包含驗證設定、Python callable 與原始事件。

執行器會把 `agent_eval_suite`、`agent_eval_run`、`agent_eval_task`、`agent_eval_target` 與 `agent_eval_trial` metadata 附加到模型請求。請傳入 `metadata={"experiment": "support-routing"}` 以加入您自己的標籤。請使用這些識別碼，在現有的閘道記錄中關聯請求。持久保存的支出記錄需要閘道現有的資料庫設定。

## 非同步執行 {#async-execution}

在非同步函式或 notebook 中，請使用 `aagent_eval()` 搭配相同的任務與目標：

```python
report = await litellm.aagent_eval(
    tasks=tasks,
    targets=targets,
    sandbox=sandbox.local,
    max_concurrency=2,
)

print(report.to_markdown())
```

## 以模型評分寫作或研究 {#grade-writing-or-research-with-a-model}

請使用 `JudgeCheck` 依據評分標準評分。請選擇支援 JSON 輸出的評判模型。評判會收到任務提示、答案與回報的檔案變更，以及您的評分標準。它可以評分檔案差異，但無法讀取工作區的其他檔案。

```python
from litellm import EvalTask, JudgeCheck

writing_task = EvalTask(
    id="support-reply",
    prompt=(
        "Write a reply to a customer who was charged twice. "
        "Explain that support will investigate without promising a refund."
    ),
    check=JudgeCheck(
        model="litellm_proxy/judge",
        rubric=(
            "The reply acknowledges the duplicate charge, gives a clear next "
            "step and does not guarantee a refund."
        ),
        timeout=30,
    ),
)
```

請把 `writing_task` 加入 `tasks`，並允許您的虛擬金鑰呼叫 `judge` 模型群組。除了代理程式執行之外，也請為這些呼叫編列預算。

有效的否定裁決會產生 `fail`。失敗的評判請求或無效的裁決會產生 `error`。

## 評估會變更檔案的任務 {#evaluate-a-task-that-changes-files}

對於需要起始檔案的任務，請把專案目錄作為 `workspace` 傳入。每次嘗試都會取得一份複本，代理程式會編輯該複本，執行器會排除 `.git` metadata，讓 Git 狀態與來源分開。

請為 `workspace` 使用真實目錄。執行器會在建立 sandbox 之前拒絕複製專案中的符號連結，包括專案內的連結與損毀的連結，也會拒絕用作工作區根目錄的符號連結。

請建立帶有錯誤的 `calculator/calc.py`：

```python title="calculator/calc.py"
def add(a, b):
    return a - b
```

請以此範例替換 `evaluate_agents.py` 中的任務與目標。請先依照[快速入門](./quickstart.md#1-install)安裝 CLI 執行環境，並使用您的金鑰可用的模型群組。

```python
from pathlib import Path

from litellm import CommandCheck, EvalTarget, EvalTask, Harness

tasks = [
    EvalTask(
        id="fix-calculator",
        prompt="Fix calc.py so add(a, b) returns the sum of a and b.",
        workspace=Path(__file__).resolve().parent / "calculator",
        check=CommandCheck(
            [
                "python",
                "-c",
                "from calc import add; "
                "assert add(2, 3) == 5; "
                "assert add(-2, 2) == 0",
            ],
            timeout=30,
        ),
    ),
]

targets = [
    EvalTarget(Harness.CLAUDE_CODE, "litellm_proxy/claude"),
    EvalTarget(Harness.CODEX, "litellm_proxy/gpt"),
]
```

請使用 `CommandCheck`，在代理程式完成後於相同的 sandbox 中執行評分命令，結束碼為零即通過。此範例把斷言保留在評估指令稿中，位於複製專案之外。請使用任務的 `setup` 命令，在代理程式啟動前安裝相依套件。

Tool Loop 沒有內建的檔案或 shell 工具。此範例請使用程式碼撰寫 harness。呼叫者提供的 Python 工具會在 SDK 程序中以其權限執行。

## 選擇 sandbox 與執行限制 {#choose-a-sandbox-and-execution-limits}

兩個評估函式都需要明確的 `sandbox` factory。受信任的任務請傳入 `sandbox=sandbox.local`，會以您使用者的權限執行。對於 CLI harness，請使用容器來隔離執行環境及其相依套件。

若要使用容器執行，請傳入一個接收每次嘗試全新工作區的 factory：

```python
from litellm import sandbox

report = litellm.agent_eval(
    tasks=tasks,
    targets=targets,
    sandbox=lambda workspace: sandbox.docker(
        "my-eval-runtime:latest",
        mounts={str(workspace): "/workspace"},
        workdir="/workspace",
    ),
)
```

請把 `my-eval-runtime:latest` 換成您自行建置、包含所需 CLI 執行環境與專案相依套件的映像檔。Docker 必須處於執行狀態。sandbox 契約請參閱 [Sandboxes](./sandboxes.md)。

| 選項 | 預設值 | 含義 |
|---|---|---|
| `sandbox` | 必要 | 接收每次嘗試的全新工作區並回傳 sandbox 的 factory |
| `trials` | `1` | 每項任務與目標的獨立嘗試次數 |
| `max_concurrency` | `1` | 並行嘗試次數，包含設定與評分 |
| `timeout` | `300` | 每次代理程式執行允許的秒數 |
| `setup_timeout` | `120` | 每次嘗試的設定階段允許的秒數 |
| `CommandCheck.timeout` | `30` | 評分命令允許的秒數 |
| `JudgeCheck.timeout` | `30` | 評判請求允許的秒數 |
| `max_turns` | `None` | 現有的代理程式輪次上限，計算的是工具呼叫事件而非模型呼叫 |

執行器會在每次嘗試後關閉 sandbox 並移除暫存工作區。請在成績卡中檢查檔案變更與檢查詳細資訊，或將它們匯出為 JSON。

## 疑難排解 {#troubleshoot-a-run}

| 症狀 | 下一步 |
|---|---|
| 匯入 `agent_eval` 失敗 | 此 API 尚未發布。請在某個版本包含它之後再執行這些範例。 |
| 缺少 CLI 執行環境 | 請在本機環境或容器映像檔中安裝該 harness。 |
| 工作區錯誤提到符號連結 | 請為 `workspace` 使用真實目錄，並把連結換成任務需要的檔案或目錄。 |
| 閘道拒絕目標 | 請檢查其模型群組名稱與虛擬金鑰允許的模型。 |
| 執行逾時 | 請檢查其停止原因與檢查詳細資訊，再調整對應的執行或評分逾時。 |
| 代理程式完成了，但執行失敗 | 請檢查評分結果。僅僅完成一輪代理程式並不代表任務成功。 |

具型別的評估輸入與輸出，請參閱 [API 參考](./api_reference.md#evaluations)。
