import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 逾時 {#timeouts}

在 router 中設定的逾時是針對整個呼叫的完整長度，且也會傳遞到 completion() 呼叫層級。

### 全域逾時 {#global-timeouts}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

model_list = [{...}]

router = Router(model_list=model_list, 
                timeout=30) # raise timeout error if call takes > 30s 

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
router_settings:
    timeout: 30 # sets a 30s timeout for the entire call
```

**啟動 Proxy**

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>
</Tabs>

`litellm_settings.request_timeout`（或 `REQUEST_TIMEOUT` 環境變數）是在未設定路由器或部署逾時時，整個 proxy 的預設值。它也適用於原生 `/v1/responses` 和 `/v1/messages` 串流，在這些情況下，它會限制等待下一個 chunk 的每次等待時間，因此上游若停滯，串流就會以錯誤結束，而不是卡住。完整優先順序請參閱 [pass-through 路由上的請求逾時](./pass_through#request-timeouts)

### 自訂逾時與串流逾時（每個模型） {#custom-timeouts--stream-timeouts-per-model}

對於每個模型，您可以在 `timeout` 下設定 `stream_timeout` 和 `litellm_params`：

- **`timeout`** → 完整回應的最長時間。  
  用於限制長時間執行的 completions。

- **`stream_timeout`** → 在串流回應中等待第一個區塊（亦即第一個 token）的最長時間。  
  用於中止「卡住」的提供者（例如 Bedrock 啟動緩慢），並重試另一個模型。

有些請求無法由提供者串流，例如在不具備原生結構化輸出的 Bedrock 模型上使用 `json_schema` 回應格式。LiteLLM 此時會進行一次非串流呼叫，待整個答案寫完後再以區塊形式回傳，因此在答案完成之前不會有任何區塊送達。這類請求會使用 `timeout` 與 `stream_timeout` 中較長的一個，因此為停滯串流設定的短 `stream_timeout` 不會中斷較慢的結構化答案。

當您不透過 Router 直接呼叫 `litellm.completion()`、`litellm.acompletion()` 或 `litellm.aresponses()` 時，也適用相同規則。請將 `stream_timeout` 與 `timeout` 並列傳入；即時串流受 `stream_timeout` 限制，未串流的呼叫受 `timeout` 限制，偽串流則取兩者中較長的一個。舊版在直接 SDK 呼叫時會忽略 `stream_timeout`，因此您在該處設定的短值，現在會中斷傳送一個區塊所需時間超過該值的即時串流。
<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 
import asyncio

model_list = [{
    "model_name": "{{openai_small}}",
    "litellm_params": {
        "model": "azure/chatgpt-v-2",
        "api_key": os.getenv("AZURE_API_KEY"),
        "api_version": os.getenv("AZURE_API_VERSION"),
        "api_base": os.getenv("AZURE_API_BASE"),
        "timeout": 300, # sets a 5 minute timeout
        "stream_timeout": 30, # sets a 30s timeout for streaming calls
    }
}]

# init router
router = Router(model_list=model_list, routing_strategy="least-busy")
async def router_acompletion():
    response = await router.acompletion(
        model="{{openai_small}}", 
        messages=[{"role": "user", "content": "Hey, how's it going?"}]
    )
    print(response)
    return response

asyncio.run(router_acompletion())
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: azure/gpt-turbo-small-eu
      api_base: https://my-endpoint-europe-berri-992.openai.azure.com/
      api_key: <your-key>
      timeout: 0.1                      # timeout in (seconds)
      stream_timeout: 0.01              # timeout for stream requests (seconds)
      max_retries: 5
  - model_name: {{openai_small}}
    litellm_params:
      model: azure/gpt-turbo-small-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: 
      timeout: 0.1                      # timeout in (seconds)
      stream_timeout: 0.01              # timeout for stream requests (seconds)
      max_retries: 5

```


**啟動 Proxy**

```shell
$ litellm --config /path/to/config.yaml
```


</TabItem>
</Tabs>

### 依服務層級設定逾時 {#per-service-tier-timeouts}

部署可以為要求特定 `service_tier` 的請求設定專屬的逾時。例如，OpenAI 的 `flex` 層級比預設層級慢，因此依標準流量大小設定的 `timeout` 會過早中斷 flex 請求。請在 `litellm_params` 下設定 `timeout_by_service_tier` 與 `stream_timeout_by_service_tier`，並以層級名稱作為鍵：

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/gpt-5.1
      api_key: os.environ/OPENAI_API_KEY
      timeout: 610
      stream_timeout: 610
      timeout_by_service_tier:
        flex: 900
      stream_timeout_by_service_tier:
        flex: 900
```

主體中帶有 `"service_tier": "flex"` 的請求，現在在 `/v1/chat/completions`、`/v1/responses` 以及其他所有接受 `service_tier` 的路由上，最多可等待 900 秒。沒有 `service_tier` 的請求，或其層級在對照表中沒有項目的請求，會維持該部署的 `timeout` 與 `stream_timeout`，因此新增這些對照表不會改變既有流量。

在每次嘗試時，LiteLLM 會取第一個有設定的值：隨請求送出的逾時（`timeout` 參數或 `x-litellm-timeout` 標頭），接著是該請求層級的 `timeout_by_service_tier`，然後是該部署的 `timeout`，最後是上述的 router 與全域預設值。串流請求依相同順序使用 `stream_timeout_by_service_tier` 與 `stream_timeout`；只列在 `timeout_by_service_tier` 中的層級，其串流會維持該部署的 `stream_timeout`。值必須是以秒為單位的數字；若為其他值，proxy 將拒絕啟動。層級名稱不會與提供者核對，因此拼錯的鍵只會永遠無法比對成功。

### 閒置串流連線的 keepalive ping {#keepalive-pings-for-idle-streaming-connections}

`timeout` 和 `stream_timeout` 會限制請求可執行的最長時間。另一個問題是，proxy 前方的負載平衡器與反向 proxy 經常會關閉看起來處於閒置狀態的連線，即使客戶端確實正在等待回應。針對在第一個 token 之前有很長靜默間隔的模型（例如延長式或自適應思考模型），或其他較慢的提供者所發出的串流請求，可能會在任何內容到達前就觸發這些閒置連線逾時。

請在部署的 `litellm_params` 下設定 `keepalive_seconds`，以便在這些間隔期間維持連線存活。當串流靜默時間超過 `keepalive_seconds` 時，proxy 會沿著連線送出一個 SSE 註解框架（`: ping`），之後每隔 `keepalive_seconds` 重複一次，直到有真正的內容恢復。註解框架是 SSE 規格的一部分，且客戶端與中介 proxy 預期會忽略它們，因此不會改變您的應用程式所看到的內容。它們確實會改變失敗的送達方式。一旦 ping 已經送出，回應就已經以狀態 200 開始，因此該時間點之後的錯誤會以 SSE 框架而非 HTTP 錯誤狀態送達。關於各路由傳送的框架，請參閱[串流錯誤](/docs/proxy/error_reference#streaming-errors)。

```yaml
model_list:
  - model_name: claude-opus
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY
      keepalive_seconds: 15
```

```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-opus",
    "messages": [{"role": "user", "content": "Think step by step about..."}],
    "stream": true
  }'
