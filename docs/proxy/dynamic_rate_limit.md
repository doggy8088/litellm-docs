# 動態 TPM/RPM 分配  {#dynamic-tpmrpm-allocation}

防止專案吞掉過多的 tpm/rpm。

**另請參閱：** [請求優先順序](../scheduler.md) - 透過將 LLM API 請求加入優先佇列，讓高流量時優先處理。

在金鑰與團隊之間共享模型的 TPM/RPM 容量。限制器會監看模型的飽和程度：當記錄的使用量低於可配置的飽和門檻時，任何金鑰都可使用閒置容量；一旦使用量超過門檻，每個優先等級就會被限制在其保留份額內。[**查看程式碼**](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/hooks/dynamic_rate_limiter_v3.py)

## 快速開始使用 {#quick-start-usage}

1. 設定 config.yaml

```yaml showLineNumbers title="config.yaml"
model_list: 
  - model_name: my-fake-model
    litellm_params:
      model: {{openai_small}}
      api_key: my-fake-key
      mock_response: hello-world
      tpm: 60

litellm_settings: 
  callbacks: ["dynamic_rate_limiter_v3"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY # OR set `LITELLM_MASTER_KEY=".."` in your .env
  database_url: postgres://.. # OR set `DATABASE_URL=".."` in your .env
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試一下！

```python showLineNumbers title="test.py"
"""
- Run 2 keys calling the same model
- model has 60 TPM
- Mock response returns 30 total tokens / request
- The model serves 2 requests in the window (2 x 30 = 60 tokens),
  then 429s every key until the 60s window rolls
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

key_1 = create_key(api_key="sk-<your-litellm-api-key>", base_url="http://0.0.0.0:4000")
key_2 = create_key(api_key="sk-<your-litellm-api-key>", base_url="http://0.0.0.0:4000")

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
This was rate limited b/c - Error code: 429 - {'error': {'message': 'Model capacity reached for my-fake-model. Priority: None, Rate limit type: tokens, Model TPM: 60, Model RPM: not configured, Remaining: 0', 'type': 'throttling_error', 'param': None, 'code': '429'}}
```

每次回應完成後，Token 會記錄到限制器的計數器上，因此當記錄的使用量達到模型的 TPM 後，封鎖會在下一個請求時觸發。當配額用盡時，已在處理中的請求不會被封鎖；請參閱下方的[強制執行方式](#how-enforcement-works)。

## [BETA] 設定優先順序 / 保留配額 {#beta-set-priority--reserve-quota}

為不同環境或使用情境保留 TPM/RPM 容量。這可確保關鍵的正式環境工作負載始終擁有保證容量，而開發或較低優先順序的任務則使用剩餘配額。

**使用情境：**
- 正式環境與開發環境
- 即時應用程式與批次處理
- 關鍵服務與實驗性功能

<EnterpriseFeature feature="Reserving TPM/RPM on keys based on priority" />

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
  - model_name: {{openai_small}}             
    litellm_params:
      model: "{{openai_small}}"       
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
  master_key: os.environ/LITELLM_MASTER_KEY # OR set `LITELLM_MASTER_KEY=".."` in your .env
  database_url: postgres://.. # OR set `DATABASE_URL=".."` in your.env
```

**設定 विवरण：**

`priority_reservation`: Dict[str, Union[float, PriorityReservationDict]]
- **Key (str)**: 優先等級名稱（可以是任何字串，例如 "prod"、"dev"、"critical" 等）
- **Value**: 浮點數（0.0-1.0）或包含 `type` 和 `value` 的字典
  - 浮點數：`0.9` = 90% 的容量
  - 字典：`{"type": "rpm", "value": 9}` = 9 個請求/分鐘
  - 支援的型別：`"percent"`、`"rpm"`、`"tpm"`

`priority_reservation_settings`: 物件（選填）
- **default_priority (float)**: 指派給未設定優先權中繼資料之 API 金鑰的權重／百分比（0.0 到 1.0，預設為 0.25）。所有沒有明確優先權的金鑰會共享這個大小的單一池；這不是每個金鑰各自的分配。因此，兩個未標記的團隊會在同一個預設池中競爭，彼此之間沒有下限
- **saturation_threshold (float)**: 模型開始嚴格執行優先權的飽和程度（0.0 到 1.0）。飽和度的計算方式為 `max(current_rpm/max_rpm, current_tpm/max_tpm)`。低於此門檻時，寬鬆模式允許從未使用的容量借用優先權。高於此門檻時，嚴格模式會強制執行標準化的優先權限制。
  - 範例：當模型使用率較低時，金鑰可使用超過其分配份額的容量。當模型使用率較高時，金鑰會被嚴格限制在其分配份額內。
- **saturation_check_cache_ttl (int)**: 從 Redis 讀取飽和度值時，本地快取的 TTL（秒）（預設為 60）。在多節點部署中，這會影響各節點收斂到相同飽和狀態的速度。數值越低，收斂越快，但讀取 Redis 的次數越多。
  - 範例：設定為 `5` 可加快多節點一致性，或設定為 `0` 以永遠直接從 Redis 讀取。

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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "team_alias": "production-team",
  "metadata": {"priority": "prod"}
}'
```

為此 team 建立一個金鑰：
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "metadata": {"priority": "prod"}
}'
```

**開發金鑰：**
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "metadata": {"priority": "dev"}
}'
```

**沒有優先順序的金鑰（使用 default_priority 權重）：**
```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "Hello from prod"}]
  }'
```

**測試開發金鑰（應獲得 1 RPM）：**
```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-dev-key' \
  -d '{
    "model": "{{openai_small}}", 
    "messages": [{"role": "user", "content": "Hello from dev"}]
  }'
```

### 預期行為 {#expected-behavior}

優先權的保留額是下限，不是上限。金鑰實際可用的容量取決於模型的飽和程度：

1. **低於飽和門檻（寬鬆模式）**：只會強制執行模型整體容量。任何金鑰，不論優先權如何，都可使用超出自身保留額的閒置容量
2. **在門檻以上或達到門檻（嚴格模式）**：每個優先權在該時間窗內都會被限制在其保留份額。其優先權池已耗盡的金鑰會收到 429，而仍在保留額內的優先權則會繼續獲得服務
3. **沒有明確優先權的金鑰** 會依據 `default_priority` 的加權共用單一池。以上述設定（`default_priority: 0`）時，它們不會得到任何容量；使用預設值（`0.25`）時，所有未標記的金鑰合計可得到 25%
4. 金鑰在寬鬆模式下借用時消耗的容量，在進入嚴格模式時不會被追回。下限保護的是尚未被消耗的容量，因此只有在受保護的優先權於整個時間窗持續送出流量時，下限才會完全有保障

(1) 與 (2) 的一個重要結果是：飽和度衡量的是已記錄的使用量，而不是有多少金鑰處於作用中。即使只有一個金鑰在空閒的模型上運作，只要它自己的流量就會觸發嚴格模式，因此單一優先權在一個時間窗內最多只能使用 `max(its reservation, saturation_threshold) x model capacity`，外加最多一個正在傳輸中的請求。若其保留額或門檻不允許，單一金鑰不可能達到模型的 100%。

#### 具體範例 {#worked-example}

模型具有 `tpm: 1000`、`priority_reservation: {"team_a": 0.5, "team_b": 0.5}`、`saturation_threshold: 0.5`。A 團隊每分鐘都要求超過滿載容量；B 團隊只要求該列所示的容量。每一列都是一個新的 60 秒時間窗：

| 時間窗 | A 的需求 | B 的需求 | 服務給 A | 服務給 B | 原因 |
|---|---|---|---|---|---|
| 1 | 100%+ | 閒置 | ~500 | | A 單獨就把模型飽和到 50%，嚴格模式將 A 限制在其自身 500 的下限 |
| 2 | 100%+ | 500 | ~500 | ~500 | 嚴格模式依照 50/50 的下限分配容量 |
| 3 | 100%+ | 400 | ~500 | ~400 | 低於下限的 B 會被完全服務，沒有 429；A 取得剩餘部分 |

將 `saturation_threshold` 提高到 `0.8` 會把時間窗 1 改為 ~800（A 可借用至門檻），但會削弱時間窗 2：A 在嚴格模式啟動前會先於寬鬆模式拿走約 ~600，而 B 最多只能到約 ~420，因為 A 借用的容量不會被追回，且模型整體上限會阻擋剩餘部分。

#### 強制執行方式 {#how-enforcement-works}

請求計數會在 LLM 呼叫之前檢查並遞增，因此 RPM 限制是精確的。Token 計數要等到回應完成後才會得知，因此 TPM 強制執行是針對已記錄使用量的准入控制：當已記錄的 Token 低於限制時，請求會被准入，而其自身的 Token 之後才會登上計數器。兩個後果如下：

1. 一個時間窗內實際服務的 Token，可能會比設定的 TPM 多出大約每個同時送出之金鑰的一個請求份 Token。一起被准入的一波平行請求可能會造成更大的超量；TPM 不是分鐘內的硬性上限
2. 如果設定的 TPM 小於典型單次回應的大小，單一請求就會耗盡整個配額，而強制執行會退化為每個時間窗大約一個請求。測試此功能時，請將 TPM 設得遠高於您每個請求的典型 Token 數

時間窗是從模型上的第一個請求開始計算的滾動 60 秒，而不是曆法上的分鐘。在多節點部署中，飽和度值還會在本機快取 `saturation_check_cache_ttl` 秒，因此在未服務觸發流量的節點上，嚴格模式可能會延遲最多這麼多秒才啟動。

**速率限制錯誤範例：**

嚴格模式下優先權池耗盡：

```json
{
  "error": {
    "message": "Priority-based rate limit exceeded. Model: {{openai_small}}, Priority: dev, Rate limit type: tokens, Model TPM: 1000, Model RPM: not configured, Remaining: 0, Model saturation: 52.8%",
    "type": "throttling_error",
    "code": "429"
  }
}
```

模型整體容量耗盡（任何優先權）：

```json
{
  "error": {
    "message": "Model capacity reached for {{openai_small}}. Priority: prod, Rate limit type: tokens, Model TPM: 1000, Model RPM: not configured, Remaining: 0",
    "type": "throttling_error",
    "code": "429"
  }
}
```

### 示範影片 {#demo-video}

此影片將示範如何設定具備優先順序保留的動態速率限制，以及如何使用 locust 測試來驗證其行為。

<iframe width="840" height="500" src="https://www.loom.com/embed/1b54b93139ee415d959402cc0629f3f7
" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
