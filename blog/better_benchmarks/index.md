---
slug: better-benchmarks
title: "更好的基準測試"
date: 2026-11-13T12:57:00
authors:
  - nate
description: "我們上週提到，會發布啟用常用功能、更具代表性的更新版基準測試。頭條數字已經出爐，而且非常出色！"
image: ./img/cover.gif
tags: [rust, rust-migration, ai-gateway, performance, benchmarks, engineering]
hide_table_of_contents: false
---

import LanesHero from './LanesHero';
import {HeadlineChart, SweepChart, BigBodiesChart, RequestPhasesChart, HeapChart} from './charts';

export const Hero = LanesHero;

# 更好的基準測試 {#better-benchmarks}

我們上週提到，會發布啟用常用功能、更具代表性的更新版基準測試。頭條數字已經出爐，而且非常出色！

{/* truncate */}

<HeadlineChart />

我們先前的基準測試只啟用了功能中很小的一部分，並不特別能代表生產環境的工作流程。我們對此一直非常坦白，因為當時只是想驗證 Rust 作為一種語言能比 Python 好多少。為了在邁向生產環境中端到端以 Rust 處理請求的同時保持高效能，我們必須非常謹慎地看待所做的選擇，以及請求的熱路徑。

在這次基準測試中，我們希望確保它能代表現代 LLM 的實際規模與閘道功能。這些基準測試在內部對我們很有用，能確保閘道在它實際運作的規模下表現良好。這次基準測試涵蓋：

- 上下文可達 1M token，代表請求約為 4 MB
- 請求有時需要 6 分鐘以上才能完整完成
- 閘道有許多虛擬金鑰，帶有團隊、使用者與部署預算限制
- 預算追蹤、支出記錄、Prometheus 指標、傾卸記錄
- 用於標頭邏輯的自訂 hook、每個部署的 RPM/TPM 限制
- 跨多個模型群組的許多部署
- 由路由器啟用的重試與備援

### 「完整功能」開啟了什麼 {#what-full-features-turns-on}

| | Rust | Python | Bifrost | Portkey |
|---|:-:|:-:|:-:|:-:|
| 1,000 把虛擬金鑰 | ✅ | ✅ | ✅ | ❌ |
| 預算：金鑰、使用者、團隊、成員 | ✅ | ✅ | 🟡¹ | ❌ |
| rpm/tpm：金鑰、使用者、團隊、成員 | ✅ | ✅ | 🟡¹ | ❌ |
| 每把金鑰的 `max_parallel_requests` | ✅ | ✅ | ❌ | ❌ |
| 每個部署的 rpm/tpm | ✅ | ✅ | ✅ | ❌ |
| 動態速率限制器 | ✅ | ✅ | ❌ | ❌ |
| 支出記錄與支出表 | ✅ | ✅ | 🟡² | ❌ |
| Prometheus 指標 | ✅ | ✅ | ✅ | ❌ |
| S3 請求記錄 | ✅ | ✅ | ✅ | ❌ |
| 轉發與移除標頭 | ✅ | ✅ | ✅ | ❌ |
| 來自標頭的支出中繼資料 | ✅ | ✅ | ✅ | ❌ |
| 將團隊作為上游標頭 | ✅ | ✅ | ❌ | ❌ |
| 在 4 個部署間隨機分配，2 次重試 | ✅ | ✅ | ✅ | ✅ |
| 冷卻：3 次失敗，30 秒 | ✅ | ✅ | ❌ | ❌ |

<small>

¹ 僅金鑰、團隊與客戶；使用者與團隊成員限制僅限企業版。² 它自己的記錄儲存與預算。Rust 以 hook 形式執行標頭功能，Python 以自訂 callback 形式執行，Bifrost 則透過其內建的對應功能。Portkey 的開源閘道沒有驗證、金鑰、限制、預算、記錄或指標。

</small>

