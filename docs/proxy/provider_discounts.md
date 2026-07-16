# 提供者折扣 {#provider-discounts}

將百分比折扣套用至特定提供者。這對於與提供者協商企業定價很有幫助。

## 與 LiteLLM Proxy Server 一起使用 {#usage-with-litellm-proxy-server}

**步驟 1：將折扣設定加入 config.yaml**

```yaml
# Apply 5% discount to all Vertex AI and Gemini costs
litellm_settings:
  cost_discount_config:
    vertex_ai: 0.05  # 5% discount
    gemini: 0.05     # 5% discount
    openrouter: 0.05 # 5% discount
    # openai: 0.10   # 10% discount (example)
```

**步驟 2：啟動 proxy**

```bash
litellm /path/to/config.yaml
```

折扣將自動套用至已設定提供者的所有成本計算。

## 折扣運作方式 {#how-discounts-work}

- 折扣會在所有其他成本計算（tokens、快取、tools 等）**之後**套用
- 折扣為百分比（0.05 = 5%，0.10 = 10%，依此類推）
- 折扣只會套用至已設定的提供者
- 原始成本、折扣金額與最終成本都會記錄在成本明細 logs 中
- 折扣資訊會在回應標頭中傳回：
  - `x-litellm-response-cost` - 折扣後的最終成本
  - `x-litellm-response-cost-original` - 折扣前的成本
  - `x-litellm-response-cost-discount-amount` - 美元計價的折扣金額

## 支援的提供者 {#supported-providers}

您可以將折扣套用至所有 LiteLLM 支援的提供者。常見範例：

- `vertex_ai` - Google Vertex AI
- `gemini` - Google Gemini
- `openai` - OpenAI
- `anthropic` - Anthropic
- `azure` - Azure OpenAI
- `bedrock` - AWS Bedrock
- `cohere` - Cohere
- `openrouter` - OpenRouter

請參閱 [LlmProviders](https://github.com/BerriAI/litellm/blob/main/litellm/types/utils.py) enum 中的完整提供者清單。
