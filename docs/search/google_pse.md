# Google 可程式化搜尋引擎（PSE） {#google-programmable-search-engine-pse}

**取得 API 金鑰：** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)  
**建立搜尋引擎：** [Programmable Search Engine](https://programmablesearchengine.google.com/)

## 設定 {#setup}

1. 前往 [Google Developers Programmable Search Engine](https://programmablesearchengine.google.com/) 並登入或建立帳戶
2. 在控制台中點擊 **Add** 按鈕
3. 輸入搜尋引擎名稱並設定屬性：
   - 選擇要搜尋的網站（整個網路或特定網站）
   - 設定語言及其他偏好設定
   - 驗證您不是機器人
4. 點擊 **Create** 按鈕
5. 建立完成後，您會看到：
   - **Search engine ID (cx)** - 複製此項供 `GOOGLE_PSE_ENGINE_ID` 使用
   - 取得 API 金鑰的說明
6. 產生 API 金鑰：
   - 前往 [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
   - 建立新的 API 金鑰或使用現有的
   - 為您的專案啟用 **Custom Search API**
   - 複製 API 金鑰供 `GOOGLE_PSE_API_KEY` 使用

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Google PSE Search"
import os
from litellm import search

os.environ["GOOGLE_PSE_API_KEY"] = "AIza..."
os.environ["GOOGLE_PSE_ENGINE_ID"] = "your-search-engine-id"

response = search(
    query="latest AI developments",
    search_provider="google_pse",
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
  - search_tool_name: google-search
    litellm_params:
      search_provider: google_pse
      api_key: os.environ/GOOGLE_PSE_API_KEY
      search_engine_id: os.environ/GOOGLE_PSE_ENGINE_ID
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/google-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 10
  }'
```

## 提供者專屬參數 {#provider-specific-parameters}

```python showLineNumbers title="Google PSE Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["GOOGLE_PSE_API_KEY"] = "AIza..."
os.environ["GOOGLE_PSE_ENGINE_ID"] = "your-search-engine-id"

response = search(
    query="latest AI research papers",
    search_provider="google_pse",
    max_results=10,
    search_domain_filter=["arxiv.org"],
    # Google PSE-specific parameters (use actual Google PSE API parameter names)
    dateRestrict="m6",               # 'm6' = last 6 months, 'd7' = last 7 days
    lr="lang_en",                    # Language restriction (e.g., 'lang_en', 'lang_es')
    safe="active",                   # Search safety level ('active' or 'off')
    exactTerms="machine learning",   # Phrase that all documents must contain
    fileType="pdf"                   # File type to restrict results to
)
```
