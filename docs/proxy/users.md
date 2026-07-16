import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 預算、速率限制 {#budgets-rate-limits}

:::info **預算設定選項**
**個人預算**：建立不含 team_id 的虛擬金鑰，以設定個人支出上限

**團隊預算**：在虛擬金鑰中加入 team_id，以使用團隊共享預算

**團隊成員預算**：在團隊共享預算內，為個別成員設定支出上限

**代理程式預算**：為代理程式設定速率限制（tpm/rpm）與工作階段層級上限（迭代次數、美元預算） [**跳轉**](#agents)

***如果金鑰屬於某個團隊，則會套用團隊預算，而不是使用者的個人預算。***
:::

需求： 

- 需要一個 postgres 資料庫（例如 [Supabase](https://supabase.com/)、[Neon](https://neon.tech/) 等）[**查看設定**](./virtual_keys.md#setup)

## 設定預算 {#set-budgets}

### 全域 Proxy {#global-proxy}

在 proxy 上對所有請求套用預算

**步驟 1. 修改 config.yaml**

```yaml
general_settings:
  master_key: sk-1234

litellm_settings:
  # other litellm settings
  max_budget: 0 # (float) sets max budget as $0 USD
  budget_duration: 30d # (str) frequency of reset - You can set duration as seconds ("30s"), minutes ("30m"), hours ("30h"), days ("30d").
```

**步驟 2. 啟動 proxy**

```bash
litellm /path/to/config.yaml
```

**步驟 3. 傳送測試請求**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Autherization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
}'
```

### 團隊 {#team}

您可以：
- 為 Teams 加入預算

:::info

**逐步教學：在 Teams 上設定、重設預算（透過 API 或使用 Admin UI）**

#### **為團隊新增預算** {#add-budgets-to-teams}
```shell 
curl --location 'http://localhost:4000/team/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "team_alias": "my-new-team_4",
  "members_with_roles": [{"role": "admin", "user_id": "5c4a0aa3-a1e1-43dc-bd87-3c2da8382a3a"}],
  "rpm_limit": 99
}' 
```

[**查看 Swagger**](https://litellm-api.up.railway.app/#/team%20management/new_team_team_new_post)

**範例回應**

```shell
{
    "team_alias": "my-new-team_4",
    "team_id": "13e83b19-f851-43fe-8e93-f96e21033100",
    "admins": [],
    "members": [],
    "members_with_roles": [
        {
            "role": "admin",
            "user_id": "5c4a0aa3-a1e1-43dc-bd87-3c2da8382a3a"
        }
    ],
    "metadata": {},
    "tpm_limit": null,
    "rpm_limit": 99,
    "max_budget": null,
    "models": [],
    "spend": 0.0,
    "max_parallel_requests": null,
    "budget_duration": null,
    "budget_reset_at": null
}
```

#### **為團隊新增預算期間** {#add-budget-duration-to-teams}

`budget_duration`：預算會在指定持續時間結束時重設。如果未設定，預算將永不重設。您可以將持續時間設定為秒（"30s"）、分鐘（"30m"）、小時（"30h"）、天（"30d"）。

```
curl 'http://0.0.0.0:4000/team/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "team_alias": "my-new-team_4",
  "members_with_roles": [{"role": "admin", "user_id": "5c4a0aa3-a1e1-43dc-bd87-3c2da8382a3a"}],
  "budget_duration": "30s",
}'
```

### 團隊成員 {#team-members}

當您想要限制 Team 內使用者的支出預算時，請使用此功能 

#### 步驟 1. 建立使用者 {#step-1-create-user}

使用 `user_id=ishaan` 建立使用者

```shell
curl --location 'http://0.0.0.0:4000/user/new' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "user_id": "ishaan"
}'
```

#### 步驟 2. 將使用者加入既有團隊 - 設定 `max_budget_in_team` {#step-2-add-user-to-an-existing-team---set-max_budget_in_team}

在將使用者加入團隊時，設定 `max_budget_in_team`。我們會使用在步驟 1 中設定的相同 `user_id`

```shell
curl -X POST 'http://0.0.0.0:4000/team/member_add' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"team_id": "e8d1460f-846c-45d7-9b43-55f3cc52ac32", "max_budget_in_team": 0.000000000001, "member": {"role": "user", "user_id": "ishaan"}}'
```

#### 步驟 3. 為步驟 1 的團隊成員建立金鑰 {#step-3-create-a-key-for-team-member-from-step-1}

設定步驟 1 中的 `user_id=ishaan`

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
        "user_id": "ishaan",
        "team_id": "e8d1460f-846c-45d7-9b43-55f3cc52ac32"
}'
```
來自 `/key/generate` 的回應

