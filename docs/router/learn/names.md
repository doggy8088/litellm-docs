---
sidebar_label: "名稱解析"
description: "LiteLLM Router 如何透過別名、萬用字元、路由群組、團隊名稱、部署 id 與預設值，解析所請求的名稱。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 名稱如何找到它的部署 {#how-a-name-finds-its-deployments}

{/* keep-version-note */}

請求會指定一個模型，而該名稱不一定要是模型群組。它可以是一個別名、一個萬用字元比對、一個路由群組、
某個團隊對模型的自有名稱，或一個部署 id。解析會將名稱轉換為可以服務這個呼叫者的部署清單，供後續步驟
使用。解析在每一次挑選開始時執行，因此重試或備援會再次解析該名稱。

## 名稱的種類 {#the-kinds-of-name}

| 名稱 | 範例 | 請求指定 | 解析為 |
| --- | --- | --- | --- |
| 模型群組 | `gpt-4o` | `gpt-4o` | 帶有該 `model_name` 的部署 |
| 別名 | `model_group_alias={"gpt-4": "gpt-4o"}` | `gpt-4` | 目標群組。`{"model": "gpt-4o", "hidden": true}` 也會將別名從模型清單中隱藏 |
| 路由群組 | `routing_groups=[{"group_name": "fast", "models": [...]}]` | `fast` | 每個成員群組的部署，見[策略、路由群組與子路由器](strategies.md) |
| 萬用字元 | 一個 `model_name` 為 `openai/*` 的部署，見[萬用字元](#wildcards) | `openai/gpt-4o-mini` | 該部署，並將所請求的模型填入其參數 |
| 團隊公開名稱 | `model_info` 中的 `team_public_model_name`，見[團隊與存取](teams_and_access.md#team-deployments) | `my-gpt` | 該團隊的部署，供該團隊的成員使用 |
| 部署 id | `gpt-4o-eastus` | `gpt-4o-eastus` | 那一個部署，即使它正在冷卻 |
| 特定部署 | 一個部署的 `litellm_params.model` | `azure/gpt-4o`，搭配 `specific_deployment=True` | 其 litellm 模型恰好是該名稱的部署 |
| 其他任何名稱 | | `unknown-model` | 若有設定 `default_deployment` 則為它，否則為第一個 `default_fallbacks` 群組，否則為錯誤 |

## 順序 {#the-order}

檢查以固定順序執行，第一個符合者勝出。

![名稱如何依序解析：specific_deployment、部署 id、別名、路由群組、已設定的群組，然後是 litellm 模型名稱、
第一個 default_fallbacks 群組，或一個錯誤](../img/names-1.svg)

有兩條規則適用於每條路徑。子路由器標記部署，例如 `auto_router/...`，永遠不會被回傳，因為它們不是用來
被呼叫的。目前被存取時段為其他團隊保留的部署會被扣留，見[團隊與存取](teams_and_access.md)。

## 別名 {#aliases}

別名將一個名稱對應到一個模型群組。別名來自 router 的 `model_group_alias` 以及處理程序的模型別名
對照表，router 透過它的動態設定讀取後者。解析會在查詢其他任何東西之前，先將別名換成它的目標，因此
別名也可以指向一個路由群組。嘗試仍會向呼叫者回報所請求的名稱。

## 萬用字元 {#wildcards}

`model_name` 中含有 `*` 的部署，例如 `openai/*` 或 `anthropic/claude-*`，會服務它所比對到、且沒有任何模型群組主張的任何名稱。登錄表會將這些模式由最具體到最不具體排序，因此 `anthropic/claude-3-*`
會勝過 `anthropic/*`。比對到的部分會被代入部署的 `litellm_params.model`：一個帶有
`model_name: openai/*` 與 `model: openai/*` 的部署，服務對 `openai/gpt-4o-mini` 的請求時，會呼叫
`openai/gpt-4o-mini`。萬用字元只會針對不是已設定模型群組的名稱進行檢查，因此已設定的群組永遠會勝過
同樣比對到它的模式。沒有任何團隊萬用字元依原樣拼寫比對到的裸名，會以它的提供者前綴再試一次，因此
`gpt-4o-mini` 可以比對到某個團隊的 `openai/*`。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "openai/*", "litellm_params": {"model": "openai/*"}},
    ]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: openai/*
    litellm_params:
      model: openai/*
```

</TabItem>
</Tabs>

## 部署 id {#deployment-ids}

不是模型群組、但卻是部署 id 的名稱，會解析為那一個部署。router 即使在它冷卻時也會服務它，並略過策略，
因為沒有什麼可選的。這就是呼叫者將請求釘選到一個部署的方法。

## 預設部署與預設備援 {#default-deployment-and-default-fallbacks}

`default_deployment` 是一個服務任何其他東西都沒比對到的名稱的部署，並填入所請求的模型。沒有它時，
解析不到任何東西的名稱會嘗試 `default_fallbacks`，也就是萬用備援清單，並解析為它的第一個模型群組。
如果該清單也是空的，挑選會以一個錯誤失敗，該錯誤說明沒有為該模型設定任何部署。

## 結果 {#the-result}

解析會回傳三樣東西：部署、比對到的名稱種類，以及嘗試所回報的模型群組。對於別名或路由群組，該模型群組
就是所請求的名稱，因此標頭與記錄會顯示呼叫者所要求的內容，而部署則來自目標。[如何挑選一個部署](selection.md)
會從這裡接手。
