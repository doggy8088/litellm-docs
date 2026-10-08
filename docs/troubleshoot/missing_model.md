# 在重新載入價格資料後模型消失 {#model-missing-after-reload-price-data}

一個剛加入 LiteLLM 定價對應表的模型沒有出現在 Admin UI 模型選擇器中，或計費追蹤記錄 `This model isn't mapped yet` 和記錄 `$0` 其支出，即使 **重新載入價格資料** 回報成功並顯示模型數量。這些報告幾乎每一個都是代理程式確實做了被要求的事：它取得了指向的檔案，而該檔案當時還沒有那筆項目。請在詢問任何與部署相關的內容之前，先回答步驟 1 的兩個問題；這只需要一分鐘，而且通常能立即釐清大多數報告。

## 步驟 1：該項目何時到達 `main`，以及代理程式目前對應的是哪個映射？ {#step-1-when-did-the-entry-reach-main-and-which-map-is-the-proxy-on}

代理程式從 `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json` 讀取定價：啟動時讀取一次、每次重新載入價格資料時讀取一次，以及依照可選的重新載入排程讀取一次。定價 PR 並不總是會直接合併到 `main`。開發是在 `litellm_internal_staging` 分支上進行，而 `main` 會分批接收，因此某個項目可能已經合併、被宣告為 day-0 定價，但距離代理程式實際取得的檔案仍可能差一天或更久。成功且帶有模型數量的重新載入只證明取得作業成功，其他都不能證明。

先確認該項目現在是否已在 `main`。測試模型加入時使用的每個鍵，因為提供者通常會有自己的前綴項目：

```bash
curl -s https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json \
  | jq '[has("{{gemini_flash}}"), has("gemini/{{gemini_flash}}")]'
```

檢查它何時到達，以及何時合併到上游：

```bash
git fetch origin main litellm_internal_staging
git log -S '"{{gemini_flash}}"' --first-parent --format='%h %ci %s' origin/main -- model_prices_and_context_window.json
git log -S '"{{gemini_flash}}"' --first-parent --format='%h %ci %s' origin/litellm_internal_staging -- model_prices_and_context_window.json
```

如果 `origin/main` 沒有輸出，表示該項目還沒到那裡，而且任何重新載入、重新啟動或部署設定變更都找不到它。否則第一行就是把它帶到 `main` 的合併，而其時間戳記是重新載入最早可能拾取到它的時間，再加上 raw.githubusercontent.com 提供快取副本時最多五分鐘的延遲。`main` 行與 staging 行之間的差距，就是客戶經歷到的延遲。

接著詢問代理程式它讀取的是什麼：

