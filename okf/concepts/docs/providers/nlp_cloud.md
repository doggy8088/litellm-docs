---
type: "Documentation page"
title: "Nlp Cloud"
description: "NLP Cloud LiteLLM supports all LLMs on NLP Cloud. API Keys Sample Usage streaming Just set stream=True when calling completion. non dolphin models By default, LiteLLM will map d..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/nlp_cloud.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/nlp_cloud.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/nlp_cloud.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/nlp_cloud.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# NLP Cloud

LiteLLM supports all LLMs on NLP Cloud.

## API Keys

```python 
import os 

os.environ["NLP_CLOUD_API_KEY"] = "your-api-key"
```

## Sample Usage

```python
import os
from litellm import completion 

# set env
os.environ["NLP_CLOUD_API_KEY"] = "your-api-key" 

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(model="dolphin", messages=messages)
print(response)
```

## streaming 
Just set `stream=True` when calling completion.

```python
import os
from litellm import completion 

# set env
os.environ["NLP_CLOUD_API_KEY"] = "your-api-key" 

messages = [{"role": "user", "content": "Hey! how's it going?"}]
response = completion(model="dolphin", messages=messages, stream=True)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```

## non-dolphin models 

By default, LiteLLM will map `dolphin` and `chatdolphin` to nlp cloud. 

If you're trying to call any other model (e.g. GPT-J, Llama-2, etc.) with nlp cloud, just set it as your custom llm provider. 


```python
import os
from litellm import completion 

# set env - [OPTIONAL] replace with your nlp cloud key
os.environ["NLP_CLOUD_API_KEY"] = "your-api-key" 

messages = [{"role": "user", "content": "Hey! how's it going?"}]

# e.g. to call Llama2 on NLP Cloud
response = completion(model="nlp_cloud/finetuned-llama-2-70b", messages=messages, stream=True)
for chunk in response:
    print(chunk["choices"][0]["delta"]["content"])  # same as openai format
```
````
