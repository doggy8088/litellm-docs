# Claude Code - 提示快取路由 {#claude-code---prompt-cache-routing}

Claude 的 [提示快取](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) 功能可透過嘗試快取提示，並在後續 API 請求中重複使用已快取的提示，以協助最佳化 API 使用。Claude Code 會使用此功能。

當啟用 LiteLLM [負載平衡](../proxy/load_balancing.md) 時，為確保這個提示快取功能在 Claude Code 中仍可正常運作，LiteLLM 需要設定為使用 `PromptCachingDeploymentCheck` pre-call 檢查。這個 pre-call 檢查會確保使用提示快取的 API 請求會被記住，且後續嘗試使用該提示快取的 API 請求會路由到發生 cache 寫入的同一個模型部署。

## 設定 {#set-up}

1. 設定路由器，使其使用 `PromptCachingDeploymentCheck`（透過設定 `optional_pre_call_checks` 屬性），並設定模型，使其可以存取 Claude 的多個部署；以下我們示範多個 AWS 帳戶的範例（分別稱為 `account-1` 和 `account-2`，並使用 `aws_profile_name` 屬性）：
```yaml
router_settings:
  optional_pre_call_checks: ["prompt_caching"]

model_list:
- litellm_params:
    model: us.anthropic.claude-sonnet-4-5-20250929-v1:0
    aws_profile_name: account-1
    aws_region_name: us-west-2
  model_info:
    litellm_provider: bedrock
  model_name: us.anthropic.claude-sonnet-4-5-20250929-v1:0
- litellm_params:
    model: us.anthropic.claude-sonnet-4-5-20250929-v1:0
    aws_profile_name: account-2
    aws_region_name: us-west-2
  model_info:
    litellm_provider: bedrock
  model_name: us.anthropic.claude-sonnet-4-5-20250929-v1:0
```
2. 使用 Claude Code：
   1. 啟動 Claude Code，它會進行一次 warm-up API 請求，嘗試快取其 warm-up prompt 與系統 prompt。
   2. 等待幾秒鐘，然後結束 Claude Code 並重新開啟。
   3. 您會注意到 warm-up API 請求成功取得 cache hit（如果在像 VS Code 這類 IDE 中使用 Claude Code，請確保在此處步驟 2.1 與 2.2 之間不要做任何事，否則可能不會有 cache hit）：
      1. 前往 Admin UI 中的 [LiteLLM Request Logs 頁面](../proxy/ui_logs.md)
      2. 點選個別請求以查看 (a) cache 建立與 cache 讀取 token；以及 (b) Model ID。特別是，步驟 2.1 的 API 請求應顯示 cache 寫入，而步驟 2.2 的 API 請求應顯示 cache 讀取；此外，Model ID 應相同（表示 API 請求被轉送至同一個 AWS 帳戶）。

## 相關 {#related}

- [Claude Code - 快速入門](./claude_responses_api.md)
- [Claude Code - 客戶追蹤](./claude_code_customer_tracking.md)
- [Claude Code - 外掛市集](./claude_code_plugin_marketplace.md)
- [Claude Code - WebSearch](./claude_code_websearch.md)
- [Proxy - 負載平衡](../proxy/load_balancing.md)
