---
title: "LiteLLM AI 閘道上的 LLM 防護欄：快速入門"
sidebar_label: "防護欄 - 快速入門"
description: "為 LiteLLM AI 閘道加入提示詞注入偵測與 PII 遮罩：在 config.yaml 中定義防護欄、選擇模式，並設定預設開啟規則。"
---
import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 護欄 - 快速入門 {#guardrails---quick-start}

在 LiteLLM Proxy（AI 閘道）上設定提示注入偵測、PII 遮罩

若要查看 guardrails 與其餘閘道相較於 OWASP Top 10 for LLM Applications 2026 的表現，請閱讀 [OWASP LLM Top 10 對照](../security_owasp_llm_top10)。

## 1. 在您的 LiteLLM config.yaml 定義護欄 {#1-define-guardrails-on-your-litellm-configyaml}

將您的護欄設定在 `guardrails` 區段下

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: general-guard
    litellm_params:
      guardrail: cato_networks
      mode: [pre_call, post_call]
      api_key: os.environ/CATO_API_KEY
      api_base: os.environ/CATO_API_BASE
      default_on: true # Optional
  
  - guardrail_name: "aporia-pre-guard"
    litellm_params:
      guardrail: aporia  # supported values: "aporia", "lakera"
      mode: "during_call"
      api_key: os.environ/APORIA_API_KEY_1
      api_base: os.environ/APORIA_API_BASE_1
  - guardrail_name: "aporia-post-guard"
    litellm_params:
      guardrail: aporia  # supported values: "aporia", "lakera"
      mode: "post_call"
      api_key: os.environ/APORIA_API_KEY_2
      api_base: os.environ/APORIA_API_BASE_2
    guardrail_info: # Optional field, info is returned on GET /guardrails/list
      # you can enter any fields under info for consumers of your guardrail
      params:
        - name: "toxicity_score"
          type: "float"
          description: "Score between 0-1 indicating content toxicity level"
        - name: "pii_detection"
          type: "boolean"

# Example Presidio guardrail config with entity actions + confidence score thresholds
  - guardrail_name: "presidio-pii"
    litellm_params:
      guardrail: presidio
      mode: "pre_call"
      presidio_language: "en"
      pii_entities_config:
        CREDIT_CARD: "MASK"
        EMAIL_ADDRESS: "MASK"
        US_SSN: "MASK"
      presidio_score_thresholds:  # minimum confidence scores for keeping detections
        CREDIT_CARD: 0.8
        EMAIL_ADDRESS: 0.6

# Example Pillar Security config via Generic Guardrail API
  - guardrail_name: "pillar-security"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: [pre_call, post_call]
      api_base: https://api.pillar.security/api/v1/integrations/litellm
      api_key: os.environ/PILLAR_API_KEY
      additional_provider_specific_params:
        plr_mask: true
        plr_evidence: true
        plr_scanners: true
```

對於通用護欄 API，您也可以設定**靜態標頭**（`headers`：每個請求都會送出的 key/value）以及**動態標頭**（`extra_headers`：要轉送的用戶端標頭名稱清單）。請參閱[通用護欄 API - 靜態與動態標頭](/docs/adding_provider/generic_guardrail_api#static-and-dynamic-headers)。

### `mode`（事件掛鉤）的支援值 {#supported-values-for-mode-event-hooks}

- `pre_call` 在 LLM 呼叫**之前**執行，針對**輸入**
- `post_call` 在 LLM 呼叫**之後**執行，針對**輸入與輸出**
- `during_call` 在 LLM 呼叫**期間**執行，針對**輸入**。與 `pre_call` 相同，但會與 LLM 呼叫平行執行。回應會在 guardrail 檢查完成之前不會傳回
- `logging_only` 在呼叫結束後，於背景記錄 worker 上掃描已記錄的輸入與輸出，不變更用戶端回應，也不會增加其延遲。支援情況取決於 guardrail 整合
- 可搭配多種模式執行的支援值清單，例如 `mode: [pre_call, post_call]`

### 使用 `stream_scope` 僅在串流或非串流請求上執行 {#run-on-streaming-or-non-streaming-requests-only-with-stream_scope}

防護欄預設會在串流與非串流請求上都執行。在防護欄的 `litellm_params` 下設定 `stream_scope`，即可選擇它要評估哪種請求型態：

- `streaming`：僅在用戶端要求串流回應時執行
- `non_streaming`：僅對一般請求/回應呼叫執行
- `both`：在每個請求上都執行（預設值，也是未設定 `stream_scope` 時的既有行為）

```yaml
guardrails:
  # runs only on streaming requests; non-streaming calls bypass the scan
  - guardrail_name: "moderate-streams-only"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: post_call
      stream_scope: streaming
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true

  # runs only on non-streaming requests
  - guardrail_name: "moderate-non-streams"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: post_call
      stream_scope: non_streaming
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true
```

設定了多種模式的防護欄（例如 `mode: [pre_call, post_call]`）可以使用對應表（map）分別為每個模式設定範圍。鍵為模式名稱；未列入對應表的模式預設為 `both`：

```yaml
guardrails:
  - guardrail_name: "scoped-by-mode"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: [pre_call, post_call]
      stream_scope:
        pre_call: streaming
        post_call: both
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true
```

儀表板在防護欄建立表單上以 **Request shape** 提供相同的控制項；每個已設定的模式都有自己的下拉式選單。

<Image
  img={require('../../../img/stream_scope_request_shape_ui.png')}
  alt="建立防護欄表單：Request shape 控制項，pre_call 套用至下拉式選單設為 Streaming only"
  style={{ width: '100%', maxWidth: '900px', height: 'auto' }}
/>

下拉式選單已展開，顯示三個範圍選項：

<Image
  img={require('../../../img/stream_scope_request_shape_closeup.png')}
  alt="特寫：pre_call 套用至下拉式選單已展開，包含 Streaming and non-streaming、Streaming only 與 Non-streaming only 選項"
  style={{ width: '100%', maxWidth: '700px', height: 'auto' }}
/>

已儲存防護欄的詳細頁面會顯示各模式的範圍摘要：

<Image
  img={require('../../../img/stream_scope_guardrail_detail_ui.png')}
  alt="防護欄詳細頁面：各模式串流範圍摘要，顯示 pre_call 為 Streaming only、post_call 為 Streaming and non-streaming"
  style={{ width: '100%', maxWidth: '900px', height: 'auto' }}
/>

即時音訊輸入轉錄計為串流，因此 `streaming` 範圍也涵蓋在即時轉錄事件上執行的防護欄，而 `non_streaming` 範圍會將其排除。

Bedrock 直通（pass-through）請求會從所呼叫的 Bedrock 動作回報其串流狀態，因此 `stream_scope` 對它們的控管方式與原生路由相同。

#### 驗證 {#validation}

`stream_scope` 的值若不是 `streaming`、`non_streaming` 或 `both`（或對應表的鍵不是模式名稱），在建立與更新時會被以 `422` 拒絕。啟動時，無論是從設定檔載入還是從已儲存的資料庫列載入，無效的 `stream_scope` 都會被忽略並記錄警告日誌，防護欄會以預設的 `both` 範圍繼續執行。

### 使用 `logging_only_scope` 僅觀察單一方向 {#observe-only-one-direction-with-logging_only_scope}

`logging_only` 掃描會在呼叫結束後執行，位於 proxy 的成功記錄流程中並由背景記錄 worker 處理，因此用戶端請求永遠不需要等待它，其延遲也不會影響回應。worker 在[設定設定](/docs/proxy/config_settings)中的 `LOGGING_WORKER_CONCURRENCY`、`LOGGING_WORKER_MAX_TIME_PER_COROUTINE` 與 `LOGGING_WORKER_MAX_QUEUE_SIZE` 設定，限定了同時執行的掃描數量，以及單一請求的記錄最長可花費的時間。

`logging_only` 防護欄預設會觀察請求與回應。在防護欄的 `litellm_params` 下設定 `logging_only_scope`，即可選擇掃描要觀察的方向：

- `input`：僅掃描請求
- `output`：僅掃描回應
- 未設定 / `null`（預設）：掃描兩個方向並保留既有行為，因此現有部署不受影響

`both` 不是一個有效值。不設定範圍本來就會掃描兩個方向，而 `both` 值在啟動時會被記錄並忽略，在建立與更新時則會被以 `422` 拒絕。

```yaml
guardrails:
  # unset (default): scans request and response, pre-existing behavior
  - guardrail_name: "observe-default"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: logging_only
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true

  # scans only the request
  - guardrail_name: "observe-requests"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: logging_only
      logging_only_scope: input
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true

  # scans only the response
  - guardrail_name: "observe-responses"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: logging_only
      logging_only_scope: output
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true
```

在上述任何情況下，掃描都不會阻擋或變更用戶端呼叫；每個判定（包括原本會阻擋的判定）都會記錄在支出日誌的 `guardrail_information` 中，並計入 Guardrails Monitor。

#### 若輸入掃描失敗 {#if-the-input-scan-fails}

在 `logging_only` 模式下，實際上不會阻擋任何內容，因此被輸入掃描標記的請求仍會送達模型，對話也會繼續。`logging_only_continue_on_input_failure` 決定是否仍觀察回應：

- **未設定或 `false`**（預設）：若輸入掃描失敗（防護欄發生錯誤，或傳回原本會阻擋呼叫的判定），則略過輸出掃描，僅記錄輸入判定/錯誤。這是既有行為，現有部署不受影響。
- **`logging_only_continue_on_input_failure: true`**：輸入失敗會被記錄為警告，且回應**仍會被掃描**，因此您可以同時取得兩個判定。由於 `logging_only` 模式不會阻擋任何內容，這能讓您持續監看被標記對話的回應。

```yaml
guardrails:
  - guardrail_name: "observe-both-verdicts"
    litellm_params:
      guardrail: generic_guardrail_api
      mode: logging_only
      logging_only_continue_on_input_failure: true
      api_base: os.environ/GUARDRAIL_API_BASE
      default_on: true
```

`input` 與 `output` 只會掃描單一方向，因此設定了 `logging_only_scope` 時，此旗標會被忽略。

#### 驗證 {#validation-1}

- `logging_only_scope` 的值若不是 `input` 或 `output`，在建立與更新時會被以 `422` 拒絕。
- 防護欄無法使用的範圍（設定了 `logging_only_scope` 但 `mode` 中沒有 `logging_only`，或在有自己的記錄 hook 的防護欄上設定 `input`/`output`）在建立時傳回 `400`，在設定此類範圍的更新時傳回 `422`。被拒絕的寫入會被回滾，因此已儲存的防護欄會保留先前的設定。
- 啟動時，無論是從設定檔載入還是從已儲存的資料庫列載入，無效的 `logging_only_scope` 都會被忽略並記錄錯誤日誌，防護欄會保留其設定的模式。

`logging_only_scope` 只會縮小 `logging_only` 掃描的範圍。同一個防護欄上的強制模式（`pre_call`、`during_call`、`post_call`）不受影響，仍會阻擋：`mode: [pre_call, logging_only]` 搭配 `logging_only_scope: output` 會阻擋不良請求，並記錄回應判定但不阻擋回應。若要觀察某個方向且永遠不阻擋它，請將對應的阻擋模式排除在 `mode` 之外。

方向性範圍適用於透過通用 `apply_guardrail` 介面執行 `logging_only` 掃描的防護欄。有自己記錄 hook 的防護欄（例如 Presidio，其有自己的 `presidio_filter_scope`）會忽略此處的 `input`/`output`。

編輯防護欄（例如僅修改說明的 PUT）不再會重新排序防護欄的執行順序：防護欄順序在更新之間保持穩定，因此同一內容上 BLOCK 與 MASK 何者勝出不會改變。

### 在護欄評估中略過系統訊息 {#skip-system-messages-in-guardrail-evaluation}

您可以阻止 guardrails 掃描 `role: system` 內容，同時仍將完整的 `messages` 清單傳送給模型。

自 v1.103.0 起，Anthropic `/v1/messages` 上的防護欄也會掃描最上層的 `system` 提示詞。Claude Desktop 與 Cowork 會在每個請求中傳送一段很長的系統提示詞，而嚴格的提示詞攻擊篩選器（例如 Bedrock 防護欄的 `PROMPT_ATTACK` 篩選器）即使在使用者自己的文字無害時，也可能將其阻擋。設定此旗標可讓該提示詞不進入掃描。

在 `/v1/messages` 上，此旗標只會略過最上層的 `system` 提示詞。`messages` 內的 `role: system` 項目屬於用戶端輸入，因此即使設定了此旗標，防護欄仍會掃描它。Claude Code 會在對話中途傳送這類項目，例如其環境詳細資訊，以及在工具執行期間輸入的修正內容。若要讓它們不進入 Bedrock 防護欄的掃描，請在防護欄上設定 [`experimental_use_latest_role_message_only: true`](./bedrock#experimental-only-send-latest-user-message)。

**全域**，在 `litellm_settings` 中：

```yaml
litellm_settings:
  skip_system_message_in_guardrail: true
```

**每個 guardrail**，在該 guardrail 的 `litellm_params` 下：設定 `skip_system_message_in_guardrail: true` 或 `false`。若省略，會使用全域 `litellm_settings` 值；每個 guardrail 的 `false` 會強制包含系統訊息，即使全域旗標為 `true`。

**透過 LiteLLM UI**，在 LiteLLM Admin Dashboard 中**建立**或**編輯** guardrail 時，設定 **Skip system messages in guardrail**（在建立時的 Basic Info 下，或在編輯／guardrail 設定流程中）：

| UI 選項                             | 效果                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| **使用全域預設值**                | 使用您的 proxy 設定中的 `litellm_settings.skip_system_message_in_guardrail`        |
| **是 — 從護欄掃描中排除** | 設定每個護欄的 `skip_system_message_in_guardrail: true`                            |
| **否 — 一律包含在掃描中**       | 設定每個護欄的 `skip_system_message_in_guardrail: false`（覆寫全域略過設定） |

<Image
  img={require('../../../img/skip_system_message_guardrail_ui.png')}
  dark={require('../../../img/skip_system_message_guardrail_ui_dark.png')}
  alt="Create guardrail: Skip system messages in guardrail dropdown with Use global default, Yes exclude from guardrail scan, and No always include in scan"
  style={{ width: '100%', maxWidth: '900px', height: 'auto' }}
/>

### 在 guardrail 評估中略過 tool 訊息 {#skip-tool-messages-in-guardrail-evaluation}

同樣的概念，針對 `role: tool` 內容：阻止 guardrails 掃描 tool call 結果，同時仍將完整的 `messages` 清單傳送給模型。

**全域**（在 `litellm_settings` 中）：

```yaml
litellm_settings:
  skip_tool_message_in_guardrail: true
```

**每個 guardrail**：在該 guardrail 的 `litellm_params` 下，設定 `skip_tool_message_in_guardrail: true` 或 `false`，其全域／每個 guardrail 的優先順序與上方的系統訊息旗標相同。

**透過 LiteLLM UI**：以相同方式設定 **Skip tool messages in guardrail**，就在上方所述的系統訊息下拉式選單正下方，並具有相同的三個選項（**Use global default**、**Yes, exclude from guardrail scan**、**No, always include in scan**）。

### 略過旗標適用於何處 {#where-the-skip-flags-apply}

**這些適用於哪裡：** **統一** guardrail 路徑（實作 `apply_guardrail` 並透過 LiteLLM 的訊息轉譯層執行的提供者），適用於 **OpenAI Chat Completions**（`/v1/chat/completions`）與 **Anthropic Messages**（`/v1/messages`）。範例包括 Presidio、Bedrock guardrails、`litellm_content_filter`、OpenAI Moderation、Generic Guardrail API，以及定義 `apply_guardrail` 的自訂程式碼 guardrails。**Lakera v2** 也支援這兩個旗標，儘管其是透過直接 hook 而非統一路徑執行；請參閱 [Lakera AI](./lakera_ai#supported-params)。 **hide-secrets** 在兩條路由上同樣遵循 `skip_tool_message_in_guardrail`，但不遵循系統訊息旗標；請參閱 [Secret Detection](./secret_detection#skip-tool-results)。

**這些不適用於哪裡：** 其他僅透過原始請求上的直接 hook 執行的 guardrails（例如 Aporia、DynamoAI、Javelin、Lasso、Pangea、Model Armor、Azure Content Safety hooks、Guardrails AI、AIM、Cato Networks、tool permission、MCP security）。在其他路由也使用相同轉譯層之前，這些旗標也不適用於其他路由（例如 Responses API、embeddings、speech）。

### 負載平衡護欄 {#load-balancing-guardrails}

需要在多個帳戶或區域之間分配護欄請求嗎？請參閱[護欄負載平衡](./guardrail_load_balancing.md)，了解以下內容：

- 在多個 AWS Bedrock 帳戶之間進行負載平衡（對於速率限制管理很有用）
- 在護欄執行個體之間進行加權分配
- 多區域護欄部署

## 2. 啟動 LiteLLM Gateway {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

## 3. 測試請求 {#3-test-request}

**[Langchain、OpenAI SDK 使用範例](/docs/proxy/user_keys#request-format)**

預期這會失敗，因為請求中的 `ishaan@berri.ai` 是 PII

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

失敗時的預期回應

```shell
{
  "error": {
    "message": {
      "error": "Violated guardrail policy",
      "aporia_ai_response": {
        "action": "block",
        "revised_prompt": null,
        "revised_response": "Aporia detected and blocked PII",
        "explain_log": null
      }
    },
    "type": "None",
    "param": "None",
    "code": "400"
  }
}

```


```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "hi what is the weather"}
    ],
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

