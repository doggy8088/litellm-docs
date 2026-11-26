---
title: 私人容器登錄檔
description: 了解 LiteLLM 在其私人登錄檔中發佈的內容、如何搭配您自己的登錄檔使用，以及如何請求存取權。
---

# 私人容器登錄檔 {#private-container-registry}

{/* keep-version-note */}

LiteLLM 私人登錄檔提供 Enterprise 容器映像與 LiteLLM Helm chart。對於最嚴重的弱點，LiteLLM 會在公開揭露之前先在此提供修補後的映像，讓您的團隊有時間掃描與部署。您也可以在已執行的閘道上[啟用 Enterprise 授權](./activate.md)。

## 如何使用登錄檔 {#how-to-use-the-registry}

LiteLLM 建議將成品鏡像到您自己的私人登錄檔。如此一來，您可以在部署前掃描映像，並在推出期間從自己的登錄檔拉取。

在 AWS 上，請使用 Amazon ECR pull-through cache，透過您自己的 ECR 登錄檔拉取 LiteLLM 成品。您也可以使用 OAuth 憑證直接從 LiteLLM 拉取，或將成品鏡像到另一個登錄檔。

## 請求存取權 {#request-access}

若您的組織與 LiteLLM 簽有保密協議，請聯絡 [Enterprise 支援](./support.md) 以取得存取權與客戶設定指南。若使用 ECR pull-through cache，請提供您的 12 位數 AWS 帳戶 ID，以便 LiteLLM 授予跨帳戶存取權。若要直接拉取或以 OAuth 鏡像，請索取登錄檔存取套件。
