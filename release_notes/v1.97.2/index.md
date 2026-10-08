---
title: "v1.97.2 - 僅限 Docker 的依賴重新整理"
slug: "v1-97-2"
date: 2026-09-03T18:54:20
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

:::info[這是僅限 Docker 的版本]

`v1.97.2` 以容器映像形式發佈。此版本沒有 PyPI 套件，因此 `pip install litellm==1.97.2` 不會解析。如果您從 PyPI 安裝 LiteLLM，請維持在 `1.97.0`；此版本的唯一變更是重新整理三個鎖定的第三方相依套件，而這些變更只會透過映像傳送給您。

此版本也不會移動 `latest` 標籤。目前的穩定版本線是 [`v1.99.1`](/release_notes/v1.99.1/v1-99-1)。

:::

## 部署此版本 {#deploy-this-version}

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.97.2
```

`litellm`、`litellm-database` 和 `litellm-non_root` 變體都已在 GHCR 和 Docker Hub 以此標籤發佈，且一如往常皆已進行 cosign 簽署。

## 其中包含什麼 {#whats-in-it}

`v1.97.2` 是建構在 [`v1.97.1`](/release_notes/v1.97.1/v1-97-1) 之上的維護修補程式。它沒有產品變更，也沒有 Dockerfile 變更：差異只有 `uv.lock` 加上版本字串。

### 相依性重新整理 {#dependency-refresh}

映像掃描器已開始針對已發佈的 `v1.97.1` 映像標記兩個 Python 套件，且兩者在同一系列的較新修補版中都有可用的修正。`tornado` 從 6.5.7 升級到 6.5.8，`pypdf` 從 6.15.0 升級到 6.16.1。`gitpython` 在同一次變更中從 3.1.58 升級到 3.1.61；它只會透過 `mlflow-skinny` 被帶入，且不會進入 proxy 映像，因此掃描器從未回報過它，但現在那邊的鎖定也已乾淨。

這三者都是在 `pyproject.toml` 已允許的範圍內進行僅限鎖定的升級，因此安裝合約沒有任何變更，而且每個套件都是在各自的 commit 中更新，沒有其他套件漂移。`litellm_internal_staging` 已解析到等於或高於這三個版本，因此從這個修補程式升級到較新版本時，不會把其中任何一個版本往回帶。

### 有哪些變更 {#whats-changed}

- chore(release): 在 stable/1.97.x 上升級 tornado 和 pypdf 並釋出 1.97.2 - [PR #39580](https://github.com/BerriAI/litellm/pull/39580)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.97.1...0884a61e4d3ed8ae0f1849396a8a8425866f2d8f
