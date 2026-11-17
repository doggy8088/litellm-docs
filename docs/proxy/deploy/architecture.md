---
title: 參考架構
sidebar_label: 總覽
toc_max_heading_level: 2
description: 選擇雲端部署、保護用戶端存取，並規劃 LiteLLM 的可用性、安全發佈與多個區域。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 參考架構 {#reference-architectures}

{/* keep-version-note */}

雲端基礎架構、用戶端存取與可用性的參考設計。

## 選擇主題 {#cloud-architectures}

<Tabs queryString="architecture">
<TabItem value="cloud" label="雲端" default>

### 選擇您的基礎架構 {#choose-your-infrastructure}

[雲端部署](./cloud/overview.md)：[Azure](./cloud/azure.md)、[AWS](./cloud/aws.md) 與 [GCP](./cloud/gcp.md) 的架構圖，包含網路邊界、入口、資料儲存與提供者出口。

</TabItem>
<TabItem value="iap" label="Identity-Aware Proxy">

### 在流量到達 LiteLLM 之前檢查身分 {#check-identity-before-traffic-reaches-litellm}

[Identity-Aware Proxy](./iap/overview.md)：使用 [Cloudflare Access](./iap/overview.md#cloudflare)、[AWS ALB](./iap/overview.md#aws)、[Microsoft Entra Application Proxy](./iap/overview.md#azure) 或 [Google Cloud IAP](./iap/overview.md#gcp) 驗證呼叫者。將已驗證的身分轉送給 LiteLLM，以套用使用者與團隊權限。

</TabItem>
<TabItem value="mtls" label="mTLS">

### 要求用戶端憑證 {#require-a-client-certificate}

[使用 mTLS 的用戶端驗證](./mtls.md)：在入口驗證用戶端憑證，並將工作負載身分轉送給 LiteLLM。使用虛擬金鑰管理模型存取與預算。包含負載平衡器與 API 閘道設定。

</TabItem>
<TabItem value="ha" label="高可用性">

### 在故障與發佈期間持續提供服務 {#keep-serving-through-failures-and-releases}

在[高可用性](./ha/overview.md) 中規劃副本、可用性區域與資料儲存可用性。使用[藍綠部署](./ha/blue_green.md) 進行受控切換，或使用[金絲雀部署](./ha/canary.md) 進行漸進式發佈。

如需多個區域，請參閱[多區域部署](../multi_region.md)、[路由](./multi_region/routing.md) 與[故障轉移](./multi_region/failover.md)。

</TabItem>
<TabItem value="control-plane" label="控制平面">

### 管理獨立部署 {#manage-independent-deployments}

[全域控制平面](../global_control_plane.md) 為獨立部署提供單一管理 API，涵蓋機群清單、用量報告與稽核匯出。每個資料平面都有自己的資料庫、Redis、金鑰與預算。請參閱 [AWS、Azure 與 GCP 架構](../global_control_plane/architecture.md) 或現有的 [UI 部署選取器](../global_control_plane/legacy_ui.md)。

</TabItem>
</Tabs>
