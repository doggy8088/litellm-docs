---
slug: unified-tokenize
title: "在 vLLM 與 Watsonx 之間對文字進行 tokenize"
date: 2026-10-23T13:00:00-07:00
authors:
  - ishaan
description: "依提示預算選擇 token 計數，或使用 /tokenize 檢視 token。透過 LiteLLM，在 vLLM 與 Watsonx 之間使用單一請求格式。"
tags: [engineering]
hide_table_of_contents: true
custom_hero: true
image: /img/unified-tokenize/launch.png
---

import TokenizeLaunch from './TokenizeLaunch';

<div data-blog-summary hidden>

透過單一 LiteLLM tokenization 介面，將文字送往 vLLM 或 Watsonx。您的應用程式將模型名稱（例如 `llama-3.1-8b`）與提示傳給 `/tokenize`。請在您的閘道中設定提供者 URL 與憑證。

只要變更 `model`，即可選擇另一個已設定的模型；端點與 JSON 欄位維持不變。在提供者有供應的情況下，讀取 token 數量、數字 ID 與 token 字串。LiteLLM 以 Rust 執行提供者整合，並重複使用共用的 HTTP 用戶端。

若要執行這些範例，請使用包含 [PR #48079](https://github.com/BerriAI/litellm/pull/48079) 及其已編譯 Rust 擴充套件的版本。token 計數可用於上下文限制與輸入成本估算。若要檢視文字字串的 token 清單，或比較不同部署之間的 tokenizer 設定，請選擇 /tokenize。

</div>

<TokenizeLaunch />

<!-- truncate -->
