# 新增 Rerank 提供者 {#add-rerank-provider}

LiteLLM **遵循 Cohere Rerank API 格式** 適用於所有 rerank 提供者。以下是新增 rerank 提供者的方法：

## 1. 建立 transformation.py 檔案 {#1-create-a-transformationpy-file}

建立一個名為 `<Provider><Endpoint>Config` 的設定類別，並繼承自 [`BaseRerankConfig`](https://github.com/BerriAI/litellm/blob/main/litellm/llms/base_llm/rerank/transformation.py)：

以下每個方法在 `BaseRerankConfig` 上都是抽象方法，因此在全部六個方法都實作完成之前，無法建立此類別的執行個體：

```python
from typing import Any

import httpx

from litellm.litellm_core_utils.litellm_logging import Logging as LiteLLMLoggingObj
from litellm.llms.base_llm.rerank.transformation import BaseRerankConfig
from litellm.secret_managers.main import get_secret_str
from litellm.types.rerank import OptionalRerankParams, RerankRequest, RerankResponse


class YourProviderRerankConfig(BaseRerankConfig):
    def validate_environment(
        self,
        headers: dict,
        model: str,
        api_key: str | None = None,
        optional_params: dict | None = None,
        litellm_params: dict | None = None,
    ) -> dict:
        # Return the request headers, including auth
        api_key = api_key or get_secret_str("YOUR_PROVIDER_API_KEY")
        return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", **headers}

    def get_complete_url(
        self,
        api_base: str | None,
        model: str,
        optional_params: dict | None = None,
    ) -> str:
        # Return the full URL the request is POSTed to
        return f"{api_base or 'https://api.your-provider.com'}/v1/rerank"

    def get_supported_cohere_rerank_params(self, model: str) -> list:
        return [
            "query",
            "documents",
            "top_n",
            # ... other supported params
        ]

    def map_cohere_rerank_params(
        self,
        non_default_params: dict,
        model: str,
        drop_params: bool,
        query: str,
        documents: list[str | dict[str, Any]],
        custom_llm_provider: str | None = None,
        top_n: int | None = None,
        rank_fields: list[str] | None = None,
        return_documents: bool | None = True,
        max_chunks_per_doc: int | None = None,
        max_tokens_per_doc: int | None = None,
        instruction: str | None = None,
    ) -> dict:
        # Map the Cohere-style params to the ones your provider accepts
        return dict(OptionalRerankParams(query=query, documents=documents, top_n=top_n))

    def transform_rerank_request(
        self,
        model: str,
        optional_rerank_params: dict,
        headers: dict,
        litellm_params: dict | None = None,
    ) -> dict:
        # Transform request to RerankRequest spec
        rerank_request = RerankRequest(model=model, **optional_rerank_params)
        return rerank_request.model_dump(exclude_none=True)

    def transform_rerank_response(
        self,
        model: str,
        raw_response: httpx.Response,
        model_response: RerankResponse,
        logging_obj: LiteLLMLoggingObj,
        api_key: str | None = None,
        request_data: dict = {},
        optional_params: dict = {},
        litellm_params: dict = {},
    ) -> RerankResponse:
        # Transform provider response to RerankResponse
        return RerankResponse(**raw_response.json())
```

## 2. 註冊您的提供者 {#2-register-your-provider}
將您的提供者新增至 [`litellm/utils.py`](https://github.com/BerriAI/litellm/blob/main/litellm/utils.py) 中的 `ProviderConfigManager.get_provider_rerank_config()`。未列在其中的提供者會退回至 `CohereRerankConfig`，接著 `litellm.rerank()` 會擲出 `Unsupported provider`：

```python nolint
elif litellm.LlmProviders.YOUR_PROVIDER == provider:
    return litellm.YourProviderRerankConfig()
```

## 3. 將提供者加入 `rerank_api/main.py` {#3-add-provider-to-rerank_apimainpy}

沒有專屬分支的提供者會落入通用的 `else` 分支，而該分支已經會使用步驟 2 中回傳的設定呼叫 `base_llm_http_handler.rerank`。只有在您的提供者需要自訂 `api_key` 或 `api_base` 解析時，才新增專屬分支，並將其傳遞給 `provider_config`

```python nolint
elif _custom_llm_provider == "your_provider":
    ...
    response = base_llm_http_handler.rerank(
        model=model,
        custom_llm_provider=_custom_llm_provider,
        provider_config=rerank_provider_config,
        optional_rerank_params=optional_rerank_params,
        logging_obj=litellm_logging_obj,
        timeout=optional_params.timeout,
        api_key=dynamic_api_key or optional_params.api_key,
        api_base=api_base,
        _is_async=_is_async,
        headers=headers or litellm.headers or {},
        client=client,
        model_response=model_response,
        litellm_params=rerank_litellm_params,
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
