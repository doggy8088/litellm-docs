import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /fine_tuning {#fine_tuning}

:::info

這是僅限 Enterprise 的端點 [在此開始使用 Enterprise](https://enterprise.litellm.ai/demo)

:::

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 支援的提供者 | OpenAI, Azure OpenAI, Vertex AI | - |

#### ⚡️請參閱在 [models.litellm.ai](https://models.litellm.ai/) 的支援模型與提供者完整清單 {#️see-an-exhaustive-list-of-supported-models-and-providers-at-modelslitellmaihttpsmodelslitellmai}
| 成本追蹤 | 🟡 | [如果您需要這項功能，請告訴我們](https://github.com/BerriAI/litellm/issues) |
| 記錄 | ✅ | 可跨所有記錄整合運作 |

將 `finetune_settings` 和 `files_settings` 加入您的 litellm config.yaml，即可使用 fine-tuning 端點。
## `finetune_settings` 與 `files_settings` 的 config.yaml 範例 {#example-configyaml-for-finetune_settings-and-files_settings}
```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

# For /fine_tuning/jobs endpoints
finetune_settings:
  - custom_llm_provider: azure
    api_base: https://exampleopenaiendpoint-production.up.railway.app
    api_key: os.environ/AZURE_API_KEY
    api_version: "2023-03-15-preview"
  - custom_llm_provider: openai
    api_key: os.environ/OPENAI_API_KEY
  - custom_llm_provider: "vertex_ai"
    vertex_project: "adroit-crow-413218"
    vertex_location: "us-central1"
    vertex_credentials: "/Users/ishaanjaffer/Downloads/adroit-crow-413218-a956eef1a2a8.json"

# for /files endpoints
files_settings:
  - custom_llm_provider: azure
    api_base: https://exampleopenaiendpoint-production.up.railway.app
    api_key: fake-key
    api_version: "2023-03-15-preview"
  - custom_llm_provider: openai
    api_key: os.environ/OPENAI_API_KEY
```

## 建立 fine-tuning 檔案 {#create-file-for-fine-tuning}

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
client = AsyncOpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000") # base_url is your litellm proxy url

file_name = "openai_batch_completions.jsonl"
response = await client.files.create(
    extra_headers={"custom-llm-provider": "azure"}, # tell litellm proxy which provider to use
    file=open(file_name, "rb"),
    purpose="fine-tune",
)
```
</TabItem>
<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/files \
    -H "Authorization: Bearer sk-1234" \
    -H "custom-llm-provider: azure" \
    -F purpose="batch" \
    -F file="@mydata.jsonl"
```
</TabItem>
</Tabs>

## 建立 fine-tuning 工作 {#create-fine-tuning-job}

<Tabs>
<TabItem value="azure" label="Azure OpenAI">

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
ft_job = await client.fine_tuning.jobs.create(
    model="gpt-35-turbo-1106",                   # Azure OpenAI model you want to fine-tune
    training_file="file-abc123",                 # file_id from create file response
    extra_headers={"custom-llm-provider": "azure"}, # tell litellm proxy which provider to use
)
```
</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/fine_tuning/jobs \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer sk-1234" \
    -H "custom-llm-provider: azure" \
    -d '{
    "model": "gpt-35-turbo-1106",
    "training_file": "file-abc123"
    }'
```
</TabItem>
</Tabs>

</TabItem>

</Tabs>

### 請求內文 {#request-body}

<Tabs>
<TabItem value="params" label="支援的參數">

* `model`

    **型別：** string  
    **必要：** 是  
    要 fine-tune 的模型名稱

* `custom_llm_provider`

    **型別：** `Literal["azure", "openai", "vertex_ai"]`

    **必要：** 是
    要 fine-tune 的模型名稱。您可以從 [**支援的提供者**](#supported-providers) 中選擇其中之一

* `training_file`

    **型別：** string  
    **必要：** 是  
    包含訓練資料的已上傳檔案 ID。
    - 關於如何上傳檔案，請參閱 **upload file**。
    - 您的資料集必須格式化為 JSONL 檔案。

* `hyperparameters`

    **型別：** object  
    **必要：** 否  
    fine-tuning 工作使用的超參數。
    > #### 支援的 `hyperparameters`
    > #### batch_size
    **型別：** string or integer  
    **必要：** 否  
    每個批次中的範例數。較大的批次大小代表模型參數更新頻率較低，但變異較小。
    > #### learning_rate_multiplier
    **型別：** string or number  
    **必要：** 否  
    學習率的縮放係數。較小的學習率有助於避免過度擬合。

    > #### n_epochs
    **型別：** string or integer  
    **必要：** 否  
    訓練模型的 epoch 數量。epoch 是指完整遍歷一次訓練資料集的週期。

* `suffix`
    **型別：** string or null  
    **必要：** 否  
    **預設值：** null  
    最多 18 個字元的字串，會附加到您的 fine-tuned 模型名稱中。
    範例：`custom-model-name` 的 `suffix` 會產生像 `ft:gpt-4o-mini:openai:custom-model-name:7p4lURel` 這樣的模型名稱。

* `validation_file`
    **型別：** string or null  
    **必要：** 否  
    包含驗證資料的已上傳檔案 ID。
    - 如果提供，這些資料會在 fine-tuning 期間定期用來產生驗證指標。

* `integrations`
    **型別：** array or null  
    **必要：** 否  
    要為您的 fine-tuning 工作啟用的整合清單。

* `seed`
    **型別：** integer or null  
    **必要：** 否  
    seed 會控制工作可重現性。傳入相同的 seed 與工作參數應可產生相同結果，但在少數情況下可能不同。如果未指定 seed，系統會為您產生一個。

</TabItem>
<TabItem value="example" label="請求內文範例">

```json
{
  "model": "gpt-4o-mini",
  "training_file": "file-abcde12345",
  "hyperparameters": {
    "batch_size": 4,
    "learning_rate_multiplier": 0.1,
    "n_epochs": 3
  },
  "suffix": "custom-model-v1",
  "validation_file": "file-fghij67890",
  "seed": 42
}
```
</TabItem>
</Tabs>

## 取消 fine-tuning 工作 {#cancel-fine-tuning-job}

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
# cancel specific fine tuning job
cancel_ft_job = await client.fine_tuning.jobs.cancel(
    fine_tuning_job_id="123",                          # fine tuning job id
    extra_headers={"custom-llm-provider": "azure"},       # tell litellm proxy which provider to use
)

print("response from cancel ft job={}".format(cancel_ft_job))
```
</TabItem>

<TabItem value="curl" label="curl">

```shell
curl -X POST http://localhost:4000/v1/fine_tuning/jobs/ftjob-abc123/cancel \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -H "custom-llm-provider: azure"
```
</TabItem>

</Tabs>

## 列出 fine-tuning 工作 {#list-fine-tuning-jobs}

<Tabs>

<TabItem value="openai" label="OpenAI Python SDK">

```python
list_ft_jobs = await client.fine_tuning.jobs.list(
    extra_headers={"custom-llm-provider": "azure"}   # tell litellm proxy which provider to use
)

print("list of ft jobs={}".format(list_ft_jobs))
```
</TabItem>

<TabItem value="curl" label="curl">

```shell
curl -X GET 'http://localhost:4000/v1/fine_tuning/jobs' \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-1234" \
     -H "custom-llm-provider: azure"
```
</TabItem>

</Tabs>

## [👉 Proxy API 參考文件](https://litellm-api.up.railway.app/#/fine-tuning) {#-proxy-api-referencehttpslitellm-apiuprailwayappfine-tuning}