## **預設開啟的護欄** {#default-on-guardrails}

在您的護欄設定中設定 `default_on: true`，即可在每個請求上執行護欄。如果您希望在每個請求上執行護欄，而不需要使用者指定，這會很有用。

**注意：** 即使使用者指定不同的護欄或空的護欄陣列，這些也會執行。

```yaml
guardrails:
  - guardrail_name: "aporia-pre-guard"
    litellm_params:
      guardrail: aporia
      mode: "pre_call"
      default_on: true
```

**測試請求**

在此請求中，護欄 `aporia-pre-guard` 會在每個請求上執行，因為已設定 `default_on: true`。

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ]
  }'
```

**預期回應**

您的回應標頭將包含套用護欄的 `x-litellm-applied-guardrails`

```
x-litellm-applied-guardrails: aporia-pre-guard
```

### 護欄政策 {#guardrail-policies}

需要更多控制嗎？使用[護欄政策](./guardrail_policies.md)來：

- 將護欄分組為可重複使用的政策
- 為特定團隊、金鑰或模型啟用／停用護欄
- 從現有政策繼承並覆寫特定護欄

## **在用戶端使用護欄** {#using-guardrails-client-side}

### 自行測試 **（OSS）** {#test-yourself-oss}

將 `guardrails` 傳遞到您的請求主體以進行測試

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

### 在回應中檢查 guardrail 結果 **(OSS)** {#inspect-guardrail-results-in-the-response-oss}

在請求本文中設定 `include_guardrail_response: true`，即可在回應中取得 guardrail 執行記錄，作為頂層 `guardrail_information` 清單。若不設定，回應本文將維持不變，因此既有用戶端不受影響。此旗標會在請求送達提供者之前被移除

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "Reply OK"}],
    "guardrails": ["aporia-pre-guard"],
    "include_guardrail_response": true
  }'
```

