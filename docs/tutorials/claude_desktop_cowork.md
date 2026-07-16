# Claude Desktop（Cowork）整合 {#claude-desktop-cowork-integration}

將 Claude Desktop 的請求透過 LiteLLM Proxy 路由，以取得統一的記錄、預算控制，以及存取任何模型的能力。

<iframe width="840" height="500" src="https://www.loom.com/embed/adb864c1f7c74de3bfc9584ca6d32080" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

---

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---------|-------|
| Gateway URL | `<LITELLM_PROXY_BASE_URL>` |
| API Key | 您的 LiteLLM Virtual Key |

---

## 步驟 1：啟用開發者模式 {#step-1-enable-developer-mode}

在 Claude Desktop 中，前往 **Help → Claude → Help**，然後按一下 **Enable Developer Mode**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/64274593-33e6-4a7b-a7f3-a08f8aea8209/ascreenshot_8a9c909a978544888dafb6e0c7e3f468_text_export.jpeg)

---

## 步驟 2：開啟 Configure Third-Party Inference {#step-2-open-configure-third-party-inference}

按一下 **menu bar** 圖示以開啟 Claude 選單。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/66110720-1f11-4a1f-8a0a-a59498bc3290/ascreenshot_c674301e5a4a4ecf8cf000bbbef55aa6_text_export.jpeg)

按一下 **Developer**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/2fcad657-4f8c-4dc2-b9ff-597de4e98030/ascreenshot_241063b192ae4c75996aaefdab991f13_text_export.jpeg)

按一下 **Configure Third-Party Inference…**

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/dbb36dff-bbbe-4ddd-b30e-25b2c41bff47/ascreenshot_a7516b203052432f9a1d08cbe92cd214_text_export.jpeg)

---

## 步驟 3：輸入您的 LiteLLM Gateway URL 與 API Key {#step-3-enter-your-litellm-gateway-url-and-api-key}

推論設定對話框會開啟。在 **Gateway URL** 欄位中輸入您的 LiteLLM Proxy URL。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/2d0daa12-d874-42ca-bc3e-f38c27c701e4/ascreenshot_8c8be28828974c10ab53124fa13e67c3_text_export.jpeg)

```
https://your-litellm-proxy.com
```

接著，從 LiteLLM 儀表板取得您的虛擬 API 金鑰。前往 **Virtual Keys → + Create New Key**，複製金鑰，然後將其貼入 **API Key** 欄位。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/6a5b1233-de81-48be-8a17-e026d3dd9b49/ascreenshot_23dbd432db6d4f90ab5b0d598edd5a40_text_export.jpeg)

儲存設定。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/70e429ad-9e42-4936-a691-725701e802bc/ascreenshot_ffc156c61ed44cb7989f417dc38233b6_text_export.jpeg)

---

## 步驟 4：驗證您的設定 {#step-4-verify-your-setup}

重新啟動 Claude Desktop。開啟新的對話並傳送訊息。現在所有請求都會透過您的 LiteLLM Proxy 路由。

![](https://colony-recorder.s3.amazonaws.com/files/2026-04-22/9e72faf1-0b5e-49d5-8ac4-b64dcd2b2f94/ascreenshot_813a1b584a1f4523ab7f7702f5985be0_text_export.jpeg)

您可以在 LiteLLM 儀表板的 **Usage** 下查看流量，來驗證是否有資料流動——您應該會看到歸屬於您的虛擬金鑰的請求。

---

## 相關內容 {#related}

- [LiteLLM Virtual Keys](../proxy/virtual_keys.md)
- [Cursor Integration](cursor_integration.md)
- [Claude Code Integration](claude_responses_api.md)
