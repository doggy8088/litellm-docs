---
title: LTS 試行計畫
description: LiteLLM 正在試行一條為期一個月的長期支援 (LTS) 版本線，自 1.108 開始。
---

# LTS 試行計畫 {#lts-pilot}

自 2026 年 11 月 2 日該週起，LiteLLM 正在試行一條為期一個月的長期支援 (LTS) 版本線。第一條 LTS 版本線是 1.108。{/* keep-version-note */}

LTS 版本線適合想停留在同一個版本並持續取得修復、而不必每週升級的部署。它會取得包含 LLM 翻譯修復、成本追蹤修復與新端點的修補版本。

每週發行排程以及次要版本與修補版本的差異，請參閱[發行週期](../proxy/release_cycle.md)。

## 支援的版本 {#supported-versions}

試行期間，LiteLLM 支援 LTS 版本線、目前的穩定版本線，以及目前的候選版本（rc）。其他版本線不會取得更新，而修補最近四個穩定次要版本線的[版本支援](./version_support.md)政策暫停。[發行說明](/release_notes)會列出目前的穩定版本與 rc 版本。

## 停留在最新的 LTS 修補版本 {#stay-on-the-latest-lts-patch}

`lts` 映像標籤永遠指向最新的 LTS 版本，並隨每個 LTS 修補版本移動。`litellm-database` 與 `litellm-non_root` 映像帶有相同的標籤。

```bash
docker pull docker.litellm.ai/berriai/litellm:lts
```

若要控制升級時機，請改為固定某個版本，例如 `1.108.2` 或 `1.108.2-lts`。當該版本是最新 LTS 版本時，兩者指向與 `lts` 相同的映像。
