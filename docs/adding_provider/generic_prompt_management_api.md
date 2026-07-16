# [BETA] Generic Prompt Management API - 無需 PR 即可整合 {#beta-generic-prompt-management-api---integrate-without-a-pr}

## 問題 {#the-problem}

身為提示管理提供者，傳統上與 LiteLLM 整合需要：
- 向 LiteLLM 儲存庫提交 PR
- 等待審查與合併
- 在 LiteLLM 的程式碼基底中維護特定提供者的程式碼
- 為您 API 的變更更新整合

## 解決方案 {#the-solution}

**Generic Prompt Management API** 讓您只要實作一個簡單的 API 端點，就能**立即**與 LiteLLM 整合。無需 PR。

### 主要優點 {#key-benefits}

1. **無需 PR** - 立即部署並整合
3. **簡單合約** - 一個 GET 端點，標準 JSON 回應
4. **變數替換** - 支援使用 `{variable}` 語法的提示變數
5. **自訂參數** - 透過設定傳遞提供者特定的查詢參數
6. **完全控制** - 您擁有並維護自己的提示管理 API
7. **模型與參數覆寫** - 可選擇從您的提示中覆寫模型與參數

## 3 步驟快速開始 {#get-started-in-3-steps}

### 步驟 1：設定 LiteLLM {#step-1-configure-litellm}

加入到您的 `config.yaml`：

```yaml
prompts:
  - prompt_id: "simple_prompt"
    litellm_params:
      prompt_integration: "generic_prompt_management"
      api_base: http://localhost:8080
      api_key: os.environ/YOUR_API_KEY
```

### 步驟 2：實作您的 API 端點 {#step-2-implement-your-api-endpoint}

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("/beta/litellm_prompt_management")
async def get_prompt(prompt_id: str):
    return {
        "prompt_id": prompt_id,
        "prompt_template": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Help me with {task}"}
        ],
        "prompt_template_model": "gpt-4",
        "prompt_template_optional_params": {"temperature": 0.7}
    }
```

### 步驟 3：在您的應用程式中使用 {#step-3-use-in-your-app}

```python
from litellm import completion

response = completion(
    model="gpt-4",
    prompt_id="simple_prompt",
    prompt_variables={"task": "data analysis"},
    messages=[{"role": "user", "content": "I have sales data"}]
)
```

就這樣！LiteLLM 會抓取您的提示、套用變數，並送出請求

## API 合約 {#api-contract}

### 端點 {#endpoint}

實作 `GET /beta/litellm_prompt_management`

### 請求格式 {#request-format}

您的端點將會收到帶有查詢參數的 GET 請求：

```
GET /beta/litellm_prompt_management?prompt_id={prompt_id}&{custom_params}
```

**查詢參數：**
- `prompt_id`（必填）：要抓取的提示 ID
- 自訂參數：您在 `provider_specific_query_params` 中設定的任何額外參數

**範例：**
```
GET /beta/litellm_prompt_management?prompt_id=hello-world-prompt-2bac&project_name=litellm&slug=hello-world-prompt-2bac
```

### 回應格式 {#response-format}

```json
{
  "prompt_id": "hello-world-prompt-2bac",
  "prompt_template": [
    {
      "role": "system",
      "content": "You are a helpful assistant specialized in {domain}."
    },
    {
      "role": "user",
      "content": "Help me with {task}"
    }
  ],
  "prompt_template_model": "gpt-4",
  "prompt_template_optional_params": {
    "temperature": 0.7,
    "max_tokens": 500,
    "top_p": 0.9
  }
}
```

**回應欄位：**
- `prompt_id`（字串，必填）：提示的 ID
- `prompt_template`（陣列，必填）：OpenAI 格式訊息陣列，可包含 `{variable}` 預留位置
- `prompt_template_model`（字串，可選）：此提示要使用的模型（除非 `ignore_prompt_manager_model: true`，否則會覆寫用戶端模型）
- `prompt_template_optional_params`（物件，可選）：其他參數，例如 temperature、max_tokens 等（會與用戶端參數合併，除非 `ignore_prompt_manager_optional_params: true`）

## LiteLLM 設定 {#litellm-configuration}

加入到 `config.yaml`：

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

prompts:
  - prompt_id: "simple_prompt"
    litellm_params:
      prompt_integration: "generic_prompt_management"
      provider_specific_query_params:
        project_name: litellm
        slug: hello-world-prompt-2bac
      api_base: http://localhost:8080
      api_key: os.environ/YOUR_PROMPT_API_KEY  # optional
      ignore_prompt_manager_model: true  # optional, keep client's model
      ignore_prompt_manager_optional_params: true  # optional, don't merge prompt manager's params (e.g. temperature, max_tokens, etc.)
```

