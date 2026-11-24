---
title: Enterprise
hide_title: true
description: LiteLLM Enterprise 是開源 AI 閘道加上 SSO、稽核記錄、委派管理員角色、多區域部署與支援 SLA，自我託管於您的雲端環境。
---

import {EnterpriseHero, TierStack} from '@site/src/components/Conversion/Enterprise';
import {Tiles, SalesBand} from '@site/src/components/Conversion';

<EnterpriseHero />

## 在開源版之上多得到什麼 {#what-you-get-on-top-of-open-source}

Enterprise 是套用在您可能已經在執行的同一個 Gateway 映像上的一把授權金鑰。無需遷移：每一層都包含其下方所有層級的功能。

<TierStack />

## 對您的組織帶來的改變 {#what-changes-for-your-organization}

<Tiles size="lg" columns={3} items={[
  {icon: 'compliance', title: '可直接交給審查團隊的稽核級安全性', text: '通過 SOC 2 Type II 稽核，自我託管讓資料不離開您的環境，並提供可驗證的已簽署 Docker 映像。', to: 'https://trust.litellm.ai/', more: '驗證已簽署的映像', moreTo: '/docs/proxy/docker_image_security'},
  {icon: 'sso', title: '所有人都能用您的身分提供者登入', text: '為 Okta、Entra ID、Google Workspace 或任何 OIDC 或 SAML 提供者提供 SSO 與 SCIM。存取權限依您的組織架構而定。', to: '/docs/proxy/admin_ui_sso'},
  {icon: 'audit', title: '每一項管理員操作都有紀錄', text: '金鑰、團隊與模型變更的稽核記錄，並可由您的合規團隊設定保留政策。', to: '/docs/proxy/audit_logs'},
  {icon: 'budget', title: '團隊自行管理金鑰與預算', text: '團隊管理員可依專案、標籤與模型管理金鑰、模型與預算，無需 master key，並在任何人達到上限前收到警示。', to: '/docs/proxy/access_control'},
  {icon: 'secrets', title: '提供者的金鑰安全保存在您的保存庫中', text: '支援 AWS、Azure、Google、HashiCorp Vault 與 CyberArk 機密管理工具，並自動輪替虛擬金鑰。', to: '/docs/secret_managers/overview'},
  {icon: 'support', title: '工程師隨時待命', text: '與打造 LiteLLM 的團隊共用 Slack Connect 頻道，並提供最快一小時回應的 24/7 SLA。', to: '/docs/enterprise/support'},
]} />

<SalesBand source="enterprise-page-mid" title="在您自己的基礎架構上實際看看它如何運作" text="與團隊討論您的導入計畫與安全審查，並以完整授權開始 30 天試用。" />

## Enterprise 適合哪些團隊？ {#who-is-enterprise-for}

適合大規模執行 LiteLLM（100 位以上使用者或 10 個以上正式環境 AI 使用案例）、需要在開源版之上加上 SSO、稽核記錄、細緻的存取控制與專業支援的團隊。SSO 在 5 位使用者以內免費；超過後需要 Enterprise 授權。評估試用的工程師可參考 [正式環境導入](/docs/learn/enterprise_quickstart) 指南，已經在使用開源版的團隊可從 [從 OSS 遷移](/docs/enterprise/moving_from_oss) 開始。

## 完整功能清單 {#full-feature-list}

以下所有功能都由授權金鑰啟用。每一項都連到其設定指南。

### 安全性與存取 {#security-and-access}

