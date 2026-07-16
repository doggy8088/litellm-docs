import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 路由器架構（備援 / 重試） {#router-architecture-fallbacks--retries}

## 高層級架構 {#high-level-architecture}

<Image img={require('../img/router_architecture.png')} style={{ width: '100%', maxWidth: '4000px' }} />

### 請求流程  {#request-flow}

1. **使用者送出請求**：當使用者向 LiteLLM Router 端點送出請求時，流程便開始。LiteLLM Router 支援所有統一端點（`.completion`、`.embeddings` 等）。

2. **function_with_fallbacks**：初始請求會傳送至 `function_with_fallbacks` 函式。此函式會以 try-except 區塊包裝初始請求，以處理任何例外狀況——必要時執行備援。接著此請求會傳送至 `function_with_retries` 函式。

3. **function_with_retries**：`function_with_retries` 函式會以 try-except 區塊包裝請求，並將初始請求傳遞給一個基礎的 litellm 統一函式（`litellm.completion`、`litellm.embeddings` 等），以處理 LLM API 呼叫。`function_with_retries` 會處理任何例外狀況——必要時在模型群組上執行重試（也就是說，如果請求失敗，會在模型群組中的可用模型上重試）。

4. **litellm.completion**：`litellm.completion` 函式是處理 LLM API 呼叫的基礎函式。`function_with_retries` 會使用它來對 LLM API 發出實際請求。

## 圖例  {#legend}

**model_group**：一組共享相同 `model_name`、屬於同一 `model_group`，且可在其上進行負載平衡的 LLM API 部署。
