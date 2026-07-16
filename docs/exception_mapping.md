# 例外對應 {#exception-mapping}

LiteLLM 會將所有提供者的例外對應至其 OpenAI 對應項目。

所有例外都可以從 `litellm` 匯入 - 例如 `from litellm import BadRequestError`

## LiteLLM 例外 {#litellm-exceptions}

| 狀態碼 | 錯誤類型               | 繼承自 | 說明 |
|-------------|--------------------------|---------------|-------------|
| 400         | BadRequestError          | openai.BadRequestError |
| 400 | UnsupportedParamsError | litellm.BadRequestError | 當傳入不支援的參數時引發 |
| 400         | ContextWindowExceededError| litellm.BadRequestError | 用於上下文視窗超出錯誤訊息的特殊錯誤類型 - 可啟用上下文視窗備援 |
| 400         | ContentPolicyViolationError| litellm.BadRequestError | 用於內容政策違規錯誤訊息的特殊錯誤類型 - 可啟用內容政策備援 |
| 400         | ImageFetchError | litellm.BadRequestError | 當擷取或處理圖片時發生錯誤時引發 |
| 400 | InvalidRequestError | openai.BadRequestError | 已淘汰的錯誤，請改用 BadRequestError |
| 401         | AuthenticationError      | openai.AuthenticationError |
| 403         | PermissionDeniedError    | openai.PermissionDeniedError |
| 404         | NotFoundError            | openai.NotFoundError | 在傳入無效模型時引發，例如 gpt-8 |
| 408 | Timeout | openai.APITimeoutError | 發生逾時時引發 |
| 422         | UnprocessableEntityError | openai.UnprocessableEntityError |
| 429         | RateLimitError           | openai.RateLimitError |
| 500         | APIConnectionError       | openai.APIConnectionError | 如果傳回任何未對應的錯誤，我們會回傳此錯誤 |
| 500         | APIError | openai.APIError | 一般 500 狀態碼錯誤 | 
| 503 | ServiceUnavailableError | openai.APIStatusError | 如果提供者回傳服務無法使用錯誤，則會引發此錯誤 |
| >=500       | InternalServerError      | openai.InternalServerError | 如果回傳任何未對應的 500 狀態碼錯誤，則會引發此錯誤 |
| N/A         | APIResponseValidationError | openai.APIResponseValidationError | 如果使用 Rules，且請求/回應未通過某項規則，則會引發此錯誤 |
| N/A | BudgetExceededError | Exception | 在代理時，當超出預算時引發 |
| N/A | JSONSchemaValidationError | litellm.APIResponseValidationError | 當回應不符合預期的 json schema 時引發 - 若 `response_schema` 參數與 `enforce_validation=True` 一起傳入則會使用 |
| N/A | MockException | Exception | 內部例外，由 mock_completion 類別引發。請勿直接使用 | 
| N/A | OpenAIError | openai.OpenAIError | 已淘汰的內部例外，繼承自 openai.OpenAIError。 |

基本情況下我們會回傳 APIConnectionError

我們所有的例外都繼承自 OpenAI 的例外類型，因此您已經為該類型撰寫的任何錯誤處理，都能在 LiteLLM 上直接運作。 

在所有情況下，回傳的例外都繼承自原始的 OpenAI Exception，但會額外包含 3 個屬性： 
* status_code - 例外的 http 狀態碼
* message - 錯誤訊息
* llm_provider - 引發例外的提供者

## 使用方式 {#usage}

```python 
import litellm
import openai

try:
    response = litellm.completion(
                model="gpt-4",
                messages=[
                    {
                        "role": "user",
                        "content": "hello, write a 20 pageg essay"
                    }
                ],
                timeout=0.01, # this will raise a timeout exception
            )
except openai.APITimeoutError as e:
    print("Passed: Raised correct exception. Got openai.APITimeoutError\nGood Job", e)
    print(type(e))
    pass
```

