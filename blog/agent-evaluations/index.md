---
slug: agent-evaluations
title: "在您自己的任務上評估代理程式"
date: 2026-11-16T09:00:00-08:00
authors: [ishaan]
description: "透過 LiteLLM AI Gateway 比較代理程式 harness 與模型。定義具型別的任務、重複嘗試，並依照這份 Python 指南匯出成績卡。"
tags: [agents, python-sdk, ai-gateway, evaluations]
hide_table_of_contents: true
custom_hero: true
image: ./cover.jpg
---

import EvaluationPage from './EvaluationPage';

<EvaluationPage>

先讓代理程式處理一張支援工單，再針對相同的設定進行多次嘗試並評估。有了 `litellm.agent_eval()`，您可以定義具型別的任務與成功檢查、比較 harness 與模型目標，並在一張成績卡中讀取通過率、成本與耗時。

:::info 預覽
LiteLLM 的 main 分支已包含評估實作。已發布的 PyPI 版本尚未包含此 API。以下範例展示即將推出的 SDK 介面。
:::

## 連線到您的 AI Gateway {#connect}

請使用可存取兩個模型群組的 [LiteLLM AI Gateway](/docs/harness/gateway) 虛擬金鑰。範例稱它們為 `model-a` 與 `model-b`，請將這些名稱換成您的群組。

在 Bash 或 Zsh 中設定不含 `/v1` 的閘道根 URL。執行 `read`，再輸入您的虛擬金鑰，終端機會隱藏輸入內容。

```bash
export LITELLM_PROXY_API_BASE=https://litellm.example.com
export LITELLM_PROXY_API_KEY
read -rs LITELLM_PROXY_API_KEY
```

如果您的密碼管理工具已設定好金鑰，請跳過 `read`。第一次比較使用 Tool Loop，不需要 CLI 執行環境。

請為每次嘗試選擇執行後端。以下指令稿傳入 `sandbox.local`，會以您使用者的權限執行。受信任的任務請使用本機執行。[sandbox 指南](/docs/harness/sandboxes)涵蓋容器 factory 與主機端 Python 工具。

## 先執行代理程式，再評估同一任務 {#define}

先從一張支援工單開始。執行一次 Tool Loop 來檢查它的回答，再定義成功檢查並比較兩個模型目標。請將這份完整指令稿儲存為 `evaluate_agents.py`：

```python title="evaluate_agents.py"
from pathlib import Path
from tempfile import TemporaryDirectory

import litellm
from litellm import EvalTarget, EvalTask, Harness, PredicateCheck, sandbox


harness = Harness.TOOL_LOOP
model = "litellm_proxy/model-a"
prompt = (
    "Classify this ticket as billing, technical, or sales. "
    "Reply with only the category.\n"
    "Ticket: I was charged twice for my subscription."
)

with TemporaryDirectory() as workspace:
    result = litellm.agent(
        harness,
        prompt,
        sandbox=sandbox.local(workspace),
        model=model,
    )
    print(result.text)

task = EvalTask(
    id="billing-ticket",
    prompt=prompt,
    check=PredicateCheck(
        lambda result: result.text.strip().lower() == "billing"
    ),
)

targets = [
    EvalTarget(harness, model, label="model-a"),
    EvalTarget(harness, "litellm_proxy/model-b", label="model-b"),
]

report = litellm.agent_eval(
    tasks=[task],
    targets=targets,
    sandbox=sandbox.local,
    trials=3,
    max_concurrency=2,
)

print(report.to_markdown())
Path("scorecard.json").write_text(report.to_json(), encoding="utf-8")
```

`litellm.agent()` 會執行代理程式並回傳 `Result`。`TemporaryDirectory` 會建立其本機工作區。任務會重複使用該提示，第一個評估目標也會重複使用相同的 harness 與模型。`EvalTask` 保存提示與成功規則；`EvalTarget` 選擇 harness 與模型。

`agent_eval()` 會在全新的工作區中再次執行每個目標。它接受任務與目標；您不需要把先前的 `Result` 傳給它。

請在儲存指令稿的目錄中執行它：

```bash
python evaluate_agents.py
```

一個任務、兩個目標與三次試驗會產生六次評估執行。最初的代理程式呼叫獨立於這六次執行及其成績卡之外。每個目標各有三次嘗試。此指令稿也會寫出 `scorecard.json`，供您自行分析。請在選擇正式環境目標之前，加入具代表性的工單及其預期結果。

## 比較成本之前，先檢視失敗 {#results}

當代理程式以 `done` 停止且成功檢查通過時，一次執行就算通過。成功檢查失敗或達到輪次上限會產生 `fail`。設定失敗、執行階段錯誤、逾時與評分錯誤會產生 `error`。

請在評估呼叫之後檢查未成功的執行：

```python
from litellm import EvalStatus

for run in report.runs:
    if run.status is not EvalStatus.PASS:
        print(run.task_id, run.target, run.trial, run.detail)

for summary in report.summaries:
    print(summary.target, summary.pass_rate, summary.cost)
    print("Complete metrics:", summary.metrics_complete)
```

