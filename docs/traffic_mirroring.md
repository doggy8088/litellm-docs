---
sidebar_label: "流量鏡像"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# A/B 測試 - 流量鏡像 {#ab-testing---traffic-mirroring}

流量鏡像可讓您將生產流量「模擬」到第二個（靜默）模型，以供評估之用。靜默模型的回應會在背景中收集，不會影響主要請求的延遲或結果。

這對以下情況很有用：
- 在切換前，先測試新模型在生產提示上的效能。
- 比較不同提供者之間的成本與延遲。
- 透過將流量鏡像到更詳細的模型來除錯問題。

## 快速開始 {#quick-start}

若要啟用流量鏡像，請將 `silent_model` 新增到部署的 `litellm_params` 中。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

model_list = [
    {
        "model_name": "{{openai_small}}",
        "litellm_params": {
            "model": "azure/chatgpt-v-2",
            "api_key": "...",
            "silent_model": "{{openai_large}}" # Mirror traffic to {{openai_large}}
        },
    },
    {
        "model_name": "{{openai_large}}",
        "litellm_params": {
            "model": "openai/{{openai_large}}",
            "api_key": "..."
        },
    }
]

router = Router(model_list=model_list)

# The request to "{{openai_small}}" will trigger a background call to "{{openai_large}}"
response = await router.acompletion(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "How does traffic mirroring work?"}]
)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

將 `silent_model` 新增到您的 `config.yaml`：

```yaml
model_list:
  - model_name: primary-model
    litellm_params:
      model: azure/{{openai_small}}
      api_key: os.environ/AZURE_API_KEY
      silent_model: evaluation-model # Mirror traffic here
  - model_name: evaluation-model
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
```

</TabItem>
</Tabs>

## 串流請求 {#streaming-requests}

<SinceVersion v="1.103.0" />

鏡像呼叫會跟隨主要請求的 `stream` 旗標。串流請求會以串流呼叫的方式鏡像，LiteLLM 會在背景將鏡像串流讀取到底，因此靜默模型的支出記錄資料列與記錄回呼會取得串流時序，例如第一個 token 的時間。非串流請求則以非串流呼叫的方式鏡像。較早的版本一律以 `stream=False` 鏡像。

## 多個靜默模型 {#multiple-silent-models}

<SinceVersion v="1.103.0" />

`silent_model` 也可以接受模型名稱清單。LiteLLM 接著會將每個請求鏡像到清單中的每個模型，每個模型一個背景呼叫。

```yaml
model_list:
  - model_name: primary-model
    litellm_params:
      model: azure/{{openai_small}}
      api_key: os.environ/AZURE_API_KEY
      silent_model: [evaluation-model-a, evaluation-model-b]
  - model_name: evaluation-model-a
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: evaluation-model-b
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
```

## 運作方式 {#how-it-works}
1. **收到請求**：對模型群組發出請求（例如 `primary-model`）。
2. **選取部署**：LiteLLM 從群組中挑選一個部署。
3. **主要呼叫**：LiteLLM 對主要部署發出呼叫。
4. **鏡像**：對於 `silent_model` 中的每個模型，LiteLLM 會以與主要請求相同的 `stream` 旗標，觸發對該模型的背景呼叫。
   - 對於 **Sync** 呼叫：為每個靜默模型啟動一個背景執行緒。
   - 對於 **Async** 呼叫：使用 `asyncio.create_task`。