預期回應（省略其他欄位）

```json
{
  "id": "chatcmpl-EQjb0XEZzNUUGhbbYLfB2FApCuPJc",
  "choices": [{"message": {"role": "assistant", "content": "OK"}}],
  "guardrail_information": [
    {
      "guardrail_name": "aporia-pre-guard",
      "guardrail_provider": "aporia",
      "guardrail_mode": "pre_call",
      "guardrail_status": "success",
      "guardrail_response": [],
      "start_time": 1790040506.278482,
      "end_time": 1790040506.278695,
      "duration": 0.000214,
      "masked_entity_count": {}
    }
  ]
}
```

每個項目的結構與 [`StandardLoggingPayload`](../logging_spec#standardloggingguardrailinformation) 中的 `guardrail_information` 相同。當此請求沒有 guardrail 執行時，`guardrail_information` 會是 `[]`。只有精確的 JSON 布林值 `true` 才會啟用它；`"true"` 或 `1` 會被視為關閉。串流回應不會帶有此欄位。`keyword`、`snippet`、`match` 或 `regex` 值中出現的任何 `guardrail_response` 都會以 `"[REDACTED]"` 傳回，因此遮罩內容絕不會回傳給呼叫端

### 向您的使用者公開 **（Enterprise）** {#expose-to-your-users-enterprise}

依照這個簡單流程來實作並調整護欄：

### 1. 查看可用的護欄 {#1-view-available-guardrails}

首先，確認有哪些護欄可用及其參數：

呼叫 `/guardrails/list` 以查看可用的護欄及護欄資訊（支援的參數、描述等）

```shell
curl -X GET 'http://0.0.0.0:4000/guardrails/list'
```

預期回應

```json
{
    "guardrails": [
        {
        "guardrail_name": "aporia-post-guard",
        "guardrail_info": {
            "params": [
            {
                "name": "toxicity_score",
                "type": "float",
                "description": "Score between 0-1 indicating content toxicity level"
            },
            {
                "name": "pii_detection",
                "type": "boolean"
            }
            ]
        }
        }
    ]
}
```


此設定將回傳上方的 `/guardrails/list` 回應。`guardrail_info` 欄位為選填，您可以在 info 下方為護欄的使用者新增任何欄位

```yaml
- guardrail_name: "aporia-post-guard"
  litellm_params:
      guardrail: aporia  # supported values: "aporia", "lakera"
      mode: "post_call"
      api_key: os.environ/APORIA_API_KEY_2
      api_base: os.environ/APORIA_API_BASE_2
  guardrail_info: # Optional field, info is returned on GET /guardrails/list
      # you can enter any fields under info for consumers of your guardrail
      params:
        - name: "toxicity_score"
          type: "float"
          description: "Score between 0-1 indicating content toxicity level"
        - name: "pii_detection"
          type: "boolean"
```

### 2. 套用護欄 {#2-apply-guardrails}

將選定的護欄新增至您的聊天完成請求：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "your message"}],
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

