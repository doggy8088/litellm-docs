---
slug: auto-router-setup-and-testing
title: "AutoRouter：1 次點擊部署"
date: 2026-08-05T10:00:00
authors:
  - tin
image: ./hero.png
description: "Auto-Router 的六項變更：Anthropic 和 OpenAI 的 1 次點擊預設、單行代理程式設定技能、UI 中的 Test Routing、可替換的分類器系統提示、可自訂層級，以及可設定的提醒標記。"
keywords: [auto router, llm routing, litellm, model routing, claude code, llm classifier, complexity router]
tags: [routing, complexity-router, ui, engineering]
hide_table_of_contents: false
---

![LiteLLM AutoRouter V2：始終使用最新模型](./hero.png)

我們讓設定與測試 Auto-Router 比以往任何時候都更容易，而且透過可自訂的層級名稱 + 分類器系統提示，您可以超越複雜度路由。 

{/* truncate */}

:::info[可用性]

以下所有內容都會隨 **v1.97.x** 一起推出。

:::

:::info[🚀 協助塑造 Auto-Router]

搶先取得存取權、直接與 LiteLLM 團隊合作，並透過您的正式流量影響路線圖。

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計夥伴</a>

<br /><br />

已經在測試了嗎？請在 [討論串 #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享您的結果。

:::

## 新增 Auto Router（Models + Endpoints → Auto Router） {#add-an-auto-router-models--endpoints--auto-router}

![Models + Endpoints 中的新增 Auto Router 對話框，含自動設定與範本選項](./auto-setup.png)

- 在 LiteLLM 儀表板中，前往 **Models + Endpoints** 並開啟 **Auto Router** 分頁。新增一個 Auto Router model，或啟用並設定現有的 model。
- 輸入 Auto Router 名稱，然後選擇 **Configure automatically** 或挑選一個範本。檢視產生的層級、測試路由，並儲存。
- **Configure automatically** 會檢查您的 proxy 目前已提供的 models，為全部四個層級選出最佳可用 models，並替您填入表單
- 選擇一個家族會用該家族中的 **latest models** 為您建立整份設定，因此每個層級都會使用目前的 models，而不需要撰寫任何 YAML
- 詳細資訊會收合成一行的層級摘要；參照您的 proxy 未提供之 model 的預設會變灰，並告訴您缺少哪一個
- 更多家族即將加入；目前支援 Anthropic 和 OpenAI，而 Custom 可用於其他所有情況

## 讓您的代理程式設定路由器 {#let-your-agent-set-up-the-router}

將以下內容貼到 Claude Code、Codex、Cursor，或任何具有 shell 存取權的代理程式中：

```
run curl -fsSL https://docs.litellm.ai/skills/auto-router and follow the instructions
```

- 它會讀取您的 proxy 目前已提供的 models，然後詢問您路由器名稱與每個層級背後的 model
- 無論您的 proxy 是以檔案為基礎還是由 DB 管理，它都會替您寫好設定
- 在結束前，它會列出保留不變的預設值、每個變更項目的效益，並詢問您是否要變更任何項目

## 在設定期間於 UI 中測試路由 {#test-routing-in-the-ui-during-setup}

- **Test Routing** 現在位於 Add Auto Router 表單中的 Test Connection 旁邊
- 傳送一個提示，查看它落在哪個層級以及原因，並且是針對目前畫面上的設定
- 不會建立任何內容，也不會傳送到被路由到的 model，因此除了您的 LLM 分類器（如果已啟用）之外，不會產生任何額外成本

## 取代分類器的系統提示 {#replace-the-classifiers-system-prompt}

隨附的 LLM 分類器只有一個內建評分規則，因此路由器只能評估複雜度。`classifier_llm_config.system_prompt` 現在可讓您定義自己的路由條件，無論您是想要更深入的複雜度提示，還是要依據其他條件進行路由，例如資料敏感度或 model 能力（vision、audio、image）。

- `classifier_fallback` 會決定分類失敗時的處理方式：使用 heuristic scorer，或直接到 `default_model`

## 自訂您的層級 {#customize-your-tiers}

除了上述變更之外，您現在可以將層級名稱從預設值 SIMPLE / MEDIUM / COMPLEX / REASONING 進行變更。如果您的團隊偏好 Fast / Standard / Premium / Deep，或 Image / Video / Audio / Text，則可使用選用的 `tier_labels` 對應進行重新命名。

- 名稱會在儀表板、支出記錄，以及 LLM 分類器的評分規則中變更，因此分類器會以您的詞彙進行推理
- 只供顯示。設定鍵維持標準名稱，路由行為不會改變，而且 API 呼叫端永遠看不到這些名稱
- 部分對應也沒問題；未列出的層級會保留預設名稱

## 可設定的提醒標記，輕鬆整合 OpenClaw {#configurable-reminder-markers-easy-openclaw-integration}

路由器會在分類前移除 harness 注入的內容，因此 token 預算備註不會被評分為使用者的實際問題。該標記對原本硬式編碼為 `<system-reminder>`；新的 `reminder_markers` 欄位可讓像 OpenClaw 這類 harness 使用自己的標記。

```yaml
complexity_router_config:
  reminder_markers:
    - "<<<begin_ctx>>>"
    - "<<<end_ctx>>>"
```

## 試試看 {#try-it}

:::info

從單行代理程式指令開始，或前往儀表板中的 **Models + Endpoints → Auto Router** 以新增或啟用 Auto Router model。請在 [討論串 #32168](https://github.com/BerriAI/litellm/discussions/32168) 提出問題與結果，或 [申請成為設計夥伴](https://calendly.com/tin-berri/litellm-auto-router-design-partner) 與我們直接一起進行這項工作。

:::

完整參考請見 [Auto Routing 文件頁面](/docs/proxy/auto_routing)。
