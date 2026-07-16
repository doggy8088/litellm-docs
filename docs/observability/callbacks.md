# 回呼 {#callbacks}

## 使用回呼將輸出資料傳送到 Posthog、Sentry 等 {#use-callbacks-to-send-output-data-to-posthog-sentry-etc}

liteLLM 提供 `input_callbacks`、`success_callbacks` 和 `failure_callbacks`，讓您能夠依據回應的狀態，輕鬆將資料傳送到特定提供者。

:::tip
**剛接觸 LiteLLM 回呼？**

- 關於 proxy/server 記錄與可觀測性，請參閱 [Proxy 記錄指南](https://docs.litellm.ai/docs/proxy/logging)。
- 若要撰寫您自己的回呼邏輯，請參閱 [自訂回呼指南](https://docs.litellm.ai/docs/observability/custom_callback)。
:::

### 支援的回呼整合 {#supported-callback-integrations}

- [Lunary](https://lunary.ai/docs)
- [Langfuse](https://langfuse.com/docs)
- [LangSmith](https://www.langchain.com/langsmith)
- [Helicone](https://docs.helicone.ai/introduction)
- [Traceloop](https://traceloop.com/docs)
- [Athina](https://docs.athina.ai/)
- [Sentry](https://docs.sentry.io/platforms/python/)
- [PostHog](https://posthog.com/docs/libraries/python)
- [Slack](https://slack.dev/bolt-python/concepts)
- [Arize](https://docs.arize.com/)
- [PromptLayer](https://docs.promptlayer.com/)

這**不是**完整清單。請查看下拉式選單以取得所有記錄整合。

### 相關食譜 {#related-cookbooks}
試試我們的食譜，取得程式碼片段與互動式展示：

- [Langfuse 回呼範例（Colab）](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Langfuse.ipynb)
- [Lunary 回呼範例（Colab）](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Lunary.ipynb)
- [Arize 回呼範例（Colab）](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Arize.ipynb)
- [Proxy + Langfuse 回呼範例（Colab）](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Proxy_Langfuse.ipynb)
- [PromptLayer 回呼範例（Colab）](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_PromptLayer.ipynb)

### 快速開始 {#quick-start}

```python
from litellm import completion

# set callbacks
litellm.input_callback=["sentry"] # for sentry breadcrumbing - logs the input being sent to the api
litellm.success_callback=["posthog", "helicone", "langfuse", "lunary", "athina"]
litellm.failure_callback=["sentry", "lunary", "langfuse"]

## set env variables
os.environ['LUNARY_PUBLIC_KEY'] = ""
os.environ['SENTRY_DSN'], os.environ['SENTRY_API_TRACE_RATE']= ""
os.environ['POSTHOG_API_KEY'], os.environ['POSTHOG_API_URL'] = "api-key", "api-url"
os.environ["HELICONE_API_KEY"] = ""
os.environ["TRACELOOP_API_KEY"] = ""
os.environ["LUNARY_PUBLIC_KEY"] = ""
os.environ["ATHINA_API_KEY"] = ""
os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""
os.environ["LANGFUSE_HOST"] = ""

response = completion(model="gpt-3.5-turbo", messages=messages)
```
