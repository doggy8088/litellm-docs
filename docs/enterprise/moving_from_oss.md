---
title: 從 OSS 遷移
description: 將開源 LiteLLM 閘道遷移到 LiteLLM Enterprise。映像、config.yaml 與版本線維持不變。在向公司所有團隊開放閘道之前，請先使用這份檢查清單。
---

# 從 OSS 遷移 {#moving-from-oss}

遷移到 Enterprise 時，您目前執行的一切都維持不變：映像、`config.yaml` 檔案與版本線。您只需為現有的閘道加上一把授權金鑰。您的金鑰、團隊、模型與支出資料都留在您的資料庫中。

在向公司所有團隊開放閘道之前，請先完成本頁面的檢查清單。多數項目對開源部署來說也是良好的實務。

## 預檢檢查清單 {#pre-flight-checklist}

### 1. 執行 Postgres 與 Redis {#1-run-postgres-and-redis}

Admin UI、虛擬金鑰、MCP 與代理程式註冊表以及預算追蹤的資料都保存在 Postgres 中。在每個閘道執行個體上設定 `DATABASE_URL`。

當您執行多個閘道執行個體或多個 worker 時，請執行 Redis 7.0 或更新版本。Redis 在執行個體之間共用速率限制計數器、預算與快取命中。沒有 Redis 時，每個執行個體獨立執行限制。請參閱 [Redis 的需求](../proxy/redis_requirements.md) 與[正式環境最佳實務](../proxy/prod.md#redis)。

### 2. 加入授權金鑰 {#2-add-the-license-key}

在每個閘道執行個體上設定 `LITELLM_LICENSE` 並重新啟動執行個體。然後確認 API 文件頁面顯示 **Enterprise Edition**。請參閱[啟用您的授權](./activate.md)。

### 3. 在公開 Admin UI 之前先設定 SSO {#3-set-up-sso-before-you-expose-the-admin-ui}

預設情況下，Admin UI 接受以 `UI_USERNAME` 與 `UI_PASSWORD` 登入，或以 master key 登入。所有知道這些值的人都能以代理管理員身分登入，且稽核記錄無法辨識登入者。

1. 連接您的身分提供者。請參閱 [Admin UI 的 SSO](../proxy/admin_ui_sso.md)。
2. 確認每位管理員都能以 SSO 登入。
3. 在 `general_settings` 中設定 `disable_env_credential_login: true`。
4. 重新啟動閘道。

請參閱[停用環境憑證登入](../proxy/security_best_practices.md#disable-environment-credential-login-to-the-admin-ui)。

### 4. 輪替 master key {#4-rotate-the-master-key}

若代理管理員以外的人知道 master key，請在上線正式環境之前設定新的 master key。

若您設定了 `LITELLM_SALT_KEY`，master key 就只是管理員憑證。此時您可以更換金鑰並重新啟動執行個體。若您未設定 salt key，master key 同時也會加密儲存的憑證。在這種情況下，請使用完整的輪替程序。請參閱[輪替 master key](../proxy/master_key_rotations.md)。

加入模型之後，不要變更 `LITELLM_SALT_KEY`。請參閱[設定 salt key](../proxy/prod.md#set-the-salt-key)。

### 5. 強化部署 {#5-harden-the-deployment}

固定確切的版本或映像摘要，並在部署前[驗證映像簽章](../proxy/docker_image_security.md)。為您的 ingress 設定 `trusted_proxy_ranges`。給應用程式有範圍限制的虛擬金鑰，而不是 master key。請參閱[安全性最佳實務](../proxy/security_best_practices.md)。

### 6. 在邀請團隊之前先設定預算 {#6-set-budgets-before-you-invite-the-teams}

為每個團隊設定預算，並設定軟性預算警示，讓團隊在達到上限前收到電子郵件。請參閱[預算與速率限制](../proxy/users.md)、[團隊預算](../proxy/team_budgets.md)與[軟性預算警示](../proxy/ui_team_soft_budget_alerts.md)。

## 後續步驟 {#next-steps}

- [正式環境導入](../learn/enterprise_quickstart.md)：從部署到分攤費用的五個步驟。
- [版本支援](./version_support.md)：LiteLLM 支援的發行版本線。
- [支援與 SLA](./support.md)：如何向 LiteLLM 工程師取得協助。