### 設定參數 {#configuration-parameters}

- `prompt_integration`：必須為 `"generic_prompt_management"`
- `provider_specific_query_params`：傳送到您 API 的自訂查詢參數（可選）
- `api_base`：您的提示管理 API 基底 URL
- `api_key`：用於驗證的可選 API 金鑰（以 `Bearer` token 傳送）
- `ignore_prompt_manager_model`：如果為 `true`，則使用用戶端指定的模型而非提示的模型（預設：`false`）
- `ignore_prompt_manager_optional_params`：如果為 `true`，則不要將提示的可選參數與用戶端參數合併（預設：`false`）

## 使用方式 {#usage}

### 與 LiteLLM SDK 搭配使用 {#using-with-litellm-sdk}

**使用提示 ID 的基本用法：**

```python
from litellm import completion

response = completion(
    model="gpt-4",
    prompt_id="simple_prompt",
    messages=[{"role": "user", "content": "Additional message"}]
)
```

**使用提示變數：**

```python
response = completion(
    model="gpt-4",
    prompt_id="simple_prompt",
    prompt_variables={
        "domain": "data science",
        "task": "analyzing customer churn"
    },
    messages=[{"role": "user", "content": "Please provide a detailed analysis"}]
)
```

提示範本中的 `{domain}` 會被替換為「data science」，而 `{task}` 會被替換為「analyzing customer churn」。

### 與 LiteLLM Proxy 搭配使用 {#using-with-litellm-proxy}

**1. 以您的設定啟動 proxy：**

```bash
litellm --config /path/to/config.yaml
```

**2. 使用 prompt_id 發出請求：**

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "prompt_id": "simple_prompt",
    "prompt_variables": {
      "domain": "healthcare",
      "task": "patient risk assessment"
    },
    "messages": [
      {"role": "user", "content": "Analyze the following data..."}
    ]
  }'
```

**3. 與 OpenAI SDK 搭配使用：**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Analyze the data"}
    ],
    extra_body={
        "prompt_id": "simple_prompt",
        "prompt_variables": {
            "domain": "finance",
            "task": "fraud detection"
        }
    }
)
```

## 實作範例 {#implementation-example}

