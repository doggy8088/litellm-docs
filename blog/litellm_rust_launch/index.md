---
slug: litellm-rust-launch
title: "將 LiteLLM 遷移至 Rust - 打造最快、最輕量的 AI 閘道"
date: 2026-06-22T09:00:00
authors:
  - ishaan
description: "LiteLLM 正在將其 AI 閘道遷移到 Rust：15 倍吞吐量、少 11 倍記憶體，以及每次請求不到 1ms 的額外負擔。沒有 v2、沒有遷移，您的設定維持不變。"
keywords: [最快 ai 閘道, 最快 llm 閘道, llm 閘道, rust llm 閘道, llm 閘道 基準測試, 高吞吐量 llm 閘道, 輕量級 ai 閘道, ai 閘道 延遲, ai 閘道 記憶體, litellm 效能, litellm rust, llm proxy 額外負擔]
image: ./rust_migration_social_card.png
tags: [rust, ai-gateway, performance, benchmarks, reliability, engineering]
hide_table_of_contents: true
---

import { RustHeader, RustMigrationStages, RouteCadence, Stage1Architecture, RustServerSteps } from './diagrams';
import Head from '@docusaurus/Head';

<RustHeader />

*最後更新：2026 年 6 月*

在過去一年中，我們從使用者與社群聽到同樣的聲音：他們想要能執行的最快、最輕量的 AI 閘道。我們聽到了。現在我們正透過將 LiteLLM 遷移到 Rust 來回應，並承諾將額外負擔降到低於 `1ms`、記憶體低於 `100MB` 的可部署二進位檔。到了這次遷移完成時，您將擁有一個純 Rust 伺服器，能承載您 100% 的 AI 流量，且每個熱路徑操作（包含驗證與速率限制）都在 Rust 中執行。

:::tip 想幫助我們打造它嗎？

