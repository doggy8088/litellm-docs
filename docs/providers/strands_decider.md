---
title: "透過 LiteLLM 使用 Strands Decider 模型"
sidebar_label: "Strands Decider"
description: "在 LiteLLM 的 /v1/decisions 與 /v1/systemone 路由後方提供 Strands Decider 模型：proxy 設定、SDK 呼叫、成本追蹤與 Auto Router 用法。"
---

# Strands Decider {#strands-decider}

[Strands Decider](https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19) 是一個在您自己的伺服器上執行的小型決策模型。它不生成文字。它會針對輸入回答具型別的問題，例如是非題、從固定選項清單中選一個，或量表上的等級，並為每個答案給出校準後的機率。LiteLLM 透過[決策路由](../decisions.md)提供它：`/v1/decisions` 用於 OpenAI Decisions 格式，`/v1/systemone` 用於 System One 格式。

| 屬性 | 詳細資訊 |
|----------|---------|
| LiteLLM 上的提供者路由 | `strands_decider/` |
| 模型 | `strands_decider/strands-decider-2B-hobson-v19` |
| LiteLLM 端點 | `/v1/decisions`, `/v1/systemone` |
| 問題類型 | `predicate` 或 `noul`、`choice`、`score` |
| 圖片輸入 | 否 |
| LiteLLM 中的價格 | 每 token $0 |

