# OWASP LLM Top 10（2026）對照 {#owasp-llm-top-10-2026-mapping}

本頁將 [OWASP Top 10 for LLM Applications 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) 的每一項對應到可處理它的 LiteLLM 閘道控制項，說明如何啟用每個控制項，並指出每個控制項的限制範圍。此頁是為填寫問卷的安全審查人員，以及決定要啟用哪些控制項的平台團隊所撰寫。其上的每一項主張都已對照 LiteLLM `main` 分支、版本 `1.104.0`（2026 年 9 月）進行檢查；最後一節說明如何對您實際執行的版本重新檢查

LiteLLM 位於您的呼叫端與模型提供者之間，因此其控制項涵蓋閘道可看見的內容：請求、回應、其代理的工具與 MCP 伺服器、其管理的檔案與向量儲存，以及其自身的設定、容器映像與相依性。提供者模型內部如何運作，以及閘道回傳後您的應用程式如何處理回應，都不在其範圍內。因此，下列每一項都保留一部分責任在應用程式或提供者身上，而每一節都會標明

每一節包含三個部分：已提供的內容、如何啟用，以及已知限制。幾乎每個控制項在您設定之前都處於關閉狀態，而此處引用的預設值是上述版本中的程式碼預設值。表格是簡版

| 項目 | 主要閘道控制項 | 預設狀態 |
|------|----------------------|---------------|
| [LLM01 Prompt Injection](#llm01-prompt-injection) | 輸入、工具與 MCP 防護欄 | 關閉 |
| [LLM02 Sensitive Information Disclosure](#llm02-sensitive-information-disclosure) | PII 遮罩、機密偵測、記錄去識別化、靜態加密 | 關閉，但金鑰雜湊除外 |
| [LLM03 Excessive Agency](#llm03-excessive-agency) | MCP、A2A 與工具權限、路由允許清單 | 預設開放，直到授權 |
| [LLM04 Supply Chain](#llm04-supply-chain) | 已簽署映像、凍結的 lockfile、掃描 CI、客戶端 `api_base` 區塊 | 開啟 |
| [LLM05 Data and Model Poisoning](#llm05-data-and-model-poisoning) | 上傳限制、批次防護欄、僅管理員可寫入 | 混合 |
| [LLM06 Unbounded Consumption](#llm06-unbounded-consumption) | 預算、速率限制、准入控制、大小上限 | 關閉 |
| [LLM07 Misinformation](#llm07-misinformation) | 佐證檢查、judge 防護欄、棄用警告 | 關閉 |
| [LLM08 Hidden Context Exposure](#llm08-hidden-context-exposure) | 記錄去識別化、伺服器端提示詞、外洩模式 | 關閉 |
| [LLM09 Vector and Embedding Weaknesses](#llm09-vector-and-embedding-weaknesses) | 儲存區存取控制、擷取檢查 | 混合 |
| [LLM10 Improper Output Handling](#llm10-improper-output-handling) | 輸出防護欄、串流緩衝、工具權限 | 關閉 |

## LLM01 Prompt Injection {#llm01-prompt-injection}

2026 年的項目涵蓋直接與間接注入，包括夾帶在圖片與音訊中的載荷，以及透過工具回應與 MCP 伺服器暗中帶入的指令

**已提供的內容。** [guardrails framework](./guardrails/quick_start) 會在提供者呼叫前（`pre_call`）、與其並行（`during_call`），或在回應上（`post_call`）執行防護欄。一個防護欄定義即可涵蓋 chat、text completion、Responses API、Anthropic Messages、Google GenAI、embeddings、image generation、speech、transcription、video、rerank、OCR、Bedrock pass-through、A2A 與 MCP 路由，因為此 framework 會將這些形狀各自轉成防護欄要掃描的文字。超過五十種防護欄整合隨附於 [the guardrail hooks directory](https://github.com/BerriAI/litellm/tree/main/litellm/proxy/guardrails/guardrail_hooks)，從 [LiteLLM Content Filter](./guardrails/litellm_content_filter)（其 [prebuilt patterns](./guardrails/litellm_content_filter#available-patterns) 包含 `prompt_injection_jailbreak`、`prompt_injection_system_prompt`、`prompt_injection_data_exfiltration`、`prompt_injection_malicious_code` 與 `prompt_injection_sql`），到來自 Lakera、Prompt Security、Azure、Bedrock 等的託管偵測器。較早的 [prompt injection detection callback](./guardrails/prompt_injection) 會加入啟發式與 LLM 檢查。除非您設定 [skip flags](./guardrails/quick_start#skip-system-messages-in-guardrail-evaluation)，否則系統與工具訊息會連同使用者回合一起掃描。在 MCP 端，[MCP guardrails](../mcp_guardrail) 會在每次工具呼叫時執行，[tool filtering](../mcp_control#allowdisallow-mcp-tools) 會限制金鑰可存取的工具，而 [tool permission guardrail](./guardrails/tool_permission) 與 [tool policies](./tool_policies) 則決定模型可以進行哪些函式呼叫。對於語音，[realtime guardrails](./guardrails/realtime_guardrails) 會掃描 Realtime session 的輸入轉錄稿。對於圖片，Content Filter 可以 [使用 vision model 描述圖片並過濾描述內容](./guardrails/litellm_content_filter#image-content-filtering)

**如何啟用。** 在 `config.yaml` 中的 `guardrails:` 下新增防護欄，並使用 `mode: pre_call`（或在延遲比阻擋更重要時使用 `during_call`），然後設定 `default_on: true` 使其在每個請求上執行，或將其附加到特定金鑰、團隊或請求。未定義防護欄之前不會掃描任何內容；`default_on` 為 false

**已知限制。** 防護欄是分類器，因此經過精心構造的注入可繞過任何一個。請將它們視為其中一層，並與 LLM03 控制項搭配，讓成功注入後可採取的行動盡量少。內建偵測回呼只會在 completion、text completion、embeddings、image generation、moderation 與 audio transcription 呼叫上執行，因此 `/v1/messages` 與 `/v1/responses` 流量會跳過它；對這些路由請使用帶有 `mode: pre_call` 的防護欄。該回呼也會在非 HTTP 錯誤時失敗開放，將被拒絕的輸入以 INFO 等級記錄，且其向量相似度選項尚未實作，因此只有啟發式與 LLM 檢查會執行。跨模態載荷只有在您設定會檢查它們的防護欄時才會被掃描：Content Filter 的圖片描述路徑是選用功能，且每個請求都會耗用一次 vision 呼叫；chat 請求中的音訊與檔案部分，以及 MCP 呼叫中的圖片部分，會未經掃描就送往提供者；Azure Prompt Shield 整合會在未附加文件的情況下送出訊息。上游 MCP 伺服器傳回的工具描述不會被掃描或固定，因此伺服器可在您核准後變更工具自稱的用途（[PR #43283](https://github.com/BerriAI/litellm/pull/43283) 正在審查中）。只有 [Content Filter](./guardrails/realtime_guardrails#supported-guardrail-mode) 支援 realtime 輸入轉錄模式

## LLM02 Sensitive Information Disclosure {#llm02-sensitive-information-disclosure}

此項涵蓋透過提示詞、回應、記錄與快取外洩的 PII、憑證與專有資料

**已提供的內容。** [PII masking with Presidio](./guardrails/pii_masking_v2) 會遮罩或封鎖請求中的實體，並提供 [logging only](./guardrails/pii_masking_v2#logging-only) 模式，可遮罩傳送到記錄回呼的內容，同時讓提供者看到原始文字。[Secret detection](./guardrails/secret_detection) 會在提供者看見之前，從請求中移除 API 金鑰與權杖。記錄有三個去識別化開關：`turn_off_message_logging`（[redact messages and response content](./logging#redact-messages-response-content)）、`redact_user_api_key_info`（[redacting UserAPIKeyInfo](./logging#redacting-userapikeyinfo)）與 `redact_messages_in_exceptions`（[redacting messages from alerts](./alerting#redacting-messages-from-alerts)）。除非設定 `store_prompts_in_spend_logs`（[config settings](./config_settings)），否則 spend logs 不會儲存任何提示詞或回應文字。虛擬金鑰會以 SHA-256 雜湊儲存（[virtual keys](./virtual_keys)），`/model/info` 會遮罩提供者憑證（[model management](./model_management)），而 `LITELLM_SALT_KEY` 會在資料庫中加密模型 `litellm_params`、已儲存的環境變數與 MCP 憑證（[data at rest encryption](./security_encryption_faq#data-at-rest-encryption)）。面向客戶端的錯誤會經過內部細節清除程序，移除機密、系統路徑、私有 IP 與 traceback，而請求驗證錯誤（`422`）會讓提交的主體不出現在回應中（[error responses and headers](./security_best_practices#7-avoid-disclosing-internals-through-error-responses-and-headers)）

**如何啟用。** 金鑰雜湊、憑證遮罩與錯誤清除一律啟用。其餘皆為選用功能：定義 PII 與機密防護欄，設定 `litellm_settings` 下的三個去識別化旗標，保留 `store_prompts_in_spend_logs` 為未設定狀態，並在儲存第一個模型之前設定 `LITELLM_SALT_KEY`

**已知限制。** Secret detection 是企業功能，只會掃描請求，因此將 secret 回傳的提供者不會在回應中被遮蔽。三個遮蔽旗標預設皆為關閉，關閉時，每個記錄回呼都會收到完整的提示詞與回應。靜態加密涵蓋模型 `litellm_params`、環境變數與 MCP 憑證；guardrail `litellm_params`（可包含提供者 API 金鑰）、非字串值，以及 `router_settings`、`general_settings` 和 `litellm_settings` 區段則會以明文儲存（[PR #43255](https://github.com/BerriAI/litellm/pull/43255) 正在審查中，以擴大涵蓋範圍）。精確比對的回應快取只以請求本身作為索引，因此兩個金鑰或團隊若送出相同的請求，除非您在設定中設定 `cache.namespace` 或在請求上設定 `metadata.redis_namespace`，否則會共用同一個快取回應；只有語意快取是以租戶為範圍（[快取](./caching)）

## LLM03 過度代理權 {#llm03-excessive-agency}

這個條目在 2026 年因 agentic 部署而上升三名：代理程式擁有比任務所需更多的能力、權限或自主性

**隨附內容。** MCP 存取遵循組織、團隊與金鑰之間的[權限階層](../mcp_control#permission-hierarchy)，並透過 `require_key_mcp_access_defined` 拒絕未攜帶 MCP 清單的金鑰，以及 `no-mcp-servers` 的退出選項。在伺服器層級之下，[工具允許與拒絕清單](../mcp_control#allowdisallow-mcp-tools)、[每個實體的工具權限](../mcp_control#per-entity-tool-level-permissions)與[工具集](../mcp_toolsets)可縮小金鑰或團隊可呼叫的工具範圍，[授權](../mcp_grant_access)可將伺服器附加到金鑰與團隊，[客戶端允許清單](../mcp_client_allowlist)限制哪些 MCP 用戶端應用程式可以連線，而[零信任 MCP](../mcp_zero_trust)會以呼叫者的身分簽署 JWT，讓 MCP 伺服器能強制執行自己的政策。對於模型要求您的應用程式執行的 function tools，[工具權限 guardrail](./guardrails/tool_permission)與[工具政策](./tool_policies)可依工具名稱與引數允許或拒絕。對於 agent-to-agent 流量，[A2A 代理程式權限](../a2a_agent_permissions)、[A2A 終止開關](../a2a_kill_switch)與[A2A 迭代預算](../a2a_iteration_budgets)（`max_iterations` 與 `max_budget_per_session`）會限制代理程式可做的事以及可執行多久。金鑰的 `models` 與 `allowed_routes`（[虛擬金鑰](./virtual_keys)）會限制其完全可觸及哪些模型與哪些 proxy 路由

**如何啟用。** 在金鑰、團隊或組織上設定 `mcp_servers` 或存取群組，並設定 `require_key_mcp_access_defined: true` 以關閉預設值。透過管理 API 或 Admin UI 建立工具政策。在金鑰或團隊上放置 `agent_permissions`，並在每次呼叫時傳送 `metadata.session_id`，如此迭代預算才能計數

**已知限制。** 只要某一層定義了清單，MCP 與 A2A 存取就是開放的：若金鑰在其自身、其團隊或其組織上沒有 MCP 清單，就會可抵達每一個伺服器，而 A2A 代理程式的行為也相同。當因資料庫無法連線而導致權限查詢失敗時，MCP 會退回到全域清單加上金鑰自身提交的伺服器，而 A2A 則回傳不受限制的存取。每次工具呼叫沒有伺服器端的核准步驟；Responses API MCP tools 上的 `require_approval` 由用戶端處理，因此 human-in-the-loop 步驟必須存在於您的代理程式中。工具政策只會看到通過閘道的工具呼叫；您的應用程式自行執行的工具對它們是不可見的。以 YAML 定義的 pass-through endpoint 若其項目未設定 `auth: true`，則未經驗證（[PR #43250](https://github.com/BerriAI/litellm/pull/43250) 正在審查中，以將政策檢查套用到省略它的項目）

## LLM04 供應鏈 {#llm04-supply-chain}

2026 年的條目新增了一項要求：驗證模型構件與其宣稱的身分相符，並與傳統的依賴套件、映像與外掛風險並列

**隨附內容。** 每個已發佈的映像都以 cosign 簽署，從以 digest 鎖定的 Chainguard Wolfi 基底建置，並提供非 root 變體（[Docker 映像安全性](./docker_image_security)，含[以 digest 鎖定](./docker_image_security#pin-by-digest)的作法）。Python 相依套件會從 `uv.lock` 以固定版本安裝，而解析器會拒絕任何在過去三天內發佈的套件版本，因此剛遭入侵的版本無法進入建置。在 CI 中，[Grype](https://github.com/BerriAI/litellm/blob/main/.github/workflows/image-scan.yml) 會掃描每個 Dockerfile 的映像，而 [OSV](https://github.com/BerriAI/litellm/blob/main/.github/workflows/osv-scan.yml) 會在每晚與 pull request 時掃描 lockfile；每個第三方 GitHub Action 都會鎖定到 commit SHA，[zizmor](https://github.com/BerriAI/litellm/blob/main/.github/workflows/zizmor.yml) 會檢查 workflows，而 [OpenSSF Scorecard](https://github.com/BerriAI/litellm/blob/main/.github/workflows/scorecard.yml) 會每週執行。在執行階段，攜帶 `api_base`、`base_url` 或類似欄位的請求主體會被拒絕，因此呼叫者無法將閘道指向另一個上游（[用戶端端認證](./clientside_auth#pass-user-llm-api-keys--api-base)），[模型存取群組](./model_access_groups)會授與具名的一組模型，而不是原始模型名稱，而且由團隊提議的 MCP 伺服器會保持停用，直到 proxy 管理員核准為止，且 stdio 伺服器僅限於允許清單中的指令（`npx`、`uvx`、`python`、`python3`、`node`、`docker`、`deno`，外加 `LITELLM_MCP_STDIO_EXTRA_COMMANDS`）（[MCP 伺服器提交](../mcp_server_submissions)）

**如何啟用。** 映像、lockfile、CI、`api_base` 區塊與 stdio 允許清單控制項預設即為啟用，無需設定。請依映像安全性頁面上的步驟驗證簽章，並在您的部署中以 digest 鎖定。存取群組需要在部署上設定 `model_info.access_groups`，並在金鑰或團隊上設定群組名稱

**已知限制。** 映像發佈管線不在公開儲存庫中，因此您可以使用公開金鑰驗證簽章，但隨映像沒有附帶 SBOM 或 provenance 證明。預設映像以 root 執行；請使用 `-non_root` 變體。掃描會跳過來自 fork 的 pull request，改為在合併與每晚執行；CI job 沒有出口鎖定，而 `CODEOWNERS` 會涵蓋 UI、成本地圖與 migrations，但不涵蓋 workflows、`pyproject.toml`、`uv.lock` 或 Dockerfiles。模型成本地圖會在啟動時透過 HTTPS 從 GitHub `main` 分支下載，且沒有簽章；其完整性檢查是最少模型數量與縮小比例，失敗時會回退到內建副本。設定 `LITELLM_LOCAL_MODEL_COST_MAP=True` 可使用內建副本（[停用即時拉取模型價格](./server_tuning#disable-pulling-live-model-prices)）或[使用您自己的服務](./custom_model_cost_map#option-2-serve-your-own-cost-map)。在開機時從 S3 或 GCS 載入的設定檔或自訂回呼模組（[從 S3 或 GCS 載入設定](./server_tuning#load-configyaml-from-s3-or-gcs)）會在沒有 checksum 的情況下寫入磁碟，因此儲存體 bucket 的寫入權限就是設定寫入權限。[自訂 code guardrail](./guardrails/custom_code_guardrail) 會在 RestrictedPython 下執行管理員提供的 Python，沒有 CPU 或 wall-clock 限制，而其 `http_request` primitive 可以連到私有位址（[PR #43280](https://github.com/BerriAI/litellm/pull/43280) 正在審查中，兩者皆適用）。LiteLLM 從不下載或執行模型權重；它會呼叫代管或自架的模型 API，因此驗證模型構件是否與其宣稱的身分相符，仍由提供模型的一方負責

## LLM05 資料與模型污染 {#llm05-data-and-model-poisoning}

2026 年的條目將範圍從訓練資料擴大到 RAG 知識庫、代理程式記憶與 fine-tune 後門

**提供內容。** 透過 `/v1/files` 的上傳接受 `max_file_size_mb`、`max_batch_file_size_mb` 和 `allowed_file_extensions`（[限制檔案上傳](./security_best_practices#10-restrict-file-uploads)），而且每次上傳都會拒絕具有路徑遍歷或 NUL 位元組的檔名。[批次防護欄](./guardrails/batch_guardrails) 會在每筆 `purpose=batch` JSONL 檔案記錄送達提供者之前，對其執行您的請求前防護欄。對 [`/v1/rag/ingest`](../rag_ingest) 的內嵌上傳會以 magic bytes 判定型別，上限為 512 MiB，若為封存檔或可執行檔則會拒絕。受管理提示只能由 proxy 管理員建立、變更或刪除（[提示管理](./prompt_management)），而沒有團隊的模型也只能由 proxy 管理員註冊（[模型管理](./model_management)）。微調工作是企業功能，其訓練與驗證檔案 id 在屬於 LiteLLM 管理的 id 時，會依呼叫金鑰的擁有權進行檢查（[微調](../fine_tuning)）

**如何啟用。** 檔名檢查、RAG 擷取檢查，以及僅限管理員寫入都是永遠啟用。`/v1/files` 限制在 `general_settings` 下設定。批次防護欄除了在金鑰、團隊或請求上設定請求前防護欄之外，不需要其他任何設定

**已知限制。** `/v1/files` 大小與副檔名限制預設皆未設定。RAG 擷取惡意軟體掃描器只是個佔位符，只會辨識 EICAR 測試字串，沒有為真正引擎提供設定掛勾，而由 `file_url` 或 `file_id` 引用的上傳，或是透過 `/v1/vector_stores/{id}/files` 附加到向量儲存的上傳，都會略過擷取檢查（[PR #43244](https://github.com/BerriAI/litellm/pull/43244) 正在審查中，內容包括可設定的掃描器與每個向量儲存上傳路由的上傳控制）。微調檔案不會被掃描，而且一旦通過企業閘道，任何金鑰都可以啟動工作。在企業環境中，團隊管理員可以用自己的 `api_base` 和定價註冊團隊範圍模型。批次防護欄只會執行請求前防護欄，不會執行請求後或部署層級的防護欄（[限制](./guardrails/batch_guardrails#limits)）。提供者訓練資料、第三方模型，或您在閘道之外填入的知識庫中的污染都不在其視野內

## LLM06 無限制消耗 {#llm06-unbounded-consumption}

此條目在 2026 年上升了四個名次，現在明確點名「錢包拒絕服務」

**提供內容。** 預算適用於每個層級：整個 proxy、組織、團隊、團隊成員、內部使用者、虛擬金鑰、最終使用者、標籤與模型存取群組（[設定預算](./users#set-budgets)、[團隊預算](./team_budgets)、[標籤預算](./tag_budgets)、[存取群組預算](./model_access_group_budgets)）。每分鐘請求數、每分鐘 token 數，以及平行請求限制會套用於每個金鑰、團隊、使用者、模型與標籤，且計數器會透過 Redis 在各執行個體間共享（[設定速率限制](./users#set-rate-limits)、[多執行個體速率限制](./users#multi-instance-rate-limiting)）。當計數器無法驗證時，`fail_closed_budget_enforcement`（[硬性預算強制執行](./users#hard-budget-enforcement-fail-closed)）與 `fail_closed_rate_limit_enforcement`（[硬性速率限制強制執行](./users#hard-rate-limit-enforcement-fail-closed)）會以 `503` 拒絕，而不是允許。[每個 worker 的准入控制](./server_tuning#per-worker-admission-control) 以有界佇列限制處理中的請求，`max_request_size_mb` 與 `max_response_size_mb` 限制主體大小，[上限 key 參數](./virtual_keys#upperbound-keygenerate-params) 對 `/key/generate` 可要求的內容設下上限，直通路由在預設情況下 600 秒後逾時（[請求逾時](./pass_through#request-timeouts)），而 `litellm_settings.block_requests_for_models_without_pricing: true` 會拒絕成本對照表無法定價且 `403` 類型為 `model_cost_map_missing` 的模型，因此不會有任何支出未被計量

**如何啟用。** 在金鑰、團隊或使用者上設定 `max_budget` 以及 `rpm_limit`、`tpm_limit` 與 `max_parallel_requests` 欄位；設定兩個 fail-closed 標記、`max_in_flight_requests_per_worker`，以及 `general_settings` 下的大小上限；在 `litellm_settings` 下設定 `upperbound_key_generate_params`

**已知限制。** 上述每一項限制預設都未設定；只有直通逾時是啟用的。proxy 管理員金鑰會在預算與速率限制檢查執行前先通過驗證，因此兩者都豁免。團隊範圍金鑰會略過個人使用者預算，除非 `general_settings.apply_user_budget_to_team_keys: true`。預算只會在 LLM API 路由上檢查，不會在管理或工具路由上檢查。全域 `max_budget` 需要資料庫，沒有資料庫時不會強制執行。關閉 fail-closed 標記時，Redis 中斷會降級為每個執行個體的計數器；開啟 `fail_closed_budget_enforcement` 時，標籤預算仍會允許通過，因為其計數器只存在於 Redis 中，而存取群組預算只是單純讀取，沒有保留。主體大小上限僅限企業版，否則會記錄並略過。`max_tokens` 沒有每個金鑰的上限，因此輸出量是由每分鐘 token 數與預算限制，而不是由每次請求限制

## LLM07 錯誤資訊 {#llm07-misinformation}

此條目因事件資料上升了兩個名次，新的重點是一個會驅動工具呼叫或決策的錯誤答案

**提供內容。** 有三個防護欄會將回應與來源材料比對：搭配 `contextual_grounding_from_messages` 的 [Bedrock Guardrails contextual grounding](./guardrails/bedrock#contextual-grounding)、[Qualifire hallucination and grounding checks](./guardrails/qualifire#available-checks)，以及 [XecGuard context grounding](./guardrails/xecguard#context-grounding-rag)，它會從 `metadata.xecguard_grounding_documents` 讀取文件。[LLM-as-a-judge 防護欄](./guardrails/llm_as_a_judge) 會由第二個模型依據您自己的評分規範對回應評分，並在低於 `overall_threshold`（預設為 80）時阻擋。對於即將退役的模型，`GET /model/deprecations` 會列出提供者淘汰日期落在 `warn_within_days` 之內（預設為 30）的部署，而在設定好警報之後，Slack `model_deprecation_warnings` 警報就會觸發

**如何啟用。** 使用 `mode: post_call` 定義 grounding 或 judge 防護欄，將其附加到需要它的金鑰或團隊，並將來源文件傳遞到提供者所期望的位置。淘汰警告只需要警報設定

**已知限制。** 這裡的每個檢查都屬於選用功能，會為請求額外增加一次提供者或模型呼叫，而且是機率性的。grounding 檢查需要請求或中繼資料中的來源文件，因此在 LiteLLM 外部擷取的 RAG 流程必須一併傳遞這些文件。沒有任何機制能在沒有來源文件的情況下驗證事實主張，而會變成工具呼叫的錯誤答案，會根據工具政策（LLM03）檢查，而不是根據真實性。閘道本身無法分辨過度自信的答案與正確答案

## LLM08 隱藏內容曝露 {#llm08-hidden-context-exposure}

在 2026 年從 System Prompt Leakage 更名而來，並擴大到開發者指示、RAG 政策文字、使用者設定檔與工具結構描述，並建議將所有內容都視為可能外洩

**提供內容。** 受管理提示會將開發者訊息保留在伺服器端，因此呼叫端傳送的是 `prompt_id` 與變數，而不是提示本身（[提示管理](./litellm_prompt_management)），而且只有 proxy 管理員可以寫入。 [Content Filter](./guardrails/litellm_content_filter) 的 `prompt_injection_system_prompt` 模式會阻擋要求系統提示的請求，而 Bedrock 的 [`PROMPT_LEAKAGE` 檢查](./guardrails/bedrock#resource-less-checks-invokeguardrailchecks) 也會透過 Bedrock 執行同樣的動作。LLM02 的去識別化切換可將提示排除在記錄、警報與支出記錄之外，而 [僅記錄 PII 遮罩](./guardrails/pii_masking_v2#logging-only) 會遮罩您的記錄回呼收到的內容。除非設定了 [轉送用戶端標頭](./forward_client_headers)，否則用戶端標頭不會轉送給提供者，內部 `_hidden_params` 會從回應中移除，而錯誤訊息會經過 LLM02 下所述的內部詳細資訊清理流程

**如何啟用。** 請先將秘密與政策文字移出提示之外；本頁上的任何內容都無法讓接收該提示的模型無法讀取它。接著以 `mode: pre_call` 定義 Content Filter 或 Bedrock 防護欄，並在 `litellm_settings` 下設定去識別化標記

**已知限制。** 模型可以被誘使重複其上下文，而閘道的檢查會以模式捕捉直接的請求；Bedrock 檢查只在請求端執行。預設會關閉紅動作，而 Responses API `instructions` 與 `tools` 欄位不受訊息紅動作保護，因此即使設定了 `turn_off_message_logging`，它們仍會完整傳遞到回呼。提示清單與資訊端點會遵守金鑰中繼資料裡的 `prompts` allowlist，但在請求時解析 `prompt_id` 時沒有存取檢查，所以任何能呼叫模型的金鑰，只要知道某個 prompt id，就可以使用它。`x-litellm-model-api-base` 回應標頭一律會標示上游主機（查詢字串會被移除），而公開提供者主機名稱可能會出現在面向用戶端的錯誤訊息 `API Base:` 行中。任何已驗證的金鑰都可以透過 v1 `/guardrails/list` 路由列出已設定的防護欄名稱與遮罩後的參數

## LLM09 向量與嵌入弱點 {#llm09-vector-and-embedding-weaknesses}

此條目涵蓋遭污染的 chunk、儲存區上的弱存取控制，以及 embedding 反演

**提供內容。** 金鑰與團隊可透過 `object_permission.vector_stores` [限制為特定向量儲存區](../vector_stores/managed_vector_stores#restricting-keys-and-teams-to-specific-stores)，儲存區可限定於某個團隊，而 `disable_vector_stores_for_internal_users` 則可徹底阻擋內部使用者。LLM05 下的 ingest 檢查適用於內嵌上傳。向量儲存區頁面描述了[擷取的上下文會先經過請求前防護欄](../vector_stores/managed_vector_stores#retrieved-context-goes-through-your-pre-call-guardrails)，這是模型看見遭污染 chunk 之前攔截它的預期位置

**如何啟用。** 在金鑰或團隊上設定 `object_permission.vector_stores`，在儲存區上設定 `team_id`，而當不應讓內部使用者查詢儲存區時，則在 `general_settings` 下設定 `disable_vector_stores_for_internal_users: true`

**已知限制。** 存取權限是以儲存區為單位，而不是以文件為單位。空的 `vector_stores` 清單表示允許所有儲存區，而沒有 `team_id` 的儲存區，任何可使用向量儲存區的金鑰都能使用。於版本 `1.104.0`，擷取出的 chunks 會在請求前防護欄已執行完之後才加入請求，因此向量儲存區頁面所描述的掃描要等到 [PR #43271](https://github.com/BerriAI/litellm/pull/43271) 合併後才會發生；在那之前，`post_call` 防護欄看到的是模型對這些 chunks 的使用，而不是 chunks 本身。匯入時的惡意程式掃描器是 LLM05 下所描述的占位實作。embedding 反演，以及儲存區本身的加密與存取控制，屬於向量資料庫；閘道會保存其憑證並轉發查詢

## LLM10 不當輸出處理 {#llm10-improper-output-handling}

此條目在 2026 年下滑了五個名次，但仍涵蓋未驗證輸出流向瀏覽器、資料庫、shell 與 API，以及不安全的生成程式碼

**提供內容。** 任何具有 `mode: post_call` 的防護欄，都會在用戶端看見回應之前檢查或重寫該回應，而 [工具權限防護欄](./guardrails/tool_permission) 會檢查回應要求的工具呼叫。對於串流，`streaming_buffer_until_moderated`、`streaming_sampling_rate`、`streaming_end_of_stream_only` 與 `streaming_transform_mode` 會決定串流是先暫停直到通過，還是邊傳送邊抽樣（[串流與 post_call 防護欄](./guardrails/custom_guardrail)），而 [Bedrock](./guardrails/bedrock#streaming) 與 [Content Filter](./guardrails/litellm_content_filter#streaming-support) 則各自記錄其串流行為。[輸出解析](./guardrails/pii_masking_v2#output-parsing) 在 PII 防護欄中會遮罩回應上的實體。Admin UI 會以 Markdown 方式呈現模型輸出，不含原始 HTML

**如何啟用。** 定義帶有 `mode: post_call` 的防護欄，將其附加上去，並在必須於任何 chunk 抵達用戶端之前先行封鎖時，於其上設定 `streaming_buffer_until_moderated: true`

**已知限制。** 每個輸出防護欄都必須明確啟用。對於串流，未啟用 buffering 的 `post_call` 防護欄會在 chunks 已經送出之後，才對組裝完成的回應進行處理，因此只能稽核，不能阻擋；預設只有 Bedrock、Straiker 與 Rubrik 會進行 buffering，其餘每五個 chunk 抽樣一次，而 OpenAI moderation 防護欄則是抽樣而非 buffering。PII 輸出解析不涵蓋來自 Anthropic 以外提供者的原始位元組串流，或 `/v1/responses` 串流事件，且在略過它們時會記錄警告。閘道不會驗證生成的程式碼、SQL、HTML 或 shell 指令與您的應用程式會如何使用它們是否相符；請在每個消費端都將模型輸出視為不受信任的輸入。Admin UI 會自動載入模型輸出中所引用的遠端圖片（[PR #43276](https://github.com/BerriAI/litellm/pull/43276) 正在審查中，以改成點擊後才載入）

## 保持此頁最新 {#keeping-this-page-current}

OWASP 清單位於 [genai.owasp.org](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)，而此頁追蹤的是其 2026 版。上述控制項與限制已對照 LiteLLM `main` 於版本 `1.104.0` 進行檢查；如同處於審查中的連結 pull request 在合併時會變更某些限制，因此請依您執行的版本確認其狀態。如果您版本上的某項控制行為與此頁所述不同，請在 [BerriAI/litellm](https://github.com/BerriAI/litellm/issues) 開 issue，並附上版本與章節名稱
