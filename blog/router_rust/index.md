---
slug: router-rust
title: "以 Rust 進行路由"
date: 2026-11-11T17:00:00
authors:
  - nate
description: "自 v1.110.0 起，LiteLLM 的所有路由都流經 Rust 核心。以下說明我們為何重建路由器，以及差異測試如何讓我們在不產生迴歸的情況下完成遷移。"
image: ./router-swap-cover.gif
tags: [rust, rust-migration, routing, engineering]
hide_table_of_contents: false
---

import PlaygroundModal from '@site/src/components/RouterPlayground/PlaygroundModal';
import RouterSwapHero from './RouterSwapHero';
import {SwapDiagram, HubDiagram, PlanDiagram, ApiMapDiagram, DiffTestDiagram, LitefuzzDiagram, MutationDiagram, AgentPipelineDiagram} from './diagrams';

export const Hero = RouterSwapHero;

自今日的 v1.110.0 起，LiteLLM 的所有路由都流經 Rust 核心！先前實作它的 python 程式碼已被完全刪除，程式碼庫中只剩單一事實來源。這包括所有與重試、備援、名稱解析、部署選擇等相關的邏輯。在最終切換中刪除了超過 50k 行程式碼。

目前，LiteLLM 使用者不會立刻看到巨大的變化，但其價值將在 12 月我們實現極快的 messages 時顯現。此外，這次重構讓我們得以建立 <PlaygroundModal>路由器遊樂場</PlaygroundModal>，非常適合用來探索路由設定。

本文說明我們為何選擇對路由器動手，以及我們如何安全地遷移它而不造成迴歸。

{/* truncate */}

<SwapDiagram />

## 路由器 {#the-router}

我們正朝著在 12 月 1 日前讓 `/v1/messages` 呼叫（如 Claude code 所發出的呼叫）完全走 Rust 快速路徑的目標邁進。
路由位於_每個_請求的關鍵路徑上，也是 LiteLLM 本身價值主張的關鍵部分。
然而，重寫路由器並不容易。
它會接觸大量其他元件，進行 redis 存取、資料庫存取，呼叫每個推論端點，並同時被 SDK 使用者與 proxy 本身呼叫。

<HubDiagram />

### 我們如何改變它 {#how-we-changed-it}

由於它被 SDK 使用者呼叫，我們不能直接完整改寫為 Rust 並以破壞現有程式碼的方式變更 API。
然而，現有的路由器程式碼已經以相當難以駕馭的方式成長，經常新增幾乎與彼此做相同事情的方法。
值得先花時間重構它，同時維持向後相容性，然後才將核心遷移至 Rust。
我們可以讓新 API 暴露的介面更適合跨越序列化邊界傳遞。

<PlanDiagram />

例如，舊的路由器 API 有下列方法，它們的引數並不完全相同：

```python
def get_available_deployment(...): ...
def async_get_available_deployment(...): ... # not same arg order as above
def async_get_healthy_deployments(...): ... # called by above method internally
```

我們能將它精簡為一組方法，仍然暴露所有相同的行為，但對於何時引發副作用、暴露可變物件或變更設定變得更加明確有意。

### 新介面 {#the-new-interface}

路由器的新介面大致如下

```python
class Router:
  def registry(): Registry # answers which deployments exist
  def settings(): Settings # A snapshot of how the router is configured
  def health(): Health # Deployment health and cooldowns. Used to report outcomes
  def select(): Deployment | None # Select the deployment to use without using it
  def apply(ChangeSet): ApplyResult # Modify deployments or settings
  def register_plugin(Plugin): None # Register a custom routing strategy
```

新介面將功能區分為邏輯子集，其暴露的大部分資訊是不可變的。呼叫者必須非常明確地說明他們想修改什麼。這種介面形狀效率高得多，而且光是閱讀程式碼就能獲得更多資訊。如果有人透過 `router.registry().something` 存取路由器，不必再往下讀，您就能確認路由器在程式碼的其餘部分沒有被變更。

<ApiMapDiagram />

使用路由器的既有開源程式碼將記錄一則棄用警告，說明應該改用什麼，而既有的路由器介面將在本月底移除。

### 從其他重寫中學到的經驗 {#lessons-from-other-rewrites}

過去幾十年來，軟體領域出現過大量的重寫。有些成功，但許多並不成功。Joel Spolsky 關於為何從頭重寫是個壞主意的那篇[經典文章](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)抓住了任何重寫最大的失敗點：忘記原始程式碼已經學到的經驗。我們的路由器程式碼經過多年實戰考驗，我們不想失去已經擁有的正確性。那份正確性極具價值。

如果我們有 100% 完整的測試套件，完成這樣的重寫幾乎是輕而易舉的事。
只要把代理程式丟向問題，等到通過每個測試，就完成了！
然而，沒有任何測試套件是 100% 完整的，而路由器包含大量非常複雜且精細的邏輯。
其中有關於重試、萬用字元與別名、針對特定金鑰、團隊或區域的每請求覆寫等邊界案例。
我們的測試覆蓋率相當不錯，但我們想確保不會遺失重要的邊界案例。

## 差異測試 {#differential-testing}

差異測試能盡其所能地為我們解決這個問題。
差異測試的核心問題是「如果我讓黑箱 A 與黑箱 B 通過同一個案例，它們做的事相同嗎？」

### 什麼是差異測試？ {#what-is-differential-testing}

