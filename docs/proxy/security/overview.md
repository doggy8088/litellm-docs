---
title: 安全性
sidebar_label: 總覽
description: 保護您的 LiteLLM 閘道、管理密鑰，並檢視網路與合規需求。
---

# 安全性 {#security}

{/* keep-version-note */}

使用這些指南來保護您的 LiteLLM 閘道、控制其對外請求，並安全地儲存憑證。

先從[安全性最佳實踐](../security_best_practices.md)開始，了解生產環境檢查清單。安裝與基礎設施設定請參閱[部署](../deploy.md)。

## 選擇主題 {#choose-a-topic}

| 主題 | 涵蓋內容 |
| --- | --- |
| [安全性最佳實踐](../security_best_practices.md) | 安全的版本、存取控制、網路設定、密鑰與稽核記錄。 |
| [使用 mTLS 的用戶端驗證](../deploy/mtls.md) | 在入口檢查用戶端憑證，並要求 LiteLLM 金鑰。 |
| [Identity-Aware Proxy](../deploy/iap/overview.md) | 在流量到達 LiteLLM 之前檢查身分與存取權限。 |
| [SSL 與 HTTP Proxy](../../guides/security_settings.md) | 設定憑證驗證、自訂 CA 套件與對外 HTTP proxy。 |
| [對外請求與離線模式](../outbound_requests.md) | LiteLLM 會聯絡的外部服務，以及您可以停用哪些請求。 |
| [OWASP LLM Top 10 對應](../security_owasp_llm_top10.md) | 哪些 LLM 風險由 LiteLLM 控制措施處理，哪些必須由您的應用程式處理。 |
| [FIPS 模式](../fips_mode.md) | 查看目前的支援與限制。FIPS 模式仍在開發中。 |
| [密鑰管理器](../../secret_managers/overview.md) | 使用支援的密鑰管理器讀取與儲存密鑰。這些整合需要 Enterprise 授權。 |
| [Docker 映像安全性](../docker_image_security.md) | 驗證映像簽章並檢視映像安全性選項。 |

## 身分與存取 {#identity-and-access}

[驗證](../authentication.md)可識別呼叫者與登入管理介面的人員。[存取管理](../access_management/overview.md)控制他們可以使用與管理哪些模型、MCP 伺服器與代理程式。
