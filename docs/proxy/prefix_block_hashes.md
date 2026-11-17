---
title: 前綴區塊雜湊 ID
description: 在支出記錄中記錄以密鑰標記的提示詞前綴區塊 ID，供合成流量重播使用，且不保留提示詞文字。
---

# 前綴區塊雜湊 ID {#prefix-block-hash-ids}

<SinceVersion v="1.111.0" />

選擇加入的 `prefix_block_hashes` 回呼會記錄哪些請求共用提示詞前綴，而不會將該提示詞存入雜湊中繼資料。您可以將這些 ID 與支出記錄中已有的輸入與輸出權杖數搭配使用，為正式環境流量重播準備 Mooncake 風格的追蹤記錄，例如使用 AIPerf 進行基準測試，或使用 GuideLLM 的追蹤記錄轉換工作流程。這個回呼本身不會匯出追蹤記錄，也不會重播流量。

每個 ID 代表一個權杖區塊，以及它之前的所有區塊。具有相同分詞後前綴的請求會共用前面的 ID，並在輸入開始不同後分歧。這個回呼使用鏈式 HMAC-SHA256 摘要，每個 ID 截斷為 16 個十六進位字元，並包含最後一個不完整的區塊。

## 啟用回呼 {#enable-the-callback}

請在代理程式的處理程序環境中設定一個專用的高熵密鑰。例如，請在啟動代理程式之前先產生一個密鑰：

```bash
export LITELLM_PREFIX_BLOCK_HASHES_SECRET="$(openssl rand -hex 32)"
```

請將這個值保存在您的密鑰管理器中，並在需要可比較的 ID 時，於各個工作程序與重新啟動之間重複使用它。它不會備援至 `LITELLM_SALT_KEY` 或主金鑰。變更密鑰會變更 ID。

請將這個回呼加入您現有的代理程式設定，然後重新啟動代理程式：

```yaml
litellm_settings:
  callbacks: ["prefix_block_hashes"]
```

請使用已啟用[支出追蹤](./cost_tracking.md)的資料庫支援代理程式，將 ID 保留在 `LiteLLM_SpendLogs` 中。這個回呼不會啟用提示詞儲存、不會停用其他記錄回呼，也不會變更您現有的提示詞保留設定。如果提示詞不得保留，請另外檢查這些設定。

預設區塊大小為 512 個權杖。若要使用不同的大小，請在啟動前設定 `LITELLM_PREFIX_BLOCK_HASHES_BLOCK_SIZE`，然後重新啟動：

```bash
export LITELLM_PREFIX_BLOCK_HASHES_BLOCK_SIZE=64
```

選用的 `LITELLM_PREFIX_BLOCK_HASHES_MAX_CHARS` 設定會在分詞之前限制序列化後的提示詞長度。它的預設值為 65,536 個字元，若 `TOKEN_COUNTER_MAX_EXACT_CHARS` 較低，則以該值為準。它接受不超過 `TOKEN_COUNTER_MAX_EXACT_CHARS` 的正整數，這是一個字元額度，不是權杖上限。請在啟動前設定它，然後重新啟動代理程式：

```bash
export LITELLM_PREFIX_BLOCK_HASHES_MAX_CHARS=32768
```

## 從支出記錄讀取 ID {#read-the-ids-from-spend-logs}

串流與非串流聊天請求都會寫入支出記錄資料列中的 `metadata.spend_logs_metadata.prefix_block_hashes`。現有的 `spend_logs_metadata` 項目會予以保留。以下是一個示範資料列，已省略無關欄位：

```json
{
  "startTime": "2026-11-17T00:00:00.000Z",
  "prompt_tokens": 655,
  "completion_tokens": 52,
  "metadata": {
    "spend_logs_metadata": {
      "prefix_block_hashes": {
        "block_size": 512,
        "hash_ids": ["a1b2c3d4e5f60718", "b2c3d4e5f6071829"]
      }
    }
  }
}
```

這些是衍生自內容的指紋，不是匿名的保證。在相同的密鑰與分詞設定下，讀取者可以比較前綴。請保護密鑰，並限制對記錄的存取。

## 雜湊被略過時 {#when-hashing-is-skipped}

雜湊為選用功能，且採失敗開放設計。密鑰缺失或為空、序列化後的提示詞超出字元額度，或發生序列化或分詞器錯誤時，請求會保持不變。這些情況不會使模型請求失敗，略過與錯誤的詳細資訊會以偵錯層級記錄。

