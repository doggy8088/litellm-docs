---
title: "Investigations"
description: "檢閱代理程式活動、調查失敗，並閱讀支援證據。"
slug: "/proxy/lens/investigations"
---

# 調查 {#investigations}

## 執行您的第一次調查 {#run-your-first-investigation}

### 連線分析器 {#connect-the-analyzer}

以 proxy 管理員身分登入，並在 **Observability** 下開啟 **Lens > Investigations**。活動可用後，按一下 **Connect worker**。選擇 **Analysis model** 和 **Monthly limit**，然後按一下 **Get install command**。預設限額為每月 $100。這會建立一個僅限於您所選模型的虛擬金鑰；分析支出會在 **Virtual Keys** 中顯示於該金鑰下。若要使用既有虛擬金鑰或變更 proxy URL，請開啟 **Advanced options**。既有 worker 可透過該 worker 的 **Settings** 變更其虛擬金鑰，而不必更換其 worker token。

在可連線到您的 LiteLLM deployment 的伺服器上執行 Docker 命令。請保持命令私密，因為其中包含 worker token。等待 **Worker connected**。worker 就緒後，便可建立調查。

![Lens worker 設定，包含分析模型與每月限額。](/img/lens/worker-setup.png)

此 worker 會在您的基礎架構上執行。它會向 LiteLLM 檢查排程中或已請求的調查，並將結果傳回。它透過 LiteLLM 呼叫您選定的模型，即使您關閉儀表板也會持續執行。

產生的命令會啟動一個 worker 程序，一次執行一項調查。其 concurrency 設定會控制在該調查中審查多少個 trace。執行更多 worker 程序可讓更多調查同時進行；其分析成本會共用指派的虛擬金鑰預算。

### 選擇 traces {#choose-the-traces}

按一下 **New investigation**。在 **Activity** 中，為調查命名並選擇一個 **Agent**。下拉選單會列出已記錄的 agent 名稱；若保留空白，則會包含所有可存取的活動。開啟 **Advanced filters** 可選擇 agent traces、LLM 請求，或兩者皆選，將選取範圍限制於某個團隊，或新增 metadata 條件。請求分析會使用儲存在 ClickHouse 中的請求記錄。metadata 條件會精確比對已記錄的鍵和值。

### 描述要檢查的內容 {#describe-what-to-check}

按一下 **Continue** 以開啟 **Expectations**。在 **What should the agent be doing?** 中描述您的 agent 應該做什麼。

例如：

> 研究 agent 會以來源回答使用者的問題。它會在撰寫最終答案前檢查來源，並在無法驗證某項主張時加以說明。

在 **What should we look out for?** 下，使用 **Add check** 新增您希望 Lens 回答的問題。即使您留白，也會檢查預期行為。您可以編輯建議的問題，或自行撰寫：

```text
Find claims that conflict with the retrieved sources.
Find tool failures that the agent does not recover from.
Find repeated searches that add no new information.
```

設定完成後，您可以在 **Criteria** 下檢視這些內容，並透過動作選單中的 **Edit investigation** 進行變更。

![調查的預期行為與個別檢查。](/img/lens/investigation-expectations.png)

### 開始執行 {#start-the-run}

按一下 **Continue** 以開啟 **Run**。設定時間範圍與要分析的符合執行比例。預設情況下，Lens 會檢閱過去一天中 100% 的符合活動，且不限制數量。預覽會顯示有多少次執行符合條件，以及有多少會被分析。按一下 **Open run** 可檢視範例。新收到的 trace 需要兩分鐘的穩定時間後才會出現在此處。

Lens 預設使用 worker 的分析模型。若要變更模型、設定執行次數上限，或變更每月限額，請開啟 **Advanced options**。trace 內容會透過 LiteLLM 傳送至所選模型。

按一下 **Run investigation** 可執行一次。若要監控，請在 **Advanced options** 中啟用 **Repeat this investigation**，將 **Repeat every** 設為您要的間隔，然後按一下 **Run and monitor**。

Lens 會平行檢閱所選執行，將相似觀察結果分組，並在儲存發現前檢查原始證據。

使用 **Run now** 可用已儲存的設定再執行另一項調查。排程中的調查會使用相同設定。使用動作選單中的 **Duplicate** 可提出一次性問題，或在不變更原始 lens 的情況下調查不同的選取範圍。使用 **Pause monitoring** 可停止排程調查。

## 閱讀發現 {#read-the-findings}

調查完成後，開啟 **Findings**。**Needs attention** 會顯示問題，並依優先順序排列。**Patterns** 會顯示其他觀察結果，包括成功復原與有用的行為。

開啟某個發現可閱讀發生了什麼事，以及建議的下一步。展開 **Evidence by run** 可閱讀引文。按一下 **Open original step** 可查看其 trace 中所引用的步驟。

![一個範例發現，包含建議的下一步與支援證據。](/img/lens/investigation-findings.png)

使用 **History** 可返回先前的執行及其發現、設定、進度、總持續時間與成本。持續時間包含等待 worker 的時間。**Traces** 會顯示該次執行所選取的活動；當選取這些活動類型時，此分頁稱為 **Requests** 或 **Traces & requests**。

發現會描述所檢閱的樣本。**Linked runs** 會計算引用的支援執行數；這不是所有失敗次數的計數。證據也可以包含標記的反例。

### 提供回饋 {#give-feedback}

如果 Lens 標示了預期行為，請在 **Feedback** 中說明原因，然後按一下 **This is expected**。Lens 會在後續對相同 lens 的調查中使用該回饋。

修正問題後，按一下 **Mark resolved**。如果相同問題出現在新的執行中，Lens 可能會重新開啟它。
