---
title: 統一 Token 化
sidebar_label: /tokenize
description: 在您的 /tokenize 請求中選擇模型，透過單一 API 取得其 token 數量、ID 與文字，適用於 vLLM 與 IBM watsonx.ai。
---

# /tokenize {#tokenize}

將模型名稱與一段文字字串傳給 `/tokenize`。讀取 token 數量，以及提供者有回傳時的 token ID 與文字。透過相同的端點與 JSON 欄位，選擇 vLLM 上的 Llama 或 IBM watsonx.ai 上的 Granite。

## /tokenize 或 token 計算 {#tokenize-or-token-counting}

使用 `/tokenize` 檢查模型的 tokenizer 如何切分文字。對於檢查上下文限制或估算輸入成本的應用程式，請使用 token 計算 API，搭配您打算送出的請求，在支援的地方包括 messages 與 tools。當 LiteLLM 使用本機 tokenizer 或備援時，數量可能是估計值。

| API                                                                                                                                | 輸入                                                                  | 結果                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/tokenize`、`litellm.tokenize()`、`litellm.atokenize()`                                                                           | 一段文字字串                                                        | 來自 vLLM 或 watsonx.ai 的 token 數量，以及可用的 token ID 或文字。                                                               |
| `/utils/token_counter`                                                                                                             | Prompt、messages 或 contents；適用時包括 tools 與 system 輸入 | `total_tokens` 與中繼資料。預設使用本機 tokenizer；`?call_endpoint=true` 會在有設定時要求提供者計算。 |
| [提供者 token 計算](./count_tokens.md)：`litellm.acount_tokens()`、`/v1/messages/count_tokens`、`/v1/responses/input_tokens` | 以該 API 格式的 messages 或輸入；支援時包括 tools           | token 數量；提供者支援與備援行為請參閱指南。                                                           |

對於 Python 中的本機計算，[`litellm.token_counter()`](./completion/token_usage.md#3-token_counter) 會回傳整數。`/tokenize` 接受單一 `prompt` 字串，不接受帶有 `messages` 與 `tools` 的完整聊天請求。token 化呼叫會回傳 tokens，不會產生答案。

### Tokens 與 token ID {#tokens-and-token-ids}

token 是文字的一個片段：一個單字、單字的一部分、一個空格，或標點符號。tokenizer 有一個詞彙表，將這些片段對應到數字 ID。請看這個虛構的詞彙表節錄：

| 文字片段 | Token ID |
| ---------- | -------- |
| `"Hello"`  | `101`    |
| `" world"` | `102`    |

在此範例中，若要編碼 `Hello world`，tokenizer 會選取 `"Hello"` 與 `" world"`，查出它們的資料列，並依相同順序回傳 `[101, 102]`。第二個片段包含空格。`count` 是 `2`，因為清單有兩個項目；`101` 與 `102` 這些值不會影響數量。

在推論期間，模型使用每個 ID 查出一個學到的向量：一個代表該 token 的數字清單。模型處理這些向量以預測下一個 token。`/tokenize` 會公開 tokens，而不執行推論。請將 ID 搭配其對應的 tokenizer 詞彙表使用：另一個模型可能使用不同的切分與編號。本表格與 [回應範例](#response) 使用的是說明性 ID。

### 使用案例 {#use-cases}

**檢查很大的 token 數量。** 很長的識別碼或 URL 可能會占用許多 tokens。讀取 `tokens` 查看切分，然後比較您的提示兩個版本的數量與 token 字串。

**除錯 vLLM 中多出的 tokens。** Tokenizer 可能會在文字的開頭或結尾加入 tokens。對相同的提示，先以 `add_special_tokens: true` 呼叫 `/tokenize`，再以 `false` 呼叫。比較數量與 ID，查看模型的 tokenizer 加入了哪些 tokens。

**檢查 vLLM 部署。** 在部署前後，使用相同的 `add_special_tokens` 設定，記錄固定提示的 ID。如果 ID 改變，請檢查 tokenizer 版本與設定。

**取代自訂的提供者轉譯器。** 應用程式開發者透過 `/tokenize` 選取模型。LiteLLM 為 vLLM 與 watsonx.ai 轉譯請求與回應，而服務團隊維護提供者憑證與模型設定。

:::info 安裝

`/tokenize` 需要包含 [LiteLLM PR #48079](https://github.com/BerriAI/litellm/pull/48079) 的版本，以及編譯好的 LiteLLM Rust 擴充套件。LiteLLM 在 Rust 中執行提供者整合；由提供者的 tokenizer 計算 tokens。

:::

## Gateway 快速開始 {#gateway-quickstart}

此範例使用 `meta-llama/Llama-3.1-8B-Instruct`。您的 vLLM 伺服器必須以這個名稱提供該模型；如有需要，請換成您伺服器的模型名稱。將 `HOSTED_VLLM_API_BASE` 設為伺服器 URL，`HOSTED_VLLM_API_KEY` 設為其 API 金鑰，`LITELLM_MASTER_KEY` 設為您的閘道金鑰。如果您的伺服器不需要驗證，請省略 `api_key`。

將它儲存為 `config.yaml`：

```yaml
model_list:
  - model_name: llama-3.1-8b
    litellm_params:
      model: hosted_vllm/meta-llama/Llama-3.1-8B-Instruct
      api_base: os.environ/HOSTED_VLLM_API_BASE
      api_key: os.environ/HOSTED_VLLM_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動閘道：

