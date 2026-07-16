# 密鑰管理程式概覽 {#secret-managers-overview}

:::info

✨ **這是企業版功能**

[企業版定價](https://www.litellm.ai/#pricing)

[點此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

LiteLLM 支援**讀取密鑰（例如 `OPENAI_API_KEY`）**以及**寫入密鑰（例如 Virtual Keys）**，來源包括 Azure Key Vault、Google Secret Manager、Hashicorp Vault、CyberArk Conjur，以及 AWS Secret Manager。

## 支援的密鑰管理程式 {#supported-secret-managers}

- [AWS 金鑰管理服務](./secret_managers/aws_kms)
- [AWS Secret Manager](./secret_managers/aws_secret_manager)
- [Azure Key Vault](./secret_managers/azure_key_vault)
- [CyberArk Conjur](./secret_managers/cyberark)
- [Google Secret Manager](./secret_managers/google_secret_manager)
- [Google 金鑰管理服務](./secret_managers/google_kms)
- [Hashicorp Vault](./secret_managers/hashicorp_vault)

## 所有密鑰管理程式設定 {#all-secret-manager-settings}

所有與密鑰管理相關的設定

```yaml
general_settings:
  key_management_system: "aws_secret_manager" # REQUIRED
  key_management_settings:  

    # Storing Virtual Keys Settings
    store_virtual_keys: true # OPTIONAL. Defaults to False, when True will store virtual keys in secret manager
    prefix_for_stored_virtual_keys: "litellm/" # OPTIONAL.I f set, this prefix will be used for stored virtual keys in the secret manager
    
    # Access Mode Settings
    access_mode: "write_only" # OPTIONAL. Literal["read_only", "write_only", "read_and_write"]. Defaults to "read_only"
    
    # Hosted Keys Settings
    hosted_keys: ["litellm_master_key"] # OPTIONAL. Specify which env keys you stored on AWS

    # K/V pairs in 1 AWS Secret Settings
    primary_secret_name: "litellm_secrets" # OPTIONAL. Read multiple keys from one JSON secret on AWS Secret Manager
```
