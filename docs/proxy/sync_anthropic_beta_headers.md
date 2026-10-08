# 自動同步 Anthropic Beta 標頭 {#auto-sync-anthropic-beta-headers}

自動讓您的 Anthropic beta 標頭設定保持最新，無需重新啟動服務。**這可讓您在所有提供者上支援新的 Anthropic beta 功能，而無需重新啟動服務。**

## 總覽 {#overview}

當 Anthropic 發布新的 beta 功能（例如新的工具能力、延伸的上下文視窗）時，通常需要重新啟動您的 LiteLLM 服務，才能取得不同提供者（Anthropic、Bedrock、Vertex AI、Azure AI）最新的 beta 標頭對應。

使用自動同步後，LiteLLM 會自動從 GitHub 的 [`anthropic_beta_headers_config.json`](https://github.com/BerriAI/litellm/blob/main/litellm/anthropic_beta_headers_config.json) 提取最新設定，無需重新啟動。這表示：

- **零停機時間**：當新的 beta 功能發布時
- **始終保持最新** 的提供者支援對應
- **自動更新** - 設定一次即可

## 快速開始 {#quick-start}

**手動同步：**
```bash
curl -X POST "https://your-proxy-url/reload/anthropic_beta_headers" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**每 24 小時自動同步：**
```bash
curl -X POST "https://your-proxy-url/schedule/anthropic_beta_headers_reload?hours=24" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## API 端點 {#api-endpoints}

| 端點 | 方法 | 說明 |
|----------|--------|-------------|
| `/reload/anthropic_beta_headers` | POST | 手動同步 |
| `/schedule/anthropic_beta_headers_reload?hours={hours}` | POST | 排程週期性同步 |
| `/schedule/anthropic_beta_headers_reload` | DELETE | 取消排程的同步 |
| `/schedule/anthropic_beta_headers_reload/status` | GET | 檢查同步狀態 |

**驗證：** 需要 admin 角色或 master key

## Python 範例 {#python-example}

```python
import requests

def sync_anthropic_beta_headers(proxy_url, admin_token):
    response = requests.post(
        f"{proxy_url}/reload/anthropic_beta_headers",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    return response.json()

# Usage
result = sync_anthropic_beta_headers("https://your-proxy-url", "your-admin-token")
print(result['message'])
```

## 設定 {#configuration}

**自訂 beta 標頭設定 URL：**
```bash
export LITELLM_ANTHROPIC_BETA_HEADERS_URL="https://raw.githubusercontent.com/BerriAI/litellm/main/litellm/anthropic_beta_headers_config.json"
```

**使用本機 beta 標頭設定：**
```bash
export LITELLM_LOCAL_ANTHROPIC_BETA_HEADERS=True
```

## 排程自動重新載入 {#scheduling-automatic-reloads}

排程自動重新載入，確保您的 proxy 永遠擁有最新的 beta 標頭對應：

```bash
# Reload every 24 hours
curl -X POST "https://your-proxy-url/schedule/anthropic_beta_headers_reload?hours=24" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**檢查重新載入狀態：**
```bash
curl -X GET "https://your-proxy-url/schedule/anthropic_beta_headers_reload/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**回應：**
```json
{
  "scheduled": true,
  "interval_hours": 24,
  "last_run": "2026-02-13T10:00:00",
  "next_run": "2026-02-14T10:00:00"
}
```

**取消排程的重新載入：**
```bash
curl -X DELETE "https://your-proxy-url/schedule/anthropic_beta_headers_reload" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 環境變數 {#environment-variables}

| 變數 | 說明 | 預設值 |
|----------|-------------|---------|
| `LITELLM_ANTHROPIC_BETA_HEADERS_URL` | 從哪個 URL 取得 beta 標頭設定 | GitHub main branch |
| `LITELLM_LOCAL_ANTHROPIC_BETA_HEADERS` | 設定為 `True` 以僅使用本機設定 | `False` |

## 運作方式 {#how-it-works}

1. **初始載入：** 啟動時，LiteLLM 會從遠端 URL 載入 beta 標頭設定（若已設定，則使用本機檔案）
2. **快取：** 設定會快取於記憶體中，以避免每次請求都重複擷取
3. **排程重新載入：** 若已設定，proxy 會每 10 秒檢查一次，是否已到依照您的排程重新載入的時間
4. **手動重新載入：** 您可透過 API 端點觸發立即重新載入
5. **多 Pod 支援：** 在多 Pod 部署中，重新載入設定會儲存在資料庫中，讓所有 Pod 保持同步

## 優點 {#benefits}

- **無需重新啟動：** 無停機地新增對 Anthropic beta 功能的支援
- **提供者相容性：** 自動取得 Bedrock、Vertex AI、Azure AI 等的更新對應
- **效能：** 設定會被快取，僅在需要時重新載入
- **可靠性：** 若遠端擷取失敗，會退回本機設定

## 相關內容 {#related}

- [模型成本對應同步](./sync_models_github.md) - 自動同步模型定價資料
- [Anthropic Beta 標頭](../providers/anthropic.md) - 使用 Anthropic beta 功能
