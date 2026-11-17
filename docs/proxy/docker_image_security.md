---
description: LiteLLM 自 v1.83.0 起，會以 cosign 簽署它發佈到 GHCR 的 Docker 映像。如何驗證簽章、在 CI/CD 中強制驗證，以及遵循建議的部署模式。
---

# Docker 映像安全指南 {#docker-image-security-guide}

LiteLLM 會以 [cosign](https://docs.sigstore.dev/quickstart/quickstart-cosign/) 為它發佈到 GHCR 的每個 Docker 映像簽署 <SinceVersion v="1.83.0" />。較舊的映像未經簽署。本頁說明如何驗證簽章、在 CI/CD 中強制驗證，以及遵循建議的部署模式。

## 已簽署的映像 {#signed-images}

使用 `ghcr.io/berriai/litellm`，並鏡像於 `docker.litellm.ai/berriai/litellm`。請驗證您部署的確切 release tag 或 digest。

這個 [Dockerfile](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/Dockerfile) 為 proxy、gateway、backend、UI、migrations、metrics 與 collector 建置單一映像。較舊的 release tags 可能使用不同的 Dockerfile。請依照 [Helm 指南](./deploy/helm.md) 使您的 chart 與映像相符。內部建置請使用您自己的金鑰簽署。LiteLLM 的公開金鑰只能驗證由 LiteLLM 簽署的映像。

目前的簽署金鑰是在 [commit `e82a3c6`](https://github.com/BerriAI/litellm/commit/e82a3c646908ba0a6ee0beddc4310d7a6cac4065) 中導入的，而公開金鑰已提交到儲存庫中的 [`cosign.pub`](https://github.com/BerriAI/litellm/blob/main/cosign.pub)。其 SHA-256 指紋為 `e3fe3e08c44b16407fe0b37c43b4f8b603b3a0f4ee74c29e647bc022d762c2c0`。它簽署自 `v1.103.8`、`v1.104.6`、`v1.105.4`、`v1.106.3` 起以及每個後續版本的映像。

:::warning[先前的簽署金鑰]
較舊的映像是使用來自 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 的先前金鑰簽署的。該金鑰已於 2026 年 10 月 23 日輪替，此前發生了 [2026 年 10 月 21 日事件](/blog/security-incident-oct-21-2026#image-signing-key-rotation)。只有在 2026 年 10 月 21 日 `v1.107.0` 發佈之前發佈的映像上，才信任來自它的簽章。
:::

## 驗證映像簽章 {#verify-image-signatures}

請依照 [官方說明](https://docs.sigstore.dev/cosign/system_config/installation/) 安裝 cosign。

### 使用固定的 commit hash 驗證（建議） {#verify-with-the-pinned-commit-hash-recommended}

commit hash 在密碼學上不可變，使這成為最強的驗證方法：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
  ghcr.io/berriai/litellm:v1.106.6
```

將範例標記替換為您部署的版本。簽章驗證可識別映像的簽署者。請確認該版本包含您的 chart 所需的 entrypoint 與功能。

### 使用 release tag 驗證（方便） {#verify-with-a-release-tag-convenience}

此儲存庫中的標記受到保護，並會解析為相同的金鑰：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/v1.106.6/cosign.pub \
  ghcr.io/berriai/litellm:v1.106.6
```

### 預期輸出 {#expected-output}

```
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

## 在 CI/CD 中強制驗證 {#enforce-verification-in-cicd}

### Kubernetes: Sigstore Policy Controller {#kubernetes-sigstore-policy-controller}

[Sigstore Policy Controller](https://docs.sigstore.dev/policy-controller/overview/) 會拒絕映像未通過 cosign 驗證的 Pod。

1. 安裝 controller：

```bash
helm repo add sigstore https://sigstore.github.io/helm-charts
helm install policy-controller sigstore/policy-controller \
  -n cosign-system --create-namespace
```

2. 使用 LiteLLM 公開金鑰建立一個 `ClusterImagePolicy`：

```yaml
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: litellm-signed-images
spec:
  images:
    - glob: "ghcr.io/berriai/litellm*"
  authorities:
    - key:
        data: |
          -----BEGIN PUBLIC KEY-----
          MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEG06dpKM+vEDnmp2zcjyXgVCXxzRg
          JA5H2LnmwBKQafZGka6OOrWujCEWATQewiAgyD4WQdJ0pvU9RC4mvNAjvQ==
          -----END PUBLIC KEY-----
```

3. 標記命名空間以啟用強制執行：

```bash
kubectl label namespace litellm policy.sigstore.dev/include=true
```

該命名空間中任何使用未簽署 `ghcr.io/berriai/litellm*` 映像的 Pod，都會在 admission 時被拒絕。

### GCP: Binary Authorization {#gcp-binary-authorization}

[Binary Authorization](https://cloud.google.com/binary-authorization/docs) 可在 Cloud Run 和 GKE 上強制執行 cosign 簽章。

1. 使用 LiteLLM 公開金鑰建立一個基於 cosign 的 attestor：

```bash
# Import the public key into a Cloud KMS keyring or use a PGP/PKIX attestor.
# See: https://cloud.google.com/binary-authorization/docs/creating-attestors-console
```

2. 設定一個 Binary Authorization policy，要求 `ghcr.io/berriai/litellm*` 映像必須通過該 attestor。

3. 在您的 Cloud Run service 或 GKE 叢集上啟用此 policy。

請參閱 [GCP Binary Authorization 文件](https://cloud.google.com/binary-authorization/docs/setting-up) 以取得完整設定步驟。

### AWS: ECS / ECR {#aws-ecs--ecr}

AWS 在部署時不會原生驗證 cosign 簽章。常見做法如下：

- **CI/CD gate**：在推送到 ECR 或更新 ECS task definition 之前，於您的部署 pipeline 中執行 `cosign verify`。若驗證失敗，則讓 pipeline 失敗。
- **在 EKS 上使用 OPA/Gatekeeper**：如果在 EKS 上執行，請使用 Sigstore Policy Controller（與上方的 Kubernetes 方法相同）。

### GitHub Actions 閘門 {#github-actions-gate}

在任何部署工作之前新增一個驗證步驟：

```yaml
- name: Verify LiteLLM image signature
  run: |
    cosign verify \
      --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
      ghcr.io/berriai/litellm:${{ env.LITELLM_VERSION }}
```

## 建議的部署模式 {#recommended-deployment-patterns}

### 依 digest 固定 {#pin-by-digest}

digest 固定可保證精確的映像內容，無論標記如何變動：

```yaml
image: ghcr.io/berriai/litellm@sha256:<digest>
```

拉取後取得 digest：

```bash
docker inspect --format='{{index .RepoDigests 0}}' \
  ghcr.io/berriai/litellm:v1.106.6
```

Cosign 驗證也可搭配 digest 使用：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub \
  'ghcr.io/berriai/litellm@sha256:<digest>'
```

### 使用穩定的 release tags {#use-stable-release-tags}

如果 digest 固定對您的工作流程來說過於嚴格，請使用一般的 semver / PEP 440 release tags（例如 `v1.86.2`）。這些是不可變更的 release tags，不會被覆寫。

:::warning[`main-stable` 與 `main-latest` 已棄用]

LiteLLM 已改用 PEP 440 / semver 版本控制，因此穩定版現在會以一般 `vX.Y.Z` 標記（例如 `v1.86.2`）發佈，而不是較舊的 `vX.Y.Z-stable` 形式。滾動式 `main-stable` 標記仍在更新以維持向後相容性，但已棄用；請改為固定到特定的 `vX.Y.Z` 標記（或 digest）。滾動式 `main-latest` 標記已棄用且不再更新；請改用 `latest`。
:::

在生產環境中請避免使用 `latest`。這個滾動式標記會指向最近的建置，並且可能在不同部署之間變更。

### 安全升級檢查清單 {#safe-upgrade-checklist}

1. **驗證新映像。** 針對新的 release tag 或 digest 執行 `cosign verify`。
2. **在 staging 測試。** 使用您打算採用的 chart 與 values 部署已驗證的映像。
3. **更新您的固定參照。** 變更部署 manifest 中的 digest 或 tag。
4. **部署到生產環境。** 使用您標準的部署流程進行推出。
5. **檢查就緒狀態。** 確認升級後 proxy 運作正常。

### 執行階段使用者與 entrypoint {#runtime-user-and-entrypoint}

[整合的原始碼映像](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/Dockerfile#L212) 以 UID/GID `65532:65532` 執行。它的 entrypoint 接受 `proxy`、`gateway`、`backend`、`ui`、`migrations`、`metrics` 或 `collector` 作為第一個引數。沒有引數，或使用 `--config` 等 CLI 旗標時，會啟動完整的 proxy。請保留此 entrypoint。在 Kubernetes 中透過 `args` 選擇元件。

在依賴該非 root 預設值之前，請檢查您實際使用的映像。較舊的已發佈映像使用不同的 entrypoint，且可能以 root 身分執行：

```bash
docker image inspect "$LITELLM_IMAGE" \
  --format '{{.Config.User}} {{json .Config.Entrypoint}}'
```

將掛載的憑證限制為僅供執行階段使用者存取。如果您使用唯讀的根檔案系統，請為暫存檔案新增可寫入的磁碟區。Chart 不會自動新增它們。請為每個啟用的工作負載（包括 migration Job）設定 security contexts 與掛載。請參閱 [chart values](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/helm/litellm/values.yaml)。

## 延伸閱讀 {#further-reading}

- [CI/CD v2 公告](https://docs.litellm.ai/blog/ci-cd-v2-improvements) 說明 LiteLLM 的簽署基礎架構。
- [部署總覽](./deploy.md) 連結至 Helm、Terraform 與架構指南。
- [cosign 文件](https://docs.sigstore.dev/quickstart/quickstart-cosign/) 涵蓋簽章驗證與金鑰管理。
- [Sigstore Policy Controller](https://docs.sigstore.dev/policy-controller/overview/) 涵蓋 Kubernetes admission control。
