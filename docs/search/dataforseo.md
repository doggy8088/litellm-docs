# DataForSEO 搜尋 {#dataforseo-search}

**取得 API 存取權：** [DataForSEO](https://dataforseo.com/)

## 設定 {#setup}

1. 前往 [DataForSEO](https://dataforseo.com/) 並建立帳號
2. 前往您的帳戶儀表板
3. 產生 API 憑證：
   - 您將收到 **登入名稱**（使用者名稱）
   - 您將收到 **密碼**
4. 設定您的環境變數：
   - `DATAFORSEO_LOGIN` - 您的 DataForSEO 登入名稱/使用者名稱
   - `DATAFORSEO_PASSWORD` - 您的 DataForSEO 密碼

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="DataForSEO Search"
import os
from litellm import search

os.environ["DATAFORSEO_LOGIN"] = "your-login"
os.environ["DATAFORSEO_PASSWORD"] = "your-password"

response = search(
    query="latest AI developments",
    search_provider="dataforseo",
    max_results=10
)
```

## LiteLLM AI Gateway {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: dataforseo-search
    litellm_params:
      search_provider: dataforseo
      api_key: "os.environ/DATAFORSEO_LOGIN:os.environ/DATAFORSEO_PASSWORD"
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/dataforseo-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 10
  }'
```

## 供應者特定參數 {#provider-specific-parameters}

```python showLineNumbers title="DataForSEO Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["DATAFORSEO_LOGIN"] = "your-login"
os.environ["DATAFORSEO_PASSWORD"] = "your-password"

response = search(
    query="AI developments",
    search_provider="dataforseo",
    max_results=10,
    # DataForSEO-specific parameters
    country="United States",       # Country name for location_name
    language_code="en",            # Language code
    depth=20,                      # Number of results (max 700)
    device="desktop",              # Device type ('desktop', 'mobile', 'tablet')
    os="windows"                   # Operating system
)
```
