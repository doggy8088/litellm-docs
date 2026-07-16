# Gemini CLI {#gemini-cli}

本教學說明如何將 Gemini CLI 與 LiteLLM Proxy 整合，讓您能透過 LiteLLM 的統一介面路由請求。

:::info 

此整合自 LiteLLM v1.73.3-nightly 起支援。

:::

<br />

<iframe width="840" height="500" src="https://www.loom.com/embed/d5dadd811ae64c70b29a16ecd558d4ba" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 使用 gemini-cli 搭配 LiteLLM 的好處 {#benefits-of-using-gemini-cli-with-litellm}

當您將 gemini-cli 與 LiteLLM 一起使用時，會獲得以下好處：

**開發人員好處：**
- 通用模型存取：透過 gemini-cli 介面使用任何 LiteLLM 支援的模型（Anthropic、OpenAI、Vertex AI、Bedrock 等）。
- 更高的速率限制與可靠性：在多個模型與提供者之間進行負載平衡，以避免觸及單一提供者的限制，並透過備援確保即使某個提供者失敗，您仍能取得回應。

**Proxy 管理者好處：**
- 集中化管理：透過單一 LiteLLM proxy 執行個體控制所有模型的存取，而不必把各個提供者的 API 金鑰交給您的開發人員。
- 預算控制：設定支出上限並追蹤所有 gemini-cli 使用量的成本。

## 先決條件 {#prerequisites}

開始之前，請確認您已具備：
- 已在系統上安裝 Node.js 與 npm
- 正在執行的 LiteLLM Proxy 執行個體
- 有效的 LiteLLM Proxy API 金鑰
- 已安裝 Git 以複製此儲存庫

## 快速開始指南 {#quick-start-guide}

### 步驟 1：安裝 Gemini CLI {#step-1-install-gemini-cli}

複製 Gemini CLI 儲存庫並進入專案目錄：

```bash
npm install -g @google/gemini-cli
```

### 步驟 2：為 LiteLLM Proxy 設定 Gemini CLI {#step-2-configure-gemini-cli-for-litellm-proxy}

透過設定所需的環境變數，將 Gemini CLI 指向您的 LiteLLM Proxy 執行個體：

```bash
export GOOGLE_GEMINI_BASE_URL="http://localhost:4000"
export GEMINI_API_KEY=sk-1234567890
```

**注意：** 請將值替換為您實際的 LiteLLM Proxy 設定：
- `BASE_URL`：您的 LiteLLM Proxy 執行中的 URL
- `GEMINI_API_KEY`：您的 LiteLLM Proxy API 金鑰

### 步驟 3：建置並啟動 Gemini CLI {#step-3-build-and-start-gemini-cli}

建置專案並啟動 CLI：

```bash
gemini
```

### 步驟 4：測試整合 {#step-4-test-the-integration}

CLI 執行後，您可以送出測試請求。這些請求會自動透過 LiteLLM Proxy 路由到已設定的 Gemini 模型。

現在 CLI 會將 LiteLLM Proxy 當作後端，讓您可使用 LiteLLM 的功能，例如：
- 請求/回應記錄
- 速率限制
- 成本追蹤
- 模型路由與備援

## 進階 {#advanced}

### 在 gemini-cli 上使用 Anthropic、OpenAI、Bedrock 等模型 {#use-anthropic-openai-bedrock-etc-models-on-gemini-cli}

若要在 gemini-cli 上使用非 gemini 模型，您需要在 LiteLLM Proxy 設定中設定一個 `model_group_alias`。這會告訴 LiteLLM，model = `gemini-2.5-pro` 的請求應由任何提供者路由至您想要的模型。

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="anthropic" label="Anthropic">

將 `gemini-2.5-pro` 請求路由到 Claude Sonnet：

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: claude-sonnet-4-20250514
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  model_group_alias: {"gemini-2.5-pro": "claude-sonnet-4-20250514"}
```

</TabItem>
<TabItem value="openai" label="OpenAI">

將 `gemini-2.5-pro` 請求路由到 GPT-4o：

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: gpt-4o-model
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  model_group_alias: {"gemini-2.5-pro": "gpt-4o-model"}
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

將 `gemini-2.5-pro` 請求路由到 Bedrock 上的 Claude：

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1

router_settings:
  model_group_alias: {"gemini-2.5-pro": "bedrock-claude"}
```

</TabItem>
<TabItem value="multi-provider" label="多提供者負載平衡">

所有 model_name=`anthropic-claude` 的部署都會進行負載平衡。在此範例中，我們在 Anthropic 與 Bedrock 之間進行負載平衡。

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY  
  - model_name: anthropic-claude
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1

router_settings:
  model_group_alias: {"gemini-2.5-pro": "anthropic-claude"}
```

</TabItem>
</Tabs>

使用此設定後，當您在 CLI 中使用 `gemini-2.5-pro` 時，LiteLLM 會自動透過負載平衡與備援，將您的請求路由到已設定的提供者。

## 疑難排解 {#troubleshooting}

如果您遇到問題：

1. **連線錯誤**：確認您的 LiteLLM Proxy 正在執行，且可透過已設定的 `GOOGLE_GEMINI_BASE_URL` 存取
2. **驗證錯誤**：確保您的 `GEMINI_API_KEY` 有效且具有必要的權限
3. **建置失敗**：請確認已使用 `npm install` 安裝所有相依套件
