---
title: 啟用您的授權
description: 在每個 LiteLLM 閘道執行個體上設定 LITELLM_LICENSE，確認閘道顯示 Enterprise Edition，並了解授權金鑰啟用了哪些功能。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 啟用您的授權 {#activate-your-license}

LiteLLM Enterprise 是您目前執行的閘道映像的一把授權金鑰。這把金鑰會啟用 Enterprise 功能。您不需要安裝不同的映像，也不需要遷移資料。

閘道會先使用映像內附的公開金鑰離線檢查授權金鑰的簽章。未通過該檢查的金鑰（例如較舊的金鑰）接著會送到 LiteLLM 授權伺服器檢查。當您購買授權或開始 [30 天試用](https://www.litellm.ai/enterprise#trial) 時，LiteLLM 會把金鑰給您。

## 設定授權金鑰 {#set-the-license-key}

在每個閘道執行個體的環境中設定 `LITELLM_LICENSE`。然後重新啟動每個執行個體。

<Tabs>
<TabItem value="env" label=".env file">

```env
LITELLM_LICENSE="eyJ..."
```

</TabItem>
<TabItem value="docker" label="Docker">

```bash
docker run \
  -e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
  -e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
  -e LITELLM_LICENSE="eyJ..." \
  -e STORE_MODEL_IN_DB=True \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm:latest
```

</TabItem>
<TabItem value="kubernetes" label="Kubernetes">

將金鑰放入您的 Deployment 透過 `envFrom` 載入的 Secret 中：

```bash
kubectl create secret generic litellm-secrets \
  --from-literal=LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>" \
  --from-literal=LITELLM_SALT_KEY="sk-<paste-a-long-random-salt>" \
  --from-literal=LITELLM_LICENSE="eyJ..." \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/litellm"
```

</TabItem>
<TabItem value="helm" label="Helm">

建立一個 Secret，並在您的 values 檔案中將其列入 `environmentSecrets`：

```bash
kubectl create secret generic litellm-env-secret \
  --from-literal=LITELLM_LICENSE="eyJ..."
```

```yaml title="values.yaml"
environmentSecrets:
  - litellm-env-secret
```

</TabItem>
</Tabs>

您也可以在 `general_settings` 中將金鑰設為 `litellm_license`，或將加密後的金鑰保存在 `LITELLM_SECRET_AWS_KMS_LITELLM_LICENSE` 供 AWS KMS 使用。請參閱[設定參考](../proxy/config_settings.md)。

若您在多個區域執行閘道，請在每個區域使用同一把金鑰。每個執行個體都會獨立檢查金鑰。一份授權涵蓋共用同一個資料庫的所有區域。請參閱[多區域部署](../proxy/multi_region.md#licensing-across-regions)。

## 驗證授權 {#verify-the-license}

1. 在瀏覽器中開啟 `http://<your-proxy-host>:<port>/`。
2. 在 API 文件頁面的說明中找到 **Enterprise Edition**。
3. 若頁面未顯示 **Enterprise Edition**，請確認金鑰正確且未過期。
4. 完整重新啟動所有閘道執行個體，然後再次檢查。

若您設定了 `NO_DOCS`，閘道不會顯示 API 文件頁面。請在停用 API 文件之前完成檢查。請參閱[限制所有 API 文件](../proxy/configs.md#restrict-all-api-documentation-for-productionair-gapped-deployments)。

## 授權啟用的功能 {#what-the-license-enables}

總覽頁面上的[完整功能清單](../enterprise.md#full-feature-list)列出這把金鑰啟用的所有功能。每個功能頁面的頂端都有 **Enterprise feature** 註記。在側邊欄中，這些頁面帶有 **Enterprise** 標籤。

部分功能有特殊條件：

- Admin UI 的 SSO 在 5 位使用者以內免費。使用者更多時，您必須持有授權。請參閱 [Admin UI 的 SSO](../proxy/admin_ui_sso.md)。
- 當閘道持有授權時，稽核記錄預設開啟。請參閱[稽核記錄](../proxy/audit_logs.md)。
- 部分防護欄整合需要授權。請參閱[哪些防護欄需要授權？](../enterprise.md#guardrails-oss-vs-enterprise)。
- 帶有 **Free Enterprise feature** 註記的頁面不需要授權。範例包括[受管理檔案](../proxy/litellm_managed_files.md)與[受管理批次](../proxy/managed_batches.md)。
- [可計費請求計量](../proxy/billing_metrics.md)需要授權金鑰，以及 LiteLLM 導入流程提供的計量憑證。

## 後續步驟 {#next-steps}

- [從 OSS 遷移](./moving_from_oss.md)：您目前執行的閘道的檢查清單。
- [正式環境導入](../learn/enterprise_quickstart.md)：新部署的五個步驟。