我們正在開放早期 beta，並希望直接與重視快速、輕量閘道的團隊合作。如果您正是這樣，請[在此註冊](https://docs.google.com/forms/d/e/1FAIpQLSecWdOjkzjEson2UiZpDftOoZPs8RQbtlAM40KSvDXZqEgYaA/viewform?usp=dialog)，我們會讓您在自己的堆疊中測試 Rust 閘道，並直接與我們團隊聯繫。

:::

之所以重要，是因為在真實負載下，CPU 與記憶體會隨著並行度上升，而 pods 會在最糟糕的時候被 OOM-kill。今天 LiteLLM Python proxy 在負載下的記憶體峰值約為 `359MB`，而這個成本會隨著您執行的每個 pod、區域與重試而倍增。

我們已經在基準測試中看到成效。Rust 閘道的吞吐量約為 `15x`（每秒 `453` 到 `6,782` 個請求），使用的記憶體約少 `11x`（`359MB` 到 `32MB`），且將每次請求的額外負擔從 Python 路徑上的約 `7.5ms` 降到約 `0.05ms`，遠低於我們承諾的 `1ms`。

## 您會得到什麼 {#what-you-get}

您部署單一 Rust 二進位檔。它使用約 `65MB` 的記憶體，閘道額外負擔維持在 `1ms` 以下，而您的設定中沒有任何東西會改變：相同的 `config.yaml`、相同的資料庫、相同的用戶端 API、相同的提供者。您保留 LiteLLM 對 100+ 個 LLM 提供者的涵蓋，並透過一個 OpenAI 相容 API 提供，包含 `/chat/completions`、`/messages`、`/responses`，以及 LiteLLM 今天支援的其他每個 LLM 端點，如今成為您能自行主機部署的最快、最輕量 LLM 閘道。

這不是 v2，也不是重寫。沒有新的主要版本需要遷移，也沒有任何東西要您更改。熱路徑下的執行階段會變得更快、更輕量，而您的設定會維持完全不變。

我們會以謹慎的方式發布。每條路由只有在通過我們完整的對等與端到端測試套件後才會移到 Rust，且會先在正式環境執行，然後下一條路由才開始。穩定性是優先事項，我們以每次發佈零回歸為目標。

{/* truncate */}

## LiteLLM 閘道有多快？吞吐量、額外負擔與記憶體基準測試 {#how-fast-is-the-litellm-gateway-a-throughput-overhead-and-memory-benchmark}

**每次請求的額外負擔。** 我們建立了一個小型測試架構：模擬上游、薄型 Rust 轉送閘道（axum）、今天透過 LiteLLM 執行的相同轉送路徑（uvicorn 上的 `litellm.acompletion`），以及一個以微秒計時每次請求的負載用戶端。在針對相同模擬端點的 `10` 個並行用戶端下，Rust 閘道每次請求增加約 `0.05ms` 的額外負擔；LiteLLM Python 路徑則增加約 `7.5ms`。這大約低了 `150x`，而且遠低於我們承諾的 `1ms`。

**持續負載。** 在相同 `/v1/responses` 工作負載、`50` 個並行用戶端下，與目前的 LiteLLM Python proxy 相比，Rust 路徑以約少 `11x` 的記憶體，提供了約 `15x` 的吞吐量。

![Rust 與 Python 閘道基準測試：額外負擔、吞吐量與記憶體](./rust_vs_python_proxy_benchmark.png)

| | 每次請求的額外負擔 | 負載下吞吐量 | 負載下峰值記憶體 |
|---|---|---|---|
| **Rust 閘道** | `~0.05ms` | `6,782` req/s | `31.7MB` |
| **LiteLLM（Python）** | `~7.5ms` | `453` req/s | `358.9MB` |

額外負擔測試架構（模擬、閘道、負載用戶端）已與這篇文章一起提交在 [`benchmark/`](https://github.com/BerriAI/litellm-docs/tree/main/blog/litellm_rust_launch/benchmark) 中，摘要數據則在 [`rust_proxy_benchmark_results.csv`](./rust_proxy_benchmark_results.csv) 中，因此您可以重現低於 `1ms` 的結果。這測量的是閘道轉送路徑（請求轉換、轉送、回應處理），而不是完整的正式工作負載。

## 什麼保持不變 {#what-stays-the-same}

您依賴的任何東西都不會改變。這次遷移從外部看是不可見的：

- 您的 Python SDK 會保留完全相同的介面；相同的呼叫現在會在底層透過 Rust bindings 執行。
- 您的 `config.yaml` 不變。
- 您的資料庫與 schema 不變。
- 您的用戶端 API 與 request/response 形狀不變。
- 您的提供者、路由與金鑰不變。

您會得到更低的記憶體與更低的額外負擔，而不需要做任何事來取得它。

---

## 遷移如何運作 {#how-the-migration-works}

如果您只想知道結果，上面已經有了。這篇文章其餘部分是給想了解我們如何在不破壞任何東西的情況下將閘道遷移到 Rust 的工程師。

核心概念是清楚切分。我們建立一個只做資料轉換的 Rust core：它會把您的請求轉成提供者請求，把提供者回應轉回來，轉換串流區塊，計算 token，並標準化錯誤。它絕不開啟 socket、讀取 secret，或寫入您的資料庫。這些都由主程序處理。這種分離讓我們能在不重寫伺服器的情況下將 Rust 上線，因為 Python 繼續處理 I/O，而 Rust 接手翻譯。

<RustMigrationStages />

### 一次一條路由，先在正式環境驗證 {#one-route-at-a-time-proven-in-production}

我們絕不一次切換整個端點。對每條路由，我們先證明一個提供者，將其推出到該路由上的所有提供者，然後才開始下一條路由。最小、風險最低的路由先開始。

<RouteCadence />

在第 1 階段，伺服器形態不變。Python 仍然提供流量並處理 I/O，但透過按提供者以旗標控制的 binding 將翻譯交給 Rust core。對等性檢查會在任何提供者啟用前強制輸出完全一致，如果旗標關閉，現有的 Python 路徑會維持不變。

<Stage1Architecture />

路由會依風險順序移動：

- **先 OCR。** 從 Mistral OCR 開始，這是最小的表面：沒有串流、schema 很小、參數很少。等它在正式環境中逐位元組與 Python 輸出一致後，再推展到所有 OCR 提供者，然後將該路由移入 Rust core。整合風險會在任何更大的端點移動前先在這裡消除。
- **接著是 `/v1/messages`。** 這加入了串流：SSE 解析、區塊發送、使用量計算、token 成本。先一個提供者，再全部，然後將路由移入 Rust。
- **之後是 `/chat/completions`。** 這是最大的表面，只有在串流證明可行後才會處理：工具、函式呼叫、多模態，以及完整的可選參數矩陣。
- **主要提供者。** 依流量量級排序：先 Azure，再 Bedrock，再 Vertex。與驗證綁定的提供者會從主程序接收簽章標頭（先用 boto3 / google-auth，之後再用原生 Rust）。長尾提供者會繼續在 Python 上執行。

### 轉向 Rust 伺服器 {#onto-a-rust-server}

一旦路由在 Rust 上執行，路由器也會一起移過去：路由、備援、重試與冷卻，狀態存放在 Redis 中。接著伺服器本身會分兩步移動。

<RustServerSteps />

- **FastAPI 作為薄殼。** FastAPI 仍然終止 HTTP 並執行驗證、速率限制與回呼，但整個轉送路徑只會單次呼叫 Rust。
- **純 Rust 伺服器。** 原生伺服器（axum / hyper）在沒有 Python 位於熱路徑上的情況下執行轉送路徑。您的自訂 Python plugins（驗證、防護欄、回呼、SSO）會在可選 sidecar 中繼續運作，所以不會有任何東西壞掉。我們會以 shadow traffic 與百分比切換方式推出。

最終狀態是純 Rust 資料平面。用戶端 Python 外掛程式會繼續在 sidecar 中執行，因此不會破壞相容性。若要完全移除 Python，則需要將外掛程式移植到 Rust 或 WASM 介面，這屬於我們目前延後處理的破壞性變更。

### 為什麼是這個順序 {#why-this-order}

- OCR 路由先降低整合風險，且影響範圍最小。
- `/v1/messages` 會在最大參數集合之前先降低串流風險。
- `/chat/completions` 只會在串流已被證實可行後才進行。
- 當伺服器開始移動時，核心、提供者與路由器都已經透過 SDK 在正式環境中運作，因此伺服器工作大多只是接線。

每一步都會在下一步開始前先交付給真實使用者，並以相容性檢查作為門檻。

## 時程 {#timeline}

我們一次搬移一個函式，先做最小的，且只在每一步通過測試套件後才進行下一步。

| 目標 | 移至 Rust 的內容 |
|---|---|
| 2026 年 8 月 15 日 | Mistral 的 `litellm.ocr()`，接著是全部 `litellm.ocr()`，然後是 `/ocr` 路由 |
| 2026 年 9 月 1 日 | 同樣模式套用到 `/messages`，接著是 `/chat/completions` |
| 2026 年 9 月 15 日 | 路由器：負載平衡、備援、重試、冷卻時間 |
| 2026 年 12 月 1 日 | 完整伺服器：FastAPI 薄外殼，然後是純 Rust（axum） |

## 常見問題 {#frequently-asked-questions}

<Head>
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {"@type": "Question", "name": "LiteLLM 是最快的 LLM 閘道嗎？", "acceptedAnswer": {"@type": "Answer", "text": "這是這項工作的目標。透過 Rust 熱路徑，LiteLLM 目標是將閘道額外開銷降到 1ms 以下，且二進位檔小於 100MB，在保有 100+ 提供者、並透過單一相容 OpenAI 的 API 進行存取的同時，達到與編譯式語言閘道相當的表現。在我們的基準測試中，Rust 閘道每個請求約增加 0.05ms 的額外開銷，而目前的 LiteLLM Python 路徑約為 7.5ms，且在負載下每秒可處理 6,782 個請求，峰值記憶體為 31.7MB。閘道額外開銷通常只佔總模型延遲的一小部分，最關鍵的是高吞吐、低延遲的工作負載，例如大規模分類與 embeddings。"}},
        {"@type": "Question", "name": "LiteLLM 速度慢嗎？", "acceptedAnswer": {"@type": "Answer", "text": "閘道延遲與吞吐量取決於代理程式的部署方式：worker 數量、並行設定，以及記錄回呼是否在熱路徑上執行。經過調校後，Python 代理程式目前可在數百個提供者之間服務正式流量。將熱路徑移至 Rust 會進一步降低下限：在我們可重現的基準測試中，Rust LiteLLM 閘道每個請求約增加 0.05ms 的額外開銷，而 LiteLLM Python 路徑約為 7.5ms，且在峰值記憶體 31.7MB 下每秒可處理 6,782 個請求。"}},
        {"@type": "Question", "name": "LiteLLM 受 Python GIL 限制嗎？", "acceptedAnswer": {"@type": "Answer", "text": "GIL 只會影響請求路徑上的 CPU 密集工作，而閘道大多是 I/O。LiteLLM 目前透過執行多個 worker 來擴充。Rust 遷移將請求轉換、串流與路由移到 Rust 核心與路由器中，脫離 GIL，最終狀態下轉送路徑上不再有第一方 Python。"}},
        {"@type": "Question", "name": "LiteLLM 閘道會用多少記憶體？", "acceptedAnswer": {"@type": "Answer", "text": "在負載下，Python 代理程式峰值記憶體達到 358.9MB。Rust 的最終狀態目標約為 65MB。較低且有上限的記憶體使用量是這項工作的主要原因：它可減少在並行負載下出現的高 CPU 與 OOM 失敗。"}},
        {"@type": "Question", "name": "LiteLLM Rust 基準測試可重現嗎？", "acceptedAnswer": {"@type": "Answer", "text": "可以。額外開銷測試工具（模擬上游、薄型 Rust 閘道，以及會以微秒計算每個請求耗時的負載用戶端）已隨本篇文章一併公開在 benchmark/ 下，並附上彙總後的 CSV。兩次執行之間唯一的變數是 Python 與 Rust。"}},
        {"@type": "Question", "name": "LiteLLM Rust 閘道會是破壞性變更嗎？", "acceptedAnswer": {"@type": "Answer", "text": "不會。這不是 v2，也不是重寫。設定、資料庫結構與用戶端 API 合約都保持不變。熱路徑下的執行階段會逐步改變，逐一依路由進行，並在相容性與端到端測試通過後推出。"}}
      ]
    })}
  </script>
