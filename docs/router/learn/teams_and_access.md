---
sidebar_label: "團隊與存取"
description: "LiteLLM Router 如何對每個請求套用團隊部署、存取群組、存取時段與 PTU 份額。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 團隊與存取 {#teams-and-access}

{/* keep-version-note */}

proxy 從一個 router 服務許多團隊，而並非每個部署都是給每個人用的。四條規則決定呼叫者可以使用某個
模型群組的哪些部署。它們全都在解析期間與解析之後立即執行，在任何健康或負載篩選器之前，因此呼叫者不可
使用的部署，永遠不會出現在呼叫者的候選、錯誤或備援中。

![解析出的部署依序通過存取時段、存取群組、團隊部署與 PTU 份額，然後才到健康與負載篩選器](../img/teams-and-access-1.svg)

呼叫者事實隨請求一起進來：`team_id`、呼叫者是否為 proxy 管理員，以及金鑰與團隊可以使用的模型。
proxy 會從發出請求的金鑰填入它們。

## 團隊部署 {#team-deployments}

帶有 `model_info.team_id` 的部署屬於一個團隊。只有帶著該團隊 id 的請求可以使用它，其他所有人的
挑選都會略過它。團隊部署也可以帶有 `model_info.team_public_model_name`，也就是團隊成員稱呼它的
名稱。來自該團隊成員、對該名稱的請求，會解析為團隊的部署，即使沒有任何模型群組有那個名稱。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "team-a-gpt-4o-ft",  # the internal group name
            "litellm_params": {"model": "azure/ft-gpt-4o-team-a"},
            "model_info": {
                "team_id": "team-a",
                "team_public_model_name": "gpt-4o",  # what the team asks for
            },
        }
    ]
)

# The SDK has no keys, so the caller states its team on each request.
await router.acompletion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "hi"}],
    metadata={"user_api_key_team_id": "team-a"},
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
- model_name: team-a-gpt-4o-ft          # the internal group name
  litellm_params: {model: azure/ft-gpt-4o-team-a, ...}
  model_info:
    team_id: team-a
    team_public_model_name: gpt-4o      # what team-a's members ask for
```

proxy 會從呼叫者的虛擬金鑰取得團隊。

</TabItem>
</Tabs>

當所請求的模型群組同時有團隊部署與共用部署時，呼叫者自己團隊的部署會排在前面。沒有團隊的 proxy
管理員可以依名稱到達團隊部署，只要它們全都屬於一個團隊。如果它們屬於好幾個團隊，挑選會失敗，因為
無法分辨指的是哪個團隊。

## 存取群組 {#access-groups}

`model_info.access_groups` 列出部署所屬的存取群組。可以給予金鑰或團隊某個存取群組的存取權，
而不是模型名稱。當呼叫者只能透過存取群組到達所請求的模型時，router 會將呼叫者限制在那些群組中的
部署。因此，兩把都「有 gpt-4o」的金鑰，可能會被送到它的不同部署。

## 存取時段 {#access-windows}

`model_info.access_windows` 會在每日的實際時鐘時段內，將一個部署保留給某些團隊，例如一個團隊在
其營業時間內擁有的預配部署。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
deployment = {
    "model_name": "gpt-4o",
    "litellm_params": {"model": "azure/gpt-4o-reserved"},
    "model_info": {
        "access_windows": [
            {
                "start": "09:00",
                "end": "17:00",
                "timezone": "America/New_York",
                "team_ids": ["team-a"],
            }
        ]
    },
}
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_info:
  access_windows:
    - start: "09:00"
      end: "17:00"
      timezone: America/New_York
      team_ids: [team-a]
```

</TabItem>
</Tabs>

當某個時段作用中時，不在其 `team_ids` 內的呼叫者不會看到該部署。在時段之外，每個人都看得到。當
一個群組的所有部署目前都被保留給其他人時，挑選會以一個指出該時段的錯誤失敗，而不是一般的「沒有部署」。

## PTU 份額 {#ptu-shares}

`model_info.ptu_shares` 將一個預配部署在團隊之間拆分，形式是團隊 id 對應到整數 PTU 數的對照表。
它還需要 `ptu_count`、`cost_per_ptu_per_hour` 與 `ptu_effective_from`，否則部署會驗證失敗。
帶有份額的部署只服務持有份額的團隊。在該群組的任何部署上持有份額的團隊，會被限制在那些部署上，
而沒有份額的團隊只會看到未被拆分的部署。

<Tabs groupId="router-config">
<TabItem value="sdk" label="SDK">

```python
deployment = {
    "model_name": "gpt-4o",
    "litellm_params": {"model": "azure/gpt-4o-ptu"},
    "model_info": {
        "ptu_count": 150,
        "cost_per_ptu_per_hour": 1.0,
        "ptu_effective_from": "2026-01-01T00:00:00Z",
        "ptu_shares": {"team-a": 100, "team-b": 50},
    },
}
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params: {model: azure/gpt-4o-ptu, ...}
    model_info:
      ptu_count: 150
      cost_per_ptu_per_hour: 1.0
      ptu_effective_from: "2026-01-01T00:00:00Z"
      ptu_shares:
        team-a: 100
        team-b: 50
```

</TabItem>
</Tabs>

## 備援遵守相同規則 {#fallbacks-respect-the-same-rules}

備援到另一個模型群組時，會為同一個呼叫者解析目標名稱，因此相同規則也適用於目標。在跨群組備援之前，
router 還會檢查這個呼叫者是否完全可以使用目標群組，以及其預算是否允許（`fallback_access_check`
與 `fallback_budget_check`）。呼叫者不可使用的目標會被略過，見[重試、備援與冷卻](reliability.md)。
