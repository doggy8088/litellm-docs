import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 限制模型存取 {#restrict-model-access}

## **依 Virtual Key 限制模型** {#restrict-models-by-virtual-key}

使用 `models` 參數為金鑰設定允許的模型

```shell
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["gpt-3.5-turbo", "gpt-4"]}'
```

:::info

此金鑰只能對 `models` 發出 `gpt-3.5-turbo` 或 `gpt-4` 的請求

:::

請透過以下方式確認設定正確

<Tabs>
<TabItem label="允許的存取" value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>

<TabItem label="不允許的存取" value = "not-allowed">

:::info

預期這會失敗，因為 gpt-4o 不在為所產生的金鑰設定的 `models` 中

:::

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>

</Tabs>

### [API 參考](https://litellm-api.up.railway.app/#/key%20management/generate_key_fn_key_generate_post) {#api-referencehttpslitellm-apiuprailwayappkey20managementgenerate_key_fn_key_generate_post}

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
--header 'Authorization: Bearer sk-1234' \
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

### [API 參考](https://litellm-api.up.railway.app/#/team%20management/new_team_team_new_post) {#api-referencehttpslitellm-apiuprailwayappteam20managementnew_team_team_new_post}

## **檢視可用的備援模型** {#view-available-fallback-models}

使用 `/v1/models` 端點來探索給定模型可用的備援模型。這有助於您了解當主要模型無法使用或受到限制時，可用哪些備援模型。

:::info 擴充點

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

當指定 `include_metadata=true` 時，回應會包含備援資訊：

```json
{
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai",
      "fallbacks": {
        "general": ["gpt-3.5-turbo", "claude-3-sonnet"],
        "context_window": ["gpt-4-turbo", "claude-3-opus"],
        "content_policy": ["claude-3-haiku"]
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

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `include_metadata` | boolean | 包含額外模型中繼資料，包括備援 |
| `fallback_type` | string | 依類型篩選備援：`general`、`context_window` 或 `content_policy` |

## 進階：模型存取群組 {#advanced-model-access-groups}

對於進階使用案例，請使用 [模型存取群組](./model_access_groups) 動態分組多個模型，並在不重新啟動 proxy 的情況下管理存取。

## [基於角色的存取控制（RBAC）](./jwt_auth_arch) {#role-based-access-control-rbacjwt_auth_arch}
