import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 用於支出追蹤的請求標籤 {#request-tags-for-spend-tracking}

在模型部署上新增標籤，以依環境、AWS 帳戶或任何自訂標籤來追蹤支出。

標籤會出現在 LiteLLM 支出記錄的 `request_tags` 欄位中。

:::info 需求
必須先設定 Virtual Keys 與資料庫。請參閱 [Virtual Keys 設定](./virtual_keys.md)。
:::

## 設定 {#config-setup}

在 `config.yaml` 中為模型部署設定標籤：

```yaml title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-prod
      api_key: os.environ/AZURE_PROD_API_KEY
      api_base: https://prod.openai.azure.com/
      tags: ["AWS_IAM_PROD"]  # 👈 Tag for production

  - model_name: gpt-4-dev
    litellm_params:
      model: azure/gpt-4-dev
      api_key: os.environ/AZURE_DEV_API_KEY
      api_base: https://dev.openai.azure.com/
      tags: ["AWS_IAM_DEV"]  # 👈 Tag for development
```

## 發出請求 {#make-request}

### 選項 1：使用設定標籤（自動） {#option-1-use-config-tags-automatic}

請求只需指定模型——標籤會自動從設定套用：

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 選項 2：使用 `x-litellm-tags` 標頭 {#option-2-use-x-litellm-tags-header}

透過 `x-litellm-tags` 標頭動態傳入標籤，以逗號分隔字串表示：

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -H 'x-litellm-tags: team-api,production,us-east-1' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

格式：逗號分隔字串（空白會自動去除）： `"tag1,tag2,tag3"`

### 選項 3：使用請求本文 `tags` {#option-3-use-request-body-tags}

直接在請求本文中傳入標籤。支援兩種格式：

<Tabs>
<TabItem value="direct" label="直接 tags 欄位">

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "tags": ["team-api", "production", "us-east-1"]
  }'
```

</TabItem>

<TabItem value="metadata" label="巢狀中繼資料">

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {
      "tags": ["team-api", "production", "us-east-1"]
    }
  }'
```

</TabItem>
</Tabs>

`tags` 欄位必須是字串陣列。

:::info
當透過標頭或請求本文提供標籤時，會覆寫模型部署中設定的任何標籤。如果同時提供標頭與本文標籤，會以本文標籤為優先。
:::

## 在金鑰或團隊上設定標籤 {#set-tags-on-keys-or-teams}

您也可以在 API 金鑰或團隊層級設定預設標籤：

<Tabs>
<TabItem value="key" label="在金鑰上設定">

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "tags": ["customer-acme", "tier-premium"]
    }
  }'
```

</TabItem>
<TabItem value="team" label="在團隊上設定">

```bash
curl -L -X POST 'http://0.0.0.0:4000/team/new' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "metadata": {
      "tags": ["team-engineering", "department-ai"]
    }
  }'
```

</TabItem>
</Tabs>

## 進階：自訂標頭追蹤 {#advanced-custom-header-tracking}

只要將任何自訂標頭加入設定，即可用來追蹤支出：

```yaml
litellm_settings:
  extra_spend_tag_headers:
    - "x-custom-header"
    - "x-customer-id"
```

**停用 User-Agent 追蹤：**

```yaml
litellm_settings:
  disable_add_user_agent_to_request_tags: true
```

## 支出記錄 {#spend-logs}

模型設定中的標籤會出現在 `LiteLLM_SpendLogs`：

```json
{
  "request_id": "chatcmpl-abc123",
  "request_tags": ["AWS_IAM_PROD"],
  "spend": 0.002,
  "model": "gpt-4"
}
```

## 相關內容 {#related}

- [支出追蹤總覽](cost_tracking.md) - 使用標籤追蹤支出的完整教學
- [標籤預算](tag_budgets.md) - 依標籤設定預算上限
- [Virtual Keys 設定](virtual_keys.md) - 標籤追蹤所需
