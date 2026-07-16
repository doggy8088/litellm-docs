# Qwen Code CLI {#qwen-code-cli}

本教學示範如何將 Qwen Code CLI 與 LiteLLM Proxy 整合，讓您可以透過 LiteLLM 的統一介面路由請求。

:::info 

此整合自 LiteLLM v1.73.3-nightly 及以上版本開始支援。

:::

<br />

<iframe width="840" height="500" src="https://www.loom.com/embed/d7059b059c0f425fb0b8839418adffd6" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 使用 qwen-code 搭配 LiteLLM 的效益 {#benefits-of-using-qwen-code-with-litellm}

當您使用 qwen-code 搭配 LiteLLM 時，您會獲得以下效益：

**開發者效益：**
- 通用模型存取：透過 qwen-code 介面使用任何 LiteLLM 支援的模型（Anthropic、OpenAI、Vertex AI、Bedrock 等）。
- 更高的速率限制與可靠性：在多個模型與提供者之間進行負載平衡，避免碰到單一提供者的限制，並透過備援確保即使某個提供者失敗也能取得回應。

**Proxy 管理者效益：**
- 集中式管理：透過單一 LiteLLM proxy 執行個體控管所有模型的存取，而不必將各個提供者的 API 金鑰提供給您的開發者。
- 預算控制：在所有 qwen-code 使用情況中設定支出上限並追蹤成本。

## 先決條件 {#prerequisites}

開始之前，請確認您已具備：
- 系統已安裝 Node.js 和 npm
- 正在執行中的 LiteLLM Proxy 執行個體
- 有效的 LiteLLM Proxy API 金鑰
- 已安裝 Git 以便複製儲存庫

## 快速入門指南 {#quick-start-guide}

### 步驟 1：安裝 Qwen Code CLI {#step-1-install-qwen-code-cli}

複製 Qwen Code CLI 儲存庫並切換到專案目錄：

```bash
npm install -g @qwen-code/qwen-code
```

### 步驟 2：為 LiteLLM Proxy 設定 Qwen Code CLI {#step-2-configure-qwen-code-cli-for-litellm-proxy}

透過設定所需的環境變數，將 Qwen Code CLI 指向您的 LiteLLM Proxy 執行個體：

```bash
export OPENAI_BASE_URL="http://localhost:4000"
export OPENAI_API_KEY=sk-1234567890
export OPENAI_MODEL="your-configured-model"
```

**注意：** 請將值替換為您的實際 LiteLLM Proxy 設定：
- `OPENAI_BASE_URL`：LiteLLM Proxy 正在執行的 URL
- `OPENAI_API_KEY`：您的 LiteLLM Proxy API 金鑰
- `OPENAI_MODEL`：您要使用的模型（在您的 LiteLLM proxy 中設定）

### 步驟 3：建置並啟動 Qwen Code CLI {#step-3-build-and-start-qwen-code-cli}

建置專案並啟動 CLI：

```bash
qwen
```

### 步驟 4：測試整合 {#step-4-test-the-integration}

CLI 啟動後，您就可以送出測試請求。這些請求會自動透過 LiteLLM Proxy 路由到已設定的 Qwen 模型。

CLI 現在會使用 LiteLLM Proxy 作為後端，讓您可以使用 LiteLLM 的功能，例如：
- 請求/回應記錄
- 速率限制
- 成本追蹤
- 模型路由與備援

## 進階 {#advanced}

### 在 qwen-code 上使用 Anthropic、OpenAI、Bedrock 等模型 {#use-anthropic-openai-bedrock-etc-models-on-qwen-code}

若要在 qwen-code 上使用非 qwen 模型，您需要在 LiteLLM Proxy 設定中加入一個 `model_group_alias`。這會告訴 LiteLLM，帶有 model = `qwen-code` 的請求應該從任何提供者路由到您想要的模型。

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="anthropic" label="Anthropic">

將 `qwen-code` 請求路由到 Claude Sonnet：

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: claude-sonnet-4-20250514
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  model_group_alias: {"qwen-code": "claude-sonnet-4-20250514"}
```

</TabItem>
<TabItem value="openai" label="OpenAI">

將 `qwen-code` 請求路由到 GPT-4o：

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: gpt-4o-model
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  model_group_alias: {"qwen-code": "gpt-4o-model"}
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

將 `qwen-code` 請求路由到 Bedrock 上的 Claude：

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1

router_settings:
  model_group_alias: {"qwen-code": "bedrock-claude"}
```

</TabItem>
<TabItem value="multi-provider" label="多提供者負載平衡">

所有 model_name=`anthropic-claude` 的部署都會進行負載平衡。在這個範例中，我們在 Anthropic 和 Bedrock 之間進行負載平衡。

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
  model_group_alias: {"qwen-code": "anthropic-claude"}
```

</TabItem>
</Tabs>

有了這個設定，當您在 CLI 中使用 `qwen-code` 時，LiteLLM 會自動將您的請求路由到已設定的提供者，並進行負載平衡與備援。

## 疑難排解 {#troubleshooting}

如果您遇到問題：

1. **連線錯誤**：請確認您的 LiteLLM Proxy 正在執行，且可透過已設定的 `OPENAI_BASE_URL` 存取
2. **驗證錯誤**：請確認您的 `OPENAI_API_KEY` 有效且具備必要權限
3. **建置失敗**：請確認已使用 `npm install` 安裝所有相依套件
