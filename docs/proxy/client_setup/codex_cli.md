---
title: Codex (CLI)
toc_max_heading_level: 4
---

import Image from '@theme/IdealImage';

# 將 Codex CLI 連接到 LiteLLM {#connect-codex-cli-to-litellm}

[Codex](https://github.com/openai/codex) 會從 `~/.codex/config.toml` 讀取所有設定。您可在其中將 LiteLLM 定義為自訂模型提供者，並在同一個檔案中註冊 [MCP 閘道](../../mcp.md)。這與 [ChatGPT Desktop 內的 Codex 介面](./codex_chatgpt_desktop.md) 使用的是同一份設定，因此只要設定一次即可同時涵蓋兩者。

:::tip 使用您的 ChatGPT 訂閱

若要保留您自己的 ChatGPT 登入，並將其請求透過閘道傳送，請依照 [ChatGPT 訂閱設定](../../tutorials/openai_codex_byok.md)。該流程會傳送另一把 LiteLLM 金鑰，並將訂閱驗證保留在 Codex 中。

:::

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---|---|
| 設定檔 | `~/.codex/config.toml` |
| `base_url` | `<LITELLM_PROXY_BASE_URL>/v1`（例如 `http://localhost:4000/v1`） |
| 提供者金鑰 | 您的 LiteLLM [虛擬金鑰](../virtual_keys.md)，從 `env_key` 中指定的環境變數讀取，或 [`lite auth print-token`](./codex_cli_sso.md) |
| `model_catalog_url` | `<LITELLM_PROXY_BASE_URL>/v1/models`，以及 `[features]` 下的 `api_key_model_discovery = true` |
| 上下文視窗 | 每個部署上的 `model_info.max_input_tokens`（[詳細內容](#context-window)） <SinceVersion v="1.110.0" /> |
| MCP 端點 | `<LITELLM_PROXY_BASE_URL>/<server_name>/mcp` |
| MCP 驗證 | 同一個虛擬金鑰，從 `bearer_token_env_var` 中指定的環境變數讀取 |

## LLM 設定 {#llm-setup}

### 1. 安裝 Codex {#1-install-codex}

```bash
npm i -g @openai/codex
```

或者使用官方安裝程式：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

### 2. 將 LiteLLM 定義為模型提供者 {#2-define-litellm-as-a-model-provider}

Codex 使用 OpenAI Responses API，而 LiteLLM 會在 `/v1/responses` 提供該 API。請在 `~/.codex/config.toml` 中加入提供者區塊，並將其選為預設值。`env_key` 會指定 Codex 讀取您的虛擬金鑰所用的環境變數，因此檔案中不會儲存任何密鑰：

```toml title="~/.codex/config.toml"
model = "{{anthropic}}"
model_provider = "litellm"

[model_providers.litellm]
name = "LiteLLM"
base_url = "http://localhost:4000/v1"
env_key = "LITELLM_API_KEY"
wire_api = "responses"
```

較長的代理程式回合可能會在閘道後方閒置數分鐘，因此如果任務被過早截斷，請提高串流逾時與重試次數：

```toml title="~/.codex/config.toml"
[model_providers.litellm]
stream_idle_timeout_ms = 7200000
stream_max_retries = 5
request_max_retries = 4
```

匯出金鑰，然後執行 Codex：

```bash
export LITELLM_API_KEY="sk-<your-virtual-key>"

codex
```

`model` 可以是您 LiteLLM 設定中的任何 `model_name`。您也可以在每次執行時用 `codex --model {{gemini_pro}}` 覆寫它。在您完成 [步驟 4](#model-catalog-and-service-tiers) 之前，Codex 只知道 OpenAI 自己模型的中繼資料，因此使用閘道名稱時，它在第一次請求時會印出 `Model metadata for ... not found. Defaulting to fallback metadata`，而其 `/model` 選擇器仍會顯示 Codex 內建模型；請求仍會照常通過。步驟 4 會從閘道擷取目錄，而 [自訂別名的模型中繼資料](#model-metadata-for-custom-aliases) 則說明了本機目錄檔案的替代做法

Codex 會在啟動標頭中顯示該模型，並透過閘道路由該任務。這裡的 Codex 0.154 正透過本機閘道回應：

<Image img={require('../../../img/client_setup/codex_cli_llm.png')} />

### 3. 驗證 {#3-verify}

請 Codex 做一個小變更，然後在 **Logs** 或 **Usage** 下查看 Admin UI；該請求會顯示在 `/v1/responses` 下，並歸屬於您的虛擬金鑰與您選取的模型。

該列目前不會帶有最終使用者，因為 Codex 沒有能將其放入請求本文的設定。若要改為將每個請求歸屬到開發者、客戶或專案，請在提供者區塊中加入 LiteLLM 追蹤標頭，使用 `http_headers` 或 `env_http_headers`；請參閱 [Codex CLI 細粒度成本追蹤](../../tutorials/codex_customer_tracking.md)。

### 4. 讓 Codex 列出閘道的模型與服務等級 {#model-catalog-and-service-tiers}

若要查看具備 UI 截圖、設定與請求範例的 OpenAI 部署，請參閱 [Fast & Ultrafast mode](../../providers/openai/ultrafast.md)。該指南也說明了何時要設定預設 `service_tier`，以及何時讓 Codex 依請求自行選擇。

除非您明確告知，否則 Codex 不會詢問自訂提供者其提供哪些模型，因此其 `/model` 選擇器只會顯示 Codex 內建的 OpenAI 模型，而像 `my-coding-model` 這類僅限閘道的名稱永遠不會出現在其中。Codex CLI 0.159 或更新版本可以改為從閘道擷取目錄。這兩個設定必須一起使用：提供者區塊上的 `model_catalog_url`，指向 `<LITELLM_PROXY_BASE_URL>/v1/models`，以及 `[features]` 下的 `api_key_model_discovery` 功能。任一單獨設定都不會改變任何行為，因此沒有 URL 的 `codex --enable api_key_model_discovery` 不會呼叫閘道。像 0.159 這類較舊版本也會顯示關於該功能的啟動警告，而位於檔案頂層、第一個表格之前的 `suppress_unstable_features_warning = true` 可以將其消除。在 `[features]` 之下，Codex 會忽略該鍵，並改為警告有無法辨識的設定。

```toml title="~/.codex/config.toml"
suppress_unstable_features_warning = true

[features]
api_key_model_discovery = true

[model_providers.litellm]
name = "LiteLLM"
base_url = "http://localhost:4000/v1"
model_catalog_url = "http://localhost:4000/v1/models"
env_key = "LITELLM_API_KEY"
wire_api = "responses"
```

在啟動時，Codex 會使用您的虛擬金鑰呼叫 `GET /v1/models?client_version=<its version>`，而閘道會以 Codex 自己的目錄格式回應。接著 `/model` 選擇器會依 `model_list` 順序列出您閘道的聊天模型，若您有設定則以 `model_info.display_name` 命名，否則以 `model_name` 命名。像 `openai/*` 這類萬用字元項目，以及不是聊天模型的模型（例如 embeddings）都會被排除在外。Codex 已經認識的模型，無論是依其 `model_name` 或依 `litellm_params.model` 中的上游模型，都會以您的名稱保留 Codex 自己的中繼資料（推理等級、提示、工具支援，以及上下文視窗，除非您[在其部署上設定了限制](#context-window)），因此由 `openai/gpt-6.1-sol` 支援的 `my-coding-model` 會取得與 Codex 自己的 `gpt-6.1-sol` 相同的推理等級與提示。閘道會以其自身保存的 Codex 內建目錄副本進行比對，因此哪些模型算作已知，取決於閘道的版本，而不是使用者的 Codex，而只有較新版 Codex 才提供的模型會被視為未知。任何其他模型都會取得 Codex 為 `codex -m <unknown name>` 使用的相同備援中繼資料，因此可運作，但不提供推理強度選項。其上下文視窗是該名稱所有部署中最大的 `max_input_tokens`，包括其他團隊的部署，若沒有任何部署設定，則為成本對照表中的限制。

**服務等級的先決條件：** 請您的閘道管理員設定該模型的 [Fast and Ultrafast 設定](../../providers/openai/ultrafast.md#set-up-with-configyaml)。在 Codex 中選取閘道模型，然後在可用時使用 `/fast` 或 `/ultrafast`。

Codex 會在其家目錄下的 `models_cache.json` 中快取目錄五分鐘。閘道模型、服務等級或上下文視窗的變更，會在該快取過期後啟動時出現。

對 `/v1/models` 或 `/models` 的請求若未帶有 Codex 的 `client_version` 查詢參數，會保留 OpenAI 的回應格式，因此其他用戶端不會看到變更。Codex 接受最大 1 MiB 的目錄；當主體更大時，會靜默保留其內建清單，因此閘道只保留放得下的項目：先保留列出服務等級的模型，再依 `model_list` 順序保留其餘模型；若某個項目太大而無法放入剩餘位元組，會略過它，但其後較小的項目仍會保留，而被排除的模型會被記錄。每個項目大小為 20 到 65 KB，因此大約可容納 20 到 45 個模型，而被排除但沒有等級的模型，仍可透過名稱與 Codex 的備援中繼資料運作。

#### Codex 已知模型的上下文視窗 {#context-window}

<SinceVersion v="1.110.0" />

Codex 有提供項目的模型，無論是依其 `model_name` 或依 `litellm_params.model` 中的上游模型比對，都會預設保留該項目的上下文視窗。對於 `gpt-6.1-sol`，該項目記載為 272K，而 `/status` 會顯示其 95%，即 `258K`，即使該名稱背後的每個部署可接受 900K 或更多。若要給 Codex 更大的視窗，請在模型群組的每個部署上設定 `model_info.max_input_tokens`：

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: gpt-6.1-sol
    litellm_params:
      model: openai/gpt-6.1-sol
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      max_input_tokens: 922000
  - model_name: gpt-6.1-sol
    litellm_params:
      model: bedrock/us.openai.gpt-6.1-sol
      aws_region_name: us-east-1
    model_info:
      max_input_tokens: 922000
```

接著目錄會給予該模型其群組部署中最小的 `max_input_tokens`，因為請求可以路由到其中任一個，最多可達 Codex 允許該模型達到的上限，也就是 Codex 自身項目中的 `max_context_window`。對於 `gpt-6.1-sol`，該上限為 872K，因此上述設定給予它的 `context_window` 為 872000，而 `/status` 顯示 `828K`：

```text
  Model:               GPT-6.1-Sol (reasoning low)
  Context window:      100% left (12.2K used / 828K)
```

沒有 `max_input_tokens` 的部署會以 Codex 自己的視窗計算，因此只在群組的部分部署上設定限制，只會降低視窗而永遠不會提高它，而沒有任何部署設定的群組則會保留 Codex 項目原本的視窗。只有呼叫金鑰所屬團隊可路由到的部署才會列入計算，因此兩個團隊對同一個模型可能看到不同的視窗。像由 `openai/gpt-6.1-sol` 支援的 `my-coding-model` 這類別名也遵循相同規則。上游比對會讀取金鑰可路由到的第一個部署，而像 `bedrock/us.openai.gpt-6.1-sol` 這類 Bedrock id 不符合任何 Codex 項目，因此第一個部署位於 Bedrock 的別名會改為取得上述的備援中繼資料。它接著就沒有推理強度選項，也沒有 872K 上限，而其視窗是群組中最大的限制，因此當 Bedrock 上為 922000、OpenAI 上為 500000 時，Codex 會取得 922000，比 OpenAI 部署可接受的還多。請將 `openai/` 部署放在第一個，或將群組命名為 `gpt-6.1-sol`。

對於已儲存的 `model_info` 帶有成本對照表 `key` 的部署，與目前成本對照表值相等的限制會被視為未設定，因為閘道無法將它與成本對照表的副本區分。v1.102 之前儲存的資料列帶有 `key`，透過 `/model/new` 以從 `/model/info` 回應複製的主體新增的部署也是如此，因此這類帶有 `max_input_tokens: 922000` 的 `gpt-6.1-sol` 部署會讓視窗維持在 272K。若要讓該限制生效，請刪除該部署，並在 `model_info` 中不帶 `key` 的情況下重新新增。從較舊成本對照表或從另一個部署複製的限制仍然有效，因此升級前，請檢查資料庫中 `LiteLLM_ProxyModelTable` 的 `model_info` 欄位，看看是否有沒人刻意設定的 `max_input_tokens`。`/model/info` 無法顯示這一點，因為它會為每個未儲存限制的部署填入一個值。

更大的視窗可能花費更多。一旦請求的提示超過 272K 個 token，`gpt-6.1-sol` 會以成本對照表中較高的 `_above_272k_tokens` 費率，對該請求的每個 token（輸入、快取輸入與輸出）計費，因此在工作階段增長超過 272K 後的每個回合都會花費更多。已在 Codex 已知模型上設定 `max_input_tokens` 的設定，會在閘道執行 v1.110.0 {/* keep-version-note */} 或更新版本時改變 Codex 的視窗。較大的視窗只會影響透過 `model_catalog_url` 讀取目錄的 Codex。使用者自己在 `config.toml` 中的 `model_context_window` 優先於目錄，最多可達該項目的 `max_context_window`，因此 `model_context_window = 600000` 在 `/status` 中會顯示 `570K`，無論閘道設定什麼限制，較低的限制也一樣。[`lite codex`](../management_cli.md#run-coding-agents-through-the-proxy) 會寫入它自己的目錄，且永遠不會以此方式提高 Codex 的視窗，因此它的 `/status` 對 `gpt-6.1-sol` 會維持在 `258K`。

若要查看閘道給予每個模型什麼，請使用您的金鑰讀取目錄：

```bash
curl -s -H "Authorization: Bearer $LITELLM_API_KEY" \
  "http://localhost:4000/v1/models?client_version=0.166.0" \
  | jq -c '.models[] | {slug, context_window, max_context_window}'
```

#### 搭配 `lite codex` 的模型與服務等級 {#lite-codex}

<SinceVersion v="1.112.0" />

[`lite codex`](../management_cli.md#run-coding-agents-through-the-proxy) 不使用 `model_catalog_url`。每次啟動時，它會將閘道的聊天模型寫入 `$CODEX_HOME/litellm-models.json`（預設為 `~/.codex/litellm-models.json`），並以 `-c model_catalog_json=...` 將 Codex 指向該檔案，取代 Codex 原本會擷取的目錄。已安裝的 Codex 認識的模型會保留該 Codex 自己的項目。部署上設定了 `model_info.display_name` 或 `model_info.service_tiers` 的模型，會從閘道為您的金鑰提供的目錄中取得該名稱與那些服務等級，金鑰別名或團隊別名也是如此：

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: gpt-6.1-sol-fast
    litellm_params:
      model: openai/gpt-6.1-sol
      api_key: os.environ/OPENAI_API_KEY
      service_tier: priority
    model_info:
      mode: responses
      display_name: GPT-6.1 Sol Fast
      service_tiers: ["priority"]
```

使用此設定時，`lite codex` 會在 `/model` 中列出 `GPT-6.1 Sol Fast`，並為它提供 `/fast`。較舊版本的 `lite codex` 寫入該檔案時，不含閘道的顯示名稱與服務等級。

閘道必須執行 v1.106.0 {/* keep-version-note */} 或更新版本，該版本提供 Codex 的目錄格式。使用較舊的閘道時，`lite codex` 會印出 `litellm: Codex keeps its own display names and service tiers`，並寫入不含顯示名稱與服務等級的檔案。

## 使用 LiteLLM SSO 登入 {#sign-in-with-litellm-sso}

使用 [Codex CLI SSO 指南](./codex_cli_sso.md)，以 `lite auth print-token` 進行驗證，取代長效虛擬金鑰。

## 自訂別名的模型中繼資料 {#model-metadata-for-custom-aliases}

Codex 會在其內建目錄中查找所選模型名稱，以設定上下文視窗、推理等級與工具支援。LiteLLM `model_name`、Codex 不認識的名稱（例如自訂別名）仍可運作，但 Codex 會記錄 `Unknown model <name> is used. This will use fallback model metadata.` 並以一般預設值執行

執行 `codex debug models` 以列出內建目錄。請複製您的別名所路由到之模型的項目，將其 `slug` 設為 LiteLLM `model_name`，並將其儲存為 `{"models": [ ... ]}`。將 `model_catalog_json` 放在 `~/.codex/config.toml` 中第一個 TOML 表格之前：

```toml title="~/.codex/config.toml"
model = "my-gpt-alias"
model_provider = "litellm"
model_catalog_json = "/absolute/path/to/litellm-models.json"
```

請在複製的項目中保留 `base_instructions`。Codex 會拒絕載入同時沒有 `base_instructions` 和 `model_messages.instructions_template` 的項目；解析錯誤會以 `Error: failed to parse model_catalog_json path` 開頭，並回報該模型缺少這兩個欄位

此檔案會取代內建目錄。在測試中，Codex 對檔案中未包含的內部模型記錄了備援警告，因此請保留內建項目並加入您的別名，讓 Codex 會使用的每個模型名稱都包含在內

目錄項目來自已安裝的 Codex 版本，因此請在升級 Codex 後重新產生該檔案。[OpenAI 的閘道指南](https://learn.chatgpt.com/docs/enterprise/connect-to-a-gateway) 也說明自訂別名需要相符的目錄中繼資料

## MCP 設定 {#mcp-setup}

將 LiteLLM MCP 閘道註冊為同一 `~/.codex/config.toml` 中可串流的 HTTP 伺服器。Codex 會從環境變數而不是從檔案讀取 bearer token，因此請重用您已為模型提供者匯出的那個：

```toml title="~/.codex/config.toml"
[mcp_servers.litellm]
url = "http://localhost:4000/my_mcp_server/mcp"
bearer_token_env_var = "LITELLM_API_KEY"
```

`my_mcp_server` 必須與閘道設定中 `mcp_servers:` 底下的某個鍵相符，且該鍵需要能存取那個伺服器（請參閱[概覽](./overview.md#the-values-you-will-reuse-everywhere)）。Codex 會將該金鑰以 `Authorization: Bearer <key>` 傳送，而閘道可接受。啟動 `codex` 並執行 `/mcp`：伺服器會顯示為 `connected`，並附上其工具數量，而 `/mcp verbose` 會列出以伺服器名稱為前綴（`my_mcp_server-read_wiki_structure`）的工具，以及 `Auth: Bearer token`。

<Image img={require('../../../img/client_setup/codex_cli_mcp.png')} />

在目前的 Codex 中，伺服器區塊內的字面 `bearer_token = "..."` 會因 `bearer_token is not supported for streamable_http` 而失敗；請改用 `bearer_token_env_var`。如果伺服器完全沒有出現，表示您使用的是較舊的 Codex 建置版本，除非在 `[features]` 下設定 `experimental_use_rmcp_client = true`，否則它會忽略遠端 MCP 伺服器；請改為升級 Codex。

對於一個前端為上游 OAuth 提供者的 LiteLLM 伺服器，請執行 `codex mcp login litellm` 來完成流程，而不是設定靜態權杖；請參閱 [MCP OAuth](../../mcp_oauth.md)。

## 疑難排解 {#troubleshooting}

Connection refused 表示閘道無法連線到您設定的 `base_url`；請檢查主機、埠，以及 `/v1` 後綴。閘道回傳 401 表示您啟動 `codex` 的 shell 中未匯出 `LITELLM_API_KEY`，或該金鑰已不再有效。`Invalid model name passed in` 表示 `model` 不符合閘道設定中的某個 `model_name`；請使用您的名稱，而不是上游提供者的名稱。如果請求從未出現在 Admin UI 中，表示您仍在使用預設提供者，請確認檔案頂層已設定 `model_provider = "litellm"`。如果在 [步驟 4](#model-catalog-and-service-tiers) 之後，`/model` 選取器仍只顯示 Codex 的內建模型，則是提供者區塊缺少 `model_catalog_url`、`api_key_model_discovery` 功能已關閉，或閘道執行的是沒有 Codex 目錄的版本；使用您的金鑰對 `<LITELLM_PROXY_BASE_URL>/v1/models?client_version=0.159.3` 執行一次 `curl` 會顯示是哪一側有問題，因為支援該目錄的閘道會以頂層 `models` 鍵回應，而不是 `data`

## 後續步驟 {#next-steps}

[ChatGPT Desktop 中的 Codex](./codex_chatgpt_desktop.md) 使用相同的設定檔。另請參閱 [LiteLLM 虛擬金鑰](../virtual_keys.md) 與 [MCP 閘道參考資料](../../mcp.md)。
