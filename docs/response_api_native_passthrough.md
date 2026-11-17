# OpenAI 相容提供者的原生 /v1/responses 直通 {#native-v1responses-passthrough-for-openai-compatible-providers}

`litellm_params.model` 以 `openai/` 為前綴的部署，本來就會將 `/v1/responses` 原生送往 `{api_base}/responses`。提供者本身沒有 Responses API 設定的部署（例如 `custom_openai/`、`openai_like/`、`baseten/` 與多數其他 OpenAI 相容提供者），預設會透過 `/v1/chat/completions` 橋接 `/v1/responses`：輸入會被轉換為訊息，chat completion 會再轉換回 Responses 物件，而 Responses 專屬的請求欄位則會被近似處理或丟棄。當伺服器本身提供 `/responses` 時，請將 `/v1/responses` 加入 `model_info.supported_endpoints`，讓請求不經轉換直接轉送。此 opt-in 是依部署讀取的，且不依賴提供者前綴，因此對 `baseten/` 這類具名提供者與 `custom_openai/` 的運作方式相同。<SinceVersion v="1.101.0" />

```yaml
model_list:
  - model_name: my-open-model
    litellm_params:
      model: custom_openai/some-open-model
      api_base: https://inference.example.com/v1
      api_key: os.environ/EXAMPLE_API_KEY
    model_info:
      supported_endpoints: ["/v1/chat/completions", "/v1/responses"]
```

在具名 OpenAI 相容提供者上加上同一行，會保留該提供者的 API base、API 金鑰與成本對照表價格，因此不需要為了取得原生 Responses 而將部署切換為 `custom_llm_provider: openai`：

```yaml
model_list:
  - model_name: glm-5.2
    litellm_params:
      model: baseten/zai-org/GLM-5.2
      api_key: os.environ/BASETEN_API_KEY
    model_info:
      supported_endpoints: ["/v1/chat/completions", "/v1/responses"]
```

啟用此 opt-in 後，送往 proxy 的 `/v1/responses` 請求會以 POST 送往 `{api_base}/responses`（此處為 `https://inference.example.com/v1/responses`），並帶有 `Authorization: Bearer <api_key>`，串流與非串流請求皆然。在 `model_info` 中設有 `mode: responses` 的部署行為相同。未啟用 opt-in 時，部署會繼續透過 `/v1/chat/completions` 橋接，而對該部署的 `/v1/chat/completions` 呼叫不論是否啟用都不受影響。`/v1/messages` 與 `/v1/responses` 的 opt-in 彼此獨立：當伺服器兩者都提供時，請兩者都列出，請參閱 [原生 /v1/messages 直通](./anthropic_unified/native_passthrough.md)

```bash
curl http://0.0.0.0:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "my-open-model", "input": "Say hi in three words"}'
```

## 無狀態後端上的 `previous_response_id` {#previous_response_id-on-stateless-backends}

原生路徑會將 `previous_response_id` 原樣轉送給後端，由後端負責解析。不儲存回應的 OpenAI 相容伺服器會拒絕它，通常回應 400，且該錯誤會原樣傳回給呼叫者。面對這類後端，您可以選擇在每一輪都於 `input` 中送出完整對話歷史，或關閉 opt-in，改用搭配 `store_prompts_in_spend_logs: true` 的橋接路徑，讓 LiteLLM 從自身的支出記錄中解析 `previous_response_id`

| 部署 `model` | 啟用 opt-in 時的 `/v1/responses` | 未啟用時的 `/v1/responses` |
|---|---|---|
| `openai/<model>` | 原生 | 原生 |
| `custom_openai/<model>` | 原生直通 | 透過 `/v1/chat/completions` 橋接 |
| `baseten/<model>` 與其他本身沒有 Responses API 設定的 OpenAI 相容提供者 | 原生直通 | 透過 `/v1/chat/completions` 橋接 |

有些具名 OpenAI 相容提供者（例如 `hosted_vllm/`）本身就提供 Responses API 支援，不需要 opt-in 也會原生送出 `/v1/responses`。詳情請查閱該提供者的頁面
