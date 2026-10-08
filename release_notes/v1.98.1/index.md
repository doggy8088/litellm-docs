---
title: "v1.98.1 - Bedrock 上的 Claude Code、GPT 和 Grok，終端使用者預算重設"
slug: "v1-98-1"
date: 2026-09-25T06:20:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.98.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.98.1
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.98.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.98.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.98.1` 是建置在 [`v1.98.0`](/release_notes/v1.98.0/v1-98-0) 之上的修補版更新。它讓 Claude Code 能切換到 Bedrock OpenAI GPT 與 xAI Grok 模型，修正終端使用者預算重設，並將 GPT-6 模型名稱對應到 GPT-5 request family。沒有新的資料庫 migration 或破壞性變更。`v1.98.1` 標籤指向 [`b521c4c`](https://github.com/BerriAI/litellm/commit/b521c4c74ed1432770c69b2a24196f96366de8a8)

## Claude Code 可與 Bedrock、OpenAI GPT 和 xAI Grok 模型搭配使用 {#claude-code-works-with-bedrock-openai-gpt-and-xai-grok-models}

當您使用 `/model` 切換模型時，Claude Code 會送出 `max_tokens=1` 探測，而 Bedrock OpenAI GPT 與 xAI Grok 模型會拒絕任何低於 16 的值，因此切換會以 400 失敗。Bedrock Converse 路由現在會將 `maxTokens` 提升至 16，適用於 `openai.gpt-*` 與 `xai.grok-*` 模型，而其他 Bedrock 模型則維持收到的值不變

一旦切換成功，GPT-6 模型（例如 `us.openai.gpt-6-astra`）上的第一則訊息仍會因 `Unknown parameter: 'thinking'` 失敗。Converse reasoning gate 現在可辨識任何 `openai.gpt-<digit>` 模型，因此 `reasoning_effort` 會對應到 `reasoning.effort`，而 Claude Code 的 `thinking` 區塊會針對這些模型直接移除，而不是向下傳遞

## 終端使用者預算重設 {#end-user-budget-resets}

超過約 32,700 位終端使用者的共享預算從未重設，因為重設工作會在單一語句中列出每位終端使用者的 id，而 Postgres 拒絕了該語句，因此這些終端使用者持續被封鎖。現在該工作會依據終端使用者的預算連結來重設。重設也會將記憶體與 Redis 中快取的終端使用者支出計數器歸零，因此每個 replica 上的請求會在時間窗口一到就停止收到 429，而不是要等到快取過期之後才停止

## GPT-6 模型名稱使用 GPT-5 請求系列 {#gpt-6-model-names-use-the-gpt-5-request-family}

OpenAI 與 Azure 設定現在會將 `gpt-6` 模型名稱視為 `gpt-5`，因此它們會套用相同的請求參數處理

## Docker 映像鎖定 Python 3.13 {#docker-images-pin-python-313}

這些映像安裝了一個未固定版本的 `python3`，而它現在會解析為 Python 3.14；在該版本中，已固定的 `uvloop` 已無法建置。此系列中的每個映像（包含 migrations 映像）現在都會安裝 Python 3.13。base image 也改為使用 glibc 2.44 的 wolfi-base，而 lockfile 則重新整理了 anyio、gitpython、pypdf、restrictedpython、soupsieve、sqlparse 和 tornado

### 變更內容 {#whats-changed}

- fix(bedrock): 將 OpenAI GPT 與 xAI Grok 模型在 Converse 上的 maxTokens 限制為 16-token 最小值 - [PR #41870](https://github.com/BerriAI/litellm/pull/41870)
- fix(bedrock): 在 Converse reasoning gate 中比對任何 `openai.gpt-<digit>` 模型 - [`9f48cca`](https://github.com/BerriAI/litellm/commit/9f48ccaecf3e1c02c14408fe1aab94d051a8bc1a)
- fix(docker): 將 wolfi-base 升級以支援 glibc 2.44，並將 apk python 鎖定為 3.13 - [`1af2cad`](https://github.com/BerriAI/litellm/commit/1af2cad04ab4d260d9cc2444ff8c3ff67c454c66)
- fix(docker): 將 wolfi-base 升級以支援 glibc 2.44，並在 migrations 映像中將 apk python 鎖定為 3.13 - [`0c0dda9`](https://github.com/BerriAI/litellm/commit/0c0dda97809e5096f58344be77eeac8ced1f86e6)
- fix: 在 OpenAI 與 Azure 設定中，將 gpt-6 名稱視為 gpt-5 request family - [PR #39631](https://github.com/BerriAI/litellm/pull/39631)
- fix(proxy): 在 budget reset 時使終端使用者支出計數器與快取失效 - [PR #39729](https://github.com/BerriAI/litellm/pull/39729)
- fix(reset_budget_job): 依據預算連結而非使用者 id 重設終端使用者 - [PR #40639](https://github.com/BerriAI/litellm/pull/40639)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.98.0...v1.98.1
