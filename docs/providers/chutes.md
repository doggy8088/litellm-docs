# Chutes {#chutes}

## 總覽 {#overview}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | Chutes 是一個雲原生 AI 部署平台，讓您能使用與 OpenAI 相容的 API，透過針對 vLLM 和 SGLang 等熱門框架的預先建置範本來部署、執行與擴展 LLM 應用程式。 |
| LiteLLM 上的提供者路由 | `chutes/` |
| 提供者文件連結 | [Chutes 網站 ↗](https://chutes.ai) |
| 基礎 URL | `https://llm.chutes.ai/v1/` |
| 支援的操作 | [`/chat/completions`](#sample-usage), Embeddings |

<br />

## 什麼是 Chutes？ {#what-is-chutes}

Chutes 是一個強大的 AI 部署與服務平台，提供：
- **預先建置範本**：可立即使用的 vLLM、SGLang、擴散模型與 embeddings 設定
- **與 OpenAI 相容的 API**：使用標準 OpenAI SDK 與用戶端
- **多 GPU 擴展**：支援跨多個 GPU 的大型模型
- **串流回應**：即時模型輸出
- **自訂設定**：針對您的特定需求覆寫任何參數
- **效能最佳化**：預先設定的最佳化設定

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["CHUTES_API_KEY"] = ""  # your Chutes API key
```

從 [chutes.ai](https://chutes.ai) 取得您的 Chutes API 金鑰。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Chutes Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["CHUTES_API_KEY"] = ""  # your Chutes API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# Chutes call
response = completion(
    model="chutes/model-name",  # Replace with actual model name
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Chutes Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["CHUTES_API_KEY"] = ""  # your Chutes API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# Chutes call with streaming
response = completion(
    model="chutes/model-name",  # Replace with actual model name
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export CHUTES_API_KEY=""
```

### 2. 啟動 proxy {#2-start-the-proxy}

```yaml
model_list:
  - model_name: chutes-model
    litellm_params:
      model: chutes/model-name  # Replace with actual model name
      api_key: os.environ/CHUTES_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Chutes 支援所有標準的 OpenAI 相容參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。具有 'role' 與 'content' 的訊息物件陣列 |
| `model` | string | **必要**。模型 ID 或 HuggingFace 模型識別碼 |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。取樣溫度 |
| `top_p` | float | 選用。核取樣參數 |
| `max_tokens` | integer | 選用。要產生的最大 tokens 數量 |
| `frequency_penalty` | float | 選用。對常見 tokens 加以懲罰 |
| `presence_penalty` | float | 選用。根據出現次數對 tokens 加以懲罰 |
| `stop` | string/array | 選用。停止序列 |
| `tools` | array | 選用。可用工具/函式清單 |
| `tool_choice` | string/object | 選用。控制工具/函式呼叫 |
| `response_format` | object | 選用。回應格式規格 |

## 支援的框架 {#support-frameworks}

Chutes 為熱門 AI 框架提供最佳化範本：

### vLLM（高效能 LLM 服務） {#vllm-high-performance-llm-serving}
- 與 OpenAI 相容的端點
- 支援多 GPU 擴展
- 進階最佳化設定
- 最適合正式環境工作負載

### SGLang（進階 LLM 服務） {#sglang-advanced-llm-serving}
- 結構化生成能力
- 進階功能與控制
- 自訂設定選項
- 最適合複雜使用情境

### 擴散模型（圖片生成） {#diffusion-models-image-generation}
- 預先設定的圖片生成範本
- 針對最佳結果最佳化的設定
- 支援熱門擴散模型

### Embedding 模型 {#embedding-models}
- 文字 embedding 範本
- 向量搜尋最佳化
- 支援熱門 embedding 模型

## 驗證 {#authentication}

Chutes 支援多種驗證方式：
- 透過 `X-API-Key` 標頭的 API 金鑰
- 透過 `Authorization` 標頭的 Bearer token

LiteLLM 範例（使用環境變數）：
```python
os.environ["CHUTES_API_KEY"] = "your-api-key"
```

## 效能最佳化 {#performance-optimization}

Chutes 提供硬體選擇與最佳化：
- **小型模型（7B-13B）**：1 張 GPU，配備 24GB VRAM
- **中型模型（30B-70B）**：4 張 GPU，每張配備 80GB VRAM
- **大型模型（100B+）**：8 張 GPU，每張配備 140GB+ VRAM

可使用引擎最佳化參數來微調效能。

## 部署選項 {#deployment-options}

Chutes 提供彈性的部署：
- **快速設定**：使用預先建置範本即可立即部署
- **自訂映像檔**：使用自訂 Docker 映像檔部署
- **擴展**：設定最大執行個體數與自動擴展門檻
- **硬體**：選擇特定 GPU 類型與設定

## 其他資源 {#additional-resources}

- [Chutes 文件](https://chutes.ai/docs)
- [Chutes 入門指南](https://chutes.ai/docs/getting-started/running-a-chute)
- [Chutes API 參考](https://chutes.ai/docs/sdk-reference)