### 3. 使用 Mock LLM completions 測試 {#3-test-with-mock-llm-completions}

傳送 `mock_response`，即可在不呼叫 LLM 的情況下測試護欄。更多關於 `mock_response` 的資訊請見[此處](../../completion/mock_requests)

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "{{openai_small}}",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "mock_response": "This is a mock response",
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```

### 4. 將動態參數傳遞給護欄 {#4-pass-dynamic-parameters-to-guardrail}

<EnterpriseFeature />

可用來將額外參數傳遞給護欄 API 呼叫，例如成功閾值之類的項目。**[請參閱 `guardrails` 規格以了解更多細節](/docs/proxy/guardrails/quick_start#guardrails-request-parameter)**

設定 `guardrails={"aporia-pre-guard": {"extra_body": {"success_threshold": 0.9}}}` 以傳遞額外參數給護欄

在此範例中，`success_threshold=0.9` 會被傳遞到 `aporia-pre-guard` 護欄請求主體

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="{{openai_small}}",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={
      "guardrails": {
        "aporia-pre-guard": {
          "extra_body": {
            "success_threshold": 0.9
          }
        }
      }
    }

)

print(response)
```

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "{{openai_small}}",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "guardrails": {
      "aporia-pre-guard": {
        "extra_body": {
          "success_threshold": 0.9
        }
      }
    }
}'
```

## **Proxy 管理控制項** {#proxy-admin-controls}

### 監控護欄 {#monitoring-guardrails}

監控哪些護欄已執行，以及它們是通過還是失敗。例如，護欄失控並使我們不打算失敗的請求失敗

:::

#### 設定 {#setup}

1. 將 LiteLLM 連接到[支援的記錄提供者](../logging)
2. 使用 `guardrails` 參數發出請求
3. 在您的記錄提供者中檢查護欄追蹤

#### 已追蹤的護欄成功 {#traced-guardrail-success}

<Image img={require('../../../img/gd_success.png')} />

#### 已追蹤的護欄失敗 {#traced-guardrail-failure}

<Image img={require('../../../img/gd_fail.png')} />

### 依 API 金鑰控制護欄 {#-control-guardrails-per-api-key}

<EnterpriseFeature />

可用來依 API Key 控制執行哪些護欄。在本教學中，我們只希望以下護欄為 1 個 API Key 執行

- `guardrails`: ["aporia-pre-guard", "aporia-post-guard"]

**步驟 1** 使用護欄設定建立金鑰

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
            "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
    }'
```

