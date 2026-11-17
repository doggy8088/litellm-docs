---
title: "版本與映像"
description: "了解配對的 Lens 和 LiteLLM 版本、獨立部署，以及原始碼建置。"
slug: "/proxy/lens/deployment/releases"
---

# 版本與映像 {#releases-and-images}

Lens 可以獨立執行。對於手動設定指南，請使用 [原始碼快速入門](./local.md)，或建置 [原始碼 Helm chart](./kubernetes.md#new-deployment)。

截至 2026 年 10 月 9 日，Lens 儲存庫尚無已發佈的 GitHub 版本。最新的 LiteLLM 預先發行版本 `v1.106.0-dev.3`，是在獨立 Lens 整合於 [PR #45529](https://github.com/BerriAI/litellm/pull/45529) 合併之前發佈的。請勿將該版本用於閘道連接步驟。這些步驟需要包含該整合的建置。在您準備閘道建置時，獨立 Lens 仍可使用。

發行管線會建置版本相同並一起測試的官方配對 Lens 和 LiteLLM 成品。這不表示這些成品已經發佈。在選取版本之前，請檢查 [Lens 版本](https://github.com/BerriAI/lens/releases) 和 [LiteLLM 版本](https://github.com/BerriAI/litellm/releases)。

LiteLLM 內部的 Lens UI 是閘道建置的一部分。更新獨立的 Lens 後端不會取代該內嵌 UI。現有的外部 Lens 部署也不會在您升級 LiteLLM 時一併升級；請透過它自己的發行程序部署它。

## 容器映像 {#container-images}

對於原始碼建置，請複製 [BerriAI/lens](https://github.com/BerriAI/lens)，記錄選取的提交，並使用 [從原始碼建置](./development.md#try-backend-changes)。目前的執行階段 Dockerfile 是 `deploy/runtime/Dockerfile`。使用 `LENS_VERSION` 提供開發版本。官方配對建置使用 LiteLLM 計算出的發行版本，包含其 dev 或 RC 後綴

在使用已發佈的成品之前，請在 [Lens 版本](https://github.com/BerriAI/lens/releases) 中檢查確切的映像摘要和已簽署的發行資訊清單。使用該版本說明驗證資訊清單、原始碼身分和成品總和檢查碼。將選取的摘要固定在您的部署中，並保留先前的映像以供回復

現有的安裝可能會保留包含 `litellm-lens-worker` 的部署或登錄名稱。保留的名稱並不表示與獨立執行階段相容。請檢查選取的原始碼和版本中繼資料

## Helm charts {#helm-charts}

獨立 chart 位於 [Lens 儲存庫](https://github.com/BerriAI/lens/tree/main/helm/lens) 中。已發佈的版本使用 `oci://ghcr.io/berriai/charts/lens`，搭配確切的 chart 版本和已驗證的映像摘要。在該版本存在之前，請依照 [原始碼 chart 安裝](./kubernetes.md#new-deployment)，使用您建置並發佈到您自己可存取之登錄的映像

對於閘道內嵌，請保留現有的 LiteLLM chart 系列，並選取包含相容配接器和共用 Lens chart 的版本。配對版本會固定為該發行版本建置的 Lens 映像摘要和 chart。在採用之前，請檢查 chart 的實際值和版本驗證

## 原始碼 charts {#source-charts}

原始碼 chart 的預設映像標籤是開發值，可能不存在於登錄中。請使用您建置的成品提供 `image.repository` 和 `image.tag`，或 `image.digest`。[Helm 指南](https://github.com/BerriAI/lens/blob/main/helm/lens/README.md) 擁有完整的原始碼建置和安裝命令

對於現有的 Lens 部署，更換映像或 chart 也需要 [升級與遷移檢查](./upgrades.md)。讓儲存空間、密鑰、存取範圍和版本擁有權保持完整
