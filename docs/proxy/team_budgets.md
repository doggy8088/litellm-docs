import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 設定團隊預算 {#setting-team-budgets}

# 前置需求 {#pre-requisites}

- 您必須設定一個 Postgres 資料庫（例如 Supabase、Neon 等）

## 自動產生的 JWT 團隊的預設預算 {#default-budget-for-auto-generated-jwt-teams}

使用 `team_id_upsert: true` 的 JWT 驗證時，您可以自動為任何新建立的團隊指派預設預算。

這是在您的 `config.yaml` 中的 `default_team_settings` 設定。

**範例：**
```yaml
# in your config.yaml

litellm_jwtauth:
  team_id_upsert: true
  team_id_jwt_field: "team_id"
  # ... other jwt settings

litellm_settings:
  default_team_settings: 
    - team_id: "default-settings"
      max_budget: 100.0
```
追蹤支出，為您的內部團隊設定預算

## 設定每月團隊預算 {#setting-monthly-team-budgets}

### 1. 建立團隊  {#1-create-a-team}
- 設定 `max_budget=000000001`（團隊允許花費的 $ 金額）
- 設定 `budget_duration="1d"`（預算應該多久更新一次）

<Tabs>

<TabItem value="API" label="API">

建立新團隊並設定 `max_budget` 與 `budget_duration`
```shell
curl -X POST 'http://0.0.0.0:4000/team/new' \
     -H 'Authorization: Bearer sk-1234' \
     -H 'Content-Type: application/json' \
     -d '{
            "team_alias": "QA Prod Bot", 
            "max_budget": 0.000000001, 
            "budget_duration": "1d"
        }' 
```

回應
```shell
{
 "team_alias": "QA Prod Bot",
 "team_id": "de35b29e-6ca8-4f47-b804-2b79d07aa99a",
 "max_budget": 0.0001,
 "budget_duration": "1d",
 "budget_reset_at": "2024-06-14T22:48:36.594000Z"
}  
```
</TabItem>

<TabItem value="UI" label="管理介面">
<Image img={require('../../img/create_team_gif_good.gif')} />

</TabItem>

</Tabs>

`budget_duration` 的可用值

| `budget_duration` | 預算何時重設 |
| --- | --- |
| `budget_duration="1s"` | 每 1 秒 |
| `budget_duration="1m"` | 每 1 分鐘 |
| `budget_duration="1h"` | 每 1 小時 |
| `budget_duration="1d"` | 每 1 天 |
| `budget_duration="30d"` | 每 1 個月 |

### 2. 為 `team` 建立金鑰 {#2-create-a-key-for-the-team}

為團隊=`QA Prod Bot` 建立一把金鑰，並使用步驟 1 中的 `team_id="de35b29e-6ca8-4f47-b804-2b79d07aa99a"`

<Tabs>

<TabItem value="api" label="API">

💡 **團隊="QA Prod Bot" 的預算將套用到此團隊**

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
     -H 'Authorization: Bearer sk-1234' \
     -H 'Content-Type: application/json' \
     -d '{"team_id": "de35b29e-6ca8-4f47-b804-2b79d07aa99a"}'
```

回應

```shell
{"team_id":"de35b29e-6ca8-4f47-b804-2b79d07aa99a", "key":"sk-5qtncoYjzRcxMM4bDRktNQ"}
```
</TabItem>

<TabItem value="UI" label="管理介面">
<Image img={require('../../img/create_key_in_team.gif')} />
</TabItem>

</Tabs>

### 3. 測試它 {#3-test-it}

使用步驟 2 的金鑰並執行此請求兩次
<Tabs>

<TabItem value="api" label="API">

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H 'Authorization: Bearer sk-mso-JSykEGri86KyOvgxBw' \
     -H 'Content-Type: application/json' \
     -d ' {
           "model": "llama3",
           "messages": [
             {
               "role": "user",
               "content": "hi"
             }
           ]
         }'
```

在第 2 次回應中 - 預期會看到以下例外

```shell
{
 "error": {
   "message": "Budget has been exceeded! Current cost: 3.5e-06, Max budget: 1e-09",
   "type": "auth_error",
   "param": null,
   "code": 400
 }
}
```

</TabItem>

<TabItem value="UI" label="管理介面">
<Image img={require('../../img/test_key_budget.gif')} />
</TabItem>
</Tabs>

## 進階 {#advanced}

### `remaining_budget` 的 Prometheus 指標 {#prometheus-metrics-for-remaining_budget}

[關於 Prometheus 指標的更多資訊請見此處](https://docs.litellm.ai/docs/proxy/prometheus)

您需要在 proxy config.yaml 中加入以下內容

```yaml
litellm_settings:
  success_callback: ["prometheus"]
  failure_callback: ["prometheus"]
```

預期在 prometheus 上看到此指標，以追蹤該團隊的剩餘預算

```shell
litellm_remaining_team_budget_metric{team_alias="QA Prod Bot",team_id="de35b29e-6ca8-4f47-b804-2b79d07aa99a"} 9.699999999999992e-06
```

## 另請參閱 {#see-also}

- [團隊的每個模型 TPM/RPM](./users.md#per-team-model) - 為團隊中的所有金鑰設定每個模型的速率限制
