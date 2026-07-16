import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AWS Secret Manager {#aws-secret-manager}

:::info

✨ **這是一項企業功能**

[企業定價](https://www.litellm.ai/#pricing)

[請點此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

將您的 proxy 金鑰儲存在 AWS Secret Manager 中。

| 功能 | 支援 | 說明 |
|---------|----------|-------------|
| 讀取 Secrets | ✅ | 讀取 secrets，例如 `OPENAI_API_KEY` |
| 寫入 Secrets | ✅ | 儲存 secrets，例如 `Virtual Keys` |

## Proxy 使用方式 {#proxy-usage}

1. 將 AWS 憑證儲存在您的環境中
```bash
os.environ["AWS_ACCESS_KEY_ID"] = ""  # Access key
os.environ["AWS_SECRET_ACCESS_KEY"] = "" # Secret access key
os.environ["AWS_REGION_NAME"] = "" # us-east-1, us-east-2, us-west-1, us-west-2
```

2. 在設定中啟用 AWS Secret Manager。 

<Tabs>
<TabItem value="read_only" label="從 AWS Secret Manager 讀取金鑰">

```yaml
general_settings:
  master_key: os.environ/litellm_master_key 
  key_management_system: "aws_secret_manager" # 👈 KEY CHANGE
  key_management_settings: 
    hosted_keys: ["litellm_master_key"] # 👈 Specify which env keys you stored on AWS 

```

</TabItem>

<TabItem value="write_only" label="將虛擬金鑰寫入 AWS Secret Manager">

這將只會將虛擬金鑰儲存在 AWS Secret Manager 中。不會從 AWS Secret Manager 讀取任何金鑰。

```yaml
general_settings:
  key_management_system: "aws_secret_manager" # 👈 KEY CHANGE
  key_management_settings: 
    store_virtual_keys: true # OPTIONAL. Defaults to False, when True will store virtual keys in secret manager
    prefix_for_stored_virtual_keys: "litellm/" # OPTIONAL. If set, this prefix will be used for stored virtual keys in the secret manager
    access_mode: "write_only" # Literal["read_only", "write_only", "read_and_write"]
    description: "litellm virtual key" # OPTIONAL, if set will set this as the description for all virtual keys
    tags: # OPTIONAL, if set will set this as the tags for all virtual keys
      Environment: "Prod"
      Owner: "AI Platform team"
```
</TabItem>
<TabItem value="read_and_write" label="使用 AWS Secret Manager 讀取 + 寫入金鑰">

```yaml
general_settings:
  master_key: os.environ/litellm_master_key 
  key_management_system: "aws_secret_manager" # 👈 KEY CHANGE
  key_management_settings: 
    store_virtual_keys: true # OPTIONAL. Defaults to False, when True will store virtual keys in secret manager
    prefix_for_stored_virtual_keys: "litellm/" # OPTIONAL. If set, this prefix will be used for stored virtual keys in the secret manager
    access_mode: "read_and_write" # Literal["read_only", "write_only", "read_and_write"]
    hosted_keys: ["litellm_master_key"] # OPTIONAL. Specify which env keys you stored on AWS
```

</TabItem>
</Tabs>

3. 執行 proxy

```bash
litellm --config /path/to/config.yaml
```

## 在 1 個 AWS Secret 中使用 K/V 配對 {#using-kv-pairs-in-1-aws-secret}

您可以使用 `primary_secret_name` 參數從單一 AWS Secret 讀取多個金鑰：

```yaml
general_settings:
  key_management_system: "aws_secret_manager"
  key_management_settings:
    hosted_keys: [
      "OPENAI_API_KEY_MODEL_1",
      "OPENAI_API_KEY_MODEL_2",
    ]
    primary_secret_name: "litellm_secrets" # 👈 Read multiple keys from one JSON secret
```

`primary_secret_name` 可讓您將單一 AWS Secret 中的多個金鑰作為 JSON 物件讀取。例如，「litellm_secrets」將包含：

```json
{
  "OPENAI_API_KEY_MODEL_1": "sk-key1...",
  "OPENAI_API_KEY_MODEL_2": "sk-key2..."
}
```

這可減少您需要管理的 AWS Secrets 數量。

## IAM 角色假設 {#iam-role-assumption}

使用 IAM 角色取代靜態 AWS 憑證，以提升安全性。

### 基本 IAM 角色 {#basic-iam-role}

```yaml
general_settings:
  key_management_system: "aws_secret_manager"
  key_management_settings:
    store_virtual_keys: true
    aws_region_name: "us-east-1"
    aws_role_name: "arn:aws:iam::123456789012:role/LiteLLMSecretManagerRole"
    aws_session_name: "litellm-session"
```

### 跨帳戶存取 {#cross-account-access}

```yaml
general_settings:
  key_management_system: "aws_secret_manager"
  key_management_settings:
    store_virtual_keys: true
    aws_region_name: "us-east-1"
    aws_role_name: "arn:aws:iam::999999999999:role/CrossAccountRole"
    aws_external_id: "unique-external-id"
```

### 搭配 IRSA 的 EKS {#eks-with-irsa}

```yaml
general_settings:
  key_management_system: "aws_secret_manager"
  key_management_settings:
    store_virtual_keys: true
    aws_region_name: "us-east-1"
    aws_role_name: "arn:aws:iam::123456789012:role/LiteLLMServiceAccountRole"
    aws_web_identity_token: "os.environ/AWS_WEB_IDENTITY_TOKEN_FILE"
```

### 設定參數 {#configuration-parameters}

| 參數 | 說明 |
|-----------|-------------|
| `aws_region_name` | AWS 區域 |
| `aws_role_name` | 要假設的 IAM 角色 ARN |
| `aws_session_name` | 工作階段名稱（選用） |
| `aws_external_id` | 跨帳戶用的外部 ID |
| `aws_profile_name` | 來自 `~/.aws/credentials` 的 AWS 設定檔 |
| `aws_web_identity_token` | IRSA 的 OIDC token 路徑 |
| `aws_sts_endpoint` | VPC 的自訂 STS 端點 |
