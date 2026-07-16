---
slug: cleaner-release-versions
title: "LiteLLM 版本發布版號制度正在變更：採用標準命名、每週發版升級 MINOR、hotfix 保留 PATCH"
date: 2026-04-28
authors:
  - yuneng
description: "移除 `-stable` 和 `-nightly` 後綴。每週發版將升級 MINOR；PATCH 現在保留給真正的 hotfix。舊版發佈會永久保留其標籤；新版將以 `1.84.0` 開始。"
tags: [release, packaging, docker]
hide_table_of_contents: false
---

*最後更新：2026 年 7 月*

:::warning `main-stable` 已淘汰；請遷移至 `:latest`
舊版 `main-stable` Docker 標籤仍會每週前進，因此現有部署可繼續運作。我們目標在 **2026 年 9 月 1 日** 停止發布它，不過該日期仍在透過 [公開的淘汰討論](https://github.com/BerriAI/litellm/discussions/32090) 最終確認中，可能會因回饋而變動。未來，**`:latest`** 將是指向最新穩定映像的標準滾動指標；每次穩定版發布時會自動前進，並符合標準 Docker 慣例。

`main-stable` 沿用了先前的命名方案，且不符合現代慣例：它將「main」（通常是開發分支）與「stable」（發布通道）混在一起，而且沒有對應的 PyPI 版本。

**遷移：**

- **滾動穩定版（Docker）** → `ghcr.io/berriai/litellm:latest`
- **可重現固定版（Docker）** → `ghcr.io/berriai/litellm:1.84.0`
- **可重現固定版（PyPI）** → `pip install litellm==1.84.0`

此橫幅會在時程確認後更新。
:::

LiteLLM 發布版名稱正在變更。以下兩個痛點一直是推動因素：

**1. `-stable` 和 `-nightly` 後綴不是標準格式。**

像 `v1.83.3-stable` 和 `v1.83.0-nightly` 這類版本不符合 PEP 440（PyPI）或 SemVer 2.0（Docker / Helm）慣例。期待標準版本字串的使用者會感到困惑，而分類版本的工具也必須針對該後綴做特殊處理。

**2. 每週發版一直在升級 PATCH，導致真正的 hotfix 沒有空間。**

在舊模型下，每次排定的每週發版都會升級 PATCH 數字：`1.83.0` -> `1.83.1` -> `1.83.2` -> `1.83.3`。當 `1.83.3` 需要真正的 hotfix 時，下一個 PATCH（`1.83.4`）已經保留給下一週的發版。Docker 的變通作法是 `v1.83.3-stable.patch.1` - 但 PyPI 不接受這種語法，因此同時需要 Docker 映像與 Python wheel 的 hotfix 沒有乾淨的發布方式。

<!-- truncate -->

## 新內容 {#whats-new}

自 **`1.84.0`** 起：

- **移除後綴。** 穩定版將使用純粹的 PEP 440 / SemVer 2.0：`1.84.0`。預發行版則分別使用 PyPI 與 Docker 的標準 PEP 440（`1.84.0rc1`、`1.84.0.dev42`）與 SemVer（`1.84.0-rc.1`、`1.84.0-dev.42`）格式。
- **每週升級 MINOR。** 每個排定的穩定版都會升級 MINOR 元件：`1.84.0` -> `1.85.0` -> `1.86.0`。
- **PATCH 保留給 hotfix。** 當 `1.84.0` 需要修正時，會變成 `1.84.1`。可在所有地方乾淨安裝 - `pip install litellm==1.84.1`、`docker pull ghcr.io/berriai/litellm:1.84.1`。

## 並列比較 {#side-by-side}

| 情境 | 舊名稱 | 新名稱 |
|---|---|---|
| 每週排定穩定版 | `v1.83.3-stable` | `1.84.0` 或 `v1.84.0`（Docker）/ `1.84.0`（PyPI） |
| 目前穩定版上的 hotfix | `v1.83.3-stable.patch.1`（僅 Docker - 無 PyPI 發布） | `1.84.1` 或 `v1.84.1`（Docker）/ `1.84.1`（PyPI） |
| 發行候選版 | `v1.84.0-rc` | `1.84.0-rc.1` 或 `v1.84.0-rc.1`（Docker）/ `1.84.0rc1`（PyPI） |
| 夜間版 | `v1.83.0-nightly` | `1.84.0-dev.42` 或 `v1.84.0-dev.42`（Docker）/ `1.84.0.dev42`（PyPI） |

在 Docker 上，未加前綴（`1.84.0`）與 `v` 前綴（`v1.84.0`）兩種形式都會發布 — 兩者都解析為相同的映像 digest，因此包含 `v` 前綴的現有固定值仍可運作。在 PyPI 上，每個通道都會使用未加前綴的 PEP 440 形式（`1.84.0`，絕不會是 `v1.84.0`）。

hotfix 那一列最具意義。在舊方案下，`v1.83.3-stable.patch.1` 沒有 PyPI 發布。在新方案下，hotfix 會如同一般發布一樣同時發送到兩個 registry 與 PyPI。

## 向下相容性 {#backwards-compatibility}

已經以舊命名方式發布的版本 - `v1.83.x-stable`、`v1.83.x-stable.patch.N`，以及現有的 `1.83.x` PyPI 版本 - **會永久保留在 registry 與 PyPI 上**。您目前固定到的任何版本都會繼續運作。新命名會套用到從 `1.84.0` 開始的新版本。

如果某個維護修補需要套用到切換前的版本線（例如在 `1.83.x` 上修正，而 `1.84.x` 是目前版本），該修補可能會為了維持該版本線內的一致性而繼續使用舊命名 - 發行說明會標示使用了哪種格式。長期而言，所有新版本都會改用新命名。

## 幾件值得知道的事 {#a-few-things-worth-knowing}

- **Docker 標籤中的 `v` 前綴是可選的。** 從此之後，所有 Docker 標籤都會以未加前綴與 `v` 前綴兩種形式發布 — `ghcr.io/berriai/litellm:1.84.0` 與 `ghcr.io/berriai/litellm:v1.84.0` 會解析為同一個映像（相同的 `sha256` digest），發行候選版與 dev/nightly 標籤也同樣如此。包含 `v` 前綴的現有固定值可不需更改而繼續運作。PyPI 版本仍維持未加前綴的 PEP 440 形式：`pip install litellm==1.84.0`（不是 `==v1.84.0`）。
- **`litellm-dev`** - 另外有一個獨立的 `litellm-dev` PyPI 套件與 `*-dev` Docker 映像系列，供臨時與一次性建置使用（例如在修正進入發版前先測試）。**不得用於正式環境。** 任何固定到標準 `litellm` 套件或 `ghcr.io/berriai/litellm:*` Docker 標籤的內容，都不會意外取得 `litellm-dev` 建置。
- **`:latest` Docker 標籤** 指向各個 registry 上最近的穩定版，並會在新穩定版發布時自動前進。對於正式部署，我們仍建議固定到內容標籤（例如 `:1.84.0`），以確保部署可重現。
- **映像簽章**（[cosign verify](/blog/ci-cd-v2-improvements#verify-docker-image-signatures)）與驗證指令在新的標籤格式下仍可正常運作，且無需變更。
