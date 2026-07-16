import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 在公開網際網路上公開 MCP {#exposing-mcps-on-the-public-internet}

控制哪些 MCP 伺服器會對外部呼叫者（例如 ChatGPT、Claude Desktop）可見，哪些僅供內部呼叫者使用。當您希望部分 MCP 伺服器可公開存取，同時將敏感伺服器限制在私人網路內時，這非常有用。

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 針對 MCP 伺服器的基於 IP 存取控制 — 外部呼叫者只能看到標記為公開的伺服器 |
| 設定 | 每個 MCP 伺服器上的 `available_on_public_internet` |
| 網路設定 | `mcp_internal_ip_ranges` 於 `general_settings` |
| 支援的用戶端 | ChatGPT、Claude Desktop、Cursor、OpenAI API，或任何 MCP 用戶端 |

:::warning 與 `delegate_auth_to_upstream` 的互動

如果某個 MCP 伺服器是 **`available_on_public_internet: false`**（供基於 IP 探索的內部使用）**且** 具有 **`delegate_auth_to_upstream: true`** 與 **`auth_type: oauth2`**（互動式 PKCE，非 M2M），匿名呼叫者仍可在沒有 LiteLLM 工作階段的情況下使用上游 OAuth **`/authorize`** 路徑。請參閱 [MCP OAuth — 將驗證委派給上游](./mcp_oauth.md#delegate-auth-to-upstream-pkce-passthrough) 以了解詳情與緩解方式。

:::

## 運作方式 {#how-it-works}

當請求抵達 LiteLLM 的 MCP 端點時，LiteLLM 會檢查呼叫者的 IP 位址，以判定其是 **內部** 還是 **外部** 呼叫者：

1. **擷取用戶端 IP** 自傳入請求（在設定為位於反向代理後方時，支援 `X-Forwarded-For`）。
2. **將 IP 分類** 為內部或外部，方法是將其與已設定的私人 IP 範圍比對（預設為 RFC 1918：`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`127.0.0.0/8`）。
3. **過濾伺服器清單**：
   - **內部呼叫者** 可看到所有 MCP 伺服器（公開與私人）。
   - **外部呼叫者** 只能看到具有 `available_on_public_internet: true` 的伺服器。

此過濾會套用於每個 MCP 存取點：MCP 登錄、工具清單、工具呼叫、動態伺服器路由，以及 OAuth 探索端點。

```mermaid
flowchart TD
    A[傳入的 MCP 請求] --> B[擷取用戶端 IP 位址]
    B --> C{IP 是否在私人範圍內？}
    C -->|是 - 內部呼叫者| D[回傳所有 MCP 伺服器]
    C -->|否 - 外部呼叫者| E[僅回傳<br/>available_on_public_internet = true 的伺服器]
```

## 操作流程 {#walkthrough}

本操作流程涵蓋兩個流程：
1. **新增公開的 MCP 伺服器**（DeepWiki）並從 ChatGPT 連線
2. **將現有伺服器設為私人**（Exa）並驗證 ChatGPT 不再看見它

### 流程 1：新增公開的 MCP 伺服器（DeepWiki） {#flow-1-add-a-public-mcp-server-deepwiki}

DeepWiki 是一個免費的 MCP 伺服器 — 很適合公開，以便 AI 閘道使用者可從 ChatGPT 存取。

#### 步驟 1：建立 MCP 伺服器 {#step-1-create-the-mcp-server}

前往 MCP Servers 頁面並點擊 **"+ Add New MCP Server"**。

![點擊 Add New MCP Server](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/28cc27c2-d980-4255-b552-ebf542ef95be/ascreenshot_30a7e3c043834f1c87b69e6ffc5bba4f_text_export.jpeg)

建立對話框會開啟。將 **"DeepWiki"** 輸入為伺服器名稱。

![輸入伺服器名稱](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/8c733c38-310a-40ef-8a5b-7af91cc7f74f/ascreenshot_16df83fed5bd4683a22a042e07063cec_text_export.jpeg)

在傳輸類型下拉選單中，選擇 **HTTP**，因為 DeepWiki 使用 Streamable HTTP 傳輸。

![選擇傳輸類型](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/e473f603-d692-40c7-a218-866c2e1cb554/ascreenshot_e93997971f2f44beac6152786889addf_text_export.jpeg)

現在向下捲動到 MCP Server URL 欄位。

![設定伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/b08d3c1f-9279-45b6-8efb-f73008901da6/ascreenshot_ce0de66f230a41b0a454e76653429021_text_export.jpeg)

輸入 DeepWiki MCP URL：`https://mcp.deepwiki.com/mcp`。

![輸入 MCP 伺服器 URL](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/e59f8285-cfde-4c57-aa79-24244acc9160/ascreenshot_8d575c66dc614a4183212ba282d22b41_text_export.jpeg)

完成名稱、傳輸與 URL 填寫後，基本伺服器設定即完成。

![已設定伺服器 URL](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/0f1af7ed-760d-4445-bdec-3da706d4eef4/ascreenshot_d7d6db69bc254ded871d14a71188a212_text_export.jpeg)

#### 步驟 2：啟用「可在公開網際網路上使用」 {#step-2-enable-available-on-public-internet}

在建立之前，向下捲動並展開 **Permission Management / Access Control** 區段。您可以在此控制誰能看見這部伺服器。

![展開 Permission Management](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/cc10dea2-6028-4a27-a33b-1b1b7212efb5/ascreenshot_0fdd152b862a4bf39973bc805ce64c57_text_export.jpeg)

將 **"Available on Public Internet"** 開啟。這是關鍵設定 — 它告訴 LiteLLM 外部呼叫者（例如從公開網際網路連線的 ChatGPT）應該能夠探索並使用這部伺服器。

![切換 Available on Public Internet](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/39c14543-c5ae-4189-8f85-9efc87135820/ascreenshot_9991f54910c24e21bba5c05ea4fa8e28_text_export.jpeg)

啟用切換後，點擊 **"Create"** 以儲存伺服器。

![點擊 Create](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/843be209-aade-44f4-98da-e55d1644854c/ascreenshot_8cfc90345a5f4d069b397e80d0a6e449_text_export.jpeg)

#### 步驟 3：從 ChatGPT 連線 {#step-3-connect-from-chatgpt}

現在讓我們驗證它是否可運作。開啟 ChatGPT，尋找 MCP 伺服器圖示以新增連線。要使用的端點是 `<your-litellm-url>/mcp`。

![ChatGPT 新增 MCP 伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/58b5f674-edf4-4156-a5fa-5fdc8ed5d7b9/ascreenshot_36735f7c37394e919793968794614126_text_export.jpeg)

在下拉選單中，選擇 **"Add an MCP server"** 以設定新連線。

![ChatGPT MCP 伺服器選項](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/f89da8af-bc61-44a7-a765-f52733f4970d/ascreenshot_6410a917b782437eb558de3bfcd35ffd_text_export.jpeg)

ChatGPT 會要求伺服器標籤。請給它一個容易辨識的名稱，例如 "LiteLLM"。

![輸入伺服器標籤](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/88505afe-07c1-4674-a89c-8035a5d05eb6/ascreenshot_143aefc38ddd4d3f9f5823ca2cc09bc2_text_export.jpeg)

接著輸入 Server URL。這應該是您的 LiteLLM proxy 的 MCP 端點 — `<your-litellm-url>/mcp`。

![輸入 LiteLLM MCP URL](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/9048be4a-7e40-43e7-9789-059fed2741a6/ascreenshot_e81232c17fd148f48f0ae552e9dc2a10_text_export.jpeg)

貼上您的 LiteLLM URL，並確認其看起來正確。

![已貼上 URL](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/7707e796-e146-47c8-bce0-58e6f4076272/ascreenshot_0710dc58b8ed4d6887856b1388d59329_text_export.jpeg)

ChatGPT 也需要驗證。請在驗證欄位輸入您的 LiteLLM API 金鑰，以便它可以連線到 proxy。

![輸入 API 金鑰](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/f6cfcb81-021d-4a41-94d7-d4eaf449d025/ascreenshot_d635865abfb64732a7278922f08dbcaa_text_export.jpeg)

點擊 **"Connect"** 建立連線。

![點擊 Connect](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/1146b326-6f0c-4050-9729-af5c88e1bc81/ascreenshot_e19fb857e5394b9a9bf77b075b4fb620_text_export.jpeg)

ChatGPT 連線後會顯示可用工具。由於目前 DeepWiki 和 Exa 都標記為公開，ChatGPT 可以看到來自兩部伺服器的工具。

![ChatGPT 顯示可用的 MCP 工具](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/43ac56b7-9933-4762-903a-370fc52c79b5/ascreenshot_39073d6dc3bc4bb6a79d93365a26a4f8_text_export.jpeg)

---

### 流程 2：將現有伺服器設為私人（Exa） {#flow-2-make-an-existing-server-private-exa}

現在讓我們反向操作 — 將目前公開的現有 MCP 伺服器（Exa）限制為僅內部存取。完成此變更後，ChatGPT 不應再看到 Exa 的工具。

#### 步驟 1：編輯伺服器 {#step-1-edit-the-server}

前往 MCP Servers 表格並點擊 Exa 伺服器以開啟其詳細檢視。

![Exa 伺服器總覽](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/65844f13-b1ec-4092-b3fd-b1cae3c0c833/ascreenshot_cc8ea435c5e14761a1394ca80fe817c0_text_export.jpeg)

切換到 **"Settings"** 分頁以存取編輯表單。

![點擊 Settings](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/d5b65271-561e-4d2a-b832-96d32611f6e4/ascreenshot_a200942b17264c1eb7a3ffdb2c2141f5_text_export.jpeg)

編輯表單會載入 Exa 目前的設定。

![編輯伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/119184f6-f3cd-45b7-9cfa-0ea08de27020/ascreenshot_c39a793da03a4f0fb84b5ee829af9034_text_export.jpeg)

#### 步驟 2：關閉「可在公開網際網路上使用」 {#step-2-toggle-off-available-on-public-internet}

向下捲動並展開 **Permission Management / Access Control** 區段，以找到公開網際網路切換。

![展開權限](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/bf7114cc-8741-4fa0-a39a-fe625482e88a/ascreenshot_8a987649c03e46558a2ec9a6f2f539a4_text_export.jpeg)

將 **"Available on Public Internet"** 關閉。這會對您私人網路之外的任何呼叫者隱藏 Exa。

![關閉公開網際網路](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/f36af5ad-028f-4bb1-aed1-43e38ff9b733/ascreenshot_9128364a049f489bb8483e18e5c88015_text_export.jpeg)

點擊 **"Save Changes"** 套用。變更會立即生效 — 不需要重新啟動 proxy。

![儲存變更](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/126a71b3-02e1-4d61-a208-942b92e9ef25/ascreenshot_f349ef69e08044dd8e4903f4286b7b97_text_export.jpeg)

#### 步驟 3：在 ChatGPT 中驗證 {#step-3-verify-in-chatgpt}

回到 ChatGPT 確認 Exa 已不再可見。您需要重新連線，讓 ChatGPT 重新取得工具清單。

![ChatGPT 驗證](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/15518882-8b19-44d3-9bba-245aeb62b4b1/ascreenshot_f98f59c51e6543e1be4f3960ba375fc9_text_export.jpeg)

開啟 MCP 伺服器設定並選擇新增或重新連線伺服器。

![重新連線到伺服器](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/784d3174-77c0-42e6-a059-4c906db8f72a/ascreenshot_d77db951b83e4b15a00373222712f6b5_text_export.jpeg)

輸入與先前相同的 LiteLLM MCP URL。

![重新連線 URL](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/17ef5fb0-b240-4556-8d20-753d359b7fcf/ascreenshot_583466ce9e8f40d1ba0af8b1e7d04413_text_export.jpeg)

設定伺服器標籤。

![重新連線名稱](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/d7907637-c957-4a3c-ab4f-1600ca9a70a0/ascreenshot_e429eea43f3f4b3ca4d3ac5a77fbde2d_text_export.jpeg)

輸入您的 API 金鑰以進行驗證。

![重新連線金鑰](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/9cfff77a-37aa-4ca6-8032-0b46c50f37e3/ascreenshot_250664183399496b8f5c9f86f576fc0b_text_export.jpeg)

點擊 **"Connect"** 重新建立連線。

![點擊 Connect](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/686f6307-b4ae-448b-ac6c-2c9d7b4f6b57/ascreenshot_3f499d0812af42ab89fed103cc21c249_text_export.jpeg)

這次只會顯示 DeepWiki 的工具 — Exa 已消失。LiteLLM 偵測到 ChatGPT 是從公開 IP 呼叫，因為 Exa 已不再標記為公開，所以已將其過濾掉。您私人網路上的內部使用者仍然會看到兩部伺服器。

![僅顯示 DeepWiki 工具](https://colony-recorder.s3.amazonaws.com/files/2026-02-07/667d79b6-75f9-4799-9315-0c176e7a5e34/ascreenshot_efa43050ac0b4445a09e542fa8f270ff_text_export.jpeg)

## 設定參考 {#configuration-reference}

### 每部伺服器的設定 {#per-server-setting}

<Tabs>
<TabItem value="ui" label="UI">

在建立或編輯 MCP 伺服器時，於 Permission Management 區段切換 **"Available on Public Internet"**。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  deepwiki:
    url: https://mcp.deepwiki.com/mcp
    available_on_public_internet: true   # visible to external callers

  exa:
    url: https://exa.ai/mcp
    auth_type: api_key
    auth_value: os.environ/EXA_API_KEY
    available_on_public_internet: false  # internal only (default)
```

</TabItem>
<TabItem value="api" label="API">

```bash title="Create a public MCP server" showLineNumbers
curl -X POST <your-litellm-url>/v1/mcp/server \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "server_name": "DeepWiki",
    "url": "https://mcp.deepwiki.com/mcp",
    "transport": "http",
    "available_on_public_internet": true
  }'
```

```bash title="Update an existing server" showLineNumbers
curl -X PUT <your-litellm-url>/v1/mcp/server \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "<server-id>",
    "available_on_public_internet": false
  }'
```

</TabItem>
</Tabs>

### 自訂私人 IP 範圍 {#custom-private-ip-ranges}

預設情況下，LiteLLM 會將 RFC 1918 私人範圍視為內部。您可以在 MCP Servers 底下的 **Network Settings** 分頁中自訂此設定，或透過設定：

```yaml title="config.yaml" showLineNumbers
general_settings:
  mcp_internal_ip_ranges:
    - "10.0.0.0/8"
    - "172.16.0.0/12"
    - "192.168.0.0/16"
    - "100.64.0.0/10"    # Add your VPN/Tailscale range
```

當留空時，會使用標準私人範圍（`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`127.0.0.0/8`）。

---

## 公網 vs MCP Hub 可見性 {#public-internet-vs-mcp-hub-visibility}

`available_on_public_internet` 與 **MCP Hub**（`GET /public/mcp_hub`）是兩個容易混淆的獨立機制：

| 顧慮 | 由誰控制 | 預設 |
|---|---|---|
| 外部（非私人 CIDR）呼叫端是否可以在 MCP 工具端點（list/call）看到此伺服器？ | 伺服器上的 `available_on_public_internet` | `True`（預設可見；切換為 `false` 可限制為私人 CIDR） |
| 此伺服器是否會出現在未驗證的 `GET /public/mcp_hub` 廣告中？ | `litellm.public_mcp_servers` 清單，受 `litellm.public_mcp_hub_strict_whitelist` 控制 | Hub 嚴格白名單預設為**開啟**——只有明確列於 `public_mcp_servers` 的伺服器才會被廣告 |

在**預設嚴格白名單模式**下，`available_on_public_internet: true`（預設）不會讓伺服器出現在 hub 中。若要在 hub 上廣告某個伺服器，您還需要將其加入 `public_mcp_servers`：

```yaml title="Server on the hub AND visible to external callers (the default)" showLineNumbers
litellm_settings:
  public_mcp_servers:
    - deepwiki
  # public_mcp_hub_strict_whitelist defaults to true

mcp_servers:
  deepwiki:
    url: https://mcp.deepwiki.com/mcp
    # available_on_public_internet defaults to true
```

如果您設定 `litellm.public_mcp_hub_strict_whitelist: false`，hub 會退回為廣告所有具有 `available_on_public_internet: true` 的伺服器——但本頁面的基於 IP 存取篩選器仍會獨立套用至實際的工具端點。
