---
title: "v1.75.8-stable - Team Member Rate Limits"
slug: "v1-75-8"
date: 2025-08-16T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.75.8-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.75.8
```

</TabItem>
</Tabs>

---

## 主要重點 {#key-highlights}

- **團隊成員速率限制** - 為團隊成員提供個別速率限制，並支援 JWT 驗證。
- **效能改進** - 新的實驗性 HTTP 處理器旗標，可讓 OpenAI 請求提升 100+ RPS。
- **GPT-5 模型系列支援** - 完整支援 OpenAI 的 GPT-5 模型，具備 `reasoning_effort` 參數與 Azure OpenAI 整合。
- **Azure AI Flux 圖像生成** - 支援 Azure AI 的 Flux 圖像生成模型。

---

## 團隊成員速率限制 {#team-member-rate-limits}

<Image 
  img={require('../../img/release_notes/team_member_rate_limits.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>
  LiteLLM MCP 架構：在所有 LiteLLM 支援的模型中使用 MCP 工具
</p>

此版本新增了為團隊中的個別成員（包含機器使用者）設定速率限制的支援。團隊現在可以為每個代理程式設定各自的速率限制——如此一來，高流量代理程式就不會影響其他代理程式或人類使用者。

代理程式可以使用 JWT 和與人類使用者相同的團隊角色向 LiteLLM 驗證，同時仍會強制執行每個代理程式的速率限制。

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | -------- |
| Azure AI | `azure_ai/FLUX-1.1-pro` | - | - | $40/image | 圖像生成 |
| Azure AI | `azure_ai/FLUX.1-Kontext-pro` | - | - | $40/image | 圖像生成 |
| Vertex AI | `vertex_ai/deepseek-ai/deepseek-r1-0528-maas` | 65k | $1.35 | $5.4 | 聊天完成 + 推理 |
| OpenRouter | `openrouter/deepseek/deepseek-chat-v3-0324` | 65k | $0.14 | $0.28 | 聊天完成 |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 新增 `reasoning_effort` 參數支援，適用於 GPT-5 模型系列 - [PR #13475](https://github.com/BerriAI/litellm/pull/13475), [開始使用](../../docs/providers/openai#openai-chat-completion-models)
    - 支援 Responses API 中的 `reasoning` 參數 - [PR #13475](https://github.com/BerriAI/litellm/pull/13475), [開始使用](../../docs/response_api)
- **[Azure OpenAI](../../docs/providers/azure/azure)**
    - GPT-5 支援，含 max_tokens 與 `reasoning` 參數 - [PR #13510](https://github.com/BerriAI/litellm/pull/13510), [開始使用](../../docs/providers/azure/azure#gpt-5-models)
- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 支援 bedrock gpt-oss 模型系列的串流 - [PR #13346](https://github.com/BerriAI/litellm/pull/13346), [開始使用](../../docs/providers/bedrock#openai-gpt-oss)
    - `/messages` 端點與 `bedrock/converse/<model>` 相容 - [PR #13627](https://github.com/BerriAI/litellm/pull/13627)
    - 支援 assistant 和 tool 訊息的快取點 - [PR #13640](https://github.com/BerriAI/litellm/pull/13640)
- **[Azure AI](../../docs/providers/azure)**
    - 新的 Azure AI Flux 圖像生成提供者 - [PR #13592](https://github.com/BerriAI/litellm/pull/13592), [開始使用](../../docs/providers/azure_ai_img)
    - 修正圖像生成的 Content-Type 標頭 - [PR #13584](https://github.com/BerriAI/litellm/pull/13584)
- **[CometAPI](../../docs/providers/comet)**
    - 新提供者支援聊天完成與串流 - [PR #13458](https://github.com/BerriAI/litellm/pull/13458)
- **[SambaNova](../../docs/providers/sambanova)**
    - 新增 embedding 模型支援 - [PR #13308](https://github.com/BerriAI/litellm/pull/13308), [開始使用](../../docs/providers/sambanova#sambanova---embeddings)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 `/countTokens` 端點支援，用於 Gemini CLI 整合 - [PR #13545](https://github.com/BerriAI/litellm/pull/13545)
    - VertexAI 模型支援 token counter - [PR #13558](https://github.com/BerriAI/litellm/pull/13558)
- **[hosted_vllm](../../docs/providers/vllm)**
    - 新增 `reasoning_effort` 參數支援 - [PR #13620](https://github.com/BerriAI/litellm/pull/13620), [開始使用](../../docs/providers/vllm#reasoning-effort)

#### 錯誤修正 {#bugs}

- **[OCI](../../docs/providers/oci)**
    - 修正串流問題 - [PR #13437](https://github.com/BerriAI/litellm/pull/13437)
- **[Ollama](../../docs/providers/ollama)**
    - 修正帶有 'thinking' 欄位的 GPT-OSS 串流 - [PR #13375](https://github.com/BerriAI/litellm/pull/13375)
- **[VolcEngine](../../docs/providers/volcengine)**
    - 修正 thinking disabled 參數處理 - [PR #13598](https://github.com/BerriAI/litellm/pull/13598)
- **[串流](../../docs/completion/stream)**
    - 一致的 'finish_reason' 區塊索引 - [PR #13560](https://github.com/BerriAI/litellm/pull/13560)
---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[/messages](../../docs/anthropic/messages)**
    - 對非 anthropic 模型正確回傳 tool use 參數 - [PR #13638](https://github.com/BerriAI/litellm/pull/13638)

#### 錯誤修正 {#bugs-1}

- **[即時 API](../../docs/realtime)**
    - 修正無 intent 情境的端點 - [PR #13476](https://github.com/BerriAI/litellm/pull/13476)
- **[Responses API](../../docs/response_api)**
    - 修正 Responses API 的 `stream=True` + `background=True` - [PR #13654](https://github.com/BerriAI/litellm/pull/13654)

---

## [MCP 閘道](../../docs/mcp) {#mcp-gatewaydocsmcp}

#### 功能 {#features-2}

- **存取控制與設定**
    - 強化 MCPServerManager，支援存取群組與描述 - [PR #13549](https://github.com/BerriAI/litellm/pull/13549)

#### 錯誤修正 {#bugs-2}

- **驗證**
    - 修正 MCP gateway key 驗證 - [PR #13630](https://github.com/BerriAI/litellm/pull/13630)

[閱讀更多](../../docs/mcp)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}

- **團隊管理**
    - Team Member Rate Limits 實作 - [PR #13601](https://github.com/BerriAI/litellm/pull/13601)
    - 支援團隊成員速率限制的 JWT 驗證 - [PR #13601](https://github.com/BerriAI/litellm/pull/13601)
    - 在 UI 中顯示團隊成員 TPM/RPM 限制 - [PR #13662](https://github.com/BerriAI/litellm/pull/13662)
    - 允許編輯團隊成員 RPM/TPM 限制 - [PR #13669](https://github.com/BerriAI/litellm/pull/13669)
    - 允許在 Teams Settings 中取消設定 TPM 和 RPM - [PR #13430](https://github.com/BerriAI/litellm/pull/13430)
    - Team Member Permissions 頁面的存取欄位變更 - [PR #13145](https://github.com/BerriAI/litellm/pull/13145)
- **金鑰管理**
    - 在 UI Keys 頁面顯示後端錯誤 - [PR #13435](https://github.com/BerriAI/litellm/pull/13435)
    - 新增刪除金鑰前的確認對話框 - [PR #13655](https://github.com/BerriAI/litellm/pull/13655)
    - LiteLLM SDK 到 Proxy 通訊支援 `user` 參數 - [PR #13555](https://github.com/BerriAI/litellm/pull/13555)
- **UI 改進**
    - 修正內部使用者表格溢出 - [PR #12736](https://github.com/BerriAI/litellm/pull/12736)
    - 以大數字的簡寫標記強化圖表可讀性 - [PR #12370](https://github.com/BerriAI/litellm/pull/12370)
    - 修正 LiteLLM 模型顯示中的圖像溢出 - [PR #13639](https://github.com/BerriAI/litellm/pull/13639)
    - 移除含糊不清的網路回應錯誤 - [PR #13582](https://github.com/BerriAI/litellm/pull/13582)
- **憑證**
    - 新增 CredentialDeleteModal 元件並與 CredentialsPanel 整合 - [PR #13550](https://github.com/BerriAI/litellm/pull/13550)
- **管理員與權限**
    - 允許管理員檢視者的路由 - [PR #13588](https://github.com/BerriAI/litellm/pull/13588)

#### 錯誤修正 {#bugs-3}

- **SCIM 整合**
    - 修正 SCIM Team Memberships 中繼資料處理 - [PR #13553](https://github.com/BerriAI/litellm/pull/13553)
- **驗證**
    - 修正不正確的 key info 端點 - [PR #13633](https://github.com/BerriAI/litellm/pull/13633)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}

- **[Langfuse OTEL](../../docs/proxy/logging#langfuse)**
    - 為 Langfuse OTEL Logger 新增 key/team 記錄 - [PR #13512](https://github.com/BerriAI/litellm/pull/13512)
    - 修正 LangfuseOtelSpanAttributes 常數以符合預期值 - [PR #13659](https://github.com/BerriAI/litellm/pull/13659)
- **[MLflow](../../docs/proxy/logging#mlflow)**
    - 更新 MLflow logger usage span attributes - [PR #13561](https://github.com/BerriAI/litellm/pull/13561)

#### 錯誤 {#bugs-4}

- **安全性**
    - 隱藏 `/model/info` 中的敏感資料 - azure entra client_secret - [PR #13577](https://github.com/BerriAI/litellm/pull/13577)
    - 修正 trivy/secrets 的誤判 - [PR #13631](https://github.com/BerriAI/litellm/pull/13631)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-5}

- **HTTP 效能**
    - 新增 'EXPERIMENTAL_OPENAI_BASE_LLM_HTTP_HANDLER' 旗標，可使 OpenAI 請求提升 +100 RPS - [PR #13625](https://github.com/BerriAI/litellm/pull/13625)
- **資料庫監控**
    - 將 DB 指標新增至 Prometheus - [PR #13626](https://github.com/BerriAI/litellm/pull/13626)
- **錯誤處理**
    - 新增安全的除以 0 保護以避免當機 - [PR #13624](https://github.com/BerriAI/litellm/pull/13624)

#### 錯誤 {#bugs-5}

- **相依性**
    - 將 boto3 更新至 1.36.0，並將 aioboto3 更新至 13.4.0 - [PR #13665](https://github.com/BerriAI/litellm/pull/13665)

---

## 一般 Proxy 改善 {#general-proxy-improvements}

#### 功能 {#features-6}

- **資料庫**
    - 移除多餘的 `use_prisma_migrate` 旗標 - 現在為預設值 - [PR #13555](https://github.com/BerriAI/litellm/pull/13555)
- **LLM 翻譯**
    - 新增模型 ID 檢查 - [PR #13507](https://github.com/BerriAI/litellm/pull/13507)
    - 重構 Anthropic 設定並新增對 `anthropic_beta` 標頭的支援 - [PR #13590](https://github.com/BerriAI/litellm/pull/13590)

---

## 新貢獻者 {#new-contributors}
* @TensorNull 首次貢獻於 [PR #13458](https://github.com/BerriAI/litellm/pull/13458)
* @MajorD00m 首次貢獻於 [PR #13577](https://github.com/BerriAI/litellm/pull/13577)
* @VerunicaM 首次貢獻於 [PR #13584](https://github.com/BerriAI/litellm/pull/13584)
* @huangyafei 首次貢獻於 [PR #13607](https://github.com/BerriAI/litellm/pull/13607)
* @TomeHirata 首次貢獻於 [PR #13561](https://github.com/BerriAI/litellm/pull/13561)
* @willfinnigan 首次貢獻於 [PR #13659](https://github.com/BerriAI/litellm/pull/13659)
* @dcbark01 首次貢獻於 [PR #13633](https://github.com/BerriAI/litellm/pull/13633)
* @javacruft 首次貢獻於 [PR #13631](https://github.com/BerriAI/litellm/pull/13631)

---

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.75.5-stable.rc-draft...v1.75.8-nightly)** {#full-changeloghttpsgithubcomberriailitellmcomparev1755-stablerc-draftv1758-nightly}
