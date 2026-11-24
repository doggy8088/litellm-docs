---
title: 雲端部署
sidebar_label: 總覽
description: 透過 Azure、AWS 與 Google Cloud 上的私有雲端前端，為企業使用者部署 LiteLLM。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { CloudArchitecture } from '@site/src/components/CloudArchitecture';

# 雲端部署 {#cloud-deployments}

{/* keep-version-note */}

企業使用者與應用程式透過 VPN、私有雲端連線或核准的私有存取服務連線到私有前端。公開模型呼叫使用獨立的對外路徑。

在部署 AWS 或 GCP Terraform 模組之前，請先套用各雲端指南的私有入口變更。Helm 使用您現有的雲端基礎架構。

## 選擇雲端 {#choose-a-cloud}

<Tabs queryString="cloud">
<TabItem value="azure" label="Azure" default>

在 AKS 上執行 LiteLLM，搭配私有 Application Gateway 前端、代管 PostgreSQL 與 Redis，以及私有端點。[Azure 架構](./azure.md) 展示了分離的閘道、後端與 UI 服務。

<CloudArchitecture cloud="azure-aks-micro" />

</TabItem>
<TabItem value="aws" label="AWS">

在 ECS Fargate 上使用 Terraform，或在 EKS 上使用 Helm。[AWS 架構](./aws.md) 展示了橫跨兩個可用性區域的私有 ALB 入口、私有工作負載、NAT 出口與選用的 Bedrock 介面端點。

<Tabs>
<TabItem value="ecs" label="Terraform on ECS Fargate" default>

<CloudArchitecture cloud="aws-ecs" />

</TabItem>
<TabItem value="eks" label="Helm on EKS">

<CloudArchitecture cloud="aws-eks-micro" />

</TabItem>
</Tabs>

</TabItem>
<TabItem value="gcp" label="GCP">

在 Cloud Run 上使用 Terraform，或在 GKE 上使用 Helm。[GCP 架構](./gcp.md) 展示了內部負載平衡器、私有網路存取、私有資料庫連線與 NAT 出口。

<Tabs>
<TabItem value="cloud-run" label="Terraform on Cloud Run" default>

<CloudArchitecture cloud="gcp-cloud-run" />

</TabItem>
<TabItem value="gke" label="Helm on GKE">

<CloudArchitecture cloud="gcp-gke-micro" />

</TabItem>
</Tabs>

</TabItem>
</Tabs>

## 部署配置 {#choose-a-deployment-mode}

單一 Docker 映像服務所有元件。單一 Helm chart 支援兩種配置。Terraform 則部署分離的服務。

| 配置 | 執行內容 | Helm 值 |
| --- | --- | --- |
| 單一服務 | 推論、管理 API 與 Admin UI 一起在連接埠 4000 上執行。 | `monolith.enabled: true` |
| 分離服務（預設） | 閘道在 4000、後端在 4001、UI 在 3000，各自獨立擴展。 | `monolith.enabled: false` |
