---
slug: global-control-plane
title: "LiteLLM Global Control Plane API 現已推出"
date: 2026-11-16
authors:
  - yassin
image: ./cover.png
description: "透過單一 API 管理獨立的 LiteLLM 部署。隔離區域資料，並限制 PostgreSQL 與 Redis 故障的影響範圍。"
tags: [enterprise, ai-gateway]
hide_table_of_contents: true
---

import GlobalControlPlaneHero from './GlobalControlPlaneHero';

export const Hero = GlobalControlPlaneHero;

**LiteLLM Global Control Plane API 現已推出**。管理跨區域與跨雲端的部署，同時讓它們的資料庫、Redis 執行個體與憑證保持分離。

Global Control Plane 先前已提供用於[管理多個部署的 UI](https://docs.litellm.ai/docs/proxy/global_control_plane/legacy_ui)。新的 API 將這套管理能力帶給指令碼、自動化與內部平台。

{/* truncate */}

## 隔離資料庫與 Redis 故障 {#isolate-database-and-redis-failures}

每個區域 gateway 使用各自的 PostgreSQL 資料庫與 Redis 執行個體。這能將資料庫或 Redis 中斷的影響限制在受影響的部署上。其他部署以各自的相依服務繼續提供推論服務。

應用程式將推論請求直接傳送至其區域 gateway。即使 control plane 無法使用，區域推論也會繼續運作。

## 讓資料保持隔離 {#keep-data-isolated}

依區域或團隊分離部署，搭配本機金鑰、團隊、預算、提供者憑證與儲存空間。每個部署的資料庫與 Redis 都留在自己的環境中。Control plane 接收管理與用量資料。

使用 API 在選定的部署上管理金鑰、團隊、模型與預算。您可以將操作人員限制在特定部署與角色，每個 gateway 也會檢查呼叫者的本機權限。

## 開始使用 {#get-started}

Global Control Plane API 需要 LiteLLM Enterprise 授權。[閱讀設定指南](https://docs.litellm.ai/docs/proxy/global_control_plane)以取得設定方式、API 範例，以及 AWS、Azure、GCP 與混合雲的參考架構。
