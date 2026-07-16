---
slug: ci-cd-v2-improvements
title: "宣佈 LiteLLM 的 CI/CD v2"
date: 2026-03-30T21:30:00
authors:
  - krrish
description: "CI/CD v2 導入了隔離環境、更強的安全防護欄，以及為 LiteLLM 提供更安全的發佈分離。"
tags: [engineering, ci-cd, security]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

CI/CD v2 現已於 LiteLLM 上線。

<Image
  img={require('../../img/ci_cd_architecture.png')}
  style={{width: '700px', height: 'auto', display: 'block'}}
/>

<br/>
承接我們的 [安全事件](https://docs.litellm.ai/blog/security-townhall-updates#roadmap) 路線圖，CI/CD v2 為 LiteLLM 導入了隔離環境、更強的安全防護欄，以及更安全的發佈分離。

## 有哪些變更 {#what-changed}

- 安全掃描與單元測試在隔離環境中執行。
- 驗證與發佈分離到不同的儲存庫，讓攻擊者更難取得發佈憑證。
- PyPI 發佈採用 Trusted Publishing——這表示發佈時不會使用長效憑證。
- 不可變更的 Docker 發佈標籤——這表示發佈後無法竄改 Docker 發佈標籤 [了解更多](https://docs.docker.com/docker-hub/repos/manage/hub-images/immutable-tags/)。注意：也規劃了 GHCR docker 發佈的相關工作。
- 使用 [Cosign](https://github.com/sigstore/cosign) 進行 Docker 映像簽章——所有發佈映像都已簽署，因此使用者可以自行驗證它們確實來自我們。

## 驗證 Docker 映像簽章 {#verify-docker-image-signatures}

從 `v1.83.0-nightly` 開始，所有發布到 GHCR 的 LiteLLM Docker 映像都會使用 [cosign](https://docs.sigstore.dev/cosign/overview/) 簽署。每個發佈都使用相同的金鑰簽署，該金鑰在 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 中引入。

**使用固定的 commit hash 驗證（建議）：**

commit hash 在密碼學上不可變，因此這是確保您使用原始簽署金鑰的最強方式：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

**使用 release tag 驗證（方便）：**

本儲存庫中的標籤受到保護，並解析為相同的金鑰。此選項較容易閱讀，但仰賴標籤保護規則：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

請將 `<release-tag>` 替換為您要部署的版本（例如 `v1.83.0-stable`）。

預期輸出：

```
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

## 接下來是什麼 {#whats-next}

接下來，我們計劃：
- 採用 OpenSSF（這是一組專案應遵守的安全標準，用來展現強健的安全態勢——[了解更多](https://baseline.openssf.org/versions/2026-02-19.html)）
  - 我們已將 Scorecard 和 Allstar 加入我們的 Github

- 將 SLSA Build Provenance 加入我們的 CI/CD pipeline——這表示我們允許使用者獨立驗證發佈確實來自我們，並防止發佈在公開後遭到靜默修改。

我們希望這將意味著您可以放心，您所使用的發佈是安全且確實來自我們的。

## 原則 {#the-principle}

新的 CI/CD pipeline 反映了以下列出的原則，並設計得更安全且更可靠：

- **限制** 每個套件可以存取的內容
- **減少** 敏感環境變數的數量
- **避免** 已遭入侵的套件
- **防止** 發佈遭竄改

## 如何協助： {#how-to-help}

協助我們規劃 4 月的穩定性衝刺——https://github.com/BerriAI/litellm/issues/24825