差異測試在進行大規模但保持行為不變的變更時最有用。「保持行為不變」的變更意味著您正在改變程式碼，或許也改變呼叫者與程式碼互動的方式，但您並不打算改變最終使用者的行為。這可能是為了暴露新介面、為特定目的切換到新函式庫、將您的 nosql 儲存換成關聯式資料庫，或許多其他事情。重要的是，您希望它的行為方式相同。

> 保持行為不變的變更對最終使用者是透明的。

換句話說，說您的變更是保持行為不變的，就等同於說「給定任何輸入，我希望我的舊實作與新實作做相同的事」。這是我們在執行差異測試時試圖驗證的核心陳述。我們不在乎「相同的事」是否*正確*，只在乎它在我們關心的所有方面都相同。

<DiffTestDiagram />

### 我們如何進行差異測試 {#how-we-do-differential-testing}

我們使用差異測試來測試這些巨大變更的每個面向。
我們將它用於最初的大型重構，也用於切換至 Rust。
差異測試的優點是您可以非常低成本地產生大量案例。
然而，它需要在許多案例之間共用一些設定與鷹架。

#### `litefuzz` {#litefuzz}

我們有一個名為 `litefuzz` 的私有儲存庫（以 Rust 撰寫），它驅動我們的差異測試。
它專門針對 litellm 儲存庫，並使用差異測試與覆蓋率引導突變的最新技術。

<LitefuzzDiagram />

在高層次上，它可分為下列元件：

- 世界是周圍的環境，具有在不同測試案例之間共用的設定。它可能是植入資料庫的資料列、一組部署或一個 config.yaml，或是 Redis 與 Postgres 執行個體。
- 案例是一組特定步驟，測試會將其驅動至受測物件。對於 http 層級的測試，它是用戶端送出的請求，以及上游提供者的回應方式。
- 通道是我們收集測試案例期間所發生事情資訊的方式。通道可能是伺服器送給用戶端的回應、事後存在 postgres 中的資料、Redis 中的狀態，或實際送至上游提供者的內容。通道會將其輸出正規化，以避免隨機雜訊造成虛假的差異。
- 預言機用來比較在不同實作上執行的案例是否以重要的方式產生了差異。

**世界**設定了**案例**執行的環境，**通道**的輸出則由**預言機**彼此評斷。

#### 模糊測試與覆蓋率引導突變 {#fuzz-testing-and-coverage-guided-mutation}

行與陳述式覆蓋率是衡量測試完整性的常見機制。
這很合理，您想看到測試案例涵蓋了多少邏輯（行數）。
我們使用完全相同的指標來引導應該保留哪些案例，也會修改我們現有的案例，使它們能觸及新的陳述式。

以 `litefuzz` 執行時，它會衡量每個測試案例捕捉了哪些行。它也有能力修改案例的參數，這稱為「模糊測試」。它可能將字串改為兩倍長、空白、表情符號，或中文。它也會對數字做類似的事情，讓它們變得非常大、非常小、負數等。除了這些邊界案例修改之外，案例也可以撰寫成以特定方式對一組特定欄位產生修改。

`litefuzz` 可以透過突變產生新案例，它只會在下列情況下保留突變後的案例：

- 新案例發現兩個受測實作之間的差異
- 新案例觸及先前未曾觸及的新程式碼行

<MutationDiagram />

#### 建立案例與測試套件 {#creating-cases-and-test-suites}

用一個詞來說，*代理程式*。我們在產生與驗證流程的所有階段都大量運用代理程式。

<AgentPipelineDiagram />

我們首先有試圖測試的變更集或功能。我們使用一系列代理程式，試圖捕捉該特定模組我們可能關心的行為集合，以及我們需要在 `litefuzz` 測試框架中具備哪些功能才能測試它。這些行為起初只是純文字描述，因為這樣我們能將意圖與程式碼分離。我們以回合方式運作，比較所有行為的集合，代理程式試圖尋找我們可能未涵蓋的缺口。一旦這部分穩定下來，我們就開始產生實際的案例。

對於所有相關行為，我們扇出代理程式為它們產生案例。我們有大量可短暫啟動的 worker 來執行這些案例，並檢查變更任一側的行覆蓋率。我們持續產生由行為驅動的案例，直到被要求尋找缺口的代理程式提出非常低意義的案例為止。對抗式代理程式也會檢查這些案例是否真的測試了相關行為。案例會在整個流程中執行，以查看它們何時捕捉到行為差異。

最後，我們進入最後一輪測試。在這一輪中，我們將行覆蓋率推向極限。我們想讓每一行被多次覆蓋。我們執行幾輪突變，然後派遣子代理程式嘗試組合能觸及特定程式碼行的案例。這些代理程式通常在程式碼中反向追蹤，以推理出程式碼要抵達該處必須為真的一系列條件。然後，我們執行那些案例，並更新行覆蓋率的狀態。

如果特定一行在多次嘗試後仍無法觸及，它會被標記為「困難」。協調者之後會檢視那些困難案例，並指出哪些應該由更靈活的測試框架處理，或該行是否實際上不可能被觸及。

## 接下來我們要往哪裡走 {#where-were-going-next}

從這裡開始，我們正依需要重新處理 callbacks、設定與認證路徑，以便在 12 月 1 日前讓 `/v1/messages` 快得驚人。請在 [GitHub 討論](https://github.com/BerriAI/litellm/discussions/48869)關注我們的進度，我們每週一都會在那裡發布更新！
