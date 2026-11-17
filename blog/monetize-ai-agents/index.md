---
slug: monetize-ai-agents
title: "使用 LiteLLM 客戶管理讓您的 AI 代理程式獲利"
date: 2026-11-16T09:00:00
authors:
  - misbah
description: "AI 原生公司向代理程式收費的五種方式，從預付額度到依座位計費的方案，以及 LiteLLM 客戶管理如何追蹤成本並為每位客戶執行預算。"
tags: [ai-gateway, spend-tracking, customer-portal]
hide_table_of_contents: true
custom_hero: true
image: /img/blog/monetize-ai-agents/cover.png
card_video: /img/blog/monetize-ai-agents/hero.mp4
draft: false
---

import Head from '@docusaurus/Head';
import {PostByline} from '@theme/BlogPostPage';
import MonetizeHero from './MonetizeHero';
import {CreditWallet, SeatAllowances, UsageInvoice, PlanUpgrade, ModelTiers} from './MonetizeFigures';
import styles from './monetize-hero.module.css';

<Head>
  <meta property="og:video" content="https://docs.litellm.ai/img/blog/monetize-ai-agents/hero.mp4" />
  <meta property="og:video:secure_url" content="https://docs.litellm.ai/img/blog/monetize-ai-agents/hero.mp4" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1200" />
  <meta property="og:video:height" content="630" />
</Head>

<MonetizeHero />

<PostByline horizontal className={styles.byline} />

如果您把 AI 代理程式賣給其他公司，客戶的每個請求都會讓您在模型提供者那裡花錢。若要讓代理程式獲利，每位客戶支付給您的金額，必須高於該客戶的模型成本。本文介紹五種常見的代理程式收費方式，並針對每種方式說明 LiteLLM 客戶管理的控制功能，如何讓模型支出維持在客戶支付金額以下。

{/* truncate */}

## 成員、團隊與組織的請求成本 {#request-cost-for-the-member-the-team-and-the-organization}

為 AI 代理程式服務定價很容易，但團隊往往難以追蹤每位客戶請求的成本及其已指派的預算。一位客戶向小型模型傳送簡短提示，另一位客戶則在前沿模型上執行長時間的代理程式迴圈。在大型帳戶中，一位進階使用者花的錢可能比其他所有使用者加起來還多。如果您不知道每位客戶的成本，要等到提供者的帳單寄達，才會發現某個方案定價過低。

[LiteLLM 客戶管理](/blog/customer-management)會向您顯示每位客戶的成本。您的代理程式會隨每個請求傳送兩個標頭，標頭提供客戶的組織別名與成員 ID。LiteLLM 會為成員、團隊與組織記錄該請求的成本。在請求傳送到模型之前，LiteLLM 會檢查三個層級的預算。

```python
extra_headers={
    "x-litellm-customer-org-alias": "Acme",
    "x-litellm-customer-member-id": "acme-alice",
}
```

LiteLLM 與您的計費系統負責不同的工作。LiteLLM 記錄每位客戶的成本並執行您設定的上限。您的產品設定價格、額度餘額與方案，您的計費系統負責收款。

## 使用案例 1：預付額度 {#use-case-1-prepaid-credits}

有些公司向客戶提供額度包。例如，程式碼撰寫代理程式或 AI 應用程式建置工具會讓客戶先購買額度包，再使用 AI 程式碼撰寫代理程式。如果一位成員購買了 $100 的額度，其中 $60 到 $70 通常會設為模型支出的預算，剩下的金額就是公司的利潤。如果使用量沒有確實追蹤，風險在於客戶超出允許的預算，並耗用一部分利潤。

LiteLLM 讓您可以監控這筆支出，並在達到支出上限時停止該客戶的新請求。

<CreditWallet />

## 使用案例 2：附額度的依座位方案 {#use-case-2-per-seat-plans-with-an-allowance}

有些公司以每座位的價格提供 AI 代理程式，作為助理或研究員。

不過，即使每個座位的價格相同，各座位的使用量可能大不相同。進階使用者的使用量往往遠高於一般使用者。

`default-user` 範本可以有 $60 的每月上限，足以應付公司內大多數座位。`power-user` 範本的上限為 $90，適用於整天使用代理程式的分析師。當新成員傳送第一個請求時，LiteLLM 會套用該組織的預設範本，您不需要逐一手動設定每個座位。

<SeatAllowances />

也請在範本之上設定組織上限。此上限會把一家公司的總支出限制在該公司支付給您的金額。即使公司新增座位，上限仍然有效。如果合約是年度合約，`budget_limits` 可以在同一筆預算上同時設定每月窗口與每年窗口，每個窗口各自依自己的時程重設。

## 使用案例 3：加價的依使用量計費 {#use-case-3-usage-based-billing-with-a-markup}

