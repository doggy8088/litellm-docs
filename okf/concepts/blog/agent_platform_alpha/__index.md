---
type: "Blog post"
title: "LiteLLM Managed Agents Platform — Alpha Now Open for Public Preview"
description: "Spawn sandboxed agent sessions on the LiteLLM Gateway — a control plane for managed agents, now in public preview."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/blog/agent_platform_alpha/index.md"
tags: ["blog","blog-post"]
source_path: "blog/agent_platform_alpha/index.md"
source_area: "blog"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: ["slug","title","date","authors","description","tags","hide_table_of_contents"]
---
# Source document

This concept mirrors [`blog/agent_platform_alpha/index.md`](https://github.com/BerriAI/litellm-docs/blob/main/blog/agent_platform_alpha/index.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
---
slug: agent-platform-alpha
title: "LiteLLM Managed Agents Platform — Alpha Now Open for Public Preview"
date: 2026-05-08T10:00:00
authors:
  - krrish
  - ishaan-alt
description: "Spawn sandboxed agent sessions on the LiteLLM Gateway — a control plane for managed agents, now in public preview."
tags: [product, agents]
hide_table_of_contents: false
---

We're introducing the **LiteLLM Managed Agents Platform** - a simple, self-hosted infrastructure platform for running multiple agents in production.

{/* truncate */}

![LiteLLM Managed Agents Platform Alpha](/img/litellm_agent_platform_alpha.png)

The main benefit of using this is that it will manage:
- Different sandboxes for different teams/contexts
- Session management across pod restarts/upgrades

We built this because we wanted a managed agent solution, but fully self-hosted. We are excited to have it open sourced and available for everyone to use.

**Repo:** [github.com/BerriAI/litellm-agent-platform](https://github.com/BerriAI/litellm-agent-platform)

Please file an issue if you have any questions or feedback.
````
