---
slug: laya-nimble-classifiers
title: "新增自架 Auto Router 分類器：Laya 與 Nimble"
date: 2026-10-02T12:00:00
authors:
  - tin
description: "使用 Laya 或 Bespoke Nimble 在您自己的基礎架構上對 Auto Router 請求進行分類。控制分類執行的位置、您提供哪個模型，以及如何佈建它。"
image: ./cover.png
tags: [auto-router, product, ai-gateway]
hide_table_of_contents: false
---

import cover from './cover.png';

export function Hero() {
  return (
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={typeof cover === 'string' ? cover : cover.src.src} />
      <img src={require('./cover.gif').default} width="1200" height="630" alt="Laya and Nimble self-hosted classifiers: LiteLLM Auto Router sends classification to either model inside your infrastructure, then routes the request to the selected completion model." />
    </picture>
  );
}

LiteLLM Auto Router 現在支援 **Laya** 和 **Bespoke Nimble** 作為自架分類器。在您的基礎架構上執行任一模型，以選擇由哪個 completion model 處理每個請求。您的應用程式仍會呼叫相同的 router endpoint。

{/* truncate */}

## 為什麼要自架分類器？ {#why-self-host-a-classifier}

客戶希望將分類維持在本地、避免再依賴另一個 hosted classifier vendor，並使用他們已在運作的 cluster。自架可讓您控制：

- **Prompt 資料。** 在您控制的伺服器上處理分類 context，並使用您自己的存取與 logging policy。
- **供應商依賴。** 不必註冊另一個 hosted classifier service 的帳戶，即可執行分類器。
- **部署位置。** 選擇分類執行的 network 與 region，包括您現有的 private cluster。
- **容量與延遲調校。** 為您的流量配置 compute，讓 model 保持 warm，並將其放在靠近 gateway 的位置。
- **模型版本。** 選擇您提供的受支援 checkpoint，並決定何時推出升級。
- **運算成本。** 使用您的基礎架構預算，並針對您的 workload 將其成本與 hosted inference 進行比較。

您負責營運並支付分類器服務費用。使用 [evaluation guide](/docs/auto_router/evaluate) 在您自己的流量上衡量延遲、routing 品質與總成本。

## 運作方式 {#how-it-works}

1. 您的應用程式將請求送至 LiteLLM Auto Router。
2. 您的自架分類器會選擇一個 complexity tier，例如 `SIMPLE` 或 `COMPLEX`。
3. LiteLLM 會呼叫指派給該 tier 的 completion model 來產生答案。

completion model 仍會收到該請求。您可另行選擇該模型是本地執行，還是透過 hosted provider 執行。

## 開始使用 {#get-started}

將您的分類器 endpoint 連接到 LiteLLM：

- **[Connect Laya](/docs/auto_router/decision_classifiers#laya-self-hosted-http-server)：** 設定伺服器的 base URL、憑證與分類器模型。
- **[Connect Nimble](/docs/auto_router/decision_classifiers#nimble-self-hosted-system-one-server)：** 連接您的 System One endpoint，並選取其提供的模型。

在 **Models + Endpoints → Auto Router** 中，選取 **OSS Classifier**，選擇您的提供者，並將 completion models 指派給各 tier。使用 **[Test Routing](/docs/auto_router/decision_classifiers#test-routing-and-send-a-request)** 在送出 completions 之前檢查選擇結果。

**[connection guide](/docs/auto_router/decision_classifiers)** 說明了 endpoint 設定與憑證，並提供一個 **[complete YAML example](/docs/auto_router/decision_classifiers#configure-the-router)** 以設定 tiers 與 fallback 行為。Jev 仍可作為 hosted classifier 選項。