```bash
litellm --config config.yaml --port 4000
```

在請求中傳入 `llama-3.1-8b` 以選取該模型：

```bash
curl --fail-with-body http://localhost:4000/tokenize \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b",
    "prompt": "Hello world"
  }'
```

您可以使用 `/v1/tokenize` 搭配相同的內文。對於應用程式，請使用可存取 `llama-3.1-8b` 的 [LiteLLM 虛擬金鑰](./proxy/virtual_keys.md)。

### 在每個請求中選擇模型 {#choose-a-model-on-each-request}

請求的 `model` 欄位會從您的閘道設定中選取一個 `model_name`。它的 `litellm_params.model` 則選取提供者與上游模型。在此範例中，`llama-3.1-8b` 選取 vLLM 上的 `meta-llama/Llama-3.1-8B-Instruct`，而 `granite-3.3-8b` 選取 watsonx.ai 上的 `ibm/granite-3-3-8b-instruct`。

若要同時提供兩個模型，請使用此設定。為您的 watsonx.ai 執行個體設定 `WATSONX_API_BASE`、`WATSONX_APIKEY` 與 `WATSONX_PROJECT_ID`。Granite 模型必須在您的專案中可用；如果您使用另一個模型，請換掉它的上游名稱。

```yaml
model_list:
  - model_name: llama-3.1-8b
    litellm_params:
      model: hosted_vllm/meta-llama/Llama-3.1-8B-Instruct
      api_base: os.environ/HOSTED_VLLM_API_BASE
      api_key: os.environ/HOSTED_VLLM_API_KEY
  - model_name: granite-3.3-8b
    litellm_params:
      model: watsonx/ibm/granite-3-3-8b-instruct
      api_base: os.environ/WATSONX_API_BASE
      api_key: os.environ/WATSONX_APIKEY
      project_id: os.environ/WATSONX_PROJECT_ID

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

重新啟動閘道，然後傳入 `granite-3.3-8b` 以選取 Granite。您的 API 金鑰必須可存取該模型名稱。

```bash
curl --fail-with-body http://localhost:4000/tokenize \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "granite-3.3-8b",
    "prompt": "Hello world"
  }'
