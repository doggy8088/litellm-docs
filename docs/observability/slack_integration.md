import Image from '@theme/IdealImage';

# Slack {#slack}

<Image img={require('../../img/slack.png')} />

:::info
我們希望了解如何讓回呼變得更好！歡迎認識 LiteLLM [創辦人](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) 或
加入我們的 [discord](https://discord.gg/wuPM9dRgDw)
::: 

## 先決條件 {#pre-requisites}

### 步驟 1 {#step-1}
```shell
uv add litellm
```

### 步驟 2 {#step-2}
從 https://api.slack.com/messaging/webhooks 取得 slack webhook url

## 快速開始 {#quick-start}
### 建立自訂回呼以記錄到 slack {#create-a-custom-callback-to-log-to-slack}
我們建立一個自訂回呼來記錄到 slack webhooks，請參閱 [litellm 上的自訂回呼](https://docs.litellm.ai/docs/observability/custom_callback)
```python
def send_slack_alert(
        kwargs,
        completion_response,
        start_time,
        end_time,
):
    print(
        "in custom slack callback func"
    )
    import requests
    import json

    # Define the Slack webhook URL
    # get it from https://api.slack.com/messaging/webhooks
    slack_webhook_url = os.environ['SLACK_WEBHOOK_URL']   # "https://hooks.slack.com/services/<>/<>/<>"

    # Remove api_key from kwargs under litellm_params
    if kwargs.get('litellm_params'):
        kwargs['litellm_params'].pop('api_key', None)
        if kwargs['litellm_params'].get('metadata'):
            kwargs['litellm_params']['metadata'].pop('deployment', None)
    # Remove deployment under metadata
    if kwargs.get('metadata'):
        kwargs['metadata'].pop('deployment', None)
    # Prevent api_key from being logged
    if kwargs.get('api_key'):
        kwargs.pop('api_key', None)

    # Define the text payload, send data available in litellm custom_callbacks
    text_payload = f"""LiteLLM Logging: kwargs: {str(kwargs)}\n\n, response: {str(completion_response)}\n\n, start time{str(start_time)} end time: {str(end_time)}
    """
    payload = {
        "text": text_payload
    }

    # Set the headers
    headers = {
        "Content-type": "application/json"
    }

    # Make the POST request
    response = requests.post(slack_webhook_url, json=payload, headers=headers)

    # Check the response status
    if response.status_code == 200:
        print("Message sent successfully to Slack!")
    else:
        print(f"Failed to send message to Slack. Status code: {response.status_code}")
        print(response.json())
```

### 將回呼傳遞給 LiteLLM {#pass-callback-to-litellm}
```python
litellm.success_callback = [send_slack_alert]
```

```python
import litellm
litellm.success_callback = [send_slack_alert] # log success
litellm.failure_callback = [send_slack_alert] # log exceptions

# this will raise an exception
response = litellm.completion(
    model="gpt-2",
    messages=[
        {
            "role": "user",
            "content": "Hi 👋 - i'm openai"
        }
    ]
)
```
## 支援與創辦人交流 {#support--talk-to-founders}

- [安排示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai
