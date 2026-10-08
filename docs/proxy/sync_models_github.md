# 新模型自動同步（Day-0 上線） {#auto-sync-new-models-day-0-launches}

在不重新啟動您的服務的情況下，自動讓您的模型價格與 context window 資料保持最新。**這可讓您在不重新啟動您的服務的情況下，為新模型加入 day-0 支援。**

## 總覽 {#overview}

當 OpenAI 或 Anthropic 等提供者釋出新模型（例如 GPT-5、Claude 4）時，您通常需要重新啟動 LiteLLM 服務，才能取得最新的價格與 context window 資料。

透過自動同步，LiteLLM 會自動從 GitHub 的 [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 取得最新模型資料，而不需要重新啟動。這表示：

- **零停機時間**：當新模型釋出時
- **始終準確的價格**：用於成本追蹤與預算
- **自動更新** - 設定一次即可

:::info[啟動行為（無需設定）]
本頁上的端點只控制代理程式執行時的**重新同步**。與這些端點無關，每個 LiteLLM 程序在啟動時都已經會從 GitHub `main`（或若已設定則為 `LITELLM_MODEL_COST_MAP_URL`）**抓取一次**遠端 `model_prices_and_context_window.json`，只有在該抓取失敗或驗證失敗時，才會回退到隨套件附帶的副本（`litellm/model_prices_and_context_window_backup.json`）。如果您在映像檔中放入自己的價格檔副本，並希望代理程式使用它而不是遠端檔案，則必須設定 `LITELLM_LOCAL_MODEL_COST_MAP=True`。請參閱[自訂模型成本對映](./custom_model_cost_map)了解詳細資訊，並使用 `GET /model/cost_map/source` 檢查載入的是哪個副本。
:::

<iframe width="840" height="500" src="https://www.loom.com/embed/ba41acc1882d41b284bbddbb0e9c27ce?sid=bdae351e-2026-4e39-932b-fcb185ff612c" frameBorder="0" allowFullScreen></iframe>

<br/>
<br/>

## 快速開始 {#quick-start}

**手動同步：**
```bash
curl -X POST "https://your-proxy-url/reload/model_cost_map" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**每 6 小時自動同步：**
```bash
curl -X POST "https://your-proxy-url/schedule/model_cost_map_reload?hours=6" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## API 端點 {#api-endpoints}

| Endpoint | 方法 | 說明 |
|----------|--------|-------------|
| `/reload/model_cost_map` | POST | 手動同步 |
| `/schedule/model_cost_map_reload?hours={hours}` | POST | 排程定期同步 |
| `/schedule/model_cost_map_reload` | DELETE | 取消已排程的同步 |
| `/schedule/model_cost_map_reload/status` | GET | 檢查同步狀態 |
| `/model/cost_map/source` | GET | 已載入的對映來自何處，以及它是哪個修訂版本 |

**驗證：** 需要管理員角色或 master key

如果重新載入成功，但新加入的模型仍然沒有顯示出來，請先依照[重新載入價格資料後模型遺失](../troubleshoot/missing_model)處理，再對部署做任何變更。

## 檢查目前載入的是哪個修訂版本 {#checking-which-revision-is-loaded}

每次代理程式載入價格對映時，都會記錄其解析的位元組之 git blob id，也就是在 litellm checkout 中對該檔案執行 `git rev-parse <commit>:model_prices_and_context_window.json` 時印出的相同 id。它會將該 id 回報為 `source_revision`，以及 GitHub 在抓取時提供的 `etag` 和 `loaded_at`，顯示在 `GET /model/cost_map/source`、`POST /reload/model_cost_map` 和 `GET /schedule/model_cost_map_reload/status` 上。儀表板會在 Models and Endpoints 下的 Price Data Reload 卡片中顯示相同的三個值

```bash
curl -s "https://your-proxy-url/model/cost_map/source" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

```json
{
  "source": "remote",
  "url": "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json",
  "is_env_forced": false,
  "fallback_reason": null,
  "loaded_at": "2026-09-08T00:49:21.311283+00:00",
  "source_revision": "b1ffc1583e46583bb4becd34cf85ec70c6930828",
  "etag": "W/\"6523ba12ad8daed03f7c879bc2c079d11b111d1ebdee2c27a34c0c756af30445\"",
  "model_count": 3850
}
```

`source_revision` 是對「我的代理程式目前使用哪個價格對映」這個問題的一行答案。若要將它與 `main` 比對，請在 litellm checkout 中執行 `git rev-parse origin/main:model_prices_and_context_window.json`：若相符，表示代理程式正在使用目前的檔案。若要查看 `main` 何時釋出該確切檔案，請執行 `git log --first-parent --find-object=<source_revision> --format='%h %cs %s' origin/main -- model_prices_and_context_window.json`：較舊的一行是釋出它的合併，較新的一行（如果有的話）則是取代它的合併。`--first-parent` 很重要，因為大多數修訂版本是透過從 `litellm_internal_staging` 合併而來的方式進入 `main`，而單純的 `git log` 不會保留那些合併。若沒有 checkout，`gh api 'repos/BerriAI/litellm/contents/model_prices_and_context_window.json?ref=main' --jq .sha` 會印出它目前提供的 id `main`。兩個代理程式若回報相同的 `source_revision`，就表示它們提供的是位元組完全相同的對映，不論各自是從哪個 URL 抓取的。當對映來自隨附副本（`LITELLM_LOCAL_MODEL_COST_MAP=True` 或抓取失敗）時，`etag` 會是 `null`，而 `source_revision` 則是該隨附檔案的 id。JSON 本身不會被寫入任何標記，因此該檔案沒有 `_metadata` 項目，也沒有 `generated_at`

## Python 範例 {#python-example}

```python
import requests

def sync_models(proxy_url, admin_token):
    response = requests.post(
        f"{proxy_url}/reload/model_cost_map",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    return response.json()

# Usage
result = sync_models("https://your-proxy-url", "your-admin-token")
print(result['message'])
```

## 設定 {#configuration}

這兩個變數同時適用於啟動時的抓取，以及上述端點所觸發的每次重新載入。

**自訂模型成本對映 URL**（下方顯示預設值；即使未設定，遠端抓取仍會發生）：
```bash
export LITELLM_MODEL_COST_MAP_URL="https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
```

**僅使用本機模型成本對映**（停用啟動時與重新載入時的遠端抓取；會使用隨附的備份檔案）：
```bash
export LITELLM_LOCAL_MODEL_COST_MAP=True
```
