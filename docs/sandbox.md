# Sandbox / Code Execution

Run model-generated code inside an isolated sandbox and get its output back. The API is provider-agnostic; e2b is the first supported backend, talked to directly over HTTPS with no extra SDK dependency.

| Feature | Supported |
|---------|-----------|
| Supported Providers | `e2b` |
| Cost Tracking | Passthrough (sandbox billing stays with the provider) |
| Logging | Via the standard `@client` logging path used by `litellm.asearch` |
| Proxy Endpoint | Not yet (SDK only in this phase) |

:::tip

`code` is an executable string. There is no language knob and no invented result schema; the [`CodeExecutionResult`](#response-codeexecutionresult) is a passthrough of the sandbox's own output (stdout, stderr, results such as base64 charts, error name/value/traceback, execution count).

:::

## Quick start (ephemeral)

The fastest path is `acode_interpreter_tool`. It creates a sandbox, runs the code, then deletes the sandbox in a `finally` block so a raised exception still cleans up.

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

If the code raises inside the sandbox, the error surfaces in `result.error` rather than as a Python exception, so a sandbox-level `ZeroDivisionError` does not crash the caller:

```python
result = await litellm.acode_interpreter_tool(provider="e2b", code="1/0")
result.error["name"]       # 'ZeroDivisionError'
result.error["value"]      # 'division by zero'
result.error["traceback"]  # full traceback string
```

## Low-level lifecycle

When you want to reuse a sandbox across multiple `arun_code` calls, drive the lifecycle yourself with `acreate_sandbox`, `arun_code`, and `adelete_sandbox`. The low-level names are sandbox-scoped on purpose so they do not collide with the existing OpenAI Containers API (`litellm.create_container`), which is unrelated and stays untouched.

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

`arun_code` and `adelete_sandbox` accept either the `ContainerHandle` returned by `acreate_sandbox` or a bare sandbox id string, so you can persist the id between processes and pick the sandbox back up later.

## Parameters

### `acode_interpreter_tool`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | Yes | Sandbox provider slug. Currently `"e2b"`. |
| `code` | string | Yes | Executable string passed straight to the sandbox. |
| `template` | string | No | Provider template id. Defaults to e2b's `code-interpreter-v1`. |
| `timeout` | int | No | Sandbox lifetime in seconds. Defaults to 300. |
| `api_key` | string | No | Overrides the env var lookup. |

### `acreate_sandbox`

Same shape as above without `code`, plus `allow_internet_access: bool = True` for backends that gate egress.

### `arun_code` and `adelete_sandbox`

`provider`, `container` (a `ContainerHandle` or sandbox id string), and an optional `api_key`. `arun_code` also takes `code`.

## Response: `CodeExecutionResult`

The return shape is a thin pydantic model that preserves whatever the sandbox emitted.

| Field | Type | Description |
|-------|------|-------------|
| `stdout` | string | Captured stdout. Empty string if nothing was printed. |
| `stderr` | string | Captured stderr. |
| `results` | list[dict] | Rich outputs such as base64 PNG charts; passed through unchanged. |
| `error` | dict \| None | `{name, value, traceback}` when the sandboxed code raised, else `None`. |
| `execution_count` | int \| None | Jupyter-style cell counter for the run. |
| `object` | string | Always `"code_execution"`. |

## Provider setup

### e2b

Set `E2B_API_KEY` (or pass `api_key=...` per call). Defaults: template `code-interpreter-v1`, sandbox timeout 300s, internet access on. Override `template` to use any custom e2b template you have published.

```python
result = await litellm.acode_interpreter_tool(
    provider="e2b",
    code="...",
    template="my-org/custom-template",
    timeout=120,
)
```

Behind the scenes the call goes directly to e2b's REST API: `POST api.e2b.app/sandboxes` to create, a streamed NDJSON `POST` to the per-sandbox host on port 49999 to execute, and `DELETE api.e2b.app/sandboxes/{id}` to tear down.

## What is not in this phase

The first slice ships the SDK primitive only. The proxy `/v1/containers` endpoints, the interceptor that swaps OpenAI's container for the configured sandbox, gpt-5 `code_interpreter` routing, container reuse across requests, file read/write, and additional backends (OpenSandbox, Daytona) are tracked separately on the parent ticket and will land in follow-up PRs.
