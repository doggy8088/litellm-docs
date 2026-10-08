# ChatGPT 訂閱 {#chatgpt-subscription}

透過 LiteLLM 與 OAuth 裝置流程驗證使用 ChatGPT Pro/Max 訂閱模型。

| 屬性 | 詳細資料 |
|-------|-------|
| 描述 | 透過 ChatGPT 後端 API 存取 ChatGPT 訂閱（Codex + GPT-5.3/5.4 系列） |
| LiteLLM 上的提供者路由 | `chatgpt/` |
| 支援的端點 | `/responses`、`/chat/completions`（對支援的模型橋接至 Responses） |
| API 參考 | https://chatgpt.com |

ChatGPT 訂閱存取原生支援 Responses API。Chat Completions 請求會針對支援的模型橋接至 Responses（例如 `chatgpt/gpt-5.4`）。

備註：
- ChatGPT 訂閱後端會拒絕 token 限制欄位（`max_tokens`、`max_output_tokens`、`max_completion_tokens`）以及 `metadata`。LiteLLM 會為此提供者移除這些欄位。
- `/v1/chat/completions` 會遵循 `stream`。當 `stream` 為 false（預設）時，LiteLLM 會將 Responses 串流彙整為單一 JSON 回應。

## 驗證 {#authentication}