```shell
curl --location 'http://0.0.0.0:4000/key/update' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --header 'Content-Type: application/json' \
    --data '{
        "key": "sk-jNm1Zar7XfNdZXp49Z1kSQ",
        "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
}'
```

<SinceVersion v="1.111.0" />

防護欄名稱會在儲存時檢查。`/key/generate`、`/key/service-account/generate`、`/key/update`、`/key/regenerate`、`/team/new`、`/team/update`、`/user/new`、`/project/new` 與 `/project/update` 對於既未從 config.yaml 載入、也不是資料庫中有效防護欄的名稱會傳回 400，無論該名稱是以 `guardrails` 還是以 `metadata.guardrails` 傳送。`/v2/guardrails/list` 會顯示有效的名稱。只有請求新增的名稱會被檢查，因此若編輯時重新傳送了一個已儲存、但其防護欄其後已被刪除的名稱，仍會成功。不是名稱清單的 `metadata.guardrails` 值也會被以 400 拒絕。在[停用團隊開啟/關閉 guardrails 的能力](#disable-team-from-turning-onoff-guardrails)中所述的團隊設定 `{"modify_guardrails": false}` 仍會被接受。

```json
{
  "error": "Unknown guardrail(s): aporia-pre-guardd. Create the guardrail first, or check the name against /v2/guardrails/list."
}
```

**步驟 2** 使用新金鑰測試

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Authorization: Bearer sk-jNm1Zar7XfNdZXp49Z1kSQ' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "{{openai_small}}",
    "messages": [
        {
        "role": "user",
        "content": "my email is ishaan@berri.ai"
        }
    ]
}'
```

### 以標籤為基礎的護欄模式 {#-tag-based-guardrail-modes}

<EnterpriseFeature />

根據 user-agent 標頭執行 guardrails。這對於在 OpenWebUI 上執行預先請求檢查，但在 Claude CLI 中僅在記錄中遮蔽時很有用。

`default` 和 tag 值都可以是單一 mode 字串或 mode 清單。

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "guardrails_ai-guard"
    litellm_params:
      guardrail: guardrails_ai
      guard_name: "pii_detect" # Guardrail AI guard name
      mode:
        tags:
            "User-Agent: claude-cli": "logging_only"                 # Claude CLI - only mask in logs
        default: "pre_call"               # Default mode when no tags match
      api_base: os.environ/GUARDRAILS_AI_API_BASE # Guardrails AI API Base. Defaults to "http://0.0.0.0:8000"
      default_on: true # run on every request
```

