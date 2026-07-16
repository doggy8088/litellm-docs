# AWS 金鑰管理 V1 {#aws-key-management-v1}

:::info

✨ **這是企業版功能**

[企業定價](https://www.litellm.ai/#pricing)

[在此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

:::tip

[BETA] AWS 金鑰管理 v2 位於企業方案。請 [前往此處查看文件](../enterprise.md#beta-aws-key-manager---key-decryption)

:::

使用 AWS KMS 在環境中儲存您的 Proxy Master Key 的雜湊副本。 

```bash
export LITELLM_MASTER_KEY="djZ9xjVaZ..." # 👈 ENCRYPTED KEY
export AWS_REGION_NAME="us-west-2"
```

```yaml
general_settings:
  key_management_system: "aws_kms"
  key_management_settings:
    hosted_keys: ["LITELLM_MASTER_KEY"] # 👈 WHICH KEYS ARE STORED ON KMS
```

[**查看解密程式碼**](https://github.com/BerriAI/litellm/blob/a2da2a8f168d45648b61279d4795d647d94f90c9/litellm/utils.py#L10182)
