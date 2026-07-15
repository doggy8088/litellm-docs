---
type: "Documentation page"
title: "CompatCanary"
description: "CompatCanary CompatCanary is an open source conformance scanner for OpenAI compatible endpoints. It sends deterministic probes through a LiteLLM proxy and records observed behav..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/projects/CompatCanary.md"
tags: ["docs","documentation-page"]
source_path: "docs/projects/CompatCanary.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/projects/CompatCanary.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/projects/CompatCanary.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# CompatCanary

[CompatCanary](https://github.com/CognizenOrg/compatcanary) is an open-source conformance scanner for OpenAI-compatible endpoints. It sends deterministic probes through a LiteLLM proxy and records observed behavior for chat completions, streaming, tool calls, structured outputs, and the Responses API.

Start with the Chat Completions surface exposed by a configured LiteLLM model:

```bash
export OPENAI_API_KEY="your-litellm-key"
npx --yes compatcanary@latest scan \
  --base-url http://localhost:4000/v1 \
  --model your-model \
  --profile chat
```

Use `--profile modern` to include Responses API probes, and `--format markdown` or `--format json` to save reviewable evidence for local debugging or CI.

See the [project repository](https://github.com/CognizenOrg/compatcanary) and a [reproducible LiteLLM setup with reviewed reports](https://github.com/CognizenOrg/compatcanary/blob/main/evidence/setups/litellm-1.91.1-github-models.md).
````
