---
title: LiteLLM Core
sidebar_label: LiteLLM Core
description: 以較少的預設相依性安裝 LiteLLM SDK，並在需要時加入 AWS 與 Python tokenizer 套件
---

# LiteLLM Core {#litellm-core}

`litellm-core` 將 LiteLLM Python SDK 以較少的必要相依性打包，且不含內建儀表板或閘道 CLI 進入點。它使用與 `litellm` 發行版相同的 SDK 原始碼與相同的 `litellm` Python 命名空間

## 選擇套件 {#choose-a-package}

| 套件 | 何時使用 |
| --- | --- |
| `litellm-core` | 您的應用程式直接呼叫 SDK，且您想只在需要時才安裝 AWS 與 Python Hugging Face tokenizer 相依性 |
| `litellm` | 您想要既有的發行版、其相依性預設值與其支援的安裝額外套件 |

若是閘道部署，請依照[閘道快速入門](https://docs.litellm.ai/docs/proxy/docker_quick_start)。Core 不提供 `litellm` 命令或內建 Admin UI

## 安裝 {#install}

在新的虛擬環境中安裝 core：

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install litellm-core
```

在 Windows 上，改用 `.venv\Scripts\activate` 啟用環境

您的 Python 匯入仍使用 `litellm`，包括 `from litellm import completion` 或 `from litellm import Router` 等匯入。發行版名稱是 `litellm-core`；公開匯入命名空間沒有改變

:::warning 每個環境只安裝一個發行版

`litellm` 與 `litellm-core` 會安裝重疊的檔案。在同一個環境中同時安裝兩者會導致 `import litellm` 失敗，即使它們的版本相符

將應用程式移至 core 時，請在其相依性宣告中將 `litellm` 換成 `litellm-core`，並在新的環境中重新產生其 lockfile。如果另一個相依性要求 `litellm`，請在切換前先解決該要求

:::

## SDK 功能 {#sdk-functionality}

Core 保留提供者請求與回應轉換、同步與非同步 completion、串流、embeddings、token 計算、模型中繼資料與成本計算。共用 SDK 也包括 Router、重試、備援與提供者錯誤對應

套件拆分保留了更廣泛的 SDK API 介面，包括 Responses、image、audio 與 batch 操作。模型與提供者的支援仍因端點而異，個別整合可能需要額外套件。參見 [Supported Endpoints](https://docs.litellm.ai/docs/supported_endpoints) 與相關的[提供者指南](https://docs.litellm.ai/docs/providers)

## 選用相依性 {#optional-dependencies}

Core 將 `boto3`、`tokenizers` 與 `huggingface-hub` 從必要相依性中移除。它直接宣告 `python-dateutil`，並繼續要求 `jsonschema` 與 `tiktoken` 等套件

直接安裝選用套件。Core 目前未宣告 `litellm-core[aws]` 或 `litellm-core[tokenizers]` 等安裝額外套件

### AWS 操作 {#aws-operations}

安裝 `boto3` 以進行 AWS 憑證解析、SigV4 簽章與 AWS 事件串流解碼：

```bash
python -m pip install boto3
```

這也會安裝 `botocore`。相依於 AWS 的功能包括已簽章的 Bedrock 請求、SageMaker、Polly，以及 Secrets Manager 與 S3 記錄等 AWS 整合

Bedrock bearer-token 請求準備可以在沒有 `botocore` 的情況下運作。解碼 AWS 事件串流的串流路徑仍需要它，因此僅有 bearer 驗證並不會讓每個 Bedrock 操作都獨立於 AWS 套件

### Python Hugging Face tokenizers {#python-hugging-face-tokenizers}

當您的應用程式使用這些路徑時，安裝 Python tokenizer 套件：

```bash
python -m pip install tokenizers huggingface-hub
```

Core 保留其原生 tokenizer 實作與 `tiktoken` 相依性。Token 計算並非普遍需要選用的 Python Hugging Face 套件。當 token 計算退回近似值時，LiteLLM 會發出警告；請將該結果視為估計值

缺少的選用相依性會在需要它的操作執行時報告，並附上安裝指引

## 安裝足跡 {#installation-footprint}

在相符的原始碼建置比較中，`litellm-core` 將安裝大小減少了 **32.2%**，包括執行階段相依性在內約節省 **65.6 MB**

兩個建置都使用版本 `1.106.0`、相符的共用相依性版本，以及相同的 Linux 機器與 Python 直譯器。測量涵蓋沒有選用額外套件的預設安裝，不包括產生的 bytecode 與常見工具。原始碼建置分別為 baseline [`5d207d85`](https://github.com/BerriAI/litellm/commit/5d207d85ee547bc323d704bc6aaab901aa0be8b6) 與 core [`029a626c`](https://github.com/BerriAI/litellm/commit/029a626c99ec8c6012512b18ecea075a90db9dcd)

## 與 litellm 的關係 {#relationship-to-litellm}

目前，`litellm-core` 與 `litellm` 是從共用原始碼建置的獨立打包發行版。安裝或升級 `litellm` 會繼續使用其既有的相依性集合

規劃中的架構讓 `litellm-core` 成為共用 SDK 相依性，由 `litellm` 包裝它。該關係尚未實作：`litellm` 目前並不相依於 `litellm-core`。請繼續為每個環境選擇一個發行版，並以任一套件使用 `litellm` Python 匯入命名空間