```yaml
Per guardrailmodel_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "guardrails_ai-guard"
    litellm_params:
      guardrail: guardrails_ai
      guard_name: "pii_detect"
      mode:
        tags:
            "User-Agent: claude-cli": "logging_only"
        default: ["pre_call", "post_call"]  # Run on both pre and post call when no tags match
      api_base: os.environ/GUARDRAILS_AI_API_BASE
      default_on: true
```

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "guardrails_ai-guard"
    litellm_params:
      guardrail: guardrails_ai
      guard_name: "pii_detect"
      mode:
        tags:
            "User-Agent: claude-cli": ["pre_call", "post_call"]  # Run both pre and post call for claude-cli
        default: "logging_only"  # Default to logging only when no tags match
      api_base: os.environ/GUARDRAILS_AI_API_BASE
      default_on: true
```

### 模型層級 Guardrails {#-model-level-guardrails}

<EnterpriseFeature />

當您同時有內部部署與託管模型，且只想防止將 PII 傳送到託管模型時，這非常適合。

```yaml
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      api_base: https://api.anthropic.com/v1
      guardrails: ["azure-text-moderation"]
  - model_name: openai-{{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}

guardrails:
  - guardrail_name: "presidio-pii"
    litellm_params:
      guardrail: presidio  # supported values: "aporia", "bedrock", "lakera", "presidio"
      mode: "pre_call"
      presidio_language: "en"  # optional: set default language for PII analysis
      pii_entities_config:
        PERSON: "BLOCK"  # Will mask credit card numbers
  - guardrail_name: azure-text-moderation
    litellm_params:
      guardrail: azure/text_moderations
      mode: "post_call" 
      api_key: os.environ/AZURE_GUARDRAIL_API_KEY
      api_base: os.environ/AZURE_GUARDRAIL_API_BASE 
```

### 停用團隊開啟/關閉 guardrails 的能力 {#disable-team-from-turning-onoff-guardrails}

<EnterpriseFeature />

#### 1. 停用團隊修改 guardrails 的能力 {#1-disable-team-from-modifying-guardrails}

```bash
curl -X POST 'http://0.0.0.0:4000/team/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "team_id": "4198d93c-d375-4c83-8d5a-71e7c5473e50",
    "metadata": {"guardrails": {"modify_guardrails": false}}
}'
```

#### 2. 嘗試為請求停用 guardrails {#2-try-to-disable-guardrails-for-a-call}

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_VIRTUAL_KEY' \
--data '{
"model": "{{openai_small}}",
    "messages": [
      {
        "role": "user",
        "content": "Think of 10 random colors."
      }
    ],
    "metadata": {"guardrails": {"hide_secrets": false}}
}'
```

