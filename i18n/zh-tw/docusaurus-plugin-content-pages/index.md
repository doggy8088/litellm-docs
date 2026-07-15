---
title: LiteLLM 文件
description: 使用統一介面呼叫 100 多個 LLM 提供者的 LiteLLM 文件。
---

# LiteLLM

使用統一介面呼叫 100 多個 LLM 提供者。

LiteLLM 提供 OpenAI 相容的 Python SDK 與自行託管的 LLM Gateway，協助您整合模型、路由請求、追蹤支出並管理存取權限。

[開始使用](/docs)　[學習 LiteLLM](/docs/learn)　[瀏覽教學](/docs/tutorials)

* * *

## 主要功能

- 透過相同的 OpenAI 格式呼叫不同的模型提供者
- 使用 Router 進行路由、重試、備援與負載平衡
- 透過 Proxy Server 集中管理金鑰、預算、記錄與防護欄
- 整合可觀測性、工具呼叫、MCP 與代理程式工作流程

## 快速開始

```python
from litellm import completion

response = completion(
  model="openai/gpt-4o",
  messages=[{"role": "user", "content": "Hello, LiteLLM!"}],
)
print(response.choices[0].message.content)
```

如需完整安裝方式、提供者設定與 Proxy 部署說明，請從[文件首頁](/docs)開始。
