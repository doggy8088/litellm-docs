# 工作程序啟動掛鉤 {#worker-startup-hooks}

使用 `LITELLM_WORKER_STARTUP_HOOKS` 在 proxy 啟動期間於 **每個 worker process** 中執行自訂初始化函式。當使用需要每個 process 初始化的函式庫進行多 worker 部署（`--num_workers > 1`）時，這一點至關重要，例如 [gflags](https://github.com/google/python-gflags)。

## 問題 {#the-problem}

當以多個 worker 執行 LiteLLM proxy 時：

```bash
litellm --config config.yaml --num_workers 4
```

每個 worker 都是由 uvicorn、gunicorn 或 Granian 產生的 **獨立 process**（`--run_granian`）。在 master process 中（於 `run_server()` 之前）初始化的任何 process 內狀態，**在 worker process 中都無法使用**。這包括：

- [python-gflags](https://github.com/google/python-gflags)（`gflags.FLAGS`）
- [absl-py flags](https://abseil.io/docs/python/guides/flags)（`absl.flags.FLAGS`）
- 自訂單例登錄或連線池
- 任何需要明確初始化的模組層級狀態

## 用法 {#usage}

將 `LITELLM_WORKER_STARTUP_HOOKS` 環境變數設為以逗號分隔的 `module.path:function_name` 可呼叫物件清單：

```bash
export LITELLM_WORKER_STARTUP_HOOKS="my_module:my_init_function"
```

每個 hook 都會在 worker 啟動生命週期的**最早期**被呼叫——在設定載入、資料庫設定或任何請求處理之前。同步與非同步函式皆受支援。

## 範例：gflags 初始化 {#example-gflags-initialization}

### 1. 定義您的包裝模組 {#1-define-your-wrapper-module}

```python title="my_litellm_wrapper.py"
import gflags
import json
import os
import sys
from typing import Optional, List, Any


def init_gflags(
    usage: Optional[Any] = None,
    raw_args: Optional[List[str]] = None,
    known_only: bool = False,
) -> List[str]:
    """Initialize gflags from command-line arguments."""
    try:
        gflags.FLAGS.set_gnu_getopt(True)
        if raw_args is None:
            raw_args = sys.argv
        argv = gflags.FLAGS(raw_args, known_only=known_only)
    except gflags.Error as e:
        if usage is None:
            print("%s\nUsage: %s ARGS\n%s" % (e, sys.argv[0], gflags.FLAGS))
        else:
            print(usage % dict(cmd=sys.argv[0], flags=gflags.FLAGS))
        sys.exit(1)
    return argv


def init_gflags_for_worker():
    """Re-initialize gflags in each worker process.

    Reads the original sys.argv from the GFLAGS_ARGV env var
    (set by the master process before starting the proxy).
    """
    raw_args = json.loads(os.environ.get("GFLAGS_ARGV", "[]")) or sys.argv
    init_gflags(raw_args=raw_args, known_only=True)
```

### 2. 啟動 proxy {#2-start-the-proxy}

```python title="start_proxy.py"
import json
import os
import sys

from my_litellm_wrapper import init_gflags

# Store sys.argv so workers can re-parse the same flags
os.environ["GFLAGS_ARGV"] = json.dumps(sys.argv)

# Tell LiteLLM to call our hook in each worker
os.environ["LITELLM_WORKER_STARTUP_HOOKS"] = "my_litellm_wrapper:init_gflags_for_worker"

# Initialize gflags in the master process
init_gflags()

# Start the proxy (programmatic invocation)
from litellm.proxy.proxy_cli import run_server

run_server(
    ["--config", "config.yaml", "--num_workers", "4"],
    standalone_mode=False,
)
```

或透過 shell：

```bash
export GFLAGS_ARGV='["my_app", "--my_flag=value", "--batch_size=32"]'
export LITELLM_WORKER_STARTUP_HOOKS="my_litellm_wrapper:init_gflags_for_worker"

litellm --config config.yaml --num_workers 4
```

## 運作方式 {#how-it-works}

```
Master Process                          Worker Process (×N)
─────────────────                       ──────────────────────
1. init_gflags()                        3. proxy_startup_event():
2. run_server()                            → Read LITELLM_WORKER_STARTUP_HOOKS
   → sets env vars                         → Import & call each hook
   → uvicorn.run(workers=N)                  (gflags.FLAGS re-initialized ✓)
   → spawns workers ──────────────────►    → Continue with config/DB setup
                                           → Ready to serve requests
```

- hooks 會在 `proxy_startup_event`（FastAPI 的 lifespan）的**最一開始**執行，在設定載入、資料庫連線或任何其他初始化之前。
- 在 master process 中設定的環境變數會被 worker process **繼承**（標準 Unix fork/spawn 行為）。
- 如果 hook **拋出例外**，worker 會無法啟動——這是刻意設計，因為缺少初始化（例如未初始化的 gflags）會導致下游錯誤。

## 多個 hooks {#multiple-hooks}

以逗號分隔多個 hooks：

```bash
export LITELLM_WORKER_STARTUP_HOOKS="my_module:init_gflags,my_module:init_metrics,my_module:init_connections"
```

hooks 會按照**順序**執行，由左至右。

## 非同步 hooks {#async-hooks}

也支援非同步函式——它們會自動被 await：

```python
async def init_async_connections():
    """Example async hook for initializing async resources."""
    await setup_async_connection_pool()
```

```bash
export LITELLM_WORKER_STARTUP_HOOKS="my_module:init_async_connections"
```

## 參考 {#reference}

| 環境變數 | 說明 |
|---|---|
| `LITELLM_WORKER_STARTUP_HOOKS` | 以逗號分隔的 `module.path:function_name` 可呼叫物件，會在啟動時於每個 worker 中執行 |

hook 格式遵循標準 Python entry point 語法：`module.path:function_name`，其中 `module.path` 是一個以點號分隔的 Python import 路徑，而 `function_name` 是該模組內可呼叫物件的名稱。
