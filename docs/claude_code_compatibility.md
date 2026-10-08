---
title: Claude Code Compatibility
sidebar_label: Claude Code 相容性
---

import ClaudeCodeCompatibilityTable from '@site/src/components/ClaudeCodeCompatibilityTable';

# Claude Code × LiteLLM 相容性矩陣 {#claude-code--litellm-compatibility-matrix}

此表格每日由自動化填入程式重新產生，該程式會以
[Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 對
最新的最終版 LiteLLM 發行版本（最新的裸 `vX.Y.Z` 標籤）在每個
支援的提供者上執行，並同時使用 Haiku 4.5、Sonnet 4.6 和 Opus 4.7。只有當三個模型層級全都通過時，儲存格才會顯示為綠色。

<ClaudeCodeCompatibilityTable />

## 圖例 {#legend}

| 符號 | 意義 |
| --- | --- |
| ✅ | 此 `(feature, provider)` 儲存格的三個模型層級全部通過。 |
| ❌ | 至少有一個模型層級失敗。將滑鼠游標停留可查看上游錯誤。 |
| — | 此組合沒有執行測試。 |
| n/a | 不適用（例如提供者未公開此功能）。將滑鼠游標停留可查看原因。 |

## 來源 {#source}

矩陣 JSON 位於
[`src/data/compatibility-matrix.json`](https://github.com/BerriAI/litellm-docs/blob/main/src/data/compatibility-matrix.json)。
填充程式位於
[`tests/e2e/claude_code/cron_vm/`](https://github.com/BerriAI/litellm/tree/main/tests/e2e/claude_code/cron_vm)
的主倉庫中。
