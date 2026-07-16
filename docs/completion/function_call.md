# 函式呼叫 {#function-calling}

## 檢查模型是否支援函式呼叫 {#checking-if-a-model-supports-function-calling}

使用 `litellm.supports_function_calling(model="")` -> 如果模型支援函式呼叫則回傳 `True`，否則回傳 `False`

```python
assert litellm.supports_function_calling(model="gpt-3.5-turbo") == True
assert litellm.supports_function_calling(model="azure/gpt-4-1106-preview") == True
assert litellm.supports_function_calling(model="palm/chat-bison") == False
assert litellm.supports_function_calling(model="xai/grok-2-latest") == True
assert litellm.supports_function_calling(model="ollama/llama2") == False
```


## 檢查模型是否支援平行函式呼叫 {#checking-if-a-model-supports-parallel-function-calling}

使用 `litellm.supports_parallel_function_calling(model="")` -> 如果模型支援平行函式呼叫則回傳 `True`，否則回傳 `False`

```python
assert litellm.supports_parallel_function_calling(model="gpt-4-turbo-preview") == True
assert litellm.supports_parallel_function_calling(model="gpt-4") == False
```
## 平行函式呼叫 {#parallel-function-calling}
平行函式呼叫是模型同時執行多個函式呼叫的能力，讓這些函式呼叫的影響與結果能夠平行解析

## 快速開始 - gpt-3.5-turbo-1106 {#quick-start---gpt-35-turbo-1106}
<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/Parallel_function_calling.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

在此範例中，我們定義了一個單一函式 `get_current_weather`。 

- 步驟 1：將 `get_current_weather` 與使用者問題傳送給模型
- 步驟 2：解析模型回應中的輸出 - 使用模型提供的參數執行 `get_current_weather`
- 步驟 3：將執行 `get_current_weather` 函式的輸出傳送給模型

### 完整程式碼 - 使用 `gpt-3.5-turbo-1106` 的平行函式呼叫 {#full-code---parallel-function-calling-with-gpt-35-turbo-1106}

```python
import litellm
import json
# set openai api key
import os
os.environ['OPENAI_API_KEY'] = "" # litellm reads OPENAI_API_KEY from .env and sends the request

# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API
def get_current_weather(location, unit="fahrenheit"):
    """Get the current weather in a given location"""
    if "tokyo" in location.lower():
        return json.dumps({"location": "Tokyo", "temperature": "10", "unit": "celsius"})
    elif "san francisco" in location.lower():
        return json.dumps({"location": "San Francisco", "temperature": "72", "unit": "fahrenheit"})
    elif "paris" in location.lower():
        return json.dumps({"location": "Paris", "temperature": "22", "unit": "celsius"})
    else:
        return json.dumps({"location": location, "temperature": "unknown"})


def test_parallel_function_call():
    try:
        # Step 1: send the conversation and available functions to the model
        messages = [{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}]
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": "Get the current weather in a given location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA",
                            },
                            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                        },
                        "required": ["location"],
                    },
                },
            }
        ]
        response = litellm.completion(
            model="gpt-3.5-turbo-1106",
            messages=messages,
            tools=tools,
            tool_choice="auto",  # auto is default, but we'll be explicit
        )
        print("\nFirst LLM Response:\n", response)
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        print("\nLength of tool calls", len(tool_calls))

        # Step 2: check if the model wanted to call a function
        if tool_calls:
            # Step 3: call the function
            # Note: the JSON response may not always be valid; be sure to handle errors
            available_functions = {
                "get_current_weather": get_current_weather,
            }  # only one function in this example, but you can have multiple
            messages.append(response_message)  # extend conversation with assistant's reply

            # Step 4: send the info for each function call and function response to the model
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_to_call = available_functions[function_name]
                function_args = json.loads(tool_call.function.arguments)
                function_response = function_to_call(
                    location=function_args.get("location"),
                    unit=function_args.get("unit"),
                )
                messages.append(
                    {
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    }
                )  # extend conversation with function response
            second_response = litellm.completion(
                model="gpt-3.5-turbo-1106",
                messages=messages,
            )  # get a new response from the model where it can see the function response
            print("\nSecond LLM response:\n", second_response)
            return second_response
    except Exception as e:
      print(f"Error occurred: {e}")

test_parallel_function_call()
```

