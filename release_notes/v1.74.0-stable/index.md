---
title: "v1.74.0-stable"
slug: "v1-74-0-stable"
date: 2025-07-05T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

hide_table_of_contents: false
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:v1.74.0-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.74.0.post2
```

</TabItem>
</Tabs>

---

## 主要亮點  {#key-highlights}

- **MCP Gateway 命名空間伺服器** - 連接到 LiteLLM 的用戶端現在可以指定要使用哪些 MCP 伺服器。 
- **UI 上的依團隊／金鑰記錄** - Proxy 管理員可直接在 UI 中設定依團隊或依金鑰的記錄設定。 
- **Azure Content Safety 防護欄** - 新增對 Azure Content Safety 防護欄的提示注入與文字審核支援。 
- **VertexAI Deepseek Models** - 支援透過 LiteLLM 的 /chat/completions 或 /responses API 呼叫 VertexAI Deepseek models。
- **Github Copilot API** - 您現在可以將 Github Copilot 作為 LLM API 提供者使用。

### MCP Gateway：具命名空間的 MCP 伺服器 {#mcp-gateway-namespaced-mcp-servers}

此版本為 LiteLLM MCP Gateway 帶來了對 MCP Servers 命名空間的支援。這表示您可以指定 `x-mcp-servers` 標頭，以指定要從哪些伺服器列出工具。 
 
當您想將 MCP 用戶端指向 LiteLLM 上的特定 MCP 伺服器時，這會很有用。 

#### 使用方式 {#usage}

<Tabs>
<TabItem value="openai" label="OpenAI API">

```bash title="cURL Example with Server Segregation" showLineNumbers
curl --location 'https://api.openai.com/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "<your-litellm-proxy-base-url>/mcp",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-servers": "Zapier_Gmail"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

在此範例中，請求只會存取來自 "Zapier_Gmail" MCP 伺服器的工具。

</TabItem>

<TabItem value="litellm" label="LiteLLM Proxy">

