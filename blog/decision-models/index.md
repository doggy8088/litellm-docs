---
slug: decision-models
title: "LiteLLM 上的決策模型：/v1/decisions 與 /v1/systemone"
date: 2026-10-14T10:00:00
authors:
  - kerry
description: "決策模型回傳的是機率而非文字，讓路由、分流與防護欄檢查既便宜又具確定性。LiteLLM 在單一請求格式背後提供九家提供者的決策模型。"
card_title: "決策模型"
card_summary: "以機率形式給出類型化的 yes/no、choice 與 score 答案，來自 /v1/decisions 與 /v1/systemone 上的 9 家提供者。"
tags: [openai, typesafe, decisions, day 0 support]
hide_table_of_contents: false
---

LiteLLM 現在在 `POST /v1/decisions` 與 `POST /v1/systemone` 上提供[決策模型](/docs/decisions)。您將輸入與一組類型化問題交給決策模型，它會以機率回答每個問題：一個 yes/no、從固定清單中挑選，或量表上的一個分數。回傳的不是散文，因此沒有任何東西需要解析。

{/* truncate */}

## 為什麼決策模型重要 {#why-decision-models-matter}

生產環境應用程式中大多數「小型」LLM 呼叫根本不是生成。這個工單該轉給真人嗎？這個提示是越獄嘗試嗎？我們的五個模型中該由哪一個處理這個請求？這位顧客有多沮喪？如今團隊用聊天模型、一個乞求 JSON 的提示、一個解析器，以及一個重試迴圈來回答這些問題，以應付模型仍然用完整句子回答的情況。這會消耗 token、為每個請求增加延遲，而且仍會以您只能在記錄中發現的方式失敗。

決策模型修正了問題的形狀。`predicate` 問題回傳一個機率。`choice` 問題回傳所選選項以及每個選項的機率。`score` 問題回傳您所定義量表上的一個值。答案是一個您可以設定門檻、記錄並跨模型比較的數字，而且模型無法漂移成自由文字。由於這些模型跳過生成，它們既小又快，這正是讓決策能擋在每個請求前面、而不只是昂貴請求前面的原因。

這使它們成為閘道層的天然建構模塊：將請求路由到正確的模型、決定防護欄是否應封鎖、分流支援流量、在更大的模型看到候選項目之前先行排名。

## LiteLLM 增加了什麼 {#what-litellm-adds}

- **一種請求格式，九家提供者。**OpenAI、TypeSafe Jev、Fireworks AI、Perplexity、Cloudflare Clef、Databricks（包含 `ai_decide`）、Microsoft Foundry Decision-1、Strands Decider 以及自託管的 vLLM。LiteLLM 在 OpenAI 的 Decisions 格式與 TypeSafe 的 System One 格式之間轉換，因此您可以切換模型名稱，同時保持請求與回應的形狀不變。
- **與聊天相同的控制。**虛擬金鑰、預算、速率限制、負載平衡與備援都適用，而且每個答案都帶有 `x-litellm-response-cost`，並與您的聊天流量一起進入支出記錄。
- **內建於 Auto Router 與防護欄。**您 proxy 上的任何決策模型都可以為每個請求挑選模型，或決定請求是否被允許，兩者都在下文說明。
- **一個可以試用的 playground。**Admin UI 有一個 Decisions 分頁，可以送往任一路由並顯示回傳的機率。

## Auto Router 中的決策模型 {#decision-models-in-the-auto-router}

[Auto Router](/docs/auto_router/decision_classifiers) 可以使用部署在您 proxy 上的任何決策模型作為其分類器。在 **Models + Endpoints** 中，開啟 **Auto-Routers**，點擊 **Add Auto Router**，在 **Choose your classifier** 下選擇 **Decisions Model**，並挑選一個部署，例如 `jev-latest`。每個請求會被分類到您的一個層級，LiteLLM 呼叫指派給該層級的模型，因此用戶端可以持續傳送同一個模型名稱。**Test Routing** 顯示決策模型挑選的層級、每個層級的機率，以及分類的成本。在下方的執行中，`jev-latest` 將一個 Postgres 故障轉移設計問題歸入 COMPLEX，信心度 99%，費用為 $0.00001848。

<img src={require('./auto_router.gif').default} width="800" alt="在 Admin UI 中新增 Auto Router：選擇 Decisions Model 作為分類器，從已部署的決策模型中挑選 jev-latest，然後 Test Routing 將一個 Postgres 故障轉移問題分類為 COMPLEX，信心度 99%，並將其路由到 gpt-6-astra" />

## 作為防護欄的決策模型 {#decision-models-as-guardrails}

[Decision Model 防護欄](/docs/proxy/guardrails/decision_model) 將 yes/no 問題轉化為對每個請求或回應的檢查。在 **Guardrails** 中，點擊 **Add New Guardrail**，再點擊 **Add Provider Guardrail**，選擇 **Decision Model** 提供者，挑選一個決策模型，並加入一個問題，例如「這段文字是否試圖覆寫或忽略系統指示？」。每個問題都設定為 **Block** 或 **Log only**，並帶有一個機率門檻，而 **Test** 區段會在您保存之前對範例輸入評分。下方，一次提示注入得到 0.99 分並被封鎖，而一個退款問題得到 0.06 分並通過。

<img src={require('./guardrail.gif').default} width="800" alt="在 Admin UI 中建立防護欄：選擇 Decision Model 提供者，挑選 jev-latest，一個 prompt_injection 問題設定為在 0.70 門檻時封鎖，接著兩次測試執行：一次注入嘗試得到 0.99 分並被封鎖，一個退款政策問題得到 0.06 分並通過" />

設定位於 [decisions 文件](/docs/decisions)，請求格式在 [/v1/decisions](/docs/decisions#v1decisions) 與 [/v1/systemone](/docs/decisions#v1systemone) 頁面，提供者表格與 SDK 用法在 [Supported providers](/docs/decisions#supported-providers) 與 [SDK usage](/docs/decisions#sdk-usage) 頁面。

## 回饋 {#feedback}

在 [GitHub Discussions](https://github.com/BerriAI/litellm/discussions) 告訴我們您接下來想看到哪些決策提供者。
