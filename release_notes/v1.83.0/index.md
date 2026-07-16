---
title: "v1.83.0 - 官方發佈（供應鏈事件後）"
slug: "v1-83-0"
date: 2026-03-31T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-1.83.0-nightly
```

</TabItem>
<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.83.0
```

</TabItem>
</Tabs>

## 背景：供應鏈事件後的首次發佈 {#context-first-release-after-supply-chain-incident}

v1.83.0 是第一個透過我們新的 [CI/CD v2 管線](https://docs.litellm.ai/blog/ci-cd-v2-improvements) 建置並發佈的 LiteLLM 版本，延續 [3 月 24 日的供應鏈事件](https://docs.litellm.ai/blog/security-update-march-2026) 之後。

我們暫停了所有發佈一週，期間我們：
1. 與 [Mandiant](https://www.mandiant.com/) 和 [Veria Labs](https://verialabs.com/) 完成了鑑識審查
2. 使用隔離環境與短期憑證，從零重建發佈管線
3. 驗證程式碼庫不含任何入侵指標

如果您對此版本或該事件有任何問題，請參閱我們的 [Security Townhall 貼文](https://docs.litellm.ai/blog/security-townhall-updates) 或透過 `security@berri.ai` 與我們聯絡。

---

## 連結 {#links}

- **PyPI**: [litellm 1.83.0](https://pypi.org/project/litellm/1.83.0/)
- **安全更新**: [供應鏈事件報告](https://docs.litellm.ai/blog/security-update-march-2026)
- **安全 townhall**: [發生了什麼、我們做了什麼、接下來會發生什麼](https://docs.litellm.ai/blog/security-townhall-updates)
- **CI/CD v2**: [LiteLLM 的 CI/CD v2 發佈公告](https://docs.litellm.ai/blog/ci-cd-v2-improvements)
- **4 月穩定性衝刺**: [協助我們規劃](https://github.com/BerriAI/litellm/issues/24825)
