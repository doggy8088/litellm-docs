---
slug: valkey_semantic_caching
title: "Valkey 與 AWS ElastiCache 上的語意快取"
date: 2026-06-17T10:00:00
authors:
  - yassin
description: "LiteLLM 現已支援在執行 valkey-search 模組的 Valkey 叢集上進行語意提示快取，包括 AWS ElastiCache for Valkey，且無需 RediSearch、Redis Stack 或 Qdrant。"
tags: [caching, valkey, elasticache, semantic cache]
hide_table_of_contents: false
---

LiteLLM 現已支援在 Valkey 上進行語意提示快取。如果您執行的是搭載 [valkey-search](https://github.com/valkey-io/valkey-search) 模組的 Valkey 叢集（包括 AWS ElastiCache for Valkey），您可以透過 `type: valkey-semantic` 將 LiteLLM 指向它，並取得基於嵌入的快取命中，而無需架設 Redis Stack 或獨立的向量資料庫。

{/* truncate */}

## 為什麼這很重要 {#why-this-matters}

語意快取會依據提示的語意而非完全相同的字串比對來儲存回應，因此經過改寫的請求仍可命中快取並略過付費模型呼叫。直到現在，LiteLLM 的語意快取一直建立在 RedisVL 之上，而 RedisVL 依賴 RediSearch 的 `FT.*` 向量 API。Redis OSS 或 ElastiCache for Redis OSS 上都沒有 RediSearch，這使得團隊必須架設 Redis Stack 或 Qdrant 才能使用語意快取。隨著 Redis 轉向 source-available 授權，更多團隊改為架設 Valkey，而 ElastiCache for Valkey 也成為常見的受管目標。

Valkey 透過 valkey-search 模組提供向量搜尋，而 ElastiCache for Valkey 也將其公開。LiteLLM 的新後端會透過 Redis 協定直接與 valkey-search 溝通，因此 ElastiCache for Valkey 上的語意快取不需要 RediSearch、Redis Stack 或 Qdrant 介入。

## 運作方式 {#how-it-works}

`valkey-semantic` 後端會根據 valkey-search 支援的欄位型別建立自己的向量索引，一個可隔離每個快取金鑰範圍的 tag 欄位，以及一個用於提示嵌入的 HNSW 向量欄位，接著在查詢時執行 KNN 查詢，當 cosine similarity 超過您的閾值時回傳已快取的回應。提示擷取、嵌入生成與回應處理都與現有的 Redis 語意快取共用，因此行為會與 Redis 路徑一致，包括每個請求的範圍隔離。連線會從 `VALKEY_HOST`、`VALKEY_PORT` 與 `VALKEY_PASSWORD` 解析，並回退到 `REDIS_*` 對應項目，同時也支援用於 IAM 或無驗證設定的無密碼叢集。

## 開始使用 {#get-started}

將快取加入您的 `config.yaml`：

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: valkey-semantic
    host: os.environ/VALKEY_HOST
    port: os.environ/VALKEY_PORT
    valkey_semantic_cache_embedding_model: openai-embedding
    similarity_threshold: 0.8
```

若是啟用傳輸中加密的 ElastiCache，請透過 `cache_params.redis_url` 傳入 `rediss://` URL，而不是主機與連接埠。若要在本機嘗試 valkey-search，內建映像檔已備妥該模組：

```shell
docker run -d -p 6379:6379 valkey/valkey-bundle:8.1
```

請參閱 [快取文件](https://docs.litellm.ai/docs/proxy/caching) 以取得完整設定，包括 SDK 使用方式與參數參考。
