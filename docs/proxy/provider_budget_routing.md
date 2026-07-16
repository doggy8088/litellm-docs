import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 預算路由 {#budget-routing}
LiteLLM 支援設定以下預算：
- 提供者預算 - OpenAI 每天 $100，Azure 每天 $100。
- 模型預算 - gpt-4 每天 $100 https://api-base-1, gpt-4o 每天 $100 https://api-base-2
- 標籤預算 - tag=`product:chat-bot` 每天 $10，tag=`product:chat-bot-2` 每天 $100

## 提供者預算 {#provider-budgets}
可用來為 LLM 提供者設定預算 - 例如 OpenAI 每天 $100，Azure 每天 $100。

### 快速開始 {#quick-start}

在您的 `proxy_config.yaml` 檔案中設定提供者預算
#### 閘道設定 {#proxy-config-setup}
```yaml
model_list:
    - model_name: gpt-3.5-turbo
      litellm_params:
        model: openai/gpt-3.5-turbo
        api_key: os.environ/OPENAI_API_KEY

router_settings:
  provider_budget_config: 
    openai: 
      budget_limit: 0.000000000001 # float of $ value budget for time period
      time_period: 1d # can be 1d, 2d, 30d, 1mo, 2mo
    azure:
      budget_limit: 100
      time_period: 1d
    anthropic:
      budget_limit: 100
      time_period: 10d
    vertex_ai:
      budget_limit: 100
      time_period: 12d
    gemini:
      budget_limit: 100
      time_period: 12d
  
  # OPTIONAL: Set Redis Host, Port, and Password if using multiple instance of LiteLLM
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD

general_settings:
  master_key: sk-1234
```

#### 發送測試請求 {#make-a-test-request}

我們預期第一個請求會成功，而第二個請求會失敗，因為我們已超過 `openai` 的預算

**[Langchain, OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功呼叫 " value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "hi my name is test request"}
    ]
  }'
```

</TabItem>
<TabItem label="失敗的呼叫" value = "not-allowed">

預期這會失敗，因為我們已超過提供者 `openai` 的預算

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "hi my name is test request"}
    ]
  }'
```

失敗時的預期回應

```json
{
  "error": {
    "message": "No deployments available - crossed budget for provider: Exceeded budget for provider openai: 0.0007350000000000001 >= 1e-12",
    "type": "None",
    "param": "None",
    "code": "429"
  }
}
```

</TabItem>

</Tabs>

#### 提供者預算路由如何運作 {#how-provider-budget-routing-works}

1. **預算追蹤**： 
   - 使用 Redis 追蹤每個提供者的支出
   - 依指定時間區間追蹤支出（例如「1d」、「30d」）
   - 在時間區間到期後自動重設支出

2. **路由邏輯**：
   - 將請求路由到仍在預算限制內的提供者
   - 跳過已超出預算的提供者
   - 如果所有提供者都超出預算，則回傳錯誤

3. **支援的時間區間**：
   - 秒："Xs"（例如 "30s"）
   - 分鐘："Xm"（例如 "10m"）
   - 小時："Xh"（例如 "24h"）
   - 天："Xd"（例如 "1d"、"30d"）
   - 月："Xmo"（例如 "1mo"、"2mo"）

4. **需求**：
   - 需要 Redis 來跨執行個體追蹤支出
   - 提供者名稱必須是 litellm 的提供者名稱。請參閱 [支援的提供者](https://docs.litellm.ai/docs/providers)

### 監控提供者剩餘預算 {#monitoring-provider-remaining-budget}

#### 取得預算、支出明細 {#get-budget-spend-details}

使用此端點可檢查提供者目前的預算、支出以及預算重設時間

請求範例

```bash
curl -X GET http://localhost:4000/provider/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234"
```

回應範例

```json
{
    "providers": {
        "openai": {
            "budget_limit": 1e-12,
            "time_period": "1d",
            "spend": 0.0,
            "budget_reset_at": null
        },
        "azure": {
            "budget_limit": 100.0,
            "time_period": "1d",
            "spend": 0.0,
            "budget_reset_at": null
        },
        "anthropic": {
            "budget_limit": 100.0,
            "time_period": "10d",
            "spend": 0.0,
            "budget_reset_at": null
        },
        "vertex_ai": {
            "budget_limit": 100.0,
            "time_period": "12d",
            "spend": 0.0,
            "budget_reset_at": null
        }
    }
}
```

#### Prometheus 指標 {#prometheus-metric}

LiteLLM 會在 Prometheus 上發出以下指標，用於追蹤每個提供者的剩餘預算

此指標表示提供者以美元（USD）計算的剩餘預算

```
litellm_provider_remaining_budget_metric{api_provider="openai"} 10
```


## 模型預算 {#model-budgets}

可用來為模型設定預算 - 例如 openai/gpt-4o 每天 $10，openai/gpt-4o-mini 每天 $100

### 快速開始 {#quick-start-1}

在您的 `proxy_config.yaml` 檔案中設定模型預算

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      max_budget: 0.000000000001 # (USD)
      budget_duration: 1d # (Duration. can be 1s, 1m, 1h, 1d, 1mo)
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
      max_budget: 100 # (USD)
      budget_duration: 30d # (Duration. can be 1s, 1m, 1h, 1d, 1mo)


```


#### 發送測試請求 {#make-a-test-request-1}

我們預期第一個請求會成功，而第二個請求會失敗，因為我們已超過 `openai/gpt-4o` 的預算

**[Langchain, OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功呼叫 " value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "hi my name is test request"}
    ]
  }'
```

</TabItem>
<TabItem label="失敗的呼叫" value = "not-allowed">

預期這會失敗，因為我們已超過 `openai/gpt-4o` 的預算

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "hi my name is test request"}
    ]
  }'
