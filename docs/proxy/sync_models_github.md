# 新模型自動同步（Day-0 上線） {#auto-sync-new-models-day-0-launches}

在不重新啟動您的服務的情況下，自動讓您的模型價格與 context window 資料保持最新。**這可讓您在不重新啟動您的服務的情況下，為新模型加入 day-0 支援。**

## 總覽 {#overview}

當 OpenAI 或 Anthropic 等提供者釋出新模型（例如 GPT-5、Claude 4）時，您通常需要重新啟動 LiteLLM 服務，才能取得最新的價格與 context window 資料。 

透過自動同步，LiteLLM 會自動從 GitHub 的 [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 取得最新模型資料，而不需要重新啟動。這表示：

- **零停機時間**：當新模型釋出時
- **始終準確的價格**：用於成本追蹤與預算
- **自動更新** - 設定一次即可

<iframe width="840" height="500" src="https://www.loom.com/embed/ba41acc1882d41b284bbddbb0e9c27ce?sid=bdae351e-2026-4e39-932b-fcb185ff612c" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

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

| 端點 | 方法 | 說明 |
|----------|--------|-------------|
| `/reload/model_cost_map` | POST | 手動同步 |
| `/schedule/model_cost_map_reload?hours={hours}` | POST | 排程週期性同步 |
| `/schedule/model_cost_map_reload` | DELETE | 取消排程的同步 |
| `/schedule/model_cost_map_reload/status` | GET | 檢查同步狀態 |

**驗證：** 需要管理員角色或 master key

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

**自訂模型成本對應表 URL：**
```bash
export LITELLM_MODEL_COST_MAP_URL="https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
```

**使用本機模型成本對應表：**
```bash
export LITELLM_LOCAL_MODEL_COST_MAP=True
```