我們會在步驟 4 中使用此回應中的 `key`
```shell
{"key":"sk-RV-l2BJEZ_LYNChSx2EueQ", "models":[],"spend":0.0,"max_budget":null,"user_id":"ishaan","team_id":"e8d1460f-846c-45d7-9b43-55f3cc52ac32","max_parallel_requests":null,"metadata":{},"tpm_limit":null,"rpm_limit":null,"budget_duration":null,"allowed_cache_controls":[],"soft_budget":null,"key_alias":null,"duration":null,"aliases":{},"config":{},"permissions":{},"model_max_budget":{},"key_name":null,"expires":null,"token_id":null}% 
```

#### 步驟 4. 對團隊成員發出 /chat/completions 請求 {#step-4-make-chatcompletions-requests-for-team-member}

此請求請使用步驟 3 中的金鑰。執行 2-3 次請求後，預期會看到以下錯誤 `ExceededBudget: Crossed spend within team` 

```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header 'Authorization: Bearer sk-RV-l2BJEZ_LYNChSx2EueQ' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "llama3",
    "messages": [
        {
        "role": "user",
        "content": "tes4"
        }
    ]
}'
```


### 內部使用者 {#internal-user}

在 proxy 上，對內部使用者（金鑰擁有者）可發出的所有請求套用預算。 

:::info

對於設定了 'team_id' 的金鑰，會使用團隊預算，而不是使用者的個人預算。

若要對團隊內的使用者套用預算，請使用團隊成員預算。

:::

LiteLLM 提供一個 `/user/new` 端點來建立這些預算。

