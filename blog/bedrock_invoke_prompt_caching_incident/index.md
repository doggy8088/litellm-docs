---
slug: bedrock-invoke-prompt-caching-incident
title: "事件報告：Bedrock Invoke 上 Claude Code 的提示快取失效"
date: 2026-07-13T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
tags: [incident-report, bedrock, caching, claude-code]
hide_table_of_contents: false
---

**日期：**2026 年 7 月 4 日至 2026 年 7 月 10 日  
**受影響版本：** `v1.91.0` 和 `v1.91.1`  
**嚴重性：** 中等（靜默成本回歸；不影響正確性）  
**狀態：** 已在 `v1.91.2` 修正

> **注意：** 如果您透過 LiteLLM 在 Amazon Bedrock 上執行 Claude Code，且使用 `v1.91.0` 或 `v1.91.1`，請升級至 `v1.91.2` 或更新版本。

## 摘要 {#summary}

在 7 月 4 日到 7 月 10 日之間，執行 `v1.91.0` 或 `v1.91.1` 的代理程式，會在透過 Amazon Bedrock 的 Invoke API 路由 Claude Code 工作階段時，靜默破壞 Anthropic 提示快取。對於回報此問題的客戶而言，暖工作階段的快取命中率從大約 90% 降到 25% 到 45%，而團隊每日支出在相同用量下上升了 2 到 3 倍。請求仍然回傳 200，且完成內容正確；唯一的症狀是快取未命中率與帳單。

