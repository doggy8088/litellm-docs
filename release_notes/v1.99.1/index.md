---
title: "v1.99.1 - OTel 快取 Token 計數"
slug: "v1-99-1"
date: 2026-09-02T14:01:25
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

:::info[這是僅限 Docker 的版本]

`v1.99.1` 以容器映像檔形式發佈。此版本沒有 PyPI 套件，因此 `pip install litellm==1.99.1` 將無法解析。如果您從 PyPI 安裝 LiteLLM，請維持在 `1.99.0`；此版本中的變更會透過映像檔帶給您。

`latest` 標籤確實指向這個版本。

:::

## 部署此版本 {#deploy-this-version}

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.99.1
```

`v1.99.1` 是建立在 [`v1.99.0`](/release_notes/v1.99.0/v1-99-0) 之上的修補版本。它為 OpenTelemetry v2 的 LLM span 新增了快取 token 計數。

如果您將 OTel v2 trace 匯出到會根據 token 計數為請求定價的工具，這個版本值得採用。在 `v1.99.0` 下，LLM span 會帶有快取成本屬性，但沒有快取 token 計數，因此任何根據 token 計算快取支出的系統，即使提供者已對快取寫入或快取讀取收費，也會記錄為 0。現在 span 會在既有的輸入與輸出 token 計數之外，同時帶有 `gen_ai.usage.cache_creation.input_tokens` 和 `gen_ai.usage.cache_read.input_tokens`，與 API 回應在 `usage` 中回報的內容一致。

這些計數是從提供者自己的 usage 物件讀取，因此目前已針對 Anthropic 形式的 usage 填入，這也是提示快取會分開回報建立與讀取計數的地方。以不同形式回報快取 token 計數的提供者尚未涵蓋，將其通用化是後續工作。

此版本也將鎖定檔中的 RestrictedPython 更新到 8.5，與開發分支已解析的版本一致。這只會影響映像檔，因為此版本沒有 PyPI 成品。沒有組態變更。

### 有哪些變更 {#whats-changed}

- fix(otel): 在 OTel v2 LLM span 上回傳快取 token 計數 - [PR #38716](https://github.com/BerriAI/litellm/pull/38716)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.99.0...v1.99.1
