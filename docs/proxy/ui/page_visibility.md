import Image from '@theme/IdealImage';

# 為內部使用者控制頁面可見性 {#control-page-visibility-for-internal-users}

設定 LiteLLM UI 中哪些導覽分頁和頁面可供內部使用者（非管理員開發人員）查看。

使用此功能可簡化 UI，並控制內部使用者／開發人員登入時可以看到哪些頁面。

## 概覽 {#overview}

預設情況下，內部使用者可存取的所有頁面都會顯示在導覽側邊欄中。頁面可見性控制可讓管理員限制內部使用者可看到的頁面，打造更聚焦且更精簡的體驗。

## 設定頁面可見性 {#configure-page-visibility}

### 1. 前往設定 {#1-navigate-to-settings}

在側邊欄中按一下 **Settings** 圖示。

![前往設定](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/cbb6f272-ab18-4996-b57d-7ed4aad721ea/ascreenshot_ab80f3175b1a41b0bdabdd2cd3980573_text_export.jpeg)

### 2. 前往管理員設定 {#2-go-to-admin-settings}

從設定選單中按一下 **Admin Settings**。

![前往管理員設定](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/e2b327bf-1cfd-4519-a9ce-8a6ecb2de53a/ascreenshot_23bb1577b3f84d22be78e0faa58dee3d_text_export.jpeg)

### 3. 選取 UI 設定 {#3-select-ui-settings}

按一下 **UI Settings** 以存取頁面可見性控制項。

![選取 UI 設定](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/fff0366a-4944-457a-8f6a-e22018dde108/ascreenshot_0e268e8651654e75bb9fb40d2ed366a9_text_export.jpeg)

### 4. 開啟頁面可見性設定 {#4-open-page-visibility-configuration}

按一下 **Configure Page Visibility** 以展開設定面板。

![開啟設定](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/3a4761d6-145a-4afd-8abf-d92744b9ac9f/ascreenshot_23c16eb79c32481887b879d961f1f00a_text_export.jpeg)

### 5. 選取要顯示的頁面 {#5-select-pages-to-make-visible}

勾選您希望內部使用者看到的頁面。頁面依類別整理，方便導覽。

![選取頁面](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/b9c96b54-6c20-484f-8b0b-3a86decb5717/ascreenshot_3347ade01ebe4ea390bc7b57e53db43f_text_export.jpeg)

**可用頁面包括：**
- Virtual Keys
- Playground
- Models + Endpoints
- Agents
- MCP Servers
- Search Tools
- Vector Stores
- Logs
- Teams
- Organizations
- Usage
- Budgets
- And more...

### 6. 儲存您的設定 {#6-save-your-configuration}

按一下 **Save Page Visibility Settings** 以套用變更。

![儲存設定](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/8a215378-44f5-4bb8-b984-06fa2aa03903/ascreenshot_44e7aeebe25a477ba92f73a3ed3df644_text_export.jpeg)

### 7. 驗證變更 {#7-verify-changes}

內部使用者現在只會在其導覽側邊欄中看到所選取的頁面。

![驗證變更](https://colony-recorder.s3.amazonaws.com/files/2026-01-28/493a7718-b276-40b9-970f-5814054932d9/ascreenshot_ad23b8691f824095ba60256f91ad24f8_text_export.jpeg)

## 重設為預設值 {#reset-to-default}

若要還原內部使用者可見的所有頁面：

1. 開啟頁面可見性設定
2. 按一下 **Reset to Default (All Pages)**
3. 按一下 **Save Page Visibility Settings**

這會清除限制，並向內部使用者顯示所有可存取的頁面。

## API 設定 {#api-configuration}

您也可以使用 API 以程式化方式設定頁面可見性：

### 取得目前設定 {#get-current-settings}

```bash
curl -X GET 'http://localhost:4000/ui_settings/get' \
  -H 'Authorization: Bearer <your-admin-key>'
```

### 更新頁面可見性 {#update-page-visibility}

```bash
curl -X PATCH 'http://localhost:4000/ui_settings/update' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "enabled_ui_pages_internal_users": [
      "api-keys",
      "agents",
      "mcp-servers",
      "logs",
      "teams"
    ]
  }'
```

### 清除頁面可見性限制 {#clear-page-visibility-restrictions}

```bash
curl -X PATCH 'http://localhost:4000/ui_settings/update' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "enabled_ui_pages_internal_users": null
  }'
```
