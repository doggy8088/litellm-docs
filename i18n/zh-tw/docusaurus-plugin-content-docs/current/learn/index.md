---
title: 學習 LiteLLM
sidebar_label: 學習
slug: /learn
---

import NavigationCards from '@site/src/components/NavigationCards';

LiteLLM 為 100 多個 LLM 提供者提供 OpenAI 相容介面。請依照您的使用情境選擇適合的路徑。

* * *

## 從這裡開始

先選擇一條路徑。

<NavigationCards
columns={3}
items={[
  {
    icon: "🐍",
    title: "SDK 快速入門",
    description: "直接在應用程式程式碼中使用 LiteLLM。",
    listDescription: [
      "安裝",
      "發出第一個請求",
      "探索後續 SDK 功能",
    ],
    to: "/docs/learn/sdk_quickstart",
  },
  {
    icon: "🖥️",
    title: "Gateway 快速入門",
    description: "以共用 Gateway 方式執行 LiteLLM。",
    listDescription: [
      "啟動 Proxy",
      "新增模型與金鑰",
      "連線 Client",
    ],
    to: "/docs/learn/gateway_quickstart",
  },
  {
    icon: "✨",
    title: "企業版快速入門",
    description: "LiteLLM Enterprise 快速入門，涵蓋 LLM、MCP 與代理程式 Gateway。",
    listDescription: [
      "使用授權部署",
      "驗證三種 Gateway",
      "啟用企業控制項",
    ],
    to: "/docs/learn/enterprise_quickstart",
  },
]}
/>

* * *

## 常見任務

直接前往特定任務。

<NavigationCards
columns={3}
items={[
  {
    icon: "⚡",
    title: "串流回應",
    description: "在 Token 生成時立即回傳。",
    to: "/docs/guides/core_request_response_patterns",
  },
  {
    icon: "🧰",
    title: "使用工具",
    description: "在應用程式中加入函式呼叫。",
    to: "/docs/guides/tools_integrations",
  },
  {
    icon: "🔀",
    title: "加入路由",
    description: "重試、備援與負載平衡。",
    to: "/docs/routing-load-balancing",
  },
  {
    icon: "🔑",
    title: "設定金鑰",
    description: "Gateway 驗證、虛擬金鑰與存取控制。",
    to: "/docs/proxy/virtual_keys",
  },
  {
    icon: "📈",
    title: "加入記錄",
    description: "擷取請求記錄與支出資料。",
    to: "/docs/proxy/logging",
  },
  {
    icon: "🌐",
    title: "選擇提供者",
    description: "尋找提供者專用的驗證方式與參數。",
    to: "/docs/providers",
  },
]}
/>

* * *

## 文件地圖

如果您已經知道要找哪一類文件，請從這裡開始。

<NavigationCards
columns={2}
items={[
  {
    icon: "📚",
    title: "指南",
    description: "功能參考。",
    to: "/docs/guides",
  },
  {
    icon: "🛠️",
    title: "教學",
    description: "逐步整合說明。",
    to: "/docs/tutorials",
  },
]}
/>

如果不確定從哪裡開始，應用程式開發請使用 [SDK 快速入門](/docs/learn/sdk_quickstart)，共用基礎架構請使用 [Gateway 快速入門](/docs/learn/gateway_quickstart)，試用或概念驗證請使用[企業版快速入門](/docs/learn/enterprise_quickstart)。
