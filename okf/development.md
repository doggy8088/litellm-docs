---
type: "Development workflow"
title: "LiteLLM Docs development and contribution workflow"
description: "Local development, build verification, deployment, and contribution instructions for the documentation site."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/CONTRIBUTING.md"
tags: ["development", "contributing", "build"]
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
---
# Requirements and local development

The project uses Node.js and npm. The documented setup is:

```shell
npm install
npm start
```

The development server is available at `http://localhost:3000` and supports live reload for documentation and blog changes.

# Build verification

Run the production build before opening a pull request:

```shell
npm run build
```

The build catches broken links, invalid MDX, and other Docusaurus build issues. Static output is written to `build/`.

# Content changes

Most documentation pages live in `docs/`; blog posts live in `blog/`; standalone pages live in `src/pages/`; and release notes live in `release_notes/`. When adding, removing, or moving documentation pages, check `sidebars.js` and `sidebars-release-notes.js` as applicable.

For substantive content changes, the repository guidance asks contributors to open an issue before submitting a pull request. Pull requests target `BerriAI/litellm-docs` and the deployment workflow publishes changes from `main` through Vercel.

# OKF maintenance

Regenerate the source corpus after source Markdown changes:

```shell
npm run generate:okf
npm run validate:okf
```

The generator records the source revision in each generated concept. `index.md` and `log.md` remain reserved OKF filenames and do not receive concept frontmatter.
