---
slug: host-header-auth-bypass
title: "已在 1.84.0+ 修正 - 版本更新：透過 Host Header Injection 的認證繞過（GHSA-4xpc-pv4p-pm3w）"
date: 2026-06-01T12:00:00
authors:
  - krrish
  - ishaan-alt
  - yuneng
description: "揭露 LiteLLM proxy 中存在的 Host header 認證繞過。已在 v1.84.0 中處理。受影響的部署非常有限，且沒有任何 LiteLLM Cloud 客戶受到影響。"
tags: [security]
hide_table_of_contents: false
---

針對 LiteLLM proxy 這個 Host-header 認證繞過的更新已於 `v1.84.0` 發布，後續的路徑處理強化則已完成，並在 `v1.84.3`、`v1.85.2`、`v1.86.2` 與 `v1.83.10-stable.patch.3` 中回補到所有維護中的發行線。繞過的潛在風險僅限於同時具備下列三項特定條件的部署。此繞過由 Le The Thang（KCSC）與 Kim Ngoc Chung（One Mount Group）回報。

在 proxy listener 可透過任意 `Host` 標頭存取時，這些條件可能允許未經驗證的存取進入受保護的管理路由。

沒有任何 LiteLLM Cloud 客戶受到影響。此次更新已在本公告發表前，部署到所有 LiteLLM Cloud 環境中——並回補到使用中的發行線。

* 已在以下版本修正：`v1.84.0`
* 建議：使用最新版本；後續的路徑處理強化已回補至 `v1.84.3`、`v1.85.2` 與 `v1.86.2`
* 採取行動：升級至 `v1.84.0` 或更新版本。無需變更設定。

關於此公告的更多資訊請見這裡：https://github.com/BerriAI/litellm/security/advisories/GHSA-4xpc-pv4p-pm3w. CVE：https://www.cve.org/CVERecord?id=CVE-2026-48710.

{/* truncate */}

## 重點摘要 {#tldr}

* 經構造的 `Host` 標頭可能會讓 proxy 的認證閘道對不同於實際提供的路由進行評估，因而可能允許未經驗證地存取受保護的管理路由。
* 此更新已於 `v1.84.0` 發布。後續的路徑處理強化已回補至 `v1.84.3`、`v1.85.2` 與 `v1.86.2`；建議升級至最新版本。
* 潛在繞過需要能以任意 `Host` 標頭連上 proxy listener。以前端基礎架構驗證或正規化 `Host` 可降低繞過的潛在風險，視設定而定，但不能完全取代升級。
* 沒有任何 LiteLLM Cloud 客戶受到影響。

## 摘要 {#summary}

proxy 的認證層會從 `request.url.path` 中的 `litellm/proxy/auth/auth_utils.py::get_request_route()` 推導出有效路由，而 Starlette 會從 `Host` 標頭重建這個值。因此，經構造的 `Host` 標頭可能會讓認證閘道對不同於 FastAPI 實際分派的路由進行評估，導致受保護的管理路由被視為公開。

潛在繞過需要某個行為者能以任意 `Host` 標頭連上 proxy listener。以前端基礎架構驗證或正規化 `Host` 標頭可降低繞過的潛在風險，但是否能完全阻擋繞過取決於特定設定。LiteLLM Python SDK 不受影響；受限範圍內只有 proxy server。

## 額外加固 {#additional-hardening}

`v1.84.0` 中的主要更新，透過從 ASGI scope path 而非 `Host` 重建的 URL 推導請求路由，處理了已回報的潛在繞過。作為額外的後續作業，我們稽核了 proxy 中所有其他從請求 URL 推導路由的位置，並將它們改為使用相同的強化解析。這封堵了潛在繞過的長尾風險，並已在 `v1.84.3`、`v1.85.2`、`v1.86.2` 與 `v1.83.10-stable.patch.3` 中回補到所有維護中的發行線。我們建議升級至這些版本之一，以獲得完整緩解。

## 我是否受到影響？ {#am-i-affected}

僅當下列 **全部** 條件都為真時，您才可能受影響：

- 您執行的是 **LiteLLM proxy server**（不只是 Python SDK）。
- 您使用的版本 **早於 `v1.84.0`**。
- proxy listener 可被不受信任的用戶端存取。

如果 proxy listener 無法被不受信任的用戶端存取——例如，它繫結在私人網路上，或位於需要自身驗證的 gateway 後方——則您 **不** 會遠端暴露於潛在繞過之下。

以前端基礎架構驗證或正規化 `Host` 標頭（CDN/WAF、具有 `server_name` allowlists 的反向 proxy，或以主機為基礎的負載平衡器）可降低繞過的潛在風險，但是否能完全緩解潛在繞過取決於設定。

## 該怎麼做 {#what-to-do}

1. 升級至 `v1.84.0` 或更新版本。建議升級到最新版本，其中包含已回補至 `v1.84.3`、`v1.85.2` 與 `v1.86.2` 的後續強化。
2. 如果您的 proxy 在受影響版本期間可從不受信任的網路存取，請輪替在暴露期間建立的任何 API 金鑰，並檢查管理稽核記錄中是否有異常的金鑰、使用者或設定變更。

## 緩解措施 {#mitigations}

如果您無法立即升級，為了更有效緩解潛在繞過，我們建議將 proxy 放在上游元件之後，並由該元件在轉送前驗證或正規化 `Host` 標頭：

- CDN 或 WAF（例如 Cloudflare）、
- 具有明確 `server_name` allowlists 的反向 proxy（nginx、Caddy、Traefik）、
- 具有以主機為基礎路由規則的雲端負載平衡器、

或以其他方式限制對 proxy listener 的網路存取。請注意，這是每個部署各自的屬性：若反向 proxy 轉送用戶端的 `Host` 時不變更（例如 nginx `proxy_set_header Host $host;`），可能無法完整保護您的使用情境免於此潛在風險。請將升級視為消除任何潛在繞過的方式，而僅將邊緣過濾視為權宜之計。
