---
title: 管理為客戶提供服務的應用程式
sidebar_label: 應用程式
description: 查看每個代表客戶呼叫 LiteLLM 的應用程式，控制哪些應用程式可以建立新客戶，並為應用程式設定專屬附加費用。
---

# 管理為客戶提供服務的應用程式 {#manage-applications-that-serve-customers}

<SinceVersion v="1.112.0" />

應用程式是您的其中一項產品，它代表客戶呼叫 LiteLLM，例如聊天助理或搜尋功能。LiteLLM 不會另外新增需要您維護的應用程式記錄。一項 Gateway 設定決定了應用程式的定義：團隊、專案或虛擬金鑰；該種類的每個既有資源都會成為應用程式。請求屬於它驗證時所用團隊、專案或金鑰對應的應用程式。

應用程式位於客戶階層之上。請求會在 [標頭](./track-customer-spend.md) 中指定客戶組織與成員，LiteLLM 則從金鑰取得應用程式。支出會按應用程式追蹤，也會按其中的每個客戶追蹤。

## 查看每個應用程式 {#see-every-application}

在 Admin UI 側邊欄的客戶管理區段中開啟「應用程式」。在您選擇應用程式的定義之前，該頁面只會顯示這項設定。選擇之後，頁面會列出該種類的每個資源，包含支出與預算、客戶附加費用、是否可以建立新客戶，以及是否已設定。選取應用程式即可變更其設定。

若要以 API 選擇應用程式的定義，請傳送該定義。一旦有應用程式完成設定，此選擇即會鎖定。

```bash
curl -X PUT "$LITELLM_BASE_URL/management/v1/apps/definition" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"resource_type": "team"}'
```

`resource_type` 為 `team`、`project` 或 `virtual_key`。`GET /management/v1/apps/resources?resource_type=team` 會列出該種類的資源，`GET /management/v1/apps` 則列出已設定的資源。

## 控制哪些應用程式可以建立新客戶 {#control-which-applications-create-new-customers}

預設情況下，第一個指定 LiteLLM 尚未見過的客戶組織或成員的請求，就會建立該客戶。這適合會自行引導租戶上線的產品；但若只有您的其中一個應用程式應該能這麼做，這樣的預設就太過寬鬆。

每個應用程式都有一個開關「此應用程式可以建立新客戶」。關閉時，該應用程式指定未知客戶組織或成員的請求會以 `403` 遭到拒絕，且不會建立任何項目。已存在的客戶仍可透過該應用程式繼續運作，無論是由哪個應用程式或匯入建立。

```bash
curl -X PATCH "$LITELLM_BASE_URL/management/v1/apps/$APP_ID" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"auto_create_customers": false}'
```

遭到拒絕的請求會指出攜帶未知客戶的標頭。

```json
{
  "error": {
    "message": "Unknown customer in x-litellm-customer-org-alias. App search may not create customers.",
    "type": "auth_error",
    "param": "x-litellm-customer-org-alias",
    "code": "403"
  }
}
```

金鑰不屬於任何應用程式的請求，遵循 Gateway 開關「沒有應用程式的請求可以建立新客戶」，該開關顯示在應用程式設定下方。預設為開啟，因此可正常運作的金鑰會像以前一樣繼續建立客戶。將它關閉，即可拒絕來自應用程式之外所有金鑰的未知客戶。

```bash
curl -X PUT "$LITELLM_BASE_URL/management/v1/apps/definition" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"resource_type": "team", "auto_create_customers_without_app": false}'
```

| 請求 | 開關 | 未知客戶 | 已知客戶 |
|---|---|---|---|
| 來自應用程式 | 應用程式開關開啟（預設） | 已建立，`200` | `200` |
| 來自應用程式 | 應用程式開關關閉 | `403`，未建立任何項目 | `200` |
| 不來自應用程式 | Gateway 開關開啟（預設） | 已建立，`200` | `200` |
| 不來自應用程式 | Gateway 開關關閉 | `403`，未建立任何項目 | `200` |

沒有客戶標頭的請求不受任一開關影響。開關關閉時，請求若同時傳送不存在的組織 alias 與存在的成員，也會遭到拒絕，因此不會計入該成員既有組織的帳上。

## 為應用程式設定專屬附加費用 {#give-an-application-its-own-surcharge}

[客戶附加費用](./customer-surcharge.md) 會在每個為客戶發出的請求上加收一個百分比。應用程式可以有自己的百分比，取代該應用程式為客戶發出請求時適用的全閘道百分比。請在應用程式設定中以「客戶請求附加費用 (%)」設定，或以 API 用小數設定。

```bash
curl -X PATCH "$LITELLM_BASE_URL/management/v1/apps/$APP_ID" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"customer_margin": 0.05}'
```

`customer_margin` 為 0 至 10 之間的小數，因此 `0.05` 即為 5%。傳送 `null` 即可恢復使用全閘道附加費用。

| 應用程式附加費用 | Gateway 附加費用 | 為客戶發出的請求是否加收附加費用 |
|---|---|---|
| 5% | 2% | 5% |
| 0% | 2% | 不加收附加費用 |
| 未設定 | 2% | 2% |
| 5% | 未設定 | 5% |

沒有客戶的請求絕不會加收附加費用，即使來自設有附加費用的應用程式。支出、預算，以及基本費用與附加費用的明細，其運作方式與全閘道附加費用相同。
