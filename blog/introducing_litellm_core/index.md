---
slug: introducing-litellm-core
title: "推出 litellm-core：邁向更精簡 SDK 的第一步"
description: "持續進行的工作，旨在減少 LiteLLM 的相依性與安裝足跡、改善執行期載入，並加快匯入速度"
authors:
  - joshua
date: 2026-10-08
image: ./cover.png
---

import CoreHero from './CoreHero';

export const Hero = CoreHero;

我們推出 `litellm-core`，作為讓 LiteLLM SDK 更精簡的持續工作的第一步。我們希望應用程式安裝更少的相依性、使用更少的磁碟空間，並花更少的時間載入 SDK。

與我們的原始碼建置比較中的基準 `litellm` 相比，這第一步在安裝後的磁碟空間（含執行期相依性）上帶來了**約 65.6 MB 的減少**。我們會在這個進展上繼續努力，進一步減少相依性，並改善 SDK 的載入方式。

這第一步將 SDK 封裝與既有的發行版分開，從 core 中移除強制的 AWS 與 Python Hugging Face tokenizer 相依性，並且不包含內附的儀表板。您的應用程式繼續使用 `import litellm`。

{/* truncate */}

## 為什麼要獨立的 core 套件 {#why-a-separate-core-package}

LiteLLM 支援廣泛的提供者、端點與整合。一個只進行一般聊天補全呼叫的應用程式，可能不需要 AWS 憑證處理或 Python Hugging Face tokenizers，但這些套件一直是 SDK 預設安裝的一部分。

每個強制相依性都會增加安裝足跡，而且它可能帶來自己的相依性。在需要之前就匯入模組，也會增加啟動時的工作。我們希望當應用程式需要的較少時，開發者安裝與載入的也較少。

`litellm-core` 給了我們一個專門的發行版來改善這個體驗，同時保留既有 `litellm` 套件的相依性預設值。

## 相同的 SDK API {#the-same-sdk-apis}

Core 由共用的 LiteLLM SDK 原始碼建置而成。它保留了提供者請求與回應的轉換、同步與非同步補全、串流、embeddings、token 計算、模型中繼資料與成本計算。路由、重試、備援與一致的提供者錯誤處理仍是 SDK 的一部分。

更廣泛的 API 介面，包括 Responses、影像、音訊與批次操作，也都被保留。支援仍取決於模型與提供者，而具有選擇性相依性的功能需要安裝那些套件。

套件名稱改為 `litellm-core`，但 Python 匯入繼續使用 `litellm`。Core 不包含 Admin UI，也不暴露 gateway CLI 入口點。

## 這第一步改變了什麼 {#what-changes-in-this-first-step}

Core 不再於每次安裝時都要求 `boto3`、`tokenizers` 或 `huggingface-hub`。需要 AWS 憑證解析、請求簽章或事件串流解碼的應用程式可以安裝 `boto3`。使用 Python Hugging Face tokenizer 路徑的應用程式可以安裝 `tokenizers` 與 `huggingface-hub`。

共用的實作會在需要這些選擇性套件的操作時才載入它們，並在它們缺失時提供安裝指引。proxy CLI 也被延後，而不是在 SDK 初始化時匯入。

token 計算仍可透過受支援的原生與 `tiktoken` 路徑使用。如果某條 token 計算路徑退而使用近似值，它會發出警告，讓應用程式能區分估計值與模型專屬的計數。

Core 也直接宣告了 `python-dateutil`。移除三個強制套件並不代表安裝的套件正好少三個：總數取決於它們的遞移相依性與應用程式環境的其餘部分。

## 安裝後的磁碟空間減少約 65.6 MB {#approximately-656-mb-less-installed-disk-space}

我們的原始碼建置比較測得安裝後的磁碟空間（含執行期相依性）**減少約 65.6 MB**。這是我們持續減少應用程式所需安裝內容的工作中，第一個經過測量的步驟。

此比較涵蓋沒有選擇性額外套件的預設安裝。Core 保留共用的 SDK API，排除內附的儀表板資產與 gateway CLI 入口點，並讓 AWS 與 Python Hugging Face tokenizer 套件成為選擇性。加入那些套件會改變安裝足跡。

### 我們如何測量 {#how-we-measured}

- 我們在 [commit 5d207d85](https://github.com/BerriAI/litellm/commit/5d207d85ee547bc323d704bc6aaab901aa0be8b6) 建置了基準 `litellm`，並在 [commit 029a626c](https://github.com/BerriAI/litellm/commit/029a626c99ec8c6012512b18ecea075a90db9dcd) 建置了 `litellm-core`，然後在同一台 Ubuntu x86_64 機器與相同 CPython 版本上，將它們的預設相依性安裝在各自乾淨的環境中，共用相依性的版本相同。這些測量描述的是那些原始碼建置
- 安裝大小計算屬於 SDK 及其執行期相依性的唯一檔案，包括中繼資料與指令碼。它不包括直譯器、常用工具與產生的位元組碼。MB 使用十進位單位，1 MB 等於 1,000,000 位元組。此減少量測量的是磁碟空間，不是 RAM 使用量或推論速度

## LiteLLM 的共用基礎 {#a-shared-foundation-for-litellm}

我們的長期方向是讓 `litellm-core` 成為 LiteLLM 的共同 SDK 基礎，而 `litellm` 最終會包裝它。

對於熟悉 [Pydantic 架構](https://docs.pydantic.dev/latest/internals/architecture/) 的開發者來說，`pydantic` 與 `pydantic-core` 之間的分離是一個有用的類比：共用的核心功能可以在熟悉的公開介面背後演進。

該類比描述的是架構方向。在這第一步中，`litellm` 與 `litellm-core` 是從共用原始碼獨立封裝的。`litellm` 尚未成為包裝 core 的外層。

## 開始使用 {#getting-started}

在一個全新的虛擬環境中，安裝 `litellm-core` 並繼續使用您既有的 `litellm` 匯入。如果您的應用程式使用那些功能，請加入選擇性的 AWS 或 Python tokenizer 套件。

每個環境請選擇一個發行版。`litellm` 與 `litellm-core` 目前會安裝重疊的 Python 檔案，無法共存，即使版本相同也一樣。既有的應用程式可以繼續使用 `litellm` 及其目前的相依性預設值。

[LiteLLM Core 指南](https://docs.litellm.ai/docs/litellm_core) 涵蓋安裝、相依性選擇，以及與 gateway 的區別。

## 持續讓 core 更精簡、更快 {#continuing-to-make-core-leaner-and-faster}

我們的長期目標是將預設安裝降到**總共約 10 個相依性，包括遞移相依性**。這是持續工作的目標，不是這第一個版本的相依性數量。

我們會繼續縮小安裝足跡，並只在相關功能需要時才載入執行期相依性。

更快的匯入仍是該工作的目標，與更少的相依性與更小的安裝並列。隨著我們改善 SDK 載入與使用其執行期相依性的方式，我們會持續測量進展。

隨著 core 成為共同的 SDK 基礎，而 `litellm` 最終包裝它，我們會持續測量這些變更，讓開發者能追蹤進展。
