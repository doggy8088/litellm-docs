---
type: "Documentation page"
title: "Model Alias"
description: "Model Alias The model name you show an end user might be different from the one you pass to LiteLLM e.g. Displaying GPT 3.5 while calling gpt 3.5 turbo 16k on the backend. LiteL..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/completion/model_alias.md"
tags: ["docs","documentation-page"]
source_path: "docs/completion/model_alias.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/completion/model_alias.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/completion/model_alias.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Model Alias

The model name you show an end-user might be different from the one you pass to LiteLLM - e.g. Displaying `GPT-3.5` while calling `gpt-3.5-turbo-16k` on the backend. 

LiteLLM simplifies this by letting you pass in a model alias mapping. 

# expected format

```python
litellm.model_alias_map = {
    # a dictionary containing a mapping of the alias string to the actual litellm model name string
    "model_alias": "litellm_model_name"
}
```

# usage 

### Relevant Code
```python
model_alias_map = {
    "GPT-3.5": "gpt-3.5-turbo-16k",
    "llama2": "replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf"
}

litellm.model_alias_map = model_alias_map
```

### Complete Code
```python
import litellm 
from litellm import completion 


## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key"
os.environ["REPLICATE_API_KEY"] = "cohere key"

## set model alias map
model_alias_map = {
    "GPT-3.5": "gpt-3.5-turbo-16k",
    "llama2": "replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf"
}

litellm.model_alias_map = model_alias_map

messages = [{ "content": "Hello, how are you?","role": "user"}]

# call "gpt-3.5-turbo-16k"
response = completion(model="GPT-3.5", messages=messages)

# call replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca1...
response = completion("llama2", messages)
```
````
