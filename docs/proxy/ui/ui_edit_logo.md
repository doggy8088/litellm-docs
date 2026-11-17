import Image from '@theme/IdealImage';

# 自訂 UI 品牌識別 {#customize-ui-branding}

{/* keep-version-note */}

<a id="custom-branding-admin-ui"></a>
<a id="customize-ui-logo"></a>

自訂管理員介面的標誌與 favicon。

<Image img={require('../../../img/litellm_custom_ai.png')} />

## 透過 UI {#via-the-ui}

<a id="or-set-your-logo-directly-from-admin-ui"></a>
<a id="1-navigate-to-settings"></a>
<a id="2-open-ui-theme-settings"></a>
<a id="3-click-the-logo-url-field"></a>
<a id="4-find-your-logo-image"></a>
<a id="5-right-click-on-the-logo-image"></a>
<a id="6-copy-the-image-address"></a>
<a id="7-switch-back-to-litellm"></a>
<a id="8-paste-the-logo-url"></a>
<a id="9-save-changes"></a>

1. 開啟 **Settings → UI Theme**。
2. 將託管的圖片 URL 貼到 **Logo URL** 中。您也可以視需要設定 **Custom Logo URL (dark mode)**。
3. 點擊 **Save Changes**。標誌會顯示在儀表板側邊欄與登入頁面。

<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  <Image img={require('../../../img/admin_settings_ui_theme.png')} />
  <Image img={require('../../../img/admin_settings_ui_theme_logo.png')} />
</div>

## 深色模式標誌 {#dark-mode-logo}

對於為深色背景設計的圖樣，請設定 **Custom Logo URL (dark mode)** 或 `UI_LOGO_PATH_DARK`。若未設定或無法載入，深色模式會重用淺色標誌。只設定深色標誌會讓淺色模式維持預設的 LiteLLM 標誌。

## 透過 API {#via-the-api}

### 設定自訂標誌 {#set-a-custom-logo}

```bash
curl -X PATCH 'http://localhost:4000/update/ui_theme_settings' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "logo_url": "https://example.com/your-company-logo.png",
    "logo_url_dark": "https://example.com/your-company-logo-dark.png"
  }'
```

`logo_url_dark` 為選用。若省略它，深色模式會重用 `logo_url`。

### 設定自訂 favicon {#set-a-custom-favicon}

您也可以自訂瀏覽器分頁的 favicon：

```bash
curl -X PATCH 'http://localhost:4000/update/ui_theme_settings' \
  -H 'Authorization: Bearer <your-admin-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "logo_url": "https://example.com/your-company-logo.png",
    "favicon_url": "https://example.com/your-favicon.ico"
  }'
```

### 取得目前主題設定 {#get-current-theme-settings}

```bash
curl -X GET 'http://localhost:4000/get/ui_theme_settings'
```

### 重設為預設標誌 {#reset-to-default-logo}

傳送空的 `logo_url` 以還原預設的 LiteLLM 標誌：

```bash
curl -X PATCH 'http://localhost:4000/update/ui_theme_settings' \
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
    logo_url_dark: "https://example.com/your-company-logo-dark.png"  # optional
    favicon_url: "https://example.com/your-favicon.ico"  # optional
```

## 環境變數 {#set-custom-logo}

將 `UI_LOGO_PATH` 設為託管的圖片 URL，或 proxy 容器內可用的檔案。託管圖片較容易設定與疑難排解。

```bash
UI_LOGO_PATH="https://example.com/your-company-logo.png"
UI_LOGO_PATH_DARK="https://example.com/your-company-logo-dark.png"
```

若為本機圖片：

```bash
UI_LOGO_PATH="ui_images/logo.jpg"
```

您也可以在 proxy 設定中宣告這些變數：

```yaml
environment_variables:
  UI_LOGO_PATH: "https://example.com/your-company-logo.png"
  UI_LOGO_PATH_DARK: "https://example.com/your-company-logo-dark.png"
```

## 自訂色彩主題 {#set-custom-color-theme}

{/* keep-version-note */} 管理員介面不再支援自訂色彩主題。LiteLLM v1.92.0 及更新版本會忽略 `enterprise_colors.json`，且沒有設定可以取代它。若要為 UI 設定品牌識別，請依上述說明設定自訂標誌與 favicon。

## 支援的標誌格式 {#supported-logo-formats}

| 格式 | 支援 |
|--------|-----------|
| JPEG / JPG | 是 |
| PNG | 是 |
| SVG | 是 |
| ICO（僅限 favicon） | 是 |
| HTTP/HTTPS URL | 是 |
| 本機檔案路徑 | 是 |
