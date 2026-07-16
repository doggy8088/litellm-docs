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
        "model_name": "gpt-3.5-turbo",
        "litellm_params": {
            "model": "azure/chatgpt-v-2",
            "api_key": "...",
            "silent_model": "gpt-4" # 👈 Mirror traffic to gpt-4
        },
    },
    {
        "model_name": "gpt-4",
        "litellm_params": {
            "model": "openai/gpt-4",
            "api_key": "..."
        },
    }
]

router = Router(model_list=model_list)

# The request to "gpt-3.5-turbo" will trigger a background call to "gpt-4"
response = await router.acompletion(
    model="gpt-3.5-turbo",
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
      model: azure/gpt-35-turbo
      api_key: os.environ/AZURE_API_KEY
      silent_model: evaluation-model # 👈 Mirror traffic here
  - model_name: evaluation-model
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

</TabItem>
</Tabs>

## 運作方式 {#how-it-works}
1. **收到請求**：對模型群組發出請求（例如 `primary-model`）。
2. **選取部署**：LiteLLM 從群組中挑選一個部署。
3. **主要呼叫**：LiteLLM 對主要部署發出呼叫。
4. **鏡像**：如果存在 `silent_model`，LiteLLM 會觸發對該模型的背景呼叫。 
   - 對於 **Sync** 呼叫：使用共享的執行緒池。
   - 對於 **Async** 呼叫：使用 `asyncio.create_task`。
5. **隔離**：背景呼叫會使用原始請求參數的 `deepcopy`，並設定 `metadata["is_silent_experiment"] = True`。它也會移除記錄 ID，以防止使用量追蹤中的衝突。

## 主要功能 {#key-features}
- **延遲隔離**：主要請求在準備好後立即回應。背景（靜默）呼叫不會阻塞。
- **統一記錄**：背景呼叫會透過 Router 處理，這表示它們會自動記錄到您設定的可觀測性工具（Langfuse、S3 等）。
- **評估**：在您的記錄中使用 `is_silent_experiment: True` 標記，以篩選並比較主要與鏡像呼叫之間的結果。
