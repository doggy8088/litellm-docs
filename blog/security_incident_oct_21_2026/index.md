---
slug: security-incident-oct-21-2026
title: "已控制：2026 年 10 月 21 日 LiteLLM 版本 v1.107.0 遭到入侵"
date: 2026-10-21T10:00:00
authors:
  - krrish
  - ishaan
  - oliver
  - nate
description: "LiteLLM 版本 v1.107.0 遭到惡意行為者入侵。"
tags: [security, incident-report]
hide_table_of_contents: false
---

> **狀態：** 事件已控制，調查位於[這裡](/blog/security-incident-oct-21-2026-attack-chain)

> **最後更新：** October 21, 2026 20:30 UTC

2026 年 10 月 21 日清晨，LiteLLM 的發布管線遭到入侵
並將 v1.107.0 推送至 docker registry 與 PyPi。此版本包含
會竊取憑證並載入遠端程式碼執行工具的編譯後惡意軟體。
所有先前版本都是安全的，受影響的版本已被下架。
**執行 LiteLLM 私有企業版的企業客戶未受影響。**

**更新（20:30 UTC）：** 我們相信我們已識別出促成此次攻擊的攻擊鏈。攻擊者必須入侵多個獨立的安全管控才能成功。請參見下方的**如何發生**。

**更新（October 23, 21:50 UTC）：** 本文撰寫時我們的調查仍在進行中。我們在狀態更新與下文中反映的一些假設與看法，後來發現並不準確或不完整。我們將它們保留原貌，作為我們調查的記錄，但已在[這裡](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)發布了權威記錄。

