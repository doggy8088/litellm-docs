import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 原始請求/回應記錄 {#raw-requestresponse-logging}

## 記錄 {#logging}
請在您的記錄提供者（OTEL/Langfuse/etc.）中查看 LiteLLM 傳送的原始請求/回應。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
# uv add langfuse 
import litellm
import os

# log raw request/response
litellm.log_raw_request_response = True

# from https://cloud.langfuse.com/
os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""
# Optional, defaults to https://cloud.langfuse.com
os.environ["LANGFUSE_HOST"] # optional

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set langfuse as a callback, litellm will send the data to langfuse
litellm.success_callback = ["langfuse"] 
 
# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```


</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  log_raw_request_response: True
```


</TabItem>
</Tabs>

**預期記錄**

<Image img={require('../../img/raw_request_log.png')}/>

## 回傳原始回應標頭  {#return-raw-response-headers}

回傳來自 llm provider 的原始回應標頭。 

目前僅支援 openai。 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
import os

litellm.return_response_headers = True

## set ENV variables
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)

print(response._hidden_params)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/GROQ_API_KEY

litellm_settings:
  return_response_headers: true
```

2. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-D '{
    "model": "gpt-3.5-turbo",
    "messages": [
        { "role": "system", "content": "Use your tools smartly"},
        { "role": "user", "content": "What time is it now? Use your tool"}
    ]
}'
```
</TabItem>
</Tabs>

**預期回應**

<Image img={require('../../img/raw_response_headers.png')}/>
