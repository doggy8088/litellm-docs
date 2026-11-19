---
title: 來自 JWT 聲明的客戶身分
sidebar_label: 來自 JWT 聲明的身分
description: 使用已簽署的 JWT 聲明追蹤客戶支出，或以 JWT 識別應用程式，並在請求標頭中傳遞客戶身分。
---

# 來自 JWT 聲明的客戶身分 {#customer-identity-from-jwt-claims}

請先 [啟用 JWT 驗證](../token_auth.md)，再選擇 LiteLLM 從何處讀取客戶身分。您可以將客戶組織與成員放入已簽署的聲明中，或以 JWT 識別應用程式，並在請求標頭中傳送客戶身分。

## 在 JWT 聲明中傳送客戶身分 {#send-customer-identity-in-jwt-claims}

若要在沒有客戶標頭的情況下追蹤客戶支出，請將客戶身分包含在您已簽署的 JWT 中。在 `general_settings.litellm_jwtauth` 下設定聲明路徑。

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

以 `Authorization: Bearer <JWT>` 傳送 token。LiteLLM 會先驗證 token，再讀取客戶身分。一旦對應了任何客戶聲明，JWT 請求的客戶身分就只取自 token，並忽略客戶標頭，包括自訂標頭名稱。缺少的客戶聲明不會退回使用標頭。不使用 JWT 的請求仍會讀取標頭。

組織 alias 與成員 ID 使用與標頭相同的查詢、自動註冊、預算與支出追蹤。新成員會加入組織的 `default` 團隊。選擇性的客戶團隊聲明會選取該成員的其中一個團隊，而不是一般的 LiteLLM 團隊，且無法新增團隊成員資格。省略它即可使用成員的預設團隊。

若有多個身分提供者，請在 `litellm_jwtauth.issuers` 的每個項目上設定相同的欄位。當發行者的聲明提供了值時，發行者專屬的對應會覆寫全域對應。這些客戶對應與 `org_id_jwt_field`、`team_id_jwt_field` 及舊版的 `end_user_id_jwt_field` 各自獨立。

## 以 JWT 傳送應用程式，以標頭傳送客戶 {#app-jwt-customer-headers}

將 JWT 的 `client_id` 對應到代表該應用程式的 LiteLLM 團隊。`client_id` 的值必須與 LiteLLM 團隊 ID 相符。請讓三項 `customer_*_jwt_field` 設定保持未設定，無論是全域設定或發行者設定皆然，如此 LiteLLM 才會從標頭讀取客戶。

預設請使用 `x-litellm-customer-org-alias` 與 `x-litellm-customer-member-id`。如果您的呼叫者已傳送 `X-Tenant-ID` 與 `X-User-ID`，請改為設定 LiteLLM 讀取這些名稱：

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    team_id_jwt_field: client_id
  customer_org_alias_header: X-Tenant-ID
  customer_member_id_header: X-User-ID
```

設定的名稱會取代對應的預設值。租戶標頭攜帶客戶組織的 **alias**，使用者標頭攜帶客戶成員的 **ID**。請在同一個請求中，將兩個標頭與 JWT 一起傳送。請將 `example-model` 換成該應用程式團隊可用的模型。

```bash
curl https://your-proxy.example.com/v1/chat/completions \
  -H "Authorization: Bearer ${LITELLM_JWT}" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: example-org" \
  -H "X-User-ID: member-123" \
  -d '{"model":"example-model","messages":[{"role":"user","content":"Hello"}]}'
```

LiteLLM 會將應用程式的團隊，以及客戶組織與成員，記錄在同一筆支出記錄中。

:::warning
客戶標頭未經 JWT 簽署。僅在呼叫者可信，或入口會剝離傳入的身分標頭並依據已驗證的身分重新設定時，才使用它們。如果不受信任的用戶端可以直接連到 proxy，請使用已簽署的客戶聲明。
:::
