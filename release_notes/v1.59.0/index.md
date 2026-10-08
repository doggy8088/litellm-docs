---
title: v1.59.0
slug: v1.59.0
date: 2025-01-17T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [admin ui, logging, db schema]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

# v1.59.0 {#v1590}

:::info

在此取得 LiteLLM Enterprise 7 天免費試用 [here](https://litellm.ai/#trial)。

**無需通話**

:::

## UI 改進 {#ui-improvements}

### [Opt In] Admin UI - 檢視訊息 / 回應  {#opt-in-admin-ui---view-messages--responses}

您現在可以在 Admin UI 上檢視訊息和回應記錄。

<Image img={require('../../img/release_notes/ui_logs.png')} />

如何啟用 - 將 `store_prompts_in_spend_logs: true` 加到您的 `proxy_config.yaml`

啟用此旗標後，您的 `messages` 和 `responses` 將會儲存在 `LiteLLM_Spend_Logs` 資料表中。

```yaml
general_settings:
  store_prompts_in_spend_logs: true
```

## DB 結構變更 {#db-schema-change}

已將 `messages` 和 `responses` 新增至 `LiteLLM_Spend_Logs` 資料表。

**預設情況下不會記錄。** 如果您希望記錄 `messages` 和 `responses`，您需要透過此設定選擇加入

```yaml
general_settings:
  store_prompts_in_spend_logs: true
```
