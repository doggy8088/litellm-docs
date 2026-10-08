---
slug: internal-devin-two-days
title: "我們如何在 2 天內打造自己的內部 Devin"
date: 2026-10-03
authors:
  - tin
description: "我們如何運用 Render、Modal、Hermes、Temporal 和 LiteLLM 打造 Moyai Devin：可持久化的工作階段、平行代理程式、Slack，以及共享的組織連線。"
tags: [engineering, agents, infrastructure, slack]
image: ./hero.png
hide_table_of_contents: true
custom_hero: true
---

import MoyaiHero from './MoyaiHero';
import {PostByline} from '@theme/BlogPostPage';
import BugWorkflowDemo from './BugWorkflowDemo';

<MoyaiHero />

<PostByline horizontal />

在 BerriAI，我們打造了 **Moyai Devin**，一個在雲端執行的內部工程代理程式。團隊成員可以在 Slack 中交辦任務、在網頁應用中追蹤進度，並請它準備 pull request。

{/* truncate */}

我們想要：

- **雲端工作區：** 執行程式碼、測試與瀏覽器，不必使用任何人的筆電。
- **共享的組織連線：** 存取 Slack、Linear、Notion 和 GitHub。
- **持續對話：** 跨 Slack 和網頁延續同一項任務。
- **平行代理程式：** 將彼此獨立的工作分配到多台機器上。
- **模型選擇與支出追蹤：** 選擇 Astra 或 Opus，並將用量歸屬到每位團隊成員。

## 這看起來是什麼樣子 {#what-it-looks-like}

<BugWorkflowDemo />

## 1. 主要架構 {#1-main-architecture}

我們依照聊天工作階段的生命週期切分系統。Render 負責對話、權限與已儲存的執行狀態。Temporal 排程下一步。Modal 提供 Hermes 執行程式碼與使用瀏覽器的電腦。

![Moyai 架構：Slack 和網頁進入 Render 應用程式；Temporal 協調工作階段；Hermes 在 Modal 沙箱中執行；Render broker 呼叫 LiteLLM 與已連線的應用程式。](./architecture.svg)

[開啟架構圖](./architecture.svg)。模型請求與已連線應用程式工具會透過 Render broker 傳回。沙箱會接收工作階段能力；提供者憑證則保留在伺服器上。

我們使用了五項服務：

