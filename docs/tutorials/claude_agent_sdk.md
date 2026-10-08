import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 LiteLLM 的 Claude Agent SDK {#claude-agent-sdk-with-litellm}

透過 LiteLLM Proxy 使用 Anthropic 的 Claude Agent SDK 串接任何 LLM 提供者。

Claude Agent SDK 提供用於建立 AI 代理程式的高階介面。只要將其指向 LiteLLM，您就可以在 OpenAI、Bedrock、Azure、Vertex AI，或任何其他提供者上使用相同的代理程式程式碼。

## 快速開始 {#quick-start}

### 1. 安裝依賴項 {#1-install-dependencies}

```bash
uv add claude-agent-sdk
```

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: bedrock-claude-sonnet-5
    litellm_params:
      model: "bedrock/us.anthropic.{{anthropic}}"
      aws_region_name: "us-east-1"

  - model_name: bedrock-claude-opus-5
    litellm_params:
      model: "bedrock/us.anthropic.{{anthropic_large}}"
      aws_region_name: "us-east-1"

  - model_name: bedrock-nova-premier
    litellm_params:
      model: "bedrock/amazon.nova-premier-v1:0"
      aws_region_name: "us-east-1"
```

```bash
litellm --config config.yaml
```

### 3. 將 Agent SDK 指向 LiteLLM {#3-point-agent-sdk-to-litellm}

| 環境變數 | 值 | 說明 |
|---------------------|-------|-------------|
| `ANTHROPIC_BASE_URL` | `http://localhost:4000` | LiteLLM proxy URL |
| `ANTHROPIC_API_KEY` | `sk-<your-api-key>` | 您的 LiteLLM API 金鑰（不是 Anthropic 金鑰） |

```python title="agent.py" showLineNumbers
import os
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

# Point to LiteLLM proxy (not Anthropic)
os.environ["ANTHROPIC_BASE_URL"] = "http://localhost:4000"
os.environ["ANTHROPIC_API_KEY"] = "sk-<your-api-key>"  # Your LiteLLM key

# Configure agent with any model from your config
options = ClaudeAgentOptions(
    system_prompt="You are a helpful AI assistant.",
    model="bedrock-claude-sonnet-5",  # Use any model from config.yaml
    max_turns=20,
)

async with ClaudeSDKClient(options=options) as client:
    await client.query("What is LiteLLM?")
    
    async for msg in client.receive_response():
        if hasattr(msg, 'content'):
            for content_block in msg.content:
                if hasattr(content_block, 'text'):
                    print(content_block.text, end='', flush=True)
```


## 為什麼要在 Agent SDK 中使用 LiteLLM？ {#why-use-litellm-with-agent-sdk}

| 功能 | 效益 |
|---------|---------|
| **多提供者** | 使用相同的代理程式程式碼搭配 OpenAI、Bedrock、Azure、Vertex AI 等。 |
| **成本追蹤** | 追蹤所有代理程式對話的支出 |
| **速率限制** | 設定代理程式使用量的預算與限制 |
| **負載平衡** | 將請求分散到多個 API 金鑰或區域 |
| **備援** | 若某個模型失敗，自動以不同模型重試 |

## 完整範例 {#complete-example}

請參閱我們的 [cookbook 範例](https://github.com/BerriAI/litellm/tree/main/cookbook/anthropic_agent_sdk)，取得一個完整的互動式 CLI 代理程式，它會：
- 即時串流回應
- 動態切換模型
- 從 proxy 取得可用模型

```bash
# Clone and run the example
git clone https://github.com/BerriAI/litellm.git
cd litellm/cookbook/anthropic_agent_sdk
uv add -r requirements.txt
python main.py
```

## 相關資源 {#related-resources}

- [Claude Agent SDK 文件](https://github.com/anthropics/anthropic-agent-sdk)
- [LiteLLM Proxy 快速開始](../proxy/quick_start)
- [完整 Cookbook 範例](https://github.com/BerriAI/litellm/tree/main/cookbook/anthropic_agent_sdk)
