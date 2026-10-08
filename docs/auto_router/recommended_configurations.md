---
title: 推薦設定
sidebar_label: 推薦設定
description: 將內建的 1M Context、Anthropic、OpenAI、Gemini 與 Lite 預設值整理為 config.yaml、這些設定所對應的公開基準測試配置，以及如何在它們之間選擇。
---

建議的梯級，與儀表板的 Auto Router 範本相符。每個層級都必須在同一個檔案中存在為 `model_name`；將提供者前綴或憑證替換為您自己的部署，router 項目就會保持不變。

| 梯級 | SIMPLE | MEDIUM | COMPLEX | REASONING | 分類器 |
| --- | --- | --- | --- | --- | --- |
| [1M Context](#1m-context) | gpt-5.6-luna | gpt-5.6-terra | gpt-5.6-sol | claude-opus-5, high effort | heuristic v2 |
| [Anthropic Family](#anthropic-family) | claude-haiku-4-5 | claude-sonnet-5 | claude-opus-5 | claude-opus-5, high effort | heuristic |
| [OpenAI Family](#openai-family) | gpt-5.6-luna | gpt-5.6-terra | gpt-5.6-sol | gpt-5.6-sol, xhigh effort | heuristic |
| [Gemini Family](#gemini-family) | gemini-2.5-flash-lite | gemini-3.1-flash-lite | gemini-3.7-flash | gemini-3.1-pro-preview | heuristic |
| [Lite](#lite) | deepseek-v4-flash | muse-spark-1.2, xhigh | kimi-k3, max | claude-opus-5 | LLM, agentic rubric |
| [Benchmark config](#the-benchmark-configuration) | claude-haiku-4-5 | claude-sonnet-5 | claude-opus-5 | claude-opus-5 | LLM, gpt-5.4-mini |
| [Production config](#the-production-configuration) | claude-haiku-4-5 | claude-haiku-4-5 | claude-sonnet-5 | claude-opus-5 | heuristic |

## 選擇梯級 {#choosing-a-ladder}

- **單一家族**：當用戶端依賴提供者特定行為（Anthropic 快取控制、OpenAI reasoning 參數）時。每個層級都維持在同一個 API 表面。
- **Lite**：當成本比提供者一致性更重要且流量是 agentic 時。混合提供者，使用帶有 `agentic` rubric 的 LLM 分類器。
- **1M Context**：適用於長提示。Luna、Terra、Sol，然後在高 effort 時用 Opus 5，搭配 heuristic v2 分類器。
- **相同模型，更多 effort**：適用於最上層。增加的是輸出 token 成本，而不是更高的每 token 費率。模式：[effort 梯級](/docs/proxy/auto_routing#effort-ladders)。
- 所有梯級都會關閉 `session_affinity`（預設；請參閱 [prompt caching](/docs/auto_router/prompt_caching)），並設定 `escalation_keywords: ["LITELLM ESCALATE"]`；當完全相同的片語出現時，會將請求提升一個層級。比對區分大小寫。

## Anthropic Family {#anthropic-family}

Haiku、Sonnet、Opus，然後在高 reasoning effort 時使用 Opus。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: claude-haiku-4-5
    litellm_params:
      model: anthropic/claude-haiku-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-sonnet-5
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-opus-5
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-opus-5-high
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY
      reasoning_effort: high

  - model_name: claude-auto
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-sonnet-5
          COMPLEX:   claude-opus-5
          REASONING: claude-opus-5-high
        classifier_type: heuristic
        escalation_keywords: ["LITELLM ESCALATE"]
        session_affinity: false
      complexity_router_default_model: claude-sonnet-5
```

如果 Claude Code 或 Claude Desktop 需要發現它，請在 router 名稱中保留 `claude`。請參閱 [管理員設定](/docs/auto_router/setup#claude-code-and-claude-desktop)。

## OpenAI Family {#openai-family}

Luna、Terra、Sol，然後在 xhigh reasoning effort 時使用 Sol。

```yaml title="config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-5.6-sol
    litellm_params:
      model: openai/gpt-5.6-sol
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-5.6-sol-xhigh
    litellm_params:
      model: openai/gpt-5.6-sol
      api_key: os.environ/OPENAI_API_KEY
      reasoning_effort: xhigh

  - model_name: gpt-auto
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    {{openai_small}}
          MEDIUM:    {{openai_large}}
          COMPLEX:   gpt-5.6-sol
          REASONING: gpt-5.6-sol-xhigh
        classifier_type: heuristic
        escalation_keywords: ["LITELLM ESCALATE"]
        session_affinity: false
      complexity_router_default_model: {{openai_large}}
```

## Gemini Family {#gemini-family}

Flash Lite 2.5、Flash Lite 3.1、Flash 3.7，然後是 Pro 3.1。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: gemini-2.5-flash-lite
    litellm_params:
      model: gemini/gemini-2.5-flash-lite
      api_key: os.environ/GEMINI_API_KEY
  - model_name: gemini-3.1-flash-lite
    litellm_params:
      model: gemini/gemini-3.1-flash-lite
      api_key: os.environ/GEMINI_API_KEY
  - model_name: gemini-3.7-flash
    litellm_params:
      model: gemini/gemini-3.7-flash
      api_key: os.environ/GEMINI_API_KEY
  - model_name: gemini-3.1-pro-preview
    litellm_params:
      model: gemini/gemini-3.1-pro-preview
      api_key: os.environ/GEMINI_API_KEY

  - model_name: gemini-auto
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    gemini-2.5-flash-lite
          MEDIUM:    gemini-3.1-flash-lite
          COMPLEX:   gemini-3.7-flash
          REASONING: gemini-3.1-pro-preview
        classifier_type: heuristic
        escalation_keywords: ["LITELLM ESCALATE"]
        session_affinity: false
      complexity_router_default_model: gemini-3.1-flash-lite
```

## Lite {#lite}

跨提供者，以成本為導向。DeepSeek V4 Flash 也可作為 LLM 分類器，採用 `agentic` rubric，並使用零輪次上下文視窗。

```yaml title="config.yaml"
model_list:
  - model_name: deepseek-v4-flash
    litellm_params:
      model: deepseek/deepseek-v4-flash
      api_key: os.environ/DEEPSEEK_API_KEY
  - model_name: muse-spark-1.2-xhigh
    litellm_params:
      model: meta/muse-spark-1.2
      api_key: os.environ/META_API_KEY
      reasoning_effort: xhigh
  - model_name: kimi-k3-max
    litellm_params:
      model: moonshot/kimi-k3
      api_key: os.environ/MOONSHOT_API_KEY
      reasoning_effort: max
  - model_name: {{anthropic_large}}
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: lite-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    deepseek-v4-flash
          MEDIUM:    muse-spark-1.2-xhigh
          COMPLEX:   kimi-k3-max
          REASONING: {{anthropic_large}}
        classifier_type: llm
        classifier_llm_config:
          model: deepseek-v4-flash
          timeout_ms: 3000
          classification_rubric: agentic
        classifier_context_window_size: 0
        escalation_keywords: ["LITELLM ESCALATE"]
        session_affinity: false
      complexity_router_default_model: muse-spark-1.2-xhigh
```

## 1M Context {#1m-context}

Luna、Terra、Sol，然後在高 reasoning effort 時使用 Opus 5。使用 heuristic v2 分類器，因此分類不會增加任何 LLM 請求。

GPT 層級最多可接受 922K 輸入 token，而 Opus 5 可接受 1M。router 會將超出大小的提示移到具備容量的下一個最低較高層級。請參閱 [context-window escalation](/docs/proxy/auto_routing#context-window)。

```yaml title="config.yaml"
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-5.6-sol
    litellm_params:
      model: openai/gpt-5.6-sol
      api_key: os.environ/OPENAI_API_KEY
  - model_name: claude-opus-5-high
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY
      reasoning_effort: high

  - model_name: 1m-auto
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    {{openai_small}}
          MEDIUM:    {{openai_large}}
          COMPLEX:   gpt-5.6-sol
          REASONING: claude-opus-5-high
        classifier_type: heuristic_v2
        escalation_keywords: ["LITELLM ESCALATE"]
        session_affinity: false
      complexity_router_default_model: {{openai_large}}
```

## 基準測試設定 {#the-benchmark-configuration}

- [Terminal-Bench](/blog/auto-router-terminal-bench-benchmark)：Opus-5 solve rate 低 27% 成本，這個設定，gpt-5.4-mini 分類器只讀取目前訊息。
- [Cost and quality](/blog/auto-router-cost-quality-benchmark) 與 [prompt caching](/blog/auto-router-prompt-caching-benchmark)：相同層級，heuristic 分類器。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: claude-haiku-4-5
    litellm_params:
      model: anthropic/claude-haiku-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-sonnet-5
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-opus-5
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gpt-5.4-mini
    litellm_params:
      model: openai/gpt-5.4-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-sonnet-5
          COMPLEX:   claude-opus-5
          REASONING: claude-opus-5
        classifier_type: llm
        classifier_llm_config:
          model: gpt-5.4-mini
        classifier_context_window_size: 0
      complexity_router_default_model: claude-sonnet-5
```

分類器上下文視窗是您自己流量最值得重新檢視的調整旋鈕：

- Terminal-Bench：最近 3 則使用者訊息讓 solve rate 從 66.7% 提升到 76.2%，成本增加 44%。assistant 回覆會讓兩者都更差。
- 聊天流量（[v1.97 measurements](/blog/auto-router-context-and-benchmarks)）：先前輪次讓後續回應一致率從 14% 提升到 78%。
- 已發布的預設值：3 則使用者輪次，不含 assistant 輪次。

## Production config {#the-production-configuration}

- 報告 51.1% 節省的 [production case study](/blog/auto-router-production-savings)。
- Haiku 同時處理 SIMPLE 與 MEDIUM；Opus 保留給 REASONING。
- 95% 的請求從未到達旗艦層級。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: claude-haiku-4-5
    litellm_params:
      model: anthropic/claude-haiku-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-sonnet-5
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-opus-5
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-auto-latest
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-haiku-4-5
          COMPLEX:   claude-sonnet-5
          REASONING: claude-opus-5
      complexity_router_default_model: claude-haiku-4-5
```

## 具備負載平衡的 coding agents {#coding-agents-with-load-balancing}

- 適用於其後方有多個部署的層級，例如 Anthropic 與 Bedrock 上的相同 Claude model。
- `session_affinity` 會將該層級鎖定於該 session；`deployment_affinity` 加上 `prompt_caching` 的 pre-call 檢查會將具備快取的部署鎖定。
- 這兩者對 agent 流量都很重要。細節：[Session affinity](/docs/proxy/auto_routing#session-affinity)。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: claude-haiku-4-5
    litellm_params:
      model: anthropic/claude-haiku-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-sonnet-5
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-sonnet-5
    litellm_params:
      model: bedrock/us.anthropic.claude-sonnet-5
      aws_region_name: us-east-1
  - model_name: claude-opus-5
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-auto
    litellm_params:
      model: auto_router/complexity_router
      cache_control_injection_points:
        - location: message
          role: system
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-sonnet-5
          COMPLEX:   claude-sonnet-5
          REASONING: claude-opus-5
        session_affinity: true
        session_affinity_ttl_seconds: 3600
      complexity_router_default_model: claude-sonnet-5

router_settings:
  optional_pre_call_checks: ["deployment_affinity", "session_affinity", "prompt_caching"]
  deployment_affinity_ttl_seconds: 3600
```
