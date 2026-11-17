---
title: Moyai
sidebar_label: Moyai
description: 在您的雲端中執行開源程式設計代理程式，透過 LiteLLM 選擇模型，並追蹤每位團隊成員的成本。查看 Moyai 的實際運作並設定您的第一個任務。
hide_title: true
hide_table_of_contents: true
---

import {MoyaiHero, BenefitGrid, GuideCards, SetupCallout} from '@site/src/components/Moyai';
import BugWorkflowDemo from '@site/blog/internal-devin-two-days/BugWorkflowDemo';
import Image from '@theme/IdealImage';
import styles from '@site/src/components/Moyai/styles.module.css';
import Heading from '@theme/Heading';

<MoyaiHero />

Moyai 是您在自己的雲端中執行的開源程式設計代理程式。從 Slack 或瀏覽器委派錯誤修正或 repository 變更，然後審查 pull request。連接您的 LiteLLM 閘道以選擇模型，並追蹤每個任務的成本。

<section className={styles.why} aria-labelledby="why-moyai">
  <Heading as="h2" id="why-moyai">為什麼選擇 Moyai</Heading>
  <BenefitGrid />
  <GuideCards />
  <p className={styles.setupRequirements}>選擇 Modal 設定，或使用 EC2、Lambda MicroVMs 與 Bedrock 部署在 AWS 上。在連接 repository 之前，先驗證一個雲端任務。</p>
</section>

## 從瀏覽器給 Moyai 一個任務 {#start-in-the-browser}

描述變更，選擇代理程式與模型，並加入 repository 上下文。將您團隊的工作階段保存在一個工作區中，與其 skills 和應用程式連接放在一起。

<figure className={styles.spendFigure}>
  <Image
    img={require('../../img/moyai_task_composer.jpg')}
    alt="Moyai 的瀏覽器工作區，包含錯誤修正提示、代理程式與模型選擇器、已連接的應用程式，以及最近的工作階段。"
    style={{width: '100%', display: 'block'}}
  />
  <figcaption>Moyai 介面，包含範例提示與範例工作區資料。此截圖顯示任務設定；它並未顯示已完成的代理程式執行。</figcaption>
</figure>

## 觀看任務從請求到 PR 的過程 {#watch-a-task}

看一個團隊請 Moyai 調查錯誤、執行迴歸測試，並將 pull request 回傳到 Slack。您可以在瀏覽器中跟進工作，並在同一個對話中送出修正。

<BugWorkflowDemo />

## 查看每位團隊成員的花費 {#see-agent-spend}

使用 Moyai 的支出儀表板，找出您的模型帳單背後的使用者、工作階段與模型。Moyai 會記錄 LiteLLM 對每個追蹤請求回報的費用，因此您可以將總額追溯到相同的成本資料。

<figure className={styles.spendFigure}>
  <Image
    img={require('../../img/moyai_spend_users.jpg')}
    alt="Moyai 的依使用者 LLM 支出表格，顯示每位團隊成員的記錄成本、工作階段數、模型請求數，以及團隊支出的占比。"
    style={{width: '100%', display: 'block'}}
  />
  <figcaption>Moyai 的支出儀表板，包含範例資料。名稱與數字是為了說明介面；它們不是 LiteLLM 的生產使用量，也不是上方節省估計的證據。</figcaption>
</figure>

[對照 LiteLLM 檢查請求](./moyai/setup.md#track-spend)。[成本會計指南](./moyai/architecture.md#cost-accounting) 說明了涵蓋範圍與遺失的收據。雲端代管與儲存成本與這些模型費用分開計算。

## 從您的團隊已經知道的錯誤開始 {#put-moyai-to-work}

設定檢查通過後，連接一個 repository，並給 Moyai 一個小而可重現的問題：

> 重現這個錯誤，加入迴歸測試，修正它，並開啟 pull request。包含修正前的失敗測試與修正後的通過結果。

審查 diff 與測試輸出，然後在 Moyai 中查看該工作階段的模型成本。使用第一個結果來決定接下來要委派哪些任務。

## 在設定之前 {#prerequisites}

<div className={styles.questions}>
<details>
<summary>我需要什麼才能開始？</summary>

對於 Modal，您需要一個帳戶、一個雲端可連到的 LiteLLM 閘道，以及您所選模型的虛擬金鑰。[設定指南](./moyai/setup.md) 會逐步說明安裝與雲端任務。對於 AWS，請依照 [Lambda MicroVM 部署指南](./moyai/aws.md)，具備 MicroVM 存取權、已啟用的 Bedrock 模型，以及公開的 Route 53 hosted zone。開啟 GitHub PR 還需要組織擁有的 GitHub App；在連接 repository 之前，先驗證第一個任務。

</details>
<details>
<summary>我要付什麼費用？</summary>

模型使用量，加上代管、代理程式沙箱與儲存。您的工作負載與模型選擇決定帳單。$700/day 這個數字是我們團隊的估計，不是起始價格，也不是對您的成本的承諾。在擴大推出之前，先衡量您自己的任務。

</details>
<details>
<summary>我的團隊要維護什麼？</summary>

您管理服務，包括部署、更新、憑證與備份。Moyai 適合願意營運自己雲端代理程式的受信任工程團隊。[架構指南](./moyai/architecture.md) 在您承諾執行它之前，說明了部署選擇、檢查點與復原。

</details>
<details>
<summary>我可以選擇代理程式可以存取什麼嗎？</summary>

在 **Connections** 中選取應用程式與 repositories。已啟用的應用程式工具可以在其連接政策下寫入，不需要逐次核准提示。GitHub PR 由您審查並合併。模型請求會透過您的 LiteLLM 閘道送到您選取的提供者，因此在決定要分享哪些程式碼時，請將該提供者納入考量。

</details>
</div>

<SetupCallout />

<details>
<summary>在找先前的閘道說明嗎？</summary>

<span id="how-moyai-uses-litellm" />
<span id="step-1-add-the-models" />
<span id="step-2-create-a-virtual-key-for-moyai" />
<span id="step-3-set-the-gateway-in-moyai" />
<span id="step-4-do-a-test-of-the-connection" />
<span id="track-spend" />
<span id="troubleshooting" />
<span id="more-information" />

[閘道設定](./moyai/setup.md#configure-litellm)、[連接檢查](./moyai/setup.md#check-the-model-connection)、[支出追蹤](./moyai/setup.md#track-spend) 與 [疑難排解](./moyai/setup.md#troubleshooting) 現在位於設定指南中。

</details>
