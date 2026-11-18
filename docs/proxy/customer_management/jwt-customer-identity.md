---
title: 來自 JWT 聲明的客戶身分
sidebar_label: 來自 JWT 聲明的身分
description: 將已簽署的 JWT 聲明對應到客戶組織、客戶成員與客戶團隊，讓支出無需客戶標頭即可歸屬。
---

# 來自 JWT 聲明的客戶身分 {#customer-identity-from-jwt-claims}

若要在沒有客戶標頭的情況下追蹤客戶支出，請將客戶身分包含在您已簽署的 JWT 中。啟用 [JWT 驗證](../token_auth.md) 後，在 `general_settings.litellm_jwtauth` 下設定聲明路徑。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    customer_org_alias_jwt_field: "customer.org_alias"
    customer_member_id_jwt_field: "customer.member_id"
    customer_team_id_jwt_field: "customer.team_id"
```

您的身分提供者可以發行帶有這些聲明的 token：

```json
{
  "customer": {
    "org_alias": "example-org",
    "member_id": "member-123",
    "team_id": "example-org:default"
  }
}
```

以 `Authorization: Bearer <JWT>` 傳送 token。LiteLLM 會先驗證 token，再讀取客戶身分。一旦對應了任何客戶聲明，JWT 請求的客戶身分就只取自 token，並忽略 `x-litellm-customer-org-alias`、`x-litellm-customer-member-id` 與 `x-litellm-customer-team-id` 標頭，因此呼叫者無法指定另一個客戶。沒有這些聲明的 token 會在沒有客戶追蹤的情況下執行。不使用 JWT 的請求仍會讀取標頭。

組織 alias 與成員 ID 使用與標頭相同的查詢、自動註冊、預算與支出追蹤。新成員會加入組織的 `default` 團隊。選擇性的客戶團隊聲明會選取該成員的其中一個團隊，而不是一般的 LiteLLM 團隊，且無法新增團隊成員資格。省略它即可使用成員的預設團隊。

若有多個身分提供者，請在 `litellm_jwtauth.issuers` 的每個項目上設定相同的欄位。當發行者的聲明提供了值時，發行者專屬的對應會覆寫全域對應。這些客戶對應與 `org_id_jwt_field`、`team_id_jwt_field` 及舊版的 `end_user_id_jwt_field` 各自獨立。
