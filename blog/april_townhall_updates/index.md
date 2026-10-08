---
slug: april-townhall-updates
title: "4 月 Townhall 更新：CI/CD v2、穩定性與產品藍圖"
date: 2026-04-10T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "4 月 LiteLLM town hall 的回顧，涵蓋 CI/CD v2、產品穩定性工作，以及近期藍圖。"
tags: [townhall, security, reliability, product]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

感謝所有參加我們 4 月 town hall 的朋友。

我們在這次會議中分享了 CI/CD v2 的改進、產品穩定性工作，以及接下來在可靠性與產品藍圖上的優先事項。

{/* truncate */}

## CI/CD v2 改進 {#cicd-v2-improvements}

我們的 CI/CD v2 工作聚焦於四個目標：

1. **限制** 每個套件可存取的內容
2. **減少** 敏感環境變數的數量
3. **避免** 遭入侵的套件
4. **降低** 發行竄改的風險

#### 新架構：隔離環境 {#new-architecture-isolated-environments}

我們已開始針對不同的 CI/CD 階段移轉到隔離環境，以降低單一遭入侵步驟繼承整個管線廣泛存取權限的機會。

<Image
  img={require('../../img/april_townhall_isolated_environments.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

#### 目前推出狀態 {#current-rollout-status}

這些變更已部署在我們目前的發行工作流程中。[請見此處](https://github.com/BerriAI/litellm/tags)

#### 獨立驗證發行 {#independently-verify-releases}

CI/CD v2 的一個關鍵部分，是支援使用我們公開的驗證流程來獨立驗證發行成品，同時降低對任何單一憑證或發行路徑的依賴。

[**深入了解如何驗證發行**](https://docs.litellm.ai/docs/proxy/docker_image_security)

<Image
  img={require('../../img/verify_releases.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

## 穩定性改進 {#stability-improvements}

### SDLC 改進 {#sdlc-improvements}

這個月，我們聚焦於以下流程穩定性改進：
- 提升 main 分支穩定性
- 將 UI QA 對應到已建置的 Docker 映像，以達到 1:1 環境一致性
- 在 PyPI 與 Docker 之間維持一致的發行標籤
- 修正發行說明的發布

#### 提升 main 分支穩定性 {#improving-main-branch-stability}

我們正在導入一個以 staging 為閘的流程：

<Image
  img={require('../../img/stable_main.png')}
  style={{width: '900px', height: 'auto', display: 'block'}}
/>

- 只有內部 staging 分支可以推送到 `main`。
- 送往該 staging 分支的 PR 必須通過 CircleCI LLM API 測試。
- 衝突處理會在 staging 上進行，其設計目的是降低不穩定變更到達 `main` 的機會。

#### Docker 環境中的 UI QA {#ui-qa-in-docker-environment}

接下來，所有 UI QA 都將在使用者執行的已建置 Docker 映像中進行。

過去，部分 UI QA 路徑是在本機環境中執行，而這些環境無法完全重現 Docker 執行階段條件。

這導致一些與發行相關的問題，包括 `v1.82.3` 中的 MCP 註冊問題。

#### 一致的發行標籤 {#consistent-release-tags}

目前我們針對多種情境發行版本：
- Dev（為客戶特定情境而建置的 PR）
- Nightly（通過所有 CI/CD 檢查）
- Release Candidate（通過所有 CI/CD 檢查 + 手動 UI QA）
- Stable（預期通過所有 CI/CD 檢查 + 手動 UI QA + 7 天生產測試）

我們的目標是在 4 月底前讓 PyPI 與 Docker 採用一致的命名慣例。

#### 發行說明 {#release-notes}

CI/CD v2 變更將發行說明移至手動流程。這是我們在研究更好的自動化工作流程時的暫時解法。我們的目標是在 4 月底前建立更一致的流程。

### 產品穩定性改進 {#product-stability-improvements}

#### 穩定的 Prisma migrations {#stable-prisma-migrations}

目前，我們觀察到幾種類型的 migration 失敗：
- Migration 未套用
- Migration 被標記為已套用但不完整
- 因非 root 映像問題而未套用 migration

我們這個月優先處理這項工作，並已指派一位工程負責人主導。目標是在 4 月底前解決這些錯誤類型。

#### UI 型別安全性 {#ui-type-safety}

另一個重點是提升 UI 的穩定性。目前，錯誤的一個原因是 UI 對後端 API 型別維持了自己的假設。當後端回應與 UI 的假設不同時，這可能會導致問題。

我們希望讓 UI 與 Backend 保持同步，並正在探索以 OpenAPI 驅動的對應方式來達成這一點。

## 產品藍圖 {#product-roadmap}

### 我們的假設 {#our-assumptions}

在接下來幾年中，我們預期：
- 公司會提供更多 AI 工具給員工。
- 更多 AI 代理程式會進入跨 HR、財務、支援與營運的生產工作流程。

### 我們的推論 {#our-inferences}
#### 短期 {#near-term}

- AI 支出將增加。
- 可用性與延遲將變得更加重要。
- 更多 AI 資源（技能、CLI 與相關資產）將需要治理。
- 代理程式與 MCP 的使用模式將需要更深入的控制。
- 更廣泛的開發者採用將增加對更簡單、更容易發現工具的需求。

#### 長期  {#long-term}

- 我們預期許多組織會將代理程式稽核能力（如何在 LLM + MCP + 子代理程式輸入/輸出之間做出決策）視為合規要求。
- 隨著使用者-代理程式互動鏈加深，權限管理將變得更加複雜。

本篇文章中的藍圖時間表僅為目標，可能會根據驗證與使用者回饋而調整。

## 4 月投資項目 {#april-investments}

### 可靠性 {#reliability}

- 提升 10k+ RPS 情境的可用性。
- 研究長時間執行的 Claude Code 請求之延遲額外負擔。

### 功能可靠性 {#feature-reliability}

- 優化 MCP 驗證。
- 更深入了解團隊如何透過 LiteLLM 使用代理程式。

### 治理 {#governance}

- 將 Skills 以一等公民的身分引入 LiteLLM。

## 問答 {#qa}

再次感謝所有提問與直接回饋。我們會在這些努力陸續推出時，持續分享具體的進度更新。

## 招募 {#hiring}

我們正在多個職位積極招募，如果您有興趣，請[在此申請](https://jobs.ashbyhq.com/litellm)！
