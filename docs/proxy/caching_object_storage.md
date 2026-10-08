---
title: S3 and GCS Cache
description: 以 S3 或 GCS 儲存貯體支援 LiteLLM proxy 的回應快取。
---

# S3 和 GCS 快取 {#s3-and-gcs-cache}

物件儲存以延遲換取耐久性與成本。儲存貯體在每一次
查詢上都比 Redis 慢得多，但它很便宜、可在每個複本間共享，而且在重新啟動後仍可運作。當快取
命中值得保存，而且幾百毫秒的查詢時間不是問題時，請使用它。

## S3 {#s3}

### 步驟 1：將 `cache` 新增到 config.yaml {#step-1-add-cache-to-the-configyaml}

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True
  cache_params: # set cache params for s3
    type: s3
    s3_bucket_name: cache-bucket-litellm # AWS Bucket Name for S3
    s3_region_name: us-west-2 # AWS Region Name for S3
    s3_aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID # us os.environ/<variable name> to pass environment variables. This is AWS Access Key ID for S3
    s3_aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY # AWS Secret Access Key for S3
    s3_endpoint_url: https://s3.amazonaws.com # [OPTIONAL] S3 endpoint URL, if you want to use Backblaze/cloudflare s3 buckets
```

### 步驟 2：使用 config 執行 proxy {#step-2-run-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

## GCS {#gcs}

### 步驟 1：將 `cache` 新增到 config.yaml {#step-1-add-cache-to-the-configyaml-1}

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True
  cache_params: # set cache params for gcs
    type: gcs
    gcs_bucket_name: cache-bucket-litellm # GCS Bucket Name for caching
    gcs_path_service_account: os.environ/GCS_PATH_SERVICE_ACCOUNT # use os.environ/<variable name> to pass environment variables. This is the path to your GCS service account JSON file
    gcs_path: cache/ # [OPTIONAL] GCS path prefix for cache objects
```

### 步驟 2：將 GCS 憑證新增到 .env {#step-2-add-gcs-credentials-to-env}

在您的 .env 檔案中設定 GCS 環境變數：

```shell
GCS_BUCKET_NAME="your-gcs-bucket-name"
GCS_PATH_SERVICE_ACCOUNT="/path/to/service-account.json"
```

### 步驟 3：使用 config 執行 proxy {#step-3-run-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```
