import Image from '@theme/IdealImage';

# 自訂 UI 標誌 {#customize-ui-logo}

透過以您自己的公司品牌識別取代預設標誌，為您的 LiteLLM 儀表板增添個人化設定。您可以透過 UI 或 API 設定自訂標誌。

## 透過 UI {#via-the-ui}

### 1. 前往設定 {#1-navigate-to-settings}

點擊側邊欄中的 **Settings** 圖示。

![前往設定](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/57a15404-51f7-481e-9db2-cea94566d3ce/ascreenshot_7a348567c839448bb806fd71cf4abca0_text_export.jpeg)

### 2. 開啟 UI 主題設定 {#2-open-ui-theme-settings}

在設定選單中點擊 **UI Theme**。

![開啟 UI 主題](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/30663fe1-9f78-4496-96d4-c53513cbaf82/ascreenshot_ac1eb59eda0e423fbd0e7d3a6cabd4c7_text_export.jpeg)

### 3. 點擊 Logo URL 欄位 {#3-click-the-logo-url-field}

點擊 **Logo URL** 文字欄位開始編輯。

![點擊 Logo URL 欄位](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/069e8412-8ec1-4d36-ba38-6b2e2858a45a/ascreenshot_8fc7fb4a3af74815bc1b69a8554bc110_text_export.jpeg)

### 4. 找到您的標誌圖片 {#4-find-your-logo-image}

開啟新的瀏覽器分頁，找到您想使用的標誌圖片（例如，搜尋 Google Images 找到您的公司標誌）。

![找到標誌圖片](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/d9b55dac-bc4e-4728-b422-4afbc21f9034/ascreenshot_2a805f39c83d4b5e95f43495a6ea4e79_text_export.jpeg)

### 5. 在標誌圖片上按右鍵 {#5-right-click-on-the-logo-image}

在您想用作標誌的圖片上按右鍵。

![在圖片上按右鍵](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/9d42d13e-6028-4710-acb2-c6af04a855c7/ascreenshot_0f21f29ba0e44132afe483a4b88e8b70_text_export.jpeg)

### 6. 複製圖片位址 {#6-copy-the-image-address}

從快顯選單中選取 **Copy Image Address** 以複製 URL。

![複製圖片位址](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/c25637be-383a-498b-ad11-eb1761d52757/ascreenshot_b237ee800979462189a02c1e1942ebf1_text_export.jpeg)

### 7. 切回 LiteLLM {#7-switch-back-to-litellm}

切回 LiteLLM UI 分頁（例如，按 **Cmd + Left** 或點擊該分頁）。

![切回](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/f0647856-679c-4591-9ff7-7fd3cfbc70b4/ascreenshot_3ce46dae64c94891ac0983f5ed8f085a_text_export.jpeg)

### 8. 貼上 Logo URL {#8-paste-the-logo-url}

使用 **Cmd + V** 將複製的圖片 URL 貼到 **Logo URL** 欄位中。

![貼上 URL](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/54dd30d9-7a88-41e8-a580-a6acf707c7fa/ascreenshot_8a772218ac0743d9ae8ffd3311eccd5a_text_export.jpeg)

### 9. 儲存變更 {#9-save-changes}

點擊 **Save Changes** 以套用您的新標誌。

![儲存變更](https://colony-recorder.s3.amazonaws.com/files/2026-03-13/4baf6494-d146-4600-b6f2-ef667338d580/ascreenshot_722cbcd568ec4267af5122b3958bb248_text_export.jpeg)

您的自訂標誌現在會顯示在 LiteLLM 儀表板側邊欄與登入頁面。

## 透過 API {#via-the-api}

### 設定自訂標誌 {#set-a-custom-logo}

```bash
curl -X PATCH 'http://localhost:4000/settings/update/ui_theme_settings' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "logo_url": "https://example.com/your-company-logo.png"
  }'
```

### 設定自訂 favicon {#set-a-custom-favicon}

您也可以自訂瀏覽器分頁的 favicon：

```bash
curl -X PATCH 'http://localhost:4000/settings/update/ui_theme_settings' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "logo_url": "https://example.com/your-company-logo.png",
    "favicon_url": "https://example.com/your-favicon.ico"
  }'
```

### 取得目前主題設定 {#get-current-theme-settings}

```bash
curl -X GET 'http://localhost:4000/settings/get/ui_theme_settings'
```

### 重設為預設標誌 {#reset-to-default-logo}

傳送空的 `logo_url` 以還原預設的 LiteLLM 標誌：

```bash
curl -X PATCH 'http://localhost:4000/settings/update/ui_theme_settings' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "logo_url": ""
  }'
```

## 透過 `proxy_config.yaml` {#via-proxy_configyaml}

您也可以在 proxy 設定檔中設定 logo URL：

```yaml
litellm_settings:
  ui_theme_config:
    logo_url: "https://example.com/your-company-logo.png"
    favicon_url: "https://example.com/your-favicon.ico"  # optional
```

或者將其設定為環境變數：

```yaml
environment_variables:
  UI_LOGO_PATH: "https://example.com/your-company-logo.png"
```

## 支援的標誌格式 {#supported-logo-formats}

| 格式 | 支援 |
|--------|-----------|
| JPEG / JPG | 是 |
| PNG | 是 |
| SVG | 是 |
| ICO（僅限 favicon） | 是 |
| HTTP/HTTPS URL | 是 |
| 本機檔案路徑 | 是 |
