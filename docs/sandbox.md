import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Sandbox / 程式碼執行 {#sandbox--code-execution}

在隔離的 sandbox 中執行模型產生的程式碼，並取得其輸出回傳。此 API 不特定於任何提供者；支援 e2b 和 opensandbox，透過 HTTPS 直接連線，無需額外的 SDK 依賴。

| 功能 | 支援 |
|---------|-----------|
| 支援的提供者 | `e2b`, `opensandbox` |
| 成本追蹤 | 直通（sandbox 計費仍由提供者處理） |
| 記錄 | 透過 `litellm.asearch` 使用的標準 `@client` 記錄路徑 |
| Proxy 端點 | 透過 `/v1/responses` 和 `/v1/chat/completions` 上的 code interpreter interceptor（見下方）；目前尚無獨立的 `/v1/sandbox` |

:::tip

`code` 是可執行字串。沒有語言切換選項，也沒有虛構的結果結構；[`CodeExecutionResult`](#response-codeexecutionresult) 會直通 sandbox 本身的輸出（stdout、stderr、結果，例如 base64 圖表、錯誤名稱/值/traceback、執行次數）。

:::

## 程式碼解譯器攔截器 {#code-interpreter-interceptor}

將 OpenAI 的 `code_interpreter` 工具路由到您的 sandbox，而不是 OpenAI 的容器。可在 `/v1/responses` 與 `/v1/chat/completions` 上運作；用戶端請求保持原生 OpenAI 形狀。在聊天路徑上，原生的 `{"type": "code_interpreter"}` 工具會被重寫成 `litellm_code_execution` function tool，LiteLLM 會在您的 sandbox 中執行產生的程式碼，將結果追加為 `role: tool` 訊息，並持續循環直到得到最終答案。

### SDK {#sdk}

註冊 sandbox 工具，將 interceptor 安裝為回呼，並以不變的 `code_interpreter` 工具呼叫 `litellm.aresponses`（或 `litellm.acompletion`）。

<Tabs>
<TabItem value="responses" label="Responses API">

```python showLineNumbers title="sandbox_interceptor.py"
import os, litellm
from litellm.sandbox.sandbox_tools import register_sandbox_tools
from litellm.integrations.code_interpreter_interception.handler import (
    CodeInterpreterInterceptionLogger,
)

os.environ["E2B_API_KEY"] = "e2b_..."
os.environ["OPENAI_API_KEY"] = "sk-..."

register_sandbox_tools([
    {
        "sandbox_tool_name": "my-e2b",
        "litellm_params": {
            "sandbox_provider": "e2b",
            "api_key": "os.environ/E2B_API_KEY",
        },
    }
])

litellm.callbacks = [
    CodeInterpreterInterceptionLogger(
        sandbox_tool_name="my-e2b",
    )
]

response = await litellm.aresponses(
    model="openai/gpt-5",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Product of first 6 primes. Just the number.",
)
print(response.output_text)
```

</TabItem>
<TabItem value="chat" label="Chat Completions">

```python showLineNumbers title="sandbox_interceptor_chat.py"
import os, litellm
from litellm.sandbox.sandbox_tools import register_sandbox_tools
from litellm.integrations.code_interpreter_interception.handler import (
    CodeInterpreterInterceptionLogger,
)

os.environ["E2B_API_KEY"] = "e2b_..."
os.environ["OPENAI_API_KEY"] = "sk-..."

register_sandbox_tools([
    {
        "sandbox_tool_name": "my-e2b",
        "litellm_params": {
            "sandbox_provider": "e2b",
            "api_key": "os.environ/E2B_API_KEY",
        },
    }
])

litellm.callbacks = [
    CodeInterpreterInterceptionLogger(
        sandbox_tool_name="my-e2b",
    )
]

response = await litellm.acompletion(
    model="openai/gpt-4o-mini",
    messages=[{"role": "user", "content": "Product of first 6 primes. Just the number."}],
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    max_agentic_loops=4,
)
print(response.choices[0].message.content)
```

`max_agentic_loops` 用來限制 LiteLLM 在回傳模型已產生內容前，會進行多少次 sandbox 往返；此循環也會在重複的工具呼叫指紋上短路。預設值較保守；若您的任務需要更深層的鏈式執行，請提高此值。

</TabItem>
</Tabs>

### Proxy 設定 {#proxy-setup}

#### 1. 設定金鑰 {#1-set-keys}

```bash
export E2B_API_KEY="e2b_..."
export OPENAI_API_KEY="sk-..."
```

#### 2. 撰寫 `config.yaml` {#2-write-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY

sandbox_tools:
  - sandbox_tool_name: my-e2b
    litellm_params:
      sandbox_provider: e2b
      api_key: os.environ/E2B_API_KEY

litellm_settings:
  callbacks: ["code_interpreter_interception"]
  code_interpreter_interception_params:
    sandbox_tool_name: my-e2b
```

#### 3. 啟動 proxy {#3-start-the-proxy}

```bash
litellm --config /path/to/config.yaml
```

#### 4. 呼叫 proxy {#4-call-the-proxy}

<Tabs>
<TabItem value="responses-curl" label="Responses (curl)">

```bash
curl -s "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "tools": [{"type": "code_interpreter", "container": {"type": "auto"}}],
    "input": "Product of first 6 primes. Just the number."
  }'
```

</TabItem>
<TabItem value="responses-openai" label="Responses (OpenAI SDK)">

```python
from openai import OpenAI

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000/v1")

response = client.responses.create(
    model="gpt-5",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Product of first 6 primes. Just the number.",
)
print(response.output_text)
```

</TabItem>
<TabItem value="chat-curl" label="Chat Completions (curl)">

```bash
curl -s "http://localhost:4000/v1/chat/completions" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Product of first 6 primes. Just the number."}
    ],
    "tools": [{"type": "code_interpreter", "container": {"type": "auto"}}]
  }'
