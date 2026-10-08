---
title: Sandboxes
---

# 沙箱 {#sandboxes}

每次呼叫都需要沙箱。CLI harness 會在其中執行，而 Deep Agents 內建的檔案與 shell 工具也會使用它。Tool Loop 和 Deep Agents 會在您的程序中執行 Python 工具，因此這些工具不會自動受到沙箱限制

## 內建沙箱 {#built-in-sandboxes}

| 建構式 | 執行位置 | 適用於 |
|---|---|---|
| `sandbox.local(path)` | 主機子程序，工作目錄是 `path` | 您的筆電與受信任的 repo；runtime 擁有您的使用者權限 |
| `sandbox.docker(image, mounts=, workdir="/workspace")` | 由 `docker` CLI 啟動的容器 | CI 與您不信任的程式碼 |

`sandbox.local` 會從子環境中移除提供者憑證（`ANTHROPIC_*`、`OPENAI_*`、`LITELLM_*`、`AZURE_*`、`AWS_*`、`GEMINI_*`、`GOOGLE_API_KEY`、`CODEX_*`、`CURSOR_*`），因此 runtime 無法取得您的真實金鑰。`sandbox.docker` 透過 `host.docker.internal` 存取主機端點，且不需要 Python Docker SDK。

## Runtime 二進位檔 {#runtime-binaries}

在此版本中，runtime 必須已安裝在沙箱中。請使用您需要的 CLI 建置映像檔：

```dockerfile title="Dockerfile"
FROM node:24
RUN npm install -g @anthropic-ai/claude-code @openai/codex opencode-ai
WORKDIR /workspace
```

對於 `sandbox.local`，CLI 二進位檔必須位於您的 `PATH`。缺少二進位檔會引發 `HarnessInstallFailed`，並指出其名稱。Deep Agents 和 Tool Loop 不需要在沙箱中安裝任何東西

## 第一輪之前的設定 {#setup-before-the-first-turn}

請在您自己的程式碼中完成任何設定。沒有生命週期 hook。

```python
box = sandbox.docker("my-agents:latest", mounts={"./repo": "/workspace"})
await box.run(["pip", "install", "-e", ".[dev]"])

async with litellm.aagent_session(Harness.CODEX, sandbox=box, model="litellm_proxy/coder") as s:
    ...
```

## 您自己的沙箱 {#your-own-sandbox}

任何具有這些成員的物件都是沙箱。沒有可繼承的基底類別。

```python
class Sandbox(Protocol):
    workdir: str
    async def exec(self, cmd: list[str], *, env=None, cwd=None) -> Process: ...
    async def run(self, cmd: list[str], *, env=None, cwd=None, timeout=None) -> CompletedRun: ...
    async def read(self, path: str) -> bytes: ...
    async def write(self, path: str, data: bytes) -> None: ...
    def host_url(self, port: int) -> str: ...
    async def which(self, binary: str) -> str | None: ...
    async def snapshot(self) -> dict[str, str]: ...
    async def close(self) -> None: ...
```

`host_url(port)` 會傳回一個 URL，沙箱內的程式碼可用它來連線到您主機上的某個埠；runtime 會用它連線到本機模型端點。`snapshot()` 會傳回相對路徑到 SHA-256 的對應，在每輪之前與之後進行 diff，以產生 `FileChange` 事件。