請參閱 [mock_prompt_management_server.py](https://github.com/BerriAI/litellm/blob/main/cookbook/mock_prompt_management_server/mock_prompt_management_server.py) 取得完整的參考實作，內含多個範例提示、驗證，以及便利端點。

**最小 FastAPI 範例：**

```python
from fastapi import FastAPI, HTTPException, Header
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

app = FastAPI()

# In-memory prompt storage (replace with your database)
PROMPTS = {
    "hello-world-prompt": {
        "prompt_id": "hello-world-prompt",
        "prompt_template": [
            {
                "role": "system",
                "content": "You are a helpful assistant specialized in {domain}."
            },
            {
                "role": "user", 
                "content": "Help me with: {task}"
            }
        ],
        "prompt_template_model": "gpt-4",
        "prompt_template_optional_params": {
            "temperature": 0.7,
            "max_tokens": 500
        }
    },
    "code-review-prompt": {
        "prompt_id": "code-review-prompt",
        "prompt_template": [
            {
                "role": "system",
                "content": "You are an expert code reviewer. Review code for {language}."
            },
            {
                "role": "user",
                "content": "Review the following code:\n\n{code}"
            }
        ],
        "prompt_template_model": "gpt-4-turbo",
        "prompt_template_optional_params": {
            "temperature": 0.3,
            "max_tokens": 1000
        }
    }
}

class PromptResponse(BaseModel):
    prompt_id: str
    prompt_template: List[Dict[str, str]]
    prompt_template_model: Optional[str] = None
    prompt_template_optional_params: Optional[Dict[str, Any]] = None

@app.get("/beta/litellm_prompt_management", response_model=PromptResponse)
async def get_prompt(
    prompt_id: str,
    authorization: Optional[str] = Header(None),
    project_name: Optional[str] = None,
    slug: Optional[str] = None,
):
    """
    Get a prompt by ID with optional filtering by project_name and slug.
    
    Args:
        prompt_id: The ID of the prompt to fetch
        authorization: Optional Bearer token for authentication
        project_name: Optional project name filter
        slug: Optional slug filter
    """
    
    # Optional: Validate authorization
    if authorization:
        token = authorization.replace("Bearer ", "")
        # Validate your token here
        if not is_valid_token(token):
            raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Optional: Apply additional filtering based on custom params
    if project_name or slug:
        # You can use these parameters to filter or validate access
        # For example, check if the user has access to this project
        pass
    
    # Fetch the prompt from your storage
    if prompt_id not in PROMPTS:
        raise HTTPException(
            status_code=404,
            detail=f"Prompt '{prompt_id}' not found"
        )
    
    prompt_data = PROMPTS[prompt_id]
    
    return PromptResponse(**prompt_data)

def is_valid_token(token: str) -> bool:
    """Validate API token - implement your logic here"""
    # Example: Check against your database or secret store
    valid_tokens = ["your-secret-token", "another-valid-token"]
    return token in valid_tokens

# Optional: Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Optional: List all prompts endpoint
@app.get("/prompts")
async def list_prompts(authorization: Optional[str] = Header(None)):
    """List all available prompts"""
    if authorization:
        token = authorization.replace("Bearer ", "")
        if not is_valid_token(token):
            raise HTTPException(status_code=401, detail="Invalid API key")
    
    return {
        "prompts": [
            {"prompt_id": pid, "model": p.get("prompt_template_model")}
            for pid, p in PROMPTS.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

### 執行範例伺服器 {#running-the-example-server}

1. 安裝相依套件：
```bash
uv add fastapi uvicorn
```

2. 將上方程式碼儲存至 `prompt_server.py`

3. 執行伺服器：
```bash
python prompt_server.py
```

4. 測試端點：
```bash
curl "http://localhost:8080/beta/litellm_prompt_management?prompt_id=hello-world-prompt&project_name=litellm&slug=hello-world-prompt-2bac"
```

預期回應：
```json
{
  "prompt_id": "hello-world-prompt",
  "prompt_template": [
    {
      "role": "system",
      "content": "You are a helpful assistant specialized in {domain}."
    },
    {
      "role": "user",
      "content": "Help me with: {task}"
    }
  ],
  "prompt_template_model": "gpt-4",
  "prompt_template_optional_params": {
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

## 進階功能 {#advanced-features}

### 變數替換 {#variable-substitution}

LiteLLM 會使用 `{variable}` 語法，自動替換您提示範本中的變數。支援 `{variable}` 與 `{{variable}}` 兩種格式。

**提示範本範例：**
```json
{
  "prompt_template": [
    {
      "role": "system",
      "content": "You are an expert in {domain} with {years} years of experience."
    }
  ]
}
```

**用戶端請求：**
```python
completion(
    model="gpt-4",
    prompt_id="expert_prompt",
    prompt_variables={
        "domain": "machine learning",
        "years": "10"
    }
)
```

**結果：**
```
"You are an expert in machine learning with 10 years of experience."
```

### 快取 {#caching}

LiteLLM 會自動將抓取的提示快取在記憶體中。快取鍵包含：
- `prompt_id`
- `prompt_label`（如果有提供）
- `prompt_version`（如果有提供）

這表示您的 API 端點只會針對每個唯一的提示設定呼叫一次。

### 模型覆寫行為 {#model-override-behavior}

**預設行為（未使用 `ignore_prompt_manager_model`）：**
```yaml
prompts:
  - prompt_id: "my_prompt"
    litellm_params:
      prompt_integration: "generic_prompt_management"
      api_base: http://localhost:8080
```

如果您的 API 回傳 `"prompt_template_model": "gpt-4"`，LiteLLM 將會使用 `gpt-4`，不論用戶端指定了什麼。

**使用 `ignore_prompt_manager_model: true` 時：**
```yaml
prompts:
  - prompt_id: "my_prompt"
    litellm_params:
      prompt_integration: "generic_prompt_management"
      api_base: http://localhost:8080
      ignore_prompt_manager_model: true
```

LiteLLM 將會使用用戶端指定的模型，忽略提示的模型。

### 參數合併行為 {#parameter-merging-behavior}

**預設行為（未使用 `ignore_prompt_manager_optional_params`）：**

用戶端參數會與提示參數合併，且提示參數優先：
```python
# Prompt returns: {"temperature": 0.7, "max_tokens": 500}
# Client sends: {"temperature": 0.9, "top_p": 0.95}
# Final params: {"temperature": 0.7, "max_tokens": 500, "top_p": 0.95}
```

**使用 `ignore_prompt_manager_optional_params: true` 時：**

只會使用用戶端參數：
```python
# Prompt returns: {"temperature": 0.7, "max_tokens": 500}
# Client sends: {"temperature": 0.9, "top_p": 0.95}
# Final params: {"temperature": 0.9, "top_p": 0.95}
```

## 安全性考量 {#security-considerations}

1. **驗證**：使用 `api_key` 參數保護您的提示管理 API
2. **授權**：使用自訂查詢參數實作以團隊/使用者為基礎的存取控制
3. **速率限制**：加入速率限制以防止您的 API 被濫用
4. **輸入驗證**：在處理前驗證所有查詢參數
5. **HTTPS**：在正式環境中一律使用 HTTPS 進行加密通訊
6. **密鑰**：將 API 金鑰儲存在環境變數中，而不是設定檔中

## 使用情境 {#use-cases}

✅ **在以下情況使用 Generic Prompt Management API：**
- 您想要立即整合，不必等待 PR
- 您維護自己的提示管理服務
- 您需要完整控制提示版本管理與更新
- 您想建立自訂提示管理功能
- 您需要與內部系統整合

✅ **常見情境：**
- 貴組織的內部提示管理系統
- 具備以團隊為基礎存取控制的多租戶提示管理
- 不同提示版本的 A/B 測試
- 提示實驗與分析
- 與既有提示工程工作流程整合

## 何時使用此功能 {#when-to-use-this}

✅ **在以下情況使用 Generic Prompt Management API：**
- 您想要立即整合，不必等待 PR
- 您維護自己的提示管理服務
- 您需要完整控制更新與功能
- 您想要自訂提示儲存與版本管理邏輯

❌ **在以下情況提交 PR：**
- 您想與 LiteLLM 內部實作更深入整合
- 您的整合需要複雜的 LiteLLM 特定邏輯
- 您希望成為內建提供者
- 您正在為社群打造可重用的整合

## 疑難排解 {#troubleshooting}

### 找不到提示 {#prompt-not-found}
- 驗證 `prompt_id` 是否完全相符（區分大小寫）
- 檢查您的 API 端點是否可從 LiteLLM 存取
- 如果使用 `api_key`，請驗證驗證資訊

### 變數未被替換 {#variables-not-substituted}
- 確認變數使用 `{variable}` 或 `{{variable}}` 語法
- 檢查 `prompt_variables` 中的變數名稱是否與範本完全一致
- 變數區分大小寫

### 模型未被覆寫 {#model-not-being-overridden}
- 檢查設定中是否有設定 `ignore_prompt_manager_model: true`
- 驗證您的 API 是否在回應中傳回 `prompt_template_model`

### 參數未被套用 {#parameters-not-being-applied}
- 檢查是否已設定 `ignore_prompt_manager_optional_params: true`
- 確認您的 API 是否回傳 `prompt_template_optional_params`
- 確保參數名稱與 OpenAI 的參數名稱相符

## 有問題嗎？ {#questions}

這是 **beta API**。我們正根據回饋持續改進它。如果您需要額外功能，請開啟 issue 或 PR。

## 相關文件 {#related-documentation}

- [提示管理總覽](../proxy/prompt_management.md)
- [Generic Guardrail API](./generic_guardrail_api.md)
- [LiteLLM Proxy 設定](../proxy/quick_start.md)
