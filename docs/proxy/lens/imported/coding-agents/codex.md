---
title: "Codex"
description: "使用維護中的設定指南，將個人 Codex 工作階段連線至 LiteLLM Lens。"
slug: "/proxy/lens/coding-agents/codex"
sidebar_label: "Codex"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/codex/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/codex/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Codex {#codex}

將您的個人 Codex 工作階段傳送至 [LiteLLM Lens](/docs/proxy/lens)。此資料夾連結至維護中的整合說明。

## 必要條件 {#prerequisites}

您需要 Codex、已啟用 [追蹤](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM 閘道，以及一個 LiteLLM 金鑰。

## 設定 {#setup}

請依照 [Lens coding agent 設定指南](/docs/proxy/lens/coding-agents) 取得特定於閘道的說明。請參閱 [LiteLLM Lens Codex 整合](https://github.com/BerriAI/litellm-lens-codex-integration)，以了解此整合的設定與支援的遙測。

## 驗證追蹤 {#verify-the-trace}

完成新的工作階段回合，然後在您的閘道上開啟 **Lens > Traces**。使用此整合所設定的代理程式名稱尋找該工作階段，並檢查其記錄的活動。

## 疑難排解 {#troubleshooting}

如果找不到該工作階段，請檢查設定指南中的記錄與匯出說明、閘道 URL 和金鑰。請查看維護中的整合文件，了解支援的活動與平台需求。
