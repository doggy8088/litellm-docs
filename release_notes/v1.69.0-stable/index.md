---
title: v1.69.0-stable - 負載平衡批次 API 模型
slug: v1.69.0-stable
date: 2025-05-10T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
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
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.69.0-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.69.0.post1
```
</TabItem>
</Tabs>

## 重點摘要 {#key-highlights}

LiteLLM v1.69.0-stable 帶來以下主要改進：

- **負載平衡批次 API 模型**：使用 LiteLLM Managed Files，輕鬆在多個 azure batch 部署之間進行負載平衡
- **Email 邀請 2.0**：向新加入 LiteLLM 的使用者傳送 email 邀請。
- **Nscale**：符合歐洲法規的 LLM API。
- **Bedrock /v1/messages**：使用 Anthropic 的 /v1/messages 搭配 Bedrock Anthropic 模型。

## 批次 API 負載平衡 {#batch-api-load-balancing}

<Image 
img={require('../../img/release_notes/lb_batch.png')}
  style={{width: '100%', display: 'block', margin: '0 0 2rem 0'}}
/>

此版本為 Batch 帶來 LiteLLM Managed File 支援。這對以下情境很有幫助：

- Proxy 管理員：您現在可以控制使用者可呼叫哪些 Batch 模型。
- 開發者：在建立 batch .jsonl 檔案時，您不再需要知道 Azure 部署名稱，只要指定您的 LiteLLM 金鑰可存取的模型即可。 

隨著時間推移，我們預期 LiteLLM Managed Files 會成為大多數團隊在 `/chat/completions`、`/batch`、`/fine_tuning` 端點中使用 Files 的方式。 

[在此閱讀更多](https://docs.litellm.ai/docs/proxy/managed_batches)

## Email 邀請 {#email-invites}

<Image 
  img={require('../../img/email_2_0.png')}
  style={{width: '100%', display: 'block', margin: '0 0 2rem 0'}}
/>

此版本為我們的 email 邀請整合帶來以下改進：
- 新增使用者受邀與金鑰建立事件的新範本。
- 修正使用 SMTP email 提供者時的問題。
- 原生支援 Resend API。
- 讓 Proxy 管理員能控制 email 事件。 

對於 LiteLLM Cloud 使用者，如果您希望在您的執行個體啟用此功能，請與我們聯絡。 

[在此閱讀更多](https://docs.litellm.ai/docs/proxy/email)

## 新模型 / 更新模型 {#new-models--updated-models}
- **Gemini ([VertexAI](https://docs.litellm.ai/docs/providers/vertex#usage-with-litellm-proxy-server) + [Google AI Studio](https://docs.litellm.ai/docs/providers/gemini))**
    - 新增 `gemini-2.5-pro-preview-05-06` 模型的定價與 context window 資訊 - [PR](https://github.com/BerriAI/litellm/pull/10597)
    - 為所有 Gemini 2.5 變體設定正確的 context window 長度 - [PR](https://github.com/BerriAI/litellm/pull/10690)
- **[Perplexity](../../docs/providers/perplexity)**: 
    - 新增 Perplexity 模型 - [PR](https://github.com/BerriAI/litellm/pull/10652) 
    - 新增 sonar-deep-research 模型定價 - [PR](https://github.com/BerriAI/litellm/pull/10537)
- **[Azure OpenAI](../../docs/providers/azure)**: 
  - 修正 azure_ad_token_provider 參數的傳遞 - [PR](https://github.com/BerriAI/litellm/pull/10694)
- **[OpenAI](../../docs/providers/openai)**:
    - 新增在 'file' 參數中支援 pdf 網址 - [PR](https://github.com/BerriAI/litellm/pull/10640)
- **[Sagemaker](../../docs/providers/aws_sagemaker)**:
    - 修正 `sagemaker_chat` 提供者的內容長度 - [PR](https://github.com/BerriAI/litellm/pull/10607)
- **[Azure AI Foundry](../../docs/providers/azure_ai)**: 
    - 新增以下模型的成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9956)
        - DeepSeek V3 0324
        - Llama 4 Scout
        - Llama 4 Maverick
- **[Bedrock](../../docs/providers/bedrock)**: 
    - 新增 Bedrock Llama 4 模型的成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/10582)
    - 修正 Bedrock 中 Llama 4 模型的範本轉換 - [PR](https://github.com/BerriAI/litellm/pull/10582)
    - 新增支援使用 Bedrock Anthropic 模型搭配 /v1/messages 格式 - [PR](https://github.com/BerriAI/litellm/pull/10681)
    - 新增 Bedrock Anthropic 模型搭配 /v1/messages 格式的串流支援 - [PR](https://github.com/BerriAI/litellm/pull/10710)
- **[OpenAI](../../docs/providers/openai)**: 新增 `reasoning_effort` 對 `o3` 模型的支援 - [PR](https://github.com/BerriAI/litellm/pull/10591)
- **[Databricks](../../docs/providers/databricks)**:
    - 修正 Databricks 使用外部模型且 delta 可能為空時的問題 - [PR](https://github.com/BerriAI/litellm/pull/10540)
- **[Cerebras](../../docs/providers/cerebras)**: 修正 Llama-3.1-70b 模型定價與 context window - [PR](https://github.com/BerriAI/litellm/pull/10648)
- **[Ollama](../../docs/providers/ollama)**: 
    - 修正自訂價格成本追蹤，並新增 'max_completion_token' 支援 - [PR](https://github.com/BerriAI/litellm/pull/10636)
    - 修正使用 JSON 回應格式時的 KeyError - [PR](https://github.com/BerriAI/litellm/pull/10611)
- 🆕 **[Nscale](../../docs/providers/nscale)**: 
    - 新增對 chat、image generation 端點的支援 - [PR](https://github.com/BerriAI/litellm/pull/10638)

## LLM API 端點 {#llm-api-endpoints}
- **[Messages API](../../docs/anthropic_unified)**: 
    - 🆕 新增支援使用 Bedrock Anthropic 模型搭配 /v1/messages 格式 - [PR](https://github.com/BerriAI/litellm/pull/10681) 以及串流支援 - [PR](https://github.com/BerriAI/litellm/pull/10710)
- **[Moderations API](../../docs/moderations)**: 
    - 修正允許在 /moderations API 使用 LiteLLM UI 憑證的錯誤 - [PR](https://github.com/BerriAI/litellm/pull/10723)  
- **[Realtime API](../../docs/realtime)**: 
    - 修正 websocket 驗證請求中作用域內的 'headers' 設定，以及無限迴圈問題 - [PR](https://github.com/BerriAI/litellm/pull/10679)
- **[Files API](../../docs/proxy/litellm_managed_files)**:
    - 統一的 File ID 輸出支援 - [PR](https://github.com/BerriAI/litellm/pull/10713)
    - 支援將檔案寫入所有部署 - [PR](https://github.com/BerriAI/litellm/pull/10708)
    - 新增目標模型名稱驗證 - [PR](https://github.com/BerriAI/litellm/pull/10722)
- **[Batches API](../../docs/batches)**:
    - 完整的統一 batch ID 支援 - 將 jsonl 中的模型替換為部署模型名稱 - [PR](https://github.com/BerriAI/litellm/pull/10719)
  - Batch 的統一檔案 ID（managed files）提供 Beta 支援 - [PR](https://github.com/BerriAI/litellm/pull/10650)

## 支出追蹤 / 預算改進 {#spend-tracking--budget-improvements}
- 錯誤修正 - DB 支出追蹤中的 PostgreSQL Integer Overflow 錯誤 - [PR](https://github.com/BerriAI/litellm/pull/10697)

## 管理端點 / UI {#management-endpoints--ui}
- **模型**
    - 修正透過 UI 編輯模型時的模型資訊覆寫問題 - [PR](https://github.com/BerriAI/litellm/pull/10726)
    - 修正以特定模型進行團隊管理員模型更新與組織建立的問題 - [PR](https://github.com/BerriAI/litellm/pull/10539)
- **記錄**:
  - 錯誤修正 -  在 Logs 頁面複製 Request/Response - [PR](https://github.com/BerriAI/litellm/pull/10720)
  - 錯誤修正 -  QA Logs 頁面上的 log 未維持焦點，以及錯誤 logs 的文字溢出 - [PR](https://github.com/BerriAI/litellm/pull/10725)
  - 為 LiteLLM_SpendLogs 新增 session_id 索引，以提升查詢效能 - [PR](https://github.com/BerriAI/litellm/pull/10727)
- **User Management**:
  - 為 Python 用戶端函式庫與 CLI 新增使用者管理功能 - [PR](https://github.com/BerriAI/litellm/pull/10627)
  - 錯誤修正 - 修正 Admin UI 上的 SCIM token 建立 - [PR](https://github.com/BerriAI/litellm/pull/10628)
  - 錯誤修正 - 在嘗試刪除不存在的驗證 token 時新增 404 回應 - [PR](https://github.com/BerriAI/litellm/pull/10605)

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}
- **Custom Logger API**: v2 自訂回呼 API（將 llm logs 傳送至自訂 api） - [PR](https://github.com/BerriAI/litellm/pull/10575), [開始使用](https://docs.litellm.ai/docs/proxy/logging#custom-callback-apis-async)
- **OpenTelemetry**:
  - 修正 OpenTelemetry 以遵循 genai semantic conventions + 支援 TTS 的 'instructions' 參數 - [PR](https://github.com/BerriAI/litellm/pull/10608)
- ** Bedrock PII**:
  - 新增支援使用 bedrock guardrails 進行 PII 遮罩 - [開始使用](https://docs.litellm.ai/docs/proxy/guardrails/bedrock#pii-masking-with-bedrock-guardrails), [PR](https://github.com/BerriAI/litellm/pull/10608)
- **文件**:
  - 新增 StandardLoggingVectorStoreRequest 文件 - [PR](https://github.com/BerriAI/litellm/pull/10535)

## 效能 / 可靠性改進 {#performance--reliability-improvements}
- **Python 相容性**：
  - 新增支援 Python 3.11-（修正 datetime UTC 處理） - [PR](https://github.com/BerriAI/litellm/pull/10701)
  - 修正 Windows 上在 litellm 匯入期間的 UnicodeDecodeError: 'charmap' - [PR](https://github.com/BerriAI/litellm/pull/10542)
- **快取**：
  - 修正 embedding 字串快取結果 - [PR](https://github.com/BerriAI/litellm/pull/10700)
  - 修正 Gemini 模型在 response_format 下的快取遺漏 - [PR](https://github.com/BerriAI/litellm/pull/10635)

## 一般代理閘道改進 {#general-proxy-improvements}
- **Proxy CLI**：
  - 新增 `--version` 標誌至 `litellm-proxy` CLI - [PR](https://github.com/BerriAI/litellm/pull/10704)
  - 新增專用的 `litellm-proxy` CLI - [PR](https://github.com/BerriAI/litellm/pull/10578)
- **警示**：
  - 修正使用資料庫時 Slack 警示無法運作的問題 - [PR](https://github.com/BerriAI/litellm/pull/10370)
- **電子郵件邀請**：
  - 新增 V2 電子郵件，修正建立金鑰時寄送電子郵件的問題，並支援 Resend API - [PR](https://github.com/BerriAI/litellm/pull/10602)
  - 新增使用者邀請電子郵件 - [PR](https://github.com/BerriAI/litellm/pull/10615)
  - 新增管理電子郵件設定的端點 - [PR](https://github.com/BerriAI/litellm/pull/10646)
- **一般**：
  - 修正重複 JSON 記錄被輸出的錯誤 - [PR](https://github.com/BerriAI/litellm/pull/10580)

## 新貢獻者 {#new-contributors}
- [@zoltan-ongithub](https://github.com/zoltan-ongithub) 在 [PR #10568](https://github.com/BerriAI/litellm/pull/10568) 做出了他的第一次貢獻
- [@mkavinkumar1](https://github.com/mkavinkumar1) 在 [PR #10548](https://github.com/BerriAI/litellm/pull/10548) 做出了他的第一次貢獻
- [@thomelane](https://github.com/thomelane) 在 [PR #10549](https://github.com/BerriAI/litellm/pull/10549) 做出了他的第一次貢獻
- [@frankzye](https://github.com/frankzye) 在 [PR #10540](https://github.com/BerriAI/litellm/pull/10540) 做出了他的第一次貢獻
- [@aholmberg](https://github.com/aholmberg) 在 [PR #10591](https://github.com/BerriAI/litellm/pull/10591) 做出了他的第一次貢獻
- [@aravindkarnam](https://github.com/aravindkarnam) 在 [PR #10611](https://github.com/BerriAI/litellm/pull/10611) 做出了他的第一次貢獻
- [@xsg22](https://github.com/xsg22) 在 [PR #10648](https://github.com/BerriAI/litellm/pull/10648) 做出了他的第一次貢獻
- [@casparhsws](https://github.com/casparhsws) 在 [PR #10635](https://github.com/BerriAI/litellm/pull/10635) 做出了他的第一次貢獻
- [@hypermoose](https://github.com/hypermoose) 在 [PR #10370](https://github.com/BerriAI/litellm/pull/10370) 做出了他的第一次貢獻
- [@tomukmatthews](https://github.com/tomukmatthews) 在 [PR #10638](https://github.com/BerriAI/litellm/pull/10638) 做出了他的第一次貢獻
- [@keyute](https://github.com/keyute) 在 [PR #10652](https://github.com/BerriAI/litellm/pull/10652) 做出了他的第一次貢獻
- [@GPTLocalhost](https://github.com/GPTLocalhost) 在 [PR #10687](https://github.com/BerriAI/litellm/pull/10687) 做出了他的第一次貢獻
- [@husnain7766](https://github.com/husnain7766) 在 [PR #10697](https://github.com/BerriAI/litellm/pull/10697) 做出了他的第一次貢獻
- [@claralp](https://github.com/claralp) 在 [PR #10694](https://github.com/BerriAI/litellm/pull/10694) 做出了他的第一次貢獻
- [@mollux](https://github.com/mollux) 在 [PR #10690](https://github.com/BerriAI/litellm/pull/10690) 做出了他的第一次貢獻
