---
title: v1.65.0 - Team Model Add - 更新
slug: v1.65.0
date: 2025-03-28T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
tags: [management endpoints, team models, ui]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

v1.65.0 更新 `/model/new` 端點，以防止非團隊管理員建立團隊模型。

這表示只有 proxy 管理員或團隊管理員可以建立團隊模型。

## 其他變更 {#additional-changes}

- 允許團隊管理員呼叫 `/model/update` 來更新團隊模型。
- 允許團隊管理員呼叫 `/model/delete` 來刪除團隊模型。
- 在 `/v2/model/info` 中新增 `user_models_only` 參數 - 僅回傳此使用者新增的模型。

這些變更讓團隊管理員能在 LiteLLM UI + API 中為其團隊新增並管理模型。

<Image img={require('../../img/release_notes/team_model_add.png')} />
