---
slug: litellm-rust-ocr
title: "OCR 自 v1.102.0-rc.1 起預設使用 Rust"
date: 2026-09-13T10:00:00
authors:
  - yujonglee
description: "自 v1.102.0-rc.1 起，OCR 請求會預設使用 Rust 實作，同時保留既有 API。"
keywords: [litellm, rust, ocr, python sdk, ai gateway]
tags: [litellm, rust, rust-migration, ocr, reliability]
---

import {OcrFixedArrivalChart, OcrProviderDelayChart, OcrThroughputChart} from '@site/src/components/OcrBenchmarkCharts';

自 LiteLLM `v1.102.0-rc.1` 起，OCR 預設在 Rust 上執行。 

{/* truncate */}

## 無需採取任何動作 {#no-action-required}

繼續使用現有的 OCR API：

```python
import litellm

response = litellm.ocr(
    model="mistral/mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": "https://arxiv.org/pdf/2201.04234",
    },
)
```

相同的預設也適用於非同步 OCR 請求。Gateway 使用者在升級後也會自動使用 Rust 路徑。

### 必要時可退出 {#opt-out-when-needed}

設定 `LITELLM_RUST=0` 以對某個程序停用 Rust 路徑：

```bash
export LITELLM_RUST=0
```

您也可以在進行 OCR 請求前，針對目前的 Python 程序選擇退出：

```python
import litellm

litellm.rust(False)
```

## 效能影響是什麼？ {#what-is-the-performance-impact}

**重點：** 當 proxy CPU 是瓶頸時，Rust 能支援更多 OCR 請求每秒。

### 我們如何測試 {#how-we-tested}

我們測量的是 proxy 額外負擔，而不是端到端 OCR 延遲。每條路徑都在新的容器中執行，使用 `v1.102.0-rc.1`、一個 proxy worker、一顆 CPU、`2 GiB` 記憶體，以及本機 mock 提供者。Python 和 Rust 使用相同的影像與限制；只有 `LITELLM_RUST` 改變，且在每個上傳大小的六個配對回合中，順序交替進行。

### Rust 提高了 CPU 受限的 proxy 上限 {#rust-raises-the-cpu-limited-proxy-ceiling}

在一顆 CPU 上，中位吞吐量從 `143.6` 提升到 `211.7 RPS`，當大小為 `1 MiB`（`1.48x`）時；並從 `21.6` 提升到 `36.2 RPS`，當大小為 `8 MiB`（`1.69x`）時。每次提升都是六個同回合 Rust/Python 比率的中位數。

<OcrThroughputChart />

兩條路徑都使用了其單一 CPU 配額的 97% 到 99%。這支持在 proxy CPU 是瓶頸時，提高 OCR proxy 吞吐量上限。這不代表實際的 OCR 請求完成速度會快 `1.69x`；提供者延遲通常主導端到端延遲。

絕對 RPS 會隨共享開發主機上的負載變化而不同。配對回合保留了更有用的訊號：在相近條件下，哪個實作更快。

### 優勢取決於瓶頸 {#the-advantage-depends-on-the-bottleneck}

我們又進行了幾項額外檢查，以確認主要結果在哪些情況下成立、在哪些情況下不成立。圖表各只顯示一次執行，而且精確數值會在重跑間變動，因此請將其視為大致界線，而非精確數字。每項結果的方向都一致。

#### 只有在 proxy CPU 飽和時才會出現提升 {#the-gain-appears-only-when-proxy-cpu-saturates}

<OcrProviderDelayChart />

我們在 mock 提供者中加入了 `100 ms` 延遲，讓等待提供者而非 proxy 成為瓶頸。在併發數 8 時確實如此：proxy 大多閒置，且未觀察到 Rust 提升。在併發數 64 時，有足夠多的請求同時進行，proxy CPU 再次飽和，提升也隨之回來。

#### 高於 Python 的上限時，請求會排隊 {#above-pythons-ceiling-requests-queue}

<OcrFixedArrivalChart />

主要基準測試固定併發數並量測每條路徑的上限。這個檢查則改為固定每秒三十 `8 MiB` 個請求，這高於 Python 在該大小下量測到的上限，且低於 Rust。Rust 完成了每一次到達請求，且 CPU 仍有餘裕，因此延遲維持在數十毫秒。Python 的 CPU 飽和，請求排隊，p95 延遲攀升到數秒，而且記憶體使用量約為兩倍。
