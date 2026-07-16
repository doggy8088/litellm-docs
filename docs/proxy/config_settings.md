```yaml
environment_variables: {}

model_list:
  - model_name: string
    litellm_params: {}
    model_info:
      id: string
      mode: embedding
      input_cost_per_token: 0
      output_cost_per_token: 0
      max_tokens: 2048
      base_model: gpt-4-1106-preview
      additionalProp1: {}

litellm_settings:
  # Logging/Callback settings
  success_callback: ["langfuse"]  # list of success callbacks
  failure_callback: ["sentry"]  # list of failure callbacks
  callbacks: ["otel"]  # list of callbacks - runs on success and failure
  service_callbacks: ["datadog", "prometheus"]  # logs redis, postgres failures on datadog, prometheus
  turn_off_message_logging: boolean  # prevent the messages and responses from being logged to on your callbacks, but request metadata will still be logged. Useful for privacy/compliance when handling sensitive data.
  redact_user_api_key_info: boolean  # Redact information about the user api key (hashed token, user_id, team id, etc.), from logs. Currently supported for Langfuse, OpenTelemetry, Logfire, ArizeAI logging.
  langfuse_default_tags: ["cache_hit", "cache_key", "proxy_base_url", "user_api_key_alias", "user_api_key_user_id", "user_api_key_user_email", "user_api_key_team_alias", "semantic-similarity", "proxy_base_url"] # default tags for Langfuse Logging
  # Networking settings
  request_timeout: 10 # (int) llm requesttimeout in seconds. Raise Timeout error if call takes longer than 10s. Sets litellm.request_timeout
  force_ipv4: boolean # If true, litellm will force ipv4 for all LLM requests. Some users have seen httpx ConnectionError when using ipv6 + Anthropic API

  # Cost tracking settings
  cost_discount_config:
    vertex_ai: 0.05 # Apply a 5% discount to Vertex AI costs
    gemini: 0.05 # Apply a 5% discount to Gemini costs
  cost_margin_config:
    global: 0.05 # Apply a 5% margin to all providers
    openai: 0.10 # Apply a 10% margin to OpenAI costs
  
  # Debugging - see debugging docs for more options
  # Use `--debug` or `--detailed_debug` CLI flags, or set LITELLM_LOG env var to "INFO", "DEBUG", or "ERROR"
  json_logs: boolean # if true, logs will be in json format

  # Fallbacks, reliability
  default_fallbacks: ["claude-opus"] # set default_fallbacks, in case a specific model group is misconfigured / bad.
  content_policy_fallbacks: [{ "gpt-3.5-turbo-small": ["claude-opus"] }] # fallbacks for ContentPolicyErrors
  context_window_fallbacks: [{ "gpt-3.5-turbo-small": ["gpt-3.5-turbo-large", "claude-opus"] }] # fallbacks for ContextWindowExceededErrors

  # MCP Aliases - Map aliases to MCP server names for easier tool access
  mcp_aliases: {
      "github": "github_mcp_server",
      "zapier": "zapier_mcp_server",
      "deepwiki": "deepwiki_mcp_server",
    } # Maps friendly aliases to MCP server names. Only the first alias for each server is used

  # Caching settings
  cache: true
  cache_params: # set cache params for redis
    type: redis # type of cache to initialize (options: "local", "redis", "s3", "gcs")

    # Optional - Redis Settings
    host: "localhost" # The host address for the Redis cache. Required if type is "redis".
    port: 6379 # The port number for the Redis cache. Required if type is "redis".
    password: "your_password" # The password for the Redis cache. Required if type is "redis".
    namespace: "litellm.caching.caching" # namespace for redis cache
    max_connections: 100  # [OPTIONAL] Set Maximum number of Redis connections. Passed directly to redis-py. 
    # Optional - Redis Cluster Settings
    redis_startup_nodes: [{ "host": "127.0.0.1", "port": "7001" }]

    # Optional - Redis Sentinel Settings
    service_name: "mymaster"
    sentinel_nodes: [["localhost", 26379]]

    # Optional - GCP IAM Authentication for Redis
    gcp_service_account: "projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com" # GCP service account for IAM authentication
    gcp_ssl_ca_certs: "./server-ca.pem" # Path to SSL CA certificate file for GCP Memorystore Redis
    ssl: true # Enable SSL for secure connections
    ssl_cert_reqs: null # Set to null for self-signed certificates
    ssl_check_hostname: false # Set to false for self-signed certificates

    # Optional - Qdrant Semantic Cache Settings
    qdrant_semantic_cache_embedding_model: openai-embedding # the model should be defined on the model_list
    qdrant_collection_name: test_collection
    qdrant_quantization_config: binary
    qdrant_semantic_cache_vector_size: 1536 # vector size must match embedding model dimensionality
    similarity_threshold: 0.8 # similarity threshold for semantic cache

    # Optional - S3 Cache Settings
    s3_bucket_name: cache-bucket-litellm # AWS Bucket Name for S3
    s3_region_name: us-west-2 # AWS Region Name for S3
    s3_aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID # us os.environ/<variable name> to pass environment variables. This is AWS Access Key ID for S3
    s3_aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY # AWS Secret Access Key for S3
    s3_endpoint_url: https://s3.amazonaws.com # [OPTIONAL] S3 endpoint URL, if you want to use Backblaze/cloudflare s3 bucket

    # Optional - GCS Cache Settings
    gcs_bucket_name: cache-bucket-litellm # GCS Bucket Name for caching
    gcs_path_service_account: os.environ/GCS_PATH_SERVICE_ACCOUNT # Path to GCS service account JSON file
    gcs_path: cache/ # [OPTIONAL] GCS path prefix for cache objects

    # Common Cache settings
    # Optional - Supported call types for caching
    supported_call_types:
      ["acompletion", "atext_completion", "aembedding", "atranscription"]
      # /chat/completions, /completions, /embeddings, /audio/transcriptions
    mode: default_off # if default_off, you need to opt in to caching on a per call basis
    ttl: 600 # ttl for caching
    disable_copilot_system_to_assistant: False # DEPRECATED - GitHub Copilot API supports system prompts.

  # Virtual key auth cache — shares API key / virtual-key auth across workers via Redis.
  # Reduces DB round trips when caches are cold on new workers or pods.
  # Requires litellm_settings.cache: true AND cache_params.type: redis above.
  enable_redis_auth_cache: false

callback_settings:
  otel:
    message_logging: boolean # OTEL logging callback specific settings

general_settings:
  completion_model: string
  store_prompts_in_spend_logs: boolean
  forward_client_headers_to_llm_api: boolean
  disable_spend_logs: boolean  # turn off writing each transaction to the db
  disable_master_key_return: boolean  # turn off returning master key on UI (checked on '/user/info' endpoint)
  disable_retry_on_max_parallel_request_limit_error: boolean  # turn off retries when max parallel request limit is reached
  disable_reset_budget: boolean  # turn off reset budget scheduled task
  disable_adding_master_key_hash_to_db: boolean  # turn off storing master key hash in db, for spend tracking
  disable_responses_id_security: boolean  # turn off response ID security checks that prevent users from accessing other users' responses
  enable_jwt_auth: boolean  # allow proxy admin to auth in via jwt tokens with 'litellm_proxy_admin' in claims
  enforce_user_param: boolean  # requires all openai endpoint requests to have a 'user' param
  reject_clientside_metadata_tags: boolean  # if true, rejects requests with client-side 'metadata.tags' to prevent users from influencing budgets
  disable_batch_input_file_rate_limiting: boolean  # if true, skip pre-reading batch input files for rate-limit/model checks
  skip_batch_input_file_rate_limiting_for_providers: ["hosted_vllm"]  # provider allowlist for skipping batch input-file pre-read
  skip_batch_input_file_rate_limiting_for_models: ["my-batch-model-prefix"]  # model/prefix allowlist for skipping batch input-file pre-read
  allowed_routes: ["route1", "route2"]  # list of allowed proxy API routes - a user can access. (currently JWT-Auth only)
  key_management_system: google_kms  # either google_kms or azure_kms
  master_key: string
  maximum_spend_logs_retention_period: 30d # The maximum time to retain spend logs before deletion.
  maximum_spend_logs_retention_interval: 1d # interval in which the spend log cleanup task should run in.
  user_mcp_management_mode: restricted  # or "view_all"

  # Database Settings
  database_url: string
  database_connection_pool_limit: 0  # default 10
  database_connection_timeout: 0  # default 60s
  database_connect_timeout: 0  # Prisma `connect_timeout` URL param (seconds). Unset => Prisma default.
  database_socket_timeout: 0  # Prisma `socket_timeout` URL param (seconds). Idle/slow connections beyond this are closed.
  database_extra_connection_params: {}  # Extra key/value pairs appended to the Prisma DATABASE_URL / DIRECT_URL query string (e.g. sslmode, pgbouncer, statement_cache_size). Overrides LiteLLM defaults.
  database_disable_prepared_statements: boolean  # if true, appends pgbouncer=true to the Prisma connection URL, disabling server-side prepared statements. For PgBouncer transaction pooling and avoiding "cached plan must not change result type" errors during rolling migrations.
  allow_requests_on_db_unavailable: boolean  # if true, will allow requests that can not connect to the DB to verify Virtual Key to still work 
  fail_closed_budget_enforcement: boolean  # if true, validates spend against the DB for every budgeted request and rejects with 503 when spend cannot be verified against Redis or the DB

  custom_auth: string
  max_parallel_requests: 0 # the max parallel requests allowed per deployment
  global_max_parallel_requests: 0 # the max parallel requests allowed on the proxy all up
  infer_model_from_keys: true
  background_health_checks: true
  health_check_interval: 300
  alerting: ["slack", "email"]
  alerting_threshold: 0
  use_client_credentials_pass_through_routes: boolean  # use client credentials for all pass through routes like "/vertex-ai", /bedrock/. When this is True Virtual Key auth will not be applied on these endpoints

router_settings:
  routing_strategy: simple-shuffle # Literal["simple-shuffle", "least-busy", "usage-based-routing","latency-based-routing"], default="simple-shuffle" - RECOMMENDED for best performance
  redis_host: <your-redis-host>           # string
  redis_password: <your-redis-password>   # string
  redis_port: <your-redis-port>           # string
  enable_pre_call_checks: true            # bool - Before call is made check if a call is within model context window 
  allowed_fails: 3 # cooldown model if it fails > 1 call in a minute. 
  cooldown_time: 30 # (in seconds) how long to cooldown model if fails/min > allowed_fails
  disable_cooldowns: True                  # bool - Disable cooldowns for all models 
  enable_tag_filtering: True                # bool - Use tag based routing for requests
  tag_filtering_match_any: True             # bool - Tag matching behavior (only when enable_tag_filtering=true). `true`: match if deployment has ANY requested tag; `false`: match only if deployment has ALL requested tags
  retry_policy: {                          # Dict[str, int]: retry policy for different types of exceptions
    "AuthenticationErrorRetries": 3,
    "TimeoutErrorRetries": 3,
    "RateLimitErrorRetries": 3,
    "ContentPolicyViolationErrorRetries": 4,
    "InternalServerErrorRetries": 4
  }
  allowed_fails_policy: {
    "BadRequestErrorAllowedFails": 1000, # Allow 1000 BadRequestErrors before cooling down a deployment
    "AuthenticationErrorAllowedFails": 10, # int 
    "TimeoutErrorAllowedFails": 12, # int 
    "RateLimitErrorAllowedFails": 10000, # int 
    "ContentPolicyViolationErrorAllowedFails": 15, # int 
    "InternalServerErrorAllowedFails": 20, # int 
  }
  content_policy_fallbacks=[{"claude-2": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for content policy violations
  fallbacks=[{"claude-2": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for all errors

```

### litellm_settings - 參考 {#litellm_settings---reference}

