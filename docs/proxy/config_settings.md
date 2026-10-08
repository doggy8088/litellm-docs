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
      base_model: {{openai_large}}
      additionalProp1: {}

litellm_settings:
  # Logging/Callback settings
  success_callback: ["langfuse"]  # list of success callbacks
  failure_callback: ["sentry"]  # list of failure callbacks
  callbacks: ["otel"]  # list of callbacks - runs on success and failure
  service_callback: ["datadog", "prometheus"]  # logs redis, postgres failures on datadog, prometheus
  turn_off_message_logging: boolean  # prevent the messages and responses from being logged to on your callbacks, but request metadata will still be logged. Useful for privacy/compliance when handling sensitive data.
  redact_user_api_key_info: boolean  # Redact information about the user api key (hashed token, user_id, team id, etc.), from logs. Currently supported for Langfuse, OpenTelemetry, Logfire, ArizeAI logging.
  langfuse_default_tags: ["cache_hit", "cache_key", "proxy_base_url", "user_api_key_alias", "user_api_key_user_id", "user_api_key_user_email", "user_api_key_team_alias", "semantic-similarity", "proxy_base_url"] # default tags for Langfuse Logging
  langfuse_enable_update_trace_keys: boolean  # allow callers to copy named request metadata onto an existing Langfuse trace.
  # Networking settings
  request_timeout: 10 # (int) llm requesttimeout in seconds. Raise Timeout error if call takes longer than 10s. Sets litellm.request_timeout
  force_ipv4: boolean # If true, litellm will force ipv4 for all LLM requests. Some users have seen httpx ConnectionError when using ipv6 + Anthropic API. HTTP(S)_PROXY / NO_PROXY are still honored

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
  request_correlation_in_logs: boolean # if true, stamps every log line with the request's trace_id and session_id

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
  allow_unmanaged_response_ids: boolean  # let keys address response IDs this proxy never issued, e.g. raw provider IDs
  vector_store_deny_by_default: boolean  # if true, a vector store must be granted in object_permission.vector_stores of the key and its team (or the user when there is neither); empty lists grant nothing
  disable_auto_add_proxy_admin_to_teams: boolean  # if true, a proxy admin calling /team/new is no longer auto-added to the new team as team admin
  search_tool_deny_by_default: boolean  # if true, a search tool must be granted in object_permission.search_tools of the key and its team (or the user when there is neither); empty lists grant nothing
  enforce_fallback_model_access: boolean  # if true, router_settings fallbacks only run when the calling key, team and project may call the fallback model
  enforce_fallback_budget: boolean  # default true; set false to let router_settings fallbacks run even when the calling key or user is out of budget
  enable_jwt_auth: boolean  # allow proxy admin to auth in via jwt tokens with 'litellm_proxy_admin' in claims
  enforce_user_param: boolean  # requires all openai endpoint requests to have a 'user' param
  reject_clientside_metadata_tags: boolean  # if true, rejects requests with client-side 'metadata.tags' to prevent users from influencing budgets
  missing_session_id: generate  # or "reject". What to do with LLM API requests that carry no session id; unset keeps the legacy behavior
  disable_batch_input_file_rate_limiting: boolean  # skip TPM/RPM accounting for batch input files
  skip_batch_input_file_rate_limiting_for_providers: ["hosted_vllm"]  # apply the batch accounting skip only to these providers
  disable_budget_reservation: boolean  # disable pre-request budget reservation; may allow overspend under concurrency
  allowed_routes: ["route1", "route2"]  # list of allowed proxy API routes - a user can access. (currently JWT-Auth only)
  key_management_system: google_kms  # either google_kms or azure_kms
  master_key: string  # falls back to LITELLM_MASTER_KEY; the proxy will not start when the master key is unset, empty, or has a known unsafe value
  dangerously_permit_weak_or_unset_master_key: boolean  # local development only; lets the proxy start with no master key or a known unsafe value
  maximum_spend_logs_retention_period: 30d # The maximum time to retain spend logs before deletion.
  maximum_spend_logs_retention_interval: 1d # interval in which the spend log cleanup task should run in.
  maximum_daily_tag_spend_retention_period: 90d # Optional. Prune LiteLLM_DailyTagSpend rows for days older than this.
  user_mcp_management_mode: restricted  # or "view_all"

  # Database Settings
  database_url: string
  database_connection_pool_limit: 0  # default 10
  database_connection_timeout: 0  # default 60s
  database_connect_timeout: 0  # Prisma `connect_timeout` URL param (seconds). Unset => Prisma default.
  database_socket_timeout: 0  # Prisma `socket_timeout` URL param (seconds). Idle/slow connections beyond this are closed.
  database_statement_timeout: 0  # Postgres statement_timeout (seconds). Caps how long any one statement may run, and therefore how long it can hold locks. Unset => no bound.
  database_lock_timeout: 0  # Postgres lock_timeout (seconds). Caps how long a statement waits for a lock another transaction holds. Unset => no bound.
  database_extra_connection_params: {}  # Extra key/value pairs appended to the Prisma DATABASE_URL / DIRECT_URL query string (e.g. sslmode, pgbouncer, statement_cache_size). Overrides LiteLLM defaults.
  database_disable_prepared_statements: boolean  # if true, appends pgbouncer=true to the Prisma connection URL, disabling server-side prepared statements. For PgBouncer transaction pooling and avoiding "cached plan must not change result type" errors during rolling migrations.
  allow_requests_on_db_unavailable: boolean  # if true, will allow requests that can not connect to the DB to verify Virtual Key to still work 
  fail_closed_budget_enforcement: boolean  # if true, validates spend against the DB for every budgeted request and rejects with 503 when spend cannot be verified against Redis or the DB
  fail_closed_rate_limit_enforcement: boolean  # if true, rejects requests with 503 while the tpm/rpm/max_parallel_requests counters in Redis are unreachable, instead of enforcing the limits per instance from memory

  custom_auth: string
  max_parallel_requests: 0 # the max parallel requests allowed per deployment
  global_max_parallel_requests: 0 # the max parallel requests allowed on the proxy all up
  infer_model_from_keys: true
  background_health_checks: true
  health_check_interval: 300
  alerting: ["slack", "email"]
  alerting_threshold: 0
  use_client_credentials_pass_through_routes: boolean  # use client credentials for all pass through routes like "/vertex-ai", /bedrock/. When this is True Virtual Key auth will not be applied on these endpoints

worker_registry:                    # top-level key, not nested under general_settings
  - worker_id: string               # unique id for the worker
    name: string                    # display name shown in the UI
    url: string                     # full URL of the worker, must start with http:// or https://

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
  tag_routing_prefix: "route:"              # string - Opt-in marker prefix (default ""). A request tag starting with this exact string is stripped and matched as an explicit routing directive, skipping the known-tag-vocabulary heuristic. Unprefixed tags keep matching as today.
  retry_policy: {                          # Dict[str, int]: retry policy for different types of exceptions
    "AuthenticationErrorRetries": 3,
    "TimeoutErrorRetries": 3,
    "RateLimitErrorRetries": 3,
    "ContentPolicyViolationErrorRetries": 4,
    "InternalServerErrorRetries": 4,
    "ServiceUnavailableErrorRetries": 4,
    "NotFoundErrorRetries": 0,             # never retry a 404
    "DefaultRetries": 2                    # retries for every error with no field of its own
  }
  allowed_fails_policy: {
    "BadRequestErrorAllowedFails": 1000, # Allow 1000 BadRequestErrors before cooling down a deployment
    "AuthenticationErrorAllowedFails": 10, # int 
    "TimeoutErrorAllowedFails": 12, # int 
    "RateLimitErrorAllowedFails": 10000, # int 
    "ContentPolicyViolationErrorAllowedFails": 15, # int 
    "InternalServerErrorAllowedFails": 20, # int 
  }
  content_policy_fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for content policy violations
  fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for all errors

