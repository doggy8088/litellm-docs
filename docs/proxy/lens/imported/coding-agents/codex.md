---
title: "Codex"
description: "使用 LiteLLM Lens Codex 外掛程式，將個人 Codex 工作階段傳送到 LiteLLM Lens。"
slug: "/proxy/lens/coding-agents/codex"
sidebar_label: "Codex"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/codex/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/codex/README.md at d68cea11157f037e43eac02aae76fb70c984b123. Edit the source README. -->

# Codex {#codex}

將您的個人 Codex 工作階段傳送到 [LiteLLM Lens](/docs/proxy/lens)，使用 [LiteLLM Lens Codex 外掛程式](https://github.com/BerriAI/litellm-lens-plugins/tree/main/codex)。此外掛程式支援 Codex 桌面版與 CLI，並將每則對話以一筆 trace 的形式傳送到 Lens。您的模型登入與模型端點維持不變。

## 必要條件 {#prerequisites}

您需要在 macOS 或 Linux 上使用支援外掛程式的 Codex 版本、Python 3.11 或更新版本，以及一個執行中的 [Lens 安裝](/docs/proxy/lens/deployment)。設定需要一個位址與一把金鑰。若使用獨立 Lens，請使用您的 Lens 位址與一把專用的 Lens 追蹤金鑰；在 Lens 中開啟 **Home**，選擇 **Standalone Lens**，然後建立一把金鑰。當您的 Codex 模型呼叫已透過連接到 Lens 的 LiteLLM 閘道進行時，請使用閘道位址與 Codex 已在使用的 LiteLLM 金鑰。如果您無法建立金鑰，請向您的管理員索取追蹤金鑰。 <!-- keep-python-version: Codex plugin prerequisite -->

## 設定 {#setup}

在執行 Codex 的電腦上安裝此外掛程式：

```bash
codex plugin marketplace add BerriAI/litellm-lens-plugins
codex plugin add litellm-lens@berriai-lens
```

開啟一則新的 Codex 對話並傳送：

```text
Use lens-setup to connect my Codex chats to LiteLLM Lens.
```

在 macOS 上，Codex 會開啟一個私人的 Terminal 設定視窗。在 Linux 上，Codex 會印出 `bash .../scripts/run.sh setup` 指令；請在您自己的終端機中執行它。輸入您的位址，在隱藏的提示中輸入該金鑰，並使用 `codex` 作為 agent 名稱。請勿將金鑰貼到 Codex 提示中。確認錄製後，再開啟另一則新的對話，讓其 hooks 載入。[Lens coding agent 設定指南](/docs/proxy/lens/coding-agents#codex)涵蓋這兩種路徑與外掛程式記錄的內容。

## 驗證追蹤 {#verify-the-trace}

從您的專案執行一個任務：

```bash
codex exec "Reply with exactly: Lens Codex telemetry check."
```

在獨立 Lens 中開啟 **Traces**，或在 LiteLLM 中開啟 **Lens > Traces**，並以 **codex** 篩選。該對話是一筆 trace，會在每則已完成或中斷的 turn 後更新。

## 疑難排解 {#troubleshooting}

如果找不到該對話，請要求 Codex `Use lens-setup to show recording status.`，並檢查位址與金鑰：閘道位址使用 LiteLLM 金鑰，Lens 位址則使用 Lens 追蹤金鑰。只有設定後的活動才會被記錄，而在設定期間開啟的對話，需要開啟新的對話才能載入其 hooks。外掛程式記錄的內容與其限制，請參閱[此外掛程式的涵蓋範圍與隱私權詳細資訊](https://github.com/BerriAI/litellm-lens-plugins/tree/main/codex#what-youll-see)。
