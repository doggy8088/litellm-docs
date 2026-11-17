---
title: 在 Admin UI 中設定 LiteLLM
sidebar_label: UI
description: 在 LiteLLM Admin UI 中設定模型、憑證、虛擬金鑰、預算與路由。了解哪些設定由 config.yaml 控制。
---

# 在 Admin UI 中設定 LiteLLM {#configure-litellm-in-the-admin-ui}

{/* keep-version-note */}

使用 Admin UI 從瀏覽器管理正在運行的 LiteLLM 閘道。新增模型、更新提供者憑證、建立虛擬金鑰，並變更支援的設定。

## 開始之前 {#before-you-start}

將 LiteLLM 連接到 PostgreSQL 並設定 `LITELLM_MASTER_KEY`。這兩個步驟請參閱[資料庫設定](../virtual_keys.md#setup)。全新安裝請依照 [Quickstart](../docker_quick_start.md)。

開啟 `<your-proxy-url>/ui` 並登入。使用 `proxy_admin` 帳戶設定閘道。其他[角色](../access_control.md#global-proxy-roles) 具有較少的權限。[Admin UI 指南](../ui.md) 涵蓋登入、管理員帳戶與存取設定。

## 將模型與設定儲存在資料庫中 {#save-models-and-settings-in-the-database}

在 proxy 環境中設定 `STORE_MODEL_IN_DB="True"`，或在 `config.yaml` 中設定 `general_settings.store_model_in_db: true`。閘道接著會將 UI 模型與支援的設定儲存在資料庫中。它會在重新啟動後載入已儲存的模型。共用該資料庫的其他執行個體也可以使用它們。

儲存提供者憑證後，請勿變更 `LITELLM_SALT_KEY`。如果您變更它，LiteLLM 將無法解密那些憑證。設定與執行階段儲存切換請參閱[資料庫模型儲存](../model_management.md#database-vs-configyaml-models)。

## 常見工作 {#common-tasks}

| 工作 | 指南 |
| --- | --- |
| 新增提供者與模型 | [新增您的第一個模型](../docker_quick_start.md#3-add-your-first-model) |
| 編輯模型、變更定價或測試其連線 | [模型管理](../model_management.md#inspect-and-edit-a-model) |
| 在模型之間重複使用提供者憑證 | [可重複使用的提供者憑證](../model_management.md#reusable-provider-credentials) |
| 為應用程式建立虛擬金鑰 | [建立虛擬金鑰](../docker_quick_start.md#5-create-a-virtual-key) |
| 設定團隊的預算 | [團隊預算](../team_budgets.md#setting-monthly-team-budgets) |
| 為金鑰或團隊設定備援、重試與逾時 | [金鑰與團隊路由器設定](../keys_teams_router_settings.md) |
| 查看閘道設定的意義與預設值 | [設定參考](../config_settings.md) |

模型變更後，請在其詳細資訊頁面上使用 **Test Connection**，或[在 Playground 中傳送訊息](../docker_quick_start.md#4-send-a-test-message)。資料庫模型變更會套用到新請求，無需重新啟動 proxy。Proxy 會透過其設定重新整理載入已儲存的閘道設定。請參閱 [config.yaml 與資料庫設定](../configs.md#configyaml-vs-database-settings)。

## 當設定同時存在於 YAML 中 {#when-a-setting-is-also-in-yaml}

在 **v1.103.0 及更新版本**上，`config.yaml` 控制它在 `general_settings`、`router_settings`、`litellm_settings` 與 `environment_variables` 中宣告的鍵。YAML 值優先。如果您嘗試變更它，UI 會傳回 HTTP 400。請編輯檔案並重新啟動或重新載入 proxy。若要讓資料庫控制該鍵，請將它從 YAML 移除。已儲存的資料庫值會在您移除該鍵時生效。

此規則套用於那四個設定區段。Proxy 會提供 `model_list` 中的模型與資料庫模型。同名的資料庫模型會新增一個部署。它不會取代 YAML 項目。YAML 模型請在其檔案中編輯或刪除。請選擇一個[模型真實來源](../model_management.md#choose-one-source-of-truth-for-models)。

在 v1.103.0 之前，已儲存的資料庫設定優先於 YAML。依版本的詳細資訊請參閱 [config.yaml 與資料庫設定](../configs.md#configyaml-vs-database-settings)。
