import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MCP 工具集 {#mcp-toolsets}

**工具集**是從一個或多個 MCP 伺服器中挑選出來的特定工具之命名集合。您不必讓代理程式存取每個伺服器上的所有工具，而是精確挑選它實際需要的工具——不論它們位於哪個伺服器——並將它們以單一名稱打包。

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

不是跨兩個伺服器的 13+ 個工具，而是讓代理程式取得 6 個——它實際需要的那些。

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

為工具集輸入名稱。請選擇具描述性的名稱——這是代理程式會引用的名稱。

![輸入工具集名稱](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/62b412e0-d38f-44c3-99e4-3693f1512f6a/ascreenshot_b678c7c988a04f8b887b0f54c4dd95a7_text_export.jpeg)

![工具集名稱欄位](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/ba5ebc95-cab7-470b-a7c9-21f12b9b01a3/ascreenshot_a602e982a2a44890a83dca64d61c38eb_text_export.jpeg)

### 5. 新增第一個工具 {#5-add-the-first-tool}

從下拉選單中選取一個 MCP 伺服器，然後選擇要從該伺服器納入的工具。

![選取 MCP 伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/2aa5bcba-6414-42e3-9813-efb0a9078e32/ascreenshot_58fbff35ba654210a1b4dc5452aa6bd9_text_export.jpeg)

![從下拉選單中選擇伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/4fd9cffb-d3ba-461a-8679-89f278bf67ad/ascreenshot_b61e9e85a51b494a8d09fe61198d63e1_text_export.jpeg)

![從伺服器選取工具](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/60718e72-2062-494b-9a23-456992c88cbd/ascreenshot_7a1f8eeab30a4a05ba39c450e5458b78_text_export.jpeg)

### 6. 新增來自第二個伺服器的工具 {#6-add-tools-from-a-second-server}

點擊 **Add Tool**，選擇另一個 MCP 伺服器，並選取另一個工具。依需求重複，新增任意數量的工具——它們可以來自任意多個伺服器。

![從第二個伺服器新增工具](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/f34e0600-cc74-4b18-8794-88d45f326144/ascreenshot_98834b14ab9343e39fb503e458d72b7c_text_export.jpeg)

![選取第二個伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/75150368-2202-4da1-99f1-6f0620e9b133/ascreenshot_f94d0bc08ea147348a9cf021cce7d854_text_export.jpeg)

![從第二個伺服器選取工具](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/ed2cdf6e-025d-4d50-8b12-ed68745d5c51/ascreenshot_0c1c7f76524b46c5a056fda5e6956e2b_text_export.jpeg)

### 7. 建立工具集 {#7-create-the-toolset}

點擊 **Create Toolset** 以儲存。

![建立工具集](https://colony-recorder.s3.amazonaws.com/files/2026-03-22/021ca7b3-2d9a-49a0-8758-dae3dc3bcb4d/ascreenshot_14c6434e71114a6091e359a996f20e12_text_export.jpeg)

---

## 在 Playground 中使用工具集 {#use-a-toolset-in-the-playground}

建立後，您的工具集會與 MCP 伺服器一起顯示在 Playground 的 **MCP Servers** 下拉選單中——其選取方式相同。

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

將工具集的路由作為 `server_url` 傳入您的 tools 清單中。LiteLLM 會在伺服器端解析它——不需要公開 URL。

<Tabs>
<TabItem value="responses" label="Responses API">

```python
import openai

client = openai.OpenAI(
    api_key="your-litellm-key",
    base_url="http://your-proxy/v1",
)

response = client.responses.create(
    model="gpt-4o",
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
    model="gpt-4o",
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
    "model": "gpt-4o",
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
