# [已淘汰] 依團隊路由 {#deprecated-team-based-routing}

:::info

此功能已淘汰，請改用 [依標籤路由](./tag_routing.md)

:::

## 路由 {#routing}
根據 team-id 將呼叫路由到不同的模型群組

### 依模型群組的設定  {#config-with-model-group}

建立一個包含 2 個模型群組加上已連線的 postgres db 的 config.yaml

```yaml
model_list: 
  - model_name: gpt-3.5-turbo-eu # 👈 Model Group 1
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE_EU
      api_key: os.environ/AZURE_API_KEY_EU
      api_version: "2023-07-01-preview"
  - model_name: gpt-3.5-turbo-worldwide # 👈 Model Group 2
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"

general_settings: 
    master_key: sk-1234
    database_url: "postgresql://..." # 👈 Connect proxy to DB
```

啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

### 使用模型別名建立團隊 {#create-team-with-model-alias}

```bash
curl --location 'http://0.0.0.0:4000/team/new' \
--header 'Authorization: Bearer sk-1234' \ # 👈 Master Key
--header 'Content-Type: application/json' \
--data '{
  "team_alias": "my-new-team_4",
  "model_aliases": {"gpt-3.5-turbo": "gpt-3.5-turbo-eu"}
}'

# Returns team_id: my-team-id
```

### 建立團隊金鑰  {#create-team-key}

```bash 
curl --location 'http://localhost:4000/key/generate' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "team_id": "my-team-id",  # 👈 YOUR TEAM ID
}'
```

### 使用別名呼叫模型  {#call-model-with-alias}

```bash
curl --location 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-A1L0C3Px2LJl53sF_kTF9A' \
--data '{
  "model": "gpt-3.5-turbo", # 👈 MODEL 
  "messages": [{"role": "system", "content": "You'\''re an expert at writing poems"}, {"role": "user", "content": "Write me a poem"}, {"role": "user", "content": "What'\''s your name?"}],
  "user": "usha"
}'
```
