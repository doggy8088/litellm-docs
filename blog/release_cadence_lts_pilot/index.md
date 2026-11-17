---
slug: release-cadence-and-lts-pilot
title: "發布節奏變更與 LTS 版本試行計畫"
date: 2026-11-02
authors:
  - yuneng
description: "自 2026 年 11 月 2 日當週起，release candidates 與穩定版改於週二上午發布，且 LiteLLM 正在 1.108 上試行一個月的長期支援版本線。"
tags: [release, support]
hide_table_of_contents: false
---

*自 2026 年 11 月 2 日當週起，LiteLLM 的 release candidates 與穩定版從週六改為週二上午發布，我們也正在試行一條為期一個月的長期支援（LTS）版本線。*

{/* truncate */}

## 發布改至週二 {#releases-move-to-tuesday}

release candidates 與穩定版現在改於週二上午發布，不再於週六發布，與業界標準的 Patch Tuesday 發布日一致。[release cycle](/docs/proxy/release_cycle) 頁面有完整的每週排程。

## 在 1.108 上試行 LTS {#an-lts-pilot-on-1108}

我們也正在試行一條為期一個月的長期支援（LTS）版本線。第一條 LTS 版本線是 1.108。

LTS 版本線適合希望停留在同一個版本、持續取得修復，而不必每週升級的團隊。它會取得包含 LLM 翻譯修復、成本追蹤修復與新端點的修補版本。

我們選擇 LLM 翻譯與成本追蹤，是為了讓您無需升級到較新的版本，就能以準確的定價支援新模型。

試行期間，為[最近四條穩定版本線](/docs/enterprise/version_support)提供修補的政策暫停。[LTS pilot](/docs/enterprise/lts_pilot) 頁面有詳細說明。

**更新（11 月 6 日）：** `lts` 映像標籤現在永遠指向最新的 LTS 版本。拉取 `docker.litellm.ai/berriai/litellm:lts` 即可停留在最新的 LTS 修補版本，或鎖定特定版本，例如 `docker.litellm.ai/berriai/litellm:1.108.2`。
