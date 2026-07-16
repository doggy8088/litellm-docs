import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 新增一個新的 Guardrail 整合 {#adding-a-new-guardrail-integration}

您將建立一個類別，在文字送往 LLM 之前或傳回之後進行檢查。如果違反您的規則，就會封鎖它。

## 運作方式 {#how-it-works}

帶有 guardrail 的請求：

```bash
curl --location 'http://localhost:4000/chat/completions' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "How do I hack a system?"}],
    "guardrails": ["my-guardrail"]
}'
```

您的 guardrail 會先檢查輸入，再檢查輸出。如果有問題，就拋出例外。

## 建置您的 Guardrail {#build-your-guardrail}

### 建立您的目錄 {#create-your-directory}

```bash
mkdir -p litellm/proxy/guardrails/guardrail_hooks/my_guardrail
cd litellm/proxy/guardrails/guardrail_hooks/my_guardrail
```

兩個檔案：`my_guardrail.py`（主要類別）和 `__init__.py`（初始化）。

### 撰寫主要類別 {#write-the-main-class}

`my_guardrail.py`：

請參照 [自訂 Guardrail](../proxy/guardrails/custom_guardrail#custom-guardrail) 教學。

### 建立 Init 檔案 {#create-the-init-file}

`__init__.py`：

```python
from typing import TYPE_CHECKING

from litellm.types.guardrails import SupportedGuardrailIntegrations

from .my_guardrail import MyGuardrail

if TYPE_CHECKING:
    from litellm.types.guardrails import Guardrail, LitellmParams


def initialize_guardrail(litellm_params: "LitellmParams", guardrail: "Guardrail"):
    import litellm
    
    _my_guardrail_callback = MyGuardrail(
        api_base=litellm_params.api_base,
        api_key=litellm_params.api_key,
        guardrail_name=guardrail.get("guardrail_name", ""),
        event_hook=litellm_params.mode,
        default_on=litellm_params.default_on,
    )
    
    litellm.logging_callback_manager.add_litellm_callback(_my_guardrail_callback)
    return _my_guardrail_callback


guardrail_initializer_registry = {
    SupportedGuardrailIntegrations.MY_GUARDRAIL.value: initialize_guardrail,
}

guardrail_class_registry = {
    SupportedGuardrailIntegrations.MY_GUARDRAIL.value: MyGuardrail,
}
```

### 註冊您的 Guardrail 類型 {#register-your-guardrail-type}

加入到 `litellm/types/guardrails.py`：

```python
class SupportedGuardrailIntegrations(str, Enum):
    LAKERA = "lakera_prompt_injection"
    APORIA = "aporia"
    BEDROCK = "bedrock_guardrails"
    PRESIDIO = "presidio"
    ZSCALER_AI_GUARD = "zscaler_ai_guard"
    MY_GUARDRAIL = "my_guardrail"
```

## 使用方式 {#usage}

### 設定檔 {#config-file}

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
    api_key: os.environ/OPENAI_API_KEY

guardrails:
    - guardrail_name: my_guardrail
        litellm_params:
        guardrail: my_guardrail
        mode: during_call
        api_key: os.environ/MY_GUARDRAIL_API_KEY
        api_base: https://api.myguardrail.com
```

### 每次請求 {#per-request}

```bash
curl --location 'http://localhost:4000/chat/completions' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Test message"}],
    "guardrails": ["my_guardrail"]
}'
```

## 測試 {#testing}

在 `test_litellm/` 資料夾內加入單元測試。
