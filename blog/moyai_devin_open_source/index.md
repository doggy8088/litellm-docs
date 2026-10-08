---
slug: moyai-open-source
title: "Moyai 現已開源"
date: 2026-10-07T09:00:00
authors:
  - ishaan
  - tin
  - moe
description: "Moyai 現已開源：一個自架的雲端代理程式，可透過 LiteLLM 跨 100+ 個提供者與 Claude Code 和 Codex 搭配運作。"
tags: [agents, open-source, infrastructure]
hide_table_of_contents: true
custom_hero: true
---

import MoyaiLaunchHero, {LogoWall, HARNESSES, PROVIDERS} from './MoyaiLaunchHero';
import CostChart from './CostChart';
import {PostByline} from '@theme/BlogPostPage';

export const sections = [
  ['the-problem', 'The problem'],
  ['the-results-79-cheaper', 'The results: 79% cheaper'],
  ['why-were-open-sourcing-it', "Why we're open sourcing it"],
  ['a-cloud-agent-that-keeps-working', 'A cloud agent that keeps working'],
  ['any-harness', 'Any harness'],
  ['any-model-any-provider', 'Any model, any provider'],
  ['get-started', 'Get started'],
];

<MoyaiLaunchHero date="October 7, 2026" sections={sections} />

<PostByline />

今天我們將 [Moyai](https://github.com/BerriAI/moyai) 開源，這是我們團隊每天都在使用的自架雲端代理程式。它可與 Claude Code 和 Codex 搭配運作，透過 LiteLLM 在 100+ 個提供者上執行，並能在您的筆電關機時，將來自 Slack 或瀏覽器的任務轉化為 pull request

{/* truncate */}

## 問題 {#the-problem}

我們的 Devin 帳單在單一個月內就飆到 101,872 美元，而它僅供內部使用。這筆支出大多來自我們自家工程師啟動的 sessions 和自動化流程，使用的是我們無法控制的模型與路由

![Devin 帳單儀表板顯示在 8 月 30 日到 9 月 29 日之間支出 101,872.24 美元，每日支出峰值超過 10,000 美元。](/img/blog/moyai_devin_open_source/devin-bill.png)

我們本來就有一個可跨 100+ 個提供者進行路由的 gateway。我們希望把編碼代理程式指向我們自己的模型與路由邏輯，並為推理付費，而不是為座位數付費

## 結果：便宜 79% {#the-results-79-cheaper}

Moyai 每天以約 700 美元完成同樣的工作。以相同的 31 天來看，大約是 21,700 美元，而不是 101,872 美元，因此我們省下了單月帳單中約 80,000 美元

<CostChart />

## 為什麼我們要將其開源 {#why-were-open-sourcing-it}

上週我們撰寫了 [如何在 2 天內打造我們自己的內部 Devin](/blog/internal-devin-two-days)。回應幾乎都指向同一個問題：我們也可以執行它嗎？

現在您可以了。Moyai 就是我們在 LiteLLM 生產環境中執行的相同程式碼。將它部署在您自己的基礎架構上，指向您自己的 LiteLLM gateway，並把您的程式碼、憑證與支出留在您自己的帳戶中

## 持續運作的雲端代理程式 {#a-cloud-agent-that-keeps-working}

每個 session 都會獲得自己的雲端工作區，內含終端機、檔案系統與瀏覽器。代理程式會編輯程式碼、執行測試，並準備 pull request 供審查，整個過程都不會碰到任何人的筆電

Sessions 具有持久性。您可以從網頁應用程式一路跟進、在任務進行中送出修正，或隔天早上在 Slack 中接續先前的 thread。大型任務可以分派給多個平行的 worker agents，每個 agent 各自運行在自己的機器上，並在完成後再匯合

<p className="moyai-big">在 Slack 中開始一項任務。回來時看到一個 PR。</p>

## 任何 harness {#any-harness}

代理程式迴圈是一種選擇，而不是綁死。您可以從 composer 為每個 session 選擇 harness，Moyai 會在相同的隔離工作區中，以相同的工具、連線與權限執行它

<LogoWall title="Harnesses" items={HARNESSES} />

Hermes 是預設選項。Claude Code、Codex、OpenCode 和 Deep Agents 都透過 LiteLLM agent SDK 執行，因此加入下一個 harness 只需要新增一筆 registry 項目，而不是重寫

## 任何模型、任何提供者 {#any-model-any-provider}

每一筆模型請求都會透過 LiteLLM。您可以在訊息之間將 GPT-6 Astra 切換為 Claude Opus 5.5 再切換為 GLM-5.3，而且每一筆請求都會歸屬到發送請求的隊友。提供者金鑰會保留在伺服器上；sandbox 永遠看不到它們

<LogoWall title="Providers" items={PROVIDERS} />

這代表開箱即用就支援 100+ 個提供者。如果 LiteLLM 能呼叫它，Moyai 就能使用它

## 開始使用 {#get-started}

複製 repo，並在幾分鐘內試用本地示範，不需要 API 金鑰

```sh
git clone https://github.com/BerriAI/moyai.git
cd moyai
cp .env.example .env
uv sync --frozen
uv run uvicorn app.main:app --host 127.0.0.1 --port 8787 --workers 1
```

接著使用 Modal 和您的 LiteLLM gateway [設定雲端執行](https://github.com/BerriAI/moyai/blob/main/docs/deployment.md)，並[連接您的應用程式](https://github.com/BerriAI/moyai/blob/main/docs/integrations.md)。到 [GitHub 上的 repo](https://github.com/BerriAI/moyai) 按下星號、開一個 issue，或寄給我們一個 PR。Moyai 很可能會審查它
