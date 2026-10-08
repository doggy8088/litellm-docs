import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Claude Code 搭配非 Anthropic 模型 {#use-claude-code-with-non-anthropic-models}

本教學說明如何透過 LiteLLM proxy，將 Claude Code 與非 Anthropic 模型（例如 OpenAI、Gemini，以及其他 LLM 提供者）搭配使用。

:::info 

LiteLLM 會自動在不同提供者格式之間進行轉換，讓您在維持 Anthropic Messages API 格式的同時，使用 Claude Code 搭配任何受支援的 LLM 提供者。

:::

## 先決條件 {#prerequisites}

- 已安裝 [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)
- 您所選提供者的 API 金鑰（OpenAI、Vertex AI 等）

## 安裝 {#installation}

首先，安裝具備 proxy 支援的 LiteLLM：

```bash
uv tool install 'litellm[proxy]'
```

## 組態 {#configuration}

### 1. 設定 config.yaml {#1-setup-configyaml}

建立一個使用您偏好的非 Anthropic 模型的設定檔：

<Tabs>
<TabItem value="openai" label="OpenAI">

```yaml
model_list:
  # OpenAI {{openai_large}}
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  
  # OpenAI {{openai_small}}
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
```

設定您的環境變數：

```bash
export OPENAI_API_KEY="your-openai-api-key"
export LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"  # Generate a secure key
```

</TabItem>
<TabItem value="gemini" label="Google AI Studio">

```yaml
model_list:
  # Google Gemini
  - model_name: {{gemini_flash}}
    litellm_params:
      model: gemini/{{gemini_flash}}
      api_key: os.environ/GEMINI_API_KEY
```

設定您的環境變數：

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"  # Generate a secure key
```

</TabItem>
<TabItem value="vertex_ai" label="Vertex AI">

```yaml
model_list:
  # Google Gemini
  - model_name: vertex-gemini-3.8-flash
    litellm_params:
      model: vertex_ai/{{gemini_flash}}
      vertex_credentials: os.environ/VERTEX_FILE_PATH_ENV_VAR # os.environ["VERTEX_FILE_PATH_ENV_VAR"] = "/path/to/service_account.json" 
      vertex_project: "my-test-project"
      vertex_location: "us-east-1"

  # Anthropic Claude
  - model_name: anthropic-vertex
    litellm_params:
      model: vertex_ai/{{anthropic}}
      vertex_ai_project: "my-test-project"
      vertex_ai_location: "us-east-1"
      vertex_credentials: os.environ/VERTEX_FILE_PATH_ENV_VAR # os.environ["VERTEX_FILE_PATH_ENV_VAR"] = "/path/to/service_account.json" 
```

設定您的環境變數：

```bash
export VERTEX_FILE_PATH_ENV_VAR="/path/to/service_account.json"
export LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"  
```

</TabItem>
<TabItem value="multi" label="Azure OpenAI">

```yaml
model_list:
  # Azure OpenAI
  - model_name: azure-gpt-5.6-terra
    litellm_params:
      model: azure/{{openai_large}}
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      api_version: "2024-02-01"
```

設定您的環境變數：

```bash
export AZURE_API_KEY="your-azure-api-key"
export AZURE_API_BASE="https://your-resource.openai.azure.com"
export LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"
```

</TabItem>
</Tabs>

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 驗證設定 {#3-verify-setup}

測試您的 proxy 是否正常運作：

<Tabs>
<TabItem value="openai-test" label="OpenAI">

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "{{openai_large}}",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
}'
```

</TabItem>
<TabItem value="gemini-test" label="Google AI Studio">

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "{{gemini_flash}}",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
}'
```

</TabItem>
<TabItem value="vertex-test" label="Vertex AI">

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "{{gemini_flash}}",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
}'
```