原因是：[PR #31364](https://github.com/BerriAI/litellm/pull/31364) 將 `messages` 中每個 `role: "system"` 項目移到 Invoke 路徑上的頂層 `system` 欄位，這會讓工具定義與系統提示之後的每個快取斷點失效。修正已於 7 月 10 日隨 `v1.91.2` 釋出（[#32578](https://github.com/BerriAI/litellm/pull/32578)、[#32831](https://github.com/BerriAI/litellm/pull/32831)、[#32882](https://github.com/BerriAI/litellm/pull/32882)），並附上在修正前程式碼上會失敗的回歸測試。

這個結果完全由我們承擔。觸發因素是 Claude 新模型與 Claude Code 使用系統訊息方式的一項文件不佳的變更，但客戶之所以使用閘道，正是因為不需要追蹤提供者的怪異行為。忠實轉譯請求（包括其快取語意）是我們的核心工作，而這次我們沒有做好。這篇文章會精確說明發生了什麼事、為什麼我們的測試與審查沒能抓到，以及我們做了哪些改變，避免這類回歸再次釋出。

{/* truncate */}

---

## 背景 {#background}

有三個事實構成這次事件的前提：

1. **Claude 提示快取是以前綴為基礎：**
   1. 以遞增成本排序的 token 計價為：
      1. 快取讀取（0.1x）
      2. 一般寫入（1x）
      3. 快取寫入（5m ttl 為 1.25x，1h ttl 為 2x）
   2. 當 Claude Code 發出新請求時，Bedrock 提供者會檢查先前是否有任何請求是目前請求的截斷前綴。如果有，它只會讀取快取到該點為止。
2. **對話中途的系統訊息是新的：**
   1. 在 2026 年 5 月 28 日，Claude Opus 4.8 作為第一個接受 `role: "system"` 項目置於 `messages` 之內的模型釋出（[文件](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages)）。Claude API 文件在 [同一天](https://web.archive.org/web/20260528184320/https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages) 也記錄了這一點。
   2. Claude Code（`v2.1.154`）於 2026 年 5 月 28 日開始輸出這些項目，但其變更記錄中未提及。
   3. Bedrock 最晚在 [2026 年 6 月 9 日](https://web.archive.org/web/20260609182343/https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-mid-conversation-system.html) 文件化了相同支援（第一個 archive.org 擷取；該頁面可能早在 5 月 28 日就已出現）。
3. **Bedrock 有兩個 Anthropic API，規則不同：**
   1. Converse 需要所有系統內容都放在頂層欄位；LiteLLM 自 2024 年 12 月起就已將其提升至那裡（[#7037](https://github.com/BerriAI/litellm/pull/7037)）。
   2. Invoke 使用原生 Anthropic Messages 格式，其中 Opus 4.8 之前的模型會以 400 錯誤拒絕對話中途的系統項目，而較新的模型則接受它們。

---

## 出了什麼問題 {#what-went-wrong}

1. 在 5 月 28 日之後，Bedrock Invoke 上的 Claude Code 工作階段在會話中途開始出現 400 錯誤，前提是同時符合兩件事：
   1. 模型比 Opus 4.8 還舊
   2. 模型是以別名提供
      1. Claude Code 會藉由在模型名稱中尋找像 `opus-4-7` 或 `sonnet-4-6` 這類版本子字串來偵測能力。
      2. 例如，像 `bedrock-claude` 這樣的別名不包含任何這類字串，因此 Claude Code 會假設它具備最新功能集，並且總是輸出對話中途的系統訊息。
2. 一位企業客戶用本機修補程式繞過了這些 400 錯誤，該修補程式會將 `messages` 中每個系統項目提升到頂層 `system`，模仿 Converse 行為，並請我們上游合併。我們於 7 月 4 日在 `v1.91.0` 中以 [#31364](https://github.com/BerriAI/litellm/pull/31364) 形式釋出。
3. 這個提升修正了 400 錯誤，但因為總是提升 `messages` 中的系統項目，當 Claude Code 寫入新的對話中途系統訊息時，就會使整個 `messages` 快取失效；我們量測到這種情況平均約每 3 回合發生一次。
4. 這大幅降低了快取命中率並提高了快取寫入率，導致支出增加。

---

## 偵測與回應 {#detection-and-response}

7 月 8 日，一位受影響的客戶提供了這個回歸問題的詳細 bug 回報。我們同一天自行端到端重現了它。

三個 PR 修正了這個問題，三者都已於 7 月 10 日隨 `v1.91.2` 釋出，並經過大量端到端測試；同時也加入了在修正前程式碼上會失敗的回歸測試：

1. [#32578](https://github.com/BerriAI/litellm/pull/32578) 停用 Invoke 上的對話中途系統訊息提升。
2. [#32831](https://github.com/BerriAI/litellm/pull/32831) 在 Opus 4.8 以下的模型上重新啟用提升。
3. [#32882](https://github.com/BerriAI/litellm/pull/32882) 也停用 Sonnet 5 和 Fable 5 上的提升。

| 日期（2026） | 事件                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| 5 月 28 日   | Opus 4.8 釋出；Claude Code 開始輸出對話中途的系統訊息              |
| 6 月 27 日   | 客戶的繞過方式上游合併為 [#31364](https://github.com/BerriAI/litellm/pull/31364) |
| 7 月 4 日    | `v1.91.0` 隨回歸問題釋出                                                       |
| 7 月 6 日    | 客戶觀察到支出增加 2 到 3 倍且快取命中率崩跌                                |
| 7 月 8 日    | 回歸問題回報；找出根本原因；提出修正                                    |
| 7 月 10 日   | `v1.91.2` 隨三項修正與回歸測試釋出                                 |
| 7 月 13 日   | 客戶確認完全恢復                                                           |

---

## 為什麼我們的流程沒有抓到這個問題 {#why-our-process-did-not-catch-this}

1. **原始修補程式的測試不是端到端。** 我們用單輪 `curl` 請求驗證它，看到 400 變成 200，並假設這就是 Claude Code 會使用的形式。事實並非如此。我們沒有追查根本原因（當時我們還不知道對話中途系統訊息的存在）或其對快取的影響，而是把它視為無害的邊緣案例修正。
2. **審查缺乏可提出異議的脈絡。** 人類審查者看到的是一個小型相容性修補程式、通過的測試，以及對於 Claude Code 為何開始送出這類對話中途系統訊息沒有任何說明；我們的 AI 審查機器人也沒有標示出快取影響。流程中的任何人都沒有足夠資訊把提升與快取失效連起來。
3. **成本回歸是靜默的。** 每個回應都是 200 且完成內容正確。唯一的訊號是快取讀取 token 數，而我們的 CI 或監控都沒有量測這些數據。
4. **文件不完整。** 這項功能從未出現在 Claude Code 的變更記錄中，而截至 7 月 13 日，Claude API 文件仍將其描述為僅限 Opus 4.8（未提及 Sonnet 或 Fable 5），而且在 Bedrock 上不可用，這與我們的實測結果相矛盾。

---

## 我們正在做的變更 {#what-we-are-changing}

- 我們的 e2e 套件將加入一個腳本化的多輪 Claude Code 工作階段，會針對真正的 Bedrock 將上下文擴充到約 250k tokens，並斷言 cache 讀取會單調遞增且永遠不會崩塌（已在 [#32963](https://github.com/BerriAI/litellm/pull/32963) 開始）。
- 我們將建立每週自動化負載測試，以標記在支出、cache 讀取與寫入、turn 延遲、錯誤率等方面的異常，確保在版本釋出前就能偵測並修正成本與效能回歸。
- 每日針對 Anthropic 的 SDK 與文件進行自動化 diff，提醒我們有哪些新功能需要在客戶流量碰到之前完成翻譯支援。
- 我們內部會 [dogfood](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) LiteLLM，並將針對新的 request 形狀設置監控，例如未知的 `anthropic-beta` headers，以及相同的異常偵測，這會在版本釋出前提醒我們。
- 現在修正 bug 的合併門檻更高：只有在真實客戶的流量、其精確的終端使用者應用程式上端到端重現，且完整理解根本原因時，才算通過驗證；合成請求還不夠。

---

## 已知限制 {#known-limitations}

1. Converse 會在 `messages` 中的任何位置拒絕 system entries，因此在 `bedrock_converse` 上我們仍然必須 hoist，而透過 Converse 路由的 Claude Code 工作階段在每次會話中途出現 system message 時仍會失去快取前綴。如果您在 Bedrock 上執行 Claude Code，請將它透過 Invoke 路徑路由（`bedrock/invoke/<model>`）。我們正在向 AWS 提出這項 API 限制。
2. 我們正在測試 Vertex AI 與 Azure 路徑是否也需要等效的 hoisting，等我們取得更多資訊後會更新這篇文章。

對每一個因這件事而讓帳單上升的團隊：我們很抱歉。閘道的價值在於，這類提供者變更會由我們吸收，而不是傳遞到您那裡；而上述的測試、監控與流程改善，就是我們打算持續維持這件事的方法。
