# CLI 引數 {#cli-arguments}

此頁面說明 LiteLLM proxy server 可用的所有命令列介面（CLI）參數。

## 伺服器設定 {#server-configuration}

### --host {#--host}
  - **預設：** `'0.0.0.0'`
  - 伺服器要監聽的主機。
  - **用法：** 
     ```shell
     litellm --host 127.0.0.1
     ```
   - **用法 - 設定環境變數：** `HOST`
    ```shell
    export HOST=127.0.0.1
    litellm
    ```

### --port {#--port}
  - **預設：** `4000`
  - 要繫結伺服器的連接埠。
  - **用法：** 
     ```shell
     litellm --port 8080
     ```
  - **用法 - 設定環境變數：** `PORT`
    ```shell
    export PORT=8080
    litellm
    ```

### --num_workers {#--num_workers}
  - **預設：** `1`，或若已設定則為 `DEFAULT_NUM_WORKERS_LITELLM_PROXY` 環境變數的值
  - 要啟動的工作程序數量（uvicorn、gunicorn，或 Granian `--workers`）。
  - **用法：** 
     ```shell
     litellm --num_workers 4
     ```
  - **用法 - 設定環境變數：** `NUM_WORKERS`
    ```shell
    export NUM_WORKERS=4
    litellm
    ```

### --config {#--config}
  - **短格式：** `-c`
  - **預設：** `None`
  - proxy 設定檔的路徑（例如 config.yaml）。
  - **用法：** 
     ```shell
     litellm --config path/to/config.yaml
     ```

### --log_config {#--log_config}
  - **預設：** `None`
  - **類型：** `str`
  - uvicorn 的記錄設定檔路徑。
  - **用法：** 
     ```shell
     litellm --log_config path/to/log_config.conf
     ```

### --keepalive_timeout {#--keepalive_timeout}
  - **預設：** `None`
  - **類型：** `int`
  - 將 uvicorn keepalive 逾時設定為秒數（uvicorn timeout_keep_alive 參數）。
  - **用法：** 
     ```shell
     litellm --keepalive_timeout 30
     ```
  - **用法 - 設定環境變數：** `KEEPALIVE_TIMEOUT`
    ```shell
    export KEEPALIVE_TIMEOUT=30
    litellm
    ```

### --timeout_worker_healthcheck {#--timeout_worker_healthcheck}
  - **預設：** `None`（套用 uvicorn 預設的 5 秒）
  - **類型：** `int`
  - 將 uvicorn worker 健康檢查逾時設定為秒數（uvicorn `timeout_worker_healthcheck` 參數）。當以 `--num_workers` > 1 執行 uvicorn 時，supervisor process 會輪詢每個 worker；若 worker 在此時間窗內沒有回應（例如因為事件迴圈被同步工作阻塞），它會被 SIGKILL 終止並替換。被終止時會在記錄中顯示為 `Waiting for child process [<pid>]`，後面接著 `Child process [<pid>] died`。如果健康的 worker 在長時間同步操作期間被回收，請提高此值。
  - 需要 `uvicorn>=0.37.0`。在較舊的 uvicorn 版本上，此旗標不會生效：LiteLLM 會在啟動時印出 `Ignoring the flag` 警告，並套用 uvicorn 內建的 5 秒逾時。如果您設定此旗標，請檢查啟動記錄中是否有該警告，以確認它已生效。
  - 僅在直接以 `--num_workers` > 1 執行 uvicorn 時適用；在 `--run_gunicorn` / `--run_hypercorn` 下會被忽略。
  - **用法：** 
     ```shell
     litellm --num_workers 4 --timeout_worker_healthcheck 30
     ```
  - **用法 - 設定環境變數：** `TIMEOUT_WORKER_HEALTHCHECK`
    ```shell
    export TIMEOUT_WORKER_HEALTHCHECK=30
    litellm
    ```

