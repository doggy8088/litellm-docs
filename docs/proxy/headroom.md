import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 提示壓縮（Headroom） {#prompt-compression-headroom}

Headroom 是 LLM 應用程式的上下文最佳化層。它會在工具輸出、資料庫結果、檔案讀取與 RAG 負載送達模型之前先進行壓縮，讓您只用一小部分 token 就能得到相同的答案。

此功能可在 `/v1/chat/completions` 與 `/v1/messages`（Anthropic 格式）上使用。

## 示範 {#demo}

<iframe width="840" height="500" src="https://www.loom.com/embed/6cb57484c5444c9aa0585db1a1b17bb5" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 架構 {#architecture}

Headroom 以 sidecar 服務與 LiteLLM 並行執行。用戶端流量會照常送往 LiteLLM 閘道；LiteLLM 會在 `pre_call` 步驟中以進程內方式呼叫 Headroom 來重寫訊息，然後將壓縮後的負載轉送到上游 LLM。用戶端與上游 LLM 提供者不會直接與 Headroom 交談。

![用戶端到 LiteLLM 再到 LLM，Headroom 以 sidecar 形式附加到 LiteLLM](/img/headroom_architecture.png)

## 需求 {#requirements}

LiteLLM v1.92.x 或更新版本，以及可連線的 Headroom proxy。請參閱下方的 [部署 Headroom](#deploy-headroom)，可取得單一檔案 Dockerfile。

若要在穩定版釋出前進行測試，請使用 [v1.92.0-dev.1](https://github.com/BerriAI/litellm/releases/tag/v1.92.0-dev.1) 開發版。

## 快速開始 {#quick-start}

### 1. 在設定中定義防護欄 {#1-define-the-guardrail-in-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-sonnet-4
    litellm_params:
      model: anthropic/claude-sonnet-4
      api_key: os.environ/ANTHROPIC_API_KEY

guardrails:
  - guardrail_name: headroom-compression
    litellm_params:
      guardrail: headroom
      mode: pre_call
      api_base: https://your-headroom-service
#     api_key: os.environ/HEADROOM_API_KEY  [OPTIONAL]
#     default_on: true [OPTIONAL]
```

只有 `pre_call` 才有意義；該防護欄對回應不會產生作用。

如果您希望透過 proxy 的每個請求都進行壓縮，請加入 `default_on: true`。若您希望壓縮採用 opt-in 方式，則請將其關閉（在向部分使用者或工作負載逐步導入時建議如此）。

### 2. 啟動 LiteLLM 閘道 {#2-start-the-litellm-gateway}

```shell
litellm --config config.yaml
```

### 3. 送出請求 {#3-send-a-request}

<Tabs>
<TabItem label="OpenAI 格式" value="openai">

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Summarize the prior conversation..."}
    ],
    "guardrails": ["headroom-compression"]
  }'
```

</TabItem>
<TabItem label="Anthropic 格式" value="anthropic">

```shell
curl -i http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Summarize the prior conversation..."}
    ],
    "litellm_metadata": {"guardrails": ["headroom-compression"]}
  }'
```

</TabItem>
</Tabs>

訊息會以 JSON 主體 `{"messages": [...], "model": "<model>"}` 傳送至位於 `{api_base}/v1/compress` 的 headroom 服務。傳回的 `messages` 清單會在 LLM 呼叫前取代請求負載。

## 依 key 啟用壓縮 {#enabling-compression-per-key}

當未設定 `default_on` 時，壓縮只會針對選擇加入的請求執行。常見的管理員做法是將防護欄附加到虛擬 key，讓使用該 key 的開發者自動獲得壓縮，而不必變更其用戶端程式碼。

建立一個已附加 Headroom 的 key：

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
        "guardrails": ["headroom-compression"]
      }'
```

使用傳回的 key 所送出的每個請求，都會在送達 LLM 之前先經過 `headroom-compression`。若要附加到既有 key，請使用具有相同 `guardrails` 欄位的 `/key/update`。

## 依請求啟用壓縮 {#enabling-compression-per-request}

用戶端可在單一呼叫中選擇加入，無須管理員介入。

<Tabs>
<TabItem label="OpenAI 格式" value="openai-perreq">

在請求主體中傳入 `guardrails` 陣列：

```shell
curl -i http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-..." \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [...],
    "guardrails": ["headroom-compression"]
  }'
```

</TabItem>
<TabItem label="Anthropic 格式" value="anthropic-perreq">

`/v1/messages` 沒有頂層的 `guardrails` 欄位，因此請透過 `litellm_metadata` 進行選擇加入：

```shell
curl -i http://0.0.0.0:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-..." \
  -d '{
    "model": "claude-sonnet-4",
    "max_tokens": 1024,
    "messages": [...],
    "litellm_metadata": {"guardrails": ["headroom-compression"]}
  }'
```

</TabItem>
</Tabs>

回應會包含 `x-litellm-applied-guardrails: headroom-compression` 標頭，讓呼叫端可確認壓縮確實已執行。

## Claude Code 使用方式 {#claude-code-usage}

這是最常見的導入方式：平台管理員希望為透過 Claude Code 傳送大量流量的團隊降低輸入 token 成本，而且不需要每位開發者變更其設定。

流程分為三個步驟。

**管理員：在 `config.yaml` 中註冊 Headroom。** 依照快速開始中的說明定義 `headroom-compression`。將 `default_on` 保持關閉，讓只有選擇加入的 key 才會進行壓縮。

**管理員：發放附加 Headroom 的每位開發者專用 key。** 每位開發者都會取得一個綁定防護欄的虛擬 key。

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
        "key_alias": "claude-code-alice",
        "guardrails": ["headroom-compression"],
        "models": ["claude-sonnet-4"],
        "metadata": {"team": "claude-code-rollout"}
      }'
```

**開發者：將 Claude Code 指向 proxy。** 不需要變更程式碼；Claude Code 會從環境中讀取 `ANTHROPIC_BASE_URL` 與 `ANTHROPIC_AUTH_TOKEN`。

```shell
export ANTHROPIC_BASE_URL="https://your-litellm-proxy.example.com"
export ANTHROPIC_AUTH_TOKEN="sk-the-key-the-admin-issued"

claude
```

從這裡開始，Claude Code 發出的每個 `/v1/messages` 請求都會在傳送至 Anthropic 之前由 Headroom 壓縮。除了費用記錄上的 token 使用量降低之外，開發者不會看到任何行為變更。若要驗證壓縮是否有執行，管理員可以檢查對應費用記錄列上的 `guardrail_information`，或在回應標頭中查看 `x-litellm-applied-guardrails: headroom-compression`。

如果開發者想針對單一請求略過壓縮（例如比較未壓縮的基準），可以在該次呼叫上設定 `x-headroom-bypass: true` 標頭。

## 驗證 Headroom 是否已執行 {#validate-headroom-ran}

在管理員 UI 中，開啟 **Logs** 中的任何請求，捲動到 **Guardrails & Policy Compliance** 面板，您會看到 `headroom-compression` 列在 **Request Lifecycle** 下，作為一個具有其延遲時間的 `pre-call` 步驟，並且在 **Evaluation Details** 下也會有一筆項目。 

![LiteLLM Logs UI 中的 Headroom 防護欄](/img/headroom_logs.png)

## 部署 Headroom {#deploy-headroom}

以下是部署 headroom proxy 的 dockerfile

```Dockerfile
FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && pip install --no-cache-dir "headroom-ai[proxy]==0.27.0" \
    && apt-get purge -y build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8787
ENV HEADROOM_TELEMETRY=off
CMD ["headroom", "proxy", "--host", "0.0.0.0", "--port", "8787"]
```

### 為什麼 `requests_compressed` 可以是 0 {#why-requests_compressed-can-be-0}

Headroom 預設會保護兩種訊息類型，這是設定在 Headroom container 本身，而不是在 LiteLLM 的 `config.yaml` 中：

- `user`/`system` 訊息，除非設定了 `ENV HEADROOM_COMPRESS_USER_MESSAGES=1`。大多數 Claude Code 流量都是 `user` 角色，因此預設部署不會壓縮其中任何內容。
- 帶有 Anthropic `cache_control` 標記的訊息，永遠如此。壓縮它們會破壞 prompt-cache 的位元組比對。沒有可用的覆寫機制。

## 設定參考 {#configuration-reference}

| 參數        | 型別   | 說明                                                                                          |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| `guardrail`  | str    | 必須是 `headroom`。                                                                                  |
| `mode`       | str    | 使用 `pre_call`。該防護欄對回應不會產生作用。                                                |
| `api_base`   | str    | headroom 服務的基底 URL。若未設定，則回退至 `HEADROOM_API_BASE` 環境變數。必填。            |
| `api_key`    | str    | headroom 服務的 Bearer token。若未設定，則回退至 `HEADROOM_API_KEY`。選填。                    |
| `model`      | str    | 轉送給 `/v1/compress` 的模型名稱。預設為請求的 `model` 欄位。                      |
| `default_on` | bool   | 在每個請求上執行防護欄，無須每次呼叫都選擇加入。預設為 `false`。           |

## 環境變數 {#environment-variables}

| 變數             | 說明                                                          |
| -------------------- | -------------------------------------------------------------------- |
| `HEADROOM_API_BASE`  | 當防護欄設定中未設定 `api_base` 時的回退值。        |
| `HEADROOM_API_KEY`   | 當防護欄設定中未設定 `api_key` 時的回退值。         |