</TabItem>
<TabItem value="azure-test" label="Azure OpenAI">

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "azure-gpt-5.6-terra",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
}'
```

</TabItem>
</Tabs>

### 4. 設定 Claude Code {#4-configure-claude-code}

將 Claude Code 設定為使用您的 LiteLLM proxy：

```bash
export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"
export ANTHROPIC_AUTH_TOKEN="$LITELLM_MASTER_KEY"
```

:::tip
`LITELLM_MASTER_KEY` 可讓 Claude Code 存取所有 proxy 模型。您也可以在 LiteLLM UI 中建立虛擬金鑰，以限制存取特定模型。
:::

### 5. 使用 Claude Code 搭配非 Anthropic 模型 {#5-use-claude-code-with-non-anthropic-models}

啟動 Claude Code 並指定要使用的模型：

```bash
# Use OpenAI {{openai_large}}
claude --model {{openai_large}}

# Use OpenAI {{openai_small}} for faster responses
claude --model {{openai_small}}

# Use Google Gemini
claude --model {{gemini_flash}}

# Use Vertex AI Gemini
claude --model vertex-gemini-3.8-flash

# Use Vertex AI Anthropic Claude
claude --model anthropic-vertex

# Use Azure OpenAI
claude --model azure-gpt-5.6-terra
```

### 6. 在執行階段切換模型，使用 `/model` {#6-switch-models-at-runtime-with-model}

Claude Code 執行後，您可以使用內建的 `/model` 指令，在 LiteLLM proxy 提供的任何模型之間切換。預設情況下，選擇器只會顯示 Anthropic 的硬編碼模型，因此若要讓它列出來自您的 LiteLLM proxy 的模型，您必須啟用 **gateway model discovery**。

在啟動 Claude Code 之前，請設定以下環境變數：

```bash
export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
```

啟動時，Claude Code 會針對您的 `ANTHROPIC_BASE_URL`（您的 LiteLLM proxy）呼叫 `GET /v1/models`，並將每個回傳的模型加入 `/model` 選擇器，標示為 **From gateway**。在 Claude Code 中，執行：

```
/model
```

然後選取任何由 LiteLLM 管理的模型（`{{openai_large}}`、`{{gemini_flash}}`、`anthropic-vertex` 等），即可在不重新啟動工作階段的情況下切換。

:::info[需求]

- Claude Code **v2.1.129** 或更新版本。
- `ANTHROPIC_BASE_URL` 必須指向一個提供 Anthropic Messages API 格式的 gateway。LiteLLM 會在 `/v1/messages` 上這麼做。
- 探索功能為選擇性啟用。若沒有 `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`，Claude Code 不會查詢您 proxy 的 `/v1/models`，而且 `/model` 選擇器只會顯示內建的 Anthropic 模型。以 Claude Code v2.1.247 驗證：只有在設定該變數後，選擇器才會將模型標示為 **From gateway**。與 `ENABLE_TOOL_SEARCH` 一樣，您可以將它持久化寫入 `env` 的 `.claude/settings.json` 區塊中。

:::

:::tip[僅顯示特定模型]

如果您只希望 LiteLLM 模型的子集出現在 `/model` 選擇器中，請針對那些模型發出一個 [虛擬金鑰](../proxy/virtual_keys)，並將該金鑰用作 `ANTHROPIC_AUTH_TOKEN`。`/v1/models` 只會回傳該金鑰可存取的模型。

您也可以透過 `ANTHROPIC_CUSTOM_MODEL_OPTION` 手動新增個別模型項目，取代（或除此之外）啟用探索功能。

:::

### 7. 使用 `display_name` 在選擇器中顯示乾淨名稱 {#7-show-a-clean-name-in-the-picker-with-display_name}

`/model` 選擇器只會保留 id 包含 `claude` 或 `anthropic` 的 gateway 模型，因此非 Anthropic 模型需要像 `kimi-k3-claude-compatible` 這樣具 Claude 風格的名稱，才會完全顯示；接著選擇器會將該原始 id 顯示為標籤。若要保留用於路由的 id，但顯示較友善的標籤，請在模型的 `model_info` 下設定 `display_name`：

```yaml
model_list:
  - model_name: kimi-k3-claude-compatible
    litellm_params:
      model: moonshot/kimi-k3
      api_key: os.environ/MOONSHOT_API_KEY
    model_info:
      display_name: Kimi K3
