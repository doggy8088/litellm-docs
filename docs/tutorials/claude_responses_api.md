import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Claude Code 快速入門 {#claude-code-quickstart}

本教學示範如何透過 Claude Code 中的 LiteLLM proxy 呼叫 Claude 模型。

:::info 

本教學以 [Anthropic 的官方 LiteLLM 組態文件](https://code.claude.com/docs/en/llm-gateway#litellm-configuration) 為基礎。此整合可讓您透過 Claude Code 使用任何 LiteLLM 支援的模型，並具備集中式驗證、用量追蹤與成本控制。

:::

<br />

### 影片導覽 {#video-walkthrough}

<iframe width="840" height="500" src="https://www.loom.com/embed/3c17d683cdb74d36a3698763cc558f56" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 先決條件 {#prerequisites}

- 已安裝 [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)
- 您所選提供者的 API 金鑰

## 安裝 {#installation}

首先，安裝支援 proxy 的 LiteLLM：

```bash
uv tool install 'litellm[proxy]'
```

### 1. 設定 config.yaml {#1-setup-configyaml}

使用環境變數建立安全的設定：

```yaml
model_list:
  # Configure the models you want to use
  - model_name: claude-opus-4-7
    litellm_params:
      model: anthropic/claude-opus-4-7
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-sonnet-4-6
    litellm_params:
      model: anthropic/claude-sonnet-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-haiku-4-5-20251001
    litellm_params:
      model: anthropic/claude-haiku-4-5-20251001
      api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

設定您的環境變數：

```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export LITELLM_MASTER_KEY="sk-1234567890"  # Generate a secure key
```

:::tip
或者，您也可以將 `ANTHROPIC_API_KEY` 儲存在 proxy 目錄中的 `.env` 檔案裡。LiteLLM 會在啟動時自動載入。
:::

### 2. 啟動 proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 驗證設定 {#3-verify-setup}

測試您的 proxy 是否正常運作：

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "claude-opus-4-7",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
}'
```

### 4. 設定 Claude Code {#4-configure-claude-code}

#### 靜態 API 金鑰 {#static-api-key}

將固定的 LiteLLM 金鑰設為 `ANTHROPIC_AUTH_TOKEN`：

```bash
export ANTHROPIC_AUTH_TOKEN="$LITELLM_KEY"
```

:::tip
`$LITELLM_KEY` 可以是您的 proxy **master key** 或 **virtual key**。master key 可讓 Claude Code 存取所有 proxy 模型。virtual key 則僅限於該金鑰可存取的模型。
:::

#### 方法 1：統一端點（建議） {#method-1-unified-endpoint-recommended}

將 Claude Code 設定為使用 LiteLLM 的統一端點：

```bash
export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"
```

#### 方法 2：提供者特定的直通端點 {#method-2-provider-specific-pass-through-endpoint}

或者，使用 Anthropic 直通端點：

```bash
export ANTHROPIC_BASE_URL="http://0.0.0.0:4000/anthropic"
```

#### 搭配 helper 的動態 API 金鑰 {#dynamic-api-key-with-helper}

若要輪替金鑰或進行每位使用者驗證，Claude Code 可以執行腳本來擷取金鑰（例如 JWT），而不是使用靜態 `ANTHROPIC_AUTH_TOKEN`。

1. 建立 API 金鑰 helper 腳本：

```bash
#!/bin/bash
# ~/bin/get-litellm-key.sh

# Example: Generate JWT token
jwt encode \
  --secret="${JWT_SECRET}" \
  --exp="+1h" \
  '{"user":"'${USER}'","team":"engineering"}'
```

2. 設定 Claude Code 設定檔以使用 helper：

```json
{
  "apiKeyHelper": "~/bin/get-litellm-key.sh"
}
```

3. 設定 token 重新整理間隔：

```bash
# Refresh every hour (3600000 ms)
export CLAUDE_CODE_API_KEY_HELPER_TTL_MS=3600000
```

此值會以 `Authorization` 與 `X-Api-Key` 標頭傳送。`apiKeyHelper` 的優先順序低於 `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY`。

### 5. 使用 Claude Code {#5-use-claude-code}

以您要使用的模型啟動 Claude Code：

```bash
# Specify model at startup (Opus 4.7 — newest Claude Code model)
claude --model claude-opus-4-7

# Or specify a different model
claude --model claude-sonnet-4-6
claude --model claude-haiku-4-5-20251001

# Or change model during a session
claude
/model claude-opus-4-7
```

或者，使用環境變數設定預設模型：

```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-7
export ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-6
export ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5-20251001
claude
```

### 使用 1M Context Window {#using-1m-context-window}

Claude Code 支援使用 `[1m]` 後綴的延伸上下文（100 萬個 token）：

```bash
# Use Opus 4.7 with 1M context (requires quotes in shell)
claude --model 'claude-opus-4-7[1m]'

# Inside a Claude Code session (no quotes needed)
/model claude-opus-4-7[1m]
```

:::warning
**重要：** 當在 shell 中使用 `--model` 搭配 `[1m]` 時，您必須使用引號，以避免 shell 解讀中括號。
:::

**運作方式：**
- Claude Code 在傳送至 LiteLLM 前會移除 `[1m]` 後綴
- Claude Code 會自動新增標頭 `anthropic-beta: context-1m-2025-08-07`
- 您的 LiteLLM 設定檔 **不應** 在模型名稱中包含 `[1m]`

**驗證 1M context 已啟用：**
```bash
/context
# Should show: 21k/1000k tokens (2%)
```

範例對話：

## 疑難排解 {#troubleshooting}

常見問題與解決方案：

**Claude Code 無法連線：**
- 驗證您的 proxy 是否正在執行：`curl http://0.0.0.0:4000/health`
- 檢查 `ANTHROPIC_BASE_URL` 是否設定正確
- 確保您的 `ANTHROPIC_AUTH_TOKEN` 與您的 LiteLLM master key 相符

**驗證錯誤：**
- 驗證您的環境變數是否已設定：`echo $LITELLM_MASTER_KEY`
- 檢查您的 API 金鑰是否有效且有足夠的額度
- 確保 `ANTHROPIC_AUTH_TOKEN` 與您的 LiteLLM master key 相符

**找不到模型：**
- 確保 Claude Code 中的模型名稱與您的 `config.yaml` 完全一致
- 使用 `--model` 旗標或環境變數指定模型
- 檢查 LiteLLM 記錄以取得詳細錯誤訊息

## 使用 Bedrock/Vertex AI/Azure Foundry 模型 {#using-bedrockvertex-aiazure-foundry-models}

擴充您的設定以支援多個提供者與模型：

:::tip 在接上提供者前先查看即時相容性

Claude Code 功能與各提供者（Anthropic、Bedrock、Vertex AI、Azure）之間的相容性，會隨著 Claude Code 與 LiteLLM 的更新而變動。[Claude Code × LiteLLM 相容性矩陣](https://docs.litellm.ai/docs/claude_code_compatibility) 會以最新穩定版 LiteLLM proxy，每日針對 Haiku 4.5、Sonnet 4.6 與 Opus 4.7 重新產生——請先查看，確認目前哪些 `(feature, provider)` 儲存格是綠色。

:::

<Tabs>
<TabItem value="multi-provider" label="多提供者設定">

```yaml
model_list:
  # Anthropic models
  - model_name: claude-opus-4-7
    litellm_params:
      model: anthropic/claude-opus-4-7
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-sonnet-4-6
    litellm_params:
      model: anthropic/claude-sonnet-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  # AWS Bedrock (Invoke — recommended for Claude Code today, see note below)
  - model_name: claude-bedrock-opus
    litellm_params:
      model: bedrock/invoke/us.anthropic.claude-opus-4-7
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2

  - model_name: claude-bedrock-sonnet
    litellm_params:
      model: bedrock/invoke/us.anthropic.claude-sonnet-4-6
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2

  - model_name: claude-bedrock-haiku
    litellm_params:
      model: bedrock/invoke/us.anthropic.claude-haiku-4-5-20251001-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2

  # Azure Foundry
  - model_name: claude-opus-azure
    litellm_params:
      model: azure_ai/claude-opus-4-7
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE # https://my-resource.services.ai.azure.com/anthropic

  # Google Vertex AI
  - model_name: claude-opus-vertex
    litellm_params:
      model: vertex_ai/claude-opus-4-7
      vertex_ai_project: "my-test-project"
      vertex_ai_location: "us-east5"
      vertex_credentials: os.environ/VERTEX_FILE_PATH_ENV_VAR # os.environ["VERTEX_FILE_PATH_ENV_VAR"] = "/path/to/service_account.json"

litellm_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

在模型之間無縫切換：

```bash
# Use Anthropic API directly (newest Claude Code model)
claude --model claude-opus-4-7

# Use Bedrock deployment (Opus 4.7 via Invoke)
claude --model claude-bedrock-opus

# Use Azure Foundry deployment
claude --model claude-opus-azure

# Use Vertex AI deployment
claude --model claude-opus-vertex
```

</TabItem>
</Tabs>

### Claude Code 的 Bedrock 專用設定 {#bedrock-specific-setup-for-claude-code}

目前有兩個額外步驟可讓 Claude Code 透過 LiteLLM 乾淨地對接 Bedrock。請在以 Bedrock 為後端的模型上啟動 `claude` 之前，先完成這兩步。

:::note 暫時性替代方案

下方的 Invoke 偏好設定與 beta-header 旗標都是暫時性的。LiteLLM 已在閘道內的 Bedrock 之上重新實作了許多 Anthropic API 功能，而且我們也持續在 Converse 路徑上擴充這些涵蓋範圍。不久之後，這些替代方案將不再需要。

:::

#### 1. 優先使用 Bedrock Invoke {#1-prefer-bedrock-invoke}

在上方設定中，Bedrock 模型使用 `bedrock/invoke/<model-id>` 前綴——目前是 Claude Code 流量較順暢的路徑。若您想嘗試 Converse，請將前綴從 `bedrock/invoke/` 改為 `bedrock/converse/`，並在相容性矩陣中檢查您需要的功能。

#### 2. 停用 Claude Code 對 Bedrock 的實驗性 beta 標頭 {#2-disable-claude-codes-experimental-beta-headers-for-bedrock}

Claude Code 會在每個請求附加 Anthropic 實驗性 beta 標頭（例如 `anthropic-beta: prompt-caching-scope-2026-01-05,advanced-tool-use-2025-11-20`）。這些標頭對 Anthropic 第一方 API 運作良好，但 Bedrock 目前不接受所有標頭，可能會回傳 `400 invalid beta flag` 錯誤。請將 **`CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`** 環境變數設為 `1` 以移除這些標頭。

建議將其設定在下列位置的 **Claude Code 全域使用者設定檔**：

```
~/.claude/settings.json
```

（在 macOS / Linux 上是 `/Users/<you>/.claude/settings.json`，在 Windows 上是 `C:\Users\<you>\.claude\settings.json`。所有 Claude Code 用戶端，包括 CLI、VS Code extension、JetBrains plugin 等，都會讀取此檔案。）

**如何編輯：**

1. 在您慣用的編輯器中開啟 `~/.claude/settings.json`。如果尚不存在，請建立它。

   ```bash
   # macOS / Linux - open with your default editor
   ${EDITOR:-nano} ~/.claude/settings.json

   # Or with VS Code
   code ~/.claude/settings.json
   ```

2. 新增（或合併至現有的）`env` 區塊：

   ```json title="~/.claude/settings.json"
   {
     "env": {
       "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
     }
   }
   ```

3. **完全結束並重新開啟 Claude Code**，讓新設定生效。若是 IDE plugin（VS Code、JetBrains），請重新啟動 IDE。

:::tip 替代方案：以專案範圍或 shell 範圍設定

如果您只想針對單一專案停用 beta 標頭，請將相同的 `env` 區塊放入專案根目錄中的 `.claude/settings.json`（已提交）或 `.claude/settings.local.json`（被 gitignore，個人用）中。

CLI 也可以使用 shell 層級的 export（在啟動 `claude` 前先執行 `export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`），但 **不適用** 於 IDE plugin。

:::

<Image img={require('../../img/release_notes/claude_code_demo.png')} style={{ width: '500px', height: 'auto' }} />
