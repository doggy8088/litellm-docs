---
type: "Documentation page"
title: "Harbor"
description: "Harbor Harbor is a framework from the creators of Terminal Bench for evaluating and optimizing agents and language models. It uses LiteLLM to call 100+ LLM providers. Key featur..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/projects/Harbor.md"
tags: ["docs","documentation-page"]
source_path: "docs/projects/Harbor.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/projects/Harbor.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/projects/Harbor.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown

# Harbor

[Harbor](https://github.com/laude-institute/harbor) is a framework from the creators of Terminal-Bench for evaluating and optimizing agents and language models. It uses LiteLLM to call 100+ LLM providers.

```bash
# Install
uv add harbor

# Run a benchmark with any LiteLLM-supported model
harbor run --dataset terminal-bench@2.0 \
   --agent claude-code \
   --model anthropic/claude-opus-4-1 \
   --n-concurrent 4
```

Key features:
- Evaluate agents like Claude Code, OpenHands, Codex CLI
- Build and share benchmarks and environments
- Run experiments in parallel across cloud providers (Daytona, Modal)
- Generate rollouts for RL optimization

- [GitHub](https://github.com/laude-institute/harbor)
- [Documentation](https://harborframework.com/docs)
````
