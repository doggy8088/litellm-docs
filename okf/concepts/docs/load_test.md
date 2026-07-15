---
type: "Documentation page"
title: "Load Test"
description: "LiteLLM Proxy Locust Load Test Locust Load Test LiteLLM Proxy 1. Add fake openai endpoint to your proxy config.yaml and start your litellm proxy. LiteLLM provides a free hosted..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/load_test.md"
tags: ["docs","documentation-page"]
source_path: "docs/load_test.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/load_test.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/load_test.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Image from '@theme/IdealImage';

# LiteLLM Proxy - Locust Load Test

## Locust Load Test LiteLLM Proxy 

1. Add `fake-openai-endpoint` to your proxy config.yaml and start your litellm proxy.

LiteLLM provides a free hosted `fake-openai-endpoint` you can load test against. You can also self-host your own fake OpenAI proxy server using [github.com/BerriAI/example_openai_endpoint](https://github.com/BerriAI/example_openai_endpoint).

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
```

2. `uv add locust`

3. Create a file called `locustfile.py` on your local machine. Copy the contents from the litellm load test located [here](https://github.com/BerriAI/litellm/blob/main/.github/workflows/locustfile.py)

4. Start locust
  Run `locust` in the same directory as your `locustfile.py` from step 2

  ```shell
  locust
  ```

  Output on terminal 
  ```
  [2024-03-15 07:19:58,893] Starting web interface at http://0.0.0.0:8089
  [2024-03-15 07:19:58,898] Starting Locust 2.24.0
  ```

5. Run Load test on locust

  Head to the locust UI on http://0.0.0.0:8089

  Set Users=100, Ramp Up Users=10, Host=Base URL of your LiteLLM Proxy

  <Image img={require('../img/locust_load_test.png')} />

6. Expected Results

  Expect to see the following response times for `/health/readiness` 
  Median → /health/readiness is `150ms`

  Avg →  /health/readiness is `219ms`

  <Image img={require('../img/litellm_load_test.png')} />
````
