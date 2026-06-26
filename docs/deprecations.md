# Deprecations

This page is the migration guide for the features and integrations targeting to be retired in the **August 25, 2026** release. 

If you don't use any of the items below, nothing changes for you. If you do, each section explains what is going away and how to move off it. Some items have a direct replacement and a step-by-step guide; others are experimental or low-usage features with no replacement, in which case the guidance is simply to stop relying on them before the removal date.

:::info Removal date

If you use one of these features and you would like to advocate to keep them, please go to this github discussion here or email us at 

:::

## What's being deprecated

The tables below list every deprecation, its replacement, and whether there is a migration guide on this page. Items marked "No" have no replacement right now. 

### Dashboard features

| Feature | Replacement | Migration guide |
| --- | --- | --- |
| [Workflows](#workflows) | None | No |
| [Memory](#memory) | None | No |
| [Playground's Agent Builder](#playgrounds-agent-builder) | None | No |
| [Prompt Management](#prompt-management) | None | No |
| [Old Usage page](#old-usage-page) | New Usage dashboard | Yes |
| [API Reference tab](#api-reference-tab) | Guided getting-started flow | Yes |
| [Learning Resources](#learning-resources) | None | No |
| [MCP Network Settings + "Internal network only" flag](#mcp-network-settings) | Load balancer filtering; teams to gate public/private MCPs | Yes |

### Integrations and backends

| Feature | Replacement | Migration guide |
| --- | --- | --- |
| [GreenScale logging](#greenscale-logging) | None | No |
| [DynamoDB as a proxy database](#dynamodb-as-a-proxy-database) | PostgreSQL | Yes |
| [Gradient AI provider](#gradient-ai-provider) | None | No |
| [S3 logging v1](#s3-logging-v1) | S3 logging v2 | Yes |
| [OpenTelemetry v1](#opentelemetry-v1) | OTEL v2 | Yes |
| [Disk caching](#disk-caching) | None | No |
| [CloudZero connector](#cloudzero-connector) | OTEL v2 connector | Yes |
| [Prisma resolve v1](#prisma-resolve-v1) | Prisma resolver v2 | Yes |

### Packaging

| Change | Replacement | Migration guide |
| --- | --- | --- |
| [Package consolidation](#package-consolidation) | Single `litellm` package | Yes |

---

## Dashboard features

### Workflows

**Replacement:** none. Experimental feature with little usage. Remove any reliance on it before August 25, 2026.

<!-- TODO: optional note on what users had built with it, if anything to preserve. -->

### Memory

**Feature docs:** [Memory Management](/docs/proxy/memory), [/memory API](/docs/memory_management)

**Replacement:** none. Experimental feature with little usage. Remove any reliance on it before August 25, 2026.

<!-- TODO -->

### Playground's Agent Builder

**Replacement:** none. Experimental feature with little usage. Remove any reliance on it before August 25, 2026.

<!-- TODO -->

### Prompt Management

**Feature docs:** [LiteLLM AI Gateway Prompt Management](/docs/proxy/litellm_prompt_management)

**Replacement:** none. Experimental feature with little usage. There is no migration path; remove any reliance on it before August 25, 2026.

### Old Usage page

**Replacement:** the new Usage dashboard.

<!-- TODO: migration guide
- What's different in the new dashboard
- Where to find it in the UI
- Anything that does NOT carry over
-->

### API Reference tab

**Replacement:** the guided getting-started flow.

<!-- TODO: migration guide
- Where the guided flow lives
- How to reach the API reference content people relied on (link to hosted API docs?)
-->

### Learning Resources

**Replacement:** none. Low usage. No action required beyond not depending on the tab.

<!-- TODO -->

### MCP Network Settings

**Feature docs:** [Exposing MCPs on the Public Internet](/docs/mcp_public_internet)

The MCP "Network Settings" panel and the "Internal network only" flag. This was never core to the gateway and the flag is inherently insecure as a network control.

**Replacement:** filter MCP access at a load balancer instead of relying on the in-app flag. If you need to expose some MCP servers publicly and keep others private, gate them with teams.

<!-- TODO: migration guide
- What the "Internal network only" flag did
- How to replicate it with a load balancer (filtering rules)
- How to gate public vs private MCP servers with teams
- Before / after config
-->

---

## Integrations and backends

### GreenScale logging

**Feature docs:** [Greenscale](/docs/observability/greenscale_integration)

**Replacement:** none. Low usage; can no longer be maintained to the expected standard.

<!-- TODO: how to remove the greenscale callback from config -->

### DynamoDB as a proxy database

**Replacement:** PostgreSQL.

<!-- TODO: migration guide
- Confirm what "DynamoDB as a proxy database" covers today
- Postgres setup (DATABASE_URL)
- Data migration considerations, if any
- Before / after config
-->

### Gradient AI provider

**Feature docs:** [GradientAI](/docs/providers/gradient_ai)

**Replacement:** none. The upstream service was discontinued.

<!-- TODO: provider prefix being removed; what calls will stop working -->

### S3 logging v1

**Feature docs:** [S3 logging](/docs/proxy/logging#s3-buckets)

**Replacement:** S3 logging v2.

<!-- TODO: migration guide
- Old callback vs new callback
- Config diff (s3 -> s3_v2 and params block)
- Before / after config
-->

### OpenTelemetry v1

**Feature docs:** [OpenTelemetry](/docs/observability/opentelemetry_integration). Replacement: [OTEL v2](/docs/observability/opentelemetry_v2).

**Replacement:** OTEL v2.

<!-- TODO: migration guide
- How to opt into v2
- Config / env diff
- Note: do not run v1 and v2 at the same time
- Before / after config
-->

### Disk caching

**Feature docs:** [Disk Cache](/docs/proxy/caching)

**Replacement:** none. Low usage; can no longer be maintained to the expected standard.

<!-- TODO: which cache_params type is going away and what to remove -->

### CloudZero connector

**Feature docs:** [CloudZero Integration](/docs/observability/cloudzero)

**Replacement:** the OTEL v2 connector.

<!-- TODO: migration guide
- Old CloudZero connector config
- New OTEL v2 connector config
- Before / after config
-->

### Prisma resolve v1

**Replacement:** the v2 migration resolver.

<!-- TODO: migration guide
- What the v1 resolver did
- How to switch to v2 (flag / env var)
- Before / after config
-->

---

## Packaging

### Package consolidation

We're consolidating the PyPI and Docker packages down to a single `litellm` package. The extra variants (`litellm-database`, `litellm-ee`, `litellm-dev`, `litellm-non_root`) are going away. The `litellm` package will be the only supported package going forward and will absorb the functionality from `litellm-database` and `litellm-non_root`.

<!-- TODO: migration guide
- Mapping: each old package/image -> the single litellm package/image
- What moves where (database deps, non-root, ee, dev)
- Install / Docker tag changes (pip and ghcr.io tags)
- Before / after install commands
-->

---

## Questions or feedback

This list is not final. If you depend on something here and want it to stay, reach out with the feature and your use case.

<!-- TODO: add the canonical feedback channel (email / GitHub discussion / Slack) once confirmed. -->
