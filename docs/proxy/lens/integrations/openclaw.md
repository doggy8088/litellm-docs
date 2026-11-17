---
title: "OpenClaw"
description: "將 OpenClaw 代理程式活動傳送至 LiteLLM Lens。"
slug: "/proxy/lens/integrations/openclaw"
---

# OpenClaw {#openclaw}

在依照以下步驟之前，請先設定[追蹤目的地](../first-trace.md#send-your-first-trace)並設定您專用的 Lens 追蹤金鑰。

啟用 [diagnostics-otel plugin](https://docs.openclaw.ai/plugins/reference/diagnostics-otel)。只需在 `~/.openclaw/openclaw.json` 中設定一次您的 agent ID。新增追蹤設定時，請保留現有的模型與工作區設定：

```json title="openclaw.json"
{
  "agents": {
    "list": [{ "id": "research_agent" }]
  },
  "plugins": {
    "entries": { "diagnostics-otel": { "enabled": true } }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "tracesEndpoint": "${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT}",
      "headers": { "Authorization": "Bearer ${LENS_TRACING_KEY}" },
      "captureContent": true,
      "traces": true,
      "metrics": false,
      "logs": false,
      "sampleRate": 1
    }
  }
}
```

變更設定後，請重新啟動現有的 gateway。使用您設定的 agent ID 執行第一個工作階段：

```bash
openclaw agent --local --agent research_agent --session-id first-trace \
  --message "What is an agent trace?"
```

開啟 **Lens > Traces** 並選取 **research_agent**。
