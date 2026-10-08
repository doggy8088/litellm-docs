---
title: 提示快取
sidebar_label: 提示快取
description: 在回合之間切換模型不會丟棄您的提示快取。量測結果、快取為何能持續存在，以及讓它在代理程式工作負載中保持熱快取的設定。
---

import NavigationCards from '@site/src/components/NavigationCards';

**反對意見：** 在對話中途切換模型的路由器一定會丟棄提示快取。

**量測結果：** 並不會。路由器加上快取，在每個資料集上都勝過單一固定模型的快取。

| 評估 | 樣本 | 路由器 + 快取相較於單獨快取 |
| --- | --- | --- |
| WildChat-1M 模擬，一般聊天 | 30,769 個多回合對話 | **便宜 68.7%** |
| DevGPT 模擬，開發者聊天 | 1,011 個對話 | **便宜 46%** |
| 真實代理程式追蹤，提供者快取記帳 | 95 個工作階段，8,174 次 API 請求 | **便宜 37.4%** |
| TwinRouterBench 靜態軌道 | 81 個多步驟實例 | **便宜 44 到 50%** |

- **切換不是驅逐。** 當某個工作階段回到先前使用過的模型時，快取仍然存在。
- **4,684 次真實切回**（來自線上閘道流量）：在 5 分鐘 TTL 下，**97.4%** 找到快取為熱快取；在 1 小時 TTL 下，**99.3%**。
- **昂貴的錯誤剛好相反。** 關閉快取的路由器，成本大約是單一固定模型快取的 **4 倍**。
- **節省記帳對此保持誠實。** 全前沿基準會以後續回合的熱快取定價，而在切換後新增一次快取寫入則會計入節省的反面。請參閱 [回報的節省](/docs/proxy/auto_routing#reported-savings)。

<NavigationCards
columns={2}
items={[
  {
    title: "Prompt Caching 可與 Auto Router 搭配運作",
    description: "五個資料集、各資料集有無快取的成本、切回量測，以及設定。",
    to: "/blog/auto-router-prompt-caching-benchmark",
  },
  {
    title: "工作階段親和性與部署親和性",
    description: "當您希望對話固定在同一個模型與同一個部署時，能將其鎖定的兩個釘點。",
    to: "/docs/proxy/auto_routing#session-affinity",
  },
]}
/>

## 何時仍要釘定 {#when-to-pin-anyway}

- `session_affinity` **預設為關閉**，這對大多數路由器而言是正確設定。上面的數據顯示它對快取不是必要的，而且釘定會放棄將後續回合路由到較低層級所帶來的節省。
- **當階層切換會改變用戶端依賴的行為時，請將其開啟。** 這類情況有兩種：
  - **歷史記錄中的提供者狀態。** 由某個模型產生的歷史記錄，在另一個模型上可能會失敗：Anthropic 的 `thinking` 區塊或 `cache_control` 標記重播到非 Anthropic 層級，或不同提供者之間格式不同的工具呼叫。釘定可讓工作階段維持在產生該歷史記錄的模型上。
  - **使用者看得到的一致性。** 每個模型都有自己的風格。會在多個回合中產生版面、形狀或元件的設計工作流程，只有在每一回合都來自同一個模型時，才能維持一致外觀；應保持單一語氣的寫作助理也是同樣情況。
- **單一系列階梯很少需要它。** 當每個階層都是同一個提供者（全是 Claude、全是 GPT）時，歷史記錄可以乾淨地重播，而上方的快取量測結果也適用。請保持關閉，讓後續請求往下路由。
- 若某個階層後方有多個部署，還需要 `deployment_affinity` 以及 `prompt_caching` 的 `router_settings` 前置呼叫檢查，這樣後續回合才能回到持有快取的部署。
- 兩者搭配：[具有負載平衡的程式設計代理程式](/docs/auto_router/recommended_configurations#coding-agents-with-load-balancing)。

## 在負載平衡部署之間進行快取 {#caching-across-load-balanced-deployments}

與路由器分開：當同一個模型在多個部署或 AWS 帳戶之間進行負載平衡時，`prompt_caching` 前置呼叫檢查可讓 Anthropic 快取持續運作。

<NavigationCards
columns={2}
items={[
  {
    title: "Claude Code：提示快取路由",
    description: "在重複部署之間啟用 prompt_caching 前置呼叫檢查，並在請求記錄中確認快取讀取。",
    to: "/docs/tutorials/claude_code_prompt_cache_routing",
  },
]}
/>