```

`keepalive_seconds` 預設僅限操作人員使用。除非部署也設定了 `allow_client_keepalive_override: true`，否則客戶端的請求層級 `keepalive_seconds` 不會產生任何作用，因為若允許任何客戶端隨意啟用 heartbeat，它就能讓看起來閒置的串流無限期地在負載平衡器逾時後仍保持存活，讓一個 `max_parallel_requests` 配額槽被占用的時間比預期更久。

```yaml
model_list:
  - model_name: claude-opus
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY
      keepalive_seconds: 15
      allow_client_keepalive_override: true
```

在允許覆寫的情況下，請求可以變更部署的預設值，包括以明確的 `0` 將其停用：

```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-opus",
    "messages": [{"role": "user", "content": "Think step by step about..."}],
    "stream": true,
    "keepalive_seconds": 1
  }'
```

如果未設定 `allow_client_keepalive_override`，則相同的請求本文會被靜默忽略，並改用部署本身設定的值。部署層級的 `keepalive_seconds: 0` 是硬性停用，且優先於一切，包括授予覆寫權限：無論如何，請求都無法將其重新啟用。有效值會被限制在 1-300 秒的範圍內。

`keepalive_seconds` 也可以改用 `x-litellm-keepalive-seconds` 標頭來設定，而不是請求本文欄位，適合比起額外本文欄位更容易設定自訂標頭的客戶端：

```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'x-litellm-keepalive-seconds: 1' \
  -d '{
    "model": "claude-opus",
    "messages": [{"role": "user", "content": "Think step by step about..."}],
    "stream": true
  }'
