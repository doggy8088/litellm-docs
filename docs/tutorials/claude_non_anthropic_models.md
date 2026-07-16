import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 搭配非 Anthropic 模型使用 Claude Code {#use-claude-code-with-non-anthropic-models}

本教學說明如何透過 LiteLLM proxy，將 Claude Code 搭配 OpenAI、Gemini 及其他 LLM 提供者等非 Anthropic 模型使用。

:::info 

LiteLLM 會自動在不同提供者格式之間進行轉換，讓您在維持 Anthropic Messages API 格式的同時，使用 Claude Code 搭配任何受支援的 LLM 提供者。

:::

## 必要條件 {#prerequisites}

- 已安裝 [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)
- 您所選提供者（OpenAI、Vertex AI 等）的 API 金鑰

## 安裝 {#installation}

首先，安裝具備 proxy 支援的 LiteLLM：

```bash
uv tool install 'litellm[proxy]'
```

## 設定 {#configuration}

### 1. 設定 config.yaml {#1-setup-configyaml}

建立一個設定檔，內容為您偏好的非 Anthropic 模型：

<Tabs>
<TabItem value="openai" label="OpenAI">

```yaml
model_list:
  # OpenAI GPT-4o
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  
  # OpenAI GPT-4o-mini
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
```

設定您的環境變數：

```bash
export OPENAI_API_KEY="your-openai-api-key"
export LITELLM_MASTER_KEY="sk-1234567890"  # Generate a secure key
```

</TabItem>
<TabItem value="gemini" label="Google AI Studio">

```yaml
model_list:
  # Google Gemini
  - model_name: gemini-3.0-flash-exp
    litellm_params:
      model: gemini/gemini-3.0-flash-exp
      api_key: os.environ/GEMINI_API_KEY
```

設定您的環境變數：

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export LITELLM_MASTER_KEY="sk-1234567890"  # Generate a secure key
```

</TabItem>
<TabItem value="vertex_ai" label="Vertex AI">

```yaml
model_list:
  # Google Gemini
  - model_name: vertex-gemini-3-flash-preview
    litellm_params:
      model: vertex_ai/gemini-3-flash-preview
      vertex_credentials: os.environ/VERTEX_FILE_PATH_ENV_VAR # os.environ["VERTEX_FILE_PATH_ENV_VAR"] = "/path/to/service_account.json" 
      vertex_project: "my-test-project"
      vertex_location: "us-east-1"

  # Anthropic Claude
  - model_name: anthropic-vertex
    litellm_params:
      model: vertex_ai/claude-3-sonnet@20240229
      vertex_ai_project: "my-test-project"
      vertex_ai_location: "us-east-1"
      vertex_credentials: os.environ/VERTEX_FILE_PATH_ENV_VAR # os.environ["VERTEX_FILE_PATH_ENV_VAR"] = "/path/to/service_account.json" 
```

設定您的環境變數：

```bash
export VERTEX_FILE_PATH_ENV_VAR="/path/to/service_account.json"
export LITELLM_MASTER_KEY="sk-1234567890"  
```

</TabItem>
<TabItem value="multi" label="Azure OpenAI">

```yaml
model_list:
  # Azure OpenAI
  - model_name: azure-gpt-4
    litellm_params:
      model: azure/gpt-4
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      api_version: "2024-02-01"
```

設定您的環境變數：

```bash
export AZURE_API_KEY="your-azure-api-key"
export AZURE_API_BASE="https://your-resource.openai.azure.com"
export LITELLM_MASTER_KEY="sk-1234567890"
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
    "model": "gpt-4o",
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
    "model": "gemini-3.0-flash-exp",
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
    "model": "gemini-3.0-flash-exp",
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
    "model": "azure-gpt-4",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
}'
```

</TabItem>
</Tabs>

### 4. 設定 Claude Code {#4-configure-claude-code}

設定 Claude Code 使用您的 LiteLLM proxy：

```bash
export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"
export ANTHROPIC_AUTH_TOKEN="$LITELLM_MASTER_KEY"
```

:::tip
`LITELLM_MASTER_KEY` 讓 Claude Code 可存取所有 proxy 模型。您也可以在 LiteLLM UI 中建立虛擬金鑰，以限制對特定模型的存取。
:::

### 5. 搭配非 Anthropic 模型使用 Claude Code {#5-use-claude-code-with-non-anthropic-models}

啟動 Claude Code 並指定要使用的模型：

```bash
# Use OpenAI GPT-4o
claude --model gpt-4o

# Use OpenAI GPT-4o-mini for faster responses
claude --model gpt-4o-mini

# Use Google Gemini
claude --model gemini-3.0-flash-exp

