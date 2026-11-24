---
title: "Claude Code"
description: "使用 LiteLLM Lens Claude Code 外掛程式，將個人 Claude Code 工作階段傳送到 LiteLLM Lens。"
slug: "/proxy/lens/coding-agents/claude-code"
sidebar_label: "Claude Code"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/claude-code/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/claude-code/README.md at d68cea11157f037e43eac02aae76fb70c984b123. Edit the source README. -->

# Claude Code {#claude-code}

將您的個人 Claude Code 工作階段傳送到 [LiteLLM Lens](/docs/proxy/lens)，使用 [LiteLLM Lens Claude Code 外掛程式](https://github.com/BerriAI/litellm-lens-plugins/tree/main/claude-code)。此外掛程式會讀取 Claude Code 已寫入的 transcript，並將每個工作階段以一筆 trace 的形式傳送到 Lens。您的模型登入與模型端點維持不變。

## 必要條件 {#prerequisites}

您需要在 macOS 或 Linux 上使用 Claude Code、`PATH` 中有 Python 3.10 或更新版本，以及一個執行中的 [Lens 安裝](/docs/proxy/lens/deployment)。此外掛程式需要一個位址與一把金鑰。當您的 Claude Code 模型呼叫已透過連接到 Lens 的 LiteLLM 閘道進行時，請使用閘道位址與 Claude Code 已在使用的 LiteLLM 金鑰。若使用獨立 Lens，請使用您的 Lens 位址與一把專用的 Lens 追蹤金鑰；在 Lens 中開啟 **Home**，選擇 **Standalone Lens**，然後建立一把金鑰。如果您無法建立金鑰，請向您的管理員索取追蹤金鑰。 <!-- keep-python-version: Claude Code plugin prerequisite -->

## 設定 {#setup}

請使用您的位址與存放金鑰的環境變數安裝此外掛程式。此範例使用獨立 Lens：

```bash
export LITELLM_TRACING_KEY="<paste your Lens tracing key>"

claude plugin marketplace add BerriAI/litellm-lens-plugins
claude plugin install litellm-lens@berriai-lens \
  --config lens_url="http://localhost:4318" --config lens_key="$LITELLM_TRACING_KEY"
```

透過閘道時，請改用 `$ANTHROPIC_BASE_URL` 與 `$ANTHROPIC_AUTH_TOKEN`，取代 Lens 位址與追蹤金鑰。Claude Code 會將金鑰保存在其安全儲存空間中。請重新啟動您已開啟的任何 Claude Code 工作階段，讓它們載入此外掛程式。[Lens coding agent 設定指南](/docs/proxy/lens/coding-agents#claude-code)涵蓋這兩種路徑、外掛程式傳送的內容，以及外掛程式無法執行之機器的 telemetry 備援方案。

## 驗證 trace {#verify-the-trace}

執行一個任務：

```bash
claude -p "Reply with exactly: Lens plugin check."
```

在獨立 Lens 中開啟 **Traces**，或在 LiteLLM 中開啟 **Lens > Traces**，並以 **claude-code** 篩選。該工作階段是一筆 trace，包含其提示詞、回應、工具呼叫與模型呼叫。

## 疑難排解 {#troubleshooting}

如果找不到該工作階段，請檢查 `python3` 是否在 `PATH` 上，並讀取 `~/.claude/plugins/data/litellm-lens-berriai-lens` 中的 `last_error.txt`。其中的 `401` 或 `403` 表示金鑰與位址不相符：閘道位址使用 LiteLLM 金鑰，Lens 位址則使用 Lens 追蹤金鑰。當 `CLAUDE_CODE_ENABLE_TELEMETRY` 與 `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA` 兩者皆已設定時，外掛程式不會傳送任何內容，因此請移除這兩項設定，以使用此外掛程式進行記錄。重新安裝不會變更已儲存的位址或金鑰；若要變更，請先執行 `claude plugin uninstall litellm-lens@berriai-lens`。
