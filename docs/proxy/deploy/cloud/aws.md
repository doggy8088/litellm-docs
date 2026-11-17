---
title: AWS 參考架構
sidebar_label: AWS
description: 在 ECS Fargate 或 EKS 上部署 LiteLLM，搭配內部 ALB、企業網路存取、私有資料儲存與 NAT 出口。
---

import { CloudArchitecture } from '@site/src/components/CloudArchitecture';

# AWS {#aws}

{/* keep-version-note */}

透過 VPN、Direct Connect 或核准的私有存取服務連接企業使用者與應用程式。使用私有 DNS 與內部 ALB。將 ECS 任務或 EKS 工作節點與資料儲存放在橫跨兩個可用性區域的私有子網路中。NAT 閘道僅服務對外流量。

僅允許來自企業來源範圍或私有存取服務的 HTTPS。保留與這些用戶端雙向的路由。請參閱[內部負載平衡器存取](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html)。

## 在 ECS Fargate 上使用 Terraform {#terraform-on-ecs-fargate}

使用 [AWS 上的 Terraform](../terraform.md#aws) 部署。

<CloudArchitecture cloud="aws-ecs" />

### 私有入口 {#ecs-module-changes}

原始模組會建立面向網際網路的 ALB，並對 `0.0.0.0/0` 開啟連接埠 80 與 443。它沒有可選擇私有入口的輸入。部署前請對模組套用這些變更：

| 檔案 | 必要變更 |
| --- | --- |
| [alb.tf](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/aws/alb.tf) | 將 `aws_lb.this.internal` 設為 `true`。將其 `subnets` 設為至少兩個 AZ 中的私有子網路 ID。更新其 precondition 以檢查這些私有子網路。保留 ACM 憑證與 HTTPS 監聽器。 |
| [network.tf](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/aws/network.tf) | 將 ALB 的公開入口規則改為僅允許來自核准企業範圍的連接埠 443。若不需要內部重新導向，請移除連接埠 80 的入口。將工作負載入口限制在 ALB 安全群組內。加入通往您的私有存取網路的路由。 |
| 平台網路與 DNS | 建立 VPN、Direct Connect 或私有存取路由。為 ALB 加入私有 DNS 記錄。將 NAT 保留在公開出口子網路中。 |

該模組會建立一個 NAT 閘道。若您的可用性需求需要，請在每個 AZ 各加一個。ALB、任務與資料儲存請使用各自獨立的安全群組。

## 在 EKS 上使用 Helm {#eks-with-helm}

使用 [Helm](../helm.md) 部署分離的閘道、後端與 UI 服務。

<CloudArchitecture cloud="aws-eks-micro" />

在安裝 LiteLLM 之前，先建立私有叢集、資料儲存、網路存取與 AWS Load Balancer Controller。設定 `alb.ingress.kubernetes.io/scheme: internal` 並選擇私有 ALB 子網路。使用 `alb.ingress.kubernetes.io/target-type: ip` 直接以 pod 為目標。為 ALB 安全群組設定企業 HTTPS 來源。請參閱 chart 的[入口設定](../helm.md#ingress) 與 [EKS 負載平衡](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)。

身分檢查請參閱 [AWS ALB 驗證](../iap/overview.md#aws)。用戶端憑證請參閱[使用 mTLS 的用戶端驗證](../mtls.md)。副本與部署推出請參閱[高可用性](../ha/overview.md)。
