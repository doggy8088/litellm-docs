---
title: v1.55.8-stable
slug: v1.55.8-stable
date: 2024-12-22T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [langfuse, fallbacks, new models, azure_storage]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

# v1.55.8-stable {#v1558-stable}

LiteLLM 最新穩定版已[正式推出](https://github.com/BerriAI/litellm/releases/tag/v1.55.8-stable)。以下是自 v1.52.2-stable 以來的 5 項更新。

`langfuse`, `fallbacks`, `new models`, `azure_storage`

<Image img={require('../../img/langfuse_prmpt_mgmt.png')} />

## Langfuse 提示管理 {#langfuse-prompt-management}

這讓您能輕鬆執行實驗，或在 Langfuse 上變更特定模型 `gpt-4o` 到 `gpt-4o-mini`，而不是在您的應用程式中進行變更。[從這裡開始](https://docs.litellm.ai/docs/proxy/prompt_management)

## 在用戶端控制備援提示詞  {#control-fallback-prompts-client-side}

> Claude 提示詞與 OpenAI 不同

在執行備援時，傳入特定於模型的提示詞。[從這裡開始](https://docs.litellm.ai/docs/proxy/reliability#control-fallback-prompts)

## 新的提供者 / 模型 {#new-providers--models}

- [NVIDIA Triton](https://developer.nvidia.com/triton-inference-server) `/infer` 端點。[從這裡開始](https://docs.litellm.ai/docs/providers/triton-inference-server)
- [Infinity](https://github.com/michaelfeil/infinity) Rerank 模型 [從這裡開始](https://docs.litellm.ai/docs/providers/infinity)

## ✨ Azure Data Lake Storage 支援 {#-azure-data-lake-storage-support}

將 LLM 使用量（支出、tokens）資料傳送至 [Azure Data Lake](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-introduction)。這讓您能更容易在其他服務上使用這些使用量資料（例如 Databricks）
 [從這裡開始](https://docs.litellm.ai/docs/proxy/logging#azure-blob-storage)

## Docker 執行 LiteLLM {#docker-run-litellm}

```shell
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:litellm_stable_release_branch-v1.55.8-stable
```

## 取得每日更新 {#get-daily-updates}

LiteLLM 每天都會推出新版本。[在 LinkedIn 上追蹤我們](https://www.linkedin.com/company/berri-ai/) 以取得每日更新。
