---
slug: customer-management
title: "介紹 LiteLLM 客戶管理"
date: 2026-11-13T09:00:00
authors:
  - ishaan
  - moe
  - kerry
  - tin
description: "使用 LiteLLM AI Gateway 追蹤客戶支出並設定組織、團隊與成員預算。使用這些 API，將這些控制建置到您的產品中。"
tags: [ai-gateway, spend-tracking, customer-portal]
hide_table_of_contents: true
image: ./hero-flow-charge-budget.png
custom_hero: true
draft: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CustomerPortalHero from './CustomerPortalHero';
import {CostComplexity, CustomerHierarchyBreakdown, CustomerEntityBudgets, CustomerMargin, CustomerBudgetAlert, CustomerBudgetFallback} from './CustomerHierarchy';
import {PostByline} from '@theme/BlogPostPage';
import styles from './customer-portal-hero.module.css';

<CustomerPortalHero />

<PostByline horizontal className={styles.byline} />

<aside className={styles.setupCta} aria-label="與 LiteLLM 合作" data-customer-portal-cta>
  <div>
    <p>如果您正在為您的客戶建置 AI 代理程式，我們會協助您設定客戶管理，以追蹤他們的支出並設定預算。</p>
    <p className={styles.setupCtaFollowup}>填寫表單，我們會在 24 小時內與您聯繫。</p>
  </div>
  <a className={`button ${styles.setupCtaButton}`} href="https://docs.google.com/forms/d/e/1FAIpQLSfqKoWifvdeFtN-CSMQr2aEIYfpoc7D9t8Fjxb_fAOKPJbVNg/viewform">與我們合作</a>
</aside>

今天我們為使用此閘道的 AI 原生公司推出 **LiteLLM 客戶管理（LiteLLM Customer Management）**。如果您正在 LiteLLM 上建置代理程式，並需要依客戶的組織、團隊與個別成員追蹤支出並設定預算上限，這正是為您而設。

{/* truncate */}

## 這適合哪些人？ {#who-is-this-for}

適合正在使用 LiteLLM AI Gateway 建置生產環境代理程式的 AI 原生公司，他們需要以正 ROI 獲利地運行其代理程式。

## 問題所在 {#the-problem}

對於 B2B AI 代理程式而言，跨客戶組織、團隊與個別成員的成本追蹤會變得複雜。如果您銷售隨用隨付的額度或依使用量計費的方案，實際支出可能超過客戶支付的金額，並損害您的利潤。

<CustomerMargin stage="uncontrolled" />

不同的模型、提供者與請求參數使這種複雜性倍增。

<CostComplexity />

依客戶組織、團隊與成員追蹤該支出：

<CustomerHierarchyBreakdown />

那是一大堆需要圍繞您的代理程式建置的黏合程式碼。由於 LiteLLM 已經是您模型成本的事實來源，我們正在公開 API，讓您追蹤客戶支出、設定預算，並將這些控制建置到您的產品中。

## 如何使用 LiteLLM AI Gateway 解決這個問題 {#how-to-use-litellm-ai-gateway-for-this-problem}

將您的代理程式指向 LiteLLM AI Gateway，並傳送您客戶的組織別名與成員 ID：

<Tabs groupId="customer-portal-sdk">
<TabItem value="openai" label="OpenAI Responses" default>

```python
import os

from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LITELLM_API_KEY"],
    base_url=f"{os.environ['LITELLM_BASE_URL'].rstrip('/')}/v1",
)
raw_response = client.responses.with_raw_response.create(
    model=os.environ["LITELLM_MODEL"],
    input="Write a short welcome message.",
    max_output_tokens=128,
    extra_headers={
        # highlight-start
        "x-litellm-customer-org-alias": "Acme",
        "x-litellm-customer-member-id": "acme-alice",
        # highlight-end
    },
)
response = raw_response.parse()
print(response.output_text)
print("LiteLLM call ID:", raw_response.headers.get("x-litellm-call-id"))
```

使用 `pip install openai` 安裝。

</TabItem>
<TabItem value="deepagents" label="LangChain Deep Agents">

```python
import os

from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model=os.environ["LITELLM_MODEL"],
    base_url=f"{os.environ['LITELLM_BASE_URL'].rstrip('/')}/v1",
    api_key=os.environ["LITELLM_API_KEY"],
    use_responses_api=True,
    default_headers={
        # highlight-start
        "x-litellm-customer-org-alias": "Acme",
        "x-litellm-customer-member-id": "acme-alice",
        # highlight-end
    },
)
agent = create_deep_agent(model=model)
result = agent.invoke({"messages": [{"role": "user", "content": "Say hello to Alice."}]})
print(result["messages"][-1].text)
```

