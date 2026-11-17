---
slug: headroom-integration
title: "LiteLLM × Headroom: 與 Claude Code 一起使用更少 60–95% 的 token"
date: 2026-06-30T10:00:00
authors:
  - krrish
  - ishaan-alt
description: "將 Headroom 作為 LiteLLM 上的 pre_call 防護欄，藉此在 Claude Code 與其他 LLM 流量上減少輸入 token。"
tags: [partnership, guardrails, context, headroom, claude-code]
hide_table_of_contents: false
---

[Headroom](https://headroomlabs-ai.github.io/headroom/) 現在可作為 LiteLLM proxy 上的原生防護欄執行，在工具輸出、RAG 載荷、資料庫結果與檔案讀取到達模型之前先行壓縮。

{/* truncate */}

長上下文代理程式大多把輸入配額消耗在重複的工具輸出、擷取的區塊與過時的暫存狀態上。Headroom 會智慧地改寫這些內容，讓模型以更少的 token 看到相同資訊。

如果模型需要完整上下文，LiteLLM 也會將 `retrieve_headroom` 工具傳給模型，讓其從 Headroom 取回完整上下文。 

## 如何部署？  {#how-is-it-deployed}

Headroom 以 LiteLLM 的 sidecar 方式執行。用戶端流量仍會先進入 LiteLLM 閘道；LiteLLM 會在 `pre_call` 步驟中呼叫 Headroom，替換為壓縮後的訊息，並將載荷向上游轉送。用戶端與 LLM 提供者從不會直接與 Headroom 交談。

這樣做有兩個好處
- **便利性：** 不論是否使用提示壓縮，使用者都只需要 1 個 API base。
- **可靠性：** 即使 Headroom 當機，您的 LLM 請求也不會受影響。 

![用戶端到 LiteLLM 再到 LLM，Headroom 以 sidecar 方式附加在 LiteLLM 上](/img/headroom_architecture.png)

壓縮同時適用於 `/v1/chat/completions` 與 `/v1/messages`（Anthropic 格式），這使得 Claude Code 的導入對管理員來說只要一行指令：將 `headroom-compression` 附加到虛擬金鑰，交給開發者，之後他們透過 `ANTHROPIC_BASE_URL` 發出的每個請求都會自動被壓縮。無須修改用戶端，無須變更程式碼。

可依金鑰、依請求，或透過 `default_on: true` 全域啟用。請透過檢查 `x-litellm-applied-guardrails` 回應標頭或 Logs UI 中的 Guardrails 面板，確認其已執行。

**開始使用：** [Headroom guardrail 設定指南](../../docs/proxy/headroom)（需要 LiteLLM v1.92.x 或更新版本；若要在穩定版釋出前先行測試，請取得 [v1.92.0-dev.1](https://github.com/BerriAI/litellm/releases/tag/v1.92.0-dev.1) 開發版本）

**討論：** [GitHub discussion #31816](https://github.com/BerriAI/litellm/discussions/31816)
