# [BETA] OpenID Connect (OIDC) {#beta-openid-connect-oidc}
LiteLLM 支援使用 OpenID Connect (OIDC) 來進行上游服務的驗證。這可讓您避免在設定檔中儲存敏感憑證。

:::info

此功能為 Beta 版

:::

## OIDC 身分提供者 (IdP) {#oidc-identity-provider-idp}

LiteLLM 支援以下 OIDC 身分提供者：

| 提供者                 | 設定名稱  | 自訂 Audience |
| -------------------------| ------------ | ---------------- |
| Google Cloud Run         | `google`     | 是              |
| CircleCI v1              | `circleci`   | 否               |
| CircleCI v2              | `circleci_v2`| 否               |
| GitHub Actions           | `github`     | 是              |
| Azure Kubernetes Service | `azure`      | 否               |
| Azure AD                 | `azure`      | 是               |
| File                     | `file`       | 否               |
| Environment Variable     | `env`        | 否               |
| Environment Path         | `env_path`   | 否               |

如果您想使用不同的 OIDC 提供者，請在 GitHub 上開啟 issue。

:::tip

除非您非常清楚自己在做什麼，而且確定沒有其他提供者能滿足您的使用案例，否則請不要使用 `file`、`env` 或 `env_path` 提供者。提示：它們很可能可以。

:::

## OIDC Connect 倚賴方 (RP) {#oidc-connect-relying-party-rp}

LiteLLM 支援以下 OIDC 倚賴方 / 用戶端：

- Amazon Bedrock
- Azure OpenAI
- _(即將推出) Google Cloud Vertex AI_

### 設定 OIDC {#configuring-oidc}

凡是可以使用密鑰的地方，都可以直接改用 OIDC。一般格式如下：

```
oidc/config_name_here/audience_here
```

對於不使用 `audience` 參數的提供者，您可以（也應該）省略它：

```
oidc/config_name_here/
```

#### 非官方提供者（不建議） {#unofficial-providers-not-recommended}

對於非官方的 `file` 提供者，您可以使用以下格式
（請注意雙斜線 —— `oidc/file/` 後面的路徑必須是絕對路徑）：

```
oidc/file//var/run/secrets/my-token
```

為了安全起見，解析後的路徑必須位於允許的憑證
目錄內。預設允許以下目錄：

- `/var/run/secrets`
- `/run/secrets`

如果您的部署將憑證掛載到其他位置，請將
`LITELLM_OIDC_ALLOWED_CREDENTIAL_DIRS` 環境變數設定為以逗號分隔的絕對目錄清單。該值會取代
預設清單，因此如果您仍需要預設目錄，請將其一併包含：

```bash
export LITELLM_OIDC_ALLOWED_CREDENTIAL_DIRS="/var/run/secrets,/etc/litellm/creds"
```

解析後（在跟隨符號連結和 `..` 之後）位於
允許清單之外的路徑會被拒絕。

對於非官方的 `env`，請使用以下格式，其中 `SECRET_TOKEN` 是包含權杖的環境變數名稱：

```
oidc/env/SECRET_TOKEN
```

對於非官方的 `env_path`，請使用以下格式，其中 `SECRET_TOKEN` 是包含權杖檔案路徑的環境變數名稱：

```
oidc/env_path/SECRET_TOKEN
```

:::tip

如果您想使用 oidc/env_path/AZURE_FEDERATED_TOKEN_FILE，請不要這麼做。請改用 `oidc/azure/`，這樣可確保即使 Azure 變更其 OIDC 設定和／或新增功能，LiteLLM 仍能持續支援。

:::

## 範例 {#examples}

### Google Cloud Run -> Amazon Bedrock {#google-cloud-run---amazon-bedrock}

```yaml
model_list:
  - model_name: claude-3-haiku-20240307
    litellm_params:
      model: bedrock/anthropic.claude-3-haiku-20240307-v1:0
      aws_region_name: us-west-2
      aws_session_name: "litellm"
      aws_role_name: "arn:aws:iam::YOUR_THING_HERE:role/litellm-google-demo"
      aws_web_identity_token: "oidc/google/https://example.com"
```

### CircleCI v2 -> Amazon Bedrock {#circleci-v2---amazon-bedrock}

```yaml
model_list:
  - model_name: command-r
    litellm_params:
      model: bedrock/cohere.command-r-v1:0
      aws_region_name: us-west-2
      aws_session_name: "my-test-session"
      aws_role_name: "arn:aws:iam::335785316107:role/litellm-github-unit-tests-circleci"
      aws_web_identity_token: "oidc/example-provider/"
```

#### CircleCI v2 的 Amazon IAM 角色設定 -> Bedrock {#amazon-iam-role-configuration-for-circleci-v2---bedrock}

以下設定僅為範例。您應依照您的特定使用案例調整權限與信任關係。

