---
sidebar_label: "GitHub Copilot"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GitHub Copilot {#github-copilot}

本教學說明如何將 GitHub Copilot 與 LiteLLM Proxy 整合，讓您可以透過 LiteLLM 的統一介面路由請求。

:::info 

本教學以 [Sergio Pino 的優秀指南](https://dev.to/spino327/calling-github-copilot-models-from-openhands-using-litellm-proxy-1hl4) 為基礎，內容是透過 LiteLLM Proxy 呼叫 GitHub Copilot 模型。此整合可讓您透過 GitHub Copilot 的介面使用任何 LiteLLM 支援的模型。

:::

## 使用 GitHub Copilot 搭配 LiteLLM 的好處 {#benefits-of-using-github-copilot-with-litellm}

當您使用 GitHub Copilot 與 LiteLLM 時，您將獲得以下好處：

**開發者好處：**
- 通用模型存取：透過 GitHub Copilot 介面使用任何 LiteLLM 支援的模型（Anthropic、OpenAI、Vertex AI、Bedrock 等）。
- 更高的速率限制與可靠性：在多個模型與提供者之間進行負載平衡，以避免觸及單一提供者的限制，並透過備援確保即使某個提供者失敗也能取得回應。

**Proxy 管理員好處：**
- 集中式管理：透過單一 LiteLLM proxy 實例控制所有模型的存取，而不必將每個提供者的 API 金鑰交給您的開發者。
- 預算控管：為所有 GitHub Copilot 使用設定支出上限並追蹤成本。

## 先決條件 {#prerequisites}

開始之前，請確認您已具備：
- GitHub Copilot 訂閱（Individual、Business 或 Enterprise）
- 正在執行的 LiteLLM Proxy 實例
- 有效的 LiteLLM Proxy API 金鑰
- 已安裝 GitHub Copilot 擴充功能的 VS Code 或相容 IDE

## 快速入門指南 {#quick-start-guide}

### 步驟 1：安裝 LiteLLM {#step-1-install-litellm}

安裝具備 proxy 支援的 LiteLLM：

```bash
uv tool install litellm[proxy]
```

### 步驟 2：設定 LiteLLM Proxy {#step-2-configure-litellm-proxy}

建立一個 `config.yaml` 檔案，內容為您的模型設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  
  - model_name: claude-3-5-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: sk-1234567890 # Change this to a secure key
```

### 步驟 3：啟動 LiteLLM Proxy {#step-3-start-litellm-proxy}

啟動 proxy 伺服器：

```bash
litellm --config config.yaml --port 4000
```

### 步驟 4：設定 GitHub Copilot {#step-4-configure-github-copilot}

將 GitHub Copilot 設定為使用您的 LiteLLM proxy。將以下內容加入您的 VS Code `settings.json`：

```json
{
  "github.copilot.advanced": {
    "debug.overrideProxyUrl": "http://localhost:4000",
    "debug.testOverrideProxyUrl": "http://localhost:4000"
  }
}
```

### 步驟 5：測試整合 {#step-5-test-the-integration}

重新啟動 VS Code 並測試 GitHub Copilot。您的請求現在將透過 LiteLLM Proxy 路由，讓您使用 LiteLLM 的功能，例如：
- 請求/回應記錄
- 速率限制
- 成本追蹤
- 模型路由與備援

## 進階 {#advanced}

### 在 GitHub Copilot 中使用 Anthropic、OpenAI、Bedrock 等模型 {#use-anthropic-openai-bedrock-etc-models-with-github-copilot}

您可以在 LiteLLM Proxy 設定中設定不同模型，將 GitHub Copilot 的請求路由至任何提供者：

<Tabs>
<TabItem value="anthropic" label="Anthropic">

將請求路由至 Claude Sonnet：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-3-5-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: sk-1234567890
```

</TabItem>
<TabItem value="openai" label="OpenAI">

將請求路由至 GPT-4o：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: sk-1234567890
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

將請求路由至 Bedrock 上的 Claude：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1

general_settings:
  master_key: sk-1234567890
```

</TabItem>
<TabItem value="multi-provider" label="多提供者負載平衡">

所有具有相同 model_name 的部署都會進行負載平衡。在此範例中，我們在 OpenAI 與 Anthropic 之間進行負載平衡：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-4o  # Same model name for load balancing
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  routing_strategy: simple-shuffle

general_settings:
  master_key: sk-1234567890
```

</TabItem>
</Tabs>

使用此設定後，GitHub Copilot 會自動透過 LiteLLM 將請求路由至您設定的提供者，並提供負載平衡與備援。

## 疑難排解 {#troubleshooting}

如果您遇到問題：

1. **GitHub Copilot 未使用 proxy**：確認 proxy URL 已在 VS Code 設定中正確設定，且 LiteLLM proxy 正在執行
2. **驗證錯誤**：確認您的 master key 有效，且提供者的 API 金鑰已正確設定
3. **連線錯誤**：檢查您的 LiteLLM Proxy 是否可透過 `http://localhost:4000` 存取

## 致謝 {#credits}

本教學基於 [Sergio Pino](https://dev.to/spino327) 的原始文章：[使用 LiteLLM Proxy 從 OpenHands 呼叫 GitHub Copilot 模型](https://dev.to/spino327/calling-github-copilot-models-from-openhands-using-litellm-proxy-1hl4)。感謝這項奠基性的工作！
