---
sidebar_label: "部署與模型群組"
description: "LiteLLM Router 的部署與模型群組是什麼、router 讀取哪些欄位，以及部署如何取得其身分。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 部署與模型群組 {#deployments-and-model-groups}

{/* keep-version-note */}

router 路由到的一切都是一個部署，而每個請求要求的都是一個名稱，它通常是一個模型群組。本頁說明這兩者、
列出 router 本身讀取的部署欄位，並展示部署如何取得其身分。

## 部署 {#deployment}

部署是一個可以服務模型的地方，例如 `eastus` 中的 Azure OpenAI 資源、某個 AWS 帳戶中的 Bedrock
模型，或 URL 背後的 vLLM 叢集。它是 `model_list` 的一個項目，SDK 使用者將它傳給 `Router()`，
proxy 使用者則在 `config.yaml` 中設定它。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "gpt-4o",  # the model group callers ask for
            "litellm_params": {  # the provider call's arguments
                "model": "azure/gpt-4o-eastus",
                "api_base": "https://eastus.example.openai.azure.com",
                "api_key": os.environ["AZURE_EASTUS_KEY"],
                "rpm": 600,
                "order": 1,
            },
            "model_info": {"id": "gpt-4o-eastus"},  # metadata about the deployment
        }
    ]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-4o            # the model group callers ask for
    litellm_params:               # the provider call's arguments
      model: azure/gpt-4o-eastus
      api_base: https://eastus.example.openai.azure.com
      api_key: os.environ/AZURE_EASTUS_KEY
      rpm: 600
      order: 1
    model_info:                   # metadata about the deployment
      id: gpt-4o-eastus
```

</TabItem>
</Tabs>

![一個部署與它的兩個部分：litellm_params，也就是提供者呼叫的引數；以及 model_info，也就是它的中繼資料](../img/deployments-and-model-groups-1.svg)

`litellm_params` 主要保存提供者呼叫的引數，當部署被挑選到時，router 會原封不動地將它們傳下去。
router 自己會讀取其中幾個。

| 欄位 | router 用它做什麼 |
| --- | --- |
| `weight`、`rpm`、`tpm` | `simple-shuffle` 權重，依此優先順序。`rpm` 與 `tpm` 也是供用量感知策略與呼叫前檢查使用的限制 |
| `order` | 群組內優先順序，最低者優先。見[如何挑選一個部署](selection.md) |
| `tags` | 當標籤篩選開啟時，它服務哪些帶標籤的請求 |
| `use_in_pass_through` | [直通路由](../../pass_through/intro.md)是否可以使用它 |
| `timeout`、`stream_timeout` | 嘗試的逾時，優先於 router 的逾時 |
| `max_parallel_requests` | 一次可以在它上面執行多少次嘗試 |

`model_info` 是中繼資料。router 會讀取誰可以使用該部署（`team_id`、`access_groups`、
`access_windows`、`ptu_shares`，見[團隊與存取](teams_and_access.md)）、管理員是否暫停了它
（`blocked`），以及它如何冷卻（`cooldown_time`、`allowed_fails`、`allowed_fails_policy`，見
[重試、備援與冷卻](reliability.md)）。其他一切都依原樣保存，並交回給讀取登錄表的呼叫者。

## 身分 {#identity}

`model_info.id` 是部署的身分。冷卻、失敗計數器、用量與健康結果全都以它為鍵，而變更集也依它取代或
刪除部署。當設定將它省略時，router 會用 `deployment_id()` 推導一個：對模型群組名稱以及每一個
`litellm_params` 鍵與值依序做 SHA-256。相同的設定在每個 worker 上都會得到相同的 id，這正是
worker 能共用路由狀態的原因。兩個 id 相同的項目都會留在群組中並共用該狀態，而依 id 查詢會回傳較晚的
那一個。

## 部署如何建構 {#how-a-deployment-is-built}

router 依順序由設定建構部署。對每個項目，它會解析 `os.environ/` 秘密參照、驗證該項目、解析服務它的
提供者，並記錄它。帶有 `organization` 清單的項目會變成每個組織一個部署。部署一旦被接受就加入登錄表，
因此較晚的項目會看到較早的項目，而錯誤會指向造成它的項目。建構失敗的項目會被略過，其餘的仍會建構。

![對每個 model_list 項目，router 會解析秘密、驗證該項目、找到提供者、記錄它，然後給它一個 id 並將它加入登錄表](../img/deployments-and-model-groups-2.svg)

## 模型群組 {#model-group}

模型群組是共用一個 `model_name` 的每一個部署。呼叫者要求的是群組，從不是部署，而 router 會在它
內部挑選一個部署。負載平衡、重試與冷卻都發生在一個群組內，而備援會將請求從一個群組移到另一個群組。

![一個對 gpt-4o 的請求到達有三個部署、兩種順序的 gpt-4o 模型群組，它備援到 claude-sonnet 模型群組](../img/deployments-and-model-groups-3.svg)

群組大小在幾個地方會改變行為。在只有一個部署的群組中：429 不會讓唯一的部署冷卻、驗證錯誤不會被重試，
而預設的錯誤率規則會放過那個孤單的部署，除非它看到了 1,000 個全部失敗的請求。這些規則存在，是因為讓
唯一的部署冷卻會使該群組的每個請求都失敗。[重試、備援與冷卻](reliability.md)有詳細說明。

## 登錄表 {#the-registry}

所有部署都住在登錄表中，它是 router 持有的不可變、已建立索引的快照。它依 id、模型群組、別名、萬用字元
模式與團隊建立索引，並帶有一個在每次變更時遞增的版本。變更會取代快照，因此已經讀取登錄表的請求，會在
變更落地期間保持一致的檢視。router 之外的程式碼透過 `router.registry()` 讀取它，並透過
`router.apply()` 變更它，見[進入點](../api_reference/entry_points.md)。
