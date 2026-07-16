# Google 金鑰管理服務 {#google-key-management-service}

:::info

✨ **這是企業版功能**

[企業版定價](https://www.litellm.ai/#pricing)

[請點此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

在 proxy 上使用來自 Google KMS 的加密金鑰

步驟 1. 將金鑰加入 env 
```
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
export GOOGLE_KMS_RESOURCE_NAME="projects/*/locations/*/keyRings/*/cryptoKeys/*"
export PROXY_DATABASE_URL_ENCRYPTED=b'\n$\x00D\xac\xb4/\x8e\xc...'
```

步驟 2: 更新設定

```yaml
general_settings:
  key_management_system: "google_kms"
  database_url: "os.environ/PROXY_DATABASE_URL_ENCRYPTED"
  master_key: sk-1234
```

步驟 3: 啟動 + 測試 proxy

```
$ litellm --config /path/to/config.yaml
```

並在另一個終端機中
```
$ litellm --test 
```

[快速測試 Proxy](../proxy/user_keys)
