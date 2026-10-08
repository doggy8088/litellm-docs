---
slug: auto-router-encrypted-content-routing
title: "Auto-Router：在不發生加密內容失敗的情況下切換層級"
date: 2026-09-18T10:00:00
authors:
  - tin
description: "LiteLLM 如何安全地從跨層後續請求中移除無法解密的加密推理，讓 Auto-Router 能持續路由請求"
keywords: [auto router, 加密內容, Responses API, 推理, 路由, LiteLLM]
tags: [routing, complexity-router, responses-api, engineering]
hide_table_of_contents: false
---

Auto-Router 可以在請求從簡單工作變成較困難的任務時，在不同層級之間移動對話。Responses API 用戶端可能會讓這種切換變得困難，因為先前的回應可能包含只有建立它的部署才能解密的加密推理內容

LiteLLM 現在會保留可讀的歷史記錄，並移除新選定層級無法驗證的加密推理。請求可以繼續送往所選模型，而不是因為 `invalid_encrypted_content` 而失敗

這項修正已包含在 LiteLLM `v1.102.x` 發行線，並已合併於 [PR #40280](https://github.com/BerriAI/litellm/pull/40280)

{/* truncate */}

## 為什麼在切換層級後加密推理區塊會失敗 {#why-encrypted-reasoning-blocks-fail-after-a-tier-change}

Responses API 的推理項目可能包含 `encrypted_content` 欄位，以及像 `rs_...` 這樣的項目 ID。提供者會將該負載綁定到建立它的組織、API 金鑰或加密邊界。後續請求若將該項目帶到不同的邊界，雖然可以送達提供者，但提供者無法驗證它

Auto-Router 讓這種情況比固定的模型路由更常見。某一回合可能會走向 SIMPLE 層級中的快速模型。下一回合可能會被分類為 COMPLEX，並選擇不同的模型群組。如果後續請求包含第一回合的推理內容，將加密負載轉送到第二個群組就會產生上游錯誤

廣泛的工作階段或部署親和性會透過固定比對話所需更多的流量來避免此錯誤。它也會阻止 Auto-Router 在請求需要不同模型時切換層級

## 路由決策 {#the-routing-decision}

啟用 `encrypted_content_affinity` 的前置呼叫檢查，並搭配您的 Auto-Router 設定

```yaml
router_settings:
  optional_pre_call_checks:
    - encrypted_content_affinity

model_list:
  - model_name: sonnet-standard
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: opus
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: production-auto-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        classifier_type: heuristic
        tiers:
          SIMPLE:
            - model_name: sonnet-standard
          COMPLEX:
            - model_name: opus
```

當 LiteLLM 看到已追蹤的加密項目時，會先尋找建立它的部署。如果該部署可用，LiteLLM 會將此請求固定到該部署。如果另一個健康的部署共用相同的加密邊界，LiteLLM 可以使用該對等部署

如果來源部署屬於不同的路由群組，LiteLLM 會移除無法解密的加密推理，並回傳所選群組的健康部署。Auto-Router 會維持其層級決策

同一群組內暫時不可用的部署會沿用既有的快速失敗行為。LiteLLM 不會將加密項目送往無法提供服務的同群組部署，也不會透過跨層重寫來隱藏冷卻期間

## LiteLLM 會移除什麼 {#what-litellm-removes}

LiteLLM 會在派送前修改請求，並在所選部署無法解密時，從推理項目中移除 `encrypted_content` 與 `id`。它會保留可讀的 `summary` 或 `content` 欄位，讓所選模型仍能看到回應歷史

如果推理項目沒有可讀的摘要或內容，LiteLLM 會移除該項目。其他輸入項目，包括使用者訊息與一般 assistant 訊息，仍會保留在請求中

範例而言，跨層後續請求會從這樣：

```json
{
  "type": "reasoning",
  "id": "rs_previous_deployment_item",
  "encrypted_content": "opaque-provider-payload",
  "summary": [
    {"type": "summary_text", "text": "The request needs a larger model"}
  ]
}
```

在派送前變成這樣：

```json
{
  "type": "reasoning",
  "summary": [
    {"type": "summary_text", "text": "The request needs a larger model"}
  ]
}
```

LiteLLM 會將相同的邊界檢查套用到已橋接的 Anthropic thinking 區塊。當橋接偵測到來自其他路由的加密推理時，它會丟棄該 thinking 區塊，而不是轉送提供者會拒絕的外部或未簽署簽章

## 為什麼這能讓 Auto-Router 保持可用 {#why-this-keeps-auto-router-useful}

此檢查只會固定需要原始加密邊界的請求。一般請求會繼續透過已設定的路由策略，而跨層後續請求可以到達針對目前請求所選定的層級

這讓 Auto-Router 有兩條安全路徑。當所選部署可以驗證加密推理時，它會保留加密推理。對於跨層 Responses 請求，它會保留可讀摘要並移除由提供者綁定的負載。對於已橋接的 Anthropic thinking，它會在派送前丟棄外來的加密區塊

此行為位於加密內容的前置呼叫檢查與 Responses 請求工具中。相關實作與回歸涵蓋可見於 [親和性檢查](https://github.com/BerriAI/litellm/blob/main/litellm/router_utils/pre_call_checks/encrypted_content_affinity_check.py)、[Responses 請求工具](https://github.com/BerriAI/litellm/blob/main/litellm/responses/utils.py) 與 [路由測試](https://github.com/BerriAI/litellm/blob/main/tests/test_litellm/router_utils/pre_call_checks/test_encrypted_content_affinity_check.py)

如需完整設定與部署親和性行為，請參閱 [Responses API 加密內容親和性指南](https://docs.litellm.ai/docs/response_api#encrypted-content-affinity-multi-region-load-balancing)
