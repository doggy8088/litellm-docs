---
title: Claude、Codex、Copilot 與 Cursor 訂閱
sidebar_label: AI 訂閱
description: 透過 LiteLLM 使用您的 ChatGPT、Claude、GitHub Copilot 或 Cursor 訂閱。選擇您的訂閱並依照設定指南操作。
hide_table_of_contents: true
---

import SubscriptionCards from '@site/src/components/SubscriptionCards';

# 搭配 LiteLLM 使用您的訂閱 {#use-your-claude-codex-or-copilot-subscription}

保留您的程式設計用戶端與方案的額度。可用的 LiteLLM 控制項與請求記錄取決於整合方式。

開始之前，您需要一個執行中的 [LiteLLM proxy](./proxy/docker_quick_start.md)。

## 選擇您的訂閱 {#choose-your-subscription}

每位開發者連接自己的帳戶。

<SubscriptionCards
  items={[
    {
      title: 'ChatGPT / Codex',
      description: '在您的用戶端中使用 ChatGPT 登入。',
      listDescription: [
        '具有您所選模型存取權的 ChatGPT 帳戶',
        'Codex CLI、Codex app 或 Pi',
      ],
      since: '1.109.0',
      ctaLabel: '設定 Codex',
      icon: '/img/integrations/openai.svg',
      to: '/docs/tutorials/openai_codex_byok',
    },
    {
      title: 'Claude',
      description: '在 Claude Code 中使用 Claude 登入。',
      listDescription: [
        'Claude Pro、Max、Team 或 Enterprise',
        '已安裝 Claude Code',
      ],
      since: '1.81.14',
      ctaLabel: '設定 Claude',
      icon: '/img/integrations/anthropic.svg',
      to: '/docs/tutorials/claude_code_max_subscription',
    },
    {
      title: 'GitHub Copilot',
      description: '在 LiteLLM 儀表板中連接 GitHub。',
      listDescription: [
        '具有 Copilot 存取權的 GitHub 帳戶',
        'LiteLLM 儀表板存取權',
        '連接到 LiteLLM 的應用程式',
      ],
      since: '1.108.0',
      ctaLabel: '設定 Copilot',
      icon: '/img/integrations/github-copilot.svg',
      to: '/docs/providers/github_copilot',
    },
    {
      title: 'Cursor CLI',
      since: '1.112.0',
      description: '在 CLI 中使用 Cursor 登入。',
      listDescription: [
        '具有模型存取權的 Cursor 帳戶',
        '具備 HTTP/1.1 代理程式傳輸的 Cursor CLI',
        '已啟用 Cursor CLI 中繼的 Proxy',
      ],
      ctaLabel: '設定 Cursor CLI',
      icon: '/img/integrations/cursor.svg',
      to: '/docs/tutorials/cursor_cli_subscription',
    },
  ]}
/>
