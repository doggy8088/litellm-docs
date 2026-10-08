import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 虛擬金鑰 {#virtual-keys}
透過 proxy 的 virtual key 追蹤支出並控管模型存取權

:::info

- 🔑 [產生、編輯、刪除金鑰的 UI（含 SSO）](https://docs.litellm.ai/docs/proxy/ui)
- [使用金鑰管理部署 LiteLLM Proxy](https://docs.litellm.ai/docs/proxy/deploy#provision-the-data-stores)
- [LiteLLM Proxy + 金鑰管理的 Dockerfile.database](https://github.com/BerriAI/litellm/blob/main/docker/Dockerfile.database)

:::

## 設定 {#setup}

需求： 

- 需要 postgres 資料庫（例如 [Supabase](https://supabase.com/)、[Neon](https://neon.tech/) 等）
- 在您的環境中設定 `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>`
- 設定 `master key`，這是您的 Proxy 管理員金鑰 - 您可以用它來建立其他金鑰（🚨 必須以 `sk-` 開頭）。
  - ** 在 config.yaml 中設定** 將您的 master key 設在 `general_settings:master_key`，如下方範例
  - ** 設定環境變數** 設定 `LITELLM_MASTER_KEY`

（proxy Dockerfile 會檢查是否已設定 `DATABASE_URL`，然後初始化 DB 連線）

```shell
export DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
```


接著，您可以透過呼叫 `/key/generate` 端點來產生金鑰。

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/7a669a36d2689c7f7890bc9c93e04ff3c2641299/litellm/proxy/proxy_server.py#L672)

## **快速開始 - 產生金鑰** {#quick-start---generate-a-key}
**步驟 1：儲存 postgres db url**

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
        model: ollama/llama2
  - model_name: {{openai_small}}
    litellm_params:
        model: ollama/llama2

general_settings: 
  master_key: os.environ/LITELLM_MASTER_KEY 
  database_url: "postgresql://<user>:<password>@<host>:<port>/<dbname>" # 👈 KEY CHANGE
```

**步驟 2：啟動 litellm**

```shell
litellm --config /path/to/config.yaml
```

**步驟 3：產生金鑰**

```shell 
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["{{openai_small}}", "{{openai_large}}"], "metadata": {"user": "ishaan@berri.ai"}}'
```

## 金鑰從其擁有者繼承的內容 {#what-a-key-inherits-from-its-owner}

金鑰的擁有者是其 `user_id` 所指向的對象，而且不一定是建立它的人。只有在呼叫端 *不是* proxy 管理員時，`/key/generate` 才會自動把呼叫端的 `user_id` 寫到新金鑰上；proxy 管理員則必須明確傳入 `user_id`，因此沒有 `user_id` 的管理員建立金鑰沒有擁有者，也不會繼承管理員的任何內容。從 Admin UI 為特定使用者建立的金鑰，以及 [service account keys](./service_accounts.md)（其 `user_id` 一律是 `null`），遵循相同規則。

繼承在不同權限面向上並不一致。模型存取與 MCP 存取一律根據金鑰資料列本身進行評估；而管理路由的權限則由擁有者使用者的 *角色* 決定，因此由 proxy 管理員擁有的金鑰可以呼叫管理端點。

| 面向 | 金鑰從擁有者繼承的內容 | 如何在金鑰上覆寫 |
|---|---|---|
| [Models](./key_auth_arch.md) | 當金鑰屬於團隊時，不繼承任何內容。若金鑰沒有 `team_id`，則會在金鑰自身清單之上套用擁有者的 `models` 清單，而擁有者上的 `no-default-models` 會拒絕團隊之外的所有內容 | 在金鑰上設定 `models`（或設定 `all-team-models` 以交由團隊決定） |
| [管理路由](./access_control.md) (`/key/*`, `/user/*`, `/team/*`) | 完整繼承擁有者的角色。如果擁有者是 `proxy_admin`，則會略過所有非管理員路由限制，且該金鑰可以管理金鑰、使用者與團隊 | 在金鑰上設定 `allowed_routes`；這會對所有角色強制生效，包括由管理員擁有的金鑰 |
| [MCP servers and tools](../mcp_control.md) | 擁有者的 MCP 權限作為上限，永遠不會作為授權；若金鑰清單為空，則會繼承團隊的伺服器，除非已開啟 `require_key_mcp_access_defined`。管理員擁有權不會授予任何 MCP 存取權 | 設定 `object_permission.mcp_servers` / `mcp_access_groups` / `mcp_tool_permissions`，或設定 `no-mcp-servers` 以選擇不套用 |
| 預算與速率限制 | 只要有設定，就會繼承擁有者的 `tpm_limit` 與 `rpm_limit`；對於沒有團隊的金鑰，則會繼承擁有者的 `max_budget` | 在金鑰上設定相同欄位，或使用 service account key 只套用團隊限制 |

## 支出追蹤 {#spend-tracking}

可依下列方式取得支出：
- key - 透過 `/key/info` [Swagger](https://docs.litellm.ai/api-reference/#/key%20management/info_key_fn_key_info_get)
- user - 透過 `/user/info` [Swagger](https://docs.litellm.ai/api-reference/#/Internal%20User%20management/user_info_user_info_get)
- team - 透過 `/team/info` [Swagger](https://docs.litellm.ai/api-reference/#/team%20management/team_info_team_info_get)  
- ⏳ end-users - 透過 `/end_user/info` - [在此 issue 留言以追蹤 end-user 成本](https://github.com/BerriAI/litellm/issues/2633)

**如何計算？**

每個模型的成本都儲存在[這裡](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)，並由 [`completion_cost`](https://github.com/BerriAI/litellm/blob/db7974f9f216ee50b53c53120d1e3fc064173b60/litellm/utils.py#L3771) 函式計算。

**如何追蹤？**

支出會自動為金鑰記錄在 "LiteLLM_VerificationTokenTable" 中。如果金鑰有附加 'user_id' 或 'team_id'，則該使用者的支出會記錄在 "LiteLLM_UserTable" 中，而團隊則記錄在 "LiteLLM_TeamTable" 中。

<Tabs>
<TabItem value="key-info" label="金鑰支出">

您可以使用 `/key/info` 端點取得某個金鑰的支出。 

```bash
curl 'http://0.0.0.0:4000/key/info?key=<user-key>' \
     -X GET \
     -H 'Authorization: Bearer <your-master-key>'
```

當使用 litellm 的 completion_cost() 函式對 /completions、/chat/completions、/embeddings 發出呼叫時，這會自動更新（以 USD 計）。[**查看程式碼**](https://github.com/BerriAI/litellm/blob/1a6ea20a0bb66491968907c2bfaabb7fe45fc064/litellm/utils.py#L1654)。 

**範例回應**

```python
{
    "key": "sk-tXL0wt5-lOOVK9sfY2UacA",
    "info": {
        "token": "sk-tXL0wt5-lOOVK9sfY2UacA",
        "spend": 0.0001065, # 👈 SPEND
        "expires": "2023-11-24T23:19:11.131000Z",
        "models": [
            "{{openai_small}}",
            "{{openai_large}}",
            "{{anthropic}}"
        ],
        "aliases": {
            "mistral-7b": "{{openai_small}}"
        },
        "config": {}
    }
}
```

</TabItem>
<TabItem value="user-info" label="使用者支出">

**1. 建立使用者**

```bash
curl --location 'http://localhost:4000/user/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{user_email: "krrish@berri.ai"}' 
```

**預期回應**

```bash
{
    ...
    "expires": "2023-12-22T09:53:13.861000Z",
    "user_id": "my-unique-id", # 👈 unique id
    "max_budget": 0.0
}
```

**2. 為該使用者建立金鑰**

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["{{openai_small}}", "{{openai_large}}"], "user_id": "my-unique-id"}'
```

回傳一組金鑰 - `sk-...`。

**3. 查看使用者支出**

```bash
curl 'http://0.0.0.0:4000/user/info?user_id=my-unique-id' \
     -X GET \
     -H 'Authorization: Bearer <your-master-key>'
```

預期回應

```bash
{
  ...
  "spend": 0 # 👈 SPEND
}
```

</TabItem>
<TabItem value="team-info" label="團隊支出">

如果您希望金鑰由多人擁有（例如用於正式環境應用程式），請使用團隊。

**1. 建立團隊**

```bash
curl --location 'http://localhost:4000/team/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"team_alias": "my-awesome-team"}' 
```

**預期回應**

```bash
{
    ...
    "expires": "2023-12-22T09:53:13.861000Z",
    "team_id": "my-unique-id", # 👈 unique id
    "max_budget": 0.0
}
```

**2. 為該團隊建立金鑰**

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["{{openai_small}}", "{{openai_large}}"], "team_id": "my-unique-id"}'
```

回傳一組金鑰 - `sk-...`。

**3. 查看團隊支出**

```bash
curl 'http://0.0.0.0:4000/team/info?team_id=my-unique-id' \
     -X GET \
     -H 'Authorization: Bearer <your-master-key>'
```

預期回應

```bash
{
  ...
  "spend": 0 # 👈 SPEND
}
```

</TabItem>
</Tabs>

## 模型別名 {#model-aliases}

如果預期使用者會使用特定模型（即 gpt-5.6-luna），而您想要：

- 嘗試將請求升級（即 gpt-5.6-terra）
- 或降級（即 Mistral）

以下是做法： 

**步驟 1：在 config.yaml 中建立 model group（儲存模型名稱、API 金鑰等）**

```yaml
model_list:
  - model_name: my-free-tier
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8001
  - model_name: my-free-tier
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8002
  - model_name: my-free-tier
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8003
  - model_name: my-paid-tier
    litellm_params:
        model: {{openai_large}}
        api_key: my-api-key
```

**步驟 2：產生金鑰**

```bash
curl -X POST "https://0.0.0.0:4000/key/generate" \
-H "Authorization: Bearer <your-master-key>" \
-H "Content-Type: application/json" \
-d '{
	"models": ["my-free-tier"], 
	"aliases": {"{{openai_small}}": "my-free-tier"}, # 👈 KEY CHANGE
	"duration": "30min"
}'
```

- **如何升級 / 降級請求？** 變更別名對應

**步驟 3：測試金鑰**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
-H "Authorization: Bearer <user-key>" \
-H "Content-Type: application/json" \
-d '{
    "model": "{{openai_small}}", 
    "messages": [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ]
}'
```


## 進階 {#advanced}

### 在自訂標頭中傳遞 LiteLLM 金鑰 {#pass-litellm-key-in-custom-header}

使用這個功能可讓 LiteLLM proxy 改為在自訂標頭中尋找 virtual key，而不是預設的 `"Authorization"` 標頭

**步驟 1** 在 litellm config.yaml 中定義 `litellm_key_header_name` 名稱

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

general_settings: 
  master_key: os.environ/LITELLM_MASTER_KEY 
  litellm_key_header_name: "X-Litellm-Key" # 👈 Key Change

```

**步驟 2** 測試它

在此請求中，litellm 會使用 `X-Litellm-Key` 標頭中的 Virtual key

<Tabs>
<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Litellm-Key: Bearer $LITELLM_API_KEY" \
  -H "Authorization: Bearer bad-key" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello, Claude gm!"}
    ]
  }'
```

**預期回應**

由於在 `X-Litellm-Key` 中傳入的金鑰有效，應可看到來自 litellm proxy 的成功回應
```shell
{"id":"chatcmpl-f9b2b79a7c30477ab93cd0e717d1773e","choices":[{"finish_reason":"stop","index":0,"message":{"content":"\n\nHello there, how may I assist you today?","role":"assistant","tool_calls":null,"function_call":null}}],"created":1677652288,"model":"{{openai_small}}","object":"chat.completion","system_fingerprint":"fp_44709d6fcb","usage":{"completion_tokens":12,"prompt_tokens":9,"total_tokens":21}
```

</TabItem>

<TabItem value="python" label="OpenAI Python SDK">

```python
client = openai.OpenAI(
    api_key="not-used",
    base_url="https://api-gateway-url.com/llmservc/api/litellmp",
    default_headers={
        "Authorization": f"Bearer {API_GATEWAY_TOKEN}", # (optional) For your API Gateway
        "X-Litellm-Key": f"Bearer sk-<your-litellm-api-key>"              # For LiteLLM Proxy
    }
)
```
</TabItem>
</Tabs>

### 以金鑰雜湊覆寫傳出的 `user` {#overwrite-outgoing-user-with-the-key-hash}

:::info

自 `v1.95.0` 起可用。

:::

許多提供者會使用請求的 end-user 識別碼（`user` 欄位）來監控與偵測濫用，並將活動追溯到單一 end user，讓某位使用者的濫用行為較不容易影響整個組織的存取。由於該欄位由呼叫端設定，用戶端可以變更它，將其活動與某個身分解除關聯。當您希望提供者看到的 `overwrite_user_with_key_hash` 是一個穩定、不可竄改、且與發出呼叫的 LiteLLM 金鑰綁定的識別碼時，請開啟 `user`，如此任何以 `user` 為鍵的提供者端處理都能回到且只回到一把金鑰，不論用戶端送出了什麼。

啟用後，proxy 會在 chat/completions 請求中，將傳出的 `user` 強制設為呼叫金鑰的身分，永遠覆寫請求本文中的任何 `user`，即使用戶端未提供 `user` 也會設定。對於 virtual key，這個值是該金鑰的 sha256 token hash，也就是支出記錄中儲存為 `user_api_key_hash` 的相同值，因此您可以將提供者可見的 id 對應回金鑰及其擁有者，而無需額外的串接處理。對於使用 master key 驗證的請求，這個值是固定別名 `litellm_proxy_master_key`，因此 master key 本身或其雜湊值都不會被轉送。

此旗標預設為關閉，只會影響代理程式本身驗證過的金鑰（虛擬金鑰與主金鑰）。不論虛擬金鑰是否有使用者或隸屬於團隊，其行為都相同；標記一律是金鑰雜湊。由自訂驗證處理常式或 JWT 驗證的請求則不受影響，而且在旗標關閉時，呼叫端提供的 `user` 會被保留，因此既有行為不會改變。

```yaml
litellm_settings:
  overwrite_user_with_key_hash: true
```

提供自己 `user` 的請求，會在呼叫派送前被替換為：

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-virtual-key" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "hi"}],
    "user": "anything-the-client-sends"
  }'
```

提供者收到的 `user` 會設為該金鑰的 sha256 雜湊（例如 `98e983...6401`），而不是 `anything-the-client-sends`。

:::info

`user` 值是否會在傳輸時送達提供者，取決於各提供者既有的行為，而此設定不會改變這點。有些提供者會原樣轉送 `user`，有些會將其對應到自己的最終使用者欄位，還有一些會丟棄它；這個旗標只控制 LiteLLM 設定的值，不控制特定提供者是否傳送它。

:::

### 啟用/停用虛擬金鑰 {#enabledisable-virtual-keys}

**停用金鑰**

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/block' \
-H 'Authorization: Bearer LITELLM_MASTER_KEY' \
-H 'Content-Type: application/json' \
-d '{"key": "KEY-TO-BLOCK"}'
```

預期回應： 

```bash
{
  ...
  "blocked": true
}
```

**啟用金鑰**

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/unblock' \
-H 'Authorization: Bearer LITELLM_MASTER_KEY' \
-H 'Content-Type: application/json' \
-d '{"key": "KEY-TO-UNBLOCK"}'
```


```bash
{
  ...
  "blocked": false
}
```


### 自訂 /key/generate {#custom-keygenerate}

如果您需要在產生 Proxy API 金鑰前加入自訂邏輯（範例：驗證 `team_id`）

#### 1. 撰寫自訂 `custom_generate_key_fn` {#1-write-a-custom-custom_generate_key_fn}

custom_generate_key_fn 函式的輸入是一個單一參數：`data` [(型別：GenerateKeyRequest)](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/_types.py#L125)

您的 `custom_generate_key_fn` 輸出應該是一個具有下列結構的字典
```python
{
    "decision": False,
    "message": "This violates LiteLLM Proxy Rules. No team id provided.",
}

```

- decision (型別：bool)：一個布林值，表示是否允許產生金鑰（True）或不允許（False）。

- message (型別：str，選填)：提供關於該決策的額外資訊的選用訊息。此欄位會在 decision 為 False 時包含。

```python
async def custom_generate_key_fn(data: GenerateKeyRequest)-> dict:
        """
        Asynchronous function for generating a key based on the input data.

        Args:
            data (GenerateKeyRequest): The input data for key generation.

        Returns:
            dict: A dictionary containing the decision and an optional message.
            {
                "decision": False,
                "message": "This violates LiteLLM Proxy Rules. No team id provided.",
            }
        """
        
        # decide if a key should be generated or not
        print("using custom auth function!")
        data_json = data.json()  # type: ignore

        # Unpacking variables
        team_id = data_json.get("team_id")
        duration = data_json.get("duration")
        models = data_json.get("models")
        aliases = data_json.get("aliases")
        config = data_json.get("config")
        spend = data_json.get("spend")
        user_id = data_json.get("user_id")
        max_parallel_requests = data_json.get("max_parallel_requests")
        metadata = data_json.get("metadata")
        tpm_limit = data_json.get("tpm_limit")
        rpm_limit = data_json.get("rpm_limit")

        if team_id is not None and team_id == "litellm-core-infra@gmail.com":
            # only team_id="litellm-core-infra@gmail.com" can make keys
            return {
                "decision": True,
            }
        else:
            print("Failed custom auth")
            return {
                "decision": False,
                "message": "This violates LiteLLM Proxy Rules. No team id provided.",
            }
```


#### 2. 傳入檔案路徑（相對於 config.yaml） {#2-pass-the-filepath-relative-to-the-configyaml}

將 config.yaml 的檔案路徑傳入

例如，如果它們都在同一個目錄中 - `./config.yaml` 和 `./custom_auth.py`，看起來會像這樣：
```yaml 
model_list: 
  - model_name: "openai-model"
    litellm_params: 
      model: "{{openai_small}}"

litellm_settings:
  drop_params: True
  set_verbose: True

general_settings:
  custom_key_generate: custom_auth.custom_generate_key_fn
```

:::warning

`custom_key_generate` 只會在 `/key/generate` 上執行。金鑰編輯（`/key/update`、`/key/bulk_update`、`/team/key/bulk_update`，以及在 Admin UI 中編輯金鑰，會呼叫 `/key/update`）會略過它，因此使用者可以先建立一個符合規範的金鑰，接著再將其編輯成不符合規範，例如移除其到期日。如果您的政策也應該套用於編輯，請同時設定 [`custom_key_update`](#custom-keyupdate)，或者使用 [`custom_key_policy`](#custom-key-policy-one-hook-for-every-key-operation)，這是建議的單一 hook，會在每一次金鑰操作時執行，包括重新產生。

:::

### 自訂 /key/update {#custom-keyupdate}

如果您使用 `custom_key_generate` 強制執行政策，請將 `custom_key_update` 設定為在編輯金鑰時也持續套用。它會在 `/key/update`、`/key/bulk_update` 與 `/team/key/bulk_update` 上執行。Admin UI 的編輯金鑰流程會呼叫 `/key/update`，因此這也涵蓋了從 UI 所做的編輯。如需一個涵蓋建立、更新與重新產生，且針對合併後金鑰狀態的單一 hook，請參閱 [`custom_key_policy`](#custom-key-policy-one-hook-for-every-key-operation)。

#### 1. 撰寫自訂 `custom_update_key_fn` {#1-write-a-custom-custom_update_key_fn}

`custom_update_key_fn` 函式的輸入是一個單一參數：`data` [(型別：UpdateKeyRequest)](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/_types.py)

輸出合約與 `custom_generate_key_fn` 相同：回傳 `{"decision": True}` 以允許更新，或回傳 `{"decision": False, "message": "..."}` 以拒絕更新。被拒絕的更新會以 `403` 失敗。

更新請求只會包含正在變更的欄位，因此未設定的欄位表示「維持原樣」，而不是「清除」。請使用 `data.model_fields_set` 來區分省略的欄位與明確設為 `None` 的欄位。例如，當金鑰在 Admin UI 中被編輯為「永不過期」時，Admin UI 會送出 `duration: null`，而下方函式會拒絕它。

```python
from litellm.proxy._types import UpdateKeyRequest


async def custom_update_key_fn(data: UpdateKeyRequest) -> dict:
    """
    Asynchronous function that decides if a key update should be allowed.

    Args:
        data (UpdateKeyRequest): The requested changes to the key.

    Returns:
        dict: A dictionary containing the decision and an optional message.
    """
    if "duration" in data.model_fields_set and data.duration is None:
        return {
            "decision": False,
            "message": "This violates LiteLLM Proxy Rules. Keys must keep an expiration date.",
        }
    return {"decision": True}
```

#### 2. 傳入檔案路徑（相對於 config.yaml） {#2-pass-the-filepath-relative-to-the-configyaml-1}

```yaml
general_settings:
  custom_key_generate: custom_auth.custom_generate_key_fn
  custom_key_update: custom_auth.custom_update_key_fn
```

### 自訂金鑰政策（每個金鑰操作一個 hook） {#custom-key-policy-one-hook-for-every-key-operation}

`custom_key_generate` 和 `custom_key_update` 各自只會看到自己端點的原始請求，因此像是「每個金鑰都必須在七天內過期」這種規則，必須寫兩次，而且兩者都看不到正在變更的金鑰，或相對 `duration` 轉換成的絕對過期時間。`custom_key_policy` 是一個會在每次金鑰操作時執行的 hook，並會接收該操作與有效的金鑰狀態：也就是現有金鑰與請求變更合併後的結果，其中相對 `duration` 已經轉成絕對 `expires`。只要寫一次規則，不論是哪個端點或 Admin UI 動作變更金鑰，它都會成立。

#### 1. 撰寫自訂 `custom_key_policy_fn` {#1-write-a-custom-custom_key_policy_fn}

輸入是一個單一參數，`policy_request`。`policy_request.operation` 是 `"generate"`、`"update"` 或 `"regenerate"` 之一。`policy_request.existing_key` 是目前儲存的金鑰資料列，`None` 於 generate 時。`policy_request.effective_key` 是操作後將被寫入的資料列：現有值疊加上請求的變更，`duration` 轉為 `expires`，`budget_duration` 轉為 `budget_reset_at`，`organization_id` 轉為 `org_id`，而像 `tags` 與 `guardrails` 這類中繼資料樣式的請求欄位則會折疊進 `metadata`。`policy_request.request` 是收到的請求本文，也就是舊版 hooks 會取得的同一個物件，適用於想要相對持續時間字串的規則。

輸出合約與 `custom_generate_key_fn` 相同：回傳 `{"decision": True}` 以允許操作，或回傳 `{"decision": False, "message": "..."}` 以拒絕操作。被拒絕的操作會以帶有訊息的 `403` 失敗。

此政策將每個金鑰的有效期上限設為從現在起七天。`effective_key.expires` 是絕對 UTC 日期時間，或對於永不過期的金鑰則是 `None`，因此同一個檢查適用於新金鑰、延長 `duration` 的編輯，以及重新產生。

```python
from datetime import datetime, timedelta, timezone

MAX_KEY_LIFETIME = timedelta(days=7)


async def custom_key_policy_fn(policy_request) -> dict:
    expires = policy_request.effective_key.expires
    if expires is None or expires > datetime.now(timezone.utc) + MAX_KEY_LIFETIME:
        return {
            "decision": False,
            "message": f"This violates LiteLLM Proxy Rules. Keys must expire within {MAX_KEY_LIFETIME.days} days.",
        }
    return {"decision": True}
```

#### 2. 傳入檔案路徑（相對於 config.yaml） {#2-pass-the-filepath-relative-to-the-configyaml-2}

```yaml
general_settings:
  custom_key_policy: custom_auth.custom_key_policy_fn
```

此 hook 會在 `/key/generate`、`/key/service-account/generate`、`/key/update`、`/key/bulk_update`、`/team/key/bulk_update` 與 `/key/{key}/regenerate` 上執行，涵蓋 Admin UI 的建立、編輯與重新產生金鑰流程。它會在請求驗證之後執行，且在 generate 時，於 `default_key_generate_params` 與 `upperbound_key_generate_params` 套用之後、寫入金鑰之前執行，因此如果政策允許操作，`effective_key` 就是資料庫會保存的內容。

`custom_key_generate` 與 `custom_key_update` 可維持不變地繼續運作。當它們與 `custom_key_policy` 一起設定時，會先針對原始請求執行，而且各自都可以單獨拒絕；接著政策會在有效的金鑰狀態上執行。這三者可以同時設定：

```yaml
general_settings:
  custom_key_generate: custom_auth.custom_generate_key_fn
  custom_key_update: custom_auth.custom_update_key_fn
  custom_key_policy: custom_auth.custom_key_policy_fn
```

### 強制執行 key_alias 命名模式 {#enforce-a-key_alias-naming-pattern}

將 `litellm_settings.key_alias_pattern` 設為正規表示式，送往 `/key/generate`、`/key/service-account/generate`、`/key/update` 與 `/key/{key}/regenerate` 的每個 `key_alias` 都必須符合它，這涵蓋了 Admin UI 的建立、編輯與重新產生金鑰流程。整個別名都必須符合（Python `re.fullmatch`），因此 `team-[a-z]+` 會接受 `team-search` 並拒絕 `team-search-2`。別名在套用樣式前會先被限制為最多 255 個字元，因此即使有回溯效率很差的樣式，也永遠不會看到無界限的別名

```yaml
litellm_settings:
  key_alias_pattern: "^[a-z0-9]+(-[a-z0-9]+)*$"
```

別名不符合的請求會以 `400` 失敗，並指出該樣式：

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"key_alias": "Prod Key"}'
```

```json
{"error": {"message": "Invalid key_alias format. Must be at most 255 characters and match the configured key_alias_pattern: ^[a-z0-9]+(-[a-z0-9]+)*$", "type": "bad_request_error", "param": "key_alias", "code": "400"}}
```

`key_alias_pattern` 會取代 `enable_key_alias_format_validation` 開啟的內建規則，所以兩者擇一設定即可。保留 `key_alias` 不變的更新或重新產生不會被檢查，因此在樣式設定之前建立的金鑰仍然可以編輯，而一旦別名變更，該樣式就會立即套用。不論樣式允許什麼，別名中的路徑遍歷與控制字元都會被拒絕。無法編譯的樣式會使代理程式啟動失敗，並出現 `Invalid regex set for litellm_settings.key_alias_pattern`

### /key/generate 參數上限 {#upperbound-keygenerate-params}
如果您需要為每個 key 設定 `max_budget`、`budget_duration` 或任何 `key/generate` 參數的預設上限，請使用此項。 

設定 `litellm_settings:upperbound_key_generate_params`：
```yaml
litellm_settings:
  upperbound_key_generate_params:
    max_budget: 100 # Optional[float], optional): upperbound of $100, for all /key/generate requests
    budget_duration: "10d" # Optional[str], optional): upperbound of 10 days for budget_duration values
    duration: "30d" # Optional[str], optional): upperbound of 30 days for all /key/generate requests
    max_parallel_requests: 1000 # (Optional[int], optional): Max number of requests that can be made in parallel. Defaults to None.
    tpm_limit: 1000 #(Optional[int], optional): Tpm limit. Defaults to None.
    rpm_limit: 1000 #(Optional[int], optional): Rpm limit. Defaults to None.
```

** 預期行為 **

- 傳送一個帶有 `max_budget=200` 的 `/key/generate` 請求
- 請求會以 HTTP 400 被拒絕：`max_budget is over max limit set in config - user_value=200; max_value=100`。高於上限的值不會被截斷。對 `max_parallel_requests`、`tpm_limit`、`rpm_limit` 也是如此，且對長度超過已設定上限的 `duration` / `budget_duration` 亦同
- 省略 `budget_duration`，或將其傳送為 `null`：此 key 會以 `budget_duration="10d"` 建立。上限值同時也會作為預設值，且無法選擇不套用

### 預設 /key/generate 參數 {#default-keygenerate-params}
如果您需要控制每個 key 的預設 `max_budget` 或任何 `key/generate` 參數，請使用此項。 

當 `/key/generate` 請求未指定 `max_budget` 時，會使用在 `default_key_generate_params` 中指定的 `max_budget`。這些預設值會補入請求中任何缺少或 `null` 的欄位。`budget_duration` 是唯一例外：傳送明確的 `"budget_duration": null` 會建立一個其預算永不重置的 key，並略過已設定的預設值（`upperbound_key_generate_params` 仍然適用）。

設定 `litellm_settings:default_key_generate_params`：
```yaml
litellm_settings:
  default_key_generate_params:
    max_budget: 1.5000
    models: ["azure-gpt-3.5"]
    duration:     # blank means `null`
    metadata: {"setting":"default"}
    team_id: "core-infra"
```

### ✨ 金鑰輪替 {#-key-rotations}

<EnterpriseFeature />

輪換現有的 API Key，並可選擇同時更新其參數。

```bash

curl 'http://localhost:4000/key/sk-<virtual-key>/regenerate' \
  -X POST \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "max_budget": 100,
    "metadata": {
      "team": "core-infra"
    },
    "models": [
      "{{openai_large}}",
      "{{openai_small}}"
    ],
    "grace_period": "48h"
  }'

```

**寬限期（可選）**：設定 `grace_period`（例如 `"24h"`、`"2d"`、`"1w"`），讓舊 key 在過渡期間仍保持有效。舊 key 和新 key 都會運作，直到寬限期結束，因此您可以在不中斷正式環境的情況下切換。省略或留空 = 立即撤銷。也可以透過 `LITELLM_KEY_ROTATION_GRACE_PERIOD` 環境變數設定，用於排程輪換。

**進一步閱讀**

- [將輪換後的 key 寫入 secrets manager](https://docs.litellm.ai/docs/secret#aws-secret-manager)

[**👉 API 參考文件**](https://docs.litellm.ai/api-reference/#/key%20management/regenerate_key_fn_key__key__regenerate_post)

### 排程金鑰輪替 {#scheduled-key-rotations}

LiteLLM 可以根據您定義的時間間隔**自動輪換虛擬 key**。

#### 必要條件 {#prerequisites}

1. **需要資料庫連線** - key 輪換需要已連線的資料庫來追蹤輪換排程
2. **啟用輪換工作程序** - 設定環境變數 `LITELLM_KEY_ROTATION_ENABLED=true`
3. **設定檢查間隔** - 可選地設定 `LITELLM_KEY_ROTATION_CHECK_INTERVAL_SECONDS`（預設：86400 秒／24 小時）

#### 運作方式 {#how-it-works}

1. 建立虛擬 key 時，設定 `auto_rotate: true` 與 `rotation_interval`（持續時間字串）
2. LiteLLM 將下一次輪換時間計算為 `now + rotation_interval`，並將其儲存在資料庫中
3. 背景工作會定期檢查已到輪換時間的 key
4. 當 key 到達輪換時機時，LiteLLM 會自動重新產生它，並使舊的 key 字串失效
5. 接著計算新的輪換時間，並持續此循環

#### 建立具備自動輪替的金鑰 {#create-a-key-with-auto-rotation}

**API**
```bash
curl 'http://0.0.0.0:4000/key/generate' \
  -H 'Authorization: Bearer <your-master-key>' \
  -H 'Content-Type: application/json' \
  -d '{
        "models": ["{{openai_large}}"],
        "auto_rotate": true,
        "rotation_interval": "30d"
      }'
```

**LiteLLM UI**

在 LiteLLM UI 中，前往 Keys 頁面，然後點擊 `Create New Key` > `Optional Settings` > `Key Lifecycle` > `Auto-Rotation Settings` > `Enable Auto-Rotation`
<Image 
  img={require('../../img/key_r.png')}
  dark={require('../../img/key_r_dark.png')}
  alt="key 表單的 Key Lifecycle 區段中的自動輪換設定"
  style={{maxWidth: '640px', display: 'block', margin: '0'}}
/>

**有效的 rotation_interval 格式：**
- `"30s"` - 30 秒
- `"30m"` - 30 分鐘
- `"30h"` - 30 小時
- `"30d"` - 30 天
- `"90d"` - 90 天

#### 更新既有金鑰以啟用輪替 {#update-existing-key-to-enable-rotation}

**API**

```bash
curl 'http://0.0.0.0:4000/key/update' \
  -H 'Authorization: Bearer <your-master-key>' \
  -H 'Content-Type: application/json' \
  -d '{
        "key": "sk-existing-key",
        "auto_rotate": true,
        "rotation_interval": "90d"
      }'
```

**LiteLLM UI**

在 LiteLLM UI 中，前往 Keys 頁面。選取您要更新的 key，然後點擊 `Edit Settings` > `Auto-Rotation Settings`

<Image 
  img={require('../../img/key_u.png')}
  dark={require('../../img/key_u_dark.png')}
  alt="key 編輯表單中的自動輪換設定"
  style={{maxWidth: '640px', display: 'block', margin: '0'}}
/>

#### 環境變數 {#environment-variables}

在啟動 proxy 時設定這些環境變數：

| 變數 | 說明 | 預設值 |
|----------|-------------|---------|
| `LITELLM_KEY_ROTATION_ENABLED` | 啟用輪換工作程序 | `false` |
| `LITELLM_KEY_ROTATION_CHECK_INTERVAL_SECONDS` | 多久掃描一次要輪換的 key（以秒為單位） | `86400`（24 小時） |
| `LITELLM_KEY_ROTATION_GRACE_PERIOD` | 輪換後讓舊 key 保持有效的期間（例如 `24h`、`2d`） | `""`（立即撤銷） |

**範例：**
```bash
export LITELLM_KEY_ROTATION_ENABLED=true
export LITELLM_KEY_ROTATION_CHECK_INTERVAL_SECONDS=3600  # Check every hour
export LITELLM_KEY_ROTATION_GRACE_PERIOD=48h  # Keep old key valid for 48h during cutover

litellm --config config.yaml
```

### 暫時性預算增加 {#temporary-budget-increase}

使用 `/key/update` 端點來增加現有 key 的預算。`temp_budget_expiry` 是 datetime，而不是持續時間字串，因此請傳入 ISO 日期，例如 `2026-10-15`。詳情請參閱[暫時增加預算](./temporary_budget_increase.md)。

```bash
curl -L -X POST 'http://localhost:4000/key/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{"key": "sk-b3Z3Lqdb_detHXSUp4ol4Q", "temp_budget_increase": 100, "temp_budget_expiry": "2026-10-15"}'
```

[API 參考](https://docs.litellm.ai/api-reference/#/key%20management/update_key_fn_key_update_post)

### 限制金鑰產生 {#restricting-key-generation}

使用此項來控制誰可以產生 key。當讓其他人在 UI 上建立 key 時很有用。 

```yaml
litellm_settings:
  key_generation_settings:
    team_key_generation:
      allowed_team_member_roles: ["admin"]
      required_params: ["tags"] # require team admins to set tags for cost-tracking when generating a team key
    personal_key_generation: # maps to 'Default Team' on UI 
      allowed_user_roles: ["proxy_admin"]
```

#### 規格 {#spec}

```python
key_generation_settings: Optional[StandardKeyGenerationConfig] = None
```

#### 型別 {#types}

```python
class StandardKeyGenerationConfig(TypedDict, total=False):
    team_key_generation: TeamUIKeyGenerationConfig
    personal_key_generation: PersonalUIKeyGenerationConfig

class TeamUIKeyGenerationConfig(TypedDict):
    allowed_team_member_roles: List[str] # either 'user' or 'admin'
    required_params: List[str] # require params on `/key/generate` to be set if a team key (team_id in request) is being generated


class PersonalUIKeyGenerationConfig(TypedDict):
    allowed_user_roles: List[LitellmUserRoles] 
    required_params: List[str] # require params on `/key/generate` to be set if a personal key (no team_id in request) is being generated


class LitellmUserRoles(str, enum.Enum):
    """
    Admin Roles:
    PROXY_ADMIN: admin over the platform
    PROXY_ADMIN_VIEW_ONLY: can login, view all own keys, view all spend
    ORG_ADMIN: admin over a specific organization, can create teams, users only within their organization

    Internal User Roles:
    INTERNAL_USER: can login, view/create/delete their own keys, view their spend
    INTERNAL_USER_VIEW_ONLY: can login, view their own keys, view their own spend


    Team Roles:
    TEAM: used for JWT auth


    Customer Roles:
    CUSTOMER: External users -> these are customers

    """

    # Admin Roles
    PROXY_ADMIN = "proxy_admin"
    PROXY_ADMIN_VIEW_ONLY = "proxy_admin_viewer"

    # Organization admins
    ORG_ADMIN = "org_admin"

    # Internal User Roles
    INTERNAL_USER = "internal_user"
    INTERNAL_USER_VIEW_ONLY = "internal_user_viewer"

    # Team Roles
    TEAM = "team"

    # Customer Roles - External users of proxy
    CUSTOMER = "customer"
```


## **後續步驟 - 設定預算、每個虛擬金鑰的速率限制** {#next-steps---set-budgets-rate-limits-per-virtual-key}

[請依照此文件設定 LiteLLM 的預算與每個 virtual key 的 rate limiter](users)

## 端點參考（規格） {#endpoint-reference-spec}

### 金鑰 {#keys}

#### [**👉 API 參考文件**](https://docs.litellm.ai/api-reference/#/key%20management/) {#-api-reference-docs}

### 使用者 {#users}

#### [**👉 API 參考文件**](https://docs.litellm.ai/api-reference/#/Internal%20User%20management/) {#-api-reference-docs-1}

### 團隊 {#teams}

#### [**👉 API 參考文件**](https://docs.litellm.ai/api-reference/#/team%20management) {#-api-reference-docs-2}