**更新（October 30）：** 10 月 23 日輪換我們 cosign 映像簽署金鑰的那個 commit 現在在 GitHub 上顯示為已驗證，我們已將新金鑰的指紋加入本文。請參見[映像簽署金鑰輪換](/blog/security-incident-oct-21-2026#image-signing-key-rotation)。

**更新（November 15）：** 自 `v1.111.0-dev.3` 起，版本改以無金鑰 cosign 簽署，而非儲存的金鑰。請參見[無金鑰簽署](/blog/security-incident-oct-21-2026#keyless-signing)。

{/* truncate */}

---

## TLDR; {#tldr}

- 惡意的 `litellm==1.107.0` 套件已發布至 PyPI，上線約 2 小時（11:39 UTC 至 13:23 UTC）。**它已被下架。**
- Docker 映像 `v1.107.0`、`latest`、`main-latest` 與 `main-stable` 在 11:46 UTC 至 14:20 UTC 期間遭到入侵。**`v1.107.0` 映像已被移除，其他映像已指向安全來源。**
- **執行 LiteLLM 私有企業版的企業客戶未受影響。**

## 總覽 {#overview}

2026 年 10 月 21 日約凌晨 4:40 AM PDT（11:40 UTC），LiteLLM 的發布管線遭到入侵
並將 v1.107.0 推送至 docker registry 與 PyPi。此版本包含
會竊取憑證並載入遠端程式碼執行工具的編譯後惡意軟體。
所有先前版本都是安全的，受影響的版本已被下架。

## 已確認受影響的版本 {#confirmed-affected-versions}

以下 LiteLLM 產出物受到影響：

- **PyPI：`litellm==1.107.0`**：全部七個 wheel，於 11:39:51 至 13:23 UTC 上線
- **Docker Hub：`v1.107.0`、`latest`、`main-latest` 與 `main-stable`**：於 11:46:56 至 14:20 UTC 指向遭入侵的映像索引 `sha256:1bbcb1443bc962e45f5aad53fe3d2c30600e0379715fb6c664cdd3ac126c339e`
- **GHCR：`v1.107.0`、`latest`、`main-latest` 與 `main-stable`**：於 11:46:56 UTC 起指向下列遭入侵的映像索引，直到 13:51 UTC 前被設為不可用
  - `ghcr.io/berriai/litellm`：`sha256:1bbcb1443bc9…`
  - `ghcr.io/berriai/litellm-database`：`sha256:c00f9d92c427…`
  - `ghcr.io/berriai/litellm-non_root`：`sha256:7b00e91cd2fe…`

GitHub 中官方的 `v1.107.0` 原始碼標籤不包含惡意檔案。遭入侵的產出物是從攻擊者控制的儲存庫建置的。

如果您安裝或執行了任何這些產出物，請立即檢視下方的建議。

注意：這些產出物已從 PyPI、Docker Hub 與 GHCR 移除。

---

## 誰受到影響 {#who-is-affected}

如果您在 11:39 至 13:23 UTC 之間透過 pip 使用了未釘選版本的 LiteLLM，或在 11:46 至 14:20 UTC 之間使用了 docker 映像 `v1.107.0`、`latest`、`main-latest` 或 `main-stable`，您就受到影響。

**OSS 使用者**

如果您對 LiteLLM v1.107.0 執行了 `pip install`，或在遭入侵的區間內啟動了 docker 映像，請假設它已遭到入侵。

目前，請將您的版本釘選至 1.106.2 或先前發布的任何明確版本。

**企業客戶**

目前存在一個供企業客戶使用的私有 LiteLLM registry，我們在其中分發一個受禁運的版本，用以修復一個預定於 10 月 27 日揭露的弱點。我們的私有 registry 未受影響。如果您是從我們的私有 registry 拉取的企業客戶，您不受影響。

### 如何檢查您是否受到影響 {#how-to-check-if-you-are-affected}

如果您對 LiteLLM v1.107.0 執行了 `pip install`，或在遭入侵的區間內啟動了 docker 映像，請假設它已遭到入侵。

- 如果某個環境以 litellm==1.107.0 啟動了 Python，將該環境視為已遭入侵。您可以使用 `pip show litellm` 檢查。
- 如果某個容器執行了受影響的映像摘要 sha256:1bbcb1443bc962e45f5aad53fe3d2c30600e0379715fb6c664cdd3ac126c339e，將它視為已遭入侵。
- 在檔案系統中搜尋 litellm-1.107.0.dist-info、cook.pth 與 sitecustomize.py 的證據。找到其中之一可確認暴露，但找不到並不能證明環境是乾淨的。

我們將發布更多關於如何具體尋找入侵跡象的細節。目前，您可以在這個 [GitHub Issue](https://github.com/BerriAI/litellm/issues/47826#issue-5960147552) 中找到攻擊的細節與我們的初步回應。

### 如果您受到影響該怎麼做 {#what-to-do-if-you-are-affected}

這些指示由協助我們偵測此次事件的 [LidorMachluf](https://github.com/LidorMachluf) 提供。

**不要從 `pip install` 開始。** 在受影響環境中的任何 Python 啟動都會再次執行 `cook.pth` 與 `sitecustomize.py`，這包括執行 pip。

1. 從 shell 中，從**每個**受影響的 site-packages 刪除 `cook.pth`、`cook.py`、`sitecustomize.py` 以及任何相符的 `__pycache__/cook*.pyc` 與 `sitecustomize*.pyc`。
2. 終止分離的 python 背景程序（它持有 `/tmp/remote_code_loader.lock`）。
3. 重新安裝並釘選至 `litellm==1.106.2`。從頭重建映像與 venv 更好。
4. **如果 1.107.0 曾安裝在具有對外網際網路連線的主機上，請假設竊取已成功。** 如果標記檔案存在，竊取即獲確認。如果不存在，那什麼也不能證明：容器與 tmp 清理會將它移除。
5. 輪換該主機能觸及的上述一切。特別是：
   - 執行個體/任務 IAM 角色
   - **儲存在 LiteLLM proxy DB 中的每個提供者金鑰**，以及主金鑰與虛擬金鑰
   - `DATABASE_URL` 密碼
   - 主機上任何程序環境中的任何秘密
6. 檢查 CloudTrail 中安裝時間前後來自執行個體角色的 `GetCallerIdentity`，然後檢查該角色憑證是否從您的基礎設施之外被使用。

---

## 這是如何發生的？ {#how-this-happened}

:::tip Notice
本文撰寫時我們的調查仍在進行中。我們在狀態更新與下文中反映的一些假設與看法，後來發現並不準確或不完整。我們將它們保留原貌，作為我們調查的記錄，但已在[這裡](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)發布了權威記錄。
:::

在 3 月的先前事件之後，我們[大幅強化了我們的 CI 發布管線](/blog/ci-cd-v2-improvements)。我們將發布移至私有儲存庫，透過 Trusted GitHub Publishers 使用一組嚴格的工作流程來建立它們，讓我們的 docker 發布標籤不可變，並正在簽署 docker 映像。

### 正常的發布流程 {#normal-release-flow}

1. **切出 release-candidate 分支與標籤。** 這在週五凌晨 3 點發生，分支與標籤不會變更。
2. **驗證 release candidate。** 我們透過整合測試執行程式碼，公開透過 CircleCI、私下透過 Buildkite，並檢查一切正確。
3. **建立產出物。** 這一步是 GitHub 工作流程，在私有儲存庫中執行，並根據已驗證的 SHA 建立產出物。這必須由對私有發布儲存庫具有寫入權限的工程師執行。
4. **將產出物部署至測試環境。** 我們對產出的產出物執行第二輪測試。
5. **發布產出物。** 這是 GitHub 工作流程，使用 Trusted GitHub Publishers 發布前一步建立的產出物。發布只能由一個鎖定於特定筆記型電腦的帳號執行，該電腦始終實際位於我們的辦公室內。發布時不會重建任何 docker 映像。

### 它如何被破壞 {#how-it-was-undermined}

1. 週一，我們暫時擴大了發布權限，允許兩位內部工程師為客戶發布每日錯誤修復 backport。
2. 攻擊者取得了三組開發者 GitHub CLI 憑證的存取權（[更多內容見下文](#github-cli-oauth-token-exposure)）。其中一組有能力執行 GitHub 工作流程。
3. 攻擊者試圖合併一項變更，允許 releaser 指向不同的來源儲存庫，但因我們的保護措施而未能成功。攻擊者持有的一枚權杖屬於我們兩位 GitHub 組織擁有者之一。攻擊者用它停用了分支保護並強制推送該變更。
4. 最後，他們執行了遭入侵的工作流程，指向一個相似名稱的儲存庫（`Berri-AI/litellm` 而非 `BerriAI/litellm`），該工作流程簽署並發布了被投毒的產出物。

### GitHub CLI OAuth 權杖暴露 {#github-cli-oauth-token-exposure}

經過徹底調查，我們觀察到在特定情況下，Claude Code 會將使用者的 GitHub CLI OAuth 權杖嵌入回應本文中，而在回應本文被記錄的情況下，這些權杖可能出現在 LiteLLM 記錄中。

### 存取我們的內部 LiteLLM 部署 {#access-to-our-internal-litellm-deployment}

我們在內部 LiteLLM 部署中識別出一個意外的、名稱無害的使用者帳號，該部署暴露於公開網際網路。我們相信攻擊者取得了此部署的存取權，從其記錄中取得 GitHub CLI OAuth 權杖，並隨後使用這些憑證入侵了我們的發布工作流程。

我們尚未確認攻擊者如何取得我們內部部署的存取權，但目前懷疑是透過一個最近修補的弱點。

### 持續調查 {#continued-investigation}

我們仍在確認上述部分內容，並識別時間線。我們將在發現更多細節時發布。

此致，
Oliver、Krrish 與 Ishaan

---

## 時間線 {#timeline}

所有時間皆為 2026 年 10 月 21 日的 UTC。

- 10:08:29：GitHub 分支保護拒絕了對我們私有發布工作流程的未經授權修改，因為它未通過必要的 pull-request 與狀態檢查流程。
- 10:08:34：與特權開發者帳號關聯的憑證被用來覆寫這些保護，並套用工作流程 commit 9cf97e935aeaf791b9c8db224a2bb3ee156134ce。
- 10:46:39：修改後的工作流程開始了一次官方 staging 執行。它使用了攻擊者控制的來源儲存庫 Berri-AI/litellm，commit 為 20535d8fa11f786a6c24df7488a0e449ed5f09ad。
- 11:08:09：staging 執行成功完成。
- 11:08:53：生產發布管線開始。
- 11:11:18：與第二位開發者帳號關聯的憑證被用來滿足生產核准閘門。
- 11:39:51–11:40:13：七個惡意的 litellm==1.107.0 wheel 被上傳至 PyPI。官方 1.107.0 原始碼標籤不包含惡意檔案。
- 11:46:56：同一版本的容器發布工作執行。已發布的 Docker 映像包含來自攻擊者控制來源的惡意內容。
- 11:53:49–11:54:01：與第三位開發者帳號關聯的憑證被用來刪除生產與 staging 工作流程記錄。這限制了可供調查的工作流程記錄。
- 12:09:38–12:24:52：未經授權的工作流程修訂被移除，發布工作流程恢復為其先前修訂。
- 13:23 前：PyPI 已移除 litellm==1.107.0。
- 13:51：registry 驗證發現受影響的 GHCR 標籤不可用。Docker Hub 標籤 v1.107.0、latest、main-latest 與 main-stable 仍解析為遭入侵的映像索引 sha256:1bbcb1443bc962e45f5aad53fe3d2c30600e0379715fb6c664cdd3ac126c339e。
- 14:20：所有受影響的 Docker Hub 標籤與映像變體已被移除或重新指向經驗證的乾淨產出物。

## 回應與修復 {#response-and-remediation}

我們已採取下列步驟：

- 從 PyPI 移除了遭入侵的套件
- 在我們調查入侵範圍期間，將維護者憑證撤銷至最低必要程度

### 映像簽署金鑰輪換 {#image-signing-key-rotation}

:::info Update (November 15)
我們不再以金鑰簽署版本。自 `v1.111.0-dev.3` 起，版本改以無金鑰 cosign 簽署，請參見[無金鑰簽署](#keyless-signing)。本節中的金鑰只能驗證在此之前發布的版本。
:::

我們相信，當攻擊者[竊取了其他權杖](/blog/security-incident-oct-21-2026-attack-chain#exfiltrating-additional-tokens)時，我們先前 cosign 金鑰的私密部分已被暴露，因此在 10 月 23 日，我們在 [commit `e82a3c6`](https://github.com/BerriAI/litellm/commit/e82a3c646908ba0a6ee0beddc4310d7a6cac4065) 中將其替換為新金鑰，並在 [PR #48103](https://github.com/BerriAI/litellm/pull/48103) 中合併。使用新金鑰簽署的第一批版本 `v1.103.8`、`v1.104.6`、`v1.105.4` 與 `v1.106.3` 已於 10 月 24 日發布。

新公開金鑰檔案 `cosign.pub` 的 SHA-256 指紋是：

```
e3fe3e08c44b16407fe0b37c43b4f8b603b3a0f4ee74c29e647bc022d762c2c0
```

檢查您用來驗證的金鑰與其相符：

```bash
curl -sL https://raw.githubusercontent.com/BerriAI/litellm/e82a3c646908ba0a6ee0beddc4310d7a6cac4065/cosign.pub | shasum -a 256
```

較早的映像以來自 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 的先前金鑰簽署。只在 10 月 21 日 `v1.107.0` 發布之前發布的映像上信任先前金鑰的簽署。遭入侵的 `v1.107.0` 映像也帶有先前金鑰的有效簽署，因此請將它們的摘要與上方的[受影響版本](#confirmed-affected-versions)進行對照。完整的驗證命令請參見 [Docker 映像安全指南](/docs/proxy/docker_image_security)。

### 無金鑰簽署 {#keyless-signing}

自 2026 年 11 月 15 日的 `v1.111.0-dev.3` 起，發布映像與 Helm chart 改以無金鑰 cosign 簽署。不再有儲存的簽署金鑰。每次發布執行都會從 Sigstore 取得一張短效憑證，該憑證綁定我們發布工作流程的身分，且簽署會記錄在公開的 Rekor 透明記錄中。

以下列方式驗證以此方式簽署的版本：

```bash
cosign verify \
  --certificate-identity https://github.com/BerriAI/project-releaser/.github/workflows/release.yml@refs/heads/main \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/berriai/litellm:<release-tag>
```

`cosign verify --key` 無法用於這些版本。請改用上方的無金鑰命令。

在 `v1.111.0-dev.3` 之前發布的版本保留其金鑰簽署，並以[映像簽署金鑰輪換](#image-signing-key-rotation)中的金鑰驗證。[映像簽署公告](https://github.com/BerriAI/litellm/discussions/48242)有完整的清單，列出哪些版本以哪把金鑰簽署。


---

如果您在 LiteLLM 中發現安全問題，請透過我們的 [bug bounty 計畫](https://github.com/BerriAI/litellm/security) 回報。
