---
title: Errors
---

# 錯誤 {#errors}

設定問題會引發例外。您設定的限制，例如 `timeout` 和 `max_turns`，會結束該回合並回傳帶有 `stop_reason` 的 `Result`，因此部分工作會被保留。

以下所有例外都會繼承 `litellm.harness.HarnessError`，但 `TypeError` 和 `ValueError` 除外。

| Exception | Raised when | Raised at |
|---|---|---|
| `TypeError` | `harness` 不是 `Harness` 成員。訊息會指出您可能原本想要的成員。 | 呼叫時 |
| `ValueError` | 在未提供閘道基礎 URL 或金鑰的情況下使用 `litellm_proxy/` 模型 | 呼叫時 |
| `CapabilityUnsupported` | 這個 harness 無法執行您要求的操作，例如在 Codex 上 `permissions="edit"`，或在 Claude Code 上 `tools=` | 執行階段開始前 |
| `OptionsMismatch` | 其他 harness 的選項，或 LiteLLM 管理的原生設定鍵 | 呼叫時 |
| `HarnessInstallFailed` | 執行階段二進位檔不在 sandbox 的 `PATH` 上，或未安裝 Deep Agents 的套件 | 會話開始時 |
| `SandboxError` | sandbox 啟動失敗、無法執行命令或無法連線到主機 | 任何時間 |
| `SessionClosed` | 在已關閉或已分離的會話上開始一個回合 | 回合開始時 |
| `StateIncompatible` | `agent_resume()` 使用了來自不同 harness 的狀態，或版本無法讀取 | 恢復時 |
| `OutputInvalid` | 最終回答未通過 `output=` 驗證 | 回合結束時 |

## 停止原因 {#stop-reasons}

| `stop_reason` | 意義 |
|---|---|
| `"done"` | 執行階段完成了該回合 |
| `"max_turns"` | 已達到 `max_turns` 次工具呼叫 |
| `"timeout"` | 該回合執行時間超過 `timeout` 秒 |
| `"cancelled"` | 該回合已被取消 |
| `"runtime_error"` | 執行階段程序自行結束；`Result.text` 會顯示其最後幾行 stderr |

## 回合中的模型錯誤 {#model-errors-during-a-turn}

回合內的提供者錯誤，例如速率限制和 5xx 回應，不會被拋出。執行階段通常會自行重試，而在閘道上，它們會以帶有 harness 標記的失敗請求形式顯示在支出記錄中。

錯誤訊息絕不會包含您的虛擬金鑰、提供者金鑰或會話權杖。
