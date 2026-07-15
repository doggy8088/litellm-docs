---
type: "Documentation page"
title: "Ui Search Tools"
description: "Search tools (Admin UI) Control which teams and virtual keys may call each configured web search integration ( /v1/search ) and see team/key level usage visibility within LiteLL..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/ui_search_tools.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/ui_search_tools.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/ui_search_tools.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/ui_search_tools.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Search tools (Admin UI)

Control which teams and virtual keys may call each configured web search integration (`/v1/search`) and see team/key level usage visibility within LiteLLM's spend dashboard.


![](/img/ui-search-tools/step-01-go-to-search-tools-tab.png)

## Step 1: Register tools

**Search tools** page → create tool (name + provider + credentials).

![](/img/ui-search-tools/step-02-add-new-search-tool.png)

## Step 2: Team allowlist

**Teams** → create/edit team → open **Search Tool Settings** → add tool(s) to the team.

![](/img/ui-search-tools/step-03-create-or-edit-team.png)
![](/img/ui-search-tools/step-04-open-search-tool-settings.png)
![](/img/ui-search-tools/step-05-add-search-tool-to-team.png)

## Step 3: Key (optional stricter list)

**Virtual keys** → generate/update for that team → **Search Tool Settings** must stay inside the team list (if team list is non-empty).

![](/img/ui-search-tools/step-06-create-team-key.png)

## Step 4: Call search

```bash
curl -sS -X POST "http://localhost:4000/v1/search/YOUR_SEARCH_TOOL_NAME" \
  -H "Authorization: Bearer YOUR_VIRTUAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "hello world", "max_results": 5}'
```

![](/img/ui-search-tools/step-07-open-usage-team-usage.png)

## Step 5: See spend

**Logs** → filter **Team ID** + **Public model / search tool** = `search_tool_name` → **Cost** column.

![](/img/ui-search-tools/step-08-select-team.png)
![](/img/ui-search-tools/step-09-see-search-tool-usage.png)

## Related

- [Search providers & YAML](../search/index.md)
- [Proxy config (`search_tools` row)](./config_settings.md)
````
