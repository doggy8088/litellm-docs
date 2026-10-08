# 批次 API 防護欄 {#batch-api-guardrails}

保護批次輸入檔中的記錄，這樣批次作業就不會把內容送過原本會在 `/chat/completions` 阻擋相同內容的防護欄。

## 運作方式 {#how-it-works}

批次作業分兩步提交。您先使用 `purpose=batch` 將 `.jsonl` 檔案上傳到 `/v1/files`，然後再根據檔案 id 建立作業。記錄只會在提供者端執行，因此上傳就是 LiteLLM 持有其內容的唯一時刻。

防護欄就在這裡執行。每筆記錄都會依其 `url` 所命名的呼叫類型單獨掃描，因此針對 `/v1/chat/completions` 的記錄會以與對應 chat 請求完全相同的方式進行檢查：

```
POST /v1/files  (purpose=batch)
        │
        ▼
┌──────────────────────┐
│    LiteLLM Proxy     │  scans every record against your pre_call guardrails
└──────────┬───────────┘
           │
           │  record 1  clean          -> submitted unchanged
           │  record 2  guardrail masks -> submitted with the mask applied
           │  record 3  guardrail blocks -> left out of the file
           │
           ▼
      Provider receives the remaining records
```

單一有問題的記錄不會使整個檔案失敗。批次作業通常包含成千上萬列，因此因為其中一列就讓全部失敗，通常不是您想要的結果。

## 設定 {#setup}

不需要開啟任何功能。任何在 `pre_call` 上執行的防護欄都會套用到批次上傳：

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: pii-guard
    litellm_params:
      guardrail: presidio
      mode: pre_call
      default_on: true

files_settings:
  - custom_llm_provider: openai
    api_key: os.environ/OPENAI_API_KEY
```

## 每筆記錄會發生什麼事 {#what-happens-to-each-record}

會改寫內容的防護欄，例如 PII 遮罩，會套用其改寫結果，並以該形式提交記錄。會封鎖的防護欄則表示該記錄不會納入送往提供者的檔案中，而其餘作業會繼續。

防護欄未反對的記錄會原樣傳遞，逐位元組不變，因此啟用防護欄不會重新格式化檔案中的其他內容。

## 上傳回應 {#the-upload-response}

回應是一般的檔案物件，外加一個額外欄位 `litellm_batch_guardrail`，僅在防護欄變更了某些內容時才會出現：

```bash
curl -sS http://localhost:4000/v1/files \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -F purpose=batch \
  -F file=@batch_input.jsonl
```

```json
{
  "id": "file-Cr85eqBTg1WiNb1S4ystvR",
  "object": "file",
  "purpose": "batch",
  "bytes": 594,
  "status": "processed",
  "litellm_batch_guardrail": {
    "submitted_records": 3,
    "modified_records": [
      {"line": 2, "custom_id": "row-2", "action": "redacted", "guardrail": null},
      {"line": 3, "custom_id": "row-3", "action": "dropped", "guardrail": "pii-guard"}
    ]
  }
}
```

`submitted_records` 是實際送達提供者的數量。`modified_records` 中的每個項目都會以 `custom_id` 及其在您上傳的檔案中以 1 為起始的 `line` 來識別該記錄，因此無論哪一種方式，您都可以與原始來源對照。

`action` 在記錄套用防護欄的改寫後提交時為 `redacted`，而在該記錄被排除時為 `dropped`。

`guardrail` 會說明是哪個防護欄刪除了記錄，前提是它有自行標識名稱。它刻意回報的是防護欄，而不是原因：防護欄拒絕內容，以及在其 fail-closed 預設下無法連線的防護欄，會以相同方式拋出，因此此時無法分辨兩者。名稱會告訴您接下來該檢查什麼。

相同結果也會寫入代理伺服器記錄以及記錄回呼所讀取的請求中繼資料，因此被刪除的記錄在伺服器端可見，而不僅僅是對呼叫端可見。

## 當上傳被拒絕時 {#when-the-upload-is-refused}

仍有四種情況會讓整個上傳失敗，而不是只刪除單筆記錄。

如果每筆記錄都被阻擋，就沒有任何內容可提交，因此上傳會回傳 400，而不是建立空白作業。

如果防護欄無法連線，或以非內容判定的方式失敗，上傳會回傳 400，並帶有該防護欄自己的狀態。若刪除一筆其實從未被檢查的記錄，會讓您在不知情下遺失資料，因此系統會改為拒絕該檔案。這包含配置為 fail closed、且其後端已離線的防護欄；這很容易被誤認為是政策封鎖，因為許多整合都會以相同方式回報兩者。

如果防護欄設定為將敏感內容路由到不同模型，觸發它的記錄會回傳 400，並標示該列。批次檔案中的每筆記錄都會提交給同一個提供者，因此沒有辦法把那一筆記錄送到別處。請在批次之外送出。

如果記錄的 `body` 不是物件，或沒有 `messages`、`prompt` 或 `input`，就沒有任何內容可供防護欄讀取，上傳會回傳 400，並標示該列。記錄在此之前也會先依一般批次檔案需求進行檢查，因此無法解析或缺少 `custom_id`、`method`、`url` 或 `body` 的列，會更早以其自身訊息被拒絕。

## 限制 {#limits}

只有在 `pre_call` 上執行的防護欄才會看到批次記錄。僅配置給 `post_call` 的防護欄不會參與，因為在上傳時沒有可檢查的回應。

記錄自身內容中的 `guardrails` 金鑰在決定要執行什麼時會被忽略，因此記錄不能規避您或團隊所選擇的內容。它會保留在送往提供者的記錄中。

透過 `litellm_params` 附加到特定部署的防護欄，會在路由之後才套用，而批次上傳不會經過路由，因此那些防護欄不會套用到批次記錄。

記錄會分批、以有限範圍進行掃描，而不是一次全部掃描；若檔案很大且防護欄依賴網路，對應的上傳時間也會更長。掃描記錄數量沒有上限。
