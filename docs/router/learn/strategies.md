---
sidebar_label: "策略與子路由器"
description: "LiteLLM Router 的策略、路由群組、子路由器與路由外掛如何挑選部署或模型群組。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 策略、路由群組與子路由器 {#strategies-routing-groups-and-sub-routers}

{/* keep-version-note */}

一旦篩選器留下一份可以服務請求的部署清單，策略會挑選其中一個。路由群組讓不同的模型群組使用不同的策略，
而子路由器會在這一切發生之前，先決定請求應該去哪個模型群組。本頁涵蓋這三者，外加自訂策略與路由外掛。

![一個請求被子路由器路由到一個模型群組，經過解析與篩選，然後所選的策略挑選一個部署](../img/strategies-1.svg)

## 策略 {#strategies}

| 策略 | 挑選 | 讀取 |
| --- | --- | --- |
| `simple-shuffle`（預設） | 一個加權隨機部署 | 每個請求的權重，然後是 `weight`，然後是 `rpm`，然後是 `tpm`，否則均勻 |
| `least-busy` | 處理中請求最少的部署 | 處理中計數器 |
| `usage-based-routing-v2` | 這一分鐘 tpm 最低、且保持在其 tpm 與 rpm 之下的部署 | 每分鐘用量計數器 |
| `usage-based-routing` | 上述的 v1 版本，為舊設定保留 | 每分鐘用量 |
| `latency-based-routing` | 最近延遲最低（串流為第一個 token 的時間）、且在緩衝範圍內的部署 | 延遲樣本 |
| `cost-based-routing` | 仍在其限制之下、最便宜的部署 | 模型成本對照表、用量 |
| `lar1` | 依呼叫者的信心水準挑選的部署，門檻來自 `routing_strategy_args` | 請求上的 `metadata.lar1` |

`simple-shuffle` 不需要狀態。其他策略各自保管自己的計數器，由 litellm 的記錄回呼提供。每個策略都在
篩選器之後執行，因此它只會看到篩選器已經核准的部署。

### `simple-shuffle` 中的權重 {#weights-in-simple-shuffle}

![simple-shuffle 如何挑選它的權重：請求權重，否則 weight，否則 rpm，否則 tpm，否則均勻隨機](../img/strategies-2.svg)

第一個在任何候選上有正值的來源，會被用於所有候選，而沒有設定它的候選會得到權重 0。每個請求的權重來自
金鑰或團隊層級的 `router_settings`，proxy 會將它們以 `{model_group: {deployment_id: weight}}`
的形式放在請求上。如此一來，一個團隊可以將某個群組的大部分流量送到一個部署，而其他所有人得到全域的
分配，不需要每個團隊一個 router。SDK 沒有金鑰或團隊來保存這些設定，因此 SDK 呼叫者會在呼叫時傳入
同樣的對照表。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
await router.acompletion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "hi"}],
    _router_weights={"gpt-4o": {"gpt-4o-eastus": 9, "gpt-4o-westus": 1}},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

見[金鑰與團隊 router 設定](../../proxy/keys_teams_router_settings.md)。

</TabItem>
</Tabs>

## 哪個策略適用 {#which-strategy-applies}

![哪個策略適用：請求的 routing_strategy，否則路由群組的，否則 router 的，否則 simple-shuffle](../img/strategies-3.svg)

每個請求的 `routing_strategy` 勝出。proxy 會從金鑰或團隊的 `router_settings` 轉送它，而 SDK
呼叫者會在呼叫時傳入 `routing_strategy=`。接下來是所解析名稱所屬路由群組的策略，然後是 router 自己
的 `routing_strategy`。有狀態的策略會依每個範圍分別保管狀態，因此兩個路由群組使用同一個策略時，
不會混淆它們的計數器。

## 路由群組 {#routing-groups}

