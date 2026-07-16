---
title: v1.65.0-stable - Model Context Protocol
slug: v1.65.0-stable
date: 2025-03-30T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
tags: [mcp, custom_prompt_management]
hide_table_of_contents: false
---
import Image from '@theme/IdealImage';

v1.65.0-stable 現已上線。以下是本次版本的重點摘要：
- **MCP 支援**：支援在 LiteLLM proxy 上新增與使用 MCP servers。
- **UI 在 1M+ logs 後顯示總用量**：現在在資料庫中的 logs 超過 1M 之後，仍可查看用量分析。 

## 模型上下文協定（MCP） {#model-context-protocol-mcp}

本次版本新增了在 LiteLLM 集中新增 MCP servers 的支援。這讓您可以新增 MCP server endpoints，而您的開發人員可以透過 LiteLLM `list` 和 `call` MCP tools。

進一步了解 MCP [請見此處](https://docs.litellm.ai/docs/mcp)。

<Image 
  img={require('../../img/release_notes/mcp_ui.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>
  透過 LiteLLM 釋出並使用 MCP servers
</p>

## UI 在 1M+ logs 後顯示總用量 {#ui-view-total-usage-after-1m-logs}

本次版本帶來了即使在您的資料庫中超過 1M+ logs 之後，仍可查看總用量分析的能力。我們實作了可擴充的架構，只儲存彙總後的用量資料，因此查詢效率大幅提升，並降低了資料庫 CPU 使用率。

<Image 
  img={require('../../img/release_notes/ui_usage.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>
  在 1M+ logs 後查看總用量
</p>

- 其運作方式：
    - 我們現在將用量資料彙整到專用的 DailyUserSpend 表中，即使超過 1M+ logs，也能大幅降低查詢負載與 CPU 使用量。

- 每日花費明細 API：

    - 透過單一端點即可擷取細緻的每日用量資料（依模型、提供者與 API 金鑰）。
    範例請求：

    ```shell title="Daily Spend Breakdown API" showLineNumbers
    curl -L -X GET 'http://localhost:4000/user/daily/activity?start_date=2025-03-20&end_date=2025-03-27' \
    -H 'Authorization: Bearer sk-...'
    ```

    ```json title="Daily Spend Breakdown API Response" showLineNumbers
    {
        "results": [
            {
                "date": "2025-03-27",
                "metrics": {
                    "spend": 0.0177072,
                    "prompt_tokens": 111,
                    "completion_tokens": 1711,
                    "total_tokens": 1822,
                    "api_requests": 11
                },
                "breakdown": {
                    "models": {
                        "gpt-4o-mini": {
                            "spend": 1.095e-05,
                            "prompt_tokens": 37,
                            "completion_tokens": 9,
                            "total_tokens": 46,
                            "api_requests": 1
                    },
                    "providers": { "openai": { ... }, "azure_ai": { ... } },
                    "api_keys": { "3126b6eaf1...": { ... } }
                }
            }
        ],
        "metadata": {
            "total_spend": 0.7274667,
            "total_prompt_tokens": 280990,
            "total_completion_tokens": 376674,
            "total_api_requests": 14
        }
    }
    ```


## 新模型 / 更新模型 {#new-models--updated-models}
- 支援 Vertex AI gemini-2.0-flash-lite 與 Google AI Studio gemini-2.0-flash-lite [PR](https://github.com/BerriAI/litellm/pull/9523)
- 支援 Vertex AI Fine-Tuned LLMs [PR](https://github.com/BerriAI/litellm/pull/9542)
- 支援 Nova Canvas 影像生成 [PR](https://github.com/BerriAI/litellm/pull/9525)
- 支援 OpenAI gpt-4o-transcribe [PR](https://github.com/BerriAI/litellm/pull/9517)
- 新增 Vertex AI text embedding model [PR](https://github.com/BerriAI/litellm/pull/9476)

## LLM 翻譯 {#llm-translation}
- OpenAI Web Search Tool Call 支援 [PR](https://github.com/BerriAI/litellm/pull/9465)
- Vertex AI topLogprobs 支援 [PR](https://github.com/BerriAI/litellm/pull/9518) 
- 支援傳送圖片與影片到 Vertex AI multimodal embedding [Doc](https://docs.litellm.ai/docs/providers/vertex#multi-modal-embeddings)
- 支援在 completion、embedding、image_generation 中使用 litellm.api_base 於 Vertex AI + Gemini [PR](https://github.com/BerriAI/litellm/pull/9516)
- 修正使用 litellm Python SDK 搭配 LiteLLM Proxy 時回傳 `response_cost` 的錯誤 [PR](https://github.com/BerriAI/litellm/commit/6fd18651d129d606182ff4b980e95768fc43ca3d)
- 支援 Mistral API 上的 `max_completion_tokens` [PR](https://github.com/BerriAI/litellm/pull/9606)
- 重構 Vertex AI passthrough routes - 修正 router model add 時自動設定 default_vertex_region 所造成的不可預期行為 [PR](https://github.com/BerriAI/litellm/pull/9467)

## 花費追蹤改善 {#spend-tracking-improvements}
- 在 spend logs 中記錄 'api_base' [PR](https://github.com/BerriAI/litellm/pull/9509)
- 支援 Gemini 音訊 token 成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9535)
- 修正 OpenAI 音訊輸入 token 成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9535)

## UI {#ui}

### 模型管理 {#model-management}
- 允許團隊管理員在 UI 中新增/更新/刪除模型 [PR](https://github.com/BerriAI/litellm/pull/9572)
- 新增 model hub 對 supports_web_search 的 render 支援 [PR](https://github.com/BerriAI/litellm/pull/9469)

### 請求記錄 {#request-logs}
- 在 request logs 中顯示 API base 與 model ID [PR](https://github.com/BerriAI/litellm/pull/9572)
- 允許在 request logs 中檢視 keyinfo [PR](https://github.com/BerriAI/litellm/pull/9568)

### 用量分頁 {#usage-tab}
- 新增 Daily User Spend Aggregate 檢視 - 讓 UI 的 Usage 分頁可處理 > 1m rows [PR](https://github.com/BerriAI/litellm/pull/9538)
- 將 UI 連接到 "LiteLLM_DailyUserSpend" spend table [PR](https://github.com/BerriAI/litellm/pull/9603)

## 記錄整合 {#logging-integrations}
- 修正 GCS Pub Sub Logging Integration 的 StandardLoggingPayload [PR](https://github.com/BerriAI/litellm/pull/9508)
- 追蹤 `litellm_model_name` 於 `StandardLoggingPayload` [Docs](https://docs.litellm.ai/docs/proxy/logging_spec#standardlogginghiddenparams)

## 效能 / 可靠性改善 {#performance--reliability-improvements}
- LiteLLM Redis 語意快取實作 [PR](https://github.com/BerriAI/litellm/pull/9356)
- 當資料庫發生中斷時，優雅地處理例外 [PR](https://github.com/BerriAI/litellm/pull/9533)
- 當 allow_requests_on_db_unavailable: True 且資料庫離線時，允許 Pods 啟動並通過 /health/readiness [PR](https://github.com/BerriAI/litellm/pull/9569)

## 一般改善 {#general-improvements}
- 支援在 litellm proxy 上釋出 MCP tools [PR](https://github.com/BerriAI/litellm/pull/9426)
- 支援透過呼叫它們的 /v1/model endpoint 來探索 Gemini、Anthropic、xAI models [PR](https://github.com/BerriAI/litellm/pull/9530)
- 修正 JWT auth 下非 proxy admins 的 route 檢查 [PR](https://github.com/BerriAI/litellm/pull/9454)
- 新增基礎 Prisma database migrations [PR](https://github.com/BerriAI/litellm/pull/9565)
- 在 /model/info 查看所有 wildcard models [PR](https://github.com/BerriAI/litellm/pull/9572)

## 安全性 {#security}
- 將 UI dashboard 中的 next 從 14.2.21 升級到 14.2.25 [PR](https://github.com/BerriAI/litellm/pull/9458)

## 完整 Git Diff {#complete-git-diff}

[這裡是完整的 git diff](https://github.com/BerriAI/litellm/compare/v1.63.14-stable.patch1...v1.65.0-stable)
