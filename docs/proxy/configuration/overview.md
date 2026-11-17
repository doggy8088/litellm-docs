---
title: 設定
sidebar_label: 概覽
toc_max_heading_level: 2
description: 選擇 YAML、Admin UI、Management API 或 Terraform 來設定 LiteLLM 並管理模型、團隊與虛擬金鑰。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 設定 {#configuration}

{/* keep-version-note */}

設定 LiteLLM 提供的模型、它如何路由請求，以及哪些團隊與應用程式可以存取。請在下方選擇 YAML、Admin UI、Management API 或 Terraform。

先準備一個正在運行的閘道。[部署指南](../deploy.md) 涵蓋安裝與基礎架構。

## 選擇方法 {#choose-a-method}

<Tabs queryString="method">
<TabItem value="yaml" label="YAML" default>

### 將設定保留在檔案中 {#keep-settings-in-a-file}

在 `config.yaml` 中定義模型與閘道設定。在版本控制中檢視變更，並在 LiteLLM 啟動時載入檔案。憑證請使用環境變數。

[YAML 指南](../configs.md) 涵蓋模型定義、路由、記錄與伺服器設定。它連結到完整的設定參考、檔案管理與 CLI 選項。

</TabItem>
<TabItem value="ui" label="UI">

### 在瀏覽器中進行變更 {#make-changes-in-the-browser}

開啟 Admin UI 以新增模型、建立團隊與虛擬金鑰，並編輯支援的設定。閘道會將這些變更儲存在其資料庫中。

[UI 指南](./ui.md) 涵蓋設定、常見工作，以及當您同時使用 YAML 時哪些設定可以變更。

</TabItem>
<TabItem value="api" label="Management API">

### 連接您的內部平台 {#connect-your-internal-platform}

呼叫 HTTP 端點以註冊模型、建立團隊與虛擬金鑰、更新存取權並撤銷金鑰。閘道會將這些資源儲存在其資料庫中。您的平台可以在不變更部署檔案的情況下管理它們。

[Management API 指南](./api.md) 展示如何註冊自架模型並授予應用程式存取權。它涵蓋支援的操作、設定所在位置，以及變更何時生效。

</TabItem>
<TabItem value="terraform" label="Terraform">

### 以程式碼管理資源 {#manage-resources-as-code}

在 Terraform 中宣告團隊、虛擬金鑰、模型與其他支援的資源。檢視計畫，然後透過閘道的 API 套用它。

[Terraform 指南](./terraform.md) 展示如何設定 LiteLLM 提供者、建立團隊，並匯入既有的團隊。

</TabItem>
</Tabs>

## 使用多種方法 {#use-more-than-one-method}

您可以將部署設定保留在 YAML 中，並透過 UI、Management API 或 Terraform 管理資源。每個設定或資源請選擇一處維護。每種方法支援一組操作。請查看其指南與參考以完成您需要的工作。

自 v1.103.0 起，YAML 設定優先於資料庫值。UI 無法變更那些設定。模型遵循不同的規則。閘道會提供來自 UI 或 API 的模型，與 YAML 模型一同提供。受影響的區段、重新整理行為與較早版本，請參閱 [YAML 與資料庫設定](../configs.md#configyaml-vs-database-settings)。

權限請參閱 [存取管理](../access_management/overview.md)。憑證與網路控制請參閱 [安全性](../security/overview.md)。