您可以：
- 將預算新增到使用者 [**跳轉**](#add-budgets-to-users)
- 新增預算持續時間，以重設支出 [**跳轉**](#add-budget-duration-to-users)

預設情況下，`max_budget` 設為 `null`，且不會針對金鑰進行檢查

#### **為使用者新增預算** {#add-budgets-to-users}
```shell 
curl --location 'http://localhost:4000/user/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{"models": ["azure-models"], "max_budget": 0, "user_id": "krrish3@berri.ai"}' 
```

[**查看 Swagger**](https://litellm-api.up.railway.app/#/user%20management/new_user_user_new_post)

**範例回應**

```shell
{
    "key": "sk-YF2OxDbrgd1y2KgwxmEA2w",
    "expires": "2023-12-22T09:53:13.861000Z",
    "user_id": "krrish3@berri.ai",
    "max_budget": 0.0
}
```

#### **為使用者新增預算期間** {#add-budget-duration-to-users}

`budget_duration`：預算會在指定持續時間結束時重設。若未設定，預算永不重設。您可以將持續時間設定為秒（"30s"）、分鐘（"30m"）、小時（"30h"）、天（"30d"）。

```
curl 'http://0.0.0.0:4000/user/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "team_id": "core-infra", # [OPTIONAL]
  "max_budget": 10,
  "budget_duration": "30s",
}'
```

#### 為既有使用者建立新金鑰 {#create-new-keys-for-existing-user}

現在您只需使用該 user_id（例如 krrish3@berri.ai）呼叫 `/key/generate`，並且：
- **預算檢查**：會檢查此金鑰的 krrish3@berri.ai 預算（例如 $10）
- **支出追蹤**：此金鑰的支出也會更新 krrish3@berri.ai 的支出

```bash
curl --location 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data '{"models": ["azure-models"], "user_id": "krrish3@berri.ai"}'
```

### 虛擬金鑰 {#virtual-key}

對金鑰套用預算。

您可以：
- 將預算新增到金鑰 [**跳轉**](#add-budgets-to-keys)
- 新增預算持續時間，以重設支出 [**跳轉**](#add-budget-duration-to-keys)

**預期行為**
- 每個金鑰的成本會自動填入 `LiteLLM_VerificationToken` 表格
- 金鑰超過其 `max_budget` 後，請求會失敗
- 若設定了持續時間，支出會在持續時間結束時重設

預設情況下，`max_budget` 設為 `null`，且不會針對金鑰進行檢查

#### **為金鑰新增預算** {#add-budgets-to-keys}

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "team_id": "core-infra", # [OPTIONAL]
  "max_budget": 10,
}'
```

金鑰超過預算時對 `/chat/completions` 的範例請求

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <generated-key>' \
  --data ' {
  "model": "azure-gpt-3.5",
  "user": "e09b4da8-ed80-4b05-ac93-e16d9eb56fca",
  "messages": [
      {
      "role": "user",
      "content": "respond in 50 lines"
      }
  ],
}'
```


金鑰超過預算時來自 `/chat/completions` 的預期回應
```shell
{
  "detail":"Authentication Error, ExceededTokenBudget: Current spend for token: 7.2e-05; Max Budget for Token: 2e-07"
}   
```

#### **為金鑰新增預算期間** {#add-budget-duration-to-keys}

`budget_duration`：預算會在指定持續時間結束時重設。若未設定，預算永不重設。您可以將持續時間設定為秒（"30s"）、分鐘（"30m"）、小時（"30h"）、天（"30d"）。

```
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "team_id": "core-infra", # [OPTIONAL]
  "max_budget": 10,
  "budget_duration": "30s",
}'
```

#### **在金鑰上設定多個預算視窗** {#set-multiple-budget-windows-on-a-key}

在同一個金鑰上於不同時間尺度套用多個並行預算限制——例如，將金鑰上限設為 **$10/天** 且 **$100/月**。

**這在什麼情況下有用？**

單一 `budget_duration` 視窗無法防止糟糕的一天燒掉您整個月份的額度。多個預算視窗可讓您：

- 在一天內封鎖失控的用量暴增，同時仍允許正常的每月支出。
- 為 Claude Code rollout 提供每日防護欄（`24h`）與每月上限（`30d`），避免單次大量使用的工作階段耗盡整個月份。
- 在週上限之上，為突發型工作負載分層加入更細的每小時限制。

:::info

請參閱 [使用者預算文件](https://docs.litellm.ai/docs/proxy/users)，以了解預算如何跨金鑰、團隊與使用者運作。

:::

**透過 API**

將 `budget_limits` 作為 `{budget_duration, max_budget}` 物件的清單傳入：

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "budget_limits": [
    {"budget_duration": "24h",  "max_budget": 10},
    {"budget_duration": "30d",  "max_budget": 100}
  ]
}'
```

每個時間窗口都會獨立追蹤，並依各自的排程重設：

| `budget_duration` | 重設 |
|---|---|
| `1h`  | 每小時 |
| `24h` | 每天 UTC 午夜 |
| `7d`  | 每週日 UTC 午夜 |
| `30d` | 每月 1 日 UTC 午夜 |

**透過儀表板**

開啟 **Virtual Keys → Create Key → Optional Settings → Budget Windows**。

![步驟 1 - 開啟金鑰設定](https://colony-recorder.s3.amazonaws.com/files/2026-04-01/18930ba5-67c0-4031-afc0-57f37b4e59e4/ascreenshot_ef79d8a000bb41cdacf1bd9827732ee8_text_export.jpeg)

點擊 **+ Add Budget Window** 新增一列，從下拉選單選擇期間，並輸入支出上限。

![步驟 2 - 新增窗口](https://colony-recorder.s3.amazonaws.com/files/2026-04-01/5ae8c0b3-2d03-41ad-a63c-47b20c350dfe/ascreenshot_1a7dc6c7d65544f38fd8a65604674f22_text_export.jpeg)

再新增第二列以設定不同時間區間（例如：在每日 10 美元之外，再加上每月 100 美元）。

![步驟 3 - 新增第二個窗口](https://colony-recorder.s3.amazonaws.com/files/2026-04-01/cbded3a7-1086-4e20-8f0f-de154b76146c/ascreenshot_c51c18752c3b4f8b976d28799b2638b6_text_export.jpeg)

每個窗口都會在輸入欄位下方顯示重設排程，因此您可以清楚知道支出何時重設。

![步驟 4 - 重設提示](https://colony-recorder.s3.amazonaws.com/files/2026-04-01/8754f121-1640-4892-9dd0-fd4a870418bf/ascreenshot_8079eb0df2194e8f99e5258ba4b3c082_text_export.jpeg)

### ✨ 虛擬金鑰（模型特定） {#-virtual-key-model-specific}

在金鑰上套用模型特定預算。範例： 
- `gpt-4o` 的預算為 $0.0000001，期間為 `1d`，適用於 `key = "sk-12345"`
- `gpt-4o-mini` 的預算為 $10，期間為 `30d`，適用於 `key = "sk-12345"`

:::info

✨ 這是僅限 Enterprise 的功能 [在此開始使用 Enterprise](https://www.litellm.ai/#pricing)

:::

`model_max_budget` 的規格為 **[`Dict[str, GenericBudgetInfo]`](#genericbudgetinfo)**

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "model_max_budget": {"gpt-4o": {"budget_limit": "0.0000001", "time_period": "1d"}}
}'
```


#### 發出測試請求 {#make-a-test-request}

我們預期第一個請求會成功，而第二個請求會失敗，因為我們在 Virtual Key 上超過了 `gpt-4o` 的預算

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

<Tabs>
<TabItem label="成功的呼叫 " value = "allowed">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <sk-generated-key>' \
--data ' {
      "model": "gpt-4o",
      "messages": [
        {
          "role": "user",
          "content": "testing request"
        }
      ]
    }
'
```

</TabItem>
<TabItem label="失敗的呼叫" value = "not-allowed">

預期這會失敗，因為我們在 Virtual Key 上超過了 `model=gpt-4o` 預算

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <sk-generated-key>' \
--data ' {
      "model": "gpt-4o",
      "messages": [
        {
          "role": "user",
          "content": "testing request"
        }
      ]
    }
'
```

失敗時的預期回應

```json
{
    "error": {
        "message": "LiteLLM Virtual Key: 9769f3f6768a199f76cc29xxxx, key_alias: None, exceeded budget for model=gpt-4o",
        "type": "budget_exceeded",
        "param": null,
        "code": "400"
    }
}
```

</TabItem>
</Tabs>

若要在超過每個模型的預算時，將請求重新路由到其他模型，而不是回傳 `budget_exceeded`，請參閱 [預算備援](./budget_fallbacks)。

### 代理程式 {#agents}

在 LiteLLM 註冊的代理程式上設定預算與速率限制，[Agent Gateway](../a2a.md)。您可以控制：
- **每個代理程式的速率限制**：套用在代理程式本身的 `tpm_limit` 和 `rpm_limit`
- **每個工作階段的速率限制**：每個工作階段套用的 `session_tpm_limit` 和 `session_rpm_limit`
- **每個工作階段的迭代上限**：代理程式 `litellm_params` 中的 `max_iterations`
- **每個工作階段的預算上限**：代理程式 `litellm_params` 中的 `max_budget_per_session`

<Tabs>
<TabItem value="agent-rate-limits" label="Agent Rate Limits">

在代理程式上設定 `tpm_limit` 和 `rpm_limit`，以限制所有工作階段的總吞吐量。

```bash
curl -X POST 'http://localhost:4000/v1/agents' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_name": "my-research-agent",
    "agent_card_params": {
      "name": "my-research-agent",
      "description": "A research agent",
      "url": "http://my-agent:8080",
      "version": "1.0.0"
    },
    "tpm_limit": 100000,
    "rpm_limit": 100
  }'
```

</TabItem>
<TabItem value="session-rate-limits" label="Session Rate Limits">

設定 `session_tpm_limit` 和 `session_rpm_limit`，以限制單一工作階段的吞吐量。

```bash
curl -X POST 'http://localhost:4000/v1/agents' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_name": "my-research-agent",
    "agent_card_params": {
      "name": "my-research-agent",
      "description": "A research agent",
      "url": "http://my-agent:8080",
      "version": "1.0.0"
    },
    "session_tpm_limit": 50000,
    "session_rpm_limit": 50
  }'
```

</TabItem>
<TabItem value="session-budgets" label="Session Budgets">

在代理程式 `litellm_params` 中設定 `max_iterations` 和 `max_budget_per_session`，以限制個別工作階段。需要 `require_trace_id_on_calls_by_agent`，因此 LiteLLM 可以追蹤每個工作階段的呼叫。

```bash
curl -X POST 'http://localhost:4000/v1/agents' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_name": "my-research-agent",
    "agent_card_params": {
      "name": "my-research-agent",
      "description": "A research agent",
      "url": "http://my-agent:8080",
      "version": "1.0.0"
    },
    "litellm_params": {
      "require_trace_id_on_calls_by_agent": true,
      "max_iterations": 25,
      "max_budget_per_session": 5.00
    }
  }'
```

當工作階段超過限制時，請求會收到 **429 Too Many Requests** 回應。

請參閱 [Agent Iteration Budgets](../a2a_iteration_budgets) 指南以了解完整細節。

</TabItem>
</Tabs>

:::info

您也可以使用 `PATCH /v1/agents/{agent_id}` 更新既有代理程式的速率限制：

```bash
curl -X PATCH 'http://localhost:4000/v1/agents/<agent_id>' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "tpm_limit": 200000,
    "rpm_limit": 200,
    "session_tpm_limit": 50000,
    "session_rpm_limit": 50
  }'
```

:::

### 客戶 {#customers}

這可用來為傳遞給 `/chat/completions` 的 `user` 編列預算，**而不需要為每位使用者建立一把金鑰**

**步驟 1. 修改 config.yaml**
定義 `litellm.max_end_user_budget`
```yaml
general_settings:
  master_key: sk-1234

litellm_settings:
  max_end_user_budget: 0.0001 # budget for 'user' passed to /chat/completions
```

2. 發出 /chat/completions 請求，傳入 'user' - 第一次呼叫成功 
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header 'Authorization: Bearer sk-zi5onDRdHGD24v0Zdn7VBA' \
        --data ' {
        "model": "azure-gpt-3.5",
        "user": "ishaan3",
        "messages": [
            {
            "role": "user",
            "content": "what time is it"
            }
        ]
        }'
```

3. 發出 /chat/completions 請求，傳入 'user' - 呼叫失敗，因為 'ishaan3' 超出預算
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
        --header 'Content-Type: application/json' \
        --header 'Authorization: Bearer sk-zi5onDRdHGD24v0Zdn7VBA' \
        --data ' {
        "model": "azure-gpt-3.5",
        "user": "ishaan3",
        "messages": [
            {
            "role": "user",
            "content": "what time is it"
            }
        ]
        }'
```

錯誤
```shell
{"error":{"message":"Budget has been exceeded: User ishaan3 has exceeded their budget. Current spend: 0.0008869999999999999; Max Budget: 0.0001","type":"auth_error","param":"None","code":401}}%                
```

## 重設預算 {#reset-budgets}

重設跨金鑰／內部使用者／團隊／客戶的預算

`budget_duration`：預算會在指定期間結束時重設。如果未設定，預算永遠不會重設。您可以將期間設定為秒（"30s"）、分鐘（"30m"）、小時（"30h"）、天（"30d"）。

<Tabs>
<TabItem value="users" label="Internal Users">

```bash
curl 'http://0.0.0.0:4000/user/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "max_budget": 10,
  "budget_duration": "30s", # 👈 KEY CHANGE
}'
```
</TabItem>
<TabItem value="keys" label="Keys">

```bash
curl 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "max_budget": 10,
  "budget_duration": "30s", # 👈 KEY CHANGE
}'
```

</TabItem>
<TabItem value="teams" label="Teams">

```bash
curl 'http://0.0.0.0:4000/team/new' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "max_budget": 10,
  "budget_duration": "30s", # 👈 KEY CHANGE
}'
```
</TabItem>
</Tabs>

**注意：** 預設情況下，伺服器每 10 分鐘檢查一次是否需要重設，以減少資料庫呼叫。

若要變更此設定，請設定 `proxy_budget_rescheduler_min_time` 和 `proxy_budget_rescheduler_max_time`

例如：每 1 秒檢查一次
```yaml
general_settings: 
  proxy_budget_rescheduler_min_time: 1
  proxy_budget_rescheduler_max_time: 1
```

## 備援到「free」模型 {#fallback-to-free-models}

如果金鑰／使用者／團隊已達到其預算上限，對設定了 `input_cost_per_token: 0` 和 `output_cost_per_token: 0` 的模型之請求仍會被允許。對零成本模型則會完全略過預算檢查。

這讓您可以將免費或自架模型設定為備援，即使預算已用盡的金鑰仍可存取。

若要將模型標記為免費，請在您的 `config.yaml` 中將這兩個成本欄位都明確設為 `0`：

```yaml
model_list:
  - model_name: my-free-model
    litellm_params:
      model: ollama/llama3
      input_cost_per_token: 0
      output_cost_per_token: 0
```

**注意：** 成本欄位必須明確設為 `0`。如果未設定（`null`／缺失），模型不會被視為免費，預算檢查仍會套用。
## 硬性預算強制執行（失敗即封閉） {#hard-budget-enforcement-fail-closed}

預算檢查會從 Redis 中的跨 pod 計數器讀取目前支出，這可讓強制執行在 workers 與 replicas 之間保持快速且一致。該計數器是熱路徑上的事實來源，而資料庫會在背景中進行協調。若 Redis 重新啟動並載入較舊的快照，計數器可能會回到低於資料庫中已記錄支出的值；在熱路徑上，系統會信任這個過時值，這可能讓金鑰持續花費超過其 `max_budget`，直到計數器被修正為止。

對於已設定的預算即使在 Redis 降級時也必須是硬上限的部署，請設定 `fail_closed_budget_enforcement`：

```yaml
general_settings:
  fail_closed_budget_enforcement: true
```

啟用後，每個有預算的請求在被接受前都會先以權威資料庫驗證支出（涵蓋 key、team、user、organization、end-user、tag，以及 per-window 預算），因此過時或缺失的 Redis 計數器無法低估支出。資料庫讀取會在程序內合併並快取數秒，因此額外負載會被限制在每個 worker、每個快取視窗、每個有預算實體約一筆讀取，而不是每個請求一筆讀取。若目前支出無法同時由 Redis 與資料庫驗證，請求會以 `503` 被拒絕，而不是在無法驗證的預算上被接受。

保持此設定關閉（預設值）可讓健康且未超預算的流量完全不碰資料庫；在預設模式下，當計數器讀到低於呼叫者最後已知記錄支出時，仍會與資料庫交叉檢查，這能在不需要每個請求都讀取資料庫的情況下，攔截常見的過時計數器情境。

## 設定速率限制 {#set-rate-limits}

您可以設定：
- tpm 限制（每分鐘 tokens）
- rpm 限制（每分鐘請求數）
- 最大平行請求數
- 針對特定 key 或 team、依模型設定的 rpm / tpm 限制

### TPM 速率限制類型（輸入／輸出／總計） {#tpm-rate-limit-type-inputoutputtotal}

預設情況下，TPM（每分鐘 tokens）速率限制會計算**總 tokens**（輸入 + 輸出）。您也可以將其設定為只計算輸入 tokens，或改為只計算輸出 tokens。

請在您的 `config.yaml` 中設定 `token_rate_limit_type`：

```yaml
general_settings:
  master_key: sk-1234
  token_rate_limit_type: "output"  # Options: "input", "output", "total" (default)
```

| 值 | 說明 |
|-------|-------------|
| `total` | 計算總 tokens（prompt + completion）。**預設行為。** |
| `input` | 僅計算 prompt／input tokens |
| `output` | 僅計算 completion／output tokens |

此設定會全域套用至所有 TPM 速率限制檢查（keys、users、teams 等）。

<Tabs>
<TabItem value="per-team" label="Per Team">

使用 `/team/new` 或 `/team/update`，即可在 team 的多個 key 之間保留 rate limits。

```shell
curl --location 'http://0.0.0.0:4000/team/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"team_id": "my-prod-team", "max_parallel_requests": 10, "tpm_limit": 20, "rpm_limit": 4}' 
```

[**查看 Swagger**](https://litellm-api.up.railway.app/#/team%20management/new_team_team_new_post)

**預期回應**

```json
{
    "key": "sk-sA7VDkyhlQ7m8Gt77Mbt3Q",
    "expires": "2024-01-19T01:21:12.816168",
    "team_id": "my-prod-team",
}
```

</TabItem>
<TabItem value="per-team-model" label="Per Team Per Model">

**為 team 設定每個 model 的 rate limits**

使用 `model_rpm_limit` 和 `model_tpm_limit`，可為屬於某個 team 的所有 keys 設定每個 model 的 rate limits。這些限制會套用到 team 中的所有 keys，且除非在 key 層級覆寫，否則會由 keys 繼承。

使用 `/team/new` 或 `/team/update` 搭配 `model_rpm_limit` 和 `model_tpm_limit`，以 model 名稱對應其限制的字典：

```shell
curl --location 'http://0.0.0.0:4000/team/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "team_id": "my-prod-team",
  "model_rpm_limit": {"gpt-4": 100, "gpt-3.5-turbo": 200},
  "model_tpm_limit": {"gpt-4": 10000, "gpt-3.5-turbo": 20000}
}'
```

**更新既有 team 的 per-model 限制：**

```shell
curl --location 'http://0.0.0.0:4000/team/update' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "team_id": "my-prod-team",
  "model_rpm_limit": {"gpt-4": 100, "gpt-3.5-turbo": 200},
  "model_tpm_limit": {"gpt-4": 10000, "gpt-3.5-turbo": 20000}
}'
```

**替代方式：使用 metadata**

您也可以透過 `metadata` 欄位傳入 per-model 限制：

```shell
curl --location 'http://0.0.0.0:4000/team/update' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "team_id": "my-prod-team",
  "metadata": {
    "model_rpm_limit": {"gpt-4": 100, "gpt-3.5-turbo": 200},
    "model_tpm_limit": {"gpt-4": 10000, "gpt-3.5-turbo": 20000}
  }
}'
```

**解析順序：** 當 key 屬於某個 team 時，rate limits 的解析順序為：**Key metadata > Key model_max_budget > Team metadata**。Keys 可以使用自己的 `model_rpm_limit` 或 `model_tpm_limit` 覆寫 team 層級的 per-model 限制。

**驗證：** 發出一個 `/chat/completions` 請求，並檢查回應標頭 `x-litellm-key-remaining-requests-{model}` 和 `x-litellm-key-remaining-tokens-{model}`，以確認 model-specific 限制。

[**查看 Swagger**](https://litellm-api.up.railway.app/#/team%20management/new_team_team_new_post)

</TabItem>
<TabItem value="per-user" label="Per Internal User">

使用 `/user/new` 或 `/user/update`，即可在 internal users 的多個 key 之間保留 rate limits。

```shell
curl --location 'http://0.0.0.0:4000/user/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"user_id": "krrish@berri.ai", "max_parallel_requests": 10, "tpm_limit": 20, "rpm_limit": 4}' 
```

[**查看 Swagger**](https://litellm-api.up.railway.app/#/user%20management/new_user_user_new_post)

**預期回應**

```json
{
    "key": "sk-sA7VDkyhlQ7m8Gt77Mbt3Q",
    "expires": "2024-01-19T01:21:12.816168",
    "user_id": "krrish@berri.ai",
}
```

</TabItem>
<TabItem value="per-key" label="Per Key">

如果您只想針對那個 key 使用，請使用 `/key/generate`。

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"max_parallel_requests": 10, "tpm_limit": 20, "rpm_limit": 4}' 
```

**預期回應**

```json
{
    "key": "sk-ulGNRXWtv7M0lFnnsQk0wQ",
    "expires": "2024-01-18T20:48:44.297973",
    "user_id": "78c2c8fc-c233-43b9-b0c3-eb931da27b84"  // 👈 auto-generated
}
```

</TabItem>
<TabItem value="per-key-model" label="Per API Key Per model">

**為每個 api key 設定每個 model 的 rate limits**

設定 `model_rpm_limit` 和 `model_tpm_limit`，即可為每個 api key 設定每個 model 的 rate limits

這裡的 `gpt-4` 是在 [litellm config.yaml](configs.md) 中設定的 `model_name`

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"model_rpm_limit": {"gpt-4": 2}, "model_tpm_limit": {"gpt-4":}}' 
```

**預期回應**

```json
{
    "key": "sk-ulGNRXWtv7M0lFnnsQk0wQ",
    "expires": "2024-01-18T20:48:44.297973",
}
```

**確認此金鑰的 Model Rate Limits 已正確設定**

**發出 /chat/completions 請求，檢查是否回傳 `x-litellm-key-remaining-requests-gpt-4`**

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-ulGNRXWtv7M0lFnnsQk0wQ" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, Claude!ss eho ares"}
    ]
  }'
```


**預期標頭**

```shell
x-litellm-key-remaining-requests-gpt-4: 1
x-litellm-key-remaining-tokens-gpt-4: 179
```

這些標頭表示：

- 對於 key=`sk-ulGNRXWtv7M0lFnnsQk0wQ` 的 GPT-4 model，還剩 1 次請求
- 對於 key=`sk-ulGNRXWtv7M0lFnnsQk0wQ` 的 GPT-4 model，還剩 179 個 token

</TabItem>
<TabItem value="per-agent" label="Per Agent">

在透過 [Agent Gateway](../a2a.md) 註冊的 agent 上設定 rate limits。

**Agent-level limits** 會限制所有 sessions 的總吞吐量：

```shell
curl -X POST 'http://0.0.0.0:4000/v1/agents' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"agent_name": "my-agent", "agent_card_params": {"name": "my-agent", "description": "My agent", "url": "http://my-agent:8080", "version": "1.0.0"}, "tpm_limit": 100000, "rpm_limit": 100}'
```

**Session-level limits** 會限制單一 session 的吞吐量：

```shell
curl -X POST 'http://0.0.0.0:4000/v1/agents' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{"agent_name": "my-agent", "agent_card_params": {"name": "my-agent", "description": "My agent", "url": "http://my-agent:8080", "version": "1.0.0"}, "session_tpm_limit": 50000, "session_rpm_limit": 50}'
```

您也可以透過 `litellm_params`，為每個 session 設定 **max_iterations**（呼叫次數上限）與 **max_budget_per_session**（金額上限）。詳情請參閱 [Agent Iteration Budgets](../a2a_iteration_budgets)。

</TabItem>
<TabItem value="per-end-user" label="For customers">

:::info 

您也可以在 UI 的「Rate Limits」分頁下，為客戶建立 budget id。

:::

可用來為傳遞給 `/chat/completions` 的 `user` 設定 rate limits，而無需為每位使用者建立一個 key

#### 步驟 1. 建立預算 {#step-1-create-budget}

在 budget 上設定 `tpm_limit`（如有需要，您也可以傳入 `rpm_limit`）

```shell
curl --location 'http://0.0.0.0:4000/budget/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "budget_id" : "free-tier",
    "tpm_limit": 5
}'
```


#### 步驟 2. 建立具有預算的 `Customer` {#step-2-create-customer-with-budget}

建立這位新客戶時，我們會使用步驟 1 中的 `budget_id="free-tier"`

```shell
curl --location 'http://0.0.0.0:4000/customer/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "user_id" : "palantir",
    "budget_id": "free-tier"
}'
```


#### 步驟 3. 在 `/chat/completions` 請求中傳入 `user_id` id {#step-3-pass-user_id-id-in-chatcompletions-requests}

將步驟 2 中的 `user_id` 作為 `user="palantir"` 傳入

```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "llama3",
    "user": "palantir",
    "messages": [
        {
        "role": "user",
        "content": "gm"
        }
    ]
}'
```


</TabItem>
</Tabs>

## 為所有內部使用者設定預設預算 {#set-default-budget-for-all-internal-users}

可用來為您提供 key 的使用者設定預設 budget。

當使用者有 [`user_role="internal_user"`](./self_serve.md#available-roles) 時，這會生效（可透過 `/user/new` 或 `/user/update` 設定）。 

如果 key 有 team_id，這將不會生效（屆時會套用 team budgets）。[告訴我們如何改進！](https://github.com/BerriAI/litellm/issues)

1. 在您的 config.yaml 中定義 max budget

```yaml
model_list: 
  - model_name: "gpt-3.5-turbo"
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  max_internal_user_budget: 0 # amount in USD
  internal_user_budget_duration: "1mo" # reset every month
