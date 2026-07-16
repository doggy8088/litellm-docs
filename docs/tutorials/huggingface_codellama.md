# CodeLlama - 程式碼補全  {#codellama---code-infilling}

本教學示範如何呼叫 CodeLlama（託管於 Huggingface PRO Inference Endpoints），來補全程式碼。 

這是 code model 特有的專門任務。此模型經過訓練，可產生最符合既有前綴與後綴的程式碼（包含註解）。 

此任務可用於 **7B** 與 **13B** CodeLlama 模型的 base 與 instruction 變體。34B 模型或 Python 版本皆不支援。

# 使用方式 {#usage}

```python 
import os
from litellm import longer_context_model_fallback_dict, ContextWindowExceededError, completion

os.environ["HUGGINGFACE_API_KEY"] = "your-hf-token" # https://huggingface.co/docs/hub/security-tokens

## CREATE THE PROMPT
prompt_prefix = 'def remove_non_ascii(s: str) -> str:\n    """ '
prompt_suffix = "\n    return result"

### set <pre> <suf> to indicate the string before and after the part you want codellama to fill 
prompt = f"<PRE> {prompt_prefix} <SUF>{prompt_suffix} <MID>"

messages = [{"content": prompt, "role": "user"}]
model = "huggingface/codellama/CodeLlama-34b-Instruct-hf" # specify huggingface as the provider 'huggingface/'
response = completion(model=model, messages=messages, max_tokens=500)
```

# 輸出  {#output}
```python
def remove_non_ascii(s: str) -> str:
    """ Remove non-ASCII characters from a string.

    Args:
        s (str): The string to remove non-ASCII characters from.

    Returns:
        str: The string with non-ASCII characters removed.
    """
    result = ""
    for c in s:
        if ord(c) < 128:
            result += c
    return result
```
