---
title: v1.66.0-stable - 即時 API 成本追蹤
slug: v1.66.0-stable
date: 2025-04-12T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

tags: ["sso", "unified_file_id", "cost_tracking", "security"]
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
docker.litellm.ai/berriai/litellm:main-v1.66.0-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.66.0.post1
```
</TabItem>
</Tabs>

v1.66.0-stable 現已上線，以下是此版本的重點摘要

## 重點摘要 {#key-highlights}
- **即時 API 成本追蹤**：追蹤即時 API 請求的成本
- **Microsoft SSO 自動同步**：從 Azure Entra ID 自動同步群組與群組成員到 LiteLLM
- **xAI grok-3**：新增對 `xai/grok-3` 模型的支援
- **安全性修正**：修正 [CVE-2025-0330](https://www.cve.org/CVERecord?id=CVE-2025-0330) 與 [CVE-2024-6825](https://www.cve.org/CVERecord?id=CVE-2024-6825) 漏洞

讓我們開始。

## 即時 API 成本追蹤 {#realtime-api-cost-tracking}

<Image 
  img={require('../../img/realtime_api.png')}
  style={{width: '100%', display: 'block'}}
/>

此版本新增即時 API 記錄 + 成本追蹤。
- **記錄**：LiteLLM 現在會將即時呼叫的完整回應記錄到所有記錄整合（DB、S3、Langfuse 等）。
- **成本追蹤**：您現在可以為即時模型設定 'base_model' 與自訂定價。[自訂定價](../../docs/proxy/custom_pricing)
- **預算**：您的 key/user/team 預算現在也適用於即時模型。

從[這裡](https://docs.litellm.ai/docs/realtime)開始

## Microsoft SSO 自動同步 {#microsoft-sso-auto-sync}

<Image 
  img={require('../../img/release_notes/sso_sync.png')}
  style={{width: '100%', display: 'block'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>
  從 Azure Entra ID 自動同步群組與成員到 LiteLLM
</p>

此版本新增對 Microsoft Entra ID 上群組與成員自動同步至 LiteLLM 的支援。這表示 LiteLLM proxy 管理員可以花更少時間管理團隊與成員，而 LiteLLM 會處理以下事項：

- 自動建立 Microsoft Entra ID 上存在的團隊
- 同步 Microsoft Entra ID 上的團隊成員與 LiteLLM 團隊

從[這裡](https://docs.litellm.ai/docs/tutorials/msft_sso)開始使用

## 新模型 / 已更新模型 {#new-models--updated-models}

- **xAI**
    1. 新增 `xai/grok-3-mini-beta` 的 reasoning_effort 支援 [開始使用](https://docs.litellm.ai/docs/providers/xai#reasoning-usage)
    2. 新增 `xai/grok-3` 模型的成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9920)

- **Hugging Face**
    1. 新增 inference providers 支援 [開始使用](https://docs.litellm.ai/docs/providers/huggingface#serverless-inference-providers)

- **Azure**
    1. 新增 azure/gpt-4o-realtime-audio 成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9893)

- **VertexAI**
    1. 新增 enterpriseWebSearch 工具支援 [開始使用](https://docs.litellm.ai/docs/providers/vertex#grounding---web-search)
    2. 改為只傳遞 Vertex AI 回應結構描述接受的鍵值 [PR](https://github.com/BerriAI/litellm/pull/8992)

- **Google AI Studio**
    1. 新增 `gemini-2.5-pro` 的成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9837)
    2. 修正 'gemini/gemini-2.5-pro-preview-03-25' 的定價 [PR](https://github.com/BerriAI/litellm/pull/9896)
    3. 修正傳入 file_data 的處理 [PR](https://github.com/BerriAI/litellm/pull/9786)

- **Azure**
    1. 更新 Azure Phi-4 定價 [PR](https://github.com/BerriAI/litellm/pull/9862)
    2. 新增 azure/gpt-4o-realtime-audio 成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9893)

- **Databricks**
    1. 從參數中移除 reasoning_effort [PR](https://github.com/BerriAI/litellm/pull/9811)
    2. 修正 Databricks 的自訂端點檢查 [PR](https://github.com/BerriAI/litellm/pull/9925)

- **一般**
    1. 新增 litellm.supports_reasoning() 工具，用來追蹤某個 llm 是否支援 reasoning [開始使用](https://docs.litellm.ai/docs/providers/anthropic#reasoning)
    2. Function Calling - 在訊息工具呼叫中處理 pydantic base model，處理 tools = []，並支援 meta.llama3-3-70b-instruct-v1:0 的工具呼叫假串流 [PR](https://github.com/BerriAI/litellm/pull/9774)
    3. LiteLLM Proxy - 允許透過 client sdk 將 `thinking` 參數傳遞給 litellm proxy [PR](https://github.com/BerriAI/litellm/pull/9386)
    4. 修正 litellm 對 'thinking' 參數的正確轉譯 [PR](https://github.com/BerriAI/litellm/pull/9904)

## 支出追蹤改進 {#spend-tracking-improvements}
- **OpenAI, Azure**
    1. 在支出記錄中使用 token 使用量指標進行即時 API 成本追蹤 [開始使用](https://docs.litellm.ai/docs/realtime)
- **Anthropic**
    1. 修正 Claude Haiku 快取讀取每 token 定價 [PR](https://github.com/BerriAI/litellm/pull/9834)
    2. 新增以 base_model 為基礎的 Claude 回應成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/9897)
    3. 修正 Anthropic 提示快取成本計算與 db 中裁切的記錄訊息 [PR](https://github.com/BerriAI/litellm/pull/9838)
- **一般**
    1. 在支出記錄中新增 token 追蹤與記錄使用量物件 [PR](https://github.com/BerriAI/litellm/pull/9843)
    2. 處理部署層級的自訂定價 [PR](https://github.com/BerriAI/litellm/pull/9855)

## 管理端點 / UI {#management-endpoints--ui}

- **測試 Key 分頁**
    1. 新增在測試 key 頁面上呈現 Reasoning 內容、ttft、使用量指標 [PR](https://github.com/BerriAI/litellm/pull/9931)

    <Image 
    img={require('../../img/release_notes/chat_metrics.png')}
    style={{width: '100%', display: 'block'}}
    />
    <p style={{textAlign: 'left', color: '#666'}}>
    檢視輸入、輸出、reasoning token、ttft 指標。
    </p>
- **標籤 / 政策管理**
    1. 新增標籤/政策管理。根據請求中繼資料建立路由規則。這可讓您強制要求帶有 `tags="private"` 的請求只能送往特定模型。[開始使用](https://docs.litellm.ai/docs/tutorials/tag_management)

    <br />

    <Image 
    img={require('../../img/release_notes/tag_management.png')}
    style={{width: '100%', display: 'block'}}
    />
    <p style={{textAlign: 'left', color: '#666'}}>
    建立並管理標籤。
    </p>
- **重新設計的登入畫面**
    1. 美化登入畫面 [PR](https://github.com/BerriAI/litellm/pull/9778)
- **Microsoft SSO 自動同步**
    1. 新增 debug 路由，讓管理員可除錯 SSO JWT 欄位 [PR](https://github.com/BerriAI/litellm/pull/9835)
    2. 新增使用 MSFT Graph API 將使用者指派到團隊的能力 [PR](https://github.com/BerriAI/litellm/pull/9865)
    3. 將 litellm 連接到 Azure Entra ID Enterprise Application [PR](https://github.com/BerriAI/litellm/pull/9872)
    4. 新增讓管理員在 litellm SSO 建立預設團隊時設定 `default_team_params` 的能力 [PR](https://github.com/BerriAI/litellm/pull/9895)
    5. 修正 MSFT SSO 使用正確欄位作為使用者 email [PR](https://github.com/BerriAI/litellm/pull/9886)
    6. 新增在 litellm SSO 自動建立團隊時，於 UI 中設定 Default Team 設定的支援 [PR](https://github.com/BerriAI/litellm/pull/9918)
- **UI 錯誤修正**
    1. 防止團隊、key、org、model 數值在捲動時變動 [PR](https://github.com/BerriAI/litellm/pull/9776)
    2. 在 UI 中即時反映 key 與團隊更新 [PR](https://github.com/BerriAI/litellm/pull/9825)

## 記錄 / 防護欄改進 {#logging--guardrail-improvements}

- **Prometheus**
    1. 依 cron job 排程發出 Key 與 Team Budget 指標 [開始使用](https://docs.litellm.ai/docs/proxy/prometheus#initialize-budget-metrics-on-startup)

## 安全性修正 {#security-fixes}

- 修正 [CVE-2025-0330](https://www.cve.org/CVERecord?id=CVE-2025-0330) - 團隊例外處理中 Langfuse API 金鑰外洩 [PR](https://github.com/BerriAI/litellm/pull/9830)
- 修正 [CVE-2024-6825](https://www.cve.org/CVERecord?id=CVE-2024-6825) - post call rules 中的遠端程式碼執行 [PR](https://github.com/BerriAI/litellm/pull/9826)

## Helm {#helm}

- 為 litellm-helm chart 新增 service 註解 [PR](https://github.com/BerriAI/litellm/pull/9840)
- 為 helm deployment 新增 extraEnvVars [PR](https://github.com/BerriAI/litellm/pull/9292)

## 示範 {#demo}

今天就在示範實例上試試看 [今天](https://docs.litellm.ai/docs/proxy/demo)

## 完整 Git Diff {#complete-git-diff}

查看自 v1.65.4-stable 以來的完整 git diff，請見[這裡](https://github.com/BerriAI/litellm/releases/tag/v1.66.0-stable)
