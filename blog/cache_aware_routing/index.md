---
slug: cache-aware-routing
title: "自架模型的快取感知路由"
date: 2026-10-20
authors:
  - yassin
image: ./cover.gif
description: "將每個代理程式工作階段路由到 Kubernetes 上同一個 vLLM pod，以重複使用快取的提示前綴。"
tags: [routing, kubernetes, vllm, ai-gateway]
hide_table_of_contents: true
---

![Claude Code 與 Codex 的請求通過 LiteLLM 閘道，並為每個工作階段回到同一個 vLLM pod，讓快取的提示前綴得以重複使用。](./cover.gif)

LiteLLM 現在支援 **Kubernetes 上自架推論的快取感知路由**。在同一個部署內，來自同一個工作階段的請求會送往同一個 GPU pod。這讓 vLLM 能跨回合重複使用快取的提示前綴。

代理程式請求通常共享系統指令、工具定義與對話歷史。當請求抵達不同的 pod 時，每個 pod 可能都要重新處理相同的前綴。工作階段親和性有助於重複使用這些已完成的工作。

{/* truncate */}

## 讓工作階段固定在同一個 GPU pod {#keep-a-session-on-one-gpu-pod}

LiteLLM 透過 Kubernetes headless Service 探索 pod IP。它使用工作階段 ID 透過 rendezvous hashing 選擇 pod，然後將請求直接送往該 pod。

## 開始使用 {#get-started}

[閱讀快取感知路由設定指南](https://docs.litellm.ai/docs/proxy/cache_aware_routing)。
