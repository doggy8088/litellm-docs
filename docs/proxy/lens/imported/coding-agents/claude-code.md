---
title: "Claude Code"
description: "使用維護中的設定指南，將個人 Claude Code 工作階段連接到 LiteLLM Lens。"
slug: "/proxy/lens/coding-agents/claude-code"
sidebar_label: "Claude Code"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/claude-code/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/claude-code/README.md at a6cce7983ec78ef9183627a0b05e0e3ce548b98a. Edit the source README. -->

# Claude Code {#claude-code}

將您的個人 Claude Code 工作階段傳送到 [LiteLLM Lens](/docs/proxy/lens)。此資料夾連結到維護中的整合說明。

## 必要條件 {#prerequisites}

您需要 Claude Code、已啟用 [tracing](/docs/proxy/lens/deployment#configure-an-existing-proxy) 的 LiteLLM gateway，以及 LiteLLM key。

## 設定 {#setup}

請依照 [Lens coding agent 設定指南](/docs/proxy/lens/coding-agents) 取得 gateway 相關說明。請參閱 [Claude Code 監控指南](https://code.claude.com/docs/en/monitoring-usage)，了解該整合的設定與支援的 telemetry。

## 驗證 trace {#verify-the-trace}

完成新的工作階段 turn，然後在您的 gateway 上開啟 **Lens > Traces**。使用整合所設定的 agent 名稱尋找該工作階段，並檢查其記錄的活動。

## 疑難排解 {#troubleshooting}

如果找不到該工作階段，請檢查設定指南中的 recording 與 export 說明、gateway URL，以及 key。請查看維護中的整合文件，以了解支援的 activity 與平台需求。
