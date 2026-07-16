# 動態 TPM/RPM 分配  {#dynamic-tpmrpm-allocation}

防止專案吞掉過多的 tpm/rpm。

**另請參閱：** [請求優先順序](../scheduler.md) - 透過將 LLM API 請求加入優先佇列，讓高流量時優先處理。

根據該分鐘內的啟用金鑰，動態分配給 API 金鑰的 TPM/RPM 配額。[**查看程式碼**](https://github.com/BerriAI/litellm/blob/9bffa9a48e610cc6886fc2dce5c1815aeae2ad46/litellm/proxy/hooks/dynamic_rate_limiter.py#L125)

## 快速開始使用 {#quick-start-usage}

1. 設定 config.yaml 

```yaml showLineNumbers title="config.yaml"
model_list: 
  - model_name: my-fake-model
    litellm_params:
      model: gpt-3.5-turbo
      api_key: my-fake-key
      mock_response: hello-world
      tpm: 60

litellm_settings: 
  callbacks: ["dynamic_rate_limiter_v3"]

general_settings:
  master_key: sk-1234 # OR set `LITELLM_MASTER_KEY=".."` in your .env
  database_url: postgres://.. # OR set `DATABASE_URL=".."` in your .env
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試一下！ 

```python showLineNumbers title="test.py"
"""
- Run 2 concurrent teams calling same model
- model has 60 TPM
- Mock response returns 30 total tokens / request
- Each team will only be able to make 1 request per minute
"""

import requests
from openai import OpenAI, RateLimitError

def create_key(api_key: str, base_url: str): 
    response = requests.post(
        url="{}/key/generate".format(base_url), 
        json={},
        headers={
            "Authorization": "Bearer {}".format(api_key)
        }
    )

    _response = response.json()

    return _response["key"]

key_1 = create_key(api_key="sk-1234", base_url="http://0.0.0.0:4000")
key_2 = create_key(api_key="sk-1234", base_url="http://0.0.0.0:4000")

# call proxy with key 1 - works
openai_client_1 = OpenAI(api_key=key_1, base_url="http://0.0.0.0:4000")

response = openai_client_1.chat.completions.with_raw_response.create(
    model="my-fake-model", messages=[{"role": "user", "content": "Hello world!"}],
)

print("Headers for call 1 - {}".format(response.headers))
_response = response.parse()
print("Total tokens for call - {}".format(_response.usage.total_tokens))


# call proxy with key 2 -  works 
openai_client_2 = OpenAI(api_key=key_2, base_url="http://0.0.0.0:4000")

response = openai_client_2.chat.completions.with_raw_response.create(
    model="my-fake-model", messages=[{"role": "user", "content": "Hello world!"}],
)

print("Headers for call 2 - {}".format(response.headers))
_response = response.parse()
print("Total tokens for call - {}".format(_response.usage.total_tokens))
# call proxy with key 2 -  fails
try:  
    openai_client_2.chat.completions.with_raw_response.create(model="my-fake-model", messages=[{"role": "user", "content": "Hey, how's it going?"}])
    raise Exception("This should have failed!")
except RateLimitError as e: 
    print("This was rate limited b/c - {}".format(str(e)))

```

**預期回應**

```
This was rate limited b/c - Error code: 429 - {'error': {'message': {'error': 'Key=<hashed_token> over available TPM=0. Model TPM=0, Active keys=2'}, 'type': 'None', 'param': 'None', 'code': 429}}
```


## [BETA] 設定優先順序 / 保留配額 {#beta-set-priority--reserve-quota}

為不同環境或使用情境保留 TPM/RPM 容量。這可確保關鍵的正式環境工作負載始終擁有保證容量，而開發或較低優先順序的任務則使用剩餘配額。

**使用情境：**
- 正式環境與開發環境
- 即時應用程式與批次處理
- 關鍵服務與實驗性功能

:::tip

依優先順序為金鑰保留 TPM/RPM 是付費功能。請為此 [取得企業授權](./enterprise.md)。 
:::

### 優先順序保留的運作方式 {#how-priority-reservation-works}

優先順序保留會將模型總 TPM/RPM 的一部分分配給特定優先等級。較高優先順序的金鑰會先獲得其保留配額的保證存取權。

**範例情境：**
- 模型總容量為 10 RPM
- 優先順序保留：`{"prod": 0.9, "dev": 0.1}`
- 結果：正式環境金鑰保證 9 RPM，開發金鑰保證 1 RPM

### 設定 {#configuration}

#### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-3.5-turbo             
    litellm_params:
      model: "gpt-3.5-turbo"       
      api_key: os.environ/OPENAI_API_KEY 
      rpm: 10   # Total model capacity

litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3"]
  priority_reservation:
    "prod": 0.9 # 90% reserved for production (9 RPM)
    "dev": 0.1 # 10% reserved for development (1 RPM)
    # Alternative format:
    # "prod":
    #   type: "rpm"    # Reserve based on requests per minute
    #   value: 9       # 9 RPM = 90% of 10 RPM capacity
    # "dev":
    #   type: "tpm"    # Reserve based on tokens per minute
    #   value: 100     # 100 TPM
  priority_reservation_settings:
    default_priority: 0  # Weight (0%) assigned to keys without explicit priority metadata
    saturation_threshold: 0.50 #  A model is saturated if it has hit 50% of its RPM limit
    saturation_check_cache_ttl: 60 # How long (seconds) saturation values are cached locally

general_settings:
  master_key: sk-1234 # OR set `LITELLM_MASTER_KEY=".."` in your .env
  database_url: postgres://.. # OR set `DATABASE_URL=".."` in your.env
```

**設定 विवरण：**

`priority_reservation`: Dict[str, Union[float, PriorityReservationDict]]
- **Key (str)**: 優先等級名稱（可以是任何字串，例如 "prod"、"dev"、"critical" 等）
- **Value**: 浮點數（0.0-1.0）或包含 `type` 和 `value` 的字典
  - 浮點數：`0.9` = 90% 的容量
  - 字典：`{"type": "rpm", "value": 9}` = 9 個請求/分鐘
  - 支援的型別：`"percent"`、`"rpm"`、`"tpm"`

`priority_reservation_settings`: Object（選填）
- **default_priority (float)**: 指派給未設定任何優先順序中繼資料的 API 金鑰之權重/百分比（0.0 到 1.0，預設為 0.5）
- **saturation_threshold (float)**: 模型開始嚴格執行優先順序的飽和門檻（0.0 到 1.0）。飽和度的計算方式為 `max(current_rpm/max_rpm, current_tpm/max_tpm)`。低於此門檻時，寬鬆模式允許優先順序從未使用的容量借用；高於此門檻時，嚴格模式會強制執行標準化的優先順序限制。
  - 範例：當模型使用量較低時，金鑰可使用超過其分配份額的容量；當模型使用量較高時，金鑰會被嚴格限制在其分配份額內。
- **saturation_check_cache_ttl (int)**: 從 Redis 讀取飽和度值時，本機快取的 TTL（秒）（預設為 60）。在多節點部署中，這會控制各節點收斂到相同飽和狀態的速度。數值越低表示收斂越快，但 Redis 讀取次數也越多。
  - 範例：將其設為 `5` 以獲得更快的多節點一致性，或設為 `0` 以始終直接從 Redis 讀取。

**啟動 Proxy**

```bash
litellm --config /path/to/config.yaml
```

### 在 team 或 key 上設定優先順序 {#set-priority-on-either-a-team-or-a-key}

優先順序可以設定在 **team 層級** 或 **key 層級**。team 層級的優先順序優先於 key 層級的優先順序。

**選項 A：在 Team 上設定優先順序（建議）**

同一 team 內的所有金鑰都會繼承該 team 的優先順序。當您希望特定環境或專案的所有金鑰具有相同優先順序時，這很有用。

```bash
curl -X POST 'http://0.0.0.0:4000/team/new' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
  "team_alias": "production-team",
  "metadata": {"priority": "prod"}
}'
```

為此 team 建立一個金鑰：
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
  "team_id": "team-id-from-previous-response"
}'
```

**選項 B：在個別金鑰上設定優先順序**

直接在金鑰上設定優先順序。當您需要對每個金鑰進行精細控制時，這很有用。

**正式環境金鑰：**
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
  "metadata": {"priority": "prod"}
}'
```

