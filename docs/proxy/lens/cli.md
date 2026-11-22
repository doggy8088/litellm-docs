---
title: 用 Lens CLI 比較模型、harness 與代理程式
sidebar_label: CLI 教學
description: 在您自己的任務上評估模型、harness 與自訂代理程式。
slug: /proxy/lens/cli
---

# 用 Lens CLI 比較模型、harness 與代理程式 {#compare-models-harnesses-and-agents-with-the-lens-cli}

在您自己的任務上評估模型、harness 與自訂代理程式。

![真實的 Lens CLI 執行畫面，包含原生 Lens 標誌以及每個模型與 harness 的進度](/img/lens/cli/progress.webp)

正在進行的真實執行。本教學使用自己的任務集與設定

{/* keep-version-note: This tutorial targets an unreleased Lens CLI and LiteLLM agent-evaluation preview, not a published package. */}

:::info[預覽]

本教學需要具備 LiteLLM 代理程式評估支援的私人 CLI 預覽版；尚未提供公開套件版本

:::

## 1. 連接您的模型與代理程式 {#1-connect-your-models-and-agents}

使用現有的預覽環境與 [支援 Lens 的 LiteLLM 閘道](./deployment/litellm.md)。請確認 `lens run --help` 會列出 `--trials`。本範例比較 Tool Loop 與 Codex，因此 `codex` 執行檔也必須位於 PATH 上

```bash
lens run --help
codex --version
```

下載 <a href="/examples/lens-cli/evals.py" download>evals.py</a> 與 <a href="/examples/lens-cli/tasks.csv" download>tasks.csv</a> 到同一個目錄。此設定包含真實的模型呼叫、明確的通過檢查，以及自訂的 `EvalAgent`

設定您的閘道根網址（不含 `/v1`），並將 `model-a` 與 `model-b` 換成您閘道 **Models** 頁面上的確切 **Model Name** 值。在 Bash 或 Zsh 中，輸入有權呼叫這些模型的虛擬金鑰：

```bash
export LITELLM_PROXY_API_BASE="https://gateway.example.com"
read -rs LITELLM_PROXY_API_KEY
export LITELLM_PROXY_API_KEY
export LENS_MODEL_A="litellm_proxy/model-a"
export LENS_MODEL_B="litellm_proxy/model-b"
```

此設定會透過 Tool Loop 與 Codex 比較兩個模型，並加上您的自訂代理程式：

```python
models = [os.environ["LENS_MODEL_A"], os.environ["LENS_MODEL_B"]]

targets = [EvalTarget(Harness.TOOL_LOOP, model) for model in models]
targets += [EvalTarget(Harness.CODEX, model) for model in models]
targets += [MyAgent("my-agent")]
```

將下載檔案中的 `MyAgent.run` 換成您代理程式的執行程式碼。請將每次嘗試的狀態保留在 `run` 內，因為嘗試可能會同時執行。當閘道別名沒有本機價格對應時，自訂代理程式會保留其答案與用量，並將成本回報為未知。其他[支援的 harness](/docs/harness)包括 Claude Code、OpenCode、Pi 與 Deep Agents，各有自己的執行階段相依性

## 2. 透過每種設定執行相同的任務 {#2-run-the-same-tasks-through-each-configuration}

在下載目錄中執行：

```bash
lens run tasks.csv --config evals.py --trials 2
```

三則支援工單會透過四種模型／harness 組合與您的自訂代理程式各執行兩次：共 30 次嘗試，會產生真實的 API 費用。請依您代理程式的工作內容調整任務與成功檢查

![擷取的 Lens CLI 預覽報告，比較模型與 harness 的結果](/img/lens/cli/results.webp)

擷取自另一組任務集的預覽報告。範例下載使用上述設定；您的結果取決於您的任務、模型與代理程式

## 3. 比較品質、成本與失敗 {#3-compare-quality-cost-and-failures}

請先閱讀 **PASS**、**FAIL** 與 **ERR**，再依成本或延遲選擇。建議會在最佳通過率五個百分點以內、指標完整且至少通過一次的設定中，選擇每通過一案成本最低者

![擷取的 Lens CLI 預覽圖表，比較成本與通過率](/img/lens/cli/cost-quality.webp)

位置愈高、愈靠左，代表花費愈少、通過愈多。請先檢查失敗，再變更預設值。請使用更大、具代表性的資料集來做決定

## 4. 在 Lens 中開啟擷取的呼叫 {#4-open-the-captured-calls-in-lens}

請將比較經由支援 Lens 的閘道進行路由，以擷取模型呼叫，然後開啟 **Lens > Traces**，檢查最近的請求、提示、回應與花費。完整的代理程式與工具軌跡需要[設定代理程式追蹤](./first-trace.md)；CLI 會將報告保留在 `.lens/runs` 中，而不會上傳

![Lens Traces 介面範例，用於開啟一次執行並檢查其詳細資訊](/img/lens/overview-traces.webp)

Lens UI 範例，並非上述比較的追蹤記錄

### 將您的閘道資料集帶入下一次執行 {#bring-your-gateway-datasets-into-the-next-run}

在 **Lens > Datasets** 中開啟您的資料集，選取一個固定版本，然後點選 **Export JSONL**。將其儲存為 `dataset.jsonl`，放在範例檔案旁邊

下載 <a href="/examples/lens-cli/dataset_to_csv.py" download>dataset_to_csv.py</a>，然後執行：

```bash
python dataset_to_csv.py && \
  lens run gateway-tasks.csv --config evals.py --trials 2
```

轉換器會保留訊息、預期結果與完整的案例中繼資料。此分類器將對話讀為提示文字，並需要預期的支援工單類別。請先在 Lens 中修正未評分的案例，再匯出新版本後重試。對於其他代理程式任務，請重新連接您的工具與狀態，並更換指示與通過檢查。比較設定時請保持版本固定