| 服務 | 用途 |
|---|---|
| [Render](https://render.com) | 網頁應用程式、Google SSO、應用程式資料庫、整合 broker，以及 Temporal worker |
| [Modal](https://modal.com) | 帶有終端機、檔案系統與 Chromium 的雲端沙箱 |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | 代理程式迴圈：呼叫模型、執行工具，並根據其結果繼續 |
| [Temporal Cloud](https://temporal.io) | 工作階段協調、等待，以及跨中斷的復原 |
| [LiteLLM](https://github.com/BerriAI/litellm) | 透過單一閘道存取多個模型，並提供請求成本以便記帳 |

**Render 承載應用程式；Modal 承載代理程式的電腦。** 這種分離讓我們能在工作到來時配置執行環境。

每個正在執行的代理程式都會取得一個沙箱。回應之後，我們會儲存其工作區，並讓沙箱保持熱身 5 分鐘。後續跟進可重用它；較晚的訊息則會從檢查點還原到新機器。

我們在 Render 上執行一個共享的 Temporal worker 來協調工作階段。不需要為每個代理程式都配置一個 worker 容器。

儲存方面，我們一開始使用 Render 持久磁碟上的 SQLite。這讓部署保持簡單，但若有多個 Render 執行個體，就需要共享資料庫與成品儲存區。

Slack 訊息會依下列路徑流轉：驗證請求、找出該 Slack thread 對應的工作階段、將訊息提交到收件匣，並喚醒其 Temporal workflow。worker 會載入已儲存的執行階段，並啟動或重新連線到代理程式的 Modal 沙箱。我們會先持久化答案，再將其送回 Slack 和網頁。

## 2. 主要挑戰 {#2-main-challenges}

### 在部署之間讓工作持續存活 {#keeping-work-alive-across-deployments}

部署新版本會重新啟動 Render 上的 Moyai。當應用程式恢復上線時，代理程式可以繼續在其 Modal 沙箱中工作。

每項服務在復原時都有各自角色：

- **Temporal** 會追蹤未完成的步驟，並在 worker 重新連線時重試它們。
- **Render 的資料庫** 會保存聊天、排隊中的訊息，以及找到執行中代理程式所需的詳細資訊。
- **Modal** 執行代理程式，並儲存其對話歷史與檔案的備份副本。

重新啟動後，新的 Render worker 會讀取已儲存的工作階段並重新連線到 Temporal。Temporal 會將未完成的步驟送給它。Moyai 重新連線到同一個沙箱，並接續代理程式的進度。我們會記錄代理程式啟動，以免重試時啟動第二個副本。

![復原序列：Temporal 排程一個 activity，Render 在 Modal 中啟動一個 detached supervisor，Render 重新啟動，而重試的 activity 重新連線到同一個沙箱並讀取其 journal。](./recovery.svg)

[開啟復原圖](./recovery.svg)。此路徑假設 Modal 沙箱會在 Render 重新啟動期間存活。

workflow 會使用工作階段 ID 呼叫一個有界的 activity。這段摘錄來自我們的 `SessionWorkflow`；周圍的迴圈會等待訊息訊號，並透過 Continue-As-New 重新起算其歷史。

```python title="app/session_workflow.py · activity configuration"
busy = await workflow.execute_activity(
    "advance_session", run_id,
    start_to_close_timeout=timedelta(minutes=15),
    heartbeat_timeout=timedelta(seconds=30),
    retry_policy=RetryPolicy(
        initial_interval=timedelta(seconds=2),
        maximum_interval=timedelta(seconds=60),
    ),
)
```

Render worker 在推進工作階段時，每 5 秒就會發出 heartbeats。如果它停止發出 heartbeats，Temporal 就能在替代 worker 上重試該 activity。我們只傳遞工作階段 ID，並回傳小型狀態值；提示詞、憑證與工作區檔案都保留在 workflow history 之外。

那個重試邊界還需要第二道保護。Render 可能要求 Modal 啟動 Hermes，卻遺失回應，然後重試同一個請求。我們把啟動檢查放進沙箱中的 detached supervisor：

```python title="sandbox/durable_process.py · launch guard, excerpt"
with (directory / "lock").open("a") as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return  # Another supervisor still owns this execution.

    if (directory / "started.json").exists():
        return  # A previous launch may already have run tools.

    atomic(directory / "started.json", {"pid": os.getpid()})
    # Still holding the lock, start Hermes and journal its events.
```

每個執行區段都有自己的目錄。我們的 `atomic` helper 會寫入暫存檔案、用 `fsync` 將其 flush，然後將其重新命名到位。supervisor 在 Hermes 執行時持有鎖定、將事件附加到 journal，並另外儲存最終結果。中斷之後，替代的 Render worker 會從已儲存的 journal offset 繼續讀取。

marker 所涵蓋的是與鎖定不同的失敗情況。存活的 supervisor 會持有鎖定；死亡的 supervisor 可能只留下 `started.json`。如果我們找到一個已啟動的 marker，卻沒有存活的擁有者或已確認的結果，我們就會停止並回報執行中斷。重新開始可能會重複一個已經變更外部系統的工具。

我們會在工具回合之間儲存對話與檔案，這樣就能在新的沙箱上還原它們。我們也會在打包檔案之前先儲存最終答案。

重試需要謹慎：如果建立 PR 成功但其回應遺失，我們會先檢查發布紀錄再嘗試一次。

Temporal 會重試 activities；它不會讓外部副作用達到 exactly-once。檔案系統快照也不包含執行中的程序和瀏覽器分頁。若 Render 磁碟遺失，我們的應用程式紀錄也會遺失，因此 Temporal history 不能取代資料庫備份。

### 協調平行代理程式 {#orchestrating-parallel-agents}

我們希望支援像這樣的請求：「用五個代理程式執行 100 個測試案例。」

我們的協調器會：

1. 將工作拆成五個分派。
2. 給每個 worker 一份隔離的工作區副本。
3. 儲存自身狀態，並在等待時釋放其沙箱。
4. 在 workers 完成後恢復執行，並收集其結果。

我們用五個 worker、每個處理 20 個確定性案例，驗證了這個流程。使用者可以從側邊欄開啟個別 worker，以檢視進度或繼續其對話。

沙箱容量會跟隨需求而變動。在閒置時間窗內執行的代理程式和工作階段會消耗機器；等待子工作完成的協調器則不會。

我們設定了 100 個沙箱的上限。我們的五個 worker 測試驗證了協調流程，但 100 個代理程式的負載測試仍是獨立工作。Modal 配額與伺服器的模型請求上限也會限制並行度。

### 讓 Slack 表現得像一段對話 {#making-slack-behave-like-a-conversation}

Slack 需要的不只是接收提及並貼出答案。

我們需要：

- 讀取請求背後的討論。
- 透過 thread 回覆與 DM 延續同一個工作階段。
- 將網頁訊息鏡像到連結的 Slack thread。
- 在不啟動重複工作的情況下處理重複事件。
- 顯示工作中狀態，並將答案送到正確的對話。

我們使用 [AgentChat](https://github.com/BerriAI/agentchat) 來處理標準化訊息、對話處理、回覆與工作中狀態支援。

Moyai 增加了持久化的入站與出站訊息記錄、Slack 簽章驗證，以及網頁工作階段鏡像。AgentChat 減少了我們需要建置的訊息程式碼；而持久交付與權限仍由我們負責。

微妙的失敗在於：在訊息真正具備持久性之前就先回應 Slack 事件。即使我們從未把工作排入佇列，Slack 也可能停止重試。我們會在同一個 SQLite 交易中同時儲存收據與使用者訊息。以下是一般訊息路徑，在簽章驗證與執行緒到工作階段查找之後已簡化如下：

```python title="app/slack_chat.py · shortened message intake"
with self.store.connect() as conn:
    conn.execute("BEGIN IMMEDIATE")
    duplicate = conn.execute(
        """SELECT 1 FROM slack_receipts
           WHERE event_id=?
              OR (team_id=? AND channel=? AND message_ts=?)""",
        (event_id, team, channel, ts),
    ).fetchone()
    if duplicate:
        return None

    message, _ = self.store.enqueue_message_in(
        conn, run_id, prompt,
        "slack:" + digest(team + channel + ts),
        user_id=actor_id,
    )
    conn.execute(
        """INSERT INTO slack_receipts
           (event_id, team_id, channel, message_ts,
            user_id, run_id, message_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (event_id, team, channel, ts, user, run_id, message["id"]),
    )
```

我們會針對傳遞 ID 與實體 Slack 訊息都做去重，該訊息由 team、channel 和 timestamp 識別。收據資料表也透過資料庫限制來強制這些鍵值。執行緒回覆則透過另一個 `(team_id, channel, thread_ts)` 對應解析，因此後續訊息會加入既有工作階段，而不是建立另一個代理程式。

工作流程喚醒是這次提交之後的另一個步驟。我們會保留待處理的喚醒請求，直到 Temporal 接受它們為止，而啟動復原會掃描收件匣中的待處理工作。這樣就能涵蓋在儲存訊息與派送之間發生的重新啟動。

傳送回覆本身也有一種不確定性：Slack 可能在我們連線中斷前就接受貼文。我們會在請求前將 outbox 資料列標記為 `sending`，然後在收到確認回應後標記為 `sent`。逾時則會讓它保持 `uncertain`；我們會將回覆保留在 web 工作階段中，並避免自動重複貼文。這是在自動重新傳送與使用者可檢視的傳遞失敗之間的取捨。

### 在不把憑證交給代理程式的情況下共享存取權 {#sharing-access-without-handing-credentials-to-agents}

團隊成員透過 Google Workspace 登入並使用組織連線。提供者憑證會留在受信任的伺服器上，位於會檢查目前工作階段權限的工具之後。

對於 GitHub，Moyai 可以在管理員核准後準備並發布一般的 PR。我們沒有提供任何用於核准或合併 PR 的工具。

我們也新增了個人與組織技能，以及帶有明確共享選項的安全憑證請求。使用者可以重複使用指示與支援的 API 金鑰，而不必將密鑰貼到對話中。

## 3. 接下來是什麼，以及我會建議什麼 {#3-whats-next-and-what-id-recommend}

我們下一步的優先事項是：

- **帳務復原。** LiteLLM 可以對最終回應未曾到達 Moyai 的請求計費。我們目前會追蹤已回傳的成本；我們正在評估具持久性的收據，以找回遺失的那些。
- **更高並行度的測試。** 在增加用量前，先測試更大的 worker 群組、失敗復原與資源限制。
- **總成本可見性。** 將模型支出與 Render、Modal 和 Temporal 費用合併。

如果您正在打造類似的系統，請從一個完整的工作階段開始：接受訊息、執行工作、儲存回覆與工作區，然後從後續訊息繼續。

在加入更多並行度之前，先測試部署中斷、重複的 Slack 事件，以及失敗的工作區儲存。這些測試會揭露成功的單一提示無法捕捉到的缺口。
