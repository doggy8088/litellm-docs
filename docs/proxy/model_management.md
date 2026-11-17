import Image from '@theme/IdealImage';

# 模型管理 {#model-management}

當 `STORE_MODEL_IN_DB` 開啟時，您的模型會存在資料庫中，而不是靜態的 `config.yaml`。這表示第二天起的變更會直接在 Admin UI 中進行：新增模型、編輯定價、輪替提供者金鑰，或退役部署，ทั้งหมด都不需要修改設定檔或重新啟動 proxy。

本頁涵蓋這些持續性的操作。如果您正在新增第一個模型，請從 [快速入門](./docker_quick_start.md) 開始，它會帶您完成啟動、提供者連線，以及您的第一個請求。等 gateway 執行中，且您想管理現有模型時，再回到這裡。

## 模型清單 {#the-model-list}

若要在不變更應用程式中名稱的情況下跟隨一個模型系列，請使用[最新模型別名](../model_latest_aliases.md)，例如 `openai/gpt-luna-latest`。

前往 **Models + Endpoints**，並開啟 **All Models** 分頁，即可查看 gateway 目前提供的每個模型。每一列會顯示公開模型名稱、底層提供者與 litellm model，以及 LiteLLM 會自動從其 [模型成本對應表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 映射的每個 token 的輸入與輸出成本。

每個模型上的徽章會告訴您它的來源：透過 UI 或 API 新增的模型會帶有資料庫徽章，而從 `config.yaml` 載入的模型會標記為 config。這個區別很重要，因為 config 模型不能從 UI 編輯（請參見下方的 [資料庫 vs config.yaml 模型](#database-vs-configyaml-models)）。使用搜尋框與提供者篩選器，將很長的清單縮小為您關心的模型。

<Image img={require('../../img/ui_models_table.png')} alt="All Models list in the Admin UI" />

## 檢視並編輯模型 {#inspect-and-edit-a-model}

點擊清單中的 Model ID 以開啟其詳細頁面。**概覽** 分頁會摘要顯示模型設定與提供者，**原始 JSON** 分頁則顯示完整的儲存定義，當您想確認 gateway 實際持有的內容時非常有用。

點擊 **Edit Settings** 以就地變更模型。您可以更新客戶端呼叫的公開模型名稱、請求被路由到的 litellm model 名稱，以及當您想覆寫對應定價時，輸入與輸出每 1M tokens 的成本。儲存後，變更會立即對新請求生效。

此頁面還有另外兩個操作。**Test Connection** 會使用已儲存的憑證重新驗證模型與提供者之間的連線，因此您可以在客戶端打到它之前，確認金鑰仍可使用或新編輯的設定有效。**Delete Model** 會從 gateway 移除模型；對於資料庫模型，這會直接刪除儲存的定義。

<Image img={require('../../img/ui_model_detail.png')} alt="Model detail page with Edit Settings, Test Connection, and Delete Model" />

## 可重用的提供者憑證 {#reusable-provider-credentials}

大多數部署在同一個提供者帳戶後面會有多個模型。與其把相同的 API 金鑰貼到每個模型中，不如先建立一個具名憑證並重複使用。

開啟 **LLM Credentials** 分頁並點擊 **Add Credential**。選擇您的提供者、輸入 API 金鑰，並為該憑證命名。欄位會依您選擇的提供者自動調整，因此例如選擇 Vertex AI 時，您會看到 `Vertex Project`、`Vertex Location` 與 `Vertex Credentials`，而不是單一金鑰欄位。

<Image
  img={require('../../img/ui_add_credential.png')}
  dark={require('../../img/ui_add_credential_dark.png')}
  alt="Add New Credential modal with OpenAI selected as the provider"
/>

儲存後，該憑證可在您新增或編輯模型的任何地方使用。在 Add Model 表單中，請從 **Existing Credentials** 下拉選單選取它，而不是輸入金鑰。從模型的詳細頁面，您也可以透過 **Re-use Credentials** 按鈕反向操作，將您已設定的某個模型憑證轉成供未來模型使用的具名憑證。掛接到具名憑證的模型會在 Usage 頁面中標記為 `Credential: <name>`，因此您可以依憑證篩選支出，而不需要額外設定；請參見 [憑證用量追蹤](./credential_usage_tracking.md)。

## 工作負載身分憑證 {#workload-identity-credentials}

使用來自 gateway 執行階段的 OIDC token 向模型提供者驗證，無需靜態的提供者密鑰。這些憑證屬於模型的 `litellm_params`。若要向 gateway 驗證呼叫者，請參閱 [JWT (OIDC)](./token_auth.md)。

支援 OIDC 參照的憑證欄位包括用於 [Amazon Bedrock](../providers/bedrock.md) 的 `aws_web_identity_token` 與用於 [Azure OpenAI](../providers/azure/azure.md) 的 `azure_ad_token`。參照的形式為 `oidc/<source>/<audience>`；對於不使用 audience 的來源，可省略 audience。

| 執行階段或 token 來源 | 參照 | 自訂 audience |
| --- | --- | --- |
| Google Cloud Run | `oidc/google/<audience>` | 是 |
| GitHub Actions | `oidc/github/<audience>` | 是 |
| CircleCI | `oidc/circleci/` 或 `oidc/circleci_v2/` | 否 |
| Azure Kubernetes Service | `oidc/azure/` | 否 |
| Azure AD | `oidc/azure/<audience>` | 是 |
| Token 檔案 | `oidc/file//var/run/secrets/token` | 否 |
| 包含 token 的環境變數 | `oidc/env/TOKEN_VARIABLE` | 否 |
| 包含 token 檔案路徑的環境變數 | `oidc/env_path/TOKEN_PATH_VARIABLE` | 否 |

在使用參照之前，請先設定提供者的信任關係與權限。例如，Bedrock 需要一個信任 token 發行者的 IAM 角色，而 Azure OpenAI 需要一個具有 federated credential 且可存取該資源的應用程式。對於 Bedrock，請在 `aws_web_identity_token` 之外同時設定 `aws_role_name` 與 `aws_session_name`。對於 Azure OpenAI，請為交換 token 的應用程式設定 `AZURE_CLIENT_ID` 與 `AZURE_TENANT_ID`。有可用的執行階段來源（例如 `oidc/azure/`）時，優先使用它。

對於 `oidc/file/`，解析後的絕對路徑（包括符號連結）必須位於 `/var/run/secrets` 或 `/run/secrets` 之內。若要使用其他憑證目錄，請將 `LITELLM_OIDC_ALLOWED_CREDENTIAL_DIRS` 設為以逗號分隔的絕對目錄清單。這會取代預設值。

### 將 OIDC 用作模型的 `api_key` {#using-oidc-as-a-models-api_key}

<SinceVersion v="1.109.0" />

模型的 `api_key` 接受 `oidc/file/<absolute path>`、`oidc/env/<VARIABLE_NAME>` 與 `oidc/google/<audience>`。其他來源在此欄位會回傳 401。proxy 會在每次呼叫時解析參照，因此輪替過的 token 無需重新啟動即可生效。

```yaml
model_list:
  - model_name: vllm-model
    litellm_params:
      model: hosted_vllm/my-model
      api_base: https://vllm.example.com/v1
      api_key: oidc/google/https://vllm.example.com
```

對於 `oidc/google/`，LiteLLM 會從 Google Cloud 中繼資料伺服器取得所設定 audience 的 ID token，並將其作為 bearer token 傳送。它會快取該 token 直到到期前一分鐘，最長 59 分鐘。它也會在啟動時讀取模型詳細資訊時解析該 token。

`GCE_METADATA_HOST` 會覆寫 `metadata.google.internal`；請使用不帶 scheme 的主機或 host:port。`GCE_METADATA_TIMEOUT` 設定模型 `api_key` 解析的每次讀取逾時，未設定或為非正值時預設為 3 秒。逾時、連線失敗或中繼資料伺服器 5xx 會回傳可重試的 503；請求被拒或 token 為空則回傳 401。解析失敗時不會送出上游請求。Google 的用戶端程式庫也會讀取這些變數，因此它們可能影響同一個程序中的 Vertex AI 與 Google Cloud Storage。`GCE_METADATA_HOST` 套用到所有 `oidc/google/` 參照，包括 Bedrock 的 `aws_web_identity_token`；LiteLLM 的 `GCE_METADATA_TIMEOUT` 處理則套用到模型 `api_key` 解析。

只有管理員在模型上設定的參照會被解析。用戶端請求或團隊憑證中的參照會被拒絕，且解析出的 token 只會傳送到模型所設定的 `api_base` 或其提供者的預設端點。Pass-through 路由不支援 `oidc/google/` 憑證。

## 資料庫 vs config.yaml 模型 {#database-vs-configyaml-models}

將模型儲存在資料庫中，才讓以 UI 為驅動的管理成為可能。可透過將 `STORE_MODEL_IN_DB="True"` 設為環境變數，或在您的設定中設為 `general_settings.store_model_in_db: true` 來啟用。您也可以在 UI 的 **Models + Endpoints** 設定中於執行時切換；對於雲端部署而言，這很方便，因為編輯設定通常代表完整發佈。此切換僅在您的 `config.yaml` 未宣告 `store_model_in_db` 時才有效。若檔案有宣告，則以檔案值為準，儲存切換會回傳 400，因此請改在設定中變更（在 v1.103.0 之前，UI 值會覆蓋設定值）。

啟用後，您透過 UI 或 API 新增的每個模型都會保留在資料庫中，並在重新啟動與額外的 proxy 實例之間持續存在。這些模型的提供者憑證會在靜態儲存時使用 `LITELLM_SALT_KEY` 加密（如果未設定 salt key，則回退到 `LITELLM_MASTER_KEY`）；請將該值保密，且一旦有模型存在就永遠不要變更，因為使用舊值加密的憑證無法用新值解密。

資料庫儲存不會取代您的 `config.yaml`。其中定義的任何模型都會繼續運作，並與您的資料庫模型並列顯示。唯一的差異在於 config 模型是由檔案所擁有，因此無法從 UI 編輯或刪除；請在設定檔中修改並重新載入。關於 config 格式本身，請參見 [Config.yaml](./configs.md)。

在這裡，設定與模型的行為不同。在 `general_settings`、`router_settings`、`litellm_settings` 與 `environment_variables` 中，您在 `config.yaml` 中宣告的 key 由檔案擁有，優先於儲存在 `LiteLLM_Config` 中的任何內容，且 UI 與 `/config/update` 會以 400 拒絕變更它。檔案未宣告的 key 則由資料庫擁有，因此這些是 UI 設定的對象。在 v1.103.0 之前則相反，資料庫值優先於 YAML。請參見 [config.yaml 與資料庫設定](./configs.md#configyaml-vs-database-settings)。

### 為模型選擇單一真實來源 {#choose-one-source-of-truth-for-models}

對於正式環境部署，請為模型定義使用一個主要真實來源：

| 方法 | 儲存位置 | 變更模型是否需要重新啟動？ | 最適合 |
| --- | --- | --- | --- |
| `config.yaml` | 設定檔 | 是。變更檔案後，重新載入或重新啟動 proxy tasks。 | GitOps 工作流程，讓每次模型變更都與應用程式一併部署。 |
| Admin UI、management API 或 Terraform | LiteLLM 資料庫 | 否。寫入成功後，變更會套用到新的請求。 | 第二天起的操作、頻繁的模型變更，以及集中式自動化。 |

LiteLLM 可以同時載入以檔案為基礎與以資料庫為後端的模型，但同時使用兩者作為模型管理系統會造成兩個真實來源。從 `config.yaml` 載入的模型仍由該檔案擁有，無法透過 UI 編輯或刪除。請將模型定義保留在單一系統中，並持續針對未透過管理 API 暴露的基礎架構設定使用 `config.yaml` 或環境變數。

[LiteLLM Terraform provider](https://github.com/BerriAI/terraform-provider-litellm) 呼叫與 Admin UI 相同的管理 API。它會將資源儲存在 LiteLLM 資料庫中，因此您不需要為模型變更建構獨立的 REST 用戶端，或重新啟動 proxy。

## 自動化（API） {#automation-api}

相同的操作也可透過 HTTP 使用，這正適合 CI/CD 或腳本化批次變更。這些端點需要啟用 `store_model_in_db`；若關閉，`POST /model/new` 就會失敗，因為沒有地方可以持久化模型。

新增模型：

```bash
curl -X POST "http://0.0.0.0:4000/model/new" \
    -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "model_name": "azure-{{openai_large}}",
      "litellm_params": {
        "model": "azure/{{openai_large}}",
        "api_key": "os.environ/AZURE_API_KEY",
        "api_base": "https://my-endpoint.openai.azure.com/"
      }
    }'
```

其餘操作：

| 操作 | 路由 | 備註 |
| --- | --- | --- |
| 列出模型 | `GET /model/info` | 回傳完整模型清單，且 API 金鑰已遮罩 |
| 更新模型 | `PATCH /model/{model_id}/update` | 變更既有模型的 `litellm_params` 或 `model_info`。較舊的 `POST /model/update` 僅變更 `litellm_params` |
| 刪除模型 | `POST /model/delete` | 本文 `{"id": "<model_id>"}`，僅管理員可用。這是 POST；沒有 DELETE 動詞路由 |

您在建立或更新模型時可以附加任意 `model_info` 欄位，它們會連同對應的成本與內容資料一起直接傳遞給 `GET /model/info`。這是替模型加註您自己的中繼資料（例如所屬團隊、描述或版本），並以程式方式讀回的機制。
## 拒絕非聊天模型上的聊天呼叫 {#reject-chat-calls-on-non-chat-models}

<SinceVersion v="1.109.0" />

`model_info.mode` 與 `model_info.supported_endpoints` 預設僅供資訊參考。若要讓 proxy 針對聊天式請求強制執行該清單，請在部署上設定 `enforce_supported_endpoints: true`，並在其旁放一份不含聊天端點的 `supported_endpoints` 清單。proxy 接著會在聊天式請求時跳過該部署，不呼叫其提供者，而它所列出的路由（例如 `/v1/embeddings`）則照常運作。只有聊天式請求會被檢查，因此 embedding、圖片、音訊與其他非聊天請求無論清單如何都會抵達該部署。此旗標本身不做任何事。當 `supported_endpoints` 缺失或不是字串清單時，該部署不受限制，且 proxy 會在載入該部署時記錄一則指名它的警告。

```yaml
model_list:
  - model_name: my-embeddings
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: embedding
      supported_endpoints: ["/v1/embeddings"]
      enforce_supported_endpoints: true
```

相同的 `model_info` 欄位可透過 `POST /model/new` 與 `PATCH /model/{model_id}/update` 使用，且變更會套用到新請求，無需重新啟動。當模型名稱背後沒有任何部署能接受該請求、且沒有備援回應時，對 `my-embeddings` 的聊天呼叫會回傳：

```json
{
  "error": {
    "message": "/v1/chat/completions is not supported by model=my-embeddings. Supported endpoints: /v1/embeddings\n\nLiteLLM: model group 'my-embeddings' failed with the error above. No fallback was attempted.",
    "type": "invalid_request_error",
    "param": "model",
    "code": "400"
  }
}
```

此檢查涵蓋 `/v1/chat/completions`、`/v1/completions`、`/v1/responses`（包括其 WebSocket 模式與 `/v1/responses/compact`）、不帶 `/v1` 或位於 Azure 式 `/openai/deployments/<name>/` 路徑下的相同路由、`/v1/messages`（以 Anthropic 錯誤格式回應）、Gemini 的 `generateContent` 與 `streamGenerateContent` 路由，以及 `/v1beta/interactions`。在 Responses WebSocket 上，proxy 會送出一個 `error` 事件並以代碼 1008 關閉 socket。只要 `supported_endpoints` 清單包含上述任一端點，無論寫成帶或不帶 `/v1`、`/v1beta` 或 `/openai` 前綴，都視為具備聊天能力，永不強制執行。項目比對時不分大小寫與尾隨斜線，也能比對像 `/v1beta/models/<model>:generateContent` 這樣的完整 Gemini 路徑。清單中像 `/openai/deployments/<name>/chat/completions` 這樣的 Azure 部署路徑不算數，因此請改列 `/v1/chat/completions`。當請求以部署的 `model_info.id` 或 `litellm_params.model` 指名該部署，或透過別名或 wildcard 路由抵達時，此檢查以相同方式套用。

此旗標是依每個部署讀取的。當一個模型名稱有多個部署時，聊天式請求只會前往沒有限制者，且只有當該名稱背後每個部署都受限制時才會出現 400。沒有此旗標時，`mode` 與 `supported_endpoints` 維持其資訊參考行為，且 `mode` 在檢查中無論如何都不起作用。

當模型有備援時，proxy 會轉向備援，不呼叫受限制部署的提供者。這涵蓋 router 的 `fallbacks` 與 `default_fallbacks`、金鑰與團隊的 `router_settings` 備援，以及請求本文中的 `fallbacks`，且會沿著通往另一個受限制模型的鏈繼續，直到有提供聊天的模型回應為止。由於 `default_fallbacks` 套用到每個模型，將其設為聊天模型的 proxy 會由該模型回應這些請求，而不是回傳 400。只抵達受限制模型、或繞回它們的鏈會保留 400，請求中的 `disable_fallbacks: true` 或 `fallbacks: []` 也是如此。

## 在新模型上要求 rpm 與 tpm {#require-rpm-and-tpm-on-new-models}

依預設，模型上的 `rpm` 與 `tpm` 是選用的，因此整個機隊可能有些部署受速率限制、有些則無上限。在 `general_settings` 中設定 `enforce_rpm_tpm_on_model_add` 以要求它們 <SinceVersion v="1.100.0" />。

```yaml
general_settings:
  enforce_rpm_tpm_on_model_add: true
```

設為 `true` 時，`POST /model/new` 會回傳 `400`，除非 `litellm_params` 將 `rpm` 與 `tpm` 都設為正值。在 Admin UI 的 Add Model 表單中，請在 Advanced Settings 下的 LiteLLM Params 欄位中設定它們，例如 `{"rpm": 100, "tpm": 100000}`。只有透過 API 或 Admin UI 新增的模型會被檢查，因此 `config.yaml` 的 `model_list` 中的模型仍可在沒有 `rpm` 或 `tpm` 的情況下載入。

此設定也接受與 [`enforce_project_model_quota`](project_management#per-provider-and-per-model-requirements) 相同的 `default`、`providers` 與 `models` 對應，並有相同的優先順序 <SinceVersion v="1.109.0" />。早於 1.109.0 的 proxy 會將此對應讀作 `true`，並在每個新模型上要求兩項限制。新模型會依其 `model_name` 與 `models` 項目比對，若它是團隊模型，則依它呼叫的模型比對，並依其 `litellm_params` 中的提供者與 `providers` 比對。

```yaml
general_settings:
  enforce_rpm_tpm_on_model_add:
    providers:
      vertex_ai: [rpm, tpm]
      runwayml: []
    models:
      "veo-*": [rpm]
```

以此對應來說，`runwayml/gen4.5` 模型可以在沒有限制的情況下新增，`model_name` 以 `veo-` 開頭的模型只需要 `rpm`，而在 Vertex AI 上的 Gemini 模型則兩者都需要。透過 `POST /model/update` 或 `PATCH /model/{id}/update` 的模型更新，只會檢查其新名稱與提供者要求、而舊的未要求的限制，因此新增時被豁免的模型無法在未設定限制的情況下移到需要限制的提供者。模型已經需要的限制不會再次檢查，因此更新可以降低或歸零 `rpm` 與 `tpm`，或在 `PATCH /model/{id}/update` 上以 `litellm_params_to_remove` 移除它們，且在 `true` 之下，更新永遠不會未通過此檢查。格式錯誤的對應會讓模型新增與更新回傳 `500`，並附上指名 `general_settings.enforce_rpm_tpm_on_model_add` 的錯誤。