客戶支援代理程式平台可以每月依使用量向每家客戶公司收費。期間結束時，平台必須掌握每位客戶的準確成本，再把加價加到該成本上。使用量 API 會提供某個組織在某個日期範圍內的完整總計，包括 `total_spend`、`total_tokens` 與 `total_api_requests`。

<UsageInvoice />

```bash
curl --get "$LITELLM_BASE_URL/management/v1/customer_organizations/daily/activity/aggregated" \
  --header "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --data-urlencode "customer_org_ids=org-acme" \
  --data-urlencode "start_date=2026-11-01" \
  --data-urlencode "end_date=2026-11-30"
```

您的計費系統會把該支出乘以您的加價並寄出發票。也請為依使用量計費的方案設定硬上限。如果代理程式迴圈停不下來，或金鑰外洩，成本可能迅速增加。硬上限會在有人讀到發票之前限制這筆成本。

## 使用案例 4：在上限處升級 {#use-case-4-upgrades-at-the-cap}

有些銷售或行銷內容代理程式提供 Starter 與 Pro 方案。當客戶達到 Starter 上限時，該客戶就是可能的 Pro 客戶。客戶管理會在那時給您兩個訊號。如果您在上限之下設定了 `soft_budget`，LiteLLM 會向您的預算 webhook 傳送 `soft_budget_crossed` 事件。請使用此事件，在 LiteLLM 封鎖客戶之前顯示升級提示。達到上限時，LiteLLM 會傳送 `budget_crossed` 事件，並以預算錯誤拒絕新請求。

<PlanUpgrade />

下一步取決於成員的 `cap_policy`。使用 `pause_until_reset` 時，成員需等到下一個預算期間，此政策適合免費方案。使用 `pause_allow_increase` 時，成員可以傳送預算提高請求；客戶升級或購買更多額度後，您可以在自己的審查流程中核准該請求。

Webhook 交付是盡力而為。因此，也請讀取使用量資料，確認您的記錄與 LiteLLM 一致。

## 使用案例 5：附較低成本備援的方案層級 {#use-case-5-plan-tiers-with-a-lower-cost-fallback}

研究或分析代理程式可以在較高層級才提供進階模型。前沿模型每次請求的成本最高，因此消耗您利潤的速度最快。當客戶的進階額度用完時，客戶仍可繼續工作。做法是為客戶的虛擬金鑰設定進階模型的依模型預算，並設定一個較低成本模型的備援。客戶接著會使用較低成本的模型，直到整體預算用完為止。組織、團隊與成員的上限仍然適用。

<ModelTiers />

依模型的金鑰預算與[預算備援](/docs/proxy/budget_fallbacks)僅適用於 LiteLLM Enterprise。

## 哪種控制適合哪種方案 {#which-control-fits-which-plan}

| 收費方式 | 範例使用案例 | 客戶管理控制 |
| --- | --- | --- |
| 預付額度 | 程式碼撰寫代理程式、應用程式建置工具 | 低於額度價值的成員上限 |
| 依座位 | 法律或財務助理 | 依座位類型的預算範本、組織上限 |
| 依使用量 | 支援代理程式平台 | 依組織的使用量彙總 API、作為安全限制的硬上限 |
| 分層方案 | 內容或銷售代理程式 | 用於升級提示的 `soft_budget` webhook、`cap_policy` 與提高請求 |
| 進階模型層級 | 研究或分析代理程式 | 附較低成本備援的依模型金鑰預算（Enterprise） |

您可以搭配使用這些控制。例如，附額度加值的依座位方案使用相同的標頭與相同的預算階層。附進階模型層級的使用量方案也是如此。

## 向客戶顯示他們自己的使用量 {#show-customers-their-own-usage}

您的後端會使用使用量與預算 API 進行計費。您也可以將相同的 API 用於產品中的使用量頁面。如此一來，客戶會在自己的額度與升級選項旁邊，看到與您收費相同的支出。請把管理員金鑰留在您的後端，只讓每位客戶存取自己組織的資料。

## 開始使用 {#get-started}

若要匯入客戶、傳送包含其身分的請求並讀取其使用量，請參閱[追蹤客戶支出操作指南](/docs/proxy/customer_management/track-customer-spend)。[API 參考](/docs/proxy/customer_management/api_reference)提供範本、覆寫、上限政策與 webhook 的詳細資訊。沒有 Enterprise 授權時，客戶管理是免費的，上限為 5 個客戶組織、每個組織 5 個團隊、每個團隊 5 位成員。

客戶 API 位於 `main`。我們尚未驗證已發布版本是否包含完整流程。部署前請檢查[可用性](/docs/proxy/customer_management/api_reference#availability)。

如果您正在為客戶建置代理程式，並希望獲得價格預算方面的協助，請[填寫表單](https://docs.google.com/forms/d/e/1FAIpQLSfqKoWifvdeFtN-CSMQr2aEIYfpoc7D9t8Fjxb_fAOKPJbVNg/viewform)，我們會在 24 小時內與您聯繫。