### 說明 - 平行函式呼叫 {#explanation---parallel-function-calling}
以下是上述程式碼片段中，使用 `gpt-3.5-turbo-1106` 進行平行函式呼叫時所發生內容的說明
### 步驟 1：`tools` 設定為 `get_current_weather` 的 litellm.completion() {#step1-litellmcompletion-with-tools-set-to-get_current_weather}
```python
import litellm
import json
# set openai api key
import os
os.environ['OPENAI_API_KEY'] = "" # litellm reads OPENAI_API_KEY from .env and sends the request
# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API
def get_current_weather(location, unit="fahrenheit"):
    """Get the current weather in a given location"""
    if "tokyo" in location.lower():
        return json.dumps({"location": "Tokyo", "temperature": "10", "unit": "celsius"})
    elif "san francisco" in location.lower():
        return json.dumps({"location": "San Francisco", "temperature": "72", "unit": "fahrenheit"})
    elif "paris" in location.lower():
        return json.dumps({"location": "Paris", "temperature": "22", "unit": "celsius"})
    else:
        return json.dumps({"location": location, "temperature": "unknown"})

messages = [{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}]
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]

response = litellm.completion(
    model="gpt-3.5-turbo-1106",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # auto is default, but we'll be explicit
)
print("\nLLM Response1:\n", response)
response_message = response.choices[0].message
tool_calls = response.choices[0].message.tool_calls
```

##### 預期輸出 {#expected-output}
在輸出中，您可以看到模型多次呼叫該函式——針對舊金山、東京、巴黎
```json
ModelResponse(
  id='chatcmpl-8MHBKZ9t6bXuhBvUMzoKsfmmlv7xq', 
  choices=[
    Choices(finish_reason='tool_calls', 
    index=0, 
    message=Message(content=None, role='assistant', 
      tool_calls=[
        ChatCompletionMessageToolCall(id='call_DN6IiLULWZw7sobV6puCji1O', function=Function(arguments='{"location": "San Francisco", "unit": "celsius"}', name='get_current_weather'), type='function'), 

        ChatCompletionMessageToolCall(id='call_ERm1JfYO9AFo2oEWRmWUd40c', function=Function(arguments='{"location": "Tokyo", "unit": "celsius"}', name='get_current_weather'), type='function'), 
        
        ChatCompletionMessageToolCall(id='call_2lvUVB1y4wKunSxTenR0zClP', function=Function(arguments='{"location": "Paris", "unit": "celsius"}', name='get_current_weather'), type='function')
        ]))
    ], 
    created=1700319953, 
    model='gpt-3.5-turbo-1106', 
    object='chat.completion', 
    system_fingerprint='fp_eeff13170a',
    usage={'completion_tokens': 77, 'prompt_tokens': 88, 'total_tokens': 165}, 
    _response_ms=1177.372
)
```

### 步驟 2 - 解析模型回應並執行函式 {#step-2----parse-the-model-response-and-execute-functions}
傳送初始請求後，解析模型回應以識別它想要進行的函式呼叫。在此範例中，我們預期有三個工具呼叫，每個都對應一個地點（舊金山、東京和巴黎）。 

```python
# Check if the model wants to call a function
if tool_calls:
    # Execute the functions and prepare responses
    available_functions = {
        "get_current_weather": get_current_weather,
    }

    messages.append(response_message)  # Extend conversation with assistant's reply

    for tool_call in tool_calls:
      print(f"\nExecuting tool call\n{tool_call}")
      function_name = tool_call.function.name
      function_to_call = available_functions[function_name]
      function_args = json.loads(tool_call.function.arguments)
      # calling the get_current_weather() function
      function_response = function_to_call(
          location=function_args.get("location"),
          unit=function_args.get("unit"),
      )
      print(f"Result from tool call\n{function_response}\n")

      # Extend conversation with function response
      messages.append(
          {
              "tool_call_id": tool_call.id,
              "role": "tool",
              "name": function_name,
              "content": function_response,
          }
      )

```

