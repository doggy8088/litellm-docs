# 新增 Rerank 提供者 {#add-rerank-provider}

LiteLLM **遵循 Cohere Rerank API 格式** 適用於所有 rerank 提供者。以下是新增 rerank 提供者的方法：

## 1. 建立 transformation.py 檔案 {#1-create-a-transformationpy-file}

建立一個名為 `<Provider><Endpoint>Config` 的設定類別，並繼承自 [`BaseRerankConfig`](https://github.com/BerriAI/litellm/blob/main/litellm/llms/base_llm/rerank/transformation.py)：

```python
from litellm.types.rerank import OptionalRerankParams, RerankRequest, RerankResponse
class YourProviderRerankConfig(BaseRerankConfig):
    def get_supported_cohere_rerank_params(self, model: str) -> list:
        return [
            "query",
            "documents",
            "top_n",
            # ... other supported params
        ]

    def transform_rerank_request(self, model: str, optional_rerank_params: Dict, headers: dict) -> dict:
        # Transform request to RerankRequest spec
        return rerank_request.model_dump(exclude_none=True)

    def transform_rerank_response(self, model: str, raw_response: httpx.Response, ...) -> RerankResponse:
        # Transform provider response to RerankResponse
        return RerankResponse(**raw_response_json)
```


## 2. 註冊您的提供者 {#2-register-your-provider}
將您的提供者加入 `litellm.utils.get_provider_rerank_config()`：

```python
elif litellm.LlmProviders.YOUR_PROVIDER == provider:
    return litellm.YourProviderRerankConfig()
```


## 3. 將提供者加入 `rerank_api/main.py` {#3-add-provider-to-rerank_apimainpy}

新增一個程式碼區塊來處理您的提供者被呼叫時的情況。您的提供者應使用 `base_llm_http_handler.rerank` 方法

```python
elif _custom_llm_provider == "your_provider":
    ...
    response = base_llm_http_handler.rerank(
        model=model,
        custom_llm_provider=_custom_llm_provider,
        optional_rerank_params=optional_rerank_params,
        logging_obj=litellm_logging_obj,
        timeout=optional_params.timeout,
        api_key=dynamic_api_key or optional_params.api_key,
        api_base=api_base,
        _is_async=_is_async,
        headers=headers or litellm.headers or {},
        client=client,
        mod el_response=model_response,
    )
    ...
```

## 4. 新增測試 {#4-add-tests}

將測試檔案加入 [`tests/llm_translation`](https://github.com/BerriAI/litellm/tree/main/tests/llm_translation)

```python
def test_basic_rerank_cohere():
    response = litellm.rerank(
        model="cohere/rerank-english-v3.0",
        query="hello",
        documents=["hello", "world"],
        top_n=3,
    )

    print("re rank response: ", response)

    assert response.id is not None
    assert response.results is not None
```


## 參考 PRs {#reference-prs}
- [新增 Infinity Rerank](https://github.com/BerriAI/litellm/pull/7321)
