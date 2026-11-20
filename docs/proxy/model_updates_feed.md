---
title: 訂閱模型與價格更新
description: 在 Slack 或任何 RSS 閱讀器中，透過 models.litellm.ai 追蹤新模型、價格變更與棄用，篩選範圍限於您使用的提供者與模型。
---

# 訂閱模型與價格更新 {#subscribe-to-model-and-price-updates}

{/* keep-version-note */}

[models.litellm.ai](https://models.litellm.ai/) 會發佈由[模型成本對照表](./model_cost_map)建置的 RSS 摘要，讓您在 Slack 或任何 RSS 閱讀器中追蹤新模型、價格變更與棄用，而不必檢查網站。所有摘要都是公開的，不需要帳號或金鑰。

| 摘要 | URL | 發佈內容 |
|---|---|---|
| 變更記錄 | `https://models.litellm.ai/changelog.xml` | 成本對照表的每一次價格、新模型、新提供者、能力與棄用變更，並附上指向該 commit 的連結 |
| 新模型 | `https://models.litellm.ai/new-models.xml` | 加入成本對照表的最新 50 個模型及其價格 |
| 棄用 | `https://models.litellm.ai/deprecated-models.xml` | 提供者模型在其生效日期的棄用 |
| 即將棄用 | `https://models.litellm.ai/deprecated-models.xml?days=30` | 從今天起至未來 30 天內生效的棄用（UTC）；0 到 180 之間的任何整數都有效 |

## 為您使用的模型建置摘要 {#build-a-feed-for-the-models-you-run}

取得篩選後摘要最快的方式，是使用變更記錄頁面上的建置器。

1. 開啟 [models.litellm.ai/changelog](https://models.litellm.ai/changelog)，然後展開 **Build a feed for the models you run**。
2. 在 **Post** 下方，選擇摘要的發佈頻率（每次變更、每個目錄 commit 一則，或每 30 分鐘、一小時、4 小時或一天），然後勾選您在意的變更類型，例如價格與棄用。全部不勾選，即可取得重點摘要。
3. 勾選提供者即可追蹤該提供者上的所有內容，或點選提供者名稱，只勾選您使用的模型。使用 **Government clouds** 核取方塊，即可只追蹤 Bedrock GovCloud 或 Azure Government 的清單。
4. 若使用 RSS 閱讀器，請點選 **Copy URL**；若使用 Slack，請點選 **Copy Slack command**。

提供者清單下方的標籤會顯示您追蹤的內容，以及該摘要在過去 30 天內會發送的貼文數量，讓您在訂閱之前先確認數量。

## 訂閱 Slack 頻道 {#subscribe-a-slack-channel}

Slack 透過其 RSS 應用程式讀取摘要（[Slack 指南](https://slack.com/help/articles/218688467-Add-RSS-feeds-to-Slack)）。請先將該應用程式加入您的工作區一次，然後在應該收到貼文的頻道中，執行建置器提供的指令：

```text
/feed subscribe https://models.litellm.ai/changelog.xml?digest=1h
```

請為 Slack 使用 `digest` 摘要。若不使用，變更記錄會為每次變更發送一則訊息，而一次目錄更新可能影響數百個模型。`?digest=1h` 會每小時發送一則訊息，包含該小時內的所有變更；`?digest=commit` 會為每個成本對照表 commit 發送一則訊息。請在頻道中執行 `/feed list` 查看其訂閱，並執行 `/feed remove <id>` 停止其中一個訂閱。

## 在 RSS 閱讀器中訂閱 {#subscribe-in-an-rss-reader}

請將上表中的任何摘要 URL，或建置器提供的 URL，貼到閱讀器的新增摘要或訂閱對話框中。Feedly、Inoreader、NetNewsWire、Thunderbird 以及其他支援 RSS 2.0 的閱讀器都可以使用。項目 ID 在網站重建後保持不變，因此閱讀器不會重複顯示同一項變更。

## 手動篩選變更記錄摘要 {#filter-the-changelog-feed-by-hand}

建置器會寫入以下查詢參數，您也可以自行將它們加到 `changelog.xml`。

| 參數 | 範例 | 效果 |
|---|---|---|
| `kind` | `?kind=price,deprecation` | 僅限這些變更類型，而非預設的重點摘要：`price`、`model`、`provider`、`capability`、`deprecation`、`metadata` |
| `all` | `?all=anthropic,bedrock` | 這些提供者上的所有變更，依其 LiteLLM 提供者 ID |
| `models` | `?models=openai:gpt-5.1,claude-opus-4-5` | 僅限這些模型；`provider:model` 會將模型限定於一個提供者，單獨的模型名稱則會在每個提供者上追蹤該模型 |
| `cloud` | `?cloud=bedrock-gov,azure-gov` | 僅限 Bedrock 與 Azure 上的 GovCloud 清單 |
| `digest` | `?digest=1h` | 每個時段一則項目（`30m`、`1h`、`4h`、`1d`）或每個 commit 一則（`commit`），而非每次變更一則 |

`all` 與 `models` 會相加，因此 `?all=anthropic&models=openai:gpt-5.1` 會追蹤 Anthropic 上的所有內容，加上 OpenAI 上的 GPT-5.1。`kind` 與 `cloud` 會縮小該結果，因此 `?all=bedrock&kind=price&digest=1d` 是 Bedrock 價格變更的每日摘要。請以相同的參數開啟 `https://models.litellm.ai/changelog`，即可看到建置器已預先填入該摘要。
