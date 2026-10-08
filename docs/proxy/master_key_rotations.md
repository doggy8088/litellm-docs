# 輪換 Master Key {#rotating-the-master-key}

主金鑰是 proxy 的管理員憑證；它用於驗證管理 API 呼叫，並讓您登入 Admin UI。在某些部署中，它也是用來在資料庫中加密靜態儲存憑證的金鑰：proxy 會用 `LITELLM_SALT_KEY` 為儲存的資料（模型 `litellm_params`、憑證、MCP 伺服器憑證、資料庫中儲存的環境變數）進行簽章（當其已設定時），而只有在未設定 salt key 時才會退回使用主金鑰。您如何輪替主金鑰，取決於它扮演哪些角色；若處理錯誤，可能會讓您儲存的憑證無法讀取，因此在執行任何操作前，請先閱讀與您設定相符的情況。

:::warning

如果您設定了 [salt key](./prod.md#set-the-salt-key)，proxy 會使用 salt key 來解密儲存的憑證，而不是主金鑰。在那種設定下，不要使用 `POST /key/regenerate` 和 `new_master_key` 來輪替主金鑰。那個流程會以新的主金鑰重新加密所有內容，但執行中的 proxy 仍會用 salt key 解密，因此所有儲存的憑證都會變得無法讀取，部署也可能被鎖死。請改為遵循下方的 salt-key 章節。

:::

在任一流程之前都先備份資料庫。模型重新加密會刪除並重新建立資料列，而不是就地更新；憑證重新加密則會略過任何失敗的資料列，因此部分失敗可能會使資料滯留。備份能讓您乾淨地還原。

虛擬金鑰是以雜湊儲存，而不是加密，所以在任一輪替之後都仍可正常運作。只有儲存在資料庫中的模型（`store_model_in_db`）會在 regenerate 流程中重新加密；在設定檔中定義的模型不受影響。這在開源版本中即可使用；主金鑰輪替並不受企業版限制。基於設計，這裡沒有 Admin UI 流程；您可以透過 API 或在啟動時進行輪替。

## 如果您使用 salt key（建議設定） {#if-you-use-a-salt-key-recommended-setup}

當 `LITELLM_SALT_KEY` 已設定時，salt key 會用來加密與解密您儲存的憑證，而主金鑰只是一個驗證憑證。輪替它不會碰到任何靜態儲存的加密內容，因此不需要重新加密。

產生新的主金鑰值，更新秘密所在的位置（`LITELLM_MASTER_KEY` 環境變數，或您設定檔中的 `general_settings.master_key`），並重新啟動每個 proxy 執行個體，讓它們載入新值。不要在此處搭配 `POST /key/regenerate` 與 `new_master_key`；那樣會以 proxy 從不拿來解密的金鑰重新加密您的憑證。

不要輪替 `LITELLM_SALT_KEY` 本身。您一旦新增模型之後，它就不能再變更；salt-key 輪替沒有就地遷移，因此每個儲存的憑證都必須重新註冊。

## 如果 master key 就是您的加密金鑰 {#if-the-master-key-is-your-encryption-key}

當未設定 salt key 時，主金鑰同時也是靜態儲存加密的金鑰，因此輪替它需要重新加密儲存的資料。

:::tip[建議使用專用的 salt key]
在輪替之前，請考慮先設定一個永久的 `LITELLM_SALT_KEY`，讓未來的主金鑰輪替都能變成上面的無需遷移流程。先把 salt key 設為您目前的主金鑰值（如此現有資料仍可解密），之後就能自由輪替主金鑰。
:::

您可以依下方說明，對正在執行的 proxy 使用 `POST /key/regenerate`；或者在啟動時使用 `LITELLM_MIGRATE_FROM_MASTER_KEY`，此方式不需要正在執行的 proxy，且[涵蓋更多儲存值](#boot-time-migration)。

以目前的主金鑰作為 `key`，新的主金鑰作為 `new_master_key`，呼叫 `POST /key/regenerate`。只有當 `key` 是目前的主金鑰時，proxy 才會輪替主金鑰；若為其他值，則會將此呼叫視為一般的虛擬金鑰重新產生。

```bash
curl -L -X POST 'http://localhost:4000/key/regenerate' \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "key": "sk-<current-master-key>",
  "new_master_key": "sk-<your-master-key>"
}'
```

這會在新的主金鑰下重新加密儲存的模型、設定表中儲存的 `environment_variables`、憑證表，以及 MCP 伺服器、使用者與每位使用者環境憑證表。它會回傳新的金鑰：

```json
{
  "key": "sk-<your-master-key>",
  "token": "sk-<your-master-key>",
  "key_name": "sk-<your-master-key>",
  "expires": null
}
```

執行中的程序不會自行採用新金鑰，因此請先完成下方步驟，之後它才能解密剛才重新加密的內容。

## 輪換後 {#after-rotating}

在舊值曾存在的每個地方更新主金鑰：`LITELLM_MASTER_KEY` 環境變數與您的秘密管理系統，以及您若有設定的話，設定檔中的 `general_settings.master_key`。如果兩者都存在，`general_settings.master_key` 會優先於環境變數，因此請確保其中是新值。

重新啟動每個 proxy 執行個體，讓它們載入新金鑰。接著驗證：使用新的主金鑰登入 Admin UI，並以 LiteLLM 金鑰（新的主金鑰或虛擬金鑰）對資料庫儲存的模型送出請求，確認成功。

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_MASTER_KEY" \
-d '{
    "model": "{{openai_small}}",
    "messages": [
        {
            "content": "Hey, how'\''s it going",
            "role": "user"
        }
    ]
}'
```

如果 UI 能載入，而且您儲存的模型與憑證都能正常解析，輪替就完成了。

## Proxy 會拒絕以已知不安全的 master key 啟動 {#proxy-refuses-to-start}

當 proxy 在啟動時解析到的主金鑰未設定、為空或只有空白，或與公開已知的不安全值相符時，會以非零狀態結束，並列印修正方式。如果沒有主金鑰，proxy 會在沒有驗證的情況下執行，並接受每個請求。那個已知的不安全值曾在 LiteLLM 自己的文件與教學中廣泛宣傳，因此任何能連到 proxy 的人都能猜到它。

接下來要做什麼，取決於舊金鑰是否曾加密您資料庫中的任何內容。proxy 會替您判斷。當已設定資料庫且 `LITELLM_SALT_KEY` 未設定時，它會在拒絕期間連線，並計算可用不安全金鑰解密的儲存值，而它列印的步驟取決於結果。

### 沒有任何內容是以舊金鑰加密的 {#nothing-is-encrypted-with-the-old-key}

當數量為 0、沒有資料庫，或 `LITELLM_SALT_KEY` 已設定時，就屬於這種情況。沒有任何東西需要遷移，因此錯誤只會告訴您替換金鑰。如果金鑰來自 `general_settings.master_key`，它會先提醒您確認設定檔是從環境變數讀取金鑰。設定新金鑰的步驟取決於 `LITELLM_MASTER_KEY` 是否已在 proxy 的環境中設定。

當該變數完全未設定時，錯誤會印出一個產生金鑰並將其儲存至 `.env` 的命令。[應將新金鑰放在哪裡](#where-to-set-the-new-key) 涵蓋了不讀取 `.env` 檔案的設定方式。

```bash
echo "LITELLM_MASTER_KEY=sk-$(openssl rand -hex 32)" | tee -a .env
```

當該變數已設定為已知不安全值，或為空時，錯誤會印出一個只會產生金鑰的命令。請在目前 `LITELLM_MASTER_KEY` 值所在的任何位置，以新金鑰取代它：shell export、您的容器或部署環境，或 `.env` 中的那一行。不要只是把它加到 `.env`。proxy 會載入 `.env`，但不會覆寫已存在的變數，因此環境中已 export 的值會優先，而追加的一行永遠不會生效。

```bash
echo "sk-$(openssl rand -hex 32)"
```

接著再次啟動 proxy。這與 [使用 salt key 進行輪替](#if-you-use-a-salt-key-recommended-setup) 的交換與重新啟動相同。當 `LITELLM_SALT_KEY` 已設定時，不要呼叫 `POST /key/regenerate` 搭配 `new_master_key`。如本頁頂端的警告所說，這會讓您儲存的憑證無法讀取。

### 資料庫中保存著以舊金鑰加密的值 {#the-database-holds-values-encrypted-with-the-old-key}

當未設定 salt key 時，主金鑰也會加密儲存在資料庫中的憑證，因此只替換它會讓這些憑證無法讀取。錯誤會如此說明，並附上找到的值數量：

```text
Your database holds 6 value(s) encrypted with this master key,
which encrypts stored credentials while LITELLM_SALT_KEY is not set. Replacing the key alone makes them
unreadable, so also tell the proxy which key to migrate from:
```

如果在拒絕期間無法連上資料庫，第一行則會改為「Your database could not be checked for values encrypted with this master key,」，並接續相同的步驟。無論哪種情況，照著做都是安全的，因為當沒有東西需要遷移時，遷移不會做任何事。

您可以用 `LITELLM_MIGRATE_FROM_MASTER_KEY` 告訴 proxy 要從哪個金鑰遷移，下一次啟動時就會以新的主金鑰重新加密儲存的值。您不需要正在執行的 proxy、本機開發覆寫，或呼叫 `POST /key/regenerate`。請和本頁所有輪替一樣，先備份資料庫。如果舊金鑰來自 `general_settings.master_key`，錯誤的第一步會要求您讓設定檔從環境變數讀取金鑰，如 [應將新金鑰放在哪裡](#where-to-set-the-new-key) 所示。

1. 將 `LITELLM_MIGRATE_FROM_MASTER_KEY` 設為舊金鑰，位置要與 `LITELLM_MASTER_KEY` 相同：shell export、您的容器或部署環境，或 `.env`。當舊金鑰為空時，請使用空值 `LITELLM_MIGRATE_FROM_MASTER_KEY=`。

   ```bash
   export LITELLM_MIGRATE_FROM_MASTER_KEY="$LITELLM_MASTER_KEY"
   ```

2. 產生新金鑰並將其設為 `LITELLM_MASTER_KEY`。當該變數已設定時，請以新金鑰取代目前的值。

   ```bash
   echo "sk-$(openssl rand -hex 32)"
   ```

  當尚未設定 `LITELLM_MASTER_KEY` 時，也就是舊金鑰是 `config.yaml` 中的純文字常值時，先將前一個值從其目前的密鑰來源載入到 shell 中。之後錯誤訊息會列出將這兩個值儲存到 `.env` 的指令。

   ```bash
   printf 'LITELLM_MIGRATE_FROM_MASTER_KEY=%s\n' "$LITELLM_MASTER_KEY" | tee -a .env
   printf 'LITELLM_MASTER_KEY=sk-%s\n' "$(openssl rand -hex 32)" | tee -a .env
   ```

3. 再次啟動 proxy。資料庫連線完成後、任何流量提供服務之前，proxy 會將所有可使用前一把金鑰解密的已儲存值重新加密。這會以 WARNING 記錄，因此這些行會出現在預設記錄層級下，且位於記錄的前幾行。

   ```text
   Re-encrypting 6 stored value(s) from the LITELLM_MIGRATE_FROM_MASTER_KEY key to the new master key.
   Done re-encrypting 6 stored value(s) with the new master key. You may now delete the LITELLM_MIGRATE_FROM_MASTER_KEY environment variable.
   ```

4. 刪除 `LITELLM_MIGRATE_FROM_MASTER_KEY`，然後依照 [輪替之後](#after-rotating) 的說明進行驗證。保留該變數也不會有害。每次啟動時都會記錄一則通知：「LITELLM_MIGRATE_FROM_MASTER_KEY 仍然有設定，但資料庫中已沒有任何項目需要從該金鑰遷移。您現在可以刪除 LITELLM_MIGRATE_FROM_MASTER_KEY。」

`LITELLM_MIGRATE_FROM_MASTER_KEY` 只會在搭配安全的主金鑰時生效。如果您在 `LITELLM_MASTER_KEY` 仍未設定、為空，或具有已知不安全值時設定它，proxy 會拒絕再次啟動。

如果在遷移執行期間有已儲存的值被編輯，該值會維持原狀，記錄會顯示：「已重新加密 N 個已儲存值，但其中 M 個仍以先前的金鑰加密，因為它們在遷移期間發生了變更。請保持設定 LITELLM_MIGRATE_FROM_MASTER_KEY，並重新啟動 proxy 以遷移它們。」請照做並再重新啟動一次。

遷移期間若發生資料庫錯誤，啟動會停止，因此 worker 絕不會在無法讀取已儲存值的情況下提供流量服務。proxy 會以 WARNING 記錄此事，然後以非零狀態碼結束：

```text
Could not migrate stored values from the LITELLM_MIGRATE_FROM_MASTER_KEY key (<ErrorType: message>). Values still encrypted with the previous key cannot be read until the migration succeeds. Keep LITELLM_MIGRATE_FROM_MASTER_KEY set and restart the proxy once the database is reachable.
```

修正資料庫問題，並使用相同的兩個變數再次啟動 proxy。下一次啟動會從上次失敗處繼續：如果它已遷移 6 個值中的 2 個，下一次啟動會記錄「正在重新加密 4 個已儲存值」接著記錄「完成」那一行。唯一的例外遵循 proxy 在啟動時對資料庫連線已採用的規則。當 `general_settings.allow_requests_on_db_unavailable` 為 true 且錯誤為連線中斷時，啟動會繼續，而仍以先前金鑰加密的值會維持無法讀取，直到之後某次啟動完成遷移為止。

在這些步驟期間不要加入 `LITELLM_SALT_KEY`。若已設定 salt key，proxy 會預期已儲存值是以 salt key 加密，因此會跳過遷移並記錄沒有任何內容需要遷移，而仍以舊金鑰加密的值會維持無法讀取。一旦遷移完成，請考慮改用專用的 salt key，如 [如果主金鑰就是您的加密金鑰](#if-the-master-key-is-your-encryption-key) 中的提示所描述，這樣之後的輪替就只是更換並重新啟動。

### 開機時遷移涵蓋的內容 {#boot-time-migration}

這個遷移適用於任何先前的主金鑰，不僅限於不安全的那些，因此它也可作為搭配 `new_master_key` 的 `POST /key/regenerate` 離線替代方案：設定新的 `LITELLM_MASTER_KEY`，將 `LITELLM_MIGRATE_FROM_MASTER_KEY` 設為舊值，然後重新啟動。它是冪等的，而且在多個 worker 或複本同時啟動時也安全，因為每一列只有在仍然保留讀取時的值時才會更新。即使設定了讀取複本，它也會透過主要資料庫進行讀寫。較舊 schema 中不存在的資料表或欄位會被略過，因此在 schema 升級前後都能運作。虛擬金鑰之所以能繼續運作，是因為它們是以雜湊方式儲存，而非加密。若未連接資料庫，proxy 會記錄沒有任何內容被遷移。

它會重新加密的內容比 regenerate 呼叫更多：儲存在資料庫中的模型（`litellm_params`）、認證資料、`LiteLLM_Config` 值（環境變數、CloudZero 和 Vantage 設定等）、SSO 設定、快取設定、設定覆寫、MCP 伺服器認證、靜態標頭與環境變數、MCP OAuth 用戶端認證、每位使用者的 MCP 認證與環境變數、SSO 身分斷言，以及 team、key 和 user metadata 中已加密的回呼變數，包括已刪除 team 與已刪除 key 的資料表。

### 要在哪裡設定新金鑰 {#where-to-set-the-new-key}

新金鑰必須以 `LITELLM_MASTER_KEY` 環境變數的形式傳給 proxy。只有在您從 repo 的 checkout 執行 proxy，或透過 Docker Compose `env_file` 載入該檔案時，才會讀取工作目錄中的 `.env` 檔案。若使用 pip install、單純的 `docker run`，或 Kubernetes，請直接將該變數傳給 process 或 container。

如果 `LITELLM_MASTER_KEY` 已經在某處設定，例如 shell export、container 或 deployment 環境，或 `.env` 中的一行，請直接在那裡替換值，不要在 `.env` 後面再新增一行。proxy 會載入 `.env`，但不會覆寫環境中已存在的變數，因此已 export 的值會優先於檔案中的值。

如果舊金鑰是以常值寫在 `general_settings.master_key` 下，請確保您的 `config.yaml` 是從環境讀取金鑰，因為設定檔中的常值會優先於環境變數。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

變更主金鑰會讓所有人從 Admin UI 登出，因為 UI session token 是用它簽署的。請使用新金鑰重新登入。
