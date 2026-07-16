import Image from '@theme/IdealImage';

# Retool Assist {#retool-assist}

本指南將引導您完成將 [Retool Assist](https://docs.retool.com/apps/guides/assist/) 連接到 LiteLLM Proxy 的步驟。Retool Assist 使用 AI 從 Retool app IDE 內生成並編輯應用程式。搭配 LiteLLM 與 Retool Assist，您可以：

- 透過 Retool Assist 存取 100+ 個 LLM
- 追蹤支出與用量，為每個虛擬金鑰設定預算上限
- 控制 Retool Assist 可存取哪些模型
- 透過統一的 OpenAI 相容 API 使用您自己的 LLM 提供者

<div style={{ maxWidth: '100%', overflow: 'hidden', paddingBottom: '59.52%', position: 'relative', height: 0 }}>
  <iframe 
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', maxWidth: '840px' }}
    src="https://www.youtube.com/embed/aN-Iua5dHGg" 
    frameborder="0" 
    webkitallowfullscreen 
    mozallowfullscreen 
    allowfullscreen
  ></iframe>
</div>

---

:::info
**託管版 Retool 需要公開 URL。** Retool Cloud 執行於 Retool 的伺服器上，因此 `localhost` 將無法運作。您必須透過 ngrok、Cloudflare Tunnel，或部署到雲端提供者來公開您的 LiteLLM proxy。
:::

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---------|-------|
| 提供者結構描述 | OpenAI |
| Base URL | 您的 ngrok URL（例如 `https://abc123.ngrok-free.app`）或已部署的 proxy URL |
| API Key | 您的 LiteLLM 虛擬金鑰 |
| 模型 | 來自 LiteLLM 的公開模型名稱（例如 `openai/gpt-4o-mini`、`openai/gpt-5.2-2025-12-11`） |

---

## 必要條件 {#prerequisites}

- LiteLLM Proxy 在本機執行或已部署
- [ngrok](https://ngrok.com/download)（或類似隧道）用於搭配託管版 Retool 進行本機開發
- 一個 [Retool](https://retool.com) 帳戶（Cloud 或自架）

## 1. 啟動 LiteLLM Proxy {#1-start-litellm-proxy}

依照 [Getting Started Guide](https://docs.litellm.ai/docs/proxy/docker_quick_start) 設定 LiteLLM Proxy。請確保您的 proxy 在 4000 埠上執行。

## 2. 使用公開 URL 公開 LiteLLM {#2-expose-litellm-with-a-public-url}

<Image img={require('../../img/ngrok_public_url.gif')} />

Retool Cloud 執行於 Retool 的伺服器上。您必須使用公開 URL 來公開本機 LiteLLM proxy。

### 使用 ngrok {#using-ngrok}

- 安裝 [ngrok](https://ngrok.com/download)
- 在另一個終端機中執行：
  
```bash
ngrok http 4000
```
- 複製產生的 HTTPS URL（例如 `https://abc123.ngrok-free.app`）。這就是 Retool 的 **Base URL**。

### 替代方案 {#alternative}

如果您將 LiteLLM 部署到 Railway、Render、Fly.io 或其他雲端提供者，請使用該公開 URL 作為 Base URL。詳情請參閱 [Deploy guide](https://docs.litellm.ai/docs/proxy/deploy)。

## 3. 產生虛擬金鑰 {#3-generate-a-virtual-key}

<Image img={require('../../img/litellm_virtual_key.gif')} />

建立一個 Retool Assist 將用來向 LiteLLM 驗證的虛擬金鑰。此金鑰必須能存取您想使用的模型（例如 `openai/*` 可用於所有 OpenAI 模型）。

### 透過 LiteLLM UI {#via-litellm-ui}

- 前往 [http://localhost:4000/ui](http://localhost:4000/ui)
- 前往 **Virtual Keys** → **+ Create New Key**
- 選取您需要的模型（或 `openai/*`，適用於所有 OpenAI 模型）
- 複製該金鑰

## 4. 在 Retool 中將 LiteLLM 新增為自訂提供者 {#4-add-litellm-as-a-custom-provider-in-retool}

在您的 Retool 儀表板中，將 LiteLLM 設定為自訂 AI 資源：

<Image img={require('../../img/retool_resource_setup.gif')} />

1. 前往 **Resources**

2. 在 **AI** 類別下，選取 **Custom Provider**

3. 填寫表單：
   - **Name:** `LiteLLM`
   - **Description:**（選填）例如 `LiteLLM Proxy - 100+ LLMs`
   - **Provider Schema:** `OpenAI`
   - **Base URL:** 您透過 ngrok 產生的 URL（例如 `https://abc123.ngrok-free.app`）或已部署的 proxy URL——除非 Retool 要求，否則請勿加入 `/v1`
   - **API Key:** 您在步驟 3 中取得的 LiteLLM 虛擬金鑰
4. **新增 model names** 來自您的 LiteLLM proxy（例如 `openai/gpt-4o-mini`、`openai/gpt-5.2-2025-12-11`）。
5. 點選 **Create Resource**

<Image img={require('../../img/retool_llm_setup.gif')} />

## 5. 測試連線 {#5-test-the-connection}

<Image img={require('../../img/retool_litellm_connection.gif')} />

- 在 Retool 中開啟一個 app，並啟用 **Assist**（如果您的組織尚未啟用）
- 使用 Assist 生成或編輯 app 元素，請求會經由 LiteLLM 路由
- 使用 Sidebar 中的 code 選項新增 resource query，選取 LiteLLM resource，然後執行以測試設定。
- 檢查 LiteLLM **Logs** 區段以驗證請求並追蹤用量

<Image img={require('../../img/retool_litellm_logs.gif')} />

---

## 疑難排解 {#troubleshooting}

### 401 未經授權 {#401-unauthorized}

- 確認 Retool 中的 **API Key** 與您的 LiteLLM 虛擬金鑰完全相符
- 驗證該金鑰在 LiteLLM 中未過期或未被封鎖

### 401 "key 不允許存取模型" {#401-key-not-allowed-to-access-model}

您的虛擬金鑰僅限於特定模型。請產生一個具有 `openai/*` 的新金鑰，或將您需要的模型（例如 `openai/gpt-5.2-2025-12-11`）加入該金鑰的允許模型清單。

### 500 "api_key client option must be set" {#500-api_key-client-option-must-be-set}

LiteLLM 無法使用您的 OpenAI API 金鑰呼叫該提供者。當使用 `openai/*` 模型時，請確認在您的 LiteLLM 環境中已設定 `OPENAI_API_KEY`（例如在 `.env` 或 `docker-compose.yml` 中）。

### localhost 無法運作 {#localhost-does-not-work}

Retool Cloud 無法連線到 `localhost`，因為它指向 Retool 的伺服器。請使用 ngrok 或將 LiteLLM 部署到公開 URL。

---

## 其他資源 {#additional-resources}

- [Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys) – 建立與管理 API 金鑰
- [Deploy LiteLLM](https://docs.litellm.ai/docs/proxy/deploy) – 正式環境部署選項
- [Retool Assist Documentation](https://docs.retool.com/apps/guides/assist/) – 設定 Assist 與提示指南
