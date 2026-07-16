---
title: v1.70.1-stable - Gemini Realtime API 支援
slug: v1.70.1-stable
date: 2025-05-17T10:00:00
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
docker.litellm.ai/berriai/litellm:main-v1.70.1-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.70.1
```
</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

LiteLLM v1.70.1-stable 現已上線。以下是此版本的主要亮點：

- **Gemini Realtime API**：您現在可以透過 OpenAI /v1/realtime API 呼叫 Gemini 的 Live API
- **Spend Logs 保留期間**：可啟用刪除超過特定期間的 spend logs。
- **PII Masking 2.0**：可在 UI 上輕鬆設定遮罩或封鎖特定 PII/PHI 實體

## Gemini 即時 API {#gemini-realtime-api}

<Image img={require('../../img/gemini_realtime.png')}/>

此版本加入了透過 OpenAI 的 /v1/realtime API 呼叫 Gemini 即時模型（例如 gemini-2.0-flash-live）的支援。這對開發者非常有幫助，因為只需變更模型名稱，就能輕鬆從 OpenAI 切換到 Gemini。 

主要亮點： 
- 支援文字 + 音訊輸入/輸出
- 支援以 OpenAI 格式設定工作階段設定（多模態、指示、活動偵測）
- 支援即時工作階段的記錄 + 用量追蹤

目前可透過 Google AI Studio 使用。我們計畫在未來一週內推出 VertexAI 支援。

[**閱讀更多**](../../docs/providers/google_ai_studio/realtime)

## Spend Logs 保留期間 {#spend-logs-retention-period}

<Image img={require('../../img/delete_spend_logs.jpg')}/>

此版本可刪除超過特定期間的 LiteLLM Spend Logs。由於現在我們啟用了在記錄中儲存原始請求/回應，刪除舊紀錄可確保資料庫在正式環境中維持良好效能。 

[**閱讀更多**](../../docs/proxy/spend_logs_deletion)

## PII 遮罩 2.0 {#pii-masking-20}

<Image img={require('../../img/pii_masking_v2.png')}/>

此版本改進了我們的 Presidio PII 整合。作為 Proxy 管理員，您現在可以：

- 遮罩或封鎖特定實體（例如，封鎖醫療執照，同時遮罩其他實體，如電子郵件）。
- 在正式環境中監控防護欄。LiteLLM Logs 現在會顯示防護欄執行、它偵測到的實體，以及每個實體的信心分數。

[**閱讀更多**](../../docs/proxy/guardrails/pii_masking_v2)

## 新模型 / 更新模型 {#new-models--updated-models}

- **Gemini（[VertexAI](https://docs.litellm.ai/docs/providers/vertex#usage-with-litellm-proxy-server) + [Google AI Studio](https://docs.litellm.ai/docs/providers/gemini)）**
    - `/chat/completion`
        - 處理音訊輸入 - [PR](https://github.com/BerriAI/litellm/pull/10739)
        - 透過將 constants 中的 DEFAULT_MAX_RECURSE_DEPTH 從 10 提升到 100，修正使用深層巢狀回應 schema 搭配 Vertex AI 時的最大遞迴深度問題。 [PR](https://github.com/BerriAI/litellm/pull/10798)
        - 在串流模式中擷取 reasoning tokens - [PR](https://github.com/BerriAI/litellm/pull/10789)
- **[Google AI Studio](../../docs/providers/google_ai_studio/realtime)**
    - `/realtime`
        - Gemini Multimodal Live API 支援
        - 音訊輸入/輸出支援、可選參數對應、精確用量計算 - [PR](https://github.com/BerriAI/litellm/pull/10909)
- **[VertexAI](../../docs/providers/vertex#metallama-api)**
    - `/chat/completion`
        - 修正 llama 串流錯誤 - 模型回應在回傳的串流區塊中巢狀包裹 - [PR](https://github.com/BerriAI/litellm/pull/10878)
- **[Ollama](../../docs/providers/ollama)**
    - `/chat/completion`
        - 結構化回應修正 - [PR](https://github.com/BerriAI/litellm/pull/10617)
- **[Bedrock](../../docs/providers/bedrock#litellm-proxy-usage)**
    - [`/chat/completion`](../../docs/providers/bedrock#litellm-proxy-usage)
        - 在 assistant.content 為 None 時處理 thinking_blocks - [PR](https://github.com/BerriAI/litellm/pull/10688)
        - 修正僅允許工具 json schema 接受欄位 - [PR](https://github.com/BerriAI/litellm/pull/10062)
        - 新增 bedrock sonnet 提示詞快取成本資訊
        - Mistral Pixtral 支援 - [PR](https://github.com/BerriAI/litellm/pull/10439)
        - 工具快取支援 - [PR](https://github.com/BerriAI/litellm/pull/10897)
    - [`/messages`](../../docs/anthropic_unified)
        - 允許使用動態 AWS 參數 - [PR](https://github.com/BerriAI/litellm/pull/10769)
- **[Nvidia NIM](../../docs/providers/nvidia_nim)**
    - [`/chat/completion`](../../docs/providers/nvidia_nim#usage---litellm-proxy-server)
        - 新增 tools、tool_choice、parallel_tool_calls 支援 - [PR](https://github.com/BerriAI/litellm/pull/10763)
- **[Novita AI](../../docs/providers/novita)**
    - 新增提供者，用於 `/chat/completion` 路由 - [PR](https://github.com/BerriAI/litellm/pull/9527)
- **[Azure](../../docs/providers/azure)**
    - [`/image/generation`](../../docs/providers/azure#image-generation)
        - 修正使用自訂模型名稱呼叫 azure dall e 3 - [PR](https://github.com/BerriAI/litellm/pull/10776)
- **[Cohere](../../docs/providers/cohere)**
    - [`/embeddings`](../../docs/providers/cohere#embedding)
        - 遷移 embedding 以使用 `/v2/embed` - 新增 output_dimensions 參數支援 - [PR](https://github.com/BerriAI/litellm/pull/10809)
- **[Anthropic](../../docs/providers/anthropic)**
    - [`/chat/completion`](../../docs/providers/anthropic#usage-with-litellm-proxy)
        - 網路搜尋工具支援 - 原生 + openai 格式 - [Get Started](../../docs/providers/anthropic#anthropic-hosted-tools-computer-text-editor-web-search)
- **[VLLM](../../docs/providers/vllm)**
    - [`/embeddings`](../../docs/providers/vllm#embeddings)
        - 支援將 embedding 輸入作為整數清單
- **[OpenAI](../../docs/providers/openai)**
    - [`/chat/completion`](../../docs/providers/openai#usage---litellm-proxy-server)
        - 修正 - b64 檔案資料輸入處理 - [Get Started](../../docs/providers/openai#pdf-file-parsing)
        - 將 ‘supports_pdf_input’ 新增至所有 vision models - [PR](https://github.com/BerriAI/litellm/pull/10897)

## LLM API 端點 {#llm-api-endpoints}
- [**Responses API**](../../docs/response_api)
    - 修正 delete API 支援 - [PR](https://github.com/BerriAI/litellm/pull/10845)
- [**Rerank API**](../../docs/rerank)
    - `/v2/rerank` 現已註冊為 ‘llm_api_route’ - 使非管理員也能呼叫它 - [PR](https://github.com/BerriAI/litellm/pull/10861)

## Spend Tracking 改進 {#spend-tracking-improvements}
- **`/chat/completion`, `/messages`**
    - Anthropic - 網路搜尋工具成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/10846)
    - Groq - 更新模型最大 tokens + 成本資訊 - [PR](https://github.com/BerriAI/litellm/pull/10077)
- **`/audio/transcription`**
    - Azure - 新增 gpt-4o-mini-tts 定價 - [PR](https://github.com/BerriAI/litellm/pull/10807)
    - Proxy - 修正依標籤追蹤 spend - [PR](https://github.com/BerriAI/litellm/pull/10832)
- **`/embeddings`**
    - Azure AI - 新增 cohere embed v4 定價 - [PR](https://github.com/BerriAI/litellm/pull/10806)

## 管理端點 / UI {#management-endpoints--ui}
- **模型**
    - Ollama - 在 UI 中新增 api base 參數 
- **記錄**
    - 在記錄中新增 team id、key alias、key hash 篩選器 - https://github.com/BerriAI/litellm/pull/10831
    - 防護欄追蹤現在可在 Logs UI 中查看 - https://github.com/BerriAI/litellm/pull/10893
- **團隊**
    - 在 team 位於 org 內且 members 不在 org 內時，修正更新 team 資訊的補丁 - https://github.com/BerriAI/litellm/pull/10835
- **防護欄**
    - 在 UI 上新增 Bedrock、Presidio、Lakers 防護欄 - https://github.com/BerriAI/litellm/pull/10874
    - 查看防護欄資訊頁面 - https://github.com/BerriAI/litellm/pull/10904
    - 允許在 UI 上編輯防護欄 - https://github.com/BerriAI/litellm/pull/10907
- **測試金鑰**
    - 在 UI 上選擇要測試的防護欄 

## 記錄 / 告警整合 {#logging--alerting-integrations}
- **[StandardLoggingPayload](../../docs/proxy/logging_spec)**
    - 在請求者中繼資料中記錄任何 `x-` 標頭 - [Get Started](../../docs/proxy/logging_spec#standardloggingmetadata)
    - 防護欄追蹤現在可在 standard logging payload 中使用 - [Get Started](../../docs/proxy/logging_spec#standardloggingguardrailinformation)
- **[Generic API Logger](../../docs/proxy/logging#custom-callback-apis-async)**
    - 支援傳遞 application/json 標頭 
- **[Arize Phoenix](../../docs/observability/phoenix_integration)**
    - 修正：為 Phoenix 整合對 OTEL_EXPORTER_OTLP_TRACES_HEADERS 進行 URL 編碼 - [PR](https://github.com/BerriAI/litellm/pull/10654)
    - 將防護欄追蹤新增至 OTEL、Arize phoenix - [PR](https://github.com/BerriAI/litellm/pull/10896)
- **[PagerDuty](../../docs/proxy/pagerduty)**
    - Pagerduty 現在是免費功能 - [PR](https://github.com/BerriAI/litellm/pull/10857)
- **[Alerting](../../docs/proxy/alerting)**
    - 對 virtual key/user/team 更新傳送 slack alerts 現在是免費的 - [PR](https://github.com/BerriAI/litellm/pull/10863)

## 防護欄 {#guardrails}
- **防護欄**
    - 用於直接測試防護欄的新 `/apply_guardrail` 端點 - [PR](https://github.com/BerriAI/litellm/pull/10867)
- **[Lakera](../../docs/proxy/guardrails/lakera_ai)**
    - 支援 `/v2` 端點 - [PR](https://github.com/BerriAI/litellm/pull/10880)
- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 修正 presidio 防護欄整合中訊息內容的處理 - [PR](https://github.com/BerriAI/litellm/pull/10197)
    - 允許指定 PII Entities Config - [PR](https://github.com/BerriAI/litellm/pull/10810)
- **[Aim Security](../../docs/proxy/guardrails/aim_security)**
    - 支援 AIM Guardrails 中的匿名化 - [PR](https://github.com/BerriAI/litellm/pull/10757)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}
- **允許使用 .env 變數覆寫所有常數** - [PR](https://github.com/BerriAI/litellm/pull/10803)
- **[Spend logs 的最大保留期限](../../docs/proxy/spend_logs_deletion)**
    - 在設定中新增保留旗標 - [PR](https://github.com/BerriAI/litellm/pull/10815)
    - 支援根據已設定的時間區間清理記錄 - [PR](https://github.com/BerriAI/litellm/pull/10872)

## 一般 Proxy 改進 {#general-proxy-improvements}
- **驗證**
    - 在 x-litellm-api-key 自訂標頭中處理 Bearer $LITELLM_API_KEY [PR](https://github.com/BerriAI/litellm/pull/10776)
- **新的 Enterprise pip 套件** - `litellm-enterprise` - 修正使用 pip 套件時找不到 `enterprise` 資料夾的問題  
- **[Proxy CLI](../../docs/proxy/management_cli)**
    - 新增 `models import` 指令 - [PR](https://github.com/BerriAI/litellm/pull/10581)
- **[OpenWebUI](../../docs/tutorials/openweb_ui#per-user-tracking)**
    - 設定 LiteLLM 從 Open Web UI 解析使用者標頭
- **[LiteLLM Proxy w/ LiteLLM SDK](../../docs/providers/litellm_proxy#send-all-sdk-requests-to-litellm-proxy)**
    - 在透過 LiteLLM SDK 呼叫時，選項可強制／一律使用 litellm proxy

## 新貢獻者 {#new-contributors}
* [@imdigitalashish](https://github.com/imdigitalashish) 在 PR [#10617](https://github.com/BerriAI/litellm/pull/10617) 中首次貢獻
* [@LouisShark](https://github.com/LouisShark) 在 PR [#10688](https://github.com/BerriAI/litellm/pull/10688) 中首次貢獻
* [@OscarSavNS](https://github.com/OscarSavNS) 在 PR [#10764](https://github.com/BerriAI/litellm/pull/10764) 中首次貢獻
* [@arizedatngo](https://github.com/arizedatngo) 在 PR [#10654](https://github.com/BerriAI/litellm/pull/10654) 中首次貢獻
* [@jugaldb](https://github.com/jugaldb) 在 PR [#10805](https://github.com/BerriAI/litellm/pull/10805) 中首次貢獻
* [@daikeren](https://github.com/daikeren) 在 PR [#10781](https://github.com/BerriAI/litellm/pull/10781) 中首次貢獻
* [@naliotopier](https://github.com/naliotopier) 在 PR [#10077](https://github.com/BerriAI/litellm/pull/10077) 中首次貢獻
* [@damienpontifex](https://github.com/damienpontifex) 在 PR [#10813](https://github.com/BerriAI/litellm/pull/10813) 中首次貢獻
* [@Dima-Mediator](https://github.com/Dima-Mediator) 在 PR [#10789](https://github.com/BerriAI/litellm/pull/10789) 中首次貢獻
* [@igtm](https://github.com/igtm) 在 PR [#10814](https://github.com/BerriAI/litellm/pull/10814) 中首次貢獻
* [@shibaboy](https://github.com/shibaboy) 在 PR [#10752](https://github.com/BerriAI/litellm/pull/10752) 中首次貢獻
* [@camfarineau](https://github.com/camfarineau) 在 PR [#10629](https://github.com/BerriAI/litellm/pull/10629) 中首次貢獻
* [@ajac-zero](https://github.com/ajac-zero) 在 PR [#10439](https://github.com/BerriAI/litellm/pull/10439) 中首次貢獻
* [@damgem](https://github.com/damgem) 在 PR [#9802](https://github.com/BerriAI/litellm/pull/9802) 中首次貢獻
* [@hxdror](https://github.com/hxdror) 在 PR [#10757](https://github.com/BerriAI/litellm/pull/10757) 中首次貢獻
* [@wwwillchen](https://github.com/wwwillchen) 在 PR [#10894](https://github.com/BerriAI/litellm/pull/10894) 中首次貢獻

## 示範執行個體 {#demo-instance}

以下是用於測試變更的 Demo Instance：

- Instance: https://demo.litellm.ai/
- Login Credentials:
    - Username: admin
    - Password: sk-1234

## [Git Diff](https://github.com/BerriAI/litellm/releases) {#git-diffhttpsgithubcomberriailitellmreleases}
