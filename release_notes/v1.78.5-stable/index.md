---
title: "v1.78.5-stable - 原生 OCR 支援"
slug: "v1-78-5"
date: 2025-10-18T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.78.5-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.78.5
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **原生 OCR 端點** - 支援 Mistral OCR 與 Azure AI OCR 的原生 `/v1/ocr` 端點，並具備成本追蹤
- **全域提供者折扣** - 指定全域提供者折扣百分比，以精確進行成本追蹤與報表
- **團隊支出報表** - 團隊管理員現在可以匯出其團隊的詳細支出報表
- **Claude Haiku 4.5** - 在 Bedrock、Vertex AI 和 OpenRouter 上於 Day 0 支援 Claude Haiku 4.5，具備 200K context window
- **GPT-5-Codex** - 透過 OpenAI 與 Azure 的 Responses API 支援 GPT-5-Codex
- **效能改進** - 主要路由器最佳化：O(1) model lookups、10-100x 更快的 shallow copy、30-40% 更快的 timing calls，以及從 O(n) 到 O(1) 的 hash generation

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Anthropic | `claude-haiku-4-5` | 200K | $1.00 | $5.00 | 聊天、推理、視覺、函式呼叫、提示快取、電腦操作 |
| Anthropic | `claude-haiku-4-5-20251001` | 200K | $1.00 | $5.00 | 聊天、推理、視覺、函式呼叫、提示快取、電腦操作 |
| Bedrock | `anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.00 | $5.00 | 聊天、推理、視覺、函式呼叫、提示快取 |
| Bedrock | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.00 | $5.00 | 聊天、推理、視覺、函式呼叫、提示快取 |
| Bedrock | `jp.anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.10 | $5.50 | 聊天、推理、視覺、函式呼叫、提示快取（JP Cross-Region） |
| Bedrock | `us.anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.10 | $5.50 | 聊天、推理、視覺、函式呼叫、提示快取（US region） |
| Bedrock | `eu.anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.10 | $5.50 | 聊天、推理、視覺、函式呼叫、提示快取（EU region） |
| Bedrock | `apac.anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.10 | $5.50 | 聊天、推理、視覺、函式呼叫、提示快取（APAC region） |
| Bedrock | `au.anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.10 | $5.50 | 聊天、推理、視覺、函式呼叫、提示快取（AU region） |
| Vertex AI | `vertex_ai/claude-haiku-4-5@20251001` | 200K | $1.00 | $5.00 | 聊天、推理、視覺、函式呼叫、提示快取 |
| OpenAI | `gpt-5` | 272K | $1.25 | $10.00 | 聊天、responses API、推理、視覺、函式呼叫、提示快取 |
| OpenAI | `gpt-5-codex` | 272K | $1.25 | $10.00 | Responses API 模式 |
| Azure | `azure/gpt-5-codex` | 272K | $1.25 | $10.00 | Responses API 模式 |
| Gemini | `gemini-2.5-flash-image` | 32K | $0.30 | $2.50 | 圖像生成（GA - Nano Banana）- $0.039/圖片 |
| ZhipuAI | `glm-4.6` | - | - | - | 聊天 completions |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - GPT-5 透過 /chat/completions 回傳 reasoning content + GPT-5-Codex 可在 Claude Code 上運作 - [PR #15441](https://github.com/BerriAI/litellm/pull/15441)

- **[Anthropic](../../docs/providers/anthropic)**
    - 將 claude-4-sonnet max_output_tokens 降至 64k - [PR #15409](https://github.com/BerriAI/litellm/pull/15409)
    - 新增 claude-haiku-4.5 - [PR #15579](https://github.com/BerriAI/litellm/pull/15579)
    - 在 Anthropic v1/messages API 中新增對 thinking blocks 與 redacted thinking blocks 的支援 - [PR #15501](https://github.com/BerriAI/litellm/pull/15501)

- **[Bedrock](../../docs/providers/bedrock)**
    - 在 Bedrock、VertexAI 新增 anthropic.claude-haiku-4-5-20251001-v1:0 - [PR #15581](https://github.com/BerriAI/litellm/pull/15581)
    - 新增 Bedrock global 與 US regions 的 Claude Haiku 4.5 支援 - [PR #15650](https://github.com/BerriAI/litellm/pull/15650)
    - 新增 Bedrock 其他 regions 的 Claude Haiku 4.5 支援 - [PR #15653](https://github.com/BerriAI/litellm/pull/15653)
    - 新增 JP Cross-Region Inference jp.anthropic.claude-haiku-4-5-20251001 - [PR #15598](https://github.com/BerriAI/litellm/pull/15598)
    - 修正：bedrock-pricing-geo-inregion-cross-region / 新增 Global Cross-Region Inference - [PR #15685](https://github.com/BerriAI/litellm/pull/15685)
    - 修正：支援 AWS GovCloud Bedrock models 的 us-gov 前綴 - [PR #15626](https://github.com/BerriAI/litellm/pull/15626)
    - 修正 Bedrock 中的 GPT-OSS 現在支援串流。還原假串流 - [PR #15668](https://github.com/BerriAI/litellm/pull/15668)

- **[Gemini](../../docs/providers/gemini)**
    - Feat(pricing): 在 GA 中新增 Gemini 2.5 Flash Image (Nano Banana) - [PR #15557](https://github.com/BerriAI/litellm/pull/15557)
    - 修正：Gemini 2.5 Flash Image 不應具有 supports_web_search=true - [PR #15642](https://github.com/BerriAI/litellm/pull/15642)
    - 移除 penalty params 作為 gemini preview model 的支援參數 - [PR #15503](https://github.com/BerriAI/litellm/pull/15503)

- **[Ollama](../../docs/providers/ollama)**
    - 修正(ollama/chat)：在請求中正確將 reasoning_effort 對應為 think - [PR #15465](https://github.com/BerriAI/litellm/pull/15465)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 在 OpenRouter cost map 中新增 anthropic/claude-sonnet-4.5 - [PR #15472](https://github.com/BerriAI/litellm/pull/15472)
    - 透過 OpenRouter 對 anthropic models 進行提示快取 - [PR #15535](https://github.com/BerriAI/litellm/pull/15535)
    - 直接從 OpenRouter 取得完成成本 - [PR #15448](https://github.com/BerriAI/litellm/pull/15448)
    - 修正 OpenRouter Claude Opus 4 model naming - [PR #15495](https://github.com/BerriAI/litellm/pull/15495)

- **[CometAPI](../../docs/providers/comet)**
    - 修正(cometapi)：改善 CometAPI 提供者支援（embeddings、圖像生成、文件） - [PR #15591](https://github.com/BerriAI/litellm/pull/15591)

- **[Lemonade](../../docs/providers/lemonade)**
    - 為 lemonade provider 新增模型 - [PR #15554](https://github.com/BerriAI/litellm/pull/15554)

- **[Watson X](../../docs/providers/watsonx)**
    - 修正（pricing）：修正多個模型的 watsonx model family 定價 - [PR #15670](https://github.com/BerriAI/litellm/pull/15670)

- **[Vercel AI Gateway](../../docs/providers/vercel_ai_gateway)**
    - 將 glm-4.6 model 新增至 pricing configuration - [PR #15679](https://github.com/BerriAI/litellm/pull/15679)

- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 Vertex AI Discovery Engine Rerank 支援 - [PR #15532](https://github.com/BerriAI/litellm/pull/15532)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正：US regions 中 Claude Sonnet 4.5 的定價高出 10 倍 - [PR #15374](https://github.com/BerriAI/litellm/pull/15374)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 變更 model_price json 中的 gpt-5-codex 支援 - [PR #15540](https://github.com/BerriAI/litellm/pull/15540)

- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 signature calcs 的過濾標頭 - [PR #15590](https://github.com/BerriAI/litellm/pull/15590)

- **一般**
    - 為 gpt-5-codex 新增原生 reasoning 與串流支援旗標 - [PR #15569](https://github.com/BerriAI/litellm/pull/15569)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - Responses API - 在 openai ruby sdk + DB 的 Responses API 串流中，啟用呼叫 anthropic/gemini models - 啟動前 sanity check pending migrations - [PR #15432](https://github.com/BerriAI/litellm/pull/15432)
    - 新增健康檢查中對 responses mode 的支援 - [PR #15658](https://github.com/BerriAI/litellm/pull/15658)

- **[OCR API](../../docs/ocr)**
    - Feat: 新增原生 litellm.ocr() functions - [PR #15567](https://github.com/BerriAI/litellm/pull/15567)
    - Feat: 在 LiteLLM AI Gateway 新增 /ocr route - 新增對原生 Mistral OCR 呼叫的支援 - [PR #15571](https://github.com/BerriAI/litellm/pull/15571)
    - Feat: 新增 Azure AI Mistral OCR Integration - [PR #15572](https://github.com/BerriAI/litellm/pull/15572)
    - Feat: 原生 /ocr endpoint 支援 - [PR #15573](https://github.com/BerriAI/litellm/pull/15573)
    - Feat: 新增 /ocr endpoints 的成本追蹤 - [PR #15678](https://github.com/BerriAI/litellm/pull/15678)

- **[/generateContent](../../docs/providers/gemini)**
    - 修正：GEMINI - CLI - 將 google_routes 新增至 llm_api_routes - [PR #15500](https://github.com/BerriAI/litellm/pull/15500)
    - 修正 Google GenAI 回應中 citationMetadata.citationSources 的 Pydantic validation error - [PR #15592](https://github.com/BerriAI/litellm/pull/15592)

- **[Images API](../../docs/image_generation)**
    - 修正：Image Edits API 的 Dall-e-2 - [PR #15604](https://github.com/BerriAI/litellm/pull/15604)

- **[Bedrock Passthrough](../../docs/pass_through/bedrock)**
    - 功能：允許透過 AI Gateway + config.yaml 上的 models 呼叫 /invoke、/converse 路由 - [PR #15618](https://github.com/BerriAI/litellm/pull/15618)

#### 錯誤 {#bugs}

- **一般**
    - 修正：將物件轉換為正確的型別 - [PR #15634](https://github.com/BerriAI/litellm/pull/15634)
    - 錯誤修正：將標籤作為 metadata dict 時會拋出例外 - [PR #15625](https://github.com/BerriAI/litellm/pull/15625)
    - 為 function_to_dict 新增型別提示並修正拼字錯誤 - [PR #15580](https://github.com/BerriAI/litellm/pull/15580)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 文件：Key Rotations - [PR #15455](https://github.com/BerriAI/litellm/pull/15455)
    - 修正：UI - Key Max Budget Removal Error Fix - [PR #15672](https://github.com/BerriAI/litellm/pull/15672)
    - litellm_Key 設定最大預算移除錯誤修正 - [PR #15669](https://github.com/BerriAI/litellm/pull/15669)

- **團隊**
    - 功能：允許 Team Admins 匯出團隊支出報告 - [PR #15542](https://github.com/BerriAI/litellm/pull/15542)

- **直通**
    - 功能：Passthrough - 允許管理員授予特定 passthrough 端點的存取權限 - [PR #15401](https://github.com/BerriAI/litellm/pull/15401)

- **SCIM v2**
    - 功能(scim_v2.py)：如果 group.id 不存在，則使用 external id + Passthrough - 確保更新與刪除可在各個實例之間持續保留 - [PR #15276](https://github.com/BerriAI/litellm/pull/15276)

- **SSO**
    - 功能：UI SSO - 為 OKTA SSO 新增 PKCE - [PR #15608](https://github.com/BerriAI/litellm/pull/15608)
    - 修正：將 OAuth M2M authentication 與 UI SSO 分離 + 處理 Oauth2 的 Introspection endpoint - [PR #15667](https://github.com/BerriAI/litellm/pull/15667)
    - 修正/entraid app roles jwt claim 清理 - [PR #15583](https://github.com/BerriAI/litellm/pull/15583)

---

## 記錄 / 防護欄 / Prompt 管理整合 {#logging--guardrail--prompt-management-integrations}

#### 防護欄 {#guardrails}

- **一般**
    - 修正 apply_guardrail endpoint 回傳原始字串而非 ApplyGuardrailResponse - [PR #15436](https://github.com/BerriAI/litellm/pull/15436)
    - 修正：確保資料庫更新後防護欄記憶體同步 - [PR #15633](https://github.com/BerriAI/litellm/pull/15633)
    - 功能：為圖片生成新增防護欄 - [PR #15619](https://github.com/BerriAI/litellm/pull/15619)
    - 功能：為 /v1/messages 和 /v1/responses API 新增防護欄 - [PR #15686](https://github.com/BerriAI/litellm/pull/15686)

- **[Pillar Security](../../docs/proxy/guardrails)**
    - 功能：更新 pillar security integration，以支援 litellm proxy 的 no persistence mode - [PR #15599](https://github.com/BerriAI/litellm/pull/15599)

#### Prompt 管理 {#prompt-management}

- **一般**
    - 小修正 code snippet custom_prompt_management.md - [PR #15544](https://github.com/BerriAI/litellm/pull/15544)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本追蹤**
    - 功能：成本追蹤 - 指定全域提供者折扣以計算成本 - [PR #15546](https://github.com/BerriAI/litellm/pull/15546)
    - 功能：UI - 允許在 UI 上設定提供者折扣 - [PR #15550](https://github.com/BerriAI/litellm/pull/15550)

- **預算**
    - 修正：改善預算清晰度 - [PR #15682](https://github.com/BerriAI/litellm/pull/15682)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由器最佳化**
    - 效能(router)：模型別名改用淺拷貝而非 deepcopy - 在巢狀 dict 結構上比 deepcopy 快 10-100 倍 - [PR #15576](https://github.com/BerriAI/litellm/pull/15576)
    - 效能(router)：最佳化雜湊產生中的字串串接 - 將時間複雜度從 O(n²) 改善為 O(n) - [PR #15575](https://github.com/BerriAI/litellm/pull/15575)
    - 效能(router)：使用 O(1) 資料結構最佳化模型查找 - 以索引對映查找取代 O(n) 掃描 - [PR #15578](https://github.com/BerriAI/litellm/pull/15578)
    - 效能(router)：使用 O(1) 索引對映最佳化模型查找 - 使用 model_id_to_deployment_index_map 和 model_name_to_deployment_indices 進行即時查找 - [PR #15574](https://github.com/BerriAI/litellm/pull/15574)
    - 效能(router)：最佳化 completion hot path 中的計時函式 - 使用 time.perf_counter() 進行持續時間測量，並使用 time.monotonic() 進行逾時計算，提供 30-40% 更快的計時呼叫 - [PR #15617](https://github.com/BerriAI/litellm/pull/15617)

- **SSL/TLS 效能**
    - 功能(ssl)：新增可設定的 ECDH curve 以提升 TLS 效能 - 可透過 ssl_ecdh_curve 設定，停用 OpenSSL 3.x 上的 PQC，以獲得更好的效能 - [PR #15617](https://github.com/BerriAI/litellm/pull/15617)

- **Token 計數器**
    - 修正(token-counter)：從 deployment 擷取 model_info 供 custom_tokenizer 使用 - [PR #15680](https://github.com/BerriAI/litellm/pull/15680)

- **效能指標**
    - 新增：效能摘要 - [PR #15458](https://github.com/BerriAI/litellm/pull/15458)

- **CI/CD**
    - 修正：CI/CD - 缺少 env key 與 Linter 型別錯誤 - [PR #15606](https://github.com/BerriAI/litellm/pull/15606)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - Litellm 文件 10 11 2025 - [PR #15457](https://github.com/BerriAI/litellm/pull/15457)
    - 文件：新增 ecs 部署指南 - [PR #15468](https://github.com/BerriAI/litellm/pull/15468)
    - 文件：更新 benchmark 結果 - [PR #15461](https://github.com/BerriAI/litellm/pull/15461)
    - 修正：為 benchmark 文件新增缺少的 context - [PR #15688](https://github.com/BerriAI/litellm/pull/15688)

- **一般**
    - 修正了幾個錯字 - [PR #15267](https://github.com/BerriAI/litellm/pull/15267)

---

## 新貢獻者 {#new-contributors}

* @jlan-nl 首次貢獻見 [PR #15374](https://github.com/BerriAI/litellm/pull/15374)
* @ImadSaddik 首次貢獻見 [PR #15267](https://github.com/BerriAI/litellm/pull/15267)
* @huangyafei 首次貢獻見 [PR #15472](https://github.com/BerriAI/litellm/pull/15472)
* @mubashir1osmani 首次貢獻見 [PR #15468](https://github.com/BerriAI/litellm/pull/15468)
* @kowyo 首次貢獻見 [PR #15465](https://github.com/BerriAI/litellm/pull/15465)
* @dhruvyad 首次貢獻見 [PR #15448](https://github.com/BerriAI/litellm/pull/15448)
* @davizucon 首次貢獻見 [PR #15544](https://github.com/BerriAI/litellm/pull/15544)
* @FelipeRodriguesGare 首次貢獻見 [PR #15540](https://github.com/BerriAI/litellm/pull/15540)
* @ndrsfel 首次貢獻見 [PR #15557](https://github.com/BerriAI/litellm/pull/15557)
* @shinharaguchi 首次貢獻見 [PR #15598](https://github.com/BerriAI/litellm/pull/15598)
* @TensorNull 首次貢獻見 [PR #15591](https://github.com/BerriAI/litellm/pull/15591)
* @TeddyAmkie 首次貢獻見 [PR #15583](https://github.com/BerriAI/litellm/pull/15583)
* @aniketmaurya 首次貢獻見 [PR #15580](https://github.com/BerriAI/litellm/pull/15580)
* @eddierichter-amd 首次貢獻見 [PR #15554](https://github.com/BerriAI/litellm/pull/15554)
* @konekohana 首次貢獻見 [PR #15535](https://github.com/BerriAI/litellm/pull/15535)
* @Classic298 首次貢獻見 [PR #15495](https://github.com/BerriAI/litellm/pull/15495)
* @afogel 首次貢獻見 [PR #15599](https://github.com/BerriAI/litellm/pull/15599)
* @orolega 首次貢獻見 [PR #15633](https://github.com/BerriAI/litellm/pull/15633)
* @LucasSugi 首次貢獻見 [PR #15634](https://github.com/BerriAI/litellm/pull/15634)
* @uc4w6c 首次貢獻見 [PR #15619](https://github.com/BerriAI/litellm/pull/15619)
* @Sameerlite 首次貢獻見 [PR #15658](https://github.com/BerriAI/litellm/pull/15658)
* @yuneng-jiang 首次貢獻見 [PR #15672](https://github.com/BerriAI/litellm/pull/15672)
* @Nikro 首次貢獻見 [PR #15680](https://github.com/BerriAI/litellm/pull/15680)

---

## 完整變更紀錄 {#full-changelog}

**[在 GitHub 上查看完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.78.0-stable...v1.78.4-stable)**
