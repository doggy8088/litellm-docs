# UI 疑難排解 {#ui-troubleshooting}

如果您在使用 LiteLLM 管理 UI 時遇到問題，請在回報時包含以下資訊。

## 1. 重現步驟 {#1-steps-to-reproduce}

清楚、逐步描述如何觸發問題（例如：「前往 Settings → Team，點擊 'Create Team'，填入欄位，點擊 submit → 出現錯誤」）。

## 2. LiteLLM 版本 {#2-litellm-version}

您目前執行的 LiteLLM 版本。請透過 `litellm --version` 或 UI 的設定頁面確認。

## 3. 架構與部署設定 {#3-architecture--deployment-setup}

分散式環境是 UI 問題的已知來源。請描述：

- **LiteLLM 執行個體/複本數量** 以及其部署方式（例如 Kubernetes、Docker Compose、ECS）
- **負載平衡器** 類型與設定（例如 ALB、Nginx、Cloudflare Tunnel）— 包含是否啟用 sticky sessions
- **UI 的存取方式** — 直接透過 LiteLLM、透過反向代理，或位於 ingress controller 之後
- 使用者與 LiteLLM 伺服器之間的**任何 CDN 或快取層**

## 4. Network 分頁請求 {#4-network-tab-requests}

開啟瀏覽器的開發者工具（F12 → Network 分頁），重現問題，並提供：

- **失敗的請求** — URL、方法、狀態碼，以及回應內容
- 相關網路活動的**螢幕截圖或 HAR 匯出**
- Console 分頁中顯示的任何 **CORS 或混合內容錯誤**

## 5. 環境變數 {#5-environment-variables}

與 UI 和 proxy 設定相關的非敏感環境變數，例如：

- `LITELLM_MASTER_KEY`
- `PROXY_BASE_URL` / `LITELLM_PROXY_BASE_URL`
- `UI_BASE_PATH`
- 任何與 SSO 相關的變數（例如 `GOOGLE_CLIENT_ID`、`MICROSOFT_TENANT`）

請**不要**包含密碼、祕密值或 API 金鑰。

## 6. 瀏覽器與存取詳細資訊 {#6-browser--access-details}

- **瀏覽器** 與版本（例如 Chrome 120、Firefox 121）
- 用於存取 UI 的 **URL**（請遮蔽敏感部分）
- 問題是否發生於**所有使用者**或**特定角色**（Admin、Internal User 等）

## 7. 螢幕截圖或螢幕錄影 {#7-screenshots-or-screen-recordings}

問題的螢幕截圖或短螢幕錄影非常有幫助。請包含任何可見的錯誤訊息、toast，或非預期行為。
