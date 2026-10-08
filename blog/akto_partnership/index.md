---
slug: akto-partnership
title: "LiteLLM × Akto：與內建防護欄並行的基於模型偵測"
date: 2026-04-21T10:00:00
authors:
  - krrish
  - ishaan-alt
description: "將 Akto 的基於模型偵測與 LiteLLM 的內建防護欄串接在一起——攔截僅靠模式比對檢查會漏掉的 PII、提示注入與政策違規。"
image: /img/litellm_akto_announcement.png
tags: [partnership, security, guardrails, akto]
hide_table_of_contents: false
---

![LiteLLM x Akto 合作夥伴關係](/img/litellm_akto_announcement.png)

[Akto](https://akto.io) 現已原生在 LiteLLM proxy 中以串接式防護欄運作。

{/* truncate */}

LiteLLM 已內建防護欄，可進行快速、確定性的檢查（基於正規表示式的 PII、祕密掃描、禁用詞清單）。Akto 在其上新增第二層：**以模型為基礎的偵測**，用於確定性規則無法涵蓋的情境，例如提示詞注入、語意性 PII 洩漏，以及需要 LLM 來分類意圖的自訂政策違規。

您可以將兩者一起使用。LiteLLM 的防護欄負責便宜且快速的檢查；Akto 則負責需要模型介入的情境。

![防護欄串接：用戶端 → LiteLLM Proxy → LLMs / MCPs / Agents，LiteLLM 防護欄再串接到 Akto](/img/litellm_guardrail_chaining.png)

Akto 以 **同步模式** 執行（在呼叫 LLM 之前於違規時封鎖）或 **非同步模式** 執行（記錄並發出警示，不增加延遲）。將其設定為現有 proxy 上的 callback；無需變更應用程式層級。

**開始使用：** [Akto 防護欄設定指南](/docs/proxy/guardrails/akto)

**閱讀完整公告**請見 [Akto 的部落格 →](https://www.akto.io/blog/akto-partners-litellm-ai-gateway-security-agents)