### --max_requests_before_restart {#--max_requests_before_restart}
  - **預設：** `None`
  - **類型：** `int`
  - 在處理這麼多請求後重新啟動 worker。這有助於緩解記憶體隨時間成長的問題。
  - 對 uvicorn：對應到 `limit_max_requests`
  - 對 gunicorn：對應到 `max_requests`
  - **用法：** 
     ```shell
     litellm --max_requests_before_restart 10000
     ```
  - **用法 - 設定環境變數：** `MAX_REQUESTS_BEFORE_RESTART`
    ```shell
    export MAX_REQUESTS_BEFORE_RESTART=10000
    litellm
    ```

### --max_requests_before_restart_jitter {#--max_requests_before_restart_jitter}
  - **預設：** `None`
  - **類型：** `int`（旗標）
  - 為每個 worker 加上一個介於 `[0, jitter]` 到 `--max_requests_before_restart` 的隨機值，讓各個 worker 以錯開的請求數量回收，而不是同時回收。若沒有 `--max_requests_before_restart`，則不會生效。
  - 對 uvicorn：對應到 `limit_max_requests_jitter`（需要 `uvicorn>=0.41.0`；在較舊版本上，此旗標會被忽略並顯示警告）
  - 對 gunicorn：對應到 `max_requests_jitter`
  - **用法：** 
     ```shell
     litellm --max_requests_before_restart 10000 --max_requests_before_restart_jitter 1000
     ```
  - **用法 - 設定環境變數：** `MAX_REQUESTS_BEFORE_RESTART_JITTER`
    ```shell
    export MAX_REQUESTS_BEFORE_RESTART=10000
    export MAX_REQUESTS_BEFORE_RESTART_JITTER=1000
    litellm
    ```

## 伺服器後端選項 {#server-backend-options}

### --run_gunicorn {#--run_gunicorn}
  - **預設：** `False`
  - **類型：** `bool`（旗標）
  - 改以 gunicorn 啟動 proxy，而不是 uvicorn。較適合在正式環境中管理多個 worker。
  - **用法：** 
     ```shell
     litellm --run_gunicorn
     ```

### --run_hypercorn {#--run_hypercorn}
  - **預設：** `False`
  - **類型：** `bool`（旗標）
  - 改以 hypercorn 啟動 proxy，而不是 uvicorn。支援 HTTP/2。
  - **用法：** 
     ```shell
     litellm --run_hypercorn
     ```