</Head>

### LiteLLM 是最快的 LLM 閘道嗎？ {#is-litellm-the-fastest-llm-gateway}

這是這項工作的目標。透過 Rust 熱路徑，LiteLLM 目標是將閘道額外開銷降到 `1ms` 以下，且二進位檔小於 `100MB`，在保有 100+ 提供者、並透過單一相容 OpenAI 的 API 進行存取的同時，達到與編譯式語言閘道相當的表現。在我們的基準測試中，Rust 閘道每個請求約增加 `0.05ms` 的額外開銷，而目前的 LiteLLM Python 路徑約為 `7.5ms`，且在負載下每秒可處理 `6,782` 個請求，峰值記憶體為 `31.7MB`。閘道額外開銷通常只佔總模型延遲的一小部分，因此最關鍵的是高吞吐、低延遲的工作負載，例如大規模分類與 embeddings。

### LiteLLM 速度慢嗎？ {#is-litellm-slow}

閘道延遲與吞吐量取決於您如何部署代理程式：worker 數量、並行設定，以及記錄回呼是否在熱路徑上執行。經過調校後，Python 代理程式目前可在數百個提供者之間服務正式流量。將熱路徑移至 Rust 會進一步降低下限：在我們可重現的基準測試中，Rust 閘道每個請求約增加 `0.05ms` 的額外開銷，而 LiteLLM Python 路徑約為 `7.5ms`，且在峰值記憶體 `31.7MB` 下每秒可處理 `6,782` 個請求。