```

端點與 JSON 欄位維持相同；`model` 值選取 tokenizer。LiteLLM 將 `prompt` 轉譯為 watsonx.ai 的 `input`，加入已設定的專案，並回傳共用的回應欄位。

若要讓用戶端請求穩定，請選擇共用的閘道名稱，例如 `text-tokenizer`，並在閘道設定中更新該名稱背後的模型。當您更換提供者時，用戶端會繼續送出 `"model": "text-tokenizer"`。上游 tokenizer 決定 token 值與數量，因此更換模型可能會改變結果。

## Python SDK {#python-sdk}

同步呼叫使用 `litellm.tokenize()`，非同步呼叫使用 `litellm.atokenize()`。這些範例透過 LiteLLM 的 SDK 呼叫提供者；`api_base` 是提供者的 URL。

### 同步 vLLM 呼叫 {#synchronous-vllm-call}

```python
import os
import litellm

response = litellm.tokenize(
    model="hosted_vllm/meta-llama/Llama-3.1-8B-Instruct",
    prompt="Hello world",
    api_base=os.environ["HOSTED_VLLM_API_BASE"],
    api_key=os.environ.get("HOSTED_VLLM_API_KEY"),
)

print(response.count)
print(response.token_ids)
print(response.tokens)
```

### 非同步 watsonx.ai 呼叫 {#asynchronous-watsonxai-call}

```python
import asyncio
import os
import litellm


async def main():
    response = await litellm.atokenize(
        model="watsonx/ibm/granite-3-3-8b-instruct",
        prompt="Hello world",
        api_base=os.environ["WATSONX_API_BASE"],
        api_key=os.environ["WATSONX_APIKEY"],
        project_id=os.environ["WATSONX_PROJECT_ID"],
    )
    print(response.model_dump())


