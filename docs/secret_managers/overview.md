import Image from '@theme/IdealImage';

# Secret Managers 總覽 {#secret-managers-overview}

:::info

✨ **這是一項企業版功能**

[企業版定價](https://www.litellm.ai/#pricing)

[請在此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

LiteLLM 支援從 Azure Key Vault、Google Secret Manager、Hashicorp Vault、CyberArk Conjur，以及 AWS Secret Manager **讀取密鑰（例如 `OPENAI_API_KEY`）**，以及**寫入密鑰（例如虛擬金鑰）**。

## 支援的 Secret Manager {#supported-secret-managers}

- [AWS Key Management Service](./aws_kms)
- [AWS Secret Manager](./aws_secret_manager)
- [Azure Key Vault](./azure_key_vault)
- [CyberArk Conjur](./cyberark)
- [Google Secret Manager](./google_secret_manager)
- [Google Key Management Service](./google_kms)
- [Hashicorp Vault](./hashicorp_vault)

## 所有 Secret Manager 設定 {#all-secret-manager-settings}

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

## 團隊層級 Secret Manager 設定 {#team-level-secret-manager-settings}

團隊層級的 secret manager 設定可讓每個團隊帶入自己的金鑰管理設定。這些設定會在建立與該團隊綁定的虛擬金鑰時使用。

請依照以下步驟進行設定：

1. **建立團隊**  
   開啟 Teams 頁面並點擊 `Create Team` 以開啟對話框。  

   <Image img={require('../../img/secret_manager_settings_create_team.png')} />

2. **展開進階設定**  
   使用 `Additional Settings` 切換開關來顯示進階設定面板。  
   
  <Image img={require('../../img/secret_manager_settings_additional_settings.png')} />

3. **設定 Secret Manager**  
   在 `Secret Manager Settings` 面板中，貼上特定提供者的 JSON。請參考各提供者頁面（AWS、Azure、Google、Hashicorp 等）以了解支援的鍵／值。現階段必須使用 JSON，但我們計畫新增更符合 UI 使用習慣的編輯器。  
   
   <Image img={require('../../img/secret_manager_settings.png')} />

4. **建立團隊**  
   檢查輸入內容並點擊 `Create Team` 以儲存。  
   
   <Image img={require('../../img/secret_manager_settings_create_button.png')} />

儲存後，LiteLLM 會使用此設定。
