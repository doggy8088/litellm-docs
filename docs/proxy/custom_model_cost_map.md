# 自訂模型成本對照表 {#custom-model-cost-map}

LiteLLM 會根據其模型成本對照表為每個請求定價，該表是一個 JSON 檔案，將每個模型對應到每 token 費率、上下文限制與功能。預設情況下，proxy 會在啟動時從 GitHub 取得最新對照表，因此新模型的定價可在不升級 LiteLLM 的情況下到達。當您的部署有錯誤或缺失的價格（例如區域價格變體、議定費率，或預設對照表尚未收錄的全新層級）時，您有兩種方式修正：在設定檔中覆寫特定部署的定價，或以您自己代管的副本取代整張對照表。

若要做有限範圍的修正，請優先使用每個部署的覆寫。它只會變更您指定的部署，會在每次上游對照表更新後保留，不需要檔案代管，也沒有備援失敗模式。只有當修正涵蓋的模型多到每個部署的設定已難以維護時，才改用完整自訂對照表。

## 選項 1：每個部署的定價覆寫（建議） {#option-1-per-deployment-pricing-overrides-recommended}

成本對照表中的任何定價鍵都可以直接在 `litellm_params` 中設定到某個部署上，包括形如 `input_cost_per_token_above_{N}k_tokens` 的分級長上下文鍵。當輸入 token 數跨越門檻時，LiteLLM 會以該級費率計算整個請求。

範例：一個按區域價格變體計費的 Azure 部署（例如 US Data Zone），其長上下文級別在預設對照表中缺失：

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: azure/<your-deployment-name>
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      input_cost_per_token: 0.0000022        # base rate for your price variant
      output_cost_per_token: 0.0000132
      input_cost_per_token_above_272k_tokens: 0.0000044   # long-context tier
      output_cost_per_token_above_272k_tokens: 0.0000198
      cache_read_input_token_cost: 0.00000022
      cache_read_input_token_cost_above_272k_tokens: 0.00000044
```

可覆寫鍵的完整集合包括基礎每 token 費率、每秒費率、快取讀取與快取建立費率，以及每一項的 `above_128k`、`above_200k`、`above_272k` 級別變體，外加 `_priority` 服務層級變體。上述數字僅供說明；請從您的提供者價目表取得實際費率。一般覆寫機制請參見 [自訂 LLM 定價](./custom_pricing)。

分級定價無需變更程式碼即可套用；成本引擎會讀取解析後定價所帶有的任何級別鍵。

### 部分覆寫不會回退到預設定價 {#partial-overrides-do-not-fall-back-to-default-pricing}

設定任何自訂定價欄位都會讓該部署與預設成本對照表條目脫鉤：LiteLLM 會為該部署建立獨立的定價條目，並只依此計費。若您覆寫 `input_cost_per_token` 但未設定 `input_cost_per_token_above_272k_tokens`，該部署就完全沒有級別邊界，因此超過 272k token 的請求會以您的自訂基礎費率計費。未設定的級別鍵不會繼承預設對照表的級別價格，且 LiteLLM 絕不會將您的基礎費率與預設級別加價混用。

唯一刻意保留的例外是快取定價。當您覆寫基礎輸入費率時，缺少的快取欄位（`cache_read_input_token_cost`、`cache_creation_input_token_cost` 及其 `above_1hr` 和 `above_200k` 變體）會從後端模型的預設條目繼承，以免快取讀取在不知不覺間被以零計費。請注意，這些繼承值是預設價格，不是您的價格變體，因此區域或議定費率表也應一併覆寫快取鍵。

請將覆寫區塊視為該部署的完整費率表：基礎輸入與輸出費率、長上下文級別鍵，以及快取鍵。部分覆寫會在剛好昂貴的請求上悄悄少算費用。

## 選項 2：代管您自己的成本對照表 {#option-2-serve-your-own-cost-map}

使用以下方式將 proxy 指向您自己的對照表副本：

```bash
export LITELLM_MODEL_COST_MAP_URL="https://your-host.example.com/model_prices.json"
# or read it straight from a private S3 bucket
export LITELLM_MODEL_COST_MAP_URL="s3://my-bucket/prices/model_prices.json"
# or from a private Google Cloud Storage bucket
export LITELLM_MODEL_COST_MAP_URL="gs://my-bucket/prices/model_prices.json"
```

該對照表會在啟動時抓取，逾時為 5 秒，因此該變數必須在 proxy 啟動前設定於其環境中（`.env` 檔案、`docker run -e`，或 Kubernetes 的 `env:` 區塊）；在 `config.yaml` 的 `environment_variables` 下設定就太晚了。URL 可以是 HTTP(S)、`s3://` 或 `gs://`；不支援 `file://` 路徑。若要完全離線執行，請改設 `LITELLM_LOCAL_MODEL_COST_MAP=True`，它會跳過抓取並使用套件內附的備份對照表（`litellm/model_prices_and_context_window_backup.json`），您可在自己的映像檔中覆寫該檔案。

