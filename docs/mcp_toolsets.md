import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MCP 工具集 {#mcp-toolsets}

如需直接用戶端 URL 與 LLM 工具選擇器，請參閱 [MCP 組態參考](./mcp_config_reference#endpoint-matrix)

**Toolset** 是由一或多個 MCP 伺服器中的特定工具所組成的具名集合。您不必讓代理程式存取每個伺服器上的所有工具，而是可以精確選取它實際需要的工具，無論這些工具位於哪個伺服器，並將它們捆綁在單一名稱下。

## 運作方式 {#how-it-works}

```
                    ┌─────────────────────────────────┐
                    │         MCP Toolset              │
                    │      "devtooling-prod"           │
                    └────────────┬────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
     ┌────────▼────────┐                  ┌────────▼────────┐
     │  CircleCI MCP   │                  │  DeepWiki MCP   │
     │  (10+ tools)    │                  │  (3 tools)      │
     └────────┬────────┘                  └────────┬────────┘
              │                                    │
    ┌─────────┴──────────┐              ┌──────────┴──────────┐
    │ ✓ get_build_logs   │              │ ✓ read_wiki_structure│
    │ ✓ find_flaky_tests │              │ ✓ read_wiki_contents │
    │ ✓ get_pipeline_    │              │ ✗ ask_question       │
    │   status           │              └─────────────────────┘
    │ ✓ run_pipeline     │
    │ ✗ list_followed_   │
    │   projects         │
    └────────────────────┘

        Agent sees exactly 6 tools, nothing more.
```

原本跨兩個伺服器有 13+ 個工具，代理程式只會取得 6 個：也就是它實際需要的那些。

**這為何重要：**
- 較短的工具清單 → 更少 token、更快的回應、更少幻覺
- 將 GitHub + Linear + CircleCI 的工具組合成一個具名授權
- 以相同方式指派給金鑰和團隊，就像您今天指派 MCP 伺服器一樣

---

## 建立工具集 {#create-a-toolset}

### 1. 前往 MCP 頁面 {#1-go-to-the-mcp-page}

在左側側邊欄中導覽至 **MCP**。

![導覽至 MCP](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/1a96c713-6a37-4f96-92f1-07bd58c1973c/ascreenshot_23515f386ccc4597b0633987667fe01f_text_export.jpeg)

### 2. 開啟 Toolsets 分頁 {#2-open-the-toolsets-tab}

在 MCP 頁面上點擊 **Toolsets** 分頁。

![點擊 Toolsets 分頁](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/65b6986b-595a-4b28-8fdc-a7b36bc76e59/ascreenshot_ca70c18fe7ec415486f96a6b405bf550_text_export.jpeg)

### 3. 點擊 "New Toolset" {#3-click-new-toolset}

![New Toolset 按鈕](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/798c55c4-5d6b-4815-a642-70ac9f34f102/ascreenshot_3f144f54a1a944e28454239c837b4e6d_text_export.jpeg)

### 4. 輸入名稱 {#4-enter-a-name}

輸入具有描述性的 **Toolset Name**，以及選填的 **Description**。編輯器左側顯示 **Available Tools**，右側顯示 **Your Toolset**。

![含名稱、描述與伺服器群組的新工具集編輯器](/img/mcp/toolset_editor_name.png)

### 5. 尋找並選取工具 {#5-find-and-select-tools}

點擊伺服器群組以展開其工具。選取個別工具的核取方塊，或使用伺服器的核取方塊選取其所有已載入的工具。

使用 **Search tools or servers...** 來比對工具名稱、工具描述或伺服器名稱。搜尋不區分大小寫，並會展開符合的群組。符合的伺服器名稱會顯示其所有工具；否則，每個群組只顯示符合搜尋的工具。

搜尋期間，**Select all matching** 會加入跨伺服器符合的工具，**Deselect all matching** 只會移除那些符合的工具。伺服器的核取方塊同樣只套用到該群組符合的工具。這些動作只套用到已載入的工具，因此請等候載入指示器完成，以納入每個伺服器。

![搜尋建置工具，並已跨伺服器選取符合的工具](/img/mcp/toolset_editor_search.png)

### 6. 檢視選取內容 {#6-review-the-selection}

**Your Toolset** 會列出每個已選取的工具，包括被目前搜尋隱藏的工具。變更或清除搜尋會保留這些選取。點擊已選取的工具可將其移除，或點擊 **Clear all** 移除整個選取，包括隱藏的工具。

您可以在一個工具集中合併來自任意數量伺服器的工具。

### 7. 建立工具集 {#7-create-the-toolset}

點擊 **Create Toolset** 以儲存。

## 編輯工具集 {#edit-a-toolset}

在 **Toolsets** 分頁中，開啟該列的 **Open toolset actions** 選單並選擇 **Edit**。使用相同的搜尋與選取控制項，然後點擊 **Save Changes**。

已儲存的工具即使無法使用，仍會保持選取狀態。已選取工具面板會在伺服器已不存在時將其標示為 **server not found**，在其工具無法載入時標示為 **server unreachable**，或在伺服器回應中沒有該工具時標示為 **tool not found**。這些標籤不會將工具從已儲存的選取中移除。如果某個項目不再屬於該工具集，請明確將其移除。

![編輯工具集，已選取工具面板中有一項無法使用的已儲存工具](/img/mcp/toolset_editor_unavailable.png)

---

## 在 Playground 中使用工具集 {#use-a-toolset-in-the-playground}

建立後，您的 toolset 會與 MCP 伺服器一起出現在 Playground 的 **MCP Servers** 下拉選單中，並可用相同方式選取。

### 1. 前往 Playground {#1-go-to-the-playground}

![導覽至 Playground](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/f9d4aa4c-d98e-4767-b98e-aad2890e97ca/ascreenshot_d84239c441bb4e828f229d0c9e079e3f_text_export.jpeg)

![點擊 Playground](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/d8a07563-97fe-453a-b974-88da46c87294/ascreenshot_ea494300a536400abb2ea6bf3bdfd5ab_text_export.jpeg)

### 2. 從 MCP Servers 中選取您的工具集 {#2-select-your-toolset-from-mcp-servers}

在左側面板的 **MCP Servers** 下，開啟下拉選單並選取您的工具集。模型只會看到您納入其中的工具。

![選取 MCP servers 下拉選單](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/ee8cb38c-c4ff-4b4b-844c-22f2e40832ae/ascreenshot_e300fb39cea0434fb5e3986e912a2b8d_text_export.jpeg)

![開啟 MCP 伺服器選擇器](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/8672070c-5d07-4f63-878c-6fc7dcbc9b65/ascreenshot_326ddd0868224c99a6fa5dab2d144f1f_text_export.jpeg)

![選取工具集](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/955826ad-2bbb-403e-ab26-c1ac03ec2675/ascreenshot_13f837ad53574535986ca7ca5998d34a_text_export.jpeg)

![已選取並啟用工具集](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/9a59c3b9-1563-4731-838f-1c35d636ddc9/ascreenshot_c05d8fa5f37a4b3093fc46e26f293b4d_text_export.jpeg)

模型現在只能存取您工具集中的工具，沒有其他工具。

---

## 透過 API 使用工具集 {#use-a-toolset-via-api}

將 toolset 的 route 作為 tools 清單中的 `server_url` 傳入。LiteLLM 會在伺服器端解析，因此不需要公開 URL。

<Tabs>
<TabItem value="responses" label="Responses API">

```python
import openai

client = openai.OpenAI(
    api_key="your-litellm-key",
    base_url="http://your-proxy/v1",
)

response = client.responses.create(
    model="{{openai_large}}",
    input="What CI/CD tools do you have?",
    tools=[
        {
            "type": "mcp",
            "server_label": "devtooling-prod",
            "server_url": "litellm_proxy/mcp/devtooling-prod",
            "require_approval": "never",
        }
    ],
)
print(response.output_text)
```

</TabItem>
<TabItem value="chat" label="Chat Completions API">

```python
import openai

client = openai.OpenAI(
    api_key="your-litellm-key",
    base_url="http://your-proxy/v1",
)

response = client.chat.completions.create(
    model="{{openai_large}}",
    messages=[{"role": "user", "content": "What CI/CD tools do you have?"}],
    tools=[
        {
            "type": "mcp",
            "server_label": "devtooling-prod",
            "server_url": "litellm_proxy/mcp/devtooling-prod",
            "require_approval": "never",
        }
    ],
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="rest" label="REST">

```bash
curl http://your-proxy/v1/responses \
  -H "Authorization: Bearer your-litellm-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{openai_large}}",
    "input": "What CI/CD tools do you have?",
    "tools": [
      {
        "type": "mcp",
        "server_label": "devtooling-prod",
        "server_url": "litellm_proxy/mcp/devtooling-prod",
        "require_approval": "never"
      }
    ]
  }'
```

</TabItem>
</Tabs>

---

## 透過 API 管理工具集 {#manage-toolsets-via-api}

```bash
# List all toolsets
curl http://your-proxy/v1/mcp/toolset \
  -H "Authorization: Bearer your-litellm-key"

# Create a toolset
curl -X POST http://your-proxy/v1/mcp/toolset \
  -H "Authorization: Bearer your-litellm-key" \
  -H "Content-Type: application/json" \
  -d '{
    "toolset_name": "devtooling-prod",
    "description": "CircleCI + DeepWiki tools for the dev team",
    "tools": [
      {"server_id": "<circleci-server-id>", "tool_name": "get_build_failure_logs"},
      {"server_id": "<circleci-server-id>", "tool_name": "run_pipeline"},
      {"server_id": "<deepwiki-server-id>", "tool_name": "read_wiki_structure"}
    ]
  }'

# Delete a toolset
curl -X DELETE http://your-proxy/v1/mcp/toolset/<toolset_id> \
  -H "Authorization: Bearer your-litellm-key"
```