## 使用方式 - 擷取串流例外 {#usage---catching-streaming-exceptions}
```python
import litellm
try:
    response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "user",
                "content": "hello, write a 20 pg essay"
            }
        ],
        timeout=0.0001, # this will raise an exception
        stream=True,
    )
    for chunk in response:
        print(chunk)
except openai.APITimeoutError as e:
    print("Passed: Raised correct exception. Got openai.APITimeoutError\nGood Job", e)
    print(type(e))
    pass
except Exception as e:
    print(f"Did not raise error `openai.APITimeoutError`. Instead raised error type: {type(e)}, Error: {e}")

```

## 使用方式 - 是否應重試例外？  {#usage---should-you-retry-exception}

```
import litellm
import openai

try:
    response = litellm.completion(
                model="gpt-4",
                messages=[
                    {
                        "role": "user",
                        "content": "hello, write a 20 pageg essay"
                    }
                ],
                timeout=0.01, # this will raise a timeout exception
            )
except openai.APITimeoutError as e:
    should_retry = litellm._should_retry(e.status_code)
    print(f"should_retry: {should_retry}")
```

## 進階 {#advanced}

### 存取提供者專屬錯誤詳細資訊 {#accessing-provider-specific-error-details}

LiteLLM 例外包含一個 `provider_specific_fields` 屬性，其中包含各提供者專屬的額外錯誤資訊。這對 Azure OpenAI 特別有用，因為它會提供詳細的內容篩選資訊。

#### Azure OpenAI - 內容政策違規內部錯誤存取 {#azure-openai---content-policy-violation-inner-error-access}

當 Azure OpenAI 傳回內容政策違規時，您可以透過 `innererror` 欄位存取詳細的內容篩選結果：

```python
import litellm
from litellm.exceptions import ContentPolicyViolationError

try:
    response = litellm.completion(
        model="azure/gpt-4",
        messages=[
            {
                "role": "user", 
                "content": "Some content that might violate policies"
            }
        ]
    )
except ContentPolicyViolationError as e:
    # Access Azure-specific error details
    if e.provider_specific_fields and "innererror" in e.provider_specific_fields:
        innererror = e.provider_specific_fields["innererror"]
        
        # Access content filter results
        content_filter_result = innererror.get("content_filter_result", {})
        
        print(f"Content filter code: {innererror.get('code')}")
        print(f"Hate filtered: {content_filter_result.get('hate', {}).get('filtered')}")
        print(f"Violence severity: {content_filter_result.get('violence', {}).get('severity')}")
        print(f"Sexual content filtered: {content_filter_result.get('sexual', {}).get('filtered')}")
```

**範例回應結構：**

當呼叫 LiteLLM 代理時，內容政策違規會傳回詳細的篩選資訊：