### 從 S3 讀取對照表 {#reading-the-map-from-s3}

使用 `s3://bucket/key` URL 時，proxy 會在啟動時、執行 `POST /reload/model_cost_map` 時，以及排程重新載入時，以 boto3 的 `get_object` 讀取該物件。這需要包含 [PR #46972](https://github.com/BerriAI/litellm/pull/46972) 的 LiteLLM 版本。

LiteLLM 本身沒有這些憑證的設定。boto3 會在 proxy 的處理程序中以標準 AWS 方式找到它們：pod 或執行個體的 IAM 角色（EKS IRSA、ECS task role、EC2 instance role）、`AWS_ACCESS_KEY_ID` 與 `AWS_SECRET_ACCESS_KEY`（臨時金鑰另加 `AWS_SESSION_TOKEN`），或 `AWS_PROFILE` 搭配掛載的 AWS 設定檔。`config.yaml` 中的 AWS 憑證（包括 Bedrock 的 `aws_access_key_id` 與 `aws_role_name` 參數）不會被使用，因為對照表是在設定載入前抓取的。設定 `AWS_REGION_NAME` 可固定儲存桶的區域；此為選填。

該身分需要對該物件有 `s3:GetObject` 權限：

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/prices/model_prices.json"
}
```

如果儲存桶位於另一個 AWS 帳戶，儲存桶的政策也必須允許 proxy 的角色作為主體。如果物件以客戶管理的 KMS 金鑰加密，該角色還需要對該金鑰有 `kms:Decrypt` 權限。不支援 MinIO 等 S3 相容端點。

S3 錯誤不會重試。啟動時若缺少憑證、`AccessDenied` 或 `NoSuchKey`，會回退到內附對照表，並將錯誤放在 `fallback_reason` 中（例如 `Remote fetch failed: S3 NoCredentialsError fetching s3://my-bucket/prices/model_prices.json: Unable to locate credentials`），重新載入則會保留目前的對照表，因此首次部署後請依下文所述檢查 `/model/cost_map/source`。

### 從 Google Cloud Storage 讀取對照表 {#reading-the-map-from-google-cloud-storage}

