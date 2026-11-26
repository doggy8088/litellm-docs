---
title: "備援（提供者故障轉移）"
description: "在 LiteLLM 中設定自動提供者故障轉移。若模型或提供者在 num_retries 後失敗，則備援到另一個模型群組，以達到高可用性與可靠性。"
keywords:
  [
    備援,
    故障轉移,
    提供者故障轉移,
    模型故障轉移,
    自動故障轉移,
    高可用性,
    可靠性,
    重試,
    備用模型,
    跨提供者故障轉移,
  ]
sidebar_label: "備援"
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 備援（提供者故障轉移） {#fallbacks-provider-failover}

備援是 LiteLLM 執行自動 **故障轉移** 的方式。若請求在 num_retries 之後失敗，LiteLLM 會備援到另一個模型群組，讓失敗的模型或提供者自動故障轉移到健康的備用項目。如果您正在尋找「provider failover」或「model failover」，就是這一頁。 

- 快速開始 [load balancing](./load_balancing.md)
- 快速開始 [用戶端端備援](./client_side_fallbacks.md)

備援通常是從一個 `model_name` 到另一個 `model_name`。

## 快速開始  {#quick-start}

### 1. 設定備援 {#1-setup-fallbacks}

關鍵變更： 

```python
fallbacks=[{"{{openai_small}}": ["{{openai_large}}"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python keep-model-ids
from litellm import Router 
router = Router(
  model_list=[
    {
      "model_name": "{{openai_small}}",
      "litellm_params": {
        "model": "azure/<your-deployment-name>",
        "api_base": "<your-azure-endpoint>",
        "api_key": "<your-azure-api-key>",
        "rpm": 6
      }
    },
    {
      "model_name": "{{openai_large}}",
      "litellm_params": {
        "model": "azure/gpt-4-ca",
        "api_base": "https://my-endpoint-canada-berri992.openai.azure.com/",
        "api_key": "<your-azure-api-key>",
        "rpm": 6
      }
    }
  ],
  fallbacks=[{"{{openai_small}}": ["{{openai_large}}"]}] # KEY CHANGE
)

```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml keep-model-ids
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>
      rpm: 6      # Rate limit for this deployment: in requests per minute (rpm)
  - model_name: {{openai_large}}
    litellm_params:
      model: azure/gpt-4-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 6

router_settings:
  fallbacks: [{"{{openai_small}}": ["{{openai_large}}"]}]
```


</TabItem>
</Tabs>

### 2. 啟動 Proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 測試備援 {#3-test-fallbacks}

:::warning[已棄用於 Proxy 請求]
從 LiteLLM Proxy v1.85.0 起，`mock_testing_fallbacks`、`mock_testing_context_fallbacks` 和 `mock_testing_content_policy_fallbacks` 會從進入的 Proxy 請求中剝除，且不會產生任何效果。這些旗標僅在測試中針對直接的 `litellm.Router` 呼叫仍受支援。
:::

對於直接的 `Router` 測試，請傳入 `mock_testing_fallbacks=True` 以觸發備援。

<Tabs>
<TabItem value="sdk" label="SDK">

```python

from litellm import Router

model_list = [{...}, {...}] # defined in Step 1.

router = Router(model_list=model_list, fallbacks=[{"bad-model": ["my-good-model"]}])

response = router.completion(
  model="bad-model",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
  mock_testing_fallbacks=True,
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

模擬測試旗標已針對 Proxy 請求棄用。若要驗證 Proxy 備援，請在非正式環境中觸發實際的提供者錯誤，並在不帶 `mock_testing_*` 旗標的情況下送出一般請求。

</TabItem>
</Tabs>

### 說明 {#explanation}

備援會依順序執行 - `["{{openai_small}}", "{{openai_large}}", "{{anthropic}}"]`，會先使用 `{{openai_small}}`，接著是 `{{openai_large}}`，依此類推。

您也可以設定 [`default_fallbacks`](#default-fallbacks)，以防某個特定模型群組設定錯誤／有問題。

備援有 3 種類型： 
- `content_policy_fallbacks`：適用於 litellm.ContentPolicyViolationError - LiteLLM 會跨提供者對應內容政策違規錯誤 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/89a43c872a1e3084519fb9de159bf52f5447c6c4/litellm/utils.py#L8495C27-L8495C54)
- `context_window_fallbacks`：適用於 litellm.ContextWindowExceededErrors - LiteLLM 會跨提供者對應上下文視窗錯誤訊息 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/89a43c872a1e3084519fb9de159bf52f5447c6c4/litellm/utils.py#L8469)
- `fallbacks`：適用於其餘所有錯誤 - 例如 litellm.RateLimitError

備援至另一個提供者或另一把 API 金鑰上的部署時，無法解密失敗的部署在先前回合產生的加密推理（即用戶端以 `include: ["reasoning.encrypted_content"]` 重播的 Responses API 推理項目，或 `/v1/messages` 對話的思考區塊）。備援會丟棄目標無法解密的內容，並保留每個 Responses 推理項目可讀的摘要（思考區塊則整體丟棄），因此備援目標會在該回合重新推理並回應，而不會以 `invalid_encrypted_content` 失敗。這適用於每一次備援：上述三種類型、單一模型群組各部署之間的[依順序備援](./load_balancing.md#how-order-based-fallback-works)，以及串流中途中斷時的備援。此行為沒有個別部署的開關。對於由兩個提供者組成的有序群組，請同時開啟 [`encrypted_content_affinity`](../response_api.md#when-the-originating-deployment-cannot-serve-the-turn)：它會為每個推理項目標記產生它的部署，因此當 `order: 1` 處於冷卻狀態、回合直接派送至 `order: 2` 時（沒有備援，也就沒有剝除動作），推理同樣會被丟棄；而備援之後的回合會保留回應它的部署的推理，無需先付出一次失敗呼叫的代價

## 用戶端端備援 {#client-side-fallbacks}

若要從用戶端或 Python SDK 依請求設定備援，請參閱[用戶端備援](./client_side_fallbacks.md)。

## 內容政策違規備援 {#content-policy-violation-fallback}

關鍵變更： 

```python
content_policy_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

router = Router(
  model_list=[
    {
      "model_name": "{{anthropic}}",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": Exception("content filtering policy"),
      },
    },
    {
      "model_name": "my-fallback-model",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": "This works!",
      },
    },
  ],
  content_policy_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}], # KEY CHANGE
  # fallbacks=[..], # [OPTIONAL]
  # context_window_fallbacks=[..], # [OPTIONAL]
)

response = router.completion(
  model="{{anthropic}}",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

在您的 proxy config.yaml 中只要新增這一行

```yaml
router_settings:
  content_policy_fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}]
```

啟動 proxy 

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

</TabItem>
</Tabs>

## 上下文視窗超出備援 {#context-window-exceeded-fallback}

關鍵變更： 

```python
context_window_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}]
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

