---
title: "v1.77.7-stable - 中位延遲降低 2.9 倍"
slug: "v1-77-7"
date: 2025-10-04T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
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
docker.litellm.ai/berriai/litellm:v1.77.7.rc.1
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.77.7.rc.1
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **動態速率限制器 v3** - 當容量可用（< 80% 飽和）時，會自動透過允許較低優先級請求使用未使用的容量來最大化吞吐量，之後在高負載（≥ 80%）時切換為依優先級的公平分配，以防止阻塞
- **重大效能改進** - 在 1,000 名並行使用者下，中位延遲降低 2.9 倍。
- **Claude Sonnet 4.5** - 支援 Anthropic 新的 Claude Sonnet 4.5 模型家族，具備 200K+ 上下文與分級定價
- **MCP 閘道增強** - 細粒度工具控制、伺服器權限與可轉發標頭
- **AMD Lemonade 與 Nvidia NIM** - 新增對 AMD Lemonade 與 Nvidia NIM Rerank 的提供者支援
- **GitLab 提示詞管理** - 基於 GitLab 的提示詞管理整合

### 效能 - 中位延遲降低 2.9 倍 {#performance---29x-lower-median-latency}

<Image img={require('../../img/release_notes/perf_77_7.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

這次更新移除了 LiteLLM 路由器的低效率，將複雜度從 O(M×N) 降到 O(1)。先前，它會建立新的陣列，並反覆執行像 data["model"] in llm_router.get_model_ids() 這類檢查。現在，直接的 ID 對部署映射消除了多餘的配置與掃描。

因此，各延遲百分位的效能都有所提升：

- **中位延遲：** 320 ms → **110 ms**（−65.6%）
- **p95 延遲：** 850 ms → **440 ms**（−48.2%）
- **p99 延遲：** 1,400 ms → **810 ms**（−42.1%）
- **平均延遲：** 864 ms → **310 ms**（−64%）

#### 測試設定 {#test-setup}

**Locust**

- **並行使用者：** 1,000
- **漸增：** 500

**系統規格**

- **CPU：** 4 vCPUs
- **記憶體：** 8 GB RAM
- **LiteLLM Workers：** 4
- **Instances**: 4

**設定（config.yaml）**

查看完整設定：[gist.github.com/AlexsanderHamir/config.yaml](https://gist.github.com/AlexsanderHamir/53f7d554a5d2afcf2c4edb5b6be68ff4)

**負載腳本（no_cache_hits.py）**

查看完整負載測試腳本：[gist.github.com/AlexsanderHamir/no_cache_hits.py](https://gist.github.com/AlexsanderHamir/42c33d7a4dc7a57f56a78b560dee3a42)

### MCP OAuth 2.0 支援 {#mcp-oauth-20-support}

<Image img={require('../../img/mcp_updates.jpg')} style={{ width: '800px', height: 'auto' }} />

<br/>

此版本新增對 MCP 伺服器 OAuth 2.0 Client Credentials 的支援。這對**內部開發工具**使用案例非常實用，因為它可讓您的使用者使用自己的憑證來呼叫 MCP 伺服器。例如，讓您的開發人員使用自己的憑證呼叫 Github MCP。

[立即在 Claude Code 上設定](../../docs/tutorials/claude_responses_api#connecting-mcp-servers)

### 排程式金鑰輪替 {#scheduled-key-rotations}

<Image img={require('../../img/release_notes/schedule_key_rotations.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本為 LiteLLM AI Gateway 帶來可排程的虛擬金鑰輪替支援。
 
從此版本起，您可以強制虛擬金鑰依照您選擇的排程輪替，例如每 15 天 / 30 天 / 60 天等。
 
這對需要為正式環境工作負載強制執行安全性政策的 Proxy 管理員非常實用。

[開始使用](../../docs/proxy/virtual_keys#scheduled-key-rotations)

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens） | 輸出（$/1M tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Anthropic | `claude-sonnet-4-5` | 200K | $3.00 | $15.00 | 聊天、推理、視覺、函式呼叫、提示詞快取 |
| Anthropic | `claude-sonnet-4-5-20250929` | 200K | $3.00 | $15.00 | 聊天、推理、視覺、函式呼叫、提示詞快取 |
| Bedrock | `eu.anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.00 | $15.00 | 聊天、推理、視覺、函式呼叫、提示詞快取 |
| Azure AI | `azure_ai/grok-4` | 131K | $5.50 | $27.50 | 聊天、推理、函式呼叫、網頁搜尋 |
| Azure AI | `azure_ai/grok-4-fast-reasoning` | 131K | $0.43 | $1.73 | 聊天、推理、函式呼叫、網頁搜尋 |
| Azure AI | `azure_ai/grok-4-fast-non-reasoning` | 131K | $0.43 | $1.73 | 聊天、函式呼叫、網頁搜尋 |
| Azure AI | `azure_ai/grok-code-fast-1` | 131K | $3.50 | $17.50 | 聊天、函式呼叫、網頁搜尋 |
| Groq | `groq/moonshotai/kimi-k2-instruct-0905` | 上下文視情況而定 | 定價視情況而定 | 定價視情況而定 | 聊天、函式呼叫 |
| Ollama | Ollama Cloud models | 視情況而定 | 免費 | 免費 | 透過 Ollama Cloud 的自架模型 |

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增具分級定價且 200K tokens 以上的 claude-sonnet-4-5 模型家族 - [PR #15041](https://github.com/BerriAI/litellm/pull/15041)
    - 將 anthropic/claude-sonnet-4-5 新增至模型價格 json，並支援提示詞快取 - [PR #15049](https://github.com/BerriAI/litellm/pull/15049)
    - 為 Sonnet 4.5 新增 200K 價格 - [PR #15140](https://github.com/BerriAI/litellm/pull/15140)
    - 在串流回應中新增 /v1/messages 的成本追蹤 - [PR #15102](https://github.com/BerriAI/litellm/pull/15102)
    - 為 Anthropic 路由新增 /v1/messages/count_tokens，以供非管理員使用者存取 - [PR #15034](https://github.com/BerriAI/litellm/pull/15034)
- **[Gemini](../../docs/providers/gemini)**
    - 忽略 gemini 工具的 type 參數 - [PR #15022](https://github.com/BerriAI/litellm/pull/15022)
- **[Vertex AI](../../docs/providers/vertex)**
    - 為 VertexAI 新增 LiteLLM Overhead 指標 - [PR #15040](https://github.com/BerriAI/litellm/pull/15040)
    - 支援 vertex ai 中的 googlemap grounding - [PR #15179](https://github.com/BerriAI/litellm/pull/15179)
- **[Azure](../../docs/providers/azure)**
    - 新增 azure_ai grok-4 模型家族 - [PR #15137](https://github.com/BerriAI/litellm/pull/15137)
    - 在 Azure Batch 的 GET 請求中使用 `extra_query` 參數 - [PR #14997](https://github.com/BerriAI/litellm/pull/14997)
    - 下載結果使用 extra_query（Batch API） - [PR #15025](https://github.com/BerriAI/litellm/pull/15025)
    - 新增對 Azure AD 基於 token 授權的支援 - [PR #14813](https://github.com/BerriAI/litellm/pull/14813)
- **[Ollama](../../docs/providers/ollama)**
    - 新增 ollama cloud models - [PR #15008](https://github.com/BerriAI/litellm/pull/15008)
- **[Groq](../../docs/providers/groq)**
    - 新增 groq/moonshotai/kimi-k2-instruct-0905 - [PR #15079](https://github.com/BerriAI/litellm/pull/15079)
- **[OpenAI](../../docs/providers/openai)**
    - 新增對 GPT 5 codex models 的支援 - [PR #14841](https://github.com/BerriAI/litellm/pull/14841)
- **[DeepInfra](../../docs/providers/deepinfra)**
    - 使用最新定價更新 DeepInfra 模型資料重新整理 - [PR #14939](https://github.com/BerriAI/litellm/pull/14939)
- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 JP 跨區域推論 - [PR #15188](https://github.com/BerriAI/litellm/pull/15188)
    - 新增 "eu.anthropic.claude-sonnet-4-5-20250929-v1:0" - [PR #15181](https://github.com/BerriAI/litellm/pull/15181)
    - 新增 twelvelabs bedrock 非同步 Invoke 支援 - [PR #14871](https://github.com/BerriAI/litellm/pull/14871)
- **[Nvidia NIM](../../docs/providers/nvidia_nim)**
    - 新增 Nvidia NIM Rerank 支援 - [PR #15152](https://github.com/BerriAI/litellm/pull/15152)

### 錯誤修正 {#bug-fixes}

- **[VLLM](../../docs/providers/vllm)**
    - 修正 hosted vllm audio_transcription 中的 response_format 錯誤 - [PR #15010](https://github.com/BerriAI/litellm/pull/15010)
    - 修正 atranscription 傳遞到上游提供者的 kwargs 透傳問題 - [PR #15005](https://github.com/BerriAI/litellm/pull/15005)
- **[OCI](../../docs/providers/oci)**
    - 修正在使用 Proxy 時的 OCI Generative AI 整合 - [PR #15072](https://github.com/BerriAI/litellm/pull/15072)
- **一般**
    - 修正：Authorization 標頭使用正確的 "Bearer" 大小寫 - [PR #14764](https://github.com/BerriAI/litellm/pull/14764)
    - 錯誤修正：gpt-5-chat-latest 的 max_input_tokens 值不正確 - [PR #15116](https://github.com/BerriAI/litellm/pull/15116)
    - 更新原始例外狀況的請求處理 - [PR #15013](https://github.com/BerriAI/litellm/pull/15013)

#### 新增提供者支援 {#new-provider-support}

- **[AMD Lemonade](../../docs/providers/lemonade)**
    - 新增 AMD Lemonade 提供者支援 - [PR #14840](https://github.com/BerriAI/litellm/pull/14840)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 為 Responses API 串流請求回傳成本 - [PR #15053](https://github.com/BerriAI/litellm/pull/15053)

- **[/generateContent](../../docs/providers/gemini)**
    - 新增對原生 Gemini API 翻譯的完整支援 - [PR #15029](https://github.com/BerriAI/litellm/pull/15029)

- **無縫轉送 Gemini 路由**
    - 新增 Gemini generateContent passthrough 成本追蹤 - [PR #15014](https://github.com/BerriAI/litellm/pull/15014)
    - 新增 passthrough 中的 streamGenerateContent 成本追蹤 - [PR #15199](https://github.com/BerriAI/litellm/pull/15199)

- **無縫轉送 Vertex AI 路由**
    - 為 Vertex AI Passthrough `/predict` endpoint 新增成本追蹤 - [PR #15019](https://github.com/BerriAI/litellm/pull/15019)
    - 為 Vertex AI Live API WebSocket Passthrough 新增成本追蹤 - [PR #14956](https://github.com/BerriAI/litellm/pull/14956)

- **一般**
    - 在模型回應串流中保留空白字元 - [PR #15160](https://github.com/BerriAI/litellm/pull/15160)
    - 將提供者名稱新增至 payload 規格 - [PR #15130](https://github.com/BerriAI/litellm/pull/15130)
    - 確保 query params 會從 origin url 傳遞到下游請求 - [PR #15087](https://github.com/BerriAI/litellm/pull/15087)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 確保 LLM_API_KEYs 可存取 passthrough routes - [PR #15115](https://github.com/BerriAI/litellm/pull/15115)
    - 在為屬於團隊的金鑰設定限制時支援 'guaranteed_throughput' - [PR #15120](https://github.com/BerriAI/litellm/pull/15120)
    
- **模型 + 端點**
    - 確保 OCI secret 欄位不會在 /models 和 /v1/models 端點上共享 - [PR #15085](https://github.com/BerriAI/litellm/pull/15085)
    - 在 UI 上新增 snowflake - [PR #15083](https://github.com/BerriAI/litellm/pull/15083)
    - 讓 UI theme 設定可公開存取，以便自訂品牌識別 - [PR #15074](https://github.com/BerriAI/litellm/pull/15074)
    
- **管理員設定**
    - 確保在 UI 上設定後，OTEL 設定會儲存在 DB 中 - [PR #15118](https://github.com/BerriAI/litellm/pull/15118)
    - 頂部 api key 標籤 - [PR #15151](https://github.com/BerriAI/litellm/pull/15151), [PR #15156](https://github.com/BerriAI/litellm/pull/15156)

- **MCP**
    - 顯示 MCP servers 的健康狀態 - [PR #15185](https://github.com/BerriAI/litellm/pull/15185)
    - 允許在 UI 上設定額外標頭 - [PR #15185](https://github.com/BerriAI/litellm/pull/15185)
    - 允許在 UI 上編輯允許的 tools - [PR #15185](https://github.com/BerriAI/litellm/pull/15185)

### 錯誤修正 {#bug-fixes-1}

- **虛擬金鑰**
    - （安全性）防止使用者金鑰更新其他使用者金鑰 - [PR #15201](https://github.com/BerriAI/litellm/pull/15201)
    - （安全性）不要在 /v2/key/info 上回傳 key alias 為空白的所有金鑰 - [PR #15201](https://github.com/BerriAI/litellm/pull/15201)
    - 修正 Session Token Cookie 無限登出迴圈 - [PR #15146](https://github.com/BerriAI/litellm/pull/15146)

- **模型 + 端點**
    - 讓 UI theme 設定可公開存取，以便自訂品牌識別 - [PR #15074](https://github.com/BerriAI/litellm/pull/15074)

- **團隊**
    - 修正 http ui 複製到剪貼簿失敗 - [PR #15195](https://github.com/BerriAI/litellm/pull/15195)

- **記錄**
    - 修正在 filter lookup 時 logs 頁面渲染 logs - [PR #15195](https://github.com/BerriAI/litellm/pull/15195)
    - 修正終端使用者的 lookup 清單（移轉到更有效率的 /customers/list lookup） - [PR #15195](https://github.com/BerriAI/litellm/pull/15195)

- **測試金鑰**
    - 在金鑰變更時更新所選模型 - [PR #15197](https://github.com/BerriAI/litellm/pull/15197)

- **儀表板**
    - 修正儀表板總覽中的 LiteLLM 模型名稱備援 - [PR #14998](https://github.com/BerriAI/litellm/pull/14998)

---

## 記錄 / 防護欄 / 提示管理整合 {#logging--guardrail--prompt-management-integrations}

#### 功能 {#features-3}

- **[OpenTelemetry](../../docs/observability/otel)**
    - 在記錄方法中使用 generation_name 進行 span 命名 - [PR #14799](https://github.com/BerriAI/litellm/pull/14799)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 處理 Langfuse 記錄中的不可序列化物件 - [PR #15148](https://github.com/BerriAI/litellm/pull/15148)
    - 在 langfuse 整合中設定 usage_details.total - [PR #15015](https://github.com/BerriAI/litellm/pull/15015)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 支援 key/team 上的自訂中繼資料標籤 - [PR #15094](https://github.com/BerriAI/litellm/pull/15094)

#### 防護欄 {#guardrails}

- **[Javelin](../../docs/proxy/guardrails)**
    - 為 LiteLLM Proxy 新增 Javelin 獨立防護欄整合 - [PR #14983](https://github.com/BerriAI/litellm/pull/14983)
    - 為防護欄中的重要狀態欄位新增記錄 - [PR #15090](https://github.com/BerriAI/litellm/pull/15090)
    - 若 Bedrock 沒有回傳任何文字，則不要執行 post_call 防護欄 - [PR #15106](https://github.com/BerriAI/litellm/pull/15106)

#### 提示管理 {#prompt-management}

- **[GitLab](../../docs/proxy/prompt_management)**
    - 基於 GitLab 的提示管理器 - [PR #14988](https://github.com/BerriAI/litellm/pull/14988)

---

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本追蹤** 
    - Proxy：responses API 中的終端使用者成本追蹤 - [PR #15124](https://github.com/BerriAI/litellm/pull/15124)
- **平行請求限制器 v3** 
    - 使用廣為人知的 redis cluster 雜湊演算法 - [PR #15052](https://github.com/BerriAI/litellm/pull/15052)
    - 動態速率限制器 v3 的修正 - 新增飽和偵測 - [PR #15119](https://github.com/BerriAI/litellm/pull/15119)
    - 動態速率限制器 v3 - 修正飽和偵測 + 修正飽和後行為 - [PR #15192](https://github.com/BerriAI/litellm/pull/15192)
- **團隊** 
    - 為 LiteLLM 的團隊新增特定模型的 tpm/rpm 限制 - [PR #15044](https://github.com/BerriAI/litellm/pull/15044)

---

## MCP 閘道 {#mcp-gateway}

- **伺服器設定** 
    - 指定可轉送標頭，指定 MCP servers 允許/不允許的 tools - [PR #15002](https://github.com/BerriAI/litellm/pull/15002)
    - 在呼叫 tools 時強制執行伺服器權限 - [PR #15044](https://github.com/BerriAI/litellm/pull/15044)
    - MCP Gateway 細粒度 tools 新增 - [PR #15153](https://github.com/BerriAI/litellm/pull/15153)
- **錯誤修正** 
    - 移除 servername 前綴 mcp tools 測試 - [PR #14986](https://github.com/BerriAI/litellm/pull/14986)
    - 解決重複 Mcp-Protocol-Version 標頭的回歸問題 - [PR #15050](https://github.com/BerriAI/litellm/pull/15050)
    - 修正 test_mcp_server.py - [PR #15183](https://github.com/BerriAI/litellm/pull/15183)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由器最佳化**
    - **+62.5% P99 延遲改善** - 移除路由器低效問題（從 O(M*N) 到 O(1)） - [PR #15046](https://github.com/BerriAI/litellm/pull/15046)
    - 移除 Router 中的 hasattr 檢查 - [PR #15082](https://github.com/BerriAI/litellm/pull/15082)
    - 移除重複查詢 - [PR #15084](https://github.com/BerriAI/litellm/pull/15084)
    - 將 _filter_cooldown_deployments 從 O(n×m + k×n) 最佳化為 O(n) - [PR #15091](https://github.com/BerriAI/litellm/pull/15091)
    - 最佳化 retry path 中不健康 deployment 的過濾（O(n*m) → O(n+m)） - [PR #15110](https://github.com/BerriAI/litellm/pull/15110)
- **快取最佳化**
    - 將 InMemoryCache.evict_cache 的複雜度從 O(n*log(n)) 降低為 O(log(n)) - [PR #15000](https://github.com/BerriAI/litellm/pull/15000)
    - 在快取不可用時避免昂貴操作 - [PR #15182](https://github.com/BerriAI/litellm/pull/15182)
- **工作者管理**
    - 新增 proxy CLI 選項，可在 N 次請求後回收 workers - [PR #15007](https://github.com/BerriAI/litellm/pull/15007)
- **指標與監控**
    - LiteLLM Overhead 指標追蹤 - 新增支援在快取命中時追蹤 litellm overhead - [PR #15045](https://github.com/BerriAI/litellm/pull/15045)

---

## 文件更新 {#documentation-updates}

- **提供者文件** 
    - 依據最新版本更新 litellm 文件 - [PR #15004](https://github.com/BerriAI/litellm/pull/15004)
    - 新增缺少的 api_key 參數 - [PR #15058](https://github.com/BerriAI/litellm/pull/15058)
- **一般文件** 
    - 使用 docker compose 取代 docker-compose - [PR #15024](https://github.com/BerriAI/litellm/pull/15024)
    - 為正在使用 litellm 的專案新增 railtracks - [PR #15144](https://github.com/BerriAI/litellm/pull/15144)
    - 效能：上週改善 - [PR #15193](https://github.com/BerriAI/litellm/pull/15193)
    - 同步 models GitHub 文件與 Loom 影片並互相連結 - [PR #15191](https://github.com/BerriAI/litellm/pull/15191)

---

## 安全性修正 {#security-fixes}

- **JWT Token 安全性** - 不要在 .info() 記錄中記錄 JWT SSO token - [PR #15145](https://github.com/BerriAI/litellm/pull/15145)

---

## 新貢獻者 {#new-contributors}

* @herve-ves 做出了他們的首次貢獻，見 [PR #14998](https://github.com/BerriAI/litellm/pull/14998)
* @wenxi-onyx 做出了他們的首次貢獻，見 [PR #15008](https://github.com/BerriAI/litellm/pull/15008)
* @jpetrucciani 做出了他們的首次貢獻，見 [PR #15005](https://github.com/BerriAI/litellm/pull/15005)
* @abhijitjavelin 做出了他們的首次貢獻，見 [PR #14983](https://github.com/BerriAI/litellm/pull/14983)
* @ZeroClover 做出了他們的首次貢獻，見 [PR #15039](https://github.com/BerriAI/litellm/pull/15039)
* @cedarm 做出了他們的首次貢獻，見 [PR #15043](https://github.com/BerriAI/litellm/pull/15043)
* @Isydmr 做出了他們的首次貢獻，見 [PR #15025](https://github.com/BerriAI/litellm/pull/15025)
* @serializer 做出了他們的首次貢獻，見 [PR #15013](https://github.com/BerriAI/litellm/pull/15013)
* @eddierichter-amd 做出了他們的首次貢獻，見 [PR #14840](https://github.com/BerriAI/litellm/pull/14840)
* @malags 做出了他們的首次貢獻，見 [PR #15000](https://github.com/BerriAI/litellm/pull/15000)
* @henryhwang 做出了他們的首次貢獻，見 [PR #15029](https://github.com/BerriAI/litellm/pull/15029)
* @plafleur 做出了他們的首次貢獻，見 [PR #15111](https://github.com/BerriAI/litellm/pull/15111)
* @tyler-liner 做出了他們的首次貢獻，見 [PR #14799](https://github.com/BerriAI/litellm/pull/14799)
* @Amir-R25 做出了他們的首次貢獻，見 [PR #15144](https://github.com/BerriAI/litellm/pull/15144)
* @georg-wolflein 做出了他們的首次貢獻，見 [PR #15124](https://github.com/BerriAI/litellm/pull/15124)
* @niharm 做出了他們的首次貢獻，見 [PR #15140](https://github.com/BerriAI/litellm/pull/15140)
* @anthony-liner 做出了他們的首次貢獻，見 [PR #15015](https://github.com/BerriAI/litellm/pull/15015)
* @rishiganesh2002 做出了他們的首次貢獻，見 [PR #15153](https://github.com/BerriAI/litellm/pull/15153)
* @danielaskdd 做出了他們的首次貢獻，見 [PR #15160](https://github.com/BerriAI/litellm/pull/15160)
* @JVenberg 做出了他們的首次貢獻，見 [PR #15146](https://github.com/BerriAI/litellm/pull/15146)
* @speglich 做出了他們的首次貢獻，見 [PR #15072](https://github.com/BerriAI/litellm/pull/15072)
* @daily-kim 做出了他們的首次貢獻，見 [PR #14764](https://github.com/BerriAI/litellm/pull/14764)

---

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.77.5.rc.4...v1.77.7.rc.1)** {#full-changeloghttpsgithubcomberriailitellmcomparev1775rc4v1777rc1}