```

2. 為使用者建立 key 

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{}'
```

預期回應： 

```bash
{
  ...
  "key": "sk-X53RdxnDhzamRwjKXR4IHg"
}
```

3. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-X53RdxnDhzamRwjKXR4IHg' \
-d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hey, how's it going?"}]
}'
```

預期回應： 

```bash
{
    "error": {
        "message": "ExceededBudget: User=<user_id> over budget. Spend=3.7e-05, Budget=0.0",
        "type": "budget_exceeded",
        "param": null,
        "code": "400"
    }
}
```

### 多實例速率限制 {#multi-instance-rate-limiting}

**重要注意事項：**
- **Rate limits 不適用於 proxy 管理員使用者。** 
- 測試 rate limits 時，請使用內部使用者角色（非管理員），以確保限制如預期般生效。

變更：
- 這會在更新目前請求／權杖時改用 async_increment，而不是 async_set_cache。
- 內存快取會每 0.01 秒與 redis 同步一次，以避免每個請求都呼叫 redis。
- 在測試中，這被發現比先前的實作快 2 倍，並將預期與實際失敗之間的偏差在高流量（3 個執行個體上每秒 100 RPS）下減少到最多 10 個請求。

## 授予新模型存取權限 {#grant-access-to-new-model}

使用模型存取群組來讓使用者可存取特定模型，並隨時間加入新的模型（例如 mistral、llama-2 等）。

使用 `/key/generate` 與 `/user/new` 之間有什麼差異？如果您在 `/user/new` 上這麼做，它會在為該使用者產生的多個金鑰之間持續保留。

**步驟 1. 在 config.yaml 中指定模型、存取群組**

```yaml
model_list:
  - model_name: text-embedding-ada-002
    litellm_params:
      model: azure/azure-embedding-model
      api_base: "os.environ/AZURE_API_BASE"
      api_key: "os.environ/AZURE_API_KEY"
      api_version: "2023-07-01-preview"
    model_info:
      access_groups: ["beta-models"] # 👈 Model Access Group