路由群組是一組帶有自己策略的具名模型群組集合。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(
    model_list=model_list,
    routing_groups=[
        {
            "group_name": "fast",
            "models": ["gpt-4o-mini", "claude-haiku"],
            "routing_strategy": "latency-based-routing",
        },
        {
            "group_name": "tiers",
            "models": ["gpt-4o-ptu", "gpt-4o-paygo"],
            "routing_strategy": "priority",
            "model_priorities": {"gpt-4o-ptu": 1, "gpt-4o-paygo": 2},
        },
    ],
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
router_settings:
  routing_groups:
    - group_name: fast
      models: [gpt-4o-mini, claude-haiku]
      routing_strategy: latency-based-routing
    - group_name: tiers
      models: [gpt-4o-ptu, gpt-4o-paygo]
      routing_strategy: priority
      model_priorities: {gpt-4o-ptu: 1, gpt-4o-paygo: 2}
```

</TabItem>
</Tabs>

路由群組的名稱是可以呼叫的。對 `fast` 的請求會解析為兩個成員的部署，而 latency-based routing 會在
它們之間挑選。對 `gpt-4o-mini` 的直接請求也會使用 latency-based routing，因為該模型群組屬於
`fast`。每一個不是已設定路由群組成員的模型群組，都屬於隱含的預設路由群組，它使用 router 的
`routing_strategy`。

優先順序群組是例外。它不會用自己的策略挑選。相反地，它將每個成員的優先順序作為其部署的 `order` 來
提供，因此順序篩選器會在優先順序 1 有任何一個健康時，將所有流量送到它那裡，而順序備援會在它失敗時
沿著優先順序往下走。順序篩選器見[如何挑選一個部署](selection.md)，順序備援見[重試、備援與冷卻](reliability.md)。

## 子路由器 {#sub-routers}

auto router、complexity router、quality router 與 adaptive router 是子路由器，不是策略。它們在名稱
被解析之前，先決定哪個模型群組應該服務請求。每一個都被設定為一個部署，其 `litellm_params.model` 以
`auto_router/` 開頭。`auto_router/complexity_router...`、`auto_router/quality_router...` 與
`auto_router/adaptive_router...` 會選到那三個 router，而 `auto_router/` 之下的任何其他名稱都是
auto router。對該部署的 `model_name` 的請求會執行子路由器。

| 子路由器 | 依什麼選擇 |
| --- | --- |
| auto router | prompt 與為每條路由設定的範例 prompt 的接近程度，依 embedding 相似度 |
| complexity router | prompt 看起來有多難，將簡單的 prompt 送到較便宜的群組 |
| quality router | prompt 的複雜度對應到一個品質層級，然後是其路由偏好與該層級相符的模型 |
| adaptive router | 請求的種類（程式碼、寫作、推理等等），以及一個從過去回應中學習哪個模型最能服務每一種、並與成本權衡的 bandit |

![一個對 smart 的請求去到 auto router，它將 prompt 分類並回傳 gpt-4o-mini，而 router 在該群組內挑選](../img/strategies-4.svg)

router 在每次挑選時、解析之前，會詢問子路由器一次，並解析它回傳的任何模型群組。嘗試仍會回報所請求的
名稱 `smart` 作為它的模型群組，因此標頭與支出記錄會顯示呼叫者所要求的內容。標記部署會從每個候選清單
中被移除，因此它們永遠不會被直接呼叫。呼叫者是否可以使用屬於某個團隊的子路由器，取決於 proxy 的團隊
檢查，router 會向 proxy 詢問這一點。

工作階段綁定發生在同一個時間點：屬於某個程式設計工作階段的請求，可以被綁定到目前為止服務該工作階段的
模型群組。

## 路由外掛 {#routing-plugins}

`Router(plugins=[...])` 接受路由外掛：它們是查看請求並縮小哪些模型群組或部署可以服務它，或附加訊號
供後續階段讀取的物件。這些外掛在前置路由期間執行，router 接著只保留它們所留下模型的部署。

## 自訂策略 {#custom-strategies}

以 `CustomRoutingStrategyBase` 呼叫 `router.register_plugin(strategy)`，並不會嵌入策略步驟。
它會取代整個挑選。router 會依原樣服務自訂策略回傳的部署，不經過解析、篩選器或它自己的策略。自訂策略
甚至可以回傳登錄表沒有的部署。`lar1` 就是以這種方式運作。見[進入點](../api_reference/entry_points.md)。