#### 3. 取得 403 錯誤 {#3-get-403-error}

```
{
    "error": {
        "message": {
            "error": "Your team does not have permission to modify guardrails."
        },
        "type": "auth_error",
        "param": "None",
        "code": 403
    }
}
```

預期在您的 callback 的伺服器記錄中不會看到 `+1 412-612-9992`。 

:::info
由於 api key=sk-jNm1Zar7XfNdZXp49Z1kSQ 具有 `pii_masking`，因此 `"permissions": {"pii_masking": true}` guardrail 已在此請求上執行。
:::

## 規格 {#specification}

### `guardrails` YAML 上的設定 {#guardrails-configuration-on-yaml}

```yaml
guardrails:
  - guardrail_name: string     # Required: Name of the guardrail
    litellm_params:            # Required: Configuration parameters
      guardrail: string        # Required: One of "aporia", "bedrock", "guardrails_ai", "lakera", "presidio", "hide-secrets"
      mode: Union[string, List[string], Mode]             # Required: One or more of "pre_call", "post_call", "during_call", "logging_only"
      api_key: string          # Required: API key for the guardrail service
      api_base: string         # Optional: Base URL for the guardrail service
      default_on: boolean      # Optional: Default False. When set to True, will run on every request, does not need client to specify guardrail in request
      logging_only_scope: string # Optional: "input" (request only) or "output" (response only). Unset scans both directions and keeps the pre-existing behavior
      logging_only_continue_on_input_failure: boolean # Optional: when true, a flagged or failing logging_only request scan is logged and the response is still scanned. Ignored when logging_only_scope is set
    guardrail_info:            # Optional[Dict]: Additional information about the guardrail
      
```

