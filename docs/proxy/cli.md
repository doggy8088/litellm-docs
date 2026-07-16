# CLI 參數 {#cli-arguments}

本頁文件說明 LiteLLM proxy server 可用的所有命令列介面（CLI）參數。

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
   - **預設：** 系統中的邏輯 CPU 數量，或 `4`（若無法判定）
   - 要啟動的 worker process 數量（uvicorn、gunicorn，或 Granian `--workers`）。
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
   - **簡寫：** `-c`
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
   - 設定 uvicorn keepalive timeout（秒）（uvicorn timeout_keep_alive 參數）。
   - **用法：** 
     ```shell
     litellm --keepalive_timeout 30
     ```
  - **用法 - 設定環境變數：** `KEEPALIVE_TIMEOUT`
    ```shell
    export KEEPALIVE_TIMEOUT=30
    litellm
    ```

### --max_requests_before_restart {#--max_requests_before_restart}
   - **預設：** `None`
   - **類型：** `int`
   - 在達到這麼多請求後重新啟動 worker。這有助於緩解記憶體隨時間成長的問題。
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
   - **類型：** `int`
   - 為每個 worker 在 `[0, jitter]` 到 `--max_requests_before_restart` 之間加入隨機值，讓 workers 以錯開的請求數量回收，而不是同時回收。若沒有 `--max_requests_before_restart`，則不會生效。
   - 對 uvicorn：對應到 `limit_max_requests_jitter`（需要 `uvicorn>=0.41.0`；在較舊版本上，該旗標會被忽略並顯示警告）
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
   - 改以 gunicorn 啟動 proxy，而不是 uvicorn。更適合在正式環境管理多個 worker。
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
   - **狀態：** Beta — 當您想要更高的 gateway 吞吐量時可選擇啟用；uvicorn 仍是預設值。
   - 改以 [Granian](https://github.com/emmett-framework/granian)（以 Rust 為後盾的 ASGI server）啟動 proxy，而不是 uvicorn。支援 HTTP/1 與 HTTP/2。
   - **為什麼要使用：** Granian 將 HTTP 層從 Python 移到 Rust runtime，通常能比單獨使用 uvicorn 更可預測地處理並發 proxy 流量。在 LiteLLM 負載測試中，Granian 相較於等效的 uvicorn 多 worker 設定，展現出 **10–20 RPS 的提升**，並且在**持續負載下有更好的穩定性，且請求失敗更少**。
   - **需求：** Python 3.9+ 與 `granian` 套件（已包含於 `litellm[proxy]`）。
   - **使用 Granian 時的限制：**
     - 不支援 `--max_requests_before_restart`（Granian 使用 `workers_lifetime`，以秒為單位，而不是每個請求的限制）。
     - `--ciphers` 不會套用。
     - `--keepalive_timeout` 與 `--log_config` 僅適用於 uvicorn。
   - **用法：** 
     ```shell
     litellm --config config.yaml --run_granian --num_workers 4
     ```

### --skip_server_startup {#--skip_server_startup}
   - **預設：** `False`
   - **類型：** `bool`（旗標）
   - 在設定完成後略過啟動伺服器（僅適用於資料庫 migration）。
   - **用法：** 
     ```shell
     litellm --skip_server_startup
     ```

## SSL/TLS 設定 {#ssltls-configuration}

### --ssl_keyfile_path {#--ssl_keyfile_path}
   - **預設：** `None`
   - **類型：** `str`
   - SSL keyfile 的路徑。當您想在啟動 proxy 時提供 SSL certificate 時，請使用此選項。
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
   - SSL certfile 的路徑。當您想在啟動 proxy 時提供 SSL certificate 時，請使用此選項。
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
   - SSL 設定要使用的密碼套件。僅與 `--run_hypercorn` 搭配使用。
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
     litellm --model gpt-3.5-turbo
     ```

### --alias {#--alias}
   - **預設：** `None`
   - 模型的別名，供使用者方便參考。請用它將 litellm 模型名稱（例如 "huggingface/codellama/CodeLlama-7b-Instruct-hf"）設定成更容易辨識的名稱（"codellama"）。
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
   - **預設：** `2024-07-01-preview`
   - 針對 Azure 服務，請指定 API 版本。
   - **用法：** 
     ```shell
     litellm --model azure/gpt-deployment --api_version 2023-08-01 --api_base https://<your api base>"
     ```

### --headers {#--headers}
   - **預設：** `None`
   - API 請求的標頭（JSON 字串）。
   - **用法：** 
     ```shell
     litellm --model my-model --headers '{"Authorization": "Bearer token"}'
     ```

### --add_key {#--add_key}
   - **預設：** `None`
   - 將 key 加入模型設定。
   - **用法：** 
     ```shell
     litellm --add_key my-api-key
     ```

### --save {#--save}
   - **類型：** `bool`（旗標）
   - 儲存特定模型的設定。
   - **用法：** 
     ```shell
     litellm --model gpt-3.5-turbo --save
     ```

## 模型參數 {#model-parameters}

### --temperature {#--temperature}
   - **預設：** `None`
   - **類型：** `float`
   - 設定模型的 temperature。
   - **用法：** 
     ```shell
     litellm --temperature 0.7
     ```

### --max_tokens {#--max_tokens}
   - **預設：** `None`
   - **類型：** `int`
   - 設定模型輸出的最大 token 數量。
   - **用法：** 
     ```shell
     litellm --max_tokens 50
     ```

### --request_timeout {#--request_timeout}
   - **預設：** `None`
   - **類型：** `int`
   - 設定 completion 請求的逾時秒數。
   - **用法：** 
     ```shell
     litellm --request_timeout 300
     ```

### --max_budget {#--max_budget}
   - **預設：** `None`
   - **類型：** `float`
   - 設定 API 請求的最高預算。適用於 OpenAI、TogetherAI、Anthropic 等代管模型。
   - **用法：** 
     ```shell
     litellm --max_budget 100.0
     ```

### --drop_params {#--drop_params}
   - **類型：** `bool` (旗標)
   - 捨棄任何未對應的參數。
   - **用法：** 
     ```shell
     litellm --drop_params
     ```

### --add_function_to_prompt {#--add_function_to_prompt}
   - **類型：** `bool` (旗標)
   - 如果傳入了函式但不支援，則將其作為提示的一部分傳入。
   - **用法：** 
     ```shell
     litellm --add_function_to_prompt
     ```

## 資料庫設定 {#database-configuration}

### --iam_token_db_auth {#--iam_token_db_auth}
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 使用 IAM token 驗證連線至 RDS 資料庫，而不是使用密碼。這對於已設定使用 IAM 資料庫驗證的 AWS RDS 執行個體很有用。
   - 啟用後，LiteLLM 會產生 IAM 驗證 token 來連線至資料庫。
   - **必要的環境變數：**
     - `DATABASE_HOST` - RDS 資料庫主機
     - `DATABASE_PORT` - 資料庫連接埠
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

### --use_prisma_db_push {#--use_prisma_db_push}
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 資料庫結構描述更新時，使用 `prisma db push` 取代 `prisma migrate`。當您想要快速同步資料庫結構描述，而不建立 migration 檔案時，這很有用。
   - **用法：** 
     ```shell
     litellm --use_prisma_db_push
     ```

## 偵錯 {#debugging}

### --debug {#--debug}
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 為輸入啟用偵錯模式。
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
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 啟用詳細偵錯模式以檢視冗長的偵錯記錄。
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
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 用於本機偵錯。
   - **用法：** 
     ```shell
     litellm --local
     ```

## 測試與健康檢查 {#testing--health-checks}

### --test {#--test}
   - **類型：** `bool` (旗標)
   - 用於測試請求的 Proxy chat completions URL。
   - **用法：** 
     ```shell
     litellm --test
     ```

### --test_async {#--test_async}
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 呼叫非同步端點 `/queue/requests` 和 `/queue/response`。
   - **用法：** 
     ```shell
     litellm --test_async
     ```

### --num_requests {#--num_requests}
   - **預設：** `10`
   - **類型：** `int`
   - 要對非同步端點發送的請求數量（與 `--test_async` 搭配使用）。
   - **用法：** 
     ```shell
     litellm --test_async --num_requests 100
     ```

### --health {#--health}
   - **類型：** `bool` (旗標)
   - 對 config.yaml 中的所有模型執行健康檢查。
   - **用法：** 
     ```shell
     litellm --health
     ```

## 其他選項 {#other-options}

### --version {#--version}
   - **短格式：** `-v`
   - **類型：** `bool` (旗標)
   - 印出 LiteLLM 版本並結束。
   - **用法：** 
     ```shell
     litellm --version
     ```

### --telemetry {#--telemetry}
   - **預設：** `True`
   - **類型：** `bool`
   - 協助追蹤此功能的使用情況。基於隱私可將其關閉。
   - **用法：** 
     ```shell
     litellm --telemetry False
     ```

### --use_queue {#--use_queue}
   - **預設：** `False`
   - **類型：** `bool` (旗標)
   - 使用 celery workers 處理非同步端點。
   - **用法：** 
     ```shell
     litellm --use_queue
     ```
