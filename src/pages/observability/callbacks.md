# 回呼 {#callbacks}

## 使用回呼將輸出資料傳送至 Posthog、Sentry 等 {#use-callbacks-to-send-output-data-to-posthog-sentry-etc}

liteLLM 提供 `success_callbacks` 和 `failure_callbacks`，讓您可以根據回應的狀態，輕鬆將資料傳送到特定的提供者。

liteLLM 支援：

- [Lunary](https://lunary.ai/docs)
- [Helicone](https://docs.helicone.ai/introduction)
- [Sentry](https://docs.sentry.io/platforms/python/)
- [PostHog](https://posthog.com/docs/libraries/python)
- [Slack](https://slack.dev/bolt-python/concepts)

### 快速開始 {#quick-start}

```python
from litellm import completion

# set callbacks
litellm.success_callback=["posthog", "helicone", "lunary"]
litellm.failure_callback=["sentry", "lunary"]

## set env variables
os.environ['SENTRY_DSN'], os.environ['SENTRY_API_TRACE_RATE']= ""
os.environ['POSTHOG_API_KEY'], os.environ['POSTHOG_API_URL'] = "api-key", "api-url"
os.environ["HELICONE_API_KEY"] = ""

response = completion(model="gpt-3.5-turbo", messages=messages)
```
