# LiteLLM Docs knowledge bundle

This directory is an Open Knowledge Format v0.1 bundle generated from the `BerriAI/litellm-docs` repository at the recorded Git revision in [`repository-inventory.md`](repository-inventory.md).

## Bundle guide

- [OKF format notes](format.md) - version, conformance rules, and bundle conventions used here.
- [Repository overview](overview.md) - purpose, ownership, public entry points, and source repository.
- [Site architecture](architecture.md) - Docusaurus configuration, content plugins, navigation, and publishing surfaces.
- [Content map](content-map.md) - the main documentation domains and the size of each source area.
- [Development and contribution](development.md) - local setup, build verification, deployment, and contribution workflow.
- [Repository inventory](repository-inventory.md) - tracked-file counts, extensions, scope, and coverage notes.
- [Complete tracked path list](repository-files.md) - every tracked source path outside the generated `okf/` directory.
- [Source concept corpus](concepts/) - one OKF concept for every tracked Markdown source outside `okf/`.

`index.md` is a reserved OKF directory listing and intentionally has no frontmatter. All other Markdown files in this bundle have a non-empty `type` field in YAML frontmatter.