| 名稱 | 類型 | 說明 |
|------|------|-------------|
| success_callback | string 陣列 | 成功回呼清單。[Doc Proxy logging callbacks](logging), [Doc Metrics](prometheus) |
| failure_callback | string 陣列 | 失敗回呼清單 [Doc Proxy logging callbacks](logging), [Doc Metrics](prometheus) |
| callbacks | string 陣列 | 回呼清單 - 於成功與失敗時執行 [Doc Proxy logging callbacks](logging), [Doc Metrics](prometheus) |
| service_callbacks | string 陣列 | 系統健康監控 - 在指定服務（例如 datadog、prometheus）上記錄 redis、postgres 失敗 [Doc Metrics](prometheus) |
| turn_off_message_logging | boolean | 若為 true，將防止訊息與回應被記錄到回呼，但請求中繼資料仍會被記錄。適用於處理敏感資料時的隱私／合規需求 [Proxy Logging](logging) |
| modify_params | boolean | 若為 true，允許在請求傳送給 LLM 提供者之前修改其參數 |
| enable_preview_features | boolean | 若為 true，啟用預覽功能 - 例如支援串流的 Azure O1 Models。|
| LITELLM_DISABLE_STOP_SEQUENCE_LIMIT | 停用 stop sequence 上限的驗證（預設值：4） |  
| redact_user_api_key_info | boolean | 若為 true，會從記錄中遮蔽使用者 API 金鑰的資訊 [Proxy Logging](logging#redacting-userapikeyinfo) |
| mcp_aliases | object | 將友善別名對應到 MCP 伺服器名稱，以便更容易存取工具。每個伺服器只會使用第一個別名。 [MCP Aliases](../mcp#mcp-aliases) |
| langfuse_default_tags | string 陣列 | Langfuse 記錄的預設標籤。若您想控制 LiteLLM proxy 將哪些 LiteLLM 特定欄位以標籤形式記錄，請使用此設定。預設情況下，LiteLLM Proxy 不會將任何 LiteLLM 特定欄位以標籤形式記錄。 [Further docs](./logging#litellm-specific-tags-on-langfuse---cache_hit-cache_key) |
| set_verbose | boolean | [已棄用 - 請參見除錯文件](./debugging) 請改用 `--debug` 或 `--detailed_debug` CLI 旗標，或將 `LITELLM_LOG` 環境變數設為 "INFO"、"DEBUG" 或 "ERROR"。 |
| json_logs | boolean | 若為 true，記錄將為 json 格式。若您需要將記錄儲存為 JSON，只需設定 `litellm.json_logs = True`。目前我們只會將 litellm 的原始 POST 請求記錄為 JSON [Further docs](./debugging) |
| default_fallbacks | string 陣列 | 若特定模型群組設定錯誤／異常時，使用的備援模型清單。 [Further docs](./reliability#default-fallbacks) |
| request_timeout | integer | 請求逾時時間（秒）。若未設定，預設值為 `6000 seconds`。[參考 OpenAI Python SDK 預設為 `600 seconds`。](https://github.com/openai/openai-python/blob/main/src/openai/_constants.py) |
| force_ipv4 | boolean | 若為 true，litellm 將強制所有 LLM 請求使用 ipv4。部分使用者在使用 ipv6 + Anthropic API 時曾遇到 httpx ConnectionError |
| content_policy_fallbacks | object 陣列 | 當遇到 ContentPolicyViolationError 時使用的備援。 [Further docs](./reliability#content-policy-fallbacks) |
| context_window_fallbacks | object 陣列 | 當遇到 ContextWindowExceededError 時使用的備援。 [Further docs](./reliability#context-window-fallbacks) |
| cache | boolean | 若為 true，啟用快取。 [Further docs](./caching) |
| cache_params | object | 快取參數。 [Further docs](./caching#supported-cache_params-on-proxy-configyaml) |
| enable_redis_auth_cache | boolean | 當 `true` 時，會將虛擬金鑰驗證負載儲存在 Redis 中（與回應快取使用相同的用戶端），因此每個 worker/pod 都可共享快取的驗證查詢——在快取未命中時減少重複的資料庫讀取。**需要 `cache: true` 和 `cache_params.type: redis`**（Redis 或 Redis Cluster）。可選：設定 `general_settings.user_api_key_cache_ttl`，讓 TTL 在記憶體與 Redis 中一致套用。 [Further docs](./caching#virtual-key-authentication-cache-redis) |
| disable_end_user_cost_tracking | boolean | 若為 true，會在 proxy 上關閉 Prometheus 指標 + litellm spend logs 表的終端使用者成本追蹤。 |
| enable_end_user_cost_tracking_prometheus_only | boolean | 若為 true，會在 Prometheus 指標上加入 `end_user` 標籤。預設為停用，以維持 Prometheus cardinality 有上限。 [Further docs](./prometheus#tracking-end_user-on-prometheus) |
| cost_discount_config | object | 套用於成本計算的提供者特定百分比折扣。請在 `litellm_settings` 下設定。 [Further docs](./provider_discounts) |
| cost_margin_config | object | 套用於成本計算的提供者特定或全域百分比／固定利潤。請在 `litellm_settings` 下設定。 [Further docs](./provider_margins) |
| key_generation_settings | object | 限制誰可以產生金鑰。 [Further docs](./virtual_keys.md#restricting-key-generation) |
| disable_add_transform_inline_image_block | boolean | 針對 Fireworks AI models - 若為 true，當模型不是 vision model 時，會關閉自動將 `#transform=inline` 加入 image_url 的 url。 |
| use_chat_completions_url_for_anthropic_messages | boolean | 若為 true，會將 OpenAI `/v1/messages` 請求透過 chat/completions 而非 Responses API 路由。也可透過環境變數 `LITELLM_USE_CHAT_COMPLETIONS_URL_FOR_ANTHROPIC_MESSAGES=true` 設定。 |
| route_all_chat_openai_to_responses | boolean | 若為 true，會將所有 OpenAI `/chat/completions` 請求透過 Responses API bridge 路由。建議用於 OpenAI models。也可透過環境變數 `LITELLM_ROUTE_ALL_CHAT_OPENAI_TO_RESPONSES=true` 設定。 |
| skip_system_message_in_guardrail | boolean | 若為 true，統一防護欄僅在 **chat completions** 與 **Anthropic `/v1/messages`** 中，從掃描輸入中省略 `role: system`；LLM 仍會接收到完整訊息。每個防護欄可覆寫：在各自防護欄上設定 `litellm_params.skip_system_message_in_guardrail`。 [Guardrails quick start](./guardrails/quick_start#skip-system-messages-in-guardrail-evaluation) |
| disable_hf_tokenizer_download | boolean | 若為 true，預設對所有模型（包括 huggingface models）使用 openai tokenizer。 |
| enable_json_schema_validation | boolean | 若為 true，會為所有請求啟用 json schema 驗證。 |
| enable_key_alias_format_validation | boolean | 若為 true，會驗證 `key_alias` 於 `/key/generate` 與 `/key/update` 的格式。必須為 2-255 個字元，開頭／結尾為英數字元，且只允許 `a-zA-Z0-9_-/.@`。預設 `false`。 |
| require_managed_files | boolean | 預設 `false`。當 `true` 時，`POST /v1/files` 需要 `target_model_names`，並以 `400` 拒絕傳統提供者檔案上傳。用於強制使用 LiteLLM managed files，以管理檔案擁有權與存取控制。 [Further docs](./litellm_managed_files#optional-enforce-managed-files-on-upload) |
| user_url_validation | boolean | 預設 `true`。當 `true` 時，proxy 會在擷取前驗證由使用者控制的 URL（例如，當 OpenAPI `spec_path` 是 `http(s)` URL 時、image URLs，以及類似項目）：DNS 會被解析，且對非全球可路由位址（RFC1918、loopback、link-local 等）的連線會被封鎖，除非 URL 中的 **hostname** 列於 `user_url_allowed_hosts`。設定為 `false` 可跳過驗證（僅在您信任可提供 URL 的來源時）。**必須設定於 `litellm_settings` 下**，而非 `general_settings`。 |
| user_url_allowed_hosts | string 陣列 | 當 `user_url_validation` 為 `true` 時，允許解析為私有／內部 IP 的 hostname。請比對 URL 中實際出現的 host（例如 `api.corp.internal`、`127.0.0.1`、`127.0.0.1:8080`、`[::1]:443`）。對於 split-horizon DNS，請將 public hostname 加入允許清單，而非解析後的 `10.x` 位址。**必須設定於 `litellm_settings` 下**，而非 `general_settings`。請參見 [MCP from OpenAPI](../mcp_openapi#internal-spec-urls-ssrf)。 |
| disable_copilot_system_to_assistant | boolean | **已棄用** - GitHub Copilot API 支援 system prompts。 |
| default_team_params | object | 套用於透過 `/team/new` 建立的每個新團隊的預設參數（包含 SSO 自動建立的團隊）。只會補入請求中未明確設定的欄位。子欄位：`max_budget`（float）、`budget_duration`（string，例如 `"30d"`）、`tpm_limit`（integer）、`rpm_limit`（integer）、`team_member_permissions`（string 陣列，例如 `["/team/daily/activity", "/key/generate"]`）、`models`（string 陣列 — 僅套用於 SSO 自動建立的團隊）。 |

### 一般設定 - 參考 {#general_settings---reference}

| 名稱 | 類型 | 說明 |
|------|------|-------------|
| completion_model | string | 要用於所有 completions 的模型，會覆寫請求中指定的任何 `model` |
| enable_drain_endpoint | boolean | 若為 true，會公開未經驗證的 `GET /health/drain` 端點，供 Kubernetes `preStop` hook 在關機前排空進行中的請求。預設為關閉；僅在 health port 只能從叢集內部存取時才啟用，因為任何能連到它的呼叫端都可以將 pod 移出輪替。請參閱 `GRACEFUL_SHUTDOWN_TIMEOUT`。 |
| drain_endpoint_token | string | `/health/drain` 端點的共享密鑰。設定後，drain 呼叫必須帶有相符的 `X-Drain-Token` 標頭（與 `secrets.compare_digest` 比對），否則會以 401 拒絕；kubelet 會從 preStop `httpGet.httpHeaders` 提供它。也可透過 `DRAIN_ENDPOINT_TOKEN` 環境變數設定。 |
| disable_spend_logs | boolean | 若為 true，會關閉將每筆交易寫入資料庫 |
| disable_spend_updates | boolean | 若為 true，會關閉對 DB 的所有 spend 更新。包括 key/user/team spend 更新。 |
| disable_master_key_return | boolean | 若為 true，會關閉在 UI 上回傳 master key。（在 '/user/info' 端點上檢查） |
| disable_retry_on_max_parallel_request_limit_error | boolean | 若為 true，當達到最大平行請求限制時會關閉重試 |
| disable_reset_budget | boolean | 若為 true，會關閉重設 budget 的排程工作 |
| disable_adding_master_key_hash_to_db | boolean | 若為 true，會關閉將 master key hash 儲存到 db |
| disable_responses_id_security | boolean | 若為 true，會停用 response ID 安全性檢查，這些檢查可防止使用者存取其他使用者的 response ID。若為 false（預設），response ID 會與使用者資訊一起加密，以確保使用者只能存取自己的回應。適用於 /v1/responses 端點 |
| enable_jwt_auth | boolean | 允許 proxy 管理員透過 claims 中含有 'litellm_proxy_admin' 的 jwt token 進行驗證。[JWT Token 文件](token_auth) |
| enforce_user_param | boolean | 若為 true，要求所有 OpenAI 端點請求都必須有 'user' 參數。[call hooks 文件](call_hooks)|
| reject_clientside_metadata_tags | boolean | 若為 true，會拒絕包含 client-side 'metadata.tags' 的請求，以防使用者透過送出不同標籤來影響 budget。標籤只能從 API key metadata 繼承。 |
| disable_batch_input_file_rate_limiting | boolean | 若為 true，會在 `POST /batches` 預檢期間略過 batch 輸入檔案的預讀。 |
| skip_batch_input_file_rate_limiting_for_providers | array of strings | 略過特定提供者的 batch 輸入檔案預讀（例如 `["hosted_vllm"]`）。 |
| skip_batch_input_file_rate_limiting_for_models | array of strings | 略過特定模型名稱或前綴的 batch 輸入檔案預讀。 |
| allowed_routes | array of strings | 使用者可存取的允許 proxy API 路由清單 [控制允許路由文件](enterprise#control-available-public-private-routes)|
| key_management_system | string | 指定金鑰管理系統。[Secret Managers 文件](../secret) |
| master_key | string | proxy 的 master key [建立 Virtual Keys](virtual_keys) |
| database_url | string | 資料庫連線的 URL [建立 Virtual Keys](virtual_keys) |
| database_connection_pool_limit | integer | 資料庫連線池的限制 [設定 DB Connection Pool 限制](#configure-db-pool-limits--connection-timeouts) |
| database_connection_timeout | integer | 資料庫連線逾時時間（秒）[設定 DB Connection Pool 限制，timeout](#configure-db-pool-limits--connection-timeouts) |
| database_connect_timeout | float | 對應到 Prisma [`connect_timeout`](https://www.prisma.io/docs/orm/overview/databases/postgresql) URL 參數（秒）。限制 engine 在失敗前等待建立新連線的時間。若未設定，預設為 Prisma 內建值。 |
| database_socket_timeout | float | 對應到 Prisma [`socket_timeout`](https://www.prisma.io/docs/orm/overview/databases/postgresql) URL 參數（秒）。設定後，會關閉在此時間窗內未產生資料的閒置或緩慢連線。**請使用此設定來限制 LiteLLM 的閒置 Prisma 連線。** |
| database_extra_connection_params | object | 逃生閥——額外的 key/value 配對，會原樣附加到 Prisma `DATABASE_URL` / `DIRECT_URL` 查詢字串（例如 `sslmode`、`pgbouncer`、`statement_cache_size`）。此處的 keys 會覆寫 LiteLLM 設定的任何預設值。 |
| database_disable_prepared_statements | boolean | 將 `pgbouncer=true` 附加到 Prisma 連線 URL，停用伺服器端 prepared statements 的重用。可在 PgBouncer transaction pooling 後方使用，或避免 rolling schema migrations 期間出現 `cached plan must not change result type` 錯誤。若 `database_extra_connection_params` 中明確設定 `pgbouncer` key，則以其為準。[停用伺服器端 Prepared Statements](configs#disable-server-side-prepared-statements) |
| allow_requests_on_db_unavailable | boolean | 若為 true，即使 DB 無法連線，也允許請求成功。**僅在您於自己的 VPC 中執行 LiteLLM 時才使用此設定** 即使 LiteLLM 無法連線到 DB 來驗證 Virtual Key，這也能讓請求正常運作 [資料庫無法使用時的 graceful 處理文件](prod#5-if-running-litellm-on-vpc-gracefully-handle-db-unavailability) |
| fail_closed_budget_enforcement | boolean | 預設 `false`。當 `true` 時，budget 檢查會對每個有 budget 的請求（key、team、user、organization、end-user、tag，以及 per-window budgets）將 spend 與權威資料庫比對，而不是只信任跨 pod 的 Redis counter；當目前 spend 無法從 Redis 或資料庫其中任一方驗證時，請求會以 `503` 被拒絕。當已設定的 budget 必須是絕對上限，即使 Redis 降級或重新啟動也一樣時，請使用此設定；若要讓健康且低於 budget 的流量不要碰到資料庫，則保持關閉。[budget enforcement 文件](./users#hard-budget-enforcement-fail-closed) |
| custom_auth | string | 自行撰寫自訂驗證邏輯 [Custom Auth 文件](./custom_auth) |
| max_parallel_requests | integer | 每個 deployment 允許的最大平行請求數 |
| global_max_parallel_requests | integer | proxy 整體允許的最大平行請求數 |
| cancel_on_disconnect | boolean | 若為 true，當用戶端中斷連線時，會取消進行中的上游 LLM 請求（非串流），以釋放後端容量（例如 vLLM GPU slot）。被取消的請求會以 499 失敗記錄。預設 `false` |
| infer_model_from_keys | boolean | 若為 true，會從提供的 keys 推斷模型 |
| background_health_checks | boolean | 若為 true，會啟用背景健康檢查。[health checks 文件](health) |
| health_check_interval | integer | 健康檢查的間隔時間（秒）[health checks 文件](health) |
| alerting | array of strings | 警示方法清單 [Slack Alerting 文件](alerting) |
| alerting_threshold | integer | 觸發警示的閾值 [Slack Alerting 文件](alerting) |
| use_client_credentials_pass_through_routes | boolean | 若為 true，會對所有 pass-through 路由使用 client credentials。[pass through routes 文件](pass_through) |
| health_check_details | boolean | 若為 false，會隱藏健康檢查細節（例如剩餘 rate limit）。[health checks 文件](health) |
| public_routes | List[str] | （企業功能）公開路由的控制清單 |
| alert_types | List[str] | 要傳送到 slack 的警示類型控制清單（alert types 文件）[./alerting.md] |
| enforced_params | List[str] | （企業功能）所有傳送到 proxy 的請求中都必須包含的參數清單 |
| enable_oauth2_auth | boolean | （企業功能）若為 true，會在 LLM + info 路由上啟用 oauth2.0 驗證 |
| use_x_forwarded_for | str | 若為 true，會使用 `X-Forwarded-For` 標頭從 `X-Forwarded-Proto` / `X-Forwarded-Host` / `X-Forwarded-Port` 推導用戶端 IP 與（對於 MCP OAuth）proxy 的公開 origin。對於 MCP OAuth，只有在 `mcp_trusted_proxy_ranges` 也已設定且請求對等端的 IP 落在那些 CIDR 之一內時，才會採納標頭。對於經由 ingress 的部署，建議使用 [`PROXY_BASE_URL`](#environment-variables---reference)。請參閱 [MCP OAuth — Reverse proxy and ingress configuration](../mcp_oauth#reverse-proxy-and-ingress-configuration)。 |
| service_account_settings | List[Dict[str, Any]] | 如果您想建立只套用於 service account keys 的設定，請設定 `service_account_settings`（service accounts 文件）[./service_accounts.md] | 
| image_generation_model | str | 影像生成預設要使用的模型 - 會忽略請求中設定的模型 |
| store_model_in_db | boolean | 若為 true，會啟用將模型 + 憑證資訊儲存在 DB 中。 |
| supported_db_objects | List[str] | 在 `store_model_in_db` 為 True 時，精細控制要從資料庫載入哪些物件類型。可用類型：`"models"`、`"mcp"`、`"guardrails"`、`"vector_stores"`、`"pass_through_endpoints"`、`"prompts"`、`"model_cost_map"`。若未設定，則會載入所有物件類型（預設行為）。範例：`supported_db_objects: ["mcp"]`，只從 DB 載入 MCP servers。 |
| user_mcp_management_mode | string | 控制非管理員可在 MCP 儀表板上看到的內容。`restricted`（預設）只列出使用者所屬 team 明確被允許存取的 MCP servers。`view_all` 讓每位使用者都能看到完整的 MCP server 清單。工具清單／呼叫一律遵守每個 key 的權限，因此使用者仍然無法在沒有存取權的情況下執行 MCP 呼叫。 |
| store_prompts_in_spend_logs | boolean | 若為 true，允許將 prompts 與 responses 儲存在 spend logs 資料表中。 |
| scope_spend_list_endpoints_to_caller | boolean | 當 `true`（預設）時，`/spend/keys` 和 `/spend/users` 只會為非管理員 API keys 回傳呼叫者自己的列。設定為 `false` 可停用範圍限制。請參閱 [Spend list endpoints](./cost_tracking.md#spend-list-endpoints-spendkeys-and-spendusers)。 |
| legacy_unscoped_spend_list_endpoints | boolean | 當 `true` 時，會還原 `/spend/keys` 和 `/spend/users` 的範圍限制前行為（非管理員 keys 可列出所有列）。會覆寫 `scope_spend_list_endpoints_to_caller`。環境變數：`LITELLM_LEGACY_UNSCOPED_SPEND_LIST_ENDPOINTS`。 |
| max_request_size_mb | int | 請求的最大大小（MB）。超過此大小的請求會被拒絕。 |
| max_response_size_mb | int | 回應的最大大小（MB）。超過此大小的 LLM 回應不會被傳送。 |
| proxy_budget_rescheduler_min_time | int | 在檢查 db 是否有 budget 重設前，需等待的最短時間（秒）。**預設為 597 秒** |
| proxy_budget_rescheduler_max_time | int | 在檢查 db 是否有 budget 重設前，需等待的最長時間（秒）。**預設為 605 秒** |
| proxy_batch_write_at | int | 等待多久（秒）後，將 spend logs 批次寫入 db。**預設為 10 秒** |
| proxy_batch_polling_interval | int | 輪詢 batch 之前等待多久（秒），以檢查其是否完成。**預設為 6000 秒（1 小時）** |
| alerting_args | dict | Slack Alerting 的參數 [Slack Alerting 文件](./alerting.md) |
| custom_key_generate | str | 用於金鑰生成的自訂函式 [自訂金鑰生成文件](./virtual_keys.md#custom--key-generate) |
| allowed_ips | List[str] | 允許存取 proxy 的 IP 清單。若未設定，則允許所有 IP。 |
| embedding_model | str | embeddings 預設要使用的模型 - 會忽略請求中設定的模型 |
| default_team_disabled | boolean | 若為 true，使用者無法建立 'personal' keys（沒有 team_id 的 keys）。 |
| alert_to_webhook_url | Dict[str] | [為每種警示類型指定 webhook url。](./alerting.md#set-specific-slack-channels-per-alert-type) |
| key_management_settings | List[Dict[str, Any]] | 金鑰管理系統的設定（例如 AWS KMS、Azure Key Vault）[金鑰管理文件](../secret.md) |
| allow_user_auth | boolean | （已棄用）舊的使用者驗證方式。 |
| user_api_key_cache_ttl | int | 在記憶體中快取使用者 API keys 的時間（秒）。 |
| disable_prisma_schema_update | boolean | 若為 true，會關閉對 DB 的自動 schema 更新 |
| litellm_key_header_name | str | 若設定，允許將 LiteLLM keys 作為自訂標頭傳遞。[自訂標頭文件](./virtual_keys.md#custom-headers) |
| moderation_model | str | moderation 預設要使用的模型。 |
| custom_sso | str | 實作自訂 SSO 邏輯的 python 檔案路徑。[自訂 SSO 文件](./custom_sso.md) |
| allow_client_side_credentials | boolean | 若為 true，允許將 client side 憑證傳遞給 proxy。（在測試 finetuning models 時很有用）[client side credentials 文件](./virtual_keys.md#client-side-credentials) |
| admin_only_routes | List[str] | （企業功能）僅供管理員使用者存取的路由清單。[admin only routes 文件](./enterprise#control-available-public-private-routes) |
| use_azure_key_vault | boolean | 若為 true，則從 azure key vault 載入 keys | 
| use_google_kms | boolean | 若為 true，則從 google kms 載入 keys |
| spend_report_frequency | str | 指定您希望多久傳送一次 Spend Report（例如 "1d"、"2d"、"30d"）[更多說明](./alerting.md#spend-report-frequency) |
| ui_access_mode | Literal["admin_only"] | 若設定，會將 UI 的存取限制為僅管理員使用者。[文件](./ui.md#restrict-ui-access) |
| litellm_jwtauth | Dict[str, Any] | JWT 驗證設定。[文件](./token_auth.md) |
| litellm_license | str | proxy 的授權金鑰。[文件](../enterprise.md#how-does-deployment-with-enterprise-license-work) |
| oauth2_config_mappings | Dict[str, str] | 定義 OAuth2 設定對應 |
| pass_through_endpoints | List[Dict[str, Any]] | 定義 pass through 端點。[文件](./pass_through) |
| pass_through_request_timeout | float | pass-through 路由（自訂端點與原生提供者 passthrough）的上游請求逾時時間（秒）。預設：`600`。每個端點的 `timeout` 會覆寫此值。[文件](./pass_through#request-timeouts) |
| enable_oauth2_proxy_auth | boolean | （企業功能）若為 true，會啟用 oauth2.0 驗證 |
| forward_openai_org_id | boolean | 若為 true，會將 OpenAI Organization ID 轉送到後端 LLM 呼叫（若它是 OpenAI）。 |
| forward_client_headers_to_llm_api | boolean | 若為 true，會將 client 標頭（任何 `x-` 標頭與 `anthropic-beta` 標頭）轉送到後端 LLM 呼叫 |
| maximum_spend_logs_retention_period               | str                   | 用於設定 db 中 spend logs 的最長保留時間，超過後會自動清除                                                                                                                                                                                                                             |
| maximum_spend_logs_retention_interval             | str                   | 用於設定 spend log 清理工作應執行的間隔。                                                                                                                                                                                                                                                   |
| alert_type_config | dict | 將警示類型對應到其處理器設定的組態 |
| always_include_stream_usage | boolean | 若為 true，會在每個串流回應區塊中包含 usage 指標 |
| auto_redirect_ui_login_to_sso | boolean | 若為 true，會自動將 UI 登入頁面重新導向到 SSO 提供者 |
| control_plane_url | string | 用於跨實例狀態共享的控制平面 URL |
| custom_auth_run_common_checks | boolean | 若為 true，會在自訂驗證之外，同時執行 LiteLLM 的標準驗證檢查（key/team/user/project model allowlists、budgets、rate limits）。預設為 `false` — 請參閱 [Custom Auth — 強制模型存取](./custom_auth#enforce-model-access-budgets-and-teamproject-checks) |
| custom_ui_sso_sign_in_handler | string | UI 中 SSO 登入邏輯的自訂處理器 |
| database_connection_pool_timeout | integer | 資料庫連線池逾時時間（秒） |
| disable_error_logs | boolean | 若為 true，會抑制錯誤追蹤與儲存在資料庫中 |
| enable_health_check_routing | boolean | 若為 true，會啟用以健康檢查驅動的請求路由，以避開不健康的 deployment |
| health_check_ignore_transient_errors | boolean | 若為 true，429（rate limit）與 408（timeout）的健康檢查失敗會被忽略，且不會影響路由或冷卻 |
| enable_mcp_registry | boolean | 若為 true，會啟用對集中式 MCP server registry 的存取 |
| enforce_rbac | boolean | 若為 true，會為所有 proxy 操作啟用角色型存取控制（RBAC） |
| forward_llm_provider_auth_headers | boolean | 若為 true，會將提供者特定的驗證標頭轉送到 LLM API 呼叫 |
| health_check_concurrency | integer | 健康檢查作業的最大並行數 |
| health_check_skip_disabled_background_models | boolean | 若為 true，會略過在 on-demand `GET /health` 與相關健康執行中，對具有 `model_info.disable_background_health_check: true` 的 deployment 進行健康探測（不僅是背景迴圈）。[health checks 文件](health) |
| health_check_staleness_threshold | integer | 在將 deployment 標記為 stale 之前，健康檢查結果可存在的最大秒數 |
| maximum_spend_logs_cleanup_cron | string | 用於排程自動 spend log 清理工作的 Cron 表達式 |
| mcp_client_side_auth_header_name | string | 用於 client-side MCP server 憑證的 HTTP 標頭名稱 |
| mcp_internal_ip_ranges | list | 被視為內部的 CIDR 範圍，用於非公開 MCP server 存取控制 |
| mcp_required_fields | list | MCP server 提交所需欄位名稱清單 |
| mcp_trusted_proxy_ranges | list | 被信任可為 MCP 轉送 `X-Forwarded-*` 標頭的 proxy CIDR 範圍。為了讓 MCP OAuth `authorize` 端點從這些標頭推導其公開 origin，此設定為必須（除 `use_x_forwarded_for: true` 外）。若沒有此設定，標頭會被忽略，而 proxy 會回退到請求的字面 base URL。對於經由 ingress 的部署，建議使用 [`PROXY_BASE_URL`](#environment-variables---reference)。請參閱 [MCP OAuth — Reverse proxy and ingress configuration](../mcp_oauth#reverse-proxy-and-ingress-configuration)。 |
| require_end_user_mcp_access_defined | boolean | 若為 true，會要求 end users 已明確定義 MCP 存取權限 |
| role_permissions | list | 角色型權限設定清單 |
| search_tools | list | 用於啟用網頁搜尋功能的搜尋工具設定清單 |
| token_rate_limit_type | string | rate limit 計數方式："total"、"output" 或 "input" tokens |
| use_redis_transaction_buffer | boolean | 若為 true，會在寫入前將資料庫交易緩衝到 Redis |
| use_shared_health_check | boolean | 若為 true，會在多個 proxy 實例之間使用由 Redis 支援的共享健康檢查狀態 |
| user_header_mappings | dict | 使用查找規則將自訂請求標頭對應到使用者 ID |
| user_header_name | string | 用於從請求中擷取使用者身分的 HTTP 標頭名稱 |

### router_settings - 參考 {#router_settings---reference}

:::info

大多數值也可以透過 `litellm_settings` 設定。如果您看到重疊的值，`router_settings` 上的設定會覆寫 `litellm_settings` 上的設定。 :::

```yaml
router_settings:
  routing_strategy: simple-shuffle # Literal["simple-shuffle", "least-busy", "usage-based-routing","latency-based-routing"], default="simple-shuffle" - RECOMMENDED for best performance
  redis_host: <your-redis-host>           # string
  redis_password: <your-redis-password>   # string
  redis_port: <your-redis-port>           # string
  enable_pre_call_checks: true            # bool - Before call is made check if a call is within model context window
  allowed_fails: 3 # cooldown model if it fails > 1 call in a minute.
  cooldown_time: 30 # (in seconds) how long to cooldown model if fails/min > allowed_fails
  disable_cooldowns: True                  # bool - Disable cooldowns for all models
  enable_tag_filtering: True                # bool - Use tag based routing for requests
  tag_filtering_match_any: True             # bool - Tag matching behavior (only when enable_tag_filtering=true). `true`: match if deployment has ANY requested tag; `false`: match only if deployment has ALL requested tags
  retry_policy: {                          # Dict[str, int]: retry policy for different types of exceptions
    "AuthenticationErrorRetries": 3,
    "TimeoutErrorRetries": 3,
    "RateLimitErrorRetries": 3,
    "ContentPolicyViolationErrorRetries": 4,
    "InternalServerErrorRetries": 4
  }
  allowed_fails_policy: {
    "BadRequestErrorAllowedFails": 1000, # Allow 1000 BadRequestErrors before cooling down a deployment
    "AuthenticationErrorAllowedFails": 10, # int
    "TimeoutErrorAllowedFails": 12, # int
    "RateLimitErrorAllowedFails": 10000, # int
    "ContentPolicyViolationErrorAllowedFails": 15, # int
    "InternalServerErrorAllowedFails": 20, # int
  }
  content_policy_fallbacks=[{"claude-2": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for content policy violations
  fallbacks=[{"claude-2": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for all errors
```

| 名稱 | 類型 | 描述 |
|------|------|-------------|
| routing_strategy | string | 用於路由請求的策略。選項："simple-shuffle"、"least-busy"、"usage-based-routing"、"latency-based-routing"。預設為 "simple-shuffle"。 [更多資訊請見此處](../routing) |
| redis_host | string | Redis 伺服器的主機位址。**僅當您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項** |
| redis_password | string | Redis 伺服器的密碼。**僅當您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項** |
| redis_port | string | Redis 伺服器的連接埠號碼。**僅當您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項**|
| redis_db | int | Redis 伺服器的資料庫編號。**僅當您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項**|
| enable_pre_call_check | boolean | 若為 true，會在進行請求前檢查該呼叫是否位於模型的 context window 內。 [更多資訊請見此處](reliability) |
| content_policy_fallbacks | array of objects | 指定內容政策違規時的備援模型。 [更多資訊請見此處](reliability) |
| fallbacks | array of objects | 指定所有類型錯誤的備援模型。 [更多資訊請見此處](reliability) |
| enable_tag_filtering | boolean | 若為 true，會對請求使用基於標籤的路由 [依標籤路由](tag_routing) |
| enable_weighted_failover | boolean | 若為 true 且 `routing_strategy` 為 `simple-shuffle`，某個部署上的可重試失敗會先在同一模型群組的其他部署中重新選取（加權）之後，才會跨群組備援。預設值：false。 |
| tag_filtering_match_any | boolean | 標籤比對行為（僅在 enable_tag_filtering=true 時）。`true`：若部署具有任何一個要求的標籤即比對成功；`false`：僅當部署具有所有要求的標籤時才比對成功 |
| cooldown_time | integer | 若模型超過允許的失敗次數，則將其冷卻的時間長度（以秒為單位）。 |
| disable_cooldowns | boolean | 若為 true，會停用所有模型的冷卻。 [更多資訊請見此處](reliability) |
| retry_policy | object | 指定不同類型例外的重試次數。 [更多資訊請見此處](reliability) |
| allowed_fails | integer | 在將模型冷卻之前允許的失敗次數。 [更多資訊請見此處](reliability) |
| allowed_fails_policy | object | 指定在將部署冷卻之前，不同錯誤類型允許的失敗次數。 [更多資訊請見此處](reliability) |
| default_max_parallel_requests | Optional[int] | 部署的預設最大平行請求數。 |
| default_priority | (Optional[int]) | 請求的預設優先順序。僅適用於 '.scheduler_acompletion()'。預設為 None。 | 
| polling_interval | (Optional[float]) | 輪詢佇列的頻率。僅適用於 '.scheduler_acompletion()'。預設為 3ms。 |
| max_fallbacks | Optional[int] | 在結束呼叫前要嘗試的備援最大數量。預設為 5。 |
| default_litellm_params | Optional[dict] | 要新增到所有請求的預設 litellm 參數（例如 `temperature`、`max_tokens`）。 |
| timeout | Optional[float] | 請求的預設逾時。預設為 10 分鐘。 |
| stream_timeout | Optional[float] | 串流請求的預設逾時。若未設定，則使用 'timeout' 值。 |
| ttft_timeout | Optional[float] | 若在連線被接受後的這段秒數內沒有第一個 token 抵達，則拋出 `litellm.Timeout`，以偵測在傳送任何內容前卡住的提供者。設定後，非串流呼叫會在內部提升為串流，而呼叫端仍會收到標準回應。最好在每個部署上設定。預設為 None（關閉）。 |
| stream_idle_timeout | Optional[float] | 若連續 token 之間的間隔超過這段秒數，則拋出 `litellm.Timeout`，以偵測在串流中途停滯的提供者。請將其設得明顯高於模型每個 token 的 p99，讓它作為凍結偵測器，而非緩慢偵測器。最好在每個部署上設定。預設為 None（關閉）。 |
| debug_level | Literal["DEBUG", "INFO"] | 路由器中記錄函式庫的除錯層級。預設為 "INFO"。 |
| client_ttl | int | 快取用戶端的存活時間（秒）。預設為 3600。 |
| cache_kwargs | dict | 快取初始化的其他關鍵字引數。當透過 `REDIS_*` 環境變數設定時，這可用於可能失敗的非字串 Redis 參數。 |
| routing_strategy_args | dict | 路由策略的其他關鍵字引數 - 例如最低延遲路由的預設 ttl |
| model_group_alias | dict | 模型群組別名對應。例如 `{"claude-3-haiku": "claude-3-haiku-20240229"}` |
| num_retries | int | 請求的重試次數。預設為 3。 |
| default_fallbacks | Optional[List[str]] | 若未定義任何模型群組專屬備援，則要嘗試的備援。 |
| caching_groups | Optional[List[tuple]] | 用於跨模型群組快取的模型群組清單。預設為 None。- 例如 caching_groups=[("openai-gpt-3.5-turbo", "azure-gpt-3.5-turbo")]|
| alerting_config | AlertingConfig | [僅 SDK 參數] Slack 告警設定。預設為 None。 [進一步文件](../routing.md#alerting-) |
| assistants_config | AssistantsConfig | 透過 `assistant_settings` 在 proxy 上設定。 [進一步文件](../assistants.md) |
| set_verbose | boolean | [已棄用參數 - 請參見除錯文件](./debugging) 若為 true，會將記錄層級設為 verbose。 |
| retry_after | int | 在重新嘗試請求前要等待的秒數。預設為 0。若從 LLM API 收到 `x-retry-after`，此值會被覆寫。 |
| provider_budget_config | ProviderBudgetConfig | 提供者預算設定。用於設定 llm_provider 的預算限制。例如 OpenAI 每天 $100、Azure 每天 $100 等。預設為 None。 [進一步文件](./provider_budget_routing.md) |
| enable_pre_call_checks | boolean | 若為 true，會在進行請求前檢查該呼叫是否位於模型的 context window 內。**執行 `model_info.max_input_tokens` 強制執行所需**。預設：false。 [更多資訊請見此處](reliability) |
| model_group_retry_policy | Dict[str, RetryPolicy] | [僅 SDK 參數] 設定模型群組的重試政策。 |
| context_window_fallbacks | List[Dict[str, List[str]]] | context window 違規時的備援模型。 |
| redis_url | str | Redis 伺服器的 URL。**已知 Redis URL 有效能問題。** |
| cache_responses | boolean | 若在 `router_settings` 下設定了 cache，則啟用快取 LLM 回應的旗標。若為 true，會快取回應。預設為 False。 |
| router_general_settings | RouterGeneralSettings | [僅 SDK] 路由器一般設定 - 包含如 'async_only_mode' 之類的最佳化。 [文件](../routing.md#router-general-settings) |
| optional_pre_call_checks | List[str] | 要新增到路由器的預呼叫檢查清單。支援：`router_budget_limiting`、`prompt_caching`、`responses_api_deployment_check`、`encrypted_content_affinity`（需要 LiteLLM >= 1.82.3）、`deployment_affinity`、`session_affinity`、`forward_client_headers_by_model_group` |
| deployment_affinity_ttl_seconds | int | 當啟用 `deployment_affinity` 時，user-key → deployment affinity 對應的 TTL（秒）（於 Router 初始化／proxy 啟動時設定）。預設為 `3600`（1 小時）。 |
| model_group_affinity_config | Dict[str, List[str]] | 每個模型群組的 affinity 旗標。鍵為模型群組名稱；值為要啟用的檢查清單（`deployment_affinity`、`responses_api_deployment_check`、`session_affinity`）。未列出的群組會回退到全域 `optional_pre_call_checks`。 [文件](../response_api.md#per-model-group-affinity-configuration) |
| ignore_invalid_deployments | boolean | 若為 true，會忽略無效部署。proxy 的預設值為 True - 以避免無效模型阻擋其他模型載入。 |
| search_tools | List[SearchToolTypedDict] | 用於 Search API 整合的搜尋工具設定清單。每個工具會指定 search_tool_name 與 litellm_params，包含 search_provider、api_key、api_base 等。 [進一步文件](../search/index.md) |
| guardrail_list | List[GuardrailTypedDict] | 用於 guardrail 負載平衡的防護欄設定清單。可在多個具有相同 guardrail_name 的防護欄部署之間啟用負載平衡。 [進一步文件](./guardrails/guardrail_load_balancing.md) |
| enable_health_check_routing | boolean | 若為 true，會啟用以健康檢查驅動的部署篩選，以避免將請求路由到不健康的部署 |
| health_check_staleness_threshold | integer | 將部署標記為過期之前，快取健康檢查結果的最大秒數 |
| health_check_ignore_transient_errors | boolean | 若為 true，會忽略 429（速率限制）與 408（逾時）的健康檢查失敗，且不影響路由或冷卻 |
| routing_groups | Optional[List[RoutingGroup]] | 會將各自的路由策略套用到模型子集合的模型群組清單。每個群組都有 `group_name`、`models`（與請求的 model 相比對的模型名稱清單）、`routing_strategy`，以及可選的 `routing_strategy_args`。預設為 None。 |
| plugins | Optional[List[RoutingPlugin]] | [僅 SDK 參數] 在做出路由決策之前執行的路由外掛流水線。每個外掛都實作 `async def run(context: RoutingContext) -> RoutingContext`，讀取／縮減 `candidate_models`，並附加 `signals` 供下一個外掛（或最終路由決策）讀取。若外掛將候選縮減為零，將會直接拋出，而不是回退到未篩選的池。預設為 None。 |

### 環境變數 - 參考 {#environment-variables---reference}

| 名稱 | 說明 |
|------|-------------|
| ACTIONS_ID_TOKEN_REQUEST_TOKEN | 用於在 GitHub Actions 中請求 ID token 的 Token
| ACTIONS_ID_TOKEN_REQUEST_URL | 用於在 GitHub Actions 中請求 ID token 的 URL
| AGENTOPS_ENVIRONMENT | AgentOps 記錄整合的環境
| AGENTOPS_API_KEY | AgentOps 記錄整合的 API 金鑰
| AGENTOPS_SERVICE_NAME | AgentOps 記錄整合的服務名稱
| AISPEND_ACCOUNT_ID | AI Spend 的帳戶 ID
| AISPEND_API_KEY | AI Spend 的 API 金鑰
| AIOHTTP_CONNECTOR_LIMIT | aiohttp connector 的連線限制。設為 0 時，不套用限制。**預設為 0**
| AIOHTTP_CONNECTOR_LIMIT_PER_HOST | aiohttp connector 每個主機的連線限制。設為 0 時，不套用限制。**預設為 0**
| AIOHTTP_KEEPALIVE_TIMEOUT | aiohttp 連線的 keep-alive 逾時時間（秒）。**預設為 120**
| AIOHTTP_SO_KEEPALIVE | 在 aiohttp socket 上啟用 TCP `SO_KEEPALIVE`，以便偵測閒置的提供者連線，並在 NAT/負載平衡器悄然丟棄之前將其回收。**預設為 False**
| AIOHTTP_TCP_KEEPCNT | 在連線被視為已失效之前，未確認的 TCP keepalive 探測次數（適用於 `AIOHTTP_SO_KEEPALIVE=True` 時）。**預設為 5**
| AIOHTTP_TCP_KEEPIDLE | aiohttp TCP 連線在送出 keepalive 探測前必須處於閒置的秒數（適用於 `AIOHTTP_SO_KEEPALIVE=True` 時）。**預設為 60**
| AIOHTTP_TCP_KEEPINTVL | aiohttp TCP keepalive 探測之間的秒數（適用於 `AIOHTTP_SO_KEEPALIVE=True` 時）。**預設為 30**
| AIOHTTP_TRUST_ENV | 啟用 aiohttp trust environment 的旗標。設為 True 時，aiohttp 會尊重 HTTP(S)_PROXY 環境變數。**預設為 False**
| AIOHTTP_TTL_DNS_CACHE | aiohttp 的 DNS 快取存活時間（秒）。**預設為 300**
| AKTO_GUARDRAIL_API_BASE | Akto Guardrail API 的基礎 URL（例如 `http://localhost:9090`）。由 Akto guardrail 整合使用。
| AKTO_API_KEY | 用於向 Akto Guardrail 服務驗證的 API 金鑰。
| ALLOWED_EMAIL_DOMAINS | 允許存取的電子郵件網域清單
| APSCHEDULER_COALESCE | 是否將工作中多個待處理的執行合併為一個。**預設為 False**
| APSCHEDULER_MAX_INSTANCES | 每個工作的最大並行執行個數。**預設為 1**
| APSCHEDULER_MISFIRE_GRACE_TIME | 排程錯過執行的寬限時間（秒）。**預設為 1**
| APSCHEDULER_REPLACE_EXISTING | 是否以相同 ID 的新工作取代既有工作。**預設為 False**
| ARIZE_API_KEY | Arize 平台整合的 API 金鑰
| ARIZE_SPACE_KEY | Arize 平台的 Space key
| ARGILLA_BATCH_SIZE | Argilla 記錄的批次大小
| ARGILLA_API_KEY | Argilla 平台的 API 金鑰
| ARGILLA_SAMPLING_RATE | Argilla 記錄的取樣率
| ARGILLA_DATASET_NAME | Argilla 記錄的資料集名稱
| ARGILLA_BASE_URL | Argilla 服務的基礎 URL
| ATHINA_API_KEY | Athina 服務的 API 金鑰
| ATHINA_BASE_URL | Athina 服務的基礎 URL（預設為 `https://log.athina.ai`）
| AUTH_STRATEGY | 用於驗證的策略（例如：OAuth、API key）
| AUTO_REDIRECT_UI_LOGIN_TO_SSO | 啟用在已設定 SSO 時，自動將 UI 登入頁面重新導向到 SSO 的旗標。預設為 **false**
| AUDIO_SPEECH_CHUNK_SIZE | 音訊語音處理的區塊大小。預設為 1024
| ANTHROPIC_API_KEY | Anthropic 服務的 API 金鑰。使用 `x-api-key` 標頭進行驗證。
| ANTHROPIC_AUTH_TOKEN | Anthropic 服務的替代驗證 Token。使用 `Authorization: Bearer` 標頭，取代 `x-api-key`。當未設定 `ANTHROPIC_API_KEY` 時作為備援。
| ANTHROPIC_API_BASE | Anthropic API 的基礎 URL。預設為 https://api.anthropic.com
| ANTHROPIC_BASE_URL | 用於設定 Anthropic API 基礎 URL 的 `ANTHROPIC_API_BASE` 替代方案。當未設定 `ANTHROPIC_API_BASE` 時作為備援。
| ANTHROPIC_TOKEN_COUNTING_BETA_VERSION | Anthropic token 計數 API 的 beta 版本標頭。預設為 `token-counting-2024-11-01`
| AWS_ACCESS_KEY_ID | AWS 服務的 Access Key ID
| AWS_BATCH_ROLE_ARN | 用於批次作業的 AWS IAM role ARN
| AWS_DEFAULT_REGION | 當未設定 AWS_REGION 時，用於服務互動的預設 AWS 區域
| AWS_PROFILE_NAME | 要使用的 AWS CLI 設定檔名稱
| AWS_REGION | 用於服務互動的 AWS 區域（優先於 AWS_DEFAULT_REGION）
| AWS_REGION_NAME | 用於服務互動的預設 AWS 區域
| AWS_ROLE_ARN | 要假設以進行驗證的 AWS IAM role ARN
| AWS_ROLE_NAME | AWS IAM 使用的 role 名稱
| AWS_S3_BUCKET_NAME | 用於檔案操作的 AWS S3 bucket 名稱
| AWS_S3_OUTPUT_BUCKET_NAME | 用於批次作業的 AWS S3 輸出 bucket 名稱
| AWS_SECRET_ACCESS_KEY | AWS 服務的 Secret Access Key
| AWS_SESSION_NAME | AWS session 名稱
| AWS_WEB_IDENTITY_TOKEN | AWS 的 web identity token
| AWS_WEB_IDENTITY_TOKEN_FILE | 包含 AWS web identity token 的檔案路徑
| AZURE_API_VERSION | 所使用的 Azure API 版本
| AZURE_AI_API_BASE | Azure AI 服務的基礎 URL（例如：Azure AI Anthropic）
| AZURE_AI_API_KEY | Azure AI 服務的 API 金鑰（例如：Azure AI Anthropic）
| AZURE_AUTHORITY_HOST | Azure authority host URL
| AZURE_CERTIFICATE_PASSWORD | Azure OpenAI 憑證密碼
| AZURE_CLIENT_ID | Azure 服務的 Client ID
| AZURE_CLIENT_SECRET | Azure 服務的 Client secret
| AZURE_COMPUTER_USE_INPUT_COST_PER_1K_TOKENS | Azure Computer Use 服務每 1K token 的輸入成本
| AZURE_COMPUTER_USE_OUTPUT_COST_PER_1K_TOKENS | Azure Computer Use 服務每 1K token 的輸出成本
| AZURE_DEFAULT_RESPONSES_API_VERSION | 所使用的 Azure Default Responses API 版本。預設為 "preview"
| AZURE_DOCUMENT_INTELLIGENCE_API_VERSION | Azure Document Intelligence 服務的 API 版本
| AZURE_DOCUMENT_INTELLIGENCE_DEFAULT_DPI | Azure Document Intelligence 服務的預設 DPI（每英吋點數）設定
| AZURE_TENANT_ID | Azure Active Directory 的 Tenant ID
| AZURE_USERNAME | Azure 服務的使用者名稱，與 AZURE_PASSWORD 一起使用，以便在 azure ad token 的基本使用者名稱/密碼流程中使用
| AZURE_PASSWORD | Azure 服務的密碼，與 AZURE_USERNAME 一起使用，以便在 azure ad token 的基本使用者名稱/密碼流程中使用
| AZURE_FEDERATED_TOKEN_FILE | Azure federated token 檔案路徑
| AZURE_FILE_SEARCH_COST_PER_GB_PER_DAY | Azure File Search 服務每 GB 每日成本
| AZURE_SCOPE | 對於 EntraID Auth，Azure 服務的 Scope，預設為 "https://cognitiveservices.azure.com/.default"
| AZURE_SENTINEL_DCR_IMMUTABLE_ID | Azure Sentinel 記錄用資料收集規則的不可變 ID
| AZURE_SENTINEL_STREAM_NAME | Azure Sentinel 記錄的串流名稱
| AZURE_SENTINEL_AUDIT_STREAM_NAME | Azure Sentinel 稽核記錄的串流名稱；未設定時回退至 AZURE_SENTINEL_STREAM_NAME
| AZURE_SENTINEL_CLIENT_SECRET | Azure Sentinel 驗證的 Client secret
| AZURE_SENTINEL_ENDPOINT | Azure Sentinel 記錄的端點
| AZURE_SENTINEL_TENANT_ID | Azure Sentinel 驗證的 Tenant ID
| AZURE_SENTINEL_CLIENT_ID | Azure Sentinel 驗證的 Client ID
| AZURE_KEY_VAULT_URI | Azure Key Vault 的 URI
| AZURE_OPERATION_POLLING_TIMEOUT | Azure 操作輪詢的逾時時間（秒）
| AZURE_STORAGE_ACCOUNT_KEY | 用於驗證 Azure Blob Storage 記錄的 Azure Storage Account Key
| AZURE_STORAGE_ACCOUNT_NAME | 用於記錄到 Azure Blob Storage 的 Azure Storage Account 名稱
| AZURE_STORAGE_FILE_SYSTEM | 用於記錄到 Azure Blob Storage 的 Azure Storage File System 名稱。（通常是 Container 名稱）
| AZURE_STORAGE_TENANT_ID | 用於驗證 Azure Blob Storage 記錄的 Application Tenant ID
| AZURE_STORAGE_CLIENT_ID | 用於驗證 Azure Blob Storage 記錄的 Application Client ID
| AZURE_STORAGE_CLIENT_SECRET | 用於驗證 Azure Blob Storage 記錄的 Application Client Secret
| AZURE_VECTOR_STORE_COST_PER_GB_PER_DAY | Azure Vector Store 服務每 GB 每日成本
| BACKGROUND_HEALTH_CHECK_MAX_TOKENS | 當模型沒有 `health_check_max_tokens` 時，代理程式背景健康檢查中 `max_tokens` 的可選全域預設值。若未設定，非萬用字元模型預設為 5。設定時也適用於萬用字元路由。預設為未設定
| BACKGROUND_HEALTH_CHECK_MAX_TOKENS_REASONING | 對於**非萬用字元**推理模型（`supports_reasoning(model)=true`），設定時此項優先於 `BACKGROUND_HEALTH_CHECK_MAX_TOKENS`。若未設定，推理模型會回退至 `BACKGROUND_HEALTH_CHECK_MAX_TOKENS`（若已設定）或預設行為。萬用字元路由會忽略此項。預設為未設定
| BATCH_STATUS_POLL_INTERVAL_SECONDS | 輪詢批次狀態的間隔秒數。預設為 3600（1 小時）
| BATCH_STATUS_POLL_MAX_ATTEMPTS | 輪詢批次狀態的最大嘗試次數。預設為 24（24 小時）
| BEDROCK_MAX_POLICY_SIZE | Bedrock policy 的最大大小。預設為 75
| BEDROCK_MIN_THINKING_BUDGET_TOKENS | Bedrock 推理模型的最小 thinking budget token 數。若 budget_tokens 低於此值，Bedrock 會回傳 400 錯誤。較低的請求值會被限制為此最小值。預設為 1024
| BERRISPEND_ACCOUNT_ID | BerriSpend 服務的帳戶 ID
| BRAINTRUST_API_KEY | Braintrust 整合的 API 金鑰
| BRAINTRUST_API_BASE | Braintrust API 的基礎 URL。預設為 https://api.braintrustdata.com/v1
| BRAINTRUST_MOCK | 啟用 Braintrust 整合測試的 mock 模式。設為 true 時，會攔截 Braintrust API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| BRAINTRUST_MOCK_LATENCY_MS | 啟用 mock 模式時，Braintrust API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| CACHED_STREAMING_CHUNK_DELAY | 快取串流區塊的延遲（秒）。預設為 0.02
| CHATGPT_API_BASE | ChatGPT API 的基礎 URL。預設為 https://chatgpt.com/backend-api/codex
| CHATGPT_AUTH_FILE | ChatGPT 驗證資料的檔名。預設為 "auth.json"
| CHATGPT_DEFAULT_INSTRUCTIONS | ChatGPT 提供者的預設系統指示
| CHATGPT_ORIGINATOR | ChatGPT API 請求的 originator 識別碼。預設為 "codex_cli_rs"
| CHATGPT_TOKEN_DIR | 用於儲存 ChatGPT 驗證 token 的目錄。預設為 "~/.config/litellm/chatgpt"
| CHATGPT_USER_AGENT | ChatGPT API 請求的自訂 user agent 字串
| CHATGPT_USER_AGENT_SUFFIX | 要附加到 ChatGPT user agent 字串的後綴
| CIRCLE_OIDC_TOKEN | CircleCI 的 OpenID Connect token
| CIRCLE_OIDC_TOKEN_V2 | CircleCI 的 OpenID Connect token 版本 2
| CLI_JWT_EXPIRATION_HOURS | CLI 產生的 JWT token 到期時間（小時）。預設為 24 小時。也可透過 LITELLM_CLI_JWT_EXPIRATION_HOURS 設定
| CLI_SSO_CLAIM_MAP | 以逗號分隔的允許清單，將 OIDC claim 路徑對應到 LiteLLM 使用者 `metadata` 鍵，用於 CLI SSO（例如 `employment_type->acme_employment_type,org_info.department->department`）。純量值也會以 `/sso/cli/poll` 回傳為 `attribution_metadata`。別名：`LITELLM_CLI_SSO_CLAIM_MAP`
| CLOUDZERO_API_KEY | 用於驗證的 CloudZero API 金鑰
| CLOUDZERO_CONNECTION_ID | 用於資料提交的 CloudZero connection ID
| CLOUDZERO_EXPORT_INTERVAL_MINUTES | CloudZero 資料匯出作業的間隔分鐘數
| CLOUDZERO_MAX_FETCHED_DATA_RECORDS | 要從 CloudZero 取得的最大資料筆數
| CLOUDZERO_TIMEZONE | 日期處理所用的時區（預設：UTC）
| CONFIG_FILE_PATH | 設定檔的檔案路徑
| CYBERARK_ACCOUNT | 用於祕密管理的 CyberArk 帳戶名稱
| CYBERARK_API_BASE | CyberArk API 的基礎 URL
| CYBERARK_API_KEY | CyberArk secret management service 的 API 金鑰
| CYBERARK_CLIENT_CERT | CyberArk 驗證用用戶端憑證路徑
| CYBERARK_CLIENT_KEY | CyberArk 驗證用用戶端金鑰路徑
| CYBERARK_USERNAME | CyberArk 驗證的使用者名稱
| CYBERARK_SSL_VERIFY | 啟用或停用 CyberArk SSL 憑證驗證的旗標。預設為 True
| CONFIDENT_API_KEY | DeepEval 整合的 API 金鑰
| CUSTOM_TIKTOKEN_CACHE_DIR | Tiktoken 快取的自訂目錄
| CONFIDENT_API_KEY | Confident AI（Deepeval）記錄服務的 API 金鑰
| COHERE_API_BASE | Cohere API 的基礎 URL。預設為 https://api.cohere.com
| COMPETITOR_LLM_TEMPERATURE | 用於競品探索的 LLM 溫度設定。預設為 0.3
| CURSOR_API_BASE | Cursor AI 提供者整合的 API 基礎 URL。預設為 https://api.cursor.com
| DATABASE_HOST | 資料庫伺服器的主機名稱
| DATABASE_HOST_READ_REPLICA | 讀取複本資料庫伺服器的主機名稱。僅由元件化部署（實驗性）在 `IAM_TOKEN_DB_AUTH=True` 時使用，以便從 RDS IAM 環境變數組裝 `DATABASE_URL_READ_REPLICA`
| DATABASE_NAME | 資料庫名稱
| DATABASE_NAME_READ_REPLICA | 讀取複本的資料庫名稱（預設為 `DATABASE_NAME`）。僅由元件化部署（實驗性）在 `IAM_TOKEN_DB_AUTH=True` 時使用
| DATABASE_PASSWORD | 資料庫使用者密碼
| DATABASE_PORT | 資料庫連線的連接埠號
| DATABASE_PORT_READ_REPLICA | 讀取複本的連接埠號（預設 5432）。僅由元件化部署（實驗性）在 `IAM_TOKEN_DB_AUTH=True` 時使用
| DATABASE_SCHEMA | 資料庫中使用的 schema 名稱
| DATABASE_SCHEMA_READ_REPLICA | 讀取複本的 schema 名稱（預設為 `DATABASE_SCHEMA`）。僅由元件化部署（實驗性）在 `IAM_TOKEN_DB_AUTH=True` 時使用
| DATABASE_URL | 資料庫的連線 URL
| DATABASE_URL_READ_REPLICA | 選用的讀取複本連線 URL。設定後，代理程式會將唯讀查詢（find_*、count、group_by、query_raw/_first）路由至此端點，而寫入仍使用 `DATABASE_URL`。對於具有分離讀寫端點的 Aurora 類叢集很有用。若未設定，則回退為僅寫入行為。搭配 `IAM_TOKEN_DB_AUTH=True` 時，讀取端 IAM token 會與寫入端一起自動重新整理
| DATABASE_USER | 資料庫連線的使用者名稱
| DATABASE_USER_READ_REPLICA | 讀取複本的資料庫使用者（預設為 `DATABASE_USER`）。僅由元件化部署（實驗性）在 `IAM_TOKEN_DB_AUTH=True` 時使用
| DATABASE_USERNAME | 資料庫使用者的別名
| DATABRICKS_API_BASE | Databricks API 的基礎 URL
| DATABRICKS_API_KEY | 用於 Databricks API 驗證的 API 金鑰（Personal Access Token）
| DATABRICKS_CLIENT_ID | Databricks OAuth M2M 驗證的 Client ID（Service Principal application ID）
| DATABRICKS_CLIENT_SECRET | Databricks OAuth M2M 驗證的 Client secret
| DATABRICKS_USER_AGENT | Databricks API 請求的自訂 user agent 字串。用於合作夥伴遙測歸因
| DAYS_IN_A_MONTH | 用於計算的每月天數。預設為 28
| DAYS_IN_A_WEEK | 用於計算的每週天數。預設為 7
| DAYS_IN_A_YEAR | 用於計算的每年天數。預設為 365
| DRAIN_ENDPOINT_TOKEN | 呼叫 `/health/drain` 端點時，`X-Drain-Token` 標頭所需的共享密鑰。當設定（於此處或透過 `general_settings.drain_endpoint_token`）時，未帶匹配 Token 的 drain 呼叫會被 401 拒絕；未設定時，該端點維持僅接受 opt-in 的行為。請讓 kubelet 從 preStop `httpGet.httpHeaders` 傳送它。 |
| DYNAMOAI_API_KEY | DynamoAI Guardrails 服務的 API 金鑰
| DYNAMOAI_API_BASE | DynamoAI API 的基礎 URL。預設為 https://api.dynamo.ai
| DYNAMOAI_MODEL_ID | 用於 DynamoAI 追蹤/記錄目的的模型 ID
| DYNAMOAI_POLICY_IDS | 要套用的 DynamoAI policy ID，以逗號分隔清單表示
| DD_BASE_URL | Datadog 整合的基礎 URL
| DATADOG_BASE_URL | （DD_BASE_URL 的替代方案）Datadog 整合的基礎 URL
| _DATADOG_BASE_URL | （DD_BASE_URL 的替代方案）Datadog 整合的基礎 URL
| DD_AGENT_HOST | DataDog agent 的主機名稱或 IP（例如："localhost"）。設定後，記錄會傳送至 agent，而非直接 API
| DD_AGENT_PORT | DataDog agent 的記錄接收連接埠。預設為 10518
| DD_API_KEY | Datadog 整合的 API 金鑰
| DD_APP_KEY | Datadog Cost Management 整合的 Application key。與 DD_API_KEY 一起用於成本指標
| DD_BATCH_SIZE | 在 flush 到 Datadog 之前緩衝的記錄事件數量。限制於 [1, 1000]；預設為 1000。若批次超過 Datadog 的 5MB 請求上限，請降低此值（例如 50）
| DD_SITE | Datadog 的站點 URL（例如：datadoghq.com）
| DD_SOURCE | Datadog 記錄的來源識別碼
| DD_TRACER_STREAMING_CHUNK_YIELD_RESOURCE | 用於 Datadog 追蹤串流 chunk yield 的資源名稱。預設為 "streaming.chunk.yield"
| DD_ENV | Datadog 記錄的環境識別碼。僅支援 `datadog_llm_observability` callback
| DD_LLMOBS_ML_APP | Datadog LLM Observability 的預設 ml_app 名稱（Application 欄位）。會回退至 DD_SERVICE。可透過 `metadata.ml_app` 逐請求覆寫。
| DD_SERVICE | Datadog 記錄的服務識別碼。預設為 "litellm-server"
| DD_VERSION | Datadog 記錄的版本識別碼。預設為 "unknown"
| DATADOG_MOCK | 啟用 Datadog 整合測試的 mock 模式。設為 true 時，會攔截 Datadog API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| DATADOG_MOCK_LATENCY_MS | 啟用 mock 模式時，Datadog API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| DEBUG_OTEL | 啟用 OpenTelemetry 的除錯模式
| DEFAULT_ALLOWED_FAILS | 模型在進入冷卻前允許的最大失敗次數。預設為 3
| DEFAULT_A2A_AGENT_TIMEOUT | A2A（Agent-to-Agent）協定請求的預設逾時時間（秒）。預設為 6000
| DEFAULT_ACCESS_GROUP_CACHE_TTL | 快取存取群組資訊的存活時間（秒）。預設為 600（10 分鐘）
| DEFAULT_ANTHROPIC_CHAT_MAX_TOKENS | Anthropic chat completions 的預設最大 token 數。預設為 4096
| DEFAULT_BATCH_SIZE | 作業的預設批次大小。預設為 512
| DEFAULT_CHUNK_OVERLAP | RAG 文字切分器的預設重疊區塊數。預設為 200
| DEFAULT_CHUNK_SIZE | RAG 文字切分器的預設區塊大小。預設為 1000
| DEFAULT_CLIENT_DISCONNECT_CHECK_TIMEOUT_SECONDS | 檢查用戶端斷線的逾時時間（秒）。預設為 1
| DEFAULT_COOLDOWN_TIME_SECONDS | 失敗後使模型進入冷卻的持續時間（秒）。預設為 5
| DEFAULT_CRON_JOB_LOCK_TTL_SECONDS | cron 工作鎖的存活時間（秒）。預設為 60（1 分鐘）
| DEFAULT_DATAFORSEO_LOCATION_CODE | DataForSEO 搜尋 API 的預設地點代碼。預設為 2250（法國）
| DEFAULT_FAILURE_THRESHOLD_PERCENT | 使部署進入冷卻的失敗閾值百分比。預設為 0.5（50%）
| DEFAULT_FAILURE_THRESHOLD_MINIMUM_REQUESTS | 套用錯誤率冷卻前的最小請求數。可避免第一次失敗就觸發冷卻。預設為 5
| DEFAULT_FLUSH_INTERVAL_SECONDS | flush 作業的預設間隔秒數。預設為 5
| DEFAULT_HEALTH_CHECK_INTERVAL | 健康檢查的預設間隔秒數。預設為 300（5 分鐘）
| DEFAULT_HEALTH_CHECK_PROMPT | 用於非圖片模型健康檢查的預設提示詞。預設為 "test from litellm"
| DEFAULT_IMAGE_HEIGHT | 圖片的預設高度。預設為 300
| DEFAULT_IMAGE_TOKEN_COUNT | 圖片的預設 token 數。預設為 250
| DEFAULT_IMAGE_WIDTH | 圖片的預設寬度。預設為 300
| DEFAULT_IN_MEMORY_TTL | 記憶體快取的預設存活時間（秒）。預設為 5
| DEFAULT_MANAGEMENT_OBJECT_IN_MEMORY_CACHE_TTL | 記憶體快取中管理物件（User、Team、Key、Organization）的預設存活時間（秒）。預設為 60 秒。
| DEFAULT_MAX_LRU_CACHE_SIZE | LRU 快取的預設最大大小。預設為 64
| DEFAULT_MAX_RECURSE_DEPTH | 預設最大遞迴深度。預設為 100
| DEFAULT_MAX_RECURSE_DEPTH_SENSITIVE_DATA_MASKER | 敏感資料遮罩器的預設最大遞迴深度。預設為 10
| DEFAULT_MAX_RETRIES | 預設最大重試次數。預設為 2
| DEFAULT_MAX_TOKENS | LLM 請求的預設最大 token 數。預設為 4096
| DEFAULT_MAX_TOKENS_FOR_TRITON | Triton 模型的預設最大 token 數。預設為 2000
| DEFAULT_MAX_REDIS_BATCH_CACHE_SIZE | redis 批次快取的預設最大大小。預設為 1000
| DEFAULT_MCP_SEMANTIC_FILTER_EMBEDDING_MODEL | MCP 語意工具篩選的預設 embedding model。預設為 "text-embedding-3-small"
| DEFAULT_MCP_SEMANTIC_FILTER_SIMILARITY_THRESHOLD | MCP 語意工具篩選的預設相似度閾值。預設為 0.3
| DEFAULT_MCP_SEMANTIC_FILTER_TOP_K | MCP 語意工具篩選要回傳的預設前 K 筆結果數量。預設為 10
| MCP_NPM_CACHE_DIR | STDIO MCP servers 使用的 npm 快取目錄。在容器中，預設值（~/.npm）可能不存在或為唯讀。預設為 `/tmp/.npm_mcp_cache`
| LITELLM_MCP_CLIENT_TIMEOUT | MCP 用戶端連線逾時時間（秒）（stdio 與 HTTP/SSE 傳輸）。預設為 60
| LITELLM_MCP_TOOL_LISTING_TIMEOUT | 從 MCP server 列出工具的逾時時間（秒）。預設為 30
| LITELLM_MCP_METADATA_TIMEOUT | 取得 OAuth metadata 的 HTTP 用戶端逾時時間（秒）。預設為 10
| LITELLM_MCP_HEALTH_CHECK_TIMEOUT | MCP servers 的健康檢查逾時時間（秒）。預設為 10
| LITELLM_MCP_STDIO_EXTRA_COMMANDS | 以逗號分隔的額外命令 basename 允許清單，供 MCP stdio 傳輸在內建允許清單之外使用。範例：`my-mcp-bin`。預設為空
| MCP_OAUTH2_TOKEN_CACHE_DEFAULT_TTL | MCP OAuth2 token 快取的預設 TTL（秒）。預設為 3600
| MCP_OAUTH2_TOKEN_CACHE_MAX_SIZE | MCP OAuth2 token 快取中的最大項目數。預設為 200
| MCP_OAUTH2_TOKEN_CACHE_MIN_TTL | MCP OAuth2 token 快取的最小 TTL（秒）。預設為 10
| MCP_OAUTH2_TOKEN_EXPIRY_BUFFER_SECONDS | 計算快取 TTL 時，從 token 到期時間中扣除的秒數。預設為 60
| MCP_PER_USER_TOKEN_DEFAULT_TTL | 儲存在 Redis 中、每位使用者的 MCP OAuth token 預設 TTL（秒）。預設為 43200（12 小時）
| MCP_PER_USER_TOKEN_EXPIRY_BUFFER_SECONDS | 計算 Redis TTL 時，從每位使用者的 MCP OAuth token 到期時間中扣除的秒數。預設為 60
| MCP_TOKEN_EXCHANGE_CACHE_MAX_SIZE | MCP OAuth2 token exchange 快取中的最大項目數。預設為 500
| MCP_TRUSTED_REDIRECT_ORIGINS | 以逗號分隔的額外 `redirect_uri` origin 允許清單，供 MCP OAuth `authorize` 端點接受，超出同源與 loopback 之外。每個項目必須是 `host` 或 `host:port`；`*.suffix` 前綴可匹配任何嚴格更深一層的子網域。僅限 HTTPS。當第一方 OAuth 用戶端位於姊妹網域時（例如 `app.example.com`）請使用此設定。對於經過 ingress 的部署，若 proxy 自身的 origin 不正確，請改設定 [`PROXY_BASE_URL`](#environment-variables---reference)。請參閱 [MCP OAuth — Reverse proxy and ingress configuration](../mcp_oauth#reverse-proxy-and-ingress-configuration)。
| DEFAULT_MOCK_RESPONSE_COMPLETION_TOKEN_COUNT | mock 回應 completions 的預設 token 數。預設為 20
| DEFAULT_MOCK_RESPONSE_PROMPT_TOKEN_COUNT | mock 回應 prompts 的預設 token 數。預設為 10
| DEFAULT_MODEL_CREATED_AT_TIME | 模型的預設建立時間戳。預設為 1677610602
| DEFAULT_NUM_WORKERS_LITELLM_PROXY | 當未設定 `NUM_WORKERS` 時，LiteLLM proxy 的預設 worker 數。預設為 1。**我們強烈建議將 NUM_WORKERS 設為可用 vCPU 數量**（例如 `NUM_WORKERS=8` 或 `--num_workers 8`）。
| DEFAULT_PROMPT_INJECTION_SIMILARITY_THRESHOLD | 提示詞注入相似度的預設閾值。預設為 0.7
| DEFAULT_POLLING_INTERVAL | 排程器的預設輪詢間隔（秒）。預設為 0.03
| DEFAULT_REASONING_EFFORT_DISABLE_THINKING_BUDGET | 預設 reasoning effort 停用 thinking budget。預設為 0
| DEFAULT_REASONING_EFFORT_HIGH_THINKING_BUDGET | 預設 high reasoning effort thinking budget。預設為 4096
| DEFAULT_REASONING_EFFORT_LOW_THINKING_BUDGET | 預設 low reasoning effort thinking budget。預設為 1024
| DEFAULT_REASONING_EFFORT_MAX_THINKING_BUDGET | 舊版 Anthropic 模型所使用、採用 `thinking.budget_tokens` 的預設 `max` reasoning effort thinking budget（Claude 4.5 系列 + Haiku）。在 Claude 4.6/4.7 上，`max` 階層會改為透過自適應 `output_config.effort=max` 路由，並忽略此常數。預設為 16384
| DEFAULT_REASONING_EFFORT_MEDIUM_THINKING_BUDGET | 預設 medium reasoning effort thinking budget。預設為 2048
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET | 預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET_GEMINI_2_5_FLASH | Gemini 2.5 Flash 的預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET_GEMINI_2_5_FLASH_LITE | Gemini 2.5 Flash Lite 的預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET_GEMINI_2_5_PRO | Gemini 2.5 Pro 的預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_XHIGH_THINKING_BUDGET | 舊版 Anthropic 模型所使用、採用 `thinking.budget_tokens` 的預設 `xhigh` reasoning effort thinking budget。延續 low/medium/high 的 2&times; 演進 1024 &rarr; 2048 &rarr; 4096 &rarr; 8192。在 Claude 4.6/4.7 上，`xhigh` 階層會改為透過自適應 `output_config.effort=xhigh` 路由，並忽略此常數。預設為 8192
| DEFAULT_REDIS_MAJOR_VERSION | 當無法判定版本時，預設要假設的 Redis 主版本。預設為 7
| DEFAULT_REDIS_SYNC_INTERVAL | 預設 Redis 同步間隔（秒）。預設為 1
| DEFAULT_SEMANTIC_GUARD_EMBEDDING_MODEL | Semantic Guard（路由匹配 guardrail）的預設 embedding model。預設為 "text-embedding-3-small"
| DEFAULT_SEMANTIC_GUARD_SIMILARITY_THRESHOLD | Semantic Guard 路由匹配的預設相似度閾值。預設為 0.75
| DEFAULT_REPLICATE_GPU_PRICE_PER_SECOND | Replicate GPU 每秒的預設價格。預設為 0.001400
| DEFAULT_REPLICATE_POLLING_DELAY_SECONDS | Replicate 輪詢的預設延遲（秒）。預設為 1
| DEFAULT_REPLICATE_POLLING_RETRIES | Replicate 輪詢的預設重試次數。預設為 5
| DEFAULT_SQS_BATCH_SIZE | SQS 記錄的預設批次大小。預設為 512
| DEFAULT_SQS_FLUSH_INTERVAL_SECONDS | SQS 記錄的預設 flush 間隔。預設為 10
| DEFAULT_S3_BATCH_SIZE | S3 記錄的預設批次大小。預設為 512
| DEFAULT_S3_FLUSH_INTERVAL_SECONDS | S3 記錄的預設 flush 間隔。預設為 10
| DEFAULT_SLACK_ALERTING_THRESHOLD | Slack 警示的預設閾值。預設為 300
| DEFAULT_SOFT_BUDGET | LiteLLM proxy keys 的預設 soft budget。預設為 50.0
| DEFAULT_TRIM_RATIO | 從提示詞結尾裁剪的 token 比例預設值。預設為 0.75
| DEFAULT_GOOGLE_VIDEO_DURATION_SECONDS | google 中影片生成的預設持續時間（秒）。預設為 8
| DIRECT_URL | 服務端點的直接 URL
| DISABLE_ADMIN_UI | 停用管理 UI 的切換
| LITELLM_HIDE_DEFAULT_CREDENTIALS_HINT | 用於隱藏管理 UI 登入頁面上「Default Credentials」資訊卡的旗標（`/ui/login` 與 `/fallback/login`）。當 UI 憑證透過 `UI_USERNAME` / `UI_PASSWORD` 或 SSO 管理，且關於 `admin` + `MASTER_KEY` 的硬編碼提示變得誤導或被安全掃描器標記時很有用。**預設為 false**
| LITELLM_ENABLE_HSTS | 在 proxy 與 UI 回應上送出 `Strict-Transport-Security` response header 的旗標。僅在透過 HTTPS 提供的部署中生效。**預設為 false**
| DISABLE_AIOHTTP_TRANSPORT | 停用 aiohttp 傳輸的旗標。設為 True 時，litellm 會使用 httpx 而非 aiohttp。**預設為 False**
| DISABLE_AIOHTTP_TRUST_ENV | 停用 aiohttp trust environment 的旗標。設為 True 時，litellm 不會信任 aiohttp 的環境，例如在設為 True 時，不會使用 `HTTP_PROXY` 與 `HTTPS_PROXY` 環境變數。**預設為 False**
| DISABLE_SCHEMA_UPDATE | 停用 schema 更新的切換
| DYNAMIC_RATE_LIMIT_ERROR_THRESHOLD_PER_MINUTE | 在平行請求限制器中，每分鐘部署失敗達到此門檻後即強制套用速率限制。預設為 1
| DOCS_DESCRIPTION | 文件頁面的說明文字
| DOCS_FILTERED | 表示文件已篩選的旗標
| DOCS_TITLE | 文件頁面的標題
| DOCS_URL | Swagger API 文件的路徑。**預設為 "/"**
| EMAIL_LOGO_URL | 電子郵件中使用的 Logo URL
| EMAIL_BUDGET_ALERT_TTL | 電子郵件預算警示的存活時間（秒）
| EMAIL_BUDGET_ALERT_MAX_SPEND_ALERT_PERCENTAGE | 觸發電子郵件預算警示的最大支出百分比
| EMAIL_SUPPORT_CONTACT | 支援聯絡電子郵件地址
| EMAIL_SIGNATURE | 所有電子郵件的自訂 HTML 頁尾/簽名。可包含 HTML 標籤以進行格式設定與連結。
| EMAIL_SUBJECT_INVITATION | 邀請電子郵件的自訂主旨樣板。 
| EMAIL_SUBJECT_KEY_CREATED | 金鑰建立電子郵件的自訂主旨樣板。 
| EMAIL_BUDGET_ALERT_MAX_SPEND_ALERT_PERCENTAGE | 觸發警示的最大預算百分比（以小數表示：0.8 = 80%）。預設為 0.8
| EMAIL_BUDGET_ALERT_TTL | 預算警示去重的存活時間（秒）。預設為 86400（24 小時）
| ENKRYPTAI_API_BASE | EnkryptAI Guardrails API 的基礎 URL。**預設為 https://api.enkryptai.com**
| ENKRYPTAI_API_KEY | EnkryptAI Guardrails 服務的 API 金鑰
| FAROS_API_KEY | 用於將 LLM 使用資料傳送至 Faros AI 的 API 金鑰
| FAROS_API_URL | Faros AI API 的基礎 URL。預設為 https://prod.api.faros.ai
| FAROS_GRAPH | LiteLLM 使用資料寫入的 Faros graph。預設為 "default"
| FAROS_ORIGIN | LiteLLM 寫入 Faros 的資料列所記錄的 origin。預設為 "litellm"
| FAROS_TOOL_CATEGORY | LiteLLM 寫入 Faros vcs_UserTool 資料列所記錄的工具類別。預設為 "LiteLLM"
| FAROS_USER_SOURCE | LiteLLM 使用者寫入 Faros vcs_User 資料列所記錄的 source。預設為 "LiteLLM"
| FIREWORKS_AI_4_B | Fireworks AI 4B 模型的大小參數。預設為 4
| FIREWORKS_AI_16_B | Fireworks AI 16B 模型的大小參數。預設為 16
| FIREWORKS_AI_56_B_MOE | Fireworks AI 56B MOE 模型的大小參數。預設為 56
| FIREWORKS_AI_80_B | Fireworks AI 80B 模型的大小參數。預設為 80
| FIREWORKS_AI_176_B_MOE | Fireworks AI 176B MOE 模型的大小參數。預設為 176
| FOCUS_PROVIDER | Focus 匯出的目標提供者（例如：`s3`）。預設為 `s3`。
| FOCUS_FORMAT | Focus 匯出的輸出格式。預設為 `parquet`。
| FOCUS_FREQUENCY | 排程 Focus 匯出的頻率（`hourly`、`daily` 或 `interval`）。預設為 `hourly`。
| FOCUS_CRON_OFFSET | 排程每小時/每日 Focus 匯出時使用的分鐘偏移量。預設為 `5` 分鐘。
| FOCUS_INTERVAL_SECONDS | 當 `frequency` 為 `interval` 時，Focus 匯出的間隔（秒）。
| FOCUS_PREFIX | 上傳 Focus 匯出檔案時使用的物件 key 前綴（或資料夾）。預設為 `focus_exports`。
| FOCUS_S3_BUCKET_NAME | 使用 S3 目的地時，上傳 Focus 匯出檔案的 S3 bucket。
| FOCUS_S3_REGION_NAME | Focus 匯出 S3 bucket 的 AWS 區域。
| FOCUS_S3_ENDPOINT_URL | Focus 匯出 S3 client 的自訂端點（選用；對 S3 相容儲存很有用）。
| FOCUS_S3_ACCESS_KEY | Focus 匯出 S3 client 使用的 AWS access key ID。
| FOCUS_S3_SECRET_KEY | Focus 匯出 S3 client 使用的 AWS secret access key。
| FOCUS_S3_SESSION_TOKEN | Focus 匯出 S3 client 使用的 AWS session token（選用）。
| MAVVRIK_API_KEY | Mavvrik FOCUS 匯出整合的 API 金鑰。
| MAVVRIK_API_ENDPOINT | Mavvrik FOCUS 匯出的租戶 API 端點，例如 `https://api.mavvrik.ai/<tenant_id>`。
| MAVVRIK_CONNECTION_ID | Mavvrik FOCUS 匯出的 AI cost connection ID。
| MAVVRIK_FOCUS_MAX_ROWS | Mavvrik FOCUS 目的地每個匯出視窗的最大列數。預設為 500000。
| FOCUS_GCS_BUCKET_NAME | 使用 GCS 目的地時，上傳 Focus 匯出檔案的 GCS bucket。
| FOCUS_GCS_PATH_SERVICE_ACCOUNT | 用於 Focus 匯出 GCS client 的 service account JSON 金鑰檔案路徑。若未設定，則回退至 Application Default Credentials。
| FUNCTION_DEFINITION_TOKEN_COUNT | 函式定義的 token 數。預設為 9
| GALILEO_API_KEY | Galileo Cloud（代管版）的 API 金鑰。當 `success_callback` 包含 `galileo` 時，與 v2 spans API 一起使用。
| GALILEO_BASE_URL | Galileo 平台的基礎 URL。Galileo Cloud 請使用 `https://api.galileo.ai`。企業版/自架版請將主控台 URL 中的 `console` 替換為 `api`。
| GALILEO_LOG_STREAM_ID | Galileo Cloud v2 spans 記錄的 log stream ID（選用）。
| GALILEO_PASSWORD | Galileo enterprise Observe 驗證的密碼
| GALILEO_PROJECT_ID | Galileo 使用的專案 ID
| GALILEO_USERNAME | Galileo enterprise Observe 驗證的使用者名稱
| GOOGLE_SECRET_MANAGER_PROJECT_ID | Google Secret Manager 的專案 ID
| GRACEFUL_SHUTDOWN_TIMEOUT | 代理程式在關閉時等待進行中的請求排空的秒數（SIGTERM 或 `/health/drain` preStop hook）後，才繼續進行卸載。**預設為 30**
| GCS_BUCKET_NAME | Google Cloud Storage bucket 的名稱
| GCS_MOCK | 啟用 GCS 整合測試的 mock 模式。設為 true 時，會攔截 GCS API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| GCS_MOCK_LATENCY_MS | 啟用 mock 模式時，GCS API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 150ms
| GCS_PATH_SERVICE_ACCOUNT | Google Cloud service account JSON 檔案路徑
| GCS_FLUSH_INTERVAL | GCS 記錄的 flush 間隔（秒）。指定您希望多久將記錄送至 GCS。**預設為 20 秒**
| GCS_BATCH_SIZE | GCS 記錄的批次大小。指定累積多少筆記錄後 flush 到 GCS。若 `BATCH_SIZE` 設為 10，則每 10 筆記錄 flush 一次。**預設為 2048**
| GCS_USE_BATCHED_LOGGING | 啟用 GCS 的批次記錄。啟用時（預設），多個記錄 payload 會合併為單一 GCS object 上傳（NDJSON 格式），大幅減少 API 呼叫。停用時，會將每筆記錄各自作為獨立 GCS object 傳送（舊版行為）。**預設為 true**
| GCS_PUBSUB_TOPIC_ID | 要將 LiteLLM SpendLogs 傳送到的 PubSub Topic ID。
| GCS_PUBSUB_PROJECT_ID | 要將 LiteLLM SpendLogs 傳送到的 PubSub Project ID。
| GENERIC_AUTHORIZATION_ENDPOINT | 一般 OAuth 提供者的授權端點
| GENERIC_CLIENT_ID | 一般 OAuth 提供者的 Client ID
| GENERIC_CLIENT_SECRET | 一般 OAuth 提供者的 Client secret
| GENERIC_CLIENT_STATE | 一般用戶端驗證的 state 參數
| GENERIC_CLIENT_USE_PKCE | 為一般 OAuth 提供者啟用 PKCE（Proof Key for Code Exchange）。當您的 OAuth 提供者需要 PKCE 時，請設為 "true"。**預設為 false**
| GENERIC_SSO_HEADERS | 要加入請求的額外標頭，以逗號分隔，例如 Authorization=Bearer `<token>`、Content-Type=application/json 等。
| GENERIC_INCLUDE_CLIENT_ID | 在 OAuth 請求中包含 client ID
| GENERIC_SCOPE | 一般 OAuth 提供者的 scope 設定
| GENERIC_TOKEN_ENDPOINT | 一般 OAuth 提供者的 token 端點
| GENERIC_USER_DISPLAY_NAME_ATTRIBUTE | 一般驗證中使用者顯示名稱的屬性
| GENERIC_USER_EMAIL_ATTRIBUTE | 一般驗證中使用者電子郵件的屬性
| GENERIC_USER_EXTRA_ATTRIBUTES | 以逗號分隔的額外欄位清單，從一般 SSO 提供者回應中擷取（例如："department,employee_id,groups"）。在自訂 SSO handler 中可透過 `CustomOpenID.extra_fields` 存取。支援巢狀欄位的點記法
| GENERIC_USER_FIRST_NAME_ATTRIBUTE | 一般驗證中使用者名字的屬性
| GENERIC_USER_ID_ATTRIBUTE | 一般驗證中使用者 ID 的屬性
| GENERIC_USER_LAST_NAME_ATTRIBUTE | 一般驗證中使用者姓氏的屬性
| GENERIC_USER_PROVIDER_ATTRIBUTE | 指定使用者提供者的屬性
| GENERIC_USER_ROLE_ATTRIBUTE | 指定使用者角色的屬性
| GENERIC_USERINFO_ENDPOINT | 在一般 OAuth 中擷取使用者資訊的端點
| GENERIC_LOGGER_ENDPOINT | 要將記錄傳送至的 Generic Logger callback 端點 URL
| GENERIC_LOGGER_HEADERS | 要包含在 Generic Logger callback 請求中的標頭 JSON 字串
| GENERIC_ROLE_MAPPINGS_DEFAULT_ROLE | 在一般 SSO 中，當沒有任何角色對應符合時要指派的預設 LiteLLM 角色。與 GENERIC_ROLE_MAPPINGS_ROLES 一起使用
| GENERIC_ROLE_MAPPINGS_GROUP_CLAIM | SSO token 中包含使用者群組的 claim/attribute 名稱。用於角色對應
| GENERIC_ROLE_MAPPINGS_ROLES | 將 LiteLLM 角色對應到 SSO 群組名稱的 Python dict 字串。範例：`{"proxy_admin": ["admin-group"], "internal_user": ["users"]}`
| GENERIC_USER_ROLE_MAPPINGS | 用於從 SSO 設定使用者角色對應的 GENERIC_ROLE_MAPPINGS_ROLES 替代方案
| GEMINI_API_BASE | Gemini API 的基礎 URL。預設為 https://generativelanguage.googleapis.com
| GALILEO_API_KEY | Galileo Cloud（代管版）的 API 金鑰。當 `success_callback` 包含 `galileo` 時，與 v2 spans API 一起使用。
| GALILEO_BASE_URL | Galileo 平台的基礎 URL。Galileo Cloud 請使用 `https://api.galileo.ai`。企業版/自架版請將主控台 URL 中的 `console` 替換為 `api`。
| GALILEO_LOG_STREAM_ID | Galileo Cloud v2 spans 記錄的 log stream ID（選用）。
| GALILEO_PASSWORD | Galileo enterprise Observe 驗證的密碼
| GALILEO_PROJECT_ID | Galileo 使用的專案 ID
| GALILEO_USERNAME | Galileo enterprise Observe 驗證的使用者名稱
| GITHUB_COPILOT_TOKEN_DIR | 用於儲存 `github_copilot` llm provider 的 GitHub Copilot token 目錄
| GITHUB_COPILOT_API_KEY_FILE | 用於儲存 `github_copilot` llm provider 的 GitHub Copilot API 金鑰檔案
| GITHUB_COPILOT_ACCESS_TOKEN_FILE | 用於儲存 `github_copilot` llm provider 的 GitHub Copilot access token 檔案
| GITHUB_COPILOT_API_BASE | GitHub Copilot API 的基礎 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://copilot-api.my-company.ghe.com. 預設為 https://api.githubcopilot.com
| GITHUB_COPILOT_DEVICE_CODE_URL | GitHub Copilot device code 驗證的 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://my-company.ghe.com/login/device/code. 預設為 https://github.com/login/device/code
| GITHUB_COPILOT_ACCESS_TOKEN_URL | GitHub Copilot access token 取得的 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://my-company.ghe.com/login/oauth/access_token. 預設為 https://github.com/login/oauth/access_token
| GITHUB_COPILOT_API_KEY_URL | GitHub Copilot API 金鑰取得的 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://my-company.ghe.com/api/v3/copilot_internal/v2/token. 預設為 https://api.github.com/copilot_internal/v2/token
| GITHUB_COPILOT_CLIENT_ID | GitHub Copilot device flow 驗證的 Client ID。這由 `github_copilot` 提供者用於 device code 驗證。預設為 "Iv1.b507a08c87ecfe98"
| GREENSCALE_API_KEY | Greenscale 服務的 API 金鑰
| GREENSCALE_ENDPOINT | Greenscale 服務的端點 URL
| GRAYSWAN_API_BASE | GraySwan API 的基礎 URL。預設為 https://api.grayswan.ai
| GRAYSWAN_API_KEY | GraySwan Cygnal 服務的 API 金鑰
| GRAYSWAN_REASONING_MODE | GraySwan guardrail 的推理模式
| GRAYSWAN_VIOLATION_THRESHOLD | GraySwan guardrail 的違規閾值
| GOOGLE_APPLICATION_CREDENTIALS | Google Cloud 憑證 JSON 檔案路徑
| GOOGLE_CLIENT_ID | Google OAuth 的 Client ID
| GOOGLE_CLIENT_SECRET | Google OAuth 的 Client secret
| GOOGLE_KMS_RESOURCE_NAME | Google KMS 中資源的名稱
| GUARDRAILS_AI_API_BASE | Guardrails AI API 的基礎 URL
| HEALTH_CHECK_TIMEOUT_SECONDS | 健康檢查的逾時時間（秒）。預設為 60
| HEROKU_API_BASE | Heroku API 的基礎 URL
| HEROKU_API_KEY | Heroku 服務的 API 金鑰
| HF_API_BASE | Hugging Face API 的基礎 URL
| HCP_VAULT_ADDR | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的位址
| HCP_VAULT_APPROLE_MOUNT_PATH | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 中 AppRole 驗證的掛載路徑。預設為 "approle"
| HCP_VAULT_APPROLE_ROLE_ID | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 中 AppRole 驗證的 Role ID
| HCP_VAULT_APPROLE_SECRET_ID | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 中 AppRole 驗證的 Secret ID
| HCP_VAULT_CLIENT_CERT | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的用戶端憑證路徑
| HCP_VAULT_CLIENT_KEY | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的用戶端金鑰路徑
| HCP_VAULT_MOUNT_NAME | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的掛載名稱
| HCP_VAULT_NAMESPACE | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的命名空間
| HCP_VAULT_PATH_PREFIX | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的路徑前綴
| HCP_VAULT_TOKEN | [Hashicorp Vault Secret Manager](../secret.md#hashicorp-vault) 的 Token
| HCP_VAULT_CERT_ROLE | [Hashicorp Vault Secret Manager Auth](../secret.md#hashicorp-vault) 的角色
| HELICONE_API_KEY | Helicone 服務的 API 金鑰
| HELICONE_API_BASE | Helicone 服務的基礎 URL，預設為 `https://api.helicone.ai`
| HELICONE_MOCK | 啟用 Helicone 整合測試的 mock 模式。設為 true 時，會攔截 Helicone API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| HELICONE_MOCK_LATENCY_MS | 啟用 mock 模式時，Helicone API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| HOSTNAME | 伺服器的主機名稱，這將會 [輸出至 `datadog` 記錄](https://docs.litellm.ai/docs/proxy/logging#datadog)
| HOURS_IN_A_DAY | 用於計算的每天小時數。預設為 24
| HIDDENLAYER_API_BASE | HiddenLayer API 的基礎 URL。預設為 `https://api.hiddenlayer.ai`
| HIDDENLAYER_AUTH_URL | HiddenLayer 的驗證 URL。預設為 `https://auth.hiddenlayer.ai`
| HIDDENLAYER_CLIENT_ID | HiddenLayer SaaS 驗證的 Client ID
| HIDDENLAYER_CLIENT_SECRET | HiddenLayer SaaS 驗證的 Client secret
| HUGGINGFACE_API_BASE | Hugging Face API 的基礎 URL
| HUGGINGFACE_API_KEY | Hugging Face API 的 API 金鑰
| HUMANLOOP_PROMPT_CACHE_TTL_SECONDS | Humanloop 中快取提示詞的存活時間（秒）。預設為 60
| IAM_TOKEN_DB_AUTH | 資料庫驗證用 IAM token
| IBM_GUARDRAILS_API_BASE | IBM Guardrails API 的基礎 URL
| IBM_GUARDRAILS_AUTH_TOKEN | IBM Guardrails API 的授權 bearer token
| INITIAL_RETRY_DELAY | 重試請求的初始延遲（秒）。預設為 0.5
| JITTER | 重試延遲計算的抖動因子。預設為 0.75
| JSON_LOGS | 啟用 JSON 格式記錄
| JWT_AUDIENCE | JWT token 的預期 audience
| JWT_ISSUER | JWT token 的預期 issuer（`iss` claim）。設定後，PyJWT 會驗證 `iss` claim，並拒絕來自其他 issuer 的 token
| JWT_PUBLIC_KEY_URL | 取得 JWT 驗證用 public key 的 URL
| LAGO_API_BASE | Lago API 的基礎 URL
| LAGO_API_CHARGE_BY | 用於決定 Lago 收費基礎的參數
| LAGO_API_EVENT_CODE | Lago API 事件的事件代碼
| LAGO_API_KEY | 存取 Lago 服務的 API 金鑰
| LANGFUSE_BASE_URL | Langfuse 服務的基礎 URL |
| LANGFUSE_DEBUG | 切換 Langfuse 的除錯模式
| LANGFUSE_FLUSH_INTERVAL | flush Langfuse 記錄的間隔
| LANGFUSE_TRACING_ENVIRONMENT | Langfuse tracing 的環境
| LANGFUSE_HOST | 已棄用的 Langfuse 服務主機 URL |
| LANGFUSE_MOCK | 啟用 Langfuse 整合測試的 mock 模式。設為 true 時，會攔截 Langfuse API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| LANGFUSE_MOCK_LATENCY_MS | 啟用 mock 模式時，Langfuse API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| LANGFUSE_PUBLIC_KEY | Langfuse 驗證的 public key
| LANGFUSE_RELEASE | Langfuse 整合的發行版本
| LANGFUSE_SECRET_KEY | Langfuse 驗證的 secret key
| LANGFUSE_PROPAGATE_TRACE_ID | 啟用將 trace ID 傳遞至 Langfuse 的旗標。預設為 False
| LANGSMITH_API_KEY | Langsmith 平台的 API 金鑰
| LANGSMITH_BASE_URL | Langsmith 服務的基礎 URL
| LANGSMITH_BATCH_SIZE | Langsmith 作業的批次大小
| LANGSMITH_DEFAULT_RUN_NAME | Langsmith run 的預設名稱
| LANGSMITH_PROJECT | Langsmith 整合的專案名稱
| LANGSMITH_SAMPLING_RATE | Langsmith 記錄的取樣率
| LANGSMITH_TENANT_ID | Langsmith 多租戶部署的 Tenant ID
| LANGSMITH_MOCK | 啟用 Langsmith 整合測試的 mock 模式。設為 true 時，會攔截 Langsmith API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| LANGSMITH_MOCK_LATENCY_MS | 啟用 mock 模式時，Langsmith API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| LANGTRACE_API_KEY | Langtrace 服務的 API 金鑰
| LASSO_API_BASE | Lasso API 的基礎 URL
| LASSO_API_KEY | Lasso 服務的 API 金鑰
| LASSO_USER_ID | Lasso 服務的使用者 ID
| LASSO_CONVERSATION_ID | Lasso 服務的對話 ID
| LENGTH_OF_LITELLM_GENERATED_KEY | LiteLLM 產生的金鑰長度。預設為 16
| LEGACY_MULTI_INSTANCE_RATE_LIMITING | 啟用舊版多執行個體速率限制的旗標。**預設為 False**
| LITERAL_API_KEY | Literal 整合的 API 金鑰
| LITERAL_API_URL | Literal 服務的 API URL
| LITERAL_BATCH_SIZE | Literal 作業的批次大小
| LITELLM_ANTHROPIC_BETA_HEADERS_URL | 取得 Anthropic beta headers 設定的自訂 URL。預設為 GitHub main branch URL
| LITELLM_ANTHROPIC_DISABLE_URL_SUFFIX | 停用 Anthropic API base URL 的自動附加 URL 後綴。設為 `true` 時，會防止 LiteLLM 自動將 `/v1/messages` 或 `/v1/complete` 加到自訂 Anthropic API 端點
| LITELLM_ASSETS_PATH | UI 資產與 logo 所在目錄的路徑。當以唯讀檔案系統執行時使用（例如：Kubernetes）。Docker 中預設為 `/var/lib/litellm/assets`。
| LITELLM_BLOG_POSTS_URL | 取得 LiteLLM blog posts JSON 的自訂 URL。預設為 GitHub main branch URL
| LITELLM_CLI_JWT_EXPIRATION_HOURS | CLI 產生的 JWT token 到期時間（小時）。預設為 24 小時
| LITELLM_CLI_SSO_CLAIM_MAP | `CLI_SSO_CLAIM_MAP` 的別名 — CLI SSO 歸因 metadata 的允許清單 OIDC claims
| LITELLM_CORS_ALLOW_CREDENTIALS | 設為 `true` 以在 CORS 回應中明確允許 credentials。未設定時，若 `LITELLM_CORS_ORIGINS` 為 `*`（萬用字元），credentials 會自動停用，以避免瀏覽器將任何 origin 與 credentials 對映的安全設定錯誤
| LITELLM_CORS_ORIGINS | 允許的 CORS origins 以逗號分隔清單（例如 `https://app.example.com,https://admin.example.com`）。未設定時預設為 `*`（所有 origins）
| LITELLM_DD_AGENT_HOST | LiteLLM 專用記錄的 DataDog agent 主機名稱或 IP。設定後，記錄會傳送至 agent，而非直接 API
| LITELLM_DEPLOYMENT_ENVIRONMENT | 部署的環境名稱（例如："production"、"staging"）。當未設定 OTEL_ENVIRONMENT_NAME 時作為備援。會在遙測資料中設定 `environment` 標籤
| LITELLM_DETAILED_TIMING | 設為 true 時，會在回應中加入詳細的各階段 timing 標頭（`x-litellm-timing-{pre-processing,llm-api,post-processing,message-copy}-ms`）。預設為 false。請參閱 [latency overhead 文件](../troubleshoot/latency_overhead.md)
| LITELLM_DD_AGENT_PORT | LiteLLM 專用記錄的 DataDog agent 連接埠。預設為 10518
| LITELLM_DD_LLM_OBS_PORT | Datadog LLM Observability agent 的連接埠。預設為 8126
| LITELLM_DEFAULT_EMBEDDING_ENCODING_FORMAT | OpenAI 相容 embedding 請求的預設 `encoding_format`，當請求或模型 `litellm_params` 中未設定時使用（例如 `float`、`base64`）。備援為 `float`。請參閱 [Embeddings](./embedding.md#embedding-encoding-format)。
| LITELLM_DEV_ENV_HOT_RELOAD | 代理程式在以 `--reload` 啟動時自行設定的內部旗標，表示重新載入的 worker 應以 `override=True` 重新讀取 `.env`，使現有金鑰的編輯在重新載入時生效。不應由使用者設定
| LITELLM_DONT_SHOW_FEEDBACK_BOX | 隱藏 LiteLLM UI 中 feedback box 的旗標
| LITELLM_DROP_PARAMS | 要在 LiteLLM 請求中捨棄的參數
| LITELLM_MODIFY_PARAMS | 要在 LiteLLM 請求中修改的參數
| LITELLM_EMAIL | 與 LiteLLM 帳戶關聯的電子郵件
| LITELLM_FAVICON_URL | LiteLLM UI favicon 的自訂 URL。設定後會覆寫預設 favicon
| LITELLM_GLOBAL_MAX_PARALLEL_REQUEST_RETRIES | LiteLLM 平行請求的最大重試次數
| LITELLM_GLOBAL_MAX_PARALLEL_REQUEST_RETRY_TIMEOUT | LiteLLM 平行請求重試的逾時時間
| LITELLM_DISABLE_ACCESS_LOG_PATHS | 要從 uvicorn access logs 排除的 URL path 以逗號分隔清單（例如 `/health,/metrics`）。適合用來抑制雜訊過多的健康檢查記錄項目。 |
| LITELLM_DISABLE_LAZY_LOADING | 設為 "1"、"true"、"yes" 或 "on" 時，會停用屬性的 lazy loading（目前僅影響 encoding/tiktoken）。這可確保在 VCR 開始記錄 HTTP 請求之前先初始化 encoding，修正 VCR cassette 建立問題。請參閱 [issue #18659](https://github.com/BerriAI/litellm/issues/18659)
| LITELLM_DISABLE_REDACT_SECRETS | 設為 "true" 時，會停用從 proxy 記錄輸出中自動遮罩機密（API 金鑰、token、憑證）。機密遮罩預設已啟用。
| LITELLM_DISABLE_ACCESS_LOG_PATHS | 要捨棄其 uvicorn access-log 行的精確請求路徑以逗號分隔清單（例如健康檢查、root 探測、造成記錄洪流的 metrics 擷取）。路徑會對比任何查詢字串之前的部分。空值/未設定會停用篩選。
| LITELLM_MIGRATION_DIR | prisma migrations 的自訂 migrations 目錄，用於在唯讀檔案系統中為資料庫建立基準。
| LITELLM_HOSTED_UI | LiteLLM 代管 UI 的 URL
| LITELLM_UI_API_DOC_BASE_URL | API Reference 基礎 URL 的選用覆寫（用於範例程式碼/文件），當管理 UI 與 proxy 不在同一主機時使用。未設定時預設為 `PROXY_BASE_URL`。
| LITELLM_UI_PATH | Admin UI 檔案所在目錄的路徑。當以唯讀檔案系統執行時使用（例如：Kubernetes）。Docker 中預設為 `/var/lib/litellm/ui`。
| LITELLM_UI_SESSION_DURATION | UI 登入工作階段的持續時間（username/password、SSO、邀請連結）。格式："30s"、"30m"、"24h"、"7d"。不適用於 EXPERIMENTAL_UI_LOGIN 流程，該流程為安全起見使用固定 10 分鐘到期時間。預設為 "24h"
| LITELLM_EXPIRED_UI_SESSION_KEY_CLEANUP_BATCH_SIZE | 每次清理執行中要刪除的已過期 LiteLLM dashboard session key 最大數量。預設為 1000。
| LITELLM_EXPIRED_UI_SESSION_KEY_CLEANUP_ENABLED | 設為 `true` 以啟用已過期 LiteLLM dashboard session key 的背景清理工作。預設為 `false`。
| LITELLM_EXPIRED_UI_SESSION_KEY_CLEANUP_INTERVAL_SECONDS | 執行已過期 LiteLLM dashboard session key 清理工作的間隔秒數。預設為 86400（24 小時）。
| LITELM_ENVIRONMENT | LiteLLM Instance 的環境，目前僅用於 DeepEval 的記錄，以判定 DeepEval 整合的環境。
| LITELLM_KEY_ROTATION_ENABLED | 啟用 LiteLLM 自動金鑰輪替（boolean）。預設為 false。
| LITELLM_KEY_ROTATION_CHECK_INTERVAL_SECONDS | 執行自動輪替金鑰工作的間隔秒數。預設為 86400（24 小時）。
| LITELLM_KEY_ROTATION_GRACE_PERIOD | 輪替後保留舊金鑰有效的持續時間（例如 "24h"、"2d"）。預設為空白（立即撤銷）。用於排程輪替，以及在 regenerate 請求未指定時作為備援。
| LITELLM_KEY_ROTATION_LOCK_TTL_SECONDS | 金鑰輪替工作所使用的分散式鎖 TTL（秒）。預設為 600（10 分鐘）。
| LITELLM_LICENSE | LiteLLM 使用的授權金鑰
| LITELLM_LOCAL_ANTHROPIC_BETA_HEADERS | 設為 `True` 時，僅使用本地內建的 Anthropic beta headers 設定，並停用遠端擷取。預設為 `False`
| LITELLM_OIDC_ALLOWED_CREDENTIAL_DIRS | 以逗號分隔的絕對目錄清單，`oidc/file/` 提供者可從中讀取 token 檔案。預設為 `/var/run/secrets,/run/secrets`。
| LITELLM_LOCAL_BLOG_POSTS | 設為 `True` 時，僅使用本地內建的 blog posts，並停用從 GitHub 的遠端擷取。預設為 `False`
| LITELLM_LOCAL_MODEL_COST_MAP | LiteLLM 中 model cost mapping 的本地設定
| LITELLM_LOCAL_POLICY_TEMPLATES | 設為 "true" 時，使用本地備份 policy 範本，而非從 GitHub 擷取。policy 範本預設從 https://raw.githubusercontent.com/BerriAI/litellm/main/policy_templates.json 擷取，失敗時自動回退到本地備份
| LITELLM_LOG | 啟用 LiteLLM 的詳細記錄
| LITELLM_MODEL_COST_MAP_URL | 取得 model cost map 資料的 URL。預設為 https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json
| LITELLM_LOG_FILE | LiteLLM 記錄要寫入的檔案路徑。設定後，記錄會同時寫入主控台與指定檔案
| LITELLM_LOGGER_NAME | OTEL logger 的名稱 
| LITELLM_METER_NAME | OTEL Meter 的名稱 
| LITELLM_OTEL_INTEGRATION_ENABLE_EVENTS | 可選擇啟用 OTEL 的語意記錄（`gen_ai.content.prompt`/`gen_ai.content.completion`，或在 semconv 模式下為 `gen_ai.client.inference.operation.details`）。預設 `false`。請參閱 [OpenTelemetry](/docs/observability/opentelemetry_integration#configuration-reference)
| LITELLM_OTEL_INTEGRATION_ENABLE_METRICS | 可選擇啟用 OTEL 的語意指標（TTFT、TPOT、回應持續時間、成本、token 使用量）。預設 `false`。請參閱 [OpenTelemetry](/docs/observability/opentelemetry_integration#metrics-reference)
| LITELLM_OTEL_BAGGAGE_TEAM_METADATA_KEYS | 以逗號分隔的 team-metadata 子鍵允許清單，會以 `litellm.team.metadata` 的形式提升到 OTEL spans 上。預設為空，因此在每個子鍵明確列入允許清單之前，團隊的任何自由格式 metadata 都不會傳送到您的 tracing backend。也可在 config.yaml 的 `callback_settings.otel` 下以 `baggage_team_metadata_keys` 設定。請參閱 [OpenTelemetry](/docs/observability/opentelemetry_integration)。
| LITELLM_ENABLE_PYROSCOPE | 若為 true，會啟用 Pyroscope CPU profiling。profile 會傳送至 PYROSCOPE_SERVER_ADDRESS。預設關閉。請參閱 [Pyroscope profiling](/proxy/pyroscope_profiling)。
| LITELLM_ENABLE_TEAM_STALE_ALIAS_BYPASS | 當 `true` 時，若某團隊的舊版 `model_aliases` 項目將公開模型名稱對應到內部 `model_name_<team_id>_<uuid>` 部署，當該公開名稱存在團隊範圍的同層部署時，前置呼叫處理可略過該重寫——因此負載平衡 / `order` 會套用於同層部署。為了向後相容，預設為 `false`。請參閱 [Team-scoped models and legacy aliases](./load_balancing#team-scoped-models-and-legacy-model_aliases)。當偵測到陳舊別名且此旗標關閉時，proxy 可能會記錄一次性警告。
| PYROSCOPE_APP_NAME | Pyroscope 回報的應用程式名稱。當 LITELLM_ENABLE_PYROSCOPE 為 true 時必填。沒有預設值。
| PYROSCOPE_SERVER_ADDRESS | 要傳送 profile 的 Pyroscope server URL。當 LITELLM_ENABLE_PYROSCOPE 為 true 時必填。沒有預設值。
| PYROSCOPE_SAMPLE_RATE | 選用。Pyroscope profiling 的取樣率（整數）。沒有預設值；未設定時，會使用 pyroscope-io library 預設值。
| PYROSCOPE_GRAFANA_USER | 選用。Grafana Cloud Pyroscope 使用者/租戶 ID，用於 basic auth。當設定 PYROSCOPE_GRAFANA_API_TOKEN 時必填。
| PYROSCOPE_GRAFANA_API_TOKEN | 選用。Grafana Cloud API/access policy token，用於 Pyroscope basic auth。當設定 PYROSCOPE_GRAFANA_USER 時必填。
| LITELLM_MASTER_KEY | 用於 proxy 驗證的主金鑰
| LITELLM_MAX_BUDGET_PER_SESSION_TTL | max-budget-per-session 限制器所使用的 session 預算計數器 TTL（秒）。預設為 3600（1 小時）
| LITELLM_MAX_ITERATIONS_TTL | max-iterations 限制器所使用的 session 迭代計數器 TTL（秒）。預設為 3600（1 小時）
| LITELLM_MAX_STREAMING_DURATION_SECONDS | 串流回應允許的最長持續時間（秒）。超過此時間的串流會以 Timeout error 終止。預設為 None（無限制）
| LITELLM_STREAM_INACTIVITY_TIMEOUT_SECONDS | 在對 async 串流提供者等待下一個 chunk 前的最長秒數，超過後將引發 Timeout。可防止提供者僅以 keepalive bytes 維持連線但停止送出內容。預設為 None（停用）
| LITELLM_MODE | LiteLLM 的運作模式（例如：production、development）
| LITELLM_NON_ROOT | 在 Docker 容器中以 non-root 模式執行 LiteLLM 以提升安全性的旗標
| LITELLM_RATE_LIMIT_WINDOW_SIZE | LiteLLM 的速率限制視窗大小。預設為 60
| LITELLM_REASONING_AUTO_SUMMARY | 若設為 "true"，會自動為所有翻譯路徑（Anthropic adapter、Responses API 等）上的推理模型啟用詳細推理摘要（`summary: "detailed"`）。預設為 "false"
| LITELLM_SALT_KEY | LiteLLM 加密用的 salt key
| LITELLM_SENSITIVE_ROUTING_TTL | 黏著式敏感資料 routing 決策的 TTL（秒）；控制 session 保持釘選到由 routing guardrail 選出的內部部署模型的時間長度。預設為 3600
| LITELLM_SSL_CIPHERS | 用於更快 handshake 的 SSL/TLS cipher 設定。控制 OpenSSL 連線的 cipher suite 偏好。
| LITELLM_SECRET_AWS_KMS_LITELLM_LICENSE | LiteLLM 的 AWS KMS 加密授權
| LITELLM_TOKEN | LiteLLM 整合的存取 token
| LITELLM_TPM_TOKEN_RESERVATION_ENABLED | 當為 false 時，v3 rate limiter 會跳過前置 TPM token 保留，並根據實際使用量在請求後強制執行 TPM。預設為 true
| LITELLM_USE_CHAT_COMPLETIONS_URL_FOR_ANTHROPIC_MESSAGES | 設為 "true" 時，會將 OpenAI /v1/messages 請求對 Anthropic 模型改經由 chat/completions，而非 Responses API。也可透過 `litellm_settings.use_chat_completions_url_for_anthropic_messages` 設定
| LITELLM_ROUTE_ALL_CHAT_OPENAI_TO_RESPONSES | 設為 "true" 時，會將所有 OpenAI /chat/completions 請求透過 Responses API bridge 路由。建議用於 OpenAI 模型。也可透過 `litellm_settings.route_all_chat_openai_to_responses` 設定
| LITELLM_GEMINI_LIVE_DEFER_SETUP | 設為 "true" 時，會延後 Gemini/Vertex Live 的設定，直到用戶端傳送 `session.update`（runtime tool injection 所需）。為向後相容，預設為 "false"，即連線時自動傳送 setup。也可透過 `litellm.gemini_live_defer_setup` 設定
| LITELLM_USE_LEGACY_INTERACTIONS_SCHEMA | 設為 "true" 時，會使用舊版 Google Interactions API schema（`outputs` array、`2026-05-07` revision），而非新版 schema（`steps` array、`2026-05-20` revision）。舊版 schema 將於 2026 年 6 月 8 日停止支援。也可透過 `litellm_settings.use_legacy_interactions_schema` 設定
| LITELLM_USER_AGENT | LiteLLM API 請求的自訂 user agent 字串。用於合作夥伴遙測歸因
| LITELLM_WORKER_STARTUP_HOOKS | 以逗號分隔的 `module.path:function_name` callable 清單，會在每個 worker process 啟動期間執行。於 worker 生命週期早期執行（在 config/DB 載入之前）。適合用來重新初始化像 [gflags](https://github.com/google/python-gflags) 這類每個 process 的狀態。詳情請參閱 [Worker Startup Hooks](/proxy/worker_startup_hooks)
| LITELLM_PRINT_STANDARD_LOGGING_PAYLOAD | 若為 true，則將標準記錄 payload 列印到主控台——有助於除錯
| LITELM_ENVIRONMENT | LiteLLM Instance 的環境。目前僅記錄到 DeepEval，用以判定 DeepEval 整合的環境。
| LITELLM_ASYNCIO_QUEUE_MAXSIZE | asyncio 佇列的最大大小（例如記錄佇列、花費更新佇列，以及 cookbook 範例中像 `nova_sonic_realtime.py` 的即時音訊）。限制記憶體成長以避免 OOM。預設為 1000。
| LOGFIRE_TOKEN | Logfire 記錄服務的 Token
| LOGFIRE_BASE_URL | Logfire 記錄服務的基礎 URL（對自架部署有用）
| LOGGING_WORKER_CONCURRENCY | asyncio event loop 上記錄 worker 的最大並行 coroutine 插槽數。預設為 100。設定過高會使記錄任務淹沒 event loop，進而降低請求的整體延遲。
| LOGGING_WORKER_MAX_QUEUE_SIZE | 記錄 worker 佇列的最大大小。當佇列滿時，worker 會積極清除任務以騰出空間，而不是丟棄記錄。預設為 50,000
| LOGGING_WORKER_MAX_TIME_PER_COROUTINE | 記錄 worker 中每個 coroutine 允許的最長時間（秒），逾時後結束。預設為 20.0
| LOGGING_WORKER_CLEAR_PERCENTAGE | 清除時要擷取的佇列百分比。預設為 50% 
| MAX_BASE64_LENGTH_FOR_LOGGING | 記錄 payload 中保留的 base64 字元最大數量。超過此值的 Data URI 會以大小佔位符取代。設為 0 可停用截斷。預設為 64
| MAX_COMPETITOR_NAMES | policy 範本擴充中允許的競品名稱最大數量。預設為 100
| MAX_EXCEPTION_MESSAGE_LENGTH | 例外訊息的最大長度。預設為 2000
| MAX_ITERATIONS_TO_CLEAR_QUEUE | 關閉時嘗試清除記錄 worker 佇列的最大迭代次數。預設為 200
| MAX_TIME_TO_CLEAR_QUEUE | 關閉時清除記錄 worker 佇列所花費的最長時間（秒）。預設為 5.0
| LOGGING_WORKER_AGGRESSIVE_CLEAR_COOLDOWN_SECONDS | 佇列滿時，在允許下一次積極清除操作前的冷卻時間（秒）。預設為 0.5 
| MAX_STRING_LENGTH_PROMPT_IN_DB | 在清理請求本文時，spend logs 中字串的最大長度。超過此長度的字串會被截斷。預設為 1000
| MAX_IN_MEMORY_QUEUE_FLUSH_COUNT | 記憶體內佇列 flush 作業的最大次數。預設為 1000
| MAX_IMAGE_URL_DOWNLOAD_SIZE_MB | 從 URL 下載圖片時的最大大小（MB）。可防止下載過大的圖片造成記憶體問題。超過此限制的圖片會在下載前被拒絕。設為 0 可完全停用圖片 URL 處理（所有 image_url 請求都將被封鎖）。預設為 50MB（與 [OpenAI 的限制](https://platform.openai.com/docs/guides/images-vision?api-mode=chat#image-input-requirements) 相同）
| MAX_LONG_SIDE_FOR_IMAGE_HIGH_RES | 高解析度圖片長邊的最大長度。預設為 2000
| MAX_REDIS_BUFFER_DEQUEUE_COUNT | Redis 緩衝區出隊作業的最大次數。預設為 100
| MAX_REQUEST_BODY_SIZE_TO_REPAIR_MB | 當 LiteLLM 無法將請求本文解析為 JSON 時，會嘗試修復的最大請求本文大小（MB）。修復備援會對完整本文執行兩次 regex 掃描，以修正無效的 surrogate escape，而這會在大型錯誤 payload 上阻塞 event loop。超過此大小的本文會略過修復並立即回傳 400；小於或等於此大小的本文仍會修復。設為 0 可停用上限並一律嘗試修復。預設為 1（MB）
| MAX_SHORT_SIDE_FOR_IMAGE_HIGH_RES | 高解析度圖片短邊的最大長度。預設為 768
| MAX_SIZE_IN_MEMORY_QUEUE | 記憶體內佇列的最大大小。預設為 10000
| MAX_SIZE_PER_ITEM_IN_MEMORY_CACHE_IN_KB | 記憶體快取中每個項目的最大大小（KB）。預設為 512 或 1024
| MAX_SPENDLOG_ROWS_TO_QUERY | 要查詢的 spend log 列最大數量。預設為 1,000,000
| MAX_TEAM_LIST_LIMIT | 要列出的團隊最大數量。預設為 20
| MAX_TILE_HEIGHT | 圖片 tile 的最大高度。預設為 512
| MAX_TILE_WIDTH | 圖片 tile 的最大寬度。預設為 512
| MAX_TOKEN_TRIMMING_ATTEMPTS | 修剪 token 訊息的最大嘗試次數。預設為 10
| MAXIMUM_TRACEBACK_LINES_TO_LOG | LiteLLM Logs UI 中要記錄的 traceback 最大行數。預設為 100
| MAX_RETRY_DELAY | 重試請求的最大延遲（秒）。預設為 8.0
| MAX_LANGFUSE_INITIALIZED_CLIENTS | 在 proxy 上要初始化的 Langfuse client 最大數量。預設為 50。這樣設定是因為每次初始化一個 client 時，langfuse 都會初始化 1 個 thread。過去曾發生過因為多次初始化 Langfuse 而導致 CPU 使用率達到 100% 的事件。
| MAX_MCP_SEMANTIC_FILTER_TOOLS_HEADER_LENGTH | MCP semantic filter tools 的最大標頭長度。預設為 150
| MAX_POLICY_ESTIMATE_IMPACT_ROWS | 估算 policy 影響時回傳的最大列數。預設為 1000
| MAX_PAYLOAD_SIZE_FOR_DEBUG_LOG | 完整 DEBUG 序列化允許的最大 payload 大小（位元組）。超過此值的 payload 會在記錄中截斷。預設為 102400（100 KB）
| MIN_NON_ZERO_TEMPERATURE | 最小非零 temperature 值。預設為 0.0001
| MINIMUM_PROMPT_CACHE_TOKEN_COUNT | 可快取提示詞的最小 token 數。預設為 1024
| MISTRAL_API_BASE | Mistral API 的基礎 URL。預設為 https://api.mistral.ai
| MISTRAL_API_KEY | Mistral API 的 API 金鑰
| MICROSOFT_AUTHORIZATION_ENDPOINT | Microsoft SSO 的自訂授權端點 URL（覆寫預設 Microsoft OAuth 授權端點）
| MICROSOFT_CLIENT_ID | Microsoft 服務的 Client ID
| MICROSOFT_CLIENT_SECRET | Microsoft 服務的 Client secret
| MICROSOFT_GRAPH_ENDPOINT | 透過 SSO 同步 Entra ID 群組成員資格時所使用的 Microsoft Graph API 基礎 URL。預設為 `https://graph.microsoft.com/v1.0`。Azure Government Cloud（GCC High）請設為 `https://graph.microsoft.us/v1.0`
| MICROSOFT_SERVICE_PRINCIPAL_ID | Microsoft Enterprise Application 的 Service Principal ID。（這是進階功能，若您希望 litellm 根據 Microsoft Entra ID Groups 自動將成員指派到 Litellm Teams）
| MICROSOFT_TENANT | Microsoft Azure 的 Tenant ID
| MICROSOFT_TOKEN_ENDPOINT | Microsoft SSO 的自訂 token 端點 URL（覆寫預設 Microsoft OAuth token 端點）
| MICROSOFT_USER_DISPLAY_NAME_ATTRIBUTE | Microsoft SSO 回應中使用者顯示名稱的欄位名稱。預設為 `displayName`
| MICROSOFT_USER_EMAIL_ATTRIBUTE | Microsoft SSO 回應中使用者電子郵件的欄位名稱。預設為 `userPrincipalName`
| MICROSOFT_USER_FIRST_NAME_ATTRIBUTE | Microsoft SSO 回應中使用者名字的欄位名稱。預設為 `givenName`
| MICROSOFT_USER_ID_ATTRIBUTE | Microsoft SSO 回應中使用者 ID 的欄位名稱。預設為 `id`
| MICROSOFT_USER_LAST_NAME_ATTRIBUTE | Microsoft SSO 回應中使用者姓氏的欄位名稱。預設為 `surname`
| MICROSOFT_USERINFO_ENDPOINT | Microsoft SSO 的自訂 userinfo 端點 URL（覆寫預設 Microsoft Graph userinfo 端點）
| MODEL_COST_MAP_MAX_SHRINK_RATIO | 驗證取得的 model cost map 與本地備份相比時，允許的最大縮減比例。若取得的 map 小於備份的此比例，將被拒絕。預設為 0.5
| MODEL_COST_MAP_MIN_MODEL_COUNT | 取得的 cost map 必須包含的最小模型數量，才視為有效。預設為 50
| NEW_RELIC_APP_NAME | New Relic AI Monitoring 整合的應用程式名稱 |
| NEW_RELIC_LICENSE_KEY | New Relic 驗證的授權金鑰 |
| NO_DOCS | 停用 Swagger UI 文件的旗標
| NO_OPENAPI | 停用 /openapi.json 端點的旗標
| NO_REDOC | 停用 Redoc 文件的旗標
| NO_PROXY | 要略過 proxy 的位址清單
| NON_LLM_CONNECTION_TIMEOUT | 非 LLM 服務連線的逾時時間（秒）。預設為 15
| OAUTH_TOKEN_INFO_ENDPOINT | OAuth token 資訊擷取端點
| OPENAI_BASE_URL | OpenAI API 的基礎 URL
| OPENAI_API_BASE | OpenAI API 的基礎 URL。預設為 https://api.openai.com/
| OPENAI_API_KEY | OpenAI 服務的 API 金鑰
| OPENAI_CHATGPT_API_BASE | CHATGPT_API_BASE 的替代方案。ChatGPT API 的基礎 URL
| OPENAI_FILE_SEARCH_COST_PER_1K_CALLS | OpenAI file search 每 1000 次呼叫的成本。預設為 0.0025
| OPENAI_ORGANIZATION | OpenAI 的組織識別碼
| OPENAPI_URL | OpenAPI JSON 端點的路徑。**預設為 "/openapi.json"**
| OPENID_BASE_URL | OpenID Connect 服務的基礎 URL
| OPENID_CLIENT_ID | OpenID Connect 驗證的 Client ID
| OPENID_CLIENT_SECRET | OpenID Connect 驗證的 Client secret
| OPENMETER_API_ENDPOINT | OpenMeter 整合的 API 端點
| OPENMETER_API_KEY | OpenMeter 服務的 API 金鑰
| OPENMETER_EVENT_TYPE | 傳送至 OpenMeter 的事件類型
| OPENMETER_TRUST_REQUEST_USER | 若為 false，則忽略請求本文 `user`，並從已驗證金鑰的 user_id 解析 OpenMeter subject。預設為 true
| ONYX_API_BASE | Onyx Security AI Guard 服務的基礎 URL（預設為 https://ai-guard.onyx.security）
| ONYX_API_KEY | Onyx Security AI Guard 服務的 API 金鑰
| ONYX_TIMEOUT | Onyx Guard server 請求的逾時時間（秒）。預設為 10
| OTEL_ENDPOINT | 用於 traces 的 OpenTelemetry 端點
| OTEL_EXPORTER_OTLP_ENDPOINT | 用於 traces 的 OpenTelemetry 端點
| OTEL_ENVIRONMENT_NAME | OpenTelemetry 的環境名稱
| OTEL_EXPORTER | OpenTelemetry 的 exporter 類型
| OTEL_EXPORTER_OTLP_PROTOCOL | OpenTelemetry 的 exporter 類型
| OTEL_HEADERS | OpenTelemetry 請求的標頭
| OTEL_MODEL_ID | OpenTelemetry tracing 的模型 ID
| OTEL_EXPORTER_OTLP_HEADERS | OpenTelemetry 請求的標頭
| OTEL_SERVICE_NAME | OpenTelemetry 的服務名稱識別碼
| OTEL_TRACER_NAME | OpenTelemetry tracing 的 tracer 名稱
| OTEL_LOGS_EXPORTER | OpenTelemetry logs 的 exporter 類型（例如：console）
| OTEL_IGNORE_CONTEXT_PROPAGATION | 當為 true 時，忽略父 span context 傳遞（傳入的 `traceparent` headers 與任何作用中的 span），使每個 LiteLLM trace 都成為自己的 root。預設 `false`
| OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT | 控制 prompts 與 completions 是否被擷取到 OpenTelemetry traces 中。可接受 `NO_CONTENT`（依規格預設）、`SPAN_ONLY`、`EVENT_ONLY`、`SPAN_AND_EVENT`，或布林形式（`true` 對應 `EVENT_ONLY`、`false` 對應 `NO_CONTENT`）
| OTEL_SEMCONV_STABILITY_OPT_IN | 設為 `gen_ai_latest_experimental` 以依據最新的 [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) 發出 spans。會將 LLM-call span 重新命名為 `{operation} {model}`、抑制 `raw_gen_ai_request`、加入 `gen_ai.provider.name`，並整合事件。依 OTEL 規格可用逗號分隔
| USE_OTEL_LITELLM_REQUEST_SPAN | 當 `true` 時，proxy 會針對每次 LLM call 發出一個獨立的 `litellm_request` span，作為 `Received Proxy Server Request` span 的子項。預設 `false`（自 v1.81.0 起）；LLM-call 屬性直接設定在 proxy root span 上。請參閱 [Why don't I see a `litellm_request` span?](/docs/observability/opentelemetry_integration#why-dont-i-see-a-litellm_request-span)
| OTEL_DEBUG | 當 `true` 時，將 exporter 與 span 建立診斷輸出至 stderr。當 traces 沒有送達後端時很有用。預設 `false`
| DEBUG_OTEL | `OTEL_DEBUG` 的別名
| PAGERDUTY_API_KEY | PagerDuty Alerting 的 API 金鑰
| PANW_PRISMA_AIRS_API_KEY | PANW Prisma AIRS 服務的 API 金鑰
| PANW_PRISMA_AIRS_API_BASE | PANW Prisma AIRS 服務的基礎 URL
| PHOENIX_API_KEY | Arize Phoenix 的 API 金鑰
| PHOENIX_COLLECTOR_ENDPOINT | Arize Phoenix 的 API 端點
| PHOENIX_COLLECTOR_HTTP_ENDPOINT | Arize Phoenix 的 API http 端點
| PILLAR_API_BASE | Pillar API Guardrails 的基礎 URL
| PILLAR_API_KEY | Pillar API Guardrails 的 API 金鑰
| PILLAR_ON_FLAGGED_ACTION | 內容被標記時要採取的動作（'block' 或 'monitor'）
| PKCE_STRICT_CACHE_MISS | 設為 `true` 時，若 PKCE code_verifier 不在快取中（例如跨 pod 發生 cache miss），SSO callback 會回傳 401 錯誤。當為 `false`（預設）時，會記錄警告並在沒有 code_verifier 的情況下繼續。
| POD_NAME | 伺服器的 pod 名稱，這將會 [輸出至 `datadog` 記錄](https://docs.litellm.ai/docs/proxy/logging#datadog) 作為 `POD_NAME` 
| POSTHOG_API_KEY | PostHog 分析整合的 API 金鑰
| POSTHOG_API_URL | PostHog API 的基礎 URL（預設為 https://us.i.posthog.com）
| POSTHOG_MOCK | 啟用 PostHog 整合測試的 mock 模式。設為 true 時，會攔截 PostHog API 呼叫並回傳 mock 回應，而不進行實際網路請求。預設為 false
| POSTHOG_MOCK_LATENCY_MS | 啟用 mock 模式時，PostHog API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| PRISMA_AUTH_RECONNECT_LOCK_TIMEOUT_SECONDS | Prisma auth 重新連線的鎖逾時時間（秒）。預設為 0.1
| PRISMA_AUTH_RECONNECT_TIMEOUT_SECONDS | Prisma auth 重新連線嘗試的逾時時間（秒）。預設為 2.0
| PRISMA_HEALTH_WATCHDOG_ENABLED | 啟用 Prisma DB 健康 watchdog，以監控連線中斷並在失去連線時重新連線。預設為 true
| PRISMA_HEALTH_WATCHDOG_INTERVAL_SECONDS | Prisma health watchdog 探測的間隔秒數。預設為 30
| PRISMA_HEALTH_WATCHDOG_PROBE_TIMEOUT_SECONDS | 每次 Prisma health 探測的逾時時間（秒）。預設為 5.0
| PRISMA_RECONNECT_COOLDOWN_SECONDS | Prisma 重新連線嘗試之間的冷卻時間（秒）。預設為 15
| PRISMA_RECONNECT_ESCALATION_THRESHOLD | 在升級重新連線策略之前允許的連續重新連線失敗次數。預設為 3
| PRISMA_WATCHDOG_RECONNECT_TIMEOUT_SECONDS | Prisma watchdog 主動重新連線的逾時時間（秒）。預設為 30.0
| PREDIBASE_API_BASE | Predibase API 的基礎 URL
| PRESIDIO_ANALYZER_API_BASE | Presidio Analyzer 服務的基礎 URL
| PRESIDIO_ANONYMIZER_API_BASE | Presidio Anonymizer 服務的基礎 URL
| PROMETHEUS_BUDGET_METRICS_PER_REQUEST_TIMEOUT | 在跳過之前，針對每個請求發出 Prometheus budget metrics 所允許花費的最長秒數；逾時時，該發送會被獨立丟棄，因此緩慢的 Redis/DB 查詢不會取消整個成功記錄事件。預設為 5.0
| PROMETHEUS_BUDGET_METRICS_REFRESH_INTERVAL_MINUTES | Prometheus budget metrics 的重新整理間隔（分鐘）。預設為 5
| PROMETHEUS_FALLBACK_STATS_SEND_TIME_HOURS | 將統計資料傳送至 Prometheus 的備援時間（小時）。預設為 9
| PROMETHEUS_URL | Prometheus 服務的 URL
| PROMPTLAYER_API_KEY | PromptLayer 整合的 API 金鑰
| PROXY_ADMIN_ID | proxy server 的管理員識別碼
| PROXY_BASE_URL | proxy 服務的基礎 URL。也由 MCP OAuth `authorize` 端點在驗證瀏覽器提供的 `redirect_uri` 值時，作為 proxy 的公開 origin 使用——當 LiteLLM 透過 TLS 終止的 ingress 執行時，請將此設定為使用者在網址列中看到的確切 origin（例如 `https://llm.example.com`）。僅限完整 origin：scheme + host（若非預設則含 port），不得有尾端斜線，也不得有 path。設定後會優先於 `X-Forwarded-*` headers（僅在 [`use_x_forwarded_for`](#general_settings---reference) 為 `true` 且 request peer 位於 [`mcp_trusted_proxy_ranges`](#general_settings---reference) 中時才適用）。請參閱 [MCP OAuth — Reverse proxy and ingress configuration](../mcp_oauth#reverse-proxy-and-ingress-configuration)。
| PROXY_BATCH_WRITE_AT | 等待後再將 spend logs 批次寫入資料庫的時間（秒）。預設為 10
| PROXY_BATCH_POLLING_INTERVAL | 等待後再輪詢批次以檢查是否完成的時間（秒）。預設為 6000s（1 小時）
| PROXY_BATCH_POLLING_ENABLED | 設為 `false` 以完全停用 `CheckBatchCost` 與 `CheckResponsesCost` 背景輪詢工作。對於安裝中存在大量陳舊受管理物件時的緊急緩解很有用。預設為 `true`
| MAX_OBJECTS_PER_POLL_CYCLE | 每個輪詢週期擷取的受管理物件（batches / responses）最大數量。可防止在具有許多陳舊資料列的安裝中發生 OOM。預設為 `50`
| MANAGED_OBJECT_STALENESS_CUTOFF_DAYS | 非終止狀態且超過此天數的受管理物件，會在每個輪詢週期開始時標記為 `stale_expired` 並略過。預設為 `7`
| PROXY_BUDGET_RESCHEDULER_MAX_TIME | 在檢查資料庫是否有預算重設前允許等待的最長時間（秒）。預設為 605
| PROXY_BUDGET_RESCHEDULER_MIN_TIME | 在檢查資料庫是否有預算重設前允許等待的最短時間（秒）。預設為 597
| PYTHON_GC_THRESHOLD | GC 閾值（'gen0,gen1,gen2'，例如 '1000,50,50'）；預設為 Python 的值。
| PROXY_LOGOUT_URL | 登出 proxy 服務的 URL
| QDRANT_API_BASE | Qdrant API 的基礎 URL
| QDRANT_API_KEY | Qdrant 服務的 API 金鑰
| QDRANT_SCALAR_QUANTILE | Qdrant 作業的 scalar quantile。預設為 0.99
| QDRANT_URL | Qdrant 資料庫的連線 URL
| QDRANT_VECTOR_SIZE | Qdrant 作業的向量大小。預設為 1536
| REDIS_CONNECTION_POOL_TIMEOUT | Redis 連線池的逾時時間（秒）。預設為 5
| REDIS_CIRCUIT_BREAKER_ENABLED | 當為 false 時，Redis circuit breaker 會停用且永不開啟。預設為 true
| REDIS_CIRCUIT_BREAKER_FAILURE_THRESHOLD | Redis circuit breaker 開啟前的連續失敗次數。預設為 5
| REDIS_CIRCUIT_BREAKER_RECOVERY_TIMEOUT | Redis circuit breaker 開啟後嘗試復原前的等待時間（秒）。預設為 60
| REDIS_CLUSTER_NODES | Redis Cluster 模式的 Redis cluster 啟動節點 JSON 格式清單。範例：`[{"host": "node1", "port": 6379}]`
| REDIS_HOST | Redis 伺服器的主機名稱
| REDIS_PASSWORD | Redis 服務的密碼
| REDIS_PORT | Redis 伺服器的連接埠號
| REDIS_SOCKET_TIMEOUT | Redis socket 操作的逾時時間（秒）。預設為 0.1
| REDIS_GCP_SERVICE_ACCOUNT | 用於與 Redis 進行 IAM 驗證的 GCP service account。格式："projects/-/serviceAccounts/name@project.iam.gserviceaccount.com"
| REDIS_GCP_SSL_CA_CERTS | 用於安全 GCP Memorystore Redis 連線的 SSL CA 憑證檔案路徑
| REDOC_URL | Redoc Fast API 文件的路徑。**預設為 "/redoc"**
| REPEATED_STREAMING_CHUNK_LIMIT | 重複串流區塊的限制，用於偵測迴圈。預設為 100
| REALTIME_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES | 即時連線中 WebSocket 訊息的最大大小（位元組）。預設為 None。
| REPLICATE_MODEL_NAME_WITH_ID_LENGTH | 帶 ID 的 Replicate 模型名稱長度。預設為 64
| REPLICATE_POLLING_DELAY_SECONDS | Replicate 輪詢作業的延遲（秒）。預設為 0.5
| REQUEST_TIMEOUT | 請求的逾時時間（秒）。預設為 6000
| ROOT_REDIRECT_URL | 當 DOCS_URL 設為非 "/" 時，要將根路徑 (/) 重新導向到的 URL（DOCS_URL 預設為 "/"）
| ROUTER_MAX_FALLBACKS | router 的最大備援次數。預設為 5
| RUBRIK_API_KEY | 用於驗證 Rubrik webhook 服務的 bearer token
| RUBRIK_BATCH_SIZE | flush 至 Rubrik 前要緩衝的記錄項目數。預設為 512
| RUBRIK_SAMPLING_RATE | 要記錄至 Rubrik 的請求比例（0.0 到 1.0）。預設為 1.0
| RUBRIK_WEBHOOK_URL | Rubrik webhook 服務的基礎 URL，用於工具封鎖與批次記錄
| RUNWAYML_DEFAULT_API_VERSION | RunwayML 服務的預設 API 版本。預設為 "2024-11-06"
| RUNWAYML_POLLING_TIMEOUT | RunwayML 圖片生成輪詢的逾時時間（秒）。預設為 600（10 分鐘）
| S3_VECTORS_DEFAULT_DIMENSION | S3 Vectors RAG 擷取的預設向量維度。預設為 1024
| S3_VECTORS_DEFAULT_DISTANCE_METRIC | S3 Vectors RAG 擷取的預設距離度量。選項："cosine"、"euclidean"。預設為 "cosine"
| SECRET_MANAGER_REFRESH_INTERVAL | secret manager 的重新整理間隔（秒）。預設為 86400（24 小時）
| SERVER_ROOT_PATH | 伺服器應用程式的根路徑
| SEND_USER_API_KEY_ALIAS | 將使用者 API 金鑰別名傳送至 Zscaler AI Guard 的旗標。預設為 False
| SEND_USER_API_KEY_TEAM_ID | 將使用者 API 金鑰 team ID 傳送至 Zscaler AI Guard 的旗標。預設為 False
| SEND_USER_API_KEY_USER_ID | 將使用者 API 金鑰 user ID 傳送至 Zscaler AI Guard 的旗標。預設為 False
| SET_VERBOSE | [已棄用] 請改用 `LITELLM_LOG`，值可為 "INFO"、"DEBUG" 或 "ERROR"。請參閱 [debugging 文件](./debugging)
| SINGLE_DEPLOYMENT_TRAFFIC_FAILURE_THRESHOLD | 單一部署冷卻邏輯中，被視為「合理流量」所需的最小請求數。預設為 1000
| SLACK_DAILY_REPORT_FREQUENCY | 每日 Slack 報告的頻率（例如：daily、weekly）
| SLACK_WEBHOOK_URL | Slack 整合的 webhook URL
| SMTP_HOST | SMTP server 的主機名稱
| SMTP_PASSWORD | SMTP 驗證密碼（若 SMTP 不需要驗證，請勿設定）
| SMTP_PORT | SMTP server 的連接埠號
| SMTP_SENDER_EMAIL | SMTP 交易中用作寄件者的電子郵件地址
| SMTP_SENDER_LOGO | 透過 SMTP 寄送的電子郵件中使用的 Logo
| SMTP_TLS | 啟用或停用 SMTP 連線 TLS 的旗標
| SMTP_USE_SSL | 設為 "True" 以在任何連接埠上強制使用隱式 SSL（SMTP_SSL）。連接埠 465 不需要此設定，因為它會自動使用隱式 SSL；其他連接埠預設使用 STARTTLS（請參閱 SMTP_TLS）
| SMTP_USERNAME | SMTP 驗證的使用者名稱（若 SMTP 不需要驗證，請勿設定）
| SENDGRID_API_KEY | SendGrid 電子郵件服務的 API 金鑰
| RESEND_API_KEY | Resend 電子郵件服務的 API 金鑰
| SENDGRID_SENDER_EMAIL | 在 SendGrid 電子郵件交易中用作寄件者的電子郵件地址 
| SPEND_LOGS_URL | 取得 spend logs 的 URL
| SPEND_LOG_CLEANUP_BATCH_SIZE | 清理期間每批刪除的記錄數。預設為 1000
| STALE_OBJECT_CLEANUP_BATCH_SIZE | 每次清理週期更新的陳舊受管理物件最大數量。預設為 1000
| SSL_CERTIFICATE | SSL 憑證檔案的路徑
| SSL_ECDH_CURVE | SSL/TLS 金鑰交換的 ECDH curve（例如，'X25519' 以停用 PQC）。
| SSL_SECURITY_LEVEL | [BETA] SSL/TLS 連線的安全等級。例如 `DEFAULT@SECLEVEL=1`
| SSL_VERIFY | 啟用或停用 SSL 憑證驗證的旗標
| SSL_CERT_FILE | 自訂 CA bundle 的 SSL 憑證檔案路徑
| SUPABASE_KEY | Supabase 服務的 API 金鑰
| SUPABASE_URL | Supabase Instance 的基礎 URL
| STORE_MODEL_IN_DB | 若為 true，則啟用在資料庫中儲存 model + credential 資訊。 
| SYSTEM_MESSAGE_TOKEN_COUNT | system message 的 token 數。預設為 4
| TEST_EMAIL_ADDRESS | 用於測試的電子郵件地址
| TOGETHER_AI_4_B | Together AI 4B 模型的大小參數。預設為 4
| TOGETHER_AI_8_B | Together AI 8B 模型的大小參數。預設為 8
| TOGETHER_AI_21_B | Together AI 21B 模型的大小參數。預設為 21
| TOGETHER_AI_41_B | Together AI 41B 模型的大小參數。預設為 41
| TOGETHER_AI_80_B | Together AI 80B 模型的大小參數。預設為 80
| TOGETHER_AI_110_B | Together AI 110B 模型的大小參數。預設為 110
| TOGETHER_AI_EMBEDDING_150_M | Together AI 150M embedding model 的大小參數。預設為 150
| TOGETHER_AI_EMBEDDING_350_M | Together AI 350M embedding model 的大小參數。預設為 350
| TOOL_CHOICE_OBJECT_TOKEN_COUNT | tool choice objects 的 token 數。預設為 4
| TOOL_POLICY_CACHE_TTL_SECONDS | 快取 tool policy guardrail 結果的 TTL（秒）。預設為 60
| UI_LOGO_PATH | UI 中使用的 logo 圖片路徑
| UI_PASSWORD | 存取 UI 的密碼
| UI_USERNAME | 存取 UI 的使用者名稱
| UPSTREAM_LANGFUSE_DEBUG | 啟用上游 Langfuse 除錯的旗標
| UPSTREAM_LANGFUSE_HOST | 上游 Langfuse 服務的主機 URL
| UPSTREAM_LANGFUSE_PUBLIC_KEY | 上游 Langfuse 驗證的 public key
| UPSTREAM_LANGFUSE_RELEASE | 上游 Langfuse 的發行版本識別碼
| UPSTREAM_LANGFUSE_SECRET_KEY | 上游 Langfuse 驗證的 secret key
| USE_AWS_KMS | 啟用 AWS Key Management Service 進行加密的旗標
| USE_PRISMA_MIGRATE | 使用 prisma migrate 而非 prisma db push 的旗標。建議用於 production 環境。
| VANTAGE_API_KEY | Vantage 成本匯入整合的 API 金鑰
| VANTAGE_BASE_URL | Vantage API 的基礎 URL。預設為 `https://api.vantage.sh`
| VANTAGE_EXPORT_FREQUENCY | Vantage 的匯出頻率 — `hourly`（預設）、`daily` 或 `interval`
| VANTAGE_EXPORT_INTERVAL_SECONDS | 當 VANTAGE_EXPORT_FREQUENCY 為 `interval` 時的間隔秒數
| VANTAGE_INTEGRATION_TOKEN | 成本匯入端點的 Vantage 整合 token
| WANDB_API_KEY | Weights & Biases（W&B）記錄整合的 API 金鑰
| WANDB_HOST | Weights & Biases（W&B）服務的主機 URL
| WANDB_PROJECT_ID | Weights & Biases（W&B）記錄整合的專案 ID
| WEBHOOK_URL | 接收來自外部服務 webhooks 的 URL
| SPEND_LOG_RUN_LOOPS | 設定 spend_log_cleanup 工作應執行多少次 1000 筆批次刪除的常數
| SPEND_LOG_CLEANUP_BATCH_SIZE | 清理期間每批刪除的記錄數。預設為 1000
| SPEND_LOG_PARTITION_INTERVAL | LiteLLM_SpendLogs 分割區的粒度（當資料表分割時）：day、week 或 month。預設為 day
| SPEND_LOG_PARTITION_PRECREATE_AHEAD | 每次清理執行時預先建立的未來 spend-log 分割區數量。預設為 7
| SPEND_LOG_QUEUE_POLL_INTERVAL | spend log 佇列的輪詢間隔（秒）。預設為 2.0
| SPEND_LOG_QUEUE_SIZE_THRESHOLD | 處理前的 spend log 佇列大小閾值。預設為 100
| SPEND_LOG_CLEANUP_MAX_CONSECUTIVE_BATCH_FAILURES | spend log 清理執行在中止前可容忍的連續批次失敗次數。預設為 3
| SPEND_LOG_CLEANUP_BATCH_FAILURE_BACKOFF_SECONDS | 失敗的 spend log 清理批次之間的 backoff 秒數。預設為 0.5
| SPEND_COUNTER_RESEED_LOCKS_MAX_SIZE | 每個計數器用於合併來自資料庫的並行 spend-counter reseed 的 LRU lock dict 最大大小，於強制執行路徑使用。預設為 10000。
| COROUTINE_CHECKER_MAX_SIZE_IN_MEMORY | CoroutineChecker 記憶體快取的最大大小。預設為 1000
| DEFAULT_SHARED_HEALTH_CHECK_TTL | 共用健康檢查模式下快取健康檢查結果的存活時間（秒）。預設為 300（5 分鐘）
| DEFAULT_SHARED_HEALTH_CHECK_LOCK_TTL | 共用健康檢查模式下健康檢查鎖的存活時間（秒）。預設為 60（1 分鐘）
| ZSCALER_AI_GUARD_API_KEY | Zscaler AI Guard 服務的 API 金鑰
| ZSCALER_AI_GUARD_POLICY_ID | Zscaler AI Guard guardrails 的 policy ID
| ZSCALER_AI_GUARD_URL | Zscaler AI Guard API 的基礎 URL。預設為 https://api.us1.zseclipse.net/v1/detection/execute-policy
