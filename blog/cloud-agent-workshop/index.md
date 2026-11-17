---
slug: cloud-agent-workshop
title: "工作坊：打造自託管雲端代理程式。"
date: 2026-10-13T18:00:00-04:00
authors:
  - ishaan
description: "與 LiteLLM 團隊一起打造自託管雲端代理程式。為期兩週的遠端工作坊，10 月 19–30 日，打造可運作的 v0，並在您的基礎設施上部署內部 beta 版。"
image: /img/cloud-agent-workshop/social.png
tags: [agents, infrastructure, announcement]
hide_table_of_contents: true
custom_hero: true
---

import {WorkshopShell, WorkshopHero, AudienceTeams, Timeline, Milestone, Result, Closing} from './Workshop';
import {IntakeVisual, BuildVisual, BetaVisual, SupportVisual} from './MilestoneVisuals';
import styles from './styles.module.css';

<WorkshopShell>

<WorkshopHero />

</WorkshopShell>

{/* truncate */}

<WorkshopShell>

<section className={styles.section} id="audience" aria-labelledby="audience-title">

## 這場工作坊適合哪些人 {#audience-title}

正在投入自訂、自託管雲端代理程式平台的團隊。與 LiteLLM 工程師一起，圍繞您的基礎設施與開發工作流程進行建置。

<AudienceTeams />

</section>

<section className={styles.section} id="program" aria-labelledby="program-title">

<p className={styles.eyebrow}>計畫詳情</p>

## 時程與里程碑 {#program-title}

從您的第一個使用案例到兩週內推出內部 beta 版。以下是我們在每個階段共同建置的內容。

<Timeline>

<Milestone number="01" id="intake" stage="動工之前" date="30 分鐘" visual={<IntakeVisual />}>

### 界定您的第一個使用案例。 {#scope-your-first-use-case}

我們會檢視您的目標、您已經嘗試過的做法，以及您的提供者、沙箱與雲端設定。我們會一起商定範圍、部署時程與成功標準。

<Result label="您將獲得">一份針對您第一個使用案例的建置計畫。</Result>

</Milestone>

<Milestone number="02" id="week-one" stage="第 1 週 · 建置" date="10 月 19–23 日" visual={<BuildVisual />}>

### 取得一個可運作的雲端代理程式。 {#get-a-working-cloud-agent}

我們將您的代理程式框架與沙箱連接到一個 Web 應用程式與 Slack。您的團隊可以向它傳送任務，並試用第一個工作流程。

<Result label="第一週目標">一個您可以互動的可運作 v0。</Result>

</Milestone>

<Milestone number="03" id="week-two" stage="第 2 週 · 部署" date="10 月 26–30 日" visual={<BetaVisual />}>

### 運行內部 beta 版。 {#run-an-internal-beta}

我們部署到您的雲端、執行內部任務，並與您的團隊一起檢視追蹤記錄。我們會根據您看到的結果改進代理程式。

<p className={styles.scopeNote}>視範圍而定：共享記憶體、Pi 等額外的框架，以及回饋與追蹤檢視工具。</p>

<Result label="第二週目標">一個在您的基礎設施上運行的內部 beta 版。</Result>

</Milestone>

<Milestone number="04" id="after" stage="工作坊之後" date="適用於 LITELLM 使用者" visual={<SupportVisual />}>

### 與我們的團隊持續改進。 {#keep-improving-with-our-team}

如果您使用 LiteLLM，我們會持續與您合作，朝著初次洽談電話中訂定的成功標準邁進。

<Result label="持續支援">協助您進行後續改進。</Result>

</Milestone>

</Timeline>

</section>

<Closing />

</WorkshopShell>
