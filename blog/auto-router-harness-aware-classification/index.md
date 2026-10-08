---
slug: auto-router-harness-aware-classification
title: "自動路由器更新：支援 Harness 感知的路由"
date: 2026-09-10T10:00:00
authors:
  - moe
image: ./hero.png
description: "針對 Claude Code 和 Codex 的支援 Harness 感知的 Auto-Router 更新：更少的分類器上下文、支援加密任務，以及更清楚的路由記錄。"
keywords: [auto router, harness aware routing, Claude Code, Codex, agent routing, complexity router, llm routing, litellm]
tags: [routing, complexity-router, engineering]
hide_table_of_contents: false
---

![The Auto-Router 將任務上下文傳送給分類器，並將原始請求傳送給所選模型](./hero.png)

我們已更新 Auto-Router，以因應 Claude Code 和 Codex 封裝請求的方式。現在它會從分類中移除更多 harness 上下文、保留加密的委派任務，並清楚顯示分類器實際收到的內容

{/* truncate */}

:::info[協助塑造 Auto-Router]

與 LiteLLM 團隊合作，在您的正式流量上測試路由，並協助塑造我們下一步要打造的內容

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計合作夥伴</a>

:::

編碼 harness 傳送的內容不只有使用者的任務。請求還會帶有環境細節、儲存庫指示、技能目錄，以及提醒。這些內容可能主導分類器輸入，或在任務之後以獨立訊息的形式出現。支援 harness 感知的路由會使用用戶端身分與請求格式，找出需要模型處理的任務

| 更新 | 變更內容 |
| --- | --- |
| [Claude Code 分類](https://github.com/BerriAI/litellm/pull/40655) | 從分類器輸入中省略呼叫端系統文字 |
| [Codex 提醒處理](https://github.com/BerriAI/litellm/pull/40599) | 移除可辨識的 harness 區塊，同時保留委派的任務 |
| [加密的委派任務](https://github.com/BerriAI/litellm/pull/40608) | 在原生 Responses 分類器請求中保留加密的任務區塊 |
| [分類器記錄](https://github.com/BerriAI/litellm/pull/40604) | 分開顯示分類器輸入、已遮罩的來源請求，以及分類器回應 |

## 為 Claude Code 減少分類器輸入 {#less-classifier-input-for-claude-code}

在一個 Claude Code 重現案例中，一個簡短的二分搜尋問題使用了 2,478 個分類器輸入 token。環境細節、代理程式定義，以及技能目錄在分類器的使用者酬載中占了 7,613 個字元

對於可辨識的 Claude Code 請求，LLM 分類器現在會省略呼叫端系統文字。所選模型仍會收到原始系統文字，而分類器會保留目前的提問、已設定的先前回合，以及對話深度訊號

| 第一次分類器呼叫 | 之前 | 之後 |
| --- | ---: | ---: |
| 使用者酬載，字元數 | 7,675 | 62 |
| 總輸入 token | 2,478 | 524 |

這表示**這次呼叫的分類器輸入 token 約減少了 79%**。該重現案例使用 Claude Code 2.1.268、Haiku 4.5 分類器，以及一個包含一個委派子代理程式的三輪對話。它衡量的是第一次呼叫的分類器額外負擔；整體工作階段成本與回答品質需要另外評估。 [重現與結果](https://github.com/BerriAI/litellm/pull/40655)

僅在 Claude Code 系統訊息中提供的任務限制，也不再影響 tier 選擇。請將應該影響路由的限制放在任務本身中

## 讓 Codex 任務保持在可見範圍內 {#keep-the-codex-task-in-view}

Codex 可以在委派任務之後附加環境與儲存庫指示。先前，該尾端訊息可能會成為分類器目前的提問

對於可辨識的 Codex 用戶端代理，路由器現在會移除完整的 harness 區塊，例如 `<environment_context>` 和 `<recommended_plugins>`，以及儲存庫指示包裝區。委派的任務仍可供分類使用，而所選模型會收到原始請求

使用 `classification_mode: user_turn` 與工作階段識別碼時，新的提問後接提醒文字會被分類。後續的助手或工具延續會沿用其所選模型，而不會再次進行分類器呼叫。新的提問仍可供分類。 [行為與重現](https://github.com/BerriAI/litellm/pull/40599)

自訂 `reminder_markers` 會取代內建標記，因此在覆寫它們時，請包含您的 harness 所需的每一對

## 分類加密的委派任務 {#classify-encrypted-delegated-tasks}

有些 Codex 委派任務會以包含 `encrypted_content` 的 `agent_message` 形式到達。將該酬載轉成一般文字會讓分類器看不到任務，並對一個困難請求產生 `SIMPLE` 判定

路由器現在會在原生 Responses 分類器請求中保留加密任務。在重現案例中，困難任務從 `SIMPLE` on `gpt-5.6-luna` 變成 `REASONING` on `gpt-6-astra`。簡單任務仍維持為 `SIMPLE` on `gpt-5.6-luna`，並測試了串流與非串流請求。 [重現與結果](https://github.com/BerriAI/litellm/pull/40608)

這需要原生 OpenAI 或 Azure OpenAI Responses 分類器部署，以及能消耗加密內容的憑證。加密任務會在 `heuristic_first` 和 `hybrid` 模式下繞過本地評分捷徑。不支援的部署與解密錯誤會遵循 `classifier_fallback`。實際重現使用了 OpenAI；未測試 Azure 傳輸

## 查看分類器收到的內容 {#see-what-the-classifier-received}

在 **Logs** 中開啟請求，然後選取其 **Classify** 列。新的擷取內容會分別顯示 **Classifier input**、**Originating request, credentials masked** 以及 **Classifier response**

這讓您可以檢查任務是否送達分類器，並將其判定與原始請求進行比較。來源副本中的憑證（包括 Cookie 和 Set-Cookie 標頭）會被遮罩。訊息記錄的去識別化設定仍然適用，而較舊的列會保留其既有檢視。 [Logs 更新](https://github.com/BerriAI/litellm/pull/40604)

## 搭配您的 harness 試用 {#try-it-with-your-harness}

使用包含相關變更的建置版本，並將 Claude Code 或 Codex 流量導向 [Auto-Router](/docs/proxy/auto_routing)。保留用戶端的 `User-Agent` 標頭，讓路由器可以辨識它。透過實際用戶端測試 Claude Code 行為：瀏覽器路由預覽沒有用戶端身分欄位，並使用一般分類行為

請在 [Auto-Router 討論](https://github.com/BerriAI/litellm/discussions/32168) 中分享您的發現
