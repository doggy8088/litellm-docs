---
title: "版本與映像"
description: "從已發佈的 Compose 套件、映像或 Helm chart 安裝 Lens v0.4.0。"
slug: "/proxy/lens/deployment/releases"
---

# 版本與映像 {#releases-and-images}

目前的版本是 [Lens v0.4.0](https://github.com/BerriAI/lens/releases/tag/v0.4.0)。所有成品都是公開的，不需要登錄憑證。

[Compose 套件](https://github.com/BerriAI/lens/releases/download/v0.4.0/lens-install-0.4.0.tar.gz) 可以在不需要建置或 Git 檢出的情況下啟動 Lens 和 ClickHouse。請依照 [伺服器上的 Docker Compose](./server.md) 安裝它。若要在您自己的電腦上試用 Lens，[快速入門](./local.md) 更簡短。

## 容器映像 {#container-images}

使用 `ghcr.io/berriai/lens:0.4.0`。套件和 chart 會依摘要固定映像，而該版本的 `manifest.txt` 會列出該摘要。

## Helm charts {#helm-charts}

使用 `oci://ghcr.io/berriai/charts/lens`，搭配 `--version 0.4.0`。請依照 [Kubernetes 指南](./kubernetes.md#new-deployment)。

若要升級，請在完成 [備份與升級檢查](./upgrades.md) 後變更套件、映像或 chart 版本。保留資料和憑證。Lens 和 LiteLLM 各自獨立更新。從 LiteLLM v1.112.0 起，儀表板會顯示所連接 Lens 提供的 UI，因此升級 Lens 也會更新 LiteLLM 中的 Lens 頁面。較舊的閘道帶有自己的 Lens UI 副本，需要更新閘道才能變更它。 {/* keep-version-note: The first gateway release that loads the UI from Lens is the subject of this note. */}

## 驗證版本 {#verify-a-release}

您可以選擇從版本資產下載 `manifest.txt` 和 `manifest.sigstore.json`，並使用 Cosign 驗證。以下的憑證身分是 Lens 的版本簽署工作流程。

```sh
cosign verify-blob --bundle manifest.sigstore.json \
  --certificate-identity 'https://github.com/BerriAI/lens-releaser/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' manifest.txt
```

請依照該版本的說明，根據已驗證資訊清單的總和檢查碼和摘要檢查下載的成品。

## 原始碼 charts {#source-charts}

對於原始碼建置，請參閱 [開發](./development.md)。客戶安裝不需要原始碼檢出。
