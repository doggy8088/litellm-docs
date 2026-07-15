---
type: "Documentation page"
title: "Multiple Deployments"
description: "Multiple Deployments If you have multiple deployments of the same model, you can pass the list of deployments, and LiteLLM will return the first result. Quick Start Multiple pro..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/completion/multiple_deployments.md"
tags: ["docs","documentation-page"]
source_path: "docs/completion/multiple_deployments.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/completion/multiple_deployments.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/completion/multiple_deployments.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Multiple Deployments

If you have multiple deployments of the same model, you can pass the list of deployments, and LiteLLM will return the first result. 

## Quick Start

Multiple providers offer Mistral-7B-Instruct. 

Here's how you can use litellm to return the first result: 

```python
from litellm import completion

messages=[{"role": "user", "content": "Hey, how's it going?"}]

## All your mistral deployments ##
model_list = [{
	"model_name": "mistral-7b-instruct",
	"litellm_params": { # params for litellm completion/embedding call 
        "model": "replicate/mistralai/mistral-7b-instruct-v0.1:83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70", 
        "api_key": "replicate_api_key",
    }
}, {
	"model_name": "mistral-7b-instruct",
	"litellm_params": { # params for litellm completion/embedding call 
        "model": "together_ai/mistralai/Mistral-7B-Instruct-v0.1", 
        "api_key": "togetherai_api_key",
    }
}, {
	"model_name": "mistral-7b-instruct",
	"litellm_params": { # params for litellm completion/embedding call 
        "model": "together_ai/mistralai/Mistral-7B-Instruct-v0.1", 
        "api_key": "togetherai_api_key",
    }
}, {
	"model_name": "mistral-7b-instruct",
	"litellm_params": { # params for litellm completion/embedding call 
        "model": "perplexity/mistral-7b-instruct", 
		"api_key": "perplexity_api_key"
    }
}, {
	"model_name": "mistral-7b-instruct",
	"litellm_params": {
		"model": "deepinfra/mistralai/Mistral-7B-Instruct-v0.1",
		"api_key": "deepinfra_api_key"
	}
}]

## LiteLLM completion call ## returns first response 
response = completion(model="mistral-7b-instruct", messages=messages, model_list=model_list)

print(response)
```
````
