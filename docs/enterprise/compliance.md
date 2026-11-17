---
title: 合規與 SOC 2 Type II
description: LiteLLM 已通過 SOC 2 Type II 稽核。從 Trust Center 取得報告，並找到安全審查所需的資料處理、已簽署映像與弱點管理相關解答。
---

# 合規與 SOC 2 Type II {#compliance-and-soc-2-type-ii}

LiteLLM 已通過 SOC 2 Type II 稽核。使用本頁面收集安全審查所需的文件與解答。

## 取得 SOC 2 Type II 報告 {#get-the-soc-2-type-ii-report}

透過 [LiteLLM Trust Center](https://trust.litellm.ai/) 索取最新報告。

## 您的資料留在您的環境中 {#your-data-stays-in-your-environment}

您在自己的環境中託管 LiteLLM 閘道。自我託管時，LiteLLM 不會在 LiteLLM 伺服器上儲存資料或遙測資料。閘道處理的資料留在您的基礎架構中。請參閱[資料隱私與安全](../data_security.md)。

部分 Enterprise 功能會連線到 LiteLLM。[可計費請求計量](../proxy/billing_metrics.md)只會將成功請求的數量傳送到 LiteLLM 收集器。提示詞、回應與虛擬金鑰不會離開部署環境。閘道會先離線依簽章檢查您的授權金鑰。只有在該檢查未通過時，閘道才會將授權金鑰傳送到 LiteLLM 授權伺服器。請參閱[跨區域授權](../proxy/multi_region.md#licensing-across-regions)。

## 驗證您執行的映像 {#verify-the-images-that-you-run}

LiteLLM 使用 cosign 簽署 GHCR 上的每個 Docker 映像 <SinceVersion v="1.83.0" />。您可以在部署映像之前驗證簽章，也可以在 CI/CD 管線中強制執行此檢查。請參閱[驗證映像簽章](../proxy/docker_image_security.md)。

## 弱點管理 {#vulnerability-management}

LiteLLM 對其建置的所有 Docker 映像執行 `grype` 掃描。若要通報弱點，請使用[弱點揭露表單](https://security.litellm.ai/vdp)，該表單會送到 LiteLLM 在 HackerOne 上的計畫進行分流。完整政策位於 LiteLLM 儲存庫中的 [`SECURITY.md`](https://github.com/BerriAI/litellm/blob/main/.github/SECURITY.md)。

對於大型或重大的安全性更新，LiteLLM 會在公開揭露前 7 天以電子郵件通知 Enterprise 客戶。請參閱[安全性最佳實務](../proxy/security_best_practices.md#1-monitor-security-emails-and-upgrade-promptly)。安全性修補的回應時間請見[支援與 SLA](./support.md)。

## 安全問卷的解答 {#answers-for-your-security-questionnaire}

這些頁面提供安全團隊最常詢問的問題解答：

- [資料隱私與安全](../data_security.md)：資料收集、cookies、弱點通報、採購選項與供應商資訊。
- [共同責任](../shared_responsibility.md)：LiteLLM 負責的問題與您負責的問題。
- [安全性與加密常見問題](../proxy/security_encryption_faq.md)：傳輸中與靜態加密。
- [OWASP LLM Top 10](../proxy/security_owasp_llm_top10.md)：LiteLLM 針對每項 OWASP 風險的控制措施，以及每項控制的限制。
- [稽核記錄](../proxy/audit_logs.md)：金鑰、團隊與模型的管理員變更紀錄。

若這些頁面未回答您的問題，請[預約展示](https://enterprise.litellm.ai/demo)或在您的 Enterprise 支援頻道中提問。
