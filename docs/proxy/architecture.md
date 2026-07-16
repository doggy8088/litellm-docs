import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 一個請求的生命週期 {#life-of-a-request}

## 高階架構 {#high-level-architecture}

<Image img={require('../../img/litellm_gateway.png')} style={{ width: '100%', maxWidth: '4000px' }} />

### 請求流程  {#request-flow}

1. **使用者送出請求**：流程在使用者向 LiteLLM Proxy Server（Gateway）送出請求時開始。

2. [**Virtual Keys**](../virtual_keys)：在此階段，會檢查請求中的 `Bearer` token，以確保其有效且未超出預算。[以下是每個請求執行的檢查清單](https://github.com/BerriAI/litellm/blob/ba41a72f92a9abf1d659a87ec880e8e319f87481/litellm/proxy/auth/auth_checks.py#L43)
    - 2.1 檢查 Virtual Key 是否存在於 Redis 快取或 In Memory 快取中
    - 2.2 **若不在快取中**，則在 DB 中查詢 Virtual Key

3. **Rate Limiting**：[MaxParallelRequestsHandler](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/hooks/parallel_request_limiter.py) 會檢查下列元件的 **速率限制（rpm/tpm）**：
    - 全域伺服器速率限制
    - Virtual Key 速率限制
    - 使用者速率限制
    - Team 限制

4. **LiteLLM `proxy_server.py`**：包含 `/chat/completions` 和 `/embeddings` 端點。對這些端點的請求會透過 LiteLLM Router 傳送

5. [**LiteLLM Router**](../routing)：LiteLLM Router 會處理 LLM API 部署的負載平衡、備援與重試。

6. [**litellm.completion() / litellm.embedding()**:](../index#litellm-python-sdk) litellm Python SDK 用於以 OpenAI API 格式呼叫 LLM（轉換與參數對應）

7. **請求後處理**：在回應傳回給用戶端之後，會執行下列 **非同步** 工作：
   - [記錄到 Lunary、MLflow、LangFuse 或其他記錄目的地](./logging)
   - [MaxParallelRequestsHandler](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/hooks/parallel_request_limiter.py) 會更新以下項目的 rpm/tpm 使用量：
        - 全域伺服器速率限制
        - Virtual Key 速率限制
        - 使用者速率限制
        - Team 限制
    - `_ProxyDBLogger` 會更新 LiteLLM 資料庫中的支出 / 使用量。[這是每個請求在 DB 中追蹤的所有內容](https://github.com/BerriAI/litellm/blob/ba41a72f92a9abf1d659a87ec880e8e319f87481/schema.prisma#L172)

## 常見問題 {#frequently-asked-questions}

1. DB 交易是否與請求的生命週期綁定？
    - 否，DB 交易不會與請求的生命週期綁定。
    - 虛擬金鑰是否有效的檢查，若不在快取中，會依賴 DB 讀取。
    - 其他所有 DB 交易都會在背景工作中非同步執行
