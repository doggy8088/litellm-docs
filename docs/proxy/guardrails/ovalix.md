---
title: "LiteLLM AI 閘道上的 Ovalix 防護欄"
sidebar_label: "Ovalix"
description: "將 LiteLLM AI 閘道的提示、回應、檔案與工具呼叫送往 Ovalix Tracker，由其依原則封鎖或匿名化內容。"
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Ovalix {#ovalix}

<SinceVersion v="1.109.0" />

[Ovalix](https://www.ovalix.ai) 是一個 AI 安全與治理平台。LiteLLM 防護欄會將提示、模型回應、附加檔案、工具呼叫與工具結果送往 Ovalix Tracker，Tracker 會套用某個 Ovalix 應用程式的原則，並能在內容到達模型或用戶端之前將其封鎖或匿名化。

## 快速開始 {#quick-start}

### 1. 取得您的 Ovalix 應用程式詳細資訊 {#1-get-your-ovalix-application-details}

從您的 Ovalix 租戶收集：

- Tracker 基礎 URL 與 API 金鑰
- LiteLLM 應套用其原則的應用程式 ID
- 提示（pre）、回應（post）的檢查點 ID，以及檔案的檢查點 ID（選用）

### 2. 將 Ovalix 加入您的 LiteLLM config.yaml {#2-add-ovalix-to-your-litellm-configyaml}

```yaml title="config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: ovalix-guard
    litellm_params:
      guardrail: ovalix
      mode: [pre_call, post_call]
      default_on: true
      tracker_api_base: os.environ/OVALIX_TRACKER_API_BASE
      tracker_api_key: os.environ/OVALIX_TRACKER_API_KEY
      application_id: os.environ/OVALIX_APPLICATION_ID
      pre_checkpoint_id: os.environ/OVALIX_PRE_CHECKPOINT_ID
      post_checkpoint_id: os.environ/OVALIX_POST_CHECKPOINT_ID
      file_checkpoint_id: os.environ/OVALIX_FILE_CHECKPOINT_ID  # optional
```

若要改從 Admin UI 加入，請開啟 Guardrails 頁面，選取 **Ovalix Guardrail** 作為提供者，並填入相同的欄位。

### 3. 啟動 LiteLLM Proxy {#3-start-litellm-proxy}

```shell
export OPENAI_API_KEY=sk-...
export OVALIX_TRACKER_API_BASE=https://<your-tracker-host>
export OVALIX_TRACKER_API_KEY=...
export OVALIX_APPLICATION_ID=aiApp_...
export OVALIX_PRE_CHECKPOINT_ID=checkpoint_...
export OVALIX_POST_CHECKPOINT_ID=checkpoint_...
litellm --config config.yaml
```

### 4. 發出您的第一個請求 {#4-make-your-first-request}

以下範例假設有一個 Ovalix 應用程式，其原則會封鎖「Project Falcon」一詞並將姓名匿名化。

<Tabs>
<TabItem label="被封鎖的請求" value="blocked">

```shell
curl -sSLX POST 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-your-virtual-key' \
--data '{
  "model": "{{openai_small}}",
  "messages": [
    {"role": "user", "content": "Summarize the launch plan for Project Falcon"}
  ]
}'
```

```json
{
  "error": {
    "message": "This message was blocked by Ovalix",
    "type": "invalid_request_error",
    "param": null,
    "code": "400"
  }
}
```

此訊息是 Ovalix 為該原則回傳的訊息，若無則回退為 `This message was blocked by Ovalix`。模型不會被呼叫。

</TabItem>
<TabItem label="匿名化的請求" value="anonymized">

```shell
curl -sSLX POST 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-your-virtual-key' \
--data '{
  "model": "{{openai_small}}",
  "messages": [
    {"role": "user", "content": "My name is David Cohen. Write a one-line greeting to me."}
  ]
}'
```

Ovalix 會改寫提示，因此模型收到的是 `My name is {Name}. Write a one-line greeting to me.`，並回覆類似 `Hello, {Name}! It's great to connect with you!` 的內容。

</TabItem>
<TabItem label="允許的請求" value="allowed">

```shell
curl -sSLX POST 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-your-virtual-key' \
--data '{
  "model": "{{openai_small}}",
  "messages": [
    {"role": "user", "content": "What is the capital of Japan?"}
  ]
}'
```

請求會到達模型，回應會原封不動地回傳。

</TabItem>
</Tabs>

## Ovalix 檢查的內容 {#what-ovalix-checks}

`pre_call` 會在呼叫模型之前，依 `pre_checkpoint_id` 檢查請求。`post_call` 會依 `post_checkpoint_id` 檢查模型的回應。

| 內容 | Ovalix 封鎖時 | Ovalix 匿名化時 |
|---|---|---|
| 訊息文字 | 最新訊息會讓請求以 400 失敗。對話中較早的訊息會被換成封鎖訊息，請求繼續進行 | 文字會被換成 Ovalix 的改寫版本 |
| 內嵌傳送的檔案與圖片（base64 或 data URL） | 請求以 400 失敗 | 請求以 400 失敗，因為 LiteLLM 無法改寫檔案內容 |
| 工具呼叫，來自對話或模型 | 請求以 400 失敗 | 請求以 400 失敗，因為 LiteLLM 無法改寫工具呼叫 |
| 工具結果 | 請求以 400 失敗 | 請求以 400 失敗，因為 LiteLLM 無法改寫工具結果 |

檔案與圖片會依 `file_checkpoint_id` 檢查，未設定時則依提示或回應檢查點檢查。少數檔案情況的處理方式不同：

- 以 URL 或 `file_id` 提供的檔案或圖片不會被下載，因此 Ovalix 最多只會取得其名稱
- 大於 64 MB 的檔案會以名稱與 `oversize: true` 傳送，而非其內容
- 無法解碼的內嵌檔案會讓請求以 400 失敗

## 支援的參數 {#supported-parameters}

| 參數 | 環境變數 | 必填 | 描述 |
|---|---|---|---|
| `tracker_api_base` | `OVALIX_TRACKER_API_BASE` | 是 | Ovalix Tracker 基礎 URL。LiteLLM 會在其上呼叫 `/tracking/beta/checkpoint` 與 `/tracking/beta/file_checkpoint` |
| `tracker_api_key` | `OVALIX_TRACKER_API_KEY` | 是 | Tracker API 金鑰，以 `x-api-key` 標頭送出 |
| `application_id` | `OVALIX_APPLICATION_ID` | 是 | 其原則適用於此防護欄的 Ovalix 應用程式 |
| `pre_checkpoint_id` | `OVALIX_PRE_CHECKPOINT_ID` | 使用 `pre_call` 時 | 提示的檢查點 |
| `post_checkpoint_id` | `OVALIX_POST_CHECKPOINT_ID` | 使用 `post_call` 時 | 模型回應的檢查點 |
| `file_checkpoint_id` | `OVALIX_FILE_CHECKPOINT_ID` | 否 | 檔案與圖片的檢查點。預設為提示或回應檢查點 |
| `mode` | | 是 | `pre_call`、`post_call`，或以清單同時包含兩者 |
| `default_on` | | 否 | 在每個請求上執行此防護欄。預設為 `false` |
| `timeout` | | 否 | 每次 Tracker 呼叫的等待秒數。預設為 600 |

當基礎 URL、API 金鑰或應用程式 ID 缺少時，proxy 不會啟動。當某個模式沒有對應的檢查點 ID 時，proxy 會記錄 `Skipping guardrail '<guardrail_name>': invalid configuration` 並在沒有此防護欄的情況下啟動，因此變更設定後請檢查啟動記錄。

## 使用多個 Ovalix 應用程式 {#use-several-ovalix-applications}

每個防護欄項目會套用一個 Ovalix 應用程式的原則。若要讓金鑰或團隊使用不同的原則，請為每個應用程式各加一個防護欄項目，並將對應的項目附加到每個金鑰或團隊，或在請求中以 `"guardrails": ["<guardrail_name>"]` 指定。

```yaml title="config.yaml"
guardrails:
  - guardrail_name: ovalix-finance
    litellm_params:
      guardrail: ovalix
      mode: [pre_call, post_call]
      tracker_api_base: os.environ/OVALIX_TRACKER_API_BASE
      tracker_api_key: os.environ/OVALIX_TRACKER_API_KEY
      application_id: aiApp_finance
      pre_checkpoint_id: checkpoint_finance_pre
      post_checkpoint_id: checkpoint_finance_post

  - guardrail_name: ovalix-support
    litellm_params:
      guardrail: ovalix
      mode: [pre_call, post_call]
      tracker_api_base: os.environ/OVALIX_TRACKER_API_BASE
      tracker_api_key: os.environ/OVALIX_TRACKER_API_KEY
      application_id: aiApp_support
      pre_checkpoint_id: checkpoint_support_pre
      post_checkpoint_id: checkpoint_support_post
```

## LiteLLM 送往 Ovalix 的內容 {#what-litellm-sends-to-ovalix}

每次 Tracker 呼叫都會帶有應用程式與檢查點 ID、受檢查的內容，以及：

- `actor`：擁有虛擬金鑰的使用者電子郵件，否則為該使用者的 ID，再否則為 `unknown`
- `session_id`：actor、UTC 日期與應用程式 ID 的簡短雜湊，讓 Ovalix 能將同一位使用者當天的檢查分組

## 支援的端點與錯誤 {#supported-endpoints-and-errors}

Ovalix 可在 `/v1/chat/completions`、`/v1/messages` 與 `/v1/responses` 上運作，包含串流與非串流。在串流請求上，`pre_call` 封鎖會在送出任何片段之前回傳 400。

若 Tracker 無法連線、逾時或回傳錯誤，請求會以 `Ovalix guardrail error: ...` 失敗，而不是在未檢查的情況下通過。

## 延伸閱讀 {#further-reading}

- [Ovalix](https://www.ovalix.ai)
- [LiteLLM 防護欄總覽](https://docs.litellm.ai/docs/proxy/guardrails/quick_start)