router = Router(
  model_list=[
    {
      "model_name": "{{anthropic}}",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": Exception("prompt is too long"),
      },
    },
    {
      "model_name": "my-fallback-model",
      "litellm_params": {
        "model": "{{anthropic}}",
        "api_key": "",
        "mock_response": "This works!",
      },
    },
  ],
  context_window_fallbacks=[{"{{anthropic}}": ["my-fallback-model"]}], # KEY CHANGE
  # fallbacks=[..], # [OPTIONAL]
  # content_policy_fallbacks=[..], # [OPTIONAL]
)

response = router.completion(
  model="{{anthropic}}",
  messages=[{"role": "user", "content": "Hey, how's it going?"}],
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

在您的 proxy config.yaml 中只要新增這一行

```yaml
router_settings:
  context_window_fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}]
```

啟動 proxy 

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

</TabItem>
</Tabs>

## 進階 {#advanced}

### 在標準層級備援之前先重試 Flex {#flex-tier-fallbacks}

對於能夠容忍可變延遲與容量的工作，請使用 OpenAI Flex。當應用程式允許標準層級的成本時，請為該層級設定一個獨立的備援部署。備援會更換部署，但不會自動變更 `service_tier`。關於模型可用性與資源不足錯誤，請參閱 OpenAI 的 [Flex 處理指南](https://platform.openai.com/docs/guides/flex-processing)。

在這個獨立範例中，客戶端選擇 `flex-workload`，而每個部署各自設定其層級。請將模型換成您的提供者帳戶中支援 Flex 的模型。逾時值為範例，目的是符合您應用程式的期限：

```yaml
model_list:
  - model_name: flex-workload
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      service_tier: flex
      timeout: 120
      stream_timeout: 120
  - model_name: standard-workload
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      service_tier: default
      timeout: 60
      stream_timeout: 60

router_settings:
  num_retries: 0
  model_group_retry_policy:
    flex-workload:
      RateLimitErrorRetries: 2
  max_fallbacks: 1
  fallbacks:
    - flex-workload: [standard-workload]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

OpenAI Flex 容量錯誤的 HTTP `429` 會對應到 `RateLimitError`。此獨立組態允許在 `flex-workload` 中針對該錯誤最多進行兩次路由器重試，接著進行一次標準層級備援。冷卻期與部署可用性可能會使重試無法到達提供者。路由器對於其他錯誤與模型群組的預設值為零次重試；Flex 政策會從第一次失敗起授予其重試額度。請求層級的 `num_retries: 0` 會停用群組重試政策；在將此組態合併到共用閘道之前，請先檢視呼叫端、金鑰與既有的路由器覆寫。

請在應用程式的期限內設定[逾時](./timeout.md)。請為每一次獲准的 Flex 嘗試、退避、連線建立、標準層級嘗試，以及任何客戶端重試預留時間。所示的值是每次嘗試的預算，而不是整個請求的期限。先到期的 ingress 或客戶端逾時，會使應用程式無法從備援中受益。

請傳送別名，不要帶請求層級的 `service_tier`：

```bash
curl http://localhost:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"flex-workload","input":"Summarize this non-sensitive test sentence."}'
```

請求層級的 `service_tier: flex` 優先於部署預設值，且可能沿用到備援，使兩次嘗試都留在 Flex 上。在此模式中，請將層級保留在部署上。此模式使用兩個模型群組；它不是針對任意傳入請求的自動層級降級。備援清單會處理一般錯誤，因此不限於 Flex 容量錯誤。只有當標準層級服務對於此工作負載的失敗情境、成本與資料政策而言可以接受時，才使用它。請依照[備援模型存取檢查](#enforce-key-model-access-on-fallbacks)，授予呼叫端存取兩個別名的權限。

#### 驗證層級轉換 {#validate-the-tier-transition}

請測試一次成功的 Flex 請求、一次 Flex 容量失敗，以及一次 Flex 逾時。請檢查提供者回傳的層級（若有提供）、重試次數、最終部署、延遲，以及記錄的成本。請使用[支出記錄中的備援中繼資料](#track-fallbacks-in-spend-logs)來區分主要與最終模型群組。接著讓標準層級目標失敗，並確認客戶端是在設定的嘗試次數之後才收到錯誤，而不是陷入無限制的重試迴圈。

請以串流重複測試，並量測首個內容的到達時間以及總持續時間。不要假設備援能夠在客戶端已經取用部分輸出後，透明地重新開始回應。如果禁止標準層級成本，請省略此備援，讓應用程式在其自身期限內排隊或重試 Flex 工作。請協調[警示路由](./alerting.md#route-actionable-alerts)，使預期的 Flex 延遲不會淹沒閘道失敗。

### 備援 + 重試 + 逾時 + 冷卻期 {#fallbacks--retries--timeouts--cooldowns}

設定備援，只要這樣做： 

```
litellm_settings:
  fallbacks: [{"zephyr-beta": ["{{openai_small}}"]}] 
```

**涵蓋所有錯誤（429、500 等）**

**透過 config 設定**
```yaml
model_list:
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8001
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8002
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8003
  - model_name: {{openai_small}}
    litellm_params:
        model: {{openai_small}}
        api_key: <my-openai-key>
  - model_name: {{openai_large}}
    litellm_params:
        model: {{openai_large}}
        api_key: <my-openai-key>

litellm_settings:
  num_retries: 3 # retry call 3 times on each model_name (e.g. zephyr-beta)
  request_timeout: 10 # raise Timeout error if call takes longer than 10s. Sets litellm.request_timeout 
  fallbacks: [{"zephyr-beta": ["{{openai_small}}"]}] # fallback to {{openai_small}} if call fails num_retries 

router_settings:
  allowed_fails: 3 # cooldown a deployment once it fails more than 3 calls within cooldown_time
  cooldown_time: 30 # (in seconds) how long a deployment stays in cooldown
```

### 備援到特定模型 ID {#fallback-to-specific-model-id}

如果某個群組中的所有模型都在冷卻期（例如受速率限制），LiteLLM 會備援到具有特定模型 ID 的模型。

這會略過該備援模型的任何冷卻期檢查。

1. 在 `model_info` 中指定模型 ID
```yaml keep-model-ids
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
    model_info:
      id: my-specific-model-id # KEY CHANGE
  - model_name: {{openai_large}}
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
```

**注意：** 這只會備援到具有特定模型 ID 的模型。如果您想備援到另一個模型群組，可以設定 `fallbacks=[{"{{openai_large}}": ["anthropic-claude"]}]`

2. 在 config 中設定備援

```yaml
litellm_settings:
  fallbacks: [{"{{openai_large}}": ["my-specific-model-id"]}]
```

3. 在主要部署不可用時進行測試。

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "model": "{{openai_large}}",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ]
}'
```

透過檢查回應標頭 `x-litellm-model-id` 來驗證是否可正常運作

```bash
x-litellm-model-id: my-specific-model-id
```

### 測試備援！  {#test-fallbacks}

透過在非正式環境中觸發相關的提供者錯誤，確認您的備援是否如預期運作。

#### **一般備援** {#regular-fallbacks}

讓主要測試部署回傳可重試的提供者錯誤，例如速率限制或伺服器錯誤，然後送出一般請求。

#### **內容政策備援** {#content-policy-fallbacks}

使用一個會被主要提供者以內容政策錯誤拒絕的測試請求。

#### **上下文視窗備援** {#context-window-fallbacks}

啟用前置呼叫檢查，並送出一個超過主要模型已設定內容視窗的測試請求。

### 在支出記錄中追蹤備援 {#track-fallbacks-in-spend-logs}

每一筆支出記錄列都會記錄該請求是由用戶端要求的 model group 提供，還是由備援提供。Proxy 會寫入 `metadata` 欄位中的兩個鍵，位於 `LiteLLM_SpendLogs`：

| Key | Type | Description |
|-----|------|-------------|
| `attempted_fallbacks` | int | 進行的備援嘗試次數。`0` 表示所請求的 model group 提供了此請求 |
| `original_model_group` | str | 用戶端最初請求的 model group |

範例來說，對 `{{openai_small}}` 的請求若失敗並切換到 `claude-fable-5`，會產生一筆包含 `model_group=claude-fable-5`、`attempted_fallbacks=1` 和 `original_model_group={{openai_small}}` 的列，因此事後仍能區分由備援提供與直接提供的請求：

```sql
SELECT model_group,
       metadata->>'attempted_fallbacks' AS attempted_fallbacks,
       metadata->>'original_model_group' AS original_model_group
FROM "LiteLLM_SpendLogs";
```

這兩個鍵都由 Proxy 設定，並會覆寫任何用戶端提供的同名值。此功能推出前寫入的列，這兩個鍵都會顯示 `null`。

### 上下文錯誤備援優先順序 {#context-error-fallback-precedence}

在重試處理之後，`ContextWindowExceededError` 會使用與所請求模型群組相符的 `context_window_fallbacks` 鏈。相符的鏈優先於後續的 `order` 層級與一般 `fallbacks`。相同的查閱也支援萬用字元備援鍵。

若沒有上下文視窗規則相符，路由器會嘗試該群組其餘的 `order` 層級，然後是其一般 `fallbacks`。其他群組的上下文視窗規則不會停用這些路徑。若相符的上下文視窗鏈已耗盡，請求會回傳錯誤，而不會繼續經過原群組的順序或一般備援鏈。請將每個想要的備援都納入相符的上下文鏈中。

| 所請求群組的設定 | 上下文錯誤後的復原 |
| --- | --- |
| 相符的 `context_window_fallbacks` 規則 | 在後續順序或一般備援之前使用該鏈 |
| 無相符規則，但有後續 `order` 層級 | 嘗試後續順序，然後是一般備援 |
| 無相符規則或後續順序 | 嘗試一般備援 |
| 僅有其他群組的上下文視窗規則 | 依循本群組的順序與一般備援設定 |

例如，兩個名為 `chat` 的部署屬於同一個群組。第二個部署是依順序排列的備援。`other` 群組有自己的上下文備援，不會影響對 `chat` 的請求。

```yaml
model_list:
  - model_name: chat
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      order: 1
  - model_name: chat
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
      order: 2
  - model_name: other
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: large-context
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
router_settings:
  context_window_fallbacks:
    - other: [large-context]
```

若第一個 `chat` 部署回傳上下文視窗錯誤，路由器會嘗試其 `order: 2` 部署。改為在 `context_window_fallbacks` 下加入 `- chat: [large-context]`，則會在重試處理之後將該錯誤直接送至 `large-context`。

同級重試、順序故障轉移與跨群組備援是各自獨立的操作。同級重試會在重試預算內，於目前群組與目前順序層級中選擇另一個符合資格的部署。設定 `num_retries: 0` 會停用這些重試，但不會停用順序或跨群組故障轉移。順序故障轉移會前進到後續的順序。上下文視窗備援會切換群組。`enable_weighted_failover` 對於上下文視窗錯誤與內容政策錯誤仍不適用。

這些規則適用於 LiteLLM 分類為 `ContextWindowExceededError` 的錯誤，包括提供者的拒絕。`enable_pre_call_checks` 還會在聯絡提供者之前檢查已宣告的輸入限制。現有的 `max_fallbacks` 限制仍會約束該鏈。備援部署仍必須接受該提示，並通過存取、健康狀態與其他路由檢查。

#### 先在群組內重試，再進行備援 {#retry-the-group-before-falling-back}

<SinceVersion v="1.113.0" />

啟用 `enable_pre_call_checks: true` 後，提供者回報的上下文視窗錯誤會先在同一群組內的另一個部署上重試。這些重試會計入 `num_retries`，且發生在後續的 `order` 層級與通用 `fallbacks` 之前。當某個部署的 `max_input_tokens` 實際上大於提供者帳號實際接受的上限時，這項機制特別有用：呼叫前檢查會放行該提示，隨後提供者卻拒絕了它。

重試會跳過所有提供被拒模型的部署（因為它們都會拒絕同一個提示）。若某個部署的 `max_input_tokens` 大於被拒部署的上限，仍會嘗試該部署。路由器會從 `model_info.base_model` 讀取模型，否則從 `model` 讀取，並會把 Bedrock 區域前綴（例如 `us.`）視為其基礎模型。同一模型的兩個 Azure 部署必須具備相同的 `base_model`，才會一起被跳過。相符的 `context_window_fallbacks` 規則仍優先於重試，而對單一部署 ID 的呼叫不會重試。若重試全部失敗，請求會回傳第一個上下文視窗錯誤。

在此範例中，Bedrock 部署宣告了 100 萬 token 的視窗，但帳號實際接受的輸入 token 更少。

```yaml
model_list:
  - model_name: long-prompt
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
    model_info:
      max_input_tokens: 1000000
  - model_name: long-prompt
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
router_settings:
  enable_pre_call_checks: true
  num_retries: 2
```

```bash
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d @long_prompt.json
```

當路由器為一個超過帳號可接受長度的提示選擇 Bedrock 部署時，Bedrock 會回傳 400 並附上「prompt is too long」。路由器接著會把提示轉發給 OpenAI 部署，Proxy 則回傳 200 並帶有 `x-litellm-attempted-retries: 1`。若未啟用 `enable_pre_call_checks`，該 400 會直接回傳給呼叫端，或交由該群組的通用 `fallbacks` 處理（若有設定）。

### 上下文視窗備援（呼叫前檢查 + 備援） {#context-window-fallbacks-pre-call-checks--fallbacks}

**在發出呼叫之前**，使用 **`enable_pre_call_checks: true`** 檢查請求是否在模型上下文視窗內。

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/c9e6b05cfb20dfb17272218e2555d6b496c47f6f/litellm/router.py#L2163)

:::important
**`enable_pre_call_checks` 是必要的**，才能強制執行上下文視窗。若沒有它，不論輸入 token 數量多少，請求都會送到提供者。請在您的設定中的 `enable_pre_call_checks: true` 設定 `router_settings`。
:::

#### 每個 deployment 自訂 max_input_tokens {#custom-max_input_tokens-per-deployment}

您可以在 `max_input_tokens` 中設定 `model_info`，以覆寫某個 deployment 的預設上下文限制。這對測試、對長提示詞做速率限制，或強制比提供者預設值更嚴格的限制都很有用。

以下 **兩者都** 必須具備：

1. **`router_settings.enable_pre_call_checks: true`** — 啟用前置呼叫檢查
2. **`model_info.max_input_tokens`** 在部署上，這會覆寫該模型的限制

```yaml
router_settings:
  enable_pre_call_checks: true  # Required for enforcement

model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      max_input_tokens: 10  # Override: reject prompts > 10 tokens
```

如果請求超過限制，LiteLLM 會拋出 `ContextWindowExceededError`，並帶有如 `Model={{openai_large}}, Max Input Tokens=10, Got=306` 之類的詳細資訊。

**1. 設定 config**

針對 azure deployments，請設定 base model。請從 [這份清單](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中選擇 base model，所有 azure models 都以 azure/ 開頭。

<Tabs>
<TabItem value="same-group" label="Same Group">

以較小內容視窗篩選模型的實例（例如 gpt-5.4-mini）

此範例中的 model ids 僅供說明，並保留其內容視窗大小。

```yaml keep-model-ids
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
  - model_name: gpt-5.4-mini
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      base_model: azure/gpt-4.1 # 2. (azure-only) SET BASE MODEL

  - model_name: gpt-5.4-mini
    litellm_params:
      model: gpt-5.4-mini
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

**2. 啟動 proxy**

```bash
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試看看！**

測試提示詞約為 320,000 個 token，因此 Azure 部署需要高於該數量的每分鐘 token 配額。配額較低的部署會受到速率限制，而 proxy 隨後會回報上下文視窗錯誤，而不是速率限制。

在另一個終端機中，將 `LITELLM_API_KEY` 設為上方印出的金鑰，然後執行：

```python keep-model-ids
import os
import openai
client = openai.OpenAI(
    api_key=os.environ["LITELLM_API_KEY"],
    base_url="http://0.0.0.0:4000"
)

text = "What is the meaning of 42?" * 40000

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-5.4-mini",
    messages = [
      {"role": "system", "content": text},
      {"role": "user", "content": "Who was Alexander?"},
    ],
)

print(response)
```

</TabItem>

<TabItem value="different-group" label="Context Window Fallbacks (Different Groups)">

如果目前模型太小，則備援到更大的模型。

此範例中的 model ids 僅供說明，並保留其內容視窗大小。

```yaml keep-model-ids
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY

router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
  - model_name: small-model
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      base_model: azure/gpt-4o # 2. (azure-only) SET BASE MODEL

  - model_name: large-model
    litellm_params:
      model: {{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-opus
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  context_window_fallbacks: [{"small-model": ["large-model", "claude-opus"]}]
```

**2. 啟動 proxy**

```bash
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試看看！**

在另一個終端機中，將 `LITELLM_API_KEY` 設為上方印出的金鑰，然後執行：

```python keep-model-ids
import os
import openai
client = openai.OpenAI(
    api_key=os.environ["LITELLM_API_KEY"],
    base_url="http://0.0.0.0:4000"
)

text = "What is the meaning of 42?" * 25000

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="small-model",
    messages = [
      {"role": "system", "content": text},
      {"role": "user", "content": "Who was Alexander?"},
    ],
)

print(response)
```

</TabItem>
</Tabs>

### 內容政策備援 {#content-policy-fallbacks-1}

如果遇到內容政策違規錯誤，則跨提供者備援（例如從 Azure OpenAI 備援到 Anthropic）。 

```yaml keep-model-ids
model_list:
    - model_name: small-model
      litellm_params:
        model: azure/chatgpt-v-2
        api_base: os.environ/AZURE_API_BASE
        api_key: os.environ/AZURE_API_KEY
        api_version: "2023-07-01-preview"

    - model_name: claude-opus
      litellm_params:
        model: {{anthropic_large}}
        api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  content_policy_fallbacks: [{"small-model": ["claude-opus"]}]
```

### 預設備援  {#default-fallbacks}

您也可以設定 default_fallbacks，以防某個特定模型群組設定錯誤／有問題。

```yaml keep-model-ids
model_list:
    - model_name: small-model
      litellm_params:
        model: azure/chatgpt-v-2
        api_base: os.environ/AZURE_API_BASE
        api_key: os.environ/AZURE_API_KEY
        api_version: "2023-07-01-preview"

    - model_name: claude-opus
      litellm_params:
        model: {{anthropic_large}}
        api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  default_fallbacks: ["claude-opus"]
```

這會在任何模型失敗時預設使用 claude-opus。

特定模型的備援（例如 `{"small-model": ["claude-opus"]}`）會覆寫預設備援。

### EU 區域篩選（呼叫前檢查） {#eu-region-filtering-pre-call-checks}

**在發出呼叫之前**，使用 **`enable_pre_call_checks: true`** 檢查請求是否在模型上下文視窗內。

設定 deployment 的 'region_name'。

**注意：** LiteLLM 可根據您的 litellm 參數，自動推斷 Vertex AI、Bedrock 和 IBM WatsonxAI 的 region_name。對於 Azure，請設定 `litellm.enable_preview = True`。

**1. 設定設定**

```yaml keep-model-ids
router_settings:
  enable_pre_call_checks: true # 1. Enable pre-call checks

model_list:
- model_name: {{openai_small}}
  litellm_params:
    model: azure/chatgpt-v-2
    api_base: os.environ/AZURE_API_BASE
    api_key: os.environ/AZURE_API_KEY
    api_version: "2023-07-01-preview"
    region_name: "eu" # SET EU-REGION

- model_name: {{openai_small}}
  litellm_params:
    model: {{openai_small}}
    api_key: os.environ/OPENAI_API_KEY

- model_name: {{gemini_flash}}
  litellm_params:
    model: vertex_ai/{{gemini_flash}}
    vertex_project: adroit-crow-1234
    vertex_location: us-east1 # AUTOMATICALLY INFERS 'region_name'
```

**2. 啟動代理伺服器**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 測試它！**

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.with_raw_response.create(
    model="{{openai_small}}",
    messages = [{"role": "user", "content": "Who was Alexander?"}]
)

print(response)

print(response.headers.get('x-litellm-model-api-base'))
```

### 視覺能力篩選（圖片請求） {#vision-capability-filtering-image-requests}

**在進行呼叫之前**，LiteLLM 會將已宣告為純文字的部署，從帶有圖片的請求候選中移除，也就是帶有 `image_url` 內容部分的 `/v1/chat/completions` 呼叫、帶有 `input_image` 項目的 `/v1/responses` 呼叫，或帶有 `image` 區塊的 `/v1/messages` 呼叫。此篩選在每種路由策略下預設都會執行，不需要 `enable_pre_call_checks: true`。

當設定了 `model_info.supports_vision: false` 時，部署即為純文字；若該鍵未設定，則當模型型錄對 `model_info.base_model`、其次是 `litellm_params.base_model`、其次是模型名稱標示 `supports_vision: false` 時亦然。沒有宣告且沒有型錄條目的部署仍保有資格，因此請為自訂的純文字部署宣告 `supports_vision: false`。當群組中的每個部署都是純文字時，不會移除任何部署，並會回傳提供者本身的錯誤，這保留了以往只提供文字服務之群組的行為。`x-litellm-model-id` 回應標頭會指出提供該請求服務（或失敗）的部署。

**1. 設定 config**

下方的 Bedrock gpt-oss 部署不需要宣告，因為模型型錄已將其標示為純文字。自訂部署則需要。

```yaml
model_list:
  - model_name: mixed
    litellm_params:
      model: openai/gpt-5.6
      api_key: os.environ/OPENAI_API_KEY
  - model_name: mixed
    litellm_params:
      model: bedrock/openai.gpt-oss-120b-1:0
      aws_region_name: us-east-1
  - model_name: mixed
    litellm_params:
      model: hosted_vllm/my-text-only-model
      api_base: os.environ/TEXT_API_BASE
    model_info:
      supports_vision: false

router_settings:
  routing_strategy: latency-based-routing
```

**2. 測試看看！**

```bash
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mixed",
    "messages": [{"role": "user", "content": [
      {"type": "text", "text": "What is in this image?"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KGgo="}}
    ]}]
  }'
```

`x-litellm-model-id` 標頭每次都會指出 `openai/gpt-5.6` 部署，而純文字請求仍可落到三者中的任何一個。

### 為萬用字元模型設定備援 {#setting-fallbacks-for-wildcard-models}

您可以在設定檔中為萬用字元模型（例如 `azure/*`）設定備援。

1. 設定設定檔
```yaml
model_list:
  - model_name: "{{openai_large}}"
    litellm_params:
      model: "openai/{{openai_large}}"
      api_key: os.environ/OPENAI_API_KEY
  - model_name: "azure/*"
    litellm_params:
      model: "azure/*"
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

litellm_settings:
  fallbacks: [{"{{openai_large}}": ["azure/{{openai_large}}"]}]
```

2. 啟動 Proxy
```bash
litellm --config /path/to/config.yaml
```

3. 在主要部署不可用時進行測試。

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "model": "{{openai_large}}",
    "messages": [
      {
        "role": "user",
        "content": [    
          {
            "type": "text",
            "text": "what color is red"
          }
        ]
      }
    ],
    "max_tokens": 300
}'
```

#### 針對裸模型名稱的提供者前綴備援鍵 {#provider-prefixed-fallback-keys-for-bare-model-names}

對於像 `{{anthropic}}` 這類裸模型名稱的請求，也就是 Claude Code 傳送的格式，會由 `anthropic/*` 部署提供，而備援查找會將其與以該萬用字元寫法記錄的鍵比對，也就是 `anthropic/{{anthropic}}`。LiteLLM 會以與路由相同的方式推斷提供者，並且只有在某個備援鍵以 `/<model name>` 結尾時才會嘗試這種方式，因此解析為沒有提供者的別名仍會落到 `*`。優先順序是先比對完全相同的鍵，接著是同層級的鍵（裸名稱的 `<provider>/<model>` 拼法，或帶前綴名稱的裸拼法），最後是 `*`，而相同的查找也適用於 `fallbacks`、`context_window_fallbacks` 和 `content_policy_fallbacks`。匹配到的鏈是終點：一旦選定 `anthropic/{{anthropic}}` 鏈，`*` 就不會在其目標失敗後再嘗試，因此當 `*` 目標也應該執行時，請將它們列在該鏈的末端。新增於 [PR #43062](https://github.com/BerriAI/litellm/pull/43062)，將在下一個 release candidate 提供

```yaml
model_list:
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: "openai/{{openai_large}}"
    litellm_params:
      model: "openai/{{openai_large}}"
      api_key: os.environ/OPENAI_API_KEY
  - model_name: "{{openai_small}}"
    litellm_params:
      model: "openai/{{openai_small}}"
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  fallbacks:
    - {"anthropic/{{anthropic}}": ["openai/{{openai_large}}", "{{openai_small}}"]}
    - {"*": ["{{openai_small}}"]}
```

對於 `{{anthropic}}` 的請求若在 `anthropic/*` 上失敗，會先重試 `openai/{{openai_large}}`，接著再重試 `{{openai_small}}`；而對於任何其他沒有自己鍵值的裸名稱請求，則會直接送往 `*`

### 在備援上強制執行 Key 模型存取權限 {#enforce-key-model-access-on-fallbacks}

Proxy 會在嘗試每個備援目標之前，將呼叫 key、team 與 project 的模型存取檢查套用到所有備援目標，因此備援絕不會提供呼叫者無法直接呼叫的模型。呼叫者不能使用的目標會被略過。當沒有授權的目標可用時，呼叫者會收到主要模型本身的錯誤。允許呼叫備援模型的 key 仍會如以往一樣進行備援，而此檢查涵蓋 `fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks` 和 `default_fallbacks`。

```yaml keep-model-ids
model_list:
  - model_name: gpt-5.6
    litellm_params:
      model: openai/gpt-5.6
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      access_groups: ["openai-only"]
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  fallbacks:
    - gpt-5.6: ["{{anthropic}}"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

以 `"models": ["openai-only"]` 建立的 key 可以呼叫 `gpt-5.6`，但不能呼叫 `{{anthropic}}`。來自該 key 的失敗 `gpt-5.6` 請求會回傳 OpenAI 錯誤，而不是 `{{anthropic}}` completion，且回應不會帶有 `x-litellm-attempted-fallbacks` header。以 `"models": ["openai-only", "{{anthropic}}"]` 建立的 key 仍然會進行備援。

未攜帶虛擬 key 的請求，例如 Proxy 自身的健康檢查，永遠不會受到限制。如果存取查找本身失敗，則會略過備援，而不是允許。

設定 `general_settings.enforce_fallback_model_access: false` 可略過此檢查，讓每個已設定的備援不論呼叫者的模型存取權限都執行。搜尋請求的備援仍會對照 key、team 與使用者的搜尋工具授權進行檢查。

```yaml
general_settings:
  enforce_fallback_model_access: false
```

:::warning

較早的版本即使呼叫者無法呼叫備援模型，仍會執行備援。如果您的部署依賴此行為，請授與呼叫者備援模型的存取權限，或設定 `enforce_fallback_model_access: false`。否則，這些請求在升級後會回傳主要模型的錯誤。

:::

### 在備援上強制執行預算 {#enforce-budget-on-fallbacks}

預算只會在請求通過驗證時檢查一次，檢查對象是呼叫者所要求的模型。之後才會選定備援目標，因此單靠這次檢查無法看見實際計費的模型。這在主要模型的定價為零時最重要：零成本模型完全免於預算檢查，因此若沒有第二次檢查，該模型的請求會被允許通過、再備援到付費模型，並且會在沒有套用上限的情況下完整計費。

Proxy 會在嘗試每個備援目標之前，重新檢查呼叫用 key 與使用者的預算，因此這不需要任何設定。超出預算的目標會被略過。當沒有可負擔的目標可用時，呼叫者會收到主要模型本身的錯誤。主要嘗試本身永遠不會被阻擋，因此零成本模型在上限下仍可運作，而零成本的備援目標則一律允許。此檢查涵蓋 `fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks` 和 `default_fallbacks`。

此備援檢查涵蓋金鑰與使用者的整體 `max_budget`，以及團隊成員的每模型上限。它不會重新檢查團隊或團隊成員的整體預算、終端使用者／組織／全域預算、一般的金鑰／使用者／團隊 `model_max_budget`，或金鑰的滾動式 `budget_limits`。它會在不預留資金的情況下讀取支出，因此並行的備援可能會跨越上限。不要將原始模型別名的預算視為橫跨所有備援群組的一個強制上限；請參閱[別名報表與預算](./cost_tracking.md#track-a-public-model-alias)。

```yaml keep-model-ids
model_list:
  - model_name: free-model
    litellm_params:
      model: ollama/llama2
      api_base: http://localhost:11434
      input_cost_per_token: 0
      output_cost_per_token: 0
    model_info:
      input_cost_per_token: 0
      output_cost_per_token: 0
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  fallbacks:
    - free-model: ["{{anthropic}}"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

支出已超過其 `max_budget` 的使用者，仍可呼叫 `free-model` 並且不需支付任何費用。當 `free-model` 失敗時，該使用者會收到 `free-model` 錯誤，而不是一個會計費的 `{{anthropic}}` completion，且回應不會帶有 `x-litellm-attempted-fallbacks` header。仍在預算內的使用者則會照以往一樣繼續備援到 `{{anthropic}}`。

若要關閉此功能，讓備援不受呼叫者預算限制，請設定 `enforce_fallback_budget: false`：

```yaml
general_settings:
  enforce_fallback_budget: false
```

team key 不會繼承 key 擁有者個人的 `max_budget`，除非設定了 `general_settings.apply_user_budget_to_team_keys`，這與其他地方套用個人預算的方式一致。未攜帶虛擬 key 的請求，例如 Proxy 自身的健康檢查，永遠不會受到限制。如果支出查找本身失敗，則會略過備援，而不是允許。

### 停用備援（每次請求/金鑰） {#disable-fallbacks-per-requestkey}

<Tabs>

<TabItem value="request" label="每次請求">

您可以在請求本文中設定 `disable_fallbacks: true`，以停用每個請求的備援。

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
    "messages": [
        {
            "role": "user",
            "content": "List 5 important events in the XIX century"
        }
    ],
    "model": "{{openai_small}}",
    "disable_fallbacks": true
}'
```

</TabItem>

<TabItem value="key" label="每個金鑰">

您可以在金鑰中繼資料中設定 `disable_fallbacks: true`，以按金鑰停用備援。

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "disable_fallbacks": true
    }
}'
```

</TabItem>
</Tabs>

這兩種形式都涵蓋了代理程式原本會為該請求進行的所有備援，包括串流中途的那一種：當所選部署的串流在其第一個 chunk 之前於 `/chat/completions`、`/v1/messages` 或 `/v1/responses` 失敗時，該請求會回傳該部署自身的錯誤，而不是備援部署的回應