```

失敗時的預期回應

```json
{
    "error": {
        "message": "No deployments available - crossed budget: Exceeded budget for deployment model_name: gpt-4o, litellm_params.model: openai/gpt-4o, model_id: dbe80f2fe2b2465f7bfa9a5e77e0f143a2eb3f7d167a8b55fb7fe31aed62587f: 0.00015250000000000002 >= 1e-12",
        "type": "None",
        "param": "None",
        "code": "429"
    }
}
```
</TabItem>

</Tabs>

## ✨ 標籤預算 {#-tag-budgets}

:::info

✨ 這是企業版專屬功能 [在此開始使用企業版](https://www.litellm.ai/#pricing)

:::

可用來為標籤設定預算 - 例如 tag=`product:chat-bot` 每天 $10，tag=`product:chat-bot-2` 每天 $100

### 快速開始 {#quick-start-2}

在您的 `proxy_config.yaml` 檔案中設定 `tag_budget_config` 以設定標籤預算

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  tag_budget_config:
    product:chat-bot: # (Tag)
      max_budget: 0.000000000001 # (USD)
      budget_duration: 1d # (Duration)
    product:chat-bot-2: # (Tag)
      max_budget: 100 # (USD)
      budget_duration: 1d # (Duration)
```

#### 發送測試請求 {#make-a-test-request-2}

我們預期第一個請求會成功，而第二個請求會失敗，因為我們已超過 `openai/gpt-4o` 的預算

**[Langchain, OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功呼叫 " value = "allowed">

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "hi my name is test request"}
    ],
    "metadata": {"tags": ["product:chat-bot"]}
  }'
```

</TabItem>
<TabItem label="失敗的呼叫" value = "not-allowed">

預期這會失敗，因為我們已超過 tag=`product:chat-bot` 的預算

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "hi my name is test request"}
    ],
    "metadata": {"tags": ["product:chat-bot"]}
  }

```

失敗時的預期回應

```json
{
    "error": {
        "message": "No deployments available - crossed budget: Exceeded budget for tag='product:chat-bot', tag_spend=0.00015250000000000002, tag_budget_limit=1e-12",
        "type": "None",
        "param": "None",
        "code": "429"
    }
}
```

</TabItem>

</Tabs>

## 多執行個體設定 {#multi-instance-setup}

如果您使用多執行個體設定，則需要在 `proxy_config.yaml` 檔案中設定 Redis 主機、連接埠和密碼。Redis 用於在 LiteLLM 執行個體之間同步支出。

```yaml
model_list:
    - model_name: gpt-3.5-turbo
      litellm_params:
        model: openai/gpt-3.5-turbo
        api_key: os.environ/OPENAI_API_KEY

router_settings:
  provider_budget_config: 
    openai: 
      budget_limit: 0.000000000001 # float of $ value budget for time period
      time_period: 1d # can be 1d, 2d, 30d, 1mo, 2mo
  
  # 👇 Add this: Set Redis Host, Port, and Password if using multiple instance of LiteLLM
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD

general_settings:
  master_key: sk-1234
```

## provider_budget_config 規格 {#spec-for-provider_budget_config}

`provider_budget_config` 是一個字典，其中：
- **Key**：提供者名稱（字串）- 必須是有效的 [LiteLLM 提供者名稱](https://docs.litellm.ai/docs/providers)
- **Value**：包含以下參數的預算設定物件：
  - `budget_limit`：代表 USD 預算的浮點數值
  - `time_period`：以下格式之一的持續時間字串：
    - 秒：`"Xs"`（例如 "30s"）
    - 分鐘：`"Xm"`（例如 "10m"）
    - 小時：`"Xh"`（例如 "24h"）
    - 天：`"Xd"`（例如 "1d"、"30d"）
    - 月：`"Xmo"`（例如 "1mo"、"2mo"）

範例結構：
```yaml
provider_budget_config:
  openai:
    budget_limit: 100.0    # $100 USD
    time_period: "1d"      # 1 day period
  azure:
    budget_limit: 500.0    # $500 USD
    time_period: "30d"     # 30 day period
  anthropic:
    budget_limit: 200.0    # $200 USD
    time_period: "1mo"     # 1 month period
  gemini:
    budget_limit: 50.0     # $50 USD
    time_period: "24h"     # 24 hour period
```