### 步驟 3 - 第二次 litellm.completion() 呼叫 {#step-3---second-litellmcompletion-call}
函式執行完成後，將每個函式呼叫及其回應的資訊傳送給模型。這讓模型能夠在考量函式呼叫影響的情況下產生新的回應。
```python
second_response = litellm.completion(
    model="gpt-3.5-turbo-1106",
    messages=messages,
)
print("Second Response\n", second_response)
```

#### 預期輸出 {#expected-output-1}
```json
ModelResponse(
  id='chatcmpl-8MHBLh1ldADBP71OrifKap6YfAd4w', 
  choices=[
    Choices(finish_reason='stop', index=0, 
    message=Message(content="The current weather in San Francisco is 72°F, in Tokyo it's 10°C, and in Paris it's 22°C.", role='assistant'))
  ], 
  created=1700319955, 
  model='gpt-3.5-turbo-1106', 
  object='chat.completion', 
  system_fingerprint='fp_eeff13170a', 
  usage={'completion_tokens': 28, 'prompt_tokens': 169, 'total_tokens': 197}, 
  _response_ms=1032.431
)
```

## 平行函式呼叫 - Azure OpenAI {#parallel-function-calling---azure-openai}
```python
# set Azure env variables
import os
os.environ['AZURE_API_KEY'] = "" # litellm reads AZURE_API_KEY from .env and sends the request
os.environ['AZURE_API_BASE'] = "https://openai-gpt-4-test-v-1.openai.azure.com/"
os.environ['AZURE_API_VERSION'] = "2023-07-01-preview"

import litellm
import json
# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API
def get_current_weather(location, unit="fahrenheit"):
    """Get the current weather in a given location"""
    if "tokyo" in location.lower():
        return json.dumps({"location": "Tokyo", "temperature": "10", "unit": "celsius"})
    elif "san francisco" in location.lower():
        return json.dumps({"location": "San Francisco", "temperature": "72", "unit": "fahrenheit"})
    elif "paris" in location.lower():
        return json.dumps({"location": "Paris", "temperature": "22", "unit": "celsius"})
    else:
        return json.dumps({"location": location, "temperature": "unknown"})

## Step 1: send the conversation and available functions to the model
messages = [{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}]
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]

response = litellm.completion(
    model="azure/chatgpt-functioncalling", # model = azure/<your-azure-deployment-name>
    messages=messages,
    tools=tools,
    tool_choice="auto",  # auto is default, but we'll be explicit
)
print("\nLLM Response1:\n", response)
response_message = response.choices[0].message
tool_calls = response.choices[0].message.tool_calls
print("\nTool Choice:\n", tool_calls)

## Step 2 - Parse the Model Response and Execute Functions
# Check if the model wants to call a function
if tool_calls:
    # Execute the functions and prepare responses
    available_functions = {
        "get_current_weather": get_current_weather,
    }

    messages.append(response_message)  # Extend conversation with assistant's reply

    for tool_call in tool_calls:
      print(f"\nExecuting tool call\n{tool_call}")
      function_name = tool_call.function.name
      function_to_call = available_functions[function_name]
      function_args = json.loads(tool_call.function.arguments)
      # calling the get_current_weather() function
      function_response = function_to_call(
          location=function_args.get("location"),
          unit=function_args.get("unit"),
      )
      print(f"Result from tool call\n{function_response}\n")

      # Extend conversation with function response
      messages.append(
          {
              "tool_call_id": tool_call.id,
              "role": "tool",
              "name": function_name,
              "content": function_response,
          }
      )

## Step 3 - Second litellm.completion() call
second_response = litellm.completion(
    model="azure/chatgpt-functioncalling",
    messages=messages,
)
print("Second Response\n", second_response)
print("Second Response Message\n", second_response.choices[0].message.content)

```

