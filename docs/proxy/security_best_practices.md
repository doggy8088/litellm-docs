# 安全最佳實踐 {#security-best-practices}

LiteLLM 將安全性列為首要優先事項。請在正式環境與企業部署中採用以下作法。若要檢視與 LLM 應用程式 2026 年 OWASP Top 10 的逐項對照（包含每個控制措施的限制），請參閱 [OWASP LLM Top 10 對照表](./security_owasp_llm_top10)。

## 1. 監控安全電子郵件並及時升級 {#1-monitor-security-emails-and-upgrade-promptly}

請監控與您的 LiteLLM Enterprise 帳戶相關聯的電子郵件地址，以接收 CVE 警示與安全更新。對於大型或重大安全更新，LiteLLM 會在公開揭露前 7 天透過電子郵件通知 Enterprise 客戶。請利用這段時間測試並部署更新版本，並回覆任何升級問題。

請確保這些電子郵件能送達您的安全與平台團隊。

## 2. 執行受支援的穩定版本 {#2-run-a-supported-stable-release}

請保持在最新的穩定版本，並將 LiteLLM 升級納入您 नियमित的修補流程。請鎖定精確版本或映像 digest，而不是使用 `latest`，並在部署前[驗證 Docker 映像簽章](./docker_image_security)。

請參閱 [LiteLLM 發行週期](./release_cycle) 以了解目前的發行排程。

## 3. 使用最小權限存取 {#3-use-least-privilege-access}

指派所需最少的 [RBAC 角色](./access_control)，並將代理伺服器管理員的數量維持在最少。

應用程式與使用者應使用有範圍限制的 [Virtual Keys](./virtual_keys)，而不是 LiteLLM master key。對每個正式工作負載使用獨立的 service account key，這樣就能在不影響其他服務的情況下撤銷存取權。

### 停用 Admin UI 的環境認證登入 {#disable-environment-credential-login-to-the-admin-ui}

預設情況下，Admin UI 接受由環境變數組成的登入資訊：`UI_USERNAME`（預設 `admin`）搭配 `UI_PASSWORD`，而當 `UI_PASSWORD` 未設定時，則為主金鑰本身。這是一組永久共用、明文的管理員認證。它無法按個人輪替，任何曾讀取過環境的人都能繼續以 proxy 管理員身分登入，而且稽核日誌無法將變更歸屬到特定個人。請僅將其視為啟動機制。在啟用期間，儀表板會向管理員顯示警告橫幅。

在停用之前，請為每位管理員建立各自密碼的 `proxy_admin` 使用者（或連接 [SSO](./admin_ui_sso)），並確認他們可以登入。接著在 `config.yaml` 中設定下列內容並重新啟動 proxy：

```yaml
general_settings:
  disable_env_credential_login: true
```

