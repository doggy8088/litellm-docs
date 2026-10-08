---
title: "v1.101.1 - Claude Code 自動模式、萬用字元授權自動路由器與 TypeSafe Jev"
slug: "v1-101-1"
date: 2026-09-23T06:12:25
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

## 使用此版本進行部署 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.101.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.101.1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.101.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.101.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.101.1` 是建構在 [`v1.101.0`](/release_notes/v1.101.0/v1-101-0) 之上的修補版本。它讓 Claude Code 自動模式能透過閘道運作，修正 Claude Code 在 Bedrock OpenAI GPT 與 xAI Grok 模型之間切換時的問題，讓萬用字元企業授權可解除自動路由器限制，並將 TypeSafe Jev 整合帶入此版本線。既有設定無需任何組態變更。Docker 映像與 PyPI 套件皆是從 [`432215e`](https://github.com/BerriAI/litellm/commit/432215e6196935d63b5558b3f2fa7ac38965449e) 建置而成

## Claude Code 自動模式可透過閘道運作 {#claude-code-auto-mode-works-through-the-gateway}

Claude Code 自動模式會傳送 `safeguards` 欄位以及 `dangerous-tool-use-2026-09-03` beta，適用於 `/v1/messages`。在原生 Anthropic 路由上，代理程式會捨棄該欄位，並移除其不認得的 beta 值；而 Bedrock Invoke 與 Bedrock Mantle 會同時捨棄兩者，Vertex AI 則會轉送該欄位但不含 beta。接著 Claude Code 會回報自動模式無法透過閘道使用，並持續對其自身的分類器請求計費。現在該欄位與 beta 會一併送達 Anthropic、Bedrock 與 Vertex AI，而 `safeguard_results` 會回傳給 Claude Code

## Bedrock Converse 上的 OpenAI GPT 與 xAI Grok 模型 {#bedrock-openai-gpt-and-xai-grok-models-on-converse}

在 Bedrock Converse 上，OpenAI GPT 與 xAI Grok 模型會拒絕低於 16 的 `maxTokens`。當 `/model` 切換到其中之一時，Claude Code 會送出 `max_tokens=1` 探測，因此切換會以 400 失敗。現在代理程式會將 `maxTokens` 對於 `openai.gpt-*` 與 `xai.grok-*` 模型在 Converse 上提升至 16，而其他所有 Bedrock 模型仍會收到呼叫端送出的原始內容

## 萬用字元授權可授予自動路由器功能 {#a-wildcard-license-grants-the-auto-router-feature}

企業授權預設為 `allowed_features: ["*"]`，但 `v1.101.0` 中的自動路由器閘道只接受字面上的 `auto_router` 項目。萬用字元授權會維持每個能力只能有一個路由器的限制，而 `config.yaml` 中的兩個自訂自動路由器會以 `ValueError` 中止啟動。現在 `*` 項目會授予每一項功能，包括自動路由器

## JWT 驗證路徑上的團隊模型別名 {#team-model-aliases-on-the-jwt-auth-path}

團隊模型別名未套用於以 JWT 驗證的呼叫端，因此受限制的團隊在使用別名時會收到 403，而開放團隊則會收到 400。現在 JWT 路徑會載入與虛擬金鑰路徑相同的團隊欄位，包括別名

## TypeSafe Jev {#typesafe-jev}

本版本提供 TypeSafe Jev。新的 `/typesafe/{endpoint}` pass-through 會搭配代理程式的 `TYPESAFE_API_KEY` 轉送至 TypeSafe，因此呼叫端使用其虛擬金鑰，而支出則依 `typesafe/jev-1.13.0`、`typesafe/jev-latest` 與 `typesafe/jev-preview` 的模型登錄項目計價。請參閱 [TypeSafe pass-through 文件](/docs/pass_through/typesafe)

complexity router 與 Auto Router 接受 Jev 作為層級分類器（`classifier_type: jev`），且 Jev 評估會遵守虛擬金鑰預算。新的 `typesafe` 防護欄會為每次完成的工具交換進行評分，並將 Jev 判定為不相關的工具結果清空，藉此在不呼叫摘要的情況下縮短冗長的代理程式迴圈；此功能為選用，且失敗時會開放放行。`/openrouter/{path}` pass-through 會根據新的成本對照表列，為 `openrouter/typesafe/jev-1.13` 決策計價

## 依賴項目 {#dependencies}

鎖定檔將 anyio 更新至 4.14.2，並將 soupsieve 更新至 2.9。已宣告的依賴範圍沒有變更

### 變更內容 {#whats-changed}

- fix(anthropic): 在原生 /v1/messages 上轉送 safeguards 與 anthropic-beta，保持不變 - [PR #42152](https://github.com/BerriAI/litellm/pull/42152)
- fix(anthropic): 在 /v1/messages 上將 Claude Code safeguards 與 dangerous-tool-use beta 轉送至 Bedrock Invoke 與 Vertex - [PR #42288](https://github.com/BerriAI/litellm/pull/42288)
- fix(bedrock): 將 OpenAI GPT 與 xAI Grok 模型在 Converse 上的 maxTokens 限制為 16 token 的最小值 - [PR #41870](https://github.com/BerriAI/litellm/pull/41870)
- fix(license): 允許萬用字元 allowed_features 授權授予 auto_router 功能 - [PR #41684](https://github.com/BerriAI/litellm/pull/41684)
- fix(proxy): 在 JWT 驗證路徑上套用團隊模型別名 - [PR #39985](https://github.com/BerriAI/litellm/pull/39985)
- feat(proxy): 新增 TypeSafe AI Jev evaluate passthrough，並具備以登錄檔定價的支出追蹤 - [PR #41607](https://github.com/BerriAI/litellm/pull/41607)
- feat(router): 新增 TypeSafe Jev 作為 complexity router 分類器 - [PR #41615](https://github.com/BerriAI/litellm/pull/41615)
- fix(proxy): 轉送 typesafe pass-through 路由上的每一個方法 - [PR #41723](https://github.com/BerriAI/litellm/pull/41723)
- feat(guardrails): 新增基於相關性的 TypeSafe Jev 壓縮防護欄 - [PR #41757](https://github.com/BerriAI/litellm/pull/41757)
- fix(proxy): 強制 JEV 測試路由使用虛擬金鑰預算 - [PR #41879](https://github.com/BerriAI/litellm/pull/41879)
- feat(auto-router): 新增 JEV 分類器，與 LLM 分類器並列 - [PR #41886](https://github.com/BerriAI/litellm/pull/41886)
- feat(openrouter): 為 typesafe/jev-1.13 訂價，並新增 openrouter decisions pass-through - [PR #42301](https://github.com/BerriAI/litellm/pull/42301)
- feat(auto-router): 允許已選擇加入的團隊成員管理其路由器，也就是 Jev 路由器變更所建立的基礎部分 - [PR #41175](https://github.com/BerriAI/litellm/pull/41175)
- chore(deps): 在鎖定檔中更新 anyio 與 soupsieve

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.101.0...v1.101.1
