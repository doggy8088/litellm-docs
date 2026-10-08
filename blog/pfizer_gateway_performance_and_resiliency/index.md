---
slug: pfizer-gateway-performance-and-resiliency
title: "Pfizer 如何大規模改善 LiteLLM Gateway 的效能與韌性"
date: 2026-09-11T10:00:00
authors: [ishaan, krrish, yassin, gabriele, aleksandr-liadov, praveena-mundolimoole, pramod-naik, tung-hoang, alexey-reznichenko]
description: "Pfizer AI Platform Engineering 如何隔離出一個 Redis 連線處理錯誤，該錯誤在零 HTTP 錯誤的情況下使 LiteLLM gateway 吞吐量降低約 48%，將 CI 負載測試延遲降低 76%，並與 LiteLLM 一起建立防止回歸的框架。"
image: /img/litellm_pfizer_announcement.png
tags: [engineering, performance, redis, testing, customer-story]
hide_table_of_contents: false
---

import styles from './styles.module.css';

![LiteLLM 與 Pfizer](/img/litellm_pfizer_announcement.png)

<p className={styles.deck}>一個與 LiteLLM 共同完成的除錯故事，以及後續的發行測試。</p>

LiteLLM 版本升級暴露出一個長期存在的 Redis 設定錯誤，讓 Pfizer 的 gateway 吞吐量降低了約 48%，而應用程式記錄中完全沒有 HTTP 錯誤。以下說明團隊如何透過設定二分搜尋將其隔離出來，以及雙方正在建立的測試基礎架構，目的是在這類回歸上線前就先捕捉到。

{/* truncate */}

<hr className={styles.introRule} />

<div className={styles.stats}>
<div className={styles.card}>
<div className={styles.num}>~48%</div>
<div className={styles.label}>CI 中捕捉到的吞吐量下降（≈300 → 156 RPS）</div>
</div>
<div className={styles.card}>
<div className={styles.num}>76%</div>
<div className={styles.label}>修正後 CI 延遲更快（5,000ms → 1,200ms 中位數）</div>
</div>
<div className={styles.card}>
<div className={styles.num}>1 line</div>
<div className={styles.label}>根因中的 Redis 條件判斷</div>
</div>
<div className={styles.card}>
<div className={styles.num}>134</div>
<div className={styles.label}>為期兩週的穩定性推進中處理的問題（LiteLLM）</div>
</div>
</div>

<p className={styles.kicker}>回歸</p>

## 更慢了，但應用程式記錄中沒有 HTTP 錯誤 {#slower-with-no-http-errors-in-the-application-logs}

<p className={styles.lede}>最難捕捉的回歸，是那些在 HTTP 層級完全不產生錯誤的問題：沒有失敗、沒有單一緩慢請求，只是在並發下每秒完成的工作變少了。</p>

Pfizer 將 LiteLLM 作為自架 AI gateway 運行——一個置於多提供者模型型錄前方、相容 OpenAI 的單一 API，為 Pfizer 的每個團隊、應用程式與代理程式提供對外部與自架模型的統一存取。單一共同入口意味著 gateway 中的回歸會立刻傳播到其後的每個消費者，因此每次變更，不論是上游 LiteLLM 升級還是內部提交，都會先在 CI 中通過自動化負載與回歸測試才會上線。

這正是這次問題被抓到的方式。CI 吞吐量在 v1.85.0 和 v1.87.3 上都穩定維持在每秒約 300 個請求，接著在 v1.89.2 降到大約 156 RPS。錯誤率：不變。HTTP 層級的每請求延遲：看不出明顯異常。吞吐量下降只在並發負載下出現——內部來看，Redis 操作在非同步熱路徑中因 TLS handshake timeout 而停滯，拖累吞吐量卻沒有表面化為 HTTP 層級錯誤。底層的 Redis bug 在較舊版本中也存在，但在 Pfizer 以這個工作負載驗證 v1.89.2 升級時才顯現出來。這已足以將該版本擋在正式環境之外。

