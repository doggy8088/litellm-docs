import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# MCP 成本追蹤 {#mcp-cost-tracking}

LiteLLM 提供兩種方式來追蹤 MCP 工具請求的成本：

| 方法 | 使用時機 | 功能 |
|--------|-------------|--------------|
| **以設定為基礎的成本追蹤** | 針對每個工具／伺服器設定固定成本的簡單成本追蹤 | 依據設定自動追蹤成本 |
| **自訂 Post-MCP Hook** | 具備自訂邏輯的動態成本追蹤 | 可進行自訂成本計算與回應修改 |

### 以設定為基礎的成本追蹤 {#config-based-cost-tracking}

直接在您的 config.yaml 中為 MCP 伺服器設定固定成本：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-xxxxxxx

mcp_servers:
  zapier_server:
    url: "https://actions.zapier.com/mcp/sk-xxxxx/sse"
    mcp_info:
      mcp_server_cost_info:
        # Default cost for all tools in this server
        default_cost_per_query: 0.01
        # Custom cost for specific tools
        tool_name_to_cost_per_query:
          send_email: 0.05
          create_document: 0.03
          
  expensive_api_server:
    url: "https://api.expensive-service.com/mcp"
    mcp_info:
      mcp_server_cost_info:
        default_cost_per_query: 1.50
```

### 自訂 Post-MCP Hook {#custom-post-mcp-hook}

當您需要動態成本計算，或想在 MCP 回應回傳給使用者前先修改它時，請使用此方式。

#### 1. 建立自訂 MCP hook 檔案 {#1-create-a-custom-mcp-hook-file}

```python title="custom_mcp_hook.py" showLineNumbers
from typing import Optional
from litellm.integrations.custom_logger import CustomLogger
from litellm.types.mcp import MCPPostCallResponseObject


class CustomMCPCostTracker(CustomLogger):
    """
    Custom handler for MCP cost tracking and response modification
    """
    
    async def async_post_mcp_tool_call_hook(
        self, 
        kwargs, 
        response_obj: MCPPostCallResponseObject, 
        start_time, 
        end_time
    ) -> Optional[MCPPostCallResponseObject]:
        """
        Called after each MCP tool call. 
        Modify costs and response before returning to user.
        """
        
        # Extract tool information from kwargs
        tool_name = kwargs.get("name", "")
        server_name = kwargs.get("server_name", "")
        
        # Calculate custom cost based on your logic
        custom_cost = 42.00
        
        # Set the response cost
        response_obj.hidden_params.response_cost = custom_cost
        
  
      
        return response_obj
    

# Create instance for LiteLLM to use
custom_mcp_cost_tracker = CustomMCPCostTracker()
```

#### 2. 在 config.yaml 中設定 {#2-configure-in-configyaml}

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-xxxxxxx

# Add your custom MCP hook
callbacks:
  - custom_mcp_hook.custom_mcp_cost_tracker

mcp_servers:
  zapier_server:
    url: "https://actions.zapier.com/mcp/sk-xxxxx/sse"
```

#### 3. 啟動 proxy {#3-start-the-proxy}

```shell
$ litellm --config /path/to/config.yaml 
```

當 MCP 工具被呼叫時，您的自訂 hook 會：
1. 依據您的自訂邏輯計算成本
2. 視需要修改回應
3. 在 LiteLLM 的記錄系統中追蹤成本
