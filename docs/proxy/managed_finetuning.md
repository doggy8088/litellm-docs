# ✨ [BETA] LiteLLM 管理檔案與微調 {#-beta-litellm-managed-files-with-finetuning}

:::info

這是 LiteLLM Enterprise 的免費功能。

可透過 `litellm[proxy]` 套件或任何 `litellm` docker image 使用。

:::

| 屬性 | 值 | 備註 |
| --- | --- | --- |
| Proxy | ✅ |  |
| SDK | ❌ | 需要 postgres DB 來儲存檔案 ids。 |
| 可跨所有 [Batch 提供者](../batches#supported-providers) 使用 | ✅ |  |
| 支援的 endpoints | `/fine_tuning/jobs` |  |

## 概覽 {#overview}

可用於：

- 以 OpenAI 格式在 OpenAI/Azure/Vertex AI 上建立微調工作（不需要額外的 `custom_llm_provider` 參數）。
- 依 key/user/team 控制微調模型存取權（與 chat completion models 相同）

## （Proxy 管理員）使用方式 {#proxy-admin-usage}

以下說明如何讓開發者存取您的微調模型。

### 1. 設定 config.yaml {#1-setup-configyaml}

在 `supported_endpoints` 清單中加入 `/fine_tuning`。這會告知開發者此模型支援 `/fine_tuning` endpoint。

```yaml showLineNumbers title="litellm_config.yaml"
model_list:
  - model_name: "gpt-4.1-openai"
    litellm_params:
      model: gpt-4.1
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      supported_endpoints: ["/chat/completions", "/fine_tuning"]
```

### 2. 建立 Virtual Key {#2-create-virtual-key}

```bash showLineNumbers title="create_virtual_key.sh"
curl -L -X POST 'https://{PROXY_BASE_URL}/key/generate' \
-H 'Authorization: Bearer ${PROXY_API_KEY}' \
-H 'Content-Type: application/json' \
-d '{"models": ["gpt-4.1-openai"]}'
```


現在您可以使用 virtual key 來存取微調模型（請參閱開發者流程）。

## （開發者）使用方式 {#developer-usage}

以下說明如何建立 LiteLLM 管理的檔案，並使用該檔案執行微調 CRUD 操作。 

### 1. 建立 request.jsonl  {#1-create-requestjsonl}

```json showLineNumbers title="request.jsonl"
{"messages": [{"role": "system", "content": "Clippy is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "What's the capital of France?"}, {"role": "assistant", "content": "Paris, as if everyone doesn't know that already."}]}
{"messages": [{"role": "system", "content": "Clippy is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "Who wrote 'Romeo and Juliet'?"}, {"role": "assistant", "content": "Oh, just some guy named William Shakespeare. Ever heard of him?"}]}
```

### 2. 上傳檔案 {#2-upload-file}

指定 `target_model_names: "<model-name>"` 以啟用 LiteLLM 管理的檔案與請求驗證。

model-name 應與 request.jsonl 中的 model-name 相同

```python showLineNumbers title="create_finetuning_job.py"
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

# Upload file
finetuning_input_file = client.files.create(
    file=open("./request.jsonl", "rb"),
    purpose="fine-tune",
    extra_body={"target_model_names": "gpt-4.1-openai"}
)
print(finetuning_input_file)

```


**檔案會寫入到哪裡？**：

所有 gpt-4.1-openai deployments 都會寫入。這可在第 3 步建立 job 時，對所有 gpt-4.1-openai deployments 啟用負載平衡。job 建立後，任何 retrieve/list/cancel 操作都會路由到該 deployment。

### 3. 建立微調 Job {#3-create-the-finetuning-job}

```python showLineNumbers title="create_finetuning_job.py"
... # Step 2

file_id = finetuning_input_file.id

# Create Finetuning Job
ft_job = client.fine_tuning.jobs.create(
    model="gpt-4.1-openai",  # litellm public model name you want to finetune                  
    training_file=file_id,
)
```

### 4. 取得微調 Job {#4-retrieve-finetuning-job}

```python showLineNumbers title="create_finetuning_job.py"
... # Step 3

response = client.fine_tuning.jobs.retrieve(ft_job.id)
print(response)
```

### 5. 列出微調 Jobs {#5-list-finetuning-jobs}

```python showLineNumbers title="create_finetuning_job.py"
...

client.fine_tuning.jobs.list(extra_body={"target_model_names": "gpt-4.1-openai"})
```

### 6. 取消微調 Job {#6-cancel-a-finetuning-job}

```python showLineNumbers title="create_finetuning_job.py"
...

cancel_ft_job = client.fine_tuning.jobs.cancel(
    fine_tuning_job_id=ft_job.id,                          # fine tuning job id
)
```


## E2E 範例 {#e2e-example}

```python showLineNumbers title="create_finetuning_job.py"
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-...",
    max_retries=0
)


# Upload file
finetuning_input_file = client.files.create(
    file=open("./fine_tuning.jsonl", "rb"), # {"model": "azure-gpt-4o"} <-> {"model": "gpt-4o-my-special-deployment"}
    purpose="fine-tune",
    extra_body={"target_model_names": "gpt-4.1-openai"} # 👈 Tells litellm which regions/projects to write the file in. 
)
print(finetuning_input_file) # file.id = "litellm_proxy/..." = {"model_name": {"deployment_id": "deployment_file_id"}}

file_id = finetuning_input_file.id
# # file_id = "bGl0ZWxs..."

# ## create fine-tuning job 
ft_job = client.fine_tuning.jobs.create(
    model="gpt-4.1-openai",  # litellm model name you want to finetune                  
    training_file=file_id,
)

print(f"ft_job: {ft_job}")

ft_job_id = ft_job.id
## cancel fine-tuning job 
cancel_ft_job = client.fine_tuning.jobs.cancel(
    fine_tuning_job_id=ft_job_id,                          # fine tuning job id
)

print("response from cancel ft job={}".format(cancel_ft_job))
# list fine-tuning jobs 
list_ft_jobs = client.fine_tuning.jobs.list(
    extra_query={"target_model_names": "gpt-4.1-openai"}   # tell litellm proxy which provider to use
)

print("list of ft jobs={}".format(list_ft_jobs))

# get fine-tuning job 
response = client.fine_tuning.jobs.retrieve(ft_job.id)
print(response)
```

## FAQ {#faq}

### 我的檔案會寫入到哪裡？ {#where-are-my-files-written}

當指定 `target_model_names` 時，檔案會寫入到所有符合 `target_model_names` 的 deployments。

不需要額外的基礎架構。
