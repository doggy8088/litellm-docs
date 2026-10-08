# 自訂定價 - SageMaker、Azure 等 {#custom-pricing---sagemaker-azure-etc}

為 sagemaker completion model 註冊自訂定價

對於 chat、completion、embedding 和 responses 模型，請設定 `cost_per_second`。LiteLLM 會將其乘以整個請求
持續時間，包括串流直到最後一個 chunk，且當已設定每個 token 定價時會忽略它

對於 chat、completion、embedding 和 responses，`input_cost_per_second` 與 `output_cost_per_second` 仍可作為
舊版別名使用。`cost_per_second` 優先，其次是 `input_cost_per_second`，再來是
`output_cost_per_second`；解析後的費率只會收費一次，不會累加。轉錄、語音和影片仍繼續使用
`input_cost_per_second` 和 `output_cost_per_second`

`cost_per_second` 需要 v1.105.0 或更新版本。在較早版本中，請使用 `input_cost_per_second`

```python
# !uv add boto3 
from litellm import completion, completion_cost 

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""


def test_completion_sagemaker():
    try:
        print("testing sagemaker")
        response = completion(
            model="sagemaker/berri-benchmarking-Llama-2-70b-chat-hf-4",
            messages=[{"role": "user", "content": "Hey, how's it going?"}],
            cost_per_second=0.000420,
        )
        # Add any assertions here to check the response
        print(response)
        cost = completion_cost(completion_response=response)
        print(cost)
    except Exception as e:
        raise Exception(f"Error occurred: {e}")

```

## 每個 Token 成本（例如 Azure） {#cost-per-token-eg-azure}

```python
# !uv add boto3 
from litellm import completion, completion_cost 

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""


def test_completion_azure_model():
    try:
        print("testing azure custom pricing")
        # azure call
        response = completion(
          model = "azure/<your_deployment_name>", 
          messages = [{ "content": "Hello, how are you?","role": "user"}],
          input_cost_per_token=0.005,
          output_cost_per_token=1,
        )
        # Add any assertions here to check the response
        print(response)
        cost = completion_cost(completion_response=response)
        print(cost)
    except Exception as e:
        raise Exception(f"Error occurred: {e}")

test_completion_azure_model()
```
