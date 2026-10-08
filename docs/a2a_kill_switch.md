import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 代理程式終止開關 {#agent-kill-switch}

在每個代理程式上儲存一個「停止此代理程式」webhook，當代理程式行為異常時由 LiteLLM 觸發它。

## 總覽 {#overview}

終止開關是與代理程式其餘設定一起儲存的可選外送 webhook。它保存執行階段預期用於關閉呼叫的端點、HTTP 方法、標頭、查詢參數、JSON 主體和驗證。代理程式管理員可以透過單一請求或從 Admin UI 中該代理程式頁面的 Danger Zone 觸發它。LiteLLM 只會呼叫這個 webhook；代理程式在 LiteLLM 端仍保持已註冊且啟用，因此您可另外決定是否刪除它。每次觸發都會寫入稽核記錄。

只有代理程式管理員可以設定或觸發終止開關。驗證區塊中的密鑰（bearer token、API 金鑰、basic auth 密碼）在每次讀取時都會被遮罩為 `REDACTED_BY_LITELM`。非管理員讀者看到代理程式時會顯示 `kill_switch: null`。

## 設定終止開關 {#configure-a-kill-switch}

<Tabs>
<TabItem value="ui" label="UI">

1. 前往 LiteLLM 儀表板中的 **Agents**。
2. 建立或編輯代理程式。
3. 開啟 **Kill switch** 面板，並填入 URL、方法、標頭、查詢參數、JSON 主體和驗證類型。
4. 儲存。代理程式詳細資料頁面現在會顯示已設定的端點和方法，並將憑證遮罩。

<Image img={require('../img/a2a_kill_switch_form.png')} />

</TabItem>
<TabItem value="api" label="REST API">

```bash
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "inventory-agent",
    "agent_card_params": { ... },
    "kill_switch": {
      "url": "https://agents.internal.example.com/agents/inventory/kill?source=litellm",
      "method": "DELETE",
      "headers": {"X-Env": "prod"},
      "query_params": {"force": "1"},
      "body": {"agent": "inventory-agent", "reason": "manual stop"},
      "auth": {"type": "bearer", "token": "ops-secret-token"}
    }
  }'
```

相同欄位適用於 `PATCH /v1/agents/{agent_id}` 和 `PUT /v1/agents/{agent_id}`。省略 `kill_switch` 的 PATCH 會保留已儲存的值，而 `"kill_switch": null` 會將其移除。當您對驗證資訊已回傳為遮罩的代理程式執行 PATCH 時，請將 `REDACTED_BY_LITELM` 作為 token 傳回，已儲存的密鑰就會保留。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml
agents:
  - agent_name: inventory-agent
    agent_card_params:
      name: "Inventory Agent"
      url: "http://localhost:10001"
      protocolVersion: "1.0"
    kill_switch:
      url: "https://agents.internal.example.com/agents/inventory/kill"
      method: POST
      headers:
        X-Env: prod
      body:
        agent: inventory-agent
      auth:
        type: basic
        username: ops
        password: os.environ/AGENT_KILL_SWITCH_PASSWORD
```

</TabItem>
</Tabs>

## 欄位 {#fields}

| 欄位 | 必填 | 說明 |
|---|---|---|
| `url` | yes | 絕對 `http` 或 `https` URL。其自身的查詢字串會保留，並與 `query_params` 合併 |
| `method` | no | `POST`（預設）、`PUT`、`PATCH`、`DELETE` 或 `GET` |
| `headers` | no | 每次觸發都會送出的靜態標頭。驗證標頭在名稱衝突時具有優先權 |
| `query_params` | no | 附加到 URL 的查詢參數 |
| `body` | no | 作為請求主體送出的 JSON 物件 |
| `auth` | no | 下列驗證形式之一 |

`auth` 區塊是在 `type` 上的標記聯集。`{"type": "bearer", "token": "..."}` 會送出 `Authorization: Bearer <token>`。`{"type": "api_key", "header_name": "X-API-Key", "key": "..."}` 會將金鑰放在您命名的標頭下。`{"type": "basic", "username": "...", "password": "..."}` 會送出 `Authorization: Basic` 標頭。若為未驗證的端點，請不要填入 `auth`。

## 觸發終止開關 {#fire-the-kill-switch}

<Tabs>
<TabItem value="ui" label="UI">

從 **Agents** 清單開啟該代理程式，並捲動到頁面底部的 **Danger Zone**。此區塊只會為代理程式管理員顯示，並警告觸發會停止該代理程式的上游執行階段，且可能造成服務中斷。

<Image img={require('../img/a2a_kill_switch_danger_zone.png')} />

點擊 **Fire Kill Switch**，輸入代理程式的完整名稱以啟用 **Fire** 按鈕，然後確認。接著該區塊會顯示狀態碼以及 webhook 回傳內容的前段。

<Image img={require('../img/a2a_kill_switch_fired.png')} />

</TabItem>
<TabItem value="api" label="REST API">

```bash
curl -X POST http://localhost:4000/v1/agents/{agent_id}/kill_switch \
  -H "Authorization: Bearer sk-admin"
```

```json
{
  "agent_id": "41c54c9e-4327-47c0-8582-cbe848cc6131",
  "url": "https://agents.internal.example.com/agents/inventory/kill",
  "method": "DELETE",
  "status_code": 202,
  "response_body": "{\"stopped\": true}",
  "error": null
}
```

</TabItem>
</Tabs>

LiteLLM 會完全依照設定送出，超時時間為 10 秒，且不會跟隨重新導向。webhook 回傳 2xx 時，會回傳 `200`，其中包含接收端的狀態碼以及其主體前 2000 個字元以內的內容。非 2xx 回應或傳輸失敗會回傳 `502`，且具有相同的結構，讓您可以看到接收端的回應。觸發沒有終止開關的代理程式會回傳 `400`，未知的代理程式會回傳 `404`，而非管理員金鑰在送出任何內容前就會得到 `403`。

回應主體會顯示給觸發該開關的管理員，因此請將 webhook 指向不會回顯密鑰的端點。

## 稽核記錄 {#audit-log}

每次送達 webhook 的觸發，不論是否回傳 2xx，都會在稽核記錄中對 `LiteLLM_AgentsTable` 資料表寫入一筆 `kill_switch_fired` 資料列，並以代理程式 id 作為物件。該資料列會記錄觸發者（使用者與金鑰）、目標 URL、方法、webhook 回傳的狀態碼與截斷後的主體，以及若有傳輸錯誤時的錯誤內容。終止開關設定本身，包括驗證、自訂標頭、主體和查詢參數，都不會寫入該資料列。稽核記錄需要 `litellm_settings.store_audit_logs: true`，請參閱 [Audit Logs](./proxy/multiple_admins)。

在 Admin UI 中，開啟 **Logs**，切換到 **Audit Logs** 分頁，並將 action 篩選為 **Kill switch fired**（或將資料表篩選為 **Agents**）。點擊某一列即可查看完整酬載。

<Image img={require('../img/a2a_kill_switch_audit_log.png')} />
