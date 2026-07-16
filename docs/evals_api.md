# /evals {#evals}

LiteLLM Proxy 支援 OpenAI 的 Evaluations（Evals）API，讓您可以建立、管理並執行評估，以根據既定的測試標準衡量模型效能。

## 什麼是 Evals？ {#what-are-evals}

OpenAI Evals API 提供一種結構化方式來：
- **建立評估**：定義用於評估模型輸出的測試標準與資料來源
- **執行評估**：針對特定模型與資料集執行評估
- **追蹤結果**：監控評估進度並檢視詳細結果

## 快速開始 {#quick-start}

### 設定 LiteLLM Proxy {#setup-litellm-proxy}

首先，啟動您的 LiteLLM Proxy 伺服器：

```bash
litellm --config config.yaml

# Proxy will run on http://localhost:4000
```

### 初始化 OpenAI 用戶端 {#initialize-openai-client}

```python
from openai import OpenAI

# Point to your LiteLLM Proxy
client = OpenAI(
    api_key="sk-1234",  # Your LiteLLM proxy API key
    base_url="http://localhost:4000"  # Your proxy URL
)
```


若要進行非同步操作：

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)
```

---

## 評估管理 {#evaluation-management}

### 建立評估 {#create-an-evaluation}

使用測試標準與資料來源設定來建立評估。

#### 範例：情感分類評估 {#example-sentiment-classification-eval}

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

# Create evaluation with label model grader
eval_obj = client.evals.create(
    name="Sentiment Classification",
    data_source_config={
        "type": "stored_completions",
        "metadata": {"usecase": "chatbot"}
    },
    testing_criteria=[
        {
            "type": "label_model",
            "model": "gpt-4o-mini",
            "input": [
                {
                    "role": "developer",
                    "content": "Classify the sentiment of the following statement as one of 'positive', 'neutral', or 'negative'"
                },
                {
                    "role": "user",
                    "content": "Statement: {{item.input}}"
                }
            ],
            "passing_labels": ["positive"],
            "labels": ["positive", "neutral", "negative"],
            "name": "Sentiment Grader"
        }
    ]
)

# Note: If you want to use model-specific credentials for this evaluation, you can specify the model name in the extra body parameters.

print(f"Created eval: {eval_obj.id}")
print(f"Eval name: {eval_obj.name}")
```

#### 範例：推播通知摘要器監控 {#example-push-notifications-summarizer-monitoring}

此範例示範如何監控提示詞變更是否造成推播通知摘要器的回歸：

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

# Define data source for stored completions
data_source_config = {
    "type": "stored_completions",
    "metadata": {
        "usecase": "push_notifications_summarizer"
    }
}

# Define grader criteria
GRADER_DEVELOPER_PROMPT = """
Label the following push notification summary as either correct or incorrect.
The push notification and the summary will be provided below.
A good push notification summary is concise and snappy.
If it is good, then label it as correct, if not, then incorrect.
"""

GRADER_TEMPLATE_PROMPT = """
Push notifications: {{item.input}}
Summary: {{sample.output_text}}
"""

push_notification_grader = {
    "name": "Push Notification Summary Grader",
    "type": "label_model",
    "model": "gpt-4o-mini",
    "input": [
        {
            "role": "developer",
            "content": GRADER_DEVELOPER_PROMPT,
        },
        {
            "role": "user",
            "content": GRADER_TEMPLATE_PROMPT,
        },
    ],
    "passing_labels": ["correct"],
    "labels": ["correct", "incorrect"],
}

# Create the evaluation
eval_result = await client.evals.create(
    name="Push Notification Completion Monitoring",
    metadata={"description": "This eval monitors completions"},
    data_source_config=data_source_config,
    testing_criteria=[push_notification_grader],
)

eval_id = eval_result.id
print(f"Created eval: {eval_id}")
```

### 列出評估 {#list-evaluations}

擷取所有評估的清單，支援分頁。

```python
# List all evaluations
evals_response = client.evals.list(
    limit=20,
    order="desc"
)

for eval in evals_response.data:
    print(f"Eval ID: {eval.id}, Name: {eval.name}")

# Check if there are more evals
if evals_response.has_more:
    # Fetch next page
    next_evals = client.evals.list(
        after=evals_response.last_id,
        limit=20
    )
```

### 取得特定評估 {#get-a-specific-evaluation}

依 ID 取得特定評估的詳細資訊。

```python
eval = client.evals.retrieve(
    eval_id="eval_abc123"
)

print(f"Eval ID: {eval.id}")
print(f"Name: {eval.name}")
print(f"Data Source: {eval.data_source_config}")
print(f"Testing Criteria: {eval.testing_criteria}")
```

### 更新評估 {#update-an-evaluation}

更新評估中繼資料或名稱。

```python
updated_eval = client.evals.update(
    eval_id="eval_abc123",
    name="Updated Evaluation Name",
    metadata={
        "version": "2.0",
        "updated_by": "user@example.com"
    }
)

print(f"Updated eval: {updated_eval.name}")
```

### 刪除評估 {#delete-an-evaluation}

永久刪除評估。

```python
delete_response = client.evals.delete(
    eval_id="eval_abc123"
)

