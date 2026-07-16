# SearXNG 搜尋 {#searxng-search}

**開放原始碼：** [https://github.com/searxng/searxng](https://github.com/searxng/searxng)

**公開執行個體：** [https://searx.space/](https://searx.space/)

## 總覽 {#overview}

SearXNG 是一個免費、開放原始碼的 metasearch 引擎，會彙整來自多個搜尋引擎的結果，同時保護使用者隱私。它可以自我託管，或透過公開執行個體使用。

**注意：** SearXNG 每頁會回傳固定數量的結果（預設約 20 筆），且不支援透過 API 限制結果數量。`max_results` 參數不受 SearXNG 直接支援。

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="SearXNG Search"
import os
from litellm import search

# Set your SearXNG instance URL (REQUIRED)
os.environ["SEARXNG_API_BASE"] = "https://serxng-deployment-production.up.railway.app"

response = search(
    query="latest AI developments",
    search_provider="searxng",
    max_results=10
)
```

## LiteLLM AI 閘道 {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: searxng-search
    litellm_params:
      search_provider: searxng
      api_base: https://serxng-deployment-production.up.railway.app
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/searxng-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 10
  }'
```

## 提供者特定參數 {#provider-specific-parameters}

```python showLineNumbers title="SearXNG Search with Provider-specific Parameters"
import os
from litellm import search

# REQUIRED: Set your SearXNG instance URL
os.environ["SEARXNG_API_BASE"] = "https://serxng-deployment-production.up.railway.app"

response = search(
    query="machine learning research",
    search_provider="searxng",
    max_results=10,
    # SearXNG-specific parameters
    categories="general,science",      # Comma-separated categories
    engines="google,duckduckgo,bing",  # Comma-separated engines
    language="en",                      # Language code
    pageno=1,                           # Page number
    time_range="month"                  # Time filter: day, month, year
)
```

## 功能 {#features}

SearXNG 提供強大的 metasearch 功能：

### 多個搜尋引擎 {#multiple-search-engines}
同時彙整來自多個搜尋引擎的結果：
- Google、DuckDuckGo、Bing、Brave
- Wikipedia、Startpage
- 以及更多

### 分類 {#categories}
在特定分類中搜尋：
- `general` - 一般網頁搜尋
- `science` - 科學文章與論文
- `images` - 圖片搜尋
- `news` - 新聞文章
- `videos` - 影片內容
- `music` - 音樂與音訊
- `files` - 檔案搜尋
- `it` - IT 與技術
- `map` - 地圖與位置

### 依時間篩選 {#time-based-filtering}
依時間範圍篩選結果：
- `day` - 過去一天
- `month` - 過去一個月
- `year` - 過去一年

### 注重隱私 {#privacy-focused}
- 不追蹤使用者
- 不需要 Cookie
- 不進行個人檔案分析
- 無廣告

### 語言支援 {#language-support}
支援 60+ 種語言，並可使用 `language` 參數。

## 自我託管 {#self-hosting}

SearXNG 可自我託管以獲得完整控制權。

### 快速部署 {#quick-deploy}

使用我們預先設定好的部署儲存庫，輕鬆完成設定：

**[Fork 並部署：github.com/BerriAI/serxng-deployment](https://github.com/BerriAI/serxng-deployment)**

此儲存庫包含：
- Docker 與 Docker Compose 設定
- 已預先設定好的 JSON API 格式
- 可直接部署

### 手動安裝 {#manual-installation}

請參閱[官方 SearXNG 安裝說明](https://docs.searxng.org/admin/installation.html)以進行詳細設定。

**重要：** 安裝 SearXNG 時，預設唯一啟用的輸出格式是 HTML 格式。您需要啟用 JSON 格式才能使用 API。

將下列內容新增到您的 `settings.yml` 檔案：

```yaml
search:
  formats:
    - html
    - json
```

接著重新啟動 SearXNG：

```bash
# Using Docker
docker run -d -p 8080:8080 \
  -v $(pwd)/settings.yml:/etc/searxng/settings.yml:ro \
  -e SEARXNG_BASE_URL=http://localhost:8080 \
  searxng/searxng

# Then configure LiteLLM to use your instance
export SEARXNG_API_BASE=http://localhost:8080
```

## 設定 {#configuration}

### 設定 API Base URL（必要） {#setting-api-base-url-required}

您**必須**透過環境變數或在搜尋請求中指定 SearXNG 執行個體 URL：

```python
# Option 1: Environment variable (Recommended)
import os
os.environ["SEARXNG_API_BASE"] = "https://your-instance.com"

response = search(
    query="AI developments",
    search_provider="searxng"
)

# Option 2: Pass directly in search call
response = search(
    query="AI developments",
    search_provider="searxng",
    api_base="https://your-instance.com"
)
```

**注意：** 沒有預設的執行個體 URL。您必須選擇[公開執行個體](https://searx.space/)或自我託管自己的執行個體。

### 可選驗證 {#optional-authentication}

某些 SearXNG 執行個體可能需要驗證：

```python
import os

# Set API key if required
os.environ["SEARXNG_API_KEY"] = "your-api-key"

response = search(
    query="AI developments",
    search_provider="searxng"
)
```

## 成本 {#cost}

SearXNG 完全免費：
- **開放原始碼** - 無授權成本
- **自我託管** - 僅有基礎設施成本
- **公開執行個體** - 通常免費，請查看執行個體政策

## 進階用法 {#advanced-usage}

### 自訂引擎選擇 {#custom-engine-selection}

```python
response = search(
    query="Python tutorials",
    search_provider="searxng",
    engines="stackoverflow,github,reddit",  # Only search these engines
    categories="it"
)
```

### 多分類搜尋 {#multi-category-search}

```python
response = search(
    query="climate change",
    search_provider="searxng",
    categories="general,science,news",  # Search multiple categories
    time_range="month"
)
```

### 分頁 {#pagination}

```python
# Get page 1
page1 = search(
    query="AI research",
    search_provider="searxng",
    pageno=1
)

# Get page 2
page2 = search(
    query="AI research",
    search_provider="searxng",
    pageno=2
)
```

## 回應格式 {#response-format}

SearXNG 會以標準 LiteLLM 搜尋格式回傳結果：

```json
{
  "object": "search",
  "results": [
    {
      "title": "Example Result",
      "url": "https://example.com",
      "snippet": "This is the content snippet from the search result...",
      "date": "2024-01-15",
      "last_updated": null
    }
  ]
}
```

## 疑難排解 {#troubleshooting}

### 先測試您的執行個體 {#test-your-instance-first}

如果 LiteLLM 搭配 searxng 搜尋提供者無法運作，請使用 curl 直接測試您的 SearXNG 執行個體：

```bash
# Test if JSON API is working
curl -s "https://your-searxng-instance.com/search?q=test&format=json" | head -50

# Example with specific instance
curl -s "https://serxng-deployment-production.up.railway.app/search?q=test&format=json" | head -50
```

**預期回應**：包含搜尋結果的 JSON  
**如果您得到 HTML**：該執行個體的 `settings.yml` 未啟用 JSON 格式

### 沒有結果 {#no-results}

如果您沒有得到結果：

1. **嘗試不同的引擎**：指定 `engines` 參數
2. **擴大分類範圍**：使用多個分類
3. **調整語言**：設定適當的 `language` 參數

### 未啟用 JSON 格式 {#json-format-not-enabled}

如果您得到的是 HTML 而不是 JSON：

1. **使用 curl 測試**：使用上方的 curl 指令來驗證 JSON 輸出
2. **自我託管您自己的執行個體**：使用[我們的部署儲存庫](https://github.com/BerriAI/serxng-deployment)，其中已預先設定 JSON
3. **檢查執行個體設定**：並非所有公開執行個體都已啟用 JSON
4. **手動啟用 JSON**：新增到 `settings.yml`：
   ```yaml
   search:
     formats:
       - html
       - json
   ```
