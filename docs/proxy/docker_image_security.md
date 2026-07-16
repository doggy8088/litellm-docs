# Docker 映像安全指南 {#docker-image-security-guide}

LiteLLM 自 **v1.83.0** 起會為發佈到 GHCR 的每個 Docker 映像簽署 [cosign](https://docs.sigstore.dev/quickstart/quickstart-cosign/)。本頁說明如何驗證簽章、在 CI/CD 中強制驗證，以及遵循建議的部署模式。

## 已簽署的映像 {#signed-images}

發佈到 `ghcr.io/berriai/` 的所有映像變體都使用相同的 cosign 金鑰簽署：

| 映像 | 說明 |
|---|---|
| `ghcr.io/berriai/litellm` | 核心 proxy |
| `ghcr.io/berriai/litellm-database` | 附帶 Postgres 相依性的 proxy |
| `ghcr.io/berriai/litellm-non_root` | 非 root 變體 |
| `ghcr.io/berriai/litellm-spend_logs` | Spend-logs sidecar |

該簽署金鑰是在 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 中導入的，而公開金鑰已提交到儲存庫中的 [`cosign.pub`](https://github.com/BerriAI/litellm/blob/main/cosign.pub)。

:::info Enterprise 映像
Enterprise 映像（`litellm-ee`）遵循相同的簽署流程。請聯絡 [support@berri.ai](mailto:support@berri.ai) 以確認您特定 enterprise 映像標記的涵蓋範圍。
:::

## 驗證映像簽章 {#verify-image-signatures}

請依照 [官方說明](https://docs.sigstore.dev/cosign/system_config/installation/) 安裝 cosign。

### 使用固定的 commit hash 驗證（建議） {#verify-with-the-pinned-commit-hash-recommended}

commit hash 在密碼學上不可變，使這成為最強的驗證方法：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm:v1.89.4
```

將映像參照替換為任何已簽署的變體：

```bash
# litellm-database
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm-database:v1.89.4

# litellm-non_root
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm-non_root:v1.89.4
```

### 使用 release tag 驗證（方便） {#verify-with-a-release-tag-convenience}

此儲存庫中的標記受到保護，並會解析為相同的金鑰：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/v1.89.4/cosign.pub \
  ghcr.io/berriai/litellm-database:v1.89.4
```

### 預期輸出 {#expected-output}

```
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

## 在 CI/CD 中強制驗證 {#enforce-verification-in-cicd}

### Kubernetes — Sigstore 政策控制器 {#kubernetes--sigstore-policy-controller}

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
          MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEKi4ivqGpE231OGH50PKbqy1Y1Kkb
          POJC8+i2Wko82gBOUCe3M0Vw86H/4rhUhfoYEti4gdJ9wZbYmK0I2EE96g==
          -----END PUBLIC KEY-----
```

3. 標記命名空間以啟用強制執行：

```bash
kubectl label namespace litellm policy.sigstore.dev/include=true
```

該命名空間中任何使用未簽署 `ghcr.io/berriai/litellm*` 映像的 Pod，都會在 admission 時被拒絕。

### GCP — 二進位授權 {#gcp--binary-authorization}

[Binary Authorization](https://cloud.google.com/binary-authorization/docs) 可在 Cloud Run 和 GKE 上強制執行 cosign 簽章。

1. 使用 LiteLLM 公開金鑰建立一個基於 cosign 的 attestor：

```bash
# Import the public key into a Cloud KMS keyring or use a PGP/PKIX attestor.
# See: https://cloud.google.com/binary-authorization/docs/creating-attestors-console
```

2. 設定一個 Binary Authorization policy，要求 `ghcr.io/berriai/litellm*` 映像必須通過該 attestor。

3. 在您的 Cloud Run service 或 GKE 叢集上啟用此 policy。

請參閱 [GCP Binary Authorization 文件](https://cloud.google.com/binary-authorization/docs/setting-up) 以取得完整設定步驟。

### AWS — ECS / ECR {#aws--ecs--ecr}

AWS 在部署時不會原生驗證 cosign 簽章。常見做法如下：

- **CI/CD gate**：在推送到 ECR 或更新 ECS task definition 之前，於您的部署 pipeline 中執行 `cosign verify`。若驗證失敗，則讓 pipeline 失敗。
- **在 EKS 上使用 OPA/Gatekeeper**：如果在 EKS 上執行，請使用 Sigstore Policy Controller（與上方的 Kubernetes 方法相同）。

### GitHub Actions 閘門 {#github-actions-gate}

在任何部署工作之前新增一個驗證步驟：

```yaml
- name: Verify LiteLLM image signature
  run: |
    cosign verify \
      --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
      ghcr.io/berriai/litellm-database:${{ env.LITELLM_VERSION }}
```

## 建議的部署模式 {#recommended-deployment-patterns}

### 依 digest 固定 {#pin-by-digest}

digest 固定可保證精確的映像內容，無論標記如何變動：

```yaml
image: ghcr.io/berriai/litellm-database@sha256:<digest>
```

拉取後取得 digest：

```bash
docker inspect --format='{{index .RepoDigests 0}}' \
  ghcr.io/berriai/litellm-database:v1.89.4
```

Cosign 驗證也可搭配 digest 使用：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm-database@sha256:<digest>
```

### 使用穩定的 release tags {#use-stable-release-tags}

如果 digest 固定對您的工作流程來說過於嚴格，請使用一般的 semver / PEP 440 release tags（例如 `v1.86.2`）。這些是不可變更的 release tags，不會被覆寫。

:::warning `main-stable` 與 `main-latest` 已棄用

LiteLLM 已改用 PEP 440 / semver 版本控制，因此穩定版現在會以一般 `vX.Y.Z` 標記（例如 `v1.86.2`）發佈，而不是較舊的 `vX.Y.Z-stable` 形式。滾動式 `main-stable` 標記仍在更新以維持向後相容性，但已棄用；請改為固定到特定的 `vX.Y.Z` 標記（或 digest）。滾動式 `main-latest` 標記已棄用且不再更新；請改用 `latest`。
:::

在生產環境中請避免使用 `latest`。這個滾動式標記會指向最近的建置，並且可能在不同部署之間變更。

### 安全升級檢查清單 {#safe-upgrade-checklist}

1. **驗證新映像** — 針對新的 release tag 或 digest 執行 `cosign verify`。
2. **在 staging 測試** — 將已驗證的映像部署到非生產環境。
3. **更新您的固定參照** — 變更部署 manifest 中的 digest 或 tag。
4. **部署到生產環境** — 使用您標準的部署流程進行推出。
5. **監控 `/health`** — 確認升級後 proxy 運作正常。

## 延伸閱讀 {#further-reading}

- [CI/CD v2 公告](https://docs.litellm.ai/blog/ci-cd-v2-improvements) — LiteLLM 簽署基礎架構的背景
- [Docker 部署指南](./deploy.md) — 完整的 Docker、Helm 與 Terraform 設定
- [cosign 文件](https://docs.sigstore.dev/quickstart/quickstart-cosign/) — cosign 使用方式與金鑰管理
- [Sigstore Policy Controller](https://docs.sigstore.dev/policy-controller/overview/) — Kubernetes admission control
