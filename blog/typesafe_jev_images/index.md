---
slug: typesafe_jev_images
title: "Day 0 支援：TypeSafe Jev 1.14：新增影像、box 問題與長上下文"
date: 2026-10-15T10:00:00
authors:
  - kerry
  - mateo
description: "TypeSafe Jev 1.14 可讀取影像、以座標回答 box 問題，並接受長上下文請求。LiteLLM 透過 TypeSafe 的 opt-in 標頭，在 /v1/systemone 與 /v1/decisions 上提供這三項功能。"
card_title: "Jev 1.14"
card_summary: "Jev 1.14 可讀取 PNG 與 JPEG 影像、以座標回答 box 問題，並在 LiteLLM 上接受長上下文請求。"
tags: [typesafe, jev, decisions, day 0 support]
hide_table_of_contents: false
---

TypeSafe 的 Jev 1.14 新增了一個問題類型 `box`，會回答某物在影像中的位置。LiteLLM 從 day 0 起在兩個 [decision routes](/docs/decisions) 上支援它：`POST /v1/systemone` 與 `POST /v1/decisions`，同時支援 TypeSafe 的影像輸入與長上下文模式。如果您還不熟悉 Jev，請從 [TypeSafe Jev 發表文章](/blog/typesafe_jev) 與 [decision models 文章](/blog/decision-models) 開始，其中說明了什麼是決策模型，以及這兩個 route 之間的關係。透過 proxy 請求 `jev-1.14.0`，您已用於決策模型的相同虛擬金鑰、預算、支出記錄與備援都會一併適用。

{/* truncate */}

## 為什麼影像對決策模型重要 {#why-images-on-a-decision-model-matter}

決策模型以機率而不是文字回答具型別的問題，這正是它便宜到可以放在每個請求前面的原因。直到現在，LiteLLM 只將文字送給它們。生產環境應用程式中的視覺檢查，例如上傳的檔案是否為收據、上架照片是否違反政策、截圖是否顯示錯誤對話框，仍會送到帶有視覺提示、JSON 解析器與重試迴圈的 chat 模型。Jev 1.14 以回答文字問題的相同方式回答這些問題：關於影像的 `noul` 問題會回傳單一機率，您可以對它設定閾值、記錄並比較，不需要解析任何散文。

`box` 問題類型是 Jev 1.14 新增的，也在 `jev-preview` 上提供，它補上了位置。詢問「`photo` 中的紅色方塊」，答案會是四條邊 `top`、`bottom`、`left` 與 `right`，以相對於影像高度與寬度的比例表示，從左上角量起，外加一個 `confidence`。因為邊是以比例表示，同一個答案在任何影像尺寸下都正確，因此您可以裁切該區域交給更大的模型、在審查工具中標示它，或檢查必要元素是否在應在的位置，中間不需要生成步驟。

長上下文是第三塊。TypeSafe 的預設限制是每個請求 64k tokens、每個問題 32k。在請求上加上 `TypeSafe-Danger-Zone-Long-Context: true` 後，Jev 可以在一次呼叫中就整份合約、逐字稿或記錄做出決策，而不是用滑動視窗由您自己拼湊。

## LiteLLM 加入了什麼 {#what-litellm-adds}

TypeSafe 將影像、`box` 問題與長上下文放在 opt-in 請求標頭之後：`TypeSafe-Danger-Zone-Images: true` 與 `TypeSafe-Danger-Zone-Long-Context: true`。proxy 會將任何以 `TypeSafe-Danger-Zone-` 開頭的用戶端標頭轉送至 TypeSafe 部署，且不轉送給任何其他提供者，因此用戶端可依每個請求開啟這些功能，也不會有任何東西洩漏到同一模型名稱背後的其他決策提供者。

在 `/v1/systemone` 上，您以 TypeSafe 的方式送出影像，在 `assets` 中命名並從 `state` 引用。在 `/v1/decisions` 上，您以 OpenAI 的方式送出，作為帶有影像 URL 或 data URL 的 `input_image` 部分，LiteLLM 會將每個 PNG 或 JPEG 轉成 asset，將 asset 的名稱放在文字中原本影像的位置，並先下載影像 URL。`box` 答案會以您呼叫的 route 的形狀回傳，因此以 OpenAI Decisions 格式撰寫的應用程式無需學習 System One 格式，即可取得 Jev 的影像答案。

相同的標頭也可在 [`/typesafe` pass-through](/docs/pass_through/typesafe) 上使用。如果您以 `LITELLM_PROXY_BASE_URL/typesafe` 作為 base URL 直接呼叫 TypeSafe 的 API，以 `TypeSafe-Danger-Zone-` 開頭的用戶端標頭會被轉送至 TypeSafe，其他用戶端標頭則不會，因此既有的 System One 用戶端只需要標頭與 `jev-1.14.0` 即可使用影像與 `box`。

失敗模式維持可預測。對無法回答的模型（包括 `jev-1.13.0` 與 `jev-latest`）提出 `box` 問題，或在沒有標頭的情況下送出影像，會在呼叫任何提供者之前就收到 400。開啟 `drop_params` 時，LiteLLM 會改為丟棄該問題或影像，其餘請求照常通過，被丟棄的問題在 `/v1/decisions` 上以 `{"type": "refusal"}` 回傳，在 `/v1/systemone` 上則從 `answers` 中省略。`jev-1.14.0` 的支出會以 TypeSafe 每 1M 輸入 tokens $0.042 的價格記錄在支出記錄中，且不收取輸出費用。

標頭、`assets` 形狀與一個完整的 box 範例都在 [TypeSafe 影像、box 問題與長上下文](/docs/decisions#typesafe-images-box-questions-and-long-context) 中，SDK 用法在 [SDK usage](/docs/decisions#sdk-usage)。影像與 `box` 問題將隨下一個 LiteLLM 版本提供，而 `jev-1.14.0` 的成本追蹤在您重新載入模型成本對照表後，即可在您目前執行的版本上運作。

## 意見回饋 {#feedback}

請在 [GitHub Discussions](https://github.com/BerriAI/litellm/discussions) 告訴我們您用影像決策打造了什麼，以及什麼東西壞了。
