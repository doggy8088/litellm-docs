---
slug: gpt-6-2-instructions-caching-incident
title: "成本更新：OpenAI 的 GPT-6.2 快取變更可能提高輸入成本"
date: 2026-11-19T10:00:00
authors:
  - ryan
  - ishaan-alt
  - krrish
tags: [openai, caching, cost]
hide_table_of_contents: false
---

11 月 17 日，OpenAI 發布了一項破壞性變更，停止快取 GPT-6.2 上的 `instructions` 欄位，而 LiteLLM 在將 `/v1/chat/completions` 與 `/v1/messages` 請求轉發給 OpenAI 時，會把您的 system prompt 放在這個欄位。請求仍可運作，但 GPT-6.2 使用者在每一次呼叫中都要為 system prompt 支付全額。我們正主動發貨修復，並將它 backport 到 5 條發布線。

## 待辦事項 {#action-items}

- 升級到您所在發布線的版本，或任何更新的版本。不需要變更設定。

| 發布線 | 升級到 |
|---|---|
| 1.108 LTS | `v1.108.13` 或更新版本 |
| 1.111 RC | `v1.111.0rc3` 或更新版本 |
| 1.110 stable | `v1.110.2` 或更新版本 |
| 1.109 stable | `v1.109.3` 或更新版本 |
| 1.106 stable | `v1.106.12` 或更新版本 |

{/* truncate */}

## 我受到影響了嗎？ {#am-i-affected}

如果您曾以以下其中一種方式透過 LiteLLM 傳送 GPT-6.2 流量，您就受到影響。

- `/v1/chat/completions` 到使用 Responses API 的 GPT-6.2 部署，例如 `openai/responses/` 前綴、`chatgpt/` 或 Bedrock Mantle GPT-6.2
- `/v1/messages` 到 GPT-6.2，例如來自 Claude Code 或另一個 Anthropic 格式用戶端

## 根本原因 {#root-cause}

Responses API 接受 system prompt 放在兩個地方：頂層的 `instructions` 欄位，或 `input` 開頭的一則訊息。在 GPT-6.1 之前，兩者的快取方式相同，因此 LiteLLM 使用 `instructions`。

11 月 17 日，OpenAI 更新文件，說明從 GPT-6.2 起，即使內容完全相同，`instructions` 在每次請求中都會以未快取的費率計費，而可重複使用的提示應該改放在 `input` 開頭的 `developer` 訊息中。我們這邊沒有任何東西故障，因此我們的錯誤警示都沒有觸發，而一位客戶在 11 月 18 日回報了缺少的快取命中。

## 我們的修復 {#our-fixes}

- LiteLLM 現在會在 GPT-6.2 上把 system prompt 以 `developer` 訊息的形式放在 `input` 開頭，OpenAI 會在那裡快取它。請參閱 [PR #52599](https://github.com/BerriAI/litellm/pull/52599)，已 backport 到上方表格中的每條發布線。
- 我們監看提供者變更記錄的 bot 現在會標記快取內容的變更，因此下一次出現這類變更時，我們會在您之前就發現。
