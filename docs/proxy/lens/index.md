---
slug: /proxy/lens
title: LiteLLM Lens
description: 使用 LiteLLM Lens 追蹤代理程式執行並調查重複發生的失敗。
image: /img/lens/lens_hero_labeled.gif
---

# LiteLLM Lens {#litellm-lens}

<p>
  <a className="button button--primary button--sm" href="https://forms.gle/3GC1Ner4vjthGWi18">搶先體驗</a>
</p>

![代理程式群從 LiteLLM 閘道流入每次執行的一筆追蹤，而 LiteLLM Lens 則將改進回饋回去。](/img/lens/lens_hero_labeled.gif)

一旦代理程式進入正式環境，您就無法手動檢視每一筆追蹤。

LiteLLM Lens 使用 AI 代理程式分析您的代理程式追蹤並找出重複出現的問題。您指定預期行為。Lens 會調查失敗、將相似問題分組，並將每個發現連結到原始追蹤。

使用 **Lens > Traces** 手動檢查個別執行。使用 **Lens > Investigations** 依需求或按排程調查一組執行。

在設定之前，請開啟 Lens 右上角的 **Demo data**，以瀏覽範例追蹤、調查和連結的證據。將其關閉即可返回您的工作區。若要在設定任何內容之前先查看發現的欄位，請閱讀 API 參考文件中的[範例發現](./api.md#read-findings)。

## 開始使用 {#get-started}

Lens 獨立執行。請先啟動 Docker，然後在一個空資料夾中執行以下指令：

```sh
curl -fsSLO https://raw.githubusercontent.com/BerriAI/lens/main/deploy/lens/compose.yaml && docker compose up --wait && docker compose logs -n1 credentials
```

開啟 [http://localhost:4318/ui/](http://localhost:4318/ui/)，然後貼上該指令印出的設定權杖。您不需要 LiteLLM 閘道、Kubernetes 或模型提供者金鑰。[獨立快速入門](./deployment/local.md)涵蓋登入與第一筆追蹤。

如果您的團隊已經在執行 Lens，請[送出您的第一筆追蹤](./first-trace.md)。選擇您的框架、為代理程式命名，然後執行範例。

對於團隊，請在[伺服器](./deployment/server.md)上部署 Lens，或部署到 [Kubernetes](./deployment/kubernetes.md)，或[將它加入您的 LiteLLM 儀表板](./deployment/litellm.md)。如果 Lens 已經在執行，請[將該部署連接到您的閘道](./deployment/litellm.md#1-get-the-lens-address)。每份指南的結尾都包含連線檢查與第一筆追蹤。

**查看您的 coding agent 工作階段：**請先啟動 Lens、產生追蹤金鑰，然後依照 [Claude Code](./coding-agents.md#claude-code) 或 [Codex](./coding-agents.md#codex) 的設定步驟操作。開啟 **Traces** 即可查看記錄的活動。

一旦有追蹤可用，就[執行調查](./investigations.md)或使用[API 參考文件](./api.md)。

使用[模型最佳化](./model-optimizations.md)，在即時流量或已儲存的資料集上比較模型。選擇 Live、Shadow 或 Offline，並檢查品質、成本、延遲與個別答案。

## Lens 如何運作 {#how-lens-works}

**1. 擷取您代理程式的追蹤**

將追蹤從您的代理程式傳送到 Lens。開啟一次執行，即可檢查其輸入、回應和工具呼叫，以及延遲與成本。

![Lens Traces 頁面，顯示支援代理程式的執行，包含輸入、持續時間、成本、發現與使用者意見回饋。](/img/lens/overview-traces.webp)

**2. 找出您的代理程式不足之處**

執行調查以找出您所有追蹤中的問題。檢視發現，其中包含範例、建議的修正方式，以及每個問題在所分析追蹤中出現的頻率。

![Lens 發現，顯示重複的訂單查詢、建議轉交支援團隊，以及受影響追蹤的比例。](/img/lens/overview-finding.webp)

**3. 將這些執行轉成測試案例**

將執行儲存到資料集中，並加入您預期的回應。匯出資料集，以測試對代理程式提示詞、工具或模型的變更。

![Lens 資料集，包含支援請求、記錄的回覆、預期回應，以及 Export JSONL 按鈕。](/img/lens/overview-dataset.webp)
