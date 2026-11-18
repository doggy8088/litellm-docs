---
title: 模型最佳化示範
description: 使用範例流量與結果，探索 Live、Shadow 與 Offline 模型比較。
slug: /proxy/lens/model-optimizations-demo
---

# 模型最佳化示範 {#model-optimizations-demo}

{/* keep-version-note: This walkthrough runs the Lens source demo, independent of a LiteLLM release. */}

使用本機 Lens 套件執行實際的 LiteLLM 閘道儀表板。Lens 現有的 **Demo data** 模式提供合成流量、比較、資料集與執行器連線

此示範一開始有四項已完成的最佳化，每項對應不同的代理程式：支援（搭配即時使用者回饋）、銷售（搭配即時 LLM 評判）、研究（搭配 Shadow）與發行審查（搭配 Offline）

## 在本機啟動 {#start-locally}

請使用 Node 24.14.1 或更新版本、npm 11.10.0 或更新版本、Docker，以及另一個已安裝儀表板相依性與 proxy Python 環境的 LiteLLM 開發 checkout。Proxy 原始碼需要其一般的 Rust 擴充功能與 Prisma 用戶端。請將此 checkout 與日常使用的閘道分開

從 Lens 存放庫：

```sh
npm ci
export LENS_GATEWAY_SOURCE=/path/to/litellm
export LENS_GATEWAY_PYTHON=/path/to/litellm/.venv/bin/python
npm run demo:gateway
```

開啟[本機閘道](http://127.0.0.1:3100/)。啟動器會登入專用的本機示範閘道，並開啟其一般的 Lens 頁面。請保持終端機開啟；按下 Ctrl+C 以停止閘道與儀表板

啟動器會將本機 Lens 套件安裝到閘道 checkout 的 `node_modules` 中。它不會變更閘道原始碼與套件資訊清單。閘道有專用的 Postgres 容器。憑證是為執行中的工作階段產生，絕不會寫入設定檔。未設定任何模型提供者

如果儀表板 checkout 使用另一個已準備好的 proxy checkout，請將 `LENS_GATEWAY_BACKEND_SOURCE` 設定為該 checkout。`LENS_DEMO_PORT` 會變更起始連接埠；儀表板、閘道與資料庫連接埠皆由此衍生。診斷記錄位於 `.lens-dev/gateway-demo/gateway.log`

## 演練 {#rehearse}

1. 開啟 **Model optimizations** 並檢查任一已完成的範例
2. 選擇 **New optimization > Live**。設定代理程式、流量百分比與模型預設組合。選擇 **User feedback** 或 **LLM judge**，然後開始。評判取樣位於 **Advanced** 下。試試 **Pause**、**Resume** 與 **Finish test**
3. 選擇 **New optimization > Shadow**。選取模型並開始。Lens 會將最終模型呼叫與記錄的 trace 上下文進行比較
4. 開啟 **Datasets > Customer support > Optimize models**。保留 **Final model call** 並執行比較。批次會自動完成。開啟案例以比較答案，或依照 **Open source trace**
5. 建立 Offline 比較並選取 **Full agent > Connect agent**。保留範例執行器 URL 並選擇 **Connect runner**。執行比較以展示 full-agent 路徑。連線與執行皆為模擬；不會向執行器 URL 傳送任何請求
6. 從 Shadow 或 Offline 結果使用 **Start live test**，將其建議的模型帶入 Live 設定

預設組合會排除選取的代理程式無法使用的模型。案例結果包括成功的答案、品質衰退與現有的工具限制。服務成本與分數皆為合成資料

## 重設與持續性 {#reset-and-persistence}

在展示前，請在 Model optimizations 清單上使用 **Reset demo**。它會還原四項已完成的範例，並清除示範比較、執行器連線、資料集編輯與 eval 定義

比較、連線、資料集修訂版本與 eval 定義會保留在瀏覽器中。開啟 Model optimizations 時，Offline 批次會繼續執行。當該區段開啟時，Live 與 Shadow 流量會持續推進

資料集支援編輯、修訂記錄、新增 trace 案例與 JSONL 匯出。現有的 Evals 區段包括一個範例 eval 與模擬的 **Run eval** 動作。可以在示範工作階段內變更發現與訊號設定

產品變更位於 Lens UI 套件中，並透過閘道現有的 `EmbeddedLens` 整合載入。在編輯 Lens 原始碼後，請重新啟動啟動器以重新整理已安裝的套件