<div className={styles.pullquote}>
<p>吞吐量下降但 HTTP 錯誤率為 0%，是事後最糟糕的回歸類型——沒有東西會因此被告警，而且只有在真正的並發下才看得出來，單一請求看不到。Redis timeout 錯誤出現在 proxy 的內部記錄中，但 gateway 仍對每個呼叫端回傳 HTTP 200。我們的 CI 會對每次版本升級與每次內部提交，以固定基準做負載測試，目的就是讓這類問題在進入正式、對延遲敏感的聊天工作階段與 agent 迴圈流量之前先被捕捉到。</p>
<cite>Aleksandr Liadov & Praveena Mundolimoole, Pfizer AI Platform Engineering</cite>
</div>

<p className={styles.kicker}>追查過程</p>

## 先隔離，再讀 diff {#isolate-first-then-read-the-diff}

<p className={styles.lede}>團隊沒有在兩個次版本之間直接對提交做二分搜尋，而是先從設定下手，縮小問題範圍。</p>

<ol className={styles.steps}>
<li>執行原生 LiteLLM——沒有自訂 callback、沒有自訂驗證、模擬後端。在並發負載下，v1.85.0 與 v1.92.0 的中位延遲都落在 320-340ms。核心 proxy 在這兩個版本上都沒有問題。</li>
<li>逐一把 Pfizer 的自訂元件加回來，最後全部一起加回來。仍然正常。</li>
<li>啟用 Redis 快取。中位延遲飆升到 **4,200ms**。問題因此被鎖定在 Redis 連線路徑。</li>
</ol>

接著，修正就在 diff 中。位於 `litellm/_redis.py` 的連線池建構器，透過檢查 `ssl` 金鑰是否在 `redis_kwargs` 中「存在」，而不是檢查其值是否為「true」，來決定是否開啟 TLS 連線：

```python
# before (litellm/_redis.py at 142d5aa): presence check
connection_class = async_redis.Connection
if "ssl" in redis_kwargs:            # true even when ssl: false
    connection_class = async_redis.SSLConnection
    redis_kwargs.pop("ssl", None)
    redis_kwargs["connection_class"] = connection_class

# after (PR #32590): value check
if redis_kwargs.pop("ssl", None):        # only when ssl is truthy
    redis_kwargs["connection_class"] = async_redis.SSLConnection
```

觸發它的設定——帶有純文字 Redis 端點的 `ssl: false`：

```yaml
# litellm_config.yaml (simplified)
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: my-redis.internal
    port: 6379
    password: <redacted>
    ssl: false       # valid config, but key presence triggered SSLConnection
```

Pfizer 的設定在一個非 TLS Redis 實例上設定了 `ssl: false`——這是有效且常見的設定。但由於該金鑰只是存在而已，快取操作便嘗試對純文字端點使用 `SSLConnection`，在永遠不會完成的 TLS handshake 上停滯。這個 bug 與版本無關——在 v1.85.0 也存在——但只有在 Pfizer 的特定負載特徵，並與 v1.89+ 相依性樹中的其他變更一起出現時才會顯現。在同一次調查中，也辨識出幾個額外問題：

