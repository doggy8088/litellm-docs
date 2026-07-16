# Firecrawl 搜尋 {#firecrawl-search}

**取得 API 金鑰：** [https://firecrawl.dev](https://firecrawl.dev)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Firecrawl Search"
import os
from litellm import search

os.environ["FIRECRAWL_API_KEY"] = "fc-..."

response = search(
    query="latest AI developments",
    search_provider="firecrawl",
    max_results=5
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
  - search_tool_name: firecrawl-search
    litellm_params:
      search_provider: firecrawl
      api_key: os.environ/FIRECRAWL_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/firecrawl-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 提供者特定參數 {#provider-specific-parameters}

```python showLineNumbers title="Firecrawl Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["FIRECRAWL_API_KEY"] = "fc-..."

response = search(
    query="machine learning research",
    search_provider="firecrawl",
    max_results=10,
    country="US",
    # Firecrawl-specific parameters
    sources=["web", "news"],         # Search multiple sources
    categories=[{"type": "github"}, {"type": "research"}],  # Filter by categories
    tbs="qdr:m",                     # Time-based search (past month)
    location="San Francisco,California,United States",  # Geo-targeting
    ignoreInvalidURLs=True,          # Exclude invalid URLs
    scrapeOptions={                  # Scraping options for results
        "formats": ["markdown"],
        "onlyMainContent": True,
        "removeBase64Images": True
    }
)
```

## 功能 {#features}

Firecrawl 結合了網頁搜尋與強大的擷取能力：

### 多重來源 {#multiple-sources}
同時跨不同來源搜尋：
- `web` - 網頁搜尋結果（預設）
- `images` - 圖片搜尋結果
- `news` - 附日期的新聞搜尋結果

### 類別篩選 {#category-filtering}
依特定類別篩選結果：
- `github` - 在 GitHub repositories、code、issues 與文件中搜尋
- `research` - 搜尋學術與研究網站（arXiv、Nature、IEEE、PubMed 等）
- `pdf` - 搜尋 PDF

### 依時間搜尋 {#time-based-search}
使用 `tbs` 參數依時間區間篩選：
- `qdr:h` - 過去一小時
- `qdr:d` - 過去一天
- `qdr:w` - 過去一週
- `qdr:m` - 過去一個月
- `qdr:y` - 過去一年

### 內容擷取 {#content-scraping}
當指定 `scrapeOptions` 時，Firecrawl 會自動為搜尋結果擷取完整頁面內容。預設情況下，LiteLLM 會請求僅包含主要內容的 markdown 格式。

### 地理定位 {#geo-targeting}
結合 `location` 和 `country` 參數以取得地理定位結果：
```python
response = search(
    query="restaurants",
    search_provider="firecrawl",
    country="DE",
    location="Berlin,Germany"
)
```

## 支援的查詢運算子 {#supported-query-operators}

Firecrawl 支援進階搜尋運算子：

| 運算子    | 功能                                                   | 範例                            |
| --------- | ------------------------------------------------------ | ------------------------------- |
| ""        | 不使用模糊比對，精確比對一段文字                         | "Firecrawl"                     |
| \-        | 排除特定關鍵字                                          | \-bad, \-site:example.com       |
| site:      | 僅傳回來自指定網站的結果                                 | site:firecrawl.dev              |
| inurl:     | 僅傳回 URL 中包含某個字詞的結果                           | inurl:firecrawl                 |
| allinurl:   | 僅傳回 URL 中包含多個字詞的結果                           | allinurl:git firecrawl          |
| intitle:    | 僅傳回標題中包含某個字詞的結果                           | intitle:Firecrawl               |
| allintitle: | 僅傳回標題中包含多個字詞的結果                           | allintitle:firecrawl playground |
| related:    | 僅傳回與特定網域相關的結果                               | related:firecrawl.dev           |
