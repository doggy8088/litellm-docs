---
slug: auto-router-stall-escalation
title: "Auto-Router：將卡住的任務提升處理層級"
date: 2026-09-04T10:00:00
authors:
  - moe
image: ./hero.png
description: "Auto-Router 現在會讀取助理本身最近的工具呼叫，察覺代理式任務何時卡在重試迴圈中，並自動將其提升一個層級，這與 escalation_keywords 已提供的 bump 提升相同。"
keywords: [auto router, complexity router, stall detection, agentic routing, model escalation, tool calling, llm gateway, litellm]
tags: [routing, complexity-router, engineering]
hide_table_of_contents: false
---

![任務中途提升處理層級：Auto-Router 將卡住的請求 bump 到更高層級](./hero.png)

{/* truncate */}

:::info[🚀 協助塑造 Auto-Router]

搶先取得使用權、直接與 LiteLLM 團隊合作，並以您的正式環境流量影響產品藍圖。

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計夥伴</a>

<br /><br />

已經在測試了嗎？請在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享您的結果。

:::

便宜的模型在任務中途可能會卡住：它用相同的參數呼叫同一個工具三次，或者同一個呼叫一直發生錯誤，而該歷史中最新的訊息仍然只是像「您可以試試不同的方法嗎？」這樣無害的後續追問。單獨閱讀那個回合時，它每次都會被歸類為 SIMPLE，因此路由器會把它送回已經失敗的那個模型。直到現在，唯一的脫困方式還是有人發現迴圈並輸入提升處理層級關鍵字。

`stall_escalation_enabled: true` 讓路由器能自行做出這個判斷。

## 它如何決定 {#how-it-decides}

- **讀取的是助理自己的工具呼叫，而不是人的訊息。** 一旦最新的呼叫在最近 `stall_escalation_window` 次呼叫中重複，或發生錯誤達到至少 `stall_escalation_repeat_threshold` 次，任務就會被視為已卡住
- **以最新呼叫為依據，而不是視窗中最常見的模式。** 某個任務如果同樣嘗試了三次，之後又找到不同路徑，這些呼叫仍會在接下來幾個回合留在視窗中；以最新呼叫為錨點，可避免這段已恢復的歷史將任務提升處理層級
- **同時讀取兩種工具呼叫形式。** Anthropic Messages `tool_use`/`tool_result` 區塊，包括 `is_error`，以及 chat-completions `tool_calls`/`tool` 訊息，後者不帶錯誤旗標，因此只能根據重複次數來判定
- **無狀態。** 偵測會在每個被分類的回合，根據該請求自己的訊息重新執行，因此提升處理層級只會持續到任務看起來仍卡住為止，一旦不再卡住便會立即自行解除

提升處理層級記錄會在 `routing_decision.signals` 中的 `stall_escalation`，就在 `escalation_keywords` 旁邊。

## 在儀表板中 {#in-the-dashboard}

Auto-Routers 會獲得一個 **進階：任務卡住時的提升處理層級** 區段，內含切換開關與兩個調整項目：

![進階：任務卡住時的提升處理層級，已設定重複門檻與視窗](./stall-escalation-config.png)

它會與 `session_affinity` 和 `classification_mode: user_turn` 一起被拒絕。兩者都會在大多數回合重播一個已保留的路由決策，而不是進行分類，因此偵測永遠看不到所需的工具呼叫，而切換開關會因為這個原因變灰，而不是讓您儲存一個後端會拒絕的設定。

## 啟用方式 {#turning-it-on}

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params: {model: openai/gpt-4o-mini, api_key: os.environ/OPENAI_API_KEY}
  - model_name: gpt-4o
    litellm_params: {model: openai/gpt-4o, api_key: os.environ/OPENAI_API_KEY}

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE: gpt-4o-mini
          MEDIUM: gpt-4o

        # off by default: bump a stuck task one tier higher
        stall_escalation_enabled: true
        stall_escalation_window: 6
        stall_escalation_repeat_threshold: 3
```

:::info[在您的流量上試用]

將 shadow-eval 工作指派到您最繁忙的團隊，比較目前設定與開啟任務卡住時提升處理層級後的設定，並在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 告訴我們您的觀察結果，或

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計夥伴</a>

:::
