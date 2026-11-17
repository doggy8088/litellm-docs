---
title: "歷史擴展性測量"
description: "閘道託管 Lens 的封存測量，以及目前的獨立基準測試程序。"
slug: "/proxy/lens/scalability"
---

# 歷史擴展性測量 {#historical-scalability-measurements}

:::note 歷史閘道測量

下面的設計與測量描述的是先前由閘道託管的 Lens 實作及其 PostgreSQL 中繼資料儲存，保留自[文件修訂版 6a8ba43c](https://github.com/BerriAI/litellm-docs/blob/6a8ba43c/docs/proxy/lens/scalability.md)。文中對「before」、「now」、「today」的指涉以及提出的變更都屬於該修訂版。它們並不描述、也不限定獨立的 Lens 執行階段

獨立的 Rust 執行階段將 Lens 中繼資料與追蹤儲存在 ClickHouse 中，並透過 ClickHouse KeeperMap 協調工作。PostgreSQL 僅作為遷移來源。支援的部署拓撲請參閱 [Run Lens](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md)；針對確切服務產物與資源限制的可重現 HTTP 測量，請參閱[目前的 Lens 基準測試程序](https://github.com/BerriAI/lens/blob/main/docs/benchmarks.md)

:::

受測的閘道實作將追蹤與請求記錄儲存在 ClickHouse 中，將 lens、調查 job、發現與 worker 狀態儲存在 PostgreSQL 中。以下各節保留其原始的設計說明與基準測試結果，供比較之用

| 操作 | 儲存 | 成本隨之成長 | 不隨之成長 |
|---|---|---|---|
| 取樣一個時間窗 | ClickHouse | 時間窗內的 span 加上 7 天寬限 | 保留期、頁面數量 |
| 讀取一筆追蹤 | ClickHouse | 從追蹤開始時間減 7 天到現在的分區 | 近期追蹤的保留期、其他團隊 |
| 認領一個 job | PostgreSQL | 到期的 lens，每次讀取 20 個 | lens 總數、未到期的 lens |
| 對 job 送出 heartbeat | PostgreSQL | 今日 lens 文件的大小；目標設計中為一筆窄 lease 列 | lens 數量 |

本頁的圖表與表格來自一項本機基準測試，該測試以真實的 ClickHouse 與 PostgreSQL 執行每個變更前後的 Lens SQL。每個計時都重複進行，並以中位數及其 p10 到 p90 分布呈現；[基準測試方法](#methodology)列出硬體、版本、資料集與執行次數。它們顯示成本在一台機器上如何隨資料量成長，並非正式環境的延遲目標。這些測量涵蓋 SQL 與排程成本，不包含 LiteLLM 與 Lens 服務之間的傳輸

## 每個追蹤查詢都受時間限制 {#time-bounded-queries}

`otel_traces` 依天分區，並依 `(TeamId, ServiceName, Timestamp, TraceId)` 排序。ClickHouse 只有在查詢對這些欄位設有限制時才會略過資料，因此以 `EngineReceivedMs` 等衍生運算式篩選、或完全沒有時間篩選的查詢，必須開啟團隊保留的每個分區。即使答案只涵蓋一天，其成本也會隨保留期成長

因此，每個針對 `otel_traces` 與 `spend_logs` 的 Lens 查詢，都必須在其自身邏輯之上，對 `Timestamp` 或 `start_time` 直接設定範圍。Span 可能在取樣時間窗之前開始，也可能延遲到達，因此下限帶有固定的 7 天寬限。這涵蓋多天的 coding agent 工作階段，同時仍能略過其餘的保留資料。上限只在不會遮蔽後續檢查所依賴的 span 之處套用。例如，取樣查詢仍能看到較晚的 span，讓仍在進行中的追蹤保持被排除

![24 小時取樣的分區修剪：比 7 天寬限更舊的分區永遠不會被開啟](/img/lens/scalability/partitions.svg)

加上時間限制的 24 小時取樣，在 7 到 90 天的每個保留期都讀取約 1.0M 列。沒有它，同一個查詢在 30 天時讀取 3.2M 列，在 90 天時讀取 9.4M 列

## 取樣在每個 job 只選取一次 {#one-pass-sampling}

取樣是對時間窗內每個符合資格的追蹤所做的確定性選取。它需要符合資格的數量與選取順序，兩者都需要完整的符合資格集合。將該查詢以每次 100 列分頁，會在每一頁重新計算完整集合，因此單次取樣的成本是頁數乘以時間窗大小

![取樣前後比較：52 次分頁查詢，每次都對每個符合資格的追蹤排名；相較之下，一次查詢即將選取結果凍結在 job 上](/img/lens/scalability/sampling.svg)

Worker 以每頁 10,000 筆請求選取結果，因此一般取樣只需一次查詢，然後將其凍結在 job 上。後續讀取使用凍結的選取結果，不再查詢 ClickHouse。如果一頁會超過回應限制，worker 會以較小的頁面重試同一個游標。儀表板中的預覽仍會分頁，但每一頁都受時間限制

![取樣成本與保留期的關係：先前讀取列數與每次取樣時間呈線性成長，現在則維持在約 1M 列與 100 ms 的平坦水準](/img/lens/scalability/bench-sampling.svg)

此圖表針對同一個 24 小時時間窗（選取約 5,100 筆追蹤），在六種保留期大小下執行完整的 worker 取樣迴圈。先前，讀取列數從 7 天時的 46M 成長到 90 天時的 486M，迴圈耗時 4.5 s 到 11.5 s。現在每個保留期都讀取約 1.0M 列，耗時約 100 ms。兩個版本的每次計時執行都以相同順序選取相同的追蹤

下表在 30 天與 90 天分別呈現這兩項變更，取 5 次執行的中位數：

| 保留期 | 查詢 | 頁面大小 | 查詢次數 | 讀取列數 | 讀取位元組 | 中位數時間 |
|---|---|---:|---:|---:|---:|---:|
| 30 days | 先前 | 100 | 52 | 167.2M | 8.4 GB | 5.2 s |
| 30 days | 先前 | 10,000 | 1 | 3.2M | 162 MB | 130 ms |
| 30 days | 加時間限制 | 100 | 52 | 52.8M | 3.4 GB | 4.2 s |
| 30 days | 加時間限制 | 10,000 | 1 | 1.0M | 66 MB | 97 ms |
| 90 days | 先前 | 100 | 52 | 486.3M | 22.2 GB | 9.4 s |
| 90 days | 先前 | 10,000 | 1 | 9.4M | 427 MB | 199 ms |
| 90 days | 加時間限制 | 100 | 52 | 53.2M | 3.4 GB | 4.2 s |
| 90 days | 加時間限制 | 10,000 | 1 | 1.0M | 66 MB | 105 ms |

大部分的收益來自只選取一次，而時間限制讓成本在保留期成長時保持平坦。兩者共同將 90 天取樣的讀取量從 486M 列降到 1.0M 列

## 單一追蹤讀取以金鑰定位並受時間窗限制 {#single-trace-reads}

讀取一筆追蹤是點查詢。`TraceId` 上的 bloom filter 將讀取範圍縮小到存放該追蹤的 granule，頁面最多回傳 40 個 span，依 `SpanId` 排序並以其作為游標，span 內容截斷至固定預算。因此，無論追蹤多大，每次讀取回傳的酬載都有上限

Bloom filter 仍會在團隊的每個 granule 上檢查。Lens 讀取會傳入隨取樣執行儲存的追蹤開始時間，減去同樣的 7 天寬限，因此查詢只開啟可能存放該追蹤的分區

![單一追蹤讀取：取樣的開始時間修剪分區，TraceId bloom filter 挑選 granule，頁面大小有上限](/img/lens/scalability/trace-read.svg)

![單一追蹤讀取成本與保留期的關係：先前開啟的分區數隨保留期成長，現在維持在 9 個，延遲維持在約 14 ms](/img/lens/scalability/bench-trace-read.svg)

對於一天前開始的追蹤，不受限的讀取會開啟團隊的每個分區，在 7 天保留期時為 8 個，在 90 天時為 90 個。受限的讀取在每個保留期最多開啟 9 個。在這台機器上，開啟分區的成本很低，因此延遲收益很小：受限讀取維持在約 14 ms，不受限讀取則在 14 到 21 ms 之間。兩者回傳相同的 span

依追蹤年齡讀取一筆追蹤的內容，取 25 次暖機後執行的中位數：

| 保留期 | 追蹤年齡 | 分區（先前 / 現在） | 讀取列數（先前 / 現在） | 中位數（先前 / 現在） |
|---|---|---:|---:|---:|
| 30 days | 1 day | 30 / 9 | 20,055 / 7,101 | 13.4 ms / 14.4 ms |
| 30 days | 15 days | 30 / 23 | 13,378 / 6,693 | 12.8 ms / 17.1 ms |
| 90 days | 1 day | 90 / 9 | 26,633 / 6,654 | 16.9 ms / 14.4 ms |
| 90 days | 15 days | 90 / 23 | 13,369 / 6,694 | 16.5 ms / 17.5 ms |
| 90 days | 45 days | 90 / 53 | 28,134 / 21,462 | 16.1 ms / 23.1 ms |
| 90 days | 85 days | 90 / 90 | 13,352 / 13,352 | 16.5 ms / 17.8 ms |

此限制讓讀取開啟的分區數與追蹤的年齡掛鉤，這正是近期讀取能在保留期成長時保持平坦的原因。Lens 大多讀取它剛取樣的追蹤，因此常見情況是近期追蹤。較舊的追蹤會開啟更多分區，在 15 天與 45 天時，受限讀取在這次執行中慢了 1 到 7 ms，儘管它讀取的列數較少。接近保留期末端的追蹤開啟的分區與先前相同

## 排程不會掃描每個 lens {#scheduling}

Worker 認領必須找到一個到期的 job，其成本不應隨 lens 數量成長。在此設計之前，一次認領會載入並驗證每個 lens，200 個 lens 時每次嘗試耗時 1.1 s，800 個時耗時 5.4 s。現在每個 lens 都在帶有索引的 `due_at` 欄位中保存它下一次需要 worker 的時間，即其排隊中 job 的建立時間、執行中 job 的 lease 到期時間，或下一次排程執行的時間。Lens 的每次完整更新都會在同一個陳述式中寫入 `due_at`，因此該欄位不會與文件不一致

[封存的 worker 認領圖](https://github.com/BerriAI/litellm-docs/blob/6a8ba43c/static/img/lens/scalability/claim.svg)顯示舊的閘道通訊協定。其 worker 認領端點已在獨立化擷取期間移除；目前的 Lens 在其 Rust 服務內部排程工作

一次認領會依 `(due_at, id)` 順序讀取最多 20 個到期 lens 的分頁，直到認領到一個或耗盡佇列。在競爭中落敗的 worker 會繼續處理下一個，而不是針對另一個 worker 剛取得的 lens 重試。在該欄位存在之前建立的 lens，其 `due_at` 起始值在過去，第一個查看它的認領會寫入其真實值

![Worker 認領成本與 lens 數量的關係：完整掃描時載入的資料與時間呈線性成長，現在則在 20 個到期候選者處停止成長](/img/lens/scalability/bench-claim.svg)

圖表中每個 lens 持有 100 個發現與 200 筆追蹤取樣，約 400 KB 的 JSON，且每十個 lens 有一個到期。完整掃描會載入每個文件，因此 lens 數量每翻倍，其成本也翻倍。到期查詢最多載入一頁 20 個候選者，因此在 200 個 lens 之後，無論 lens 數量多少，它都維持在 8 MB 與約 110 ms。時間包含驗證文件的時間，取 7 次執行的中位數：

| 儲存的 lens | 到期 | 以到期佇列載入 | 認領時間 | 完整掃描載入 | 認領時間 |
|---:|---:|---:|---:|---:|---:|
| 25 | 3 | 1.2 MB（3 個 lens） | 12 ms | 10 MB（25 個 lens） | 97 ms |
| 100 | 10 | 4.0 MB（10 個 lens） | 46 ms | 40 MB（100 個 lens） | 535 ms |
| 200 | 20 | 8.0 MB（20 個 lens） | 118 ms | 80 MB（200 個 lens） | 1.1 s |
| 400 | 40 | 8.0 MB（20 個 lens） | 100 ms | 160 MB（400 個 lens） | 2.8 s |
| 800 | 80 | 8.0 MB（20 個 lens） | 112 ms | 320 MB（800 個 lens） | 5.4 s |

## 提案：將進行中的 job 與歷史分開 {#narrow-hot-state}

Heartbeat 或進度更新應該只觸及變更的部分。今日，一個 lens 及其所有 job、發現與保留都儲存在單一 JSONB 文件中。每次 heartbeat 都會重寫整個文件，對 lens 的每次更新都在同一列上競爭

![Heartbeat 成本與 lens 大小的關係：文件重寫時 WAL 與時間隨發現數量成長，窄 lease 列則維持在 120 B 與 0.2 ms 以下](/img/lens/scalability/bench-heartbeat.svg)

一次 lease 續約，取每個大小 60 次續約的中位數：

| 發現 | 取樣的追蹤 | 儲存的文件 | 文件重寫 | Lease 列更新 |
|---:|---:|---:|---:|---:|
| 0 | 50 | 4.0 KB | 0.96 ms, 4.8 KB WAL | 0.08 ms, 120 B WAL |
| 100 | 200 | 33 KB | 10.2 ms, 36 KB WAL | 0.20 ms, 120 B WAL |
| 250 | 500 | 79 KB | 22.4 ms, 87 KB WAL | 0.08 ms, 120 B WAL |
| 500 | 1,000 | 155 KB | 45.1 ms, 171 KB WAL | 0.18 ms, 120 B WAL |
| 1,000 | 2,000 | 308 KB | 82.1 ms, 338 KB WAL | 0.19 ms, 120 B WAL |

重寫成本隨文件同步成長，因為 PostgreSQL 在每次更新時都會寫入整個 JSONB 值的全新副本。無論 lens 有多少歷史，lease 列都維持為一個小 tuple

目標設計將 lease 與 job 進度移入窄列。發現、出現紀錄與證據成為只會附加的列，執行與檢視歷史則設有保留截止點

![今日的 Lens 狀態存放在單一 JSONB 文件中，與目標設計的窄 job 列與僅附加的發現之比較](/img/lens/scalability/hot-state.svg)

## 提案：依開始時間排序追蹤摘要 {#trace-list-rollup}

追蹤清單將 span 聚合為每筆追蹤一列。以 `(TeamId, ApiKeyHash, TraceId)` 排序該彙總且不含時間欄位，會迫使每一頁在依開始時間篩選之前，先聚合團隊的全部保留資料。在基準測試中，一個一小時的追蹤清單頁面讀取了彙總中團隊全部 150K 筆追蹤。目標設計依團隊與追蹤開始時間排序彙總，因此一頁只讀取它顯示的時間窗。這需要新表格與回填，因此與上述查詢變更分開推出

## 基準測試方法 {#methodology}

所有測量都在一台具有 8 個 vCPU（Intel Xeon Platinum 8559C）與 32 GB RAM 的機器上執行，使用 ClickHouse 26.10.1 作為單一本機伺服器與 PostgreSQL 14.24，且沒有其他負載。ClickHouse 表格來自 Lens 遷移，每個查詢都是變更前後程式碼中的確切 SQL 檔案，並以 proxy 傳送的相同參數綁定

ClickHouse 資料集是分布在 90 個每日分區的 18M 個合成 span，每天約 200K 個 span，分布在 6 個團隊，其中一個團隊擁有一半。每筆追蹤有 20 個 span，帶有屬性對應與訊息內容。7、15、30、45 與 60 天等較小的保留期是同一資料最新天數的副本，因此每個保留期在取樣時間窗內都持有相同的 span。取樣時間窗是截至最新 span 的 24 小時。`read_rows` 與 `read_bytes` 來自 `system.query_log`，開啟的分區來自 `EXPLAIN indexes = 1`，時間為用戶端的實際時鐘。每個取樣迴圈先執行一次暖快取，然後執行 5 次；每個追蹤讀取先暖機 3 次，然後執行 25 次。每次執行的取樣結果都會雜湊，以檢查兩個版本以相同順序選取相同的追蹤

PostgreSQL 表格與 `LiteLLM_Lens` 一致，帶有其 `due_at` 索引。Lens 文件以 Lens Pydantic 模型建立，每個發現有 5 段證據引文與 50 次出現。認領時間涵蓋查詢加上驗證每個回傳文件的時間，取暖機後 7 次執行的中位數。Heartbeat WAL 是每次更新前後 `pg_current_wal_lsn()` 的差值，在一次檢查點之後，於分布在 20 個 lens 的 60 次續約上測量。Lease 列是目標設計使用的窄表格：一個 id、一個 lease 時間戳與一個版本

這些結果描述成本在一台快取已暖的機器上如何擴展。正式環境叢集有更多核心與較慢或遠端的磁碟，因此絕對時間會不同；而讀取列數、開啟的分區、載入的位元組與寫入的 WAL 取決於資料，應該可以類推

## 負載測試 {#load-tests}

已實作的查詢與排程變更具有下列負載測試。每個測試測量一個操作的成本，加入該操作永遠不應觸及的資料，並斷言成本不會成長。每個測試也都在還原其最佳化的情況下執行過，以確認它會失敗。

| 測試 | 加入 | 採用設計時測得 | 還原設計時 |
|---|---|---|---|
| `lens_sample_reads_scale_with_window_not_retention` | 24 天較舊的 span | 前後都讀取 30,000 列 | 失敗，30,000 成長到 110,000 |
| `lens_content_reads_scale_with_trace_not_retention` | 同一 trace id 下 24 天較舊的資料 | 前後都讀取 2,000 列 | 失敗，2,000 成長到 50,000 |
| `test_lens_claim_reads_scale_with_due_lenses_not_total_lenses` | 200 個未到期的 lens | 前後都載入 52,156 位元組 | 失敗，1.1 MB 成長到 11.5 MB |

兩個 ClickHouse 測試位於 `litellm-rust/crates/traces-clickhouse/tests/load.rs`，斷言 `system.query_log` 的 `read_rows` 成長至多 5%。排程器測試位於 `tests/integration/database/test_lens_scheduler_load.py`，斷言認領載入完全相同的 lens 資料，且仍認領到期的 lens。Heartbeat WAL 測試隨窄 lease 變更一起推出