```json
{
  "error": {
    "message": "litellm.ContentPolicyViolationError: AzureException - The response was filtered due to the prompt triggering Azure OpenAI's content management policy...",
    "type": null,
    "param": null,
    "code": "400",
    "provider_specific_fields": {
      "innererror": {
        "code": "ResponsibleAIPolicyViolation",
        "content_filter_result": {
          "hate": {
            "filtered": true,
            "severity": "high"
          },
          "jailbreak": {
            "filtered": false,
            "detected": false
          },
          "self_harm": {
            "filtered": false,
            "severity": "safe"
          },
          "sexual": {
            "filtered": false,
            "severity": "safe"
          },
          "violence": {
            "filtered": true,
            "severity": "medium"
          }
        }
      }
    }
  }
}

## 詳細資訊  {#details}

若要了解其實作方式 - [請查看程式碼](https://github.com/BerriAI/litellm/blob/a42c197e5a6de56ea576c73715e6c7c6b19fa249/litellm/utils.py#L1217)

如果您想改進例外對應，請 [建立 issue](https://github.com/BerriAI/litellm/issues/new) **或** [提出 PR](https://github.com/BerriAI/litellm/pulls)。 

**注意** 對於 OpenAI 和 Azure，我們會回傳原始例外（因為它們屬於 OpenAI Error 類型）。但我們會為它們加上 'llm_provider' 屬性。[查看程式碼](https://github.com/BerriAI/litellm/blob/a42c197e5a6de56ea576c73715e6c7c6b19fa249/litellm/utils.py#L1221)

## 自訂對應清單 {#custom-mapping-list}

基本情況下 - 我們會回傳 `litellm.APIConnectionError` 例外（繼承自 openai 的 APIConnectionError 例外）。

| custom_llm_provider        | 逾時 | ContextWindowExceededError | BadRequestError | NotFoundError | ContentPolicyViolationError | AuthenticationError | APIError | RateLimitError | ServiceUnavailableError | PermissionDeniedError | UnprocessableEntityError |
|----------------------------|---------|----------------------------|------------------|---------------|-----------------------------|---------------------|----------|----------------|-------------------------|-----------------------|-------------------------|
| openai                     | ✓       | ✓                          | ✓                |               | ✓                           | ✓                   |          |                |                         |                       |                           |
| watsonx                     |       | | | | | | |✓| | | |
| text-completion-openai     | ✓       | ✓                          | ✓                |               | ✓                           | ✓                   |          |                |                         |                       |                           |
| custom_openai              | ✓       | ✓                          | ✓                |               | ✓                           | ✓                   |          |                |                         |                       |                           |
| openai_compatible_providers| ✓       | ✓                          | ✓                |               | ✓                           | ✓                   |          |                |                         |                       |                           |
| anthropic                  | ✓       | ✓                          | ✓                | ✓             |                             | ✓                   |          |                | ✓                       | ✓                     |                           |
| replicate                  | ✓       | ✓                          | ✓                | ✓             |                             | ✓                   |          | ✓              | ✓                       |                       |                           |
| bedrock                    | ✓       | ✓                          | ✓                | ✓             |                             | ✓                   |          | ✓              | ✓                       | ✓                     |                           |
| sagemaker                  |         | ✓                          | ✓                |               |                             |                     |          |                |                         |                       |                           |
| vertex_ai                  | ✓       |                            | ✓                |               |                             |                     | ✓        |                |                         |                       | ✓                         |
| palm                       | ✓       | ✓                          |                  |               |                             |                     | ✓        |                |                         |                       |                           |
| gemini                     | ✓       | ✓                          |                  |               |                             |                     | ✓        |                |                         |                       |                           |
| cloudflare                 |         |                            | ✓                |               |                             | ✓                   |          |                |                         |                       |                           |
| cohere                     |         | ✓                          | ✓                |               |                             | ✓                   |          |                | ✓                       |                       |                           |
| cohere_chat                |         | ✓                          | ✓                |               |                             | ✓                   |          |                | ✓                       |                       |                           |
| huggingface                | ✓       | ✓                          | ✓                |               |                             | ✓                   |          | ✓              | ✓                       |                       |                           |
| ai21                       | ✓       | ✓                          | ✓                | ✓             |                             | ✓                   |          | ✓              |                         |                       |                           |
| nlp_cloud                  | ✓       | ✓                          | ✓                |               |                             | ✓                   | ✓        | ✓              | ✓                       |                       |                           |
| together_ai                | ✓       | ✓                          | ✓                |               |                             | ✓                   |          |                |                         |                       |                           |
| aleph_alpha                |         |                            | ✓                |               |                             | ✓                   |          |                |                         |                       |                           |
| ollama                     | ✓       |                            | ✓                |               |                             |                     |          |                | ✓                       |                       |                           |
| ollama_chat                | ✓       |                            | ✓                |               |                             |                     |          |                | ✓                       |                       |                           |
| vllm                       |         |                            |                  |               |                             | ✓                   | ✓        |                |                         |                       |                           |
| azure                      | ✓       | ✓                          | ✓                | ✓             | ✓                           | ✓                   |          |                | ✓                       |                       |                           |

- "✓" 表示指定的 `custom_llm_provider` 可以引發對應的例外。
- 空白儲存格表示沒有關聯，或如函式所示，該提供者不會引發該特定例外類型。

> 若要更深入了解這些例外，您可以查看 [此處](https://github.com/BerriAI/litellm/blob/d7e58d13bf9ba9edbab2ab2f096f3de7547f35fa/litellm/utils.py#L1544) 的實作以取得更多見解。

`ContextWindowExceededError` 是 `InvalidRequestError` 的子類別。引入它是為了讓例外處理情境有更細緻的區分。請參閱 [此 issue 以了解更多](https://github.com/BerriAI/litellm/issues/228)。

歡迎對改善例外對應提出貢獻 [歡迎](https://github.com/BerriAI/litellm#contributing)