```

</TabItem>
<TabItem value="chat-openai" label="Chat Completions (OpenAI SDK)">

```python
from openai import OpenAI

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000/v1")

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Product of first 6 primes. Just the number."}],
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

在 Responses 路徑上，結果包含一個 `code_interpreter_call` 項目，其中有一個 `cntr_*` `container_id` 包裝 sandbox id。在 Chat Completions 路徑上，工具呼叫會以帶有已執行程式碼的 `litellm_code_execution` function call 顯示，接著是一則包含 stdout 的 `role: tool` 訊息；模型的最終答案會在下一則 assistant 訊息中送達。

若要改用 OpenSandbox 而非 e2b，請替換 `sandbox_tools` 項目：

```yaml
sandbox_tools:
  - sandbox_tool_name: my-opensandbox
    litellm_params:
      sandbox_provider: opensandbox
      api_base: os.environ/OPEN_SANDBOX_API_BASE
      api_key: os.environ/OPEN_SANDBOX_API_KEY
```

### 黏著工作階段 {#sticky-sessions}

預設情況下，每個請求都會啟動一個新的 sandbox，並在 agentic loop 結束時刪除。傳入 `metadata.session_id` 可讓連續請求重用同一個 sandbox，如此在某一輪中定義的變數、import 和檔案，會在下一輪仍保持有效。

<Tabs>
<TabItem value="sticky-curl" label="curl">

```bash
# First request: define x
curl -s "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "tools": [{"type": "code_interpreter", "container": {"type": "auto"}}],
    "input": "Set x = 42 and confirm.",
    "metadata": {"session_id": "chat-abc-123"}
  }'

# Second request: same session_id, x is still there
curl -s "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "tools": [{"type": "code_interpreter", "container": {"type": "auto"}}],
    "input": "Print x + 1.",
    "metadata": {"session_id": "chat-abc-123"}
  }'
```

</TabItem>
<TabItem value="sticky-openai" label="OpenAI SDK">

```python
from openai import OpenAI

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000/v1")

client.responses.create(
    model="gpt-5",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Set x = 42 and confirm.",
    extra_body={"metadata": {"session_id": "chat-abc-123"}},
)

# Same session_id reuses the same e2b container, so x is still defined
followup = client.responses.create(
    model="gpt-5",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Print x + 1.",
    extra_body={"metadata": {"session_id": "chat-abc-123"}},
)
print(followup.output_text)
```

