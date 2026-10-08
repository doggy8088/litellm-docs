---
title: "v1.97.1 - 僅限 Docker 的維護版釋出"
slug: "v1-97-1"
date: 2026-09-02T00:10:30
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

`v1.97.1` 以容器映像分發。此版本沒有 PyPI 套件，因此 `pip install litellm==1.97.1` 將無法解析。如果您是從 PyPI 安裝 LiteLLM，請維持在 `1.97.0`；此版本中的所有內容，要不是容器映像建置修正，就是只會透過映像送達您的相依套件更新。

此版本也不會推進 `latest` 標記。當前穩定版本線是 [`v1.99.0`](/release_notes/v1.99.0/v1-99-0)。

:::

## 部署此版本 {#deploy-this-version}

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.97.1
```

`litellm`、`litellm-database` 和 `litellm-non_root` 這些變體都已在 GHCR 與 Docker Hub 的此標記下發佈，且一如往常皆經過 cosign 簽署。

## 其中內容 {#whats-in-it}

`v1.97.1` 是建立在 [`v1.97.0`](/release_notes/v1.97.0/v1-97-0) 之上的維護性修補程式。不包含產品變更：一個讓映像重新可建置的修正，以及五個第三方相依套件的更新。

### 映像建置 {#image-builds}

所有從 `stable/1.97.x` 建置的映像都開始失敗。Dockerfile 以 digest 鎖定其基底映像，但 `apk add python3` 在建置時是針對 Wolfi 的即時套件儲存庫解析，因此 digest 鎖定從未限制住 Python 版本，而 Wolfi 已經將 `python3` 推進到 3.14。`uvloop` 0.21.0 沒有 3.14 wheel，因此 `uv sync` 退回改從原始碼建置，並在那裡失敗。`migrations` 映像則早一步失敗，且原因不同：其鎖定的基底隨附 glibc 2.43，而 Wolfi 目前的 `python-3.13` 需要 2.44。

現在，所有六個 Dockerfile 都明確鎖定 `python-3.13`、將 `--python python3.13` 傳給每個 `uv sync`，並設定 `UV_PYTHON_DOWNLOADS=0`，因此缺少直譯器時會明確失敗，而不是悄悄下載一個。`migrations` 映像則改用 glibc 2.44 基底。這與導致 1.99.0 pipeline 當機的是同一組失敗，先在那裡修好，然後再挑選回補到這裡。

### 相依套件更新 {#dependency-refresh}

在 Python 這一側，`RestrictedPython` 升至 8.5，`sqlparse` 升至 0.6.0，而 `pypdf` 升至 6.15.0，都是維持版本最新所需的最小幅度更新。`RestrictedPython` 更新也將 `proxy` 額外套件的下限提高到 `>=8.5,<9.0`，與開發分支上使用的範圍一致。只有在您從此分支自行建置套件時，該下限才有影響，因為 1.97.1 沒有 PyPI 成品。

在 Admin UI 的 lockfile 中，`nanoid` 升至 3.3.18，而 `browserslist` 升至 4.28.8。兩者都不是直接相依套件，因此儀表板的宣告相依套件沒有任何變更；`browserslist` 會連同它自己的建置資料套件一起帶上。此映像中的儀表板套件已根據新的 lockfile 重新建置。

`build_from_pip` Docker 映像在主 lockfile 之外鎖定 `pypdf`，且一直停留在 6.7.5。現在它安裝 6.15.0，也就是 lockfile 解析出的同一版。該映像是建置變體，不是已發佈的 proxy 映像。

`pypdf` 在 `osv-scanner.toml` 中有兩個項目帶有已經過期的 `ignoreUntil` 日期，因此它們已不再抑制任何內容。這些項目已移除。

### 變更內容 {#whats-changed}

- chore(deps): 重新整理過期的相依性固定版本並發佈 1.97.1 - [PR #39200](https://github.com/BerriAI/litellm/pull/39200)
- fix(docker): 將 apk python 固定到 3.13，並在 stable/1.97.x 上升級 wolfi-base - [PR #39212](https://github.com/BerriAI/litellm/pull/39212)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.97.0...474d7e50f09de2cbfe1c141ac29aca5246e0c0d7
