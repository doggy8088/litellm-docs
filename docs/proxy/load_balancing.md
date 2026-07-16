import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Proxy - 負載平衡 {#proxy---load-balancing}
同時負載平衡相同模型的多個執行個體

Proxy 會處理請求路由（使用 LiteLLM 的 Router）。**如果您想要最大化輸送量，請在設定檔中設定 `rpm`**

:::info

如需路由策略／參數的更多詳細資訊，請參閱 [路由](../routing.md)

:::

## 負載平衡如何運作 {#how-load-balancing-works}

LiteLLM 會使用其內建路由器，自動在同一模型的多個部署之間分配請求。Proxy 會路由流量以最佳化效能與可靠性。

預設使用「simple-shuffle」路由策略

### 路由策略 {#routing-strategies}

| 策略 | 說明 | 使用時機 |
|----------|-------------|-------------|
| **simple-shuffle**（推薦） | 隨機分配請求 | 通用，適合均勻分配負載 |
| **least-busy** | 路由至目前作用中請求最少的部署 | 高併發情境 |
| **usage-based-routing**（對效能不佳） | 路由至目前使用量最低（RPM/TPM）的部署 | 當您希望均勻遵守速率限制時 |
| **latency-based-routing** | 路由至回應最快的部署 | 對延遲敏感的應用程式 |
| **cost-based-routing** | 路由至成本最低的部署 | 成本敏感的應用程式 |

:::tip 部署優先順序
使用 `order` 參數來優先處理特定部署。詳情請參閱 [部署排序](#deployment-ordering-priority)。
:::

## 快速開始 - 負載平衡 {#quick-start---load-balancing}
#### 步驟 1 - 在設定中設定部署 {#step-1---set-deployments-on-config}

**以下為設定範例**。此處帶有 `model=gpt-3.5-turbo` 的請求將在 `azure/gpt-3.5-turbo` 的多個執行個體之間路由
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>
      rpm: 6      # Rate limit for this deployment: in requests per minute (rpm)
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-turbo-small-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 6
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-turbo-large
      api_base: https://openai-france-1234.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 1440

router_settings:
  routing_strategy: simple-shuffle # Literal["simple-shuffle", "least-busy", "usage-based-routing","latency-based-routing"], default="simple-shuffle"
  model_group_alias: {"gpt-4": "gpt-3.5-turbo"} # all requests with `gpt-4` will be routed to models with `gpt-3.5-turbo`
  num_retries: 2
  timeout: 30                                  # 30 seconds
  redis_host: <your redis host>                # set this when using multiple litellm proxy deployments, load balancing state stored in redis
  redis_password: <your redis password>
  redis_port: 1992
```

## 強制執行模型速率限制 {#enforce-model-rate-limits}

嚴格強制套用在部署上設定的 RPM/TPM 限制。當超過限制時，請求會在到達 LLM 提供者之前被阻擋，並回傳 `429 Too Many Requests` 錯誤。

:::tip 分開的輸入／輸出限制
當提供者公布不同的輸入與輸出輸送量限制時，請設定 `itpm` 與 `otpm`，而不是 `tpm`/`rpm`。請參閱 [分開的 ITPM / OTPM 速率限制](./io_token_rate_limits)。
:::

:::info
預設情況下，`rpm` 和 `tpm` 值只用於**路由決策**（挑選有容量的部署）。使用 `enforce_model_rate_limits` 後，它們會變成**硬性限制**。
:::

### 快速開始 {#quick-start}

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY
    rpm: 60     # 60 requests per minute
    tpm: 90000  # 90k tokens per minute

router_settings:
  optional_pre_call_checks:
    - enforce_model_rate_limits  # 👈 Enables strict enforcement
```

### 運作方式 {#how-it-works}

| 限制類型 | 強制方式 | 準確性 |
|------------|-------------|----------|
| **RPM** | 硬性限制－在精確門檻處阻擋 | 100% 準確 |
| **TPM** | 盡力而為－可能略微超出 | 在已超過限制時阻擋 |

**為什麼 TPM 屬於 best-effort：** 在 LLM 回應之前，Token 數量是未知的。TPM 會在每次請求前檢查（若已超過則阻擋），並在之後追蹤（加入實際使用的 token 數）。

### 錯誤回應 {#error-response}

```json
{
  "error": {
    "message": "Model rate limit exceeded. RPM limit=60, current usage=60",
    "type": "rate_limit_error",
    "code": 429
  }
}
```

回應包含 `retry-after: 60` 標頭。

### 多執行個體部署 {#multi-instance-deployment}

若有多個 LiteLLM proxy 執行個體，請加入 Redis 以共享 rate limit 狀態：

```yaml
router_settings:
  optional_pre_call_checks:
    - enforce_model_rate_limits
  redis_host: redis.example.com
  redis_port: 6379
  redis_password: your-password
```


:::info
關於 [路由策略的詳細資訊可在此處找到](../routing)
:::

#### 步驟 2：使用設定啟動 Proxy {#step-2-start-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

### 測試 - 簡單請求 {#test---simple-call}

此處請求中，model=gpt-3.5-turbo 會跨多個 azure/gpt-3.5-turbo 執行個體進行路由

👉 主要變更：`model="gpt-3.5-turbo"`

**請檢查回應標頭中的 `model_id`，以確認請求已進行負載平衡**

<Tabs>

<TabItem value="openai" label="OpenAI Python v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ]
)

print(response)
```
</TabItem>

<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ]
}'
```
</TabItem>

</Tabs>
### 測試 - 負載平衡 {#test---loadbalancing}

在這個請求中，將會發生以下情況：
1. 會引發 rate limit 例外
2. LiteLLM proxy 會在 model group 上重試該請求（預設重試次數為 3）。

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-3.5-turbo",
  "messages": [
        {"role": "user", "content": "Hi there!"}
    ],
    "mock_testing_rate_limit_error": true
}'
```

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/6b8806b45f970cb2446654d2c379f8dcaa93ce3c/litellm/router.py#L2535)

## 使用多個 litellm 執行個體進行負載平衡（Kubernetes、自動擴縮） {#load-balancing-using-multiple-litellm-instances-kubernetes-auto-scaling}

LiteLLM Proxy 支援在多個 litellm 執行個體之間共享 rpm/tpm，請傳入 `redis_host`、`redis_password` 和 `redis_port` 以啟用此功能。（LiteLLM 會使用 Redis 追蹤 rpm/tpm 使用量）

範例設定

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>
      rpm: 6      # Rate limit for this deployment: in requests per minute (rpm)
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-turbo-small-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
      rpm: 6
router_settings:
  redis_host: <your redis host>
  redis_password: <your redis password>
  redis_port: 1992
  cache_params:
    type: redis
    max_connections: 100  # maximum Redis connections in the pool; tune based on expected concurrency/load
```

