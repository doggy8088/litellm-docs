# 使用 Bing 搜尋進行 grounding（Microsoft Foundry） {#grounding-with-bing-search-microsoft-foundry}

[使用 Bing 搜尋進行 grounding](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/bing-grounding) 會透過 [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/ai-foundry/) 專案中的模型部署執行網頁搜尋，並使用該專案的 Responses API。模型會執行搜尋並回傳附引用的結果，因此搜尋流量會停留在您的 Foundry 專案內，並由 Azure 計費

有兩種模式，取決於您是否設定 Grounding with Bing 連線：

- **網頁搜尋模式**（預設）：模型內建的 `web_search` 工具。它不需要 Bing 資源，也不會支付任何每次搜尋的 Bing 費用，因此 LiteLLM 將其追蹤為零成本
- **連線模式**：付費的 Grounding with Bing（G1）連線，使用 `BING_GROUNDING_CONNECTION_ID` 選取。LiteLLM 會以 `bing_grounding/search` 地圖價格追蹤

兩種模式都會呼叫相同的模型部署，其 token 使用量會由 Azure 依您的 Foundry 帳戶計費

| | |
|---|---|
| 提供者 ID | `bing_grounding` |
| 專案端點 | `BING_GROUNDING_PROJECT_ENDPOINT`，或 `api_base` |
| 模型部署 | `BING_GROUNDING_MODEL`（必填） |
| 驗證（Azure API 金鑰） | `api_key`，以 `api-key` 標頭傳送 |
| 驗證（Entra 權杖） | `BING_GROUNDING_TOKEN`，以 `Authorization: Bearer` 傳送 |
| 驗證（azure-identity） | 任何 `DefaultAzureCredential` 來源，適用於範圍 `https://ai.azure.com/.default` |
| Grounding with Bing 連線 | `BING_GROUNDING_CONNECTION_ID`（選用，切換至連線模式） |

專案端點看起來像 `https://<account>.services.ai.azure.com/api/projects/<project>`

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Grounding with Bing Search"
import os
from litellm import search

os.environ["BING_GROUNDING_PROJECT_ENDPOINT"] = "https://<account>.services.ai.azure.com/api/projects/<project>"
os.environ["BING_GROUNDING_MODEL"] = "{{openai_large}}"
os.environ["BING_GROUNDING_TOKEN"] = "<entra bearer token>"

response = search(
    query="latest AI developments",
    search_provider="bing_grounding",
    max_results=5
)

for result in response.results:
    print(f"{result.title}: {result.url}")
    print(f"Snippet: {result.snippet}\n")
```

### 驗證 {#authentication}

每次請求傳入 Azure API 金鑰，並透過 `api-key` 標頭送出：

```python showLineNumbers title="Grounding with Bing Search with an Azure API key"
response = search(
    query="latest AI developments",
    search_provider="bing_grounding",
    api_key=os.environ["AZURE_AI_API_KEY"]
)
```

或者省略 `BING_GROUNDING_TOKEN` 和 `api_key`，即可從標準 [azure-identity](https://learn.microsoft.com/en-us/python/api/overview/azure/identity-readme) 連結鏈（`AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_TENANT_ID`、共用設定檔、受控識別，或任何其他 `DefaultAzureCredential` 來源）產生 Entra 權杖，適用於範圍 `https://ai.azure.com/.default`

### 連線模式（付費 Grounding with Bing） {#connection-mode-paid-grounding-with-bing}

將 `BING_GROUNDING_CONNECTION_ID` 設為 Grounding with Bing（G1）資源的專案連線。模型接著會透過該付費連線而非內建工具進行搜尋，而 LiteLLM 會追蹤 `bing_grounding/search` 成本：

```python showLineNumbers title="Grounding with Bing Search in connection mode"
os.environ["BING_GROUNDING_CONNECTION_ID"] = (
    "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices"
    "/accounts/<account>/projects/<project>/connections/<bing-connection>"
)

response = search(
    query="latest AI developments",
    search_provider="bing_grounding",
    max_results=5
)
```

## LiteLLM AI Gateway {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
search_tools:
  - search_tool_name: bing-grounding-search
    litellm_params:
      search_provider: bing_grounding
```

在閘道的環境中設定 `BING_GROUNDING_PROJECT_ENDPOINT`、`BING_GROUNDING_MODEL`，以及其中一種驗證選項。`BING_GROUNDING_CONNECTION_ID` 為選用，並會切換至連線模式

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/bing-grounding-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 網頁搜尋攔截 {#web-search-interception}

使用 Bing 搜尋進行 grounding 是 [網頁搜尋攔截](../completion/web_search) 的自然後端，可從搜尋提供者提供模型原生的 `web_search` 工具。將攔截指向已設定的工具：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: bing-grounding-search
    litellm_params:
      search_provider: bing_grounding

litellm_settings:
  callbacks: ["websearch_interception"]
  websearch_interception_params:
    enabled_providers: ["openai"]
    search_tool_name: bing-grounding-search
```

## 統一參數 {#unified-parameters}

| 統一規格參數 | 網頁搜尋模式 | 連線模式 |
|---|---|---|
| `max_results` | 事後限制回傳結果數量（內建工具沒有數量旋鈕） | 對應到搜尋設定中的 `count` |
| `country` | 對應到近似的 `user_location` | _忽略（此連線的 `market` 需要完整地區設定，而單獨的國家代碼無法滿足）_ |
| `search_domain_filter` | _忽略（無對應項）_ | _忽略（無對應項）_ |
| `max_tokens_per_page` | _忽略（無對應項）_ | _忽略（無對應項）_ |

## 附註 {#notes}

網頁搜尋模式因內建 `web_search` 工具不收取每次搜尋的 Bing 費用而被追蹤為零成本。連線模式則以 `bing_grounding/search` 地圖價格、也就是 Grounding with Bing（G1）的每次搜尋費用進行追蹤。模型部署的 token 使用量會由 Azure 另行在您的 Foundry 帳戶上計費

Entra 權杖（`BING_GROUNDING_TOKEN`，或透過 azure-identity 產生的權杖）只會傳送到在 `BING_GROUNDING_PROJECT_ENDPOINT` 中設定的端點，因此呼叫端提供的 `api_base` 無法將其外洩。呼叫端提供的 `api_key` 會被視為 Azure API 金鑰，並改以 `api-key` 標頭傳送

LiteLLM 會將請求送至 `<project-endpoint>/openai/v1/responses`，如果端點尚未以該字串結尾，則會自動附加此路徑

如果 grounding 搜尋回傳 `failed` 或 `incomplete` 且沒有結果，LiteLLM 會回傳錯誤，而不是回傳空的成功結果，因此失敗的搜尋不會被記錄為正常的零結果命中
