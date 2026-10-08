# 模型探索 {#model-discovery}

在針對 wildcard 模型呼叫 `/v1/models` 時，使用此功能可提供使用者一份在提供者端點後方可用的模型準確清單。

## 支援的模型 {#supported-models}

- Fireworks AI
- OpenAI
- Gemini
- LiteLLM Proxy
- Topaz
- Anthropic
- XAI
- VLLM
- Vertex AI
- Eden AI

### 使用方式 {#usage}

**1. 設定 config.yaml**

```yaml
model_list:
    - model_name: xai/*
      litellm_params:
        model: xai/*
        api_key: os.environ/XAI_API_KEY

litellm_settings:
    check_provider_endpoint: true # 👈 Enable checking provider endpoint for wildcard models
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 呼叫 `/v1/models`**

```bash
curl -X GET "http://localhost:4000/v1/models" -H "Authorization: Bearer $LITELLM_KEY"
```

預期的回應

```json
{
    "data": [
        {
            "id": "xai/grok-2-1212",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-2-vision-1212",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-3-beta",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-3-fast-beta",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-3-mini-beta",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-3-mini-fast-beta",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-beta",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-vision-beta",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        },
        {
            "id": "xai/grok-2-image-1212",
            "object": "model",
            "created": 1677610602,
            "owned_by": "openai"
        }
    ],
    "object": "list"
}
```

## 哪些金鑰探索會使用 {#which-key-discovery-uses}

探索會使用 wildcard deployment 自身的憑證呼叫提供者：其 `api_base`，以及其 `api_key`；若未設定，則使用 proxy 主機上的提供者環境變數。對於指向自訂 Anthropic 相容閘道的 deployment，LiteLLM 會以 `x-api-key` 設定為該金鑰的 `<api_base>/v1/models`，並在 wildcard 前綴下列出每個回傳的 id，例如 `my-gateway/claude-sonnet-4-5`

```yaml
model_list:
  - model_name: "my-gateway/*"
    litellm_params:
      model: "anthropic/*"
      api_base: "https://gateway.example.com/anthropic"
      api_key: os.environ/GATEWAY_SERVICE_TOKEN # used for discovery, and as the fallback when a request has no key

general_settings:
  forward_llm_provider_auth_headers: true

litellm_settings:
  check_provider_endpoint: true
```

該清單反映的是那一把金鑰的存取權限。請求者在 `/v1/models` 請求上轉送的提供者金鑰（請參閱 [轉送 LLM 提供者驗證標頭](./forward_client_headers.md#forward-llm-provider-authentication-headers)）不會用於探索，因此自己的金鑰可看到不同模型的使用者，全都會得到相同的清單，而且清單中的模型仍可能會因特定使用者的金鑰而失敗。當 deployment 金鑰與環境變數都未設定時，wildcard 路由不會新增任何內容到 `/v1/models`

## 將模型從 `/v1/models` 隱藏 {#hide-a-model-from-v1models}

在 `model_list` 項目上設定 `model_info.discoverable: false`，即可將其排除於清單端點之外，同時仍可由任何其金鑰允許的對象呼叫。這適用於聊天用戶端的模型選擇器不應提供的模型，例如僅由您自己的服務呼叫的 embedding、classifier 或 evaluator 模型。像 Claude Code（`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`）與 Open WebUI 這類用戶端會從 `GET /v1/models` 填入其選擇器，而且多數不會依 capability 篩選

```yaml
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: embedding
      discoverable: false   # callable by name, absent from /v1/models
```

使用該設定時，一般 virtual key 從 `GET /v1/models`（以及 `/models`，在 OpenAI 與 Anthropic 兩種回應格式中皆然）只會收到 `{{anthropic}}`，從 `GET /v1/model/info`（以及 `/model/info`）也是如此，從 `GET /model_group/info` 亦同，而 `POST /v1/embeddings` 搭配 `"model": "text-embedding-3-small"` 仍會完全照舊運作

```bash
curl -s http://localhost:4000/v1/models -H "Authorization: Bearer $LITELLM_KEY" | jq '.data[].id'
# "{{anthropic}}"

curl -s http://localhost:4000/v1/embeddings -H "Authorization: Bearer $LITELLM_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model": "text-embedding-3-small", "input": "still callable"}' | jq '.data[0].embedding | length'
# 1536
```

此旗標只會變更清單端點所宣告的內容。任何在任何端點上指定該模型的請求，仍一律受相同的金鑰與團隊 `models` allowlists 約束，而 `GET /v1/models/{model}` 仍會回傳該模型，因此依名稱驗證所給模型的用戶端仍可正常運作。Proxy 管理員（`proxy_admin` 與 `proxy_admin_viewer` 角色，包括 master key）仍會在每個清單端點看到該模型，因此 Admin UI 與 `GET /v1/models?scope=expand` 會持續顯示完整清單

只要某個模型群組的至少一個 deployment 仍可被探索，該群組就會保持列出。將旗標設定在 wildcard 項目上，例如 `claude-*`，會隱藏該項目展開出的所有模型。保留該欄位不填則表示可被探索，因此既有設定不會改變

若要阻止金鑰呼叫某個模型，而不只是將其隱藏，請使用該金鑰或團隊的 `models` 清單（[限制模型存取](./model_access)）。若要隱藏 `model_group_alias` 而不是 `model_list` 項目，請使用 alias 的 `hidden` 旗標（[隱藏 Alias 模型](./load_balancing#hide-alias-models)）
