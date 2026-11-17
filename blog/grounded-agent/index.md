---
slug: grounded-agent
title: "如何在 LiteLLM 上建立具備 grounding 的 agent"
date: 2026-10-31T09:00:00-07:00
authors:
  - ishaan
description: "使用 LiteLLM 的 AI Gateway，以四個步驟建立一個 grounded 的聊天 agent。連接您的證據、呼叫 grounding 防護欄，並在聊天中顯示其判定。"
tags: [engineering, guardrails, agents]
hide_table_of_contents: true
custom_hero: true
image: /img/grounded-agent/chat-grounded.png
---

import CodeWindow from './CodeWindow';
import {bedrockConfig, policy, sdkConnection, evidence, generateAnswer, sdkCall, bedrockResult, readAssessment, chatBadge, setup} from './examples';
import GroundedPage, {VerdictStates} from './GroundedPage';

<GroundedPage>

建立一個從您的文件回答問題的 agent，並在聊天中顯示每個答案之前，先對照證據檢查它。

我們將連接到 LiteLLM gateway、載入一份 policy、產生並檢查一個答案，然後顯示 grounding 結果。這些 Python 程式碼片段構成一個 async 請求處理器。先從一份文件開始；等您能檢視完整流程後，再連接您的 retriever。

:::note 來源預覽

