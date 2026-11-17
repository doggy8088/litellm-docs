---
slug: currency-support
title: "LiteLLM 推出貨幣支援"
date: 2026-11-16T09:00:00
authors: [joshua]
description: "以您的貨幣提供 token 價格，讓 LiteLLM 處理匯率，並在 Usage 儀表板上查看附日期的貨幣預估。"
tags: [engineering]
hide_table_of_contents: true
---

import { RequestPricing, ReferenceRates, SpendDashboard } from './visuals';

**以您團隊熟悉的貨幣呈現 AI 支出。**

以歐元傳送 token 價格、以日圓檢視支出，讓 LiteLLM 處理換算。貨幣支援把依請求計價、自動的歐洲央行匯率，以及附日期的支出預估整合到您的閘道中。

{/* truncate */}

## 以原始貨幣提供每個請求的價格 {#supply-each-requests-prices-in-its-original-currency}

請隨 `input_cost_per_token` 與 `output_cost_per_token` 一併傳送 `pricing_currency`。一個請求可以用歐元價格，下一個請求可以用日圓價格。LiteLLM 會把每個請求提供的價格換算為美元，用於支出追蹤與預算核算。

<RequestPricing />

**每個請求都帶有自己的價格與貨幣。**請搭配串流與非串流的 proxy chat completions 使用覆寫。請使用您設定的模型別名與已授權的虛擬金鑰，將此 JSON 內文傳送到 `/v1/chat/completions`。此範例使用每個 token 的示例價格。

```json
{
  "model": "your-model-alias",
  "messages": [{"role": "user", "content": "Hello!"}],
  "pricing_currency": "EUR",
  "input_cost_per_token": 0.000001,
  "output_cost_per_token": 0.000002
}
```

若要啟用請求計價，請透過部署的 `litellm_params.configurable_clientside_auth_params` 允許這三個欄位，並在金鑰或團隊的 metadata 中設定 `allow_client_pricing_override: true`。

## 讓 LiteLLM 追蹤匯率 {#let-litellm-keep-track-of-exchange-rates}

LiteLLM 會自動取得歐洲央行參考匯率、加以快取，並在到期時重新整理。請求會重複使用已快取的匯率進行換算，因此您的應用程式可以直接以歐洲央行支援的貨幣提供價格。

<ReferenceRates />

**貨幣不同，核算一致。**LiteLLM 會把歐元與日圓的 token 價格換算為共通的美元支出記錄。自動的匯率查詢與快取會為您處理匯率相關的工作。

## 讓團隊更容易理解支出 {#make-spend-easier-for-your-team-to-interpret}

開啟 **Usage**，在支出卡片上的 **Spend display** 中選擇一種貨幣。當地貨幣的預估金額會顯示在美元總計旁邊，並附上換算所用的參考日期。

<SpendDashboard />

**查看您已有的支出。**選擇一個報告期間，以您團隊熟悉的貨幣查看其總計。每個預估值都會使用最近的參考匯率，將該期間的美元支出換算過來。

請求計價與儀表板顯示是各自獨立的選擇。您可以以歐元提供 token 價格，再以日圓檢視總計，並以美元作為核算的共通單位。

<div className="currency-launch-note">
<p><strong>現已推出</strong></p>
<p>請在 Usage 中試用貨幣選擇器，或啟用依請求計價，並在下一次聊天請求中使用當地 token 價格。請參閱<a href="/docs/proxy/custom_pricing">自訂計價指南</a>與<a href="/docs/proxy/cost_tracking">支出追蹤指南</a>以開始使用。</p>
</div>