### LiteLLM 受 Python GIL 限制嗎？ {#is-litellm-limited-by-the-python-gil}

GIL 只會影響請求路徑上的 CPU 密集工作，而閘道大多是 I/O。LiteLLM 目前透過執行多個 worker 來擴充。Rust 遷移會讓熱路徑不再有這個問題：請求轉換、串流與路由都會在 Rust 核心與路由器中執行，脫離 GIL，最終狀態下轉送路徑上不再有第一方 Python。

### LiteLLM 閘道會用多少記憶體？ {#how-much-memory-does-the-litellm-gateway-use}

在我們的負載測試中，Python 代理程式峰值記憶體達到 `358.9MB`。Rust 的最終狀態目標約為 `65MB`。較低且有上限的記憶體使用量是這項工作的主要原因：它可減少在並行負載下出現的高 CPU 與 OOM 失敗。

### 這些基準測試可重現嗎？ {#are-these-benchmarks-reproducible}

可以。額外開銷測試工具（模擬上游、薄型 Rust 閘道，以及會以微秒計算每個請求耗時的負載用戶端）已隨附在 [`benchmark/`](https://github.com/BerriAI/litellm-docs/tree/main/blog/litellm_rust_launch/benchmark) 中，並附上彙總後的 CSV。兩種執行階段使用相同的上游與 payload；唯一的變數是 Python 與 Rust。

### Rust 閘道會是破壞性變更嗎？ {#will-the-rust-gateway-be-a-breaking-change}

不會。設定、資料庫結構與用戶端 API 合約都保持不變。熱路徑下的執行階段會逐步改變，逐一依路由進行，並在相容性與端到端測試通過後推出。

## 我們正在招募 Rust 工程師 {#we-are-hiring-rust-engineers}

我們正以小團隊打造這項工作，並尋找希望投入這個服務 100+ 提供者的 AI 閘道熱路徑的 Rust 工程師。如果這聽起來像您，歡迎 [和我們一起打造](https://jobs.ashbyhq.com/litellm/3f326076-7415-46a1-921e-8a1b1d6ee2b6)。

## 參考資料 {#references}

- [Datadog 如何將其靜態分析器從 Java 遷移到 Rust](https://www.datadoghq.com/blog/engineering/how-we-migrated-our-static-analyzer-from-java-to-rust/)
- [GitGuardian 如何將其平台核心遷移到 Rust](https://blog.gitguardian.com/how-we-migrated-the-heart-of-our-platform-to-rust/)
- [LiteLLM AI 閘道，完整功能總覽](https://docs.litellm.ai/docs/simple_proxy)
- [跨 100+ LLM 提供者的負載平衡與路由](https://docs.litellm.ai/docs/routing)
