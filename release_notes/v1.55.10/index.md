---
title: v1.55.10
slug: v1.55.10
date: 2024-12-24T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [batches, guardrails, team management, custom auth]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

# v1.55.10 {#v15510}

`batches`, `guardrails`, `team management`, `custom auth`

<Image img={require('../../img/batches_cost_tracking.png')} />

<br/>

:::info

在此取得 7 天免費 LiteLLM Enterprise 試用。 [從這裡開始](https://www.litellm.ai/enterprise#trial)

**無需來電**

:::

## ✨ Batches API 的成本追蹤、記錄 (`/batches`) {#-cost-tracking-logging-for-batches-api-batches}

追蹤 Batch Creation Jobs 的成本、用量。 [從這裡開始](https://docs.litellm.ai/docs/batches)

## ✨ `/guardrails/list` 端點  {#-guardrailslist-endpoint}

向使用者顯示可用的防護欄。 [從這裡開始](https://litellm-api.up.railway.app/#/Guardrails)

## ✨ 允許團隊新增模型 {#-allow-teams-to-add-models}

這可讓團隊管理員透過 litellm proxy 呼叫自己的微調模型。 [從這裡開始](https://docs.litellm.ai/docs/proxy/team_model_add)

## ✨ 自訂驗證的 common_checks 檢查 {#-common-checks-for-custom-auth}

在自訂驗證中呼叫內部 common_checks 函式現在已強制作為企業功能。這可讓管理員在其自訂驗證實作中使用 litellm 的預設預算／驗證檢查。 [從這裡開始](https://docs.litellm.ai/docs/proxy/virtual_keys#custom-auth)

## ✨ 指派團隊管理員 {#-assigning-team-admins}

團隊管理員已從 beta 版畢業並移至我們的企業方案。這可讓 proxy 管理員允許其他人管理自己團隊的金鑰／模型（適用於正式環境中的專案）。 [從這裡開始](https://docs.litellm.ai/docs/proxy/virtual_keys#restricting-key-generation)
