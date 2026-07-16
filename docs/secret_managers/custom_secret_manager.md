import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自訂祕密管理器 {#custom-secret-manager}

將您的自訂祕密管理系統與 LiteLLM 整合。

## 快速開始 {#quick-start}

### 1. 建立您的祕密管理器類別 {#1-create-your-secret-manager-class}

建立一個新檔案 `my_secret_manager.py`，並使用記憶體內祕密儲存：

```python showLineNumbers title="my_secret_manager.py"
from typing import Optional, Union
import httpx
from litellm.integrations.custom_secret_manager import CustomSecretManager

class InMemorySecretManager(CustomSecretManager):
    def __init__(self):
        super().__init__(secret_manager_name="in_memory_secrets")
        # Store your secrets in memory
        self.secrets = {
            "OPENAI_API_KEY": "sk-...",
            "ANTHROPIC_API_KEY": "sk-ant-...",
        }

    async def async_read_secret(
        self,
        secret_name: str,
        optional_params: Optional[dict] = None,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
    ) -> Optional[str]:
        """Read secret asynchronously"""
        return self.secrets.get(secret_name)

    def sync_read_secret(
        self,
        secret_name: str,
        optional_params: Optional[dict] = None,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
    ) -> Optional[str]:
        """Read secret synchronously"""
        return self.secrets.get(secret_name)
```

### 2. 設定 Proxy {#2-configure-proxy}

在 `config.yaml` 中參照您的自訂祕密管理器：

```yaml showLineNumbers title="config.yaml"
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  key_management_system: custom  # 👈 KEY CHANGE
  key_management_settings:
    custom_secret_manager: my_secret_manager.InMemorySecretManager  # 👈 KEY CHANGE

model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY  # Read from custom secret manager
```

### 3. 啟動 LiteLLM Proxy {#3-start-litellm-proxy}

<Tabs>
<TabItem value="docker" label="Docker">

將您的自訂祕密管理器檔案掛載到容器上：

```bash showLineNumbers
docker run -d \
  -p 4000:4000 \
  -e LITELLM_MASTER_KEY=$LITELLM_MASTER_KEY \
  --name litellm-proxy \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/my_secret_manager.py:/app/my_secret_manager.py \
  docker.litellm.ai/berriai/litellm:latest \
  --config /app/config.yaml \
  --port 4000 \
  --detailed_debug
```

</TabItem>

<TabItem value="pip" label="Python 套件">

```bash
litellm --config config.yaml --detailed_debug
```

</TabItem>
</Tabs>

## 設定選項 {#configuration-options}

在您的 `config.yaml` 中自訂祕密管理器行為：

<Tabs>
<TabItem value="read_only" label="僅讀取金鑰">

```yaml showLineNumbers title="config.yaml"
general_settings:
  key_management_system: custom
  key_management_settings:
    custom_secret_manager: my_secret_manager.InMemorySecretManager
    hosted_keys: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"]  # Only check these keys
```

</TabItem>

<TabItem value="write_only" label="儲存虛擬金鑰">

將 LiteLLM proxy 虛擬金鑰儲存在您的祕密管理器中：

```yaml showLineNumbers title="config.yaml"
general_settings:
  key_management_system: custom
  key_management_settings:
    custom_secret_manager: my_secret_manager.InMemorySecretManager
    access_mode: "write_only"
    store_virtual_keys: true
    prefix_for_stored_virtual_keys: "litellm/"
    description: "LiteLLM virtual key"
    tags:
      Environment: "Production"
      Team: "AI"
```

</TabItem>

<TabItem value="read_and_write" label="讀取 + 寫入">

```yaml showLineNumbers title="config.yaml"
general_settings:
  key_management_system: custom
  key_management_settings:
    custom_secret_manager: my_secret_manager.InMemorySecretManager
    access_mode: "read_and_write"
    hosted_keys: ["OPENAI_API_KEY"]
    store_virtual_keys: true
    prefix_for_stored_virtual_keys: "litellm/"
```

</TabItem>
</Tabs>

### 可用設定 {#available-settings}

| 設定 | 說明 | 預設值 |
|---------|-------------|---------|
| `custom_secret_manager` | 自訂祕密管理器類別的路徑 | 必要 |
| `access_mode` | `"read_only"`、`"write_only"`，或 `"read_and_write"` | `"read_only"` |
| `hosted_keys` | 要在祕密管理器中檢查的特定金鑰清單 | 所有金鑰 |
| `store_virtual_keys` | 是否將 LiteLLM 虛擬金鑰儲存在祕密管理器中 | `false` |
| `prefix_for_stored_virtual_keys` | 已儲存虛擬金鑰的前綴 | `"litellm/"` |
| `description` | 已儲存祕密的說明 | `None` |
| `tags` | 要套用到已儲存祕密的標籤 | `None` |

## 必要方法 {#required-methods}

您的自訂祕密管理器**必須**實作這兩個方法：

### `async_read_secret()` {#async_read_secret}

```python showLineNumbers
async def async_read_secret(
    self,
    secret_name: str,
    optional_params: Optional[dict] = None,
    timeout: Optional[Union[float, httpx.Timeout]] = None,
) -> Optional[str]:
    """
    Read a secret asynchronously.
    
    Returns:
        Secret value if found, None otherwise
    """
    pass
```

### `sync_read_secret()` {#sync_read_secret}

```python showLineNumbers
def sync_read_secret(
    self,
    secret_name: str,
    optional_params: Optional[dict] = None,
    timeout: Optional[Union[float, httpx.Timeout]] = None,
) -> Optional[str]:
    """
    Read a secret synchronously.
    
    Returns:
        Secret value if found, None otherwise
    """
    pass
```

## 選用方法 {#optional-methods}

請實作這些方法以提供額外功能：

### `async_write_secret()` {#async_write_secret}

```python showLineNumbers
async def async_write_secret(
    self,
    secret_name: str,
    secret_value: str,
    description: Optional[str] = None,
    optional_params: Optional[dict] = None,
    timeout: Optional[Union[float, httpx.Timeout]] = None,
    tags: Optional[Union[dict, list]] = None,
) -> dict:
    """Write a secret to your secret manager"""
    pass
```

### `async_delete_secret()` {#async_delete_secret}

```python showLineNumbers
async def async_delete_secret(
    self,
    secret_name: str,
    recovery_window_in_days: Optional[int] = 7,
    optional_params: Optional[dict] = None,
    timeout: Optional[Union[float, httpx.Timeout]] = None,
) -> dict:
    """Delete a secret from your secret manager"""
    pass
```

## 使用情境 {#use-cases}

✅ 專有保管庫系統  
✅ 自訂驗證（mTLS、OAuth）  
✅ 組織專屬安全性政策  
✅ 傳統祕密儲存系統  
✅ 多區域祕密複寫  
✅ 祕密版本控制與輪替  
✅ 合規性需求（HIPAA、SOC2）  

## 範例 {#example}

請參閱 [cookbook/litellm_proxy_server/secret_manager/my_secret_manager.py](https://github.com/BerriAI/litellm/blob/main/cookbook/litellm_proxy_server/secret_manager/my_secret_manager.py) 以取得完整可運作範例，包含：

- 記憶體內祕密管理器實作  
- 與 LiteLLM Proxy 整合  
- 讀取、寫入與刪除作業
