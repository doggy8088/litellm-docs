# 金鑰式驗證如何運作 {#how-key-based-auth-works}

說明 proxy 如何解析虛擬金鑰可呼叫的內容。重點：當金鑰具有 `team_id` 時，`models` 欄位如何被評估；以及當沒有時如何處理，還有來自 `SpecialModelNames`、可改變模型比對方式的 sentinel 值。關於組織、團隊、使用者與金鑰之間的關係，請參閱 [存取權繼承](./access_management/inheritance.md)。設定請參閱 [虛擬金鑰](./virtual_keys.md) 與 [模型存取群組](./model_access_groups.md)。

## `models` 欄位 {#the-models-field}

每個虛擬金鑰資料列都會帶有一個 `models` 清單。項目分為四類：

| 項目 | 含義 |
|---|---|
| 具體模型群組 | 來自 `config.yaml` `model_name` 的名稱（`gpt-4`、`azure-gpt-3.5`） |
| 萬用字元 | 與 `model_name` 比對的提供者前綴樣式（`openai/*`、`openai/o1-*`） |
| 存取群組 | 在 `model_info.access_groups` 或 `/access_group/new` 下宣告的標籤；在請求時展開為帶有該標籤的模型集合 |
| Sentinel | `SpecialModelNames` 中保留的字串之一（如下） |

空清單與字面值 `*` 在該層級不施加任何模型限制。其他適用的檢查仍會限制請求。

## Sentinel {#sentinels}

這些字串在 `litellm.proxy._types.SpecialModelNames` 中保留作為 enum 值。它們會短路一般比對。

| 哨兵值 | 適用位置 | 效果 |
|---|---|---|
| `all-proxy-models` | 金鑰、團隊，或使用者 `models` 清單 | 在該層級不施加任何模型限制，與空清單相同。其他適用的檢查仍會套用。 |
| `all-team-models` | 金鑰 `models` 清單 | 延後至團隊的模型檢查。若金鑰沒有 `team_id`，則不施加金鑰層級的限制；擁有者的使用者模型限制仍會套用。 |
| `no-default-models` | 僅使用者 `models` 清單 | 在使用者路徑上直接拒絕；強制使用者透過團隊路由請求。透過 `default_internal_user_params.models` 設定，因此 SSO 註冊無法建立具有閘道層級存取權的獨立金鑰。 |

當金鑰附屬於團隊時，空的金鑰 `models` 清單與 `all-team-models` 都會讓團隊檢查決定存取權。兩者都不會略過每位成員的限制或其他適用的檢查。

## 解析：有 team_id 與沒有 {#resolution-with-team_id-vs-without}

獨立金鑰（沒有 `team_id`）必須通過自身的模型檢查；若與某位使用者關聯，還必須通過該擁有者的 `user.models` 檢查。若設定 `personal_key_model_access_from_teams: true`，它還必須符合透過該使用者至少一個團隊可取得的模型存取權；此設定預設為關閉。

附屬於團隊的金鑰必須通過金鑰與團隊的模型檢查，以及針對該金鑰 `user_id` 的任何非空的每位成員 `allowed_models` 限制。擁有者的全域 `user.models` 不會限制團隊請求。僅以直接模型清單來看，持有 `["{{openai_large}}"]` 的金鑰若隸屬於持有 `["azure-gpt-3.5"]` 的團隊，則兩個模型都無法呼叫。經授權的存取群組可以如下所述新增授權。

模型檢查未通過時，請求會被拒絕。請檢查 proxy 記錄，以找出是金鑰、團隊、使用者或成員資格的限制。團隊設定請參閱 [依 team_id 限制模型](./model_access.md#restrict-models-by-team_id)。

團隊上的 `all-proxy-models` 會移除團隊的模型限制，但金鑰與每位成員的檢查仍會套用。金鑰上的 `all-team-models` 會移除金鑰自身的模型限制，其他適用的檢查則維持不變。

## 存取群組與萬用字元 {#access-groups-and-wildcards}

設計存取群組的目的，是讓將模型加入某個群組後，即可授予所有附帶金鑰的存取權，而不必修改任何金鑰資料列。標籤會儲存在金鑰或團隊上；展開則在驗證檢查時，透過查找哪些部署在其 `model_info.access_groups` 中帶有該標籤來完成。萬用字元以相同方式解析，但比對的是 `model_name` 而非標籤，且它們本身也可以屬於存取群組，因此可切分出子族群（`openai/*` 位於 `default-models` 中，`openai/o1-*` 位於 `restricted-models` 中；只持有 `default-models` 的金鑰無法呼叫 `o1` 系列）。請參閱 [模型存取群組](./model_access_groups.md)。

透過 `access_group_ids` 指派的 [統一存取群組](./access_groups.md) 也可以授予模型。當群組透過 `assigned_key_ids` 或 `assigned_team_ids` 授權某把金鑰或其團隊時，附屬於該金鑰的群組可以授予團隊直接模型清單之外的存取權。每位成員的 `allowed_models` 限制仍會套用。

## 主金鑰會略過什麼 {#what-the-master-key-skips}

主金鑰會與設定的密鑰進行驗證，並解析為 proxy 管理員身分，不需要虛擬金鑰的模型允許清單。它是具有廣泛模型存取權的操作員憑證。一般的請求檢查仍會執行，包括適用的最終使用者限制與預算；管理員身分並不會停用所有請求檢查。請參閱 [主金鑰輪替](./master_key_rotations.md)。

## 相關 {#related}

[模型存取](./model_access.md) · [模型存取群組](./model_access_groups.md) · [虛擬金鑰](./virtual_keys.md) · [多租戶架構](./multi_tenant_architecture.md)