本指南使用尚未發布的 [SDK helper #49469](https://github.com/BerriAI/litellm/pull/49469)、[native endpoint response #49460](https://github.com/BerriAI/litellm/pull/49460) 與 [Bedrock assessment setting #49470](https://github.com/BerriAI/litellm/pull/49470)，對應 [issue #49217](https://github.com/BerriAI/litellm/issues/49217)。在正式發布之前，您的 SDK 與 gateway 都請使用該實作。文末的範本鎖定了完整的修訂版本。

:::

## 步驟 1. 連接到您的 gateway {#step-1-connect-to-your-gateway}

只需設定一次您的 SDK。使用您的 gateway URL，以及一把可存取 agent 模型與 grounding 防護欄的虛擬金鑰：

<CodeWindow title="agent.py / connection">{sdkConnection}</CodeWindow>

我們在 gateway 上使用一個名為 `agent` 的模型。下方的 `openai/` 前綴選擇 OpenAI 相容的傳輸方式；gateway 可以將 `agent` 路由到另一個提供者的模型。

grounding 檢查請使用 [透過 LiteLLM 的 Amazon Bedrock Guardrails](/docs/proxy/guardrails/bedrock#contextual-grounding)。AWS 維護該評估服務，您可以將它用於其他模型提供者的答案。將以下內容加入您的 gateway 設定：

<CodeWindow title="config.yaml / grounding" language="yaml">{bedrockConfig}</CodeWindow>

建立一個啟用了 contextual grounding 的 AWS guardrail。對於對話式答案，選擇 Standard 層級及其必要的跨 Region 推論設定檔。將 AWS 篩選動作設為 `NONE`，讓您的應用程式能收到 unsupported 的判定結果並決定要顯示什麼。在 LiteLLM 中設定 `outputScope: FULL`，以便也收到 supported 的評估。請參閱 [AWS 設定](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html)、[篩選動作](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_GuardrailContextualGroundingFilterConfig.html) 與[完整評估](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ApplyGuardrail.html)。

`default_on: false` 讓這個防護欄保留給步驟 3 中明確的 SDK 呼叫使用。檢查何時執行由您控制。

## 步驟 2. 取回證據 {#step-2-retrieve-the-evidence}

先從一份居家辦公 policy 開始。將這段文字儲存為 `home-office.md`：

<CodeWindow title="home-office.md" language="markdown">{policy}</CodeWindow>

載入 policy，並將它與問題放在一起：

<CodeWindow title="agent.py / evidence">{evidence}</CodeWindow>

您的 agent 與 grounding 服務必須收到相同的證據。有了 `contextual_grounding_from_messages: true`，LiteLLM 會將系統文字作為 grounding 來源、將使用者問題作為查詢，傳送給 Bedrock。

對於您自己的文件，請以您的 retriever 取代檔案讀取。只傳遞目前使用者可存取的文件。不要將先前的 assistant 答案納入參考證據。

## 步驟 3. 產生並檢查答案 {#step-3-generate-and-check-the-answer}

要求您的模型根據該證據回答：

<CodeWindow title="agent.py / answer">{generateAnswer}</CodeWindow>

接著以答案與來源訊息呼叫 grounding 防護欄：

<CodeWindow title="agent.py / grounding">{sdkCall}</CodeWindow>

`"answer-grounding"` 選擇已設定的防護欄。`response=answer` 告訴 SDK 要檢查產生的輸出；SDK 會推斷方向。您不需要提供輸入類型或回應格式旗標。

該呼叫會在經過 LiteLLM 既有的報告清理後，回傳防護欄原生的結構化判定結果。對於 Bedrock，grounding 評估看起來像這段示範節錄：

<CodeWindow title="Bedrock assessment" language="json">{bedrockResult}</CodeWindow>

Bedrock 會將答案與所提供的證據進行比較。它不會驗證來源文件本身是否正確。在使用它強制執行 policy 之前，請先以您的使用情境中 supported、contradicted 與不完整的答案來評估這項檢查。

## 步驟 4. 在聊天中顯示結果 {#step-4-show-the-result-in-chat}

讀取 `GROUNDING` 評估。在顯示正面徽章之前，先要求有一份評估，並將分數與其設定的閾值進行比對：

<CodeWindow title="agent.py / verdict">{readAssessment}</CodeWindow>

檢查所有回傳的 chunks。不要從 Bedrock 整體的 `action` 推斷成功：僅供報告的防護欄可能回傳 `NONE`，同時附帶負面的 grounding 判定。

從您的聊天後端回傳答案與判定。在您的聊天元件中，將結果顯示在答案旁邊：

<CodeWindow title="GroundingBadge.jsx" language="jsx">{chatBadge}</CodeWindow>

<VerdictStates />

逾時、缺少評估或結果無效時，應產生 **Check unavailable**，且不顯示綠色徽章。下方的範本包含型別化的回應驗證與那些失敗狀態。

Bedrock 會一起評估所提供的文件。將參考資料標示為 **Documents checked**；其回應不會將答案歸屬到個別文件。對於 unsupported 的答案，您可以顯示落差、取回更多證據，或暫不提供答案。如果您的產品以檢查結果作為交付門檻，請等檢查完成後再渲染。

## 部署完整的聊天範本 {#deploy-the-complete-chat-template}

您已經掌握核心流程：證據、答案、grounding 呼叫，以及回應旁邊的判定。[使用範本](https://github.com/BerriAI/litellm-grounded-agent-starter/generate)，即可在另一個 repository 中取得完整的聊天 UI、一個會呼叫工具的文件 agent，以及經過驗證的結果處理。

<CodeWindow title="Run the complete app" language="bash">{setup}</CodeWindow>

開啟 [localhost:8502](http://127.0.0.1:8502)。選擇 **Home office allowance** 取得 supported 的答案，或選擇 **Check an unsupported answer** 查看負面判定。這個本機示範使用固定的模型與 judge 回應，並在 UI 中標示，讓您無需提供者憑證即可操作 SDK、gateway 與聊天。

若要正式部署，請依照範本的 Bedrock 設定操作，以您的 retriever 取代內附的文件，並連接您的模型。啟動器支援本機開發；gateway 與聊天應用程式請以您平台的一般服務設定部署。在與同事分享應用程式之前，先加入登入與文件授權。這個範例中的即時 AWS 執行尚未經過驗證；範本以具代表性的回應測試其 adapter。

## 重點整理 {#key-takeaways}

給您的 agent 與 grounding 防護欄相同的證據。在答案產生後呼叫 `litellm.guardrails.apply`，讀取提供者的評估，並在 UI 中清楚區分 supported、unsupported 與失敗的檢查。

## 常見問題 {#frequently-asked-questions}

### 我可以使用既有的 agent 與防護欄嗎？ {#can-i-use-an-existing-agent-and-guardrail}

可以。保留您的框架與評估邏輯。將產生答案的程式碼片段換成您的 agent 的最終答案，呼叫 `litellm.guardrails.apply`，並讀取您的防護欄的結果結構。

### LiteLLM 會為了檢查而產生第二個答案嗎？ {#does-litellm-generate-a-second-answer-for-the-check}

SDK 會叫用您設定的防護欄。Bedrock 會評估所提供的答案。客製的 LLM judge 會發出一個評估請求；它不會為了取得判定而重新產生 agent 的答案。

### 我可以將它與 LiteLLM OSS 一起使用嗎？ {#can-i-use-this-with-litellm-oss}

SDK 的變更與範本都是開源的。在正式發布之前，SDK 與 AI Gateway 都請使用連結的實作修訂版本。[LiteLLM Enterprise](https://litellm.ai/enterprise) 為生產部署加入了控制與支援。

## 延伸閱讀 {#recommended-reading}

[直接呼叫防護欄](/docs/apply_guardrail)、[設定 Bedrock grounding](/docs/proxy/guardrails/bedrock#contextual-grounding)，以及[撰寫客製防護欄](/docs/proxy/guardrails/custom_guardrail)。

</GroundedPage>

{/* truncate */}
