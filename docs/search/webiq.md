---
title: "搭配 LiteLLM 使用 Microsoft Web IQ Search API：Python 與閘道"
sidebar_label: "Microsoft Web IQ 搜尋"
description: "將 Microsoft Web IQ 網路搜尋加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，支援網域篩選與成本追蹤。"
---
# Microsoft Web IQ 搜尋 {#microsoft-web-iq-search}

<SinceVersion v="1.111.0" />

使用 `search_provider="webiq"` 搭配 Microsoft Web IQ API 金鑰。此整合會呼叫 [Web Search v3 REST API](https://learn.microsoft.com/en-us/web-iq/reference/web-search)，它與 Grounding with Bing 不同

請在處理程序環境中設定 `WEBIQ_API_KEY`，或明確傳入 `api_key`。提供者會將它放在 `x-apikey` 標頭中傳送。此初期整合使用 API 金鑰驗證，不會取得或重新整理 Entra ID token

## Python SDK {#python-sdk}

```python
import asyncio
from litellm import asearch, search

result = search(
    query="retrieval augmented generation research",
    search_provider="webiq",
    max_results=5,
    country="US",
)
print(result.model_dump())

async def main():
    result = await asearch(query="retrieval augmented generation research", search_provider="webiq")
    print(result.model_dump())

asyncio.run(main())
```

提供者預設會請求 `contentFormat="passage"` 與 `maxLength=5000`。`content` 會成為標準結果的 `snippet`，`lastUpdatedAt` 則在可用時提供 `date` 與 `last_updated`。爬取時間戳記會以 `crawledAt` 保留，不會被當作發佈日期呈現。其他回應中繼資料，包括 `traceId` 與檢測欄位，除非其鍵與標準 LiteLLM 回應欄位衝突，否則都會保留；此整合不會傳送檢測 ping

## 閘道 {#gateway}

請將此搜尋工具加入您現有的 proxy 設定：

```yaml
search_tools:
  - search_tool_name: webiq-search
    litellm_params:
      search_provider: webiq
      api_key: os.environ/WEBIQ_API_KEY
```

請將 `LITELLM_PROXY_URL` 設為您現有的 LiteLLM 部署 URL，不要加上結尾斜線，並將 `LITELLM_API_KEY` 設為您的 LiteLLM 閘道金鑰。閘道金鑰會向 LiteLLM 驗證您的應用程式；`WEBIQ_API_KEY` 則向 `https://api.microsoft.ai/v3/search/web` 驗證閘道

```bash
curl "$LITELLM_PROXY_URL/v1/search/webiq-search" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"retrieval augmented generation research","max_results":5}'
```

您也可以傳送 `POST /v1/search` 或 `POST /search`，並在請求主體中帶入 `search_tool_name`：

```json
{
  "search_tool_name": "webiq-search",
  "query": "retrieval augmented generation research",
  "max_results": 5
}
```

搜尋呼叫遵循閘道的[搜尋工具存取規則](./index.md#restrict-search-tool-access)。如果您的部署限制了搜尋工具，請授予呼叫端存取 `webiq-search` 的權限；相同的規則也適用於網頁搜尋攔截

## 儀表板 {#dashboard}

在 proxy 已設定資料庫的情況下，請以 proxy 管理員身分登入並開啟 **Search Tools**。點選 **Add New Search Tool**，在 **Search Tool Name** 輸入 `webiq-search`，在 **Search Provider** 選擇 **Microsoft Web IQ**，並在 **API Key** 輸入您的 Web IQ 金鑰。將 **Cost per Query (USD, Optional)** 留空可使用 LiteLLM 的型錄價格，或設定您議定的費率

點選 **Test Connection**，關閉測試結果，再點選 **Add Search Tool** 以儲存。開啟已儲存的工具，輸入查詢後點選 **Search**，即可檢視回傳的標題、URL 與段落。請在上述閘道請求中使用已儲存工具的名稱；透過儀表板建立的工具不需要再於 `config.yaml` 中加入項目

## 路由器 {#router}

對於管理具名搜尋工具的 SDK 應用程式，請在 `Router` 上設定 Web IQ，並使用工具名稱呼叫 `router.asearch`：

```python
import asyncio
import os
from litellm import Router

router = Router(
    model_list=[],
    search_tools=[
        {
            "search_tool_name": "webiq-search",
            "litellm_params": {
                "search_provider": "webiq",
                "api_key": os.environ["WEBIQ_API_KEY"],
            },
        }
    ],
)

async def main():
    result = await router.asearch(
        search_tool_name="webiq-search",
        query="retrieval augmented generation research",
        max_results=5,
    )
    print(result.model_dump())

asyncio.run(main())
```

## 網頁搜尋攔截 {#web-search-interception}

若要為[網頁搜尋攔截](../integrations/websearch_interception.md)選用 Web IQ，請將這些設定合併到 proxy 設定中，放在 `webiq-search` 工具旁。請將 `enabled_providers` 設為您的應用程式使用的模型提供者；此範例選用 Bedrock

```yaml
litellm_settings:
  callbacks:
    - websearch_interception
  websearch_interception_params:
    search_tool_name: webiq-search
    enabled_providers: ["bedrock"]
```

請搭配受支援的網頁搜尋工具傳送模型請求，如[攔截使用範例](../integrations/websearch_interception.md#usage-examples)所示。僅啟用回呼並不會為每個模型請求加上網頁搜尋。LiteLLM 會將攔截到的搜尋路由到 `webiq-search`，並使用其現有的工具轉換、串流與模型接續行為

## 參數 {#parameters}

| LiteLLM 參數 | Web IQ 請求 |
| --- | --- |
| `query` | `query`；查詢清單會以空格連接 |
| `max_results` | `maxResults` |
| `country` | `region`，轉為大寫 |
| `search_domain_filter` | `site:` 查詢運算子，`-domain` 項目會對應為 `-site:` 排除條件 |
| `max_tokens_per_page` | 不會轉送；Web IQ 的 `maxLength` 以字元為單位，而非 token |

請將 `language`、`region`、`location`、`contentFormat`、`maxLength`、`maxResults` 與 `safeSearch` 等原生選項以關鍵字引數傳入。明確指定的原生值會覆寫對應值與整合預設值。Web IQ 會自行驗證其參數限制

網域篩選可縮小搜尋相關範圍。Microsoft 也指出，`site:` 查詢即使設定了 `safeSearch`，仍可能回傳成人內容；在受限內容的應用程式中仰賴網域篩選之前，請先參閱 API 參考文件

預設 API 基底是 `https://api.microsoft.ai/v3`。請在 SDK 呼叫或 proxy 搜尋設定中設定 `api_base` 以選用不同的基底，`/search/web` 只會附加一次。每個端點都必須使用 HTTPS，包括使用明確金鑰的自訂端點。HTTP 端點會在憑證解析或請求傳送之前就遭到拒絕。呼叫端選用的主機除非與預設主機相符，否則無法接收伺服器管理的 API 金鑰；搭配自訂端點時請傳入明確的 `api_key`

LiteLLM 將 `webiq/search` 登記為每次查詢 $0.007。[Microsoft 公布的定價](https://learn.microsoft.com/en-us/web-iq/resources/pricing)將 `/web` 列為每 1,000 次 API 呼叫 $7，自 2026 年 10 月 16 日起生效。即時 Web IQ 驗證需要已啟用的帳戶與有效的 API 金鑰

此整合目前支援 `/web`。`/video`、`/news`、`/images` 與 `/browse` 端點不在目前的支援範圍內
