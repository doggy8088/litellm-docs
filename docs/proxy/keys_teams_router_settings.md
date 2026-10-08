import Image from '@theme/IdealImage';

# UI - 金鑰與團隊的路由設定 {#ui---router-settings-for-keys-and-teams}

在金鑰與團隊層級設定路由，以便對路由行為、備援、重試及其他路由設定進行細緻控制。這可讓您針對特定金鑰或團隊自訂路由行為，而不影響全域設定。

## 概觀 {#overview}

金鑰與團隊的路由設定可讓您在不同細緻度層級設定路由行為。先前，路由設定只能全域設定，將相同的路由策略、備援、逾時與重試政策套用到整個 proxy 執行個體中的所有請求。

有了金鑰層級與團隊層級的路由設定，您現在可以：

- **依金鑰或團隊自訂路由策略**（例如，對高優先權金鑰使用 `least-busy`，對其他金鑰使用 `latency-based-routing`）
- **為不同金鑰或團隊設定不同的備援鏈**
- **設定特定金鑰或特定團隊的逾時**與重試政策
- **套用不同的可靠性設定**（冷卻時間、允許失敗次數）於各金鑰或團隊
- **在需要時覆寫全域設定**，以符合特定使用情境

<Image img={require('../../img/ui_granular_router_settings.png')} />

## 摘要 {#summary}

路由設定遵循**階層式解析順序**：**金鑰 > 團隊 > 全域**。當發出請求時：

1. **先檢查金鑰層級設定**。如果正在使用的 API 金鑰已設定路由，則會套用那些設定。
2. **接著檢查團隊層級設定**。如果該金鑰屬於某個團隊，且該團隊已設定路由，則會使用那些設定（除非存在金鑰層級設定）。
3. **最後使用全域設定作為備援**。如果找不到金鑰或團隊設定，則會套用 proxy 設定中的全域路由設定。

這種階層式方法可確保最具體的設定優先套用，讓您能在全域層級維持合理預設值的同時，為個別金鑰或團隊微調路由行為。

## 路由設定的解析方式 {#how-router-settings-resolution-works}

路由設定會依下列優先順序解析：

### 解析順序：金鑰 > 團隊 > 全域 {#resolution-order-key--team--global}

1. **金鑰層級路由設定**（最高優先權）
   - 當路由設定直接配置在 API 金鑰上時套用
   - 優先於所有其他設定
   - 適合個別金鑰自訂

2. **團隊層級路由設定**（中等優先權）
   - 當 API 金鑰屬於某個已配置路由設定的團隊時套用
   - 只有在不存在金鑰層級設定時才會使用
   - 適合在團隊中的多個金鑰間套用一致設定

3. **全域路由設定**（最低優先權）
   - 來自您的 proxy 設定檔或資料庫
   - 當找不到金鑰或團隊設定時，作為預設值使用
   - 先前，這是唯一可用的選項

## 如何設定路由設定 {#how-to-configure-router-settings}

### 為金鑰設定路由設定 {#configuring-router-settings-for-keys}

依照以下步驟為 API 金鑰設定路由設定：

1. 前往 [http://localhost:4000/ui/?login=success](http://localhost:4000/ui/?login=success)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/61889da3-32de-4ebf-9cf3-7dc1db2fc993/ascreenshot_2492cf6d916a4ab98197cc8336e3a371_text_export.jpeg)

2. 點選「+ Create New Key」（或編輯既有金鑰）

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/61889da3-32de-4ebf-9cf3-7dc1db2fc993/ascreenshot_5a25380cf5044b4f93c146139d84403a_text_export.jpeg)

3. 點選「Optional Settings」

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/e5eb5858-1cc1-4273-90bd-19ad139feebd/ascreenshot_33888989cfb9445bb83660f702ba32e0_text_export.jpeg)

4. 點選「Router Settings」

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/d9eeca83-1f76-4fcf-bf61-d89edf3454d3/ascreenshot_825c7993f4b24949aee9b31d4a788d8a_text_export.jpeg)

