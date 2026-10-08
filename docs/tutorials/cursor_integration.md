import Image from '@theme/IdealImage';

# Cursor 整合 {#cursor-integration}

將 Cursor IDE 請求透過 LiteLLM 路由，以便統一記錄、預算控制，以及存取任何模型。若要將 Cursor 連接到 MCP 工具，請使用 [MCP 設定參考](../mcp_config_reference#common-client-configs) 中的直接用戶端 URL 與標頭

:::info
**支援模式：** Ask、Plan、Agent。使用基礎 URL 覆寫時，agent 模式需要 LiteLLM v1.97.0+，它會將 Cursor agent 傳送的 Responses API 請求格式轉換為 chat completions 路徑。Cursor 會在其端依模式與模型限制自訂 API 金鑰，因此支援範圍取決於 Cursor 啟用的內容。

Cursor 並未正式支援 AI 閘道；這裡的實作是根據其 API 反向工程得到的最佳努力。Cursor CLI（`agent` / `cursor-agent`）完全無法目標指向 LiteLLM，請參閱 [Cursor CLI](#cursor-cli-cursor-agent)。
:::

:::warning[缺少 Override OpenAI Base URL？]
較新的 Cursor 建置版本不再於每個方案都顯示 **Override OpenAI Base URL** 設定。若您的 Cursor 沒有此設定，請改用下方的 [Azure OpenAI 備援](#fallback-azure-openai-settings)，而非本節中的設定。
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

此代理必須可從網際網路存取：Cursor 會從其自己的伺服器傳送請求，而不是從您的電腦，並使用 `User-Agent: Cursor/1.0`。位於 VPN、IP allowlist 之後，或位於私有位址上的代理，會在任何請求到達 LiteLLM 之前就從 Cursor 端失敗；[疑難排解](#troubleshooting) 列出了 Cursor 在各種情況下顯示的內容。

![](https://colony-recorder.s3.amazonaws.com/files/2025-12-13/6580de2b-3a59-45b2-b7b6-3ab105d87e74/ascreenshot.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2JDELI43356LVVTC%2F20251213%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20251213T224156Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=5a1af4ff63d38d51e06d398ed50f10161d690e3e57e9d67c1d23ce5b7ffdefd5)

### 2. 建立虛擬金鑰 {#2-create-virtual-key}

在 LiteLLM 儀表板中，前往 **Virtual Keys → + Create New Key**。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/1d8156bc-1b12-433f-936d-77f876142e3f/ascreenshot.jpeg?tl_px=0,0&br_px=1376,769&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=240,182)

替您的金鑰命名，並選取它可存取的模型。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/c45843db-b623-442b-b42b-3145ef3ba986/ascreenshot.jpeg?tl_px=0,151&br_px=1376,920&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=453,277)

點選 **Create Key**，然後立即複製，因為之後就再也看不到了。

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

:::warning[內建模型名稱]
Cursor 會拒絕名稱與其內建模型之一相同的自訂模型，並使用 `The model "X" is already available as "Y"`。Cursor 會在本機執行這項檢查，在任何請求到達 LiteLLM 之前。請新增一筆 `model_list` 項目，為相同的部署使用不同的公開模型名稱，並在 Cursor 中使用該名稱：

```yaml
model_list:
  - model_name: litellm-claude-sonnet-5
    litellm_params:
      model: anthropic/{{anthropic}}
```
:::

:::tip[模型變體]
Cursor 的模型選擇器可能會輸出模型名稱的 thinking 與 fast 變體，例如 `claude-opus-5-thinking-high` 或 `claude-opus-5-fast`。LiteLLM v1.97.0+ 會去除尾端的 `-fast` 與 `-thinking-<effort>` 後綴，其中 `<effort>` 是 `reasoning_effort` 值（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`），LiteLLM 會將其作為請求的 reasoning effort 轉送，除非請求本身已設定。金鑰範圍與每個模型的預算會套用到解析後的模型，因此您不需要為這些變體建立個別的 `model_list` 項目。沒有 effort 等級的單純 `-thinking` 後綴，例如 `claude-opus-5-thinking`，不會被解析，並會回傳 `Invalid model name`，除非它有自己的 `model_list` 項目
:::

### 4. 測試 {#4-test}

以 `Cmd+L` / `Ctrl+L` 開啟 **Ask** 模式，並選取您的模型。

![](https://colony-recorder.s3.amazonaws.com/files/2025-12-13/d87ee25b-3c6d-4231-ba00-4d841d0612bc/ascreenshot.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2JDELI43356LVVTC%2F20251213%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20251213T223855Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=75316b8cd2d451f476232bd0ca459c4b6877e788637bf228bbd7d8b319fd1427)

傳送訊息。所有請求現在都會透過 LiteLLM 路由。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-13/05a5853a-58ed-44bf-a5c2-c14f9003eace/ascreenshot.jpeg?tl_px=0,151&br_px=1728,1117&force_format=jpeg&q=100&width=1120.0)

---

## 備援：Azure OpenAI 設定 {#fallback-azure-openai-settings}

如果您的 Cursor 建置版本沒有 **Override OpenAI Base URL** 設定，Cursor 的 Azure OpenAI 設定仍可接受自訂基礎 URL，並將流量路由到您的 LiteLLM 代理。此路徑使用 LiteLLM 與 Azure 相容的 `/openai/deployments/<deployment>/chat/completions` 路由，該路由自 2023 年起就存在於 LiteLLM 中，因此不需要升級代理。Ask、Plan 與 Agent 模式都可透過它運作（已在 Cursor 3.17.21 驗證）；Cursor 的 Azure 用戶端在 agent 模式下也會傳送標準的 chat completions 請求，因此此處不適用基礎 URL 覆寫路徑中的 v1.97.0 要求。

| 設定 | 值 |
|---------|-------|
| Base URL | `<LITELLM_PROXY_BASE_URL>`（沒有 `/cursor` 後綴） |
| Deployment Name | LiteLLM 的公開模型名稱 |
| API Key | 您的 LiteLLM Virtual Key |

### 1. 啟用 Azure OpenAI {#1-enable-azure-openai}

開啟 **Cursor → Settings → Cursor Settings → Models**，展開 **API Keys**，然後啟用 **Azure OpenAI** 切換開關。Cursor 會顯示一個確認對話框，警告某些功能無法計入 API 金鑰；請予以確認。

填入欄位：

- **Base URL**：您的 LiteLLM 代理 URL，例如 `https://your-litellm-proxy.com`。不要附加 `/cursor`。此代理必須可從網際網路存取：Cursor 會從其後端傳送請求，而不是從您的電腦。
- **Deployment Name**：要使用的 LiteLLM 公開模型名稱，例如 `{{anthropic}}`。這會決定每個請求由哪個模型提供服務（請參閱下方警告）。
- **API Key**：您的 LiteLLM 虛擬金鑰。

### 2. 新增自訂模型 {#2-add-a-custom-model}

當 Azure OpenAI 切換開關開啟時，只有自訂模型可用。Cursor 會以 `This model does not support custom API keys` 拒絕其自身的模型（Composer、Cursor Grok），而且它仍會將內建 Claude 與 GPT 模型路由到您的代理，但格式為 Anthropic Messages 或 Azure Responses，而 chat completions 的部署路由無法接受，因此這些對話會卡住。點選 **+ Add Custom Model**，輸入一個不會與內建模型衝突的名稱（例如 `litellm-claude`），將其啟用，然後在聊天模型選擇器中選取它。

若要在您的 Cursor 訂閱中使用 Composer 或其他內建模型，請關閉 Azure OpenAI 切換開關；再將其開啟，即可再次透過 LiteLLM 路由。

:::warning[Deployment Name 會決定模型]
在此路徑下，Cursor 會將每個請求傳送到 `/openai/deployments/<Deployment Name>/chat/completions`，而 LiteLLM 會提供該路徑所命名的模型。您在 Cursor 中選取的自訂模型只是一個標籤：選擇不同的自訂模型不會改變回應的是哪個模型。若要切換模型，請編輯 Azure OpenAI 設定中的 **Deployment Name**。請只保留一個已啟用的自訂模型，這樣選擇器就不會誤導您。
:::

### 3. 測試 {#3-test}

在 Ask 模式中傳送訊息，然後嘗試 Agent 模式。請求會以 chat completions 的形式出現在您的 LiteLLM 記錄中，位於 `/openai/deployments/<Deployment Name>/chat/completions`，並歸屬於該部署的模型。

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

## Cursor Cloud Agents {#cursor-cloud-agents}

LiteLLM 也可以作為 Cursor Cloud Agents API 的前端，因此透過 `api.cursor.com` 啟動的代理程式會獲得相同的憑證管理與記錄。請參閱 [Cursor Cloud Agents](../pass_through/cursor.md)。

## Cursor CLI（cursor-agent） {#cursor-cli-cursor-agent}

Cursor CLI（`agent`，也安裝為 `cursor-agent`）無法目標指向 LiteLLM 或任何其他閘道。其 `--endpoint` 旗標與 `CURSOR_API_ENDPOINT` 變數決定 CLI 登入哪個 Cursor 後端，而不是 OpenAI 相容 API：CLI 啟動時會將您的金鑰 POST 到 `<endpoint>/auth/exchange_user_api_key`，以換取 Cursor 工作階段權杖，之後的每個請求都是 Cursor 私有 RPC。Cursor 沒有記錄此旗標，也沒有在 CLI 中提供自訂端點或 OpenAI 相容金鑰（[open feature request](https://forum.cursor.com/t/cursor-cli-custom-endpoint-and-api-key-support/129424)）；其唯一的自備憑證選項 `agent bedrock`，仍然會透過 Cursor 的後端路由。

將 CLI 指向代理會在到達任何模型之前失敗（已在公開的 Cursor CLI 2026.08.31 建置版本中驗證）：

```shell
export CURSOR_API_KEY=<LITELLM_VIRTUAL_KEY>
agent --endpoint https://your-litellm-proxy.com
```

```
⚠ Warning: The provided API key is invalid.
The API key was loaded from the CURSOR_API_KEY environment variable.
Please check you have the right key, create a new one, or authenticate without it.
```

CLI 會對任何低於 500、且未攜帶 Cursor 工作階段權杖的回應輸出此警告（5xx 則會改為固定的 `Failed to reach the Cursor API` 錯誤），因此缺少該路由的代理（LiteLLM 在根路徑回應 404，而在 `/cursor` 下回應 401）看起來完全就像錯誤的 Cursor 金鑰，而代理中的任何文字都永遠不會顯示在畫面上。若要透過 LiteLLM 路由 Cursor，請使用本頁的 Cursor IDE 設定；若要使用支援自訂端點的終端機代理程式，請參閱 [Claude Code](./claude_responses_api.md)、[Codex CLI](../proxy/client_setup/codex_cli.md)、[Gemini CLI](./litellm_gemini_cli.md) 或 [OpenCode](./opencode_integration.md)。

## 疑難排解 {#troubleshooting}

| 問題 | 解決方案 |
|-------|----------|
| 模型沒有回應 | 檢查 base URL 是否以 `/cursor` 結尾，且 key 是否有模型存取權限 |
| 使用 Cursor CLI 時出現 `The provided API key is invalid`（`agent` / `cursor-agent`） | Cursor CLI 無法使用閘道：`--endpoint` 選取的是 Cursor 後端，而非 OpenAI 相容 API，因此當任何缺少 Cursor 驗證路由的 proxy 使其登入失敗時，就會顯示此警告。請參閱 [Cursor CLI](#cursor-cli-cursor-agent) |
| `Invalid API key` / `Unauthorized User API key` | 當 proxy 回應 401 時，Cursor 會顯示此訊息。API Key 欄位必須填入 LiteLLM 虛擬金鑰（會以 `sk-` 開頭）；占位值會被拒絕 |
| `User API Key Rate limit exceeded` | 當 Cursor 對 proxy 的請求收到 429 或 5xx 時，以及完全沒有收到任何回應時，Cursor 都會顯示此訊息；VPN 或 IP allowlist 將來自 Cursor 伺服器的流量丟棄時也會如此（已在 Cursor 3.18.25 驗證：聊天會停在 `Taking longer than expected` 約一分鐘，然後顯示此訊息）。因此，原因通常不是速率限制。首先，從您網路外的一台機器執行 `curl <LITELLM_PROXY_BASE_URL>/cursor/models -H "Authorization: Bearer <LITELLM_VIRTUAL_KEY>"`；如果它卡住，表示 proxy 從網際網路無法存取，而 LiteLLM 從未看到這些請求。如果它有回應，請在 LiteLLM 記錄中查找這些請求（它們會帶有 `User-Agent: Cursor/1.0`）以取得真正的錯誤。那裡常見的原因是該金鑰的 rpm 或 tpm 限制，因為每個 Cursor 請求都會攜帶約 25k token 的系統提示，以及提供者 429 |
| `Network Error` / `We're having trouble connecting to the model provider` | base URL 主機名稱在公開網際網路上無法解析，例如是內部 DNS 名稱。Cursor 會在重試約一分鐘時顯示 `Rate limited by model provider, retrying`，然後顯示此訊息。請使用公開 DNS 可解析的主機名稱 |
| `Provider returned error: Access to private networks is forbidden` | base URL 指向私有位址（`10.x`、`192.168.x`、`localhost` 等），Cursor 的伺服器會拒絕呼叫。請將 proxy 放在公開位址上 |
| 代理程式模式無法運作 | 升級至 LiteLLM v1.97.0+，並確認模型支援 Cursor 中的自訂 API 金鑰 |
| Cursor 不會列出您的 LiteLLM 模型 | 升級至 LiteLLM v1.97.0+，其會提供 `GET /cursor/models`。較早版本不會提供該路由，並回應 401 或 404。請使用 `curl <LITELLM_PROXY_BASE_URL>/cursor/models -H "Authorization: Bearer <LITELLM_VIRTUAL_KEY>"` 驗證 |
| `The model "X" is already available as "Y"` | Cursor 會封鎖與其內建模型相符的名稱。請以不同的公開模型名稱新增該模型（請參閱步驟 3 的警告） |
| `This model does not support custom API keys` | 您選擇了 Cursor 原生模型（Composer、Cursor Grok），同時啟用了自訂 API 金鑰。請選擇您新增的自訂模型，或停用 Azure OpenAI 切換開關，以在您的訂閱中使用 Cursor 的模型 |
| 在啟用 Azure OpenAI 時選取內建模型後，聊天卡住 | Cursor 仍會將內建的 Claude 和 GPT 模型路由到您的 proxy，且其格式會被 deployment 路由拒絕。請選擇您新增的自訂模型 |
| 沒有 **Override OpenAI Base URL** 設定 | 您的 Cursor 版本沒有提供此設定。請使用 [Azure OpenAI 備援](#fallback-azure-openai-settings) |
| Azure 備援一律以相同模型回應 | 預期行為：**Deployment Name** 會決定模型，而無論選取哪個自訂模型。請編輯 Deployment Name 以切換 |