在 `1.104.x` 系列中，自 `v1.104.2` 起提供；在 `v1.105.0-rc.3` 及後續版本中也提供。`v1.106.0-dev.1` 沒有 `/v1/systemone` 路由，而是在 `/v1/decisions` 接受 System One 格式，因此在該版本中，請將 [/v1/systemone](#v1systemone) 的請求主體傳送至 `/v1/decisions`，並呼叫 `litellm.decisions` 時以 `state` 取代 `input`。

## 提供模型 {#serve-the-model}

安裝 `strands-decider` 套件並啟動其 HTTP 伺服器。首次啟動會從 Hugging Face 下載權重。

```bash
pip install strands-decider
strands-decider serve StrandsAgents/strands-decider-2B-hobson-v19 --port 8000
```

未指定 `--device` 時，伺服器會依序選用 CUDA、MPS、CPU。傳入 `--device cuda`、`--device mps` 或 `--device cpu` 可指定其中之一。在 Apple silicon 上，先執行 `pip install 'strands-decider[mlx]'`，再以 `--device mlx` 在 MLX 上執行模型。

`strands-decider-2B-hobson-v21` 檢查點的運作方式相同。改提供該檢查點，並將下方範例中的 `model` 設為 `strands_decider/strands-decider-2B-hobson-v21`。

伺服器綁定於 `127.0.0.1` 且沒有驗證機制，其模型卡也說明它用於本機實驗。請盡可能在同一台機器上執行 LiteLLM。當 LiteLLM 在容器或其他機器上執行時，請讓伺服器維持在 `127.0.0.1`，置於會檢查 bearer token 的反向代理後方，並將 `STRANDS_DECIDER_API_KEY` 設為該 token。`--host` 可變更伺服器綁定的位址，但任何能連到該位址的一方都能在沒有 token 的情況下呼叫伺服器。

確認伺服器有回應。

```bash
curl -s localhost:8000/v1/systemone -H 'content-type: application/json' -d '{
  "state": "Help! My payouts have been failing for 3 days!",
  "questions": {"is_urgent": {"type": "noul", "instructions": "Does this convey urgency?"}}
}'
```

```json
{
  "model": "strands-decider-2B-hobson-v19",
  "answers": {"is_urgent": {"type": "noul", "noul": 0.8287}},
  "usage": {"input_tokens": 86, "output_tokens": 1},
  "latency_ms": 1651.63
}
```

## 環境變數 {#environment-variables}

| 變數 | 是否必填 | 值 |
|----------|----------|-------|
| `STRANDS_DECIDER_API_BASE` | 是，或設定 `api_base` | 伺服器 base URL |
| `STRANDS_DECIDER_API_KEY` | 否 | Bearer token |

將 `STRANDS_DECIDER_API_BASE` 設為伺服器的 base URL，不含 `/v1/systemone`，例如 `http://127.0.0.1:8000`。LiteLLM 會移除結尾的 `/` 或 `/v1` 並加上 `/v1/systemone`，因此 `http://127.0.0.1:8000/v1` 會連到同一條路由。

Strands Decider 沒有預設主機，因此請設定 `STRANDS_DECIDER_API_BASE` 或傳入 `api_base`。兩者皆未設定時，LiteLLM 會回應 `400`，訊息為 `api_base is required for Decisions provider 'strands_decider'`，且不會呼叫伺服器。

LiteLLM 只有在設定了 `STRANDS_DECIDER_API_KEY` 或 `api_key` 時，才會傳送 `Authorization: Bearer <key>`，否則不會傳送 `Authorization` 標頭。`strands-decider serve` 沒有驗證機制，因此只有在伺服器前方有元件會檢查金鑰時，才需要設定它。

## Proxy 設定 {#proxy-setup}

1. 將模型加入 `config.yaml`。

```yaml showLineNumbers
model_list:
  - model_name: strands-decider
    litellm_params:
      model: strands_decider/strands-decider-2B-hobson-v19
      api_base: os.environ/STRANDS_DECIDER_API_BASE
```

2. 啟動 proxy。

```bash showLineNumbers
export STRANDS_DECIDER_API_BASE=http://127.0.0.1:8000
litellm --config config.yaml
```

## /v1/decisions {#v1decisions}

以 OpenAI Decisions 格式，各問一個每種類型的問題。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/decisions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "strands-decider",
  "input": "Help! My payouts have been failing for 3 days!",
  "questions": [
    {"type": "predicate", "name": "is_urgent", "instructions": "Does this convey urgency?"},
    {
      "type": "choice",
      "name": "team",
      "instructions": "Which team should handle this?",
      "choices": [
        {"value": "billing", "description": "payments, payouts and invoices"},
        {"value": "sales", "description": "new plans and upgrades"},
        {"value": "retail", "description": "in-store orders"}
      ]
    },
    {
      "type": "score",
      "name": "frustration",
      "instructions": "How frustrated is the writer?",
      "levels": [{"label": "calm"}, {"label": "frustrated"}, {"label": "angry"}]
    }
  ]
}'
```

回應

```json
{
  "model": "strands-decider-2B-hobson-v19",
  "answers": [
    {"type": "predicate", "name": "is_urgent", "probability": 0.8287},
    {
      "type": "choice",
      "name": "team",
      "choice": "billing",
      "probabilities": [
        {"value": "billing", "probability": 0.97},
        {"value": "sales", "probability": 0.0201},
        {"value": "retail", "probability": 0.0099}
      ],
      "confidence": 0.955
    },
    {
      "type": "score",
      "name": "frustration",
      "score": 1.2867,
      "probabilities": [
        {"value": 0, "label": "calm", "probability": 0.1335},
        {"value": 1, "label": "frustrated", "probability": 0.4463},
        {"value": 2, "label": "angry", "probability": 0.4202}
      ],
      "confidence": 0.4583
    }
  ],
  "usage": {
    "input_tokens": 211,
    "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0},
    "output_tokens": 3,
    "output_tokens_details": {"reasoning_tokens": 0},
    "total_tokens": 214
  }
}
```

## /v1/systemone {#v1systemone}

以 System One 格式問相同的問題。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "strands-decider",
  "state": "Help! My payouts have been failing for 3 days!",
  "questions": {
    "is_urgent": {"type": "noul", "instructions": "Does this convey urgency?"},
    "team": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "payments, payouts and invoices",
        "sales": "new plans and upgrades",
        "retail": "in-store orders"
      }
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated is the writer?",
      "criteria": ["calm", "frustrated", "angry"]
    }
  }
}'
```

回應

