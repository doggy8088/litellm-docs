# TinyFish Agent {#tinyfish-agent}

[TinyFish Agent API](https://docs.tinyfish.ai/agent-api) 的轉送端點，以原生格式進行以目標為基礎的網頁自動化（不翻譯）。將官方 TinyFish SDK 指向代理，即可在不變更的情況下運作

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | `COMPLETED` 執行會以 `num_of_steps x $0.016` 計費（TinyFish 公布的費率） |
| 記錄 | ✅ | 執行會記錄為模型 `tinyfish/automation-run` |
| 端使用者追蹤 | ❌ | [如果您需要這項功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | `run-sse` 進度事件即時轉送 |

只要將 `https://agent.tinyfish.ai` 替換為 `LITELLM_PROXY_BASE_URL/tinyfish` 即可 🚀

**支援的端點：**

| 端點 | 方法 | 說明 |
|----------|--------|-------------|
| `/v1/automation/run` | POST | 執行自動化直到完成（阻塞） |
| `/v1/automation/run-async` | POST | 提交執行，輪詢結果 |
| `/v1/automation/run-sse` | POST | 以即時 SSE 進度事件執行 |
| `/v1/runs/{id}` | GET | 執行狀態與結果 |
| `/v1/runs/{id}/cancel` | POST | 取消執行 |

其他所有 Agent API 端點（vault、wallet、browser profiles）都會回傳 403。所有呼叫端共用代理的一組上游 TinyFish 金鑰，因此憑證與帳戶管理介面維持僅供管理員使用。`GET /v1/runs` 列表也會被封鎖：執行 ID 無法猜測，因此不公開列表可避免共用金鑰下的呼叫端發現彼此的執行

## 快速開始 {#quick-start}

### 1. 將您的 TinyFish API 金鑰加入代理 {#1-add-your-tinyfish-api-key-to-the-proxy}

在代理上設定 `TINYFISH_API_KEY` 環境變數，或加入一個含有 `use_in_pass_through: true` 的部署

```bash
export TINYFISH_API_KEY="your-tinyfish-api-key"
```

### 2. 執行自動化 {#2-run-an-automation}

```bash
curl http://localhost:4000/tinyfish/v1/automation/run \
  -H "X-API-Key: $LITELLM_VIRTUAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://scrapeme.live/shop",
    "goal": "Extract the first 2 product names and prices. Return JSON."
  }'
```

**預期回應：**

```json
{
  "run_id": "1e7d076e-c464-4f13-8edf-817e9cd78a8b",
  "status": "COMPLETED",
  "started_at": "2026-09-14T17:59:19.562Z",
  "finished_at": "2026-09-14T18:00:20.438Z",
  "num_of_steps": 2,
  "result": {"result": [{"name": "Bulbasaur", "price": "£63.00"}, {"name": "Ivysaur", "price": "£87.00"}]},
  "error": null
}
```

### 3. 或使用官方 TinyFish SDK {#3-or-use-the-official-tinyfish-sdk}

SDK 接受一個帶有 `base_url` 前綴的 `/tinyfish`，並在 `X-API-Key` 標頭上傳送虛擬金鑰，而 LiteLLM 原生支援該標頭

```python
from tinyfish import TinyFish

client = TinyFish(
    base_url="http://localhost:4000/tinyfish",
    api_key="sk-your-litellm-virtual-key",
)
run = client.agent.run(
    url="https://scrapeme.live/shop",
    goal="Extract the first 2 product names and prices. Return JSON.",
)
print(run.status, run.num_of_steps, run.result)
```

### 4. 查看記錄 {#4-view-logs}

前往側邊欄中的 **Logs**，並依 `tinyfish` 篩選。每次執行都會顯示模型 `tinyfish/automation-run`、呼叫金鑰，以及花費

## 花費追蹤 {#spend-tracking}

執行會依照 `num_of_steps x $0.016` 計費給呼叫金鑰與團隊：

- `POST /v1/automation/run` 會在阻塞式回應返回時計費
- `POST /v1/automation/run-async` 只會計費一次：LiteLLM 會在背景輪詢執行，並在其達到終端狀態時寫入一筆花費記錄。對 `GET /v1/runs/{id}` 的客戶端輪詢永遠不會計費，不論次數多少
- `POST /v1/automation/run-sse` 也只會在執行達到終端狀態時計費一次，方式相同：中途斷線的客戶端，在執行完成後仍只會計費一次
- 只有 `COMPLETED` 執行會產生成本。`FAILED` 與 `CANCELLED` 執行會寫入 $0 花費記錄，與 TinyFish 的計費方式一致
- `GET /v1/runs/{id}` 與取消永遠不會寫入花費記錄

如果您的 TinyFish 合約對步驟定價不同，請使用 `TINYFISH_COST_PER_STEP` 環境變數覆寫每步費率

一個營運上的注意事項：run-async 與 SSE 計費執行是在記憶體中的背景輪詢器中執行。它會在客戶端斷線後繼續存在，但若代理在此類執行進行中重新啟動，會遺失該執行的花費記錄（執行本身在上游仍會不受影響地完成）

## 已驗證的執行 {#authenticated-runs}

使用 TinyFish 帳戶已儲存登入資訊（`use_vault`、`credential_item_ids`、`use_profile`、`profile_id`）的請求欄位，預設會被 403 拒絕，因為所有呼叫端都共用代理的上游金鑰。請在代理上設定 `TINYFISH_ALLOW_AUTHENTICATED_RUNS=true` 以允許它們

LiteLLM 的通用轉送包裝欄位（`custom_body`、`stream`、`query_params`）在此路由上會以 400 拒絕：請傳送原生 TinyFish 請求主體，而串流則由您呼叫的端點決定

## 逾時 {#timeouts}

預設情況下，阻塞式執行會獲得 1500 秒的上游逾時，涵蓋 TinyFish 1200 秒的最長執行時間。設定 `general_settings.pass_through_request_timeout` 會覆寫它

## 環境變數 {#environment-variables}

| 變數 | 說明 |
|----------|-------------|
| `TINYFISH_API_KEY` | 代理用於上游的 TinyFish API 金鑰 |
| `TINYFISH_AGENT_API_BASE` | TinyFish Agent API 的基礎 URL。預設為 `https://agent.tinyfish.ai`；不含 scheme 的值會視為 https |
| `TINYFISH_COST_PER_STEP` | 用於花費追蹤的每步 USD 費率。預設為 0.016 |
| `TINYFISH_ALLOW_AUTHENTICATED_RUNS` | 設為 `true` 以允許執行請求中的 vault 與 browser-profile 欄位 |
