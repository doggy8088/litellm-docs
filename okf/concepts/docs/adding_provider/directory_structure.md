---
type: "Documentation page"
title: "Directory Structure"
description: "Directory Structure When adding a new provider, you need to create a directory for the provider that follows the following structure:"
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/adding_provider/directory_structure.md"
tags: ["docs","documentation-page"]
source_path: "docs/adding_provider/directory_structure.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/adding_provider/directory_structure.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/adding_provider/directory_structure.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Directory Structure

When adding a new provider, you need to create a directory for the provider that follows the following structure:

```
litellm/llms/
└── provider_name/
    ├── completion/ # use when endpoint is equivalent to openai's `/v1/completions`
    │   ├── handler.py
    │   └── transformation.py
    ├── chat/ # use when endpoint is equivalent to openai's `/v1/chat/completions`
    │   ├── handler.py
    │   └── transformation.py
    ├── embed/ # use when endpoint is equivalent to openai's `/v1/embeddings`
    │   ├── handler.py
    │   └── transformation.py
    ├── audio_transcription/ # use when endpoint is equivalent to openai's `/v1/audio/transcriptions`
    │   ├── handler.py
    │   └── transformation.py
    └── rerank/ # use when endpoint is equivalent to cohere's `/rerank` endpoint.
        ├── handler.py
        └── transformation.py
```
````
