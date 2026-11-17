---
title: 使用 Management API 設定 LiteLLM
sidebar_label: Management API
toc_max_heading_level: 2
description: 使用 HTTP API 在正在運行的 LiteLLM 閘道上註冊模型、建立團隊與虛擬金鑰、更新存取權並撤銷金鑰。
---

# 使用 Management API 設定 LiteLLM {#configure-litellm-with-the-management-api}

{/* keep-version-note */}

使用 Management API 將內部門戶或自動化服務連接到正在運行的 LiteLLM 閘道。您的應用程式可以透過 HTTP 請求註冊模型、授予團隊存取權、發行虛擬金鑰並撤銷金鑰。

[Admin UI](./ui.md) 與 [Terraform 提供者](./terraform.md) 也使用 API 管理閘道資源。當您的應用程式需要進行那些變更時，請使用直接 API 呼叫。安裝 LiteLLM 與設定其基礎架構請參閱[部署指南](../deploy.md)。

## API 管理的內容 {#what-the-api-manages}

| 工作 | API | 儲存與所有權 | 變更何時套用 |
| --- | --- | --- | --- |
| 新增、更新或移除資料庫模型 | `POST /model/new`、`PATCH /model/{model_id}/update`、`POST /model/delete` | 資料庫。需要 `STORE_MODEL_IN_DB=True`。 | 無需重新啟動 proxy。請檢查每個 replica 都已重新整理其模型清單。 |
| 建立團隊或更新其模型存取與限制 | `POST /team/new`、`POST /team/update` | 資料庫 | 無需重新啟動 proxy。請透過閘道測試存取。 |
| 發行、更新或撤銷虛擬金鑰 | `POST /key/generate`、`POST /key/update`、`POST /key/delete` | 資料庫 | 無需重新啟動 proxy。請跨 replica 測試存取變更。 |
| 變更支援的閘道設定 | `POST /config/update` | YAML 之外的設定存於資料庫。需要資料庫設定儲存。 | 閘道會重新整理其設定。請檢查該設定記錄的行為。 |
| 變更由 YAML 擁有的模型或設定 | 編輯擁有的 `config.yaml` 項目 | 檔案 | 檔案變更後重新載入或重新啟動 proxy。請參閱下方的所有權規則。 |

