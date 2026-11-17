---
title: "Codex"
description: "使用維護中的設定指南，將個人 Codex 工作階段連線至 LiteLLM Lens。"
slug: "/proxy/lens/coding-agents/codex"
sidebar_label: "Codex"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/codex/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/codex/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Codex {#codex}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

將您的個人 Codex 工作階段傳送至 [LiteLLM Lens](/docs/proxy/lens)。此資料夾連結至維護中的整合說明。

## 必要條件 {#prerequisites}

您需要 Codex、一個執行中的 [Lens 安裝](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md)，以及一個專用的 Lens 追蹤金鑰。Lens 可以僅搭配 ClickHouse 執行；請保留您的程式碼代理程式現有的模型登入與提供者

## 設定 {#setup}

請依照 [Lens coding agent 設定指南](/docs/proxy/lens/coding-agents) 取得追蹤端點與金鑰說明。請參閱 [LiteLLM Lens Codex 整合](https://github.com/BerriAI/litellm-lens-codex-integration)，以了解此整合的設定與支援的遙測。

## 驗證追蹤 {#verify-the-trace}

完成新的工作階段回合，然後在您的獨立或內嵌 Lens UI 中開啟 **Lens > Traces**。使用此整合所設定的代理程式名稱尋找該工作階段，並檢查其記錄的活動。

## 疑難排解 {#troubleshooting}

如果找不到該工作階段，請檢查設定指南中的記錄與匯出說明、Lens 接收 URL 和金鑰。請查看維護中的整合文件，了解支援的活動與平台需求。