```

該標頭會通過與本文欄位相同的 `allow_client_keepalive_override` 閘門，因此若部署未選擇啟用，該標頭也不會產生作用。

#### 整個 proxy 的預設 {#a-proxy-wide-default}

`keepalive_seconds` 是每個部署各自設定。若要讓所有部署、以及每條 pass-through 路由都使用同一個間隔，請在 `litellm_settings` 下設定 `sse_keepalive_ping_interval_seconds`：

```yaml
litellm_settings:
  sse_keepalive_ping_interval_seconds: 15
```

部署本身的 `keepalive_seconds` 仍會在已設定的地方勝出，而部署層級的 `0` 仍會硬性停用。全域值只會在沒有更具體設定時才套用。

在上游尚未回應之前，會先適用一個細節，因為此時尚無部署已為該請求提供服務：只有當請求模型名稱背後的所有部署都具有相同值時，才會使用每個部署的值。若它們不一致，則會先套用全域值，直到知道是哪個部署在提供服務；之後，該部署本身的設定會接手並適用於串流的其餘部分。

#### 在上游完全回應之前的靜默 {#silence-before-the-upstream-answers-at-all}

有些提供者會等到第一個 token 才送出回應標頭，因此在這類情況下，模型整段思考時間都會先經過，proxy 才有任何內容可轉送。`sse_keepalive_ping_interval_seconds` 也涵蓋這段窗口：當上游請求在一個間隔內尚未返回時，proxy 會開啟 SSE 回應並開始送出 `: ping` 註解，然後在真正回應抵達後，將其重播到同一條連線上。

提前開啟回應會帶來兩個結果，而這兩點也正是為什麼在您設定間隔之前它會保持關閉：

- 狀態列會在結果尚未明朗時就被提交，因此第一個 ping 之後才失敗的請求，會以 `200` 下的 SSE 錯誤框架返回，而不是 HTTP 錯誤狀態。任何回呼套用的錯誤轉換仍然會套用到該框架
- LiteLLM 的 `x-litellm-*` 回應標頭此時尚未知曉，因此在有 ping 的串流上會缺少這些標頭

### 設定動態逾時 - 每個請求 {#setting-dynamic-timeouts---per-request}

LiteLLM 支援針對每個請求設定 `timeout` 

**使用範例**
<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import Router 

model_list = [{...}]
router = Router(model_list=model_list)

response = router.completion(
    model="{{openai_small}}", 
    messages=[{"role": "user", "content": "what color is red"}],
    timeout=1
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
     --header 'Content-Type: application/json' \
     --data-raw '{
        "model": "{{openai_small}}",
        "messages": [
            {"role": "user", "content": "what color is red"}
        ],
        "logit_bias": {12481: 100},
        "timeout": 1
     }'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai


client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="{{openai_small}}",
    messages=[
        {"role": "user", "content": "what color is red"}
    ],
    logit_bias={12481: 100},
    extra_body={"timeout": 1} # KEY CHANGE
)

print(response)
```
</TabItem>
</Tabs>

</TabItem>
</Tabs>

## 測試逾時處理  {#testing-timeout-handling}

若要測試您的 retry/fallback 邏輯是否能處理逾時，您可以將 `mock_timeout=True` 設為測試用途。 

目前僅支援 `/chat/completions` 和 `/completions` 端點。若您需要其他端點支援，請[告訴我們](https://github.com/BerriAI/litellm/issues)。 

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    --data-raw '{
        "model": "gemini/{{gemini_flash}}",
        "messages": [
        {"role": "user", "content": "hi my email is ishaan@berri.ai"}
        ],
        "mock_timeout": true # KEY CHANGE
    }'
```
