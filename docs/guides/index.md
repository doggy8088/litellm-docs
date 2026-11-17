---
title: 功能
sidebar_label: 總覽
---

import NavigationCards from '@site/src/components/NavigationCards';

**功能** 是 LiteLLM 跨提供者對您的請求所做的處理：負載平衡與備援、串流、工具呼叫、媒體輸入、提示詞快取等。大多數頁面同時提供 Python SDK 的程式碼與 AI Gateway 的設定方式。僅適用於單一產品的功能，會放在該產品的專區中。

> 您是 LiteLLM 新手嗎？請從 [AI Gateway 快速入門](/docs/proxy/docker_quick_start) 或 [Python SDK 快速入門](/docs/learn/sdk_quickstart) 開始。

<NavigationCards
columns={3}
items={[
  {
    title: "路由與可靠性",
    description: "負載平衡、備援、用戶端備援、逾時，以及路由規則。",
    to: "/docs/proxy/load_balancing",
  },
  {
    title: "請求與回應",
    description: "串流、批次處理、結構化輸出，以及推理。",
    to: "/docs/guides/core_request_response_patterns",
  },
  {
    title: "工具呼叫",
    description: "函式呼叫、網頁搜尋與擷取、computer use、code interpreter，以及知識庫。",
    to: "/docs/guides/tools_integrations",
  },
  {
    title: "多模態",
    description: "視覺、音訊、PDF 輸入，以及聊天中的圖片生成。",
    to: "/docs/guides/multimodal_io",
  },
  {
    title: "提示詞與上下文",
    description: "提示詞快取、assistant 預填，以及預測輸出。",
    to: "/docs/guides/prompts_context",
  },
  {
    title: "相容性",
    description: "提供者特定參數、不支援的參數，以及訊息清理。",
    to: "/docs/guides/compatibility_extensibility",
  },
]}
/>

## 先前放在這裡的其他頁面 {#other-pages-that-were-here}

[重試與備援](/docs/completion/reliable_completions)、[模擬回應](/docs/completion/mock_requests)、[訊息修剪](/docs/completion/message_trimming)、[模型別名](/docs/completion/model_alias) 與 [提示詞格式化](/docs/completion/prompt_formatting) 位於 [Python SDK](/docs/python_sdk) 專區。[SSL 與 HTTP 代理設定](/docs/guides/security_settings) 位於 AI Gateway 設定頁面，[自訂格式](/docs/extras/creating_adapters) 則與自訂外掛放在一起。[微調模型](/docs/guides/finetuned_models) 與提供者放在一起，[Veo 影片生成](/docs/proxy/veo_video_generation) 則與影片端點放在一起。