通過率會把錯誤列計入分母。因此，無法使用的執行環境或失敗的評判請求仍會在比較中看得見。

請將成本與通過率、token 使用量、模型呼叫與工具呼叫一併比較。在把總計視為完整之前，請先檢查 `metrics_complete`。報告會把代理程式支出與評判支出分開。平均耗時包含工作區準備、設定、執行、評分與清理；並行執行可能會重疊。

## 以相同任務比較 harness {#harnesses}

若要在評估中比較 Claude Code 與 Codex，請[安裝它們的執行環境](/docs/harness/quickstart#1-install)，並替換指令稿中的 `targets`：

```python
targets = [
    EvalTarget(Harness.CLAUDE_CODE, "litellm_proxy/model-a", label="claude-code"),
    EvalTarget(Harness.CODEX, "litellm_proxy/model-b", label="codex"),
]
```

最初的代理程式呼叫仍使用 Tool Loop。評估會比較這兩個新目標。請使用每個 harness 支援的模型群組。這會同時改變 harness 與模型；若要衡量單一變化，請在 harness 支援相同模型時固定另一項。

SDK 會針對每個目標執行每項任務，並將該組合重複 `trials` 次。請為每項任務指定唯一的 ID，並為每個目標指定唯一的 label。

## 為您需要的結果選擇檢查 {#checks}

回答、寫作、研究與檔案變更都使用相同的任務介面：

| 檢查 | 用途 |
|---|---|
| `PredicateCheck` | 最終答案、工具呼叫，或具型別 `Result` 的其他部分 |
| `JudgeCheck` | 依據評分標準評判答案，使用明確指定的評判模型 |
| `CommandCheck` | 以結束碼為零即通過的命令檢查檔案或專案行為 |

對於寫作任務，請替換指令稿中的 `task`，並允許您的金鑰呼叫 `judge` 模型群組：

```python
from litellm import JudgeCheck

task = EvalTask(
    id="support-reply",
    prompt="Reply to a customer who was charged twice. Do not promise a refund.",
    check=JudgeCheck(
        model="litellm_proxy/judge",
        rubric=(
            "Acknowledge the duplicate charge, give a clear next step, "
            "and do not guarantee a refund."
        ),
    ),
)
```

請選擇支援 JSON 輸出的評判模型，並為其呼叫編列預算。它會收到任務提示、答案與回報的檔案變更，以及您的評分標準。否定的裁決會產生 `fail`；失敗的請求或無效的裁決會產生 `error`。

對於需要檔案的任務，請在任務中加入 `workspace`。每次嘗試都會取得一份複本。執行器會在建立評估 sandbox 之前拒絕符號連結，包括內部連結、損毀的連結與連結的工作區根目錄。本機執行會使用您使用者的權限。執行檔案任務之前，請先閱讀[工作區與 sandbox 指南](/docs/harness/evaluation#evaluate-a-task-that-changes-files)。

## 重點整理 {#key-takeaways}

- 定義一次任務及其成功檢查，再選擇目標。
- 使用重複試驗，並檢查未成功的執行。
- 將通過率與成本及時間一併比較，並檢查不完整的指標。
- 將成績卡匯出為 JSON，以保留比較記錄。

## 常見問題 {#frequently-asked-questions}

### 任務需要儲存庫嗎？ {#do-tasks-need-a-repository}

不需要。上述的支援分流與寫作任務只使用提示與檢查。只有當任務需要起始檔案時，才加入工作區。

### 我需要資料庫嗎？ {#do-i-need-a-database}

評估執行器會在記憶體中回傳成績卡，也可以將其匯出為 JSON。它會把評估識別碼加入模型請求的 metadata，讓您可以在現有的閘道記錄中關聯呼叫。持久保存的閘道支出記錄使用閘道現有的資料庫設定。

### 我可以在非同步應用程式中執行評估嗎？ {#can-i-run-evaluations-in-an-async-application}

請在您的非同步函式或 notebook 中，使用 `await litellm.aagent(...)` 進行初始執行，並使用 `await litellm.aagent_eval(...)` 進行評估。任務、目標與選項保持相同。

### 我可以搭配 LiteLLM OSS 使用嗎？ {#can-i-use-this-with-litellm-oss}

評估 API 正在開源 SDK 中開發。發布版本確定後會出現在本指南中。[LiteLLM Enterprise](https://litellm.ai/enterprise) 為正式環境部署提供閘道控制與支援。

## 執行您自己的比較 {#run-your-own-comparison}

請挑選一項您可以評分的任務，針對兩個目標執行，並檢查結果。在發現希望未來變更能捕捉的失敗時，再擴充任務集。[完整的評估指南](/docs/harness/evaluation)涵蓋設定命令、sandbox 與執行限制。

## 推薦閱讀 {#recommended-reading}

[評估 API 參考](/docs/harness/api_reference#evaluations)、[代理程式 harness 快速入門](/docs/harness/quickstart)，以及[將 harness 連接到您的 AI Gateway](/docs/harness/gateway)。

</EvaluationPage>

{/* truncate */}
