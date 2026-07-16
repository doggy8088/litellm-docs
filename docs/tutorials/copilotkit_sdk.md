import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 搭配 LiteLLM 的 CopilotKit SDK {#copilotkit-sdk-with-litellm}

透過 LiteLLM Proxy 使用 CopilotKit SDK 搭配任何 LLM 提供者。

> **注意：** CopilotKit SDK 與 LiteLLM Proxy 的整合可搭配 LiteLLM v1.81.7-nightly 或更高版本使用。

## 快速開始 {#quick-start}

### 1. 將模型新增至設定 {#1-add-model-to-config}

```yaml title="config.yaml"
model_list:
  - model_name: claude-sonnet-4-5
    litellm_params:
      model: "anthropic/claude-sonnet-4-5-20250514-v1:0"
      api_key: "os.environ/ANTHROPIC_API_KEY"
```

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```bash
litellm --config config.yaml
```

### 3. 使用 CopilotKit SDK {#3-use-copilotkit-sdk}

```typescript
import OpenAI from "openai";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const model = "claude-sonnet-4-5";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-12345",
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:4000/v1",
});

const serviceAdapter = new OpenAIAdapter({ openai, model });
const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

### 4. 測試 {#4-test}

```bash
curl -X POST http://localhost:3000/api/copilotkit \
  -H "Content-Type: application/json" \
  -d '{
    "method": "agent/run",
    "params": {
        "agentId": "default"
    },
        "runId": "your_run_id",
        "threadId": "your_thread_id",
        "runId": ""your_run_id"",
        "tools": [],
        "context": [],
        "forwardedProps": {},
        "state": {},
        "messages": [
            {
                "id": "166e573e-f7c6-4c0f-8685-04dbefec18be",
                "content": "Hi",
                "role": "user"
            }
        ]
    }
}'
```

## 環境變數 {#environment-variables}

| 變數 | 值 | 說明 |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-12345` | 您的 LiteLLM API 金鑰 |
| `OPENAI_BASE_URL` | `http://localhost:4000/v1` | LiteLLM proxy URL |

## 相關資源 {#related-resources}

- [CopilotKit 文件](https://docs.copilotkit.ai)
- [LiteLLM Proxy 快速開始](../proxy/quick_start)