```bash title="cURL Example with Server Segregation" showLineNumbers
curl --location '<your-litellm-proxy-base-url>/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "<your-litellm-proxy-base-url>/mcp",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-servers": "Zapier_Gmail,Server2"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

此設定會將請求限制為只使用來自指定 MCP 伺服器的工具。

</TabItem>

<TabItem value="cursor" label="Cursor IDE">

```json title="Cursor MCP Configuration with Server Segregation" showLineNumbers
{
  "mcpServers": {
    "LiteLLM": {
      "url": "<your-litellm-proxy-base-url>/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer $LITELLM_API_KEY",
        "x-mcp-servers": "Zapier_Gmail,Server2"
      }
    }
  }
}
```

在 Cursor IDE 設定中的此設定將把工具存取限制為僅限指定的 MCP 伺服器。

</TabItem>
</Tabs>

### UI 上的依團隊／金鑰記錄 {#team--key-based-logging-on-ui}

<Image 
  img={require('../../img/release_notes/team_key_logging.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

此版本支援 Proxy 管理員在 UI 上設定依團隊／依金鑰的記錄設定。這可讓 LLM 請求／回應記錄依據團隊或金鑰，路由到不同的 Langfuse/Arize 專案。

對於使用 LiteLLM 的開發者，其記錄會自動路由到其各自的 Arize/Langfuse 專案。在此版本中，我們支援以下依金鑰／依團隊記錄整合：

- `langfuse`
- `arize`
- `langsmith`

### Azure Content Safety 防護欄 {#azure-content-safety-guardrails}

<Image 
  img={require('../../img/azure_content_safety_guardrails.jpg')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

LiteLLM 現在支援用於 Prompt Injection 與文字審核的 **Azure Content Safety 防護欄**。這對 **內部 chat-ui** 使用情境非常適合，因為您現在可以建立具備 Azure 危害類別偵測的防護欄、指定自訂嚴重程度門檻，並將其套用於 100+ 個 LLM，而僅限於該使用情境（或套用於您的所有請求）。 

[開始使用](../../docs/proxy/guardrails/azure_content_guardrail)

### Python SDK：匯入時間快 2.3 秒 {#python-sdk-23-second-faster-import-times}

此版本為 Python SDK 帶來顯著的效能改進，匯入時間快了 2.3 秒。我們重新設計了初始化流程以降低啟動負擔，使 LiteLLM 對於需要快速初始化的應用程式更有效率。這對於需要快速初始化 LiteLLM 的應用程式而言，是一項重大改進。

---

## 新模型／更新模型 {#new-models--updated-models}

#### 定價／Context Window 更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入 ($/100萬 tokens) | 輸出 ($/100萬 tokens) | 類型 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | ---- |
| Watsonx | `watsonx/mistralai/mistral-large` | 131k | $3.00 | $10.00 | 新增 |
| Azure AI | `azure_ai/cohere-rerank-v3.5` | 4k | $2.00/1k queries | - | 新增（Rerank） |

#### 功能 {#features}
- **[🆕 GitHub Copilot](../../docs/providers/github_copilot)** - 使用 LiteLLM 與 GitHub Copilot API - [PR](https://github.com/BerriAI/litellm/pull/12325), [開始使用](../../docs/providers/github_copilot)
- **[🆕 VertexAI DeepSeek](../../docs/providers/vertex)** - 新增對 VertexAI DeepSeek models 的支援 - [PR](https://github.com/BerriAI/litellm/pull/12312), [開始使用](../../docs/providers/vertex_partner#vertexai-deepseek)
- **[Azure AI](../../docs/providers/azure_ai)**
  - 新增 azure_ai cohere rerank v3.5 - [PR](https://github.com/BerriAI/litellm/pull/12283), [開始使用](../../docs/providers/azure_ai#rerank-endpoint)
- **[Vertex AI](../../docs/providers/vertex)**
  - 新增 image generation 的 size 參數支援 - [PR](https://github.com/BerriAI/litellm/pull/12292), [開始使用](../../docs/providers/vertex_image)
- **[Custom LLM](../../docs/providers/custom_llm_server)**
  - 傳遞 "custom" llm provider 上的額外 _properties - [PR](https://github.com/BerriAI/litellm/pull/12185)

#### 問題修正 {#bugs}
- **[Mistral](../../docs/providers/mistral)**
  - 修正空字串內容的 transform_response 處理 - [PR](https://github.com/BerriAI/litellm/pull/12202)
  - 將 Mistral 改為使用 llm_http_handler - [PR](https://github.com/BerriAI/litellm/pull/12245)
- **[Gemini](../../docs/providers/gemini)**
  - 修正工具呼叫序列 - [PR](https://github.com/BerriAI/litellm/pull/11999)
  - 修正自訂 api_base 路徑保留 - [PR](https://github.com/BerriAI/litellm/pull/12215)
- **[Anthropic](../../docs/providers/anthropic)**
  - 修正 user_id 驗證邏輯 - [PR](https://github.com/BerriAI/litellm/pull/11432)
- **[Bedrock](../../docs/providers/bedrock)**
  - 支援 bedrock 的可選參數 - [PR](https://github.com/BerriAI/litellm/pull/12287)
- **[Ollama](../../docs/providers/ollama)**
  - 修正 ollama-chat 的預設參數 - [PR](https://github.com/BerriAI/litellm/pull/12201)
- **[VLLM](../../docs/providers/vllm)**
  - 新增 'audio_url' 訊息類型支援 - [PR](https://github.com/BerriAI/litellm/pull/12270)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[/batches](../../docs/batches)**
  - 支援使用目標模型 Query Param 進行批次擷取 - [PR](https://github.com/BerriAI/litellm/pull/12228)
  - Anthropic completion bridge 改進 - [PR](https://github.com/BerriAI/litellm/pull/12228)
- **[/responses](../../docs/response_api)**
  - Azure responses api bridge 改進 - [PR](https://github.com/BerriAI/litellm/pull/12224)
  - 修正 responses api 錯誤處理 - [PR](https://github.com/BerriAI/litellm/pull/12225)
- **[/mcp (MCP Gateway)](../../docs/mcp)**
  - 在前端新增 MCP url 遮罩 - [PR](https://github.com/BerriAI/litellm/pull/12247)
  - 新增 MCP servers 標頭以進行範圍限制 - [PR](https://github.com/BerriAI/litellm/pull/12266)
  - Litellm mcp 工具前綴 - [PR](https://github.com/BerriAI/litellm/pull/12289)
  - 使用標頭將連線上的 MCP 工具分隔 - [PR](https://github.com/BerriAI/litellm/pull/12296)
  - 新增對 mcp url 包裝的變更 - [PR](https://github.com/BerriAI/litellm/pull/12207)

#### 問題修正 {#bugs-1}
- **[/v1/messages](../../docs/anthropic_unified)**
  - 移除串流時硬編碼的模型名稱 - [PR](https://github.com/BerriAI/litellm/pull/12131)
  - 支援最低延遲路由 - [PR](https://github.com/BerriAI/litellm/pull/12180)
  - 回傳非 anthropic models 的 token 使用量 - [PR](https://github.com/BerriAI/litellm/pull/12184)
- **[/chat/completions](../../docs/providers/anthropic_unified)**
  - 支援 Cursor IDE tool_choice 格式 `{"type": "auto"}` - [PR](https://github.com/BerriAI/litellm/pull/12168)
- **[/generateContent](../../docs/generate_content)**
  - 允許傳遞 litellm_params - [PR](https://github.com/BerriAI/litellm/pull/12177)
  - 使用 OpenAI models 時只傳遞支援的參數 - [PR](https://github.com/BerriAI/litellm/pull/12297)
  - 修正使用 gemini-cli 搭配 Vertex Anthropic Models - [PR](https://github.com/BerriAI/litellm/pull/12246)
- **串流**
  - 修正 LlamaAPI 串流聊天的錯誤代碼：307 - [PR](https://github.com/BerriAI/litellm/pull/11946)
  - 即使 is_finished 也儲存完成原因 - [PR](https://github.com/BerriAI/litellm/pull/12250)

---

## 支出追蹤／預算改進 {#spend-tracking--budget-improvements}

#### 問題修正 {#bugs-2}
  - 修正 calculate cost 中允許字串 - [PR](https://github.com/BerriAI/litellm/pull/12200)
  - VertexAI Anthropic 串流成本追蹤與 prompt caching 修正 - [PR](https://github.com/BerriAI/litellm/pull/12188)

---

## 管理端點／UI {#management-endpoints--ui}

#### 錯誤 {#bugs-3}
- **團隊管理**
  - 新增模型時防止團隊模型重設 - [PR](https://github.com/BerriAI/litellm/pull/12144)
  - 在 /v2/model/info 回傳僅限團隊的模型 - [PR](https://github.com/BerriAI/litellm/pull/12144)
  - 正確顯示團隊成員預算 - [PR](https://github.com/BerriAI/litellm/pull/12144)
- **UI 渲染**
  - 修正非 root 映像上的 UI 渲染 - [PR](https://github.com/BerriAI/litellm/pull/12226)
  - 正確顯示 'Internal Viewer' 使用者角色 - [PR](https://github.com/BerriAI/litellm/pull/12284)
- **組態**
  - 處理空白的 config.yaml - [PR](https://github.com/BerriAI/litellm/pull/12189)
  - 修正 gemini /models - 依預期將 models/ 取代 - [PR](https://github.com/BerriAI/litellm/pull/12189)

#### 功能 {#features-2}
- **團隊管理**
  - 允許新增團隊專屬記錄回呼 - [PR](https://github.com/BerriAI/litellm/pull/12261)
  - 新增 Arize 團隊式記錄 - [PR](https://github.com/BerriAI/litellm/pull/12264)
  - 允許檢視/編輯團隊式回呼 - [PR](https://github.com/BerriAI/litellm/pull/12265)
- **UI 改進**
  - 以逗號分隔顯示支出與預算 - [PR](https://github.com/BerriAI/litellm/pull/12317)
  - 在回呼清單中新增標誌 - [PR](https://github.com/BerriAI/litellm/pull/12244)
- **CLI**
  - 新增 litellm-proxy cli 登入，以開始使用 litellm proxy - [PR](https://github.com/BerriAI/litellm/pull/12216)
- **電子郵件範本**
  - 可自訂的電子郵件範本 - 主旨與簽名 - [PR](https://github.com/BerriAI/litellm/pull/12218)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-3}
- 防護欄 
  - 現在 UI 已支援所有防護欄 - [PR](https://github.com/BerriAI/litellm/pull/12349)
- **[Azure Content Safety](../../docs/guardrails/azure_content_safety)**
  - 將 Azure Content Safety 防護欄新增至 LiteLLM proxy - [PR](https://github.com/BerriAI/litellm/pull/12268)
  - 將 azure content safety 防護欄新增至 UI - [PR](https://github.com/BerriAI/litellm/pull/12309)
- **[DeepEval](../../docs/observability/deepeval_integration)**
  - 修正失敗事件的 DeepEval 記錄格式 - [PR](https://github.com/BerriAI/litellm/pull/12303)
- **[Arize](../../docs/proxy/logging#arize)**
  - 新增 Arize 團隊式記錄 - [PR](https://github.com/BerriAI/litellm/pull/12264)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
  - 支援 Langfuse prompt_version - [PR](https://github.com/BerriAI/litellm/pull/12301)
- **[Sentry Integration](../../docs/observability/sentry)**
  - 新增 sentry 脫敏 - [PR](https://github.com/BerriAI/litellm/pull/12210)
- **[AWS SQS Logging](../../docs/proxy/logging#aws-sqs)**
  - 新的 AWS SQS 記錄整合 - [PR](https://github.com/BerriAI/litellm/pull/12176)
- **[S3 Logger](../../docs/proxy/logging#s3-buckets)**
  - 新增失敗記錄支援 - [PR](https://github.com/BerriAI/litellm/pull/12299)
- **[Prometheus Metrics](../../docs/proxy/prometheus)**
  - 為 prometheus metrics 和 labels 新增更好的錯誤驗證 - [PR](https://github.com/BerriAI/litellm/pull/12182)

#### 錯誤 {#bugs-4}
- **安全性**
  - 確保只有失敗的 LLM API 路由會在 Langfuse 上記錄 - [PR](https://github.com/BerriAI/litellm/pull/12308)
- **OpenMeter**
  - 整合錯誤處理修正 - [PR](https://github.com/BerriAI/litellm/pull/12147)
- **訊息脫敏**
  - 確保訊息脫敏可用於 responses API 記錄 - [PR](https://github.com/BerriAI/litellm/pull/12291)
- **Bedrock 防護欄**
  - 修正串流回應的 bedrock 防護欄 post_call - [PR](https://github.com/BerriAI/litellm/pull/12252)
---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-4}
- **Python SDK**
  - 匯入時間快 2 秒 - [PR](https://github.com/BerriAI/litellm/pull/12135)
  - 將 python sdk 匯入時間減少 .3 秒 - [PR](https://github.com/BerriAI/litellm/pull/12140)
- **錯誤處理**
  - 為找不到的 MCP tools 或無效伺服器新增錯誤處理 - [PR](https://github.com/BerriAI/litellm/pull/12223)
- **SSL/TLS**
  - 修正 SSL 憑證錯誤 - [PR](https://github.com/BerriAI/litellm/pull/12327)
  - 修正在 aiohttp transport 中自訂 ca bundle 支援 - [PR](https://github.com/BerriAI/litellm/pull/12281)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

- **啟動**
  - 啟動時新增新橫幅 - [PR](https://github.com/BerriAI/litellm/pull/12328)
- **相依性**
  - 更新 pydantic 版本 - [PR](https://github.com/BerriAI/litellm/pull/12213)

---

## 新貢獻者 {#new-contributors}
* @wildcard 首次貢獻於 https://github.com/BerriAI/litellm/pull/12157
* @colesmcintosh 首次貢獻於 https://github.com/BerriAI/litellm/pull/12168
* @seyeong-han 首次貢獻於 https://github.com/BerriAI/litellm/pull/11946
* @dinggh 首次貢獻於 https://github.com/BerriAI/litellm/pull/12162
* @raz-alon 首次貢獻於 https://github.com/BerriAI/litellm/pull/11432
* @tofarr 首次貢獻於 https://github.com/BerriAI/litellm/pull/12200
* @szafranek 首次貢獻於 https://github.com/BerriAI/litellm/pull/12179
* @SamBoyd 首次貢獻於 https://github.com/BerriAI/litellm/pull/12147
* @lizzij 首次貢獻於 https://github.com/BerriAI/litellm/pull/12219
* @cipri-tom 首次貢獻於 https://github.com/BerriAI/litellm/pull/12201
* @zsimjee 首次貢獻於 https://github.com/BerriAI/litellm/pull/12185
* @jroberts2600 首次貢獻於 https://github.com/BerriAI/litellm/pull/12175
* @njbrake 首次貢獻於 https://github.com/BerriAI/litellm/pull/12202
* @NANDINI-star 首次貢獻於 https://github.com/BerriAI/litellm/pull/12244
* @utsumi-fj 首次貢獻於 https://github.com/BerriAI/litellm/pull/12230
* @dcieslak19973 首次貢獻於 https://github.com/BerriAI/litellm/pull/12283
* @hanouticelina 首次貢獻於 https://github.com/BerriAI/litellm/pull/12286
* @lowjiansheng 首次貢獻於 https://github.com/BerriAI/litellm/pull/11999
* @JoostvDoorn 首次貢獻於 https://github.com/BerriAI/litellm/pull/12281
* @takashiishida 首次貢獻於 https://github.com/BerriAI/litellm/pull/12239

## **[Git Diff](https://github.com/BerriAI/litellm/compare/v1.73.6-stable...v1.74.0-stable)** {#git-diffhttpsgithubcomberriailitellmcomparev1736-stablev1740-stable}
