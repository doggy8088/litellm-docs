# 外送請求與離線模式 {#outbound-requests-and-offline-mode}

LiteLLM 會將請求傳送至您設定的提供者、回呼、防護欄、密鑰管理器與 SSO 伺服器。它也會自行發出一些請求，去取得變動頻率比 LiteLLM 發佈更快的目錄。本頁列出這些請求，並說明如何為氣隙或外送受限的部署將它們關閉。

## 開啟離線模式 {#turn-on-offline-mode}

在 proxy 上設定 `LITELLM_OFFLINE_MODE=true`，即可停止下表中的每個請求：

```shell
export LITELLM_OFFLINE_MODE=true
litellm --config config.yaml
```

請在每個 proxy 執行個體上將它設為環境變數。它不能在 `config.yaml` 中設定，因為模型成本對照表會在讀取設定之前載入。

只有 `true`（不分大小寫）會開啟它。任何其他值（例如 `1` 或 `yes`）都會讓它保持關閉。

離線模式會將模型成本對照表凍結在您 LiteLLM 版本內附的副本上，因此在您升級之前，較新的模型會缺失。若要在不開放一般外送連線的情況下保持對照表為最新狀態，請參閱[氣隙與外送受限部署](./custom_model_cost_map#air-gapped-and-egress-restricted-deployments)。

## 離線模式會停止的請求 {#requests-offline-mode-stops}

| 項目 | 主機 | 時機 | 開啟離線模式時 | 各功能開關 |
|---|---|---|---|---|
| 模型成本對照表 | `raw.githubusercontent.com`，或 `LITELLM_MODEL_COST_MAP_URL` | 啟動時、`/reload/model_cost_map` 與排程的成本對照表重新載入 | 使用套件內附的副本 | `LITELLM_LOCAL_MODEL_COST_MAP=true` |
| Anthropic beta 標頭 | `raw.githubusercontent.com`，或 `LITELLM_ANTHROPIC_BETA_HEADERS_URL` | 第一個傳送 beta 標頭的 Anthropic 或 Bedrock 請求、`/reload/anthropic_beta_headers` 與其排程重新載入 | 使用內附的副本 | `LITELLM_LOCAL_ANTHROPIC_BETA_HEADERS=true` |
| Auto router 預設集 | `raw.githubusercontent.com`，或 `LITELLM_AUTOROUTER_PRESETS_URL` | `/public/autorouter_presets`，由 Admin UI 的 auto router 表單呼叫 | 使用內附的副本 | `LITELLM_LOCAL_AUTOROUTER_PRESETS=true` |
| 政策範本 | `raw.githubusercontent.com` | `/policy/templates`，由 Admin UI 的 Policies 頁面呼叫 | 使用內附的副本 | `LITELLM_LOCAL_POLICY_TEMPLATES=true` |
| 部落格文章 | `docs.litellm.ai`，或 `LITELLM_BLOG_POSTS_URL` | `/public/litellm_blog_posts`，由 Admin UI 首頁與 Blog 選單呼叫 | 使用內附的副本 | `LITELLM_LOCAL_BLOG_POSTS=true` |
| 最新版本 | `docs.litellm.ai` 與 `api.github.com` | `/get/latest_release_info`，由 Admin UI 通知鈴鐺呼叫 | 回傳 `null`，因此不會顯示升級通知 | `LITELLM_DISABLE_LATEST_RELEASE_CHECK=true` |
| 外洩密碼檢查 | `api.pwnedpasswords.com` | 設定或變更使用者密碼時，以及密碼登入時 | 略過 | `general_settings.password_policy_check_breached_passwords: false` |
| Hugging Face tokenizers | `huggingface.co` | 為 Cohere、Llama 2 與 Llama 3 模型計算 token 時 | 改以 OpenAI tokenizer 計算 | `litellm_settings.disable_hf_tokenizer_download: true` |
| Kimi K3 tokenizer | `huggingface.co` | 為 Bedrock Kimi K3 模型計算 token 時 | 從本機 Hugging Face 快取讀取檔案，未快取時估算數量 | `litellm_settings.disable_hf_tokenizer_download: true` |

外洩密碼檢查只會傳送密碼 SHA-1 雜湊的前 5 個字元，永遠不會傳送密碼本身。

離線模式會覆寫各功能的設定。開啟離線模式時，即使 `password_policy_check_breached_passwords` 為 `true`，外洩密碼檢查仍會保持關閉，且 `*_URL` 變數會被忽略。若要從內部鏡像讀取目錄，請讓離線模式保持關閉，設定該目錄的 `*_URL` 變數，並以它們各自的功能開關關閉其他請求。

內附的副本與已安裝的 LiteLLM 版本一樣新。新的模型價格、預設集、範本與部落格文章會在您升級時一併到來。

## 離線模式不會停止的請求 {#requests-offline-mode-doesnt-stop}

### 您設定的目的地 {#destinations-you-configure}

離線模式不會改變對您設定中之目的地的請求，例如 LLM 提供者、記錄回呼、防護欄供應商、密鑰管理器、SSO、電子郵件與警示。它也不會改變這些：

- **模型資訊重新整理。** 對於帶 `api_base` 的 `openai`、`openai_like`、`text-completion-openai` 與 `hosted_vllm` 部署，proxy 每 5 分鐘呼叫一次 `{api_base}/v1/models`。設定 `general_settings.disable_model_info_refresh: true` 可停止它。
- **授權檢查。** 設定了 `LITELLM_LICENSE` 時，若 proxy 無法在本機驗證金鑰的簽章，會向 `license.litellm.ai` 檢查該金鑰。
- **請求中的圖片 URL。** 當請求攜帶圖片 URL 時，token 計算與某些提供者（例如 Bedrock）會下載它。

### Hugging Face 模型查詢 {#hugging-face-model-lookups}

這些模型查詢可能會呼叫 `huggingface.co`，且沒有開關可以關閉它們：

- **模型設定。** 查詢 `huggingface/` 模型的上下文視窗時會讀取它的 `config.json`。當主機無法連線時，查詢不會回傳任何值。
- **聊天範本。** 從聊天訊息建立文字提示的提供者（例如 SageMaker、vLLM、Replicate、Triton、watsonx 與 Bedrock invoke）會讀取模型的聊天範本。當主機無法連線時，LiteLLM 會退回使用通用提示格式。為模型設定[自訂提示範本](../completion/prompt_formatting) 可略過查詢。
- **嵌入任務。** `huggingface/` 嵌入請求會查詢模型的任務，當主機無法連線時請求會失敗。在請求中傳送 `input_type` 可略過查詢。

### 資料庫工具 {#database-tooling}

proxy 使用 Prisma CLI 執行 migrations：

- **Prisma CLI 安裝。** 在 pip 安裝下，首次啟動會從 `registry.npmjs.org` 與 `binaries.prisma.sh` 下載 Prisma CLI 及其引擎，未安裝 Node.js 時還會從 `nodejs.org` 下載它。LiteLLM Docker 映像已包含它們，並設定 `PRISMA_OFFLINE_MODE=true`。
- **Prisma 版本檢查。** Prisma CLI 會向 `checkpoint.prisma.io` 檢查更新。設定 `CHECKPOINT_DISABLE=1` 可停止它。

### Tokenizer 檔案 {#tokenizer-files}

LiteLLM 內附 `cl100k_base`、`o200k_base` 與 `p50k_base` tiktoken 檔案。為舊型模型（例如 `davinci`、`ada` 或 `gpt2`）計算 token 時，會從 `openaipublic.blob.core.windows.net` 下載它的 tokenizer。若要避免，請將檔案放入一個資料夾，並將 `CUSTOM_TIKTOKEN_CACHE_DIR` 設為該資料夾。

### 回呼套件 {#callback-packages}

`supabase`、`sentry` 與 `slack` 回呼會在缺少其套件時執行 `pip install`。請改為在映像中安裝該套件。

### 瀏覽器請求 {#browser-requests}

這些請求來自使用 Admin UI 或 API 文件之人的瀏覽器，而不是來自 proxy：

- **ReDoc。** `/redoc` 頁面從 `cdn.jsdelivr.net` 載入它的指令碼，並從 `fonts.googleapis.com` 載入字體。設定 `NO_REDOC=True` 可關閉該頁面。
- **MCP 伺服器圖示。** Admin UI 中的 MCP 伺服器目錄與 OpenAPI 選取器會從 `cdn.simpleicons.org` 與 `raw.githubusercontent.com` 載入圖示。當它們被封鎖時，圖示不會顯示。

Admin UI 與位於 `/` 的 Swagger 頁面會提供它們自己的指令碼與字體。
