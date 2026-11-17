---
title: GCP 參考架構
sidebar_label: GCP
description: 在 Cloud Run 或 GKE 上部署 LiteLLM，搭配內部負載平衡器、企業網路存取、私有資料儲存與 NAT 出口。
---

import { CloudArchitecture } from '@site/src/components/CloudArchitecture';

# GCP {#gcp}

{/* keep-version-note */}

透過 Cloud VPN、Interconnect 或核准的私有存取服務連接企業使用者與應用程式。使用私有 DNS 與區域內部 Application Load Balancer。

建立一個私有前端子網路，以及一個獨立的 proxy 專用子網路，其用途為 `REGIONAL_MANAGED_PROXY`、角色為 `ACTIVE`。前端 IP 從前端子網路中配置。請參閱[內部負載平衡器設定](https://docs.cloud.google.com/load-balancing/docs/l7-internal/setting-up-l7-internal-serverless)。

除非您啟用全域存取，否則企業 VPN 通道或 Interconnect 連接必須連線到負載平衡器所在的區域。為前端 IP 加入私有 DNS 與路由。請參閱[內部負載平衡器用戶端存取](https://docs.cloud.google.com/load-balancing/docs/l7-internal#client-access)。

## 在 Cloud Run 上使用 Terraform {#terraform-on-cloud-run}

使用 [GCP 上的 Terraform](../terraform.md#gcp) 部署。

<CloudArchitecture cloud="gcp-cloud-run" />

### 私有入口 {#cloud-run-module-changes}

原始模組會建立全域外部負載平衡器。它沒有可選擇內部前端的輸入。部署前請對模組做這些變更：

| 來源區域 | 必要變更 |
| --- | --- |
| [load_balancer.tf](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/gcp/load_balancer.tf) | 將全域位址改為區域內部位址。使用 `google_compute_region_backend_service`、`google_compute_region_url_map`、`google_compute_region_target_https_proxy` 與 `google_compute_forwarding_rule`。將後端服務與轉送規則設為 `INTERNAL_MANAGED`。設定轉送規則的網路、子網路、私有 IP 與連接埠 443。保留全部三個無伺服器 NEG 與現有的路徑路由。 |
| TLS 憑證 | 將全域代管憑證改為受支援的區域憑證。使用區域 Compute Engine SSL 憑證或區域 Certificate Manager 憑證。 |
| [network.tf](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/gcp/network.tf) | 加入前端與 proxy 專用子網路、企業網路路由與私有 DNS。為 VPC 連接器子網路建立 Cloud Router 與 Cloud NAT。 |
| [cloudrun.tf](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/gcp/cloudrun.tf) | 將三個服務全部設為 `INGRESS_TRAFFIC_INTERNAL_ONLY`。將閘道、後端與遷移的連接器出口設為 `ALL_TRAFFIC`。移除未使用的公開網域對應。 |
| [outputs.tf](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/terraform/litellm/gcp/outputs.tf) | 更新 `lb_ip` 與 `lb_url`，改用區域內部位址。 |

移除舊的公開轉送規則與位址。Cloud Run 維持在客戶子網路之外。入站的無伺服器 NEG 路徑不使用對外 VPC 連接器。請參閱 [Cloud Run 入口](https://docs.cloud.google.com/run/docs/securing/ingress) 與[區域 TLS 支援](https://docs.cloud.google.com/load-balancing/docs/l7-internal#ssl-certificates)。

若您使用 IAP，請將 Cloud Run Invoker 授予 IAP 服務代理程式，並移除模組的 `allUsers` invoker 授權。保持 Invoker IAM 檢查啟用。在負載平衡器上或直接在 Cloud Run 上設定 IAP，但不要兩者同時設定。請參閱 [Google Cloud IAP](../iap/overview.md#gcp)。

## 在 GKE 上使用 Helm {#gke-with-helm}

使用 [Helm](../helm.md) 部署分離的閘道、後端與 UI 服務。

<CloudArchitecture cloud="gcp-gke-micro" />

建立私有 GKE 叢集與上述網路資源。使用 `gce-internal` Ingress 或 `gke-l7-rilb` GatewayClass。允許來自 proxy 專用子網路與必要健康檢查範圍的流量連線到 pod 後端。為閘道、後端與 UI 設定路由。保持叢集端點為私有。請參閱 [GKE 內部 Ingress](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/internal-load-balance-ingress) 與 [Gateway 設定](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/deploying-gateways)。

對於需要公開模型 API 或登錄庫的節點與 pod 範圍，使用 Cloud NAT。為 Cloud SQL 與 Memorystore 保留 Private Services Access。Terraform 模組的 `create_runtime = false` 模式可以在沒有 Cloud Run 或公開負載平衡器的情況下建立資料儲存。

用戶端憑證請參閱[使用 mTLS 的用戶端驗證](../mtls.md)。副本與部署推出請參閱[高可用性](../ha/overview.md)。