此表列出常見工作。API 支援會依資源與設定而異。請在 [API 參考](https://docs.litellm.ai/api-reference/) 與您正在運行的閘道的 API 文件中查看請求 schema 與權限。更多操作與設定請參閱 [模型管理](../model_management.md#automation-api)、[Virtual Keys](../virtual_keys.md) 與[設定參考](../config_settings.md)。

產生的 OpenAPI 文件省略了 Admin UI 的 `/config/update` 與 `/config/field/update` 端點。它們的儲存與所有權規則請參閱 [YAML 與資料庫設定](../configs.md#configyaml-vs-database-settings)。

## 開始之前 {#before-you-start}

將閘道連接到 PostgreSQL 並設定 `LITELLM_MASTER_KEY`。在閘道的環境中設定 `STORE_MODEL_IN_DB=True`，或在其 YAML 中設定 `general_settings.store_model_in_db: true`。請保持憑證加密金鑰不變。請參閱[資料庫模型儲存](../model_management.md#database-vs-configyaml-models)。

如果您執行多個 worker 或 replica，請[設定共用的 Redis](../redis_requirements.md#configure-redis) 以處理速率限制與快取失效，包括跨 worker 的金鑰撤銷。

範例使用具有管理端點存取權的 proxy-admin 憑證。請將該憑證保留在您的平台服務中。只將您在下方建立的推論金鑰給用戶端應用程式。為您的自動化選擇憑證請參閱[角色與權限](../access_control.md)。

自架模型必須公開 LiteLLM 可以連到的 OpenAI 相容 API。在 **LiteLLM 伺服器**上將 `SELF_HOSTED_API_KEY` 設為該上游服務的憑證。下方的模型定義會參照該環境變數。

請在已安裝 `curl` 與 `jq` 的同一個 Bash 工作階段中執行範例。開始前請替換範例閘道 URL、上游 URL、提供的模型名稱與管理員憑證。

```bash
set -euo pipefail

export LITELLM_API_BASE="https://llm.example.com"
export LITELLM_ADMIN_KEY="<proxy-admin-credential>"
export SELF_HOSTED_URL="https://models.internal.example.com/v1"
export SELF_HOSTED_MODEL="<model-name-served-by-your-upstream>"
```

## 從您的平台佈建存取權 {#provision-access-from-your-platform}

此工作流程會建立 `client-chat` 模型別名、一個團隊，以及一個只能使用該模型的金鑰。建立步驟請執行一次。將傳回的 ID 儲存在您的平台中以供日後更新。

### 1. 註冊自架模型 {#1-register-the-self-hosted-model}

用戶端使用 `model_name` 值在 LiteLLM 中選擇此模型。`openai/` 前綴選擇 OpenAI 相容提供者。前綴後的名稱識別您上游服務上的模型。

```bash
MODEL_ID=$(
  jq -n \
    --arg upstream_model "$SELF_HOSTED_MODEL" \
    --arg upstream_url "$SELF_HOSTED_URL" \
    '{
      model_name: "client-chat",
      litellm_params: {
        model: ("openai/" + $upstream_model),
        api_base: $upstream_url,
        api_key: "os.environ/SELF_HOSTED_API_KEY"
      }
    }' |
  curl --fail-with-body -sS -X POST "$LITELLM_API_BASE/model/new" \
    -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
    -H "Content-Type: application/json" \
    --data-binary @- |
  jq -er '.model_id'
)
```

`MODEL_ID` 識別此部署以供日後更新。如果您想完全透過 API 管理此模型，請勿將 `client-chat` 放在 YAML 中。

### 2. 建立具有模型存取權的團隊 {#2-create-a-team-with-model-access}

```bash
TEAM_ID=$(
  curl --fail-with-body -sS -X POST "$LITELLM_API_BASE/team/new" \
    -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "team_alias": "client-applications",
      "models": ["client-chat"],
      "rpm_limit": 120
    }' |
  jq -er '.team_id'
)
```

團隊的模型清單與速率限制套用到其金鑰。如有需要，請加入[團隊預算](../team_budgets.md)。為自架模型設定[自訂定價](../custom_pricing.md)，以使用以成本為基礎的預算與支出報告。

### 3. 發行推論金鑰 {#3-issue-an-inference-key}

```bash
CLIENT_KEY=$(
  jq -n --arg team_id "$TEAM_ID" \
    '{
      team_id: $team_id,
      key_alias: "client-application",
      key_type: "llm_api",
      models: ["client-chat"],
      duration: "30d",
      rpm_limit: 60
    }' |
  curl --fail-with-body -sS -X POST "$LITELLM_API_BASE/key/generate" \
    -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
    -H "Content-Type: application/json" \
    --data-binary @- |
  jq -er '.key'
)
```

將 `CLIENT_KEY` 儲存在應用程式的祕密儲存庫中。`key_type: "llm_api"` 選擇推論路由預設集。模型清單將此金鑰限制為 `client-chat`。應用程式使用此金鑰呼叫 LiteLLM。

### 4. 驗證模型請求 {#4-verify-a-model-request}

```bash
curl --fail-with-body -sS "$LITELLM_API_BASE/v1/chat/completions" \
  -H "Authorization: Bearer $CLIENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "client-chat",
    "messages": [{"role": "user", "content": "Reply with hello."}]
  }'
```

預期會從您的自架模型收到補全。如果閘道提供另一個模型，請確認此金鑰無法呼叫它。金鑰與團隊權限如何結合請參閱[金鑰驗證與模型存取](../key_auth_arch.md)。

### 5. 更新模型與金鑰 {#5-update-the-model-and-key}

使用部署 ID 變更其請求逾時，無需重新建立模型：

```bash
curl --fail-with-body -sS -X PATCH \
  "$LITELLM_API_BASE/model/$MODEL_ID/update" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"litellm_params": {"timeout": 90}}'
```

使用金鑰更新端點降低應用程式的速率限制：

```bash
jq -n --arg key "$CLIENT_KEY" '{key: $key, rpm_limit: 30}' |
curl --fail-with-body -sS -X POST "$LITELLM_API_BASE/key/update" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @-
```

若要更新團隊，請以 `team_id` 與要變更的欄位呼叫 `POST /team/update`。透過 `GET /model/info` 讀取已儲存的模型，透過 `GET /team/info?team_id=<team-id>` 讀取團隊。然後透過您平常的閘道位址測試請求。

### 6. 撤銷金鑰 {#6-revoke-the-key}

```bash
jq -n --arg key "$CLIENT_KEY" '{keys: [$key]}' |
curl --fail-with-body -sS -X POST "$LITELLM_API_BASE/key/delete" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @-
```

重複步驟 4 的補全請求。它現在必須驗證失敗。如果您執行多個 replica，請測試每個 replica 都拒絕該金鑰。團隊與模型仍可供其他應用程式使用。

## 當 YAML 與 API 變更相遇時 {#when-yaml-and-api-changes-meet}

自 v1.103.0 起，YAML 控制您在 `general_settings`、`router_settings`、`litellm_settings` 與 `environment_variables` 中宣告的每個設定。如果您嘗試變更那些設定，對 `/config/update` 或 `/config/field/update` 的呼叫會傳回 HTTP 400。請編輯並重新載入檔案，或將該設定從 YAML 移除，讓資料庫控制它。如果您移除該設定，已儲存的資料庫值可以再次生效。

模型使用不同的規則。與 YAML 模型具有相同 `model_name` 的資料庫模型會在其旁邊新增一個部署。它不會取代檔案的項目。請使用 `PATCH /model/{model_id}/update` 變更資料庫模型。YAML 模型請在其檔案中編輯。

在 v1.103.0 之前，資料庫設定優先於 YAML。儲存需求、重新整理行為與版本差異請參閱 [YAML 與資料庫設定](../configs.md#configyaml-vs-database-settings)。

## 管理請求的疑難排解 {#troubleshoot-a-management-request}

| 結果 | 檢查事項 |
| --- | --- |
| 驗證或權限錯誤 | 使用平台的管理憑證，檢查其角色與允許的路由，並確認它可以管理目標資源。 |
| 模型建立回報缺少資料庫儲存 | 連接 PostgreSQL 並在閘道上啟用 `STORE_MODEL_IN_DB`。 |
| 更新表示設定由設定檔控制 | 在變更請求前，檢查 YAML 所有權與閘道版本。 |
| 未知路由或被拒絕的欄位 | 將方法與 payload 與您所執行版本的 API schema 比對。即使 UI 或 YAML 有類似選項，也請檢查 API 支援。 |
| 請求未使用已儲存的變更 | 將資源讀回，檢查其設定重新整理或快取行為，並測試每個 replica。 |

如果請求仍失敗，請記錄閘道版本、端點、請求與回應。請從這些記錄中移除祕密。請註明資源是由 YAML 還是資料庫儲存。這些詳細資訊有助於您找出權限問題、由 YAML 控制的設定、不支援的操作或錯誤。
