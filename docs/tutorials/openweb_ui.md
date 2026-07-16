import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Open WebUI {#open-webui}

本指南將帶您了解如何將 Open WebUI 連接到 LiteLLM。將 LiteLLM 與 Open WebUI 搭配使用可讓團隊
- 在 Open WebUI 上存取 100+ 個 LLM
- 追蹤支出 / 用量，設定預算上限
- 將請求/回應記錄傳送到記錄目的地，例如 langfuse、s3、gcs buckets 等
- 設定存取控制，例如控制 Open WebUI 可存取哪些模型。

## 快速開始 {#quickstart}

- 請先使用 [LiteLLM 入門指南](https://docs.litellm.ai/docs/proxy/docker_quick_start) 完成 LiteLLM 設定

## 1. 啟動 LiteLLM 與 Open WebUI {#1-start-litellm--open-webui}

- Open WebUI 會在 [http://localhost:3000](http://localhost:3000) 上執行
- LiteLLM 會在 [http://localhost:4000](http://localhost:4000) 上執行

## 2. 在 LiteLLM 上建立虛擬金鑰 {#2-create-a-virtual-key-on-litellm}

虛擬金鑰是可讓您向 LiteLLM Proxy 驗證身分的 API 金鑰。我們將建立一個可讓 Open WebUI 存取 LiteLLM 的虛擬金鑰。

### 2.1 LiteLLM 使用者管理階層 {#21-litellm-user-management-hierarchy}

在 LiteLLM 上，您可以建立組織、團隊、使用者和虛擬金鑰。對於本教學，我們將建立一個團隊和一個虛擬金鑰。

- `Organization` - 組織是團隊的群組。（US Engineering、EU Developer Tools）
- `Team` - 團隊是使用者的群組。（Open WebUI Team、Data Science Team 等）
- `User` - 使用者是單一使用者（員工、開發人員，例如 `krrish@litellm.ai`）
- `Virtual Key` - 虛擬金鑰是可讓您向 LiteLLM Proxy 驗證身分的 API 金鑰。虛擬金鑰會與使用者或團隊相關聯。

團隊建立完成後，您可以邀請使用者加入團隊。您可在 [這裡](https://docs.litellm.ai/docs/proxy/user_management_heirarchy) 進一步了解 LiteLLM 的使用者管理。

### 2.2 在 LiteLLM 上建立團隊 {#22-create-a-team-on-litellm}

前往 [http://localhost:4000/ui](http://localhost:4000/ui) 並建立新團隊。

<Image img={require('../../img/litellm_create_team.gif')} />

### 2.2 在 LiteLLM 上建立虛擬金鑰 {#22-create-a-virtual-key-on-litellm}

前往 [http://localhost:4000/ui](http://localhost:4000/ui) 並建立新的虛擬金鑰。 

LiteLLM 可讓您指定 Open WebUI 上可用的模型（透過指定此金鑰可存取的模型）。

<Image img={require('../../img/create_key_in_team_oweb.gif')} />

## 3. 將 Open WebUI 連接到 LiteLLM {#3-connect-open-webui-to-litellm}

在 Open WebUI 上，前往 Settings -> Connections，並建立新的 LiteLLM 連線

輸入以下詳細資料：
- URL: `http://localhost:4000`（您的 litellm proxy base url）
- Key: `your-virtual-key`（您在前一步驟建立的金鑰）

<Image img={require('../../img/litellm_setup_openweb.gif')} />

### 3.1 測試請求 {#31-test-request}

在左上角選擇模型，您應該只會看到在步驟 2 中授與此金鑰存取權的模型。

選取模型後，輸入訊息內容並點選 `Submit`

<Image img={require('../../img/basic_litellm.gif')} />

### 3.2 追蹤用量與支出 {#32-tracking-usage--spend}

#### 基本追蹤 {#basic-tracking}

在送出請求後，前往 LiteLLM UI 中的 `Logs` 區段，以查看模型、用量和成本資訊。

#### 依使用者追蹤 {#per-user-tracking}

若要追蹤每位 Open WebUI 使用者的支出與用量，請同時設定 Open WebUI 與 LiteLLM：

1. **在 Open WebUI 中啟用使用者資訊標頭**
   
  設定以下環境變數以在 Open WebUI 中啟用請求標頭內的使用者資訊：
  ```dotenv
  ENABLE_FORWARD_USER_INFO_HEADERS=True
  ```

  如需更多詳細資料，請參閱 [環境變數設定指南](https://docs.openwebui.com/getting-started/env-configuration/#enable_forward_user_info_headers)。

2. **設定 LiteLLM 解析使用者標頭**
   
  將以下內容加入您的 LiteLLM `config.yaml`，以指定用於使用者追蹤的請求標頭對應：

  ```yaml
  general_settings:
    user_header_mappings:
      - header_name: X-OpenWebUI-User-Id
        litellm_user_role: internal_user
      - header_name: X-OpenWebUI-User-Email
        litellm_user_role: customer
  ```

  ⓘ 可用的追蹤選項

  您可以在 `header_name` 中使用以下任一標頭，於 `user_header_mappings`：
  - `X-OpenWebUI-User-Id`
  - `X-OpenWebUI-User-Email`
  - `X-OpenWebUI-User-Name`
  
  若為您熟悉的小型使用者群託管，這些可能提供更好的可讀性，也更容易在心中歸因。

  請依需求選擇，但請注意在 Open WebUI 中：
  - 使用者可以修改自己的使用者名稱
  - 管理員可以修改任何帳戶的使用者名稱與電子郵件

這段影片示範如何將 openweb ui 標頭對應到 LiteLLM 使用者角色

<iframe src="https://www.loom.com/embed/a1b6a4635fc0478ba4fd34cae16e2ffd?sid=791c2dcc-7e65-45be-bf7f-27d2601c123e" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen width="840" height="500"></iframe>

<br/>
<br/>

## 在 Open WebUI 上呈現 `thinking` 內容 {#render-thinking-content-on-open-webui}

Open WebUI 需要將 reasoning/thinking 內容以 `<think></think>` 標籤呈現。若要為特定模型呈現此內容，您可以使用 `merge_reasoning_content_in_choices` litellm 參數。

範例 litellm config.yaml：

```yaml
model_list:
  - model_name: thinking-anthropic-claude-3-7-sonnet # Bedrock Anthropic
    litellm_params:
      model: bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0
      thinking: {"type": "enabled", "budget_tokens": 1024}
      max_tokens: 1080
      merge_reasoning_content_in_choices: true
  - model_name: vertex_ai/gemini-2.5-pro # Vertex AI Gemini
    litellm_params:
      model: vertex_ai/gemini-2.5-pro
      thinking: {"type": "enabled", "budget_tokens": 1024}
      merge_reasoning_content_in_choices: true
```

### 在 Open WebUI 上測試 {#test-it-on-open-webui}

在模型下拉選單中選擇 `thinking-anthropic-claude-3-7-sonnet`

<Image img={require('../../img/litellm_thinking_openweb.gif')} />

## 其他資源 {#additional-resources}

- 在 Windows 本機上執行 LiteLLM 和 Open WebUI：完整指南 [https://www.tanyongsheng.com/note/running-litellm-and-openwebui-on-windows-localhost-a-comprehensive-guide/](https://www.tanyongsheng.com/note/running-litellm-and-openwebui-on-windows-localhost-a-comprehensive-guide/)
- [根據 User-Agent 標頭執行 Guardrails](../proxy/guardrails/quick_start#-tag-based-guardrail-modes)

## 新增自訂標頭以進行支出追蹤 {#add-custom-headers-to-spend-tracking}

您可以將自訂標頭加入請求中，以追蹤支出與用量。

```yaml
litellm_settings:
  extra_spend_tag_headers:
    - "x-custom-header"
```

您可以將自訂標頭加入請求中，以追蹤支出與用量。

<Image img={require('../../img/custom_tag_headers.png')} />
