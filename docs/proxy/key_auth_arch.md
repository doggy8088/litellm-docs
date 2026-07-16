# 金鑰式驗證如何運作 {#how-key-based-auth-works}

說明 proxy 如何解析虛擬金鑰可呼叫的內容。重點：當金鑰具有 `team_id` 時，`models` 欄位如何被評估；以及當沒有時如何處理，還有來自 `SpecialModelNames`、可覆寫一般解析的 sentinel 值。設定請參閱 [虛擬金鑰](./virtual_keys.md) 與 [模型存取群組](./model_access_groups.md)。

## `models` 欄位 {#the-models-field}

每個虛擬金鑰資料列都會帶有一個 `models` 清單。項目分為四類：

| 項目 | 含義 |
|---|---|
| 具體模型群組 | 來自 `config.yaml` `model_name` 的名稱（`gpt-4`、`azure-gpt-3.5`） |
| 萬用字元 | 與 `model_name` 比對的提供者前綴樣式（`openai/*`、`openai/o1-*`） |
| 存取群組 | 在 `model_info.access_groups` 或 `/access_group/new` 下宣告的標籤；在請求時展開為帶有該標籤的模型集合 |
| Sentinel | `SpecialModelNames` 中保留的字串之一（如下） |

空清單與字面值 `*` 在對金鑰或團隊評估時，兩者都表示「proxy 上的所有模型」。

## Sentinel {#sentinels}

這些字串在 `litellm.proxy._types.SpecialModelNames` 中保留作為 enum 值。它們會短路一般比對。

| Sentinel | 所屬位置 | 效果 |
|---|---|---|
| `all-proxy-models` | 金鑰、團隊或使用者 `models` 清單 | 授予 proxy 上的每個模型。對團隊而言，視同空的 `models` 清單。對使用者而言，授予對每個非團隊部署的直接存取。 |
| `all-team-models` | 僅限金鑰 `models` 清單 | 在請求時繼承父團隊的 `models`。如果金鑰沒有 `team_id`，該 sentinel 會解析為它自己，匹配不到任何內容，並且會拒絕存取，而不是默默放行。 |
| `no-default-models` | 僅限使用者 `models` 清單 | 使用者路徑上的硬性拒絕；強制使用者透過團隊路由請求。透過 `default_internal_user_params.models` 設定，讓 SSO 註冊無法鑄造具有 proxy 全域存取權的獨立金鑰。 |

`all-team-models` 是最常與空清單混淆的 sentinel。空表示「所有模型」；`all-team-models` 表示「團隊怎麼說就怎麼做，如果沒有團隊就沒有任何內容」。

## 解析：有 team_id 與沒有 {#resolution-with-team_id-vs-without}

兩條規則涵蓋所有情況。獨立金鑰（沒有 `team_id`）只會根據自身的 `models` 清單來授權。附屬於團隊的金鑰必須同時通過自身清單與對 `team.models` 的第二次檢查；呼叫者實際能到達的是兩者的交集，因此隸屬於持有 `["gpt-4"]` 的團隊、而該團隊又持有 `["azure-gpt-3.5"]` 的金鑰，不能呼叫任何內容。

失敗表面會告訴您是哪一步遭到拒絕。金鑰步驟會拋出 `Invalid model for key`。團隊步驟會拋出 `Invalid model for team <team_alias>: <model>. Valid models for team are: [...]`（請參閱 [依 team_id 限制模型](./model_access.md#restrict-models-by-team_id)）。

Sentinel 會改變這兩次檢查的形狀：團隊上的 `all-proxy-models` 會讓團隊步驟直接通過，但金鑰仍必須匹配；金鑰上的 `all-team-models` 會略過金鑰步驟並交由團隊步驟決定（若未附加團隊則拒絕）。

## 存取群組與萬用字元 {#access-groups-and-wildcards}

設計存取群組的目的，是讓將模型加入某個群組後，即可授予所有附帶金鑰的存取權，而不必修改任何金鑰資料列。標籤會儲存在金鑰或團隊上；展開則在驗證檢查時，透過查找哪些部署在其 `model_info.access_groups` 中帶有該標籤來完成。萬用字元以相同方式解析，但比對的是 `model_name` 而非標籤，且它們本身也可以屬於存取群組，因此可切分出子族群（`openai/*` 位於 `default-models` 中，`openai/o1-*` 位於 `restricted-models` 中；只持有 `default-models` 的金鑰無法呼叫 `o1` 系列）。請參閱 [模型存取群組](./model_access_groups.md)。

## 主金鑰會略過什麼 {#what-the-master-key-skips}

主金鑰在記憶體中以明文比對，不會儲存在 `LiteLLM_VerificationToken` 中，沒有 `models` 清單，並會略過上述所有檢查。請將其視為操作員憑證；一旦外洩，無論團隊、存取群組或 sentinel 設定如何，都會授予 proxy 上的所有模型。請參閱 [主金鑰輪替](./master_key_rotations.md)。

## 相關 {#related}

[模型存取](./model_access.md) · [模型存取群組](./model_access_groups.md) · [虛擬金鑰](./virtual_keys.md) · [多租戶架構](./multi_tenant_architecture.md)
