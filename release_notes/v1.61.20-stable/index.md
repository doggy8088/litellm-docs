---
title: v1.61.20-stable
slug: v1.61.20-stable
date: 2025-03-01T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [llm translation, rerank, ui, thinking, reasoning_content, claude-3-7-sonnet]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

# v1.61.20-穩定版 {#v16120-stable}

這些是自 `v1.61.13-stable` 以來的變更。

此版本主要著重於：
- LLM 翻譯改善（claude-3-7-sonnet + 'thinking'/'reasoning_content' 支援）
- UI 改善（新增模型流程、使用者管理等）

## 示範實例 {#demo-instance}

這裡有一個示範實例可供測試變更：
- 實例：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## 新模型 / 已更新模型 {#new-models--updated-models}

1. Anthropic 3-7 sonnet 支援 + 成本追蹤（Anthropic API + Bedrock + Vertex AI + OpenRouter） 
    1. Anthropic API [從這裡開始](https://docs.litellm.ai/docs/providers/anthropic#usage---thinking--reasoning_content)
    2. Bedrock API [從這裡開始](https://docs.litellm.ai/docs/providers/bedrock#usage---thinking--reasoning-content)
    3. Vertex AI API [請見這裡](../../docs/providers/vertex#usage---thinking--reasoning_content)
    4. OpenRouter [請見這裡](https://github.com/BerriAI/litellm/blob/ba5bdce50a0b9bc822de58c03940354f19a733ed/model_prices_and_context_window.json#L5626)
2. Gpt-4.5-preview 支援 + 成本追蹤 [請見這裡](https://github.com/BerriAI/litellm/blob/ba5bdce50a0b9bc822de58c03940354f19a733ed/model_prices_and_context_window.json#L79)
3. Azure AI - Phi-4 成本追蹤 [請見這裡](https://github.com/BerriAI/litellm/blob/ba5bdce50a0b9bc822de58c03940354f19a733ed/model_prices_and_context_window.json#L1773)
4. Claude-3.5-sonnet - Anthropic API 上的視覺支援已更新 [請見這裡](https://github.com/BerriAI/litellm/blob/ba5bdce50a0b9bc822de58c03940354f19a733ed/model_prices_and_context_window.json#L2888)
5. Bedrock llama 視覺支援 [請見這裡](https://github.com/BerriAI/litellm/blob/ba5bdce50a0b9bc822de58c03940354f19a733ed/model_prices_and_context_window.json#L7714)
6. Cerebras llama3.3-70b 定價 [請見這裡](https://github.com/BerriAI/litellm/blob/ba5bdce50a0b9bc822de58c03940354f19a733ed/model_prices_and_context_window.json#L2697)

## LLM 翻譯 {#llm-translation}

1. Infinity Rerank - 支援在 return_documents=True 時回傳文件 [從這裡開始](../../docs/providers/infinity#usage---returning-documents)
2. Amazon Deepseek - 將 `<think>` 參數擷取至 ‘reasoning_content’ [從這裡開始](https://docs.litellm.ai/docs/providers/bedrock#bedrock-imported-models-deepseek-deepseek-r1)
3. Amazon Titan Embeddings - 從請求主體中過濾掉 ‘aws_’ 參數 [從這裡開始](https://docs.litellm.ai/docs/providers/bedrock#bedrock-embedding)
4. Anthropic ‘thinking’ + ‘reasoning_content’ 翻譯支援（Anthropic API、Bedrock、Vertex AI）  [從這裡開始](https://docs.litellm.ai/docs/reasoning_content)
5. VLLM - 支援 ‘video_url’ [從這裡開始](../../docs/providers/vllm#send-video-url-to-vllm)
6. 透過 litellm SDK 呼叫 proxy：支援 embedding、image_generation、transcription、speech、rerank 的 `litellm_proxy/` [從這裡開始](https://docs.litellm.ai/docs/providers/litellm_proxy)
7. OpenAI Pass-through - 允許在 /openai pass through 路由上使用 Assistants GET、DELETE [從這裡開始](https://docs.litellm.ai/docs/pass_through/openai_passthrough)
8. 訊息翻譯 - 修正 assistant 訊息在缺少 role 時的 openai message - openai 允許此情況
9. O1/O3 - 支援 o3-mini 與 o1 parallel_tool_calls 參數的 ‘drop_params’（目前不支援） [請見這裡](https://docs.litellm.ai/docs/completion/drop_params)

## 支出追蹤改善 {#spend-tracking-improvements}

1. 透過 Bedrock 的 rerank 成本追蹤 [請見 PR](https://github.com/BerriAI/litellm/commit/b682dc4ec8fd07acf2f4c981d2721e36ae2a49c5)
2. Anthropic pass-through - 修正導致成本無法被追蹤的競態條件 [請見 PR](https://github.com/BerriAI/litellm/pull/8874)
3. Anthropic pass-through：確保準確的 token 計數 [請見 PR](https://github.com/BerriAI/litellm/pull/8880)

## 管理端點 / UI {#management-endpoints--ui}

1. 模型頁面 - 允許依「建立時間」排序模型
2. 模型頁面 - 編輯模型流程改善
3. 模型頁面 - 修正於 UI 新增 Azure、Azure AI Studio 模型
4. 內部使用者頁面 - 允許在 UI 批次新增內部使用者
5. 內部使用者頁面 - 允許依「建立時間」排序使用者
6. 虛擬金鑰頁面 - 在將使用者指派給團隊時，允許在下拉選單中搜尋 UserIDs [請見 PR](https://github.com/BerriAI/litellm/pull/8844)
7. 虛擬金鑰頁面 - 在將金鑰指派給使用者時，允許建立使用者 [請見 PR](https://github.com/BerriAI/litellm/pull/8844)
8. 模型中心頁面 - 修正文字溢位問題 [請見 PR](https://github.com/BerriAI/litellm/pull/8749)
9. 管理員設定頁面 - 允許在 UI 新增 MSFT SSO
10. 後端 - 不允許在 DB 中建立重複的內部使用者

## Helm {#helm}

1. 在 migration job 上支援 ttlSecondsAfterFinished - [請見 PR](https://github.com/BerriAI/litellm/pull/8593)
2. 透過額外可設定屬性增強 migrations job - [請見 PR](https://github.com/BerriAI/litellm/pull/8636)

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

1. Arize Phoenix 支援
2. ‘No-log’ - 修正 embedding 呼叫上的 ‘no-log’ 參數支援

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

1. 單一部署冷卻邏輯 - 若已設定，使用 allowed_fails 或 allowed_fail_policy [從這裡開始](https://docs.litellm.ai/docs/routing#advanced-custom-retries-cooldowns-based-on-error-type)

## 一般 Proxy 改善 {#general-proxy-improvements}

1. Hypercorn - 修正讀取 / 解析請求主體
2. Windows - 修正在 Windows 上執行 proxy
3. DD-Trace - 修正 proxy 上的 dd-trace 啟用

## 完整 Git Diff {#complete-git-diff}

在[這裡](https://github.com/BerriAI/litellm/compare/v1.61.13-stable...v1.61.20-stable)檢視完整 git diff。
