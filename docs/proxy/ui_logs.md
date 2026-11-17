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

- **從 UI（無需重新啟動）：** 使用 [UI Spend Log 設定](./ui_spend_log_settings.md)，然後開啟 Logs → Settings → 啟用「在 Spend Logs 中儲存提示詞」→ 儲存。會立即生效並覆蓋設定。
- **從設定檔：** 將以下內容加入您的 `proxy_config.yaml`（需要重新啟動）：

```yaml
general_settings:
  store_prompts_in_spend_logs: true
```

<Image img={require('../../img/ui_request_logs_content.png')}/>

已知型態的 token 機密在儲存的內容中預設會被遮罩。涵蓋的型態與退出方式，請參閱 [Spend Logs 中的 Token 遮罩](./token_redaction_spend_logs.md)。提供者的請求與用戶端的回應不受影響。

### 為單一金鑰或團隊關閉提示儲存 {#turn-off-prompt-storage-for-a-key-or-team}

當 proxy 已開啟提示儲存時，您仍可讓單一金鑰或整個團隊的請求與回應內容不寫入支出記錄。請在該金鑰或團隊的 metadata 中設定 `store_prompts_in_spend_logs: false`。

```bash
# one key
curl -X POST 'http://0.0.0.0:4000/key/update' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"key": "sk-...", "metadata": {"store_prompts_in_spend_logs": false}}'

# every key on a team
curl -X POST 'http://0.0.0.0:4000/team/update' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_id": "my-team", "metadata": {"store_prompts_in_spend_logs": false}}'
```

您也可以使用 Admin UI 中 Create Key、Edit Key、Create Team 與 Edit Team 表單上的「Store prompts in spend logs」開關。

受限制金鑰的請求仍會產生一筆支出記錄，包含成本、token 與身分，但其 `proxy_server_request` 與 `response` 為空。此設定涵蓋聊天、pass-through、佇列中與失敗的請求，以及 LiteLLM 執行的批次記錄。

只要金鑰或其團隊任一方設為 `false`，提示就不會被儲存。金鑰設為 `true` 無法覆寫團隊的 `false`，用戶端也無法透過請求 metadata 或 `litellm-disable-message-redaction` 標頭重新開啟儲存。在金鑰或團隊上設為 `true`，也不會在 proxy 已關閉儲存時啟用它。與[訊息編輯遮罩](./logging.md#redact-messages-response-content)不同，此設定只影響支出記錄；其他記錄回呼仍會收到內容。

## 追蹤工具 {#tracing-tools}

查看在您的 completion 請求中提供與呼叫了哪些工具。

<Image img={require('../../img/ui_tools.png')}/>

**範例：** 使用 tools 發出 completion 請求：

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_large}}",
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

## 選擇要儲存哪些 metadata 欄位 {#choose-which-metadata-fields-are-stored}

每一筆 `LiteLLM_SpendLogs` 記錄都有一個 `metadata` JSON 欄位。其內容大多是 `model_map_information`，也就是複製到每一筆記錄的模型成本對照表項目（約 7 KB）。請使用 `spend_logs_metadata_fields` 選擇該欄位的哪些頂層鍵要寫入資料庫。`include` 與 `exclude` 只能設定其中一個

```yaml
general_settings:
  spend_logs_metadata_fields:
    exclude:
      - model_map_information
```

```yaml
general_settings:
  spend_logs_metadata_fields:
    include:
      - user_api_key_alias
      - usage_object
      - cost_breakdown
```

`include` 清單會捨棄所有未列出的鍵，包括只有部分記錄才有的鍵，例如[鏡像呼叫](../traffic_mirroring#find-mirrored-calls-in-logs)上的 `is_silent_experiment`。

未設定此項目時，所有鍵都會寫入，這是預設行為。同時設定兩個清單、兩個都不設定、列出非 `LiteLLM_SpendLogs.metadata` 欄位的鍵，或使用如 `usage_object.cache_read_input_tokens` 的點號路徑，都會讓 proxy 在啟動時停止。`status` 與 `cold_storage_object_key` 永遠會寫入，無法排除。此設定也可以不重啟而透過 `POST /config/field/update`（`config_type: general_settings`）變更，該端點會以 400 拒絕相同的無效值

只有儲存的記錄會被篩選。每日支出表格、預算與記錄回呼仍會收到所有鍵。`proxy_server_request` 與 `response` 欄位不受影響；它們仍由 `store_prompts_in_spend_logs` 控制。變更前寫入的記錄會保留其 metadata，直到[保留期限](#automatically-deleting-old-spend-logs)將其刪除，而 Postgres 只有在 `VACUUM FULL` 或 `pg_repack` 之後才會歸還磁碟空間

有些鍵會從儲存的記錄中讀回。省略它們會讓受影響記錄的以下功能停止運作

| 鍵 | 缺少該鍵的記錄會停止運作的功能 |
|---|---|
| `model_map_information` | 沒有任何功能會從儲存的記錄中讀取它 |
| `usage_object`、`cost_breakdown` | 記錄抽屜中的成本明細與提示快取頁面 |
| `error_information` | `/spend/logs` 上的錯誤代碼與錯誤訊息篩選，以及記錄抽屜中的錯誤明細 |
| `user_api_key_alias` | Logs 頁面與 `/spend/logs/ui` 上的金鑰別名篩選 |
| `user_api_key_team_id`、`user_api_key_user_id` | 從支出記錄中還原已刪除金鑰的團隊與使用者 |
| `guardrail_information` | 記錄抽屜中的防護欄面板與壓縮節省 |
| `used_client_oauth_token` | `/spend/logs` 上的 OAuth token 篩選 |

## 自動刪除舊的支出記錄 {#automatically-deleting-old-spend-logs}

如果您正在儲存支出記錄，定期刪除它們以保持資料庫速度可能是個好主意。

您可以在以下任一處設定保留期間：

- **從 UI（無需重新啟動）：** [UI Spend Log 設定](./ui_spend_log_settings.md)，然後前往 Logs → Settings → 設定保留期間 → 儲存。
- **從設定檔：** 將以下內容加入您的 `proxy_config.yaml`（需要重新啟動）：

```yaml
general_settings:
  maximum_spend_logs_retention_period: "7d"  # Delete logs older than 7 days

  # Optional: how often to run cleanup
  maximum_spend_logs_retention_interval: "1d"  # Run once per day
```

只有在設定了保留期間時才會執行清理，而每次執行都會受到以下限制：每個語句刪除的列數、每個資料表發出的語句數，以及整個執行的總時鐘時間預算。預設值為每個語句 1000 列、每個資料表 500 個語句，以及 5 分鐘。若一次執行達到上限，就會在該處停止，並在下一個 tick 從相同的截斷點繼續，因此大量待處理資料會在多次執行中逐步清除。

如需完整的可調整項目、預設排程，以及大型資料表的指引，請參閱 [Spend Logs 刪除](../proxy/spend_logs_deletion)

## 會記錄什麼？  {#what-gets-logged}

[這裡有一個 schema](https://github.com/BerriAI/litellm/blob/1cdd4065a645021aea931afb9494e7694b4ec64b/schema.prisma#L285) 說明會記錄的內容。
