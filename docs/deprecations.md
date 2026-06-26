# Deprecations

This page is the migration guide for the features and integrations targeting to be retired in the **August 25, 2026** release. 

If you don't use any of the items below, nothing changes for you. If you do, each section explains what is going away and how to move off it. Some items have a direct replacement and a step-by-step guide; others are experimental or low-usage features with no replacement, in which case the guidance is simply to stop relying on them before the removal date.

:::info Want to keep a feature?

If you use one of these and want it to stay, reach out:

- GitHub: https://github.com/BerriAI/litellm/issues
- Email: ishaan@berri.ai / krrish@berri.ai
- Discord: https://discord.gg/wuPM9dRgDw
- Slack: https://www.litellm.ai/support 

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

### Memory

**Feature docs:** [Memory Management](/docs/proxy/memory), [/memory API](/docs/memory_management)

**Replacement:** none. Experimental feature with little usage. Remove any reliance on it before August 25, 2026.

### Playground's Agent Builder

**Replacement:** none. Experimental feature with little usage. Remove any reliance on it before August 25, 2026.

### Prompt Management

**Feature docs:** [LiteLLM AI Gateway Prompt Management](/docs/proxy/litellm_prompt_management)

**Replacement:** none. Experimental feature with little usage. There is no migration path; remove any reliance on it before August 25, 2026.

### Old Usage page

**Replacement:** the new Usage dashboard.


### API Reference tab

**Replacement:** the guided getting-started flow.


### Learning Resources

**Replacement:** none. Low usage. No action required beyond not depending on the tab.


### MCP Network Settings

**Feature docs:** [Exposing MCPs on the Public Internet](/docs/mcp_public_internet)

The MCP "Network Settings" panel and the "Internal network only" flag. This was never core to the gateway and the flag is inherently insecure as a network control.

**Replacement:** filter MCP access at a load balancer instead of relying on the in-app flag. If you need to expose some MCP servers publicly and keep others private, gate them with teams.

---

## Integrations and backends

### GreenScale logging

**Feature docs:** [Greenscale](/docs/observability/greenscale_integration)

**Replacement:** none. Low usage; can no longer be maintained to the expected standard.

### DynamoDB as a proxy database

**Replacement:** PostgreSQL.

### Gradient AI provider

**Feature docs:** [GradientAI](/docs/providers/gradient_ai)

**Replacement:** none. The upstream service was discontinued.

### S3 logging v1

**Feature docs:** [S3 logging](/docs/proxy/logging#s3-buckets)

**Replacement:** S3 logging v2.

**Migration:** switch the callback from `s3` to `s3_v2`. The `s3_callback_params` keys and the AWS env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION_NAME`) are unchanged.

```yaml
# Before
litellm_settings:
  success_callback: ["s3"]
  s3_callback_params:
    s3_bucket_name: my-logs-bucket
    s3_region_name: us-west-2

# After
litellm_settings:
  success_callback: ["s3_v2"]
  s3_callback_params:
    s3_bucket_name: my-logs-bucket
    s3_region_name: us-west-2
``` 

### OpenTelemetry v1

**Feature docs:** [OpenTelemetry](/docs/observability/opentelemetry_integration). Replacement: [OTEL v2](/docs/observability/opentelemetry_v2).

**Replacement:** OTEL v2.


### Disk caching

**Feature docs:** [Disk Cache](/docs/proxy/caching)

**Replacement:** none. Low usage; can no longer be maintained to the expected standard.


### CloudZero connector

**Feature docs:** [CloudZero Integration](/docs/observability/cloudzero)

**Replacement:** the OTEL v2 connector.


### Prisma resolve v1

**Replacement:** the v2 migration resolver.

---

## Packaging

### Package consolidation

We're consolidating the PyPI and Docker packages down to a single `litellm` package. The extra variants (`litellm-database`, `litellm-ee`, `litellm-dev`, `litellm-non_root`) are going away. The `litellm` package will be the only supported package going forward and will absorb the functionality from `litellm-database` and `litellm-non_root`.

---

## Questions or feedback

This list is not final. If you depend on something here and want it to stay, reach out with the feature and your use case.

- GitHub: https://github.com/BerriAI/litellm/issues
- Email: ishaan@berri.ai / krrish@berri.ai
- Discord: https://discord.gg/wuPM9dRgDw
- Slack: https://www.litellm.ai/support
