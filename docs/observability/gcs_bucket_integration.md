import Image from '@theme/IdealImage';

# Google Cloud Storage {#google-cloud-storage}

將 LLM 記錄寫入 [Google Cloud Storage Buckets](https://cloud.google.com/storage?hl=en)

:::info

✨ 這是僅限 Enterprise 的功能 [在此開始使用 Enterprise](https://enterprise.litellm.ai/demo)

:::

### 使用方式 {#usage}

1. 將 `gcs_bucket` 加到 LiteLLM Config.yaml
```yaml
model_list:
- litellm_params:
    api_base: https://openai-function-calling-workers.tasslexyz.workers.dev/
    api_key: my-fake-key
    model: openai/my-fake-model
  model_name: fake-openai-endpoint

litellm_settings:
  callbacks: ["gcs_bucket"] # 👈 KEY CHANGE # 👈 KEY CHANGE
```

2. 設定必要的環境變數

```shell
GCS_BUCKET_NAME="<your-gcs-bucket-name>"
GCS_PATH_SERVICE_ACCOUNT="/Users/ishaanjaffer/Downloads/adroit-crow-413218-a956eef1a2a8.json" # Add path to service account.json
```

3. 啟動 Proxy

```
litellm --config /path/to/config.yaml
```

4. 測試看看！

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "fake-openai-endpoint",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ],
    }
'
```


## GCS Bucket 上預期的記錄 {#expected-logs-on-gcs-buckets}

<Image img={require('../../img/gcs_bucket.png')} />

### GCS Bucket 上記錄的欄位 {#fields-logged-on-gcs-buckets}

[**標準的 logging object 會記錄到 GCS Bucket**](../proxy/logging)

## 從 Google Cloud Console 取得 `service_account.json` {#getting-service_accountjson-from-google-cloud-console}

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 搜尋 IAM 與管理員
3. 點選 Service Accounts
4. 選取一個 Service Account
5. 點選 'Keys' -> Add Key -> Create New Key -> JSON
6. 儲存 JSON 檔案，並將路徑加到 `GCS_PATH_SERVICE_ACCOUNT`

## 支援與創辦人交流 {#support--talk-to-founders}

- [預約 Demo 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
