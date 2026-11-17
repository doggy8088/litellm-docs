---
slug: moyai-open-source
title: "將 Moyai 開源：自架雲端編碼代理程式"
date: 2026-10-07T09:00:00
authors:
  - ishaan
  - tin
  - moe
description: "使用 Moyai 在您自己的基礎架構上執行雲端編碼代理程式。透過 LiteLLM 選擇您的代理程式與模型、追蹤成本，並依照設定指南操作。"
tags: [agents, open-source, infrastructure]
hide_table_of_contents: true
custom_hero: true
---

import MoyaiLaunchHero, {LogoWall, HARNESSES, PROVIDERS} from './MoyaiLaunchHero';
import CostChart from './CostChart';
import BugWorkflowDemo from '../internal-devin-two-days/BugWorkflowDemo';
import {PostByline} from '@theme/BlogPostPage';

export const sections = [
  ['the-problem', 'The problem'],
  ['the-results-79-cheaper', 'Our cost estimate'],
  ['why-were-open-sourcing-it', "Why we're open sourcing it"],
  ['a-cloud-agent-that-keeps-working', 'A cloud agent that keeps working'],
  ['any-harness', 'Choose your agent'],
  ['any-model-any-provider', 'Choose your models'],
  ['one-source-of-truth-for-model-costs', 'Know what you spend'],
  ['get-started', 'Set up your first task'],
];

<MoyaiLaunchHero date="October 7, 2026" sections={sections} />

<PostByline />

今天我們將 [Moyai](https://github.com/BerriAI/moyai) 開源，這是我們團隊在 LiteLLM 執行的雲端編碼代理程式。在 Slack 或瀏覽器中交給它一項任務，回來時就能看到附有程式碼與測試結果、可供審查的 pull request。您可以選擇代理程式與相容的模型，在自己的基礎架構上執行，並透過 LiteLLM 追蹤成本。

[設定您的第一個雲端任務](/docs/self_hosted_coding_agents/moyai/setup)，或參閱下方的成本比較與真實錯誤修正範例。

{/* truncate */}

## 問題 {#the-problem}

我們的 Devin 帳單在單一個月內就達到 $101,872，而且只有我們自己的團隊在使用。我們的工程師在我們無法控制的模型與路由上，啟動了那些 sessions 與自動化流程。

![Devin 帳單儀表板顯示在 8 月 30 日到 9 月 29 日之間支出 101,872.24 美元，每日支出峰值超過 10,000 美元。](/img/blog/moyai_devin_open_source/devin-bill.png)

我們本來就有一個可跨 100+ 個提供者進行路由的 gateway。我們希望能為每項編碼任務選擇模型與路由，並在自己的 gateway 中看到使用量。

## 我們的估算：成本降低 79% {#the-results-79-cheaper}

我們估計，為我們的團隊執行 Moyai 每天約需 $700。以 31 天計算，約為 $21,700，相較於 $101,872 的 Devin 帳單，少了約 $80,000，也就是估計成本降低 79%。這是內部比較，並非工作負載對等的 benchmark。您的模型組合、工作負載、運算與儲存決定了您的成本。

<CostChart />

## 為什麼我們要將其開源 {#why-were-open-sourcing-it}

上週我們撰寫了 [如何在 2 天內打造我們自己的內部 Devin](/blog/internal-devin-two-days)，大多數回覆都希望能親自執行它。Moyai 就是我們在 LiteLLM 生產環境中執行的相同程式碼。您將它部署在自己的基礎架構上，並指向您的 LiteLLM gateway。安裝與提供者存取由您掌控；模型請求仍會送往您選擇的提供者。

## 持續運作的雲端代理程式 {#a-cloud-agent-that-keeps-working}

每個 session 都會獲得自己的雲端工作區，內含終端機、檔案系統與瀏覽器。代理程式會在那裡編輯程式碼並執行您的測試，接著開啟 pull request 供您審查。合上您的筆電，雲端任務仍會繼續執行。

您可以在它工作時於網頁應用程式中即時跟進並送出修正，或隔天早上在 Slack 中接續先前的 thread。對於大型任務，代理程式可以將工作拆分給多個平行的 worker，並彙整其結果。

觀看一個真實的錯誤修正如何從 Slack 請求出發，經過調查與迴歸測試，最後成為 pull request：

<BugWorkflowDemo />

## 為任務選擇代理程式 {#any-harness}

開始 session 時，選擇一個受支援的代理程式，例如 Codex、Claude Agent SDK 或 Hermes。Moyai 會在雲端工作區中執行它，並使用您啟用的連線。

<LogoWall title="Harnesses" items={HARNESSES} />

為您的 gateway 選擇組合時，請查閱 [agent 與模型相容性表](/docs/self_hosted_coding_agents/moyai/setup#configure-litellm)。

## 透過 LiteLLM 選擇您的模型 {#any-model-any-provider}

Moyai 會透過 LiteLLM 傳送模型請求。依任務與預算選擇相容的模型，提供者金鑰則保留在 gateway 上。Moyai 會將每一筆被追蹤的請求歸屬到傳送該訊息的隊友。

<LogoWall title="Providers" items={PROVIDERS} />

LiteLLM 支援 100+ 個提供者。您選擇的代理程式需要一個支援其通訊協定與工具呼叫的模型與 gateway 端點。

## 模型成本的單一事實來源 {#one-source-of-truth-for-model-costs}

Moyai 使用 LiteLLM 回報的費用，作為依使用者、session 與模型拆分的依據。您可以看出哪些隊友與任務占了支出，並將一筆被追蹤的請求與同一個 gateway 成本核對。請參閱 [spend 儀表板](/docs/self_hosted_coding_agents/moyai#see-agent-spend) 與[成本會計細節](/docs/self_hosted_coding_agents/moyai/architecture#cost-accounting)。

## 設定您的第一個雲端任務 {#get-started}

準備好一個 Modal 帳戶、一個可連通的 LiteLLM gateway，以及您所選模型的金鑰。[依照設定指南](/docs/self_hosted_coding_agents/moyai/setup) 部署 Moyai、驗證一項雲端任務，並連接一個 repository。先交給它一個您的團隊已經理解的小錯誤。在擴大推廣之前，先審查 PR、測試輸出與模型成本。

安裝、更新、憑證與備份都由您負責。您需支付模型使用量與雲端基礎架構的費用。系統設計、檢查點與復原行為，請參閱[架構指南](/docs/self_hosted_coding_agents/moyai/architecture)。

<details>
<summary>先在本機預覽介面</summary>

本機示範讓您無需模型憑證即可探索介面。示範任務是模擬的；它們不會驗證雲端執行。

```sh
git clone https://github.com/BerriAI/moyai.git
cd moyai
cp .env.example .env
uv sync --frozen
uv run uvicorn app.main:app --host 127.0.0.1 --port 8787 --workers 1
```

</details>

歡迎在 [GitHub](https://github.com/BerriAI/moyai) 上提出 issues 與 PRs。
