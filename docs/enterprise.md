# ✨ 企業版 {#-enterprise}

:::info

新加入嗎？請從 [Enterprise Quickstart](/docs/learn/enterprise_quickstart) 開始。您也可以開始 [30 天試用](https://www.litellm.ai/enterprise#trial) 或 [預約示範](https://enterprise.litellm.ai/demo)。

:::

## Enterprise 適用於誰？ {#who-is-enterprise-for}

適用於大規模使用 LiteLLM 的團隊（100+ 使用者或 10+ 個正式上線的 AI 使用案例），且在 OSS 之上還需要 SSO、稽核記錄、細粒度存取控制與專業支援。SSO 最多 5 位使用者免費。超過之後則需要企業授權。不確定您是否符合資格嗎？[聯絡我們](https://enterprise.litellm.ai/demo)。

## 為什麼選擇 Enterprise？ {#why-enterprise}

LiteLLM OSS 已經涵蓋基本功能：相容 OpenAI 的閘道、虛擬金鑰、支出追蹤、預算、備援，以及請求/回應記錄。Enterprise 則新增大型組織安全地讓數百位使用者與數十個應用程式存取 LLM 所需的控管功能。

<div className="enterprise-compare">

<div className="enterprise-compare-head">
<span></span>
<span>OSS</span>
<span>Enterprise</span>
</div>

<div>
<strong>驗證</strong>
<span>Master key、<a href="./proxy/ui#4-sign-in-for-the-first-time"><code>UI_USERNAME</code> 與 <code>UI_PASSWORD</code></a></span>
<span>SSO + SCIM、OIDC/JWT</span>
</div>

<div>
<strong>金鑰管理</strong>
<span>跨 LLM APIs、MCPs 與 Agents 的虛擬金鑰、使用者、團隊</span>
<span>組織、組織/團隊管理員、委派管理角色</span>
</div>

<div>
<strong>安全性</strong>
<span>Master key、虛擬金鑰，以及 [master key rotation](./proxy/master_key_rotations)</span>
<span>虛擬金鑰輪替、對 secret manager 的讀/寫、[IP allowlists](./proxy/ip_address)、[public and private route controls](./proxy/public_routes)</span>
</div>

<div>
<strong>防護欄</strong>
<span>永遠啟用 / 依請求啟用。包含自訂防護欄與 Presidio（PII 遮罩）。內建 moderation callbacks 需要授權；請參閱<a href="#guardrails-oss-vs-enterprise">下方附註</a>。</span>
<span>以金鑰與團隊為範圍的防護欄</span>
</div>

<div>
<strong>記錄</strong>
<span>請求/回應記錄、Prometheus 指標</span>
<span>依金鑰 / 依團隊路由至 Langfuse、Langsmith、Arize 等。管理作業記錄</span>
</div>

<div>
<strong>部署</strong>
<span>單一區域 proxy</span>
<span>單一授權下的<a href="./proxy/multi_region">多區域部署</a>，admin/worker 分離</span>
</div>

</div>

## 功能 {#features}

### 安全性與存取 {#security-and-access}

- **[Admin UI 的 SSO](./proxy/admin_ui_sso.md)**。Okta、Azure AD、Google Workspace，以及任何 OIDC/SAML 提供者
- **[基於 JWT 的驗證](./proxy/token_auth.md)**。使用您身分提供者的 token 驗證請求
- **[具保留政策的稽核記錄](./proxy/multiple_admins.md)**。追蹤每一個管理動作與金鑰層級變更
- **[以角色為基礎的存取控制](./proxy/access_control.md)**。組織、團隊與使用者角色
- **[公開與私有路由控制](./proxy/public_routes.md)**。限制管理路由並鎖定攻擊面
- **[基於 IP 位址的存取控制清單](./proxy/ip_address.md)**。將 proxy 存取限制在特定 CIDR 範圍
- **[金鑰輪替](./proxy/virtual_keys.md#-key-rotations)**。自動化虛擬金鑰輪替
- **[密鑰管理工具](./secret_managers/overview.md)**。AWS KMS、AWS Secrets Manager、Azure Key Vault、Google KMS、Google Secret Manager、HashiCorp Vault、CyberArk，或自訂密鑰管理工具
- **[AI Hub](./proxy/ai_hub.md)**。分享可用模型、MCP servers、agents 與 skills 的公開品牌頁面

### 治理與成本 {#governance-and-cost}

- **[多租戶架構](./proxy/multi_tenant_architecture.md)**。組織、團隊、專案與金鑰
- **[專案管理](./proxy/project_management.md)**。依應用程式或使用案例分組金鑰，並具備預算、擁有者、速率限制、模型 allowlist，以及隔離的支出檢視。請參閱 [UI walkthrough](./proxy/ui_project_management.md)
- **[基於標籤的預算](./proxy/provider_budget_routing.md)**。依自訂標籤進行預算與支出追蹤
- **[每個虛擬金鑰的特定模型預算](./proxy/users.md)**。每個模型、每個金鑰都有不同限制
- **[暫時性預算增加](./proxy/temporary_budget_increase.md)**。有時限的支出提升，不做永久變更
- **[預算接近上限的電子郵件警示](./proxy/ui_team_soft_budget_alerts.md)**。在團隊觸及硬性上限前發出警告
- **[產生支出報表](./proxy/cost_tracking.md#-enterprise-generate-spend-reports)**。以金鑰、團隊、標籤或模型為單位取得支出資料的程式化存取

### 可觀測性與合規 {#observability-and-compliance}

- **[以團隊為基礎的記錄](./proxy/team_logging.md)**。將每個團隊的記錄路由至其各自的 Langfuse 專案或 callback
- **[依團隊停用記錄](./proxy/team_logging.md#disable-logging-for-a-team)**。在團隊層級提供符合 GDPR 的退出選項
- **[記錄匯出至 GCS / Azure Blob](./observability/gcs_bucket_integration.md)**。用於合規的耐久儲存
- **[每個金鑰/團隊的防護欄](#guardrails-oss-vs-enterprise)**。秘密資訊遮罩、內容審核、禁止關鍵字
- **強制必填參數**。拒絕缺少必要中繼資料的請求

### 作業與品牌識別 {#operations--branding}

- **自訂 Swagger 品牌識別**。在 API 文件頁面上設定您自己的標題、描述與過濾後的路由
- **[自訂電子郵件品牌識別](./proxy/email.md#email-customization)**。系統電子郵件顯示您的標誌與配色
- **請求/回應大小上限**。保護 proxy 免於失控的負載
- **[由團隊管理的模型](./proxy/team_model_add.md)**。讓團隊使用自己的金鑰與微調模型

### 哪些防護欄需要授權？ {#guardrails-oss-vs-enterprise}

OSS 防護欄架構包含自訂防護欄與用於 PII 遮罩的 Presidio。這些內建 callback 整合需要 LiteLLM Enterprise 授權：`llmguard_moderations`、`llamaguard_moderations`、`hide_secrets`、`openai_moderations`、`google_text_moderation`、`lakera_prompt_injection`，以及 `aporia_prompt_injection`。

## 執行 {#run-it}

將 Docker 映像部署到您自己的基礎架構上，或從 pip 套件建置。授權金鑰可啟用上述功能，並包含專屬支援管道。

```env
LITELLM_LICENSE="eyJ..."
```

不會有資料離開您的環境。[可透過 AWS 與 Azure Marketplace 採購。](./data_security.md#legalcompliance-faqs)

價格取決於您的部署規模。[聯絡我們](https://enterprise.litellm.ai/demo)以確認範圍。

## 支援 {#professional-support}

### 標準支援 {#standard-support}

每一份企業授權皆包含：與工程團隊的專屬 Slack 或 Teams 頻道，用於整合、部署與提供者疑難排解。服務時間為 PST 週一至週五上午 9 點到晚上 9 點。不包含保證回應時間。

### 24/7 支援 SLA {#247-support-slas}

對於需要全天候保證回應時間的團隊，可加價取得 24/7 支援 SLA。

| 嚴重性 | 回應 SLA |
|---|---|
| **Sev 0**。100% 的正式生產流量失敗 | 1 小時 |
| **Sev 1**。部分正式生產影響 | 6 小時 |
| **Sev 2–3**。設定問題與非緊急錯誤 | 24 小時（PT 早上 7 點到晚上 7 點，週一至週六） |
| **安全性修補** | 72 小時 |

可依需求提供自訂 SLA。支援範圍請參閱 [Shared Responsibility Model](./shared_responsibility.md)。

## 版本支援 {#version-support}

LiteLLM 支援最近四個穩定的 minor line。這些線都會持續獲得 patch release。比這更舊的版本會進入生命週期結束並停止接收更新。此政策自 2026 年 6 月 29 日星期一生效。到 2026 年 6 月中旬為止，受支援的線為 1.86、1.87、1.88 與 1.89，且會隨著新的穩定版釋出而向前推進。

LiteLLM 大約每週會推出一條新的 minor line。替每一條較舊的 line 打補丁，代表每一個修正都必須套用到所有仍在支援中的 line 上，而這個成本會隨著 line 數量而不是修正數量增加。四條 line 是仍能獲得這種照護的視窗。

這個視窗始終保留最近四個穩定的 minor line。當新的 line 釋出時，最舊的那條會退出並停止接收 release。不存在獨立的長期維護軌道。對於任何受支援的 line，請使用其最新 patch。若發生罕見且高嚴重性的問題，LiteLLM 仍可能在該視窗之外處理。

要確認您目前的位置，請取最新的穩定版 line，往回數四條。如果您的版本比那還舊，請規劃升級。固定到某個 minor line、套用其 patch，並在您的版本退出之前移至更新的 line。

## 常見問題 {#faq}

<details>
<summary>

### 如何設定並驗證 Enterprise 授權？ {#how-do-i-set-up-and-verify-an-enterprise-license}

</summary>

先將授權金鑰加入您的環境，然後重新啟動 proxy。

```env
LITELLM_LICENSE="eyJ..."
```

開啟 `http://<your-proxy-host>:<port>/`。API 文件頁面應該會在描述中顯示 **Enterprise Edition**。如果沒有，請確認金鑰正確且尚未過期，並確認 proxy 已完全重新啟動。

</details>

<details>
<summary>

### 我可以在哪裡閱讀更多關於資料安全與法規遵循的資訊？ {#where-can-i-read-more-about-data-security-and-compliance}

</summary>

請參閱[資料安全、法律與合規常見問題](./data_security.md)。

</details>

<details>
<summary>

### 定價結構是什麼？ {#how-is-pricing-structured}

</summary>

定價依使用量而定。請 [聯絡我們](https://enterprise.litellm.ai/demo) 取得為您的團隊量身打造的報價。

</details>

<details>
<summary>

### 如何在不重新啟動的情況下，為新模型取得 day-0 支援？ {#how-do-i-get-day-0-support-for-new-models-without-restarting}

</summary>

使用[自動同步新模型](./proxy/sync_models_github.md)可隨需或依排程從 GitHub 擷取最新的價格與 context-window 資料，且無需重新啟動。可透過 `POST /reload/model_cost_map` 觸發手動同步，或使用 `POST /schedule/model_cost_map_reload?hours=6` 排程定期同步。

</details>
