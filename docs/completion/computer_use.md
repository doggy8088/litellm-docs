import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 電腦使用 {#computer-use}

電腦使用可讓模型透過擷取螢幕截圖並執行點擊、輸入與捲動等動作，與電腦介面互動。這使 AI 模型能夠自主操作桌面環境。

**支援的提供者：**
- Anthropic API (`anthropic/`)
- Bedrock (Anthropic) (`bedrock/`)
- Vertex AI (Anthropic) (`vertex_ai/`)

**支援的工具類型：**
- `computer` - 具顯示參數的電腦互動工具
- `bash` - Bash shell 工具  
- `text_editor` - 文字編輯器工具
- `web_search` - 網頁搜尋工具

LiteLLM 會將所有支援提供者的電腦使用工具標準化。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

# Computer use tool
    tools = [
        {
            "type": "computer_20241022",
            "name": "computer",
            "display_height_px": 768,
            "display_width_px": 1024,
            "display_number": 0,
        }
    ]
    
    messages = [
        {
            "role": "user", 
            "content": [
                {
                    "type": "text",
                "text": "Take a screenshot and tell me what you see"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                }
            }
        ]
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy Server">

1. 在 config.yaml 定義電腦使用模型

```yaml
model_list:
  - model_name: claude-3-5-sonnet-latest # Anthropic claude-3-5-sonnet-latest
    litellm_params:
      model: anthropic/claude-3-5-sonnet-latest
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-bedrock         # Bedrock Anthropic model
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
    model_info:
      supports_computer_use: True        # set supports_computer_use to True so /model/info returns this attribute as True
```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 使用 OpenAI Python SDK 進行測試

```python
import os 
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234", # your litellm proxy api key
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-3-5-sonnet-latest",
    messages=[
        {
            "role": "user", 
            "content": [
                {
                    "type": "text",
                    "text": "Take a screenshot and tell me what you see"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                    }
                }
            ]
        }
    ],
    tools=[
        {
            "type": "computer_20241022",
            "name": "computer",
            "display_height_px": 768,
            "display_width_px": 1024,
            "display_number": 0,
        }
    ]
)

print(response)
```

</TabItem>
</Tabs>

## 檢查模型是否支援 `computer use` {#checking-if-a-model-supports-computer-use}

<Tabs>
<TabItem label="LiteLLM Python SDK" value="Python">

使用 `litellm.supports_computer_use(model="")` -> 若模型支援電腦使用則回傳 `True`，若不支援則回傳 `False`

```python
import litellm

assert litellm.supports_computer_use(model="anthropic/claude-3-5-sonnet-latest") == True
assert litellm.supports_computer_use(model="anthropic/claude-3-7-sonnet-20250219") == True
assert litellm.supports_computer_use(model="bedrock/anthropic.claude-haiku-4-5-20251001:0") == True
assert litellm.supports_computer_use(model="vertex_ai/claude-3-5-sonnet") == True
assert litellm.supports_computer_use(model="openai/gpt-4") == False
```
</TabItem>

<TabItem label="LiteLLM Proxy Server" value="proxy">

1. 在 config.yaml 定義電腦使用模型

```yaml
model_list:
  - model_name: claude-3-5-sonnet-latest # Anthropic claude-3-5-sonnet-latest
    litellm_params:
      model: anthropic/claude-3-5-sonnet-latest
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-bedrock         # Bedrock Anthropic model
    litellm_params:
      model: bedrock/anthropic.claude-haiku-4-5-20251001:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
    model_info:
      supports_computer_use: True        # set supports_computer_use to True so /model/info returns this attribute as True
```

2. 執行 proxy server

```bash
litellm --config config.yaml
```

3. 呼叫 `/model_group/info` 以檢查您的模型是否支援 `computer use`

```shell
curl -X 'GET' \
  'http://localhost:4000/model_group/info' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-1234'
```

預期回應 

```json
{
  "data": [
    {
      "model_group": "claude-3-5-sonnet-latest",
      "providers": ["anthropic"],
      "max_input_tokens": 200000,
      "max_output_tokens": 8192,
      "mode": "chat",
      "supports_computer_use": true, # 👈 supports_computer_use is true
      "supports_vision": true,
      "supports_function_calling": true
    },
    {
      "model_group": "claude-bedrock",
      "providers": ["bedrock"],
      "max_input_tokens": 200000,
      "max_output_tokens": 8192,
      "mode": "chat",
      "supports_computer_use": true, # 👈 supports_computer_use is true
      "supports_vision": true,
      "supports_function_calling": true
    }
  ]
}
```

</TabItem>
</Tabs>

## 不同的工具類型 {#different-tool-types}

電腦使用支援數種不同的工具類型，以滿足各種互動模式：

<Tabs>
<TabItem value="computer" label="Computer Tool">

`computer_20241022` 工具提供直接的螢幕互動能力。

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "computer_20241022", 
        "name": "computer",
        "display_height_px": 768,
        "display_width_px": 1024,
        "display_number": 0,
    }
]

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text", 
                "text": "Click on the search button in the screenshot"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                }
            }
        ]
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

</TabItem>
<TabItem value="bash" label="Bash Tool">

`bash_20241022` 工具提供命令列介面存取。

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "bash_20241022",
        "name": "bash"
    }
]

messages = [
    {
        "role": "user",
        "content": "List the files in the current directory using bash"
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

</TabItem>
<TabItem value="text_editor" label="Text Editor Tool">

`text_editor_20250124` 工具提供文字檔案編輯能力。

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "text_editor_20250124",
        "name": "str_replace_editor"
    }
]

messages = [
    {
        "role": "user",
        "content": "Create a simple Python hello world script"
    }
]

response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
    messages=messages,
    tools=tools,
)

print(response)
```

</TabItem>
</Tabs>

## 具備多種工具的進階用法 {#advanced-usage-with-multiple-tools}

您可以在單一請求中結合不同的電腦使用工具：

```python
import os 
from litellm import completion

os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "computer_20241022",
        "name": "computer", 
        "display_height_px": 768,
        "display_width_px": 1024,
        "display_number": 0,
    },
    {
        "type": "bash_20241022",
        "name": "bash"
    },
    {
        "type": "text_editor_20250124", 
        "name": "str_replace_editor"
    }
]

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Take a screenshot, then create a file describing what you see, and finally use bash to show the file contents"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                    }
                }
            ]
        }
    ]
    
response = completion(
    model="anthropic/claude-3-5-sonnet-latest",
            messages=messages,
            tools=tools,
)

print(response)
```

## 規格 {#spec}

### 電腦工具 (`computer_20241022`) {#computer-tool-computer_20241022}

```json
{
  "type": "computer_20241022",
  "name": "computer",
  "display_height_px": 768,    // Required: Screen height in pixels  
  "display_width_px": 1024,    // Required: Screen width in pixels
  "display_number": 0          // Optional: Display number (default: 0)
}
```

### Bash 工具 (`bash_20241022`) {#bash-tool-bash_20241022}

```json
{
  "type": "bash_20241022", 
  "name": "bash"              // Required: Tool name
}
```

### 文字編輯器工具 (`text_editor_20250124`) {#text-editor-tool-text_editor_20250124}

```json
{
  "type": "text_editor_20250124",
  "name": "str_replace_editor"  // Required: Tool name
}
```

### 網頁搜尋工具 (`web_search_20250305`) {#web-search-tool-web_search_20250305}

```json
{
  "type": "web_search_20250305",
  "name": "web_search"         // Required: Tool name
}
```
