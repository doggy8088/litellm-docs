import Image from '@theme/IdealImage';

# 自訂 LLM 定價 {#custom-llm-pricing}

## 概覽 {#overview}

LiteLLM 為所有 LLM 提供者提供彈性的成本追蹤與定價自訂功能：

- **自訂定價** - 覆寫預設模型成本或為自訂模型設定定價
- **每 token 成本** - 根據輸入/輸出 token 追蹤成本（最常見）
- **每秒成本** - 根據執行時間追蹤成本（例如，Sagemaker）
- **零成本模型** - 透過將成本設為 0，讓免費/內部部署模型略過預算檢查
- **[提供者折扣](./provider_discounts.md)** - 對特定提供者套用百分比折扣
- **[提供者毛利](./provider_margins.md)** - 為 LLM 成本加上費用/毛利，用於內部計費
- **基礎模型對應** - 確保 Azure 部署的成本追蹤準確

預設情況下，回應成本可在成功（同步 + 非同步）時透過記錄物件中的 `kwargs["response_cost"]` 存取。[**了解更多**](../observability/custom_callback.md)

:::info

LiteLLM 的 [模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 已經包含 100+ 個模型的定價。 

:::

## 每秒成本（例如：Sagemaker） {#cost-per-second-eg-sagemaker}

#### 搭配 LiteLLM Proxy Server 使用 {#usage-with-litellm-proxy-server}

**步驟 1：將定價加入 config.yaml**
```yaml
model_list:
  - model_name: sagemaker-completion-model
    litellm_params:
      model: sagemaker/berri-benchmarking-Llama-2-70b-chat-hf-4
    model_info:
      input_cost_per_second: 0.000420
  - model_name: sagemaker-embedding-model
    litellm_params:
      model: sagemaker/berri-benchmarking-gpt-j-6b-fp16
    model_info:
      input_cost_per_second: 0.000420 
```

**步驟 2：啟動 proxy**

```bash
litellm /path/to/config.yaml
```

**步驟 3：檢視支出記錄**

<Image img={require('../../img/spend_logs_table.png')} />

## 每 token 成本（例如：Azure） {#cost-per-token-eg-azure}

#### 搭配 LiteLLM Proxy Server 使用 {#usage-with-litellm-proxy-server-1}

```yaml
model_list:
  - model_name: azure-model
    litellm_params:
      model: azure/<your_deployment_name>
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      api_version: os.environ/AZURE_API_VERSION
    model_info:
      input_cost_per_token: 0.000421 # 👈 ONLY to track cost per token
      output_cost_per_token: 0.000520 # 👈 ONLY to track cost per token
```

## 覆寫模型成本對照表 {#override-model-cost-map}

您可以使用自己的自訂定價，覆寫對應模型的 [模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。

只要在設定中為您的模型加入 `model_info` 鍵，並覆寫所需的鍵即可。

範例：為 `prod/claude-3-5-sonnet-20241022` 模型覆寫 Anthropic 的模型成本對照表。

```yaml
model_list:
  - model_name: "prod/claude-3-5-sonnet-20241022"
    litellm_params:
      model: "anthropic/claude-3-5-sonnet-20241022"
      api_key: os.environ/ANTHROPIC_PROD_API_KEY
    model_info:
      input_cost_per_token: 0.000006
      output_cost_per_token: 0.00003
      cache_creation_input_token_cost: 0.0000075
      cache_read_input_token_cost: 0.0000006
```

### 額外成本鍵 {#additional-cost-keys}

您可以使用其他鍵來指定不同情境與模態的成本：

- `input_cost_per_token_above_200k_tokens` - 當 context 超過 200k tokens 時的輸入 token 成本
- `output_cost_per_token_above_200k_tokens` - 當 context 超過 200k tokens 時的輸出 token 成本  
- `cache_creation_input_token_cost_above_200k_tokens` - 大型 context 的快取建立成本
- `cache_read_input_token_cost_above_200k_token` - 大型 context 的快取讀取成本
- `input_cost_per_image` - 多模態請求中每張圖片的成本
- `output_cost_per_reasoning_token` - 推理 token 的成本（例如，OpenAI o1 models）
- `input_cost_per_audio_token` - 語音輸入 token 的成本
- `output_cost_per_audio_token` - 語音輸出 token 的成本
- `input_cost_per_video_per_second` - 影片輸入每秒成本
- `input_cost_per_video_per_second_above_128k_tokens` - 大型 context 的影片成本
- `input_cost_per_character` - 某些提供者採用的以字元為基礎的定價
- `input_cost_per_token_priority` / `output_cost_per_token_priority` - Priority/PayGo 定價（Vertex AI Gemini、Bedrock）
- `input_cost_per_token_flex` / `output_cost_per_token_flex` - Batch/flex 定價

這些鍵會隨著新模型處理多模態的方式而演進。最新版本可在 [https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 找到。

### 服務層級 / PayGo 定價（Vertex AI、Bedrock） {#service-tier--paygo-pricing-vertex-ai-bedrock}

對於支援多種定價層級的提供者（例如：Vertex AI PayGo、Bedrock 服務層級），LiteLLM 會根據回應自動套用正確成本：

- **Vertex AI Gemini**：使用回應中的 `usageMetadata.trafficType`（`ON_DEMAND_PRIORITY` → priority，`FLEX`/`BATCH` → flex）。請參閱 [Vertex AI - PayGo / Priority 成本追蹤](../providers/vertex.md#paygo--priority-cost-tracking)。
- **Bedrock**：使用回應中的 `serviceTier`。請參閱 [Bedrock - 用量 - 服務層級](../providers/bedrock.md#usage---service-tier)。

## 零成本模型（略過預算檢查） {#zero-cost-models-bypass-budget-checks}

**使用情境**：您有應該在使用者超過預算上限時仍可存取的內部部署或免費模型。

**解決方案** ✅：將 `input_cost_per_token` 和 `output_cost_per_token` 都明確設為 `0`，即可為該模型略過所有預算檢查。

:::info

當模型設定為零成本時，LiteLLM 會自動略過該模型請求的所有預算檢查（使用者、團隊、團隊成員、終端使用者、組織，以及全域 proxy 預算）。

**重要**：兩個成本都必須**明確設為 0**。如果成本為 `null` 或未定義，該模型會被視為有成本，且預算檢查將會套用。

:::

### 設定範例 {#configuration-example}

```yaml
model_list:
  # On-premises model - free to use
  - model_name: on-prem-llama
    litellm_params:
      model: ollama/llama3
      api_base: http://localhost:11434
    model_info:
      input_cost_per_token: 0   # 👈 Explicitly set to 0
      output_cost_per_token: 0  # 👈 Explicitly set to 0
  
  # Paid cloud model - budget checks apply
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY
    # No model_info - uses default pricing from cost map
```

### 行為 {#behavior}

使用上述設定時：

- **使用者超出預算** → 仍可使用 `on-prem-llama` ✅，但會被禁止使用 `gpt-4` ❌
- **團隊超出預算** → 仍可使用 `on-prem-llama` ✅，但會被禁止使用 `gpt-4` ❌
- **終端使用者超出預算** → 仍可使用 `on-prem-llama` ✅，但會被禁止使用 `gpt-4` ❌

這可確保您的免費/內部部署模型無論預算限制如何都仍可存取，同時付費模型仍能正確受控。

## 設定 'base_model' 以進行成本追蹤（例如：Azure deployments） {#set-base_model-for-cost-tracking-eg-azure-deployments}

**問題**：當使用 `azure/gpt-4-1106-preview` 時，Azure 會在回應中傳回 `gpt-4`。這會導致成本追蹤不準確

**解決方案** ✅：在設定中設定 `base_model`，讓 litellm 使用正確的模型來計算 azure 成本

請從[這裡](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)取得 base model 名稱

包含 `base_model` 的設定範例
```yaml
model_list:
  - model_name: azure-gpt-3.5
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      base_model: azure/gpt-4-1106-preview
```

### 具有日期版本的 OpenAI 模型 {#openai-models-with-dated-versions}

當 OpenAI 在回應中傳回與您設定的模型名稱不同的日期版模型名稱時，`base_model` 也很有用。

**範例**：您為 `gpt-4o-mini-audio-preview` 設定了自訂定價，但 OpenAI 在回應中傳回 `gpt-4o-mini-audio-preview-2024-12-17`。由於 LiteLLM 會使用回應中的模型名稱進行定價查找，因此您的自訂定價不會被套用。

**解決方案** ✅：將 `base_model` 設為您希望 LiteLLM 用於定價查找的鍵。

```yaml
model_list:
  - model_name: my-audio-model
    litellm_params:
      model: openai/gpt-4o-mini-audio-preview
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      base_model: gpt-4o-mini-audio-preview  # 👈 Used for pricing lookup
      input_cost_per_token: 0.0000006
      output_cost_per_token: 0.0000024
      input_cost_per_audio_token: 0.00001
      output_cost_per_audio_token: 0.00002
```


## 疑難排解 {#debugging}

如果您的自訂定價沒有被使用，或您看到錯誤，請檢查以下項目：

1. 使用 `LITELLM_LOG="DEBUG"` 或 `--detailed_debug` cli 標誌執行 proxy

```bash
litellm --config /path/to/config.yaml --detailed_debug
```

2. 檢查是否有這一行記錄： 

```
LiteLLM:DEBUG: utils.py:263 - litellm.acompletion
```

3. 檢查 `input_cost_per_token` 和 `output_cost_per_token` 是否為 acompletion 函式中的最上層鍵。 

```bash
acompletion(
  ...,
  input_cost_per_token: my-custom-price, 
  output_cost_per_token: my-custom-price,
)
```

如果這些鍵不存在，LiteLLM 將不會使用您的自訂定價。 

如果問題仍然存在，請在 [GitHub](https://github.com/BerriAI/litellm/issues) 提交 issue。