### --run_granian {#--run_granian}
  - **預設：** `False`
  - **類型：** `bool`（旗標）
  - **狀態：** Beta。當您想要更高的 gateway 吞吐量時可選用；uvicorn 仍是預設值。
  - 改以 [Granian](https://github.com/emmett-framework/granian)（由 Rust 支援的 ASGI server）啟動 proxy，而不是 uvicorn。支援 HTTP/1 與 HTTP/2。
  - **為什麼要使用它：** Granian 將 HTTP 層從 Python 移到 Rust runtime，通常比單獨使用 uvicorn 更能穩定地處理並發 proxy 流量。在 LiteLLM 壓力測試中，Granian 相較於等效的 uvicorn 多 worker 設定，展現出 **10–20 RPS 的提升**，且在持續負載下**更穩定、請求失敗更少**。
  - **需求：** Python {{python_min_version}}+ 與 `granian` 套件（已包含於 `litellm[proxy]`）。
  - **使用 Granian 時的限制：**
    - 不支援 `--max_requests_before_restart`（Granian 使用以秒為單位的 `workers_lifetime`，而不是每個請求的限制）。
    - 不會套用 `--ciphers`。
    - `--keepalive_timeout` 與 `--log_config` 僅適用於 uvicorn。
  - **用法：** 
     ```shell
     litellm --config config.yaml --run_granian --num_workers 4
     ```

### --skip_server_startup {#--skip_server_startup}
  - **預設：** `False`
  - **類型：** `bool`（旗標）
  - 在設定完成後不要啟動伺服器（僅供資料庫遷移時使用）。
  - **用法：** 
     ```shell
     litellm --skip_server_startup
     ```

## SSL/TLS 設定 {#ssltls-configuration}

### --ssl_keyfile_path {#--ssl_keyfile_path}
  - **預設：** `None`
  - **類型：** `str`
  - SSL keyfile 的路徑。當您想在啟動 proxy 時提供 SSL 憑證時使用此項。
  - **用法：** 
     ```shell
     litellm --ssl_keyfile_path /path/to/key.pem --ssl_certfile_path /path/to/cert.pem
     ```
  - **用法 - 設定環境變數：** `SSL_KEYFILE_PATH`
    ```shell
    export SSL_KEYFILE_PATH=/path/to/key.pem
    litellm
    ```

### --ssl_certfile_path {#--ssl_certfile_path}
  - **預設：** `None`
  - **類型：** `str`
  - SSL certfile 的路徑。當您想在啟動 proxy 時提供 SSL 憑證時使用此項。
  - **用法：** 
     ```shell
     litellm --ssl_certfile_path /path/to/cert.pem --ssl_keyfile_path /path/to/key.pem
     ```
  - **用法 - 設定環境變數：** `SSL_CERTFILE_PATH`
    ```shell
    export SSL_CERTFILE_PATH=/path/to/cert.pem
    litellm
    ```

### --ciphers {#--ciphers}
  - **預設：** `None`
  - **類型：** `str`
  - SSL 設定要使用的密碼套件。僅與 `--run_hypercorn` 一起使用。
  - **用法：** 
     ```shell
     litellm --run_hypercorn --ssl_keyfile_path /path/to/key.pem --ssl_certfile_path /path/to/cert.pem --ciphers "ECDHE+AESGCM"
     ```

## 模型設定 {#model-configuration}

### --model 或 -m {#--model-or--m}
  - **預設：** `None`
  - 要傳遞給 LiteLLM 的模型名稱。
  - **用法：** 
     ```shell
     litellm --model {{openai_small}}
     ```

### --alias {#--alias}
  - **預設：** `None`
  - 模型的別名，方便人類閱讀參照。可用來將 litellm 模型名稱（例如 "huggingface/codellama/CodeLlama-7b-Instruct-hf"）改成更容易理解的名稱（"codellama"）。
  - **用法：** 
     ```shell
     litellm --alias my-gpt-model
     ```

### --api_base {#--api_base}
  - **預設：** `None`
  - LiteLLM 應呼叫的模型 API base。
  - **用法：** 
     ```shell
     litellm --model huggingface/tinyllama --api_base https://k58ory32yinf1ly0.us-east-1.aws.endpoints.huggingface.cloud
     ```

### --api_version {#--api_version}
  - **預設：** `litellm.AZURE_DEFAULT_API_VERSION`（目前為 `2025-02-01-preview`）
  - 針對 Azure 服務，請指定 API 版本。
  - **用法：** 
     ```shell
     litellm --model azure/gpt-deployment --api_version 2023-08-01 --api_base https://<your api base>"
     ```

### --headers {#--headers}
  - **預設：** `None`
  - API 呼叫的標頭（JSON 字串）。
  - **用法：** 
     ```shell
     litellm --model my-model --headers '{"Authorization": "Bearer token"}'
     ```

### --add_key {#--add_key}
  - **預設：** `None`
  - 將鍵新增至模型設定。
  - **用法：** 
     ```shell
     litellm --add_key my-api-key
     ```

### --save {#--save}
  - **類型：** `bool`（旗標）
  - 儲存模型專屬設定。
  - **用法：** 
     ```shell
     litellm --model {{openai_small}} --save
     ```

## 模型參數 {#model-parameters}

### --temperature {#--temperature}
  - **預設值：** `None`
  - **類型：** `float`
  - 為模型設定溫度。
  - **用法：** 
     ```shell
     litellm --temperature 0.7
     ```

### --max_tokens {#--max_tokens}
  - **預設值：** `None`
  - **類型：** `int`
  - 為模型輸出設定最大 token 數。
  - **用法：** 
     ```shell
     litellm --max_tokens 50
     ```

### --request_timeout {#--request_timeout}
  - **預設值：** `None`
  - **類型：** `int`
  - 設定 completion 請求的逾時秒數。
  - **用法：** 
     ```shell
     litellm --request_timeout 300
     ```

### --max_budget {#--max_budget}
  - **預設值：** `None`
  - **類型：** `float`
  - 設定 API 請求的最高預算。適用於 OpenAI、TogetherAI、Anthropic 等代管模型。
  - **用法：** 
     ```shell
     litellm --max_budget 100.0
     ```

### --drop_params {#--drop_params}
  - **類型：** `bool`（旗標）
  - 捨棄任何未對應的參數。
  - **用法：** 
     ```shell
     litellm --drop_params
     ```

### --add_function_to_prompt {#--add_function_to_prompt}
  - **類型：** `bool`（旗標）
  - 如果傳入了函式但不受支援，則將其作為提示的一部分傳遞。
  - **用法：** 
     ```shell
     litellm --add_function_to_prompt
     ```

## 資料庫設定 {#database-configuration}

### --iam_token_db_auth {#--iam_token_db_auth}
  - **預設值：** `False`
  - **類型：** `bool`（旗標）
  - 使用短效 IAM token 來向 Amazon RDS 或 Amazon Aurora 上的 PostgreSQL 驗證，而不是使用儲存的密碼。
  - LiteLLM 會使用 boto3 產生 token，並在其過期前重新整理。
  - 此選項僅支援 AWS。若為 Azure Database for PostgreSQL，請改用 [`--azure_postgresql_auth`](#--azure_postgresql_auth)。若為 Google Cloud SQL，請搭配 `--auto-iam-authn` 執行 Cloud SQL Auth Proxy，然後設定 `DATABASE_URL` 以使用本機 proxy 連線。請勿為 Cloud SQL 啟用此旗標。
  - **必要環境變數：**
     - `DATABASE_HOST` - RDS 資料庫主機
     - `DATABASE_PORT` - 資料庫埠號
     - `DATABASE_USER` - 資料庫使用者
     - `DATABASE_NAME` - 資料庫名稱
     - `DATABASE_SCHEMA`（選用）- 資料庫結構描述
  - **用法：** 
     ```shell
     litellm --iam_token_db_auth
     ```
   - **用法 - 設定環境變數：** `IAM_TOKEN_DB_AUTH`
     ```shell
     export IAM_TOKEN_DB_AUTH=True
     export DATABASE_HOST=mydb.us-east-1.rds.amazonaws.com
     export DATABASE_PORT=5432
     export DATABASE_USER=mydbuser
     export DATABASE_NAME=mydb
     litellm
     ```

#### Amazon ECS 設定 {#amazon-ecs-setup}

對於在 Amazon ECS 上執行的 LiteLLM：

1. 在 Amazon RDS 或 Aurora PostgreSQL 執行個體上啟用 IAM 資料庫驗證。
2. 將 PostgreSQL 使用者設定為可使用 IAM 驗證。
3. 授予 ECS 任務角色以該使用者身分連線至資料庫的權限。
4. 在 ECS 任務定義中設定 `IAM_TOKEN_DB_AUTH=True` 與必要的 `DATABASE_*` 變數。

LiteLLM 會使用任務角色的 AWS 憑證來產生並重新整理資料庫 token。不需要靜態資料庫密碼。

LiteLLM 啟動時會從任務環境讀取這些設定。若要變更旗標或連線參數，請部署新的任務定義或重新啟動 proxy 任務。token 重新整理不需要重新啟動。

### --azure_postgresql_auth {#--azure_postgresql_auth}
  - **預設值：** `False`
  - **類型：** `bool`（旗標）
  - 使用短效 Microsoft Entra ID 存取 token 來向 Azure Database for PostgreSQL Flexible Server 驗證，而不是使用儲存的密碼。
  - LiteLLM 透過 Azure Identity 程式庫請求 `https://ossrdbms-aad.database.windows.net/.default` 範圍的 token，並在其過期前重新整理。
  - 此選項僅支援 Azure，且不能與 `--iam_token_db_auth` 一起使用。當兩者都啟用時，proxy 會在啟動時結束。
  - **必要環境變數：**
     - `DATABASE_HOST` - 伺服器主機，例如 `myserver.postgres.database.azure.com`
     - `DATABASE_USER` - 作為 PostgreSQL 角色存在的 Microsoft Entra 主體，例如受控身分名稱或使用者主體名稱
     - `DATABASE_NAME` - 資料庫名稱
     - `DATABASE_PORT`（選用）- 資料庫埠號，預設為 `5432`
     - `DATABASE_SCHEMA`（選用）- 資料庫結構描述
   - **用法：**
     ```shell
     litellm --azure_postgresql_auth
     ```
   - **用法 - 設定環境變數：** `AZURE_POSTGRESQL_AUTH`
     ```shell
     export AZURE_POSTGRESQL_AUTH=True
     export DATABASE_HOST=myserver.postgres.database.azure.com
     export DATABASE_USER=litellm-proxy
     export DATABASE_NAME=litellm
     litellm
     ```

#### 選擇 Azure 身分識別 {#choosing-the-azure-identity}

LiteLLM 會從環境讀取憑證，因此一個旗標即可涵蓋所有代管模式。

| 身分 | 如何選取 |
| --- | --- |
| 使用者指派的受控身分 | 將 `AZURE_CLIENT_ID` 設為該身分的用戶端 ID。 |
| 系統指派的受控身分 | 若主機已附加，則無需額外設定。 |
| AKS 上的工作負載身分 | 讓 workload identity webhook 將 `AZURE_CLIENT_ID`、`AZURE_TENANT_ID`、`AZURE_AUTHORITY_HOST` 和 `AZURE_FEDERATED_TOKEN_FILE` 注入到 pod 中。 |
| 服務主體 | 設定 `AZURE_CLIENT_ID`、`AZURE_TENANT_ID` 和 `AZURE_CLIENT_SECRET`。 |
| 本機開發 | 執行 `az login`，LiteLLM 便會使用該工作階段。 |

#### 設定 DATABASE_USER {#setting-database_user}

將主體放入 `DATABASE_USER`，並完全依照 PostgreSQL 所識別的方式輸入，包括任何 `@`。像 `litellm@contoso.onmicrosoft.com` 這樣的使用者主體名稱會原樣輸入，LiteLLM 會在組裝連線 URL 時對其進行百分比編碼。已經完成百分比編碼的值，例如 `litellm%40contoso.onmicrosoft.com`，會原封不動地傳遞，因此從 RDS IAM 驗證延續過來的部署仍可正常運作。

#### Azure Kubernetes Service 設定 {#azure-kubernetes-service-setup}

對於在 AKS 上搭配工作負載身分執行的 LiteLLM：

1. 在 Azure Database for PostgreSQL Flexible Server 上啟用 Microsoft Entra 驗證。
2. 為工作負載身分建立 PostgreSQL 角色，方式可以是將其新增為 Microsoft Entra 管理員，或由既有管理員執行 `pgaadauth_create_principal`。
3. 授予該角色 LiteLLM 在資料庫上所需的權限。
4. 在 LiteLLM 服務帳戶上加上該身分的用戶端 ID 註解，並為 pod 加上工作負載身分標籤。
5. 在部署上設定 `AZURE_POSTGRESQL_AUTH=True` 與必要的 `DATABASE_*` 變數。

LiteLLM 會使用 pod 的聯邦 token 來請求並重新整理資料庫 token。不需要靜態資料庫密碼，因此伺服器可以維持停用密碼驗證。

LiteLLM 啟動時會從環境讀取這些設定。若要變更旗標或連線參數，請重新啟動 proxy。token 重新整理不需要重新啟動。

#### 使用 Helm chart 部署 {#deploying-with-the-helm-chart}

此 chart 會針對每個資料庫端點開啟該旗標。設定 `database.writer.useAzureEntraAuth` 會產生 `AZURE_POSTGRESQL_AUTH=true`，並省略 `DATABASE_PASSWORD`，因此寫入端的 Secret 中不需要密碼。使用者名稱仍來自 `passwordSecret.usernameKey`。

```yaml
database:
  writer:
    host: myserver.postgres.database.azure.com
    dbname: litellm
    useAzureEntraAuth: true
    passwordSecret:
      name: litellm-writer-secret
      usernameKey: username
```

讀取複本會在 `database.reader` 下使用相同的鍵，而它也要求寫入端同樣使用 Entra 驗證，因為 proxy 只會讀取一個全域切換。若在同一端點上同時設定 `useIAMAuth` 與 `useAzureEntraAuth`，render 會失敗並顯示一則訊息，列出這兩者。

### --use_prisma_db_push {#--use_prisma_db_push}
  - **預設值：** `False`
  - **類型：** `bool`（旗標）
  - 使用 `prisma db push` 取代 `prisma migrate` 來進行資料庫結構描述更新。當您想快速同步資料庫結構描述而不建立 migration 檔案時，這很有用。
  - **用法：** 
     ```shell
     litellm --use_prisma_db_push
     ```

## 疑難排解 {#debugging}

### --debug {#--debug}
  - **預設值：** `False`
  - **類型：** `bool`（旗標）
  - 啟用輸入的除錯模式。
  - **用法：** 
     ```shell
     litellm --debug
     ```
  - **用法 - 設定環境變數：** `DEBUG`
    ```shell
    export DEBUG=True
    litellm
    ```

### --detailed_debug {#--detailed_debug}
  - **預設值：** `False`
  - **類型：** `bool`（旗標）
  - 啟用詳細除錯模式以檢視詳細的除錯記錄。
  - **用法：** 
     ```shell
     litellm --detailed_debug
     ```
  - **用法 - 設定環境變數：** `DETAILED_DEBUG`
    ```shell
    export DETAILED_DEBUG=True
    litellm
    ```

### --local {#--local}
  - **預設值：** `False`
  - **類型：** `bool`（旗標）
  - 用於本機除錯用途。
  - **用法：** 
     ```shell
     litellm --local
     ```

## 測試與健康檢查 {#testing--health-checks}

### --test {#--test}
  - **類型：** `bool`（旗標）
  - 用於進行測試請求的 Proxy chat completions URL。
  - **用法：** 
     ```shell
     litellm --test
     ```

### --test_async {#--test_async}
  - **預設：** `False`
  - **類型：** `bool`（旗標）
  - 呼叫非同步端點 `/queue/requests` 和 `/queue/response`。
  - **用法：** 
     ```shell
     litellm --test_async
     ```

### --num_requests {#--num_requests}
  - **預設：** `10`
  - **類型：** `int`
  - 向非同步端點發送的請求數量（與 `--test_async` 搭配使用）。
  - **用法：** 
     ```shell
     litellm --test_async --num_requests 100
     ```

### --health {#--health}
  - **類型：** `bool`（旗標）
  - 對 config.yaml 中所有模型執行健康檢查。
  - **用法：** 
     ```shell
     litellm --health
     ```

## 其他選項 {#other-options}

### --version {#--version}
  - **短格式：** `-v`
  - **類型：** `bool`（旗標）
  - 列印 LiteLLM 版本並結束。
  - **用法：** 
     ```shell
     litellm --version
     ```

### --use_queue {#--use_queue}
  - **預設：** `False`
  - **類型：** `bool`（旗標）
  - 使用 celery workers 處理非同步端點。
  - **用法：** 
     ```shell
     litellm --use_queue
     ```
