# Oauth 2.0 驗證 {#oauth-20-authentication}

如果您想使用 Oauth2.0 token 來對 LiteLLM Proxy 發出 `/chat`、`/embeddings` 請求，請使用這個功能

:::info

這是企業功能 - [如果您想要免費試用以測試這項功能是否符合您的需求，請與我們聯絡]((https://enterprise.litellm.ai/demo))

:::

## 用法  {#usage}

1. 設定環境變數：

```bash
export OAUTH_TOKEN_INFO_ENDPOINT="https://your-provider.com/token/info"
export OAUTH_USER_ID_FIELD_NAME="sub"
export OAUTH_USER_ROLE_FIELD_NAME="role"
export OAUTH_USER_TEAM_ID_FIELD_NAME="team_id"
```

- `OAUTH_TOKEN_INFO_ENDPOINT`：用於驗證 OAuth tokens 的 URL
- `OAUTH_USER_ID_FIELD_NAME`：token 資訊回應中包含使用者 ID 的欄位
- `OAUTH_USER_ROLE_FIELD_NAME`：token 資訊中使用者角色的欄位
- `OAUTH_USER_TEAM_ID_FIELD_NAME`：token 資訊中使用者 team ID 的欄位

2. 在 litellm config.yaml 中啟用

在您的 config.yaml 中設定這個

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

general_settings: 
  master_key: sk-1234
  enable_oauth2_auth: true
```

3. 在對 LiteLLM 的請求中使用 token 

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```

## 疑難排解  {#debugging}

以 [`--detailed_debug` 模式啟動 LiteLLM Proxy，您應該會看到更詳細的記錄](cli.md#detailed_debug)

## 同時使用 OAuth2 + JWT {#using-oauth2--jwt-together}

LiteLLM 支援兩種 OAuth2 + JWT 模式：

1. **全域 OAuth2 模式** (`enable_oauth2_auth: true`)  
   在 LLM + info 路由上啟用 OAuth2 驗證。
2. **選擇性 JWT 覆寫模式** (`enable_oauth2_auth: false`)  
   只有符合 `litellm_jwtauth.routing_overrides` 的 JWT 形式 token，才會在 LLM + info 路由上導向 OAuth2。

若要進行選擇性路由（僅針對特定 JWT 使用 OAuth2），請設定：

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  enable_oauth2_auth: false
  litellm_jwtauth:
    routing_overrides:
      - iss: "machine-issuer.example.com"
        client_id: "MID_LITELLM"
        path: "oauth2"
```

選擇器支援 shell-style 萬用字元（`*`、`?`、區分大小寫），且可接受單一字串或字串清單。

關於完整的 `routing_overrides` 行為——支援的選擇器、萬用字元與清單語意，以及比對規則——請參閱 [`/proxy/token_auth`](./token_auth.md#route-jwt-shaped-machine-tokens-to-oauth2)。
