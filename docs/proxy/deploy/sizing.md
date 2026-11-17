---
title: 大小規劃與擴展
sidebar_label: 總覽
description: 為 LiteLLM 規劃閘道、PostgreSQL 與 Redis 容量，並為您的流量設定自動擴展。
---

# 大小規劃與擴展 {#sizing--scaling}

{/* keep-version-note */}

請依相同的尖峰負載為閘道、PostgreSQL 與 Redis 規劃大小。

先從您預期的請求速率、token 量與同時串流數著手。使用您的應用程式實際使用的模型與回應長度進行測試。即使閘道 CPU 使用率很低，長時間的串流也會持續佔用一條連線。

在 Kubernetes 上，將每秒請求數 (RPS) 與每秒 token 數 (TPS) 加入 HPA 的 CPU 與記憶體目標。請參閱 [HPA 指標](./autoscaling.md#scale-on-requests-and-tokens-per-pod)。

## 選擇指南 {#choose-a-guide}

| 您需要決定的事項 | 指南 |
| --- | --- |
| 閘道 CPU、記憶體與工作程序數量 | [大小規劃與工作程序](../prod.md#sizing-and-workers) |
| 資料庫運算、儲存與連線上限 | [資料庫規劃大小](../db_sizing.md) |
| 哪些功能需要共用狀態 | [哪些功能需要 Redis](../redis_requirements.md) |
| Redis 記憶體與連線容量 | [Redis 規劃大小](../redis_sizing.md) |
| 以 RPS 與 TPS 擴展閘道副本 | [自動擴展](./autoscaling.md) |
| 如何在高流量時降低資料庫壓力 | [高吞吐量部署](../high_throughput.md) |
| 如何將資料庫讀取送往副本 | [資料庫唯讀副本](../db_read_replica.md) |
| 如何調整工作程序、關閉行為與伺服器 | [伺服器調整](../server_tuning.md) |

## 限制資料庫連線 {#bound-the-database-connections}

每個工作程序都有自己的連線池。請依您的自動擴展器可啟動的最大副本數規劃：

```text
pool limit × workers per replica × maximum replicas
```

請為管理服務、遷移與其他資料庫用戶端預留空間。在啟用自動擴展之前，使用[資料庫規劃大小](../db_sizing.md#connections-break-before-cpu-does) 設定連線池與副本上限。
