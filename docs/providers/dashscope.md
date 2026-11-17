---
title: "DashScope API (Qwen) 與 LiteLLM：設定"
sidebar_label: "Dashscope API (Qwen models)"
description: "從 LiteLLM Python SDK 在 DashScope 上呼叫 Alibaba Qwen Turbo、Plus 與 Max，支援串流、國際或北京 API base，以及 -latest 模型別名。"
---

# Dashscope API（Qwen 模型） {#dashscope-api-qwen-models}
https://dashscope.console.aliyun.com/

:::info
此平台在中國大陸以外現稱 QwenCloud，在中國大陸則稱為 Qianwen AI Platform。請參閱 [QwenCloud and Qianwen AI Platform page](./qwencloud) 以了解 `qwencloud/` 和 `qwen_ai_platform/` 前綴。`dashscope/` 前綴仍完全受支援，作為別名
:::

**我們支援所有 Qwen models（來自 Alibaba Cloud），在送出 completion 請求時只要將 `dashscope/` 設為前綴即可**

## API 金鑰 {#api-key}
```python
# env variable
os.environ['DASHSCOPE_API_KEY']
```

## API 基底 {#api-base}
您可以依據所在區域選擇性指定 API base URL：

| 區域 | API Base |
|--------|----------|
| **國際** | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| **中國/北京** | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

```python
# Set via environment variable
os.environ['DASHSCOPE_API_BASE'] = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

# Or pass directly in the completion call
response = completion(
    model="dashscope/qwen-turbo",
    messages=[{"role": "user", "content": "hello"}],
    api_base="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
)
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['DASHSCOPE_API_KEY'] = ""
response = completion(
    model="dashscope/qwen-turbo", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['DASHSCOPE_API_KEY'] = ""
response = completion(
    model="dashscope/qwen-turbo", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 所有支援的 Models {#all-supported-models}

[DashScope Model List](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope?spm=a2c4g.11186623.help-menu-2400256.d_2_8_0.1efd516e2tTXBn&scm=20140722.H_2833609._.OR_help-T_cn~zh-V_1#7f9c78ae99pwz)

| 模型名稱               | Function Call                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| qwen-turbo | `completion(model="dashscope/qwen-turbo", messages)` | 
| qwen-plus | `completion(model="dashscope/qwen-plus", messages)` | 
| qwen-max | `completion(model="dashscope/qwen-max", messages)` | 
| qwen-turbo-latest | `completion(model="dashscope/qwen-turbo-latest", messages)` | 
| qwen-plus-latest | `completion(model="dashscope/qwen-plus-latest", messages)` | 
| qwen-max-latest | `completion(model="dashscope/qwen-max-latest", messages)` | 
| qwen-vl-plus | `completion(model="dashscope/qwen-vl-plus", messages)` |  
| qwen-vl-max | `completion(model="dashscope/qwen-vl-max", messages)` |  
| qwq-32b | `completion(model="dashscope/qwq-32b", messages)` |  
| qwq-32b-preview | `completion(model="dashscope/qwq-32b-preview", messages)` |  
| qwen3-235b-a22b | `completion(model="dashscope/qwen3-235b-a22b", messages)` |  
| qwen3-32b | `completion(model="dashscope/qwen3-32b", messages)` |  
| qwen3-30b-a3b | `completion(model="dashscope/qwen3-30b-a3b", messages)` |

## 最新模型別名 {#latest-model-aliases}

<SinceVersion v="1.109.0" />

`dashscope/<family>-latest` 名稱會跟隨模型家族，在 LiteLLM 將其移至較新的模型時，讓您的應用程式維持單一模型字串。您可以像使用任何其他 DashScope 模型名稱一樣使用它們。LiteLLM 會將目前的目標模型傳送給 DashScope，並以該模型的價格計費。別名的運作方式以及各提供者的完整清單，請參閱 [最新模型別名](../model_latest_aliases.md)。

| 別名 | 模型家族 |
| --- | --- |
| `dashscope/qwen-max-latest` | Qwen Max |
| `dashscope/qwen-flash-latest` | Qwen Flash |