5. 設定您想要的路由設定。例如，點選「Fallbacks」以設定備援模型：

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/30ff647f-0254-4410-8311-660eef7ec0c4/ascreenshot_16966c8a0160473eb03e0f2c3b5c3afa_text_export.jpeg)

6. 點選「Select a model to begin configuring fallbacks」並設定您的備援鏈：

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/918f1b5b-c656-4864-98bd-d8c58924b6d9/ascreenshot_79ca6cd93be04033929f080e0c8d040a_text_export.jpeg)

### 為團隊設定路由設定 {#configuring-router-settings-for-teams}

依照以下步驟為團隊設定路由設定：

1. 前往 [http://localhost:4000/ui/?login=success](http://localhost:4000/ui/?login=success)

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/60a33a8c-2e48-4788-a1a2-e5bcffa98cca/ascreenshot_9e255ba48f914c72ae57db7d3c1c7cd5_text_export.jpeg)

2. 點選「Teams」

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/60a33a8c-2e48-4788-a1a2-e5bcffa98cca/ascreenshot_070934fa9c17453987f21f58117e673b_text_export.jpeg)

3. 點選「+ Create New Team」（或編輯既有團隊）

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/6f964ce2-f458-4719-a070-1af444ad92f5/ascreenshot_10f427f3106a4032a65d1046668880bd_text_export.jpeg)

4. 點選「Router Settings」

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/a923c4ae-29f2-42b5-93ae-12f62d442691/ascreenshot_144520f2dd2f419dad79dffb1579ec04_text_export.jpeg)

5. 設定您想要的路由設定。例如，點選「Fallbacks」以設定備援模型：

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/b062ecfa-bf5b-4c99-93a1-84b8b56fdb4c/ascreenshot_ea9acbc4e75448709b64a22addfb4157_text_export.jpeg)

6. 點選「Select a model to begin configuring fallbacks」並設定您的備援鏈：

![](https://colony-recorder.s3.amazonaws.com/files/2026-01-24/67ca2655-4e82-4f93-be9a-7244ad22640f/ascreenshot_4fdbed826cd546d784e8738626be835d_text_export.jpeg)

## 使用情境 {#use-cases}

### 每個金鑰使用不同的路由策略 {#different-routing-strategies-per-key}

針對不同使用情境設定不同的路由策略：

- **高優先權正式環境金鑰**：使用 `latency-based-routing` 以獲得最佳效能
- **開發金鑰**：使用 `simple-shuffle` 以求簡單
- **成本敏感金鑰**：使用 `cost-based-routing` 以將支出降到最低

### 團隊層級一致性 {#team-level-consistency}

在團隊內的所有金鑰套用一致的路由設定：

- 為整個團隊設定備援鏈，以提升可靠性
- 設定團隊專屬的逾時政策
- 在團隊成員間套用一致的重試政策

### 覆寫全域設定 {#override-global-settings}

針對特定情境覆寫全域設定：

- 正式環境金鑰可能需要比開發環境更嚴格的逾時政策
- 某些團隊可能需要不同的備援模型
- 個別金鑰可能需要針對特定使用情境自訂重試政策

### 漸進式推出 {#gradual-rollout}

在全域套用之前，先在特定金鑰或團隊上測試新的路由設定：

- 先在測試金鑰上設定新的路由策略
- 先在小型團隊上驗證備援鏈，再進行全域推出
- 在不同金鑰之間對不同的逾時值進行 A/B 測試

## 相關功能 {#related-features}

- [路由設定參考](./config_settings.md#router_settings---reference) - 所有路由設定的完整參考
- [負載平衡](./load_balancing.md) - 瞭解路由策略與負載平衡
- [可靠性](./reliability.md) - 設定備援、重試與錯誤處理
- [金鑰](./virtual_keys.md) - 管理 API 金鑰及其設定
- [團隊](./multi_tenant_architecture.md) - 將金鑰組織成團隊
