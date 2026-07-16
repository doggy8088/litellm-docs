---
title: v1.57.3 - 新的 Base Docker Image
slug: v1.57.3
date: 2025-01-08T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [docker image, security, vulnerability]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

`docker image`, `security`, `vulnerability`

# 0 個關鍵/高風險漏洞 {#0-criticalhigh-vulnerabilities}

<Image img={require('../../img/release_notes/security.png')} />

## 有什麼變更？ {#what-changed}
- LiteLLMBase 映像現在使用 `cgr.dev/chainguard/python:latest-dev`

## 為什麼要變更？ {#why-the-change}

為了確保 LiteLLM Docker Image 上沒有任何關鍵/高風險漏洞

## 遷移指南 {#migration-guide}

- 如果您使用自訂 dockerfile，且以 litellm 作為基底映像 + `apt-get`

請不要使用 `apt-get`，改用 `apk`；基底 litellm 映像將不再安裝 `apt-get`。

**只有當您在 Dockerfile 中使用 `apt-get` 時才會受影響**
```shell
# Use the provided base image
FROM docker.litellm.ai/berriai/litellm:main-latest

# Set the working directory
WORKDIR /app

# Install dependencies - CHANGE THIS to `apk`
RUN apt-get update && apt-get install -y dumb-init 
```


變更前
```
RUN apt-get update && apt-get install -y dumb-init
```

變更後
```
RUN apk update && apk add --no-cache dumb-init
```