asyncio.run(main())
```

搭配在 `model_list` 中設定的 [LiteLLM Router](./routing.md) 模型別名，使用 `router.tokenize()` 與 `router.atokenize()`。

## 支援的提供者 {#supported-providers}

| 提供者       | 模型前綴              | `token_ids`       | `tokens`                                                     |
| -------------- | ------------------------- | ----------------- | ------------------------------------------------------------ |
| vLLM           | `hosted_vllm/` 或 `vllm/` | 數字 token ID | 伺服器有回傳時的 token 字串；沒有時為 `null` |
| IBM watsonx.ai | `watsonx/`                | `null`            | Token 字串                                                |

使用 [token 計算 API](./count_tokens.md) 計算其他提供者的 tokens，包括 Gemini。

## 請求 {#request}

兩個閘道路徑都接受帶有以下必填欄位的 JSON 物件：

| 欄位    | 類型   | 說明                                                                                        |
| -------- | ------ | -------------------------------------------------------------------------------------------------- |
| `model`  | string | 已設定的閘道模型名稱，例如 `llama-3.1-8b`，或在 SDK 中帶有提供者前綴的模型名稱。 |
| `prompt` | string | 要 token 化的文字。LiteLLM 接受空字串；提供者會套用它自己的驗證。        |

將提供者選項作為額外的頂層欄位傳入 JSON 內文，或作為 SDK 關鍵字引數。若要讓用戶端在提供者之間可攜，請在閘道的 `litellm_params` 中設定提供者專屬選項，並只從用戶端送出 `model` 與 `prompt`。

明確的呼叫者選項會覆寫其已設定的預設值。LiteLLM 在 token 化時會忽略模型部署上無關的預設值，例如 `temperature` 與 `max_tokens`。它會拒絕呼叫者提供的不支援提供者選項。

### vLLM 選項 {#vllm-options}

| 選項               | 類型    | 預設值 | 說明                                                          |
| -------------------- | ------- | ------- | -------------------------------------------------------------------- |
| `add_special_tokens` | boolean | `true`  | 包含 tokenizer 的特殊 tokens。設為 `false` 可省略它們。 |

設定 `api_base` 或 `HOSTED_VLLM_API_BASE`。以 `/v1` 結尾的 base 可以運作：LiteLLM 會呼叫同層的 `/tokenize` 端點。LiteLLM 會保留任何反向 proxy 路徑前綴。

驗證在有提供時使用 `api_key` 或 `HOSTED_VLLM_API_KEY`。LiteLLM 會在要求 ID 的同時要求 token 字串；省略 token 字串的伺服器會產生 `tokens: null`。

### watsonx.ai 選項 {#watsonxai-options}

| 選項        | 類型   | 預設值                                             | 說明                                                      |
| ------------- | ------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| `project_id`  | string | `WATSONX_PROJECT_ID`                                | 包含模型的專案。`watsonx_project` 是別名。     |
| `space_id`    | string | `WATSONX_DEPLOYMENT_SPACE_ID` 或 `WATSONX_SPACE_ID` | 在沒有專案解析出來時使用的部署空間。                |
| `api_version` | string | `2024-03-13`                                        | watsonx.ai token 化 API 的版本。                     |
| `token`       | string | `WATSONX_TOKEN`                                     | 現有的 bearer token。                                           |
| `zen_api_key` | string | `WATSONX_ZENAPIKEY`                                 | 使用此驗證方式的部署所用的 Zen API 金鑰。 |

提供專案或空間。解析出來的專案優先於空間。設定 `api_base` 或 `WATSONX_API_BASE`；LiteLLM 也接受 `WATSONX_URL` 作為替代。

對於 IBM Cloud 驗證，設定 `api_key` 或 `WATSONX_APIKEY`，LiteLLM 會取得 IAM token。驗證優先順序為明確的 `Authorization` 標頭、bearer `token`、`zen_api_key`，然後是用於 IAM 的 API 金鑰。請將閘道憑證保存在部署設定或環境變數中。

### SDK 連接選項 {#sdk-connection-options}

| 選項                | 類型                      | 說明                                                                              |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `api_base`            | string                    | 提供者 base URL。備援為上方提供者的環境變數。             |
| `api_key`             | string                    | 提供者 API 金鑰。備援為上方提供者的環境變數。              |
| `timeout`             | number 或 `httpx.Timeout` | 提供者請求逾時（秒），或 HTTPX 逾時物件。預設為 60 秒。 |
| `extra_headers`       | mapping                   | 額外的提供者 HTTP 標頭。                                                        |
| `custom_llm_provider` | string                    | 傳入不帶提供者前綴的模型名稱時的明確提供者。                   |

## 回應 {#response}

閘道回傳 JSON。SDK 回傳帶有相同欄位與 `.model_dump()` 方法的 `TokenizeResponse`。

| 欄位       | 類型                                    | 說明                                                                                                          |
| ----------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `model`     | string                                  | 解析出來的上游模型名稱，不帶 LiteLLM 提供者前綴。它可能與請求的閘道別名不同。 |
| `count`     | nonnegative integer                     | 提供者回傳的 token 數量。                                                                               |
| `token_ids` | array of nonnegative integers 或 `null` | 數字 token ID（當提供者公開它們時）。                                                                   |
| `tokens`    | array of strings 或 `null`              | Token 字串（當提供者公開它們時）。                                                                       |

以下範例使用已設定的模型名稱與虛構的 token 資料。您的模型與特殊 token 設定決定實際的 ID、字串與數量。

`llama-3.1-8b` 請求的說明性回應：

```json
{
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "count": 2,
  "token_ids": [101, 102],
  "tokens": ["Hello", " world"]
}
```

`granite-3.3-8b` 請求的說明性回應：

```json
{
  "model": "ibm/granite-3-3-8b-instruct",
  "count": 2,
  "token_ids": null,
  "tokens": ["Hello", " world"]
}
```

`null` 表示提供者在其回應中未公開該表示方式。空陣列表示提供者回傳了零個 tokens。LiteLLM 保留這個區別，不會為 watsonx.ai 虛構 token ID。
