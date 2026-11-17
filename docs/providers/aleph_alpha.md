---
title: "透過 LiteLLM 使用 Aleph Alpha API：設定與模型"
sidebar_label: "Aleph Alpha"
description: "透過 LiteLLM Python SDK 將聊天完成請求傳送至 Aleph Alpha 的 Luminous Base、Extended 與 Supreme 模型，以及其 control 變體。"
---

# Aleph Alpha {#aleph-alpha}

LiteLLM 支援來自 [Aleph Alpha](https://www.aleph-alpha.com/) 的所有模型。 

如同 AI21 和 Cohere，您可以在沒有候補名單的情況下使用這些模型。 

### API 金鑰 {#api-keys}
```python
import os
os.environ["ALEPHALPHA_API_KEY"] = ""
```

### Aleph Alpha 模型 {#aleph-alpha-models}
https://www.aleph-alpha.com/

| 模型名稱       | 函式呼叫                                  | 必要的作業系統變數              |
|------------------|--------------------------------------------|------------------------------------|
| luminous-base       | `completion(model='luminous-base', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-base-control       | `completion(model='luminous-base-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-extended       | `completion(model='luminous-extended', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-extended-control       | `completion(model='luminous-extended-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-supreme     | `completion(model='luminous-supreme', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-supreme-control     | `completion(model='luminous-supreme-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
