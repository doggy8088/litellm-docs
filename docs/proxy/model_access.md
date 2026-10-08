import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 限制模型存取 {#restrict-model-access}

## **依 Virtual Key 限制模型** {#restrict-models-by-virtual-key}

使用 `models` 參數為金鑰設定允許的模型

`models` 清單同時會將模型從 `GET /v1/models` 中隱藏，並阻擋對該模型的呼叫。若要在不阻擋呼叫的情況下，將模型從列出端點中隱藏，請改為在該模型上設定 `model_info.discoverable: false`（[將模型從 `/v1/models` 中隱藏](./model_discovery#hide-a-model-from-v1models)）

```shell
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["{{openai_small}}", "{{openai_large}}"]}'
```

:::info

此金鑰只能對 `models` 發出 `{{openai_small}}` 或 `{{openai_large}}` 的請求

:::

請透過以下方式確認設定正確

<Tabs>
<TabItem label="允許的存取" value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>

<TabItem label="不允許的存取" value = "not-allowed">

:::info

預期這會失敗，因為 claude-sonnet-5 不在所產生金鑰的 `models` 中

:::

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{anthropic}}",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>

</Tabs>

### [API 參考](https://docs.litellm.ai/api-reference/#/key%20management/generate_key_fn_key_generate_post) {#api-reference}

## **依 `team_id` 限制模型** {#restrict-models-by-team_id}
`litellm-dev` 只能存取 `azure-gpt-3.5`

**1. 透過 `/team/new` 建立團隊**
```shell
curl --location 'http://localhost:4000/team/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "team_alias": "litellm-dev",
  "models": ["azure-gpt-3.5"]
}' 

# returns {...,"team_id": "my-unique-id"}
```

**2. 為團隊建立金鑰**
```shell
curl --location 'http://localhost:4000/key/generate' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--header 'Content-Type: application/json' \
--data-raw '{"team_id": "my-unique-id"}'
```

**3. 測試**
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-qo992IjKOC2CHKZGRoJIGA' \
    --data '{
        "model": "BEDROCK_GROUP",
        "messages": [
            {
                "role": "user",
                "content": "hi"
            }
        ]
    }'
```

```shell
{"error":{"message":"Invalid model for team litellm-dev: BEDROCK_GROUP.  Valid models for team are: ['azure-gpt-3.5']\n\n\nTraceback (most recent call last):\n  File \"/Users/ishaanjaffer/Github/litellm/litellm/proxy/proxy_server.py\", line 2298, in chat_completion\n    _is_valid_team_configs(\n  File \"/Users/ishaanjaffer/Github/litellm/litellm/proxy/utils.py\", line 1296, in _is_valid_team_configs\n    raise Exception(\nException: Invalid model for team litellm-dev: BEDROCK_GROUP.  Valid models for team are: ['azure-gpt-3.5']\n\n","type":"None","param":"None","code":500}}%            
```

### [API 參考](https://docs.litellm.ai/api-reference/#/team%20management/new_team_team_new_post) {#api-reference-1}

## **檢視可用的備援模型** {#view-available-fallback-models}

使用 `/v1/models` 端點來探索給定模型可用的備援模型。這有助於您了解當主要模型無法使用或受到限制時，可用哪些備援模型。

:::info[擴充點]

`include_metadata` 參數可作為未來公開其他模型中繼資料的擴充點。目前重點在備援模型，但此作法將擴充以納入其他模型中繼資料，例如定價資訊、功能、速率限制等。

:::

### 基本用法 {#basic-usage}

取得所有可用模型：

```shell
curl -X GET 'http://localhost:4000/v1/models' \
  -H 'Authorization: Bearer <your-api-key>'
```

### 取得含中繼資料的備援模型 {#get-fallback-models-with-metadata}

加入中繼資料以查看備援模型資訊：

```shell
curl -X GET 'http://localhost:4000/v1/models?include_metadata=true' \
  -H 'Authorization: Bearer <your-api-key>'
```

### 取得特定類型的備援 {#get-specific-fallback-types}

您可以指定想查看的備援類型：

<Tabs>
<TabItem value="general" label="一般備援">

```shell
curl -X GET 'http://localhost:4000/v1/models?include_metadata=true&fallback_type=general' \
  -H 'Authorization: Bearer <your-api-key>'
```

一般備援是可處理相同類型請求的替代模型。

</TabItem>

<TabItem value="context_window" label="上下文視窗備援">

```shell
curl -X GET 'http://localhost:4000/v1/models?include_metadata=true&fallback_type=context_window' \
  -H 'Authorization: Bearer <your-api-key>'
```

上下文視窗備援是具有更大上下文視窗的模型，當主要模型的上下文限制被超出時可處理請求。

</TabItem>

<TabItem value="content_policy" label="內容政策備援">

```shell
curl -X GET 'http://localhost:4000/v1/models?include_metadata=true&fallback_type=content_policy' \
  -H 'Authorization: Bearer <your-api-key>'
```

內容政策備援是可在主要模型因安全政策而拒絕內容時處理請求的模型。

</TabItem>

</Tabs>

### 範例回應 {#example-response}

當指定 `include_metadata=true` 時，每個模型都會帶有一個 `metadata.fallbacks` 清單，且只對單一備援類型生效，也就是 `fallback_type` 所指定的類型（若省略則為 `general`）。若要查看全部三種型別，請針對每個 `fallback_type` 各送出一個請求：

```json
{
  "data": [
    {
      "id": "{{openai_large}}",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai",
      "metadata": {
        "fallbacks": ["{{openai_small}}", "{{anthropic}}"]
      }
    }
  ]
}
```

### 使用案例 {#use-cases}

- **高可用性**：找出備援模型以確保服務持續性
- **成本最佳化**：在主要模型價格較高時尋找更便宜的替代方案
- **內容篩選**：探索具有不同內容政策的模型
- **上下文長度**：尋找可處理更大輸入的模型
- **負載平衡**：將請求分散到多個相容模型

### API 參數 {#api-parameters}

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `include_metadata` | boolean | 包含額外的模型中繼資料，包括備援 |
| `fallback_type` | string | 要在 `metadata.fallbacks` 中回傳哪一種備援：`general`（預設）、`context_window`，或 `content_policy`。任何其他值都會回傳 400 |

## **在時間區間內為團隊保留部署** {#reserve-a-deployment-for-a-team-during-a-time-window}

在部署上設定 `model_info.access_windows`，即可在每日的本地時間區間內將其保留給特定團隊。當區間啟用時，路由器只會將該部署提供給其金鑰屬於所列團隊之一的請求；來自其他團隊的請求，以及來自沒有團隊的金鑰（包含 master key）的請求，會路由到同一模型群組中的其他部署，或在所有候選項都已保留時以 `400` 拒絕。區間之外，路由維持不變。部署會一直列在 `/v1/models` 和 `/model/info` 中。

```yaml
model_list:
  - model_name: gpt-4o-ptu
    litellm_params:
      model: azure/gpt-4o-ptu
      api_base: os.environ/AZURE_PTU_BASE
      api_key: os.environ/AZURE_PTU_KEY
    model_info:
      access_windows:
        - start: "22:00"
          end: "06:00"
          timezone: "America/New_York"
          team_ids: ["team-nightly-batch"]
```

`start` 和 `end` 是指定 IANA `timezone` 中的 `HH:MM` 牆鐘時間（會自動套用日光節約時間）。`start` 為包含，`end` 為不包含；晚於 `end` 的 `start` 表示區間會跨越午夜。部署可以列出多個區間；只要其中任何一個啟用，就視為已保留。當某個區間具有無效時間、未知時區、空的 `team_ids`，或相同的 `start` 與 `end` 時，proxy 會拒絕啟動。

被拒絕的請求如下所示：

```json
{"error":{"message":"litellm.BadRequestError: Deployment gpt-4o-ptu is reserved for another team until 06:00 America/New_York","type":"invalid_request_error","param":null,"code":"400"}}
```

## 進階：模型存取群組 {#advanced-model-access-groups}

對於進階使用案例，請使用 [模型存取群組](./model_access_groups) 動態分組多個模型，並在不重新啟動 proxy 的情況下管理存取。

## [基於角色的存取控制（RBAC）](./jwt_auth_arch) {#role-based-access-control-rbac}
