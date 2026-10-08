# GigaChat {#gigachat}

GigaChat 的通透傳遞端點 - 以原生格式呼叫提供者特定端點（不進行翻譯）。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 支援 `/chat/completions` 和 `/embeddings` |
| 記錄 | ✅ | 可跨所有整合運作 |
| 串流 | ✅ | |

只要將 `https://gigachat.devices.sberbank.ru/api/v1` 替換為 `LITELLM_PROXY_BASE_URL/gigachat`

## 快速開始 {#quick-start}

1. 將您的 GigaChat 憑證加入環境變數

```bash
export GIGACHAT_CREDENTIALS="your-authorization-key"

# Optional: defaults to GIGACHAT_API_PERS
export GIGACHAT_SCOPE="GIGACHAT_API_PERS"
```

除了憑證之外，您也可以直接使用 `GIGACHAT_ACCESS_TOKEN` 提供預先核發的權杖。

:::info

GigaChat API 使用來自 Russian Trusted Root CA 的憑證提供服務，而多數系統預設不信任該憑證鏈。您可以選擇 [安裝憑證鏈](https://developers.sber.ru/docs/ru/gigachat/certificates) 或在啟動 proxy 時加上 `ssl_verify: false`。

:::

2. 啟動 LiteLLM Proxy

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/gigachat/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "GigaChat-2",
    "messages": [{"role": "user", "content": "Hello!"}]
}'
```

## 範例 {#examples}

`http://0.0.0.0:4000/gigachat` 之後的任何內容都會被視為提供者特定路由，並依此處理。

主要變更：

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://gigachat.devices.sberbank.ru/api/v1`          | `http://0.0.0.0:4000/gigachat` (LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000")      |
| `bearer $GIGACHAT_ACCESS_TOKEN`                                 | `bearer anything`（如果 proxy 上已設定 Virtual Keys，請使用 `bearer LITELLM_VIRTUAL_KEY`）                    |

### **範例 1：聊天完成（串流）** {#example-1-chat-completions-streaming}

```bash
curl -L -X POST 'http://0.0.0.0:4000/gigachat/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "GigaChat-2",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
}'
```

### **範例 2：嵌入** {#example-2-embeddings}

```bash
curl -L -X POST 'http://0.0.0.0:4000/gigachat/embeddings' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "EmbeddingsGigaR",
    "input": ["Hello!"]
}'
```

### **範例 3：列出模型** {#example-3-list-models}

```bash
curl -L -X GET 'http://0.0.0.0:4000/gigachat/models' \
-H "Authorization: Bearer $LITELLM_API_KEY"
```
