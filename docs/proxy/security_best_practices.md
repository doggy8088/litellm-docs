# 安全最佳實踐 {#security-best-practices}

安全是 LiteLLM 的首要優先事項。請將以下實踐用於正式環境與企業部署。

## 1. 監控安全電子郵件並及時升級 {#1-monitor-security-emails-and-upgrade-promptly}

請監控與您的 LiteLLM Enterprise 帳戶相關聯的電子郵件地址，以接收 CVE 警示與安全更新。對於大型或重大安全更新，LiteLLM 會在公開揭露前 7 天透過電子郵件通知 Enterprise 客戶。請利用這段時間測試並部署更新版本，並回覆任何升級問題。

請確保這些電子郵件能送達您的安全與平台團隊。

## 2. 執行受支援的穩定版本 {#2-run-a-supported-stable-release}

請保持在最新的穩定版本，並將 LiteLLM 升級納入您 नियमित的修補流程。請鎖定精確版本或映像 digest，而不是使用 `latest`，並在部署前[驗證 Docker 映像簽章](./deploy#verify-docker-image-signatures)。

請參閱 [LiteLLM 發行週期](./release_cycle) 以了解目前的發行排程。

## 3. 使用最小權限存取 {#3-use-least-privilege-access}

指派所需最少的 [RBAC 角色](./access_control)，並將代理伺服器管理員的數量維持在最少。

應用程式與使用者應使用有範圍限制的 [Virtual Keys](./virtual_keys)，而不是 LiteLLM master key。對每個正式工作負載使用獨立的 service account key，這樣就能在不影響其他服務的情況下撤銷存取權。

## 4. 連接您的企業身分提供者 {#4-connect-your-enterprise-identity-provider}

### SSO {#sso}

為 Admin UI 啟用 [SSO](./admin_ui_sso)，讓驗證、MFA 與登入政策維持集中於您的身分提供者。

### JWT {#jwt}

為 API 流量啟用 [JWT 驗證](./token_auth)，讓工作負載能使用來自您的 OIDC 提供者的已簽署身分，而不是共享的長效 API 金鑰。JWT claims 也可將請求對應到 LiteLLM 使用者、團隊、模型與支出控制。

### SCIM {#scim}

啟用 [SCIM](../tutorials/scim_litellm) 以自動佈建與取消佈建使用者和團隊。當使用者從您的身分提供者中移除時，LiteLLM 會移除其關聯的金鑰與存取權杖，降低殘留存取權。

## 5. 限制網路存取 {#5-restrict-network-access}

盡可能在私有網路上執行 LiteLLM Gateway，並僅公開用戶端需要的路由。在部署前請檢閱 [公開路由設定](./public_routes)。

對用戶端到閘道以及閘道到提供者的流量使用 TLS。保持憑證驗證啟用；如果您的組織使用私有 CA，請設定 [自訂 CA bundle](../guides/security_settings)。

## 6. 保護密鑰並檢閱稽核記錄 {#6-protect-secrets-and-review-audit-logs}

將提供者憑證、master key 與 salt key 儲存在您平台的秘密儲存庫或受支援的 [secret manager](../secret_managers/overview) 中。請勿將密鑰提交到 `config.yaml` 或原始碼控制系統。請遵循 [master key 旋轉指南](./master_key_rotations)，且在憑證已儲存後不要旋轉 `LITELLM_SALT_KEY`。

啟用 [稽核記錄](./multiple_admins)，並檢閱管理變更，例如金鑰建立、金鑰刪除、角色變更與團隊更新。

## 7. 為敏感工作負載新增防護欄（選用） {#7-add-guardrails-for-sensitive-workloads-optional}

如果您的工作負載處理敏感或受監管資料，請新增 [防護欄](./guardrails/quick_start) 以篩選提示與回應。我們建議使用 [Bedrock Guardrails](./guardrails/bedrock) 進行內容過濾、PII 偵測與禁止主題政策，並使用 [LiteLLM content filter](./guardrails/litellm_content_filter) 針對特定字詞或模式進行輕量、以 regex 為基礎的封鎖。防護欄可套用於每個金鑰、團隊或模型，以便在需要的地方強制更嚴格的控制。
