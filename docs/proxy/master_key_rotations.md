# 旋轉 Master Key {#rotating-master-key}

## 實際加密您已儲存的憑證的是什麼 {#what-actually-encrypts-your-stored-credentials}

LiteLLM 會使用在執行階段解析出的簽署金鑰，對靜態資料中的資料（model `litellm_params`、credentials、MCP server credentials、DB 中儲存的環境變數）進行加密。當 `LITELLM_SALT_KEY` 已設定時，該簽署金鑰就是它；只有在未設定 salt key 時，才會退回使用 `LITELLM_MASTER_KEY`。解密永遠使用相同的解析方式，因此能夠解密您已儲存資料的值，就是寫入當時生效的那個金鑰。

這個差異決定了您要如何旋轉 master key。請先選擇符合您設定的情境，再執行任何命令。

:::danger 旋轉前請先閱讀
如果您有設定專用的 `LITELLM_SALT_KEY`，您的 master key 並不會加密任何已儲存的憑證。在這種情況下，請不要執行下方的 `/key/regenerate` 重新加密流程。若仍執行，系統會使用新的 master key 重新加密您的 models，但解密仍會使用未變更的 salt key，這會使所有已儲存的 model 都無法解密，並讓 proxy 停止運作，直到資料被還原或重新註冊。
:::

## 情境 A：您有設定專用的 `LITELLM_SALT_KEY`（建議用於 production） {#scenario-a-you-have-a-dedicated-litellm_salt_key-recommended-for-production}

您的 model 與憑證資料是綁定到 `LITELLM_SALT_KEY`，而不是綁定到 master key，因此旋轉 master key 不會影響已加密的資料，也不需要任何重新加密。

**1. 更新 `LITELLM_MASTER_KEY`**

將環境中的 `LITELLM_MASTER_KEY` 設為新值，然後重新啟動 proxy。salt key 會完全維持原樣，因此所有先前儲存的憑證仍可正常解密。

**2. 測試**

使用有效的 key 對 DB 中儲存的 model 發出請求，並確認成功。

```bash
 curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-new-master-key' \
-d '{
    "model": "gpt-4o-mini",
    "messages": [
        {
            "content": "Hey, how'\''s it going",
            "role": "user"
        }
    ]
}'
```

請勿旋轉 `LITELLM_SALT_KEY` 本身。如 [prod best practices](./prod#8-set-litellm-salt-key) 所述，在您新增 model 之後，它不得變更，因為 salt-key 旋轉沒有就地遷移，而且所有已儲存的憑證都必須重新註冊。

## 情境 B：您尚未設定專用的 salt key（salt key 會回退到 master key） {#scenario-b-you-have-not-set-a-dedicated-salt-key-salt-key-falls-back-to-the-master-key}

在這裡，master key 就是您已儲存資料的簽署金鑰，因此變更它確實需要將所有以舊金鑰寫入的資料重新加密。`/key/regenerate` 會使用目前的金鑰解密您已儲存的資料，並為您以 `new_master_key` 重新加密。

:::tip 建議使用專用的 salt key
在旋轉之前，請考慮設定永久的 `LITELLM_SALT_KEY`，這樣未來 master-key 旋轉就會變成情境 A 的免遷移流程。請先將 salt key 設為您目前的 master key 值（如此既有資料仍可正常解密），之後再自由旋轉 master key。
:::

**1. 備份您的 DB**

以防加密/解密流程中發生任何錯誤，這會讓您能夠在沒有問題的情況下還原到目前狀態。

**2. 使用新的 master key 呼叫 `/key/regenerate`**

```bash
curl -L -X POST 'http://localhost:4000/key/regenerate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
  "key": "sk-1234",
  "new_master_key": "sk-PIp1h0RekR"
}'
```

這會使用新的 master key 重新加密您 Proxy_ModelTable 中的任何 models。

預期會開始在 logs 中看到解密錯誤，因為您的舊 master key 已無法解密新的值。

```bash
   raise Exception("Unable to decrypt value={}".format(v))
Exception: Unable to decrypt value=<new-encrypted-value>
```

**3. 更新 LITELLM_MASTER_KEY**

在您的環境變數中，將 LITELLM_MASTER_KEY 的值更新為步驟 2 的 new_master_key。

這可確保從 db 解密時使用的金鑰是新金鑰。

**4. 測試**

使用 litellm key（新的 master key 或 virtual key）對儲存在 proxy 上的 model 發出測試請求，看看是否可正常運作

```bash
 curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-4o-mini", # 👈 REPLACE with 'public model name' for any db-model
    "messages": [
        {
            "content": "Hey, how's it going",
            "role": "user"
        }
    ],
}'
```