print(f"Deleted: {delete_response.deleted}")  # True
```

---

## 評估執行 {#evaluation-runs}

### 建立執行 {#create-a-run}

透過建立執行來執行評估。執行會將您的資料透過模型處理，並套用測試標準。

#### 使用已儲存的 completions {#using-stored-completions}

首先，透過帶有中繼資料的 chat completions 產生一些測試資料：

```python
from openai import AsyncOpenAI
import asyncio

client = AsyncOpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

# Generate test data with different prompt versions
push_notification_data = [
    """
- New message from Sarah: "Can you call me later?"
- Your package has been delivered!
- Flash sale: 20% off electronics for the next 2 hours!
""",
    """
- Weather alert: Thunderstorm expected in your area.
- Reminder: Doctor's appointment at 3 PM.
- John liked your photo on Instagram.
"""
]

PROMPTS = [
    (
        """
        You are a helpful assistant that summarizes push notifications.
        You are given a list of push notifications and you need to collapse them into a single one.
        Output only the final summary, nothing else.
        """,
        "v1"
    ),
    (
        """
        You are a helpful assistant that summarizes push notifications.
        You are given a list of push notifications and you need to collapse them into a single one.
        The summary should be longer than it needs to be and include more information than is necessary.
        Output only the final summary, nothing else.
        """,
        "v2"
    )
]

# Create completions with metadata for tracking
tasks = []
for notifications in push_notification_data:
    for (prompt, version) in PROMPTS:
        tasks.append(client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "developer", "content": prompt},
                {"role": "user", "content": notifications},
            ],
            metadata={
                "prompt_version": version,
                "usecase": "push_notifications_summarizer"
            }
        ))

await asyncio.gather(*tasks)
```

接著建立執行來評估不同版本的 prompt：

```python
# Grade prompt_version=v1
eval_run_result = await client.evals.runs.create(
    eval_id=eval_id,
    name="v1-run",
    data_source={
        "type": "completions",
        "source": {
            "type": "stored_completions",
            "metadata": {
                "prompt_version": "v1",
            }
        }
    }
)

print(f"Run ID: {eval_run_result.id}")
print(f"Status: {eval_run_result.status}")
print(f"Report URL: {eval_run_result.report_url}")

# Grade prompt_version=v2
eval_run_result_v2 = await client.evals.runs.create(
    eval_id=eval_id,
    name="v2-run",
    data_source={
        "type": "completions",
        "source": {
            "type": "stored_completions",
            "metadata": {
                "prompt_version": "v2",
            }
        }
    }
)

print(f"Run ID: {eval_run_result_v2.id}")
print(f"Report URL: {eval_run_result_v2.report_url}")
```

#### 使用不同模型的 completions {#using-completions-with-different-models}

測試不同模型在相同輸入上的表現：

```python
# Test with GPT-4o using stored completions as input
tasks = []
for prompt_version in ["v1", "v2"]:
    tasks.append(client.evals.runs.create(
        eval_id=eval_id,
        name=f"gpt-4o-run-{prompt_version}",
        data_source={
            "type": "completions",
            "input_messages": {
                "type": "item_reference",
                "item_reference": "item.input",
            },
            "model": "gpt-4o",
            "source": {
                "type": "stored_completions",
                "metadata": {
                    "prompt_version": prompt_version,
                }
            }
        }
    ))

results = await asyncio.gather(*tasks)
for run in results:
    print(f"Report URL: {run.report_url}")
```

### 列出執行 {#list-runs}

取得特定評估的所有執行。

```python
# List all runs for an evaluation
runs_response = client.evals.runs.list(
    eval_id="eval_abc123",
    limit=20,
    order="desc"
)

for run in runs_response.data:
    print(f"Run ID: {run.id}")
    print(f"Status: {run.status}")
    print(f"Name: {run.name}")
    if run.result_counts:
        print(f"Results: {run.result_counts.passed}/{run.result_counts.total} passed")
```

### 取得執行詳細資訊 {#get-run-details}

取得特定執行的詳細資訊，包括結果。

```python
run = client.evals.runs.retrieve(
    eval_id="eval_abc123",
    run_id="run_def456"
)

print(f"Run ID: {run.id}")
print(f"Status: {run.status}")
print(f"Started: {run.started_at}")
print(f"Completed: {run.completed_at}")

# Check results
if run.result_counts:
    print(f"\nOverall Results:")
    print(f"Total: {run.result_counts.total}")
    print(f"Passed: {run.result_counts.passed}")
    print(f"Failed: {run.result_counts.failed}")
    print(f"Error: {run.result_counts.errored}")

# Per-criteria results
if run.per_testing_criteria_results:
    for criteria_result in run.per_testing_criteria_results:
        print(f"\nCriteria {criteria_result.testing_criteria_index}:")
        print(f"  Passed: {criteria_result.result_counts.passed}")
        print(f"  Average Score: {criteria_result.average_score}")
```

### 刪除執行 {#delete-a-run}

永久刪除執行及其結果。

```python
delete_response = await client.evals.runs.delete(
    eval_id="eval_abc123",
    run_id="run_def456"
)

print(f"Deleted: {delete_response.deleted}")  # True
print(f"Run ID: {delete_response.run_id}")
```
