# 資料隱私與安全 {#data-privacy-and-security}

在 LiteLLM，我們將**保護您的資料隱私與安全**視為首要任務。我們認知到您與我們分享的資料至關重要，並以最高程度的謹慎加以處理。

## 安全措施 {#security-measures}

### 自我託管的 LiteLLM 執行個體 {#self-hosted-instances-litellm}

- **當您自我託管時，LiteLLM 伺服器上不會儲存任何資料或遙測資料**
- 安裝與設定請參閱：[自我託管指南](../docs/proxy/deploy.md)
- **遙測**：當您自我託管 LiteLLM 時，我們不會執行任何遙測

如有安全相關詢問，請聯絡 support@berri.ai

## 個人資料的蒐集 {#collection-of-personal-data}

### 對於自我託管 LiteLLM 的使用者： {#for-self-hosted-litellm-users}
- 當您自我託管我們的軟體時，不會蒐集或傳輸任何個人資料至 LiteLLM 伺服器。
- 任何產生或處理的資料都完全保留在您自己的基礎架構內。

## Cookie 資訊、安全性與隱私 {#cookies-information-security-and-privacy}

### 對於自我託管 LiteLLM 的使用者： {#for-self-hosted-litellm-users-1}
- Cookie 資料保留在您自己的基礎架構內。
- LiteLLM 使用最少的 cookie，僅用於讓 Proxy 使用者存取 LiteLLM 管理 UI。
- 這些 cookie 會在您登入後儲存在您的網頁瀏覽器中。
- 我們不將 cookie 用於廣告、追蹤，或任何超出維護您登入工作階段以外的用途。
- 所使用的唯一 cookie 對於維護應用程式 UI 的使用者驗證與工作階段管理是必要的。
- 工作階段 cookie 會在您關閉瀏覽器、登出，或 24 小時後過期。
- LiteLLM 不使用任何第三方 cookie。
- 管理 UI 會存取 cookie 以驗證您的登入工作階段。
- 該 cookie 以 JWT 形式儲存，且系統其他部分無法存取。
- 我們（LiteLLM）不會基於任何其他用途存取或分享這些 cookie 資料。

## 安全漏洞回報指南 {#security-vulnerability-reporting-guidelines}

我們重視安全社群在保護我們的系統與使用者方面所扮演的角色。若要回報安全漏洞：

- 寄信至 support@berri.ai 並附上詳細資訊
- 包含重現問題的步驟
- 提供任何相關的額外資訊

我們會及時審查所有回報。請注意，我們目前不提供 bug bounty 計畫。

## 漏洞掃描 {#vulnerability-scanning}

- LiteLLM 會對所有建置完成的 Docker 映像執行 [`grype`](https://github.com/anchore/grype) 安全掃描。
    - 請參閱 [`grype litellm` ci/cd 檢查](https://github.com/BerriAI/litellm/blob/main/.circleci/config.yml#L1099)。 
    - 目前狀態：✅ 通過。未發現 0 個高/嚴重等級漏洞。

## 法務／合規常見問題 {#legalcompliance-faqs}

### 採購選項 {#procurement-options}

1. 開立發票
2. AWS Marketplace
3. Azure Marketplace

### 供應商資訊 {#vendor-information}

法律實體名稱：Berrie AI Incorporated

安全事件聯絡窗口電子郵件地址：krrish@berri.ai

一般安全相關問題聯絡窗口電子郵件地址：krrish@berri.ai 

供應商是否已通過稽核／認證？ 
- SOC 2 Type I。已認證。企業方案可應要求提供報告。
- SOC 2 Type II。進行中。證書將於 2025 年 4 月 15 日前提供。
- ISO 27001。已認證。企業方案可應要求提供報告。

是否已實施資訊安全管理系統？ 
- 是 - [CodeQL](https://codeql.github.com/) 以及涵蓋多個安全領域的完整 ISMS。

是否有關鍵事件的記錄 - 驗證、建立、更新變更？ 
- 是 - 我們有 [稽核記錄](https://docs.litellm.ai/docs/proxy/multiple_admins#1-switch-on-audit-logs)

供應商是否具有既定的資安事件管理計畫？ 
- 是，事件回應政策可應要求提供。

供應商是否有漏洞揭露政策？ [是](https://github.com/BerriAI/litellm?tab=security-ov-file#security-vulnerability-reporting-guidelines)

供應商是否執行漏洞掃描？ 
- 是，如 [漏洞掃描](#vulnerability-scanning) 區段所述，會定期執行漏洞掃描。

簽署人姓名：Krish Amit Dholakia

簽署人電子郵件：krrish@berri.ai
