---
title: "v1.100.2 - Claude Code 自動模式、Bedrock GPT 與 Grok 修正及 TypeSafe Jev"
slug: "v1-100-2"
date: 2026-09-23T06:12:15
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
docker.litellm.ai/berriai/litellm:1.100.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.100.2
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.100.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.100.2) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.100.2` 是 [`v1.100.1`](/release_notes/v1.100.1/v1-100-1) 之上的修補版本。它讓 Claude Code 自動模式可透過閘道運作，修正 Claude Code 切換到 Bedrock OpenAI GPT 與 xAI Grok 模型時的問題，將中途 Responses 內容政策錯誤路由到 `content_policy_fallbacks`，並加入 TypeSafe Jev 傳遞。沒有組態變更。Docker 映像與 PyPI 套件皆是根據 [`9c1216a`](https://github.com/BerriAI/litellm/commit/9c1216a4278a4b8224ac1c8bfa922a110cdcd678) 建置

## Claude Code 自動模式可透過閘道運作 {#claude-code-auto-mode-works-through-the-gateway}

Claude Code 自動模式會在 `safeguards` 欄位中傳送 `dangerous-tool-use-2026-09-03` beta，並在 `/v1/messages` 上傳送。代理程式在原生 Anthropic 路由上會丟棄該欄位，並移除其無法辨識的 beta 值；而 Bedrock Invoke 與 Bedrock Mantle 會同時丟棄兩者，Vertex AI 則會在沒有 beta 的情況下轉送該欄位。接著 Claude Code 回報經由閘道無法使用自動模式，並繼續計費其自己的分類器請求。現在該欄位與 beta 會一併送達 Anthropic、Bedrock 與 Vertex AI，而 `safeguard_results` 會回傳給 Claude Code

## Bedrock OpenAI GPT 與 xAI Grok 模型在 Converse 上的問題 {#bedrock-openai-gpt-and-xai-grok-models-on-converse}

在 Bedrock Converse 上，OpenAI GPT 與 xAI Grok 模型會拒絕低於 16 的 `maxTokens`。當 `/model` 切換到其中之一時，Claude Code 會送出 `max_tokens=1` 探測，因此切換會以 400 失敗。現在代理程式會將 Converse 上 `openai.gpt-*` 與 `xai.grok-*` 模型的 `maxTokens` 提高到 16，而其他所有 Bedrock 模型仍會收到與呼叫端送出內容完全相同的值

在該探測之後，GPT-6 模型（例如 `us.openai.gpt-6-astra`）上的第一個實際回合仍會以 400 `Unknown parameter: 'thinking'` 失敗，因為這條線上的 Converse 推理閘僅辨識 `openai.gpt-5`。現在它會比對任何 `openai.gpt-<digit>` 模型，因此 `reasoning_effort` 會對應到 `reasoning.effort`，而且針對這些模型會移除 Anthropic `thinking` 區塊

## 中途 Responses API 內容政策錯誤會到達備援 {#mid-stream-responses-api-content-policy-errors-reach-fallbacks}

在 Responses API 上於中途到達的 `content_policy_violation` 會顯示為一個裸露的 `APIError`，因此它從未到達 `content_policy_fallbacks`，而用戶端會取得原始錯誤。現在中途錯誤事件會對應到與非串流路徑相同的具型別例外。拒絕會送往 `content_policy_fallbacks`，429 與 5xx 仍可適用於一般備援，而其他用戶端錯誤，例如內容視窗錯誤，則會直接拋出

## TypeSafe Jev 傳遞 {#typesafe-jev-pass-through}

TypeSafe Jev 可在此版本使用。新的 `/typesafe/{endpoint}` 傳遞會以代理程式的 `TYPESAFE_API_KEY` 轉送至 TypeSafe，因此呼叫端會使用其虛擬金鑰，而支出則依模型登錄中的 `typesafe/jev-1.13.0`、`typesafe/jev-latest` 與 `typesafe/jev-preview` 項目定價。請參閱 [TypeSafe 傳遞文件](/docs/pass_through/typesafe)

### 有哪些變更 {#whats-changed}

- fix(anthropic): 在原生 /v1/messages 上不變地轉送 safeguards 與 anthropic-beta - [PR #42152](https://github.com/BerriAI/litellm/pull/42152)
- fix(anthropic): 將 Claude Code safeguards 與 dangerous-tool-use beta 轉送至 Bedrock Invoke 與 Vertex 的 /v1/messages - [PR #42288](https://github.com/BerriAI/litellm/pull/42288)
- fix(bedrock): 將 maxTokens 下修至 OpenAI GPT 與 xAI Grok 模型在 Converse 上的 16 token 最低值 - [PR #41870](https://github.com/BerriAI/litellm/pull/41870)
- fix(bedrock): 在 Converse 推理閘中比對任何 `openai.gpt-<digit>` 模型，來自 [PR #31884](https://github.com/BerriAI/litellm/pull/31884)
- fix(responses): 將中途錯誤事件經由 exception_type 路由，以便觸發 content_policy_fallbacks - [PR #40988](https://github.com/BerriAI/litellm/pull/40988)
- feat(proxy): 新增 TypeSafe AI Jev evaluate 傳遞，並具備依登錄定價的支出追蹤 - [PR #41607](https://github.com/BerriAI/litellm/pull/41607)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.100.1...v1.100.2