```bash
curl -s http://localhost:4000/model/cost_map/source \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
curl -s http://localhost:4000/schedule/model_cost_map_reload/status \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
curl -s -X POST http://localhost:4000/reload/model_cost_map \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

`GET /model/cost_map/source` 會回報 `url`，也就是代理程式取得的檔案（任何不是 `main` URL 的內容都表示已設定 `LITELLM_MODEL_COST_MAP_URL`，而 `main` 不相關），`source` 會回報 `remote` 或 `local`，當 `LITELLM_LOCAL_MODEL_COST_MAP=True` 將代理程式鎖定到隨版本捆綁的定價時，`is_env_forced` 會回報該定價；當失敗的取得作業使其回退到該捆綁副本時，`fallback_reason` 會回報；`model_count` 則是它目前提供的映射。

`GET /schedule/model_cost_map_reload/status` 會回報是否存在重新載入排程，以及其 `last_run` 和 `next_run`。在 `scheduled: false` 且自啟動以來沒有手動重新載入的情況下，映射就是啟動時取得的內容。

`POST /reload/model_cost_map` 會回傳 `models_count`，也就是剛取得之檔案中的項目數量（它可能大於檔案原始鍵數，因為代理程式會加入衍生的別名項目）。它會隨每次定價合併而變動，這使它成為代理程式載入的 `main` 修訂版的指紋：在 `main` 合併後進行的重新載入中，若數量沒有變動，表示代理程式看不到該 `main`。`502` 表示取得失敗且保留了先前的映射，因此帶有數量的成功回應可證明取得過程已通過。

也請記錄版本，`litellm_version` 來自 `GET /health/readiness/details`，因為捆綁定價是在建置時凍結，而較舊的版本缺少其中一些端點。

| 觀察 | 含義 |
|-------------|---------|
| 項目不在 `main` 上 | 部署上沒有需要除錯的內容。在合併落地之前，先使用步驟 3 的權宜作法 |
| 在最後一次重新載入之後才合併到 `main` | 重新載入執行得太早。再重新載入一次就能取得 |
| `url` 不是 `main` URL | 部署覆寫了映射。請檢查那個檔案，而不是 `main` |
| `source` 是 `local` | 代理程式回退到其捆綁副本。`fallback_reason` 說明原因 |
| 在 `main`、`remote` 上仍然缺少 | 繼續到步驟 2 |

## 步驟 2：`main` 已有該項目，代理程式讀取 `main`，而它仍然缺少 {#step-2-main-has-the-entry-the-proxy-reads-main-and-it-is-still-missing}

在做其他事情之前再重新載入一次：raw.githubusercontent.com 會快取該檔案約五分鐘，因此在合併之後、該時間窗內進行的重新載入仍會回傳舊檔案。

接著檢查每個副本是否一致。手動重新載入會在提供該請求的 pod 中執行；較新的版本會透過資料庫發布它，讓其他副本在下次輪詢時取得，但較舊的版本只會重新載入被命中的 pod，而且 Admin UI 可能由從未重新載入過的 pod 提供服務。透過負載平衡器呼叫 `GET /model/cost_map/source` 幾次：若 `model_count` 在不同值之間交替，表示各副本持有不同的映射，而滾動重新啟動可讓它們回到相同的檔案。

如果每個副本上的數量都一致，而且該項目在 `main` 上，則請求很可能並未解析到已加入的鍵。請將部署使用的確切模型名稱與提供者前綴，對照步驟 1 測試過的鍵；錯誤訊息 `This model isn't mapped yet. model=<name>, custom_llm_provider=<provider>` 會同時命名兩者。

## 步驟 3：直到 `main` 有該項目之前的權宜作法 {#step-3-workarounds-until-main-has-the-entry}

將代理程式指向已包含該項目的分支並重新啟動，因為該 URL 會在啟動時讀取。這會以該分支的副本替換整個定價映射，因此當 `main` 追上時，請移除覆寫：

```bash
export LITELLM_MODEL_COST_MAP_URL=https://raw.githubusercontent.com/BerriAI/litellm/litellm_internal_staging/model_prices_and_context_window.json
```

或者在 `model_info` 中使用 [自訂定價](../proxy/custom_pricing) 來讓部署擁有自己的定價。在目前版本中，部署層級的定價會在後續重新載入後保留，因此當模型必須在合併落地前正確計費時，這是較安全的選擇。

## 給維護者 {#for-maintainers}

回覆時請先提供步驟 1 中 `main` 的合併時間戳記，而不是 PR 合併日期。對這個檔案來說，已合併與可取得是不同的時刻，而被告知定價在 day 0 已發佈的客戶，讀到的是代理程式實際讀取的分支。接著把客戶傳來的重新載入數量，與重新載入 `main` 後的新鮮回傳數量並列：兩個不同的數量代表兩個不同的檔案，這樣就能在不問任何他們設定問題的情況下，結束「是不是我的部署有問題」這個問題。

目前此檔案沒有時間戳記或修訂版，因此項目數量是代理程式載入的是哪個 `main` 的唯一指紋。在映射回報自己的修訂版之前，步驟 1 的兩個指令就是檢查方式。

## 檢查清單 {#checklist}

1. 該項目現在是否在 `main` 上，以及使用了哪些鍵？
2. 它何時合併到 `main`，以及何時合併到 staging？
3. `GET /model/cost_map/source` 對 `url`、`source`、`fallback_reason` 和 `model_count` 回報了什麼？
4. 最後一次重新載入何時執行（`GET /schedule/model_cost_map_reload/status`，或客戶的手動重新載入），相對於 `main` 合併是什麼時間？
5. 來自新鮮重新載入的 `models_count` 是否與客戶回報的數量相符？
6. 代理程式目前使用哪個版本？
7. 當 `main` 追上時，客戶是否需要 staging URL 或部署層級定價？

## 另請參閱 {#see-also}

- [從 GitHub 同步模型定價](../proxy/sync_models_github)
- [自訂模型成本映射](../proxy/custom_model_cost_map)
- [每個部署的自訂定價](../proxy/custom_pricing)
- [除錯成本差異](./cost_discrepancy)