使用 `pip install deepagents langchain-openai` 安裝。為已驗證的客戶設定模型；將相同的身分傳遞給代理程式呼叫的任何其他模型。

</TabItem>
</Tabs>

歸屬該呼叫只需要這些。LiteLLM 會解析成員的客戶團隊與組織，並記錄支出。相同的標頭適用於 Responses、Chat Completions 與 Anthropic Messages。

使用您的應用程式金鑰與閘道模型別名。`LITELLM_BASE_URL` 是閘道根 URL；[先註冊客戶](/docs/proxy/customer_management/track-customer-spend#2-import-a-customer)，並從您已驗證的工作階段中選擇他們的身分。

<figure data-full-width className={`${styles.productShot} ${styles.requestShot}`}>
  <a className={styles.screenshotLink} href="/img/customer_portal/launch-spend-log-dark.webp" target="_blank" rel="noopener noreferrer" aria-label="以完整解析度開啟請求客戶歸屬截圖">
    <img src="/img/customer_portal/launch-spend-log-dark.webp" width="2481" height="1533" alt="一個已保存請求的 Customer 區段顯示其客戶組織、團隊與成員，以及 Metrics 中的 $0.14 成本與 120 個 token。" loading="lazy" />
  </a>
  <figcaption>跟隨一個請求進入支出記錄，查看其客戶組織、團隊、成員與成本。示範資料。<a href="/img/customer_portal/launch-spend-log-dark.webp" target="_blank" rel="noopener noreferrer">檢視完整尺寸。</a></figcaption>
</figure>

### 設定能保護您利潤的客戶預算 {#set-customer-budgets-that-protect-your-margin}

如果一位成員購買了 $100 的額度，請為實際支出設定 $60 的預算，以保護您的利潤。為客戶組織、每個團隊與每位成員設定個別的預算：

<CustomerEntityBudgets />

同一請求的成本會從成員向上彙總到他們的團隊與組織。在這裡，成員達到其 $60 上限，而兩個上層都還有空間，因此後續請求暫停。

在您導入客戶時，選擇組織上限與預設成員設定檔。這些範例使用 30 天的預算期間：

<Tabs groupId="customer-portal-budget-setup">
<TabItem value="api" label="API" default>

```bash
curl --fail-with-body --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_organizations" \
  --header "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "customer_org_id": "org-acme",
    "alias": "Acme",
    "budget": {
      "max_budget": 1000,
      "budget_duration": "30d"
    },
    "default_budgets": [{
      "name": "default-user",
      "max_budget": 60,
      "soft_budget": 48,
      "budget_duration": "30d"
    }],
    "default_budget_template": "default-user"
  }'
```

將伺服器端的 proxy 管理員憑證用作 `LITELLM_ADMIN_KEY`。[加入客戶的團隊與成員](/docs/proxy/customer_management/track-customer-spend#2-import-a-customer)；新成員會繼承預設設定檔。

</TabItem>
<TabItem value="ui" label="LiteLLM UI">

開啟 **Customer Management → Customers → 您的客戶 → Settings**。使用 **Set budget** 或 **Edit budget** 來設定 **Spend limit (USD)** 與 **Reset period**。為成員選擇 **Budget template** 作為其預設額度。

</TabItem>
</Tabs>

<figure data-full-width className={`${styles.productShot}`}>
  <a className={styles.screenshotLink} href="/img/customer_portal/launch-member-caps-dark.webp" target="_blank" rel="noopener noreferrer" aria-label="以完整解析度開啟客戶成員預算截圖">
    <img src="/img/customer_portal/launch-member-caps-dark.webp" width="4008" height="789" alt="最新 LiteLLM UI 中的客戶成員支出，包含每月與每年的預算窗口、客戶支出占比、token 與狀態。" loading="lazy" />
  </a>
  <figcaption>最新 LiteLLM UI 中的客戶成員支出與預算窗口。種子示範資料。<a href="/img/customer_portal/launch-member-caps-dark.webp" target="_blank" rel="noopener noreferrer">檢視完整尺寸。</a></figcaption>
</figure>

達到上限時，LiteLLM 會根據已記錄的支出拒絕新請求。請為核算延遲與已在處理中的請求預留空間。

### 為預設使用者與進階使用者提供不同的設定檔 {#give-default-users-and-power-users-different-profiles}

有些客戶需要更多額度。建立一個進階使用者設定檔，然後在建立新成員時指派其回傳的 `budget_id`。在您的產品中使用相同的 API，讓您客戶的管理員可以管理這些設定檔。

```bash
curl --fail-with-body --request POST \
  "$LITELLM_BASE_URL/management/v1/customer_organizations/org-acme/default_budgets" \
  --header "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "power-user",
    "max_budget": 90,
    "soft_budget": 72,
    "budget_duration": "30d"
  }'
```

### 在客戶達到上限時觸發 webhook {#trigger-a-webhook-when-a-customer-hits-their-limit}

<CustomerBudgetAlert />

當成員達到其 $60 上限時，使用預算 webhook 通知您的團隊或開啟一個核准請求。您的接收端會從 LiteLLM 的 JSON 事件格式化通知。[設定並測試交付](/docs/proxy/customer_management/track-customer-spend#1-set-up-budget-webhooks)；由於交付是盡力而為，請以使用量讀取來核對遺漏的警示。

### 在客戶升級時核准臨時提高額度 {#approve-a-temporary-increase-when-your-customer-upgrades}

當客戶再購買 $50 的額度時，他們的總額變成 $150。核准後，如上所示，對實際支出套用臨時 $90 的上限。

將 `INCREASE_EXPIRES_AT` 設定為帶有時區的未來時間戳，然後套用臨時成員覆寫：

```bash
curl --fail-with-body --request PATCH \
  "$LITELLM_BASE_URL/management/v1/customer_members/acme-alice" \
  --header "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"budget_override\": {\"max_budget\": 90},
    \"budget_override_expires_at\": \"$INCREASE_EXPIRES_AT\"
  }"
```

您的產品管理額度購買與餘額。LiteLLM 套用支出額度直到它到期；組織與團隊上限仍然適用。如果您的工作流程需要審查佇列，請使用[核准 API](/docs/proxy/customer_management/api_reference#budget-increase-requests)。

### 將使用量與預算控制放入您自己的產品 {#put-the-usage-and-budget-controls-in-your-own-product}

將使用量放在客戶的額度與儲值選項旁邊。我們的 API 讓您的後端取得實際支出與預算設定，讓客戶看到與您用於分攤計費相同的成本：

<figure data-full-width className={`${styles.productShot} ${styles.usageShot}`}>
  <a className={styles.screenshotLink} href="/img/customer_portal/launch-usage-overview-dark.webp" target="_blank" rel="noopener noreferrer" aria-label="以完整解析度開啟客戶組織使用量截圖">
    <img src="/img/customer_portal/launch-usage-overview-dark.webp" width="4008" height="2262" alt="深色 LiteLLM UI 中的客戶組織使用量，包含支出與 token 總計，以及三個模型的每日趨勢。" loading="lazy" />
  </a>
  <figcaption>三個模型的示範使用量，包含 13 天的活動。追蹤客戶的總額，並檢查其背後的模型成本。<a href="/img/customer_portal/launch-usage-overview-dark.webp" target="_blank" rel="noopener noreferrer">檢視完整尺寸。</a></figcaption>
</figure>

取得日期範圍內的完整組織總計：

```bash
curl --fail-with-body --silent --show-error --get \
  "$LITELLM_BASE_URL/management/v1/customer_organizations/daily/activity/aggregated" \
  --header "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  --data-urlencode "customer_org_ids=org-acme" \
  --data-urlencode "start_date=2026-11-01" \
  --data-urlencode "end_date=2026-11-30"
```

讀取 `metadata.total_spend`、`total_tokens` 與 `total_api_requests`。從組織、團隊與成員記錄取得上限；將管理員憑證保存在您的後端，並授權每位客戶的存取。您的計費系統會套用您的價格並收取款項。

### 以較低成本的模型持續處理請求 {#keep-serving-requests-with-a-lower-cost-model}

為客戶的專用虛擬金鑰提供 Opus 額度，然後設定一個較低成本的備援，以便在該模型額度用完時使用。客戶可以在其整體預算仍有空間時繼續使用您的代理程式。

<CustomerBudgetFallback />

在金鑰上以您設定的模型別名設定 `model_max_budget` 與 `budget_fallbacks`。這些[依模型的金鑰預算](/docs/proxy/users#-virtual-key-model-specific)需要 Enterprise。共享金鑰會在呼叫者之間共用其模型預算；客戶組織、團隊與成員的硬上限在耗盡時仍會停止請求。API 設定請見 [Budget Fallbacks](/docs/proxy/budget_fallbacks)。

## OSS 與 Enterprise {#oss-and-enterprise}

| 客戶管理 | LiteLLM OSS | LiteLLM Enterprise |
| --- | --- | --- |
| 客戶組織 | 最多 5 | 超過 5 |
| 每個組織的客戶團隊 | 最多 5 | 超過 5 |
| 每個團隊的客戶成員 | 最多 5 | 超過 5 |

從[快速入門](/docs/proxy/customers)與 [API 參考](/docs/proxy/customer_management/api_reference)開始。對於更大的客戶階層，[與我們洽談 Enterprise](https://www.litellm.ai/enterprise)。

<SinceVersion v="1.111.0" />