`UI_USERNAME`、`UI_PASSWORD` 與主金鑰之後都會在登入頁面遭到拒絕，且橫幅會消失。資料庫使用者與 SSO 不受影響。如果您在尚未建立管理員帳號之前先啟用它，請移除該設定並重新啟動，以恢復環境登入；API 在整個過程中仍會使用主金鑰持續運作。逐步流程請參閱 [Admin UI 快速入門](./ui#5-create-your-own-admin-account-and-disable-environment-credential-login)。

### 限制 Admin UI 登入失敗次數 {#limit-failed-admin-ui-sign-in-attempts}

Admin UI 的密碼登入預設已進行速率限制：同一來源位址在 60 秒內輸入超過 10 次錯誤密碼，會封鎖該位址 5 分鐘；從該位址對單一使用者輸入超過 5 次錯誤密碼，只會封鎖該組合。封鎖是以位址為鍵，從不以帳號為鍵，因此沒有人能透過在別處猜測使用者名稱來把管理員鎖在外面，而每個使用者名稱的限制可避免某台辦公室 NAT 後方的錯誤設定腳本封鎖同一位址上的所有同事。封鎖是絕對的：正確密碼、`UI_USERNAME`/`UI_PASSWORD` 與主金鑰在期限到期前都會一律被 `429` 拒絕，因為只要對正確憑證留出任何例外，攻擊者就能持續藉此猜測。被封鎖的管理員仍可使用主金鑰作為 API bearer token，而此限制不涵蓋該情況。

只有在 LiteLLM 知道哪個位址是用戶端時，才會執行每個位址的限制，因此正式部署必須將 `general_settings.trusted_proxy_ranges` 設為反向代理或 ingress 的 CIDR 範圍，讓用戶端從 `X-Forwarded-For` 讀取，且外部偽造的標頭無法選擇其他位址；若用戶端直接連線，則設為 `[]`。若保持未設定，proxy 會在啟動時發出警告，且只會強制執行每個使用者名稱的限制，這會讓同一位址上的 username spraying 沒有限制。對於已知的共用出口位址，請使用 `max_failed_login_attempts_per_source_overrides`，不要提高全域限制。

```yaml
general_settings:
  trusted_proxy_ranges: ["10.0.0.0/8"]  # your ingress; [] when clients connect directly
  max_failed_login_attempts_per_source_overrides:
    "203.0.113.7": 50                   # shared office egress
    "198.51.100.4": 0                   # a scanner you run yourself, exempt
```

封鎖會透過 Redis 在各個 worker 與 pod 之間共享；若沒有 Redis，每個 worker 會各自計數，且 proxy 會在啟動時發出警告。使用者名稱會以雜湊儲存。設定與預設值請參閱 [Admin UI 指南](./ui#limit-failed-sign-in-attempts)。

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

## 7. 避免透過錯誤回應與標頭揭露內部資訊 {#7-avoid-disclosing-internals-through-error-responses-and-headers}

非預期的 5xx 錯誤會向用戶端回傳一般性的 `Internal server error` 訊息；原始例外（包含任何堆疊追蹤）一律會寫入伺服器記錄。使用 `x-litellm-call-id` [回應標頭](./response_headers) 來關聯失敗的請求與其伺服器端記錄項目，而不需要在面向用戶端的訊息中包含任何細節。

LiteLLM 自身基於 uvicorn 的啟動方式（`litellm --config ...`，或預設 Docker 映像）不會送出 `Server` 回應標頭。若您將 proxy 放在 gunicorn、hypercorn 或 granian worker 之後，或放在反向代理或負載平衡器（nginx、ingress controller、CDN）之後，該層可能會新增自己的 `Server` 標頭，揭露其名稱與版本。請設定它不要傳送該標頭，或將其一般化，例如在 nginx 中使用 `server_tokens off;`，或使用您的 ingress controller 或 CDN 的等效設定。

## 8. 為敏感工作負載加入防護欄（選用） {#8-add-guardrails-for-sensitive-workloads-optional}

如果您的工作負載處理敏感或受監管資料，請新增 [防護欄](./guardrails/quick_start) 以篩選提示與回應。我們建議使用 [Bedrock Guardrails](./guardrails/bedrock) 進行內容過濾、PII 偵測與禁止主題政策，並使用 [LiteLLM content filter](./guardrails/litellm_content_filter) 針對特定字詞或模式進行輕量、以 regex 為基礎的封鎖。防護欄可套用於每個金鑰、團隊或模型，以便在需要的地方強制更嚴格的控制。

## 8. 在具 TLS 終止的反向代理後方設定安全 Cookie {#8-configure-secure-cookies-behind-a-tls-terminating-reverse-proxy}

只要對外的原始來源是 HTTPS，proxy 的 session、SSO 與 SAML Cookie 就會被標記為 `Secure`。當 TLS 在 LiteLLM 前方的反向代理或負載平衡器上終止時，LiteLLM 只會看到來自該代理的純 HTTP 跳轉，因此需要一個受信任的訊號來知道對外原始來源其實是 HTTPS：

- 將 [`PROXY_BASE_URL`](./config_settings#environment-variables---reference) 設為使用者在瀏覽器中看到的精確 `https://` 原始來源。這是最簡單的選項，且優先於其他所有設定。
- 否則，將 `general_settings.use_x_forwarded_for: true` 與 `general_settings.mcp_trusted_proxy_ranges` 設為您的反向代理 CIDR 範圍。LiteLLM 接著會信任來自該代理的 `X-Forwarded-Proto: https`，但僅限於請求的直接對等端位址落在這些 CIDR 之一時：不受信任的呼叫者無法偽造此標頭來從自己的 Cookie 中移除 `Secure`。

```yaml
general_settings:
  use_x_forwarded_for: true
  mcp_trusted_proxy_ranges:
    - "10.0.0.0/8" # your reverse proxy / ingress controller's network
```

如果未設定其中任一項，位於 TLS 終止後方的部署所取得的 Cookie 就不會有 `Secure`，因為 LiteLLM 沒有受信任的方式知道它是透過 HTTPS 被連線。儘管有 `mcp_` 前綴，這兩個設定都不是 MCP 專屬；它們都是 LiteLLM 用於 `X-Forwarded-*` 標頭的一般請求信任邊界。

## 9. 在正式環境中停用 API 文件 {#9-disable-api-documentation-in-production}

預設情況下，proxy 會在未驗證的情況下提供位於 `/` 的 Swagger UI、位於 `/redoc` 的 ReDoc，以及位於 `/openapi.json` 的原始 OpenAPI schema。安全掃描工具會將此視為可供偵察的面向，因為它列出了所有路由與請求 schema。在正式環境中請停用這三者：

```env
NO_DOCS="True"
NO_REDOC="True"
NO_OPENAPI="True"
```

每個變數都控制不同的面向，因此只設定 `NO_DOCS` 仍會讓 `/redoc` 與 `/openapi.json` 保持可讀；請將三者都設定後重新啟動 proxy。之後 `/redoc` 與 `/openapi.json` 會回傳 404，而 `/` 只會回傳純粹的 `"LiteLLM: RUNNING"` 狀態字串；推論與管理路由則不受影響。請參閱 [限制所有 API 文件](./configs#restrict-all-api-documentation-for-productionair-gapped-deployments)，了解各面向的變數，以及如何將文件移至其他路徑而非停用它們。

## 10. 限制檔案上傳 {#10-restrict-file-uploads}

`POST /v1/files` 需要像其他每個 proxy 路由一樣使用虛擬金鑰，而 proxy 只會將上傳的位元組轉送給已設定的提供者。它本身從不執行、解壓縮或提供該檔案。即便如此，仍應將上傳視為不受信任的輸入，並在它到達提供者之前限制閘道可接受的內容。

在 `general_settings` 下方設定 `allowed_file_extensions` 為您的工作負載實際需要的副檔名。比對會針對上傳檔名進行不分大小寫比對，因此 `.jsonl` 也會接受 `batch.JSONL`。任何其他副檔名，以及任何沒有副檔名的檔名，於檔案轉送前都會以 `400` 拒絕。空清單（`[]`）會拒絕所有上傳，而不設定此項則會讓上傳保持不受限制。請搭配 `max_file_size_mb` 來限制單一上傳、`max_batch_file_size_mb` 來限制批次輸入檔案，以及 `max_request_size_mb` 來限制每個路由上的整個請求主體。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  allowed_file_extensions: [".jsonl", ".pdf", ".txt"]
  max_file_size_mb: 50
  max_batch_file_size_mb: 200
  max_request_size_mb: 250
```

被拒絕的上傳會回傳 OpenAI 風格的錯誤：

```json
{
  "error": {
    "message": "File extension '.exe' is not in this proxy's allowed_file_extensions setting. The file was not forwarded to the provider.",
    "type": "invalid_request_error",
    "param": "file",
    "code": "400"
  }
}
```

`blocked_file_extensions` 是較舊的封鎖清單，現已棄用並改用允許清單。它仍可運作，且當兩者都設定時，會先檢查允許清單，再對通過者強制執行封鎖清單。請優先使用允許清單：封鎖清單必須列出您想排除的每一個副檔名，而允許清單只需要列出您實際使用的項目。