**開發金鑰：**
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
  "metadata": {"priority": "dev"}
}'
```

**沒有優先順序的金鑰（使用 default_priority 權重）：**
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{}'
```

**預期回應：**
```json
{
  "key": "sk-...",
  "metadata": {"priority": "prod"}, // or "dev"
  ...
}
```

**優先順序解析順序：**
1. 如果金鑰屬於已設定 `metadata.priority` 的 team → 使用 team 優先順序
2. 否則如果金鑰已設定 `metadata.priority` → 使用金鑰優先順序  
3. 否則 → 使用 config 中的 `default_priority`

#### 3. 測試優先順序分配 {#3-test-priority-allocation}

**測試正式環境金鑰（應獲得 9 RPM）：**
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-prod-key' \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello from prod"}]
  }'
```

**測試開發金鑰（應獲得 1 RPM）：**
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-dev-key' \
  -d '{
    "model": "gpt-3.5-turbo", 
    "messages": [{"role": "user", "content": "Hello from dev"}]
  }'
```

### 預期行為 {#expected-behavior}

採用上述設定時：

1. **正式環境金鑰** 每分鐘最多可發出 9 個請求（10 RPM 的 90%）
2. **開發金鑰** 每分鐘最多可發出 1 個請求（10 RPM 的 10%）
3. **未明確設定優先順序的金鑰** 會取得 default_priority 權重（0 = 0%），因此每分鐘分配 0 個請求（10 RPM 的 0%）
4. `priority_reservation` 中的命名優先順序與具有 `default_priority` 的金鑰獨立運作

**速率限制錯誤範例：**
```json
{
  "error": {
    "message": "Key=sk-dev-... over available RPM=0. Model RPM=10, Reserved RPM for priority 'dev'=1, Active keys=1",
    "type": "rate_limit_exceeded",
    "code": 429
  }
}
```

### 示範影片 {#demo-video}

此影片將示範如何設定具備優先順序保留的動態速率限制，以及如何使用 locust 測試來驗證其行為。

<iframe width="840" height="500" src="https://www.loom.com/embed/1b54b93139ee415d959402cc0629f3f7
" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
