---
title: Claude Code Compatibility
sidebar_label: Claude Code 相容性
---

import ClaudeCodeCompatibilityTable from '@site/src/components/ClaudeCodeCompatibilityTable';

# Claude Code × LiteLLM 相容性矩陣 {#claude-code--litellm-compatibility-matrix}

此表格由每日重新產生的自動填充程式更新，該程式會針對各受支援的提供者，以
[Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 搭配
最新穩定版 LiteLLM proxy 進行測試，並平行執行 Haiku 4.5、Sonnet 4.6 和 Opus 4.7。只有在三個模型層級全部通過時，儲存格才會變成綠色。

<ClaudeCodeCompatibilityTable />

## 圖例 {#legend}

| 符號 | 意義 |
| --- | --- |
| ✅ | 此 `(feature, provider)` 儲存格的三個模型層級全部通過。 |
| ❌ | 至少有一個模型層級失敗。將滑鼠游標停留可查看上游錯誤。 |
| — | 此組合沒有執行測試。 |
| n/a | 不適用（例如提供者未公開此功能）。將滑鼠游標停留可查看原因。 |

## 已知問題 {#known-issues}

下方列出具有已知根本原因且有追蹤修補的紅色儲存格。每個項目會保留在此處，直到指定的修補已併入 `v*-stable` 版本為止；在該標籤發布後的下一次每日執行，會將儲存格轉為綠色，並移除該項目。

### Bedrock Invoke + Vertex AI 上的 Opus 4.7 延伸思考 {#opus-47-extended-thinking-on-bedrock-invoke--vertex-ai}

- **受影響的儲存格**：`extended_thinking × bedrock_invoke`、`extended_thinking × vertex_ai`。Anthropic 原生與 Azure Foundry 在相同層級上不受影響。
- **症狀**：Claude Code 的 `--effort max` 標記會以 `output_config.effort=max` 的形式傳送到 proxy。Bedrock Invoke 與 Vertex AI 的請求轉換器在 `v1.83.14-stable` 中會為未列在小型硬式編碼允許清單中的 Claude 4.6+ 模型移除 `output_config.effort`，因此上游請求送出時未啟用延伸思考。回應中沒有 `thinking` 內容區塊，且該儲存格會標記為失敗。
- **狀態**：已在 `main` 透過 [commit `a6c673e7b9`](https://github.com/BerriAI/litellm/commit/a6c673e7b9) 修正（`fix(anthropic,bedrock,vertex): forward output_config.effort + 400 on garbage reasoning_effort`）。等待下一次 `v*-stable` 發行。

### Bedrock Converse — Haiku 4.5 內容區塊驗證 {#bedrock-converse--haiku-45-content-block-validation}

- **受影響的儲存格**：每個 `* × bedrock_converse` 儲存格（整個 Converse 欄）。
- **症狀**：經由 AWS Bedrock 的 Converse API 路由的 Claude Haiku 4.5，會在每段對話的第一則 assistant 訊息回傳 `Content block is not a text block`。由於矩陣只有在三個模型層級全部通過時才會將儲存格標為綠色，因此這個僅限 Haiku 的失敗會讓整個 Converse 欄變成紅色，即使透過 Converse 的 Sonnet 4.6 和 Opus 4.7 功能正常。
- **因應方式**：將 Haiku 流量改走 Bedrock Invoke（左側欄），相同功能組合下該欄為綠色。Sonnet 4.6 和 Opus 4.7 可繼續針對這些功能使用 Converse。
- **狀態**：LiteLLM 正在調查中。Issue 連結待補。

## 來源 {#source}

矩陣 JSON 位於
[`src/data/compatibility-matrix.json`](https://github.com/BerriAI/litellm-docs/blob/main/src/data/compatibility-matrix.json)。
填充程式位於
[`tests/claude_code/cron_vm/`](https://github.com/BerriAI/litellm/tree/main/tests/claude_code/cron_vm)
的主倉庫中。