ChatGPT 訂閱存取使用 OAuth 裝置代碼流程。LiteLLM Python SDK 會在第一次需要權杖時執行此流程，前提是它是從主執行緒上的同步腳本呼叫：它會印出驗證網址和裝置代碼，您開啟該網址、登入，並輸入代碼，接著權杖會儲存在 `~/.config/litellm/chatgpt/auth.json` 供重複使用。非同步程式、notebook、工作執行緒以及 LiteLLM proxy 都無法回應該提示（較舊版本會在此處阻塞，較新版本則會以 `ChatGPT device-code login needs a human` 失敗），因此對於 proxy，您需要先登入並掛載產生的檔案，如 [在啟動 proxy 前登入](#sign-in-before-starting-the-proxy) 所述。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### Responses（Codex 模型建議使用） {#responses-recommended-for-codex-models}

```python showLineNumbers title="ChatGPT Responses"
import litellm

response = litellm.responses(
    model="chatgpt/gpt-5.3-codex",
    input="Write a Python hello world"
)

print(response)
```

### Chat Completions（橋接至 Responses） {#chat-completions-bridged-to-responses}

```python showLineNumbers title="ChatGPT Chat Completions"
import litellm

response = litellm.completion(
    model="chatgpt/gpt-5.4",
    messages=[{"role": "user", "content": "Write a Python hello world"}]
)

print(response)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

### 在啟動 proxy 前登入 {#sign-in-before-starting-the-proxy}

proxy 無法完成裝置代碼流程：它在工作程序中執行，沒有終端可用來傳遞代碼。當磁碟上沒有 `auth.json` 時，較舊版本會從工作程序印出代碼，並在每個 `chatgpt/` 部署的啟動過程中保持等待，直到有人輸入為止（從前景終端機中，您可以對每個工作程序各做一次，而啟動會同時被暫停；從服務或容器記錄中則沒有人能做到），而較新版本則會拒絕初始化該部署，並在每個工作程序中針對每個部署記錄一次 `ChatGPT device-code login needs a human and cannot run inside a running event loop or a worker thread`。無論哪種情況，對這些模型的每個請求之後都會回傳 HTTP 400 `There are no healthy deployments for this model`。請先從終端機登入一次：

```bash showLineNumbers title="Sign in once, outside the proxy"
python -c "from litellm.llms.chatgpt.authenticator import Authenticator; Authenticator().get_access_token()"
```

開啟印出的網址、登入，並輸入代碼。權杖會落在 `~/.config/litellm/chatgpt/auth.json`（`CHATGPT_TOKEN_DIR` 和 `CHATGPT_AUTH_FILE` 會變更位置）；在放棄嘗試後的五分鐘內再次執行，會先等待該時間窗剩餘的時間，然後才會印出新的代碼。將檔案放在 proxy 主機上的相同路徑，或將 `CHATGPT_TOKEN_DIR` 設定為存放該檔案的目錄（`litellm-non_root` 映像檔以 uid 65534 執行，因此您 bind mount 進去的檔案必須由該 uid 擁有或可由其寫入，`chown 65534 auth.json`，否則第一次重新整理會因下方的寫入錯誤而失敗），之後才啟動 proxy：`model_list` 部署會在啟動時建立，因此在沒有該檔案的情況下啟動的 proxy，在檔案出現後需要重新啟動。

存取權杖大約可維持十天。當它過期時，proxy 會以重新整理權杖換取一組新的配對，並將其寫回 `auth.json`，而每個重新整理權杖只能使用一次，因此該檔案必須可寫入：唯讀複本會記錄 `Failed to write ChatGPT auth file`，並在第一次重新整理時停止運作。基於相同原因，每個 proxy 程序都必須共用同一份檔案。proxy 會在每個請求時重新讀取該檔案，因此無論哪個工作程序或 pod 先重新整理，就由它服務其餘請求；而分開的複本會在第一次重新整理時分歧，除了其中一個之外，其餘全部都會停止運作，直到您再次登入。兩個在同一時刻遇到到期的工作程序會同時嘗試使用相同的重新整理權杖，而失敗者會記錄 `ChatGPT refresh token failed, re-login required`：較新版本會讓那一個請求失敗，並在下一個請求時取得新的配對；較舊版本則會先讓該工作程序在裝置代碼輪詢中阻塞最長十五分鐘。

在 Kubernetes 上，請提供給 proxy 一份可在重新啟動後仍保留、且由所有複本共用的可寫檔案：將 PersistentVolumeClaim（`ReadWriteMany` 適用於多於一個複本）掛載到 `CHATGPT_TOKEN_DIR`，並在第一次卷空白時由 init container 從 Secret 進行播種。`ReadWriteMany` 需要支援它的儲存類別（GKE 上的 Filestore、EKS 上的 EFS、AKS 上的 Azure Files）；預設磁碟類別僅限 `ReadWriteOnce`，而對其中之一的 claim 會保持 Pending，且每個複本都卡在 ContainerCreating。若只有這類儲存類別，請執行一個複本，或將所有複本固定在同一個節點上，在那裡 `ReadWriteOnce` volume 仍會由其上的每個 pod 共用。Secret volume 是唯讀的，而每個 pod 各自的 `emptyDir` 會在每次重新啟動時從原始登入重新播種，因此兩者都會在第一次重新整理時失效。proxy 會就地改寫檔案，而不是以原子方式寫入，因此若某個複本在另一個複本寫入途中讀取該檔案，會記錄 `Invalid ChatGPT auth file`，並表現得像根本沒有登入一樣：在啟動時，這會使部署降級，且該複本需要重新啟動；在請求時，下一個請求會重新讀取檔案。`chown` 會將檔案交給官方 `litellm-non_root` 映像檔所使用的使用者（65534）；root 映像檔不需要 chown，自訂映像檔則會使用自己的 uid。在受限制的 pod security policy 下，若 init container 無法以 root 執行，請在 pod 上設定 `fsGroup: 65534`，使 volume 可由群組寫入，將 init container 以 `runAsUser: 65534` 執行，並移除 `chown`。init container 只會複製到空的 volume，因此在重新登入後，請更新 Secret，並在重新啟動 pods 前，從 volume 中刪除 `auth.json`（`kubectl exec <pod> -c litellm -- rm /tokens/chatgpt/auth.json`），否則它們會保留過時檔案並記錄 `ChatGPT refresh token failed, re-login required`。

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
        - "test -f /tokens/chatgpt/auth.json || cp /secrets/chatgpt/auth.json /tokens/chatgpt/auth.json && chown 65534 /tokens/chatgpt/auth.json"
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
  - model_name: chatgpt/gpt-5.4
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.4
  - model_name: chatgpt/gpt-5.4-pro
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.4-pro
  - model_name: chatgpt/gpt-5.3-codex
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-codex
  - model_name: chatgpt/gpt-5.3-codex-spark
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-codex-spark
  - model_name: chatgpt/gpt-5.3-instant
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-instant
  - model_name: chatgpt/gpt-5.3-chat-latest
    model_info:
      mode: responses
    litellm_params:
      model: chatgpt/gpt-5.3-chat-latest
```

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

## 設定 {#configuration}

### 環境變數 {#environment-variables}

- `CHATGPT_TOKEN_DIR`：自訂權杖儲存目錄（預設：`~/.config/litellm/chatgpt`）
- `CHATGPT_AUTH_FILE`：驗證檔案名稱（預設：`auth.json`）
- `CHATGPT_API_BASE`：覆寫 API base（預設：`https://chatgpt.com/backend-api/codex`）
- `OPENAI_CHATGPT_API_BASE`：`CHATGPT_API_BASE` 的別名
- `CHATGPT_ORIGINATOR`：覆寫 `originator` 標頭值
- `CHATGPT_USER_AGENT`：覆寫 `User-Agent` 標頭值
- `CHATGPT_USER_AGENT_SUFFIX`：附加到 `User-Agent` 標頭的可選尾碼
