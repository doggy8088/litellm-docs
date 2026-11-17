---
title: Azure 參考架構
sidebar_label: Azure
description: 在 AKS 上部署 LiteLLM，搭配私有 Application Gateway 前端、企業網路存取、私有端點與 NAT 出口。
---

import { CloudArchitecture } from '@site/src/components/CloudArchitecture';

# Azure {#azure}

{/* keep-version-note */}

透過 VPN、ExpressRoute 或核准的私有存取服務連接企業使用者與應用程式。使用私有 DNS 與私有 Application Gateway 前端。保持 AKS 與資料連線為私有。NAT Gateway 服務對外的提供者呼叫。

## 在 AKS 上使用 Helm {#deploy-this-architecture}

使用 [Helm](../helm.md) 部署分離的閘道、後端與 UI 服務。請提供 VNet、私有 AKS 叢集、Application Gateway、資料庫、私有端點與企業網路路由。

<CloudArchitecture cloud="azure-aks-micro" />

使用 Application Gateway v2，並在其專用子網路中設置僅限私有的前端。將該子網路委派給 `Microsoft.Network/applicationGateways`。允許企業用戶端範圍連線到私有前端的 HTTPS。為閘道主機名稱設定私有 DNS。請參閱[私有 Application Gateway 部署](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-private-deployment)。

使用 AGIC v1.7 或更新版本。在 LiteLLM Ingress 上設定 `appgw.ingress.kubernetes.io/use-private-ip: "true"`。當閘道沒有私有 IP 時，AGIC 會忽略此註解。它會將請求直接送到 pod 的私有 IP。請依您的服務配置設定路由與健康探針。請參閱 [AGIC 私有 IP 設定](https://learn.microsoft.com/en-us/azure/application-gateway/ingress-controller-private-ip)。

將 NAT Gateway 關聯到 AKS 子網路，以處理對外的公開 API 呼叫。讓 PostgreSQL、Redis 與選用的 Azure OpenAI 私有端點保持在其私有路徑上。停用這些資料服務的公開存取，並將其私有 DNS 區域連結到 VNet。

身分檢查請參閱 [Microsoft Entra Application Proxy](../iap/overview.md#azure)。用戶端憑證請參閱[使用 mTLS 的用戶端驗證](../mtls.md)。副本與部署推出請參閱[高可用性](../ha/overview.md)。
