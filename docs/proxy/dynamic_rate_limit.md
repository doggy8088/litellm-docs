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

**設定 詳情：**

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
- **model_limit_borrowing_config.borrow_idle_capacity (list)**：哪些呼叫者可以使用其他呼叫者未使用的容量，超過其 `model_tpm_limit` 與 `model_rpm_limit`（預設為空清單）。接受 `team`、`key` 與 `customer_organization`。僅影響此限制器涵蓋的模型。當模型低於 `saturation_threshold` 時，列出的呼叫者可以超過其限制；一旦模型飽和，就會被限制在該限制內，並回傳 429，其 `rate_limited_by` 標頭為 `model_per_team_saturated`、`model_per_key_saturated` 或 `model_per_customer_org_saturated`。模型本身的 `tpm` 與 `rpm` 永遠會強制執行，未列出類型的限制則維持硬性上限。請參閱[借用閒置容量的模型限制](#model-limits-that-borrow-idle-capacity)。
- **priority_class_share_config.split_equally_among_active (list)**：哪些呼叫者可取得其優先類別在模型份額中自己均分的一份（預設為空清單）。接受 `team`、`key`、`customer_organization` 與 `customer_member`。呼叫者一旦在某個模型上送出請求，即計為在該模型上作用中；在一個速率限制時間窗（60 秒）內沒有請求後即停止計入。設定的權重只會針對有作用中呼叫者的類別重新標準化，每個類別的份額會在其作用中呼叫者之間均分。一旦模型飽和，每個呼叫者會被限制在自己的份額內，並回傳 429，其 `rate_limited_by` 標頭為 `priority_class_share_saturated`。未符合任何列出類型的請求，維持使用共用的類別池。請參閱[在作用中呼叫者之間均分優先類別份額](#split-a-priority-class-share-among-active-callers)。

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

### 借用閒置容量的模型限制 {#model-limits-that-borrow-idle-capacity}

依預設，團隊、金鑰或客戶組織上的 `model_tpm_limit` 與 `model_rpm_limit` 是硬性上限，由一般速率限制器在此限制器執行之前強制執行。即使其他所有人都讓模型閒置，觸及上限的呼叫者仍會被拒絕。將應借用該閒置容量的實體類型列在 `model_limit_borrowing_config.borrow_idle_capacity` 下。

```yaml
litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3"]
  priority_reservation_settings:
    saturation_threshold: 0.5
    model_limit_borrowing_config:
      borrow_idle_capacity: ["team", "key", "customer_organization"]   # default: []
```

以 `tpm: 1000` 的模型、團隊 A 的 `model_tpm_limit: {"my-model": 500}` 以及閒置的團隊 B 為例，當模型飽和度低於 50% 時，團隊 A 每分鐘可以使用超過 500 個 token。一旦使用量跨過門檻，團隊 A 從該刻起會被限制在 500，超過的請求會收到 429，其 `rate_limited_by` 標頭為 `model_per_team_saturated`，而團隊 B 仍有自己的 500 可用。`model_rpm_limit` 以請求數比照辦理。彙總流量永遠不會超過模型本身的 `tpm` 或 `rpm`，且借用只會使用同一個模型上的容量，永遠不會用另一個模型上的限制。

`team` 涵蓋金鑰從其團隊繼承的限制。`key` 涵蓋設定在金鑰本身的 `model_tpm_limit` 或 `model_rpm_limit`，在飽和時以 `model_per_key_saturated` 拒絕。`customer_organization` 涵蓋客戶組織預算上的每模型限制，以 `model_per_customer_org_saturated` 拒絕。客戶組織的使用量是每個組織與模型一個計數器，跨其請求所經的每把金鑰計算，因此透過多把服務金鑰呼叫的客戶，會以單一呼叫者的身分借用與受限。當一個請求有多個列出的持有者時，例如一把有自己限制的金鑰為某個客戶組織呼叫，每個份額都會套用，較嚴格的那個會拒絕。

未列出其實體類型的限制維持硬性上限，整體的 `tpm_limit` 與 `rpm_limit` 值也是如此。既未設定 `tpm` 也未設定 `rpm` 的模型，或動態限制器未涵蓋的模型，維持硬性限制。由於飽和度會快取 `saturation_check_cache_ttl` 秒，呼叫者可能在限制生效前稍微超過其限制。以下各節以團隊為例說明，金鑰或客戶組織的行為相同。

#### 模型飽和後，借用者會取回自己的份額 {#a-borrower-gets-its-share-back-once-the-model-saturates}

團隊在模型閒置時使用的量，不會從其份額中扣除。此限制器用來限制團隊的每團隊計數器，只計算模型飽和時獲准的請求，因此它在飽和生效的那一刻重新開始。在上例中，模型跨過 50% 飽和度時，團隊 A 已使用 510 個 token。團隊 A 不會在該分鐘的剩餘時間被拒絕。它在接下來的 60 秒保留完整的 500，團隊 B 有自己的 500，且低於其份額的團隊永遠優先於超過份額的團隊獲准。已消耗的 token 永遠不會被追回，因此模型本身的 `tpm` 仍會限制兩個團隊在該分鐘內可取得的總量。獲准的彙總流量維持在該上限內。

每個節點在重新整理飽和度值時得知模型已飽和，每 `saturation_check_cache_ttl` 秒一次（預設 60）。未處理觸發流量的節點，在此之前會繼續以閒置條件准許借用者，因此當團隊在競爭下共用模型時，請將 TTL 設為數秒。

```yaml
litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3"]
  priority_reservation_settings:
    saturation_threshold: 0.5
    model_limit_borrowing_config:
      borrow_idle_capacity: ["team"]
    saturation_check_cache_ttl: 2
```

#### 限制呼叫者的借用上限 {#cap-how-far-a-caller-borrows}

當模型閒置時，借用者可以使用直到模型本身 `tpm` 與 `rpm` 為止的一切，因此單一呼叫者可以獨自佔用大部分閒置容量。若要為每個借用者設定上限，請在 `model_limit_borrowing_config` 下設定 `max_borrow_multiple`。它適用於 `borrow_idle_capacity` 中列出的每個團隊、金鑰與客戶組織。

```yaml
litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3"]
  priority_reservation_settings:
    saturation_threshold: 0.5
    model_limit_borrowing_config:
      borrow_idle_capacity: ["team", "key", "customer_organization"]
      max_borrow_multiple: 2   # default: no cap
```

若要給單一團隊或金鑰不同的上限，請在其 metadata 中、`model_tpm_limit` 與 `model_rpm_limit` 旁邊設定 `model_limit_max_borrow_multiple`。該值會取代該團隊或金鑰的設定值，且只有 proxy 管理員可以設定、變更或移除它。客戶組織永遠使用設定值。該團隊在某個模型上的使用量隨後會被限制在其份額乘以該倍數，TPM 與 RPM 皆然，即使模型閒置時也一樣。這個上限以自己的計數器運作，計算該團隊在這個時間窗內使用的全部量，不論閒置與否，而份額計數器仍只計算團隊在模型飽和後使用的量，因此受上限限制的團隊在飽和時與其他團隊一樣取得全新的份額。

```bash
curl -X POST 'http://0.0.0.0:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "model_tpm_limit": {"my-model": 500},
      "model_limit_max_borrow_multiple": 2
    }
  }'
```

以這個團隊的 `model_tpm_limit: {"my-model": 500}` 與倍數 `2` 為例，當模型低於 `saturation_threshold` 時，它每分鐘可在 `my-model` 上借用最多 1000 個 token。超過的請求會收到 429，其 `rate_limited_by` 標頭為 `model_per_team_max_borrow_multiple`，訊息中會指出份額、倍數與得出的上限。一旦模型飽和，該團隊會如先前一樣被限制在原本的 500，`rate_limited_by` 為 `model_per_team_saturated`。倍數是依團隊與模型分別套用，一個團隊的借用永遠不會計入另一個團隊的上限。超過上限的金鑰或客戶組織會得到 `model_per_key_max_borrow_multiple` 或 `model_per_customer_org_max_borrow_multiple`。

兩個值都未設定時，維持預設行為：借用者可以使用直到模型限制為止的一切。每個值都必須是至少 `1` 的數字。Metadata 中較小或非數字的值會被記錄為警告並忽略，因此該團隊或金鑰會使用設定值，而不是讓每個請求都失敗；proxy 則會在啟動時拒絕設定中無效的 `max_borrow_multiple`。倍數只對列在 `borrow_idle_capacity` 中的實體類型有意義。沒有它，`model_tpm_limit` 與 `model_rpm_limit` 維持硬性上限。

當路由器備援處理一個請求時，其 token 會計入借用者在備援模型上的份額。在該備援模型上沒有 `model_tpm_limit` 或 `model_rpm_limit` 的借用者，不會因這些 token 在失敗的模型上被計費。

### 在作用中呼叫者之間均分優先類別份額 {#split-a-priority-class-share-among-active-callers}

依預設，一個優先類別中的每個團隊都從單一共用池取用，因此在 `tpm: 1000` 的模型上設定 `interactive: 0.6` 時，所有 interactive 團隊每分鐘合計取得 600 個 token。一個忙碌的團隊可以耗盡該池，其他 interactive 團隊會在什麼都沒用到的情況下收到 429，而為閒置的 `batch` 類別保留的 400 則閒置未用。將 `team` 列在 `priority_class_share_config.split_equally_among_active` 下，即可將每個類別的份額在實際使用該模型的團隊之間均分。

```yaml
litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3"]
  priority_reservation:
    interactive: 0.6
    batch: 0.4
  priority_reservation_settings:
    saturation_threshold: 0.5
    priority_class_share_config:
      split_equally_among_active: ["team"]   # default: []
```

不需要為每個團隊做任何設定。團隊在某個模型上送出請求時即成為作用中，並在其最後一個請求後 60 秒（一個速率限制時間窗）停止計入。作用中的團隊依模型在 Redis 中追蹤，因此每個 worker 看到的是同一組集合。團隊的類別如先前一樣來自團隊或金鑰上的 `metadata.priority`，沒有優先權的團隊會形成一個以 `default_priority` 加權的 `default` 類別。

份額在每個請求上分兩步計算。第一，將類別權重只針對在該模型上有作用中團隊的類別重新標準化，因此當沒有 batch 團隊送出請求時，interactive 等於整個模型；而 batch 團隊一送出請求，就降回 0.6。第二，將每個類別的份額在其作用中團隊之間均分。在 `tpm: 500000000` 的模型上，兩個作用中的 interactive 團隊與四個作用中的 batch 團隊，分別各得 150M 與 50M。若只有四個 batch 團隊作用中，每個各得 125M。安靜了一個時間窗的團隊在兩步中都停止計入，因此其他團隊的份額會回升。

低於 `saturation_threshold` 時，團隊仍如往常借用閒置容量。團隊在模型閒置時使用的量會計入其該分鐘的份額，因此飽和後發出的份額總和永遠不會超過模型剩餘的量。一旦模型飽和，超過自己份額的團隊會收到 429，其 `rate_limited_by` 標頭為 `priority_class_share_saturated`，訊息中會指出該團隊、其類別、類別中有多少團隊作用中，以及該團隊以 token 或請求計的份額。維持在份額內的隊友可繼續使用。當 `team` 也列在 `borrow_idle_capacity` 中時，團隊的 `model_tpm_limit` 份額也會套用，兩者取較嚴格者。

此清單也接受 `key`、`customer_organization` 與 `customer_member`，每個列出的類型都會像團隊一樣取得自己的一份。客戶組織的一份跨其呼叫所經的每把金鑰計算，客戶成員的一份則是其自己的。優先類別永遠來自請求所用金鑰或團隊上的 `metadata.priority`。符合多個列出類型的請求，只會以其中一個計入，順序為 `team`、`customer_member`、`customer_organization`、`key`。團隊排在第一，是因為客戶標頭由呼叫者選擇，因此屬於某個團隊的金鑰，無論它指名哪個客戶，都維持在其團隊的那一份上。未符合任何類型的請求，例如只有 `team` 被列出時一把沒有團隊的金鑰，會被限制在共用的類別池，且仍將其類別計為作用中，因此只承載這類流量的類別不會把其份額借出去。

```yaml
litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3"]
  priority_reservation: {interactive: 0.6, batch: 0.4}
  priority_reservation_settings:
    saturation_threshold: 0.5
    priority_class_share_config:
      split_equally_among_active: ["team", "key", "customer_organization", "customer_member"]
```

### 份額與節流的 Prometheus 指標 {#prometheus-metrics-for-shares-and-throttling}

在 `dynamic_rate_limiter_v3` 旁邊啟用 `prometheus` 回呼時，限制器會發佈每個團隊在某個模型上有權使用的量、它超過該量多少，以及它被拒絕的原因。這些數列足以分辨被餓死的團隊與超過份額的團隊，無需閱讀 proxy 記錄。

```yaml
litellm_settings:
  callbacks: ["dynamic_rate_limiter_v3", "prometheus"]
  priority_reservation_settings:
    saturation_threshold: 0.5
    model_limit_borrowing_config:
      borrow_idle_capacity: ["team"]
```

| 指標 | 類型 | 意義 |
|--------|------|---------|
| `litellm_dynamic_limiter_share_tokens` | gauge | 團隊在目前時間窗內對該模型的 token 份額，以團隊最後一個已結算請求為準。這是團隊的 `model_tpm_limit`，或當 `team` 列在 `split_equally_among_active` 中時其優先類別份額的一份，取較小者。 |
| `litellm_dynamic_limiter_borrowed_tokens` | gauge | 團隊在此時間窗內已使用超過該份額的 token。團隊低於其份額時為 `0`。 |
| `litellm_dynamic_limiter_throttled_total` | counter | 限制器拒絕的請求，依團隊、模型與原因計數。 |

這些 gauge 帶有 `model_group`、`priority`，以及持有份額者的標籤：`team` 與 `team_alias`、`hashed_api_key` 與 `api_key_alias`，或 `customer_org_id` 與 `customer_org_alias`。一個數列只填入其持有者的標籤，其他標籤讀作 `None`。Counter 另外加上 `rate_limit_type`（`tokens` 或 `requests`）與 `reason`。`reason` 標籤是呼叫者收到的 429 上 `rate_limited_by` 標頭的值，因此儀表板與用戶端記錄永遠一致。其值為 `model_per_team_saturated`（團隊已超過其 `model_tpm_limit` 或 `model_rpm_limit` 且模型已飽和）、`model_per_team_max_borrow_multiple`（團隊在借用時觸及了其 `model_limit_max_borrow_multiple` 上限）與 `priority_class_share_saturated`（團隊已超過其類別份額的一份且模型已飽和）。

兩個 gauge 都會在請求結算時（不論成功或失敗）依實際使用量重新整理，因此停止送出的團隊會保留其最後的值，直到它的下一個請求結算為止。在多個 proxy worker 的情況下，gauge 以 `livemostrecent` 彙總，因此 `/metrics` 對每個團隊與模型顯示一個數列，其值由結算該團隊最新請求的 worker 寫入，而新時間窗的第一次結算會取代舊時間窗的值，無論由哪個 worker 處理。團隊 A 在飽和模型上超過 100 token 份額後，`/metrics` 的擷取結果如下。

```
litellm_dynamic_limiter_share_tokens{model_group="my-model",priority="default",team="team-a",team_alias="analytics"} 100.0
litellm_dynamic_limiter_borrowed_tokens{model_group="my-model",priority="default",team="team-a",team_alias="analytics"} 260.0
litellm_dynamic_limiter_throttled_total{model_group="my-model",priority="default",rate_limit_type="tokens",reason="model_per_team_saturated",team="team-a",team_alias="analytics"} 4.0
```

指標接收端的失敗會被記錄，且永遠不會改變請求被准許或拒絕。

### 示範影片 {#demo-video}

此影片將示範如何設定具備優先順序保留的動態速率限制，以及如何使用 locust 測試來驗證其行為。

<iframe width="840" height="500" src="https://www.loom.com/embed/1b54b93139ee415d959402cc0629f3f7
" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 在偏好模型飽和前先備援 {#fall-back-before-the-preferred-model-saturates}

有些團隊在意由哪個模型回答，有些只在意有夠好的模型快速回答。路由器備援通常在請求被拒絕後才執行，因此有彈性的團隊會持續使用其偏好模型，直到該模型額滿，而只能使用該模型的團隊會一起分擔 429。啟用 `dynamic_rate_limiter_v3` 後，金鑰或團隊可以在其 `router_settings` 中設定 `fallback_on_saturation`，讓它在所請求的模型達到 `saturation_threshold` 時（當時仍有餘裕）就開始走訪其備援清單：

```bash
curl -X POST 'http://0.0.0.0:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "team_alias": "flexible-team",
    "models": ["luna", "opus"],
    "router_settings": {
      "fallbacks": [{"luna": ["opus"]}],
      "fallback_on_saturation": true
    }
  }'
```

當該團隊的一把金鑰要求 `luna` 時，proxy 會讀取動態速率限制器已為 `luna` 追蹤的飽和度（與將優先保留切換為嚴格模式相同的值）。低於 `saturation_threshold` 時，請求如往常送至 `luna`。達到或超過時，請求會走與被本機速率限制拒絕的請求相同的路徑：proxy 依序走訪 `luna` 的 `fallbacks` 項目，並由第一個本身低於門檻且准許該請求的備援提供服務。備援清單的解析順序為 Key > Team > Global，因此沒有自己 `fallbacks` 的金鑰或團隊會走訪路由器的清單。每個備援都必須通過每個速率限制備援都要通過的檢查，因此呼叫者必須被允許呼叫它（請參閱[在備援上強制執行金鑰模型存取](./reliability.md#enforce-key-model-access-on-fallbacks)），其團隊成員預算必須有餘裕，且它必須能提供該請求的端點。當沒有備援符合資格時，請求會回到 `luna`，並如先前一樣在該處被准許或被速率限制，因此這個設定永遠不會把 `luna` 本可服務的請求變成 429。

由備援服務的請求帶有慣例的備援標頭，其原因指出的是飽和，而不是拒絕該請求的限制：

```text
x-litellm-attempted-fallbacks: 1
x-litellm-fallback-reason: rate_limit:model_saturation_fallback
```

該請求計入提供服務的模型。支出記錄會以 `opus` 的定價記錄 `opus`，且該請求計入 `opus` 的速率限制，讓 `luna` 的容量留給只要 `luna` 的團隊。沒有 `fallback_on_saturation` 的金鑰與團隊不受影響，動態速率限制器未涵蓋的模型也一樣。門檻是上方說明的同一個 `priority_reservation_settings.saturation_threshold`，飽和度值會快取 `saturation_check_cache_ttl` 秒，因此走訪可能落後突發流量最多該段時間。

## Azure 預配部署的 PTU 份額上限 {#ptu-share-ceilings-on-azure-provisioned-deployments}

以 `model_info.ptu_shares` 在團隊之間拆分的 Azure 預配輸送量（PTU）部署，會得到每團隊、每分鐘的上限，無需手工算出任何 `model_tpm_limit`。Proxy 會透過它隨附的 Azure 規模表（每 PTU 的輸入 TPM 與該模型的輸出對輸入比率）轉換每個團隊的份額，並以 Azure 的標準化 token 計費每個請求，因此當份額變更時，上限會與預留同步：

```yaml
model_list:
  - model_name: gpt-4.1-ptu
    litellm_params:
      model: azure/<your-deployment-name>
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
    model_info:
      id: gpt-4.1-ptu-shared
      base_model: gpt-4.1
      ptu_count: 50
      cost_per_ptu_per_hour: 1.0
      ptu_effective_from: "2026-01-01T00:00:00Z"
      ptu_shares:
        <team a id>: 30
        <team b id>: 20
```

團隊 A 在 gpt-4.1 上的 30 個 PTU 是 30 x 3,000 = 每分鐘 90,000 個標準化 token（輸出以 4 倍計），第一個超過的請求會收到 429，而團隊 B 保留自己的 20 個 PTU：

```json
{
  "error": {
    "message": "Rate limit exceeded for model_per_team_ptu: <team a id>:gpt-4.1-ptu. Limit type: tokens. Current limit: 90000, Remaining: 0. Limit resets at: ...",
    "type": "throttling_error",
    "code": "429"
  }
}
```

此上限與團隊 `model_tpm_limit` 共用每分鐘時間窗，且只需要 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION=True`；份額篩選器本身（部署提供給哪些團隊）不需要該旗標即可套用。設定、依份額拆分的成本，以及使用量路由上的 PTU 小時數，請參閱 [Azure PTU 固定成本歸屬](./ptu_flat_cost.md#share-a-deployment-across-teams)