使用 `gs://bucket/object` URL 時，proxy 會在啟動時、執行 `POST /reload/model_cost_map` 時，以及排程重新載入時，透過 Cloud Storage JSON API 讀取該物件。這需要包含 [PR #51108](https://github.com/BerriAI/litellm/pull/51108) 的 LiteLLM 版本。

Proxy 以 Google 應用程式預設憑證進行驗證，在 proxy 的處理程序中依此順序查找：`GOOGLE_APPLICATION_CREDENTIALS` 所指的服務帳戶金鑰檔案、gcloud 應用程式預設憑證檔案，然後是 GKE pod 或 GCE 執行個體的中繼資料伺服器（GKE Workload Identity，或執行個體附加的服務帳戶）。與 S3 路徑相同，它不會從 `config.yaml` 讀取 Vertex 或 GCS 記錄憑證，也不會讀取 `GCS_PATH_SERVICE_ACCOUNT`。該身分需要對該物件有 `storage.objects.get` 權限，例如授予儲存桶的 Storage Object Viewer 角色（`roles/storage.objectViewer`）。

HTTP 429 與 5xx 回應會重試，取得存取權杖失敗也會重試，因為新的 GKE pod 的中繼資料伺服器在最初幾秒可能拒絕請求。啟動時，proxy 會在重試於背景執行期間先提供內附對照表，然後再安裝儲存桶的對照表。401、403 或 404 不會重試；啟動會回退到內附對照表，並將狀態放在 `fallback_reason` 中（例如 `Remote fetch failed: HTTP 403 from gs://my-bucket/prices/model_prices.json`），重新載入則會保留目前的對照表。

設定 `STORAGE_EMULATOR_HOST` 時，抓取會改去該模擬器而非 `storage.googleapis.com`，且不傳送憑證，與 Google 自己的儲存用戶端相同。沒有 scheme 的值（例如 `localhost:4443`）會被解讀為 `http://localhost:4443`。物件名稱在第一個 `?` 或 `#` 處結束，因此不支援包含這兩個字元的物件名稱，以及 gsutil 的 `#generation` 後綴。

### 從完整的上游檔案開始 {#start-from-the-full-upstream-file}

請始終以完整的 [model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 作為自訂對照表的分支，並將您的修正編輯進去。只包含您模型的小檔案會被拒絕：抓取到的對照表必須至少包含 50 個模型條目，且至少要有內建備份的一半條目數，否則 LiteLLM 會丟棄它。如果您接受有損壞對照表通過驗證的風險，則可透過 `MODEL_COST_MAP_MIN_MODEL_COUNT` 和 `MODEL_COST_MAP_MAX_SHRINK_RATIO` 調整這兩個門檻。

### 備援語意：請監控它們 {#fallback-semantics-monitor-them}

如果抓取失敗、逾時，或檔案驗證失敗，proxy 不會當機。它會記錄警告並靜默回退到內建備份對照表，這表示請求會依該備份所載的價格計費。對於正式環境部署，這是需要監看的失敗模式：在 pod 啟動時發生的暫時性網路錯誤，會悄悄讓您所有的定價修正回復原狀。

可使用管理端點確認實際載入的是哪一份對照表：

```bash
curl -s http://localhost:4000/model/cost_map/source \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

回應會回報 `source`（"remote" 或 "local"）、嘗試的 `url`、可供人閱讀的 `fallback_reason`（成功時為 null），以及 `model_count`。當 `source` 不是 `remote`，或 `fallback_reason` 不為 null 時，請發出警示。

### 正式環境檢查清單 {#production-checklist}

1. 將檔案作為版本化成品代管在您可控的基礎架構上（透過 `s3://` 讀取的 S3 物件、CDN 後方的物件儲存，或內部端點），且每個 proxy pod 都能在 5 秒內連到。
2. 當 `/model/cost_map/source` 回報備援時發出警示。
3. 設定與上游對照表重新同步的週期，避免新釋出模型的定價在分支建立時就被凍結。
4. 在可行時將自訂對照表視為暫時方案：將您的修正回饋到預設對照表，然後移除分支。

## 應該選哪個選項 {#which-option-to-choose}

自訂對照表會取代整個定價資料庫。您將接管每個條目，且在重新同步前不再接收上游定價更新；其失敗模式（靜默備援）會在不讓健康檢查失敗的情況下回復您的修正。每個部署的覆寫則完全沒有這些風險，但其規模會隨著您必須修正的部署數量線性成長。若要修正少數幾個部署，請在設定中修正；若要修正整個叢集，則使用分支對照表加上監控；無論哪種情況，都請將修正回饋上游，讓此權宜之計得以退場。
