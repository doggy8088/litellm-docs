---
title: Auto Router 功能歷史
sidebar_label: Auto Router 功能歷史
description: 哪些 Auto Router 功能在哪個 LiteLLM 版本推出，讓您在升級時知道可以預期什麼。
---

每個版本都會連結到其 GitHub 發佈與完整版本資訊。依最新到最舊排序。某版本下列出的功能，代表自該版本起即可使用。

## v1.104.0 {#v11040}

[GitHub 發佈](https://github.com/BerriAI/litellm/releases/tag/v1.104.0), [版本資訊](/release_notes/v1.104.0/v1-104-0)

:::danger 破壞性變更

**原生 context compacting 預設為啟用。** 對於支援且具有完整對話歷史的請求，會將較早的輪次摘要至所選模型的輸入上限附近，讓它能繼續處理請求。這適用於 Chat Completions、Responses 與 Messages，且需要可用的原生 compactor，並會額外產生一筆獨立計費的呼叫。設定 `context_compaction: false` 可將其停用。已儲存或不透明的原生歷史仍由用戶端管理。 [#42074](https://github.com/BerriAI/litellm/pull/42074)

**Context-window 升級改為預設不啟用。** 若省略 `enable_context_window_escalation`，長請求將不再自動移至更大的等級。將其設為 `true` 可保留自動升級。 [#41872](https://github.com/BerriAI/litellm/pull/41872)

:::

- **可設定的 Heuristic v2 閾值。** 在設定或儀表板中設定 `heuristic_v2_success_threshold`，以控制分級選擇的最低預測成功率。清除此設定可還原為已訓練產物的預設值。 [#42252](https://github.com/BerriAI/litellm/pull/42252)
- **JEV 儀表板設定與連線檢查。** 在 LLM 分類器旁設定 JEV，透過編輯保留其設定，並可獨立於 tier models 測試分類器。付費路由預覽會強制執行虛擬金鑰預算；加密委派任務會使用已設定的備援，且不會產生 JEV 費用。 [#41886](https://github.com/BerriAI/litellm/pull/41886), [#41879](https://github.com/BerriAI/litellm/pull/41879)
- **Capability 與 Fuse 預測細節。** 請求記錄會顯示 Capability 的解題機率與閾值，或兩個 Fuse 求解器的機率與品質差距。當健康狀態或模態規則變更最終放置時，預測仍會保持可見。 [#42057](https://github.com/BerriAI/litellm/pull/42057)
- **儀表板中的更多進階設定。** 編輯 heuristic 關鍵字覆寫、housekeeping routing、提醒標記、plan-mode sentinels、輸出 token 上限，以及自訂分類器逾時。儲存無關變更時會保留這些設定。 [#42293](https://github.com/BerriAI/litellm/pull/42293)
- **內部使用者的節省與用量。** 管理員可檢視內部使用者的 Savings 與 Auto-router 用量分頁，包括透過 JWT 歸屬的流量。其他使用者可檢視自己的 Savings；router 用量仍僅限管理員。 [#42026](https://github.com/BerriAI/litellm/pull/42026)
- **跨移動 breakpoint 的 prompt-cache affinity。** 啟用 `prompt_caching` 前置呼叫檢查時，deployment affinity 會在 Claude Code 將其 cache breakpoint 移到較新的輪次時延續，協助保留提供者的快取前綴。 [#42080](https://github.com/BerriAI/litellm/pull/42080)

## v1.103.0 {#v11030}

[GitHub 發佈](https://github.com/BerriAI/litellm/releases/tag/v1.103.0), [版本資訊](/release_notes/v1.103.0/v1-103-0)

- **Capability 分類。** `classifier_type: capability` 會預測高效率求解器是否能完成整個任務，並在估計值低於設定閾值時路由至有能力的等級。 [#41270](https://github.com/BerriAI/litellm/pull/41270)
- **Fuse v2 分類（實驗性）。** `classifier_type: llm_v2` 使用一次 judge 呼叫來同時預測兩個求解器，接著根據品質差距政策在兩者之間選擇。無效的預測與提供者錯誤會備援到有能力的求解器。 [#41272](https://github.com/BerriAI/litellm/pull/41272)
- **Capability 與 Fuse 儀表板設定。** 在專用分頁中設定高效率、有能力與 judge 模型，並提供預測政策控制與進階路由選項。儲存任一表單都會停用自適應 routing、context-window 升級與升級關鍵字。 [#41315](https://github.com/BerriAI/litellm/pull/41315), [#41371](https://github.com/BerriAI/litellm/pull/41371)
- **Fuse 模型與 harness 預設。** 在 YAML、API 或儀表板中選擇維護中的求解器與 harness 描述，預覽其文字，或以自訂描述取代。 [#41617](https://github.com/BerriAI/litellm/pull/41617)
- **TypeSafe JEV 分類器。** `classifier_type: jev` 使用 JEV 選擇複雜度等級，並記錄其機率、信心值與分類器成本。失敗時會使用既有的分類器備援與 circuit breaker。 [#41615](https://github.com/BerriAI/litellm/pull/41615)
- **每個模型的 Fast 模式。** 在支援的 tier models 中，於推理 effort 旁切換 Fast，且可針對每個模型獨立設定。 [#41282](https://github.com/BerriAI/litellm/pull/41282)
- **各 tier 內的模型 affinity。** 啟用 deployment affinity 後，工作階段在返回某個 tier 時，會重用其選定的可用模型。Redis 會在 workers 之間共享這些選擇，而 tier 重新分類仍維持啟用。 [#41174](https://github.com/BerriAI/litellm/pull/41174)
- **團隊成員的 router 管理。** 管理員可為團隊啟用 `/auto_router/manage`，讓成員能建立 routers 並編輯自己的設定，且使用他們有權存取的模型。 [#41175](https://github.com/BerriAI/litellm/pull/41175)
- **更精準的節省估算。** 基準成本會使用持久化的 cache-prefix 歷史與到期時間，在 routing 分歧前保留觀測到的成本，並將不可用的估算標示為未知。也納入 Anthropic Fast 模式與地理價格調整。 [#41177](https://github.com/BerriAI/litellm/pull/41177), [#41341](https://github.com/BerriAI/litellm/pull/41341)
- **Heuristic v2 分數可見性。** 即使停用訊息記錄，routing 詳細資訊仍會顯示預估成功率、閾值與預測等級。當 routing 覆寫後，預測仍會與最終等級分開保留。 [#42001](https://github.com/BerriAI/litellm/pull/42001)
- **編碼代理程式的工作階段回饋。** LLM API 金鑰可讀取自己的 router 工作階段統計資料。Claude Code 會顯示記錄的實際服務模型，而 Claude Code 與 Codex 都會以 router 名稱標示實際支出。 [#41116](https://github.com/BerriAI/litellm/pull/41116), [#41186](https://github.com/BerriAI/litellm/pull/41186)
- **CLI 指令名稱。** 使用 `lite autoroute start` 與 `lite autoroute stop`；`up` 與 `down` 仍為已棄用的別名。 [#41672](https://github.com/BerriAI/litellm/pull/41672)
- **Capability 與 Fuse 授權限制。** 在沒有 `auto_router` 權限下，可使用一個 Capability router 與一個 Fuse v2 router。任一類型的額外 routers 都需要該權限。 [#41326](https://github.com/BerriAI/litellm/pull/41326)

## v1.102.0 {#v11020}

[GitHub 發佈](https://github.com/BerriAI/litellm/releases/tag/v1.102.0), [版本資訊](/release_notes/v1.102.0/v1-102-0)

- **支援 harness 的分類。** 分類時省略 Claude Code 系統文字，並移除 Codex reminder envelopes，同時保留委派任務與原始路由請求。 [#40655](https://github.com/BerriAI/litellm/pull/40655), [#40599](https://github.com/BerriAI/litellm/pull/40599)
- **加密委派任務。** 在原生 OpenAI 或 Azure OpenAI Responses 分類器呼叫中保留加密的任務區塊。不支援的部署與解密錯誤會遵循 `classifier_fallback`。 [#40608](https://github.com/BerriAI/litellm/pull/40608)
- **分類器輸入記錄。** 在 Classify 列中可分別檢視綁定提供者的分類器輸入、已遮罩的原始請求與分類器回應。 [#40604](https://github.com/BerriAI/litellm/pull/40604)
- **Heuristic v1 調校。** 單一調校後的 router 不必仰賴 `auto_router` 授權功能即可維持可編輯。 [#39952](https://github.com/BerriAI/litellm/pull/39952)
- **更快速的 semantic 冷啟動。** 在事件迴圈外一次建立第一個路由層。 [#39954](https://github.com/BerriAI/litellm/pull/39954)
- **自適應 router 修正。** 從 `model_info` 讀取模型定價，並在重新啟動之間保留 bandit priors。 [#39957](https://github.com/BerriAI/litellm/pull/39957), [#39955](https://github.com/BerriAI/litellm/pull/39955)
- **跨提供者工具歷史。** `/v1/messages` 可在 OpenAI 與 Anthropic tiers 之間重播 `tool_use` 區塊。 [#39967](https://github.com/BerriAI/litellm/pull/39967)

此版本另包含：宣告式自訂 heuristic 維度與儀表板權重編輯 [#40156](https://github.com/BerriAI/litellm/pull/40156), [#40205](https://github.com/BerriAI/litellm/pull/40205)；可選的 `NON_REASONING` tier [#40273](https://github.com/BerriAI/litellm/pull/40273)；tier-model 輸出限制 [#40209](https://github.com/BerriAI/litellm/pull/40209)；當某個 tier 無法服務請求時的健康預設備援 [#40757](https://github.com/BerriAI/litellm/pull/40757)；Claude Code 與 Codex 中的路由模型與工作階段節省 [#40330](https://github.com/BerriAI/litellm/pull/40330)；以及回應標頭中的 tier、原因、分數與推理 effort [#40792](https://github.com/BerriAI/litellm/pull/40792)。

[支援 harness 的 routing 更新](/blog/auto-router-harness-aware-classification)

## v1.101.0 {#v11010}

[GitHub 發佈](https://github.com/BerriAI/litellm/releases/tag/v1.101.0), [版本資訊](/release_notes/v1.101.0/v1-101-0)

- **啟發式分類器。** `heuristic_v2` 會在本地路由；`hybrid` 會在接近層級邊界時呼叫 LLM。 [#39276](https://github.com/BerriAI/litellm/pull/39276), [#39403](https://github.com/BerriAI/litellm/pull/39403)。 [貼文](/blog/heuristic-v2)
- **上下文與使用者回合路由。** 在設定下，將過大的提示詞符合至某一層級，並且只對新的使用者回合進行分類。 [#38844](https://github.com/BerriAI/litellm/pull/38844), [#38861](https://github.com/BerriAI/litellm/pull/38861), UI [#39042](https://github.com/BerriAI/litellm/pull/39042), [#39054](https://github.com/BerriAI/litellm/pull/39054)
- **圖片路由。** 將圖片傳送到支援視覺的層級，並可選擇讓分類器讀取它們。 [#39032](https://github.com/BerriAI/litellm/pull/39032), [#39454](https://github.com/BerriAI/litellm/pull/39454), [#39825](https://github.com/BerriAI/litellm/pull/39825), UI [#39059](https://github.com/BerriAI/litellm/pull/39059), [#39840](https://github.com/BerriAI/litellm/pull/39840)
- **停滯升級。** 當代理程式重複工具呼叫或發生錯誤時，將請求提升一個層級。 [#39809](https://github.com/BerriAI/litellm/pull/39809)。 [貼文](/blog/auto-router-stall-escalation)
- **分類器控制。** 設定分類器推理努力、總逾時，以及針對重複逾時的斷路器。 [#39372](https://github.com/BerriAI/litellm/pull/39372), [#39696](https://github.com/BerriAI/litellm/pull/39696), [#39701](https://github.com/BerriAI/litellm/pull/39701)
- **層級故障轉移與壓縮。** 當某一層級冷卻時使用存活的同級節點，並為每次路由或模型跳轉選擇壓縮。 [#39675](https://github.com/BerriAI/litellm/pull/39675), [#39823](https://github.com/BerriAI/litellm/pull/39823)。 [貼文](/blog/auto-router-per-hop-compression)
- **影子評估目標設定。** 以團隊、使用者和模型群組為目標，比較最多四個路由器，並評估工具呼叫回合。 [#39015](https://github.com/BerriAI/litellm/pull/39015), [#39028](https://github.com/BerriAI/litellm/pull/39028), [#39817](https://github.com/BerriAI/litellm/pull/39817), [#39818](https://github.com/BerriAI/litellm/pull/39818), [#39828](https://github.com/BerriAI/litellm/pull/39828)
- **設定與提示詞編輯。** 從現有模型設定所有層級，依區段編輯內建提示詞，並在 UI 中設定工作階段親和性 TTL。 [#39679](https://github.com/BerriAI/litellm/pull/39679), [#39688](https://github.com/BerriAI/litellm/pull/39688), [#39693](https://github.com/BerriAI/litellm/pull/39693)
- **預設組。** 新增 1M Context 預設組、更新 OpenAI Family，並在執行階段提供目錄。 [#39412](https://github.com/BerriAI/litellm/pull/39412), [#39490](https://github.com/BerriAI/litellm/pull/39490), [#39396](https://github.com/BerriAI/litellm/pull/39396), [#39797](https://github.com/BerriAI/litellm/pull/39797)
- **Claude Code 支援。** 將 subagents 經由所選路由器路由，在 `/v1/models` 中公開其模式，並將路由嵌入計費給呼叫端。 [#39239](https://github.com/BerriAI/litellm/pull/39239), [#39619](https://github.com/BerriAI/litellm/pull/39619), [#39532](https://github.com/BerriAI/litellm/pull/39532)
- **重大變更。** `auto_router` 授權功能會計量自訂化，而影子評估結果會重新命名鍵欄位。 [#39468](https://github.com/BerriAI/litellm/pull/39468), [#39674](https://github.com/BerriAI/litellm/pull/39674), [#39015](https://github.com/BerriAI/litellm/pull/39015)

貼文：[@Route on Context Size and Modality](/blog/auto-router-more-routing-configurations), [Mid-Task Stall Escalation](/blog/auto-router-stall-escalation), [Per-Hop Compression](/blog/auto-router-per-hop-compression)。

## v1.100.0 {#v11000}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.100.0), [Release notes](/release_notes/v1.100.0/v1-100-0)

- **自訂層級集合。** 為 LLM 分類器定義您自己的層級，預覽精確的分類器提示詞，關鍵字規則會跟隨重新命名。 [#38602](https://github.com/BerriAI/litellm/pull/38602), [#38603](https://github.com/BerriAI/litellm/pull/38603), [#38605](https://github.com/BerriAI/litellm/pull/38605)。
- **先啟發式串接。** `classifier_type: heuristic_first` 會在本地評分，僅在需要時才呼叫 LLM 分類器。 [#38428](https://github.com/BerriAI/litellm/pull/38428)。
- **分類器上下文預算。** 跨回合的字元預算取代每回合 200 字元裁切。 [#38141](https://github.com/BerriAI/litellm/pull/38141), [#38145](https://github.com/BerriAI/litellm/pull/38145)。
- **整理提示詞略過分類器。** 用戶端整理訊息會送到最便宜的層級，不會呼叫分類器。 [#38598](https://github.com/BerriAI/litellm/pull/38598)。
- **Gemini Family 預設組；Lite 和 Anthropic 預設組中的每層推理努力。** [#38138](https://github.com/BerriAI/litellm/pull/38138), [#38482](https://github.com/BerriAI/litellm/pull/38482), [#38490](https://github.com/BerriAI/litellm/pull/38490)。
- **儲存前的乾跑驗證。** UI 會根據 `/auto_router/validate_complexity_router_config` 驗證設定；`/auto_router/test_routing` 接受實際請求主體。 [#38595](https://github.com/BerriAI/litellm/pull/38595)。
- **固定層級的推理努力優先。** 某一層級的 `reasoning_effort` 會覆蓋用戶端攜帶的值；不支援的層級參數會被捨棄，而不是讓該層級失敗。 [#38622](https://github.com/BerriAI/litellm/pull/38622), [#38698](https://github.com/BerriAI/litellm/pull/38698)。
- **已計入分類器成本。** 節省數字、基準測試與影子評估都會扣除路由器自身的分類器費用。 [#38835](https://github.com/BerriAI/litellm/pull/38835), [#38631](https://github.com/BerriAI/litellm/pull/38631)。
- **來自其模型的路由器健康狀態。** 當某一層級、預設或分類器模型無法提供服務時，路由器會被標記。 [#37966](https://github.com/BerriAI/litellm/pull/37966), [#38174](https://github.com/BerriAI/litellm/pull/38174)。
- **`model_group_alias` 可用於 auto-routers。** [#38272](https://github.com/BerriAI/litellm/pull/38272), [#38382](https://github.com/BerriAI/litellm/pull/38382)。
- **重大變更。** 放在 `complexity_router_config` 之外的設定會被拒絕 ([#38570](https://github.com/BerriAI/litellm/pull/38570))。`router_model_name` 已移除，請改用 `return_raw_model_name` ([#38429](https://github.com/BerriAI/litellm/pull/38429))。`autorouter_savings_baseline_model` 已刪除；每個路由器都會從其最困難的層級推導出基準值 ([#38700](https://github.com/BerriAI/litellm/pull/38700))。

## v1.99.0 {#v1990}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.99.0), [Release notes](/release_notes/v1.99.0/v1-99-0)

- **供營運人員定義的層級集合**，用於 LLM 分類器。 [#37226](https://github.com/BerriAI/litellm/pull/37226)。
- **自訂分類器外掛程式。** `classifier_type: custom` 搭配指向您自有 `classify()` 的 dotted path。 [#37249](https://github.com/BerriAI/litellm/pull/37249)。
- **Plan 模式層級下限**，適用於編碼代理程式用戶端。 [#37230](https://github.com/BerriAI/litellm/pull/37230)。
- **每層 `litellm_params`** 與層級編輯器中的每模型推理努力。 [#37064](https://github.com/BerriAI/litellm/pull/37064), [#37673](https://github.com/BerriAI/litellm/pull/37673)。
- **商務分類評分標準** 預設組。 [#37534](https://github.com/BerriAI/litellm/pull/37534)。
- **Lite 預設組**（混合提供者）以及 UI 中的啟發式評分器設定。 [#37068](https://github.com/BerriAI/litellm/pull/37068), [#37216](https://github.com/BerriAI/litellm/pull/37216)。
- **影子評估：每個工作多個金鑰，預算以美元計。** `api_key_ids` 取代 `api_key_id`，`max_budget` 取代 `max_turns`（重大變更）。 [#37251](https://github.com/BerriAI/litellm/pull/37251), [#37555](https://github.com/BerriAI/litellm/pull/37555)。
- **Responses API** 輸入經由 auto-router 路由。 [#37333](https://github.com/BerriAI/litellm/pull/37333)。
- **節省資訊到回呼與每個金鑰。** 每次請求的節省會傳送到記錄回呼；金鑰頁面上有 Savings 分頁。 [#37894](https://github.com/BerriAI/litellm/pull/37894), [#37693](https://github.com/BerriAI/litellm/pull/37693)。

## v1.98.0 {#v1980}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.98.0), [Release notes](/release_notes/v1.98.0/v1-98-0)

- **影子評估。** 取樣某個金鑰的即時流量，將其透過路由器重放而不提供回應，盲測 LLM 評審、反向模式、`/v1/messages` 與 `/v1/responses`。 [#36587](https://github.com/BerriAI/litellm/pull/36587), [#36830](https://github.com/BerriAI/litellm/pull/36830), [#36865](https://github.com/BerriAI/litellm/pull/36865)。 UI [#36588](https://github.com/BerriAI/litellm/pull/36588), [#36994](https://github.com/BerriAI/litellm/pull/36994)。 [貼文](/blog/auto-router-shadow-evaluations)。
- **已校準的分類器評分標準**，附有已完成範例，可按路由器選擇；系統提示詞文字不再計分。 [#36578](https://github.com/BerriAI/litellm/pull/36578), [#36721](https://github.com/BerriAI/litellm/pull/36721)。
- **部署親和性切換** 位於 UI 中；基準圖表中各層級下方會顯示模型。 [#36302](https://github.com/BerriAI/litellm/pull/36302), [#36291](https://github.com/BerriAI/litellm/pull/36291)。
- **標籤路由閘門。** 必要 AND 標籤前綴、`allow_fail_open`，未加標籤的請求會繞過帶有標籤的預路由策略。 [#36193](https://github.com/BerriAI/litellm/pull/36193), [#36627](https://github.com/BerriAI/litellm/pull/36627), [#36628](https://github.com/BerriAI/litellm/pull/36628)。

## v1.97.0 {#v1970}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.97.0), [Release notes](/release_notes/v1.97.0/v1-97-0)

- **預設啟用部署親和性**（breaking）。當工作階段返回某個模型群組時，會落到先前使用過的部署，因此提供者快取會保持溫熱。`deployment_affinity: false` 會還原舊行為。[#36146](https://github.com/BerriAI/litellm/pull/36146)。
- **預設關閉工作階段親和性**，並在 UI 中提供。[#35714](https://github.com/BerriAI/litellm/pull/35714)。
- **節省與使用量分頁。** 成本最佳化上的淨 auto-router 節省、從最難層級推導出的基準、每個工作階段彙總、每個層級的輪次。[#35522](https://github.com/BerriAI/litellm/pull/35522)、[#35995](https://github.com/BerriAI/litellm/pull/35995)、[#35521](https://github.com/BerriAI/litellm/pull/35521)、[#35907](https://github.com/BerriAI/litellm/pull/35907)、[#35910](https://github.com/BerriAI/litellm/pull/35910)、[#36209](https://github.com/BerriAI/litellm/pull/36209)。[Post](/blog/auto-router-spend-visibility)。
- **每次請求的分類器成本**，位於 `routing_decision` 和 `x-litellm-classifier-cost` 標頭中。[#36015](https://github.com/BerriAI/litellm/pull/36015)。
- **一鍵預設與測試路由。** 新增 Auto Router 時為名稱加上範本；測試路由會在儲存前顯示選擇結果；預設會依底層模型 ID 配對部署。[#35746](https://github.com/BerriAI/litellm/pull/35746)、[#35859](https://github.com/BerriAI/litellm/pull/35859)、[#35972](https://github.com/BerriAI/litellm/pull/35972)、[#36111](https://github.com/BerriAI/litellm/pull/36111)。[Post](/blog/auto-router-setup-and-testing)。
- **可替換的分類器提示詞與層級名稱。** [#35855](https://github.com/BerriAI/litellm/pull/35855)、[#35893](https://github.com/BerriAI/litellm/pull/35893)。

## v1.96.0 {#v1960}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.96.0)、[Release notes](/release_notes/v1.96.0/v1-96-0)

- **分類器內容視窗。** LLM 分類器會查看先前回合（`classifier_context_window_size`，預設 3）。[#35185](https://github.com/BerriAI/litellm/pull/35185)。[Post](/blog/auto-router-context-and-benchmarks)。
- **助理回合** 可選擇納入（`classifier_context_include_assistant_turns`）。[#35471](https://github.com/BerriAI/litellm/pull/35471)。
- **已記錄路由決策。** 在支出記錄與記錄抽屜中記錄層級、原因與分類器請求本文；路由器本身的分類器呼叫會被標記。[#35016](https://github.com/BerriAI/litellm/pull/35016)、[#35164](https://github.com/BerriAI/litellm/pull/35164)、[#35300](https://github.com/BerriAI/litellm/pull/35300)、[#35304](https://github.com/BerriAI/litellm/pull/35304)。
- **Auto-routers 擁有自己的分頁**，位於 Models + Endpoints 中，並包含內容視窗欄位。[#35009](https://github.com/BerriAI/litellm/pull/35009)、[#35315](https://github.com/BerriAI/litellm/pull/35315)、[#35500](https://github.com/BerriAI/litellm/pull/35500)。

## v1.95.0 {#v1950}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.95.0)、[Release notes](/release_notes/v1.95.0/v1-95-0)

- **`return_raw_model_name`。** 將選取的模型放入回應本文 `model` 欄位，而不是別名。[#33875](https://github.com/BerriAI/litellm/pull/33875)。
- **記錄會顯示路由器。** 記錄抽屜與工作階段側邊欄會標記由 auto-router 提供的請求。[#34434](https://github.com/BerriAI/litellm/pull/34434)。

## v1.94.0 {#v1940}

[GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.94.0)、[Release notes](/release_notes/v1.94.0/v1-94-0)

- **Auto Router v2。** 將複雜度、語意與自適應路由整合於單一 `auto_router/complexity_router` 中。[Post](/blog/autorouter-v2)。
- **路由器外掛程式。** `Router(plugins=[...])`，可從 proxy 設定解析。[#32972](https://github.com/BerriAI/litellm/pull/32972)、[#33251](https://github.com/BerriAI/litellm/pull/33251)、[#33644](https://github.com/BerriAI/litellm/pull/33644)。[Post](/blog/router-plugins-on-the-proxy)。
- **層級池。** 軟下限自適應模式與隨機挑選多模型層級。[#32947](https://github.com/BerriAI/litellm/pull/32947)、[#32967](https://github.com/BerriAI/litellm/pull/32967)。
- **工作階段親和性。** 將工作階段固定到其第一回合模型。[#33126](https://github.com/BerriAI/litellm/pull/33126)、[#33500](https://github.com/BerriAI/litellm/pull/33500)、[#33723](https://github.com/BerriAI/litellm/pull/33723)。
- **升級關鍵字** 與每個層級的語意關鍵字提示詞。[#33656](https://github.com/BerriAI/litellm/pull/33656)、[#33508](https://github.com/BerriAI/litellm/pull/33508)。
- **Cost Optimization 頁面（beta）**，含 Autorouter 分頁。[#33899](https://github.com/BerriAI/litellm/pull/33899)。
- **測試連線** 用於 auto router。[#32950](https://github.com/BerriAI/litellm/pull/32950)、[#33146](https://github.com/BerriAI/litellm/pull/33146)。
