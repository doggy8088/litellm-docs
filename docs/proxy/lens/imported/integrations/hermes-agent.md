---
title: "Hermes Agent"
description: "執行 Hermes Agent 範例，並將其代理程式追蹤傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/hermes-agent"
sidebar_label: "Hermes Agent"
custom_edit_url: "https://github.com/BerriAI/litellm-lens-example/edit/main/hermes-agent/README.md"
mdx:
  format: md
---

<!-- Generated from BerriAI/litellm-lens-example/hermes-agent/README.md at a2294277609202247b71c08d7b491f5212809988. Edit the source README. -->

# Hermes Agent {#hermes-agent}

如需從您的程式碼代理程式取得選擇性協助，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md#connect-an-agent-to-lens-already-running)。它會保留您的模型連線，並在設定後驗證一個真實的 trace

使用此儲存庫中的可執行範例，將 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 追蹤傳送至 [LiteLLM Lens](/docs/proxy/lens)。這些範例將 Hermes 內嵌為 Python 程式庫，並使用 [hermes-otel](https://github.com/briancaffey/hermes-otel) 外掛程式匯出其追蹤。

## 必要條件 {#prerequisites}

您需要 [與 LiteLLM 一併安裝的 Lens](/docs/proxy/lens/deployment#configure-an-existing-proxy)、具有模型存取權的金鑰，以及已設定的模型別名。swarm 範例需要支援工具呼叫的模型。在 **Lens > Traces > Set up tracing** 中，按一下 **Generate tracing key**，並複製 **Connection details** 下的 **Traces endpoint**。如果您無法建立追蹤金鑰，請向您的管理員索取。

安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/) 和 Git。Hermes 需要啟用 GIL 的 CPython 3.14；已檢入的 `.python-version` 會選取它，如果 uv 只找到 free-threaded 建置，`uv python install 3.14` 會安裝它。

## 設定 {#configuration}

Hermes 不發佈 wheel，因此這些範例會以可編輯模式安裝固定的原始碼檢出。對於全新的檢出：

```bash
git clone https://github.com/BerriAI/litellm-lens-example.git
cd litellm-lens-example/hermes-agent
git clone https://github.com/NousResearch/hermes-agent.git vendor/hermes-agent
git -C vendor/hermes-agent checkout c225c4a04e8b517a357804ebb27367b0c961fd0e
uv sync --all-packages
HERMES_HOME="$PWD/home" uv run --package lens-hermes-agent-simple hermes plugins install briancaffey/hermes-otel/hermes_otel --ref d234865b13e997e0b3a50dc18aaad7c7d7b1b1fe --yes-deps --enable
cp .env.example .env
```

如果您已經複製過該儲存庫，請從 `hermes-agent/` 執行剩餘的命令。外掛程式會安裝到 `home/`，即這兩個範例使用的 Hermes 家目錄。若 [.env.example](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/hermes-agent/.env.example) 不存在，請將其複製到 `.env`，然後設定：

| 變數              | 值                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `LITELLM_GATEWAY_URL` | 您的閘道基礎 URL，不含結尾斜線或 `/v1`，例如 `http://localhost:4000` |
| `LITELLM_API_KEY`     | 您的 LiteLLM 模型金鑰                                                                               |
| `LENS_URL`            | 從 Lens 追蹤設定複製 **Traces endpoint**，並移除結尾的 `/v1/traces`。若有 `/lens-ingest`，請保留。例如 `http://localhost:4318` 或 `https://gateway.example/lens-ingest` |
| `LENS_TRACING_KEY`    | Lens 追蹤設定中的專用追蹤金鑰 |
| `LITELLM_MODEL`       | 在您的閘道上設定的模型別名                                                       |

已檢入的值會指向本機開發用閘道。請在您的部署中將它們替換掉。[home/hermes\_otel.yaml](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/hermes-agent/home/hermes_otel.yaml) 會使用追蹤金鑰作為 bearer token，將追蹤傳送至 `LENS_URL/v1/traces`。

## 執行範例 {#run-an-example}

### 簡單代理程式 {#simple-agent}

沒有工具的單一 Hermes 回合會在一次模型呼叫中回答一個問題。

```bash
uv run --env-file .env --package lens-hermes-agent-simple simple/main.py
```

實作請參見 [simple/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/hermes-agent/simple/main.py)。

### 代理程式蜂群 {#agent-swarm}

協調者會使用 `delegate_task` 將事實收集和起草工作交給兩個子代理程式，然後根據它們的結果回答。Hermes 會在背景執行頂層委派，並將其結果作為後續回合回傳，因此範例會等待子代理程式完成後再執行該回合。

```bash
uv run --env-file .env --package lens-hermes-agent-swarm swarm/main.py
```

實作請參見 [swarm/main.py](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/hermes-agent/swarm/main.py)。

## 驗證追蹤 {#verify-the-trace}

在範例印出答案後，請在您的閘道上開啟 **Lens > Traces**，並從 `hermes-agent` 服務選取新的執行。每個 Hermes 回合是一個以 `agent` span 為根的追蹤，每個回合有一個 `llm.<model>` span，每個模型請求有一個 `api.<model>` span。追蹤支出應該與這些請求的支出記錄相等。

對於蜂群，第一個追蹤包含 `tool.delegate_task` 呼叫，以及每個子代理程式一個 `subagent.leaf` span，每個 span 都巢狀包含子代理程式自己的 `agent` 回合。讀取子代理程式結果的後續回合，是同一個 Hermes 工作階段中的第二個追蹤。

## 追蹤如何運作 {#how-tracing-works}

hermes-otel 會將 Hermes 生命週期掛鉤轉換為 OpenInference 和 GenAI span。它的 span 不帶有閘道回應 ID，因此範例會透過 [home/plugins/model-providers/litellm](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/hermes-agent/home/plugins/model-providers/litellm/__init__.py) 中的 `litellm` 提供者路由 Hermes。該提供者會為每個 Hermes OpenAI 用戶端提供 [共用閘道傳輸](https://github.com/BerriAI/litellm-lens-example/blob/a2294277609202247b71c08d7b491f5212809988/shared/README.md)，它會在作用中的 `api.<model>` span 下新增一個帶有閘道呼叫 ID 的請求嘗試 span。hermes-otel 從不將其 span 設為目前 span，因此提供者會透過 hermes-otel 的 `get_current_traceparent`，依請求的 Hermes 工作階段查找作用中的 span。

若要追蹤您自己的 Hermes 安裝，請將提供者外掛程式複製到 `~/.hermes/plugins/model-providers/`，將 `gateway-tracing` 安裝到 Hermes 環境中，並選取 `litellm` 提供者。

## 疑難排解 {#troubleshooting}

如果模型呼叫失敗，請檢查閘道 URL、金鑰和模型別名。如果答案已出現但追蹤缺失，請設定 `HERMES_OTEL_DEBUG=true`，並檢查 `home/plugins/hermes_otel/debug.log` 和終端機中的匯出器錯誤，並確認使用您的追蹤金鑰可以連線到 Lens 接收服務。模型呼叫成功並不代表其追蹤匯出也成功。

如果追蹤沒有顯示支出，請確認範例傳遞了 `provider="litellm"`，且每個 `api.<model>` span 都有一個 `gateway.request` 子項。如果處理程序以 segmentation fault 結束，表示 uv 選取了 free-threaded Python：請執行 `uv python install 3.14`，移除 `.venv` 和 `home/installs`，並重複設定。