# Use Vertex AI Gemini
claude --model vertex-gemini-3-flash-preview

# Use Vertex AI Anthropic Claude
claude --model anthropic-vertex

# Use Azure OpenAI
claude --model azure-gpt-4
```

### 6. 透過 `/model` 在執行時切換模型 {#6-switch-models-at-runtime-with-model}

當 Claude Code 執行中時，您可以使用內建的 `/model` 指令，在 LiteLLM proxy 透過公開的任何模型之間切換。預設情況下，選擇器只會顯示 Anthropic 的硬編碼模型，因此若要用 LiteLLM proxy 的模型填入，您必須選擇加入 **gateway model discovery**。

在啟動 Claude Code 前，設定以下環境變數：

```bash
export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
```

啟動時，Claude Code 會對您的 `ANTHROPIC_BASE_URL`（您的 LiteLLM proxy）呼叫 `GET /v1/models`，並將每個回傳的模型加入 `/model` 選擇器，標示為 **From gateway**。在 Claude Code 內執行：

```
/model
```

然後選取任何由 LiteLLM 管理的模型（`gpt-4o`、`gemini-3.0-flash-exp`、`anthropic-vertex` 等），即可在不重新啟動工作階段的情況下切換。

:::info Requirements

- Claude Code **v2.1.129** 或更新版本。
- `ANTHROPIC_BASE_URL` 必須指向一個提供 Anthropic Messages API 格式的 gateway——LiteLLM 會在 `/v1/messages` 上完成此事。
- 探索功能採選擇加入。若沒有 `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`，Claude Code 將不會查詢您 proxy 的 `/v1/models`。

:::

:::tip 僅顯示特定模型

如果您只希望部分 LiteLLM 模型顯示在 `/model` 選擇器中，請發出一個範圍限定於這些模型的 [虛擬金鑰](../proxy/virtual_keys)，並將該金鑰作為 `ANTHROPIC_AUTH_TOKEN` 使用。`/v1/models` 只會回傳該金鑰可存取的模型。

您也可以透過 `ANTHROPIC_CUSTOM_MODEL_OPTION` 手動新增個別模型項目，而不啟用探索，或同時這麼做。

:::

## 運作方式 {#how-it-works}

LiteLLM 作為統一介面，其功能如下：

1. **接收請求**：來自 Claude Code，格式為 Anthropic Messages API
2. **轉換**：將請求轉為目標提供者的格式（OpenAI、Gemini 等）
3. **轉送**：將請求傳送給實際的提供者
4. **轉換**：將回應轉回 Anthropic Messages API 格式
5. **回傳**：將回應傳回 Claude Code

如此一來，您就能以 Claude Code 的介面搭配 LiteLLM 支援的任何 LLM 提供者。

## 進階功能 {#advanced-features}

### 負載平衡與備援 {#load-balancing-and-fallbacks}

設定多個部署並自動備援：

```yaml
model_list:
  - model_name: gpt-4o  # virtual model name
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  
  - model_name: gpt-4o  # same virtual name
    litellm_params:
      model: azure/gpt-4o
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

router_settings:
  routing_strategy: simple-shuffle  # Load balance between deployments
  num_retries: 2
  timeout: 30
```

### 使用量追蹤與預算 {#usage-tracking-and-budgets}

透過 LiteLLM UI 追蹤使用量並設定預算：

```yaml
litellm_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: "postgresql://..."  # Enable database for tracking
  
general_settings:
  store_model_in_db: true
```

使用以下方式啟動 proxy 與 UI：

```bash
litellm --config /path/to/config.yaml --detailed_debug
```

前往 `http://0.0.0.0:4000/ui` 的 UI 以：
- 檢視使用量分析
- 設定每位使用者／金鑰的預算上限
- 監控跨不同提供者的成本
- 建立具有特定權限的虛擬金鑰

## 支援的提供者 {#supported-providers}

LiteLLM 支援 100+ 個提供者。以下列出幾個適合搭配 Claude Code 使用的熱門選項：

- **OpenAI**：GPT-4o、GPT-4o-mini、o1、o3-mini
- **Google**：Gemini 2.0 Flash、Gemini 1.5 Pro/Flash
- **Azure OpenAI**：透過 Azure 使用所有 OpenAI 模型
- **AWS Bedrock**：Llama、Mistral 及其他模型
- **Vertex AI**：Google Cloud 上的 Gemini、Claude 及其他模型
- **Groq**：Llama 與 Mixtral 的快速推論
- **Together AI**：Llama、Mixtral 及其他開源模型
- **Deepseek**：Deepseek-chat、Deepseek-coder

[檢視完整支援提供者清單 →](https://docs.litellm.ai/docs/providers)
