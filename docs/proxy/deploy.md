---
title: 部署 LiteLLM
sidebar_label: 總覽
hide_table_of_contents: true
description: Helm、Terraform、規模規劃、參考架構、生產就緒、升級與健康檢查的部署指南。
---

# 部署 LiteLLM {#deploy-litellm}

使用 Helm 在 Kubernetes 上部署 LiteLLM，或使用 Terraform 在 AWS 與 GCP 上部署。這些指南涵蓋容量、網路設計與生產維運。

| 主題 | 頁面 |
| --- | --- |
| [Helm](./deploy/helm.md) | 使用 `values.yaml` 在 Kubernetes 上部署 |
| [Terraform](./deploy/terraform.md) | [AWS](./deploy/terraform.md#aws), [GCP](./deploy/terraform.md#gcp) |
| [規模與擴展](./deploy/sizing.md) | [自動擴展](./deploy/autoscaling.md), [PostgreSQL](./db_sizing.md), [Redis](./redis_sizing.md), [伺服器調校](./server_tuning.md) |
| [參考架構](./deploy/architecture.md) | [雲端部署](./deploy/cloud/overview.md), [Identity-Aware Proxy](./deploy/iap/overview.md), [mTLS](./deploy/mtls.md), [高可用性](./deploy/ha/overview.md), [多區域](./multi_region.md), [全域控制平面](./global_control_plane.md) |
| [生產環境最佳實踐](./prod.md) | 生產設定與就緒 |
| [升級指南](./upgrade_guide.md) | 版本升級與資料庫遷移 |
| [健康檢查](./health.md) | 就緒與存活探針 |
