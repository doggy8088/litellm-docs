import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 每個團隊/專案的憑證路由 {#per-teamproject-credential-routing}

根據提出請求的團隊或專案，將相同模型路由到不同的 LLM 提供者端點（例如不同的 Azure 執行個體）。

## 概覽 {#overview}

在多租戶部署中，不同團隊通常需要相同的模型名稱（例如 `{{openai_large}}`）對應到不同的提供者端點，例如為了成本隔離、資料駐留或速率限制分離，而讓各事業單位使用不同的 Azure OpenAI 執行個體。

**憑證路由** 可讓您透過現有的 [credentials table](./model_management.md#reusable-provider-credentials) 在團隊/專案中繼資料中進行這項設定，而不需要重複定義模型或為每個團隊建立獨立的模型群組。

```
Hotel Team → {{openai_large}} → https://hotel-eastus.openai.azure.com/
Flight Team → {{openai_large}} → https://flight-centralus.openai.azure.com/
```

### 優先順序鏈 {#precedence-chain}

當請求進來時，系統會依照這個優先順序鏈逐一查找（第一個符合者優先）：

1. **用戶端憑證** — 在請求本文中傳入的 `api_base`/`api_key`（[文件](./clientside_auth.md)）
2. **專案模型特定** — 專案的 `model_config` 中針對此確切模型的覆寫
3. **專案預設** — 專案的 `defaultconfig` 中的 `model_config`
4. **團隊模型特定** — 團隊的 `model_config` 中針對此確切模型的覆寫
5. **團隊預設** — 團隊的 `defaultconfig` 中的 `model_config`
6. **部署預設** — 在 `litellm_params` 中設定的模型 `config.yaml`

## 快速入門 {#quick-start}

### 步驟 1：建立憑證 {#step-1-create-credentials}

將您的 Azure 端點憑證儲存在憑證表中。您可以透過 [UI](./model_management.md#reusable-provider-credentials) 或 API 來完成：

```bash showLineNumbers
# Create credential for Hotel team's Azure endpoint
curl -X POST 'http://0.0.0.0:4000/credentials' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "credential_name": "hotel-azure-eastus",
    "credential_values": {
        "api_base": "https://hotel-eastus.openai.azure.com/",
        "api_key": "sk-azure-hotel-key-xxx"
    }
}'
```

```bash showLineNumbers
# Create credential for Flight team's Azure endpoint
curl -X POST 'http://0.0.0.0:4000/credentials' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "credential_name": "flight-azure-centralus",
    "credential_values": {
        "api_base": "https://flight-centralus.openai.azure.com/",
        "api_key": "sk-azure-flight-key-xxx"
    }
}'
```

### 步驟 2：在團隊上設定 `model_config` {#step-2-set-model_config-on-teams}

在團隊的中繼資料中新增一個 `model_config` 金鑰，並以名稱參照該憑證：

```bash showLineNumbers
# Hotel team — default Azure endpoint for all models
curl -X POST 'http://0.0.0.0:4000/team/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "team_id": "hotel-team-id",
    "metadata": {
        "model_config": {
            "defaultconfig": {
                "azure": {
                    "litellm_credentials": "hotel-azure-eastus"
                }
            }
        }
    }
}'
```

```bash showLineNumbers
# Flight team — default Azure endpoint for all models
curl -X POST 'http://0.0.0.0:4000/team/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "team_id": "flight-team-id",
    "metadata": {
        "model_config": {
            "defaultconfig": {
                "azure": {
                    "litellm_credentials": "flight-azure-centralus"
                }
            }
        }
    }
}'
```

### 步驟 3：發出請求 {#step-3-make-requests}

請求會根據 API 金鑰所屬的團隊，自動路由到正確的 Azure 端點：

```bash showLineNumbers
# Request using Hotel team's API key → routes to hotel-eastus.openai.azure.com
curl http://localhost:4000/v1/chat/completions \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-hotel-team-key' \
-d '{"model": "{{openai_large}}", "messages": [{"role": "user", "content": "Hello"}]}'

# Request using Flight team's API key → routes to flight-centralus.openai.azure.com
curl http://localhost:4000/v1/chat/completions \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-flight-team-key' \
-d '{"model": "{{openai_large}}", "messages": [{"role": "user", "content": "Hello"}]}'
```

## 模型層級覆寫 {#per-model-overrides}

您可以為特定模型設定不同的憑證，同時保留其他所有項目的預設值：

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/team/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "team_id": "hotel-team-id",
    "metadata": {
        "model_config": {
            "defaultconfig": {
                "azure": {
                    "litellm_credentials": "hotel-azure-eastus"
                }
            },
            "{{openai_large}}": {
                "azure": {
                    "litellm_credentials": "hotel-azure-westus"
                }
            }
        }
    }
}'
```

有了這個設定：
- `{{openai_large}}` 請求 → `hotel-azure-westus` 憑證（模型特定）
- 其他所有模型 → `hotel-azure-eastus` 憑證（預設）

## 專案層級覆寫 {#project-level-overrides}

專案會繼承其團隊的 `model_config`，但可以在專案層級覆寫。專案覆寫的優先順序高於團隊覆寫。

```bash showLineNumbers
# Project overrides the team default for all models
curl -X POST 'http://0.0.0.0:4000/project/update' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "project_id": "hotel-rec-app-id",
    "metadata": {
        "model_config": {
            "defaultconfig": {
                "azure": {
                    "litellm_credentials": "hotel-rec-azure"
                }
            },
            "gpt-4-vision": {
                "azure": {
                    "litellm_credentials": "hotel-rec-vision"
                }
            }
        }
    }
}'
```

### 完整範例：具有兩個專案的飯店團隊 {#full-example-hotel-team-with-two-projects}

**設定：**
- **Hotel Team**：預設 `hotel-azure-eastus`，`{{openai_large}}` 覆寫為 `hotel-azure-westus`
- **Hotel Rec App**（專案）：預設 `hotel-rec-azure`，GPT-4-Vision 覆寫為 `hotel-rec-vision`
- **Hotel Review App**（專案）：沒有覆寫，繼承團隊設定

**解析：**

| 請求 | 解析後的憑證 | 原因 |
|---|---|---|
| Hotel Rec App → `gpt-5.6-terra` | `hotel-rec-azure` | 專案預設（沒有符合 gpt-5.6-terra 的專案模型特定匹配） |
| Hotel Rec App → `gpt-4-vision` | `hotel-rec-vision` | 專案模型特定 |
| Hotel Review App → `gpt-3.5` | `hotel-azure-eastus` | 團隊預設（沒有專案設定） |
| Hotel Review App → `gpt-5.6-terra` | `hotel-azure-westus` | 團隊模型特定 |

## `model_config` 結構 {#model_config-schema}

`model_config` 金鑰是團隊/專案 `metadata` 中的一個 JSON 物件：

```json
{
    "model_config": {
        "defaultconfig": {
            "<provider>": {
                "litellm_credentials": "<credential-name>"
            }
        },
        "<model-name>": {
            "<provider>": {
                "litellm_credentials": "<credential-name>"
            }
        }
    }
}
```

| 欄位 | 說明 |
|---|---|
| `defaultconfig` | 未明確列出的任何模型的備援憑證 |
| `<model-name>` | 模型特定覆寫——必須與 LiteLLM 模型群組名稱相符 |
| `<provider>` | 提供者金鑰（例如 `azure`、`openai`、`bedrock`）。當模型名稱包含提供者前綴時（例如 `azure/gpt-4`），系統會優先使用相符的提供者金鑰 |
| `litellm_credentials` | [credentials table](./model_management.md#reusable-provider-credentials) 中某個憑證的名稱 |

### 憑證值 {#credential-values}

被參照的憑證可以包含以下任意組合：

| 金鑰 | 說明 |
|---|---|
| `api_base` | 提供者端點 URL |
| `api_key` | 提供者的 API 金鑰 |
| `api_version` | API 版本（例如 Azure） |

只會套用憑證中存在的金鑰。請求中已存在的金鑰（例如用戶端 `api_version`）絕不會被覆寫。

## 啟用此功能 {#enabling-the-feature}

此功能預設為**停用**，必須明確啟用。若要啟用：

<Tabs>

<TabItem value="config" label="config.yaml">

```yaml
litellm_settings:
    enable_model_config_credential_overrides: true
```

</TabItem>

<TabItem value="env" label="Environment Variable">

```bash
export LITELLM_ENABLE_MODEL_CONFIG_CREDENTIAL_OVERRIDES=true
```

</TabItem>

</Tabs>

:::info
在團隊/專案中繼資料內的 `model_config` 項目生效之前，必須先啟用功能旗標。若未啟用，憑證路由會完全不運作：不會讀取任何中繼資料，也不會解析任何憑證。
:::

## 相關文件 {#related-documentation}

- [新增 LLM 憑證](./model_management.md#reusable-provider-credentials) — 建立並管理可重複使用的憑證
- [專案管理](./project_management.md) — 專案階層與 API
- [團隊預算](./team_budgets.md) — 團隊層級的預算管理
- [用戶端 LLM 憑證](./clientside_auth.md) — 在請求本文中傳遞憑證
- [憑證使用追蹤](./credential_usage_tracking.md) — 依憑證追蹤支出
