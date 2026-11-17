---
title: "搭配 LiteLLM 使用 ChatGPT 訂閱（Codex）"
sidebar_label: "ChatGPT 訂閱"
description: "透過 LiteLLM 的 OAuth 裝置流程，從 Python SDK 或 AI 閘道使用包含 Codex 的 ChatGPT 訂閱，支援 Responses 與 Chat Completions。"
---

# ChatGPT 訂閱 {#chatgpt-subscription}

透過 LiteLLM 與 OAuth 裝置流程驗證，使用包含 Codex 的 ChatGPT 訂閱（方案從 Plus、Pro 到 Business 與 Enterprise，請參閱 OpenAI 的 [Codex 定價](https://developers.openai.com/codex/pricing)）。

:::tip

LiteLLM 也能使用 Claude 與 GitHub Copilot 訂閱。若要比較這三種訂閱，請參閱 [Claude、Codex 與 Copilot 訂閱](/docs/subscriptions)。

:::

| 屬性 | 詳細資料 |
|-------|-------|
| 描述 | 透過 ChatGPT 後端 API 存取 ChatGPT 訂閱 |
| LiteLLM 上的提供者路由 | `chatgpt/` |
| 支援的端點 | `/responses`、`/chat/completions`（對支援的模型橋接至 Responses） |
| API 參考 | https://chatgpt.com |

ChatGPT 訂閱存取原生支援 Responses API。Chat Completions 請求會針對支援的模型橋接至 Responses（例如 `chatgpt/{{chatgpt}}`）。

請使用您的 ChatGPT 方案與工作區可呼叫的模型。[OpenAI 的 Codex 模型頁面](https://learn.chatgpt.com/docs/models)列出了目前與已淘汰的模型。該清單與 OpenAI API 提供的模型不同。

範例使用 `{{chatgpt}}` 與 `{{chatgpt_small}}`。哪些方案可呼叫這些模型，請查看模型頁面。截至 2026 年 10 月，OpenAI 向 Plus、Pro、Business、Enterprise 與 Edu 方案推出 GPT-6.1 Sol（`gpt-6.1-sol`），而在 Enterprise 與 Edu 上，管理員必須先啟用 GPT-6.1 Sol 與 GPT-6 Luna（`gpt-6-luna`）。Free 與 Go 方案在推出時不包含 GPT-6.1 Sol，OpenAI 建議這些方案在 ChatGPT 桌面應用程式中可用時選擇 GPT-6 Luna，因此 LiteLLM 在這些方案上可能兩個模型都無法呼叫。後端未提供給您帳戶的模型（例如已淘汰的模型）會失敗，並顯示 `The '<model>' model is not supported when using Codex with a ChatGPT account.`

備註：
- ChatGPT 訂閱後端會拒絕 token 限制欄位（`max_tokens`、`max_output_tokens`、`max_completion_tokens`）以及 `metadata`。LiteLLM 會為此提供者移除這些欄位。
- `/v1/chat/completions` 會遵循 `stream`。當 `stream` 為 false（預設）時，LiteLLM 會將 Responses 串流彙整為單一 JSON 回應。
- 請如下方範例，將 Responses `input` 作為訊息清單傳送。在 LiteLLM 1.106.0 上，純字串 `input` 會失敗並傳回 `{"detail":"Input must be a list"}`，SDK 與 proxy 皆然。

## 驗證 {#authentication}

ChatGPT 訂閱存取使用 OAuth 裝置代碼流程。LiteLLM Python SDK 在第一次需要權杖時會執行此流程，前提是從主執行緒上的同步指令碼呼叫：它會印出驗證網址與裝置代碼，您開啟網址、登入並輸入代碼，權杖便會儲存在 `~/.config/litellm/chatgpt/auth.json` 以供重複使用。非同步程式碼、notebook、工作執行緒與 LiteLLM proxy 無法回應該提示（舊版會卡在該提示，新版則會以 `ChatGPT device-code login needs a human` 失敗），因此 proxy 需先登入並掛載產生的檔案，如[在啟動 proxy 前登入](#sign-in-before-starting-the-proxy)所述。

裝置代碼登入必須先為帳戶啟用：個人方案在 ChatGPT 的安全性設定中啟用，Business 與 Enterprise 則由工作區管理員在工作區權限中啟用（[OpenAI 文件](https://learn.chatgpt.com/docs/auth)）。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

在 LiteLLM 1.106.0 上，`chatgpt/` 提供者需要 `mcp` 套件，而一般的 `pip install litellm` 不包含它。請以 `mcp` extra 安裝 LiteLLM：

```bash showLineNumbers title="Install"
pip install 'litellm[mcp]'
```

### Responses（Codex 模型建議使用） {#responses-recommended-for-codex-models}

```python showLineNumbers title="ChatGPT Responses"
import litellm

response = litellm.responses(
    model="chatgpt/{{chatgpt}}",
    input=[{"role": "user", "content": "Write a Python hello world"}]
)

print(response)
```

### Chat Completions（橋接至 Responses） {#chat-completions-bridged-to-responses}

```python showLineNumbers title="ChatGPT Chat Completions"
import litellm

response = litellm.completion(
    model="chatgpt/{{chatgpt}}",
    messages=[{"role": "user", "content": "Write a Python hello world"}]
)

print(response)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

請以 `proxy` extra 安裝 LiteLLM，該 extra 也包含 `mcp` 套件：

```bash showLineNumbers title="Install the proxy"
pip install 'litellm[proxy]'
```

### 在啟動 proxy 前登入 {#sign-in-before-starting-the-proxy}

proxy 無法完成裝置代碼流程：它在工作程序中執行，沒有終端可用來傳遞代碼。當磁碟上沒有 `auth.json` 時，舊版會從 worker 印出代碼，並在等待有人輸入的期間卡住每個 `chatgpt/` 部署的啟動（從前景終端可以輸入，每個 worker 一次，但啟動會同時被卡住；從服務或容器記錄則無人能輸入），新版則拒絕初始化部署，並在每個 worker 中為每個部署記錄一次 `ChatGPT device-code login needs a human and cannot run inside a running event loop or a worker thread`。無論哪種情況，對這些模型的每個請求之後都會傳回 HTTP 400 `There are no healthy deployments for this model`。請改從終端登入一次：

```bash showLineNumbers title="Sign in once, outside the proxy"
python -c "from litellm.llms.chatgpt.authenticator import Authenticator; Authenticator().get_access_token()"
```

開啟印出的網址、登入，並輸入代碼。登入會將權杖儲存在 `~/.config/litellm/chatgpt/auth.json`。使用 `CHATGPT_TOKEN_DIR` 與 `CHATGPT_AUTH_FILE` 可變更位置。如果您放棄一次登入嘗試，第二次執行會等到五分鐘時間窗結束後才印出新代碼。

將檔案複製到 proxy 主機上的相同路徑，或將 `CHATGPT_TOKEN_DIR` 設定為其目錄。讓 proxy 的有效 UID 對該檔案有寫入權限，以便重新整理權杖。在啟動 proxy 前先建立該檔案。proxy 會在啟動時建立 `model_list` 部署，因此如果之後才加入檔案，請重新啟動 proxy。

存取權杖大約可維持十天。當它過期時，proxy 會以重新整理權杖換取一組新的配對，並將其寫回 `auth.json`，而每個重新整理權杖只能使用一次，因此該檔案必須可寫入：唯讀複本會記錄 `Failed to write ChatGPT auth file`，並在第一次重新整理時停止運作。基於相同原因，每個 proxy 程序都必須共用同一份檔案。proxy 會在每個請求時重新讀取該檔案，因此無論哪個工作程序或 pod 先重新整理，就由它服務其餘請求；而分開的複本會在第一次重新整理時分歧，除了其中一個之外，其餘全部都會停止運作，直到您再次登入。兩個在同一時刻遇到到期的工作程序會同時嘗試使用相同的重新整理權杖，而失敗者會記錄 `ChatGPT refresh token failed, re-login required`：較新版本會讓那一個請求失敗，並在下一個請求時取得新的配對；較舊版本則會先讓該工作程序在裝置代碼輪詢中阻塞最長十五分鐘。

在 Kubernetes 上，將 PersistentVolumeClaim 掛載到 `CHATGPT_TOKEN_DIR`。讓每個複本都能存取同一份可寫的權杖檔案。當 volume 為空時，使用 init container 從 Secret 複製檔案。

對於多個節點上的複本，請使用 `ReadWriteMany` 並搭配支援它的儲存類別，例如 GKE 上的 Filestore、EKS 上的 EFS 或 AKS 上的 Azure Files。預設磁碟類別僅支援 `ReadWriteOnce`，會讓 `ReadWriteMany` claim 保持 Pending，其 pods 卡在 ContainerCreating。使用 `ReadWriteOnce` 時，請執行單一複本，或將所有複本放在同一節點上以共用 volume。

不要使用 Secret volume 作為權杖檔案，因為它是唯讀的。每個 pod 各自的 `emptyDir` 也會在 pod 重新啟動時遺失已重新整理的權杖。proxy 會就地覆寫檔案。如果另一個複本在寫入期間讀取，會記錄 `Invalid ChatGPT auth file`。在啟動時，此錯誤會移除部署，直到您重新啟動該複本。在請求期間，下一個請求會再次讀取檔案。

範例使用 UID 65532，這是[共用映像檔來源](https://github.com/BerriAI/litellm/blob/f52f26d9c636038c6e3609cc7d17cf625d434c3e/Dockerfile)中的預設值。請讓檔案擁有權符合您的映像檔與任何 `runAsUser` 覆寫。在受限制的 pod security policy 下，請使用可寫的 `fsGroup`。以 proxy 的有效 UID 與群組執行 init container，並省略僅限 root 的 `chown`。請確認您的儲存驅動程式有套用這些 volume 權限。

重新登入後，請更新 Secret，並以 `kubectl exec <pod> -c litellm -- rm /tokens/chatgpt/auth.json` 從 volume 中刪除 `auth.json`。然後重新啟動 pods。init container 只會複製到空的 volume。如果舊檔案仍在，proxy 會記錄 `ChatGPT refresh token failed, re-login required`。

```bash showLineNumbers title="Create the Secret from your local login"
kubectl create secret generic litellm-chatgpt-auth --from-file=auth.json=$HOME/.config/litellm/chatgpt/auth.json
```

```yaml showLineNumbers title="Shared token volume"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: litellm-chatgpt-tokens
spec:
  accessModes: ["ReadWriteMany"]
  resources:
    requests:
      storage: 1Mi
```

```yaml showLineNumbers title="Pod spec excerpt"
spec:
  initContainers:
    - name: chatgpt-token
      image: busybox:1.37
      command:
        - sh
        - -c
        - "test -f /tokens/chatgpt/auth.json || cp /secrets/chatgpt/auth.json /tokens/chatgpt/auth.json && chown 65532 /tokens/chatgpt/auth.json"
      volumeMounts:
        - name: chatgpt-secret
          mountPath: /secrets/chatgpt
          readOnly: true
        - name: chatgpt-tokens
          mountPath: /tokens/chatgpt
  containers:
    - name: litellm
      env:
        - name: CHATGPT_TOKEN_DIR
          value: /tokens/chatgpt
      volumeMounts:
        - name: chatgpt-tokens
          mountPath: /tokens/chatgpt
  volumes:
    - name: chatgpt-secret
      secret:
        secretName: litellm-chatgpt-auth
    - name: chatgpt-tokens
      persistentVolumeClaim:
        claimName: litellm-chatgpt-tokens
```

### 設定並啟動 proxy {#configure-and-start-the-proxy}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chatgpt/{{chatgpt}}
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/{{chatgpt}}
  - model_name: chatgpt/{{chatgpt_small}}
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/{{chatgpt_small}}
```

```bash showLineNumbers title="Start LiteLLM Proxy"
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config config.yaml
```

在另一個終端中，將 `LITELLM_API_KEY` 設定為上方印出的金鑰，然後呼叫 proxy：

```bash showLineNumbers title="Call the proxy"
curl http://localhost:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "chatgpt/{{chatgpt}}", "input": [{"role": "user", "content": "Write a Python hello world"}]}'
```

## 憑證範圍與歸屬 {#credential-scope-and-attribution}

一個 proxy 恰好使用一個 ChatGPT 登入：`CHATGPT_TOKEN_DIR` 中的 `auth.json`，它為整個程序設定一次。對 `chatgpt/` 模型的每個請求都會以該檔案的存取權杖與取自該檔案的 `ChatGPT-Account-Id` 傳送至上游，無論由哪個虛擬金鑰發起呼叫，且 LiteLLM 會忽略用戶端傳送的任何 ChatGPT 權杖。因此，每個能呼叫 `chatgpt/` 模型的金鑰、使用者與團隊都使用同一個 ChatGPT 帳戶與工作區，使用者無法透過此提供者使用自己的 ChatGPT 訂閱。若要服務多個 ChatGPT 帳戶，每個帳戶需要一個 proxy 部署。

LiteLLM 會像其他模型一樣，將 `chatgpt/` 請求歸屬至發起呼叫的虛擬金鑰、使用者與團隊，並記錄其 token 數量。這些模型在成本對應表中沒有價格，因此記錄的花費為 $0，`max_budget` 限制永遠不會觸發；請改以金鑰與團隊上的 `rpm_limit` 或 `tpm_limit` 限制用量。在 OpenAI 端，所有用量都會顯示在登入的帳戶下。

## 重新整理失敗與撤銷 {#refresh-failures-and-revocation}

LiteLLM 只在儲存的存取權杖過期時才重新整理。對於尚未過期的權杖，ChatGPT 後端傳回的 401（例如工作階段已在 OpenAI 端登出）會傳回給呼叫者，不會觸發重新整理。當重新整理權杖被拒絕時，proxy 會記錄 `ChatGPT refresh token failed, re-login required`，請求會以 HTTP 400 `ChatGPT device-code login needs a human` 失敗；請在 proxy 外重新登入並取代 `auth.json`。

LiteLLM 對此提供者沒有登出或撤銷呼叫。若要停止 proxy 使用該帳戶，請刪除 `auth.json`（以及在 Kubernetes 上用來播種的 Secret）並重新啟動 proxy。若要使權杖本身失效，請從 ChatGPT 帳戶的安全性設定中登出該工作階段。

## 設定 {#configuration}

### 環境變數 {#environment-variables}

- `CHATGPT_TOKEN_DIR`：自訂權杖儲存目錄（預設：`~/.config/litellm/chatgpt`）
- `CHATGPT_AUTH_FILE`：驗證檔案名稱（預設：`auth.json`）
- `CHATGPT_API_BASE`：覆寫 API base（預設：`https://chatgpt.com/backend-api/codex`）
- `OPENAI_CHATGPT_API_BASE`：`CHATGPT_API_BASE` 的別名
- `CHATGPT_ORIGINATOR`：覆寫 `originator` 標頭值
- `CHATGPT_USER_AGENT`：覆寫 `User-Agent` 標頭值
- `CHATGPT_USER_AGENT_SUFFIX`：附加到 `User-Agent` 標頭的可選尾碼