5. **隔離**：背景呼叫會使用原始請求參數的 `deepcopy`，並設定 `metadata["is_silent_experiment"] = True`。它也會移除記錄 ID，以防止使用量追蹤中的衝突。支出記錄與記錄回呼會將該呼叫標記為鏡像呼叫，如 [在記錄中尋找鏡像呼叫](#find-mirrored-calls-in-logs) 所述。

## 主要功能 {#key-features}
- **延遲隔離**：主要請求在準備好後立即回應。背景（靜默）呼叫不會阻塞。
- **統一記錄**：背景呼叫會透過 Router 處理，這表示它們會自動記錄到您設定的可觀測性工具（Langfuse、S3 等）。
- **評估**：鏡像呼叫在支出記錄與記錄回呼中帶有 `is_silent_experiment: true`，因此您可以篩選它們，並與主要呼叫比較。請參閱 [在記錄中尋找鏡像呼叫](#find-mirrored-calls-in-logs)。

## 在記錄中尋找鏡像呼叫 {#find-mirrored-calls-in-logs}

<SinceVersion v="1.109.0" />

LiteLLM 會在以下位置以 `is_silent_experiment: true` 標記每個鏡像呼叫。

| 目的地 | 標記所在位置 |
|---|---|
| 支出記錄 | `metadata.is_silent_experiment` |
| 記錄回呼 | `standard_logging_object["metadata"]["is_silent_experiment"]` |
| Langfuse | Generation 中繼資料 |
| Prometheus | `metadata_is_silent_experiment` 標籤 |
| Datadog Cloud Cost Management | `is_silent_experiment` 成本標籤 |

只有 router 會設定這個標記。用戶端在其請求中繼資料中送出 `is_silent_experiment`，並不會標記其支出記錄資料列、其記錄酬載，或其 Langfuse generation。

真實呼叫完全不帶有 `is_silent_experiment` 金鑰，而不是帶有 `false`。以 `is_silent_experiment = false` 篩選不會符合任何項目，因此請以 `true` 篩選來尋找鏡像呼叫，並以缺少該金鑰來尋找真實呼叫。

在鏡像呼叫執行期間開始的 LLM 呼叫也會帶有這個標記，因為它們是為鏡像服務。這涵蓋重試、備援，以及 pre-call hooks、防護欄與語意快取嵌入所發出的呼叫。記錄回呼在鏡像呼叫結束後才啟動的呼叫（例如評估回呼中的 LLM 評審），則不帶有標記。

### 支出記錄 {#spend-logs}

`/spend/logs/v2` 沒有 `is_silent_experiment` 的查詢參數。請從它回傳的資料列中讀取 `metadata.is_silent_experiment`，或直接查詢 `LiteLLM_SpendLogs` 資料表。

```sql
SELECT request_id, model, spend
FROM "LiteLLM_SpendLogs"
WHERE metadata->>'is_silent_experiment' = 'true';
```

若要改列出真實呼叫，請使用 `WHERE NOT metadata ? 'is_silent_experiment'`。

如果您以 `include` 清單設定 `general_settings.spend_logs_metadata_fields`，請將 `is_silent_experiment` 加入清單，以在支出記錄資料列上保留該標記。1.109.0 之前的版本不認識這個金鑰，在那裡命名它會讓 proxy 在啟動時停止。

### 記錄回呼 {#logging-callbacks}

自訂回呼會從 `kwargs["standard_logging_object"]["metadata"].get("is_silent_experiment")` 讀取標記，它在鏡像呼叫上為 `True`，在真實呼叫上則不存在。

不要為此使用 `kwargs["litellm_params"]["metadata"]` 中的原始請求中繼資料。它在鏡像呼叫上有 `is_silent_experiment: True`，但也會保留用戶端送出的任何 `is_silent_experiment` 值。讀取原始請求中繼資料的回呼（例如 PostHog 與 Helicone），也會顯示用戶端送出的值。

### Prometheus {#prometheus}

將 `metadata.is_silent_experiment` 加入 `custom_prometheus_metadata_labels`。鏡像呼叫的指標接著會取得 `metadata_is_silent_experiment="true"` 標籤，其他呼叫則取得 `metadata_is_silent_experiment="None"`。

```yaml
litellm_settings:
  callbacks: ["prometheus"]
  custom_prometheus_metadata_labels: ["metadata.is_silent_experiment"]
```

### Datadog Cloud Cost Management {#datadog-cloud-cost-management}

將 `is_silent_experiment` 加入 `datadog_cost_management` 回呼的 `cost_tag_keys`。鏡像呼叫的成本接著會取得 `is_silent_experiment:true` 標籤。

```yaml
litellm_settings:
  callbacks: ["datadog_cost_management"]

callback_settings:
  datadog_cost_management:
    cost_tag_keys: ["is_silent_experiment"]
```

router 是這個標籤與這個 tag 的唯一來源。用戶端的請求中繼資料或請求標籤，以及管理員的金鑰或團隊中繼資料，都不會設定它們，即使其中含有 `is_silent_experiment`。
