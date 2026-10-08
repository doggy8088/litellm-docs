import { RequestFlowDiagram, RouterFlowDiagram, ImageFlowDiagram } from '@site/src/components/CloudArchitecture';

# 一個請求的生命週期 {#life-of-a-request}

## 高階架構 {#high-level-architecture}

<RequestFlowDiagram />

### 請求流程  {#request-flow}

1. **使用者送出請求**：流程在使用者向 LiteLLM Proxy Server（Gateway）送出請求時開始。

2. [**虛擬金鑰**](./virtual_keys)：在這個階段，會檢查請求中的 `Bearer` 代幣，以確保其有效且未超出預算。[這裡是每個請求執行的檢查清單](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/auth/auth_checks.py)
    - 2.1 檢查 Virtual Key 是否存在於 Redis Cache 或 In Memory Cache
    - 2.2 **如果不在快取中**，則在 DB 中查找 Virtual Key

3. **速率限制**：[https://github.com/BerriAI/litellm/blob/main/litellm/proxy/hooks/parallel_request_limiter_v3.py] 會檢查以下元件的 **速率限制（rpm/tpm）**：
    - 全域伺服器速率限制
    - Virtual Key 速率限制
    - 使用者速率限制
    - Team 限制

4. **LiteLLM `proxy_server.py`**：包含 `/chat/completions` 和 `/embeddings` 端點。對這些端點的請求會透過 LiteLLM Router 傳送

5. [**LiteLLM Router**](../routing)：LiteLLM Router 會處理 LLM API 部署的負載平衡、備援與重試。

6. [**litellm.completion() / litellm.embedding()**:](../index.md#litellm-python-sdk) litellm Python SDK 用於以 OpenAI API 格式呼叫 LLM（轉換與參數對應）

7. **請求後處理**：在回應傳回給用戶端後，會執行以下 **非同步** 任務：
   - [記錄到 Lunary、MLflow、LangFuse 或其他記錄目的地](./logging)
   - [parallel request limiter](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/hooks/parallel_request_limiter_v3.py) 會更新以下項目的 rpm/tpm 使用量：
        - 全域伺服器速率限制
        - Virtual Key 速率限制
        - 使用者速率限制
        - Team 限制
    - `_ProxyDBLogger` 會更新 LiteLLM 資料庫中的支出／使用量。[以下是每個請求在 DB 中追蹤的所有內容](https://github.com/BerriAI/litellm/blob/main/schema.prisma)

## 路由器：備援與重試 {#the-router-fallbacks-and-retries}

<RouterFlowDiagram />

上方步驟 5 會將請求交給 LiteLLM Router，其負責負載平衡、備援與重試。所有統一端點（`.completion`、`.embeddings` 等）都以相同方式流經它。

請求首先進入 `function_with_fallbacks`，它會以 try-except 包裝呼叫，以便在主要部署失敗時備援到另一個部署。接著會傳遞到 `function_with_retries`，它會再次包裝呼叫，並在請求失敗時，對同一模型群組中的可用部署進行重試。最後，`function_with_retries` 會呼叫像 `litellm.completion` 或 `litellm.embeddings` 這類基礎的 litellm 統一函式，實際向 LLM API 發出請求。

**model_group** 是一組共享相同 `model_name` 的 LLM API 部署，並可在其之間進行負載平衡。

## 圖片 URL 處理 {#image-url-handling}

<ImageFlowDiagram />

有些 LLM API 不接受圖片 URL，但接受 base64 字串。對於這些 API，LiteLLM 會偵測請求中的 URL，檢查目標 API 是否支援 URL；若不支援，則會下載圖片並改為將 base64 字串傳送給提供者。最多可將 10 張已轉換圖片快取於記憶體中，以降低重複呼叫的延遲，而單次下載上限為 50MB（可透過 `MAX_IMAGE_URL_DOWNLOAD_SIZE_MB` 設定）。

## 常見問題 {#frequently-asked-questions}

1. DB 交易是否與請求的生命週期綁定？
    - 否，DB 交易不會與請求的生命週期綁定。
    - 虛擬金鑰是否有效的檢查，若不在快取中，會依賴 DB 讀取。
    - 其他所有 DB 交易都會在背景工作中非同步執行
