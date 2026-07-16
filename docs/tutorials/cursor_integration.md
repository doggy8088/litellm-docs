import Image from '@theme/IdealImage';

# Cursor 整合 {#cursor-integration}

透過 LiteLLM 路由 Cursor IDE 請求，以獲得統一的記錄、預算控制，以及存取任何模型的能力。

:::info
**支援模式：** Ask、Plan。Agent mode 目前尚不支援自訂 API 金鑰。
:::

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---------|-------|
| 基底 URL | `<LITELLM_PROXY_BASE_URL>/cursor` |
| API 金鑰 | 您的 LiteLLM 虛擬金鑰 |
| 模型 | 來自 LiteLLM 的公開模型名稱 |

---

## 設定 {#setup}

### 1. 設定基底 URL {#1-configure-base-url}

開啟 **Cursor → Settings → Cursor Settings → Models**。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/f725f154-588d-448d-a1d7-3c8bffaf3cf3/ascreenshot.jpeg?tl_px=0,0&br_px=1376,769&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=263,73)

啟用 **Override OpenAI Base URL**，並輸入您的 proxy URL 與 `/cursor`：

```
https://your-litellm-proxy.com/cursor
```

![](https://colony-recorder.s3.amazonaws.com/files/2025-12-13/6580de2b-3a59-45b2-b7b6-3ab105d87e74/ascreenshot.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2JDELI43356LVVTC%2F20251213%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20251213T224156Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=5a1af4ff63d38d51e06d398ed50f10161d690e3e57e9d67c1d23ce5b7ffdefd5)

### 2. 建立虛擬金鑰 {#2-create-virtual-key}

在 LiteLLM 儀表板中，前往 **Virtual Keys → + Create New Key**。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/1d8156bc-1b12-433f-936d-77f876142e3f/ascreenshot.jpeg?tl_px=0,0&br_px=1376,769&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=240,182)

替您的金鑰命名，並選取它可存取的模型。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/c45843db-b623-442b-b42b-3145ef3ba986/ascreenshot.jpeg?tl_px=0,151&br_px=1376,920&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=453,277)

點擊 **Create Key**，然後立即複製——您之後不會再看到它。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/4022504d-fdba-4e17-b16e-bf8e935cbcad/ascreenshot.jpeg?tl_px=0,101&br_px=1376,870&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=512,277)

將它貼到 Cursor 的 **OpenAI API Key** 欄位中。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/6b50fc92-9219-4868-aac2-a29d0c063e57/ascreenshot.jpeg?tl_px=251,235&br_px=1627,1004&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,276)

### 3. 新增自訂模型 {#3-add-custom-model}

在 Cursor Settings 中點擊 **+ Add Custom Model**。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/4e46538e-a876-44c4-a133-bdae664510f3/ascreenshot.jpeg?tl_px=192,8&br_px=1569,777&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,276)

從 LiteLLM 儀表板 → Models + Endpoints 取得 **Public Model Name**。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/2ee87f64-104a-4b37-8041-c92130a44896/ascreenshot.jpeg?tl_px=0,11&br_px=1376,780&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=331,277)

將名稱貼到 Cursor 中並啟用切換開關。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/5ab35f93-d417-423f-a359-9811ce18e2c3/ascreenshot.jpeg?tl_px=352,26&br_px=1728,795&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=786,277)

### 4. 測試 {#4-test}

以 `Cmd+L` / `Ctrl+L` 開啟 **Ask** 模式，並選取您的模型。

![](https://colony-recorder.s3.amazonaws.com/files/2025-12-13/d87ee25b-3c6d-4231-ba00-4d841d0612bc/ascreenshot.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2JDELI43356LVVTC%2F20251213%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20251213T223855Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=75316b8cd2d451f476232bd0ca459c4b6877e788637bf228bbd7d8b319fd1427)

傳送訊息。所有請求現在都會透過 LiteLLM 路由。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/05a5853a-58ed-44bf-a5c2-c14f9003eace/ascreenshot.jpeg?tl_px=0,151&br_px=1728,1117&force_format=jpeg&q=100&width=1120.0)

---

## 連接 MCP 伺服器 {#connecting-mcp-servers}

您也可以透過 LiteLLM Proxy 將 MCP 伺服器連接到 Cursor。

有關在 Cursor 中設定 MCP 整合的官方說明，請參閱此處的 Cursor 文件：[https://cursor.com/en-US/docs/context/mcp](https://cursor.com/en-US/docs/context/mcp)。

1. 在 Cursor Settings 中，前往 "Tools & MCP" 分頁並點擊 "New MCP Server"。

2. 在您的 `mcp.json` 中，加入以下設定：

```
{
  "mcpServers": {
    "litellm": {
      "url": "http://localhost:4000/everything/mcp",
      "type": "http",
      "headers": {
        "Authorization": "Bearer sk-LITELLM_VIRTUAL_KEY"
      }
    }
  }
}
```

3. LiteLLM 的 MCP 現在會顯示在 Cursor 的 "Installed MCP Servers" 下方。

<Image img={require('../../img/cursor_mcp_installed.png')} />

## 疑難排解 {#troubleshooting}

| 問題 | 解決方法 |
|-------|----------|
| 模型沒有回應 | 檢查 base URL 是否以 `/cursor` 結尾，且金鑰是否具有模型存取權限 |
| 驗證錯誤 | 重新產生金鑰；確認其開頭為 `sk-` |
| Agent mode 無法運作 | 預期行為——只有 Ask 和 Plan 模式支援自訂金鑰 |
