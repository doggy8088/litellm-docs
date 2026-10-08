---
slug: litellm-lens-launch
title: "推出 LiteLLM Lens"
date: 2026-10-01T09:00:00
authors:
  - ishaan
  - moe
  - tin
  - yujonglee
description: "LiteLLM Lens 將流經您閘道的追蹤轉化為可供您的代理程式採取行動的發現。為產生 20 萬筆以上追蹤的代理程式群設計。"
image: /img/blog/litellm_lens_launch/lens_hero.gif
tags: [lens, agent-tracing]
hide_table_of_contents: true
custom_hero: true
---

import Head from '@docusaurus/Head';
import LaunchHero, {Partner, SideRails} from './LaunchHero';
import {PostByline} from '@theme/BlogPostPage';

<Head>
  <meta property="og:image" content="https://docs.litellm.ai/img/blog/litellm_lens_launch/lens_hero.gif" />
  <meta property="og:image:type" content="image/gif" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="420" />
  <meta property="og:video" content="https://docs.litellm.ai/img/blog/litellm_lens_launch/lens_hero.mp4" />
  <meta property="og:video:type" content="video/mp4" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://docs.litellm.ai/img/blog/litellm_lens_launch/lens_hero.gif" />
</Head>

export const sections = [
  ['the-agentic-swarm-developer', 'The agentic swarm developer'],
  ['the-problem', 'The problem'],
  ['our-solution', 'Our solution'],
  ['launch-partners', 'Launch partners'],
  ['get-started', 'Get started'],
];

<LaunchHero
  date="October 1, 2026"
  tagline="協助您的代理程式持續進步的閘道"
  sections={sections}
/>

<PostByline />

<SideRails sections={sections} />

今天我們要推出 LiteLLM Lens。告訴 Lens 要在您的代理程式中尋找什麼，讓它分析您的追蹤，然後閱讀發現並深入查看任何追蹤

## 代理程式式群體開發者 {#the-agentic-swarm-developer}

我們正在為這樣的未來打造：開發者運行代理程式式群體——數百個代理程式平行運作，每個都進行 LLM 和工具請求，合計產生 20 萬筆以上追蹤

LiteLLM 已經是您企業 100% AI 流量的瓶頸，因此那些請求中的每一個都已經流經這個閘道

{/* truncate */}

## 問題 {#the-problem}

沒有人能手動讀完 20 萬筆追蹤。當群體出了問題時，證據分散在數千次執行中，您無法判斷哪些有效、哪些失敗，或您的代理程式應該如何改進

追蹤平台讓事情更困難。您的資料放在他人系統中，還受到速率限制，因此您無法直接讓 Codex 或 Claude Code 對其進行深入分析

## 我們的解決方案 {#our-solution}

我們相信，閘道的下一個時代，是利用流經其中的資料幫助您的代理程式進步。Lens 透過三個步驟做到這一點，並在底層提供以代理程式為優先的追蹤 API

### 1. 告訴 Lens 要尋找什麼 {#1-tell-lens-what-to-look-for}

針對您的每個代理程式，描述您希望 Lens 尋找什麼。什麼樣的執行是好的，什麼樣的是不好的？您也可以新增特定問題，每行一個，例如「找出代理程式無法復原的工具失敗」

![儲存的代理程式脈絡與研究代理程式的檢查。](/img/lens/questions-and-checks.png)

### 2. Lens 分析您的追蹤 {#2-lens-analyzes-your-traces}

Lens 使用 AI 代理程式為您檢視追蹤。它會調查執行內容、將相似的問題分組，並向您顯示每個代理程式的發現：發生了什麼、接下來該做什麼，以及支撐這些發現的執行

![顯示發生了什麼、接下來該做什麼，以及支撐執行連結的發現。](/img/lens/finding-detail.png)

### 3. 閱讀發現，然後深入查看追蹤 {#3-read-the-findings-then-go-deeper-into-the-trace}

先從發現開始。當您需要更多資訊時，每個發現都會連回原始追蹤中的確切步驟，因此您可以閱讀其背後的輸入、輸出與屬性

個別追蹤看起來像這樣：左側是完整的步驟樹，右側是所選步驟的輸入與輸出

![一個研究代理程式的個別追蹤，包含其步驟樹、時間，以及所選步驟的輸入與輸出。](/img/lens/trace-detail-research-lead.png)

### 以代理程式為優先的追蹤 API {#agent-first-tracing-apis}

擁有自己的基礎架構。追蹤資料會落在您自行運行的 ClickHouse 中，與您已經部署的 LiteLLM 閘道並列。您可以用簡單的 SQL 查詢它們，或讓 Codex 和 Claude Code 透過追蹤 API 分析它們，而不受追蹤平台速率限制

## 發布合作夥伴 {#launch-partners}

Lens 是與我們的發布合作夥伴共同打造並設計的

<Partner
  href="https://mindfort.ai?utm_source=litellm&utm_medium=spotlight&utm_campaign=spotlight"
  logo="/img/blog/litellm_lens_launch/partners/mindfort.svg"
  name="MindFort"
  quote={[
    "我們打造了全球第一個全自主安全群體。MindFort 使用數千個代理程式協同運作，在目標上即時找出真正可利用的漏洞，接著安全地建立並逐步推出修補程式，持續不斷。",
    "我們使用 Lens 來支援內部應用 AI 研究與生產工程，讓我們能在維持完整資料主權的同時，以規模化方式分析數十萬次代理程式互動。",
  ]}
  author="Akul Gupta，共同創辦人兼 CTO，MindFort"
/>

## 開始使用 {#get-started}

自我進化代理程式的時代已經來臨。[註冊搶先體驗](https://forms.gle/3GC1Ner4vjthGWi18)，或依照 [Lens 文件](/docs/proxy/lens) 今天就將其部署到您自己的 LiteLLM 閘道上
