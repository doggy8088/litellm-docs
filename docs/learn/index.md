---
title: 學習 LiteLLM
sidebar_label: 學習
slug: /learn
---

import NavigationCards from '@site/src/components/NavigationCards';
import {IconCourse, IconEnterprise, IconGateway, IconGuides, IconKey, IconLogs, IconProviders, IconRoute, IconSdk, IconSteps, IconStream, IconTools} from '@site/src/components/Conversion/icons';

LiteLLM 為您提供一個可與 OpenAI 相容的介面，可支援 100+ 個 LLM 提供者。請從最符合您設定的路徑開始。

<NavigationCards
columns={1}
items={[
  {
    title: "LiteLLM 學院",
    description: "從我們的互動式課程開始。學習每位平台管理員必備的基礎知識，涵蓋閘道設定、存取控制、路由與可觀測性。",
    ctaLabel: "開始學習",
    to: "https://litellm.ai/course",
  },
]}
/>

---

## 從這裡開始 {#start-here}

先選擇一條路徑。

<NavigationCards
columns={3}
items={[
  {
    icon: <IconSdk />,
    title: "SDK 快速入門",
    description: "直接在應用程式程式碼中使用 LiteLLM。",
    listDescription: [
      "安裝",
      "首次請求",
      "後續 SDK 功能",
    ],
    to: "/docs/learn/sdk_quickstart",
  },
  {
    icon: <IconGateway />,
    title: "閘道快速入門",
    description: "將 LiteLLM 作為共用閘道執行。",
    listDescription: [
      "啟動 proxy",
      "新增模型與金鑰",
      "連接用戶端",
    ],
    to: "/docs/learn/gateway_quickstart",
  },
  {
    icon: <IconEnterprise />,
    title: "企業版快速入門",
    description: "LiteLLM Enterprise 快速入門指南：LLM、MCP 與代理程式閘道。",
    listDescription: [
      "使用授權部署",
      "驗證三個閘道",
      "啟用企業控制",
    ],
    to: "/docs/learn/enterprise_quickstart",
  },
]}
/>

---

## 常見工作 {#common-tasks}

跳到特定工作。

<NavigationCards
columns={3}
items={[
  {
    icon: <IconStream />,
    title: "串流回應",
    description: "在 token 產生時即時回傳。",
    to: "/docs/guides/core_request_response_patterns",
  },
  {
    icon: <IconTools />,
    title: "使用工具",
    description: "為您的應用程式新增函式呼叫。",
    to: "/docs/guides/tools_integrations",
  },
  {
    icon: <IconRoute />,
    title: "新增路由",
    description: "重試、備援與負載平衡。",
    to: "/docs/routing-load-balancing",
  },
  {
    icon: <IconKey />,
    title: "設定金鑰",
    description: "閘道驗證、虛擬金鑰與存取控制。",
    to: "/docs/proxy/virtual_keys",
  },
  {
    icon: <IconLogs />,
    title: "新增記錄",
    description: "擷取請求記錄與支出資料。",
    to: "/docs/proxy/logging",
  },
  {
    icon: <IconProviders />,
    title: "選擇提供者",
    description: "尋找特定提供者的驗證與參數。",
    to: "/docs/providers",
  },
]}
/>

---

## 文件地圖 {#docs-map}

當您已經知道想要哪一種類型的文件時，請使用這些。

<NavigationCards
columns={3}
items={[
  {
    icon: <IconCourse />,
    title: "LiteLLM 學院",
    description: "引導式課程，說明閘道如何處理請求、路由、存取與成本。",
    to: "https://litellm.ai/course",
  },
  {
    icon: <IconGuides />,
    title: "指南",
    description: "功能參考。",
    to: "/docs/guides",
  },
  {
    icon: <IconSteps />,
    title: "教學",
    description: "逐步整合。",
    to: "/docs/tutorials",
  },
]}
/>

不知道從哪裡開始嗎？應用程式程式碼請使用 [SDK 快速入門](/docs/learn/sdk_quickstart)，共用基礎架構請使用 [閘道快速入門](/docs/learn/gateway_quickstart)，或是試用／PoC 評估請使用 [企業版快速入門](/docs/learn/enterprise_quickstart)。
