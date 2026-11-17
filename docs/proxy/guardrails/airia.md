---
title: "LiteLLM AI 閘道上的 Airia 防護欄"
sidebar_label: "Airia"
description: "在 LiteLLM AI 閘道上以 Airia 封鎖提示注入、越獄攻擊與敏感資料，並可允許、封鎖或遮罩提示與回應。"
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Airia {#airia}

Airia 防護欄可讓您的 LiteLLM proxy 強制執行您在 [Airia](https://airia.com) 中設定的防護欄：提示在到達模型前接受檢查，回應在到達呼叫者前接受檢查，讓 Airia 能決定每一項是允許、封鎖，還是就地遮罩。

Airia 可偵測：

- 提示注入與越獄嘗試
- 敏感資料（DLP）：PII、PCI、PHI，以及 API 金鑰與憑證等祕密
- 負責任 AI 違規：有毒與有害內容

在設定啟用時，防護欄也會檢查工具呼叫與工具回應。視啟用的防護欄而定，典型的額外延遲低於 40 ms。

## 設定 {#setup}

### 1. 在 Airia 中連接 LiteLLM {#1-connect-litellm-in-airia}

在 Airia 中，開啟 **Discover → Connections → LiteLLM**。啟用該連線並為其建立 API 金鑰。接著開啟 **Security → Runtime Security → Guardrails**，在每個要強制執行的防護欄上將 **LiteLLM** 加入為目標，並選擇每個防護欄適用於提示、回應或兩者。

沒有 LiteLLM 目標的防護欄不會套用於 proxy 流量，即使它已在 Airia 的其他位置啟用。

### 2. 將防護欄加入 `config.yaml` {#2-add-the-guardrail-to-configyaml}

單一入口即可涵蓋兩個方向。`pre_call` 檢查提示；`post_call` 檢查模型的回應。

```yaml title="config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: airia
    litellm_params:
      guardrail: airia
      mode: [pre_call, post_call]
      default_on: true
      api_base: os.environ/AIRIA_GATEWAY_URL
      api_key: os.environ/AIRIA_API_KEY
```

### 3. 啟動 proxy {#3-start-the-proxy}

使用您 Airia 區域的 base URL；若您使用專用租戶，則使用專用部署的 URL。

```shell
export OPENAI_API_KEY=sk-...
export AIRIA_GATEWAY_URL=https://gateway.airia.ai
export AIRIA_API_KEY=ak-...
litellm --config config.yaml
```

### 4. 送出請求 {#4-send-a-request}

以下範例假設有一個以 LiteLLM 為目標的 Airia 防護欄，會封鎖祕密並遮罩個人資料。

<Tabs>
<TabItem label="Blocked" value="blocked">

```shell
curl -sSL http://0.0.0.0:4000/v1/chat/completions \
  -H 'Authorization: Bearer sk-master-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "my aws key is AKIAIOSFODNN7EXAMPLE"}]
  }'
```

```json
{
  "error": {
    "message": "Guardrail raised an exception, Guardrail: airia, Message: Blocked by your organization's content policy.",
    "type": "None",
    "param": "None",
    "code": "400"
  }
}
```

`Message:` 之後的文字，是觸發的 Airia 防護欄上設定的封鎖訊息。在 `pre_call` 下，模型永遠不會被呼叫。

</TabItem>
<TabItem label="Redacted" value="redacted">

```shell
curl -sSL http://0.0.0.0:4000/v1/chat/completions \
  -H 'Authorization: Bearer sk-master-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "Contact me at ada@example.com"}]
  }'
```

呼叫成功。模型收到 `Contact me at [EmailAddress1]` 並正常回應；原始地址永遠不會離開 proxy。

</TabItem>
<TabItem label="Allowed" value="allowed">

```shell
curl -sSL http://0.0.0.0:4000/v1/chat/completions \
  -H 'Authorization: Bearer sk-master-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_small}}",
    "messages": [{"role": "user", "content": "Summarize Hamlet in one sentence."}]
  }'
```

請求未經變更地到達模型，回應也原樣回傳。

</TabItem>
</Tabs>

## 結果 {#outcomes}

Airia 對每次檢查回覆以下其中一種結果。

| 結果 | proxy 的處理方式 |
|---|---|
| **Allow** | 呼叫未經變更地繼續。 |
| **Block** | 回傳 `400` 並附上防護欄設定的訊息。在 `pre_call` 下模型不會被呼叫；在 `post_call` 下回應不會送出。 |
| **Redact** | 將被標記的區段替換為預留位置。在 `pre_call` 下模型看到的是遮罩後的提示；在 `post_call` 下呼叫者收到的是遮罩後的回應。 |
| **Audit** | 呼叫未經變更地繼續，且偵測結果會記錄在 Airia 中。 |


## 參數 {#parameters}

| 參數 | 環境變數 | 說明 |
|---|---|---|
| `api_base` | `AIRIA_GATEWAY_URL` | 您的 Airia AI Gateway 的 base URL。必填。 |
| `api_key` | `AIRIA_API_KEY` | 在 Airia 中為 LiteLLM 連線建立的 API 金鑰。必填。 |
| `timeout` | `AIRIA_TIMEOUT` | 在拒絕請求前等待 Airia 的秒數。預設 `10`。 |

`api_base` 與 `api_key` 必須設定組態值或環境變數其中之一；否則 proxy 將拒絕啟動，而不是在第一個請求時才失敗。

## 模式 {#modes}

| 模式 | 檢查 |
|---|---|
| `pre_call` | 提示，在模型被呼叫之前 |
| `post_call` | 模型的回應，在回傳之前 |


若只想將防護欄套用於部分呼叫者，請勿設定 `default_on`，改用 LiteLLM 標準的[依金鑰防護欄控制](./quick_start#-control-guardrails-per-api-key)依虛擬金鑰啟用。

## 限制 {#limitations}

- 只有圖片而沒有文字或工具呼叫的訊息，完全不會送至 Airia；它會未經掃描直接通過。
- 若 Airia 未在 `timeout` 內回應，請求會被拒絕（fail closed）。
- 串流的 `/v1/chat/completions` 回應會被扣留，直到完成且 Airia 已回覆，然後在單一 delta 中送出並套用任何遮罩。串流的 `/v1/responses` 與 `/v1/messages` 呼叫無法攜帶改寫，因此回應會以相同方式扣留，且 **Redact** 結果會強制以 **Block** 執行；這些路由上的非串流呼叫則照常遮罩。

## 疑難排解 {#troubleshooting}

| 症狀 | 可能原因 |
|---|---|
| 請求以 `Client error '401 Unauthorized'` 失敗 | 該金鑰不是 Airia 中 LiteLLM 連線上的金鑰，或連線未儲存任何金鑰。 |
| 請求以 `Server error '503 Service Unavailable'` 失敗 | LiteLLM 連線已在 Airia 中停用。 |
| 請求成功，但從未有任何內容被封鎖或遮罩 | 沒有防護欄以 LiteLLM 為目標，或目標的方向與執行的 `mode` 不符。 |