</TabItem>
</Tabs>

透過將用戶端提供的 `session_id` 與 proxy 代為建立的 `user_api_key_hash` 組合成快取金鑰（`{hash}:{session_id}`），來強制執行跨租戶隔離，因此送出相同 `session_id` 的兩個 API 金鑰絕不會共用 sandbox。每個 API 金鑰最多可有 10 個存活的工作階段範圍 sandbox；當新的工作階段將超過上限時，該金鑰最近最少使用的工作階段會被逐出，其 sandbox 也會被刪除。由於 TTL 會在每次存取時重設，作用中的工作階段不會在對話中途過期。若省略 `session_id`，則會維持原本每個請求皆為短暫存在的行為。

### 注意事項 {#notes}

回應格式與 OpenAI 原生的 `code_interpreter_call` 相同。`stream: true` 可運作。強制的 `tool_choice: {"type":"code_interpreter"}` 會自動重寫。預設情況下，sandbox 會針對每個請求短暫存在；若設定 `metadata.session_id`（見上方），則會保持黏著；同時請求會由伺服器代為建立的快取金鑰隔離。從 `sandbox_tools` 移除工具會在重新載入時清除其憑證。v0 目前尚不支援檔案上傳或下載。

## 直接 sandbox SDK {#direct-sandbox-sdk}

如果您想自行驅動 sandbox，而不讓模型參與其中，同樣的提供者會以一般 Python helper 形式公開。

### 快速開始（短暫存在） {#quick-start-ephemeral}

最快的路徑是 `acode_interpreter_tool`。它會建立 sandbox、執行程式碼，然後在 `finally` 區塊中刪除 sandbox，因此即使發生例外也會清理資源。

```python showLineNumbers title="Ephemeral code execution"
import asyncio, os, litellm

os.environ["E2B_API_KEY"] = "e2b_..."

async def main():
    result = await litellm.acode_interpreter_tool(
        provider="e2b",
        code="print(sum(range(10)))",
    )
    print(result.stdout)   # '45\n'
    print(result.error)    # None

asyncio.run(main())
```

如果程式碼在 sandbox 內拋出錯誤，錯誤會以 `result.error` 形式浮現，而不是以 Python 例外的方式，因此 sandbox 層級的 `ZeroDivisionError` 不會讓呼叫端崩潰：

```python
result = await litellm.acode_interpreter_tool(provider="e2b", code="1/0")
result.error["name"]       # 'ZeroDivisionError'
result.error["value"]      # 'division by zero'
result.error["traceback"]  # full traceback string
```

### 低階生命週期 {#low-level-lifecycle}

當您想在多次 `arun_code` 呼叫之間重用同一個 sandbox 時，請自行使用 `acreate_sandbox`、`arun_code` 和 `adelete_sandbox` 來驅動生命週期。這些低階名稱刻意以 sandbox 為範圍，因此不會與既有的 OpenAI Containers API（`litellm.create_container`）衝突；兩者彼此無關，且會維持不變。

```python showLineNumbers title="Manual sandbox lifecycle"
import asyncio, os, litellm

os.environ["E2B_API_KEY"] = "e2b_..."

async def main():
    container = await litellm.acreate_sandbox(provider="e2b")
    try:
        first = await litellm.arun_code(
            provider="e2b", container=container, code="x = 6 * 7\nprint(x)",
        )
        print(first.stdout)   # '42\n'

        second = await litellm.arun_code(
            provider="e2b", container=container, code="print(x + 1)",
        )
        print(second.stdout)  # '43\n' (state persists inside the container)
    finally:
        await litellm.adelete_sandbox(provider="e2b", container=container)

asyncio.run(main())
```

`arun_code` 與 `adelete_sandbox` 可接受由 `acreate_sandbox` 回傳的 `ContainerHandle`，或單純的 sandbox id 字串，因此您可以在程序之間儲存 id，之後再取回該 sandbox。

## 參數 {#parameters}

### `acode_interpreter_tool` {#acode_interpreter_tool}

