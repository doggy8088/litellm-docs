---
slug: litellm-microsoft-assert
title: "宣佈 LiteLLM x Microsoft ASSERT"
date: 2026-06-03T10:00:00
authors:
  - mubashir
  - krrish
description: "LiteLLM 現已與 Microsoft ASSERT 整合，提供以政策驅動的代理程式評估——在問題進入正式環境前先攔截安全性與品質缺陷。"
hide_table_of_contents: false
---

今天我們很高興正式推出 **LiteLLM x Microsoft ASSERT** —— 將以政策驅動的代理程式評估帶給每一個透過 LiteLLM AI Gateway 執行的模型。

{/* truncate */}

## ASSERT 是什麼？ {#what-is-assert}

ASSERT 是 Microsoft 的開源框架，用於以政策驅動的代理程式評估，建立在經過驗證的 Microsoft Research 方法之上。ASSERT 會將您的組織政策與需求作為輸入，系統性地產生有針對性的評估情境，並在問題進入正式環境前找出安全性與品質缺陷。

## 為什麼這很重要 {#why-this-matters}

當團隊將代理程式部署到正式環境時，「在示範中可運作」與「在我們的政策下可正常運作」之間的落差，正是實際風險所在。ASSERT 透過把您撰寫的政策轉換為具體、可測試的評估情境，來彌補這個落差——而現在，這些評估可透過單一統一介面，針對 LiteLLM 支援的 100+ 個 LLM 提供者中的任何一個執行。

## 與 LiteLLM 的運作方式 {#how-it-works-with-litellm}

- **帶入您的政策** — ASSERT 會匯入您的組織政策與需求。
- **產生情境** — ASSERT 系統性地產生有針對性的評估情境。
- **透過 LiteLLM 執行** — 以一致的驗證、記錄與成本追蹤，評估 LiteLLM Gateway 後方的任何模型。
- **及早發現缺陷** — 在安全性與品質問題進入正式環境前先攔截。

## 開始使用 {#get-started}

ASSERT 是開源專案。將它指向您的 LiteLLM Gateway 端點，今天就開始依照您自己的政策評估您的代理程式。

- [設定 LiteLLM Gateway](/docs/proxy/quick_start) — 在幾分鐘內讓 gateway 端點運作起來。
- [GitHub 上的 Microsoft ASSERT](https://github.com/microsoft/assert) — 安裝 ASSERT 並將其對您的 gateway 執行。
