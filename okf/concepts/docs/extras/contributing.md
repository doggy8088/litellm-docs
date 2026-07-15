---
type: "Documentation page"
title: "Contributing"
description: "Contributing to Documentation This website is built using Docusaurus 3, a modern static website generator. Clone the docs repo: Local setup for locally running docs Install depe..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/extras/contributing.md"
tags: ["docs","documentation-page"]
source_path: "docs/extras/contributing.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/extras/contributing.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/extras/contributing.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Contributing to Documentation

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

Clone the docs repo:

```bash
git clone https://github.com/BerriAI/litellm-docs.git
cd litellm-docs
```

### Local setup for locally running docs

Install dependencies:

```bash
npm install
```

Run the docs site locally:

```bash
npm start
```

Open docs here: [http://localhost:3000/](http://localhost:3000/).

### Making changes to Docs
- All the docs are placed under the `docs` directory
- Blog posts are placed under the `blog` directory
- If you are adding a new `.md` file or editing the hierarchy, check whether `sidebars.js` needs to be updated

### Verify your changes

Before opening a PR, run:

```bash
npm run build
```

After testing your changes, open a pull request against [github.com/BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs).
````
