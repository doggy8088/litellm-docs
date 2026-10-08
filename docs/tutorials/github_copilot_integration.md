---
sidebar_label: "GitHub Copilot / VS Code"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GitHub Copilot / VS Code {#github-copilot--vs-code}

本教學示範兩種從 VS Code 的聊天中使用 LiteLLM Proxy 的方式。[LiteLLM 擴充功能](#option-1-litellm-extension-for-vs-code) 會將您的閘道加入為語言模型提供者，因此聊天模型選擇器會列出您的金鑰可存取的模型，並顯示每個模型的價格與推理努力控制。[Copilot proxy override](#option-2-route-github-copilot-through-litellm) 則是將 GitHub Copilot 本身的流量指向該 proxy。

:::info

proxy override 章節是根據 [Sergio Pino 的指南](https://dev.to/spino327/calling-github-copilot-models-from-openhands-using-litellm-proxy-1hl4)，說明如何透過 LiteLLM Proxy 呼叫 GitHub Copilot 模型。

:::

## 使用 VS Code 聊天搭配 LiteLLM 的優點 {#benefits-of-using-vs-code-chat-with-litellm}

當您使用 VS Code 聊天搭配 LiteLLM 時，可獲得以下優點：

**開發者優點：**
- 通用模型存取：從 VS Code 聊天模型選擇器使用任何 LiteLLM 支援的模型（Anthropic、OpenAI、Vertex AI、Bedrock 等）。
- 更高的速率限制與可靠性：在多個模型與提供者之間進行負載平衡，以避免碰到單一提供者限制，並透過備援確保即使某個提供者失敗時仍能取得回應。

**Proxy 管理員優點：**
- 集中管理：透過單一 LiteLLM proxy 實例控制所有模型的存取，不必把各個提供者的 API 金鑰交給您的開發者。
- 預算控制：設定支出上限並追蹤所有 VS Code 使用情況的成本。

## 先決條件 {#prerequisites}

開始之前，請確認您已具備：
- 一個正在執行的 LiteLLM Proxy 實例
- 一個 LiteLLM Proxy API 金鑰，或是在使用者透過 SSO 登入的 gateway 上，使用 [`lite` CLI](#sign-in-with-sso-instead-of-a-virtual-key)
- VS Code 1.115 或更新版本，並安裝 GitHub Copilot Chat 擴充功能（聊天檢視與模型選擇器即來自此擴充功能）

## 選項 1：適用 VS Code 的 LiteLLM 擴充功能 {#option-1-litellm-extension-for-vs-code}

此擴充功能位於 LiteLLM 儲存庫中的 [`vscode-extension/`](https://github.com/BerriAI/litellm/tree/main/vscode-extension)。它會讀取您所設定金鑰的 gateway `GET /model_group/info`，因此選擇器會顯示該金鑰可使用的確切聊天模型，每個模型都會顯示其每 100 萬 token 的輸入與輸出價格。gateway 項目列出 `supported_reasoning_efforts` 的模型，會在模型選擇器中提供 Reasoning Effort 選項，而您選擇的 effort 會在對該模型的每次請求中以 `reasoning_effort` 傳送。請求會以串流聊天完成傳送至 `POST /v1/chat/completions`，並透過工具與圖片，因此路由、備援、防護欄與支出追蹤都會如常套用。

### 步驟 1：建置並安裝擴充功能 {#step-1-build-and-install-the-extension}

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm/vscode-extension
npm ci
npm run package
code --install-extension litellm-vscode-0.1.0.vsix
```

每次推送到 `main` 且有觸及此擴充功能時，也會在 [VS Code 擴充功能工作流程](https://github.com/BerriAI/litellm/actions/workflows/test-vscode-extension.yml) 上建置一個 `litellm-vscode` 成品，您可以用相同方式下載並安裝。

### 步驟 2：連線到您的 gateway {#step-2-connect-to-your-gateway}

1. 從命令面板執行 `Chat: Manage Language Models`，然後選取 `LiteLLM`
2. 輸入此連線的名稱、gateway URL（例如 `https://litellm.example.com`），以及一個 LiteLLM API 金鑰：虛擬金鑰，或是在 SSO gateway 上由 `lite auth print-token` 的輸出（請參閱[下一節](#sign-in-with-sso-instead-of-a-virtual-key)）。該金鑰會儲存在 VS Code 的秘密儲存中

Language Models 編輯器現在會在您選擇的名稱下列出該金鑰可存取的聊天模型。再次新增 `LiteLLM` 並使用另一個名稱，即可連線到第二個 gateway 或第二把金鑰。

### 改用 SSO 登入，而非虛擬金鑰 {#sign-in-with-sso-instead-of-a-virtual-key}

如果您的使用者透過身分識別提供者登入 LiteLLM，且沒有人發放虛擬金鑰給他們，那麼每位開發者改為從 LiteLLM CLI 取得擴充功能的金鑰。這需要已設定 SSO 且 `EXPERIMENTAL_UI_LOGIN=True` 的 proxy，如 [CLI Authentication](../proxy/cli_sso.md) 所述。下面的選項 2 不會在用戶端上設定任何 LiteLLM 憑證，因此請在僅限 SSO 的 gateway 上使用此選項

```shell
export LITELLM_PROXY_URL=https://litellm.example.com
lite login --pkce
lite auth print-token
```

`lite login --pkce` 會在您的瀏覽器中開啟身分識別提供者的登入頁面，接著開啟 LiteLLM 同意頁面，您可在其中選擇要將請求歸屬到的團隊，然後按一下 Approve。`lite auth print-token` 會印出結果金鑰，其開頭為 `litellm_login_`；請將其貼上為步驟 2 中的 API 金鑰。之後選擇器會列出該使用者與團隊可存取的聊天模型，而支出則會記錄到已登入的使用者

該金鑰會在 `LITELLM_CLI_JWT_EXPIRATION_HOURS`（預設 24 小時）後過期，而擴充功能會保留您貼上的金鑰且不會更新它。當請求開始因驗證錯誤而失敗時，請再次執行 `lite auth print-token`，它會在不進行瀏覽器登入的情況下更新金鑰，然後透過連線列上的齒輪與 `Update API Key` 貼上新值。如果它印出 `Key expired. Run 'lite login --pkce' again.`，請先再次登入。若要降低發生頻率，請在 proxy 上提高 `LITELLM_CLI_JWT_EXPIRATION_HOURS`

### 步驟 3：選擇模型及其推理努力 {#step-3-pick-a-model-and-its-reasoning-effort}

開啟聊天檢視並按一下工具列中的模型名稱。gateway 的模型會列出其每 100 萬 token 的價格，而將游標懸停在某個模型上會顯示其上下文限制以及它支援的推理努力。選擇支援推理努力的模型後，模型選擇器會顯示一個 Reasoning Effort 選項，其選項為 gateway 對該模型回報的努力，加上 `Gateway default`，後者不會傳送 `reasoning_effort`，並讓 proxy 自身的預設值生效。

### 保持清單為最新 {#keeping-the-list-current}

當 gateway 的模型清單或定價變更後，請執行 `LiteLLM: Refresh Models`。若要輪替某個連線的金鑰，請在 Language Models 編輯器中使用其列上的齒輪，然後選取 `Update API Key`；`Delete` 會移除該連線，而 `Open in Language Models (JSON)` 會開啟項目以變更其 URL。如果儲存的金鑰遺失，編輯器會在該連線上顯示一列 `missing its API key`，直到您更新金鑰為止。

## 選項 2：透過 LiteLLM 路由 GitHub Copilot {#option-2-route-github-copilot-through-litellm}

此路由會保留 GitHub Copilot 自己的模型選擇器，並改將 Copilot 的流量經由 proxy 傳送。除了上述必要條件外，還需要 GitHub Copilot 訂閱（Individual、Business 或 Enterprise）。

### 步驟 1：安裝 LiteLLM {#step-1-install-litellm}

安裝具備 proxy 支援的 LiteLLM：

```bash
uv tool install litellm[proxy]
```

### 步驟 2：設定 LiteLLM Proxy {#step-2-configure-litellm-proxy}

建立一個 `config.yaml` 檔案，內容為您的模型設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
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

### 從 VS Code 使用 Anthropic、OpenAI、Bedrock 等模型 {#use-anthropic-openai-bedrock-etc-models-from-vs-code}

這兩個選項都會路由到 proxy 組態所列的內容，因此您可以透過在 LiteLLM Proxy 組態中設定不同模型來存取任何提供者：

<Tabs>
<TabItem value="anthropic" label="Anthropic">

將請求路由至 Claude Sonnet：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

</TabItem>
<TabItem value="openai" label="OpenAI">

將請求路由至 `{{openai_large}}`：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

將請求路由至 Bedrock 上的 Claude：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: bedrock-claude
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

</TabItem>
<TabItem value="multi-provider" label="多提供者負載平衡">

所有具有相同 model_name 的部署都會進行負載平衡。在此範例中，我們在 OpenAI 與 Anthropic 之間進行負載平衡：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: {{openai_large}}  # Same model name for load balancing
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  routing_strategy: simple-shuffle

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

</TabItem>
</Tabs>

在此設定下，VS Code 聊天請求會透過 LiteLLM 路由到您設定的提供者，並具備負載平衡與備援。

## 疑難排解 {#troubleshooting}

如果您遇到問題：

1. **選擇器中沒有 LiteLLM 模型**：選擇器只會列出模式為 `chat` 且已設定金鑰可存取的模型群組；請用該金鑰檢查 `GET /model_group/info`，然後執行 `LiteLLM: Refresh Models`。Restricted Mode 中的視窗會顯示「Models unavailable」，直到您信任工作區為止
2. **Language Models 編輯器中的 `missing its API key` 列**：儲存的金鑰已遺失；請使用連線列上的齒輪並選取 `Update API Key`
3. **GitHub Copilot 未使用 proxy**：請確認已在 VS Code 設定中正確設定 proxy URL，且 LiteLLM proxy 正在執行
4. **驗證錯誤**：請確認您的主金鑰有效，且提供者的 API 金鑰已正確設定
5. **連線錯誤**：請檢查您的 LiteLLM Proxy 是否可透過 `http://localhost:4000` 存取

## 致謝 {#credits}

proxy override 路由是基於 [Sergio Pino](https://dev.to/spino327) 的原始文章：[透過 LiteLLM Proxy 從 OpenHands 呼叫 GitHub Copilot 模型](https://dev.to/spino327/calling-github-copilot-models-from-openhands-using-litellm-proxy-1hl4)。感謝這項基礎工作！
