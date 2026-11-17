---
title: "Claude Code"
description: "使用維護中的設定指南，將個人 Claude Code 工作階段連接到 LiteLLM Lens。"
slug: "/proxy/lens/coding-agents/claude-code"
sidebar_label: "Claude Code"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/claude-code/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/claude-code/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Claude Code {#claude-code}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

將您的個人 Claude Code 工作階段傳送到 [LiteLLM Lens](/docs/proxy/lens)。此資料夾連結到維護中的整合說明。

## 必要條件 {#prerequisites}

您需要 Claude Code、一個執行中的 [Lens 安裝](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md)，以及一個專用的 Lens 追蹤金鑰。Lens 可以僅搭配 ClickHouse 執行；請保留您的程式碼代理程式現有的模型登入與提供者

## 設定 {#setup}

請依照 [Lens coding agent 設定指南](/docs/proxy/lens/coding-agents) 取得追蹤端點與金鑰說明。請參閱 [Claude Code 監控指南](https://code.claude.com/docs/en/monitoring-usage)，了解該整合的設定與支援的 telemetry。

## 驗證 trace {#verify-the-trace}

完成新的工作階段 turn，然後在您的獨立或內嵌 Lens UI 中開啟 **Lens > Traces**。使用整合所設定的 agent 名稱尋找該工作階段，並檢查其記錄的活動。

## 疑難排解 {#troubleshooting}

如果找不到該工作階段，請檢查設定指南中的 recording 與 export 說明、Lens 接收 URL，以及 key。請查看維護中的整合文件，以了解支援的 activity 與平台需求。