```json
{
  "model": "strands-decider-2B-hobson-v19",
  "answers": {
    "is_urgent": {"type": "noul", "noul": 0.8287},
    "team": {
      "type": "choice",
      "choice": "billing",
      "confidence": 0.955,
      "probabilities": {"billing": 0.97, "sales": 0.0201, "retail": 0.0099}
    },
    "frustration": {
      "type": "score",
      "score": 1.2867,
      "confidence": 0.4583,
      "legend": {"0": "calm", "1": "frustrated", "2": "angry"},
      "probabilities": {"0": 0.1335, "1": 0.4463, "2": 0.4202}
    }
  },
  "usage": {"input_tokens": 211, "output_tokens": 3},
  "latency_ms": 5118.34
}
```

伺服器會加上 `latency_ms`，LiteLLM 會在 `/v1/systemone` 上將其透傳。

## SDK {#sdk}

從 Python 呼叫伺服器時，OpenAI Decisions 格式使用 `litellm.decisions`，System One 格式使用 `litellm.systemone`。`litellm.systemone` 在 `1.104.x` 系列中自 `v1.104.3` 起提供，在 `1.105.x` 系列中自 `v1.105.0` 起提供，並在 `v1.106.0-rc.1` 及後續版本中提供。[SDK 用法](../decisions.md#sdk-usage)涵蓋非同步版本與其他參數。

```python showLineNumbers title="OpenAI Decisions format"
import os
import litellm

os.environ["STRANDS_DECIDER_API_BASE"] = "http://127.0.0.1:8000"

response = litellm.decisions(
    model="strands_decider/strands-decider-2B-hobson-v19",
    input="Help! My payouts have been failing for 3 days!",
    questions=[
        {"type": "predicate", "name": "is_urgent", "instructions": "Does this convey urgency?"},
    ],
)
print(response.answers[0].probability)
```

```python showLineNumbers title="System One format"
import os
import litellm

os.environ["STRANDS_DECIDER_API_BASE"] = "http://127.0.0.1:8000"

response = litellm.systemone(
    model="strands_decider/strands-decider-2B-hobson-v19",
    state="Help! My payouts have been failing for 3 days!",
    questions={
        "is_urgent": {"type": "noul", "instructions": "Does this convey urgency?"},
    },
)
print(response.answers["is_urgent"].noul)
```

對於此輸入，兩者都會印出 `0.8287`。

## 成本追蹤 {#cost-tracking}

LiteLLM 成本表將 `strands_decider/strands-decider-2B-hobson-v19` 的價格定為每個輸入與輸出 token $0，因為伺服器由您自行付費。它是成本表中唯一的 Strands Decider 模型，proxy 會將對其他檢查點的呼叫以 $0 記錄。若要追蹤伺服器對您的實際成本，請在部署的 `model_info` 下設定 `input_cost_per_token` 與 `output_cost_per_token`，如[自訂定價](../proxy/custom_pricing.md#cost-per-token-eg-azure)所示。

## 將它用作 Auto Router 分類器 {#use-it-as-the-auto-router-classifier}

Strands Decider 可以在 LiteLLM Auto Router 中為每個請求挑選模型層級。將上方的部署加入 `model_list`，並把路由器 `opensource_classifier_config` 中的 `deployment_name` 設為其 `model_name`，如[使用已部署的決策模型](../auto_router/decision_classifiers.md#use-a-deployed-decision-model)所示。在 `1.104.x` 系列中自 `v1.104.3` 起提供，在 `1.105.x` 系列中自 `v1.105.0` 起提供，並在 `v1.106.0-rc.1` 及後續版本中提供。在 CPU 上執行的伺服器可能需要遠超過分類器預設 3000 ms 的逾時時間，因此請在暖機後測量幾個請求到您伺服器的時間，並將 `timeout_ms` 設為高於該時間。如該範例使用 `classifier_fallback: default_model` 時，`x-litellm-complexity-router-cause` 回應標頭在分類器有回答時為 `jev_classifier`，沒有回答時為 `default_model_fallback`。