## 設定中的路由器設定 - routing_strategy、model_group_alias {#router-settings-on-config---routing_strategy-model_group_alias}

在 proxy server 上為 'model_name' 公開一個 'alias'。 

```
model_group_alias: {
  "gpt-4": "gpt-3.5-turbo"
}
```

這些別名預設會顯示在 `/v1/models`、`/v1/model/info` 和 `/v1/model_group/info` 上。

可在 `router_settings` 下設定 litellm.Router() 的設定。您可以設定 `model_group_alias`、`routing_strategy`、`num_retries`、`timeout`。請參閱所有 Router 支援的參數 [此處](https://github.com/BerriAI/litellm/blob/1b942568897a48f014fa44618ec3ce54d7570a46/litellm/router.py#L64)

### 用法 {#usage}

含 `router_settings` 的範例設定

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>

router_settings:
  model_group_alias: {"gpt-4": "gpt-3.5-turbo"} # all requests with `gpt-4` will be routed to models 
```

### 隱藏別名模型 {#hide-alias-models}

如果您想為以下項目設定別名，請使用此功能：

1. 拼字錯誤
2. 輕微的模型版本變更
3. 版本更新之間的大小寫變更

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/<your-deployment-name>
      api_base: <your-azure-endpoint>
      api_key: <your-azure-api-key>

router_settings:
  model_group_alias:
    "GPT-3.5-turbo": # alias
      model: "gpt-3.5-turbo"  # Actual model name in 'model_list'
      hidden: true             # Exclude from `/v1/models`, `/v1/model/info`, `/v1/model_group/info`
```

### 完整規格 {#complete-spec}

```python
model_group_alias: Optional[Dict[str, Union[str, RouterModelGroupAliasItem]]] = {}


class RouterModelGroupAliasItem(TypedDict):
    model: str
    hidden: bool  # if 'True', don't return on `/v1/models`, `/v1/model/info`, `/v1/model_group/info`
```

## 部署順序（優先順序） {#deployment-ordering-priority}

在 `litellm_params` 中設定 `order` 以優先處理部署。數值越低 = 優先級越高。當多個部署共用相同的 `order` 時，路由策略會從中挑選。 

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-primary
      api_key: os.environ/AZURE_API_KEY
      order: 1  # 👈 Highest priority - always tried first

  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-fallback
      api_key: os.environ/AZURE_API_KEY_2
      order: 2  # 👈 Used when order=1 fails
```

### 基於順序的備援如何運作 {#how-order-based-fallback-works}

當對 `order=1` 部署的請求失敗（連線錯誤、404、429 等）時，路由器會自動嘗試 `order=2` 部署，接著是 `order=3`，依此類推。每個順序層級在升級到下一層之前，都會先有自己的一組重試。

如果所有順序層級都已用盡，路由器會轉而使用任何已設定的[模型層級備援](#fallbacks)。

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-primary
      api_key: os.environ/AZURE_API_KEY
      order: 1

  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-secondary
      api_key: os.environ/AZURE_API_KEY_2
      order: 2

  - model_name: gpt-4-fallback
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  fallbacks:
    - gpt-4:
        - gpt-4-fallback  # tried after all order levels fail
```

上述設定的備援鏈為：`order=1` → `order=2` → `gpt-4-fallback`。

特別針對 429（速率限制）錯誤，失敗的部署會立即進入冷卻。如果所有 `order=1` 部署都處於冷卻狀態，路由器會在重試期間直接選擇 `order=2` 部署，而不等待備援路徑。

### 團隊範圍模型與傳統 `model_aliases` {#team-scoped-models-and-legacy-model_aliases}

團隊範圍的部署由 `model_info.team_id` 和 `model_info.team_public_model_name` 識別。請求應使用**公開**模型名稱；路由器會解析所有同層部署（相同的公開名稱、不同的 `api_base` / `order` 等）以進行路由、故障轉移和部署 `order`。

關於路由器內部：當 `team_id` 在作用範圍內時，最佳化查詢會以 `(team_id, team_public_model_name)` 作為索引鍵。如果程式碼傳入的是內部部署 ID（例如 `model_name_<team_id>_<uuid>`）而不是公開名稱，路由仍可透過一般的部署名稱路徑運作，但團隊專用快速路徑只適用於公開名稱。

**舊版團隊：**較舊的 proxy 版本可能會在團隊列中保留 `model_aliases`，將公開名稱對應到單一內部部署 ID（`model_name_<team_id>_<uuid>`）。在每次請求時，前置呼叫邏輯仍可能在路由之前將 `model` 重新寫入該內部名稱，這會收斂成單一部署，並可能使較新的同層部署無法存取。

**遷移選項：**

1. **升級時建議：**設定環境變數 `LITELLM_ENABLE_TEAM_STALE_ALIAS_BYPASS=true`，如此一來，當公開名稱存在同層團隊部署時，就會略過過時的別名重寫，並套用團隊範圍路由（包含 `order` 和故障轉移）。請參閱 proxy 設定文件中的[環境變數](./config_settings)表格。
2. **資料清理：**從資料庫中的團隊紀錄移除團隊公開名稱的過時 `model_aliases` 項目，如此只有 `team_public_model_name` + 團隊模型清單會驅動存取。

如果偵測到過時別名且未啟用繞過，proxy 可能會在記錄中發出**一次性**警告，說明在設定該旗標或清理別名之前，同層部署可能無法存取。

### 您將在哪些情況下看到負載平衡實際運作 {#when-youll-see-load-balancing-in-action}

**立即效果：**

- 不同的部署會服務後續請求（會顯示在記錄中）
- 在高流量期間有更好的回應時間

**可觀測效益：**
- **更高的吞吐量**：可同時在多個部署上處理更多請求
- **更好的可靠性**：如果某個部署失敗，流量會自動路由到健康的部署
- **更佳的資源利用率**：負載平均分散到所有可用部署

## Responses API 的特殊考量 {#special-considerations-for-responses-api}

當在不同部署之間進行 OpenAI Responses API 的負載平衡，且使用**不同的 API 金鑰**時（例如，不同的 Azure 區域或組織），加密內容項目（如 `rs_...` reasoning 項目）只能由最初的 API 金鑰解密。

**解決方案：** 使用 `encrypted_content_affinity` pre-call 檢查（需要 LiteLLM >= 1.82.3），將包含加密項目的後續請求自動路由到正確的部署：

```yaml
model_list:
  - model_name: gpt-5.1-codex
    litellm_params:
      model: azure/gpt-5.1-codex
      api_base: https://eastus.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY_EASTUS
    model_info:
      id: "deployment-eastus"
  
  - model_name: gpt-5.1-codex
    litellm_params:
      model: azure/gpt-5.1-codex
      api_base: https://westeurope.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY_WESTEUROPE
    model_info:
      id: "deployment-westeurope"

router_settings:
  optional_pre_call_checks:
    - encrypted_content_affinity  # 👈 Prevents invalid_encrypted_content errors
```

這可確保包含加密內容的請求會被路由到建立它們的部署，而其他請求則會持續正常進行負載平衡。

**[進一步瞭解加密內容親和性 →](../response_api.md#encrypted-content-affinity-multi-region-load-balancing)**
