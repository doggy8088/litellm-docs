---
title: 全域控制平面
sidebar_label: 概覽
description: 透過單一 API 管理彼此獨立的 LiteLLM 部署、比較跨區域用量，並匯出管理稽核記錄。
---

# 全域控制平面 {#global-control-plane}

{/* keep-version-note */}

全域控制平面提供單一 API，用於管理跨區域與跨雲端的彼此獨立 LiteLLM 部署。每個部署都是一個**資料平面**，負責提供推論請求服務，並保有自己的金鑰、團隊、預算、PostgreSQL 資料庫與 Redis。

<EnterpriseFeature />

## 使用案例 {#use-cases}

| 需求 | 控制平面如何協助 |
| --- | --- |
| 為合規而隔離資料 | 將每個資料平面的資料庫、Redis、金鑰與憑證保留在各自獨立的區域環境中。控制平面接收管理與用量資料。 |
| 透過單一端點管理資源 | 在選定的資料平面上讀取與更新金鑰、使用者、團隊、模型、預算及其他支援的資源。 |
| 比較跨部署用量 | 彙總花費、請求數與 token 數。可依資料平面、模型、提供者、團隊或 API 金鑰分組檢視結果。 |
| 給予操作人員有限的存取權限 | 指派控制平面角色，並將呼叫者限制在具名資料平面內。每個資料平面也會檢查呼叫者在本機的權限。 |

## 運作方式 {#how-it-works}

操作人員或內部入口網站將經驗證的請求送至控制平面。控制平面檢查呼叫者的角色與資料平面存取權限，取得所選資料平面的憑證，並透過 HTTPS 呼叫其管理 API。資料平面會在回傳結果前檢查自身的權限。

應用程式將推論請求直接送至其區域資料平面。控制平面中斷會使中央管理與報表停止。資料平面會繼續使用自身的組態與相依性提供推論服務。

| 元件 | 職責 | 狀態 |
| --- | --- | --- |
| 控制平面 | 驗證、存取規則、管理請求、執行期登錄與角色寫入、機隊清單、用量彙總與稽核匯出 | 啟動時的登錄與角色，可選擇透過其專屬 PostgreSQL 資料庫與 Redis 串流中的執行期項目加以擴充。近期的稽核記錄與登入節流仍保留在處理程序記憶體中。 |
| 資料平面 | 推論、本機資源管理、模型路由，以及金鑰、團隊與預算的強制執行 | 其專屬的 PostgreSQL、Redis、提供者憑證與主金鑰。 |

僅以組態運作時不需要 PostgreSQL 與 Redis。啟用[執行期組態](./global_control_plane/configuration.md#runtime-configuration)，即可透過 API 管理登錄項目與角色，並將其傳播至各控制平面複本。

啟用執行期組態後，操作員可以[採用現有團隊並跨資料平面管理其預算](./global_control_plane/api_reference.md#adopted-team-budgets)。每個資料平面仍會強制執行並核算自己的預算。控制平面不會同步其他資料平面組態、不會複製金鑰、不會強制執行共用的全域預算，也不會進行推論備援切換。當區域閘道必須共用同一個資料庫與同一組金鑰時，請使用[多區域部署](./multi_region.md)。

此實作提供 REST API 與互動式 API 文件，不提供管理 UI。

## 文件 {#documentation}

| 主題 | 內容 |
| --- | --- |
| [參考架構](./global_control_plane/architecture.md) | AWS、Azure、GCP 與混合雲圖表，包含區域、私有網路與管理連線。 |
| [組態](./global_control_plane/configuration.md) | 控制平面、資料平面驗證與稽核目的地的設定與預設值。 |
| [API 參考](./global_control_plane/api_reference.md) | 端點、範圍、參數與回應。 |
| [UI 部署選取器](./global_control_plane/legacy_ui.md) | 使用 `worker_registry` 的現有管理 UI 設定。 |
