---
title: v1.57.7
slug: v1.57.7
date: 2025-01-10T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [langfuse, management endpoints, ui, prometheus, secret management]
hide_table_of_contents: false
---

`langfuse`, `management endpoints`, `ui`, `prometheus`, `secret management`

## Langfuse 提示管理 {#langfuse-prompt-management}

Langfuse Prompt Management 現已標示為 BETA。這讓我們能夠根據收到的回饋快速迭代，並讓使用者更清楚了解狀態。我們預期此功能將於下個月（2025 年 2 月）達到穩定版。

變更：
- 在 LLM API 請求中包含用戶端訊息。（先前只會傳送提示範本，而用戶端訊息會被忽略）。
- 將提示範本記錄在已記錄的請求中（例如：到 s3/langfuse）。
- 將 'prompt_id' 和 'prompt_variables' 記錄在已記錄的請求中（例如：到 s3/langfuse）。

[從這裡開始](https://docs.litellm.ai/docs/proxy/prompt_management)

## 團隊/組織管理 + UI 改進 {#teamorganization-management--ui-improvements}

現在在 UI 上管理團隊和組織更容易了。

變更：
- 支援在 UI 上編輯團隊內的使用者角色。
- 支援透過 api 將團隊成員角色更新為 admin - `/team/member_update`
- 顯示團隊管理員其團隊的所有金鑰。
- 新增有預算的組織
- 在 UI 上將團隊指派給組織
- 自動將 SSO 使用者指派到團隊

[從這裡開始](https://docs.litellm.ai/docs/proxy/self_serve)

## Hashicorp Vault 支援 {#hashicorp-vault-support}

我們現在支援將 LiteLLM Virtual API 金鑰寫入 Hashicorp Vault。

[從這裡開始](https://docs.litellm.ai/docs/proxy/vault)

## 自訂 Prometheus 指標 {#custom-prometheus-metrics}

定義自訂 prometheus 指標，並追蹤其使用量/延遲/請求數量

這可讓追蹤更細緻——例如：依據請求中 metadata 傳入的提示範本

[從這裡開始](https://docs.litellm.ai/docs/proxy/prometheus#beta-custom-metrics)
