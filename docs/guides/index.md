---
title: 指南
sidebar_label: 總覽
---

import NavigationCards from '@site/src/components/NavigationCards';

**指南** 是依您使用 LiteLLM 想完成的工作來組織的重點參考：發出請求、使用工具、處理媒體、管理上下文，或安全地操作閘道。

> 您是 LiteLLM 新手，或不確定是否需要先走 SDK 或 Gateway 路徑？請從 [了解 →](/docs/learn) 開始

---

## 使用 LiteLLM 建置 {#build-with-litellm}

<NavigationCards
columns={3}
items={[
  {
    icon: "⚡",
    title: "核心請求",
    description: "串流、批次處理、結構化輸出，以及推理行為。",
    to: "/docs/guides/core_request_response_patterns",
  },
  {
    icon: "🛠️",
    title: "工具呼叫",
    description: "函式呼叫、網頁工具、攔截模式、computer use、code interpreter，以及工具呼叫衛生。",
    to: "/docs/guides/tools_integrations",
  },
  {
    icon: "🖼️",
    title: "多模態 I/O",
    description: "視覺、音訊、PDF、圖片生成，以及影片生成。",
    to: "/docs/guides/multimodal_io",
  },
  {
    icon: "📚",
    title: "檢索與知識",
    description: "向量儲存、檔案搜尋、引文，以及知識庫路由。",
    to: "/docs/guides/retrieval_knowledge",
  },
  {
    icon: "🧠",
    title: "提示詞與上下文",
    description: "提示詞快取、修剪、格式化、assistant 預填，以及預測輸出。",
    to: "/docs/guides/prompts_context",
  },
]}
/>

---

## 操作與擴充 {#operate--extend}

<NavigationCards
columns={3}
items={[
  {
    icon: "🎛️",
    title: "相容性與可擴充性",
    description: "提供者特定參數、模型別名、微調模型，以及轉接器。",
    to: "/docs/guides/compatibility_extensibility",
  },
  {
    icon: "🧪",
    title: "可靠性、測試與支出",
    description: "重試、備援、模擬回應，以及預算控制。",
    to: "/docs/guides/reliability_testing_spend",
  },
  {
    icon: "🔒",
    title: "安全性與網路",
    description: "SSL、自訂 CA 套件、HTTP proxy 設定，以及每個服務的驗證。",
    to: "/docs/guides/security_network",
  },
]}
/>
