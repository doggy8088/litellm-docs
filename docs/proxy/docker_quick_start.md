---
title: Docker Quickstart
description: Deploy LiteLLM with Docker Compose and go from zero to your first gateway request in about five minutes, using the Admin UI for everything after startup.
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Docker Quickstart

LiteLLM ships as a ready-to-run gateway. You start one Docker Compose stack, then do everything else in your browser: connect providers, add models, create keys, and send test requests from the built-in Admin UI. No config files are required for this guide.

By the end you will have LiteLLM running at `http://localhost:4000` with a model connected, a virtual key issued, and a request served through the gateway.

## 1. Start LiteLLM

Save this as `docker-compose.yml`:

```yaml
services:
  litellm:
    image: docker.litellm.ai/berriai/litellm-database:latest
    ports:
      - "4000:4000"
    environment:
      LITELLM_MASTER_KEY: sk-1234
      LITELLM_SALT_KEY: sk-XXXXXXXXXXXXXXXX
      DATABASE_URL: postgresql://litellm:litellm@db:5432/litellm
      STORE_MODEL_IN_DB: "True"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: litellm
      POSTGRES_PASSWORD: litellm
      POSTGRES_DB: litellm
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U litellm"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Then start it:

```bash
docker compose up -d
```

That is the entire terminal portion of this guide. The stack runs the gateway on port 4000 and a Postgres database that stores your models, keys, and spend logs. For anything beyond local evaluation, pin a specific release tag instead of `latest`; see [available tags](https://github.com/BerriAI/litellm/pkgs/container/litellm-database).

:::warning Set a real salt key
`LITELLM_SALT_KEY` encrypts the provider API keys you add in the UI. Set it to a long random value before adding models, and never change it afterwards; credentials encrypted with the old value cannot be decrypted with a new one. A password generator works well for this.
:::

## 2. Log in to the Admin UI

Open [http://localhost:4000/ui](http://localhost:4000/ui). The username is `admin` and the password is your `LITELLM_MASTER_KEY` value (`sk-1234` in the compose file above).

<Image img={require('../../img/ui_quickstart_login.png')} alt="LiteLLM Admin UI login page" />

## 3. Add your first model

Go to **Models + Endpoints**, open the **Add Model** tab, pick your provider and the models you want to expose, and paste your provider API key. LiteLLM ships with each provider's model catalog, so you select models rather than type them.

<Image img={require('../../img/ui_quickstart_add_model.png')} alt="Add Model form with OpenAI provider and gpt-5.5 selected" />

Click **Test Connect** to verify the key against the provider, then **Add Model**. It appears under **All Models** with its pricing already mapped:

<Image img={require('../../img/ui_quickstart_models_list.png')} alt="All Models list showing the newly added model with cost data" />

:::tip Keep provider keys out of the UI
If you prefer to manage provider keys as environment variables, add them to the `litellm` service in your compose file (for example `OPENAI_API_KEY: ${OPENAI_API_KEY}`) and enter `os.environ/OPENAI_API_KEY` in the API key field instead of the raw key.
:::

## 4. Send a test message

Go to **Playground**, select your model, and send a message. The request goes through the gateway to your provider, and the response comes back with latency and token counts:

<Image img={require('../../img/ui_quickstart_playground.png')} alt="Playground showing a live response from the model with latency and token metrics" />

Your gateway works end to end. The **Get Code** button in the Playground generates the equivalent API call for your language.

## 5. Create a virtual key

Virtual keys are what you hand to applications and teammates instead of raw provider keys. Each key can carry its own budget, rate limits, and model access, and all its spend is tracked automatically.

Go to **Virtual Keys**, click **+ Create New Key**, give it a name, and click **Create Key**:

<Image img={require('../../img/ui_quickstart_create_key.png')} alt="Save your Key modal showing the newly created virtual key" />

Copy the key now; it is shown only once.

## 6. Call the gateway from your app

The gateway is OpenAI-compatible, so any OpenAI SDK works by pointing it at `http://localhost:4000` with your virtual key.

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl http://localhost:4000/v1/chat/completions \
  -H 'Authorization: Bearer sk-<your-virtual-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Say hello in five words."}]
  }'
```

Expected response:

```json
{
  "id": "chatcmpl-DzGKiNRbQ4fe9Mgt8HSHFQ6ApfRJi",
  "model": "gpt-5.5",
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "Hello, nice to meet you.",
        "role": "assistant"
      }
    }
  ],
  "usage": {
    "completion_tokens": 70,
    "prompt_tokens": 12,
    "total_tokens": 82
  }
}
```

</TabItem>
<TabItem value="python" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-<your-virtual-key>",
)

response = client.chat.completions.create(
    model="gpt-5.5",
    messages=[{"role": "user", "content": "Say hello in five words."}],
)
print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="js" label="OpenAI JS SDK">

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:4000",
  apiKey: "sk-<your-virtual-key>",
});

const response = await client.chat.completions.create({
  model: "gpt-5.5",
  messages: [{ role: "user", content: "Say hello in five words." }],
});
console.log(response.choices[0].message.content);
```

</TabItem>
</Tabs>

## The whole flow, end to end

<Image img={require('../../img/ui_quickstart_flow.gif')} alt="Animated walkthrough: add a model, test it in the Playground, create a virtual key" />

## Running without a database

If you only need the OpenAI-compatible API (no Admin UI model management, virtual keys, or spend tracking), you can run the plain `litellm` image with a config file instead:

```yaml
# litellm_config.yaml
model_list:
  - model_name: gpt-5.5
    litellm_params:
      model: openai/gpt-5.5
      api_key: os.environ/OPENAI_API_KEY
```

```bash
docker run \
  -v $(pwd)/litellm_config.yaml:/app/config.yaml \
  -e OPENAI_API_KEY=<your-openai-key> \
  -e LITELLM_MASTER_KEY=sk-1234 \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm:latest \
  --config /app/config.yaml
```

Requests authenticate with the master key. See the [full config reference](./configs.md) for everything the file supports.

## Next steps

Going to production: the [Deploy guide](./deploy.md) covers Helm, Terraform, and Kubernetes on AWS, GCP, and Azure, and the [production checklist](./prod.md) covers hardening and tuning. Full container and database options, including Redis and Prometheus, are covered in the repo [docker-compose.yml](https://github.com/BerriAI/litellm/blob/main/docker-compose.yml).
