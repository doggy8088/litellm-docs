---
title: "v1.102.1 - Claude Code 自動模式、即時連線交握錯誤、OTEL 中繼資料與 TypeSafe Jev"
slug: "v1-102-1"
date: 2026-09-23T06:12:28
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
docker.litellm.ai/berriai/litellm:1.102.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.102.1
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.102.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.102.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.102.1` 是 [`v1.102.0`](/release_notes/v1.102.0/v1-102-0) 上的修補版本。它讓 Claude Code 自動模式可透過閘道運作、向用戶端回報被拒絕的即時連線交握、將巢狀呼叫端中繼資料提升為 OTEL span 屬性，並把 TypeSafe Jev 整合帶到這條版本線。現有設定無需變更。Docker 映像與 PyPI 套件皆由 [`d09bbae`](https://github.com/BerriAI/litellm/commit/d09bbae1c6df463e425558f60d460437193635da) 建置

## Claude Code 自動模式可透過閘道運作 {#claude-code-auto-mode-works-through-the-gateway}

Claude Code 自動模式會在 `safeguards` 欄位與 `dangerous-tool-use-2026-09-03` beta 上使用 `/v1/messages`。該代理在原生 Anthropic 路由上丟棄了該欄位，並移除了它無法辨識的 beta 值，而 Bedrock Invoke 與 Bedrock Mantle 兩者都會丟棄，Vertex AI 則會在沒有 beta 的情況下轉送該欄位。Claude Code 因而回報經由閘道使用自動模式不可用，並繼續計費其自身的分類器請求。現在該欄位與 beta 會一併傳送至 Anthropic、Bedrock 與 Vertex AI，而 `safeguard_results` 會回到 Claude Code

## 即時用戶端現在能看見上游連線交握為何被拒絕 {#realtime-clients-see-why-an-upstream-handshake-was-refused}

當上游即時連線交握被拒絕時，例如 Azure 401，用戶端會以 1006 關閉且沒有事件，而 Azure 中繼可能會讓用戶端 socket 保持開啟。現在每個即時中繼都會送出一個 `error` 事件，標示上游 HTTP 狀態，並以對應代碼關閉：401 與 403 使用 1008，429 使用 1013，其餘任何情況使用 1011

## OTEL span 上的巢狀呼叫端中繼資料 {#nested-caller-metadata-on-otel-spans}

`baggage_metadata_keys: [requester_metadata.trace_id]` 不會提升任何內容，而舊版 OTEL v1 回呼完全沒有呼叫端中繼資料的允許清單。現在巢狀請求中繼資料會在允許清單查找前攤平為點分隔路徑，因此被允許的 `requester_metadata.<path>` 會在 OTEL v1 與 v2 上都以 `litellm.metadata.<path>` 形式落到 span 上。整體的 `requester_metadata` 仍然絕不會被提升

## TypeSafe Jev {#typesafe-jev}

TypeSafe Jev 現已可在這條版本線上使用。一個新的 `/typesafe/{endpoint}` 直通會將代理的 `TYPESAFE_API_KEY` 轉送至 TypeSafe，因此呼叫端會使用其虛擬金鑰，而支出則依模型註冊表中 `typesafe/jev-1.13.0`、`typesafe/jev-latest` 與 `typesafe/jev-preview` 的項目計價。請參閱 [TypeSafe 直通文件](/docs/pass_through/typesafe)

complexity router 與 Auto Router 可將 Jev 作為層級分類器（`classifier_type: jev`），而 Jev 評估會遵循虛擬金鑰預算。一個新的 `typesafe` 防護欄會對每次完成的工具交換進行評分，並將 Jev 判定為不相關的工具結果清空，從而在不呼叫摘要的情況下縮短長時間的代理程式迴圈；此功能為選用且失敗時開放。`/openrouter/{path}` 直通會根據新的成本對照表列為 `openrouter/typesafe/jev-1.13` 決策計價

## 相依性 {#dependencies}

鎖定檔將 anyio 更新至 4.14.2，並將 soupsieve 更新至 2.9。未變更任何已宣告的相依性範圍

### 有哪些變更 {#whats-changed}

- fix(anthropic): 在原生 /v1/messages 上轉送 safeguards 與 anthropic-beta，且維持不變 - [PR #42152](https://github.com/BerriAI/litellm/pull/42152)
- fix(anthropic): 將 Claude Code safeguards 與 dangerous-tool-use beta 轉送至 Bedrock Invoke 與 Vertex 的 /v1/messages - [PR #42288](https://github.com/BerriAI/litellm/pull/42288)
- fix(realtime): 將上游連線交握拒絕以錯誤事件與 policy close 呈現 - [PR #42388](https://github.com/BerriAI/litellm/pull/42388)
- feat(otel): 將巢狀請求中繼資料鍵提升為 litellm.metadata.* span 屬性 - [PR #41462](https://github.com/BerriAI/litellm/pull/41462)
- feat(proxy): 新增 TypeSafe AI Jev evaluate 直通，並提供以註冊表定價的支出追蹤 - [PR #41607](https://github.com/BerriAI/litellm/pull/41607)
- feat(router): 新增 TypeSafe Jev 作為複雜度 router 分類器 - [PR #41615](https://github.com/BerriAI/litellm/pull/41615)
- fix(proxy): 在 typesafe 直通路由上轉送每個方法 - [PR #41723](https://github.com/BerriAI/litellm/pull/41723)
- feat(guardrails): 新增 TypeSafe Jev 基於相關性的壓縮防護欄 - [PR #41757](https://github.com/BerriAI/litellm/pull/41757)
- fix(proxy): 對 JEV 測試路由強制執行虛擬金鑰預算 - [PR #41879](https://github.com/BerriAI/litellm/pull/41879)
- feat(auto-router): 在 LLM 分類器旁新增 JEV 分類器 - [PR #41886](https://github.com/BerriAI/litellm/pull/41886)
- feat(openrouter): 為 typesafe/jev-1.13 設定價格，並新增 openrouter decisions 直通 - [PR #42301](https://github.com/BerriAI/litellm/pull/42301)
- feat(auto-router): 允許已選用的團隊成員管理其 routers，這是 Jev router 變更所建立的基礎部分 - [PR #41175](https://github.com/BerriAI/litellm/pull/41175)
- chore(deps): 重新整理鎖定檔中的 anyio 與 soupsieve

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.102.0...v1.102.1
