---
title: "Investigations"
description: "檢閱代理程式活動、調查失敗，並閱讀支援證據。"
slug: "/proxy/lens/investigations"
---

# 調查 {#investigations}

## 執行您的第一次調查 {#run-your-first-investigation}

您需要一個[正在執行的 Lens 安裝](./deployment.md)、對獨立 Lens 或其連接閘道的管理員存取權，以及至少一筆[已記錄的代理程式追蹤](./first-trace.md)。

### 1. 啟用調查 {#connect-the-analyzer}

使用 [Configure analysis models](https://github.com/BerriAI/lens/blob/main/docs/analysis.md) 在 Lens 伺服器上設定分析模型及其提供者憑證。然後開啟 **Settings > Analysis** 並選取 **Check configuration**。當調查 worker 就緒時，設定的模型應會與 **Analysis is configured** 一起出現。

提供者憑證會保留在 Lens 伺服器上。您為每項調查選擇分析模型與每月支出限額。Lens 可以直接呼叫提供者，或使用明確設定的 LiteLLM 模型端點。就緒狀態確認的是設定；第一項調查會驗證實際的提供者存取。

### 2. 選擇 traces {#choose-the-traces}

按一下 **New investigation**。在 **Activity** 中，為調查命名並選擇一個 **Agent**。下拉選單會列出已記錄的 agent 名稱；若保留空白，則會包含所有可存取的活動。開啟 **Advanced filters** 可選擇 agent traces、LLM 請求，或兩者皆選，將選取範圍限制於某個團隊，或新增 metadata 條件。請求分析會使用儲存在 ClickHouse 中的請求記錄。metadata 條件會精確比對已記錄的鍵和值。

設定 **Review the last** 與 **Sample (%)**，以選擇時間範圍與符合執行的百分比。預設值會檢閱過去一天中 100% 的符合活動。預覽會隨著您變更選取範圍而更新，並讓您檢查一筆符合的執行。

### 3. 描述要檢查的內容 {#describe-what-to-check}

按一下 **Continue** 以開啟 **Criteria**。在 **What should the agent be doing?** 中描述您的 agent 應該做什麼。

例如：

> 研究 agent 會以來源回答使用者的問題。它會在撰寫最終答案前檢查來源，並在無法驗證某項主張時加以說明。

在 **Watch for** 下，選取您要檢查的行為。使用 **Add your own** 描述另一項檢查。即使您將這些欄位留白，也會檢查預期行為。例如：

```text
Find claims that conflict with the retrieved sources.
Find tool failures that the agent does not recover from.
Find repeated searches that add no new information.
```

設定完成後，您可以在 **Criteria** 下檢視這些內容，並透過動作選單中的 **Edit investigation** 進行變更。

### 4. 開始執行 {#start-the-run}

按一下 **Continue** 以開啟 **Run**。在 **Advanced options** 下，檢查 **Analysis model** 與 **Monthly limit (USD)**，並可選擇設定 **Maximum runs** 或選擇個別執行。使用說明會在您開始前顯示所選模型與支出限額。

Lens 會透過其設定的提供者連線，將所選的 trace 內容傳送至該模型。提供者費用適用。變更調查的模型不會變更您代理程式自身的模型連線。

若要執行單次調查，請清除 **Keep watching for new traces** 並按一下 **Run investigation**。若要監控，請保持啟用，將 **Check every** 設為所需的間隔，然後按一下 **Run and monitor**。

Lens 會平行檢閱所選執行，將相似觀察結果分組，並在儲存發現前檢查原始證據。

使用 **Run now** 可用已儲存的設定再執行另一項調查。排程中的調查會使用相同設定。使用動作選單中的 **Duplicate** 可提出一次性問題，或在不變更原始 lens 的情況下調查不同的選取範圍。使用 **Pause monitoring** 可停止排程調查。

## 閱讀發現 {#read-the-findings}

調查完成後，開啟 **Findings**。**Needs attention** 會顯示問題，並依優先順序排列。**Patterns** 會顯示其他觀察結果，包括成功復原與有用的行為。

開啟某個發現可閱讀其 **Summary** 與 **Suggested fix**。**Frequency** 會顯示受影響的取樣 trace 占比。**Examples** 會列出附有引文的支援執行。按一下引文上的 **View span** 可查看其 trace 中所引用的步驟。

![一個範例發現，包含其摘要、建議的修正、頻率與支援範例。](/img/lens/investigation-findings.png)

使用 **History** 可返回先前的執行及其發現、設定、進度、總持續時間與成本。持續時間包含等待 worker 的時間。**Agent traces** 會顯示該次執行所選取的活動；當選取這些活動類型時，此分頁稱為 **LLM requests** 或 **Traces and requests**。

發現會描述所檢閱的樣本。**Examples** 會列出引用的支援執行；這不是所有失敗的清單。證據也可以包含標記的反例。

### 提供回饋 {#give-feedback}

如果 Lens 標示了預期行為，請在 **What should Lens remember?** 下方說明原因，然後按一下 **This is expected**。Lens 會在後續對相同 lens 的調查中使用該回饋。

修正問題後，按一下 **Mark resolved**。如果相同問題出現在新的執行中，Lens 可能會重新開啟它。

## 調查如何執行 {#how-investigations-run}

Lens 在您的基礎架構上執行，並擁有自己的排程器、執行與儲存的結果。即使您關閉儀表板，它也會持續執行。複本透過 ClickHouse 狀態協調工作，並呼叫設定的分析提供者。

每項調查都有自己的每月支出限額。Lens 會在呼叫提供者之前預留預算，並將已知的已完成呼叫成本記錄在執行歷史中，包括在取消期間完成的呼叫。如果您透過閘道模型金鑰路由分析，該金鑰現有的閘道計費與限制也會適用。
