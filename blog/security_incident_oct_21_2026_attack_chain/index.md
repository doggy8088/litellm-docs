---
slug: security-incident-oct-21-2026-attack-chain
title: "v1.107.0 LiteLLM 版本背後的攻擊鏈"
date: 2026-10-23T21:00:00
authors:
  - oliver
  - mateo
description: "一把在 5 月被提交到公開儲存庫的內部金鑰，如何導致三枚 GitHub 權杖被竊，以及遭入侵的 litellm v1.107.0 版本。"
tags: [security, incident-report]
hide_table_of_contents: false
---

10 月 21 日，我們的發布管線將遭入侵的 `litellm==1.107.0` 發布至 PyPI 與我們的容器 registry。[事件文章](/blog/security-incident-oct-21-2026)涵蓋了受影響的產出物，以及如果您執行了它們該怎麼做。我們已完成對威脅行為者所採取行動的調查，並能自信地斷言導致惡意 `v1.107.0` 版本發布的時間線與事件順序。

昨天在調查期間，我們發布了定期狀態更新，依調查進展盡我們所知反映了情境。調查仍在進行中，那些更新中的一些假設與看法後來被證明不準確或不完整。本文是權威的事實來源。


{/* truncate */}


## 敘述 {#narrative}

2026 年 5 月 27 日，一個設定檔[被提交](https://github.com/LiteLLM-Labs/lite-harness/blob/e10b14a/harnesses/opencode/opencode.json)至公開的 `LiteLLM-Labs/lite-harness` 儲存庫，其中不慎包含了一把通往 LiteLLM Agent Platform 內部部署的管理金鑰。這個錯誤很快被發現。約三小時後，一個後續 commit 刪除了該檔案，金鑰也被註記為需要撤銷，但原始 commit 一直留在該儲存庫的公開歷史中，直到 10 月 22 日。由於人為疏失，沒有人跟進撤銷通往 LiteLLM Agent Platform 的管理金鑰，因此它在四個多月後仍然有效。

### GitHub 擁有者存取權 {#github-owner-access}

10 月 10 日，威脅行為者使用這把金鑰取得了我們 LiteLLM Agent Platform 部署的控制權。LiteLLM Agent Platform 是一個實驗性專案，讓自我託管的雲端代理程式向 GitHub 儲存庫提出 PR。為了建立 PR，該系統設定了一枚 GitHub 認證權杖。威脅行為者利用他們的存取權提取了這枚 GitHub 權杖。

不幸的是，我們 LiteLLM Agent Platform 中設定的權杖不是權限範圍限定於適當儲存庫與能力的個人存取權杖，而是與我們 GitHub 組織擁有者關聯的 GitHub CLI OAuth 權杖。請注意，GitHub CLI 權杖沒有權限範圍限制，位於 2fa 之後，且不受 GitHub 針對敏感組織或儲存庫操作所設的「超級使用者」2fa 重新認證流程約束。從這一刻起，威脅行為者對我們的 GitHub 組織擁有了擁有者能力。


### 竊取其他權杖 {#exfiltrating-additional-tokens}

利用 GitHub CLI OAuth 權杖提供的存取權，威脅行為者開始執行更多的憑證竊取行動。他們將 commit 寫入內部儲存庫的分支，以執行旨在竊取我們儲存庫中設定為可供 CI 使用的任何權杖與秘密的工作流程。在此過程中，他們取得了與兩位具有維護者權限的工程師關聯的類似 GitHub CLI OAuth 權杖。

他們也取得了其他數個內部系統的權杖。檢視行為者在這些其他系統上的活動可見，他們試圖識別並竊取其他金鑰與權杖，主要聚焦於上游推論 API 權杖。

雖然我們已追蹤出我們相信威脅行為者可能存取的所有權杖，我們正在撤銷與每個內部系統和供應商平台關聯的每一枚權杖。這次事件強而有力地說明了未能輪換一把可能已暴露的金鑰所伴隨的風險。

### 建置與簽署惡意版本 {#building-and-signing-the-malicious-release}

在取得多個 GitHub 身分後，威脅行為者已能對我們的儲存庫進行變更而不過於招搖，將變更隱藏在看似正當的提議與核准之中。我們的發布工作流程位於私有的 `BerriAI/project-releaser` 儲存庫，它們以寫死的 `BerriAI` 作為儲存庫擁有者來簽出原始碼，因此沒有任何工作流程輸入能將建置指向 fork。為了從他們的相似名稱 fork 建置，威脅行為者必須變更工作流程本身。他們撰寫了 commit `9cf97e9`，新增了一個 `source_owner` 輸入，預設為 `BerriAI`，但接受任何組織。`main` 上的分支保護拒絕了這次推送，因為它需要 pull request、兩項通過的檢查，以及工作流程 codeowner 的核准。威脅行為者隨後使用組織擁有者的權杖，該權杖可以覆寫分支保護，無論如何將該 commit 推送至 `main`。在該變更進入 `main` 後，他們派發了 staging 工作流程，來源設定為 `Berri-AI/litellm`，也就是他們在相似名稱 `Berri-AI` 組織中的 fork。

在典型操作中，建置與發布一個版本需要由經授權的工程師啟動，並由一個鎖定於我們辦公室實體裝置的特殊帳號核准。本週稍早，為了配合更頻繁發布與錯誤修復 backport 的暫時推動，這項限制被放寬，允許任意兩位工程師觸發並核准發布。因此，威脅行為者使用其中一枚權杖觸發了發布（在將部署器重新指向他們的惡意儲存庫之後），並使用另一枚權杖核准了它。

然而值得注意的是，手握屬於組織擁有者的權杖，威脅行為者完全可以自行放寬這項限制（或將其完全移除）。不過，我們相信他們使用不同的權杖是為了透過喧鬧的稽核記錄來躲避偵測。

### 後續與控制 {#aftermath-and-containent}

惡意版本在約凌晨 4:40 AM PDT（11:40 UTC）發布至我們的公開 registry。我們在凌晨 6 點前不久（13:00 UTC）察覺到惡意版本，並立即開始將其移除的流程。PyPi 版本在 6:23 AM PDT（13:23 UTC）被凍結。Docker 映像花了我們稍長的時間，因為我們需要喚醒有權存取我們 Docker registry 的人員，它們在 7:20 AM PDT（14:20 UTC）被移除。

作為回應，在調查開始時，我們採取了下列臨時緩解方法：
* 我們立即鎖定了我們的公開 registry，以防止更多映像被發布。
* 一旦我們懷疑 GitHub 帳號遭到入侵，我們將我們 GitHub 組織的*所有*成員移除，只保留一個暫時提升為擁有者的特定帳號，我們能確定該帳號未受影響。
* 我們開始以一種模式運作，假設屬於我們組織的每一枚可能的權杖、金鑰或認證器都已被竊取。

隨著調查逐漸釐清攻擊的範圍與細節，我們得以開始規劃安全恢復帳號與流程所需的路線圖。

此時，我們有信心能在今天日終前安全地發布一個版本，為我們的使用者提供從信任儲存中移除 eMudhra 憑證授權單位的修復。我們理解，對於我們遲遲未發布修復這個備受關注問題的版本，大家感到挫折。我們只會在能對其安全性有信心時才發布版本。

### 流程改善 {#process-improvements}

我們知道你們許多人想聽聽我們學到了什麼，以及我們正在改變什麼。我們將在下週分享。


## 時間線 {#timeline}

### 遭入侵的憑證 {#compromised-credentials}

| 憑證 | 攻擊者如何取得它 | 它被用於什麼 |
|---|---|---|
| LiteLLM Agent Platform 的管理金鑰，一個內部 alpha 服務 | 5 月 27 日被提交到公開儲存庫 | 讀取 Agent Platform API |
| GitHub 組織擁有者的 GitHub CLI 權杖 | 10 月 10 日由 Agent Platform API 回傳 | 推送竊取分支、變更發布工作流程、執行 staging 建置、強制推送掩蓋行動 |
| 第二位維護者的 GitHub CLI 權杖，儲存為 `BerriAI/litellm` 的 `GH_TOKEN` 秘密 | 10 月 10 日由一次性工作流程發布至攻擊者的端點 | 核准生產閘門 |
| 第三位維護者的 GitHub CLI 權杖，儲存為 `BerriAI/litellm-auto` 的 `RELEASE_PLEASE_TOKEN` 秘密 | 10 月 10 日由第二個一次性工作流程發布至相同端點 | 刪除發布執行記錄 |

我們的第一篇文章懷疑權杖是從內部 LiteLLM 部署的記錄中被取走的。請求記錄顯示第一枚權杖來自不同的服務，如步驟 1 所述。

## 詳細時間線 {#detailed-timeline}

所有時間皆為 UTC。

| Time (UTC) | Step | Credential | Event |
|---|---|---|---|
| May 27, 18:53:14 | 0 | 無 | 帶有 LiteLLM Agent Platform 管理金鑰的 `opencode.json` 被提交至公開的 `LiteLLM-Labs/lite-harness` 儲存庫 |
| Oct 10, 21:13 to 21:28 | 1 | LAP 金鑰 | 攻擊者從 `69.48.229.143` 呼叫 Agent Platform API |
| Oct 10, 21:27:10 | 1 | LAP 金鑰 | `GET /api/v1/managed_agents/agents?limit=100` 回傳了擁有者的 GitHub CLI 權杖 |
| Oct 10, 22:11:45 | 2 | 擁有者的權杖 | `BerriAI/litellm` 的 `ci-tmp-a351cc` 分支上的工作流程執行，將包括 `GH_TOKEN` 在內的六個秘密發布至 `webhook.site` |
| Oct 10, 22:12:09 | 3 | 擁有者的權杖 | `BerriAI/litellm-auto` 的 `ci-tmp-be33e9` 分支上的工作流程執行，將 `RELEASE_PLEASE_TOKEN` 發布至相同端點 |
| Oct 10, 22:14:14 | 2 | 擁有者的權杖 | `BerriAI/litellm` 的執行被刪除 |
| Oct 10, 22:14:31 | 3 | 擁有者的權杖 | `BerriAI/litellm-auto` 的執行被刪除 |
| Oct 12, 12:08-12:30 | 3 | 擁有者的權杖 | 在多個私有儲存庫上執行工作流程，將所有儲存庫秘密發布至相同端點 |
| Oct 21, 10:08:29 | 4 | 第二位維護者的權杖 | 將 commit `9cf97e9` 推送至 `BerriAI/project-releaser` 的 `main` 被分支保護拒絕 |
| Oct 21, 10:08:34 | 4 | 擁有者的權杖 | 相同的推送透過覆寫分支保護而成功 |
| Oct 21, 10:46:39 | 4 | 擁有者的權杖 | 派發 staging 工作流程，來源設定為相似名稱的 `Berri-AI/litellm`，commit 為 `20535d8f` |
| Oct 21, 11:08:09 | 4 | 無 | Staging 執行完成 |
| Oct 21, 11:08:53 | 4 | 無 | 生產發布管線開始 |
| Oct 21, 11:11:18 | 5 | 第二位維護者的權杖 | 從 `199.91.221.39` 核准了生產環境閘門 |
| Oct 21, 11:39:51 to 11:40:13 | 5 | 無 | 七個 `litellm==1.107.0` wheel 被發布至 PyPI |
| Oct 21, 11:46:56 | 5 | 無 | Docker Hub 與 GHCR 映像被發布 |
| Oct 21, 11:53:49 | 6 | 第三位維護者的權杖 | 生產執行記錄被刪除 |
| Oct 21, 11:54:01 | 6 | 第三位維護者的權杖 | Staging 執行記錄被刪除 |
| Oct 21, 12:06:41 | - | - | [LidorMachluf](https://github.com/LidorMachluf) 發布了 [issue #47826](https://github.com/BerriAI/litellm/issues/47826)，識別出此次入侵 |
| Oct 21, 12:09:38 | 7 | 擁有者的權杖 | 透過覆寫分支保護，將還原 commit `285fbdc5` 推送至 `main` |
| Oct 21, 12:24:52 | 7 | 擁有者的權杖 | `main` 被強制推送回 `d687b69`，覆寫了強制推送封鎖 |
| Oct 21, 13:02 | - | - | LiteLLM 開始事件回應 |
| Oct 21, by 13:23 | - | - | PyPI 隔離了 `litellm==1.107.0` |
| Oct 21, 13:50 | - | - | LiteLLM 採用 LidorMachluf 的 issue 作為狀態更新的溝通管道 |
| Oct 21, by 13:51 | - | - | 受影響的 GHCR 標籤被設為不可用 |
| Oct 21, 14:19 | - | - | LiteLLM 識別出發布工作流程遭到入侵，並移除了所有 GitHub 權限 |
| Oct 21, 14:20 | - | - | Docker Hub 標籤 `v1.107.0`、`latest`、`main-latest` 與 `main-stable` 被移除或重新指向經驗證的乾淨映像 |
| Oct 21, 18:20 | - | - | LiteLLM 發布了[事件文章](/blog/security-incident-oct-21-2026) |
| Oct 22, 17:38 | - | - | Socket 團隊主動聯絡，提供了他們對用於憑證竊取與發布的惡意工作流程的獨立[調查](https://socket.dev/blog/litellm-attack-timeline) |
| Oct 23, 21:00 | - | - | LiteLLM 發布了這份根本原因分析 |



## 註解事件 {#annotated-events}


### 步驟 1：LAP 金鑰回傳了一枚 GitHub 權杖（October 10, 21:13 to 21:28） {#step-1-the-lap-key-returns-a-github-token-october-10-2113-to-2128}

攻擊者從 `69.48.229.143` 使用已提交至原始碼的管理金鑰呼叫了 Agent Platform API。

1. 在 21:13 與 21:28 之間，攻擊者向 API 發出了一系列經認證的請求。
2. 在 21:27:10，對 `GET /api/v1/managed_agents/agents?limit=100` 的請求回傳了每個受管理代理程式的設定。
3. 該回應包含我們兩位 GitHub 組織擁有者之一的 GitHub CLI OAuth 權杖。

### 步驟 2：一次性分支竊取了 BerriAI/litellm 的 CI 秘密（October 10, 22:11） {#step-2-a-throwaway-branch-exfiltrates-the-ci-secrets-of-berriailitellm-october-10-2211}

有了擁有者的權杖，攻擊者將儲存庫自身的 CI 變成了竊取管道。

1. 攻擊者將 commit `b69bc36` 推送至 `BerriAI/litellm` 上名為 `ci-tmp-a351cc` 的分支。
2. 其工作流程執行於 22:11:45 開始，並將六個儲存庫秘密發布至攻擊者控制的 `webhook.site` 端點。
3. 其中之一 `GH_TOKEN` 持有第二位維護者的 GitHub CLI OAuth 權杖。
4. 在 22:14:14，攻擊者以擁有者的權杖刪除了該執行。

GitHub 稽核記錄會記錄每個行動背後權杖的雜湊，而 `GH_TOKEN` 的雜湊與在步驟 5 核准發布的權杖相符。

### 步驟 3：進一步的竊取（October 10, 22:12；October 12 12:08-12:30） {#step-3-further-exfiltrations-october-10-2212-october-12-1208-1230}

1. 在步驟 2 之後二十四秒，`BerriAI/litellm-auto` 中 `ci-tmp-be33e9` 分支上的 commit `78d968b` 執行了一個工作流程，將 `RELEASE_PLEASE_TOKEN` 發布至相同端點。
2. 該秘密持有第三位維護者的 GitHub CLI OAuth 權杖。
3. 該執行在 22:14:31 被刪除。

其權杖雜湊與在步驟 6 刪除發布執行的權杖相符。

此外，攻擊者在兩天後對多個私有儲存庫進行了第二輪竊取。這包括 commit `1a6e3c1`，它竊取了一些敏感度極低的秘密，以及我們 CI 測試中使用的資金極少的提供者金鑰。詳細資訊請參見 [Socket 報告](https://socket.dev/blog/litellm-attack-timeline#Secrets-Targeted)。

這些額外的秘密未涉及通往被投毒產出物的路徑，並已透過輪換相關權杖與稽核安全記錄的存取而解決。

### 步驟 4：發布工作流程被指向 fork（October 21, 10:08 to 11:08） {#step-4-the-release-workflow-is-pointed-at-a-fork-october-21-1008-to-1108}

我們的版本由私有 `BerriAI/project-releaser` 儲存庫中的工作流程建置。攻擊者從 `199.91.221.39` 變更了那些工作流程取得原始碼的位置。

1. 攻擊者以組織擁有者身分撰寫了 commit `9cf97e9`（"ci: release from a fork source repository"）。在此 commit 之前，發布工作流程將 `BerriAI` 寫死為原始碼擁有者。該 commit 將其替換為新的 `source_owner` 輸入，讓發布工作流程能從 `BerriAI/litellm` 以外的來源儲存庫建置。
2. 在 10:08:29，以第二位維護者的權杖將該 commit 推送至 `main` 被分支保護拒絕，該保護要求 pull request、兩項通過的檢查，以及此工作流程 codeowner 的核准。
3. 在 10:08:34，攻擊者停用了分支保護，然後以擁有者的權杖強制推送。
4. 在 10:46:39，攻擊者以擁有者身分派發了位於 `9cf97e9` 的 staging 工作流程，來源設定為相似名稱的 `Berri-AI/litellm`，commit 為 `20535d8f`。
5. Staging 執行於 11:08:09 完成，生產發布管線於 11:08:53 開始。

Commit `20535d8f` 只存在於攻擊者的 fork 上，但它能在 `github.com/BerriAI/litellm/commit/20535d8f` 開啟，因為 GitHub 會透過 fork 來源的儲存庫提供 fork 的 commit。

### 步驟 5：生產閘門以被竊的權杖獲得核准（11:11:18） {#step-5-the-production-gate-is-approved-with-a-stolen-token-111118}

1. 第二位維護者的權杖從 `199.91.221.39` 核准了發布執行的生產環境閘門。
2. 管線簽署並發布了從 fork commit 建置的 `v1.107.0`。
3. 七個 PyPI wheel 在 11:39:51 與 11:40:13 之間發布。
4. Docker Hub 與 GHCR 映像在 11:46:56 發布。

### 步驟 6：執行記錄被刪除（11:53） {#step-6-the-run-records-are-deleted-1153}

1. 第三位維護者的權杖在 11:53:49 刪除了生產執行記錄。
2. 它在 11:54:01 刪除了 staging 執行記錄。

這兩次刪除都從儲存庫中移除了工作流程記錄。

### 步驟 7：工作流程歷史被強制推送清理（12:09 to 12:24） {#step-7-the-workflow-history-is-force-pushed-clean-1209-to-1224}

攻擊者再次以擁有者的權杖覆寫分支保護，從可見歷史中移除了該變更。

1. 在 12:09:32，攻擊者提交了對 `9cf97e9` 的還原，commit `285fbdc5`，並在 12:09:38 將其推送。
2. 在 12:24:52，他們將 `main` 強制推送回 `d687b69`，即變更之前的 commit，同樣覆寫了 GitHub 的強制推送封鎖。

`main` 隨後既不顯示該變更，也不顯示該還原。這兩個 commit 仍可透過 SHA 取得，組織稽核記錄也記錄了每一次覆寫。

## 致謝 {#acknowledgements}

我們要感謝 [Lidor Machluf from Upwind Security](https://github.com/LidorMachluf)，他在惡意版本發布後 20 分鐘內就抓到了它，維護了該問題的詳盡記述，並隨持續的分析與資訊不斷更新，為開源社群提供了寶貴的服務。

我們也要感謝 Karlo Zanki 與 Socket Threat Research 團隊與我們分享他們的調查，並就其發現的揭露進行協調。

此外，我們要向 [Trail of Bits](https://trailofbits.com/) 的 Asritha Bodepudi 與 Evan Sultanik 致上大大的感謝，他們一直以來都在協助我們進行內部安全稽核，作為 [Patch the Planet](https://trailofbits.com/patch-the-planet/) 的一部分，在處理、調查與溝通此次事件方面也非常有幫助。

最後，我們非常感謝 R10N Security 的 Ryan McGeehan，感謝他的建議、協助，以及他在業界的人脈，讓我們能迅速取得關於我們雲端帳號的原本難以取得的資訊，這在確認或排除潛在攻擊路徑方面極為有幫助。

## 指標 {#indicators}

| 指標 | 值 | 出現位置 |
|---|---|---|
| IP 位址 | `69.48.229.143` | 10 月 10 日的 Agent Platform API 請求 |
| IP 位址 | `199.91.221.39` | 10 月 21 日的 `BerriAI/project-releaser` 推送與閘門核准 |
| 相似名稱組織 | `Berri-AI` | 用作發布來源的 `BerriAI/litellm` fork |
| Commit | `20535d8f` | 發布所據以建置的 fork commit |
| 分支 | `ci-tmp-a351cc` | `BerriAI/litellm`，將秘密發布至 `webhook.site` 的工作流程 |
| 分支 | `ci-tmp-be33e9` | `BerriAI/litellm-auto`，將秘密發布至 `webhook.site` 的工作流程 |
| Commit | `9cf97e9` | `BerriAI/project-releaser`，工作流程變更，位於 `main` 歷史之外 |
| Commit | `285fbdc5` | `BerriAI/project-releaser`，還原，位於 `main` 歷史之外 |

遭入侵的產出物在被下架前上線了約兩小時。[事件文章](/blog/security-incident-oct-21-2026)列出了受影響的版本、如何檢查暴露，以及清理步驟。如果您在 LiteLLM 中發現安全問題，請透過我們的 [bug bounty 計畫](https://github.com/BerriAI/litellm/security) 回報。
