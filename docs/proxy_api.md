# LiteLLM 金鑰（社群金鑰，已停用） {#litellm-keys-community-key-discontinued}

免費的社群 `sk-litellm-...` 金鑰以及其背後的代管 proxy 已不再提供。LiteLLM SDK 對這些金鑰沒有特殊處理，因此將 `OPENAI_API_KEY`（或任何其他提供者金鑰）設定為 `sk-litellm-...` 值時，會直接傳送給該提供者，而該提供者會以驗證錯誤拒絕它

若要為多個提供者使用一把金鑰，請使用您的提供者憑證執行自己的 [LiteLLM Proxy](./proxy/quick_start.md)，然後透過 [`litellm_proxy/` 提供者](./providers/litellm_proxy.md) 從 SDK 呼叫它，並使用由您的 proxy 核發的金鑰

```python
import os
from litellm import completion

os.environ["LITELLM_PROXY_API_BASE"] = "http://0.0.0.0:4000"  # your proxy
os.environ["LITELLM_PROXY_API_KEY"] = os.environ["LITELLM_API_KEY"]

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(model="litellm_proxy/{{openai_small}}", messages=messages)
```

`litellm_proxy/` 前綴在以 LiteLLM SDK 建置的工具中也以相同方式運作，只要 `LITELLM_PROXY_API_BASE` 指向您的 proxy 即可。可呼叫的每個模型與提供者，請參閱 [提供者清單](./providers/) 或 [models.litellm.ai](https://models.litellm.ai/)
