---
title: "Hermes"
description: "將 Hermes 代理程式活動傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/hermes"
---

# Hermes {#hermes}

在進行這些步驟之前，請先設定 [追蹤目的地](../first-trace.md#send-your-first-trace) 並設定您的 LiteLLM 金鑰。

安裝並啟用社群版 [hermes-otel 外掛程式](https://github.com/briancaffey/hermes-otel#install)。將 `LITELLM_API_KEY` 設為您的 LiteLLM 金鑰，然後將以下內容加入 `~/.hermes/hermes_otel.yaml`：

```yaml title="hermes_otel.yaml"
resource_attributes:
  gen_ai.agent.name: research_agent
content_capture: full
backends:
  - type: otlp
    endpoint: ${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT}
    headers:
      Authorization: "Bearer ${LITELLM_API_KEY}"
    metrics: false
    logs: false
```

啟動新的 Hermes 工作階段並提出一個問題。已設定的名稱 **research_agent** 會顯示在 Lens 中。Hermes 內建的診斷遙測本身不包含調查所需的對話內容。
