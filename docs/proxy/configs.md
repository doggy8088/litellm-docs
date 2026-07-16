import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 概覽 {#overview}
在 config.yaml 上設定 model list、`api_base`、`api_key`、`temperature` 與 proxy server settings（`master-key`）。

| Param Name           | 說明                                                   |
|----------------------|---------------------------------------------------------------|
| `model_list`         | 伺服器上支援的模型清單，包含各模型專屬設定 |
| `router_settings`   | litellm Router 設定，範例 `routing_strategy="least-busy"` [**查看全部**](./config_settings#router_settings---reference)|
| `litellm_settings`   | litellm Module 設定，範例 `litellm.drop_params=True`、`litellm.set_verbose=True`、`litellm.api_base`、`litellm.cache` [**查看全部**](./config_settings#litellm_settings---reference)|
| `general_settings`   | 伺服器設定，範例設定 `master_key: sk-my_special_key` [**查看全部**](./config_settings#general_settings---reference)|
| `environment_variables`   | 環境變數範例，`REDIS_HOST`、`REDIS_PORT` [**查看全部**](./config_settings#environment-variables---reference)|

**完整清單：** 請查看 `<your-proxy-url>/#/config.yaml` 上的 Swagger UI 文件（例如 http://0.0.0.0:4000/#/config.yaml），以了解您可以在 config.yaml 中傳入的一切內容。

## 快速入門 {#quick-start}

為您的部署設定模型別名。 

在 `config.yaml` 中，model_name 參數是供您的部署使用的面向使用者名稱。 

在下方的 config 中：
- `model_name`：從外部用戶端傳給 litellm 的名稱  
- `litellm_params.model`：傳遞給 litellm.completion() 函式的模型字串

例如： 
- `model=vllm-models` 會路由到 `openai/facebook/opt-125m`。 
- `model=gpt-4o` 會在 `azure/gpt-4o-eu` 和 `azure/gpt-4o-ca` 之間進行負載平衡

```yaml
model_list:
  - model_name: gpt-4o ### RECEIVED MODEL NAME ###
    litellm_params: # all params accepted by litellm.completion() - https://docs.litellm.ai/docs/completion/input
      model: azure/gpt-4o-eu ### MODEL NAME sent to `litellm.completion()` ###
      api_base: https://my-endpoint-europe-berri-992.openai.azure.com/
      api_key: "os.environ/AZURE_API_KEY_EU" # does os.getenv("AZURE_API_KEY_EU")
      rpm: 6      # [OPTIONAL] Rate limit for this deployment: in requests per minute (rpm)
  - model_name: bedrock-claude-v1 
    litellm_params:
      model: bedrock/anthropic.claude-instant-v1
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: "os.environ/AZURE_API_KEY_CA"
      rpm: 6
  - model_name: anthropic-claude
    litellm_params: 
      model: bedrock/anthropic.claude-instant-v1
      ### [OPTIONAL] SET AWS REGION ###
      aws_region_name: us-east-1
  - model_name: vllm-models
    litellm_params:
      model: openai/facebook/opt-125m # the `openai/` prefix tells litellm it's openai compatible
      api_base: http://0.0.0.0:4000/v1
      api_key: none
      rpm: 1440
    model_info: 
      version: 2
  
  # Use this if you want to make requests to `claude-3-haiku-20240307`,`claude-3-opus-20240229`,`claude-2.1` without defining them on the config.yaml
  # Default models
  # Works for ALL Providers and needs the default provider credentials in .env
  - model_name: "*" 
    litellm_params:
      model: "*"

litellm_settings: # module level litellm settings - https://github.com/BerriAI/litellm/blob/main/litellm/__init__.py
  drop_params: True
  success_callback: ["langfuse"] # OPTIONAL - if you want to start sending LLM Logs to Langfuse. Make sure to set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` in your env

general_settings: 
  master_key: sk-1234 # [OPTIONAL] Only use this if you to require all calls to contain this key (Authorization: Bearer sk-1234)
  alerting: ["slack"] # [OPTIONAL] If you want Slack Alerts for Hanging LLM requests, Slow llm responses, Budget Alerts. Make sure to set `SLACK_WEBHOOK_URL` in your env
```
:::info

如需更多與提供者相關的資訊，請[前往此處](../providers/)

:::

#### 步驟 2：使用 config 啟動 Proxy {#step-2-start-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

:::tip

如果您需要詳細的除錯記錄，請以 `--detailed_debug` 執行

```shell
$ litellm --config /path/to/config.yaml --detailed_debug
```

:::

#### 步驟 3：測試它 {#step-3-test-it}

將請求送至模型，其中 `model_name=gpt-4o` 在 config.yaml 中。 

如果有多個具有 `model_name=gpt-4o`，則會進行[負載平衡](https://docs.litellm.ai/docs/proxy/load_balancing)

**[Langchain、OpenAI SDK 使用範例](../proxy/user_keys#request-format)**

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "gpt-4o",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```

## LLM 設定 `model_list` {#llm-configs-model_list}

### 模型專屬參數（API Base、Keys、Temperature、Max Tokens、Organization、Headers 等） {#model-specific-params-api-base-keys-temperature-max-tokens-organization-headers-etc}
您可以使用 config 來儲存模型專屬資訊，例如 api_base、api_key、temperature、max_tokens 等。 

[**所有輸入參數**](https://docs.litellm.ai/docs/completion/input#input-params-1)

**步驟 1**：建立一個 `config.yaml` 檔案
```yaml
model_list:
  - model_name: gpt-4-team1
    litellm_params: # params for litellm.completion() - https://docs.litellm.ai/docs/completion/input#input---request-body
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      azure_ad_token: eyJ0eXAiOiJ
      seed: 12
      max_tokens: 20
  - model_name: gpt-4-team2
    litellm_params:
      model: azure/gpt-4
      api_key: sk-123
      api_base: https://openai-gpt-4-test-v-2.openai.azure.com/
      temperature: 0.2
  - model_name: openai-gpt-4o
    litellm_params:
      model: openai/gpt-4o
      extra_headers: {"AI-Resource Group": "ishaan-resource"}
      api_key: sk-123
      organization: org-ikDc4ex8NB
      temperature: 0.2
  - model_name: mistral-7b
    litellm_params:
      model: ollama/mistral
      api_base: your_ollama_api_base
```

**步驟 2**：使用 config 啟動伺服器

```shell
$ litellm --config /path/to/config.yaml
```

**預期記錄：**

請在您的主控台記錄中尋找這一行，以確認 config.yaml 已正確載入。
```
LiteLLM: Proxy initialized with Config, Set models:
```

### Embedding 模型 - 使用 Sagemaker、Bedrock、Azure、OpenAI、XInference {#embedding-models---use-sagemaker-bedrock-azure-openai-xinference}

查看支援的 Embedding 提供者與模型 [這裡](https://docs.litellm.ai/docs/embedding/supported_embedding)

<Tabs>
<TabItem value="bedrock" label="Bedrock Completion/Chat">

```yaml
model_list:
  - model_name: bedrock-cohere
    litellm_params:
      model: "bedrock/cohere.command-text-v14"
      aws_region_name: "us-west-2"
  - model_name: bedrock-cohere
    litellm_params:
      model: "bedrock/cohere.command-text-v14"
      aws_region_name: "us-east-2"
  - model_name: bedrock-cohere
    litellm_params:
      model: "bedrock/cohere.command-text-v14"
      aws_region_name: "us-east-1"

```

</TabItem>

<TabItem value="sagemaker" label="Sagemaker, Bedrock Embeddings">

以下示範如何在 proxy server 上於 GPT-J embedding（sagemaker endpoint）、Amazon Titan embedding（Bedrock）與 Azure OpenAI embedding 之間路由： 

```yaml
model_list:
  - model_name: sagemaker-embeddings
    litellm_params: 
      model: "sagemaker/berri-benchmarking-gpt-j-6b-fp16"
  - model_name: amazon-embeddings
    litellm_params:
      model: "bedrock/amazon.titan-embed-text-v1"
  - model_name: azure-embeddings
    litellm_params: 
      model: "azure/azure-embedding-model"
      api_base: "os.environ/AZURE_API_BASE" # os.getenv("AZURE_API_BASE")
      api_key: "os.environ/AZURE_API_KEY" # os.getenv("AZURE_API_KEY")
      api_version: "2023-07-01-preview"

general_settings:
  master_key: sk-1234 # [OPTIONAL] if set all calls to proxy will require either this key or a valid generated token
```

</TabItem>

<TabItem value="Hugging Face emb" label="Hugging Face Embeddings">
LiteLLM Proxy 支援所有 <a href="https://huggingface.co/models?pipeline_tag=feature-extraction">特徵擷取 Embedding 模型</a>。

```yaml
model_list:
  - model_name: deployed-codebert-base
    litellm_params: 
      # send request to deployed hugging face inference endpoint
      model: huggingface/microsoft/codebert-base # add huggingface prefix so it routes to hugging face
      api_key: hf_LdS                            # api key for hugging face inference endpoint
      api_base: https://uysneno1wv2wd4lw.us-east-1.aws.endpoints.huggingface.cloud # your hf inference endpoint 
  - model_name: codebert-base
    litellm_params: 
      # no api_base set, sends request to hugging face free inference api https://api-inference.huggingface.co/models/
      model: huggingface/microsoft/codebert-base # add huggingface prefix so it routes to hugging face
      api_key: hf_LdS                            # api key for hugging face                     

```

</TabItem>

<TabItem value="azure" label="Azure OpenAI Embeddings">

```yaml
model_list:
  - model_name: azure-embedding-model # model group
    litellm_params:
      model: azure/azure-embedding-model # model name for litellm.embedding(model=azure/azure-embedding-model) call
      api_base: your-azure-api-base
      api_key: your-api-key
      api_version: 2023-07-01-preview
```

</TabItem>

<TabItem value="openai" label="OpenAI Embeddings">

```yaml
model_list:
- model_name: text-embedding-ada-002 # model group
  litellm_params:
    model: text-embedding-ada-002 # model name for litellm.embedding(model=text-embedding-ada-002) 
    api_key: your-api-key-1
- model_name: text-embedding-ada-002 
  litellm_params:
    model: text-embedding-ada-002
    api_key: your-api-key-2
```

</TabItem>

<TabItem value="xinf" label="XInference">

https://docs.litellm.ai/docs/providers/xinference

**注意：請在 `litellm_params` 前加上 `xinference/` 前綴：`model`，如此 litellm 才知道要路由到 OpenAI**

```yaml
model_list:
- model_name: embedding-model  # model group
  litellm_params:
    model: xinference/bge-base-en   # model name for litellm.embedding(model=xinference/bge-base-en) 
    api_base: http://0.0.0.0:9997/v1
```

</TabItem>

<TabItem value="openai emb" label="OpenAI Compatible Embeddings">

<p>當要呼叫 <a href="https://github.com/xorbitsai/inference">OpenAI Compatible Servers 上的 /embedding 端點</a>時請使用這個。</p>

**注意：請在 `litellm_params` 前加上 `openai/` 前綴：`model`，如此 litellm 才知道要路由到 OpenAI**

```yaml
model_list:
- model_name: text-embedding-ada-002  # model group
  litellm_params:
    model: openai/<your-model-name>   # model name for litellm.embedding(model=text-embedding-ada-002) 
    api_base: <model-api-base>
```

</TabItem>
</Tabs>

#### 啟動 Proxy {#start-proxy}

```shell
litellm --config config.yaml
```

#### 發出請求 {#make-request}
將請求傳送至 `bedrock-cohere`

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --data ' {
  "model": "bedrock-cohere",
  "messages": [
      {
      "role": "user",
      "content": "gm"
      }
  ]
}'
```


### 多個 OpenAI Organization {#multiple-openai-organizations}

只需 1 個 model 定義即可新增跨所有 OpenAI organizations 的所有 openai models

```yaml
  - model_name: *
    litellm_params:
      model: openai/*
      api_key: os.environ/OPENAI_API_KEY
      organization:
       - org-1 
       - org-2 
       - org-3
```

LiteLLM 會自動為每個 org 建立獨立的 deployment。

請透過以下方式確認

```bash
curl --location 'http://0.0.0.0:4000/v1/model/info' \
--header 'Authorization: Bearer ${LITELLM_KEY}' \
--data ''
```

### 負載平衡 {#load-balancing}

:::info
如需更多相關資訊，請前往[此頁面](https://docs.litellm.ai/docs/proxy/load_balancing)
:::

可用來呼叫同一個 model 的多個 instance，並設定如 [routing strategy](https://docs.litellm.ai/docs/routing#advanced) 等內容。

為了達到最佳效能：
- 針對每個 model deployment 設定 `tpm/rpm`。之後的加權選擇會根據既定的 tpm/rpm。
- 在 `router_settings:routing_strategy` 中選擇您的最佳 routing strategy。

LiteLLM 支援
```python
["simple-shuffle", "least-busy", "usage-based-routing","latency-based-routing"], default="simple-shuffle"`
```

當設定了 `tpm/rpm` + `routing_strategy==simple-shuffle` 時，litellm 會根據設定的 tpm/rpm 使用加權選擇。**在我們的負載測試中，為所有 deployments 設定 tpm/rpm + `routing_strategy==simple-shuffle` 可將吞吐量最大化**
- 當使用多個 LiteLLM Servers / Kubernetes 時，請設定 redis 設定 `router_settings:redis_host` 等

```yaml
model_list:
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8001
        rpm: 60      # Optional[int]: When rpm/tpm set - litellm uses weighted pick for load balancing. rpm = Rate limit for this deployment: in requests per minute (rpm).
        tpm: 1000   # Optional[int]: tpm = Tokens Per Minute 
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8002
        rpm: 600      
  - model_name: zephyr-beta
    litellm_params:
        model: huggingface/HuggingFaceH4/zephyr-7b-beta
        api_base: http://0.0.0.0:8003
        rpm: 60000      
  - model_name: gpt-4o
    litellm_params:
        model: gpt-4o
        api_key: <my-openai-key>
        rpm: 200      
  - model_name: gpt-3.5-turbo-16k
    litellm_params:
        model: gpt-3.5-turbo-16k
        api_key: <my-openai-key>
        rpm: 100      

litellm_settings:
  num_retries: 3 # retry call 3 times on each model_name (e.g. zephyr-beta)
  request_timeout: 10 # raise Timeout error if call takes longer than 10s. Sets litellm.request_timeout 
  fallbacks: [{"zephyr-beta": ["gpt-4o"]}] # fallback to gpt-4o if call fails num_retries 
  context_window_fallbacks: [{"zephyr-beta": ["gpt-3.5-turbo-16k"]}, {"gpt-4o": ["gpt-3.5-turbo-16k"]}] # fallback to gpt-3.5-turbo-16k if context window error
  allowed_fails: 3 # cooldown model if it fails > 1 call in a minute. 

router_settings: # router_settings are optional
  routing_strategy: simple-shuffle # Literal["simple-shuffle", "least-busy", "usage-based-routing","latency-based-routing"], default="simple-shuffle"
  model_group_alias: {"gpt-4": "gpt-4o"} # all requests with `gpt-4` will be routed to models with `gpt-4o`
  num_retries: 2
  timeout: 30                                  # 30 seconds
  redis_host: <your redis host>                # set this when using multiple litellm proxy deployments, load balancing state stored in redis
  redis_password: <your redis password>
  redis_port: 1992
```

在您設定好 [虛擬金鑰](https://docs.litellm.ai/docs/proxy/virtual_keys) 或 [custom_callbacks](https://docs.litellm.ai/docs/proxy/logging) 之後，您就可以檢視成本。

### 從環境載入 API 金鑰／設定值 {#load-api-keys--config-values-from-environment}

如果您的環境中已儲存機密，且不想在 config.yaml 中暴露它們，以下說明如何從環境中載入特定模型的金鑰。**這適用於 config.yaml 上的任何值**

```yaml
os.environ/<YOUR-ENV-VAR> # runs os.getenv("YOUR-ENV-VAR")
```

```yaml 
model_list:
  - model_name: gpt-4-team1
    litellm_params: # params for litellm.completion() - https://docs.litellm.ai/docs/completion/input#input---request-body
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      api_key: os.environ/AZURE_NORTH_AMERICA_API_KEY # 👈 KEY CHANGE
```

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/c12d6c3fe80e1b5e704d9846b246c059defadce7/litellm/utils.py#L2366)

感謝 [@David Manouchehri](https://www.linkedin.com/in/davidmanouchehri/) 協助完成這個功能。 

### 集中式憑證管理 {#centralized-credential-management}

一次定義認證並在多個模型之間重複使用。這有助於：
- 機密輪替
- 減少設定重複

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o
      litellm_credential_name: default_azure_credential  # Reference credential below

credential_list:
  - credential_name: default_azure_credential
    credential_values:
      api_key: os.environ/AZURE_API_KEY  # Load from environment
      api_base: os.environ/AZURE_API_BASE
      api_version: "2023-05-15"
    credential_info:
      description: "Production credentials for EU region"
      custom_llm_provider: "azure"
```

#### 主要參數 {#key-parameters}
- `credential_name`：認證集合的唯一識別碼
- `credential_values`：認證／機密的鍵值對（支援 `os.environ/` 語法）
- `credential_info`：使用者提供之認證資訊的鍵值對。雖然不需要任何鍵值對，但該字典必須存在。

### 從密鑰管理服務載入 API 金鑰（Azure Vault 等） {#load-api-keys-from-secret-managers-azure-vault-etc}

[**在 LiteLLM Proxy 中使用 Secret Managers**](../secret)

### 為模型設定支援的環境 - `production`, `staging`, `development` {#set-supported-environments-for-a-model---production-staging-development}

如果您想控制在特定 litellm 環境中曝光哪個模型，請使用這個設定

支援的環境：
- `production`
- `staging`
- `development`

1. 在您的環境中設定 `LITELLM_ENVIRONMENT="<environment>"`。可以是 `production`、`staging` 或 `development`

2. 針對每個模型，在 `model_info.supported_environments` 中設定支援環境的清單
```yaml
model_list:
 - model_name: gpt-3.5-turbo-16k
   litellm_params:
     model: openai/gpt-3.5-turbo-16k
     api_key: os.environ/OPENAI_API_KEY
   model_info:
     supported_environments: ["development", "production", "staging"]
 - model_name: gpt-4
   litellm_params:
     model: openai/gpt-4
     api_key: os.environ/OPENAI_API_KEY
   model_info:
     supported_environments: ["production", "staging"]
 - model_name: gpt-4o
   litellm_params:
     model: openai/gpt-4o
     api_key: os.environ/OPENAI_API_KEY
   model_info:
     supported_environments: ["production"]
```


### 設定自訂 Prompt 範本 {#set-custom-prompt-templates}

LiteLLM 預設會檢查模型是否具有 [prompt template 並套用它](../completion/prompt_formatting.md)（例如，如果 huggingface 模型在其 tokenizer_config.json 中有已儲存的聊天範本）。不過，您也可以在 `config.yaml` 中為您的 proxy 設定自訂 prompt template： 

**步驟 1**：將您的 prompt template 儲存在 `config.yaml`
```yaml
# Model-specific parameters
model_list:
  - model_name: mistral-7b # model alias
    litellm_params: # actual params for litellm.completion()
      model: "huggingface/mistralai/Mistral-7B-Instruct-v0.1" 
      api_base: "<your-api-base>"
      api_key: "<your-api-key>" # [OPTIONAL] for hf inference endpoints
      initial_prompt_value: "\n"
      roles: {"system":{"pre_message":"<|im_start|>system\n", "post_message":"<|im_end|>"}, "assistant":{"pre_message":"<|im_start|>assistant\n","post_message":"<|im_end|>"}, "user":{"pre_message":"<|im_start|>user\n","post_message":"<|im_end|>"}}
      final_prompt_value: "\n"
      bos_token: " "
      eos_token: " "
      max_tokens: 4096
```

**步驟 2**：使用設定啟動伺服器

```shell
$ litellm --config /path/to/config.yaml
``` 

### 設定自訂 tokenizer {#set-custom-tokenizer}

如果您使用 [`/utils/token_counter` 端點](https://litellm-api.up.railway.app/#/llm%20utils/token_counter_utils_token_counter_post)，並且想為某個模型設定自訂 huggingface tokenizer，您可以在 `config.yaml` 中這麼做

```yaml
model_list:
  - model_name: openai-deepseek
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      access_groups: ["restricted-models"]
      custom_tokenizer: 
        identifier: deepseek-ai/DeepSeek-V3-Base
        revision: main
        auth_token: os.environ/HUGGINGFACE_API_KEY
```

**規格**
```
custom_tokenizer: 
  identifier: str # huggingface model identifier
  revision: str # huggingface model revision (usually 'main')
  auth_token: Optional[str] # huggingface auth token 
```

## 一般設定 `general_settings`（DB 連線等） {#general-settings-general_settings-db-connection-etc}

### 設定 DB 集區限制 + 連線逾時 {#configure-db-pool-limits--connection-timeouts}

```yaml
general_settings: 
  database_connection_pool_limit: 10 # sets connection pool per worker for prisma client to postgres db (default: 10, recommended: 10-20)
  database_connection_timeout: 60 # sets a 60s timeout for any connection call to the db 
```

**如何計算正確的值：**

連線限制是套用在**每個 worker process**，而不是每個 instance。這表示如果您有多個 workers，每個 worker 都會建立自己的連線池。

**公式：**
```
database_connection_pool_limit = MAX_DB_CONNECTIONS ÷ (number_of_instances × number_of_workers_per_instance)
```

**範例：**
- 您的資料庫允許的最大連線數為 **100**
- 您正在執行 **1 個** LiteLLM 實例
- 每個實例有 **8 個工作執行緒**（透過 `--num_workers 8` 設定）

計算：`100 ÷ (1 × 8) = 12.5`

由於不應使用 12.5，請向下取整為 **10** 以保留安全緩衝。這表示：
- 8 個工作執行緒中的每一個都會有 10 的連線池上限
- 連線總上限：8 個工作執行緒 × 10 個連線 = 80 個連線
- 這會安全地低於資料庫的 100 連線限制

### 限制閒置 DB 連線 + 傳遞額外 Prisma URL 參數 {#cap-idle-db-connections--pass-extra-prisma-url-params}

如果您看到大量從未關閉的 Prisma 閒置連線，請設定 `database_socket_timeout`，讓 Prisma 在連線靜默超過門檻後關閉任何連線。您也可以使用 `database_connect_timeout` 來限制 Prisma 等待開啟新連線的時間，並透過 `database_extra_connection_params` 將任意額外的查詢字串參數傳遞給 Prisma。

這些對應到 Prisma [PostgreSQL connection URL params](https://www.prisma.io/docs/orm/overview/databases/postgresql) 中同名的參數（去掉 `database_` 前綴），而 LiteLLM 會將它們附加到 `DATABASE_URL` 和 `DIRECT_URL`。

```yaml
general_settings:
  database_connection_pool_limit: 20
  database_socket_timeout: 300   # close any connection idle/slow for >5 min
  database_connect_timeout: 15   # fail fast if a new connection can't be established within 15s
  database_extra_connection_params:
    pgbouncer: "true"            # set if running behind PgBouncer
    statement_cache_size: 0
    sslmode: "require"
```

**注意：**
- `database_socket_timeout` 是限制來自 LiteLLM 的閒置資料庫連線的主要調整項。
- `database_connect_timeout` 和 `database_socket_timeout` 在未設定時會從 URL 中省略，因此會套用 Prisma 的預設值。
- `database_extra_connection_params` 是不具型別的轉傳——您在這裡設定的任何鍵都會**覆寫** LiteLLM 為該鍵設定的預設值（例如，您可以從這個 dict 中覆寫 `pool_timeout`）。可將其用於 `sslmode`、`pgbouncer`、`statement_cache_size`，或任何其他 Prisma URL 參數。

### 停用 Server-Side Prepared Statements {#disable-server-side-prepared-statements}

將 `database_disable_prepared_statements: true` 設為停止 Prisma 重用伺服器端預先準備的陳述式。它會將 `pgbouncer=true` 附加到 Prisma 連線 URL，因此每個查詢都會重新準備，而不是重用快取的執行計畫。

```yaml
general_settings:
  database_disable_prepared_statements: true
```

在以下情況使用：
- LiteLLM 透過 **PgBouncer 的交易池模式** 連線到 Postgres 時，因為連續的查詢可能會落到不同的伺服器連線上，重用的預先準備陳述式會失效。
- 您執行**滾動式部署與結構描述遷移**，並看到 `cached plan must not change result type` 錯誤。當遷移變更了某個欄位的結果型別，而該欄位所參照的執行計畫仍被池化連線持有時，就會觸發此錯誤；啟用此旗標後，不會有可被使失效的重用計畫，因此遷移不會有影響。

其代價是每個查詢都要支付準備成本，而不是將其攤提，因此會增加少量的每查詢額外負擔。`database_extra_connection_params` 中明確的 `pgbouncer` 鍵會優先於此旗標。

## LiteLLM 授權金鑰（企業版） {#litellm-license-key-enterprise}

若要啟用 [LiteLLM Enterprise 功能](https://docs.litellm.ai/docs/enterprise)，請將您的授權金鑰設為環境變數：

```bash
export LITELLM_LICENSE="eyJ..."
```

授權金鑰是在您購買 LiteLLM Enterprise 授權時提供的 JWT 權杖。設定後，LiteLLM 會自動偵測並啟用企業功能。

您也可以將其加入您的 `.env` 檔案：

```env
LITELLM_LICENSE="eyJ..."
```

## 其他 {#extras}

### 停用 Swagger UI {#disable-swagger-ui}

若要從基底 URL 停用 Swagger 文件，請在您的環境中設定 

```env
NO_DOCS="True"
```

，並重新啟動 proxy。 

### 停用 Redoc {#disable-redoc}

若要停用 Redoc 文件（預設為 `<your-proxy-url>/redoc`），請在您的環境中設定 

```env
NO_REDOC="True"
```

，並重新啟動 proxy。 

### 為 proxy 使用 CONFIG_FILE_PATH（更容易在 Azure container 部署） {#use-config_file_path-for-proxy-easier-azure-container-deployment}

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

2. 將檔案路徑儲存為環境變數 

```bash
CONFIG_FILE_PATH="/path/to/config.yaml"
```

3. 啟動 Proxy

```bash
$ litellm 

# RUNNING on http://0.0.0.0:4000
```


### 將 LiteLLM config.yaml 檔案以 s3、GCS Bucket Object/url 提供 {#providing-litellm-configyaml-file-as-a-s3-gcs-bucket-objecturl}

若您的部署服務無法掛載設定檔，請使用此方式（範例 - AWS Fargate、Railway 等）

LiteLLM Proxy 會從 s3 Bucket 或 GCS Bucket 讀取您的 config.yaml 

<Tabs>
<TabItem value="gcs" label="GCS Bucket">

設定以下 .env 變數 
```shell
LITELLM_CONFIG_BUCKET_TYPE = "gcs"                              # set this to "gcs"         
LITELLM_CONFIG_BUCKET_NAME = "litellm-proxy"                    # your bucket name on GCS
LITELLM_CONFIG_BUCKET_OBJECT_KEY = "proxy_config.yaml"         # object key on GCS
```

使用這些 env vars 啟動 litellm proxy - litellm 會從 GCS 讀取您的設定 

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_NAME=<bucket_name> \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="<object_key>> \
   -e LITELLM_CONFIG_BUCKET_TYPE="gcs" \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm-database:latest --detailed_debug
```

</TabItem>

<TabItem value="s3" label="s3">

設定以下 .env 變數 
```shell
LITELLM_CONFIG_BUCKET_NAME = "litellm-proxy"                    # your bucket name on s3 
LITELLM_CONFIG_BUCKET_OBJECT_KEY = "litellm_proxy_config.yaml"  # object key on s3
```

使用這些 env vars 啟動 litellm proxy - litellm 會從 s3 讀取您的設定 

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_NAME=<bucket_name> \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="<object_key>> \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm-database:latest
```
</TabItem>
</Tabs>
