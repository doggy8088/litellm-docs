---
slug: cve-2026-42208-litellm-proxy-sql-injection
title: "LiteLLM Proxy 的安全更新：CVE-2026-42208"
date: 2026-04-29T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "CVE-2026-42208（LiteLLM Proxy 的 API key 驗證路徑中的 SQL injection）已修正。請升級至 v1.83.10-stable。"
tags: [security]
hide_table_of_contents: false
---

我們最近針對 LiteLLM Proxy 發布了一則安全公告。

我們透過 bug bounty program 收到一份關於 LiteLLM Proxy 的 API key 驗證路徑中存在 SQL injection 漏洞的回報，該漏洞追蹤編號為 **CVE-2026-42208**。

此問題已由我們的團隊審查、在穩定版本中修正，並以 GitHub Security Advisory 的形式發布。

* **受影響版本：** `v1.81.16` 至 `v1.83.6`
* **已修正版本：** `v1.83.7` 及之後版本
* **建議版本：** `v1.83.10-stable`

穩定版本：https://github.com/BerriAI/litellm/releases/tag/v1.83.10-stable

公告：https://github.com/BerriAI/litellm/security/advisories/GHSA-r75f-5x8p-qvmc

{/* truncate */}

## TLDR; {#tldr}

* 此問題是透過 LiteLLM 的 bug bounty program 回報的。
* 我們在發布 GitHub Security Advisory 之前，已先在穩定版本中修正此問題。
* LiteLLM Proxy 版本 `v1.81.16` 至 `v1.83.6` 受影響。
* 修正已包含於 `v1.83.7` 及之後版本。
* 我們建議升級至 `v1.83.10-stable`。
* 如果您的 proxy 在執行受影響版本時可從不受信任的網路連線，我們建議使用下方的輔助查詢檢視 Postgres 查詢歷史。

## 問題是什麼？ {#what-was-the-issue}

LiteLLM Proxy 會在 API key 驗證期間，透過檢查 `Authorization: Bearer` 標頭來驗證傳入的請求。

在受影響版本中，帶有精心構造的 `Authorization: Bearer` 標頭的未驗證請求，在某些條件下可能會到達有漏洞的資料庫查詢路徑。

這可能導致非預期的資料庫存取。實際影響取決於部署組態、網路暴露程度、資料庫權限，以及儲存的資料。

## 我們的安全流程 {#our-security-process}

此問題是透過我們的 bug bounty program 回報的。我們的團隊審查了回報、修補了有漏洞的路徑、驗證了修正，並在發布 GitHub Security Advisory 之前釋出了穩定版建置。

我們遵循這個流程，讓使用者在公告發布時能有清楚的修復路徑可用。

## 您應該怎麼做 {#what-you-should-do}

### 1. 升級至 `v1.83.10-stable` {#1-upgrade-to-v18310-stable}

我們建議升級至最新的穩定版本：

https://github.com/BerriAI/litellm/releases/tag/v1.83.10-stable

如果您無法直接升級至 `v1.83.10-stable`，請升級至任何 `v1.83.7` 或之後的版本。

### 2. 如適用，檢視 Postgres 查詢歷史 {#2-review-postgres-query-history-if-applicable}

如果您的 LiteLLM Proxy 在執行受影響版本時可從不受信任的網路連線，我們建議使用這個輔助查詢檢視您的 Postgres 查詢歷史：

https://gist.github.com/ishaan-berri/6f31e56e878338eb4c01990bd08378ab

如果查詢傳回您希望我們檢視的結果，請將其傳送給我們，我們可以協助分流。

## 持續投資於安全性 {#continuing-to-invest-in-security}

我們將持續投資於 bug bounty program 與協調揭露流程，以便能負責任地識別、修正並溝通問題。

如果您在 LiteLLM 中發現安全性問題，請透過我們的 [GitHub Security Advisory 流程或 bug bounty program](https://github.com/BerriAI/litellm/security) 回報。
