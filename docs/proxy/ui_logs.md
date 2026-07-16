import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# UI Logs 入門 {#getting-started-with-ui-logs}

查看 LiteLLM 每個請求的支出、Token 使用量、金鑰、團隊名稱

<Image img={require('../../img/ui_request_logs.png')}/>

## 概覽 {#overview}

| 記錄類型 | 預設是否追蹤 |
|----------|-------------------|
| 成功記錄 | ✅ 是 |
| 錯誤記錄 | ✅ 是 |
| 儲存的請求/回應內容 | ❌ 預設否，**可透過 `store_prompts_in_spend_logs` 啟用** |

**預設情況下，LiteLLM 不會追蹤請求與回應內容。**

## 追蹤 - 記錄頁面的請求 / 回應內容  {#tracking---request--response-content-in-logs-page}

如果您想在 LiteLLM 記錄中查看請求與回應內容，可以在以下任一處啟用：

- **從 UI（無需重新啟動）：** 使用 [UI 支出記錄設定](./ui_spend_log_settings.md) — 開啟「記錄 → 設定 → 啟用 Store Prompts in Spend Logs → 儲存」。會立即生效並覆蓋設定檔。
- **從設定檔：** 將以下內容加入您的 `proxy_config.yaml`（需要重新啟動）：

```yaml
general_settings:
  store_prompts_in_spend_logs: true
```

<Image img={require('../../img/ui_request_logs_content.png')}/>

## 追蹤工具 {#tracing-tools}

查看在您的 completion 請求中提供與呼叫了哪些工具。

<Image img={require('../../img/ui_tools.png')}/>

**範例：** 使用 tools 發出 completion 請求：

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "What is the weather?"}],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get the current weather",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {"type": "string"}
            }
          }
        }
      }
    ]
  }'
```

查看記錄頁面以瞭解所有提供的工具以及哪些工具被呼叫。

## 停止將錯誤記錄儲存在 DB 中 {#stop-storing-error-logs-in-db}

如果您不想將錯誤記錄儲存在 DB 中，可以使用此設定停用

```yaml
general_settings:
  disable_error_logs: True   # Only disable writing error logs to DB, regular spend logs will still be written unless `disable_spend_logs: True`
```

## 停止將支出記錄儲存在 DB 中 {#stop-storing-spend-logs-in-db}

如果您不想將支出記錄儲存在 DB 中，可以使用此設定停用

```yaml
general_settings:
  disable_spend_logs: True   # Disable writing spend logs to DB
```

## 自動刪除舊的支出記錄 {#automatically-deleting-old-spend-logs}

如果您正在儲存支出記錄，定期刪除它們以保持資料庫速度可能是個好主意。

您可以在以下任一處設定保留期間：

- **從 UI（無需重新啟動）：** [UI 支出記錄設定](./ui_spend_log_settings.md) — 記錄 → 設定 → 設定保留期間 → 儲存。
- **從設定檔：** 將以下內容加入您的 `proxy_config.yaml`（需要重新啟動）：

```yaml
general_settings:
  maximum_spend_logs_retention_period: "7d"  # Delete logs older than 7 days

  # Optional: how often to run cleanup
  maximum_spend_logs_retention_interval: "1d"  # Run once per day
```

您可以使用此環境變數控制每次執行刪除的記錄數量：

`SPEND_LOG_RUN_LOOPS=200  # Deletes up to 200,000 logs in one run`

設定 `SPEND_LOG_CLEANUP_BATCH_SIZE` 以控制每批次刪除的記錄數量（預設 `1000`）。

如需詳細架構與運作方式，請參閱 [支出記錄刪除](../proxy/spend_logs_deletion)。

## 會記錄什麼？  {#what-gets-logged}

[這裡有一個 schema](https://github.com/BerriAI/litellm/blob/1cdd4065a645021aea931afb9494e7694b4ec64b/schema.prisma#L285) 說明會記錄的內容。