權限：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
                "arn:aws:bedrock:*::foundation-model/cohere.command-r-v1:0"
            ]
        }
    ]
}
```

請參閱 https://docs.aws.amazon.com/bedrock/latest/userguide/security_iam_id-based-policy-examples.html 以取得更多範例。 

信任關係：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::335785316107:oidc-provider/oidc.circleci.com/org/c5a99188-154f-4f69-8da2-b442b1bf78dd"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "oidc.circleci.com/org/c5a99188-154f-4f69-8da2-b442b1bf78dd:aud": "c5a99188-154f-4f69-8da2-b442b1bf78dd"
                },
                "ForAnyValue:StringLike": {
                    "oidc.circleci.com/org/c5a99188-154f-4f69-8da2-b442b1bf78dd:sub": [
                        "org/c5a99188-154f-4f69-8da2-b442b1bf78dd/project/*/user/*/vcs-origin/github.com/BerriAI/litellm/vcs-ref/refs/heads/main",
                        "org/c5a99188-154f-4f69-8da2-b442b1bf78dd/project/*/user/*/vcs-origin/github.com/BerriAI/litellm/vcs-ref/refs/heads/litellm_*"
                    ]
                }
            }
        }
    ]
}
```

此信任關係將 CircleCI 限制為只能在 main 分支，以及以 `litellm_` 開頭的分支上承擔該角色。

對於 CircleCI（v1 和 v2），您還需要在 AWS IAM 設定中新增貴組織的 OIDC 提供者。請參閱 https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html 以取得更多資訊。

:::tip

您 _絕不_ 應該需要建立 IAM 使用者。如果您真的建立了，那代表您沒有正確使用 OIDC。您應該只建立一個具有權限且與您的 OIDC 提供者建立信任關係的角色。

:::

### Google Cloud Run -> Azure OpenAI {#google-cloud-run---azure-openai}

```yaml
model_list:
  - model_name: gpt-4o-2024-05-13
    litellm_params:
      model: azure/gpt-4o-2024-05-13
      azure_ad_token: "oidc/google/https://example.com"
      api_version: "2024-06-01"
      api_base: "https://demo-here.openai.azure.com"
    model_info:
      base_model: azure/gpt-4o-2024-05-13
```

對於 Azure OpenAI，您需要在環境中定義 `AZURE_CLIENT_ID`、`AZURE_TENANT_ID`，以及選填的 `AZURE_AUTHORITY_HOST`。

```bash
export AZURE_CLIENT_ID="91a43c21-cf21-4f34-9085-331015ea4f91" # Azure AD Application (Client) ID
export AZURE_TENANT_ID="f3b1cf79-eba8-40c3-8120-cb26aca169c2" # Will be the same across of all your Azure AD applications
export AZURE_AUTHORITY_HOST="https://login.microsoftonline.com" # 👈 Optional, defaults to "https://login.microsoftonline.com"
```

:::tip

您可以前往 `https://login.microsoftonline.com/YOUR_DOMAIN_HERE/v2.0/.well-known/openid-configuration`，並在 `issuer` 欄位中尋找 UUID，以找出 `AZURE_CLIENT_ID`。

:::

:::tip

除非您需要覆寫預設值，否則不要在環境中設定 `AZURE_AUTHORITY_HOST`。這樣一來，如果未來預設值變更，您就不需要更新環境。

:::

:::tip

預設情況下，Azure AD 應用程式使用的 audience 為 `api://AzureADTokenExchange`。我們建議將 audience 設定為更符合您應用程式的特定值。

:::

#### Azure AD 應用程式設定 {#azure-ad-application-configuration}

很遺憾，Azure 的設定比 AWS 等其他 OIDC 倚賴方稍微複雜一些。基本上，您必須：

1. 建立 Azure 應用程式。
2. 為您使用的 OIDC IdP（例如 Google Cloud Run）新增 federated credential。
3. 將 Azure 應用程式新增至包含 Azure OpenAI 資源的 resource group。
4. 授予 Azure 應用程式存取 Azure OpenAI 資源所需的角色。

以下的自訂角色是 Azure 應用程式存取 Azure OpenAI 資源的建議最低權限。您應調整權限以符合您的特定使用案例。

```json
{
    "id": "/subscriptions/24ebb700-ec2f-417f-afad-78fe15dcc91f/providers/Microsoft.Authorization/roleDefinitions/baf42808-99ff-466d-b9da-f95bb0422c5f",
    "properties": {
        "roleName": "invoke-only",
        "description": "",
        "assignableScopes": [
            "/subscriptions/24ebb700-ec2f-417f-afad-78fe15dcc91f/resourceGroups/your-openai-group-name"
        ],
        "permissions": [
            {
                "actions": [],
                "notActions": [],
                "dataActions": [
                    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/audio/action",
                    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/search/action",
                    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/completions/action",
                    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/chat/completions/action",
                    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/extensions/chat/completions/action",
                    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/embeddings/action",
                    "Microsoft.CognitiveServices/accounts/OpenAI/images/generations/action"
                ],
                "notDataActions": []
            }
        ]
    }
}
```

_註：您的 UUID 會不同。_

如果您需要協助設定 Azure AD 應用程式，請聯絡我們取得付費企業支援。

### Azure AD -> Amazon Bedrock {#azure-ad---amazon-bedrock}
```yaml
model list:
  - model_name: aws/claude-3-5-sonnet
    litellm_params:
      model: bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0
      aws_region_name: "eu-central-1"
      aws_role_name: "arn:aws:iam::12345678:role/bedrock-role"
      aws_web_identity_token: "oidc/azure/api://123-456-789-9d04"
      aws_session_name: "litellm-session"
```