| 參數 | 型別 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `provider` | string | 是 | sandbox 提供者 slug。可為 `"e2b"`、`"opensandbox"`。 |
| `code` | string | 是 | 直接傳送給 sandbox 的可執行字串。 |
| `template` | string | 否 | 提供者 template id。預設為 e2b 的 `code-interpreter-v1`。 |
| `timeout` | int | 否 | sandbox 存活秒數。預設為 300。 |
| `api_key` | string | 否 | 覆寫環境變數查找。 |
| `api_base` | string | 否 | 覆寫提供者的預設主機。可用來將 self-hosted sandbox 指向叢集 URL。 |

### `acreate_sandbox` {#acreate_sandbox}

與上方相同的格式，但不含 `code`，另外還有適用於限制 egress 的後端之 `allow_internet_access: bool = True`。

### `arun_code` 和 `adelete_sandbox` {#arun_code-and-adelete_sandbox}

`provider`、`container`（`ContainerHandle` 或 sandbox id 字串），以及可選的 `api_key` / `api_base`。`arun_code` 也會接受 `code`。

## 回應：`CodeExecutionResult` {#response-codeexecutionresult}

回傳格式是一個精簡的 pydantic model，會保留 sandbox 輸出的任何內容。

| 欄位 | 類型 | 描述 |
|-------|------|-------------|
| `stdout` | string | 擷取的 stdout。若未列印任何內容則為空字串。 |
| `stderr` | string | 擷取的 stderr。 |
| `results` | list[dict] | 豐富輸出，例如 base64 PNG 圖表；會原樣傳遞。 |
| `error` | dict \| None | 當 sandboxed 程式碼發生例外時為 `{name, value, traceback}`，否則為 `None`。 |
| `execution_count` | int \| None | 本次執行的 Jupyter 風格 cell 計數器。 |
| `object` | string | 一律為 `"code_execution"`。 |

## 提供者設定 {#provider-setup}

### e2b {#e2b}

設定 `E2B_API_KEY`（或每次呼叫時傳入 `api_key=...`）。預設值：template `code-interpreter-v1`、sandbox timeout 300s、已開啟網際網路存取。覆寫 `template` 即可使用您已發布的任何自訂 e2b template。

```python
result = await litellm.acode_interpreter_tool(
    provider="e2b",
    code="...",
    template="my-org/custom-template",
    timeout=120,
)
```

在背後，這個呼叫會直接進入 e2b 的 REST API：先用 `POST api.e2b.app/sandboxes` 建立，再透過傳送到每個 sandbox host、埠 49999 的串流 NDJSON `POST` 執行，最後用 `DELETE api.e2b.app/sandboxes/{id}` 結束。

### opensandbox {#opensandbox}

使用 [OpenSandbox](https://github.com/opensandboxai/opensandbox) 進行自架程式碼執行。設定 `OPEN_SANDBOX_API_BASE`（或每次呼叫時傳入 `api_base=...`）以指向您的伺服器；沒有 localhost 備援。`OPEN_SANDBOX_API_KEY` 為選用項目，若是本機無驗證伺服器可留空。預設會建立禁止 egress 的 sandboxes；傳入 `allow_internet_access=True` 或明確的 `network_policy` 即可開放。

```python
import os, litellm

os.environ["OPEN_SANDBOX_API_BASE"] = "http://127.0.0.1:8080/v1"
os.environ["OPEN_SANDBOX_API_KEY"] = ""  # optional for local no-auth servers

result = await litellm.acode_interpreter_tool(
    provider="opensandbox",
    code="print(sum(range(10)))",
)
print(result.stdout)  # '45\n'
```

此提供者直接驅動 OpenSandbox 的 REST 生命週期：用 `POST /v1/sandboxes` 建立、解析每個 sandbox 的 execd endpoint、將 `/code` SSE 串流到 `CodeExecutionResult`，然後用 `DELETE /v1/sandboxes/{id}` 結束。其他預設值（template、entrypoint、language、polling interval、execd port、預設網路政策、輸出上限）都以常值放在 `litellm/constants.py` 中。
