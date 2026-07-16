# 模型存取運作方式 {#how-model-access-works}

## 概念  {#concept}

在 LiteLLM 中，每個已上線的模型都是一個「model deployment」。

這些模型部署會透過 config.yaml 中的「model_name」欄位，指派到一個「model group」。

## 範例 {#example}

```yaml
model_list:
  - model_name: my-custom-model
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

在這裡，我們為模型 `gpt-4o` 上線一個模型部署，並將其指派到模型群組 `my-custom-model`。

## 用戶端請求 {#client-side-request}

用戶端請求如下所示：

```bash
curl --location 'http://localhost:4000/chat/completions' \
-H 'Authorization: Bearer <your-api-key>' \
-H 'Content-Type: application/json' \
-d '{"model": "my-custom-model", "messages": [{"role": "user", "content": "Hello, how are you?"}]}'

```

## 存取控制 {#access-control}
當您將存取權授予金鑰／使用者／團隊時，您其實是在授予他們對「model group」的存取權。

範例：

```bash
curl --location 'http://localhost:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["my-custom-model"]}'
```

## 負載平衡  {#loadbalancing}

您可以將多個模型部署加入單一「model group」。LiteLLM 會自動在該群組中的模型部署之間進行請求負載平衡。

範例：

```yaml
model_list:
  - model_name: my-custom-model
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  - model_name: my-custom-model
    litellm_params:
      model: azure/gpt-4o
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      api_version: os.environ/AZURE_API_VERSION
```

如此一來，您可以在多個模型部署之間最大化您的速率限制。

## 備援  {#fallbacks}

您可以在不同 model group 之間進行備援。如果一個「model group」中的所有「model deployments」都無法使用（例如回傳 429 錯誤），這會很有用。

範例：

```yaml
model_list:
  - model_name: my-custom-model
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
  - model_name: my-other-model
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  fallbacks: [{"my-custom-model": ["my-other-model"]}]
```

備援會依序進行，因此清單中的第一個 model group 會先被嘗試。如果失敗，就會嘗試下一個 model group。

## 進階：Model Access Groups {#advanced-model-access-groups}

針對進階使用情境，請使用 [Model Access Groups](./model_access_groups) 動態分組多個模型，並在不重新啟動 proxy 的情況下管理存取權。
