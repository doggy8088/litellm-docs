# ✨ 允許團隊新增模型 {#-allow-teams-to-add-models}

:::info

這是企業版功能。
[企業版定價](https://www.litellm.ai/#pricing)

[在這裡聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

允許團隊為該專案新增自己的模型／金鑰——如此一來，任何他們發出的 OpenAI 呼叫都會使用他們自己的 OpenAI 金鑰。

適合想要呼叫自己微調模型的團隊。

## 在 `/model/add` 端點指定團隊 ID {#specify-team-id-in-modeladd-endpoint}

```bash
curl -L -X POST 'http://0.0.0.0:4000/model/new' \
-H 'Authorization: Bearer sk-******2ql3-sm28WU0tTAmA' \ # 👈 Team API Key (has same 'team_id' as below)
-H 'Content-Type: application/json' \
-d '{
  "model_name": "my-team-model", # 👈 Call LiteLLM with this model name
  "litellm_params": {
    "model": "openai/gpt-4o",
    "custom_llm_provider": "openai",
    "api_key": "******ccb07",
    "api_base": "https://my-azure-endpoint.openai.azure.com",
    "api_version": "2023-12-01-preview"
  },
  "model_info": {
    "team_id": "e59e2671-a064-436a-a0fa-16ae96e5a0a1" # 👈 Specify the team ID it belongs to
  }
}'

```

## 測試它！ {#test-it}

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-******2ql3-sm28WU0tTAmA' \ # 👈 Team API Key
-d '{
  "model": "my-team-model", # 👈 team model name
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Boston today?"
    }
  ]
}'

```

## 除錯 {#debugging}

### 找不到 'model_name' {#model_name-not-found}

檢查模型別名是否存在於團隊表中。 

```bash
curl -L -X GET 'http://localhost:4000/team/info?team_id=e59e2671-a064-436a-a0fa-16ae96e5a0a1' \
-H 'Authorization: Bearer sk-******2ql3-sm28WU0tTAmA' \
```

**預期回應：**

```json
{
    {
    "team_id": "e59e2671-a064-436a-a0fa-16ae96e5a0a1",
    "team_info": {
        ...,
        "litellm_model_table": {
            "model_aliases": {
                "my-team-model": # 👈 public model name "model_name_e59e2671-a064-436a-a0fa-16ae96e5a0a1_e81c9286-2195-4bd9-81e1-cf393788a1a0" 👈 internally generated model name (used to ensure uniqueness)
            },
            "created_by": "default_user_id",
            "updated_by": "default_user_id"
        }
    },
}
```
