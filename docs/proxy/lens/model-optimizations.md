---
title: 模型最佳化
description: 使用 Live、Shadow 與 Offline 測試，在 Lens 中比較模型品質、成本與延遲。
slug: /proxy/lens/model-optimizations
---

# 模型最佳化 {#model-optimizations}

{/* keep-version-note: This Lens source walkthrough covers three comparison workflows, independent of a LiteLLM release. */}

在變更代理程式的預設模型之前，先在您代理程式的工作上比較模型。在 **Lens > Model optimizations** 中，您可以比較答案品質、成本與延遲，然後開啟個別答案及其來源 trace

選擇收集比較結果的方式：

| 類型 | 執行內容 | 用途 |
| --- | --- | --- |
| [Live](#live) | 您的代理程式會以候選模型為一部分即時請求提供服務 | 在真實使用者流量上衡量品質與成本 |
| [Shadow](#shadow) | Lens 會從取樣的 trace 重播最終模型呼叫 | 在使用者持續收到原始回應的同時比較答案 |
| [Offline](#offline) | Lens 會使用每個模型測試已儲存的資料集 | 使用最終呼叫重播或您的完整代理程式，比較相同的案例 |

您目前的模型是**基準**。您選取的其他模型是**候選模型**。每項比較都有各自的結果、品質設定，以及暫停／繼續控制項

## 開始之前 {#before-you-start}

使用連接至 LiteLLM 閘道的 [Lens 部署](./deployment/litellm.md)，讓代理程式 trace 傳送至 Lens，並透過該閘道提供模型。使用代理程式管理員帳戶開啟 Lens，以建立與控制比較。管理員檢視者可以讀取結果

在執行您自己的比較時，請將 **Demo data** 保持關閉。如要使用範例流量探索畫面，請使用[示範演練](./model-optimizations-demo.md)

對於以下可執行的範例，請使用 Python 3.11 或更新版本。複製 Lens 並安裝 SDK 與範例相依性： {/* keep-python-version: This is the lens-evals SDK requirement. */}

```sh
git clone https://github.com/BerriAI/lens.git
cd lens
python -m pip install './src/sdk[examples]'
```

透過您的環境或 secret 管理工具，將以下值載入您的 shell：

| 變數 | 值 |
| --- | --- |
| `LENS_BASE_URL` | 可從您的代理程式連線的閘道來源，例如 `https://gateway.example.com` |
| `LENS_API_KEY` | 執行比較的帳戶所用的閘道金鑰 |
| `LITELLM_PROXY_API_BASE` | 閘道模型 API 基礎位址，例如 `https://gateway.example.com/v1` |
| `LITELLM_PROXY_API_KEY` | 模型呼叫所用的閘道金鑰 |
| `LENS_TRACE_ENDPOINT` | 來自 Lens 追蹤設定的完整 OTLP HTTP trace 端點，以 `/v1/traces` 結尾 |
| `LENS_TRACE_API_KEY` | 在 Lens 中建立的追蹤金鑰 |
| `LENS_OPTIMIZATION_AGENT` | 要記錄的代理程式名稱，例如 `model-comparison-example` |
| `LENS_OPTIMIZATION_BASELINE` | 您閘道目錄中目前模型的確切名稱 |

請為同一個團隊與使用者使用推論與追蹤憑證，讓 Lens 能將模型花費對應到 trace。[範例代理程式](https://github.com/BerriAI/lens/blob/main/src/sdk/examples/optimizations.py)會讀取這些值、呼叫閘道，並匯出已完成的 trace

執行一次，讓該代理程式出現在 Lens 中：

```sh
python src/sdk/examples/optimizations.py shadow --question 'What is 3 times 6?'
```

此命令會印出 trace ID 與模型。在 **Traces** 下找到該 ID，並在建立比較之前開啟其答案

## Live {#live}

在您代理程式即時執行的一部分上測試候選模型。使用者會收到指定模型提供的答案，而您可以將其成本與品質與基準進行比較

設定候選模型獲得的流量占比。例如，流量為 10% 且有兩個候選模型時，每個候選模型約獲得 5% 的執行次數，其餘 90% 留在基準模型上。使用現有的 0 到 10 分使用者回饋或 LLM 評判來衡量品質

### Live 範例 {#live-example}

1. 開啟 **Model optimizations > New optimization > Live**
2. 選擇您的代理程式與 **Current model**。設定 **Traffic**，然後在 **Models** 下選取候選模型
3. 在 **Quality** 下選擇 **LLM judge** 與 **Judge model**。開啟 **Advanced** 以設定 **Quality rubric** 與評判取樣百分比
4. 選擇 **Start live test**，然後執行：

```sh
python src/sdk/examples/optimizations.py live --question 'What is 3 times 6?'
```

[可執行的 Live 範例](https://github.com/BerriAI/lens/blob/main/src/sdk/examples/optimizations.py)會選取模型、執行代理程式，並印出 trace ID、模型，以及是否使用基準模型：

```json
{"traceId": "11111111111111111111111111111111", "model": "candidate-model", "baseline": false}
```

開啟比較，查看執行次數、成本、延遲與評判分數。使用具代表性的問題重複執行，為兩個群組收集結果。對於 **User feedback**，分數來自已附加至每筆 trace 的回饋

如要連接您自己的代理程式，請在執行前加入此呼叫，並將傳回的模型用於該次執行的模型呼叫：

```python
assignment = await lens.optimizations.aassign(
    agent=agent_name,
    baseline=current_model,
    trace_id=trace_id,
)
result = await agent.run(input, model=assignment.model, trace_id=trace_id)
```

比較中的 **Connect live routing** 面板會提供已填入您的代理程式與基準模型的程式碼片段。請使用相同的 trace ID 匯出 span。如果指派失敗，SDK 會保留提供的基準模型；請使用 `fail_open=False`，以便在設定期間顯示連線錯誤

## Shadow {#shadow}

在傳入流量旁比較候選答案。在取樣的 trace 完成後，Lens 會將其最終記錄的模型請求傳送給候選模型，並根據原始答案為其答案評分。您的使用者仍會收到原始回應

Shadow 衡量最終呼叫的成本與品質。使用它來比較代理程式的答案步驟，同時保留已記錄的對話與工具結果

### Shadow 範例 {#shadow-example}

1. 開啟 **Model optimizations > New optimization > Shadow**
2. 選擇代理程式、目前模型、候選模型與評判。將 **Traffic** 設定為要取樣的已完成 trace 占比
3. 選擇 **Start shadow test**，然後傳送一次有追蹤的基準執行：

```sh
python src/sdk/examples/optimizations.py shadow --question 'What is 3 times 6?'
```

[可執行的 Shadow 範例](https://github.com/BerriAI/lens/blob/main/src/sdk/examples/optimizations.py)會印出原始 trace ID 與模型。開啟比較，查看基準與候選答案、其評判分數，以及每次最終呼叫的成本

對於您自己的代理程式，請在最終模型 span 上，將完整的 Chat Completions 請求 JSON 記錄為 `lens.replay.request`。請包含訊息、工具呼叫 ID、函式定義，以及取樣或回應格式設定。請勿將憑證放入該屬性中。此範例會連同模型回應 ID 一起匯出此請求，Lens 會使用該 ID 找出該次呼叫的成本

## Offline {#offline}

在已儲存的資料集修訂版本上比較模型。由您選擇案例、基準模型、候選模型與評判。基準模型與候選模型都會進行新的模型呼叫，Lens 會使用相同的評分標準為它們評分

選擇 **Final model call**，以重複使用已記錄的對話與工具結果。選擇 **Full agent**，以為每個案例執行您代理程式的工具與模型呼叫。Offline 指的是已儲存的資料集；兩種路徑都會透過您的閘道發出真實的模型請求

### Offline 範例 {#offline-example}

1. 開啟一筆 trace 並選擇 **Add to dataset**。將其對話儲存為案例，然後開啟資料集
2. 檢閱納入的案例及其 **Expected** 答案。將您的編輯儲存為修訂版本
3. 選擇 **Optimize models**，保留 **Final model call**，並選取目前模型、候選模型與評判
4. 選擇 **Run comparison**

Lens 會使用每個模型執行納入的案例。批次完成時，比較會進入 **Completed** 狀態。開啟案例以比較答案，並依照 **Open source trace** 檢查其記錄的上下文

此比較使用選取的資料集修訂版本。後續編輯屬於新的修訂版本，因此您可以重新執行一組已知的案例

### Full-agent 範例 {#full-agent-example}

使用此路徑比較整個任務，包括工具執行與多次模型呼叫。您的 SDK 執行器會在您的環境中執行代理程式，該環境具備其相依性與應用程式存取權

1. 開啟資料集並選擇 **Optimize models**
2. 選取 **Full agent**、目前模型、候選模型與評判，然後選擇 **Run comparison**
3. 在比較中開啟 **Run your agent**。複製其程式碼片段以連接您的代理程式，或使用[可執行的 full-agent 範例](https://github.com/BerriAI/lens/blob/main/src/sdk/examples/optimizations.py)
4. 以此範例而言，請將 `LENS_OPTIMIZATION_AGENT` 設定為資料集的代理程式名稱。從該面板中的 `lens.optimizations.arun(...)` 呼叫複製比較 ID：

```sh
export LENS_OPTIMIZATION_ID='comparison-id-from-the-runner-snippet'
python src/sdk/examples/optimizations.py offline
```

對於一個案例與兩個模型，此範例會印出：

```text
Submitted 2 full-agent trials
```

每次試驗都會使用資料集案例與要使用的模型呼叫您的任務。您的任務會傳回新的已完成 trace。Lens 接著會記錄答案、代理程式總成本、持續時間與評判分數

如要使用您自己的代理程式，請在產生的程式碼片段中調整其介面：

```python
import os
from lens import Lens, Run
from my_agent import agent

lens = Lens(os.environ["LENS_BASE_URL"], os.environ["LENS_API_KEY"])

async def task(case, model):
    result = await agent.run(
        case.input,
        model=model,
        trace_attributes={"lens.optimization.request_id": case.meta["request_id"]},
    )
    return Run(trace={"trace_id": result.trace_id})

completed = await lens.optimizations.arun(
    os.environ["LENS_OPTIMIZATION_ID"], task=task
)
print(f"Submitted {completed} full-agent trials")
```

將 `my_agent` 替換為您應用程式的代理程式。使用提供的模型，在根 span 上匯出試驗 ID，並傳回已完成的 trace ID。SDK 回呼支援您的多步驟代理程式；可執行的範例提供一個小型單次呼叫代理程式來示範連接方式

## 讀取結果 {#read-results}

模型表格會顯示執行次數、分數、成本、延遲與節省金額。成本／品質圖表可協助您比較取捨。開啟案例以並排查看答案及其來源 trace，或選擇 **Export** 將模型表格下載為 CSV

此 full-agent 計算機範例以每次試驗兩次模型呼叫與一次工具呼叫，回答了「What is 3 times 6?」：

| 模型 | 答案 | 評判／10 | 代理程式總成本 | 持續時間 |
| --- | --- | ---: | ---: | ---: |
| `openai/gpt-6.1-sol` | `18` | 10.00 | $0.000680 | 3.08s |
| `openai/gpt-6-luna` | `18` | 10.00 | $0.000054 | 2.82s |

![Lens 中 full-agent 計算機範例的結果，顯示兩個模型的分數、成本、延遲與節省金額](/img/lens/model-optimizations-results.jpg)

每個模型只有一個案例時，此範例會顯示 **No supported recommendation yet**。請在選擇模型之前收集具代表性的案例。建議需要至少 30 筆已評分觀察結果，且品質信賴區間界限在您選取的容許範圍內。回饋比較還需要至少 50% 的覆蓋率，且各群組間的覆蓋率相近

缺少的成本或品質會保持空白。請檢查執行與評判錯誤計數，然後檢查受影響的案例與來源 trace，查看失敗的呼叫、不完整的答案或模型備援。表格中的成本代表服務花費；重播與評判會另外產生閘道費用

## 控制比較 {#control-a-comparison}

**Pause** 會停止新的指派與已排入佇列的呼叫。**Resume** 會繼續收集。**Finish test** 會凍結 Live 或 Shadow 比較至今收集的結果，包括已收到的回饋與花費。已在進行中的呼叫仍可完成並產生費用

使用 **Run again**，以相同設定建立另一項比較。從 Shadow 或 Offline 建議中，**Start live test** 會將建議的模型帶入 Live 設定

## 執行參考 {#execution-reference}

模型探索與重播使用 Lens 伺服器設定的閘道金鑰。Live 指派還會檢查呼叫者獲准使用的模型。同一代理程式、團隊與基準模型的 Live 比較不得重疊

建議使用 95% 常態近似下限：重播使用成對分數差異，Live 使用獨立群組。缺少指標，以及執行或評判錯誤，都會使建議無法產生

最終呼叫重播支援擷取的 Chat Completions 文字與函式工具請求。對於多模態輸入、代管工具、模稜兩可的平行最終呼叫，或提供者專屬的重播中繼資料，請使用 full-agent 執行。最終呼叫重播可擷取最多 1 MB 的請求與最多 500 個 span 的 trace

Full-agent 執行使用 SDK 回呼及其 `Case`／`Run` 合約。Lens 會將每筆提交的 trace 對應到試驗、建立時間、團隊、代理程式與請求的模型。每項任務有八分鐘的執行時間，之後最多有 90 秒用於 trace 擷取。在程序中斷後，作用中的租約可能需要最多十分鐘才會到期。不確定的付費呼叫會保留供檢閱，而不會觸發另一次執行

比較支援八個候選模型與 500 個納入的資料集案例。Lens 最多儲存 100 項比較，每項比較有 5,000 次 Live 指派，進行中的比較約有 4,500 列已收集的結果列。達到取樣上限時，收集會暫停