Mode 規格

`default` 和 tag 值都接受單一字串或字串清單。

```python
from litellm.types.guardrails import Mode

# Single default mode
mode = Mode(
    tags={"User-Agent: claude-cli": "logging_only"},
    default="logging_only"
)

# Multiple default modes
mode = Mode(
    tags={"User-Agent: claude-cli": "logging_only"},
    default=["pre_call", "post_call"]
)

# Multiple modes on a tag value
mode = Mode(
    tags={"User-Agent: claude-cli": ["pre_call", "post_call"]},
    default="logging_only"
)
```

### `guardrails` 請求參數 {#guardrails-request-parameter}

`guardrails` 參數可以傳遞給任何 LiteLLM Proxy 端點（`/chat/completions`、`/completions`、`/embeddings`）。

#### 格式選項 {#format-options}

1. 簡單清單格式：

```python
{"guardrails": [
    "aporia-pre-guard",
    "aporia-post-guard"
]}
```

1. 進階字典格式：

在此格式中，字典鍵是您要執行的 `guardrail_name`

```python
{"guardrails": {
    "aporia-pre-guard": {
        "extra_body": {
            "success_threshold": 0.9,
            "other_param": "value"
        }
    }
}}
```

#### 型別定義 {#type-definition}

```python
guardrails: Union[
    List[str],                              # Simple list of guardrail names
    Dict[str, DynamicGuardrailParams]       # Advanced configuration
]

class DynamicGuardrailParams:
    extra_body: Dict[str, Any]              # Additional parameters for the guardrail
```
