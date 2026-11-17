---
title: 食譜集
sidebar_label: 所有食譜
---

import NavigationCards from '@site/src/components/NavigationCards';

**食譜集**提供逐步食譜。每份食譜都會將 LiteLLM 連接到外部工具、框架或服務，或從頭到尾建立一個完整的工作流程。若要先設定 LiteLLM，請使用 [Gateway 快速入門](/docs/proxy/docker_quick_start) 或 [SDK 快速入門](/docs/learn/sdk_quickstart)。

<NavigationCards
columns={1}
items={[
  {
    title: "LiteLLM Academy",
    description: "從我們的互動式課程開始使用。學習每位平台管理員都需掌握的基礎知識，從閘道設定與存取控制到路由與可觀測性。",
    ctaLabel: "開始使用",
    to: "https://litellm.ai/course",
  },
]}
/>

<NavigationCards
columns={2}
items={[
  {
    title: "連接應用程式與提供者",
    description: "安裝 SDK、設定提供者金鑰，並呼叫 Azure OpenAI、HuggingFace、TogetherAI 與本機模型。",
    to: "/docs/learn/call-any-model",
  },
  {
    title: "控制存取",
    description: "管理使用者與團隊，並連接 SSO 與 SCIM。",
    to: "/docs/learn/run-the-gateway",
  },
  {
    title: "控制成本與容量",
    description: "新增備援並使用提示快取。",
    to: "/docs/learn/cost-and-reliability",
  },
  {
    title: "控制內容",
    description: "使用 Aporia 與 Presidio 新增防護欄與 PII 遮罩。",
    to: "/docs/learn/add-safety",
  },
  {
    title: "查看發生了什麼",
    description: "將記錄傳送到 Elasticsearch、比較模型，並執行評估套件。",
    to: "/docs/learn/observe-and-evaluate",
  },
  {
    title: "連接工具與代理程式",
    description: "使用代理程式 SDK、程式設計工具、檔案搜尋、向量儲存與即時音訊。",
    to: "/docs/learn/agents-and-tools",
  },
]}
/>
