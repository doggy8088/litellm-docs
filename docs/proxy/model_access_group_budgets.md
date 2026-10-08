import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 模型存取群組預算 {#model-access-group-budgets}

將一個 [模型存取群組](model_access_groups.md) 指派一個共享預算。群組中任何模型的每個金鑰都會從同一個資金池中扣款，因此一組模型可以共用單一的每月額度，而不必在每個金鑰上各自設定預算。

當您關心的支出屬於模型本身，而不是屬於任何單一呼叫者時，就應該使用這個預算：整個組織共用的「高級」方案、一組昂貴的推理模型，或是您希望無論誰執行評估都要受到上限約束的評估群組。

## 前置條件 {#pre-requisites}

- 您必須設定一個 Postgres 資料庫（例如 Supabase、Neon 等）

## 設定群組預算 {#setting-a-group-budget}

### 1. 將模型放入存取群組 {#1-put-a-model-in-an-access-group}

將 `model_info.access_groups` 加入 deployment，可透過 `config.yaml` 或經由 `/model/new`。

<Tabs>

<TabItem value="config" label="config.yaml">

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: premium-sonnet
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
    model_info:
      access_groups: ["premium"]
```

</TabItem>

<TabItem value="api" label="API">

```shell
curl -X POST 'http://0.0.0.0:4000/model/new' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "model_name": "premium-sonnet",
           "litellm_params": {"model": "anthropic/{{anthropic}}", "api_key": "os.environ/ANTHROPIC_API_KEY"},
           "model_info": {"access_groups": ["premium"]}
         }'
```

</TabItem>

</Tabs>

### 2. 設定群組的預算 {#2-set-the-groups-budget}

```shell
curl -X PUT 'http://0.0.0.0:4000/access_group/premium/budget' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "max_budget": 500.0,
           "budget_duration": "30d"
         }'
```

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `max_budget` | float | 否 | 當群組的共享支出達到此值後，請求將被拒絕 |
| `soft_budget` | float | 否 | 達到時觸發警示；請求仍會成功 |
| `budget_duration` | string | 否 | 群組支出重設的頻率（`"1d"`、`"7d"`、`"30d"`、...） |
| `budget_id` | string | 否 | 連結現有預算，而非建立新的預算 |

至少需要其中一個。此呼叫是冪等的，因此再次送出時會取代群組的預算，而不是疊加第二個預算。

### 3. 將群組授權給金鑰 {#3-grant-a-key-the-group}

金鑰必須在其 `models` 清單中指定該群組。這項授權會將金鑰的支出綁定到該資金池。

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "models": ["premium"]
         }'
```

團隊、專案、組織，以及每位成員的團隊範圍都以相同方式運作：授權該群組的 allowlist 才是實際生效的那一個。

### 4. 測試 {#4-test-it}

使用該金鑰呼叫群組中的模型，直到資金池用完。

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H 'Authorization: Bearer sk-your-premium-key' \
     -H 'Content-Type: application/json' \
     -d '{
           "model": "premium-sonnet",
           "messages": [{"role": "user", "content": "Hello"}]
         }'
```

一旦群組的支出達到 `max_budget`，所有可存取該群組的金鑰都會被拒絕，包括自己本身沒有任何支出的金鑰：

```json
{
  "error": {
    "message": "Budget has been exceeded! Model access group=premium Current cost: 500.12, Max budget: 500.0",
    "type": "budget_exceeded",
    "param": null,
    "code": "429"
  }
}
```

## 讀取與清除預算 {#reading-and-clearing-the-budget}

讀取資金池及其對應的支出：

```shell
curl -X GET 'http://0.0.0.0:4000/access_group/premium/budget' \
     -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json
{
  "access_group": "premium",
  "spend": 245.5,
  "budget": {
    "budget_id": "f56842f7-78d7-4816-847d-b016af57df4c",
    "max_budget": 500.0,
    "soft_budget": null,
    "budget_duration": "30d",
    "budget_reset_at": "2026-09-28T00:00:00Z"
  }
}
```

清除預算時，群組及其模型會保留不變：

```shell
curl -X DELETE 'http://0.0.0.0:4000/access_group/premium/budget' \
     -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json
{
  "access_group": "premium",
  "budget_deleted": true,
  "message": "Budget for access group 'premium' deleted successfully"
}
```

## 哪些請求會從資金池扣款 {#which-requests-draw-from-the-pool}

當兩個條件都成立時，請求才會被記入群組：該群組正在提供所呼叫的模型，以及呼叫者是**以名稱**獲准使用該群組。第二個條件才是需要注意的重點。

未明確命名群組的 allowlist 不會指定任何可扣款的對象，因此永遠不會從資金池扣款。這包括具有 `models: []` 或 `models: ["*"]` 的金鑰、獲准 `all-proxy-models` 的金鑰，以及獲准萬用字元例如 `openai/*` 的金鑰，即使它所呼叫的模型屬於有預算的群組也是如此。這類金鑰仍然可以呼叫該模型；只是其支出會記入金鑰、使用者、團隊與組織的預算，而不是群組的預算。

因此，管理員金鑰或不受限制的金鑰不會受到群組預算的約束。如果您希望一組呼叫者的實際上限就是群組的上限，請將這些呼叫者授權給群組本身，而不是萬用字元。

當多個群組都適用時，會對每個群組全額扣款。獲准 `premium` 與 `eval` 的金鑰，若呼叫一個同時屬於這兩者的模型，該請求的成本會分別從每個資金池扣除；任一資金池耗盡都會拒絕該請求。

## 相關內容 {#related}

- [模型存取群組](model_access_groups.md)：用於建立與授權群組本身
- [標籤預算](tag_budgets.md)：當您想要限制的支出是依成本中心而非一組模型時
- [團隊預算](team_budgets.md)：當支出是依呼叫者追蹤時