```

Anthropic 形式的 `GET /v1/models` 回應現在會針對該項目回傳 `"display_name": "Kimi K3"`，因此選擇器會列出 **Kimi K3**（標示為 From gateway），而每次請求仍會使用 `kimi-k3-claude-compatible` id。沒有 `display_name` 的模型仍會顯示其 id，而 OpenAI 形式的清單不受影響；其他 harness 中不會出現重複。

### 8. 閘道模型回報的 Context Window {#8-context-window-reported-for-a-gateway-model}

Claude Code 會對它不認得為 Anthropic 模型名稱的模型套用自己的預設 context window，而每個由 gateway 提供的名稱都屬於這種情況。在模型的 `model_info` 下宣告 `max_input_tokens`，會改變 `GET /v1/models`、`/model/info` 以及 LiteLLM UI 所回報的內容，並會驅動 proxy 自身的 [context-window pre-call checks](../proxy/reliability.md#context-window-fallbacks-pre-call-checks--fallbacks)，但不會改變用戶端顯示的數值或用戶端何時進行壓縮。

請在 Claude Code 中使用 `CLAUDE_CODE_AUTO_COMPACT_WINDOW` 設定該部分，或在 `.claude/settings.json` 中使用 `autoCompactWindow`；請參閱 [模型設定](https://code.claude.com/docs/en/model-config)。如果某個模型的實際視窗比用戶端假設的小，這就是值得檢查的情況，因為用戶端會持續填充 context，而提供者接著會拒絕。路由器也有相同的區隔，請參閱 [Auto Router with Claude Code and Claude Desktop](./claude_code_autorouter.md#context-window-shown-in-the-client)。

## 運作方式 {#how-it-works}

LiteLLM 作為統一介面，會：

1. **接收請求**，來自 Claude Code 的 Anthropic Messages API 格式
2. **轉換** 請求為目標提供者的格式（OpenAI、Gemini 等）
3. **轉送** 請求給實際提供者
4. **轉換** 回應回 Anthropic Messages API 格式
5. **回傳** 回應給 Claude Code

這讓您可以使用 Claude Code 的介面搭配 LiteLLM 所支援的任何 LLM 提供者。

## 進階功能 {#advanced-features}

### 負載平衡與備援 {#load-balancing-and-fallbacks}

設定多個部署並自動備援：

```yaml
model_list:
  - model_name: {{openai_large}}  # virtual model name
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  
  - model_name: {{openai_large}}  # same virtual name
    litellm_params:
      model: azure/{{openai_large}}
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

router_settings:
  routing_strategy: simple-shuffle  # Load balance between deployments
  num_retries: 2
  timeout: 30
```

### 用量追蹤與預算 {#usage-tracking-and-budgets}

透過 LiteLLM UI 追蹤用量並設定預算：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: "postgresql://..."  # Enable database for tracking
  store_model_in_db: true
```

使用 UI 啟動 proxy：

```bash
litellm --config /path/to/config.yaml --detailed_debug
```

前往 `http://0.0.0.0:4000/ui` 使用 UI 來：
- 檢視用量分析
- 設定每位使用者／金鑰的預算上限
- 監控跨不同提供者的成本
- 建立具有特定權限的虛擬金鑰

## 支援的提供者 {#supported-providers}

LiteLLM 支援 100+ 個提供者。以下是一些可與 Claude Code 搭配使用的熱門選項：

- **OpenAI**：gpt-5.6-terra、gpt-5.6-luna、o1、o3-mini
- **Google**：Gemini 3.8 Flash、Gemini 3.1 Pro
- **Azure OpenAI**：透過 Azure 使用所有 OpenAI 模型
- **AWS Bedrock**：Llama、Mistral 以及其他模型
- **Vertex AI**：Google Cloud 上的 Gemini、Claude 以及其他模型
- **Groq**：為 Llama 與 Mixtral 提供快速推理
- **Together AI**：Llama、Mixtral 以及其他開源模型
- **Deepseek**：Deepseek-chat、Deepseek-coder

[檢視支援的提供者完整清單 →](https://docs.litellm.ai/docs/providers)