- **[Admin UI 的 SSO](./proxy/admin_ui_sso.md)**。Okta、Azure AD、Google Workspace，以及任何 OIDC/SAML 提供者
- **[以 JWT 為基礎的驗證](./proxy/token_auth.md)**。使用您的身分提供者的權杖驗證請求
- **[具保留政策的稽核記錄](./proxy/audit_logs.md)**。追蹤每一項管理員操作與金鑰層級的變更
- **[以角色為基礎的存取控制](./proxy/access_control.md)**。組織、團隊與使用者角色
- **[公開與私有路由控制](./proxy/public_routes.md)**。限制管理路由並縮小攻擊面
- **[以 IP 位址為基礎的存取控制清單](./proxy/ip_address.md)**。將代理的存取限制在特定 CIDR 範圍
- **[金鑰輪替](./proxy/virtual_keys.md#-key-rotations)**。自動輪替虛擬金鑰
- **[機密管理工具](./secret_managers/overview.md)**。AWS KMS、AWS Secrets Manager、Azure Key Vault、Google KMS、Google Secret Manager、HashiCorp Vault、CyberArk，或自訂機密管理工具
- **[AI Hub](./proxy/ai_hub.md)**。分享一個公開且具品牌識別的頁面，列出可用的模型、MCP 伺服器、代理程式與技能

### 治理與成本 {#governance-and-cost}

- **[多租戶架構](./proxy/multi_tenant_architecture.md)**。組織、團隊、專案與金鑰
- **[專案管理](./proxy/project_management.md)**。依應用程式或使用案例將金鑰分組，並設定預算、擁有者、速率限制、模型允許清單與獨立的支出檢視。請參閱 [UI 導覽](./proxy/ui_project_management.md)
- **[以標籤為基礎的預算](./proxy/provider_budget_routing.md)**。依自訂標籤設定預算與追蹤支出
- **[虛擬金鑰的模型專屬預算](./proxy/users.md)**。每個金鑰對不同模型設定不同上限
- **[暫時提高預算](./proxy/temporary_budget_increase.md)**。限時提高支出額度，無需永久變更
- **[軟性預算電子郵件警示](./proxy/ui_team_soft_budget_alerts.md)**。在團隊達到硬性上限前先提出警告
- **[產生支出報表](./proxy/cost_tracking.md#-enterprise-generate-spend-reports)**。以程式方式依金鑰、團隊、標籤或模型存取支出

### 可觀測性與合規 {#observability-and-compliance}

- **[SOC 2 Type II](https://trust.litellm.ai/)**。經稽核的控制措施；可透過 Trust Center 索取報告
- **[以團隊為基礎的記錄](./proxy/team_logging.md)**。將每個團隊的記錄路由到他們自己的 Langfuse 專案或回呼
- **[依團隊停用記錄](./proxy/team_logging.md#disable-logging-for-a-team)**。團隊層級的退出選項，符合 GDPR 需求
- **[將記錄匯出至 GCS / Azure Blob](./observability/gcs_bucket_integration.md)**。為合規需求提供持久儲存
- **[依金鑰/團隊設定防護欄](#guardrails-oss-vs-enterprise)**。機密資訊遮蔽、內容審核、禁用關鍵字
- **強制必填參數**。拒絕缺少必要中繼資料的請求

### 營運與品牌 {#operations--branding}

- **[自訂電子郵件品牌](./proxy/email.md#email-customization)**。在系統電子郵件上使用您的標誌與顏色
- **請求/回應大小上限**。保護代理免於失控的酬載
- **[團隊自管模型](./proxy/team_model_add.md)**。讓團隊帶入自己的金鑰與微調模型

### 哪些防護欄需要授權？ {#guardrails-oss-vs-enterprise}

OSS 防護欄框架包含自訂防護欄與用於 PII 遮蔽的 Presidio。下列內建回呼整合需要 LiteLLM Enterprise 授權：`llmguard_moderations`、`llamaguard_moderations`、`hide_secrets`、`openai_moderations`、`google_text_moderation`、`lakera_prompt_injection` 與 `aporia_prompt_injection`。

## 執行方式 {#run-it}

在您自己的基礎架構上部署 Docker 映像，或從 pip 套件建置。授權金鑰會啟用上述功能，並包含專屬支援頻道。

```env
LITELLM_LICENSE="eyJ..."
```

任何資料都不會離開您的環境，且 LiteLLM 已通過 [SOC 2 Type II](https://trust.litellm.ai/) 稽核。[可透過 AWS 與 Azure Marketplace 採購。](./data_security.md#legalcompliance-faqs)

定價依您的部署規模而定。[與我們聯繫](https://enterprise.litellm.ai/demo) 以評估範圍。

## 支援 {#professional-support}

每份授權都包含與工程團隊共用的 Slack Connect 頻道，或透過電子郵件 [support@berri.ai](mailto:support@berri.ai) 取得支援。加上選購的 24/7 SLA 後，Sev 0 的回應時間為 1 小時，安全性修補為 72 小時。服務時間、完整的嚴重程度對照表與自訂 SLA 請參閱 [支援與 SLA](/docs/enterprise/support)。

## 版本支援 {#version-support}

LiteLLM 支援最近四個穩定次要版本線，且 Enterprise 與開源版共用同一個映像與同一個版本號。請參閱 [版本支援](/docs/enterprise/version_support)。此政策在 [LTS 試行計畫](/docs/enterprise/lts_pilot) 期間暫停。

## 常見問題 {#faq}

<details>
<summary>

### 如何設定並驗證 Enterprise 授權？ {#how-do-i-set-up-and-verify-an-enterprise-license}

</summary>

將授權金鑰加入您的環境，然後重新啟動代理。

```env
LITELLM_LICENSE="eyJ..."
```

開啟 `http://<your-proxy-host>:<port>/`。API 文件頁面的說明中應顯示 **Enterprise Edition**。若未顯示，請確認金鑰正確且未過期，並確認代理已完整重新啟動。

</details>

<details>
<summary>

### LiteLLM 符合 SOC 2 規範嗎？ {#is-litellm-soc-2-compliant}

</summary>

是的。LiteLLM 已通過 SOC 2 Type II 稽核。可透過 [LiteLLM Trust Center](https://trust.litellm.ai/) 索取最新報告。資料處理、弱點通報與其餘安全審查事項，請參閱 [資料安全、法律與合規常見問題](./data_security.md)。

</details>

<details>
<summary>

### 可以透過 AWS 或 Azure Marketplace 購買嗎？ {#can-we-buy-through-aws-or-azure-marketplace}

</summary>

可以。您可以透過 AWS Marketplace 或 Azure Marketplace 購買 Enterprise 授權，或直接以發票購買。請參閱 [採購選項](./data_security.md#legalcompliance-faqs)。

</details>

<details>
<summary>

### 哪裡可以進一步了解資料安全與合規？ {#where-can-i-read-more-about-data-security-and-compliance}

</summary>

請參閱 [資料安全、法律與合規常見問題](./data_security.md)。

</details>

<details>
<summary>

### 定價如何計算？ {#how-is-pricing-structured}

</summary>

定價依使用量而定。[與我們聯繫](https://enterprise.litellm.ai/demo) 以取得為您的團隊量身打造的報價。

</details>

<details>
<summary>

### 如何在不重新啟動的情況下取得新模型的即時支援？ {#how-do-i-get-day-0-support-for-new-models-without-restarting}

</summary>

使用 [自動同步新模型](./proxy/sync_models_github.md)，依需求或排程從 GitHub 拉取最新的定價與上下文視窗資料，無需重新啟動。以 `POST /reload/model_cost_map` 觸發手動同步，或以 `POST /schedule/model_cost_map_reload?hours=6` 安排定期同步。

</details>

<SalesBand source="enterprise-page-bottom" />
