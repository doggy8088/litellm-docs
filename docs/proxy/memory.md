import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 記憶體管理 {#memory-management}

儲存使用者偏好與回饋，讓您的 LLM 能在不同工作階段之間記住它們。依使用者與團隊進行範圍劃分，並內建存取控制。

**需要：** 已連接 PostgreSQL 的 LiteLLM `v1.83.10+`。無需變更設定。

### 建立 {#create}

<Tabs>
<TabItem value="curl" label="curl">

```shell
curl -X POST "http://localhost:4000/v1/memory" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user:preferences",
    "value": "Prefers concise responses. Timezone: PST.",
    "metadata": {"version": 1}
  }'
```

</TabItem>
<TabItem value="python" label="Python">

```python
import httpx

client = httpx.Client(
    base_url="http://localhost:4000",
    headers={"Authorization": "Bearer sk-1234"},
)

client.post("/v1/memory", json={
    "key": "user:preferences",
    "value": "Prefers concise responses. Timezone: PST.",
    "metadata": {"version": 1},
})
```

</TabItem>
</Tabs>

### 讀取 {#read}

```shell
curl "http://localhost:4000/v1/memory/user:preferences" \
  -H "Authorization: Bearer sk-1234"
```

### 更新 {#update}

```shell
curl -X PUT "http://localhost:4000/v1/memory/user:preferences" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"value": "Prefers concise responses. Timezone: EST."}'
```

### 列出 {#list}

```shell
# All entries
curl "http://localhost:4000/v1/memory" \
  -H "Authorization: Bearer sk-1234"

# By prefix
curl "http://localhost:4000/v1/memory?key_prefix=user:" \
  -H "Authorization: Bearer sk-1234"
```

### 刪除 {#delete}

```shell
curl -X DELETE "http://localhost:4000/v1/memory/user:preferences" \
  -H "Authorization: Bearer sk-1234"
```

## 存取控制 {#access-control}

範圍劃分會根據 API 金鑰自動進行。

| 角色 | 讀取 | 寫入 |
|------|-------|--------|
| 使用者 | 自己 + 團隊項目 | 僅自己的項目 |
| 團隊管理員 | 自己 + 團隊項目 | 自己 + 團隊項目 |
| Proxy 管理員 | 全部 | 全部 |

## 金鑰命名 {#key-naming}

金鑰在全域範圍內必須唯一。使用前綴來建立命名空間並進行查詢：

```
user:preferences           → per-user settings
team:playbook:onboarding   → shared team resources
agent:memory:scratchpad    → agent working memory
```

## 範例：Slack 機器人中的每位使用者記憶體 {#example-per-user-memory-in-a-slack-bot}

依 Slack 工作區與使用者分割記憶體，讓每個人的偏好彼此隔離。

**金鑰格式：** `slack:{team_id}:{user_id}`

```python
import httpx

LITELLM_BASE = "http://localhost:4000"
LITELLM_KEY = "sk-1234"

def memory_key(team_id: str, user_id: str) -> str:
    return f"slack:{team_id}:{user_id}"

async def get_preferences(team_id: str, user_id: str) -> str:
    """Read saved preferences. Returns "" if none exist."""
    key = memory_key(team_id, user_id)
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{LITELLM_BASE}/v1/memory/{key}",
            headers={"Authorization": f"Bearer {LITELLM_KEY}"},
        )
    if r.status_code == 404:
        return ""
    return r.json().get("value", "")

async def save_preference(team_id: str, user_id: str, note: str):
    """Append a preference. PUT upserts — creates or updates."""
    key = memory_key(team_id, user_id)
    existing = await get_preferences(team_id, user_id)

    # Store as bullet list
    bullets = [b for b in existing.split("\n") if b.strip()]
    bullets.append(f"- {note}")
    
    async with httpx.AsyncClient() as client:
        await client.put(
            f"{LITELLM_BASE}/v1/memory/{key}",
            headers={"Authorization": f"Bearer {LITELLM_KEY}"},
            json={"value": "\n".join(bullets)},
        )
```

**每一輪都注入到您的系統提示中：**

```python
prefs = await get_preferences(team_id, user_id)

messages = [
    {"role": "system", "content": f"""You are a helpful assistant.

SAVED USER PREFERENCES:
{prefs}

Follow these unless the current message contradicts them."""},
    {"role": "user", "content": user_message},
]
```

**查詢某工作區的所有偏好：**

```shell
curl "http://localhost:4000/v1/memory?key_prefix=slack:T024BE7LD:" \
  -H "Authorization: Bearer sk-1234"
```

## 中繼資料 {#metadata}

將任何 JSON 附加到項目：

```json
{
  "key": "agent:findings",
  "value": "Q1 API usage up 15%...",
  "metadata": {"tags": ["research"], "confidence": 0.92}
}
```

## API 參考 {#api-reference}

完整的請求/回應結構、參數與錯誤代碼：[/memory 端點參考](/docs/memory_management)。