## 已棄用 - 使用 `completion(functions=functions)` 的函式呼叫 {#deprecated---function-calling-with-completionfunctionsfunctions}
```python
import os, litellm
from litellm import completion

os.environ['OPENAI_API_KEY'] = ""

messages = [
    {"role": "user", "content": "What is the weather like in Boston?"}
]

# python function that will get executed
def get_current_weather(location):
  if location == "Boston, MA":
    return "The weather is 12F"

# JSON Schema to pass to OpenAI
functions = [
    {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["location"]
      }
    }
  ]

response = completion(model="gpt-3.5-turbo-0613", messages=messages, functions=functions)
print(response)
```

## litellm.function_to_dict - 將函式轉換為供 OpenAI 函式呼叫使用的字典 {#litellmfunction_to_dict---convert-functions-to-dictionary-for-openai-function-calling}
`function_to_dict` 可讓您傳入函式 docstring，並產生可供 OpenAI 函式呼叫使用的字典

### 使用 `function_to_dict` {#using-function_to_dict}
1. 定義您的函式 `get_current_weather`
2. 為您的函式加入 docstring `get_current_weather`
3. 將函式傳入 `litellm.utils.function_to_dict`，以取得供 OpenAI 函式呼叫使用的字典

```python
# function with docstring
def get_current_weather(location: str, unit: str):
        """Get the current weather in a given location

        Parameters
        ----------
        location : str
            The city and state, e.g. San Francisco, CA
        unit : {'celsius', 'fahrenheit'}
            Temperature unit

        Returns
        -------
        str
            a sentence indicating the weather
        """
        if location == "Boston, MA":
            return "The weather is 12F"

# use litellm.utils.function_to_dict to convert function to dict
function_json = litellm.utils.function_to_dict(get_current_weather)
print(function_json)
```

#### function_to_dict 的輸出 {#output-from-function_to_dict}
```json
{
    'name': 'get_current_weather', 
    'description': 'Get the current weather in a given location', 
    'parameters': {
        'type': 'object', 
        'properties': {
            'location': {'type': 'string', 'description': 'The city and state, e.g. San Francisco, CA'}, 
            'unit': {'type': 'string', 'description': 'Temperature unit', 'enum': "['fahrenheit', 'celsius']"}
        }, 
        'required': ['location', 'unit']
    }
}
```

### 搭配函式呼叫使用 function_to_dict {#using-function_to_dict-with-function-calling}
```python
import os, litellm
from litellm import completion

os.environ['OPENAI_API_KEY'] = ""

messages = [
    {"role": "user", "content": "What is the weather like in Boston?"}
]

def get_current_weather(location: str, unit: str):
    """Get the current weather in a given location

    Parameters
    ----------
    location : str
        The city and state, e.g. San Francisco, CA
    unit : str {'celsius', 'fahrenheit'}
        Temperature unit

    Returns
    -------
    str
        a sentence indicating the weather
    """
    if location == "Boston, MA":
        return "The weather is 12F"

functions = [litellm.utils.function_to_dict(get_current_weather)]

response = completion(model="gpt-3.5-turbo-0613", messages=messages, functions=functions)
print(response)
```

## 適用於不支援函式呼叫的模型之函式呼叫 {#function-calling-for-models-wout-function-calling-support}

### 將函式加入提示詞 {#adding-function-to-prompt}
對於不支援函式呼叫的模型／提供者，LiteLLM 讓您可以將函式加入提示詞集合：`litellm.add_function_to_prompt = True`

#### 用法 {#usage}
```python
import os, litellm
from litellm import completion

# IMPORTANT - Set this to TRUE to add the function to the prompt for Non OpenAI LLMs
litellm.add_function_to_prompt = True # set add_function_to_prompt for Non OpenAI LLMs

os.environ['ANTHROPIC_API_KEY'] = ""

messages = [
    {"role": "user", "content": "What is the weather like in Boston?"}
]

def get_current_weather(location):
  if location == "Boston, MA":
    return "The weather is 12F"

functions = [
    {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["location"]
      }
    }
  ]

response = completion(model="claude-2", messages=messages, functions=functions)
print(response)
```
