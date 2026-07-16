---
slug: security-hardening-april-2026
title: "安全更新：漏洞揭露與持續強化"
date: 2026-04-03T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "LiteLLM v1.83.0 中已修補之安全漏洞的揭露，以及我們的漏洞賞金計畫啟動。"
tags: [security]
hide_table_of_contents: false
---

在 3 月的 [供應鏈事件](https://docs.litellm.ai/blog/security-update-march-2026) 之後，我們請 [Veria Labs](https://verialabs.com/) 針對 LiteLLM proxy 進行稽核，並修正了來自獨立研究人員的多項漏洞回報。以下所有問題都已在 v1.83.0 中修正。如果您受到影響，特別是如果您已啟用 JWT 驗證，我們建議升級。

我們也已推出 [漏洞賞金計畫](#bug-bounty-program)，而 Veria Labs 也持續對 proxy 進行稽核。更多修正將在後續版本中推出。

這兩個高嚴重性問題（[CVE-2026-35029](https://github.com/BerriAI/litellm/security/advisories/GHSA-53mr-6c8q-9789) 和 [GHSA-69x8-hrgq-fjj8](https://github.com/BerriAI/litellm/security/advisories/GHSA-69x8-hrgq-fjj8)）**都要求攻擊者已經持有 proxy 的有效 API 金鑰**。未經驗證的使用者無法利用這些問題。

這個關鍵嚴重性問題（[CVE-2026-35030](https://github.com/BerriAI/litellm/security/advisories/GHSA-jjhc-v7c2-5hh6)）是驗證繞過，但只有在明確啟用 `enable_jwt_auth` 的部署中才會受影響，而該功能預設為關閉。**預設的 LiteLLM 設定不受影響，且沒有 LiteLLM Cloud 客戶啟用此功能。**

{/* truncate */}

## 漏洞 {#vulnerabilities}

### CVE-2026-35030：透過 OIDC 快取碰撞造成的驗證繞過（關鍵） {#cve-2026-35030-authentication-bypass-via-oidc-cache-collision-critical}

由 Veria Labs 發現。

當啟用 `enable_jwt_auth` 時，LiteLLM 會使用 `token[:20]` 作為快取索引鍵來快取 OIDC userinfo。來自相同簽章演算法的 JWT 共享相同的標頭前綴，因此攻擊者可以偽造一個 token，命中其他使用者的快取項目並繼承其工作階段。我們已改為以 `sha256(token)` 作為快取索引鍵來修正此問題。

**大多數部署不受影響。** 這需要 `enable_jwt_auth: true`，而其預設為關閉。如果您無法升級，可停用 JWT 驗證作為因應措施。

完整公告：[GHSA-jjhc-v7c2-5hh6](https://github.com/BerriAI/litellm/security/advisories/GHSA-jjhc-v7c2-5hh6)

### CVE-2026-35029：透過 `/config/update` 的權限提升（高） {#cve-2026-35029-privilege-escalation-via-configupdate-high}

由 Lakera 發現。

`/config/update` 未檢查呼叫者的角色。任何已驗證使用者都可以修改 proxy 的執行階段組態，這可能導致任意檔案讀取、管理員帳號接管，或遠端程式碼執行。我們現在要求此端點具備 `proxy_admin` 角色。

完整公告：[GHSA-53mr-6c8q-9789](https://github.com/BerriAI/litellm/security/advisories/GHSA-53mr-6c8q-9789)

### 密碼雜湊暴露與 pass-the-hash 登入（高） {#password-hash-exposure-and-pass-the-hash-login-high}

弱雜湊最初由 GitHub 使用者 [hamzayevmaqsud](https://github.com/hamzayevmaqsud) 回報（[#15484](https://github.com/BerriAI/litellm/issues/15484)）。完整攻擊鏈由 [iO Digital](https://www.iodigital.com/) 的 Luca Vandenweghe 與 Maarten De Rammelaere 識別出來。

密碼原本以未加鹽的 SHA-256 雜湊值儲存，某些情況下甚至是純文字。多個 API 端點會將該雜湊值回傳給任何已驗證使用者，且 `/v2/login` 會直接接受原始雜湊值作為憑證而不重新雜湊，因此被竊取的雜湊值和密碼本身一樣有用。我們已改用帶隨機鹽值的 scrypt，並從所有 API 回應中移除雜湊值。

完整公告：[GHSA-69x8-hrgq-fjj8](https://github.com/BerriAI/litellm/security/advisories/GHSA-69x8-hrgq-fjj8)

## 漏洞賞金計畫 {#bug-bounty-program}

在供應鏈事件與這些揭露之後，很明顯我們需要更多外部人員關注這個專案。我們已建立漏洞賞金計畫，讓研究人員有管道回報問題。

目前針對 P0（供應鏈）與 P1（未經驗證的 proxy 存取）漏洞提供獎金：

| 嚴重性 | 獎金 | 範例 |
|----------|--------|---------|
| 關鍵 | $1,500 – $3,000 | 供應鏈遭入侵 |
| 高 | $500 – $1,500 | 未經驗證存取受保護資料 |

我們計畫在未來幾個月進一步擴大此計畫。關於漏洞賞金計畫的更多資訊可在[這裡](https://github.com/BerriAI/litellm/security)取得。

## 接下來是什麼 {#whats-next}

Veria Labs 持續與我們合作，對 proxy 進行更廣泛的稽核。透過 Github 提交的安全公告將在五個工作天內回覆。我們會在問題獲確認並修正後發布公告。