Rust 實作是一個[分支](https://github.com/BerriAI/litellm/tree/litellm_customer_proxy)，我們用它來具體化：如果能以效能為考量重新思考，我們會如何處理一部分較豐富的功能集。我們預期在 12 月 1 日推出的快速路徑上會有可比的效能。這個分支中的一切都與 LiteLLM 廣泛功能集的一個子集相容。它以相容的方式寫入 S3 記錄傾印與 Prometheus 指標，並以與 Python 實作相同的方式寫入我們的支出記錄。

## 詳細基準測試 {#detailed-benchmarks}

<SweepChart />

<BigBodiesChart />

## 我們如何達成這些基準測試結果 {#what-we-did-to-achieve-these-benchmarks}

每個人都會說，想提升效能的前三件事就是測量、測量、再測量。依循這個邏輯，以下是 Python 熱路徑與冷路徑時序的瀑布圖。這些圖是透過對一個請求進行效能剖析，再將其縮放為這類請求的平均持續時間而產生的。

<RequestPhasesChart />

我們花費時間進行虛擬金鑰查詢、驗證檢查、平行執行呼叫前 hook，然後花大量時間為 OpenAI 建構請求。在冷路徑上，相同的主要區域也是效能的痛點。

- 路由器部署冷卻保存在記憶體內快取中，並在背景更新
- 驗證查詢保存在行程內快取中，在 Rust 中可以比 Python 更有效地以記憶體共享，因為 Python worker 是 fork 出的行程。
- 准入 hook 會平行對 Redis 執行，而非序列執行，這是因為採用了不同的 callback 模型，更明確地規定何時讀取與寫入哪些資料
- 對於直通請求，我們會在可能時不經重新序列化就將主體送往上游

<HeapChart />

由於高效率的函式庫，以及在不再被參照後釋放記憶體的語義，Rust LiteLLM 能在請求期間將記憶體中保留的資訊降到絕對最低。
當 S3 記錄停用時，它為每個 500k token 的串流在記憶體中只保留 0.47MB 的狀態。

## 基準測試設定 {#benchmark-configuration}

我們執行了幾組不同的基準測試，但大多數都使用完全相同的設定，只有包含 OpenRouter 的那組例外。

重現這些執行結果的程式碼（負載測試工具組、Kubernetes 通道、產生的閘道設定，以及每個圖表背後的資料）位於 [BerriAI/ai-gateway-bench](https://github.com/BerriAI/ai-gateway-bench)：請參閱 [`lanes/k8s`](https://github.com/BerriAI/ai-gateway-bench/tree/main/lanes/k8s) 了解如何執行，並參閱 [`results/better-benchmarks`](https://github.com/BerriAI/ai-gateway-bench/tree/main/results/better-benchmarks) 查看資料。

### 一般基準測試 {#general-benchmarks}

- 地點：AWS 上的 Kubernetes，每個 pod 都在 m7i.4xlarge 節點上（單一執行個體類型，因此所有閘道獲得相同的 CPU）。Buildkite 管線 `litellm-rust-perf`。
- 閘道 pod：每個閘道一個副本，各有 4 個專用核心與 16 GiB（請求等於限制）。模擬上游、一個 S3 替身、Postgres 與負載產生器在同一個叢集中各自的 pod 中執行。
- 版本：
  - LiteLLM Rust：以 fat LTO 從 commit `5990e10f` 建構（`litellm_customer_proxy` 閘道加上負載測試工具組）。
  - LiteLLM Python：來自相同 commit 的 proxy 映像，4 個 worker。
  - Bifrost：已發布的 v2.3.0 映像（`maximhq/bifrost@sha256:d9caa7c5…`）。
  - Portkey：已發布的開源閘道 1.15.2（`portkeyai/gateway@sha256:552b5399…`），以 4 個 Node.js 行程配合 Node 的 cluster 模組執行，因為單一行程大約只使用一個核心。
- 模擬上游：OpenAI chat completions、Anthropic messages 與 Bedrock invoke，每個都有預先寫定的首 token 時間與總時間。
- 請求組合，每個閘道都以相同順序發送相同請求：
  - 一半 `/v1/chat/completions`、一半 `/v1/messages`，各自有一半是串流；
  - 上下文 10k 到 50k token（對數均勻分布）；
  - 首 token 時間 200 到 800 ms，總時間 1 到 5 秒。
- 路由：20 個模型群組（10 個 chat、10 個 messages），每組 4 個部署，共 80 個。每個 messages 群組有一半透過 Bedrock invoke（SigV4 簽章）。路由器：simple-shuffle、2 次重試、允許 3 次失敗、30 秒冷卻。
- 完整功能（LiteLLM Rust、LiteLLM Python、Bifrost）：
  - 每個閘道有自己的 1,000 把虛擬金鑰、100 位使用者與 10 個團隊；
  - 每把金鑰、每位使用者、每個團隊與每位團隊成員都有 rpm、tpm 與預算，設定遠高於測試負載，因此不會有任何請求被拒絕；
  - 每把金鑰都有 `max_parallel_requests`，每個部署都有 rpm 與 tpm；
  - callback：`dynamic_rate_limiter_v3`、`prometheus` 與 `s3_v2`（寫入 S3 替身）；
  - 四個請求 hook，負責轉發、新增與移除標頭，並附加支出中繼資料（Python 執行等效的自訂 callback）。
- Bifrost：每個功能都對應到 Bifrost 自己的等效功能。它在副本之間沒有共享狀態。它的 Bedrock 呼叫透過 TLS 抵達模擬上游；其他閘道則否。
- Portkey：沒有任何功能，因為它的開源閘道沒有驗證、金鑰、限制、預算、記錄或指標。路由來自每個模型群組一個 `x-portkey-config` 標頭（在相同的 4 個部署間負載平衡、2 次重試），Portkey 會在每個請求時驗證它。它的 Bedrock 呼叫透過純 HTTP 送往模擬上游。
- 額外負荷：負載產生器觀察到的時間減去模擬上游被告知要花的時間。首位元組額外負荷使用抵達第一個 SSE 事件或第一個主體位元組的時間。
- 有效性：只有在負載產生器沒有卸載任何請求，且在排程時間 10 ms 內（p99）發送請求時，該次執行才算數。建構 28 與 29 的每次執行都通過了這一點。
- 每次執行後，檢查器會將每個 LiteLLM 閘道的支出記錄、金鑰、團隊與使用者支出、每日表格、Prometheus 計數器、S3 記錄與轉發的標頭，與實際發送的內容進行比對。
- 每種設定只執行一次。

### 對 OpenRouter 進行基準測試 {#benchmarking-openrouter}

讓 OpenRouter 參與基準測試的過程有點笨拙，因為除非您擁有帶有附加元件的企業帳戶，否則您[無法使用自訂端點](https://openrouter.ai/docs/guides/routing/private-endpoints)，而這正是我們用來排除一般模型服務隨機性的方法。若不這麼做，像 Opus 這類模型的大型請求中的雜訊量會淹沒效能差異，除非執行非常龐大的樣本量。基於這個原因，我們想找出一種繞過自訂端點的方法。

在我們公開之後，這個方法不保證能持續有效，但有一種方法可以利用 OpenRouter 對 Azure 部署寬鬆的驗證（`*.azure.com`），對模擬上游執行效能測試。您可以用舊版格式為 azure 設定一把 BYOK 金鑰，並給它一個主機 `<myprobe>.eastus.cloudapp.azure.com`，指向您在 azure cloud 中執行的模擬提供者。接著，您需要載入少量的 OpenRouter 使用額度，讓[低餘額不會迫使它進入更高的連貫性](https://openrouter.ai/docs/guides/best-practices/latency-and-performance#credit-balance-checks)。

有了這個之後，我們可以將所有其他提供者都放在 Azure 的 `eastus` 區域，並從我們同樣位於 eastus 的執行器執行基準測試。每個提供者都透過公用網際網路抵達模擬上游。它比較四條不同的測試通道：
- 透過公用網際網路直接連往模擬提供者
- LiteLLM Rust
- LiteLLM Python
- OpenRouter

由於這項測試既更難執行，也會引入網路拓撲的潛在干擾，我們用它來大致了解 OpenRouter 的延遲，但更偏好其他測試的測量結果。

在這項測試中，我們的設定如下：

- 每個自架閘道都在同一台 D8s_v4 VM 上執行，各有 2 個核心
- 8 RPS，20 分鐘內以 poisson 到達分布
- 50% 的請求為串流，提示為 500 token
- LiteLLM 與 Bifrost 都以其完整功能設定執行
