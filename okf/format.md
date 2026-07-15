---
type: "Format guide"
title: "Open Knowledge Format conventions for this bundle"
description: "Conformance notes for the OKF v0.1 bundle generated from the LiteLLM Docs repository."
resource: "https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md"
tags: ["okf", "format", "conformance"]
okf_version: "0.1"
---
# Bundle target

This directory targets Open Knowledge Format v0.1. The authoritative specification describes a knowledge bundle as a directory tree of UTF-8 Markdown concept files with YAML frontmatter. `index.md` and `log.md` are reserved filenames; all other Markdown files are concept documents.

# Conformance choices

- `okf/index.md` and every generated directory `index.md` are frontmatter-free progressive-disclosure indexes.
- Every other Markdown file in this bundle has a parseable YAML frontmatter block with a non-empty `type` field.
- Generated source concepts preserve the original Markdown content in the body and carry `source_path`, `source_area`, `source_revision`, and a canonical GitHub `resource` URL.
- The repository inventory and complete tracked path list represent non-Markdown source files without duplicating binary assets or executable configuration into the bundle.
- Source links are ordinary Markdown links. The generated corpus uses relative links for bundle navigation and external links for source provenance.
- The bundle does not define a custom type registry. Concept types are descriptive strings such as `Documentation page`, `Blog post`, `Release note`, and `Repository overview`.

# Validation

Run the repository-provided validator with:

```shell
npm run validate:okf
```

The generator and validator are maintained in `scripts/generate-okf.mjs` and `scripts/validate-okf.mjs`. The source repository remains authoritative for the OKF specification and for the original documentation files.

# Citation

The format rules summarized here are based on the [Open Knowledge Format v0.1 specification](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).
