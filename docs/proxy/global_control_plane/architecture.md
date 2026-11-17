---
title: 全域控制平面參考架構
sidebar_label: 參考架構
toc_max_heading_level: 2
description: 將私有的 LiteLLM 控制平面連接至 AWS、Azure、GCP 或本地資料中心中的區域資料平面。
---

import { GlobalControlPlaneArchitecture } from '@site/src/components/GlobalControlPlaneArchitecture';

# 參考架構 {#reference-architectures}

{/* keep-version-note */}

## 概覽 {#overview}

在管理網路中執行控制平面，並透過私有 HTTPS 將其連接至每個資料平面。企業操作人員使用控制平面端點。應用程式使用其區域推論端點。

控制平面使用專屬的 PostgreSQL 與 Redis 進行[執行期組態](./configuration.md#runtime-configuration)。每個資料平面保有自己的儲存。

服務設定請參閱[組態](./configuration.md)。每個資料平面的複本、可用區域與模型提供者連線，請使用[雲端部署指南](../deploy/cloud/overview.md)。

若要進行 [OIDC token 交換](./configuration.md#data-plane-jwt-authentication)，請允許從控制平面與每個資料平面對 IdP 的外連 HTTPS。控制平面負責交換 token。每個資料平面會擷取 IdP 的簽署金鑰，並以自己的 JWT 組態驗證交換後的 token。

## AWS {#aws}

<GlobalControlPlaneArchitecture cloud="aws" />

管理流量請使用[跨區域 VPC 對等互連](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)。加入兩側的路由與安全群組規則。對等互連不具傳遞性，因此企業連線需分別提供至每個需要的網路。請參閱[對等互連路由與限制](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html)。

## Azure {#azure}

<GlobalControlPlaneArchitecture cloud="azure" />

使用 Application Gateway v2 [私有部署](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-private-deployment)與私有接聽程式。[全域 VNet 對等互連](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)連接各區域網路。在對等互連的網路之間設定私有 DNS 解析。

## GCP {#gcp}

<GlobalControlPlaneArchitecture cloud="gcp" />

GCP 的 [VPC 網路是全域的，子網路則是區域性的](https://docs.cloud.google.com/vpc/docs/vpc)。[VPC 網路對等互連](https://docs.cloud.google.com/vpc/docs/vpc-peering)連接各個獨立的網路。為跨區域管理流量，設定[區域內部負載平衡器的全域存取](https://docs.cloud.google.com/load-balancing/docs/l7-internal/setting-up-l7-internal#enable-global-access)。

## 混合雲 {#hybrid-cloud}

透過 AWS 中的單一控制平面，管理一個 AWS 資料平面與一個本地資料平面。應用程式使用位於自己區域或資料中心的資料平面。

<GlobalControlPlaneArchitecture cloud="hybrid" />

管理 VPC 的 VPN 無法透過 VPC 對等互連提供企業存取至 AWS 資料平面。請參閱[對等互連限制](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html#vpc-peering-limitations)。您可以改用[具有私有虛擬介面的 Direct Connect](https://docs.aws.amazon.com/directconnect/latest/UserGuide/WorkingWithVirtualInterfaces.html)，而非 VPN。
