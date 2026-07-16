---
slug: security-townhall-updates
title: "安全 Townhall 更新"
date: 2026-03-27T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "發生了什麼、我們已經做了什麼，以及 LiteLLM 的發布與安全流程接下來會如何演進。"
tags: [security, incident-report]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

感謝所有參加我們 town hall 的人。

我們想利用那段時間說明我們目前所知、到目前為止已採取的行動，以及未來如何改進 LiteLLM 的發布與安全流程。這篇貼文是該更新的書面版本。 [投影片請見此處](https://drive.google.com/file/d/17hsSG7nk-OYL7VRCTbTa7McrWREtS9OO/view?usp=sharing)

{/* truncate */}

## 發生了什麼 {#what-happened}

在 2026 年 3 月 24 日 UTC 10:39，LiteLLM v1.82.7 被推送到 PyPI。版本 v1.82.8 隨後不久也已發布。這些套件在被 PyPI 隔離之前，大約有 40 分鐘處於上線狀態。到 UTC 16:00 時，LiteLLM 團隊已與 PyPI 合作刪除了受影響的套件。

目前我們的理解是，這是一場影響這兩個已發布版本的供應鏈事件。

## 這是怎麼發生的？ {#how-did-this-happen}

根據我們目前的理解，問題源自於 CI/CD pipeline 中遭到入侵的 [Trivy 安全掃描器](https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/) 依賴。

<Image 
  img={require('../../img/shared_ci_cd_environment.png')}
  style={{width: '500px', height: '400px', display: 'block'}}
/>

共有三個主要促成因素：

### 1. 共享的 CI/CD 環境 {#1-shared-cicd-environment}

當時一切都在 CircleCI 上執行，而且所有步驟共用同一個環境。這增加了爆炸半徑：如果某個元件遭到入侵，它可能存取原本供 pipeline 其他部分使用的認證或內容。

### 2. 環境變數中的靜態認證 {#2-static-credentials-in-environment-variables}

發布認證，包括 PyPI、GHCR 和 Docker 發布的認證，都是以靜態密鑰形式提供在環境中。這表示遭到入侵的步驟可能存取長效的發布認證。

### 3. 未固定版本的 Trivy 依賴 {#3-unpinned-trivy-dependency}

在我們的安全掃描元件中，我們使用了未固定版本的 Trivy 依賴。根據我們目前的理解，遭入侵的 Trivy 套件在掃描期間執行，存取了環境變數，並使攻擊者得以取得那些認證。

**總結：** CI 中遭入侵的套件存取了原本不該有的密鑰，而這些密鑰接著被用在發布路徑中。

## 我們已經做了什麼 {#what-weve-already-done}

在過去 3 天裡，我們採取了以下步驟：

### 1. 將影響範圍降到最低 {#1-minimize-scope-of-impact}

#### 防止進一步濫用金鑰 {#prevented-further-key-abuse}

我們刪除了或輪替了所有受影響或相鄰的密鑰，包括 PyPI、GitHub、Docker 以及相關認證。為謹慎起見，我們也輪替了 LiteLLM 維護者帳號。 

#### 防止分支攻擊 {#prevent-branch-attacks}

我們移除了大約 6,000 個開放分支，並為合併到 `main` 的分支新增自動刪除政策。這可減少以分支為基礎的濫用面。

#### 固定 CI/CD 依賴版本 {#pinned-cicd-dependencies}

我們已固定所有 Github Actions，並且也在處理固定所有 CircleCI 依賴版本。

#### 暫停發布 {#paused-releases}

在我們確認程式碼庫安全性並建立更強的發布控管之前，我們已暫停新的發布。

### 2. 保障 LiteLLM 安全 {#2-secured-litellm}

#### 取證分析 {#forensic-analysis}

我們正與 Google 的 Mandiant 網路安全團隊合作，以確認攻擊來源並驗證程式碼庫的安全性。我們也已確認沒有惡意程式碼被推送到 `main`。

#### 確認應用程式安全性 {#confirm-application-security}

同時，我們正與 [Veria Labs](https://verialabs.com/) 的白帽駭客合作，以驗證應用程式安全性並檢視我們 CI/CD 流程的改進。

我們也已確認，最近 20 次 LiteLLM 發布都沒有遭入侵的跡象，而且根據我們目前的調查，LiteLLM Proxy 不會遭受未經驗證的攻擊。 [請查看安全部落格以取得發布驗證。](https://docs.litellm.ai/blog/security-update-march-2026#verified-safe-versions)

#### 建立安全工作小組 {#created-a-security-working-group}

我們在 LiteLLM 內部建立了一個新的安全工作小組，聚焦於：

- 建立威脅模型
- 稽核建置流程與依賴套件

如果您有興趣加入安全工作小組，請在 [這裡](https://github.com/BerriAI/litellm-security-wg) 提交 issue。

### 3. 改進 CI/CD {#3-improved-cicd}

我們已開始對發布的建置與發布方式進行結構性變更。這些變更與我們的目標一致（如下個部分所述），涵蓋隔離環境、短期憑證與發布稽核。

## 路線圖 {#roadmap}

我們計劃在新的 CI/CD pipeline 中遵循 4 項指導原則：

1. **限制** 每個套件可存取的內容
2. **減少** 敏感環境變數的數量
3. **避免** 遭入侵的套件
4. **防止** 發布遭竄改

### 隔離環境 {#isolated-environments}

<Image 
  img={require('../../img/isolated_ci_cd_environments.png')}
  style={{width: '400px', height: 'auto'}}
/>

我們正在將 CI/CD 拆分為 4 個語意概念：

1. 單元測試
2. 整合測試
3. 安全掃描
4. 發布上架

並會在隔離環境中執行這些項目。

這將限制任何單一遭入侵元件可能造成的損害。

### 短期憑證 {#ephemeral-credentials}

我們計劃為 PyPI（Trusted Publisher）與 GHCR（以 Token 為基礎的驗證）發布改用短期憑證。這將降低憑證外洩或遭入侵的風險。

我們已經開始這麼做： 

- GitHub Actions 上的 PyPI Trusted Publisher [PR](https://github.com/BerriAI/litellm/pull/24654)
- GitHub Actions 上的 GHCR 以 Token 為基礎的驗證 [PR](https://github.com/BerriAI/litellm/pull/24683)

### 發布稽核 {#release-auditing}

我們的目標是讓使用者能獨立驗證某次發布確實來自我們，並防止發布在上架後遭到無聲修改。

這將確保您的發布是安全的，即使：
- 使用被竊的 PyPI/GHCR 認證來發布惡意版本
- 發布遭竄改的 registry artifact
- 在發布上架後變更 tag

我們認為 [Cosign](https://github.com/sigstore/cosign) 很適合這項用途，並已在 [PR #24683](https://github.com/BerriAI/litellm/pull/24683) 中推出。

#### 如何使用 Cosign 驗證 Docker 映像 {#how-to-verify-a-docker-image-with-cosign}

從 `v1.83.0-nightly` 開始，所有發布到 GHCR 的 LiteLLM Docker 映像都會使用 [cosign](https://docs.sigstore.dev/cosign/overview/) 簽署。每個發布都會使用在 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 中引入的相同金鑰簽署。

**使用固定的 commit hash 驗證（建議）：**

commit hash 在密碼學上不可變，因此這是確保您使用原始簽署金鑰的最強方式：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

**使用 release tag 驗證（方便）：**

本儲存庫中的 tag 受到保護，並會解析為相同的金鑰。此選項較容易閱讀，但依賴 tag 保護規則：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

請將 `<release-tag>` 替換為您正在部署的版本（例如 `v1.83.0-stable`）。

預期輸出：

```
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

### 避免遭入侵的套件 {#avoid-compromised-packages}

- 在 CI/CD 中使用已固定且已驗證 SHA 的套件與 actions，盡可能避免 `latest`。 
- 在升級到套件的新版本前加入冷卻期——這可提供更多時間來調查並驗證新版本。 

我們已加入 zizmor，以協助偵測未固定依賴與認證洩漏等問題。 [commit](https://github.com/BerriAI/litellm/commit/a671275f5c5b0e1fb1adacdf3b6ef779aaa5d56c)。

## 常見問題 {#frequently-asked-questions}

**Q: 在這起事件期間，您是否觀察到有橫向移動進入您的企業環境？**

A: 沒有。迄今為止的調查是在外部安全專家的協調下進行，並未發現有橫向移動進入我們內部企業系統的證據。這起事件僅限於 CI/CD pipeline 與特定版本（v1.82.7 和 v1.82.8）的發布路徑。作為主動措施，我們已輪替所有可能受影響或相鄰的密鑰——包括 PyPI、GitHub 與 Docker 認證——並更新維護者帳號安全性，以確保持續隔離。

**Q: 由於這些新的安全措施，您預期未來產品發布會延遲嗎？**

A: 我們致力於在安全性與速度之間取得平衡。雖然我們暫時已暫停發佈，以實施更強的控制措施，但我們正快速推動新安全協定的自動化。我們目前正在實作隔離的 CI/CD 環境、臨時憑證（透過 Trusted Publishers），以及使用 Cosign 的發佈稽核。這些改進旨在整合到我們的自動化管線中，讓我們在維持快速發佈節奏的同時，確保每個套件都經過驗證且安全。

**Q: 較舊的套件有受到影響嗎？**

我們目前的調查結果顯示，LiteLLM 最近 20 個版本沒有被入侵的跡象。這是由我們團隊手動驗證，並經由 Veria Labs 獨立審查。

我們也已公布已驗證的版本供使用者使用。[請查看安全性部落格以了解發佈驗證。](https://docs.litellm.ai/blog/security-update-march-2026#verified-safe-versions)

## 問題與支援  {#questions--support}

如果您認為您的系統可能受到影響，請立即聯絡我們：

- **安全性：** security@berri.ai
- **支援：** support@berri.ai
- **Slack：** 直接在 [這裡](https://join.slack.com/t/litellmossslack/shared_invite/zt-3o7nkuyfr-p_kbNJj8taRfXGgQI1~YyA) 聯絡 LiteLLM 團隊

## 招募  {#hiring}

我們目前正在招募：

- DevOps 工程師 - 維護 ci/cd 的安全並穩定運作
- 安全工程師 - 維護應用程式安全

如果您有興趣加入，請在 [這裡](https://jobs.ashbyhq.com/litellm) 申請