```

**步驟 2. 建立具有存取群組的金鑰**

```bash
curl --location 'http://localhost:4000/user/new' \
-H 'Authorization: Bearer <your-master-key>' \
-H 'Content-Type: application/json' \
-d '{"models": ["beta-models"], # 👈 Model Access Group
			"max_budget": 0}'
```


## 為既有內部使用者建立新金鑰 {#create-new-keys-for-existing-internal-user}

只要在 `/key/generate` 請求中加入 user_id 即可。

```bash
curl --location 'http://0.0.0.0:4000/key/generate' \
--header 'Authorization: Bearer <your-master-key>' \
--header 'Content-Type: application/json' \
--data '{"models": ["azure-models"], "user_id": "krrish@berri.ai"}'
```


## API 規格 {#api-specification}

### `GenericBudgetInfo` {#genericbudgetinfo}

一個定義預算資訊、包含時間期間與上限的 Pydantic 模型。

```python
class GenericBudgetInfo(BaseModel):
    budget_limit: float  # The maximum budget amount in USD
    time_period: str    # Duration string like "1d", "30d", etc.
```

#### 欄位： {#fields}
- `budget_limit`（float）：以 USD 表示的最大預算金額
- `time_period`（str）：指定預算時間期間的持續時間字串。支援的格式：
  - 秒："30s"
  - 分鐘："30m"
  - 小時："30h"
  - 天："30d"

#### 範例： {#example}
```json
{
  "budget_limit": "0.0001",
  "time_period": "1d"
}
```