<ul className={styles.cardGrid}>
<li>
<span className={styles.cardLabel}>Redis `ssl` 處理</span>
<span className={styles.cardBody}>存在性檢查 → 值檢查（LIT-4307 / [PR #32590](https://github.com/BerriAI/litellm/pull/32590)，已在 [v1.93.0](https://github.com/BerriAI/litellm/releases/tag/v1.93.0-rc.1) 發布）。</span>
</li>
<li>
<span className={styles.cardLabel}>Starlette/FastAPI 相依性</span>
<span className={styles.cardBody}>一項 Starlette 相依性變更在這個基準測試中於高並發下顯示出可量測的每請求 middleware 開銷；鎖定到 LiteLLM 經測試的版本後，基準吞吐量恢復。此項與 Redis 修正分開調查。</span>
</li>
<li>
<span className={styles.cardLabel}>OTEL 設定快取</span>
<span className={styles.cardBody}>`is_otel_v2_enabled` 原本在每次呼叫時都會重新計算；將其快取後，每次呼叫成本從 28.4µs 降到 0.018µs（[#30989](https://github.com/BerriAI/litellm/pull/30989)）。</span>
</li>
<li>
<span className={styles.cardLabel}>OTel 延遲匯入修正</span>
<span className={styles.cardBody}>失敗的 OTel 匯入原本會在每次請求都重試，而不是做記憶化處理（[#31707](https://github.com/BerriAI/litellm/pull/31707)）。</span>
</li>
<li>
<span className={styles.cardLabel}>Spend-counter 往返</span>
<span className={styles.cardBody}>在爭用下，reseed 路徑將其往返次數降回接近單次 Redis 往返。</span>
</li>
</ul>

<div className={styles.pullquote}>
<p>之所以在沒有 HTTP 錯誤的情況下也會拖垮吞吐量，是因為 LiteLLM 熱路徑中的 Redis 快取操作採用盡力而為語意並設定 timeout。當 `SSLConnection` 嘗試對純文字 Redis 協商 TLS 時，handshake 會卡住直到 socket timeout（預設 5 秒），然後 proxy 會退回到不使用快取結果而繼續處理。請求仍然回傳 HTTP 200——模型回應正常返回——但並發請求會在非同步熱路徑中的 Redis 連線嘗試與 timeout 上累積等待。在負載下，這會使連線池飽和，並把本應可平行的非同步操作序列化。與此同時，Redis timeout 錯誤會出現在 proxy 的內部記錄中，但從未以 HTTP 失敗的形式回傳給用戶端。</p>
<cite>Pramod Naik & Tung Hoang, Pfizer AI Platform Engineering</cite>
</div>

<p className={styles.kicker}>結果</p>

## 修正與如今每次發行都會執行的測試 {#the-fix-and-the-test-that-now-runs-on-every-release}

<p className={styles.lede}>這項修正封住了立即性的缺口。更持久的成果，是當初抓到它的負載測試不再只存在於 Pfizer 的 CI 中。</p>

Pfizer 已將其負載測試設定分享給 LiteLLM，以整合進其 CI pipeline，其中包含模擬模型提供者而不需打到真實端點的 mock-backend harness。目標是：這類回歸——吞吐量下降但錯誤率正常——成為每個 LiteLLM deployment 的發行門檻，而不只是 Pfizer 的。這項工作與一個更廣泛、為期兩週的穩定性推進一同發布，該推進處理了 LiteLLM 程式碼庫中的 [134 個問題](https://github.com/BerriAI/litellm/releases/tag/v1.93.0-rc.1)。

<p className={styles.signature}>有一個條件判斷檢查的是某個 key 是否存在，而不是它是否為 true。吞吐量直接少了一半。抓到它的修正與測試設定都已貢獻回上游。</p>

<div className={styles.beforeafter}>
<div className={styles.card}>
<span className={styles.baLabel}>修正前</span>
<span className={styles.baNum}>5,000ms</span>
<span className={styles.baSub}>CI 中位延遲 · 158 RPS</span>
</div>
<div className={styles.baArrow}>→</div>
<div className={styles.card}>
<span className={styles.baLabel}>修正後</span>
<span className={styles.baNum}>1,200ms</span>
<span className={styles.baSub}>CI 中位延遲 · 236 RPS，快 76%</span>
</div>
</div>

**Benchmark environment:** CI 模式：750 個並行 Locust 使用者、100 users/s 啟動速率、60s 持續負載、基於 cassette 的模擬後端（決定性回應）、單一 LiteLLM proxy container、具密碼驗證的 Redis 7、供 AWS 服務使用的 LocalStack。任務組合加權：chat completions (10)、health (5)、embeddings (3)、image gen (1)。基準：中位數 &lt;1,200ms、&gt;200 RPS、錯誤率 &lt;0.5%。

<p className={styles.kicker}>Pfizer 如何測試閘道</p>

## 五道 CI 關卡，以及接下來要做什麼 {#five-ci-gates-and-whats-next}

<p className={styles.lede}>捕捉到這次回歸的負載測試不是一次性的腳本。Pfizer 的 AI Platform Engineering 團隊會在每次閘道程式碼變更時執行五道自動化測試關卡——沒有任何變更會在通過全部五關前進入 production——另外還有一項正在積極開發中。</p>

<ul className={styles.cardGrid}>
<li>
<span className={styles.cardLabel}>單元測試</span>
<span className={styles.cardBody}>在每個 PR 上驗證驗證、路由、健康檢查與指標。測試使用與 production container 相同的 runtime 設定，因此沒有設定漂移，且被測系統與 production system 之間的行為沒有差異。</span>
</li>
<li>
<span className={styles.cardLabel}>API 合約測試</span>
<span className={styles.cardBody}>在每個 PR 上自動進行 OpenAPI diff。針對面向客戶的 endpoint 的破壞性變更會阻擋合併。新增型變更則會通過並被記錄。</span>
</li>
<li>
<span className={styles.cardLabel}>負載 / 效能測試</span>
<span className={styles.cardBody}>在 CI 中使用 LocalStack 對完整模擬的本機基礎架構堆疊進行並行負載測試，之後在 staging environment 中針對實際基礎架構再次測試。專用的負載產生基礎架構會依照貼近真實 production 模式的流量加權。每次執行都會依照預期的延遲、吞吐量與錯誤率基準進行檢查。</span>
</li>
<li>
<span className={styles.cardLabel}>記憶體洩漏偵測</span>
<span className={styles.cardBody}>長時間持續負載測試，監控數小時而非數分鐘的記憶體。舉例來說，這就是團隊找出連線洩漏與 hot-path 物件累積，進而導致 production 中不必要 autoscaling 的方式。</span>
</li>
<li>
<span className={styles.cardLabel}>功能 / E2E 測試</span>
<span className={styles.cardBody}>在實際已部署環境上執行的情境測試套件，涵蓋 chat completions、串流、路由、驗證流程、可觀測性等更多項目。所有情境都必須通過——不接受部分通過。</span>
</li>
<li>
<span className={styles.cardLabel}>進行中：故障注入與變異測試</span>
<span className={styles.cardBody}>注入提供者故障，以驗證在壓力下的備援路由。新增變異測試，以提升團隊對測試涵蓋品質的信心。</span>
</li>
</ul>

實務上，CI 執行結果一直都能達到 **0% HTTP 錯誤率**，而且在延遲與吞吐量門檻上表現遠優於標準。基準是安全網，不是常態。

<p className={styles.kicker}>Pfizer 如何改善閘道效能</p>

## 先做監測，再做最佳化 {#instrument-before-you-optimize}

<p className={styles.lede}>負載測試能在發佈時抓到回歸。要抓出緩慢、累積性的漂移——那種不是 CI 檢查失敗，而是幾週後才以 autoscaling 壓力形式浮現的問題——需要不同的紀律：足夠深入的監測來看見它，接著採取夠精準的修正，以免引入新的漂移。</p>

<ul className={styles.cardGrid}>
<li>
<span className={styles.cardLabel}>監測</span>
<span className={styles.cardBody}>請求會一路追蹤到記憶體配置、HTTP 連線重用、事件迴圈排程，以及 Python 垃圾回收器行為。這就是團隊找出連線洩漏與 hot-path 物件累積的方式；它們悄悄地在 production 中驅動不必要的 autoscaling——兩者都不會表現為錯誤或門檻失敗，只會反映在記憶體與 instance 數量緩慢上升的趨勢。</span>
</li>
<li>
<span className={styles.cardLabel}>精準修正，然後設一道後備防線</span>
<span className={styles.cardBody}>一旦來源可見，修正就會很精準：收緊物件生命週期、平滑 hot-path 迴圈行為、關閉特定洩漏。作為防止任何漏過監測的最後一道防線，長時間運作的 worker 仍會定期回收——這是後備防線，不是找出根因的替代品。</span>
</li>
</ul>

{/* style-lint-allow-next-line em-dash: verbatim from the Pfizer-approved copy, not ours to reword */}
監測建立在三大可觀測性支柱之上：記錄、指標與分散式追蹤——全部都已啟用，也彼此串接。團隊不只是把它們打開就離開。當某些地方看起來不對時，我們會在可疑路徑中加入額外監測，運用這三大支柱精確三角定位行為偏離的地方，直到根因完全清楚。這就是我們如何從「有東西變慢了」在一次調查內就定位到根因，而不是花上一週猜測。這三大支柱是取得對持續變動且動態系統洞見的核心基礎，例如我們正在處理的系統。

<p className={styles.kicker}>LiteLLM 接下來要做什麼</p>

## 在發布前就抓到這類錯誤，而不是之後 {#catching-this-class-of-bug-before-release-not-after}

這次回歸有被抓到，但太晚了——是在下游使用者的 CI 中抓到的，不是 LiteLLM 自己的發佈檢查。根據 Pfizer 團隊標示的最高優先順序，以下項目正進入發佈流程：

<ul className={styles.cardGrid}>
<li>
<span className={styles.cardLabel}>回歸測試</span>
<span className={styles.cardBody}>具代表性的負載與行為測試，包括 Pfizer 的測試，作為發佈關卡執行，而不是事後檢查。</span>
</li>
<li>
<span className={styles.cardLabel}>功能測試</span>
<span className={styles.cardBody}>更廣泛地涵蓋跨提供者的 request lifecycle 端對端測試。</span>
</li>
<li>
<span className={styles.cardLabel}>合約驗證</span>
<span className={styles.cardBody}>提供者與 API 形狀檢查，確保相依性或 schema 變更不會悄悄改變行為。</span>
</li>
<li>
<span className={styles.cardLabel}>模糊測試</span>
<span className={styles.cardBody}>針對 proxy 的 hot paths 使用格式錯誤與對抗性輸入，以提早浮現邊界案例。</span>
</li>
<li>
<span className={styles.cardLabel}>記憶體洩漏偵測</span>
<span className={styles.cardBody}>在持續的大 payload 負載下進行保留檢查，讓 worker 記憶體隨時間維持平坦。</span>
</li>
<li>
<span className={styles.cardLabel}>公開透明</span>
<span className={styles.cardBody}>我們會在發布里程碑上，連同數字一起報告這些項目的進度。您不應該只能相信我們說的話。</span>
</li>
</ul>

<div className={styles.pullquote}>
<p>這正是我們支持開源、而不是某種黑盒解決方案的原因。我們想要深入理解閘道內部到底發生了什麼，並且能夠回饋貢獻，甚至改變它的測試方式。這裡真正的成果不是延遲數字；而是我們的負載測試正在被整合進 LiteLLM 的發佈流程，因此這類回歸會在到達我們或任何其他人之前就被抓到。這就是我們晚上能睡得更好的原因，也是整個社群從這份工作中受益的方式。</p>
<cite>Alexey Reznichenko，Pfizer AI Platform Engineering</cite>
</div>

<div className={styles.closecard}>

## 為什麼我們一起寫了這篇 {#why-we-wrote-this-together}

一行存在檢查就把 production 閘道的吞吐量砍半，卻維持乾淨的錯誤率——這種回歸很容易漏掉，晚發現的代價也很高。 我們共同撰寫這篇內容，是因為 Pfizer 在 CI 中於它到達 production 前就抓到了它，而且修正與測試設定都已向上游貢獻，讓每個 LiteLLM 部署都能受益。在 production 中執行 LiteLLM 的平台團隊會遇到維護者不一定能在本機重現的失敗模式；貢獻修正與測試，而不只是 bug 報告，才能把這些問題轉化為永久性的涵蓋。如果您也遇到類似情況，我們很想聽聽。

<div className={styles.btnRow}>
<a className={`${styles.btn} ${styles.btnPrimary}`} href="https://github.com/BerriAI/litellm">GitHub 上的 LiteLLM</a>
<a className={`${styles.btn} ${styles.btnSecondary}`} href="https://docs.litellm.ai/">閱讀文件</a>
</div>

</div>
