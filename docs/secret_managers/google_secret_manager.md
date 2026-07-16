# Google Secret Manager {#google-secret-manager}

:::info

✨ **這是企業功能**

[企業定價](https://www.litellm.ai/#pricing)

[請點此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

支援 [Google Secret Manager](https://cloud.google.com/security/products/secret-manager)

1. 將 Google Secret Manager 詳細資料儲存在您的環境中

```shell 
GOOGLE_SECRET_MANAGER_PROJECT_ID="your-project-id-on-gcp" # example: adroit-crow-413218
```

選用參數

```shell
export GOOGLE_SECRET_MANAGER_REFRESH_INTERVAL = ""            # (int) defaults to 86400
export GOOGLE_SECRET_MANAGER_ALWAYS_READ_SECRET_MANAGER = ""  # (str) set to "true" if you want to always read from google secret manager without using in memory caching. NOT RECOMMENDED in PROD
```

2. 新增至 proxy config.yaml 
```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      api_key: os.environ/OPENAI_API_KEY # this will be read from Google Secret Manager

general_settings:
  key_management_system: "google_secret_manager"
```

您現在可以透過啟動您的 proxy 來測試這一點： 
```bash
litellm --config /path/to/config.yaml
```

[快速測試 Proxy](../proxy/quick_start#using-litellm-proxy---curl-request-openai-package-langchain-langchain-js)