當記錄路徑會遮蔽訊息時，這個回呼也會略過雜湊，包括全域的 `litellm_settings.turn_off_message_logging: true`，以及適用的每個請求遮蔽控制項。若 `turn_off_message_logging` 由用戶端提供，部署必須透過 `litellm_params.configurable_clientside_auth_params` 明確允許該欄位，例如：

```yaml
model_list:
  - model_name: replay-model
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      configurable_clientside_auth_params: ["turn_off_message_logging"]
```

用戶端接著可以在請求主體中傳送 `"turn_off_message_logging": true`。若缺少必要的用戶端權限，代理程式驗證可以在回呼執行之前拒絕這項覆寫。這個回呼的失敗開放行為不會繞過驗證。如需了解全域設定與標頭控制項，請參閱[訊息記錄控制項](./logging.md#redact-messages-response-content)。

工作程序的准入受 `TOKEN_COUNTER_MAX_CONCURRENT_COUNTS` 限制，每個處理程序的預設值為 4。如果所有雜湊位置都已被占用，請求會略過雜湊，而不會排隊等待位置。非聊天呼叫類型，以及沒有非空 `messages` 清單的請求，也會保持不變。支援的呼叫類型為 `completion` 與 `acompletion`。

## 將資料列轉換為 Mooncake 追蹤記錄 {#convert-rows-to-a-mooncake-trace}

[AIPerf 的 Mooncake 追蹤記錄格式](https://docs.nvidia.com/aiperf/dev/benchmark-modes/trace-replay-with-mooncake-traces)使用 `timestamp` 表示以毫秒為單位的到達時間，使用 `input_length` 與 `output_length` 表示權杖數，並使用選用的整數 `hash_ids`。請將十六進位 ID 轉換為整數，而不是直接傳遞字串。

以下指令碼會從標準輸入讀取匯出的支出記錄資料列 JSON 陣列，並寫出 JSONL。它會略過沒有 ID 的資料列，處理以物件或 JSON 字串形式匯出的中繼資料，並將時間戳記設為相對於第一個保留請求的時間。請從同一組模型與分詞器設定、密鑰與區塊大小匯出資料列，以取得可比較的追蹤記錄。

```python
import json
import sys
from datetime import datetime

records = []
for row in json.load(sys.stdin):
    metadata = row["metadata"]
    if isinstance(metadata, str):
        metadata = json.loads(metadata)
    hashes = (metadata or {}).get("spend_logs_metadata", {}).get("prefix_block_hashes")
    if hashes and hashes["hash_ids"]:
        started = datetime.fromisoformat(row["startTime"].replace("Z", "+00:00"))
        records.append((started, row, hashes))

records.sort(key=lambda record: record[0])
for started, row, hashes in records:
    print(json.dumps({
        "timestamp": (started - records[0][0]).total_seconds() * 1000,
        "input_length": row["prompt_tokens"],
        "output_length": row["completion_tokens"],
        "hash_ids": [int(value, 16) for value in hashes["hash_ids"]],
    }))
```

請將它儲存為 `spend_to_mooncake.py`，並執行 `python3 spend_to_mooncake.py < spend_rows.json > mooncake.jsonl`。空的輸入陣列，或沒有含雜湊資料列的匯出內容，不會產生任何追蹤記錄項目。請使用已記錄權杖使用量的成功資料列。請將重播工具的合成區塊設定與儲存的 `block_size` 對齊，上述四個欄位的追蹤記錄並未攜帶該值。其他工具，包括 GuideLLM，可能需要各自的匯入或轉換步驟。

## 分詞器與重播限制 {#tokenizer-and-replay-limits}

這個回呼會先將工具序列化為按鍵排序的 JSON，再序列化每則訊息的角色與文字，以及存在時的 `tool_calls`、`tool_call_id` 與 `name`。它會保留清單內容中的文字部分，並忽略圖片等非文字部分。分詞會使用 LiteLLM 以模型為基礎的 `encode` 選擇，並以預設編碼作為備援。

這是一種確定性的表示方式，不是提供者的確切聊天範本。提供者的輸入權杖數可能與序列化後的權杖數不同，因此 `len(hash_ids)` 未必等於提供者的 `prompt_tokens` 除以區塊大小的結果。請使用支出記錄資料列的實際權杖數作為追蹤記錄長度，並將前綴 ID 視為共用情況的近似值，而不是快取命中的預測。重播會合成內容，而不是還原原始提示詞。比較 ID 時，請保持分詞器、序列化方式、區塊大小與密鑰一致。
