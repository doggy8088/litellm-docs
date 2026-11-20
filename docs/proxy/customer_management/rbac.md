---
title: 客戶管理 RBAC
sidebar_label: RBAC
description: 讓使用者、團隊與組織能以唯讀方式存取客戶管理中的特定應用程式，同時 proxy 管理員保有完整控制權。
---

# 客戶管理 RBAC {#customer-management-rbac}

<SinceVersion v="1.112.0" />

proxy 管理員可以在客戶管理中查看並管理所有內容。其他人在 proxy 管理員授予他們[應用程式](./applications.md)之前，在其中什麼也看不到。授予可提供對該應用程式、其客戶組織與成員及其使用量的唯讀存取權。應用程式擁有者可以看到自己的應用程式，proxy 管理員則可以看到全部。

授予沿用已控制 MCP 伺服器、代理程式與向量儲存存取權的物件權限。應用程式授予是該記錄上的另一個清單 `object_permission.apps`，其中存放應用程式 id。沒有需要另外學習的授予資料表或授予 API，任何已在管理使用者、團隊或組織的工具（例如 Terraform 或 SSO 團隊同步）也都可以管理這些授予。

## 誰可以看到什麼 {#who-can-see-what}

| 呼叫者 | UI 中的客戶管理 | 讀取 | 寫入 |
|---|---|---|---|
| proxy 管理員 | 所有頁面 | 每個應用程式與客戶 | 全部 |
| 至少獲得一項應用程式授予的使用者 | 應用程式頁面，唯讀 | 僅限已授予的應用程式 | 無 |
| 沒有獲得應用程式授予的使用者 | 隱藏 | 無 | 無 |

proxy 管理員檢視者在這裡會被視為與其他使用者相同，需要授予才能讀取應用程式。

使用者的應用程式來自三個來源的聯集：使用者本身的授予、使用者所屬每個團隊的授予，以及使用者為成員的每個組織的授予。團隊或組織上的授予會涵蓋每位成員，因此只要在您的身分提供者中將某人加入團隊，就足以讓他們取得該團隊的應用程式。

## 授予應用程式 {#grant-an-application}

先以 `GET /management/v1/apps` 找出應用程式的 id，再將其放入團隊、使用者或組織上的 `object_permission.apps`。只有 proxy 管理員可以新增、變更或移除這些 id。

在 Admin UI 中，proxy 管理員開啟客戶管理，前往內部存取，挑選團隊、使用者或組織，再選取其可檢視的應用程式。相同的授予也可透過 API 取得。若要授予團隊，請更新該團隊。

```bash
curl -X POST "$LITELLM_BASE_URL/team/update" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "'"$TEAM_ID"'", "object_permission": {"apps": ["'"$APP_ID"'"]}}'
```

若要授予一位使用者，請更新該使用者。

```bash
curl -X POST "$LITELLM_BASE_URL/user/update" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "'"$USER_ID"'", "object_permission": {"apps": ["'"$APP_ID"'"]}}'
```

若要授予某個組織的每位成員，請更新該組織。

```bash
curl -X PATCH "$LITELLM_BASE_URL/organization/update" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "'"$ORGANIZATION_ID"'", "object_permission": {"apps": ["'"$APP_ID"'"]}}'
```

您傳送的清單會取代已儲存的清單，因此請傳送該團隊、使用者或組織應保留的每個應用程式。`object_permission` 中您未填入的其他欄位不會變更。若要撤銷存取權，請傳送不含該應用程式 id 的清單，或傳送空清單以全部移除。

## 被授予者可以做什麼 {#what-a-grantee-can-do}

被授予者登入 Admin UI 後，可在檢視切換器中找到客戶管理。開啟後會顯示應用程式頁面，其中只會列出他們的應用程式及其支出與預算，且沒有編輯控制項。

相同的範圍也適用於 API。`GET /management/v1/apps` 只會回傳已授予的應用程式，而 `GET /management/v1/apps/{app_id}` 對任何其他 id 會回傳 `403`。客戶組織與成員會按應用程式讀取，透過 `GET /management/v1/apps/{app_id}/customer_organizations/{customer_org_id}` 與 `GET /management/v1/apps/{app_id}/customer_members/{customer_member_id}`。若某位客戶成員從未接受該應用程式服務，會回傳 `404`，與不存在的 id 相同，因此被授予者無法得知其他應用程式的客戶。

使用量路由需要已授予的 `app_id`。被授予者若未提供它或指定了其他應用程式，會收到 `403`。

```bash
curl "$LITELLM_BASE_URL/management/v1/customer_organizations/daily/activity?app_id=$APP_ID&start_date=2026-11-01&end_date=2026-11-30" \
  -H "Authorization: Bearer $GRANTEE_KEY"
```

所有寫入操作仍屬於 proxy 管理員。被授予者若嘗試建立或變更應用程式、預算、客戶組織或客戶成員，或列出可成為應用程式的資源，會收到 `403`。他們可以讀取應用程式屬於哪種資源，但無法變更它。

## 誰可以變更授予 {#who-can-change-grants}

只有 proxy 管理員可以變更 `object_permission.apps`。在其他人獲准編輯物件權限的任何地方，若請求原封不動地將已儲存的應用程式清單傳回，即會被接受，因此現有的表單與指令碼可以繼續運作。他們若傳送新增或移除應用程式 id 的請求，或清除含有應用程式授予的物件權限，會收到 `403`。

```json
{
  "error": "Only a proxy admin can change access to customer management apps."
}
```

虛擬金鑰不攜帶應用程式授予。`/key/generate` 與 `/key/update` 會拒絕 `apps` 清單，因為存取權是跟著擁有該金鑰的使用者、其團隊與其組織走的。

## 閘道的存取權 {#access-to-the-gateway}

授予只會增加客戶管理的存取權，不會拿走任何東西。被授予者在 Gateway 中仍保有其角色原本允許的一切，無論是在 UI 或 API 中。擁有授予的 `internal_user` 仍可像以前一樣建立自己的金鑰並呼叫模型。若要讓應用程式擁有者無法進入 Gateway，請給予他們在該處權限較小的角色，例如 `internal_user_viewer`，再透過團隊授予應用程式。
