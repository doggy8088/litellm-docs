# Azure Key Vault {#azure-key-vault}

:::info

✨ **這是企業版功能**

[企業版價格](https://www.litellm.ai/#pricing)

[點此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

## 與 LiteLLM Proxy Server 搭配使用 {#usage-with-litellm-proxy-server}

1. 安裝 Proxy 依賴項目 
```bash
uv tool install 'litellm[proxy]' 'litellm[extra_proxy]'
```

2. 將 Azure 詳細資料儲存在您的環境中
```bash 
export["AZURE_CLIENT_ID"]="your-azure-app-client-id"
export["AZURE_CLIENT_SECRET"]="your-azure-app-client-secret"
export["AZURE_TENANT_ID"]="your-azure-tenant-id"
export["AZURE_KEY_VAULT_URI"]="your-azure-key-vault-uri"
```

3. 加入 proxy config.yaml 
```yaml
model_list: 
    - model_name: "my-azure-models" # model alias 
        litellm_params:
            model: "azure/<your-deployment-name>"
            api_key: "os.environ/AZURE-API-KEY" # reads from key vault - get_secret("AZURE_API_KEY")
            api_base: "os.environ/AZURE-API-BASE" # reads from key vault - get_secret("AZURE_API_BASE")

general_settings:
  key_management_system: "azure_key_vault"
```

您現在可以透過啟動您的 proxy 來測試這項功能： 
```bash
litellm --config /path/to/config.yaml
```

[快速測試 Proxy](../proxy/quick_start#using-litellm-proxy---curl-request-openai-package-langchain-langchain-js)
