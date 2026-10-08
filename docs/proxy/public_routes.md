import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 控制公開與私人路由 {#control-public--private-routes}

<EnterpriseFeature />

控制哪些路由需要驗證，以及哪些路由可公開存取。

## 路由類型 {#route-types}

| 路由類型 | 需要驗證 | 說明 |
|------------|---------------|-------------|
| `public_routes` | 否 | 無需任何驗證即可存取的路由 |
| `admin_only_routes` | 是（僅限管理員） | 僅可由 [Proxy 管理員](./self_serve#available-roles) 存取的路由 |
| `allowed_routes` | 是 | 在 proxy 上公開的路由精確比對清單。若未設定，所有路由都會公開 |

## 快速開始 {#quick-start}

### 將路由設為公開 {#make-routes-public}

允許特定路由在未經驗證的情況下存取：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  public_routes: ["LiteLLMRoutes.public_routes", "/spend/calculate"]
```

### 將路由限制為僅限管理員 {#restrict-routes-to-admin-only}

將某些路由限制為僅能由 Proxy 管理員存取：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  admin_only_routes: ["/key/generate", "/key/delete"]
```

### 限制可用路由 {#limit-available-routes}

只在 proxy 上公開特定路由：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  allowed_routes: ["/chat/completions", "/embeddings"]
```

`allowed_routes` 是在公開路由檢查之前檢查的精確比對清單，因此像 `LiteLLMRoutes.public_routes` 這類路由群組名稱與萬用字元不會在此展開。任何未列出且會經過驗證的路由，例如 `/routes` 或 `/models`，都會回傳 `403 Route ... not allowed`。未經驗證的端點，例如 `/health/liveliness` 和 `/health/readiness`，不受 `allowed_routes` 影響，並且仍可存取。請列出所有必須保持可存取的已驗證路由。

## 使用範例 {#usage-examples}

### 定義公開、僅限管理員與允許的路由 {#define-public-admin-only-and-allowed-routes}

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  public_routes: ["LiteLLMRoutes.public_routes", "/spend/calculate"]
  admin_only_routes: ["/key/generate"]
  allowed_routes: ["/chat/completions", "/spend/calculate"]
```

`LiteLLMRoutes.public_routes` 在 `public_routes` 中是指 LiteLLM 的預設公開路由，這些路由在未被列出的情況下仍會保持公開。[檢視來源](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/_types.py)。它不會在 `allowed_routes` 中展開。

### 測試 {#testing}

<Tabs>

<TabItem value="public" label="測試 public_routes">

```shell
curl --request POST \
  --url 'http://localhost:4000/spend/calculate' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hey, how'\''s it going?"}]
  }'
```

此端點可在沒有 `Authorization` 標頭的情況下運作。

</TabItem>

<TabItem value="admin_only_routes" label="測試 admin_only_routes">

**成功的請求（管理員）**

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data '{}'
```

**不成功的請求（非管理員）**

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <virtual-key-from-non-admin>' \
--header 'Content-Type: application/json' \
--data '{"user_role": "internal_user"}'
```

**預期回應**

```json
{
  "error": {
    "message": "user not allowed to access this route. Route=/key/generate is an admin only route",
    "type": "auth_error",
    "param": "None",
    "code": "403"
  }
}
```

</TabItem>

<TabItem value="allowed_routes" label="測試 allowed_routes">

**成功的請求**

```shell
curl http://localhost:4000/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
"model": "fake-openai-endpoint",
"messages": [
    {"role": "user", "content": "Hello, Claude"}
]
}'
```

**不成功的請求（路由不允許）**

```shell
curl --location 'http://0.0.0.0:4000/embeddings' \
--header 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
"model": "text-embedding-ada-002",
"input": ["write a litellm poem"]
}'
```

**預期回應**

```json
{
  "error": {
    "message": "Route /embeddings not allowed",
    "type": "auth_error",
    "param": "None",
    "code": "403"
  }
}
```

</TabItem>

</Tabs>

## 進階：萬用字元模式 {#advanced-wildcard-patterns}

使用萬用字元模式一次比對多個路由。

### 語法 {#syntax}

| 模式 | 說明 | 範例 |
|---------|-------------|---------|
| `/path/*` | 比對任何以 `/path/` 開頭的路由 | `/api/*` 比對 `/api/users`、`/api/users/123` |

### 範例 {#examples}

#### 將某一路徑下的所有路由設為公開 {#make-all-routes-under-a-path-public}

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  public_routes:
    - "LiteLLMRoutes.public_routes"
    - "/api/v1/*"      # All routes under /api/v1/
    - "/health/*"       # All health check routes
```

#### 僅限管理員的路由不支援萬用字元 {#admin-only-routes-do-not-support-wildcards}

`admin_only_routes` 是一份精確比對清單。像 `/key/*` 這樣的模式不會匹配任何內容，因此請逐一明確列出每個路由：

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  admin_only_routes:
    - "/key/generate"
    - "/key/delete"
```

### 測試萬用字元路由 {#testing-wildcard-routes}

**設定：**
```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  public_routes:
    - "/public/*"
```

**測試：**
```shell
# This works without auth (matches /public/*)
curl http://localhost:4000/public/status

# This also works without auth (matches /public/*)
curl http://localhost:4000/public/health/detailed

# This requires auth (doesn't match /public/*)
curl http://localhost:4000/private/data
```