```

### litellm_settings - 參考 {#litellm_settings---reference}

**預設** 欄位是 LiteLLM 在未從 `config.yaml` 省略該設定時使用的值。`null` 表示該設定未設置，而說明則會解釋 LiteLLM 在該情況下的行為。當未設置時會從環境變數讀取的設定，會在其說明中列出該環境變數。

| 名稱 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| success_callback | strings 陣列 | `[]` | 成功回呼清單。[Doc Proxy logging callbacks](logging), [Doc Metrics](prometheus) |
| failure_callback | strings 陣列 | `[]` | 失敗回呼清單 [Doc Proxy logging callbacks](logging), [Doc Metrics](prometheus) |
| callbacks | strings 陣列 | `[]` | 回呼清單 - 會在成功與失敗時執行 [Doc Proxy logging callbacks](logging), [Doc Metrics](prometheus) |
| service_callback | object 陣列 | `[]` | 系統健康監控 - 會在指定服務上記錄 redis、postgres 失敗（例如 datadog、prometheus）[Doc Metrics](prometheus) |
| turn_off_message_logging | boolean | `false` | 若為 true，會防止訊息與回應被記錄到回呼中，但請求中繼資料仍會被記錄。對於處理敏感資料時的隱私／合規性很有用 [Proxy Logging](logging) |
| modify_params | boolean | `false` | 若為 true，允許在請求送出到 LLM 提供者之前修改其參數 |
| enable_preview_features | boolean | `false` | 若為 true，會啟用預覽功能 - 例如支援串流的 Azure O1 Models。|
| disable_stop_sequence_limit | boolean | `false` | 若為 true，會停用將 `stop` 參數截斷為 OpenAI 規格允許的 4 個序列。 |
| redact_user_api_key_info | boolean | `false` | 若為 true，會在記錄中遮蔽使用者 API 金鑰相關資訊 [Proxy Logging](logging#redacting-userapikeyinfo) |
| mcp_aliases | object | `{}` | 將友善別名對應到 MCP 伺服器名稱，以便更容易存取工具。每個伺服器只會使用第一個別名。[MCP 別名](../mcp#mcp-aliases) |
| langfuse_default_tags | strings 陣列 | `[]` | Langfuse Logging 的預設標籤。如果您想控制哪些 LiteLLM 特定欄位會被 LiteLLM proxy 以標籤形式記錄，請使用此項。預設情況下，LiteLLM Proxy 不會將任何 LiteLLM 特定欄位記錄為標籤。[更多文件](/docs/proxy/logging#litellm-tags---cache_hit-cache_key) |
| set_verbose | boolean | `false` | [已棄用 - 請參閱除錯文件](./debugging) 改用 `--debug` 或 `--detailed_debug` CLI 旗標，或將 `LITELLM_LOG` 環境變數設為 "INFO"、"DEBUG" 或 "ERROR"。 |
| json_logs | boolean | `false` | 若為 true，記錄將採用 json 格式。如果您需要將記錄儲存為 JSON，只要設定 `litellm.json_logs = True` 即可。我們目前只是將來自 litellm 的原始 POST 請求以 JSON 形式記錄下來。[更多文件](./debugging) |
| request_correlation_in_logs | boolean | `false` | 若為 true，會在每一行記錄（純文字或 JSON）上標註該請求的 `trace_id` 與 `session_id`，並在 `StandardLoggingPayload` 中加入 `session_id` 欄位。[更多文件](./debugging#request-correlation-ids) |
| default_fallbacks | strings 陣列 | `[]` | 若特定模型群組設定錯誤／異常時，要使用的備援模型清單。[更多文件](./reliability#default-fallbacks) |
| request_timeout | integer | `6000`（秒）| 請求逾時（以秒為單位）。若未設定，預設值為 `6000 seconds`。[供參考，OpenAI Python SDK 的預設值為 `600 seconds`。](https://github.com/openai/openai-python/blob/main/src/openai/_constants.py) 設定後，也會套用到原生提供者 passthrough 路由（`/v1/responses`、`/v1/messages`、Bedrock `/converse`），其優先順序高於 `general_settings.pass_through_request_timeout`，低於任何部署或路由逾時。[文件](./pass_through#request-timeouts) |
| force_ipv4 | boolean | `false` | 若為 true，litellm 會強制所有 LLM 請求使用 ipv4。有些使用者在使用 ipv6 + Anthropic API 時曾遇到 httpx ConnectionError。`HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 在 aiohttp 與 httpx 兩種傳輸方式上仍會被遵守；在 httpx 傳輸方式上只有直接連線會固定為 IPv4，連到 proxy 本身的那一跳不會 |
| disable_aiohttp_transport | boolean | `false` | 若為 true，LLM 請求會改走一般的 httpx，而不是預設的 aiohttp 傳輸。若您看到 aiohttp 連接器錯誤，例如 `CancelledError` 以 `No response returned` 形式出現在 `/v1/responses`、`/v1/chat/completions` 或 `/v1/messages` 上，請設定此項（或 `DISABLE_AIOHTTP_TRANSPORT` 環境變數）。**預設為 False** |
| http2 | boolean | `false` | 若為 true，LiteLLM 會透過 TLS 與 LLM 提供者協商 HTTP/2（若提供者不支援則回退至 HTTP/1.1）。流量會經由 httpx，而非預設的 aiohttp 傳輸。也可透過 `LITELLM_HTTP2` 環境變數設定。自 v1.103.0 起可用。[更多文件](./server_tuning#outbound-http2-to-providers)。**預設為 False** |
| content_policy_fallbacks | objects 陣列 | `[]` | 當遇到 ContentPolicyViolationError 時要使用的備援。[更多文件](./reliability#content-policy-fallbacks) |
| context_window_fallbacks | objects 陣列 | `[]` | 當遇到 ContextWindowExceededError 時要使用的備援。[更多文件](./reliability#context-window-fallbacks) |
| cache | boolean | `false` | 若為 true，會啟用快取。[更多文件](./caching) |
| cache_params | object | `{}`（`type` 預設為 `redis`） | 快取參數。[更多文件](./caching_settings#supported-cache_params-on-proxy-configyaml) |
| enable_redis_auth_cache | boolean | `false` | 當 `true` 時，會將虛擬金鑰驗證負載儲存在 Redis（與回應快取相同的 client）中，因此每個 worker/pod 都會共享快取的驗證查詢——在快取未命中時，重複讀取資料庫的次數更少。**需要 `cache: true` 與 `cache_params.type: redis`**（Redis 或 Redis Cluster）。選用：可設定 `general_settings.user_api_key_cache_ttl`，讓 TTL 同時一致地套用於記憶體與 Redis。[更多文件](./caching_redis#virtual-key-authentication-cache-redis) |
| force_redis_hash_tag_grouping | boolean | `false` | 當 `true` 時，即使快取是一般 Redis 連線而非 Redis Cluster，速率限制器也會依 hash slot 分組其 Redis Lua 腳本的鍵。若是仍會拒絕跨槽命令的單一端點 Redis 服務，請設定此項，例如採用 Enterprise clustering policy 的 Azure Managed Redis；若不設定，這些服務會使批次 `EVALSHA` 呼叫以 `CROSSSLOT Keys in request don't hash to the same slot` 失敗，而速率限制會回退到每個 pod 的記憶體。 |
| disable_end_user_cost_tracking | boolean | `false` | 若為 true，會關閉 proxy 上 Prometheus 指標 + litellm spend logs table 的終端使用者成本追蹤。 |
| enable_end_user_cost_tracking_prometheus_only | boolean | `false` | 若為 true，會在 Prometheus 指標中加入 `end_user` 標籤。預設為停用，以維持 Prometheus cardinality 有上限。[更多文件](./prometheus#tracking-end_user-on-prometheus) |
| cost_discount_config | object | `{}` | 套用於成本計算的特定提供者百分比折扣。請在 `litellm_settings` 下方設定。[更多文件](./provider_discounts) |
| cost_margin_config | object | `{}` | 套用於成本計算的特定提供者或全域百分比／固定加價。請在 `litellm_settings` 下方設定。[更多文件](./provider_margins) |
| key_generation_settings | object | `null`（無限制） | 限制誰可以產生金鑰。[更多文件](./virtual_keys.md#restricting-key-generation) |
| disable_add_transform_inline_image_block | boolean | `false` | 針對 Fireworks AI 模型 - 若為 true，且模型不是視覺模型，則會關閉自動將 `#transform=inline` 加到 image_url 的 url 上。 |
| use_chat_completions_url_for_anthropic_messages | boolean | `false` | 若為 true，會將 OpenAI `/v1/messages` 請求改走 chat/completions，而不是 Responses API。也可透過環境變數 `LITELLM_USE_CHAT_COMPLETIONS_URL_FOR_ANTHROPIC_MESSAGES=true` 設定。 |

| route_all_chat_openai_to_responses | boolean | `false` | 若為 true，會將所有 OpenAI `/chat/completions` 請求透過 Responses API 橋接器路由。建議用於 OpenAI 模型。也可透過環境變數 `LITELLM_ROUTE_ALL_CHAT_OPENAI_TO_RESPONSES=true` 設定。 |
| skip_system_message_in_guardrail | boolean | `false` | 若為 true，統一防護欄僅在 **聊天完成** 和 **Anthropic `/v1/messages`** 上，會從掃描輸入中省略 `role: system`；Lakera v2 也會在聊天完成上遵循此設定。LLM 仍會接收完整訊息。每個防護欄可個別覆寫：在每個防護欄上設定 `litellm_params.skip_system_message_in_guardrail`。[防護欄快速上手](./guardrails/quick_start#skip-system-messages-in-guardrail-evaluation) |
| skip_tool_message_in_guardrail | boolean | `false` | 若為 true，統一防護欄僅在 **聊天完成** 和 **Anthropic `/v1/messages`** 上，會從掃描輸入中省略 `role: tool`；Lakera v2 也會在聊天完成上遵循此設定。LLM 仍會接收完整訊息。每個防護欄可個別覆寫：在每個防護欄上設定 `litellm_params.skip_tool_message_in_guardrail`。[防護欄快速上手](./guardrails/quick_start#skip-tool-messages-in-guardrail-evaluation) |
| disable_hf_tokenizer_download | boolean | `false` | 若為 true，預設對所有模型（包含 huggingface 模型）使用 openai tokenizer。 |
| enable_json_schema_validation | boolean | `false` | 若為 true，會為所有請求啟用 json schema 驗證。 |
| enable_key_alias_format_validation | boolean | `false` | 若為 true，會在 `/key/generate` 和 `/key/update` 上驗證 `key_alias` 格式。必須為 2-255 個字元，開頭/結尾須為英數字元，且僅允許 `a-zA-Z0-9_-/.@`。 |
| key_alias_pattern | string | `None` | 每個 `key_alias` 在 `/key/generate`、`/key/update` 和 `/key/{key}/regenerate` 上都必須完整符合的 Regex。當 `enable_key_alias_format_validation` 啟用時，會取代內建規則。別名上限為 255 個字元。不符合的別名會被拒絕，並回傳一則命名該模式的 `400`。[進一步文件](./virtual_keys#enforce-a-key_alias-naming-pattern) |
| require_managed_files | boolean | `false` | 當 `true` 時，`POST /v1/files` 需要 `target_model_names`，並以 `400` 拒絕傳統提供者檔案上傳。用於強制使用 LiteLLM 管理檔案，以實現檔案擁有權與存取控制。[進一步文件](./litellm_managed_files#optional-enforce-managed-files-on-upload) |
| user_url_validation | boolean | `true` | 當 `true` 時，proxy 會在抓取前驗證使用者可控制的 URL（例如：當 OpenAPI `spec_path` 是一個 `http(s)` URL、圖片 URL，以及類似情況）：會解析 DNS，並封鎖連線到非全球可路由位址（RFC1918、loopback、link-local 等），除非 **URL 中的 hostname** 已列於 `user_url_allowed_hosts`。設為 `false` 可略過驗證（僅在您信任可提供 URL 的人員時使用）。**必須設定在 `litellm_settings` 底下**，而非 `general_settings`。 |
| user_url_allowed_hosts | array of strings | `[]` | 當 `user_url_validation` 為 `true` 時，允許解析為私有/內部 IP 的主機名稱。請比對主機 **在 URL 中呈現的樣子**（例如 `api.corp.internal`、`127.0.0.1`、`127.0.0.1:8080`、`[::1]:443`）。對於 split-horizon DNS，請將 public hostname 加入允許清單，而不是解析後的 `10.x` 位址。**必須設定在 `litellm_settings` 底下**，而非 `general_settings`。請參閱 [OpenAPI 的 MCP](../mcp_openapi#internal-spec-urls-ssrf) 與 [自訂程式碼防護欄](guardrails/custom_code_guardrail#blocked-destinations)。 |
| disable_copilot_system_to_assistant | boolean | `false` | **已淘汰** - GitHub Copilot API 支援 system prompts。 |
| default_team_params | object | `null` | 套用於透過 `/team/new` 建立的每個新 team 的預設參數（包含 SSO 自動建立的 teams）。會填入請求中被省略或 `null` 的欄位，但 `budget_duration` 除外：明確的 `"budget_duration": null` 會略過預設值，並建立不會重設的 budget。子欄位：`max_budget`（float）、`budget_duration`（string，例如 `"30d"`）、`tpm_limit`（integer）、`rpm_limit`（integer）、`team_member_permissions`（array of strings，例如 `["/team/daily/activity", "/key/generate"]`）、`models`（array of strings — 僅套用於 SSO 自動建立的 teams）。 |
| budget_reset_time | string | `null` (midnight) | 將在下一個版本提供（在 `v1.94.0` 之後）。以設定的 `timezone` 為準的當天/每週/每月 budget 重設的實際時間，格式為加引號的 24 小時制 `"HH:MM"` 或 `"HH:MM:SS"` 字串，例如 `"09:00"`。未設定時預設為 midnight；小於一天的持續時間會忽略它。格式錯誤的值會在啟動時使設定載入失敗。[進一步文件](./budget_reset_and_tz#configuring-the-reset-time-of-day) |
| overwrite_user_with_key_hash | boolean | `false` | 自 `v1.95.0` 起可用。當 `true` 時，會強制將傳出的 chat/completions 上的 `user` 設為呼叫該金鑰的身分，覆寫任何用戶端提供的值，並在未提供時也會設定：虛擬金鑰的 sha256 hash（在支出記錄中等於 `user_api_key_hash`）或 master-key 請求的 `litellm_proxy_master_key` 別名。提供穩定、不可竄改的終端使用者 id，因此 provider 端以 `user` 為鍵的濫用監控或其他處理可對應回單一金鑰。僅影響經 proxy 驗證的金鑰；custom-auth 與 JWT 請求不受影響。[進一步文件](./virtual_keys#overwrite-outgoing-user-with-the-key-hash) |
| drop_params | boolean | `false` | 若為 true，會靜默捨棄目標提供者不支援的任何請求參數，而不是拋出錯誤。也可透過環境變數 `LITELLM_DROP_PARAMS=true` 設定。[進一步文件](../completion/drop_params) |
| add_function_to_prompt | boolean | `false` | 若為 true，當提供者不支援 function/tool calling 時，會將 function 定義附加到 prompt，而不是拋出錯誤。 |
| ssl_verify | boolean or string | `true` | 控制送往 LLM 的外送請求之 TLS 憑證驗證。設為 `false` 可停用驗證，或設為 CA bundle 的字串路徑。 |
| return_response_headers | boolean | `false` | 若為 true，會在回應上顯示提供者的 rate-limit 回應標頭（例如 `x-ratelimit-remaining-requests`）。 |
| max_budget | float | `0` (no cap) | 此執行個體跨所有提供者的全域支出上限（USD）。`0` 表示停用上限。 |
| max_internal_user_budget | float | `null` | 套用於每位內部使用者的預設最大 budget（USD）。`null` 表示沒有每位使用者的上限。[進一步文件](./self_serve#set-default-max-budget-for-internal-users) |
| default_max_internal_user_budget | float | `null` | 當 `max_internal_user_budget` 未設定時，供內部使用者使用的備用最大 budget（USD）。`null` 表示沒有上限。 |
| max_ui_session_budget | float | `1.0` | 每次 Admin UI 登入 session 的最大支出（USD）（playground、test connection）。`null` 會停用上限。 |
| store_audit_logs | boolean | `null` | 若為 true，會為金鑰、teams 和 users 的建立/更新/刪除動作寫入稽核記錄。未設定時，會讀取 `LITELLM_STORE_AUDIT_LOGS` 環境變數；若該變數也未設定，則企業部署會開啟稽核記錄，否則關閉。 |
| default_key_generate_params | object | `null` | 當呼叫端未提供時，套用於 `/key/generate` 請求的預設參數。[進一步文件](./virtual_keys#default-keygenerate-params) |
| upperbound_key_generate_params | object | `null` | 強制套用於 `/key/generate` 參數的硬性上限（例如最大 `max_budget`、`duration`）；超出上限的請求會被拒絕。[進一步文件](./virtual_keys#upperbound-keygenerate-params) |
| default_internal_user_params | object | `null` | 套用於首次 SSO 登入時自動建立的內部使用者之預設參數（角色、模型、budget）。[進一步文件](./self_serve) |

| default_team_settings | objects 陣列 | `null` | 每個團隊的預設記錄設定，每個項目以 `team_id` 為鍵（例如：團隊專屬的 Langfuse 憑證）。在啟動時會依據 `TeamDefaultSettings` 驗證。 |

### 一般設定 - 參考 {#general_settings---reference}

| 名稱 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| completion_model | string | `null` | 要用於所有 completions 的模型，會覆寫請求中指定的任何 `model` |
| enable_drain_endpoint | boolean | `false` | 若為 true，會公開未經驗證的 `GET /health/drain` 端點，供 Kubernetes `preStop` hooks 在關機前排空進行中的請求。預設為關閉；只有在健康連接埠僅可從叢集內部存取時才啟用，因為任何能連到它的呼叫者都可以將 pod 移出輪替。請參閱 `GRACEFUL_SHUTDOWN_TIMEOUT`。 |
| drain_endpoint_token | string | `null` | `/health/drain` 端點的共享密鑰。設定後，drain 呼叫必須帶有相符的 `X-Drain-Token` 標頭（與 `secrets.compare_digest` 比對），否則會以 401 拒絕；kubelet 會從 preStop `httpGet.httpHeaders` 提供它。也可透過 `DRAIN_ENDPOINT_TOKEN` 環境變數設定。 |
| disable_spend_logs | boolean | `false` | 若為 true，則關閉將每筆交易寫入資料庫 |
| disable_spend_updates | boolean | `false` | 若為 true，則關閉所有支出更新到 DB。包含 key/user/team 的支出更新。 |
| disable_master_key_return | boolean | `false` | 若為 true，則關閉在 UI 上回傳 master key。（在 '/user/info' 端點檢查） |
| disable_env_credential_login | boolean | `false` | 預設 `false`。若為 true，Admin UI 不再接受環境憑證（`UI_USERNAME`/`UI_PASSWORD`，或在 `UI_PASSWORD` 未設定時的 master key）；只能透過資料庫使用者與 SSO 登入。請先建立一個帶密碼的 `proxy_admin` 使用者；如果太早啟用，移除此設定並重新啟動即可恢復環境登入。[停用環境憑證登入](./ui#5-create-your-own-admin-account-and-disable-environment-credential-login) |
| disable_retry_on_max_parallel_request_limit_error | boolean | `false` | 若為 true，則在達到最大平行請求限制時關閉重試 |
| disable_reset_budget | boolean | `false` | 若為 true，則關閉重設預算的排程工作 |
| disable_adding_master_key_hash_to_db | boolean | n/a | **代理程式不再讀取此項**；將 master key 雜湊寫入 DB 的程式碼已在 [litellm#8268](https://github.com/BerriAI/litellm/pull/8268) 中移除。若為 true，則關閉將 master key 雜湊儲存在 db 中 |
| disable_responses_id_security | boolean | `false` | 若為 true，則停用 response ID 安全檢查，避免使用者存取其他使用者的 response ID。若為 false（預設），response ID 會以使用者資訊加密，以確保使用者只能存取自己的回應。適用於 /v1/responses 端點 |
| allow_unmanaged_response_ids | boolean | `false` | 若為 true，允許金鑰處理此 proxy 從未發出的 response ID，例如原始提供者 ID，或是在 response ID 加密啟用前發放的 ID。若為 false（預設），因為 proxy 無法辨識其擁有者，這些 ID 會以 403 拒絕。proxy 實際發出的 ID 不論哪種情況都會進行擁有者檢查。適用於 /v1/responses 端點 |
| disable_auto_add_proxy_admin_to_teams | boolean | `false` | 當使用者呼叫 `/team/new` 時，LiteLLM 會自動將該呼叫者加入新團隊並設為團隊管理員。將此項設為 `true`，即可不再自動新增 proxy 管理員；您在 `members_with_roles` 中明確列出的成員仍會被新增，而非管理員呼叫者（例如內部使用者）仍會自動新增。也可在 Admin UI 的 **Settings > Router Settings > General Settings** 中切換。 |
| search_tool_deny_by_default | boolean | `false` | 若為 true，請求只能使用其金鑰與團隊、無金鑰團隊成員所屬團隊，或使用者（若兩者皆無）在 `object_permission.search_tools` 中列出的搜尋工具。缺少或空白的清單不授予任何權限，而且網頁搜尋攔截不再回退到預設提供者。master key 與儀表板工作階段不受影響。[更多資訊請見此處](../search/index.md#restrict-search-tool-access) |
| enforce_fallback_model_access | boolean | `false` | 預設 `false`。當 `true` 時，配置在 `router_settings`（`fallbacks`、`context_window_fallbacks`、`content_policy_fallbacks`、`default_fallbacks`）中的備援只有在呼叫的金鑰、其團隊及其專案都被允許呼叫該備援模型時才會執行；未授權的目標會被略過，且當沒有剩餘目標時會回傳主要模型的錯誤。[更多資訊請見此處](reliability#enforce-key-model-access-on-fallbacks) |
| enforce_fallback_budget | boolean | `true` | 預設 `true`。配置在 `router_settings` 中的備援只有在呼叫的金鑰與使用者仍在預算內時才會執行；超出預算的目標會被略過，且當沒有剩餘目標時會回傳主要模型的錯誤。零成本的備援目標一律允許，且主要嘗試永遠不會被阻擋。設為 `false` 可讓備援不受預算限制執行。[更多資訊請見此處](reliability#enforce-budget-on-fallbacks) |
| enable_jwt_auth | boolean | `false` | 允許 proxy 管理員透過在 claims 中包含 'litellm_proxy_admin' 的 jwt tokens 進行驗證。[JWT Tokens 文件](token_auth) |
| enforce_user_param | boolean | `false` | 若為 true，則要求所有 OpenAI 端點請求都必須有 'user' 參數。[call hooks 文件](call_hooks)|
| reject_clientside_metadata_tags | boolean | `false` | 若為 true，會拒絕包含用戶端 'metadata.tags' 的請求，以防止使用者透過送出不同的 tags 來影響預算。tags 只能從 API key metadata 繼承。 |
| missing_session_id | string | `null`（舊版行為） | 對於沒有 session id 的 LLM API 請求要如何處理（`x-litellm-session-id` 標頭、`metadata.session_id`、W3C `baggage` `session.id` 等）。`generate` 會為每個請求建立一個 id，並將其標記到 `litellm_session_id`、`litellm_trace_id` 和 `metadata.session_id`，因此 SpendLogs 中的 `session_id` 欄位與傳送給 Langfuse 等記錄回呼的 session id 會一致。`reject` 會為此類請求回傳一個 `400`。未設定則保留舊版行為，也就是 SpendLogs 會回退到 trace id，而回呼不會收到 session id。MCP 路由不受影響。 |
| disable_batch_input_file_rate_limiting | boolean | `false` | 預設 `false`。設為 `true` 可在提交批次輸入檔案時略過 TPM 與 RPM 計算。當 API key 有模型允許清單時，系統仍會讀取檔案。請參閱 [批次速率限制](../batches#how-rate-limiting-for-batches-api-works)。 |
| skip_batch_input_file_rate_limiting_for_providers | array of strings | `[]` | 為列出的提供者略過批次輸入檔案的 TPM 與 RPM 計算，例如 `["hosted_vllm"]`。LiteLLM 會根據所選路由決定提供者。當 API key 有模型允許清單時，系統仍會讀取檔案。 |
| skip_batch_input_file_rate_limiting_for_models | array of strings | `[]` | 已棄用。此設定沒有作用，且會產生啟動警告。請改用 `skip_batch_input_file_rate_limiting_for_providers` 或 `disable_batch_input_file_rate_limiting`。 |
| disable_budget_reservation | boolean | `false` | 預設 `false`。設為 `true` 可停用請求前的成本預留。這可能使並行請求超出已設定的預算；但若預算已經耗盡，請求仍會被拒絕。啟用此選項時，LiteLLM 會記錄警告。請參閱 [預算預留](./users#budget-reservation)。 |
| allowed_routes | array of strings | `null`（所有路由） | 使用者可存取的允許 proxy API 路由清單 [控制允許路由的文件](/docs/proxy/public_routes#define-public-admin-only-and-allowed-routes)|
| key_management_system | string | `null` | 指定金鑰管理系統。[密鑰管理器文件](../secret) |

| master_key | string | `null`（若未設定則回退至 `LITELLM_MASTER_KEY`） | 代理程式的主金鑰。若未設定、為空，或具有已知不安全值，代理程式將不會啟動。[設定 Virtual Keys](virtual_keys)、[代理程式因已知不安全的主金鑰而拒絕啟動](./master_key_rotations.md#proxy-refuses-to-start) |
| dangerously_permit_weak_or_unset_master_key | boolean | `false` | 僅供本機開發使用：若為 true，即使主金鑰未設定、為空，或具有已知不安全值，代理程式也會啟動，並在每次開機時記錄警告。也可透過 `LITELLM_DANGEROUSLY_PERMIT_WEAK_OR_UNSET_MASTER_KEY` 環境變數設定。[代理程式因已知不安全的主金鑰而拒絕啟動](./master_key_rotations.md#proxy-refuses-to-start) |
| database_url | string | `null`（若未設定則回退至 `DATABASE_URL`） | 資料庫連線的 URL [設定 Virtual Keys](virtual_keys) |
| database_connection_pool_limit | integer | `10` | 資料庫連線池限制 [設定 DB 連線池限制](./configs.md#configure-db-pool-limits--connection-timeouts) |
| database_connection_timeout | integer | `60`（秒） | 資料庫連線逾時，單位為秒 [設定 DB 連線池限制、逾時](./configs.md#configure-db-pool-limits--connection-timeouts) |
| database_connect_timeout | float | `null` | 對應到 Prisma [`connect_timeout`](https://www.prisma.io/docs/orm/overview/databases/postgresql) URL 參數（秒）。限制引擎在失敗前等待建立新連線的最長時間。若未設定，則使用 Prisma 內建值。 |
| database_socket_timeout | float | `null` | 對應到 Prisma [`socket_timeout`](https://www.prisma.io/docs/orm/overview/databases/postgresql) URL 參數（秒）。設定後，在此時間窗內未產生資料的閒置或緩慢連線會被關閉。**請用此項來限制 LiteLLM 的閒置 Prisma 連線。** |
| database_statement_timeout | float | `null` | Postgres [`statement_timeout`](https://www.postgresql.org/docs/current/runtime-config-client.html) 的秒數，透過 `DATABASE_URL` 以 `options=-c statement_timeout=<ms>` 傳遞。限制單一敘述可執行的最長時間，因此也限制其持有列鎖的時間。若不設定，批次寫入若超出 Prisma 用戶端的 HTTP 讀取逾時，仍會在伺服器端繼續執行，而後續寫入會在這些鎖後方排隊。未套用於 `DIRECT_URL`，因此永遠不會取消 migration。未設定表示不限制。[限制敘述與鎖定時間](configs#bounding-statement-and-lock-time) |
| database_lock_timeout | float | `null` | Postgres [`lock_timeout`](https://www.postgresql.org/docs/current/runtime-config-client.html) 的秒數，透過 `DATABASE_URL` 以 `options=-c lock_timeout=<ms>` 傳遞。限制敘述等待其他交易已持有之鎖的時間，因此被阻擋的寫入會快速失敗，而不是耗盡整個敘述預算。請保持遠低於 `database_statement_timeout`。未設定表示不限制。[限制敘述與鎖定時間](configs#bounding-statement-and-lock-time) |
| database_extra_connection_params | object | `{}` | 逃生閥——額外的 key/value 配對會原樣附加到 Prisma `DATABASE_URL` / `DIRECT_URL` 查詢字串（例如 `sslmode`、`pgbouncer`、`statement_cache_size`）。此處的 key 會覆寫 LiteLLM 設定的任何預設值。 |
| database_disable_prepared_statements | boolean | `false` | 將 `pgbouncer=true` 附加到 Prisma 連線 URL，停用伺服器端 prepared statements 的重用。請在 PgBouncer transaction pooling 後方使用，或避免 rolling schema migrations 期間的 `cached plan must not change result type` 錯誤。`pgbouncer` 中明確的 `database_extra_connection_params` key 具有優先權。[停用伺服器端 prepared statements](configs#disable-server-side-prepared-statements) |
| allow_requests_on_db_unavailable | boolean | `false` | 若為 true，即使資料庫無法連線，也允許請求成功。**僅在您於自己的 VPC 中執行 LiteLLM 時使用此項**。即使 LiteLLM 無法連線到資料庫以驗證 Virtual Key，這也會讓請求仍可運作 [資料庫暫時無法使用時的文件](prod#gracefully-handle-db-unavailability) |
| fail_closed_budget_enforcement | boolean | `false` | 當 `true` 時，預算檢查會對每個受預算限制的請求（key、team、user、organization、end-user、tag 與每個時間窗的預算）改以權威資料庫驗證支出，而不是只信任跨 pod 的 Redis 計數器；若目前支出無法從 Redis 或資料庫驗證，請求會以 `503` 被拒絕。當已設定的預算必須是硬性上限，即使 Redis 降級或重新啟動時也應如此，請使用此項；若要讓健康的、低於預算的流量不要碰到資料庫，請保持關閉。[預算強制執行文件](./users#hard-budget-enforcement-fail-closed) |
| fail_closed_rate_limit_enforcement | boolean | `false` | 當 `true` 時，tpm、rpm 或 max_parallel_requests 計數器無法從 Redis 驗證的請求，會以 `503` 被拒絕，而不是由每個執行個體的記憶體內計數器放行；後者在 N 個執行個體上最多可放行 N 倍限制。當已設定的速率限制必須是硬性上限，即使 Redis 當機也應如此，請使用此項；若要在 Redis 中斷期間持續提供服務，請保持關閉。未配置 Redis 時無效。[速率限制強制執行文件](./users#hard-rate-limit-enforcement-fail-closed) |
| custom_auth | string | `null` | 撰寫您自己的自訂驗證邏輯 [自訂驗證文件](./custom_auth) |
| max_parallel_requests | integer | `null`（沒有限制） | 每個部署允許的最大平行請求數 |
| global_max_parallel_requests | integer | `null`（沒有限制） | 代理程式整體允許的最大平行請求數 |
| max_in_flight_requests_per_worker | integer | `null`（已停用 admission control） | 每個 worker 程序可同時受理請求的上限。超過上限的請求會在有界佇列中等待，其餘請求會收到 `503` 與 `retry-after: 1`。除非設定，否則為關閉。請參見[每個 worker 的 admission control](./server_tuning#per-worker-admission-control) |
| max_queued_requests_per_worker | integer | `null`（與 `max_in_flight_requests_per_worker` 相同） | 每個 worker 在新請求到來前可等待槽位的請求數。預設為 `max_in_flight_requests_per_worker` |
| admission_queue_timeout_seconds | float | `1.0` | 預設 `1.0`。排隊中的請求若在此時間內未取得槽位，會以 `503` 被拒絕 |
| cancel_on_disconnect | boolean | `false` | 若為 true，當用戶端中斷連線時，會取消進行中的上游 LLM 請求（非串流），釋放後端容量（例如 vLLM GPU 槽位）。被取消的請求會以 499 失敗記錄。預設 `false` |
| infer_model_from_keys | boolean | `false` | 若為 true，會從提供的 keys 推斷模型 |
| background_health_checks | boolean | `false` | 若為 true，會啟用背景健康檢查。[健康檢查文件](health) |
| health_check_interval | integer | `300`（秒） | 健康檢查間隔，單位為秒 [健康檢查文件](health) |
| alerting | array of strings | `null` | 警示方法清單 [Slack 警示文件](alerting) |
| alerting_threshold | integer | `600`（秒） | 觸發警示的閾值 [Slack 警示文件](alerting) |
| use_client_credentials_pass_through_routes | boolean | n/a | **代理程式不再讀取**；pass-through 驗證檢查已在 [litellm#12847](https://github.com/BerriAI/litellm/pull/12847) 中重新設計。若為 true，則對所有 pass-through 路由使用 client credentials。[pass through 路由文件](pass_through) |
| health_check_details | boolean | `true` | 若為 false，會隱藏健康檢查詳細資訊（例如剩餘速率限制）。[健康檢查文件](health) |
| public_routes | List[str] | `[]` | （企業功能）公開路由控制清單 |
| alert_types | List[str] | `null`（所有警示類型） | 要傳送到 slack 的警示類型控制清單（警示類型文件）[./alerting.md] |
| enforced_params | List[str] | `null` | （企業功能）所有傳送到代理程式的請求都必須包含的參數清單 |

| enable_oauth2_auth | boolean | `false` | （企業功能）如果為 true，則在 LLM + info 路由上啟用 oauth2.0 驗證 |
| use_x_forwarded_for | str | `false` | 如果為 true，則使用 `X-Forwarded-For` 標頭來推導客戶端 IP，以及從 `X-Forwarded-Proto` / `X-Forwarded-Host` / `X-Forwarded-Port` 推導 proxy 的公開來源（用於 MCP OAuth，以及判定是否應將 session/SSO/SAML cookie 標記為 `Secure`，適用於終止 TLS 的反向 proxy 之後）。只有在同時設定 `mcp_trusted_proxy_ranges`，且請求對端的 IP 落在這些 CIDR 之一內時，才會採用這些標頭。對於經 ingress 的部署，請優先使用 [`PROXY_BASE_URL`](#environment-variables---reference)。請參閱 [安全最佳實務 — 在反向 proxy 後方保護 cookie](./security_best_practices#8-configure-secure-cookies-behind-a-tls-terminating-reverse-proxy) 與 [MCP OAuth — 反向 proxy 與 ingress 設定](../mcp_oauth#reverse-proxy-and-ingress-configuration)。 |
| service_account_settings | List[Dict[str, Any]] | `null` | 如果您想建立只適用於 service account 金鑰的設定，請設定 `service_account_settings`（service accounts 文件）[./service_accounts.md] |
| image_generation_model | str | `null` | 用於圖片生成的預設模型 - 會忽略請求中設定的模型 |
| store_model_in_db | boolean | `false` | 如果為 true，則啟用在 DB 中儲存模型 + 憑證資訊。 |
| supported_db_objects | List[str] | `null` | 當 `store_model_in_db` 為 True 時，可細緻控制要從資料庫載入哪些物件類型。可用類型：`"models"`、`"mcp"`、`"guardrails"`、`"vector_stores"`、`"pass_through_endpoints"`、`"prompts"`、`"model_cost_map"`。若未設定，則會載入所有物件類型（預設行為）。範例：`supported_db_objects: ["mcp"]` 以僅從 DB 載入 MCP servers。 |
| vector_store_deny_by_default | boolean | `false` | 如果為 true，請求只能使用其金鑰與團隊所列於 `object_permission.vector_stores` 的 vector store，若為無金鑰的團隊成員，則只能使用其團隊所列的 vector store；若兩者皆無，則只能使用使用者的 vector store。缺少或空的清單不會授予任何權限。主金鑰與儀表板 session 不在此限。[預設拒絕 vector store 的文件](../vector_stores/managed_vector_stores#deny-vector-stores-by-default) |
| user_mcp_management_mode | string | `null` | 控制非管理員在 MCP 儀表板上可見的內容。`restricted`（預設）只列出使用者所屬團隊明確被允許存取的 MCP servers。`view_all` 讓每位使用者都能看到完整的 MCP server 清單。Tool list/call 一律遵守每個金鑰的權限，因此使用者仍無法在沒有存取權的情況下執行 MCP 呼叫。 |
| store_prompts_in_spend_logs | boolean | `false` | 如果為 true，允許將 prompts 與 responses 儲存在 spend logs 資料表中。 |
| scope_spend_list_endpoints_to_caller | boolean | n/a | **proxy 不再讀取此設定**；`/spend/keys` 與 `/spend/users` 一律將非管理員呼叫者範圍限制在其自己的列。當 `true`（預設）時，`/spend/keys` 與 `/spend/users` 只會回傳非管理員 API 金鑰呼叫者自己的列。設定為 `false` 可停用範圍限制。請參閱 [Spend list endpoints](./cost_tracking.md#spend-list-endpoints-spendkeys-and-spendusers)。 |
| legacy_unscoped_spend_list_endpoints | boolean | n/a | **proxy 不再讀取此設定**；`/spend/keys` 與 `/spend/users` 一律將非管理員呼叫者範圍限制在其自己的列。當 `true` 時，會還原 `/spend/keys` 與 `/spend/users` 的範圍限制前行為（非管理員金鑰可列出所有列）。會覆寫 `scope_spend_list_endpoints_to_caller`。環境變數：`LITELLM_LEGACY_UNSCOPED_SPEND_LIST_ENDPOINTS`。 |
| max_request_size_mb | int | `null`（無上限） | 請求的最大大小（MB）。超過此大小的請求將被拒絕。 |
| max_response_size_mb | int | `null`（無上限） | 回應的最大大小（MB）。超過此大小的 LLM 回應將不會送出。 |
| max_batch_file_size_mb | int | `null`（無上限） | 上傳到 `/v1/files` 並搭配 `purpose="batch"` 的批次輸入檔案，其最大大小（MB）。較大的上傳會在到達提供者之前以 `413` 拒絕。未設定表示沒有上限。請參閱 [批次輸入檔案驗證](../batches#batch-input-file-validation) |
| max_batch_file_records | int | `null`（無上限） | 上傳到 `/v1/files` 並搭配 `purpose="batch"` 的批次輸入檔案中，請求行的最大數量。空白行不計算在內。超過此數量的檔案會在到達提供者之前以 `413` 拒絕。此設定以每個金鑰為單位；proxy 管理員可在金鑰的 metadata 中覆寫，並在團隊的 metadata 中新增團隊上限，而以金鑰與團隊值中較低者為準。必須是正整數。請參閱 [批次輸入檔案驗證](../batches#limit-the-number-of-records-in-a-batch-file) |
| max_batch_file_uploads_per_day | int | `null`（無上限） | 每個金鑰（或每位使用者，適用於沒有金鑰的 JWT 呼叫者）在一個 UTC 日內可上傳到 `/v1/files` 的批次輸入檔案數量。超過上限後，上傳會收到 `429`，並附帶一個 `Retry-After` 標頭，倒數至 00:00 UTC。proxy 管理員可在金鑰的 metadata 中覆寫，並在團隊的 metadata 中新增全團隊上限。必須是正整數。請參閱 [批次上傳與下載限制](../batches#batch-upload-and-download-limits) |
| max_file_downloads_per_minute | int | `null`（無上限） | 每個金鑰（或每位使用者，適用於沒有金鑰的 JWT 呼叫者）在一分鐘內可透過 `/v1/files/{file_id}/content` 下載單一檔案內容的次數。超過上限後，該檔案的下載會收到 `429`，並附帶一個 `Retry-After` 標頭；其他檔案不受影響。proxy 管理員可在金鑰的 metadata 中覆寫，並在團隊的 metadata 中新增全團隊上限。必須是正整數。請參閱 [批次上傳與下載限制](../batches#batch-upload-and-download-limits) |
| max_file_size_mb | int | `null`（無上限） | 任何 `purpose` 上傳到 `/v1/files` 的檔案最大大小（MB）。較大的上傳會在到達提供者之前以 `413` 拒絕。未設定表示沒有上限。 |
| allowed_file_extensions | List[str] | `null`（允許任何副檔名） | 上傳到 `/v1/files` 的唯一允許檔案副檔名（例如 `[".jsonl", ".pdf", ".txt"]`），適用於任何 `purpose`。會針對上傳的檔名以不區分大小寫方式比對。具有其他副檔名或沒有副檔名的檔案，會在到達提供者之前以 `400` 拒絕。空清單會拒絕每一次上傳。未設定表示不套用允許清單。請參閱 [限制檔案上傳](./security_best_practices#10-restrict-file-uploads) |
| blocked_file_extensions | List[str] | `null`（無封鎖） | 已淘汰，請改用 `allowed_file_extensions`。上傳到 `/v1/files` 的檔案副檔名（例如 `[".exe", ".sh"]`），適用於任何 `purpose`。會針對上傳的檔名以不區分大小寫方式比對。當允許清單與此設定同時存在時，仍會在允許清單之後強制執行。未設定表示沒有副檔名被封鎖。 |
| proxy_budget_rescheduler_min_time | int | `597`（秒） | 在檢查資料庫是否有 budget 重設之前，需等待的最短時間（秒）。**預設為 597 秒** |
| proxy_budget_rescheduler_max_time | int | `605`（秒） | 在檢查資料庫是否有 budget 重設之前，需等待的最長時間（秒）。**預設為 605 秒** |
| proxy_batch_write_at | int | `10`（秒） | 在批次寫入 spend logs 到資料庫之前需等待的時間（秒）。**預設為 10 秒** |
| proxy_batch_polling_interval | int | `3600`（秒） | 在輪詢批次之前需等待的時間（秒），以檢查是否已完成。輪詢器另外最多會再加入 30 秒的抖動。**預設為 3600 秒（1 小時）** |
| proxy_config_reload_interval_seconds | int | `30` | 當啟用 `store_model_in_db` 時，每個 pod 從資料庫重新載入 config-in-DB 物件（models、credentials、guardrails 等）的頻率。較低的值可加快跨 pod 一致化，但會增加 DB 負載；套用於 proxy 啟動時。環境變數：`PROXY_CONFIG_RELOAD_INTERVAL_SECONDS`。**預設為 30 秒** |

| scheduled_job_stagger | dict | `null`（啟用錯開，300 秒視窗） | 將 proxy 的排程背景工作分散到一個視窗中，而不是在每個副本上同時觸發。鍵：`enabled`（bool，預設 `true`）、`window_seconds`（int，預設 `300`）、`identity`（str，取代偏移雜湊中由 `POD_NAME`/`HOSTNAME` 衍生的部分）、`offsets`（scheduler job id 到秒數的 dict，其中 `0` 會將工作固定在未偏移的排程）。請參閱 [錯開排程工作](./prod.md#stagger-scheduled-background-jobs) |
| alerting_args | dict | `null` | Slack Alerting 的引數 [Slack Alerting 文件](./alerting.md) |
| custom_key_generate | str | `null` | 用於 key 產生的自訂函式 [自訂 key 產生文件](./virtual_keys.md#custom-keygenerate) |
| custom_key_update | str | `null` | 用於 key 更新的自訂函式。若 `custom_key_generate` 原則也應套用於 key 編輯，則為必要設定 [自訂 key 更新文件](./virtual_keys.md#custom-keyupdate) |
| custom_key_policy | str | `null` | 會在每次 key 操作（產生、更新、重新產生）時執行的自訂函式，並帶入操作與實際生效的 key 狀態 [自訂 key 原則文件](./virtual_keys.md#custom-key-policy-one-hook-for-every-key-operation) |
| allowed_ips | List[str] | `null`（所有 IP） | 允許存取 proxy 的 IP 清單。若未設定，則允許所有 IP。 |
| embedding_model | str | n/a | **proxy 不再讀取此值**；`/embeddings` 路由不會讀取它；請在請求中設定預設模型，或使用 `model_list` 別名。用於 embeddings 的預設模型 - 會忽略請求中設定的 model |
| alert_to_webhook_url | Dict[str] | `null` | [為每種警示類型指定 webhook url。](./alerting.md#map-slack-channels-to-alert-type) |
| key_management_settings | List[Dict[str, Any]] | `null` | 金鑰管理系統設定（例如 AWS KMS、Azure Key Vault）[金鑰管理文件](../secret.md) |
| allow_user_auth | boolean | `false` | （已棄用）使用者驗證的舊方法。 |
| user_api_key_cache_ttl | int | `null` | 將使用者 API 金鑰快取於記憶體中的時間（秒）。 |
| user_api_key_cache_max_size | int | `200` | 每個 worker 在其記憶體內驗證快取中保留的最大項目數（虛擬金鑰、團隊、使用者、終端使用者、成員資格等）。預設為 200。當您有比這更多的作用中金鑰時請調高，否則項目會在請求之間被逐出，而每次驗證查詢都會命中資料庫。可在執行階段從 Admin UI 的 Settings > Router Settings > General 進行編輯。 |
| disable_prisma_schema_update | boolean | `false` | 若為 true，則關閉資料庫的自動 schema 更新 |
| litellm_key_header_name | str | `null`（讀取 `Authorization`） | 若設定，允許將 LiteLLM keys 作為自訂標頭傳入。[自訂標頭文件](./virtual_keys.md#pass-litellm-key-in-custom-header) |
| moderation_model | str | `null` | 用於 moderation 的預設模型。 |
| custom_sso | str | `null` | 指向實作自訂 SSO 邏輯的 python 檔案路徑。[自訂 SSO 文件](./custom_sso.md) |
| allow_cli_sso_verification_uri_complete | boolean | `false` | 預設 `false`。當 `true` 時，`POST /sso/cli/start` 也會回傳 `verification_uri_complete`，且 `lite login` 會開啟瀏覽器驗證頁面並預先填入代碼，讓使用者只需確認即可。預設為關閉，因此代碼必須手動輸入。[CLI SSO 文件](./cli_sso.md#pre-fill-the-verification-code) |
| include_call_id_in_error_body | boolean | `false` | 預設 `false`。當 `true` 時，JSON 錯誤本文也會包含 `x-litellm-call-id` 回應標頭的值，在 OpenAI 形狀的路由上作為 `error.litellm_call_id`，以及 `/v1/messages`，並在轉送路由上作為頂層 `litellm_call_id`，因此只列印本文的用戶端仍能顯示要查找的請求名稱。[回報問題文件](./error_reference.md#reporting-a-problem) |
| allow_client_side_credentials | boolean | `false` | 若為 true，允許將用戶端端憑證傳遞給 proxy。（在測試 finetuning 模型時很有用）[用戶端端憑證文件](./virtual_keys.md) |
| admin_only_routes | List[str] | `null` | （企業功能）僅供管理員使用者存取的路由清單。[僅限管理員路由文件](/docs/proxy/public_routes#define-public-admin-only-and-allowed-routes) |
| use_azure_key_vault | boolean | `false` | 若為 true，則從 azure key vault 載入 keys |
| use_google_kms | boolean | `false` | 若為 true，則從 google kms 載入 keys |
| spend_report_frequency | str | `7d` | 指定您希望多久寄送一次支出報告（例如「1d」、「2d」、「30d」）[更多內容](./alerting.md) |
| spend_capture_rate_check | object | `null`（關閉） | 每日將 LiteLLM 擷取的支出與提供者帳單進行比對，當比率低於 `threshold`（預設 0.9）時發出警示。鍵：`providers`、`threshold`、`lookback_days`、`openai_project_ids`。需要 `OPENAI_ADMIN_KEY`。[支出擷取比率文件](./spend_capture_rate.md) |
| ui_access_mode | Literal["admin_only"] | `all` | 若設定，會將 UI 的存取限制為僅限管理員使用者。[文件](./ui.md#disable-admin-ui) |
| max_failed_login_attempts_per_source | integer | `10` | 允許來自單一來源位址的 Admin UI 登入失敗次數，跨所有使用者計算，於 `failed_login_window_seconds` 內累積；超過後會將該位址封鎖 `failed_login_block_seconds`。此值的一半（無條件捨去，至少 1）是來自該位址的單一使用者允許次數，僅會封鎖該位址與使用者配對。每位址限制僅在設定 `trusted_proxy_ranges` 時適用（`[]` 當用戶端直接連線時）；若留空，則只套用每使用者的一半限制。IPv6 位址會依 /64 分組。[文件](./ui#limit-failed-sign-in-attempts) |
| max_failed_login_attempts_per_source_overrides | dict | `null` | 依 IP 位址或 CIDR 範圍鍵入的 `max_failed_login_attempts_per_source` 每位址覆寫，例如 `{"203.0.113.7": 50, "10.0.0.0/8": 100}`。最特定的匹配優先，單一使用者允許次數會隨覆寫值的一半而定，而 `0` 會將該位址從兩種限制中豁免 |
| failed_login_window_seconds | integer | `60` | 計算 Admin UI 登入失敗嘗試次數的固定秒數視窗，從第一次失敗開始計算 |
| failed_login_block_seconds | integer | `300` | 被封鎖的位址，或位址與使用者配對，會維持被封鎖多久。來自被封鎖 key 的每次嘗試都會在驗證密碼前以 429 拒絕，且被拒絕的嘗試不會延長封鎖時間 |
| litellm_jwtauth | Dict[str, Any] | `null` | JWT 驗證設定。[文件](./token_auth.md) |
| litellm_license | str | `null` | proxy 的授權金鑰。[文件](../enterprise.md#how-do-i-set-up-and-verify-an-enterprise-license) |
| oauth2_config_mappings | Dict[str, str] | `{}` | 定義 OAuth2 設定對應 |
| pass_through_endpoints | List[Dict[str, Any]] | `null` | 定義轉送端點。[文件](./pass_through) |
| pass_through_request_timeout | float | `null` | 轉送路由（自訂端點與原生提供者轉送）的上游請求逾時，單位為秒。預設值：`600`。每端點 `timeout` 會在自訂端點上覆寫此值。在原生提供者轉送路由上，部署或路由逾時以及明確設定的 `litellm_settings.request_timeout` 會覆寫它。[文件](./pass_through#request-timeouts) |
| enable_oauth2_proxy_auth | boolean | `false` | （企業功能）若為 true，則啟用 oauth2.0 驗證 |
| forward_openai_org_id | boolean | `false` | 若為 true，則將 OpenAI Organization ID 轉送到後端 LLM 請求（若為 OpenAI）。 |

| forward_client_headers_to_llm_api | boolean | `false` | 若為 true，會將用戶端標頭（任何 `x-` 標頭與 `anthropic-beta` 標頭）轉送到後端 LLM 請求 |
| maximum_spend_logs_retention_period | str                   | `null`（已停用清理） | 用於設定資料庫中 spend logs 的最長保留時間，之後將自動清除                                                                                                                                                                                                                             |
| maximum_daily_tag_spend_retention_period | str                   | `null`（資料表永不修剪） | 刪除 `LiteLLM_DailyTagSpend` 列中日期嚴格早於保留期限的資料，於同一個清理工作中執行。請參閱 [spend logs deletion](./spend_logs_deletion) |
| maximum_spend_logs_retention_interval | str                   | `1d` | 用於設定 spend log 清理工作應執行的間隔。                                                                                                                                                                                                                                                   |
| alert_type_config | dict | `null` | 將 alert 類型對應到其處理器設定的組態對照 |
| always_include_stream_usage | boolean | `false` | 若為 true，會在每個串流回應區塊中包含用量指標 |
| sse_keepalive_ping_interval_seconds | Optional[float] | `null`（關閉） | 依據 [Timeouts](./timeout#keepalive-pings-for-idle-streaming-connections) 所述串流保活的全域預設值。套用至每個未設定自身 `keepalive_seconds` 的 deployment，以及沒有自身 deployment 的透傳路由。也涵蓋上游尚未回應的這段時間，而單一 deployment 的 `keepalive_seconds` 無法達到此處。預設為 None（關閉）。 |
| auto_redirect_ui_login_to_sso | boolean | `false` | 若為 true，會自動將 UI 登入頁面重新導向至 SSO 提供者 |
| control_plane_url | string | `null` | 管理此實例的全域控制平面的 URL。會啟用 `/v3/login` 與 `/v3/login/exchange` 端點，讓控制平面 UI 可跨來源向此實例進行驗證。與控制平面之間不共享任何狀態。[文件](./global_control_plane.md) |
| custom_auth_run_common_checks | boolean | `false` | 若為 true，會在自訂驗證旁一併執行 LiteLLM 的標準驗證檢查（key/team/user/project model allowlists、budgets、rate limits）。預設為 `false` — 請參閱 [Custom Auth — Enforce model access](/docs/proxy/custom_auth#enforce-budgets-and-model-access) |
| custom_ui_sso_sign_in_handler | string | `null` | UI 中 SSO 登入邏輯的自訂處理器 |
| database_connection_pool_timeout | integer | `60`（秒） | 資料庫連線池逾時（秒） |
| disable_error_logs | boolean | `false` | 若為 true，會停用資料庫中的錯誤追蹤與儲存 |
| enable_health_check_routing | boolean | `false` | 若為 true，會啟用以健康檢查驅動的 request routing，以避免路由到不健康的 deployments |
| background_health_check_model_groups | Optional[List[str]] | `null`（所有群組） | 供選用的 model group 名稱 allowlist，用於背景健康檢查。設定後，僅會探測列出的群組，且 health-check routing 只會套用於這些群組；未列出的群組則維持其設定的 routing 行為。預設為 None（所有群組） |
| health_check_ignore_transient_errors | boolean | `false` | 若為 true，會忽略 429（rate limit）與 408（timeout）健康檢查失敗，且不影響 routing 或冷卻時間 |
| enable_mcp_registry | boolean | `false` | 若為 true，會啟用對集中式 MCP server registry 的存取 |
| enforce_rbac | boolean | `false` | 若為 true，會為所有 proxy 操作啟用以角色為基礎的存取控制（RBAC） |
| forward_llm_provider_auth_headers | boolean | `false` | 若為 true，會將提供者特定的驗證標頭轉送到 LLM API 請求 |
| health_check_concurrency | integer | `null`（無上限） | 健康檢查操作的最大並行數量 |
| health_check_skip_disabled_background_models | boolean | `false` | 若為 true，會在隨需 `GET /health` 與相關健康檢查執行中略過對具有 `model_info.disable_background_health_check: true` 的 deployments 進行健康探測（不僅是背景迴圈）。[健康檢查文件](health) |
| health_check_staleness_threshold | integer | `600`（秒） | 將 deployments 標記為過期之前，健康檢查結果的最大年齡（秒） |
| maximum_spend_logs_cleanup_batch_size | integer | `1000` | spend log 清理期間每個 `DELETE` 陳述式刪除的列數。預設為 1000。當兩者都設定時，會覆寫 `SPEND_LOG_CLEANUP_BATCH_SIZE` 環境預設值。請參閱 [spend log deletion](spend_logs_deletion) |
| maximum_spend_logs_cleanup_max_batches | integer | `500` | 每次 spend log 清理執行中、每個資料表發出的 `DELETE` 陳述式數量，且精確就是這麼多，不多不少。預設為 500，因此在預設批次大小下，一次執行每個資料表最多刪除 500,000 列。當兩者都設定時，會覆寫 `SPEND_LOG_RUN_LOOPS` 環境預設值。請參閱 [spend log deletion](spend_logs_deletion) |
| maximum_spend_logs_cleanup_run_budget | string | `5m` | 整次 spend log 清理執行的實際時間預算，跨越其清理的每個資料表共用，格式為持續時間字串，例如 `5m`。預設為 `5m`。耗盡時，執行會停止，並在下一個 tick 從相同的 cutoff 繼續，但由於預算是在陳述式之間檢查，因此最多可能因一個批次逾時而超出。當兩者都設定時，會覆寫 `SPEND_LOG_CLEANUP_RUN_BUDGET_SECONDS` 環境預設值。請參閱 [spend log deletion](spend_logs_deletion) |
| maximum_spend_logs_cleanup_batch_timeout | string | `30s` | 套用於 spend log 清理執行所發出之每個陳述式的 Postgres `statement_timeout` 與 `lock_timeout`，格式為持續時間字串，例如 `30s`。預設為 `30s`，因此沒有任何單一陳述式能在使用者流量排隊等候時將鎖定住。被取消的陳述式會被視為批次失敗，因此不要將此值設得低於單一批次實際所需的時間。當兩者都設定時，會覆寫 `SPEND_LOG_CLEANUP_BATCH_TIMEOUT_SECONDS` 環境預設值。請參閱 [spend log deletion](spend_logs_deletion) |
| maximum_spend_logs_cleanup_cron | string | `null` | 用於排程自動 spend log 清理工作的 cron 表達式。在 weekday 欄位中請使用星期名稱（`sun`、`mon`、...），而非數字：排程器將 weekday 編號為 0=星期一到 6=星期日，這與標準 cron 不同。請參閱 [spend log deletion](spend_logs_deletion) |
| mcp_client_side_auth_header_name | string | `null` | 用於 client-side MCP server credentials 的 HTTP 標頭名稱 |
| mcp_internal_ip_ranges | list | `null`（RFC1918 + loopback） | 視為內部用於非公開 MCP server 存取控制的 CIDR 範圍 |
| mcp_required_fields | list | `null` | MCP server 提交所需欄位名稱清單 |
| mcp_trusted_proxy_ranges | list | `null` | 被信任可轉送 `X-Forwarded-*` 標頭的 proxy 之 CIDR 範圍。除了 `use_x_forwarded_for: true` 之外，MCP OAuth `authorize` 端點若要從這些標頭推導其公開 origin，且 session/SSO/SAML cookie 要在具 TLS 終止的反向 proxy 後方被標記為 `Secure` from `X-Forwarded-Proto`，此設定為必要。若未設定，標頭會被忽略，而 proxy 會退回使用請求的字面 scheme/base URL。對於已經透過 ingress 的 deployments，請優先使用 [`PROXY_BASE_URL`](#environment-variables---reference)。儘管有 `mcp_` 前綴，這是 LiteLLM 用於 `X-Forwarded-*` 標頭的一般請求信任邊界，而非僅適用於 MCP 的設定。請參閱 [Security best practices — Secure cookies behind a reverse proxy](./security_best_practices#8-configure-secure-cookies-behind-a-tls-terminating-reverse-proxy) 與 [MCP OAuth — Reverse proxy and ingress configuration](../mcp_oauth#reverse-proxy-and-ingress-configuration)。 |

| trusted_proxy_ranges | list | `null` | 受信任、可提供標頭式驗證之身分標頭的反向代理 CIDR 範圍（`enable_oauth2_proxy_auth`、`custom_ui_sso_sign_in_handler`），以及其 `X-Forwarded-For` 會提供 Admin UI 登入限制的來源位址。當用戶端直接連線時，請設為 `[]`，如此便會使用對等端位址。若留空，`X-Forwarded-For` 會被忽略，且只套用每個使用者名稱的登入限制。 [文件](./ui#limit-failed-sign-in-attempts) |
| require_end_user_mcp_access_defined | boolean | `false` | 若為 true，則要求最終使用者已明確定義 MCP 存取權限 |
| require_key_mcp_access_defined | boolean | `false` | 若為 true，當金鑰的 MCP 伺服器清單為空時，不再繼承其團隊的伺服器；團隊會成為上限，且金鑰必須明確授予 MCP 伺服器（直接或透過存取群組）。請參閱 [MCP 權限管理](../mcp_control#require-keys-to-define-their-own-mcp-access) |
| role_permissions | list | `null` | 以角色為基礎的權限設定清單 |
| search_tools | list | `null` | 啟用網頁搜尋功能的搜尋工具設定清單 |
| token_rate_limit_type | string | `total` | 速率限制計數方法："total"、"output" 或 "input" tokens |
| use_redis_transaction_buffer | boolean | `false` | 若為 true，則在寫入前將資料庫交易緩衝於 Redis 中 |
| use_shared_health_check | boolean | `false` | 若為 true，則使用 Redis 支援的共用健康檢查狀態，跨多個 proxy 執行個體共享 |
| user_header_mappings | dict | `null` | 使用查找規則將自訂請求標頭對應至使用者 ID |
| user_header_name | string | `null` | 用於從請求中擷取使用者身分的 HTTP 標頭名稱 |

### worker_registry - 參考 {#worker_registry---reference}

頂層鍵。將其設定在 [全域控制平面](./global_control_plane.md) 上，以列出其 UI 管理的獨立 proxy。

| 名稱 | 類型 | 說明 |
|------|------|-------------|
| worker_id | string | worker 的唯一識別碼。必要 |
| name | string | 顯示於 worker 選擇器中的顯示名稱。必要 |
| url | string | worker 執行個體的完整 URL，必須以 `http://` 或 `https://` 開頭。必要 |

### router_settings - 參考 {#router_settings---reference}

:::info

多數值也可透過 `litellm_settings` 設定。若看到重疊的值，則
`router_settings` 上的設定會覆寫 `litellm_settings` 上的設定。

:::

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
  tag_routing_prefix: "route:"              # string - Opt-in marker prefix (default ""). A request tag starting with this exact string is stripped and matched as an explicit routing directive, skipping the known-tag-vocabulary heuristic. Unprefixed tags keep matching as today.
  retry_policy: {                          # Dict[str, int]: retry policy for different types of exceptions
    "AuthenticationErrorRetries": 3,
    "TimeoutErrorRetries": 3,
    "RateLimitErrorRetries": 3,
    "ContentPolicyViolationErrorRetries": 4,
    "InternalServerErrorRetries": 4,
    "ServiceUnavailableErrorRetries": 4,
    "NotFoundErrorRetries": 0,             # never retry a 404
    "DefaultRetries": 2                    # retries for every error with no field of its own
  }
  allowed_fails_policy: {
    "BadRequestErrorAllowedFails": 1000, # Allow 1000 BadRequestErrors before cooling down a deployment
    "AuthenticationErrorAllowedFails": 10, # int
    "TimeoutErrorAllowedFails": 12, # int
    "RateLimitErrorAllowedFails": 10000, # int
    "ContentPolicyViolationErrorAllowedFails": 15, # int
    "InternalServerErrorAllowedFails": 20, # int
  }
  content_policy_fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for content policy violations
  fallbacks: [{"{{anthropic}}": ["my-fallback-model"]}] # List[Dict[str, List[str]]]: Fallback model for all errors
```

| 名稱 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| routing_strategy | string | `simple-shuffle` | 用於路由請求的策略。選項："simple-shuffle"、"least-busy"、"usage-based-routing"、"latency-based-routing"。預設為 "simple-shuffle"。[更多資訊請見此處](../routing) |
| redis_host | string | `null` | Redis 伺服器的主機位址。**僅在您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項** |
| redis_password | string | `null` | Redis 伺服器的密碼。**僅在您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項** |
| redis_port | string | `null` | Redis 伺服器的埠號。**僅在您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項**|
| redis_db | int | `null` | Redis 伺服器的資料庫編號。**僅在您有多個 LiteLLM Proxy 實例，且希望在它們之間共用目前的 tpm/rpm 追蹤時才設定此項**|
| content_policy_fallbacks | array of objects | `[]` | 指定內容政策違規時的備援模型。[更多資訊請見此處](reliability) |
| fallbacks | array of objects | `[]` | 指定所有類型錯誤的備援模型。[更多資訊請見此處](reliability) |
| enable_tag_filtering | boolean | `false` | 若為 true，則對請求使用基於標籤的路由 [基於標籤的路由](tag_routing) |
| enable_weighted_failover | boolean | `false` | 若為 true 且 `routing_strategy` 是 `simple-shuffle`，則單一部署上的可重試失敗會在跨群組備援前，於同一模型群組內的其他部署之間重新挑選（加權）。預設：false。 |
| fallback_access_check | Optional[FallbackAccessCheck] | `null` | 僅限 SDK。路由器在每次跨模型備援嘗試前會查詢的一個非同步謂詞 `(model, request_kwargs, llm_router) -> bool`；會略過它拒絕的目標。Proxy 會注入自己的檢查，並透過 `general_settings.enforce_fallback_model_access` 暴露。 [更多資訊請見此處](reliability#enforce-key-model-access-on-fallbacks) |
| fallback_budget_check | Optional[FallbackBudgetCheck] | `null` | 僅限 SDK。路由器在每次跨模型備援嘗試前會查詢的一個非同步謂詞 `(model, request_kwargs, llm_router) -> bool`；會略過它拒絕為超出預算的目標。Proxy 會注入自己的檢查，並透過 `general_settings.enforce_fallback_budget` 暴露。 [更多資訊請見此處](reliability#enforce-budget-on-fallbacks) |
| tag_filtering_match_any | boolean | `true` | 標籤比對行為（僅在 enable_tag_filtering=true 時）。`true`：若部署具有任何一個請求的標籤則比對；`false`：僅在部署具有所有請求的標籤時才比對 |
| tag_routing_prefix | string | `""` (off) | 預設 `""`（無操作）。以此完全相同字串開頭的請求標籤會被移除，並作為明確且受信任的路由指示來比對；不受其他情況下會從部署標籤詞彙推斷路由意圖的啟發式規則影響。未加前綴的標籤則維持現有比對方式。[基於標籤的路由](tag_routing) |
| cooldown_time | integer | `5` (seconds) | 若模型超過允許的失敗次數，將其冷卻的持續時間（秒）。 |
| disable_cooldowns | boolean | `false` | 若為 true，則停用所有模型的冷卻。 [更多資訊請見此處](reliability) |
| retry_policy | object | `null` | 指定不同類型例外的重試次數。[更多資訊請見此處](reliability) |
| allowed_fails | integer | `3` | 在將模型冷卻之前允許的失敗次數。[更多資訊請見此處](reliability) |
| allowed_fails_policy | object | `null` | 在將部署冷卻之前，針對不同錯誤類型允許的失敗次數。[更多資訊請見此處](reliability) |
| default_max_parallel_requests | Optional[int] | `null` (no limit) | 部署的預設最大平行請求數。 |
| default_priority | (Optional[int]) | `null` | 請求的預設優先順序。僅適用於 '.scheduler_acompletion()'。預設為 None。 |
| polling_interval | (Optional[float]) | `0.03` (seconds) | 輪詢佇列的頻率。僅適用於 '.scheduler_acompletion()'。預設為 3ms。 |
| max_fallbacks | Optional[int] | `5` | 呼叫結束前要嘗試的備援最大數量。 |
| default_litellm_params | Optional[dict] | `null` | 要加入所有請求的預設 litellm 參數（例如 `temperature`、`max_tokens`）。 |
| timeout | Optional[float] | `null` (uses `litellm_settings.request_timeout`) | 請求的預設逾時。預設為 10 分鐘。 |
| stream_timeout | Optional[float] | `null` (uses `timeout`) | 串流請求的預設逾時。若未設定，則使用 'timeout' 值。 |
| keepalive_seconds | Optional[float] | `null` (off) | 當上游模型靜默超過這麼多秒時，就在串流回應中送出一則 SSE `: ping` 註解，並每隔 `keepalive_seconds` 秒重複一次，直到真正內容恢復。用於防止負載平衡器或反向代理關閉看起來閒置的 SSE 連線，例如在第一個可見 token 出現前的長時間靜默思考。預設僅供操作人員使用：除非部署也設定 `allow_client_keepalive_override: true`，否則請求層級在請求主體中的 `keepalive_seconds` 會被忽略；若已設定，則請求可縮小或變更部署的值，包括透過明確的 `0` 將其停用。部署層級的 `0` 一律為硬性停用，無論是否允許覆寫，請求都無法覆寫。有效值會被限制在 1-300 秒範圍內。預設為 None（關閉）。 |
| allow_client_keepalive_override | Optional[bool] | `false` | 是否允許請求的 `keepalive_seconds` 覆寫此部署的 `keepalive_seconds`。預設為 `false`，表示對此部署而言 `keepalive_seconds` 僅供操作人員使用，任何請求層級的值都會被靜默忽略。 |
| debug_level | Literal["DEBUG", "INFO"] | `INFO` | 路由器中記錄函式庫的除錯等級。 |
| client_ttl | int | `3600` (seconds) | 快取用戶端的存活時間（秒）。 |
| cache_kwargs | dict | `{}` | 快取初始化的額外關鍵字引數。當透過 `REDIS_*` 環境變數設定時，若非字串 Redis 參數可能失敗，請使用此項。 |
| routing_strategy_args | dict | `{}` | 路由策略的額外關鍵字引數，例如最低延遲路由的預設 ttl |
| model_group_alias | dict | `{}` | 模型群組別名對應。例如 `{"claude-3-haiku": "claude-3-haiku-20240229"}` |
| num_retries | int | `2` | 一次請求的重試次數。 |
| default_fallbacks | Optional[List[str]] | `null` | 若未定義模型群組特定的備援，則要嘗試的備援。 |
| caching_groups | Optional[List[tuple]] | `null` | 用於跨模型群組快取的模型群組清單。- 例如 caching_groups=[("openai-gpt-3.5-turbo", "azure-gpt-3.5-turbo")]|
| alerting_config | AlertingConfig | `null` | [僅限 SDK 的參數] Slack 警示組態。[進一步文件](../routing.md#alerting-) |
| assistants_config | AssistantsConfig | `null` | 透過 `assistant_settings` 設定於 proxy。[進一步文件](../assistants.md) |
| set_verbose | boolean | `false` | [已棄用參數 - 請參閱 debug 文件](./debugging) 若為 true，則將記錄等級設為 verbose。 |
| retry_after | int | `0` (seconds) | 重試請求前要等待的時間（秒）。如果從 LLM API 收到 `x-retry-after`，則此值會被覆寫。 |

| provider_budget_config | ProviderBudgetConfig | `null` | 提供者預算設定。請用此項目設定 llm_provider 的預算上限。範例：每天給 OpenAI $100、每天給 Azure $100 等。 [進一步文件](./provider_budget_routing.md) |
| enable_pre_call_checks | boolean | `false` | 若為 true，則在呼叫前檢查此次請求是否在模型的 context window 內。**在 `model_info.max_input_tokens` 強制執行時為必填**。[更多資訊請見此處](reliability) |
| model_group_retry_policy | Dict[str, RetryPolicy] | `{}` | [僅 SDK 參數] 為模型群組設定重試政策。 |
| context_window_fallbacks | List[Dict[str, List[str]]] | `[]` | 用於 context window 違規的備援模型。 |
| redis_url | str | `null` | Redis 伺服器的 URL。**Redis URL 有已知的效能問題。** |
| cache_responses | boolean | `false` | 啟用快取 LLM 回應的旗標；若快取設定於 `router_settings` 下方。若為 true，則會快取回應。 |
| router_general_settings | RouterGeneralSettings | `{async_only_mode: true, pass_through_all_models: false}` 於 proxy（SDK 中為 `async_only_mode: false`）| [僅 SDK] 路由器一般設定 - 包含像 'async_only_mode' 之類的最佳化。 [文件](../routing.md#router-general-settings) |
| optional_pre_call_checks | List[str] | `null` | 要新增到路由器的呼叫前檢查清單。支援：`router_budget_limiting`、`prompt_caching`、`responses_api_deployment_check`、`encrypted_content_affinity`（需要 LiteLLM >= 1.82.3）、`deployment_affinity`、`session_affinity`、`forward_client_headers_by_model_group` |
| deployment_affinity_ttl_seconds | int | `3600`（秒） | 當啟用 `deployment_affinity` 時，使用者金鑰 → 部署親和性對應的 TTL（秒）（在 Router 初始化 / proxy 啟動時設定）。 |
| model_group_affinity_config | Dict[str, List[str]] | `null` | 每個模型群組的親和性旗標。鍵為模型群組名稱；值為要啟用的檢查清單（`deployment_affinity`、`responses_api_deployment_check`、`session_affinity`）。未列出的群組會回退到全域 `optional_pre_call_checks`。[文件](../response_api.md#per-model-group-affinity-configuration) |
| ignore_invalid_deployments | boolean | `true` 於 proxy（SDK 中為 `false`）| 若為 true，則忽略無效的部署。proxy 一律會設定此項，因此無效的模型不會阻止其餘 `model_list` 載入。 |
| auto_router_capability_limit | Optional[AutoRouterCapabilityLimit] | `null` | 僅限 SDK。路由器在每次註冊與模型寫入時都會查詢的一個可呼叫 `() -> Optional[int]`，用來決定各複雜度路由器可聲稱的每個授權自動路由器能力數量（`classifier_type: heuristic_v2`，以及操作員定義的 `tier_definitions`）；None 代表不受限。每項能力各自保有自己的計數。proxy 會注入其自身以授權為後盾的解析器（一個能力一個路由器，除非授權 `allowed_features` 包含 `auto_router`），並在 `router_settings` 中忽略此鍵。 |
| heuristic_v2_router_limit | Optional[HeuristicV2RouterLimit] | `null` | 僅限 SDK。`auto_router_capability_limit` 的目前名稱，直到 [BerriAI/litellm#39674](https://github.com/BerriAI/litellm/pull/39674) 重新命名 Router kwarg；在 `() -> Optional[int]` 路由器上的相同可呼叫 `classifier_type: heuristic_v2` 上限。 |
| search_tools | List[SearchToolTypedDict] | `null` | 用於 Search API 整合的搜尋工具設定清單。每個工具指定 search_tool_name 與 litellm_params，包含 search_provider、api_key、api_base 等。 [進一步文件](../search/index.md) |
| guardrail_list | List[GuardrailTypedDict] | `null` | 用於 guardrail 負載平衡的 guardrail 設定清單。可在多個具有相同 guardrail_name 的 guardrail 部署之間啟用負載平衡。 [進一步文件](./guardrails/guardrail_load_balancing.md) |
| enable_health_check_routing | boolean | `false` | 若為 true，則啟用以健康檢查為驅動的部署篩選，以避免將請求路由到不健康的部署 |
| background_health_check_model_groups | Optional[List[str]] | `null`（所有群組） | 背景健康檢查與健康檢查路由所適用的模型群組。在 proxy 上這通常透過 `general_settings.background_health_check_model_groups` 設定。預設為 None（所有群組） |
| health_check_staleness_threshold | integer | `600`（秒） | 快取健康檢查結果在被標記為過期前的最大秒數 |
| health_check_ignore_transient_errors | boolean | `false` | 若為 true，則忽略 429（速率限制）與 408（逾時）的健康檢查失敗，且不會影響路由或冷卻 |
| routing_groups | Optional[List[RoutingGroup]] | `null` | 各自對模型子集套用自己的路由策略的模型群組清單。每個群組都有 `group_name`、`models`（與請求的模型比對的模型名稱清單）、`routing_strategy`，以及可選的 `routing_strategy_args`。 |
| plugins | Optional[List[RoutingPlugin]] | `null` | [僅 SDK 參數] 在做出路由決策前執行的路由外掛管線。每個外掛都會實作 `async def run(context: RoutingContext) -> RoutingContext`，讀取／縮減 `candidate_models`，並附加 `signals`，供下一個外掛（或最終路由決策）讀取。若外掛將候選縮減為零，則會直接拋出錯誤，而不是回退到未篩選的池。 |

### 環境變數 - 參考 {#environment-variables---reference}

| 名稱 | 說明 |
|------|-------------|
| LITELLM_DISABLE_LOGIN_RATE_LIMIT | 設為 `true` 以關閉管理員 UI 的登入失敗限制。啟動時讀取一次。[文件](./ui#limit-failed-sign-in-attempts) |
| A2A_API_BASE | A2A 代理程式請求的基礎 URL
| ACTIONS_ID_TOKEN_REQUEST_TOKEN | 用於在 GitHub Actions 中請求 ID 的權杖
| ACTIONS_ID_TOKEN_REQUEST_URL | 用於在 GitHub Actions 中請求 ID 權杖的 URL
| AGENT365_CLIENT_ID | 網關的 Entra 應用程式註冊中，用於 `agent_365` 防護欄 On-Behalf-Of 交換的用戶端 ID
| AGENT365_CLIENT_SECRET | 網關的 Entra 應用程式註冊中，用於 `agent_365` 防護欄的用戶端密鑰
| AGENT365_TENANT_ID | `agent_365` 防護欄用於 On-Behalf-Of 權杖交換的 Entra 租用戶 ID
| AGENTOPS_ENVIRONMENT | AgentOps 記錄整合的環境
| AGENTOPS_API_KEY | AgentOps 記錄整合的 API 金鑰
| AGENTOPS_SERVICE_NAME | AgentOps 記錄整合的服務名稱
| AI21_API_BASE | AI21 的基礎 URL。預設為 https://api.ai21.com/studio/v1
| AIMLAPI_KEY | AI/ML API 影像生成中 `AIML_API_KEY` 的其他拼寫；僅在 `AIML_API_KEY` 未設定時讀取
| AIOHTTP_CONNECTOR_LIMIT | aiohttp 連接器的連線限制。設為 0 時，不套用限制。**預設為 0**
| AIOHTTP_CONNECTOR_LIMIT_PER_HOST | aiohttp 連接器每個主機的連線限制。設為 0 時，不套用限制。**預設為 0**
| AIOHTTP_KEEPALIVE_TIMEOUT | aiohttp 連線的 keep-alive 逾時（秒）。**預設為 120**
| AIOHTTP_SO_KEEPALIVE | 在 aiohttp socket 上啟用 TCP `SO_KEEPALIVE`，讓閒置的提供者連線能在 NAT/負載平衡器靜默丟棄之前被偵測並回收。**預設為 False**
| AIOHTTP_TCP_KEEPCNT | 在連線被視為已失效前，未確認的 TCP keepalive 探測次數（當 `AIOHTTP_SO_KEEPALIVE=True` 時適用）。**預設為 5**
| AIOHTTP_TCP_KEEPIDLE | aiohttp TCP 連線在送出 keepalive 探測前必須閒置的秒數（當 `AIOHTTP_SO_KEEPALIVE=True` 時適用）。**預設為 60**
| AIOHTTP_TCP_KEEPINTVL | aiohttp TCP keepalive 探測之間的秒數（當 `AIOHTTP_SO_KEEPALIVE=True` 時適用）。**預設為 30**
| AIOHTTP_TRUST_ENV | 傳遞 `trust_env=True` 到底層 aiohttp `ClientSession` 的旗標，讓 aiohttp 本身也會讀取 `~/.netrc` 以及 `SSL_CERT_FILE` / `SSL_CERT_DIR` 環境變數。代理伺服器不需要：除非設定了 `DISABLE_AIOHTTP_TRUST_ENV`，LiteLLM 已針對每個請求解析 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`。**預設為 False**
| AIOHTTP_TTL_DNS_CACHE | aiohttp 的 DNS 快取存活時間（秒）。**預設為 300**
| AKTO_GUARDRAIL_API_BASE | Akto Guardrail API 的基礎 URL（例如 `http://localhost:9090`）。供 Akto 防護欄整合使用。
| AKTO_API_KEY | 用於向 Akto Guardrail 服務驗證的 API 金鑰。
| ALEPH_ALPHA_API_BASE | Aleph Alpha 的基礎 URL。預設為 https://api.aleph-alpha.com/complete
| ALEPH_ALPHA_API_KEY | Aleph Alpha 的 API 金鑰
| ALERTING_WEBHOOK_URL | `SLACK_WEBHOOK_URL` 的提供者中立備援；當 `SLACK_WEBHOOK_URL` 未設定時，用於 Slack 格式警示（例如 Rocket.Chat 或 Mattermost 的傳入 webhook）
| ALLOWED_EMAIL_DOMAINS | 允許存取的電子郵件網域清單
| AMAZON_NOVA_API_BASE | Amazon Nova 的基礎 URL。預設為 https://api.nova.amazon.com/v1
| ANTHROPIC_AWS_API_BASE | Claude on AWS 的基礎 URL，於 `ANTHROPIC_AWS_BASE_URL` 之後讀取
| ANTHROPIC_AWS_API_KEY | Claude on AWS 的 API 金鑰。設定後，請求會攜帶此金鑰，而不是使用 AWS SigV4 簽章
| ANTHROPIC_AWS_BASE_URL | Claude on AWS 的基礎 URL，於 `ANTHROPIC_AWS_API_BASE` 之前讀取。若兩者皆未設定，端點將從已解析的 AWS 區域推導
| ANTHROPIC_AWS_WORKSPACE_ID | 隨 Claude on AWS 請求一併傳送的 Anthropic 工作區 ID，除非每個請求另行傳入工作區 ID。`ANTHROPIC_WORKSPACE_ID` 可作為備援
| ANTHROPIC_WORKSPACE_ID | `ANTHROPIC_AWS_WORKSPACE_ID` 的備援
| ANYSCALE_API_BASE | Anyscale 的基礎 URL。預設為 https://api.endpoints.anyscale.com/v1
| APISERPENT_API_BASE | APISerpent 搜尋提供者的基礎 URL
| APSCHEDULER_COALESCE | 是否將工作中多個待處理的執行合併為一次。**預設為 False**
| APSCHEDULER_MAX_INSTANCES | 每個工作的並行實例最大數。**預設為 1**
| APSCHEDULER_MISFIRE_GRACE_TIME | 逾時未執行工作的寬限時間（秒）。**預設為 1**
| APSCHEDULER_REPLACE_EXISTING | 是否以相同 ID 的工作取代既有工作。**預設為 False**
| ARIZE_API_KEY | Arize 平台整合的 API 金鑰
| ARIZE_SPACE_KEY | Arize 平台的空間金鑰
| ARGILLA_BATCH_SIZE | Argilla 記錄的批次大小
| ARGILLA_API_KEY | Argilla 平台的 API 金鑰
| ARGILLA_SAMPLING_RATE | Argilla 記錄的抽樣率
| ARGILLA_DATASET_NAME | Argilla 記錄的資料集名稱
| ARGILLA_BASE_URL | Argilla 服務的基礎 URL
| ARK_API_BASE | Volcengine Ark 回應的基礎 URL，於 `VOLCENGINE_API_BASE` 之後讀取
| ATHINA_API_KEY | Athina 服務的 API 金鑰
| ATHINA_BASE_URL | Athina 服務的基礎 URL（預設為 `https://log.athina.ai`）
| AUTO_REDIRECT_UI_LOGIN_TO_SSO | 當已設定 SSO 時，啟用將 UI 登入頁面自動重新導向至 SSO 的旗標。預設為 **false**
| AUDIO_SPEECH_CHUNK_SIZE | 音訊語音處理的區塊大小。預設為 1024
| ANTHROPIC_API_KEY | Anthropic 服務的 API 金鑰。驗證時使用 `x-api-key` 標頭。
| ANTHROPIC_AUTH_TOKEN | Anthropic 服務的替代驗證權杖。使用 `Authorization: Bearer` 標頭取代 `x-api-key`。當 `ANTHROPIC_API_KEY` 未設定時作為備援。
| ANTHROPIC_API_BASE | Anthropic API 的基礎 URL。預設為 https://api.anthropic.com
| ANTHROPIC_BASE_URL | 設定 Anthropic API 基礎 URL 時，可作為 `ANTHROPIC_API_BASE` 的替代。當 `ANTHROPIC_API_BASE` 未設定時作為備援。
| ANTHROPIC_TOKEN_COUNTING_BETA_VERSION | Anthropic token 計數 API 的 beta 版本標頭。預設為 `token-counting-2024-11-01`
| AWS_ACCESS_KEY_ID | AWS 服務的存取金鑰 ID
| AWS_BATCH_ROLE_ARN | AWS IAM 角色的 ARN，用於批次作業
| AWS_BEDROCK_RUNTIME_ENDPOINT | Bedrock runtime 的端點 URL，當每個請求未傳入 `api_base` 或 `aws_bedrock_runtime_endpoint` 時使用。會覆寫 LiteLLM 原本會從 AWS 區域推導的端點
| AWS_DEFAULT_REGION | 若未設定 AWS_REGION，則用於服務互動的預設 AWS 區域
| AWS_PROFILE_NAME | 要使用的 AWS CLI 設定檔名稱
| AWS_REGION | 用於服務互動的 AWS 區域（優先於 AWS_DEFAULT_REGION）
| AWS_REGION_NAME | 用於服務互動的預設 AWS 區域
| AWS_ROLE_ARN | 用於驗證而假設的 AWS IAM 角色 ARN
| AWS_ROLE_NAME | AWS IAM 使用的角色名稱
| AWS_S3_BUCKET_NAME | 用於檔案操作的 AWS S3 儲存貯體名稱
| AWS_S3_OUTPUT_BUCKET_NAME | 用於批次作業的 AWS S3 輸出儲存貯體名稱
| AWS_SECRET_ACCESS_KEY | AWS 服務的秘密存取金鑰
| AWS_SESSION_NAME | AWS 工作階段名稱
| AWS_WEB_IDENTITY_TOKEN | AWS 的 web identity 權杖
| AWS_WEB_IDENTITY_TOKEN_FILE | 含有 AWS web identity 權杖的檔案路徑
| AZURE_API_VERSION | 使用中的 Azure API 版本
| AZURE_AI_API_BASE | Azure AI 服務的基礎 URL（例如 Azure AI Anthropic）
| AZURE_AI_API_KEY | Azure AI 服務的 API 金鑰（例如 Azure AI Anthropic）
| AZURE_AUTHORITY_HOST | Azure authority 主機 URL
| AZURE_CERTIFICATE_PASSWORD | Azure OpenAI 憑證密碼
| AZURE_CLIENT_ID | Azure 服務的用戶端 ID
| AZURE_CLIENT_SECRET | Azure 服務的用戶端密鑰
| AZURE_COMPUTER_USE_INPUT_COST_PER_1K_TOKENS | Azure Computer Use 服務每 1K tokens 的輸入成本
| AZURE_COMPUTER_USE_OUTPUT_COST_PER_1K_TOKENS | Azure Computer Use 服務每 1K tokens 的輸出成本
| AZURE_DEFAULT_RESPONSES_API_VERSION | 使用中的 Azure Default Responses API 版本。預設為 "preview"
| AZURE_DOCUMENT_INTELLIGENCE_API_VERSION | Azure Document Intelligence 服務的 API 版本
| AZURE_DOCUMENT_INTELLIGENCE_DEFAULT_DPI | Azure Document Intelligence 服務的預設 DPI（每英吋點數）設定
| AZURE_SPEECH_API_BASE | Azure Speech 語音轉錄的基礎 URL
| AZURE_SPEECH_API_KEY | Azure Speech 語音轉錄的 API 金鑰
| AZURE_TENANT_ID | Azure Active Directory 的租用戶 ID
| AZURE_USERNAME | Azure 服務的使用者名稱，與 AZURE_PASSWORD 一併用於 azure ad token 的基本使用者名稱/密碼工作流程

| AZURE_PASSWORD | Azure 服務的密碼，與 AZURE_USERNAME 搭配使用，以透過基本使用者名稱/密碼工作流程取得 azure ad 權杖
| AZURE_FEDERATED_TOKEN_FILE | Azure 聯合權杖的檔案路徑
| AZURE_FILE_SEARCH_COST_PER_GB_PER_DAY | Azure File Search 服務每天每 GB 的成本
| AZURE_POSTGRESQL_AUTH | 設為 `True`，即可使用短效 Microsoft Entra ID 存取權杖驗證 Azure Database for PostgreSQL Flexible Server。LiteLLM 會透過 Azure Identity 程式庫請求 `https://ossrdbms-aad.database.windows.net/.default` 範圍的權杖，並在其到期前重新整理。不可與 `IAM_TOKEN_DB_AUTH` 搭配使用。需要 `DATABASE_HOST`、`DATABASE_USER` 和 `DATABASE_NAME`。關於身分選項與 AKS 工作負載身分設定，請參閱 [`--azure_postgresql_auth`](./cli#--azure_postgresql_auth)。 |
| AZURE_SCOPE | 用於 EntraID 驗證的 Azure 服務範圍，預設為 "https://cognitiveservices.azure.com/.default"
| AZURE_SENTINEL_DCR_IMMUTABLE_ID | Azure Sentinel 記錄的資料收集規則不可變 ID
| AZURE_SENTINEL_STREAM_NAME | Azure Sentinel 記錄的串流名稱
| AZURE_SENTINEL_AUDIT_STREAM_NAME | Azure Sentinel 稽核記錄的串流名稱；若未設定，則回退至 AZURE_SENTINEL_STREAM_NAME
| AZURE_SENTINEL_CLIENT_SECRET | Azure Sentinel 驗證的用戶端密鑰
| AZURE_SENTINEL_ENDPOINT | Azure Sentinel 記錄的端點
| AZURE_SENTINEL_TENANT_ID | Azure Sentinel 驗證的租用戶 ID
| AZURE_SENTINEL_CLIENT_ID | Azure Sentinel 驗證的用戶端 ID
| AZURE_SENTINEL_AUTHORITY_HOST | Azure Sentinel 記錄的 Microsoft Entra authority host，例如 Azure Government 的 "https://login.microsoftonline.us"；若未設定，則回退至 AZURE_AUTHORITY_HOST，接著回退至 Azure Public Cloud authority
| AZURE_KEY_VAULT_URI | Azure Key Vault 的 URI
| AZURE_OPERATION_POLLING_TIMEOUT | Azure 作業輪詢的逾時秒數
| AZURE_STORAGE_ACCOUNT_KEY | 用於 Azure Blob Storage 記錄驗證的 Azure 儲存體帳戶金鑰
| AZURE_STORAGE_ACCOUNT_NAME | 用於將記錄寫入 Azure Blob Storage 的 Azure 儲存體帳戶名稱
| AZURE_STORAGE_FILE_SYSTEM | 用於將記錄寫入 Azure Blob Storage 的 Azure 儲存體檔案系統名稱。（通常為容器名稱）
| AZURE_STORAGE_TENANT_ID | 用於 Azure Blob Storage 記錄驗證的應用程式租用戶 ID
| AZURE_STORAGE_CLIENT_ID | 用於 Azure Blob Storage 記錄驗證的應用程式用戶端 ID
| AZURE_STORAGE_CLIENT_SECRET | 用於 Azure Blob Storage 記錄驗證的應用程式用戶端密鑰
| AZURE_STORAGE_ENDPOINT_SUFFIX | 用於 Azure Blob Storage 記錄的儲存體端點尾碼，例如 Azure Government 的 core.usgovcloudapi.net。預設為 core.windows.net
| AZURE_VECTOR_STORE_COST_PER_GB_PER_DAY | Azure Vector Store 服務每天每 GB 的成本
| BACKGROUND_HEALTH_CHECK_MAX_TOKENS | 當模型沒有 `health_check_max_tokens` 時，proxy 背景健康檢查中 `max_tokens` 的可選全域預設值。若未設定，非萬用字元模型預設為 5。設定時會套用至萬用字元路由。預設為未設定
| BACKGROUND_HEALTH_CHECK_MAX_TOKENS_REASONING | 對於**非萬用字元**推理模型（`supports_reasoning(model)=true`），設定時此值會優先於 `BACKGROUND_HEALTH_CHECK_MAX_TOKENS`。若未設定，推理模型會回退至 `BACKGROUND_HEALTH_CHECK_MAX_TOKENS`（若有設定）或預設行為。萬用字元路由會忽略此設定。預設為未設定
| BACKGROUND_INTERACTION_COST_POLLING_ENABLED | 設為 `false`，即可停止 proxy 輪詢 `background=true` Interactions API 請求以取得其最終用量。這些請求的成本將不再被追蹤。預設為 `true`
| BACKGROUND_INTERACTION_COST_POLL_INITIAL_INTERVAL_SECONDS | 背景互動第一次輪詢前的延遲秒數。每次重試時，間隔會加倍。預設為 5
| BACKGROUND_INTERACTION_COST_POLL_MAX_INTERVAL_SECONDS | 背景互動輪詢間隔回退的上限秒數。預設為 60
| BACKGROUND_INTERACTION_COST_POLL_TIMEOUT_SECONDS | 在放棄並釋放其預算保留之前，持續輪詢背景互動的秒數。預設為 3600（1 小時）
| BASETEN_API_BASE | Baseten 的基礎 URL。預設為 https://inference.baseten.co/v1
| BATCH_STATUS_POLL_INTERVAL_SECONDS | 輪詢批次狀態的間隔秒數。預設為 3600（1 小時）
| BATCH_STATUS_POLL_MAX_ATTEMPTS | 輪詢批次狀態的最大嘗試次數。預設為 24（24 小時）
| BEDROCK_API_BASE | Bedrock 重新排序請求的基礎 URL
| BEDROCK_MANTLE_API_BASE | Bedrock Mantle 的基礎 URL
| BEDROCK_MAX_POLICY_SIZE | Bedrock 原則的最大大小。預設為 75
| BEDROCK_MIN_THINKING_BUDGET_TOKENS | Bedrock 推理模型的最小思考預算（以 token 計）。如果 budget_tokens 低於此值，Bedrock 會回傳 400 錯誤。較低的請求值會被限制為此最小值。預設為 1024
| BFL_API_BASE | Black Forest Labs 圖像生成與編輯的基礎 URL
| BLACK_FOREST_LABS_API_KEY | Black Forest Labs 的 API 金鑰，於 `BFL_API_KEY` 之後讀取
| BRAINTRUST_API_KEY | Braintrust 整合的 API 金鑰
| BRAINTRUST_API_BASE | Braintrust API 的基礎 URL。預設為 https://api.braintrustdata.com/v1
| BRAINTRUST_MOCK | 啟用 Braintrust 整合測試的模擬模式。設為 true 時，會攔截 Braintrust API 呼叫並回傳模擬回應，而不會實際發出網路呼叫。預設為 false
| BRAINTRUST_MOCK_LATENCY_MS | 啟用模擬模式時，Braintrust API 呼叫的模擬延遲（毫秒）。模擬網路往返時間。預設為 100ms
| BRAVE_API_BASE | Brave 搜尋提供者的基礎 URL
| CACHED_STREAMING_CHUNK_DELAY | 快取串流區塊的延遲秒數。預設為 0.02
| CEREBRAS_API_BASE | Cerebras 的基礎 URL。預設為 https://api.cerebras.ai/v1
| CHATGPT_API_BASE | ChatGPT API 的基礎 URL。預設為 https://chatgpt.com/backend-api/codex
| CHATGPT_AUTH_FILE | ChatGPT 驗證資料的檔案名稱。預設為 "auth.json"
| CHATGPT_DEFAULT_INSTRUCTIONS | ChatGPT 提供者的預設系統指示
| CHATGPT_ORIGINATOR | ChatGPT API 請求的 originator 識別碼。預設為 "codex_cli_rs"
| CHATGPT_TOKEN_DIR | 儲存 ChatGPT 驗證權杖的目錄。預設為 "~/.config/litellm/chatgpt"
| CHATGPT_USER_AGENT | ChatGPT API 請求的自訂 user agent 字串
| CHATGPT_USER_AGENT_SUFFIX | 要附加到 ChatGPT user agent 字串的尾碼
| CIRCLE_OIDC_TOKEN | CircleCI 的 OpenID Connect 權杖
| CIRCLE_OIDC_TOKEN_V2 | CircleCI 的 OpenID Connect 權杖第 2 版
| CLI_JWT_EXPIRATION_HOURS | CLI 產生的 JWT 權杖到期時間（小時）。預設為 24 小時。也可透過 LITELLM_CLI_JWT_EXPIRATION_HOURS 設定
| CLI_SSO_CLAIM_MAP | 以逗號分隔的允許清單，將 OIDC claim 路徑對應至 LiteLLM 使用者 `metadata` 金鑰，用於 CLI SSO（例如 `employment_type->acme_employment_type,org_info.department->department`）。純量值也會以 `/sso/cli/poll` 的形式回傳為 `attribution_metadata`。別名：`LITELLM_CLI_SSO_CLAIM_MAP`
| CLICKHOUSE_DATABASE | 當 tracing 使用 ClickHouse store 時，LiteLLM 寫入 spend logs 與 traces 的 ClickHouse 資料庫。預設 `litellm`
| CLICKHOUSE_FLUSH_INTERVAL_SECONDS | LiteLLM 緩衝以供 ClickHouse 使用的資料列之間的秒數，例如 tracing 開啟時的 spend logs。若批次已滿，會提早 flush。預設 `1.0`
| CLICKHOUSE_URL | 當 tracing 使用 ClickHouse store 時，LiteLLM 寫入 spend logs 與 traces 的 ClickHouse HTTP 端點，例如 `http://default:<password>@clickhouse:8123`。ClickHouse tracing 必填。請參閱 [Lens](lens)
| CLOUDFLARE_API_BASE | Cloudflare Workers AI 的基礎 URL
| CLOUDZERO_API_KEY | 用於驗證的 CloudZero API 金鑰
| CLOUDZERO_CONNECTION_ID | 用於資料提交的 CloudZero 連線 ID
| CLOUDZERO_EXPORT_INTERVAL_MINUTES | CloudZero 資料匯出作業的間隔分鐘數
| CLOUDZERO_MAX_FETCHED_DATA_RECORDS | 從 CloudZero 擷取的資料記錄最大數量
| CLOUDZERO_TIMEZONE | 日期處理的時區（預設：UTC）
| CODESTRAL_API_BASE | Codestral 的基礎 URL。預設為 https://codestral.mistral.ai/v1
| COGNITION_API_BASE | Cognition 的基礎 URL。預設為 https://api.cognition.ai/v1
| COGNITION_API_KEY | Cognition 的 API 金鑰
| COMETAPI_API_BASE | CometAPI 的基礎 URL，於 `COMETAPI_BASE_URL` 之後讀取。預設為 https://api.cometapi.com/v1
| COMETAPI_API_KEY | CometAPI 的 API 金鑰，於 `COMETAPI_KEY` 之後讀取
| COMETAPI_BASE_URL | CometAPI 圖像生成的基礎 URL，於 `COMETAPI_API_BASE` 之前讀取
| CONFIG_FILE_PATH | 組態檔案的檔案路徑
| CRW_API_BASE | FastCRW 搜尋提供者的基礎 URL
| CYBERARK_ACCOUNT | 用於密鑰管理的 CyberArk 帳戶名稱

| CYBERARK_API_BASE | CyberArk API 的基礎 URL
| CYBERARK_API_KEY | CyberArk 機密管理服務的 API 金鑰
| CYBERARK_CLIENT_CERT | 用於 CyberArk 驗證的用戶端憑證路徑
| CYBERARK_CLIENT_KEY | 用於 CyberArk 驗證的用戶端金鑰路徑
| CYBERARK_USERNAME | 用於 CyberArk 驗證的使用者名稱
| CYBERARK_SSL_VERIFY | 啟用或停用 CyberArk SSL 憑證驗證的旗標。預設為 True
| CONFIDENT_API_KEY | 用於 DeepEval 整合的 API 金鑰
| CUSTOM_TIKTOKEN_CACHE_DIR | Tiktoken 快取的自訂目錄
| CONFIDENT_API_KEY | 用於 Confident AI（Deepeval）記錄服務的 API 金鑰
| COHERE_API_BASE | Cohere API 的基礎 URL。預設為 https://api.cohere.com
| COMPETITOR_LLM_TEMPERATURE | 用於競品探索的 LLM 溫度設定。預設為 0.3
| CURSOR_API_BASE | Cursor AI 提供者整合的 API 基礎 URL。預設為 https://api.cursor.com
| DASHSCOPE_API_BASE_IMAGE | DashScope 影像生成的基礎 URL。預設為 https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
| DASHSCOPE_API_BASE_RERANK | DashScope rerank 的基礎 URL。預設為 https://dashscope.aliyuncs.com/compatible-api/v1/reranks
| DATABASE_HOST | 資料庫伺服器的主機名稱
| DATABASE_HOST_READ_REPLICA | 唯讀複本資料庫伺服器的主機名稱。僅在元件化部署於 `IAM_TOKEN_DB_AUTH=True` 或 `AZURE_POSTGRESQL_AUTH=True` 從離散的資料庫環境變數組裝 `DATABASE_URL_READ_REPLICA` 時使用
| DATABASE_NAME | 資料庫名稱
| DATABASE_NAME_READ_REPLICA | 唯讀複本的資料庫名稱（預設為 `DATABASE_NAME`）。僅在元件化部署於 `IAM_TOKEN_DB_AUTH=True` 或 `AZURE_POSTGRESQL_AUTH=True` 時使用
| DATABASE_PASSWORD | 資料庫使用者的密碼
| DATABASE_PORT | 資料庫連線的連接埠號碼
| DATABASE_PORT_READ_REPLICA | 唯讀複本的連接埠號碼（預設 5432）。僅在元件化部署於 `IAM_TOKEN_DB_AUTH=True` 或 `AZURE_POSTGRESQL_AUTH=True` 時使用
| DATABASE_SCHEMA | 資料庫中使用的結構描述名稱
| DATABASE_SCHEMA_READ_REPLICA | 唯讀複本的結構描述名稱（預設為 `DATABASE_SCHEMA`）。僅在元件化部署於 `IAM_TOKEN_DB_AUTH=True` 或 `AZURE_POSTGRESQL_AUTH=True` 時使用
| DATABASE_URL | 資料庫的連線 URL
| DATABASE_URL_READ_REPLICA | 選用的唯讀複本連線 URL。設定後，proxy 會將唯讀查詢（find_*、count、group_by、query_raw/_first）路由至此端點，而寫入仍會使用 `DATABASE_URL`。未設定時，會回退為僅寫入者行為。搭配 `IAM_TOKEN_DB_AUTH=True` 或 `AZURE_POSTGRESQL_AUTH=True` 時，讀取者 token 會與寫入者一起自動重新整理
| DATABASE_USER | 資料庫連線的使用者名稱
| DATABASE_USER_READ_REPLICA | 唯讀複本的資料庫使用者（預設為 `DATABASE_USER`）。僅在元件化部署於 `IAM_TOKEN_DB_AUTH=True` 或 `AZURE_POSTGRESQL_AUTH=True` 時使用
| DATABASE_USERNAME | 資料庫使用者的別名
| DATABRICKS_API_BASE | Databricks API 的基礎 URL
| DATABRICKS_API_KEY | 用於 Databricks API 驗證的 API 金鑰（Personal Access Token）
| DATABRICKS_CLIENT_ID | 用於 Databricks OAuth M2M 驗證的用戶端 ID（Service Principal 應用程式 ID）
| DATABRICKS_CLIENT_SECRET | 用於 Databricks OAuth M2M 驗證的用戶端密鑰
| DATABRICKS_USER_AGENT | 用於 Databricks API 請求的自訂 user agent 字串。用於合作夥伴遙測歸因
| DATAFORSEO_API_BASE | DataForSEO 搜尋提供者的基礎 URL
| DAYS_IN_A_MONTH | 用於計算的每月天數。預設為 28
| DAYS_IN_A_WEEK | 用於計算的每週天數。預設為 7
| DAYS_IN_A_YEAR | 用於計算的每年天數。預設為 365
| DEEPGRAM_API_BASE | Deepgram 語音轉錄的基礎 URL。預設為 https://api.deepgram.com/v1
| DEEPINFRA_API_BASE | DeepInfra 的基礎 URL。預設為 https://api.deepinfra.com/v1/openai
| DEEPSEEK_ANTHROPIC_API_BASE | DeepSeek 相容 Anthropic 的 `/messages` 端點的基礎 URL，會先讀取再到 `DEEPSEEK_API_BASE`
| DEEPSEEK_API_BASE | DeepSeek 的基礎 URL。預設為 https://api.deepseek.com/beta
| DISABLE_KEY_NAME | 停止在產生的金鑰上儲存縮寫金鑰名稱的旗標。該縮寫是 UI 用來識別哪把金鑰花了多少費用，因此設定此項會使費用較難歸因於特定金鑰。**預設為 False**
| DRAIN_ENDPOINT_TOKEN | 呼叫 `/health/drain` 端點時，`X-Drain-Token` 標頭所需的共享密鑰。設定後（此處或透過 `general_settings.drain_endpoint_token`），沒有匹配 token 的 drain 請求會被 401 拒絕；未設定時，端點會維持僅 opt-in 的行為。請讓 kubelet 從 preStop `httpGet.httpHeaders` 傳送它。 |
| DYNAMOAI_API_KEY | DynamoAI Guardrails 服務的 API 金鑰
| DYNAMOAI_API_BASE | DynamoAI API 的基礎 URL。預設為 https://api.dynamo.ai
| DYNAMOAI_MODEL_ID | 用於 DynamoAI 追蹤/記錄用途的模型 ID
| DYNAMOAI_POLICY_IDS | 要套用的 DynamoAI policy ID，以逗號分隔的清單
| DD_BASE_URL | Datadog 整合的基礎 URL
| EDENAI_API_BASE | Eden AI 的基礎 URL。預設為 `https://api.edenai.run/v3`；請為 EU 端點設定 `https://api.eu.edenai.run/v3`
| EDENAI_API_KEY | Eden AI 的 API 金鑰
| ELEVENLABS_API_BASE | ElevenLabs 的基礎 URL。預設為 https://api.elevenlabs.io
| EMPOWER_API_BASE | Empower 的基礎 URL。預設為 https://app.empower.dev/api/v1
| EXA_API_BASE | Exa AI 搜尋提供者的基礎 URL
| FAL_AI_API_BASE | fal.ai 影像生成的基礎 URL
| FAL_AI_QUEUE_API_BASE | 透過 `/fal_ai` 轉接路由傳遞的 fal.ai 佇列請求之基礎 URL。預設為 https://queue.fal.run
| FEATHERLESS_AI_API_BASE | Featherless AI 的基礎 URL，會先讀取再到 `FEATHERLESS_API_BASE`
| FEATHERLESS_API_BASE | `FEATHERLESS_AI_API_BASE` 的別名
| FEATHERLESS_API_KEY | `FEATHERLESS_AI_API_KEY` 的別名
| FIRECRAWL_API_BASE | Firecrawl 搜尋提供者的基礎 URL
| FIREWORKSAI_API_KEY | Fireworks AI API 金鑰的別名，會先讀取再到 `FIREWORKS_API_KEY` 和 `FIREWORKS_AI_API_KEY`
| FIREWORKS_ACCOUNT_ID | Fireworks AI 帳戶 ID；若要從 Fireworks AI 的 `/models` 端點列出模型則為必填。未設定時，此請求會以明確錯誤失敗
| FIREWORKS_AI_TOKEN | Fireworks AI API 金鑰可接受的四個名稱中最後一個，位於 `FIREWORKS_API_KEY`、`FIREWORKS_AI_API_KEY` 和 `FIREWORKSAI_API_KEY` 之後
| FIREWORKS_API_BASE | Fireworks AI 的基礎 URL。預設為 https://api.fireworks.ai/inference/v1
| FRIENDLIAI_API_KEY | FriendliAI 的 API 金鑰，並接受 `FRIENDLI_TOKEN` 作為備援
| FRIENDLI_API_BASE | FriendliAI 的基礎 URL。預設為 https://api.friendli.ai/serverless/v1
| GALADRIEL_API_BASE | Galadriel 的基礎 URL。預設為 https://api.galadriel.com/v1
| GDC_API_BASE | GDC 的基礎 URL
| GDC_API_KEY | GDC 的 API 金鑰
| GIGACHAT_ACCESS_TOKEN | 事先發行的 GigaChat 存取權杖，會直接使用，而不是在 `GIGACHAT_AUTH_URL` 交換憑證
| GIGACHAT_API_BASE | GigaChat 的基礎 URL
| GIGACHAT_API_KEY | GigaChat 的憑證，會先讀取再到 `GIGACHAT_CREDENTIALS`，並在 `GIGACHAT_AUTH_URL` 交換為存取權杖
| GIGACHAT_AUTH_URL | 用來將 GigaChat 憑證交換為存取權杖的 OAuth 權杖端點。預設為 GigaChat 生產驗證 URL
| GITHUB_API_BASE | GitHub Models 的基礎 URL。預設為 https://models.inference.ai.azure.com
| GOOGLE_PSE_API_BASE | Google Programmable Search Engine 搜尋提供者的基礎 URL
| GROQ_API_BASE | Groq 的基礎 URL。預設為 https://api.groq.com/openai/v1
| HYPERBOLIC_API_BASE | Hyperbolic 的基礎 URL
| INCEPTION_API_BASE | Inception 的基礎 URL。預設為 https://api.inceptionlabs.ai/v1
| JINA_AI_API_BASE | Jina AI embeddings 的基礎 URL。預設為 https://api.jina.ai/v1
| JINA_AI_API_KEY | Jina AI 的 API 金鑰
| JINA_AI_TOKEN | `JINA_AI_API_KEY` 的備援
| JINA_API_KEY | `JINA_AI_API_KEY` 的備援
| LANGFLOW_API_BASE | Langflow 的基礎 URL。預設為 http://localhost:7860
| LANGFLOW_API_KEY | Langflow 的 API 金鑰
| BESPOKE_API_BASE | Bespoke Nimble System One 伺服器的 HTTP(S) 基礎 URL，不含 `/v1/systemone`，供 `/bespoke/v1/systemone` 和具有 `provider: bespoke` 的 [OSS 分類器](/docs/auto_router/decision_classifiers) 使用。當未提供分類器端點時為必填 |
| BESPOKE_API_KEY | 與 `BESPOKE_API_BASE` 搭配的選用 bearer 金鑰。明確的分類器 `api_base` 僅使用其明確的 `api_key`；絕不繼承環境金鑰 |

| LAYA_API_BASE | 自架設 Laya 伺服器的 HTTP(S) 基礎 URL，不含 `/v1/systemone`，用於原生閘道決策，以及具有 `opensource_classifier_config.provider: laya` 且省略 `api_base` 的 [OSS 分類器](/docs/auto_router/decision_classifiers)。當未提供分類器端點時為必填。需要包含 [LiteLLM #43626](https://github.com/BerriAI/litellm/pull/43626) 的建置版本 |
| LAYA_API_KEY | 與 `LAYA_API_BASE` 搭配使用的選用 bearer 金鑰。具有明確 `opensource_classifier_config.api_base` 的 Laya 分類器只會使用其明確的 `api_key`；省略該金鑰則會在沒有驗證的情況下連線 |
| LEMONADE_API_KEY | Lemonade 的 API 金鑰
| LINKUP_API_BASE | Linkup 搜尋提供者的基礎 URL
| LLAMAFILE_API_KEY | llamafile 的 API 金鑰。llamafile 不需要此金鑰，因此在未設定時會使用預留值
| LLAMA_API_BASE | Llama API 的基礎 URL。預設為 https://api.llama.com/compat/v1
| MANUS_API_BASE | Manus 的基礎 URL。預設為 https://api.manus.im
| MARITALK_API_BASE | MariTalk 的基礎 URL。預設為 https://chat.maritaca.ai/api
| MARITALK_API_KEY | MariTalk 的 API 金鑰
| MISTRAL_AZURE_API_BASE | 透過 Azure AI 提供的 Mistral 模型基礎 URL
| MISTRAL_AZURE_API_KEY | 透過 Azure AI 提供的 Mistral 模型 API 金鑰
| MODELSCOPE_API_BASE | ModelScope 的基礎 URL
| MODELSCOPE_API_KEY | ModelScope 的 API 金鑰
| MORPH_API_BASE | Morph 的基礎 URL。預設為 https://api.morphllm.com/v1
| NEBIUS_API_BASE | Nebius 的基礎 URL。預設為 https://api.studio.nebius.ai/v1
| NIMBLE_API_BASE | Nimble 搜尋提供者的基礎 URL。預設為 https://sdk.nimbleway.com/v2
| NLP_CLOUD_API_BASE | NLP Cloud 的基礎 URL。預設為 https://api.nlpcloud.io/v1/gpu/
| NOVITA_API_BASE | Novita 的基礎 URL。預設為 https://api.novita.ai/v3/openai
| NSCALE_API_BASE | Nscale 的基礎 URL
| OLLAMA_API_BASE | Ollama 的基礎 URL。預設為 http://localhost:11434
| OLLAMA_API_KEY | Ollama 的 API 金鑰，適用於位於驗證代理後方的部署
| OPENAI_LIKE_API_BASE | `openai_like` 提供者的基礎 URL，用於連線至任何與 OpenAI 相容的端點
| OPENAI_LIKE_API_KEY | `openai_like` 提供者的 API 金鑰。未設定時保持空白，因為某些與 OpenAI 相容的伺服器不需要金鑰
| OPENAI_PROJECT | 傳送至 OpenAI 請求的 OpenAI 專案 ID，相當於傳入 `project`
| OR_API_KEY | OpenRouter 的 API 金鑰，於 `OPENROUTER_API_KEY` 之後讀取
| OVHCLOUD_API_BASE | OVHcloud AI Endpoints 的基礎 URL
| PARALLEL_AI_API_BASE | Parallel AI 搜尋提供者的基礎 URL
| PERPLEXITY_API_BASE | Perplexity 的基礎 URL。預設為 https://api.perplexity.ai
| PG_VECTOR_API_BASE | pgvector 向量儲存的基礎 URL
| PG_VECTOR_API_KEY | pgvector 向量儲存的 API 金鑰
| PINSTRIPES_API_KEY | Pinstripes 的 API 金鑰
| PROMETHEUS_SELECTED_INSTANCE | 當 proxy 查詢 `PROMETHEUS_URL` 以取得備援指標時，要限制使用的 Prometheus `instance` 標籤。帶有任何其他 instance 的序列都會被略過；未設定時會計算每個 instance
| QWEN_AI_PLATFORM_API_BASE | Qianwen AI Platform（中國大陸）的基礎 URL。預設為 https://dashscope.aliyuncs.com/compatible-mode/v1
| QWEN_AI_PLATFORM_API_BASE_IMAGE | Qianwen AI Platform 影像生成的基礎 URL。預設為 https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
| QWEN_AI_PLATFORM_API_BASE_RERANK | Qianwen AI Platform rerank 的基礎 URL。預設為 https://dashscope.aliyuncs.com/compatible-api/v1/reranks
| QWEN_AI_PLATFORM_API_KEY | Qianwen AI Platform 的 API 金鑰，於 `DASHSCOPE_API_KEY` 備援之前讀取
| QWENCLOUD_API_BASE | QwenCloud 的基礎 URL。預設為 https://dashscope-intl.aliyuncs.com/compatible-mode/v1
| QWENCLOUD_API_BASE_IMAGE | QwenCloud 影像生成的基礎 URL。預設為 https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
| QWENCLOUD_API_BASE_RERANK | QwenCloud rerank 的基礎 URL。預設為 https://dashscope-intl.aliyuncs.com/compatible-api/v1/reranks
| QWENCLOUD_API_KEY | QwenCloud 的 API 金鑰，於 `DASHSCOPE_API_KEY` 備援之前讀取
| REDIS_AZURE_AD_TOKEN | 啟用 Redis 的 Azure AD 驗證的旗標。請將其設為 `true`，而不是設為 token。若同時也設定了 GCP IAM 服務帳戶，則會以警告方式忽略。**預設為 False**
| REDUCTO_API_KEY | Reducto OCR 的 API 金鑰
| REPLICATE_API_BASE | Replicate 的基礎 URL。預設為 https://api.replicate.com/v1
| RUNWAYML_API_BASE | RunwayML 的基礎 URL
| RUNWAYML_API_SECRET | RunwayML 的 API 金鑰，於 `RUNWAYML_API_KEY` 之前讀取
| SAMBANOVA_API_BASE | SambaNova 的基礎 URL。預設為 https://api.sambanova.ai/v1
| SCHEDULED_JOB_SHUTDOWN_CANCEL_TIMEOUT_SECONDS | proxy 關閉時，等待已取消的排程工作記錄其結果後才放棄它們的秒數。預設 5
| SCHEDULED_JOB_SHUTDOWN_FINISH_TIMEOUT_SECONDS | proxy 關閉時，等待執行中的排程工作（spend log 清理、spend 寫入）完成後才取消它們的秒數。預設 5
| SCX_API_BASE | SCX.ai 的基礎 URL。預設為 https://api.scx.ai/v1
| SCX_API_KEY | SCX.ai 的 API 金鑰
| SEARCHAPI_API_BASE | SearchApi 搜尋提供者的基礎 URL
| SERPER_API_BASE | Serper 搜尋提供者的基礎 URL
| SONIOX_API_BASE | Soniox 的基礎 URL。預設為 https://api.soniox.com
| SONIOX_API_KEY | Soniox 的 API 金鑰
| SPACE_ID | watsonx 部署空間 ID 可接受名稱中的第四個，也是最後一個名稱，前面依序為 `WATSONX_DEPLOYMENT_SPACE_ID`、`WATSONX_SPACE_ID` 和 `WX_SPACE_ID`
| STABILITY_API_BASE | Stability AI 影像生成與編輯的基礎 URL
| TAVILY_API_BASE | Tavily 搜尋提供者的基礎 URL
| TINYFISH_AGENT_API_BASE | TinyFish Agent pass-through 的基礎 URL。預設為 https://agent.tinyfish.ai
| TINYFISH_ALLOW_AUTHENTICATED_RUNS | 設為 `true`，即可讓 TinyFish Agent pass-through 請求使用 vault 與 browser-profile 欄位
| TINYFISH_API_BASE | TinyFish 搜尋提供者的基礎 URL
| TINYFISH_COST_PER_STEP | TinyFish Agent pass-through spend 追蹤的每步美元費率。預設為 0.016
| TOGETHER_AI_API_BASE | Together AI 的基礎 URL。預設為 https://api.together.xyz/v1
| TOGETHER_AI_API_KEY | Together AI API 金鑰的別名，於 `TOGETHER_API_KEY` 之後且 `TOGETHERAI_API_KEY` 之前讀取
| TOGETHER_AI_TOKEN | Together AI API 金鑰可接受名稱中的第四個，也是最後一個名稱，前面依序為 `TOGETHER_API_KEY`、`TOGETHER_AI_API_KEY` 和 `TOGETHERAI_API_KEY`
| TOGETHER_API_KEY | Together AI API 金鑰可接受名稱中的第一個名稱，優先於 `TOGETHER_AI_API_KEY`、`TOGETHERAI_API_KEY` 和 `TOGETHER_AI_TOKEN`
| TOPAZ_API_BASE | Topaz Labs 的基礎 URL。預設為 https://api.topazlabs.com
| V0_API_BASE | v0 的基礎 URL。預設為 https://api.v0.dev/v1
| VERCEL_AI_GATEWAY_API_BASE | Vercel AI Gateway 的基礎 URL。預設為 https://ai-gateway.vercel.sh/v1
| VERTEXAI_API_BASE | Vertex AI 的基礎 URL，於 `VERTEX_API_BASE` 之前讀取
| VERTEX_API_BASE | `VERTEXAI_API_BASE` 的別名
| VERTEX_CREDENTIALS | `VERTEXAI_CREDENTIALS` 的備援：Vertex AI 服務帳戶 JSON 檔案的路徑或 JSON 本身
| VLLM_API_BASE | 自架設 vLLM 伺服器的基礎 URL
| VOLCENGINE_API_BASE | Volcengine 的基礎 URL。預設為 https://ark.cn-beijing.volces.com/api/v3
| VOYAGE_AI_API_KEY | Voyage AI API 金鑰的別名，於 `VOYAGE_API_KEY` 之後讀取
| VOYAGE_AI_TOKEN | Voyage AI API 金鑰可接受名稱中的第三個，也是最後一個名稱，前面依序為 `VOYAGE_API_KEY` 和 `VOYAGE_AI_API_KEY`
| VOYAGE_API_BASE | Voyage AI rerank 請求的基礎 URL
| WANDB_API_BASE | Weights & Biases Inference 的基礎 URL。預設為 https://api.inference.wandb.ai/v1
| WATSONX_IAM_URL | 用於將 watsonx API 金鑰交換為 bearer token 的 IBM Cloud IAM token 端點。預設為 https://iam.cloud.ibm.com/identity/token
| WATSONX_REGION | watsonx.ai 的區域，並接受 `WX_REGION`，接著是 `REGION` 作為備援
| WATSONX_SPACE_ID | watsonx.ai 的部署空間 ID，於 `WATSONX_DEPLOYMENT_SPACE_ID` 之後讀取
| WML_URL | watsonx 基礎 URL 可接受名稱中的第四個，也是最後一個名稱，前面依序為 `WATSONX_API_BASE`、`WATSONX_URL` 和 `WX_URL`
| WORKER_CONFIG | `litellm` CLI 傳遞給其啟動之 worker 程序的序列化 proxy 組態。由 CLI 本身設定；若要將 proxy 指向您自己的組態檔，請使用 `CONFIG_FILE_PATH`
| WX_API_KEY | watsonx API 金鑰的別名，在產生 IAM token 時最先讀取，且在驗證請求時於 `WATSONX_APIKEY` 和 `WATSONX_API_KEY` 之後讀取
| WX_PROJECT_ID | `WATSONX_PROJECT_ID` 的別名，並接受 `PROJECT_ID` 作為進一步的備援
| WX_REGION | `WATSONX_REGION` 的別名
| WX_SPACE_ID | `WATSONX_SPACE_ID` 的別名

| WX_URL | watsonx 基底 URL 的別名，在 `WATSONX_API_BASE` 和 `WATSONX_URL` 之後讀取
| XAI_API_BASE | xAI 的基底 URL。預設為 https://api.x.ai
| XAI_OAUTH_API_BASE | xAI OAuth 流程的基底 URL，在 `XAI_API_BASE` 之前讀取
| XAI_OAUTH_AUTH_FILE | 位於 `XAI_OAUTH_TOKEN_DIR` 內、保存由 `litellm xai-oauth login` 寫入的 xAI OAuth 權杖的檔案名稱。預設為 auth.json
| XAI_OAUTH_TOKEN_DIR | 保存 xAI OAuth 權杖檔案的目錄。預設為 ~/.config/litellm/xai_oauth
| YOUCOM_API_BASE | You.com 搜尋提供者的基底 URL
| ZAI_API_BASE | Z.ai 的基底 URL
| DD_AGENT_HOST | DataDog 代理程式的主機名稱或 IP（例如「localhost」）。設定後，記錄會傳送到代理程式，而不是直接送到 API
| DD_AGENT_PORT | 用於接收記錄的 DataDog 代理程式連接埠。預設為 10518
| DD_API_KEY | Datadog 整合的 API 金鑰
| DD_APP_KEY | Datadog Cost Management 整合的應用程式金鑰。與 DD_API_KEY 一起使用時，成本指標需要此項
| DD_BATCH_SIZE | 在清空之前緩衝的記錄事件數量。限制在 [1, 1000]；預設為 1000。如果批次超過 Datadog 的 5MB 請求限制，請降低此值（例如 50）
| DD_SITE | Datadog 的站點 URL（例如 datadoghq.com）
| DD_SOURCE | Datadog 記錄的來源識別碼
| DD_TRACER_STREAMING_CHUNK_YIELD_RESOURCE | 用於 Datadog 串流 chunk yield 追蹤的資源名稱。預設為「streaming.chunk.yield」
| DD_ENV | Datadog 記錄的環境識別碼。僅支援 `datadog_llm_observability` 回呼
| DD_SERVICE | Datadog 記錄的服務識別碼。預設為「litellm-server」
| DD_VERSION | Datadog 記錄的版本識別碼。預設為「unknown」
| DATADOG_MOCK | 啟用 Datadog 整合測試的模擬模式。設定為 true 時，會攔截 Datadog API 呼叫並回傳模擬回應，而不進行實際網路呼叫。預設為 false
| DATADOG_MOCK_LATENCY_MS | 啟用模擬模式時，Datadog API 呼叫的模擬延遲（毫秒）。模擬網路往返時間。預設為 100ms
| DEBUG_OTEL | 啟用 OpenTelemetry 的除錯模式
| DEFAULT_ALLOWED_FAILS | 在讓模型進入冷卻前允許的最大失敗次數。預設為 3
| DEFAULT_A2A_AGENT_TIMEOUT | A2A（Agent-to-Agent）協定請求的預設逾時（秒）。預設為 6000
| DEFAULT_ACCESS_GROUP_CACHE_TTL | 快取的存取群組資訊存活時間（秒）。預設為 600（10 分鐘）
| DEFAULT_ANTHROPIC_CHAT_MAX_TOKENS | Anthropic 聊天完成的預設最大 token 數。預設為 4096
| DEFAULT_BATCH_SIZE | 作業的預設批次大小。預設為 512
| DEFAULT_CHUNK_OVERLAP | RAG 文字分割器的預設重疊 chunk 數。預設為 200
| DEFAULT_CHUNK_SIZE | RAG 文字分割器的預設 chunk 大小。預設為 1000
| DEFAULT_CLIENT_DISCONNECT_CHECK_TIMEOUT_SECONDS | 檢查用戶端中斷連線的逾時（秒）。預設為 1
| DEFAULT_COOLDOWN_REDIS_READ_INTERVAL_SECONDS | 每個工作程序從 Redis 重新讀取部署冷卻狀態的頻率（秒）。較低的值可讓一個副本設定的冷卻更快傳到其他副本，但會增加 Redis 讀取次數。預設為 1
| DEFAULT_COOLDOWN_TIME_SECONDS | 失敗後讓模型進入冷卻的持續時間（秒）。預設為 5
| DEFAULT_CRON_JOB_LOCK_TTL_SECONDS | cron 工作鎖的存活時間（秒）。預設為 60（1 分鐘）
| DEFAULT_DATAFORSEO_LOCATION_CODE | DataForSEO 搜尋 API 的預設地區代碼。預設為 2250（法國）
| DEFAULT_FAILURE_THRESHOLD_PERCENT | 讓部署進入冷卻的失敗門檻百分比。預設為 0.5（50%）
| DEFAULT_FAILURE_THRESHOLD_MINIMUM_REQUESTS | 套用錯誤率冷卻前的最少請求數。可避免第一次失敗就觸發冷卻。預設為 5
| DEFAULT_FLUSH_INTERVAL_SECONDS | 清空作業的預設間隔（秒）。預設為 5
| DEFAULT_HEALTH_CHECK_INTERVAL | 健康檢查的預設間隔（秒）。預設為 300（5 分鐘）
| DEFAULT_HEALTH_CHECK_PROMPT | 健康檢查時非圖片模型使用的預設提示。預設為「test from litellm」
| DEFAULT_IMAGE_HEIGHT | 圖片的預設高度。預設為 300
| DEFAULT_IMAGE_TOKEN_COUNT | 圖片的預設 token 數。預設為 250
| DEFAULT_IMAGE_WIDTH | 圖片的預設寬度。預設為 300
| DEFAULT_IN_MEMORY_TTL | 記憶體內快取的預設存活時間（秒）。預設為 5
| DEFAULT_MANAGEMENT_OBJECT_IN_MEMORY_CACHE_TTL | 記憶體快取中管理物件（User、Team、Key、Organization）的預設存活時間（秒）。預設為 60 秒。
| DEFAULT_MAX_LRU_CACHE_SIZE | LRU 快取的預設最大大小。預設為 64
| DEFAULT_MAX_RECURSE_DEPTH | 預設最大遞迴深度。預設為 100
| DEFAULT_MAX_RECURSE_DEPTH_SENSITIVE_DATA_MASKER | 敏感資料遮罩器的預設最大遞迴深度。預設為 10
| DEFAULT_MAX_RETRIES | 預設最大重試次數。預設為 2
| DEFAULT_MAX_TOKENS | LLM 請求的預設最大 token 數。預設為 4096
| DEFAULT_MAX_TOKENS_FOR_TRITON | Triton 模型的預設最大 token 數。預設為 2000
| DEFAULT_MAX_REDIS_BATCH_CACHE_SIZE | redis 批次快取的預設最大大小。預設為 1000
| DEFAULT_MCP_SEMANTIC_FILTER_EMBEDDING_MODEL | MCP 語意工具篩選的預設嵌入模型。預設為「text-embedding-3-small」
| DEFAULT_MCP_SEMANTIC_FILTER_SIMILARITY_THRESHOLD | MCP 語意工具篩選的預設相似度門檻。預設為 0.3
| DEFAULT_MCP_SEMANTIC_FILTER_TOP_K | MCP 語意工具篩選要回傳的預設前幾名結果數。預設為 10
| MCP_NPM_CACHE_DIR | STDIO MCP 伺服器使用的 npm 快取目錄。在容器中，預設值（~/.npm）可能不存在或為唯讀。預設為 `/tmp/.npm_mcp_cache`
| LITELLM_MCP_CLIENT_TIMEOUT | MCP 用戶端連線逾時（秒）（stdio 與 HTTP/SSE 傳輸）。預設為 60
| LITELLM_MCP_TOOL_LISTING_TIMEOUT | 從 MCP 伺服器列出工具的逾時（秒）。預設為 30
| LITELLM_MCP_METADATA_TIMEOUT | 用於 OAuth 中繼資料擷取的 HTTP 用戶端逾時（秒）。預設為 10
| LITELLM_MCP_OAUTH_DISCOVERY_ON_STARTUP | 設定為 `1`、`true`、`yes` 或 `on`，可在啟動時伺服器註冊期間積極擷取遠端 MCP OAuth 中繼資料，這會讓無法連線的 OAuth 伺服器延遲閘道就緒。預設為未設定：中繼資料會在背景工作中擷取，第一次需要它的請求會加入該工作，且失敗的擷取會在冷卻後重試
| LITELLM_MCP_HEALTH_CHECK_TIMEOUT | MCP 伺服器的健康檢查逾時（秒）。預設為 10
| LITELLM_ENABLE_ADMIN_MCP | 在統一閘道或後端元件上，選擇啟用嵌入式 LiteAdmin MCP，位於 `/admin/mcp`。預設 `false`。需要有效的 `LITELLM_LICENSE`；未授權的選擇啟用會使啟動失敗。請參閱[企業部署與映像可用性](./liteadmin_mcp_enterprise.md) |
| LITELLM_ADMIN_READ_ONLY | 設為 `true` 以便透過 LiteAdmin MCP 只公開已審核的讀取作業。預設 `false`；呼叫端仍需要 `proxy_admin` 角色。[文件](./liteadmin_mcp.md#restrict-the-available-tools) |
| LITELLM_ADMIN_TOOLS | 以逗號分隔的標準工具名稱，允許透過 LiteAdmin MCP 使用。未設定時，會允許該部署上可用的所有已審核作業。與唯讀限制結合使用。[文件](./liteadmin_mcp.md#restrict-the-available-tools) |
| LITELLM_ADMIN_RESPONSE_VIEW | LiteAdmin MCP 回應模式：`full` 或 `compact`。嵌入式主機預設為 `full`，獨立連接器預設為 `compact`。精簡的已儲存結果讀取需要相同的工作程序處理序。[文件](./liteadmin_mcp_enterprise.md#tool-and-response-settings) |
| LITELLM_ADMIN_SCHEMA_MODE | LiteAdmin MCP 輸入結構描述模式：`full`（預設）或 `discovery`。探索會將參數詳細資訊延後到 `describe_admin_tool`；執行時仍會驗證完整結構描述。[文件](./liteadmin_mcp_enterprise.md#tool-and-response-settings) |
| LITELLM_MCP_PUBLIC_URL | LiteAdmin MCP 用於驗證 Host 與 Origin 標頭的公開 HTTPS 原點。未設定時，嵌入式主機會回退至 `PROXY_BASE_URL`。[文件](./liteadmin_mcp_enterprise.md#enable-the-endpoint) |
| LITELLM_ENABLE_MCP_STDIO | 設為 `true` 以允許閘道上的 stdio MCP 伺服器。**預設為 false**：無法建立或更新 stdio 伺服器，且既有伺服器不會啟動。只會從閘道的處理序環境變數讀取，而不是從 config.yaml 或資料庫中的 `environment_variables` 讀取。請參閱[新增 STDIO MCP 伺服器](../mcp#add-stdio-mcp-server)
| LITELLM_MCP_STDIO_EXTRA_COMMANDS | 以逗號分隔、允許用於 MCP stdio 傳輸的額外命令基底名稱，超出內建允許清單。範例：`my-mcp-bin`。預設為空

| MCP_OAUTH2_TOKEN_CACHE_DEFAULT_TTL | MCP OAuth2 權杖快取的預設 TTL（秒）。預設為 3600
| MCP_OAUTH2_TOKEN_CACHE_MAX_SIZE | MCP OAuth2 權杖快取中的最大項目數。預設為 200
| MCP_OAUTH2_TOKEN_CACHE_MIN_TTL | MCP OAuth2 權杖快取的最小 TTL（秒）。預設為 10
| MCP_OAUTH2_TOKEN_EXPIRY_BUFFER_SECONDS | 計算快取 TTL 時，從權杖到期時間中扣除的秒數。預設為 60
| MCP_SSO_ASSERTION_CACHE_TTL_SECONDS | 讀取 MCP `oauth2_id_jag` 路徑上 SSO 身分斷言的每個程序快取之 TTL（秒）。另一個 pod 上的登入會在一個 TTL 內變得可見。預設為 60
| MCP_PER_USER_TOKEN_DEFAULT_TTL | 儲存在 Redis 中、每位使用者的 MCP OAuth 權杖預設 TTL（秒）。預設為 43200（12 小時）
| MCP_PER_USER_TOKEN_EXPIRY_BUFFER_SECONDS | 計算 Redis TTL 時，從每位使用者的 MCP OAuth 權杖到期時間中扣除的秒數。預設為 60
| MCP_TOKEN_EXCHANGE_CACHE_MAX_SIZE | MCP OAuth2 權杖交換快取中的最大項目數。預設為 500
| MCP_TRUSTED_REDIRECT_ORIGINS | 以逗號分隔的其他 `redirect_uri` 來源允許清單，這些來源由 MCP OAuth `authorize` 端點接受，除了同源與 loopback 之外。每個項目為 `host` 或 `host:port`；`*.suffix` 前綴可匹配任何更深一層的子網域。僅限 HTTPS。請用於姊妹網域上的第一方 OAuth 用戶端（例如 `app.example.com`）。對於入口式部署中 proxy 自身來源位置不正確的情況，請改設 [`PROXY_BASE_URL`](#environment-variables---reference)。請參閱 [MCP OAuth — 反向代理與 ingress 組態](../mcp_oauth#reverse-proxy-and-ingress-configuration)。
| MCP_TRUSTED_NATIVE_REDIRECT_URIS | 受信任的原生 MCP 用戶端回呼 URI 以逗號分隔的清單，例如 `myclient://auth/callback`。會擴充內建的受信任回呼 `cursor://anysphere.cursor-mcp/oauth/callback`。每個項目都要包含回呼路徑。請參閱 [MCP OAuth：靜態 OAuth 用戶端的重新導向 URL](../mcp_oauth#static-client-redirect-urls)。 |
| DEFAULT_MOCK_RESPONSE_COMPLETION_TOKEN_COUNT | 模擬回應 completions 的預設 token 數量。預設為 20
| DEFAULT_MOCK_RESPONSE_PROMPT_TOKEN_COUNT | 模擬回應 prompts 的預設 token 數量。預設為 10
| DEFAULT_MODEL_CREATED_AT_TIME | 模型的預設建立時間戳記。預設為 1677610602
| DEFAULT_NUM_WORKERS_LITELLM_PROXY | 當未設定 `NUM_WORKERS` 時，LiteLLM proxy 的預設 worker 數量。預設為 1。**在單一容器、VM 或裸機主機上，請將 NUM_WORKERS 設為可用 vCPU 的數量**（例如 `NUM_WORKERS=8` 或 `--num_workers 8`）；CPU、記憶體和資料庫連線池都會按每個 worker 計算，因此請相應地配置主機與 `database_connection_pool_limit` 的大小。在 Kubernetes 上，請每個 pod 執行一個 worker，並改用 replicas 進行擴充，請參閱 [Production Best Practices](./prod.md#workers-and-scaling)。
| DEFAULT_PROMPT_INJECTION_SIMILARITY_THRESHOLD | prompt injection 相似度的預設閾值。預設為 0.7
| DEFAULT_POLLING_INTERVAL | 排程器的預設輪詢間隔（秒）。預設為 0.03
| DEFAULT_REASONING_EFFORT_DISABLE_THINKING_BUDGET | 預設 reasoning effort disable thinking budget。預設為 0
| DEFAULT_REASONING_EFFORT_HIGH_THINKING_BUDGET | 預設 high reasoning effort thinking budget。預設為 4096
| DEFAULT_REASONING_EFFORT_LOW_THINKING_BUDGET | 預設 low reasoning effort thinking budget。預設為 1024
| DEFAULT_REASONING_EFFORT_MAX_THINKING_BUDGET | 舊版 Anthropic 模型所使用的預設 `max` reasoning effort thinking budget，這些模型使用 `thinking.budget_tokens`（Claude 4.5 系列 + Haiku）。在 Claude 4.6/4.7 上，`max` 等級會改由 adaptive `output_config.effort=max` 進行路由，並忽略此常數。預設為 16384
| DEFAULT_REASONING_EFFORT_MEDIUM_THINKING_BUDGET | 預設 medium reasoning effort thinking budget。預設為 2048
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET | 預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET_GEMINI_2_5_FLASH | Gemini 2.5 Flash 的預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET_GEMINI_2_5_FLASH_LITE | Gemini 2.5 Flash Lite 的預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_MINIMAL_THINKING_BUDGET_GEMINI_2_5_PRO | Gemini 2.5 Pro 的預設 minimal reasoning effort thinking budget。預設為 512
| DEFAULT_REASONING_EFFORT_XHIGH_THINKING_BUDGET | 舊版 Anthropic 模型所使用的預設 `xhigh` reasoning effort thinking budget，這些模型使用 `thinking.budget_tokens`。沿用 low/medium/high 的 2&times; 進展 1024 &rarr; 2048 &rarr; 4096 &rarr; 8192。在 Claude 4.6/4.7 上，`xhigh` 等級會改由 adaptive `output_config.effort=xhigh` 進行路由，並忽略此常數。預設為 8192
| DEFAULT_REDIS_MAJOR_VERSION | 無法判定版本時，預設要假設的 Redis 主版本。預設為 7
| DEFAULT_REDIS_SYNC_INTERVAL | Redis 同步間隔（秒）的預設值。預設為 1
| DEFAULT_SEMANTIC_GUARD_EMBEDDING_MODEL | Semantic Guard（路由比對防護欄）的預設 embedding 模型。預設為 "text-embedding-3-small"
| DEFAULT_SEMANTIC_GUARD_SIMILARITY_THRESHOLD | Semantic Guard 路由比對的預設相似度閾值。預設為 0.75
| DEFAULT_REPLICATE_GPU_PRICE_PER_SECOND | Replicate GPU 每秒的預設價格。預設為 0.001400
| DEFAULT_REPLICATE_POLLING_DELAY_SECONDS | Replicate 輪詢的預設延遲（秒）。預設為 1
| DEFAULT_REPLICATE_POLLING_RETRIES | Replicate 輪詢的預設重試次數。預設為 5
| DEFAULT_SQS_BATCH_SIZE | SQS 記錄的預設批次大小。預設為 512
| DEFAULT_SQS_FLUSH_INTERVAL_SECONDS | SQS 記錄的預設清空間隔（秒）。預設為 10
| DEFAULT_S3_BATCH_SIZE | S3 記錄的預設批次大小。預設為 512
| DEFAULT_S3_FLUSH_INTERVAL_SECONDS | S3 記錄的預設清空間隔（秒）。預設為 10
| DEFAULT_S3_MAX_CONCURRENT_UPLOADS | s3_v2 記錄每次清空時可同時進行的最大 S3 PUT 上傳數。預設為 16
| DEFAULT_SLACK_ALERTING_THRESHOLD | Slack 警示的預設閾值。預設為 300
| DEFAULT_SOFT_BUDGET | LiteLLM proxy 金鑰的預設 soft budget。預設為 50.0
| DEFAULT_TRIM_RATIO | 要從 prompt 結尾修剪的 token 預設比例。預設為 0.75
| DEFAULT_GOOGLE_VIDEO_DURATION_SECONDS | google 中影片生成的預設持續時間（秒）。預設為 8
| DEFER_PYDANTIC_BUILD | 延後建置 LiteLLM 的 pydantic 模型 schema，直到每個模型第一次被使用，這可加快 proxy 啟動並降低記憶體用量。`true`、`1` 或 `on` 會啟用此功能；任何其他值都會在匯入時建置每個 schema。OpenAI 與 Anthropic SDK 也會讀取相同的變數。預設為 true
| DIRECT_URL | 服務端點的直接 URL
| DISABLE_ADMIN_UI | 切換以停用管理 UI
| LITELLM_HIDE_DEFAULT_CREDENTIALS_HINT | 用來隱藏管理 UI 登入頁面上的「Default Credentials」資訊卡的旗標（`/ui/login` 與 `/fallback/login`）。當 UI 憑證由 `UI_USERNAME` / `UI_PASSWORD` 或 SSO 管理，且關於 `admin` + `MASTER_KEY` 的硬編碼提示變得誤導或被安全掃描器標記時，這項設定很有用。**預設為 false**
| LITELLM_ENABLE_HSTS | 用來在 proxy 與 UI 回應中傳送 `Strict-Transport-Security` 回應標頭的旗標。僅在透過 HTTPS 提供服務的部署上生效。**預設為 false**
| DISABLE_AIOHTTP_TRANSPORT | 用來停用 aiohttp transport 的旗標。當此值設為 True 時，litellm 會使用 httpx 而非 aiohttp。**預設為 False**
| DISABLE_AIOHTTP_TRUST_ENV | 用來停止 LiteLLM 在 aiohttp transport 的請求上解析 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 的旗標。預設情況下，這些環境變數會在不需額外設定的情況下被遵循。對於 httpx transport（`DISABLE_AIOHTTP_TRANSPORT=True`）沒有影響，因為它一律會遵循這些變數。**預設為 False**
| DISABLE_PRISMA_HEALTH_CHECK_ON_STARTUP | 用來略過 proxy 在 Prisma 連線完成且 migration 套用後，對資料庫執行的 `SELECT 1` 驗證查詢的旗標。Prisma 連線本身不受影響；只有額外的可達性探測會被略過，因此能接受連線但無法提供查詢的資料庫，會在第一次請求時才被發現，而不是在啟動時。**預設為 False**
| DISABLE_SCHEMA_UPDATE | 切換以停用 schema 更新

| DYNAMIC_RATE_LIMIT_ERROR_THRESHOLD_PER_MINUTE | 在平行請求限流器中強制執行速率限制之前，每分鐘允許的部署失敗門檻。預設值為 1
| DOCS_DESCRIPTION | 文件頁面的說明文字
| DOCS_FILTERED | 表示已篩選文件的旗標
| DOCS_TITLE | 文件頁面的標題
| DOCS_URL | Swagger API 文件的路徑。**預設為 "/"**
| EMAIL_LOGO_URL | 電子郵件中使用的標誌 URL
| EMAIL_BUDGET_ALERT_TTL | 電子郵件預算警示的存留時間（秒）
| EMAIL_BUDGET_ALERT_MAX_SPEND_ALERT_PERCENTAGE | 觸發電子郵件預算警示的最大支出百分比
| EMAIL_SUPPORT_CONTACT | 支援聯絡電子郵件地址
| EMAIL_SIGNATURE | 所有電子郵件的自訂 HTML 頁尾／簽章。可包含用於格式化與連結的 HTML 標籤。
| EMAIL_SUBJECT_INVITATION | 邀請電子郵件的自訂主旨範本。 
| EMAIL_SUBJECT_KEY_CREATED | 金鑰建立電子郵件的自訂主旨範本。 
| EMAIL_BUDGET_ALERT_MAX_SPEND_ALERT_PERCENTAGE | 觸發警示的最大預算百分比（以小數表示：0.8 = 80%）。預設值為 0.8
| EMAIL_BUDGET_ALERT_TTL | 預算警示去重用的存留時間（秒）。預設值為 86400（24 小時）
| ENABLE_SSO_DEBUG | 啟用 [SSO debug routes](./admin_ui_sso.md#debugging-sso-jwt-fields)（`/sso/debug/login` 和 `/sso/debug/callback`）的旗標。除非設定此項，否則這些路由會回傳 404。請在除錯 SSO 設定時啟用，完成後取消設定。**預設為 false**
| ENFORCE_PRISMA_MIGRATION_CHECK | 已棄用且會被忽略。當資料庫設定在啟動時失敗（無法連線的資料庫、連線重試耗盡，或 failed `prisma migrate deploy`）時，proxy 一律會以非零狀態結束，而獨立的 migration 進入點（`litellm/proxy/prisma_migration.py`，供 Helm migrations Job 與 Docker 進入點使用）也會以相同方式失敗，因此部署永遠不會在舊版 schema 上繼續。設定此變數，或傳入 `--enforce_prisma_migration_check`，都不會改變任何事情；請將其從您的部署中移除
| ENKRYPTAI_API_BASE | EnkryptAI Guardrails API 的基礎 URL。**預設為 https://api.enkryptai.com****
| ENKRYPTAI_API_KEY | EnkryptAI Guardrails 服務的 API 金鑰
| EXPERIMENTAL_OPENAI_BASE_LLM_HTTP_HANDLER | 將 `openai` 聊天完成請求透過 LiteLLM 的共用 HTTP 處理器而非 OpenAI Python SDK client 傳送的旗標。**預設為 False**
| EXPERIMENTAL_UI_LOGIN | 控制自簽章管理 UI 工作階段權杖。當為 true 時，成功的 UI 登入會回傳一個加密權杖，其中包含使用者角色與模型存取權，且有固定 10 分鐘到期時間，而不是發出資料庫支援的虛擬金鑰。除此之外，除非明確設定為 false，proxy 會嘗試將任何不以 `sk-` 開頭的傳入權杖解密為這些工作階段權杖之一。**預設為未設定**
| FAROS_API_KEY | 傳送 LLM 使用資料到 Faros AI 的 API 金鑰
| FAROS_API_URL | Faros AI API 的基礎 URL。預設為 https://prod.api.faros.ai
| FAROS_GRAPH | LiteLLM 使用資料寫入的 Faros graph。預設為 "default"
| FAROS_ORIGIN | LiteLLM 在寫入 Faros 的列中記錄的來源。預設為 "litellm"
| FAROS_TOOL_CATEGORY | 在 Faros vcs_UserTool 列中記錄的工具類別。預設為 "LiteLLM"
| FAROS_USER_SOURCE | 在 Faros vcs_User 列中為 LiteLLM 使用者記錄的來源。預設為 "LiteLLM"
| FIREWORKS_AI_4_B | Fireworks AI 4B 模型的大小參數。預設值為 4
| FIREWORKS_AI_16_B | Fireworks AI 16B 模型的大小參數。預設值為 16
| FIREWORKS_AI_56_B_MOE | Fireworks AI 56B MOE 模型的大小參數。預設值為 56
| FIREWORKS_AI_80_B | Fireworks AI 80B 模型的大小參數。預設值為 80
| FIREWORKS_AI_176_B_MOE | Fireworks AI 176B MOE 模型的大小參數。預設值為 176
| FOCUS_PROVIDER | Focus 匯出的目標提供者（例如，`s3`）。預設為 `s3`。
| FOCUS_FORMAT | Focus 匯出的輸出格式。預設為 `parquet`。
| FOCUS_FREQUENCY | 排程的 Focus 匯出頻率（`hourly`、`daily`，或 `interval`）。預設為 `hourly`。
| FOCUS_CRON_OFFSET | 排程每小時／每日 Focus 匯出時使用的分鐘偏移量。預設為 `5` 分鐘。
| FOCUS_INTERVAL_SECONDS | 當 `frequency` 為 `interval` 時，Focus 匯出的間隔（秒）。
| FOCUS_PREFIX | 上傳 Focus 匯出檔案時使用的物件金鑰前綴（或資料夾）。預設為 `focus_exports`。
| FOCUS_S3_BUCKET_NAME | 使用 S3 目的地時，上傳 Focus 匯出檔案的 S3 bucket。
| FOCUS_S3_REGION_NAME | Focus 匯出 S3 bucket 的 AWS 區域。
| FOCUS_S3_ENDPOINT_URL | Focus 匯出 S3 client 的自訂端點（可選；對相容 S3 的儲存體很有用）。
| FOCUS_S3_ACCESS_KEY | Focus 匯出 S3 client 使用的 AWS access key ID。
| FOCUS_S3_SECRET_KEY | Focus 匯出 S3 client 使用的 AWS secret access key。
| FOCUS_S3_SESSION_TOKEN | Focus 匯出 S3 client 使用的 AWS session token（可選）。
| MAVVRIK_API_KEY | Mavvrik FOCUS 匯出整合的 API 金鑰。
| MAVVRIK_API_ENDPOINT | Mavvrik FOCUS 匯出的租戶 API 端點，例如 `https://api.mavvrik.ai/<tenant_id>`。
| MAVVRIK_CONNECTION_ID | Mavvrik FOCUS 匯出的 AI cost connection ID。
| MAVVRIK_FOCUS_MAX_ROWS | Mavvrik FOCUS 目的地每個匯出視窗的最大列數。預設值為 500000。
| FOCUS_GCS_BUCKET_NAME | 使用 GCS 目的地時，上傳 Focus 匯出檔案的 GCS bucket。
| FOCUS_GCS_PATH_SERVICE_ACCOUNT | Focus 匯出 GCS client 的 service account JSON 金鑰檔案路徑。若未設定，則回退至 Application Default Credentials。
| FUNCTION_DEFINITION_TOKEN_COUNT | 函式定義的權杖數量。預設值為 9
| GALILEO_API_KEY | Galileo Cloud（託管版）的 API 金鑰。當 `success_callback` 包含 `galileo` 時，會與 v2 spans API 搭配使用。
| GALILEO_BASE_URL | Galileo 平台的基礎 URL。對於 Galileo Cloud，請使用 `https://api.galileo.ai`。對於企業版／自架版，請在您的 console URL 中將 `console` 替換為 `api`。
| GALILEO_LOG_STREAM_ID | Galileo Cloud v2 spans 記錄用的 log stream ID（可選）。
| GALILEO_PASSWORD | Galileo enterprise Observe 驗證密碼
| GALILEO_PROJECT_ID | Galileo 使用的專案 ID
| GALILEO_USERNAME | Galileo enterprise Observe 驗證使用者名稱
| GOOGLE_SECRET_MANAGER_PROJECT_ID | Google Secret Manager 的專案 ID
| GRACEFUL_SHUTDOWN_TIMEOUT | proxy 在關閉時等待進行中的請求排空所花的秒數（SIGTERM 或 `/health/drain` preStop hook）後，再繼續進行收尾。**預設為 30**
| GCS_BATCH_BUCKET_NAME | Vertex AI 檔案與批次使用的 GCS bucket。其優先於 GCS_BUCKET_NAME，因此批次資料可以與記錄 bucket 分開存放
| GCS_BUCKET_NAME | Google Cloud Storage bucket 的名稱
| GCS_MOCK | 啟用 GCS 整合測試的 mock 模式。設定為 true 時，會攔截 GCS API 呼叫並回傳 mock 回應，而不進行實際網路呼叫。預設為 false
| GCS_MOCK_LATENCY_MS | 啟用 mock 模式時，GCS API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 150ms
| GCS_PATH_SERVICE_ACCOUNT | Google Cloud service account JSON 檔案的路徑
| GCS_FLUSH_INTERVAL | GCS 記錄的 flush 間隔（秒）。指定您希望多久將一次記錄送出到 GCS。**預設為 20 秒**
| GCS_BATCH_SIZE | GCS 記錄的批次大小。指定您希望累積多少筆記錄後再 flush 到 GCS。若 `BATCH_SIZE` 設為 10，則每 10 筆記錄 flush 一次。**預設為 2048**
| GCS_USE_BATCHED_LOGGING | 啟用 GCS 的批次記錄。啟用時（預設），多個記錄負載會合併成單一 GCS 物件上傳（NDJSON 格式），大幅減少 API 呼叫。停用時，則會將每筆記錄各自作為獨立的 GCS 物件傳送（舊版行為）。**預設為 true**
| GCS_PUBSUB_TOPIC_ID | 傳送 LiteLLM SpendLogs 的 PubSub Topic ID。
| GCS_PUBSUB_PROJECT_ID | 傳送 LiteLLM SpendLogs 的 PubSub Project ID。
| GENERIC_AUTHORIZATION_ENDPOINT | generic OAuth 提供者的授權端點
| GENERIC_CLIENT_ID | generic OAuth 提供者的 Client ID
| GENERIC_CLIENT_SECRET | generic OAuth 提供者的 client secret
| GENERIC_CLIENT_STATE | generic client 驗證的 state 參數
| GENERIC_CLIENT_USE_PKCE | 為 generic OAuth 提供者啟用 PKCE（Proof Key for Code Exchange）。當您的 OAuth 提供者需要 PKCE 時，請設為 "true"。**預設為 false**
| GENERIC_SSO_HEADERS | 要新增到請求中的額外標頭，以逗號分隔清單表示 - 例如 Authorization=Bearer `<token>`、Content-Type=application/json 等。

| GENERIC_INCLUDE_CLIENT_ID | 在 OAuth 請求中包含 client ID
| GENERIC_INCLUDE_TOKEN_CLAIMS | 設為 true 時，若 UserInfo 不完整，也會從 ID token 和 access token 取得 generic OIDC SSO 使用者聲明。UserInfo 聲明優先
| GENERIC_SCOPE | generic OAuth 提供者的 scope 設定
| GENERIC_TOKEN_ENDPOINT | generic OAuth 提供者的 token endpoint
| GENERIC_USER_DISPLAY_NAME_ATTRIBUTE | generic auth 中使用者顯示名稱的屬性
| GENERIC_USER_EMAIL_ATTRIBUTE | generic auth 中使用者電子郵件的屬性
| GENERIC_USER_EXTRA_ATTRIBUTES | 以逗號分隔的額外欄位清單，從 generic SSO 提供者回應中擷取（例如："department,employee_id,groups"）。可在自訂 SSO handler 中透過 `CustomOpenID.extra_fields` 存取。支援巢狀欄位的點記法
| GENERIC_USER_FIRST_NAME_ATTRIBUTE | generic auth 中使用者名字的屬性
| GENERIC_USER_ID_ATTRIBUTE | generic auth 中使用者 ID 的屬性。請使用每個帳號皆唯一且不可變更的聲明，例如 `sub`；預設為 `preferred_username`
| GENERIC_USER_LAST_NAME_ATTRIBUTE | generic auth 中使用者姓氏的屬性
| GENERIC_USER_PROVIDER_ATTRIBUTE | 指定使用者提供者的屬性
| GENERIC_USER_ROLE_ATTRIBUTE | 指定使用者角色的屬性
| GENERIC_USERINFO_ENDPOINT | 在 generic OAuth 中擷取使用者資訊的 endpoint
| GENERIC_LOGGER_ENDPOINT | Generic Logger 回呼要傳送記錄的 endpoint URL
| GENERIC_LOGGER_HEADERS | 要包含在 Generic Logger 回呼請求中的標頭 JSON 字串
| GENERIC_ROLE_MAPPINGS_DEFAULT_ROLE | 當 generic SSO 中沒有任何角色對應符合時，要指派的預設 LiteLLM 角色。與 GENERIC_ROLE_MAPPINGS_ROLES 搭配使用
| GENERIC_ROLE_MAPPINGS_GROUP_CLAIM | SSO token 中包含使用者群組的聲明/屬性名稱。用於角色對應
| GENERIC_ROLE_MAPPINGS_ROLES | 將 LiteLLM 角色對應到 SSO 群組名稱的 Python dict 字串。範例：`{"proxy_admin": ["admin-group"], "internal_user": ["users"]}`
| GEMINI_API_BASE | Gemini API 的 base URL。預設為 https://generativelanguage.googleapis.com
| GALILEO_API_KEY | Galileo Cloud（託管版）的 API 金鑰。當 `success_callback` 包含 `galileo` 時，與 v2 spans API 搭配使用。
| GALILEO_BASE_URL | Galileo platform 的 base URL。對於 Galileo Cloud，請使用 `https://api.galileo.ai`。對於企業版/自架版，請將 console URL 中的 `console` 替換為 `api`。
| GALILEO_LOG_STREAM_ID | Galileo Cloud v2 spans 記錄的 log stream ID（選用）。
| GALILEO_PASSWORD | Galileo enterprise Observe 驗證密碼
| GALILEO_PROJECT_ID | Galileo 使用的專案 ID
| GALILEO_USERNAME | Galileo enterprise Observe 驗證使用者名稱
| GITHUB_COPILOT_TOKEN_DIR | 儲存 GitHub Copilot token 的目錄，供 `github_copilot` llm provider 使用
| GITHUB_COPILOT_API_KEY_FILE | 儲存 GitHub Copilot API key 的檔案，供 `github_copilot` llm provider 使用
| GITHUB_COPILOT_ACCESS_TOKEN_FILE | 儲存 GitHub Copilot access token 的檔案，供 `github_copilot` llm provider 使用
| GITHUB_COPILOT_API_BASE | GitHub Copilot API 的 base URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://copilot-api.my-company.ghe.com. 預設為 https://api.githubcopilot.com
| GITHUB_COPILOT_DEVICE_CODE_URL | GitHub Copilot device code 驗證的 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://my-company.ghe.com/login/device/code. 預設為 https://github.com/login/device/code
| GITHUB_COPILOT_ACCESS_TOKEN_URL | 取得 GitHub Copilot access token 的 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://my-company.ghe.com/login/oauth/access_token. 預設為 https://github.com/login/oauth/access_token
| GITHUB_COPILOT_API_KEY_URL | 取得 GitHub Copilot API key 的 URL。對於具有自訂主機的 GitHub Enterprise 訂閱，類似於 https://my-company.ghe.com/api/v3/copilot_internal/v2/token. 預設為 https://api.github.com/copilot_internal/v2/token
| GITHUB_COPILOT_CLIENT_ID | GitHub Copilot device flow 驗證的 Client ID。這由 `github_copilot` provider 用於 device code 驗證。預設為 "Iv1.b507a08c87ecfe98"
| GREENSCALE_API_KEY | Greenscale 服務的 API 金鑰
| GREENSCALE_ENDPOINT | Greenscale 服務的 endpoint URL
| GRAYSWAN_API_BASE | GraySwan API 的 base URL。預設為 https://api.grayswan.ai
| GRAYSWAN_API_KEY | GraySwan Cygnal 服務的 API 金鑰
| GRAYSWAN_REASONING_MODE | GraySwan 防護欄的推理模式
| GRAYSWAN_VIOLATION_THRESHOLD | GraySwan 防護欄的違規閾值
| GOOGLE_APPLICATION_CREDENTIALS | Google Cloud 憑證 JSON 檔案的路徑
| GOOGLE_CLIENT_ID | Google OAuth 的 Client ID
| GOOGLE_CLIENT_SECRET | Google OAuth 的 client secret
| GOOGLE_KMS_RESOURCE_NAME | Google KMS 中的資源名稱
| GUARDRAILS_AI_API_BASE | Guardrails AI API 的 base URL
| GUARDRAIL_SCANNED_MESSAGES_CACHE_TTL_SECONDS | 當 `only_scan_new_messages` 啟用時，記住哪些訊息片段已由防護欄掃描過的每個工作階段快取之 TTL（秒）。預設為 86400（24 小時）
| HEALTH_CHECK_TIMEOUT_SECONDS | 健康檢查的逾時秒數。預設為 60
| HEROKU_API_BASE | Heroku API 的 base URL
| HEROKU_API_KEY | Heroku 服務的 API 金鑰
| HF_API_BASE | Hugging Face API 的 base URL
| HCP_VAULT_ADDR | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的位址
| HCP_VAULT_APPROLE_MOUNT_PATH | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 中 AppRole 驗證的 mount 路徑。預設為 "approle"
| HCP_VAULT_APPROLE_ROLE_ID | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 中 AppRole 驗證的 Role ID
| HCP_VAULT_APPROLE_SECRET_ID | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 中 AppRole 驗證的 Secret ID
| HCP_VAULT_CLIENT_CERT | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 client certificate 路徑
| HCP_VAULT_CLIENT_KEY | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 client key 路徑
| HCP_VAULT_LOGIN_NAMESPACE | 在 [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 AppRole 與 TLS 憑證登入時，作為 `X-Vault-Namespace` 標頭送出的 namespace。若未設定則回退至 HCP_VAULT_NAMESPACE
| HCP_VAULT_MOUNT_NAME | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 mount 名稱
| HCP_VAULT_NAMESPACE | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 namespace
| HCP_VAULT_PATH_PREFIX | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的路徑前綴
| HCP_VAULT_SECRET_NAMESPACE | 在 [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 secret 讀取與寫入 URL 路徑中使用的 namespace。若未設定則回退至 HCP_VAULT_NAMESPACE
| HCP_VAULT_TOKEN | [Hashicorp Vault Secret Manager](../secret_managers/hashicorp_vault.md) 的 token
| HCP_VAULT_CERT_ROLE | [Hashicorp Vault Secret Manager Auth](../secret_managers/hashicorp_vault.md) 的角色
| HELICONE_API_KEY | Helicone 服務的 API 金鑰
| HELICONE_API_BASE | Helicone 服務的 base URL，預設為 `https://api.helicone.ai`
| HELICONE_MOCK | 啟用 Helicone 整合測試的 mock 模式。設為 true 時，會攔截 Helicone API 呼叫並回傳 mock 回應，而不會進行實際網路呼叫。預設為 false
| HELICONE_MOCK_LATENCY_MS | 啟用 mock 模式時，Helicone API 呼叫的 mock 延遲（毫秒）。模擬網路往返時間。預設為 100ms
| HOSTNAME | 伺服器的主機名稱，這會被 [發出至 `datadog` 記錄](https://docs.litellm.ai/docs/proxy/logging#datadog)
| HOURS_IN_A_DAY | 用於計算的一天小時數。預設為 24
| HIDDENLAYER_API_BASE | HiddenLayer API 的 base URL。預設為 `https://api.hiddenlayer.ai`
| HIDDENLAYER_AUTH_URL | HiddenLayer 的驗證 URL。預設為 `https://auth.hiddenlayer.ai`
| HIDDENLAYER_CLIENT_ID | HiddenLayer SaaS 驗證的 Client ID
| HIDDENLAYER_CLIENT_SECRET | HiddenLayer SaaS 驗證的 client secret
| HUGGINGFACE_API_BASE | Hugging Face API 的 base URL
| HUGGINGFACE_API_KEY | Hugging Face API 的 API 金鑰
| HUMANLOOP_PROMPT_CACHE_TTL_SECONDS | Humanloop 中快取提示的存活時間（秒）。預設為 60
| IAM_TOKEN_DB_AUTH | 設為 `True`，可使用短效 IAM token 對 Amazon RDS 或 Amazon Aurora 上的 PostgreSQL 進行驗證。LiteLLM 會使用 boto3 產生並更新 token。此選項不支援 Google Cloud SQL；請改用 Cloud SQL Auth Proxy 搭配 `--auto-iam-authn`。不可與 `AZURE_POSTGRESQL_AUTH` 組合使用。需要 `DATABASE_HOST`、`DATABASE_PORT`、`DATABASE_USER` 和 `DATABASE_NAME`。關於 ECS task-role 設定與重新啟動行為，請參閱 [`--iam_token_db_auth`](./cli#--iam_token_db_auth)。
| IBM_GUARDRAILS_API_BASE | IBM Guardrails API 的 base URL

| IBM_GUARDRAILS_AUTH_TOKEN | IBM Guardrails API 的授權 bearer 權杖
| INITIAL_RETRY_DELAY | 重試請求的初始延遲秒數。預設為 0.5
| JITTER | 用於重試延遲計算的抖動係數。預設為 0.75
| JSON_LOGS | 啟用 JSON 格式記錄
| JWT_AUDIENCE | JWT 權杖預期的受眾
| JWT_ISSUER | JWT 權杖預期的簽發者（`iss` 聲明）。設定後，PyJWT 會驗證 `iss` 聲明，並拒絕來自其他簽發者的權杖
| JWT_PUBLIC_KEY_URL | 用於擷取 JWT 驗證公鑰的 URL
| LAGO_API_BASE | Lago API 的基礎 URL
| LAGO_API_CHARGE_BY | 用於決定 Lago 計費基準的參數
| LAGO_API_EVENT_CODE | Lago API 事件的事件代碼
| LAGO_API_KEY | 用於存取 Lago 服務的 API 金鑰
| LANGFUSE_BASE_URL | Langfuse 服務的基礎 URL。當 `LANGFUSE_HOST` 未設定時作為備援讀取；每個金鑰/每個團隊的 `langfuse_host` 一律優先於兩者 |
| LANGFUSE_DEBUG | 切換 Langfuse 的除錯模式。僅 `true` 或 `1` 會啟用；任何其他值皆為關閉
| LANGFUSE_FLUSH_AT | Langfuse 回呼每次 OTLP 匯出請求批次處理的 span 數；預設為 `512`。不是介於 `1` 與 `100000` 之間的整數值會記錄警告並使用預設值
| LANGFUSE_FLUSH_INTERVAL | Langfuse 回呼在各 OTLP 匯出批次之間等待的秒數；預設為 `1`。不是大於 `0` 的整數值會記錄警告並使用預設值
| LANGFUSE_PROMPT_CACHE_DEFAULT_TTL_SECONDS | Langfuse 回呼在下一個請求刷新前快取已擷取提示的時間長度；預設為 `60`。刷新失敗時會繼續提供快取中的提示。必須是整數秒：Langfuse SDK 在匯入時會將其讀取為整數，因此任何其他值（例如 `abc` 或 `2.5`）都會使回呼失敗，並顯示指出此變數名稱的錯誤；負值會記錄警告並使用預設值
| LANGFUSE_TRACING_ENVIRONMENT | Langfuse tracing 的環境
| LANGFUSE_HOST | Langfuse 服務的主機 URL。優先於 `LANGFUSE_BASE_URL` |
| LANGFUSE_MOCK | 啟用 Langfuse 整合測試的模擬模式。設定為 true 時，會攔截 Langfuse API 呼叫並回傳模擬回應，不會實際發出網路請求。預設為 false
| LANGFUSE_MOCK_LATENCY_MS | 啟用模擬模式時，Langfuse API 呼叫的模擬延遲（毫秒）。模擬網路往返時間。預設為 100ms
| LANGFUSE_PUBLIC_KEY | Langfuse 驗證的公鑰
| LANGFUSE_MAX_RETRIES | Langfuse 回呼在超時、連線失敗或收到可重試狀態時，於批次被捨棄前重試 OTLP 匯出請求的次數；預設為 `3`，各次嘗試之間等待 1、2 和 4 秒，且每次加倍直到 64 秒。不是整數的值會記錄警告並使用預設值，而大於 `1000` 的值會記錄警告並使用 `1000`
| LANGFUSE_RELEASE | 每個 Langfuse trace 上記錄的版本。未設定時，回呼會回退至 `RENDER_GIT_COMMIT`、`CI_COMMIT_SHA`、`CIRCLE_SHA1`、`SOURCE_VERSION`、`TRAVIS_COMMIT`、`GIT_COMMIT`、`GITHUB_SHA`、`BITBUCKET_COMMIT`、`BUILD_SOURCEVERSION` 和 `DRONE_COMMIT_SHA` 中第一個已設定的值，也就是 Langfuse SDK 讀取的相同清單
| LANGFUSE_SECRET_KEY | Langfuse 驗證的密鑰
| LANGFUSE_TIMEOUT | Langfuse 回呼送出的每個 OTLP 匯出請求以及每個 REST 請求（提示、憑證檢查、專案查詢）的逾時秒數；預設為 `20`，並接受如 `2.5` 之類的小數。逾時或連線失敗的匯出請求會重試 `LANGFUSE_MAX_RETRIES` 次，之後批次會被捨棄
| LANGFUSE_OTEL_TRACES_EXPORT_PATH | Langfuse trace 匯出的可選 OTLP HTTP 路徑；預設為 `/api/public/otel/v1/traces`
| LANGFUSE_SAMPLE_RATE | 透過 Langfuse 回呼匯出的 trace 比例，範圍從 `0.0` 到 `1.0`；預設為 `1.0`。超出該範圍或非數值的值會記錄警告並匯出每個 trace
| LANGSMITH_API_KEY | Langsmith 平台的 API 金鑰
| LANGSMITH_BASE_URL | Langsmith 服務的基礎 URL
| LANGSMITH_BATCH_SIZE | Langsmith 操作的批次大小
| LANGSMITH_DEFAULT_RUN_NAME | Langsmith 執行的預設名稱
| LANGSMITH_PROJECT | Langsmith 整合的專案名稱
| LANGSMITH_SAMPLING_RATE | Langsmith 記錄的取樣率
| LANGSMITH_TENANT_ID | Langsmith 多租戶部署的租戶 ID
| LANGSMITH_MOCK | 啟用 Langsmith 整合測試的模擬模式。設定為 true 時，會攔截 Langsmith API 呼叫並回傳模擬回應，不會實際發出網路請求。預設為 false
| LANGSMITH_MOCK_LATENCY_MS | 啟用模擬模式時，Langsmith API 呼叫的模擬延遲（毫秒）。模擬網路往返時間。預設為 100ms
| LANGTRACE_API_HOST | 自架 Langtrace 伺服器供 `langtrace` 回呼使用的基礎 URL，例如 `https://langtrace.example.com`；該回呼會將請求送至 `<host>/api/trace`。預設為 `https://app.langtrace.ai`
| LANGTRACE_API_KEY | Langtrace 服務的 API 金鑰，由 `langtrace` 回呼以 `x-api-key` 標頭傳送
| LASSO_API_BASE | Lasso API 的基礎 URL
| LASSO_API_KEY | Lasso 服務的 API 金鑰
| LASSO_USER_ID | Lasso 服務的使用者 ID
| LASSO_CONVERSATION_ID | Lasso 服務的對話 ID
| LENGTH_OF_LITELLM_GENERATED_KEY | LiteLLM 產生的金鑰長度。預設為 16
| LEGACY_MULTI_INSTANCE_RATE_LIMITING | 啟用舊版多執行個體速率限制的旗標。**預設為 False**
| LITERAL_API_KEY | Literal 整合的 API 金鑰
| LITERAL_API_URL | Literal 服務的 API URL
| LITERAL_BATCH_SIZE | Literal 操作的批次大小
| LITELLM_ANTHROPIC_BETA_HEADERS_URL | 用於擷取 Anthropic beta 標頭設定的自訂 URL。預設為 GitHub main 分支 URL
| LITELLM_ANTHROPIC_DISABLE_URL_SUFFIX | 停用 Anthropic API 基礎 URL 的自動附加 URL 後綴。設定為 `true` 時，會防止 LiteLLM 自動將 `/v1/messages` 或 `/v1/complete` 加到自訂 Anthropic API 端點
| LITELLM_ANTHROPIC_PROMPT_CACHING_TTL | 由 `LITELLM_ENABLE_ANTHROPIC_PROMPT_CACHING` 注入的斷點快取存續時間，可為 `5m` 或 `1h`。預設為 Anthropic 的 5 分鐘暫時性快取。`1h` 適合長時間的 agentic 會話，但會使快取寫入溢價加倍。任何其他值都會回退至預設值。也可透過 `litellm_settings.anthropic_prompt_caching_ttl` 設定
| LITELLM_ENABLE_ANTHROPIC_PROMPT_CACHING | 設定為 `true` 時，會自動在 Anthropic 與 Bedrock Claude 模型的 system prompt 及尾端 turn 注入 Anthropic `cache_control` 斷點，因此像 Claude Code 這類從不自行設定 `cache_control` 的用戶端也能取得 prompt 快取。預設為 `false`。已帶有自身 `cache_control` 的請求會維持原樣。請注意，提供者會依照送出該前綴的上游憑證進行快取，而不是按最終使用者，因此啟用此功能會讓每位呼叫者的 prompts 都可在該共享帳戶上快取；若共享一組憑證的呼叫者不應知道其他呼叫者最近是否送出某個 prompt，請保持關閉。也可透過 `litellm_settings.enable_anthropic_prompt_caching` 設定
| LITELLM_ASSETS_PATH | UI 資產與標誌的目錄路徑。於唯讀檔案系統（例如 Kubernetes）執行時使用。Docker 中預設為 `/var/lib/litellm/assets`。
| LITELLM_AUTOROUTER_PRESETS_URL | 用於擷取自動路由器預設集目錄的自訂 URL。預設為 GitHub main 分支 URL
| LITELLM_BILLING_METRICS_ENDPOINT | [企業可計費請求計量](billing_metrics) 的收集器 URL。需要企業授權；未設定則停用計量
| LITELLM_BILLING_METRICS_CLIENT_CERT | 用於可計費請求計量的 mTLS 用戶端憑證。接受檔案路徑或內嵌 PEM 內容
| LITELLM_BILLING_METRICS_CLIENT_KEY | 與 `LITELLM_BILLING_METRICS_CLIENT_CERT` 相符的私鑰。接受檔案路徑或內嵌 PEM 內容
| LITELLM_BILLING_METRICS_CA_CERT | 用於驗證計量收集器的 CA bundle。僅供私有或測試收集器使用；未設定時使用系統信任存放區

| LITELLM_BILLING_METRICS_EXPORT_INTERVAL_MS | 以毫秒為單位的可計費請求計量推送週期。預設為 60000
| LITELLM_BLOG_POSTS_URL | 用於擷取 LiteLLM 部落格文章 JSON 的自訂 URL。預設為 GitHub main 分支 URL
| LITELLM_CLI_DISABLE_KEYRING | 在執行 `lite` CLI 的機器上設為 `1`、`true`、`yes` 或 `on`，可讓 CLI 不使用作業系統金鑰圈，因此來自 `lite login` 的憑證會保留在 `~/.litellm/token.json`（`0600`）中。預設為未設定，這會在可存取金鑰圈時將憑證儲存在金鑰圈中
| LITELLM_CLI_JWT_EXPIRATION_HOURS | CLI 產生的 JWT 權杖到期時間（小時）。預設為 24 小時
| LITELLM_PROXY_API_OAUTH_REDIRECT_URIS | 以逗號分隔、完全相符且受信任的 HTTPS 回呼，用於代管的 `proxy:read` 授權，允許模型清單與彙總使用量報告。預設為空。不允許管理操作或模型呼叫。請參閱 [代管應用程式登入](./cli_sso.md#hosted-app-sign-in)
| LITELLM_PROXY_API_OAUTH_ADMIN_REDIRECT_URIS | 以逗號分隔、完全相符且受信任的 HTTPS 回呼，用於要求代管的 `proxy:admin` 授權。需要目前 `proxy_admin` 的明確同意；閘道在使用時會重新檢查角色與既有政策。預設為空。列出的應用程式也可以要求 `proxy:read`。請參閱 [代管應用程式登入](./cli_sso.md#hosted-app-sign-in)
| LITELLM_CLI_SSO_CLAIM_MAP | `CLI_SSO_CLAIM_MAP` 的別名 — CLI SSO 歸因中繼資料的允許清單 OIDC claim
| LITELLM_CORS_ALLOW_CREDENTIALS | 設為 `true` 以明確允許 CORS 回應中的憑證。未設定時，若 `LITELLM_CORS_ORIGINS` 為 `*`（萬用字元），系統會自動停用憑證，以避免瀏覽器安全設定錯誤地以憑證回傳任何來源
| LITELLM_CORS_ORIGINS | 允許的 CORS 來源以逗號分隔清單指定（例如 `https://app.example.com,https://admin.example.com`）。未設定時預設為 `*`（所有來源）
| LITELLM_DANGEROUSLY_PERMIT_WEAK_OR_UNSET_MASTER_KEY | 僅供本機開發：設為 `true` 可在 master key 未設定、為空，或具有已知不安全值時讓 proxy 啟動。與 `general_settings.dangerously_permit_weak_or_unset_master_key` 相同。**預設為 false**。[Proxy 會拒絕在已知不安全的 master key 下啟動](./master_key_rotations.md#proxy-refuses-to-start)
| LITELLM_DD_AGENT_HOST | 用於 LiteLLM 特定記錄的 DataDog agent 主機名稱或 IP。設定後，記錄會傳送至 agent，而非直接 API
| LITELLM_DEPLOYMENT_ENVIRONMENT | 部署的環境名稱（例如「production」、「staging」）。當未設定 OTEL_ENVIRONMENT_NAME 時用作備援。會在遙測資料中設定 `environment` 標籤
| LITELLM_DETAILED_TIMING | 設為 true 時，會在回應中加入每個階段的詳細計時標頭（`x-litellm-timing-{pre-processing,llm-api,post-processing,message-copy}-ms`）。預設為 false。請參閱 [延遲額外負擔文件](../troubleshoot/latency_overhead.md)
| LITELLM_DD_AGENT_PORT | 用於 LiteLLM 特定記錄接收的 DataDog agent 連接埠。預設為 10518
| LITELLM_DD_LLM_OBS_PORT | Datadog LLM Observability agent 的連接埠。預設為 8126
| LITELLM_DEFAULT_EMBEDDING_ENCODING_FORMAT | 當 OpenAI 相容的 embedding 請求未在請求本身或模型 `litellm_params`（例如 `float`、`base64`）中設定時，預設的 `encoding_format`。備援為 `float`。請參閱 [Embeddings](./embedding.md#embedding-encoding-format)。
| LITELLM_DEV_ENV_HOT_RELOAD | proxy 以 `--reload` 啟動時自行設定的內部旗標，會通知重新載入的 worker 以 `override=True` 重新讀取 `.env`，使既有鍵值的編輯在重新載入時生效。非供使用者設定
| LITELLM_DONT_SHOW_FEEDBACK_BOX | 隱藏 LiteLLM UI 中意見回饋方塊的旗標
| LITELLM_DROP_PARAMS | 要在 LiteLLM 請求中捨棄的參數
| LITELLM_MODIFY_PARAMS | 要在 LiteLLM 請求中修改的參數
| LITELLM_EMAIL | 與 LiteLLM 帳戶關聯的電子郵件
| LITELLM_FAVICON_URL | LiteLLM UI favicon 的自訂 URL。設定後會覆寫預設 favicon
| LITELLM_GLOBAL_MAX_PARALLEL_REQUEST_RETRIES | LiteLLM 平行請求的最大重試次數
| LITELLM_GLOBAL_MAX_PARALLEL_REQUEST_RETRY_TIMEOUT | LiteLLM 平行請求重試的逾時時間
| LITELLM_DISABLE_ACCESS_LOG_PATHS | 以逗號分隔的 URL 路徑清單，要從 uvicorn access logs 中排除（例如 `/health,/metrics`）。可用於抑制雜訊過多的健康檢查記錄項目。 |
| LITELLM_DISABLE_LAZY_LOADING | 設為「1」、「true」、「yes」或「on」時，會停用屬性的延遲載入（目前僅影響 encoding/tiktoken）。這可確保在 VCR 開始記錄 HTTP 請求之前就已初始化 encoding，修正 VCR cassette 建立問題。請參閱 [issue #18659](https://github.com/BerriAI/litellm/issues/18659)
| LITELLM_DISABLE_LAZY_ROUTES | 設為「1」、「true」、「yes」或「on」時，會在 worker 啟動時、`LITELLM_WORKER_STARTUP_HOOKS` 執行前以及第一個請求之前，註冊每個可選功能路由器（MCP、防護欄、代理程式、向量儲存、轉接與其餘項目），而不是在第一次請求其路徑時才註冊。當您需要在啟動時取得完整路由表時請使用，例如從啟動回呼過濾 `app.routes`，或在提供流量前稽核 `GET /routes`。預設：未設定，因此可選路由器會以延遲方式載入。 |
| LITELLM_DISABLE_NO_REDIS_WARNING | 設為「true」時，會隱藏在未設定 Redis 時顯示的 Admin UI 橫幅。僅應在單一 worker 部署上設定；請參閱 [What Needs Redis](./redis_requirements.md)。
| LITELLM_DISABLE_REDACT_SECRETS | 設為「true」時，會停用從 proxy 記錄輸出中自動遮罩機密（API 金鑰、權杖、憑證）。預設會啟用機密遮罩。
| LITELLM_DISABLE_ACCESS_LOG_PATHS | 完全相符的請求路徑以逗號分隔的清單，其 uvicorn access-log 行應被捨棄（例如健康檢查、root 探測、淹沒記錄的 metrics 抓取）。路徑會比對任何查詢字串之前的部分。空白/未設定會停用篩選。
| LITELLM_MIGRATION_DIR | prisma migrations 的自訂 migrations 目錄，用於唯讀檔案系統中的資料庫基準化。
| LITELLM_LITEASK_MODEL | 原生 LiteAsk 管理聊天所使用的模型別名，適用於包含 LiteAsk 的 gateway 版本。預設未設定，這會隱藏小工具。請在 gateway 或管理後端上設定支援工具呼叫的模型。只有目前的 proxy 管理員可以使用，且必須使用自己的憑證。讀取在沒有 Redis 的情況下也可運作；已核准的變更需要共享 Redis 以進行一次性核准。
| LITELLM_UI_API_DOC_BASE_URL | 當管理 UI 執行於與 proxy 不同的主機上時，用於 API Reference 基底 URL（用於範例程式碼/文件）的選用覆寫。未設定時預設為 `PROXY_BASE_URL`。
| LITELLM_UI_PATH | Admin UI 檔案的目錄路徑。當在唯讀檔案系統（例如 Kubernetes）上執行時使用。Docker 中預設為 `/var/lib/litellm/ui`。
| LITELLM_UI_SESSION_DURATION | UI 登入工作階段的持續時間（使用者名稱/密碼、SSO、邀請連結）。格式：「30s」、「30m」、「24h」、「7d」。不適用於 EXPERIMENTAL_UI_LOGIN 流程，該流程為安全起見使用固定 10 分鐘到期時間。預設為「24h」
| LITELLM_EXECUTED_BATCH_CONCURRENCY | 當 LiteLLM 自行執行批次時，會平行執行單一批次中的幾行；它會針對伺服器沒有 Files API 的 `hosted_vllm` 部署這麼做。預設為 4。請參閱 [vLLM batches](../providers/vllm_batches)
| LITELLM_EXPIRED_UI_SESSION_KEY_CLEANUP_BATCH_SIZE | 每次清理執行時可刪除的過期 LiteLLM dashboard session key 最大數量。預設為 1000。
| LITELLM_EXPIRED_UI_SESSION_KEY_CLEANUP_ENABLED | 設為 `true` 以啟用過期 LiteLLM dashboard session key 的背景清理工作。預設為 `false`。
| LITELLM_EXPIRED_UI_SESSION_KEY_CLEANUP_INTERVAL_SECONDS | 執行過期 LiteLLM dashboard session key 清理工作的間隔秒數。預設為 86400（24 小時）。
| LITELM_ENVIRONMENT | LiteLLM 執行個體的環境，由記錄服務使用。目前僅供 DeepEval 使用。
| LITELLM_KEY_ROTATION_ENABLED | 啟用 LiteLLM 的自動金鑰輪替（布林值）。預設為 false。
| LITELLM_KEY_ROTATION_CHECK_INTERVAL_SECONDS | 自動輪替金鑰的工作執行間隔秒數。預設為 86400（24 小時）。
| LITELLM_KEY_ROTATION_GRACE_PERIOD | 輪替後保留舊金鑰有效的持續時間（例如「24h」、「2d」）。預設為空白（立即撤銷）。用於排程輪替，以及在 regenerate request 未指定時作為備援。

| LITELLM_KEY_ROTATION_LOCK_TTL_SECONDS | 金鑰輪替作業所使用之分散式鎖的 TTL（秒）。預設為 600（10 分鐘）。
| LITELLM_JOB_ROLE | 此程序註冊哪些排程背景作業。`all`（未設定時的預設值）和 `worker` 會註冊所有作業；`serving` 不會註冊任何單一擁有者作業，因此服務部署可將預算重設、支出記錄清理、金鑰輪替、用量匯出及其他共享作業交由專用的 worker 部署處理。不分大小寫；無法識別的值會在警告後回退為 `all`。請參閱[在專用 worker 上執行背景作業](./prod.md#run-background-jobs-on-a-dedicated-worker)。
| LITELLM_LICENSE | LiteLLM 使用授權金鑰
| LITELLM_LOCAL_ANTHROPIC_BETA_HEADERS | 設定為 `True` 時，只使用本機隨附的 Anthropic beta headers 設定，停用遠端擷取。預設為 `False`
| LITELLM_LOCAL_AUTOROUTER_PRESETS | 設定為 `True` 時，只提供套件隨附的 auto-router 預設目錄，停用遠端擷取。預設為 `False`
| LITELLM_OIDC_ALLOWED_CREDENTIAL_DIRS | 以逗號分隔的絕對目錄清單，`oidc/file/` 提供者被允許從中讀取權杖檔案。預設為 `/var/run/secrets,/run/secrets`。
| LITELLM_LOCAL_BLOG_POSTS | 設定為 `True` 時，只使用本機隨附的部落格文章，停用從 GitHub 的遠端擷取。預設為 `False`
| LITELLM_LOCAL_MODEL_COST_MAP | 設定為 `True` 時，只使用套件隨附的模型成本對照表（`litellm/model_prices_and_context_window_backup.json`），停用啟動時及 `/reload/model_cost_map` 的 GitHub 遠端擷取。預設為 `False`：遠端檔案會在啟動時擷取，隨附副本僅在擷取失敗時作為備援使用
| LITELLM_LOCAL_POLICY_TEMPLATES | 設定為 "true" 時，使用本機備援政策範本，而非從 GitHub 擷取。政策範本預設從 https://raw.githubusercontent.com/BerriAI/litellm/main/policy_templates.json 擷取，若失敗則自動回退至本機備援
| LITELLM_LOG | 啟用 LiteLLM 的詳細記錄
| LITELLM_MODEL_COST_MAP_URL | 用於擷取模型成本對照表資料的 URL。預設為 https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json
| LITELLM_LOGGER_NAME | OTEL logger 的名稱 
| LITELLM_METER_NAME | OTEL Meter 的名稱 
| LITELLM_OTEL_INTEGRATION_ENABLE_EVENTS | 可選擇為 OTEL 啟用語義記錄（`gen_ai.content.prompt`/`gen_ai.content.completion`，或 semconv 模式中的 `gen_ai.client.inference.operation.details`）。預設 `false`。請參閱[OpenTelemetry](/docs/observability/opentelemetry_integration#configuration-reference)
| LITELLM_OTEL_INTEGRATION_ENABLE_METRICS | 可選擇為 OTEL 啟用語義指標（TTFT、TPOT、回應持續時間、成本、token 用量）。預設 `false`。請參閱[OpenTelemetry](/docs/observability/opentelemetry_integration#metrics-reference)
| LITELLM_OTEL_BAGGAGE_TEAM_METADATA_KEYS | 以逗號分隔的允許清單，列出會提升到 OTEL spans 中 `litellm.team.metadata` 下的 team-metadata 子鍵。預設為空，因此在每個子鍵明確列入允許清單之前，團隊的所有自由格式 metadata 都不會傳送到您的追蹤後端。也可在 config.yaml 的 `callback_settings.otel` 下透過 `baggage_team_metadata_keys` 設定。請參閱[OpenTelemetry](/docs/observability/opentelemetry_integration)。
| LITELLM_ENABLE_PYROSCOPE | 若為 true，則啟用 Pyroscope CPU profiling。設定檔會傳送至 PYROSCOPE_SERVER_ADDRESS。預設關閉。請參閱[Pyroscope profiling](/docs/proxy/pyroscope_profiling)。
| LITELLM_ENABLE_TEAM_STALE_ALIAS_BYPASS | 當 `true` 時，若團隊的舊版 `model_aliases` 項目將公開模型名稱對應至內部 `model_name_<team_id>_<uuid>` 部署，在公開名稱已有團隊範圍的同層部署時，前置呼叫處理可略過該重寫——因此負載平衡 / `order` 會在同層部署間套用。為向後相容，預設為 `false`。請參閱[團隊範圍模型與舊版別名](./load_balancing#team-scoped-models-and-legacy-model_aliases)。當偵測到過期別名且此旗標為關閉時，proxy 可能會記錄一次性警告。
| PYROSCOPE_APP_NAME | 回報給 Pyroscope 的應用程式名稱。當 LITELLM_ENABLE_PYROSCOPE 為 true 時為必要。無預設值。
| PYROSCOPE_SERVER_ADDRESS | 用於傳送設定檔的 Pyroscope 伺服器 URL。當 LITELLM_ENABLE_PYROSCOPE 為 true 時為必要。無預設值。
| PYROSCOPE_SAMPLE_RATE | 可選。Pyroscope profiling 的取樣率（整數）。無預設值；未設定時，會使用 pyroscope-io 函式庫的預設值。
| PYROSCOPE_GRAFANA_USER | 可選。供 basic auth 使用的 Grafana Cloud Pyroscope 使用者／租戶 ID。當設定 PYROSCOPE_GRAFANA_API_TOKEN 時為必要。
| PYROSCOPE_GRAFANA_API_TOKEN | 可選。供 Pyroscope basic auth 使用的 Grafana Cloud API／存取原則 token。當設定 PYROSCOPE_GRAFANA_USER 時為必要。
| LITELLM_MASTER_KEY | proxy 驗證用的主金鑰。若未設定、為空，或具有已知不安全值，proxy 將不會啟動。[Proxy refuses to start with a known unsafe master key](./master_key_rotations.md#proxy-refuses-to-start)
| LITELLM_MIGRATE_FROM_MASTER_KEY | 先前的主金鑰。當與新的、安全的 `LITELLM_MASTER_KEY` 一起設定，且沒有 `LITELLM_SALT_KEY` 時，proxy 會在啟動後、開始提供流量前，重新加密所有可用先前金鑰解密的已儲存值，並在可刪除該變數時記錄。之後保留此設定不會有作用。[Proxy refuses to start with a known unsafe master key](./master_key_rotations.md#proxy-refuses-to-start)
| LITELLM_MAX_BUDGET_PER_SESSION_TTL | max-budget-per-session 限制器所使用的 session 預算計數器 TTL（秒）。預設為 3600（1 小時）
| LITELLM_MAX_ITERATIONS_TTL | max-iterations 限制器所使用的 session 迭代計數器 TTL（秒）。預設為 3600（1 小時）
| LITELLM_MAX_STREAMING_DURATION_SECONDS | 串流回應允許的最長持續時間（秒）。超過此持續時間的串流會以 Timeout 錯誤終止。預設為 None（無限制）
| LITELLM_STORE_AUDIT_LOGS | 為每一次對金鑰、團隊與使用者等管理物件執行的建立、更新與刪除記錄稽核日誌項目的旗標。`litellm_settings.store_audit_logs` 的環境等效項；僅在設定檔未設定該項時讀取，而寫入這些項目需要企業授權。**在企業授權下預設為 True，否則為 False**
| LITELLM_MODE | LiteLLM 的運作模式（例如 production、development）
| LITELLM_NON_ROOT | 讓 LiteLLM 在非 root 模式下執行的旗標，以提升 Docker 容器中的安全性
| LITELLM_RATE_LIMIT_WINDOW_SIZE | LiteLLM 的速率限制視窗大小。預設為 60
| LITELLM_REASONING_AUTO_SUMMARY | 若設定為 "true"，會自動為跨所有轉換路徑（Anthropic adapter、Responses API 等）的 reasoning models 啟用詳細推理摘要（`summary: "detailed"`）。預設為 "false"
| LITELLM_SALT_KEY | LiteLLM 中用於加密的 salt key
| LITELLM_SET_REPLICA_IDENTITY_FULL | 設定為 `true` 時，會在每次 migration run 結束時，於每一個 LiteLLM 資料表上執行 `ALTER TABLE ... REPLICA IDENTITY FULL`。Neon 或 lakehouse sync 等邏輯複寫消費者需要 FULL replica identity 才能讀取 UPDATE 或 DELETE 的舊列；Prisma 會讓新資料表維持 Postgres 預設值。需要 migration 使用者擁有這些資料表。預設為 `false`
| LITELLM_SENSITIVE_ROUTING_TTL | 黏性敏感資料路由決策的 TTL（秒）；控制一個 session 會被固定在路由 guardrail 選定的 on-premise model 上多久。預設為 3600
| LITELLM_SSL_CIPHERS | 用於更快握手的 SSL/TLS cipher 設定。控制 OpenSSL 連線的 cipher suite 偏好。
| LITELLM_SECRET_AWS_KMS_LITELLM_LICENSE | AWS KMS 加密的 LiteLLM 授權
| LITELLM_TPM_TOKEN_RESERVATION_ENABLED | 預設 `true`。設定為 `false` 時，會停用 v3 rate limiter 中的請求前 TPM 預留，並在每次即時請求完成後套用實際用量。這會讓每個請求少一次 Redis 操作，但併發請求可能暫時超過 TPM 限制。此設定不適用於 `POST /v1/batches`，後者使用[獨立的輸入檔案限制器](../batches#how-rate-limiting-for-batches-api-works)。請參閱[預估輸出 token](./users#estimated-output-tokens-requests-without-max_tokens)。 |
| LITELLM_USE_CHAT_COMPLETIONS_URL_FOR_ANTHROPIC_MESSAGES | 設定為 "true" 時，將 OpenAI /v1/messages 請求透過 chat/completions 而非 Anthropic models 的 Responses API 路由。也可透過 `litellm_settings.use_chat_completions_url_for_anthropic_messages` 設定
| LITELLM_ROUTE_ALL_CHAT_OPENAI_TO_RESPONSES | 設定為 "true" 時，將所有 OpenAI /chat/completions 請求透過 Responses API 橋接層路由。建議用於 OpenAI models。也可透過 `litellm_settings.route_all_chat_openai_to_responses` 設定

| LITELLM_GEMINI_LIVE_DEFER_SETUP | 設為 "true" 時，會延後 Gemini/Vertex Live 的設定，直到用戶端送出 `session.update`（用於執行階段工具注入）。為了向後相容，預設為 "false"，此時會在連線時自動送出設定。也可透過 `litellm.gemini_live_defer_setup` 設定
| LITELLM_USER_AGENT | LiteLLM API 請求的自訂 user agent 字串。用於合作夥伴遙測歸因
| LITELLM_WORKER_STARTUP_HOOKS | 以逗號分隔的 `module.path:function_name` 可呼叫物清單，會在啟動期間於每個 worker process 中執行。會在 worker 生命週期早期執行（在設定/DB 載入之前）。適用於重新初始化每個 process 的狀態，例如 [gflags](https://github.com/google/python-gflags)。詳情請參閱 [Worker Startup Hooks](/docs/proxy/worker_startup_hooks)
| LITELLM_PRINT_STANDARD_LOGGING_PAYLOAD | 若為 true，會將標準記錄負載列印到主控台 - 適合除錯
| LITELLM_PRISMA_BOOTSTRAP_TIMEOUT | 允許 Prisma CLI 所使用的 Node toolchain 進行一次性安裝的秒數，此安裝會在任何 migration 之前、每個容器只執行一次。在安裝超過十分鐘的較慢或頻寬受限節點上可提高此值。非正數或非數值會被忽略並顯示警告，然後套用預設值。**預設為 600**
| LITELLM_PRISMA_COMMAND_TIMEOUT | 除了 `prisma migrate deploy` 之外，任何單一 Prisma 指令在被終止並重試前可執行的秒數。當對大型或高度負載的資料庫執行 migration status、resolve 或 db push 等步驟，且確實需要超過一分鐘時可提高此值。不是正數的值會被忽略並顯示警告，然後套用預設值，因此輸入錯字也不會意外停用逾時。**預設為 60**
| LITELLM_PRISMA_MIGRATE_DEPLOY_TIMEOUT | 一個 `prisma migrate deploy` 在被終止並重試前可執行的秒數。該指令會一次套用所有待處理的 migration，因此全新或長時間閒置的資料庫需要的時間遠長於任何其他 Prisma 指令。在套用累積待辦需要超過十分鐘時可提高此值；在從不回應的資料庫上可降低此值以更快失敗。不是正數的值會被忽略並顯示警告，然後套用預設值。未設定時，預算為 600 與 `LITELLM_PRISMA_COMMAND_TIMEOUT` 兩者中較大者，因此若某個 deployment 已為了通過緩慢的 deploy 而提高每個指令的逾時，便會保留較大的預算。**預設為 600**
| LITELM_ENVIRONMENT | LiteLLM Instance 的環境。目前僅記錄到 DeepEval，用以判定 DeepEval 整合的環境。
| LITELLM_ASYNCIO_QUEUE_MAXSIZE | asyncio 佇列的最大大小（例如記錄佇列、花費更新佇列，以及 cookbook 範例中的即時音訊，例如 `nova_sonic_realtime.py`）。限制記憶體成長以避免 OOM。預設為 1000。
| LOGFIRE_TOKEN | Logfire 記錄服務的 Token
| LOGFIRE_BASE_URL | Logfire 記錄服務的 Base URL（適用於自架部署）
| LOGGING_WORKER_CONCURRENCY | asyncio event loop 上 logging worker 可同時使用的 coroutine 插槽最大數。預設為 100。設定過高會讓 logging tasks 淹沒 event loop，降低請求的整體延遲。
| LOGGING_WORKER_MAX_QUEUE_SIZE | logging worker 佇列的最大大小。當佇列已滿時，worker 會積極清除任務以騰出空間，而不是捨棄 logs。預設為 50,000
| LOGGING_WORKER_MAX_TIME_PER_COROUTINE | logging worker 中每個 coroutine 在逾時前允許的最長秒數。預設為 20.0
| LOGGING_WORKER_CLEAR_PERCENTAGE | 清除時要擷取的佇列百分比。預設為 50% 
| MAX_BASE64_LENGTH_FOR_LOGGING | 在記錄負載中保留的 base64 字元最大數量。超過此值的 Data URI 會以大小占位符取代。設為 0 可停用截斷。預設為 64
| MAX_BASE64_LENGTH_STDOUT_LOG | 寫入 stdout 的 log line 中，允許原樣保留的 base64 串長度上限（字元數），適用於包含 DEBUG 在內的所有記錄等級。較長的串會在訊息與任何 traceback 中以大小占位符取代，例如 `[base64_data truncated: 2.86MB]`，而其周圍文字會保留。hex 與 decimal 串（摘要、數字 id）則不受影響。logging callbacks（OTEL、Datadog 等）仍會收到完整記錄。設為 0 可停用。預設為 4096
| MAX_COMPETITOR_NAMES | policy template enrichment 中允許的競爭者名稱最大數量。預設為 100
| MAX_EXCEPTION_MESSAGE_LENGTH | 例外訊息的最大長度。預設為 2000
| MAX_ITERATIONS_TO_CLEAR_QUEUE | 在關機期間嘗試清除 logging worker 佇列時的最大迭代次數。預設為 200
| MAX_TIME_TO_CLEAR_QUEUE | 關機期間用於清除 logging worker 佇列的最長秒數。預設為 5.0
| LOGGING_WORKER_AGGRESSIVE_CLEAR_COOLDOWN_SECONDS | 佇列已滿時，允許下一次積極清除操作前的冷卻時間（秒）。預設為 0.5 
| MAX_STRING_LENGTH_PROMPT_IN_DB | 在清理 request bodies 時，花費 logs 中字串的最大長度。超過此長度的字串會被截斷。預設為 1000
| MAX_STRING_LENGTH_STDOUT_LOG | INFO 或更高等級的 log line（訊息或 traceback）可寫入 stdout 的字元最大數。較長的行會在 `litellm_truncated skipped N chars` 標記前後保留首尾，而該標記會計入上限。DEBUG 行永遠不會被截斷，因此 `--detailed_debug` 仍會列印完整負載，而 logging callbacks（OTEL、Datadog 等）仍會收到完整記錄。設為 0 可停用。預設為 4096
| MAX_IN_MEMORY_QUEUE_FLUSH_COUNT | 記憶體內佇列 flush 操作的最大次數。預設為 1000
| MAX_IMAGE_URL_DOWNLOAD_SIZE_MB | 透過 URL 下載圖片的最大大小（MB）。可防止下載非常大的圖片造成記憶體問題。超過此限制的圖片會在下載前被拒絕。設為 0 可完全停用 image URL 處理（所有 image_url 請求都會被封鎖）。預設為 50MB（與 [OpenAI's limit](https://platform.openai.com/docs/guides/images-vision?api-mode=chat#image-input-requirements) 相同）
| MAX_LONG_SIDE_FOR_IMAGE_HIGH_RES | 高解析度圖片長邊的最大長度。預設為 2000
| MAX_REDIS_BUFFER_DEQUEUE_COUNT | Redis buffer dequeue 操作的最大次數。預設為 100
| MAX_REQUEST_BODY_SIZE_TO_REPAIR_MB | LiteLLM 在無法將請求主體解析為 JSON 時，嘗試修復的最大 request body 大小（MB）。修復備援會執行兩次完整主體的 regex 掃描，以修正無效的 surrogate escapes，這會在大型損壞負載上阻塞 event loop。超過此大小的主體會略過修復並立即回傳 400；小於或等於此大小的主體仍會修復。設為 0 可停用上限並始終嘗試修復。預設為 1（MB）
| MAX_SHORT_SIDE_FOR_IMAGE_HIGH_RES | 高解析度圖片短邊的最大長度。預設為 768
| MAX_SIZE_IN_MEMORY_QUEUE | 記憶體內佇列的最大大小。預設為 10000
| MAX_SIZE_PER_ITEM_IN_MEMORY_CACHE_IN_KB | 記憶體快取中每個項目的最大大小（KB）。預設為 512 或 1024
| MAX_SPENDLOG_ROWS_TO_QUERY | 要查詢的 spend log 資料列最大數量。預設為 1,000,000
| MAX_TEAM_LIST_LIMIT | 要列出的 team 最大數量。預設為 20
| MAX_TILE_HEIGHT | 圖片 tile 的最大高度。預設為 512
| MAX_TILE_WIDTH | 圖片 tile 的最大寬度。預設為 512
| MAX_TOKEN_TRIMMING_ATTEMPTS | 嘗試修剪 token 訊息的最大次數。預設為 10
| MAXIMUM_TRACEBACK_LINES_TO_LOG | 在 LiteLLM Logs UI 中記錄 traceback 的最大行數。預設為 100
| MAX_RETRY_DELAY | 重試請求的最長延遲（秒）。預設為 8.0
| MAX_LANGFUSE_INITIALIZED_CLIENTS | 在 proxy 上要初始化的 Langfuse clients 最大數量。預設為 50。這樣設定是因為每初始化一個 client，langfuse 就會初始化 1 個 thread。我們過去曾發生過因為多次初始化 Langfuse 而導致 CPU 使用率達到 100% 的事件。
| MAX_MCP_SEMANTIC_FILTER_TOOLS_HEADER_LENGTH | MCP semantic filter tools 的標頭最大長度。預設為 150
| MAX_POLICY_ESTIMATE_IMPACT_ROWS | 在估算 policy 影響時回傳的列數上限。預設為 1000
| MAX_PAYLOAD_SIZE_FOR_DEBUG_LOG | 完整 DEBUG 序列化的 payload 大小上限（位元組）。超過此值的 payload 會在 logs 中被截斷。預設為 102400（100 KB）
| MIN_NON_ZERO_TEMPERATURE | 非零 temperature 值的最小值。預設為 0.0001
| MINIMUM_CUSTOM_KEY_LENGTH | 使用者在 /key/generate 和 /key/regenerate 提供的 key 值最小長度。預設為 16
| MINIMUM_PROMPT_CACHE_TOKEN_COUNT | 快取 prompt 所需的最小 token 數。預設為 1024
| MISTRAL_API_BASE | Mistral API 的 Base URL。預設為 https://api.mistral.ai
| MISTRAL_API_KEY | Mistral API 的 API 金鑰

| MICROSOFT_AUTHORIZATION_ENDPOINT | Microsoft SSO 的自訂授權端點 URL（覆寫預設的 Microsoft OAuth 授權端點）
| MICROSOFT_CLIENT_ID | Microsoft 服務的用戶端 ID
| MICROSOFT_CLIENT_SECRET | Microsoft 服務的用戶端密鑰
| MICROSOFT_GRAPH_ENDPOINT | 在 SSO 同步 Entra ID 群組成員資格時使用的 Microsoft Graph API 基底 URL。預設為 `https://graph.microsoft.com/v1.0`。若為 Azure Government Cloud（GCC High），請設定為 `https://graph.microsoft.us/v1.0`
| MICROSOFT_SERVICE_PRINCIPAL_ID | Microsoft Enterprise Application 的 Service Principal ID。（如果您希望 litellm 根據其 Microsoft Entra ID 群組自動指派成員到 Litellm Teams，這是一項進階功能）
| MICROSOFT_TENANT | Microsoft Azure 的租戶 ID
| MICROSOFT_TOKEN_ENDPOINT | Microsoft SSO 的自訂權杖端點 URL（覆寫預設的 Microsoft OAuth 權杖端點）
| MICROSOFT_USER_DISPLAY_NAME_ATTRIBUTE | Microsoft SSO 回應中使用者顯示名稱的欄位名稱。預設為 `displayName`
| MICROSOFT_USER_EMAIL_ATTRIBUTE | Microsoft SSO 回應中使用者電子郵件的欄位名稱。預設為 `userPrincipalName`
| MICROSOFT_USER_FIRST_NAME_ATTRIBUTE | Microsoft SSO 回應中使用者名字的欄位名稱。預設為 `givenName`
| MICROSOFT_USER_ID_ATTRIBUTE | Microsoft SSO 回應中使用者 ID 的欄位名稱。預設為 `id`
| MICROSOFT_USER_LAST_NAME_ATTRIBUTE | Microsoft SSO 回應中使用者姓氏的欄位名稱。預設為 `surname`
| MICROSOFT_USERINFO_ENDPOINT | Microsoft SSO 的自訂 userinfo 端點 URL（覆寫預設的 Microsoft Graph userinfo 端點）
| MODEL_COST_MAP_MAX_SHRINK_RATIO | 驗證擷取的模型成本對應相對於本機備份時允許的最大縮減比例。若擷取的對應小於備份的此比例，將予以拒絕。預設為 0.5
| MODEL_COST_MAP_MIN_MODEL_COUNT | 擷取的成本對應要被視為有效時，所需包含的最少模型數量。預設為 50
| MS_TEAMS_WEBHOOK_URL | Microsoft Teams 警示的傳入 webhook URL，當 `ms_teams` 位於 `general_settings.alerting` 時使用。請參閱 [MS Teams 警示](./alerting#ms-teams-webhooks)
| NEW_RELIC_APP_NAME | 用於 New Relic AI Monitoring 整合的應用程式名稱 |
| NEW_RELIC_LICENSE_KEY | 用於 New Relic 驗證的授權金鑰 |
| NO_DOCS | 停用 Swagger UI 文件的旗標
| NO_OPENAPI | 停用 /openapi.json 端點的旗標
| NO_REDOC | 停用 Redoc 文件的旗標
| NO_PROXY | 要略過 proxy 的位址清單
| NON_LLM_CONNECTION_TIMEOUT | 非 LLM 服務連線的逾時秒數。預設為 15
| OAUTH_TOKEN_INFO_ENDPOINT | 用於取得 OAuth 權杖資訊的端點
| OPENAI_BASE_URL | OpenAI API 的基底 URL
| OPENAI_API_BASE | OpenAI API 的基底 URL。預設為 https://api.openai.com/
| OPENAI_API_KEY | OpenAI 服務的 API 金鑰
| OPENAI_CHATGPT_API_BASE | CHATGPT_API_BASE 的替代項。ChatGPT API 的基底 URL
| OPENAI_FILE_SEARCH_COST_PER_1K_CALLS | OpenAI 檔案搜尋每 1000 次請求的成本。預設為 0.0025
| OPENAI_IDENTITY_PROVIDER_ID | OpenAI 工作負載身分聯盟的身分提供者 ID（`idp_...`）。當此項、`OPENAI_SERVICE_ACCOUNT_ID` 和 `OPENAI_IDENTITY_TOKEN_FILE` 都已設定，且未設定 OpenAI API 金鑰時，proxy 會透過將 OIDC token 交換為短效 bearer（RFC 8693）來驗證 `openai/` 模型。這些環境變數是 proxy 層級的預設值；相同的三個值也可以分別設定在部署或憑證層級，作為 `openai_identity_provider_id`、`openai_service_account_id` 和 `openai_identity_token_file`，且其優先順序較高。請參閱 [OpenAI 工作負載身分聯盟](../providers/openai#workload-identity-federation-no-api-key)。需要 `openai>=2.32.0`
| OPENAI_IDENTITY_TOKEN_FILE | 用於 OpenAI 工作負載身分聯盟的 OIDC 主體權杖檔案路徑，例如 Kubernetes 投影的 service account 權杖路徑
| OPENAI_ORGANIZATION | OpenAI 的組織識別碼
| OPENAI_SERVICE_ACCOUNT_ID | OpenAI 平台 service account ID（`user-...`），工作負載身分聯盟會以此進行驗證。與 LiteLLM 虛擬金鑰 service account 無關
| OPENAPI_URL | OpenAPI JSON 端點的路徑。**預設為 "/openapi.json"**
| OPENID_BASE_URL | OpenID Connect 服務的基底 URL
| OPENID_CLIENT_ID | OpenID Connect 驗證的用戶端 ID
| OPENID_CLIENT_SECRET | OpenID Connect 驗證的用戶端密鑰
| OPENMETER_API_ENDPOINT | OpenMeter 整合的 API 端點
| OPENMETER_API_KEY | OpenMeter 服務的 API 金鑰
| OPENMETER_EVENT_TYPE | 傳送至 OpenMeter 的事件類型
| OPENMETER_TRUST_REQUEST_USER | 若為 false，則忽略請求本文中的 `user`，並從已驗證金鑰的 user_id 解析 OpenMeter 主體。預設為 true
| ONYX_API_BASE | Onyx Security AI Guard 服務的基底 URL（預設為 `https://ai-guard.onyx.security`）
| ONYX_API_KEY | Onyx Security AI Guard 服務的 API 金鑰
| ONYX_TIMEOUT | Onyx Guard server 請求的逾時秒數。預設為 10
| OTEL_ENDPOINT | 用於 traces 的 OpenTelemetry 端點
| OTEL_EXPORTER_OTLP_CERTIFICATE | OTLP HTTP exporter 信任的 CA bundle 路徑。由 OpenTelemetry SDK 設定；設定後，會在 OTLP 匯出時優先於 `SSL_CERT_FILE` 和 `ssl_verify`
| OTEL_EXPORTER_OTLP_ENDPOINT | 用於 traces 的 OpenTelemetry 端點
| OTEL_ENVIRONMENT_NAME | OpenTelemetry 的環境名稱
| OTEL_EXPORTER | OpenTelemetry 的 exporter 類型
| OTEL_EXPORTER_OTLP_PROTOCOL | OpenTelemetry 的 exporter 類型
| OTEL_HEADERS | OpenTelemetry 請求的標頭
| OTEL_MODEL_ID | OpenTelemetry tracing 的模型 ID
| OTEL_EXPORTER_OTLP_HEADERS | OpenTelemetry 請求的標頭
| OTEL_SERVICE_NAME | OpenTelemetry 的服務名稱識別碼
| OTEL_TRACER_NAME | OpenTelemetry tracing 的 tracer 名稱
| OTEL_LOGS_EXPORTER | OpenTelemetry logs 的 exporter 類型（例如 console）
| OTEL_IGNORE_CONTEXT_PROPAGATION | 當為 true 時，忽略父 span context propagation（傳入的 `traceparent` 標頭以及任何作用中的 span），使每個 LiteLLM trace 都成為自己的根。預設 `false`
| OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT | 控制是否在 OpenTelemetry traces 中擷取 prompts 與 completions。可接受 `NO_CONTENT`（依規格預設）、`SPAN_ONLY`、`EVENT_ONLY`、`SPAN_AND_EVENT`，或布林形式（`true` 對應 `EVENT_ONLY`，`false` 對應 `NO_CONTENT`）
| OTEL_SEMCONV_STABILITY_OPT_IN | 設為 `gen_ai_latest_experimental` 以發出遵循最新 [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) 的 spans。將 LLM 呼叫 span 重新命名為 `{operation} {model}`，抑制 `raw_gen_ai_request`，新增 `gen_ai.provider.name`，並整合事件。依 OTEL 規格可用逗號分隔
| USE_OTEL_LITELLM_REQUEST_SPAN | 當為 `true` 時，proxy 會為每次 LLM 呼叫發出獨立的 `litellm_request` span，作為 `Received Proxy Server Request` span 的子 span。預設 `false`（自 v1.81.0 起）；LLM 呼叫屬性會直接設定在 proxy 根 span 上。請參閱 [為什麼我看不到 `litellm_request` span？](/docs/observability/opentelemetry_integration#why-dont-i-see-a-litellm_request-span)
| OTEL_DEBUG | 當為 `true` 時，會將 exporter 與 span 建立診斷輸出到 stderr。當 traces 沒有送達後端時很有用。預設 `false`
| DEBUG_OTEL | `OTEL_DEBUG` 的別名
| PAGERDUTY_API_KEY | PagerDuty Alerting 的 API 金鑰
| PANW_PRISMA_AIRS_API_KEY | PANW Prisma AIRS 服務的 API 金鑰
| PANW_PRISMA_AIRS_API_BASE | PANW Prisma AIRS 服務的基底 URL
| PHOENIX_API_KEY | Arize Phoenix 的 API 金鑰
| PHOENIX_COLLECTOR_ENDPOINT | Arize Phoenix 的 API 端點
| PHOENIX_COLLECTOR_HTTP_ENDPOINT | Arize Phoenix 的 API http 端點
| PILLAR_API_BASE | Pillar API Guardrails 的基底 URL
| PILLAR_API_KEY | Pillar API Guardrails 的 API 金鑰
| PILLAR_ON_FLAGGED_ACTION | 內容被標記時要採取的動作（'block' 或 'monitor'）
| PKCE_STRICT_CACHE_MISS | 設為 `true` 時，若在快取中找不到 PKCE code_verifier（例如跨 pod 快取未命中），SSO callback 會回傳 401 錯誤。當為 `false`（預設）時，會記錄警告並在沒有 code_verifier 的情況下繼續。
| POD_NAME | 伺服器的 pod 名稱，這會以 `POD_NAME` 的形式 [送出到 `datadog` 記錄](https://docs.litellm.ai/docs/proxy/logging#datadog) 
| POINTFIVE_API_KEY | PointFive 記錄整合的 API 金鑰。用於為每一批記錄請求預簽署上傳 URL

| POINTFIVE_API_URL | PointFive 擷取 API 的基礎 URL，整合會呼叫此 API。預設為 https://api.pointfive.co/api/v1/ingestion
| POSTHOG_API_KEY | 用於 PostHog 分析整合的 API 金鑰
| POSTHOG_API_URL | PostHog API 的基礎 URL（預設為 `https://us.i.posthog.com`）
| POSTHOG_MOCK | 啟用 PostHog 整合測試的模擬模式。設為 true 時，會攔截 PostHog API 呼叫並回傳模擬回應，而不會發出實際的網路請求。預設為 false
| POSTHOG_MOCK_LATENCY_MS | 啟用模擬模式時，PostHog API 呼叫的模擬延遲（毫秒）。模擬網路往返時間。預設為 100ms
| PRISMA_AUTH_RECONNECT_LOCK_TIMEOUT_SECONDS | Prisma 驗證重新連線的鎖定逾時（秒）。預設為 0.1
| PRISMA_AUTH_RECONNECT_TIMEOUT_SECONDS | Prisma 驗證重新連線嘗試的逾時（秒）。預設為 2.0
| PRISMA_HEALTH_WATCHDOG_ENABLED | 啟用 Prisma DB 健康監控器，以監控連線中斷並在斷線時重新連線。預設為 true
| PRISMA_HEALTH_WATCHDOG_INTERVAL_SECONDS | Prisma 健康監控器探測的間隔（秒）。預設為 30
| PRISMA_HEALTH_WATCHDOG_PROBE_TIMEOUT_SECONDS | 每次 Prisma 健康探測的逾時（秒）。預設為 5.0
| PRISMA_RECONNECT_COOLDOWN_SECONDS | Prisma 重新連線嘗試之間的冷卻時間（秒）。預設為 15
| PRISMA_RECONNECT_ESCALATION_THRESHOLD | 在升級重新連線策略前，連續重新連線失敗的次數。預設為 3
| PRISMA_WATCHDOG_RECONNECT_TIMEOUT_SECONDS | Prisma 監控器觸發的重新連線逾時（秒）。預設為 30.0
| PREDIBASE_API_BASE | Predibase API 的基礎 URL
| PRESIDIO_ANALYZER_API_BASE | Presidio Analyzer 服務的基礎 URL
| PRESIDIO_ANONYMIZER_API_BASE | Presidio Anonymizer 服務的基礎 URL
| PROMETHEUS_BUDGET_METRICS_PER_REQUEST_TIMEOUT | 在略過之前，為發送每個請求的 Prometheus 預算指標所允許的最長秒數；逾時時，該發送會獨立丟棄，因此緩慢的 Redis/DB 查詢不會取消整個成功記錄事件。預設為 5.0
| PROMETHEUS_BUDGET_METRICS_REFRESH_INTERVAL_MINUTES | Prometheus 預算指標的重新整理間隔（分鐘）。預設為 5
| PROMETHEUS_FALLBACK_STATS_SEND_TIME_HOURS | 將統計資料傳送至 Prometheus 的備援時間（小時）。預設為 9
| PROMETHEUS_URL | Prometheus 服務的 URL
| PROMPTLAYER_API_KEY | 用於 PromptLayer 整合的 API 金鑰
| PROXY_ADMIN_ID | 代理伺服器的管理員識別碼
| PROXY_BASE_URL | 代理服務的基礎 URL。MCP OAuth `authorize` 端點也會使用此值，作為驗證瀏覽器提供的 `redirect_uri` 值時代理的公開原點，並決定工作階段/SSO/SAML cookie 是否標記為 `Secure` — 當 LiteLLM 位於 TLS 終止的 ingress 後方時，請將此值設為使用者在網址列中看到的確切原點（例如 `https://llm.example.com`）。僅限完整原點：scheme + host（若非預設則含 port），不可有尾隨斜線，也不可有 path。設定後，它會優先於 `X-Forwarded-*` 標頭（僅在 [`use_x_forwarded_for`](#general_settings---reference) 為 `true` 且請求對等端位於 [`mcp_trusted_proxy_ranges`](#general_settings---reference) 時適用）。請參閱 [安全性最佳實務 — 在反向代理後方保護 cookie](./security_best_practices#8-configure-secure-cookies-behind-a-tls-terminating-reverse-proxy) 與 [MCP OAuth — 反向代理與 ingress 設定](../mcp_oauth#reverse-proxy-and-ingress-configuration)。
| PROXY_BATCH_WRITE_AT | 在將支出記錄批次寫入資料庫前等待的秒數。預設為 10
| PROXY_BATCH_POLLING_INTERVAL | 在輪詢批次以檢查是否已完成前等待的秒數。預設為 3600s（1 小時）
| PROXY_BATCH_POLLING_ENABLED | 設為 `false` 可完全停用 `CheckBatchCost` 與 `CheckResponsesCost` 背景輪詢作業。對於有大量過時受管物件的安裝，在緊急緩解時很有用。預設為 `true`
| PROXY_CONFIG_RELOAD_INTERVAL_SECONDS | 當 `store_model_in_db` 啟用時，每個 pod 從資料庫重新載入 database 內設定的物件（模型、憑證、防護欄等）的頻率。較低的值可加快跨 pod 收斂，但會增加 DB 負載；在 proxy 啟動時套用。預設為 30
| PROXY_DB_LOOKUP_DEADLINE_SECONDS | 預請求 DB 查詢最多可花費的秒數，包含等待 `PROXY_DB_LOOKUP_MAX_CONCURRENCY` 閘道插槽的時間；超過後，請求會以 503 失敗，而不是停留在查詢上。預設為 10，最小值為 0.1
| PROXY_DB_LOOKUP_MAX_CONCURRENCY | 代理同時送至 Prisma query engine 的 key-object DB 備援查詢與支出計數器重新播種查詢的最大數量。額外的查詢會在 proxy 內等待，而不是在 engine 的 HTTP client 內排隊；其每個請求的簿記會隨排隊請求數量增加，並在快取未命中突發時拖慢 event loop。預設為 25
| PROXY_DB_LOOKUP_STALL_WINDOW_SECONDS | 查詢超過 `PROXY_DB_LOOKUP_DEADLINE_SECONDS` 後多久，`/health/readiness` 端點會回報 `"db":"stalled"`。設為 0 可停用。預設為 30
| MAX_OBJECTS_PER_POLL_CYCLE | 每個輪詢週期擷取的受管物件（批次 / 回應）最大數量。可避免在有許多過時列的安裝上發生 OOM。預設為 `50`
| MANAGED_OBJECT_STALENESS_CUTOFF_DAYS | 在非終端狀態下，超過此天數的受管物件會在每個輪詢週期開始時被標記為 `stale_expired` 並略過。預設為 `7`
| PROXY_BUDGET_RESCHEDULER_MAX_TIME | 在檢查資料庫以進行預算重設前，最多等待的秒數。預設為 605
| PROXY_BUDGET_RESCHEDULER_MIN_TIME | 在檢查資料庫以進行預算重設前，最少等待的秒數。預設為 597
| PYTHON_GC_THRESHOLD | GC 閾值（'gen0,gen1,gen2'，例如 '1000,50,50'）；預設為 Python 的值。
| PROXY_LOGOUT_URL | 登出 proxy 服務的 URL
| QDRANT_API_BASE | Qdrant API 的基礎 URL
| QDRANT_API_KEY | Qdrant 服務的 API 金鑰
| QDRANT_SCALAR_QUANTILE | Qdrant 操作的純量分位數。預設為 0.99
| QDRANT_URL | Qdrant 資料庫的連線 URL
| QDRANT_VECTOR_SIZE | Qdrant 操作的向量大小。預設為 1536
| REDIS_CONNECTION_POOL_TIMEOUT | Redis 連線池的逾時（秒）。預設為 5
| REDIS_CIRCUIT_BREAKER_ENABLED | 當為 false 時，Redis circuit breaker 會停用且永遠不會開啟。預設為 true
| REDIS_CIRCUIT_BREAKER_FAILURE_THRESHOLD | Redis circuit breaker 開啟前的連續失敗次數。預設為 5
| REDIS_CIRCUIT_BREAKER_RECOVERY_TIMEOUT | Redis circuit breaker 開啟後嘗試復原前的等待時間（秒）。預設為 60
| REDIS_CIRCUIT_BREAKER_TIMEOUT_MIN_DURATION | 只有逾時的失敗連續持續至少此秒數後，Redis circuit breaker 才會開啟；硬性連線失敗仍會在失敗門檻時開啟。預設為 5.0
| REDIS_CLUSTER_NODES | Redis Cluster 模式的 Redis cluster 啟動節點 JSON 格式清單。範例：`[{"host": "node1", "port": 6379}]`
| REDIS_HOST | Redis 伺服器的主機名稱
| REDIS_PASSWORD | Redis 服務的密碼
| REDIS_PORT | Redis 伺服器的連接埠號
| REDIS_SOCKET_TIMEOUT | LiteLLM 建立且未明確設定 `socket_timeout` 的 Redis client 之 socket 逾時，這在目前表示 Sentinel 連線路徑。**proxy cache client 不會讀取它**：它一律傳遞自己的 `socket_timeout`（預設 5.0 s），因此請改用 `cache_params.socket_timeout` 來變更。請參閱 [Redis socket_timeout](./caching_redis#redis-socket_timeout)。預設為 0.1
| REDIS_TIMEOUT_LOG_INTERVAL | Redis 逾時記錄行之間的秒數。某一連續逾時的第一次逾時會以正常層級記錄，後續則以 DEBUG 記錄，而當間隔時間到達後，會有一行報告被抑制了多少筆。非逾時的 Redis 錯誤不會被節流。預設為 5.0
| REDIS_GCP_SERVICE_ACCOUNT | 用於與 Redis 進行 IAM 驗證的 GCP 服務帳戶。格式："projects/-/serviceAccounts/name@project.iam.gserviceaccount.com"
| REDIS_GCP_SSL_CA_CERTS | 用於安全 GCP Memorystore Redis 連線的 SSL CA 憑證檔案路徑
| REDOC_URL | Redoc Fast API 文件的路徑。**預設為 "/redoc"**
| REPEATED_STREAMING_CHUNK_LIMIT | 用於偵測迴圈的重複串流分塊限制。預設為 100
| REALTIME_CREDENTIAL_RESOLUTION_TIMEOUT_SECONDS | realtime 工作階段開始前，擷取 Vertex AI 存取權杖的逾時（秒）。預設為 20.0
| REALTIME_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES | realtime 連線中 WebSocket 訊息的最大大小（位元組）。預設為 None。
| REPLICATE_MODEL_NAME_WITH_ID_LENGTH | 含 ID 的 Replicate 模型名稱長度。預設為 64
| REPLICATE_POLLING_DELAY_SECONDS | Replicate 輪詢作業的延遲（秒）。預設為 0.5

| REQUEST_TIMEOUT | 請求的逾時時間（秒）。預設為 6000
| RESET_BUDGET_JOB_BATCH_SIZE | 預算重設工作每個交易讀取並提交的最大列數。預設為 500
| RESET_BUDGET_JOB_MAX_CHUNKS_PER_RUN | 每次執行中每個預算重設階段處理的最大批次；剩餘部分會等待下一次執行。預設為 100
| RESPONSES_SESSION_LOOKUP_MAX_ATTEMPTS | 在放棄前，`/v1/responses` 查找位於 `previous_response_id` 後方的工作階段的次數，這樣在前一輪剛送出的後續請求不會比那一輪的支出記錄更早寫入資料庫。預設為 3
| RESPONSES_SESSION_LOOKUP_RETRY_INTERVAL | 兩次工作階段查找嘗試之間的等待秒數。預設為 0.2
| ROOT_REDIRECT_URL | 當 DOCS_URL 設定為非 "/" 的其他值時，重新導向根路徑 (/) 的 URL
| ROUTER_MAX_FALLBACKS | 路由器的備援最大數量。預設為 5
| RUBRIK_API_KEY | 用於向 Rubrik webhook 服務驗證的 Bearer token
| RUBRIK_BATCH_SIZE | 在清空到 Rubrik 之前要緩衝的記錄項目數。預設為 512
| RUBRIK_SAMPLING_RATE | 要記錄到 Rubrik 的請求比例（0.0 到 1.0）。預設為 1.0
| RUBRIK_WEBHOOK_URL | Rubrik webhook 服務的基底 URL，用於工具封鎖與批次記錄
| RUNWAYML_DEFAULT_API_VERSION | RunwayML 服務的預設 API 版本。預設為 "2024-11-06"
| RUNWAYML_POLLING_TIMEOUT | RunwayML 影像生成輪詢的逾時時間（秒）。預設為 600（10 分鐘）
| S3_VECTORS_DEFAULT_DIMENSION | S3 Vectors RAG 擷取的預設向量維度。預設為 1024
| S3_VECTORS_DEFAULT_DISTANCE_METRIC | S3 Vectors RAG 擷取的預設距離度量。選項："cosine"、"euclidean"。預設為 "cosine"
| SECRET_MANAGER_REFRESH_INTERVAL | secret manager 的重新整理間隔（秒）。預設為 86400（24 小時）
| SEMANTIC_CACHE_EMBEDDING_TIMEOUT_SECONDS | 語意快取在每次請求前進行 embedding 呼叫的截止時間（秒）。超過後會略過快取，而不是卡住請求。預設為 5.0
| SERVER_ROOT_PATH | 伺服器應用程式的根路徑
| SEND_USER_API_KEY_ALIAS | 將使用者 API 金鑰別名傳送到 Zscaler AI Guard 的旗標。預設為 False
| SEND_USER_API_KEY_TEAM_ID | 將使用者 API 金鑰團隊 ID 傳送到 Zscaler AI Guard 的旗標。預設為 False
| SEND_USER_API_KEY_USER_ID | 將使用者 API 金鑰使用者 ID 傳送到 Zscaler AI Guard 的旗標。預設為 False
| SET_VERBOSE | [已淘汰] 請改用 `LITELLM_LOG`，並使用 "INFO"、"DEBUG" 或 "ERROR"。請參閱 [除錯文件](./debugging)
| SINGLE_DEPLOYMENT_TRAFFIC_FAILURE_THRESHOLD | 單一部署降溫邏輯判定「合理流量」所需的最小請求數。預設為 1000
| SLACK_DAILY_REPORT_FREQUENCY | 每日 Slack 報告的頻率（例如：daily、weekly）
| SLACK_WEBHOOK_URL | Slack 整合的 webhook URL
| SMTP_HOST | SMTP 伺服器的主機名稱
| SMTP_PASSWORD | SMTP 驗證的密碼（如果 SMTP 不需要驗證，請勿設定）
| SMTP_PORT | SMTP 伺服器的連接埠號碼
| SMTP_SENDER_EMAIL | 在 SMTP 交易中作為寄件者使用的電子郵件地址
| SMTP_SENDER_LOGO | 透過 SMTP 傳送的電子郵件中使用的標誌
| SMTP_TIMEOUT | SMTP 連線與作業的逾時時間（秒）（預設：30）
| SMTP_TLS | 啟用或停用 SMTP 連線 TLS 的旗標
| SMTP_USE_SSL | 設為 "True" 可在任何連接埠上強制使用隱式 SSL（SMTP_SSL）。連接埠 465 不需要設定，因為它會自動使用隱式 SSL；其他連接埠預設使用 STARTTLS（請參閱 SMTP_TLS）
| SMTP_USERNAME | SMTP 驗證的使用者名稱（如果 SMTP 不需要驗證，請勿設定）
| SENDGRID_API_KEY | SendGrid 電子郵件服務的 API 金鑰
| RESEND_API_KEY | Resend 電子郵件服務的 API 金鑰
| SENDGRID_SENDER_EMAIL | 在 SendGrid 電子郵件交易中作為寄件者使用的電子郵件地址 
| SPEND_LOGS_URL | 用於擷取支出記錄的 URL
| SPEND_LOG_CLEANUP_BATCH_SIZE | 清理期間每批次刪除的記錄數。預設為 1000
| STALE_OBJECT_CLEANUP_BATCH_SIZE | 每個清理週期更新的過期受管理物件最大數量。預設為 1000
| SSL_CERTIFICATE | SSL 憑證檔案的路徑
| SSL_ECDH_CURVE | SSL/TLS 金鑰交換使用的 ECDH 曲線（例如：'X25519' 可停用 PQC）。
| SSL_SECURITY_LEVEL | [BETA] SSL/TLS 連線的安全等級。例如 `DEFAULT@SECLEVEL=1`
| SSL_VERIFY | 啟用或停用 SSL 憑證驗證的旗標
| SSL_CERT_FILE | 自訂 CA bundle 的 SSL 憑證檔案路徑
| SUPABASE_KEY | Supabase 服務的 API 金鑰
| SUPABASE_URL | Supabase 執行個體的基底 URL
| STORE_MODEL_IN_DB | 若為 true，則啟用將模型 + 認證資訊儲存在資料庫中。 
| STORE_PROMPTS_IN_SPEND_LOGS | 將每次呼叫的請求與回應 payload 持久化到其 SpendLogs 資料列的旗標，讓 prompts 和 completions 可在記錄 UI 中看見。環境變數等同於 `general_settings.store_prompts_in_spend_logs`；任一來源啟用即可。**預設為 False**
| SYSTEM_MESSAGE_TOKEN_COUNT | 系統訊息的 token 數。預設為 4
| TEST_EMAIL_ADDRESS | 用於測試目的的電子郵件地址
| TOGETHER_AI_4_B | Together AI 4B 模型的大小參數。預設為 4
| TOGETHER_AI_8_B | Together AI 8B 模型的大小參數。預設為 8
| TOGETHER_AI_21_B | Together AI 21B 模型的大小參數。預設為 21
| TOGETHER_AI_41_B | Together AI 41B 模型的大小參數。預設為 41
| TOGETHER_AI_80_B | Together AI 80B 模型的大小參數。預設為 80
| TOGETHER_AI_110_B | Together AI 110B 模型的大小參數。預設為 110
| TOGETHER_AI_EMBEDDING_150_M | Together AI 150M embedding 模型的大小參數。預設為 150
| TOGETHER_AI_EMBEDDING_350_M | Together AI 350M embedding 模型的大小參數。預設為 350
| TOKEN_COUNTER_MAX_CONCURRENT_COUNTS | 每個工作程序執行的本機 token 計數同時上限，超過的會排隊。預設為 4
| TOKEN_COUNTER_MAX_EXACT_CHARS | 每個字串的字元數上限；超過後，本機 token 計數器會對 16 個等距樣本進行 token 化，這些樣本合計等於該字元數，並依字串長度縮放計數。預設為 4000000
| TOOL_CHOICE_OBJECT_TOKEN_COUNT | 工具選擇物件的 token 數。預設為 4
| TOOL_POLICY_CACHE_TTL_SECONDS | 快取工具防護欄結果的 TTL（秒）。預設為 60
| UI_LOGO_PATH | UI 中使用的標誌圖片路徑
| UI_LOGO_PATH_DARK | UI 深色模式中使用的標誌圖片路徑。未設定時會回退到 UI_LOGO_PATH
| UI_PASSWORD | 內建 Admin UI 登入的密碼。若未設定，會接受 master key 作為密碼。這是共用的明文管理員認證，僅供啟動時使用；請建立每位使用者各自的管理員帳戶，並設定 `general_settings.disable_env_credential_login: true` 以關閉此登入路徑。[停用環境認證登入](./ui#5-create-your-own-admin-account-and-disable-environment-credential-login)
| UI_USERNAME | 內建 Admin UI 登入的使用者名稱。預設 `admin`。當 `disable_env_credential_login` 啟用時會被忽略
| UPSTREAM_LANGFUSE_DEBUG | 已淘汰且已忽略：當 `langfuse` callback 移至 Langfuse SDK v4 時，上游 Langfuse 轉送已被移除。設定 `UPSTREAM_LANGFUSE_SECRET_KEY` 會記錄啟動警告
| UPSTREAM_LANGFUSE_HOST | 已淘汰且已忽略：當 `langfuse` callback 移至 Langfuse SDK v4 時，上游 Langfuse 轉送已被移除。設定 `UPSTREAM_LANGFUSE_SECRET_KEY` 會記錄啟動警告
| UPSTREAM_LANGFUSE_PUBLIC_KEY | 已淘汰且已忽略：當 `langfuse` callback 移至 Langfuse SDK v4 時，上游 Langfuse 轉送已被移除。設定 `UPSTREAM_LANGFUSE_SECRET_KEY` 會記錄啟動警告
| UPSTREAM_LANGFUSE_RELEASE | 已淘汰且已忽略：當 `langfuse` callback 移至 Langfuse SDK v4 時，上游 Langfuse 轉送已被移除。設定 `UPSTREAM_LANGFUSE_SECRET_KEY` 會記錄啟動警告
| UPSTREAM_LANGFUSE_SECRET_KEY | 已淘汰且已忽略：當 `langfuse` callback 移至 Langfuse SDK v4 時，上游 Langfuse 轉送已被移除。設定 `UPSTREAM_LANGFUSE_SECRET_KEY` 會記錄啟動警告
| USAGE_TOP_API_KEYS_LIMIT | Admin Usage 聚合活動回應中列出的 API 金鑰最大數量（依支出排名）。總計以及 model、provider、MCP 和 endpoint 的彙總一律涵蓋每個金鑰。**預設為 100**
| USE_AWS_KMS | 啟用 AWS Key Management Service 進行加密的旗標
| USE_DDPROFILER | 讓 Datadog continuous profiler 在 proxy 啟動時開始運作的旗標。獨立於 `USE_DDTRACE`。**預設為 False**
| USE_DDTRACE | 啟用 Datadog tracing 的旗標。在 proxy 啟動時執行 `ddtrace.patch_all()`，並將 LiteLLM 內部的 no-op tracer 換成真正的 ddtrace tracer，因此 LiteLLM 自身的 spans 也會被送出。**預設為 False**

| USE_LITELLM_PROXY | 預設透過 LiteLLM proxy 路由每個 `litellm` SDK completion 呼叫，這可讓模型名稱保持其原始提供者格式，例如 `gemini/gemini-3.5-flash`。相當於 `litellm.use_litellm_proxy = True` 的環境變數。**預設為 False**
| USE_V2_MIGRATION_RESOLVER | 用於選擇哪個 resolver 在啟動時套用資料庫 migration 的旗標。v2 resolver 會略過 diff-and-force 復原，該復原在 rolling deploy 期間有兩個 LiteLLM 版本對同一個資料庫執行 migration 時，會造成 schema thrashing。設為 `false` 可回退至舊版 v1 resolver。**預設為 True**
| USE_PRISMA_MIGRATE | 已在 [PR #13555](https://github.com/BerriAI/litellm/pull/13555) 中移除；`prisma migrate deploy` 現在是預設值。設定此項不會有任何影響，且可安全移除。
| VANTAGE_API_KEY | Vantage 成本匯入整合的 API 金鑰
| VANTAGE_BASE_URL | Vantage API 的 Base URL。預設為 `https://api.vantage.sh`
| VANTAGE_EXPORT_FREQUENCY | Vantage 的匯出頻率 — `hourly`（預設）、`daily` 或 `interval`
| VANTAGE_EXPORT_INTERVAL_SECONDS | 當 VANTAGE_EXPORT_FREQUENCY 為 `interval` 時的間隔（秒）
| VANTAGE_INTEGRATION_TOKEN | Vantage 成本匯入端點的整合權杖
| WANDB_API_KEY | Weights & Biases (W&B) 記錄整合的 API 金鑰
| WANDB_HOST | Weights & Biases (W&B) 服務的主機 URL
| WANDB_PROJECT_ID | Weights & Biases (W&B) 記錄整合的專案 ID
| WEBHOOK_URL | 用於接收來自外部服務的 webhook 的 URL
| SPEND_LOG_RUN_LOOPS | 用於設定 spend_log_cleanup 任務應執行多少次 1000 筆批次刪除的常數
| SPEND_LOG_CLEANUP_BATCH_SIZE | 清理期間每個批次刪除的記錄數。預設為 1000
| SPEND_LOG_PARTITION_INTERVAL | LiteLLM_SpendLogs 分割區的粒度，當表格已分割時：day、week 或 month。預設為 day
| SPEND_LOG_PARTITION_PRECREATE_AHEAD | 每次清理執行時要預先建立的未來 spend-log 分割區數量。預設為 7
| SPEND_LOG_QUEUE_POLL_INTERVAL | spend log 佇列的輪詢間隔（秒）。預設為 2.0
| SPEND_LOG_QUEUE_SIZE_THRESHOLD | 處理前的 spend log 佇列大小門檻。預設為 100
| SPEND_LOG_WRITE_BATCH_MAX_BYTES | 單一傳送至資料庫的 spend-log 寫入語句可序列化負載上限（位元組）。也限制每個 `LiteLLM_SpendLogToolIndex` 和 `LiteLLM_SpendLogGuardrailIndex` 寫入語句，這些語句會針對每個工具或防護欄、每個請求展開為一列。限制 Prisma 查詢引擎的常駐記憶體，這是由其執行的最大語句所設定的高水位標記。如果 pod 儲存提示與回應，而您需要更嚴格的記憶體下限，請降低此值。預設為 2000000
| SPEND_LOG_WRITE_BATCH_MAX_ROWS | 單一 spend-log、工具索引或防護欄索引寫入語句中的最大列數，會與 `SPEND_LOG_WRITE_BATCH_MAX_BYTES` 一起套用，因此以先觸發的預算來切分語句。查詢引擎對每列以及每個位元組都會消耗記憶體，因此當 `store_prompts_in_spend_logs` 關閉且列很小時，這就是會生效的預算。提高它可用記憶體換取更少往返次數。預設為 100
| SPEND_ROLLUP_LOCK_TIMEOUT_MS | 每日 spend rollup 交易（`LiteLLM_DailyUserSpend`、`LiteLLM_DailyToolSpend`、`LiteLLM_DailyModelUsage`、每實體 spend 增量）在 Postgres 取消該語句之前，可能等待另一個 pod 正在更新的列的最長時間（毫秒）（`lock_timeout`，SQLSTATE 55P03）。已取消的語句不會套用，因此寫入器會將其列重新排入下一次 flush，而共用連線會被釋放，而不是卡在持有者後方。當叢集共用少數熱門 rollup 列且 pod 回報 `too many clients already` 時，請降低此值；如果 flush 記錄顯示健康資料庫上有 lock timeout，請提高此值。預設為 5000
| SPEND_LOG_QUEUE_MAX_BYTES | 在記憶體中等待寫入的 spend log 記憶體預算（位元組）。當資料庫無法連線時，失敗的批次會重新排隊而非被丟棄，因此佇列會隨著停機時間持續成長；超過此預算後，最舊的記錄會被丟棄並記錄錯誤。提高它可在較長的停機期間保留更多 spend；在記憶體受限的 pod 上則可降低它，尤其是當提示與回應儲存在 spend log 中時。預設為 64000000
| SPEND_LOG_CLEANUP_MAX_CONSECUTIVE_BATCH_FAILURES | 在 spend log 清理執行中止前可容忍的連續批次失敗次數。預設為 3
| SPEND_LOG_CLEANUP_BATCH_FAILURE_BACKOFF_SECONDS | 失敗的 spend log 清理批次之間的退避時間（秒）。預設為 0.5
| SPEND_LOG_CLEANUP_RUN_BUDGET_SECONDS | 整次 spend log 清理執行的整體預算（秒），由它清理的每個資料表共用。當預算用完時，執行會停止，並在下一個 tick 從相同的 cutoff 繼續。設定 `general_settings.maximum_spend_logs_cleanup_run_budget` 的預設值；若有設定，則會覆寫它。預設為 300
| SPEND_LOG_CLEANUP_BATCH_TIMEOUT_SECONDS | Postgres `statement_timeout` 與 `lock_timeout`（秒），套用於 spend log 清理執行所發出的每個語句，確保不會有單一語句在使用者流量排隊於其後時持有鎖定。設定 `general_settings.maximum_spend_logs_cleanup_batch_timeout` 的預設值；若有設定，則會覆寫它。預設為 30
| SPEND_LOG_CLEANUP_REMAINING_COUNT_CAP | 用於計算仍在等待的過期列數的探測上限，因此回報 backlog 不會本身變成大型資料表的完整掃描。計數會在此值飽和。預設為 100000
| SPEND_COUNTER_RESEED_LOCKS_MAX_SIZE | 用於在強制執行路徑上協調來自資料庫的並行 spend-counter reseed 的每個 counter LRU lock dict 最大大小。預設為 10000。
| COROUTINE_CHECKER_MAX_SIZE_IN_MEMORY | CoroutineChecker 記憶體內快取的最大大小。預設為 1000
| DEFAULT_SHARED_HEALTH_CHECK_TTL | 在 shared health check 模式下，共用快取健康檢查結果的存活時間（秒）。預設為 300（5 分鐘）
| DEFAULT_SHARED_HEALTH_CHECK_LOCK_TTL | 在 shared health check 模式下，健康檢查鎖定的存活時間（秒）。預設為 60（1 分鐘）
| ZSCALER_AI_GUARD_API_KEY | Zscaler AI Guard 服務的 API 金鑰
| ZSCALER_AI_GUARD_POLICY_ID | Zscaler AI Guard 防護欄的政策 ID
| ZSCALER_AI_GUARD_URL | Zscaler AI Guard API 的 Base URL。預設為 https://api.us1.zseclipse.net/v1/detection/execute-policy
