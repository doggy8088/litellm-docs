---
slug: two-week-stability-update
title: "Stability Update: Locking Down the MCP Gateway (and 134 fixes in two weeks)"
date: 2026-07-11T12:00:00
authors:
  - ishaan
description: "A two-week product quality and stability recap: 134 bug fixes led by MCP Gateway credential hardening, new-model billing correctness, and streaming pass-through downloads — plus our next goal, 95% end-to-end test coverage."
tags: [stability, mcp, performance, product]
hide_table_of_contents: false
---

A quick product quality and stability update for the last two weeks (June 27 – July 11, 2026).

We shipped **134 bug fixes**. The headline is the **MCP Gateway** — half of everything we fixed (50 of 134) went into one idea: **credentials should live in exactly one locked place, and only ever reach the one server they belong to.**

Below: the MCP story first, then the AI-Eng and performance work, the full number breakdown, and the next goal.

{/* truncate */}

## MCP Gateway stability — 50 of 134 fixes

**In plain terms:** LiteLLM sits between your AI app (Claude Desktop, Cursor, an agent) and the real tools it wants to use (GitHub, a database, an internal API). Those tools need a credential. The whole question is: **who holds the credential, and can it leak to the wrong place?**

Two weeks ago the answer was "the credential travels with every request and could be handed to the wrong server." Now it is **"the credential lives in one locked vault inside the gateway, encrypted, and is only ever sent to the one server it belongs to."**

### Before — the credential rode along with the request

```mermaid
flowchart LR
  C["MCP Client<br/>(Claude, Cursor)<br/>holds the raw upstream token"]
  C -->|token sent with request| G["LiteLLM Gateway<br/>(old path)<br/>forwards the header onward"]
  G -->|intended| A["Correct MCP server<br/>(GitHub)"]
  G -.->|token leaks here too ✕| B["Wrong MCP server<br/>(Internal API)"]
  classDef bad fill:#fdecec,stroke:#dc2626,color:#7f1d1d;
  classDef ok fill:#f8fafc,stroke:#cbd5e1,color:#0f172a;
  class B,G bad;
  class A,C ok;
```

The credential lived **in transit** — on the client and inside each request. A token meant for one server could reach another (Authorization fan-out), and bridge keys were not derived with a memory-hard hash.

### After — the credential lives only in the gateway vault

```mermaid
flowchart LR
  C["MCP Client<br/>authenticates once<br/>with a gateway key"]
  C -->|gateway key only<br/>no upstream secret| G["LiteLLM MCP Gateway<br/>🔒 scrypt-encrypted vault<br/>policy gate · per-user token isolation"]
  G -->|bound to one upstream| A["Correct MCP server<br/>(GitHub)"]
  classDef gw fill:#eaf1ff,stroke:#2563eb,color:#1e3a8a;
  classDef ok fill:#f8fafc,stroke:#cbd5e1,color:#0f172a;
  class G gw;
  class A,C ok;
```

The credential now lives **only inside the gateway vault**, encrypted with memory-hard scrypt and bound to exactly one upstream. The client never holds an upstream secret, and every call passes the same auth and permission gate as normal LLM traffic.

### What kinds of bugs this class of change removes

- Tokens leaking to the wrong upstream server (Authorization fan-out).
- Duplicate or stale `Authorization` headers slipping through.
- MCP requests skipping the normal team / route / key checks.
- Cached OAuth tokens going stale or crossing between users.
- Upstream URLs and secrets showing up in logs.

### Auth types the gateway supports

Every one of these now stores its secret in the gateway vault (encrypted) rather than trusting the client to carry it.

| Auth type | What it is | Secret held in vault |
|---|---|---|
| `none` | Public server, no auth | — |
| `api_key` | API key sent in a header | ✅ |
| `bearer_token` | Static bearer token | ✅ |
| `basic` | HTTP Basic (user : password) | ✅ |
| `authorization` | Raw `Authorization` header value | ✅ |
| `oauth2` | OAuth 2.0 — `authorization_code` (interactive) and `client_credentials` (machine-to-machine) | ✅ + per-user token isolation |
| `aws_sigv4` | AWS SigV4 request signing | ✅ |
| `token` | Generic token credential | ✅ |

## AI Eng — LLM providers (27 fixes)

**Central theme: new models are correct on day one — especially the money math.** The bulk of this work made sure new **Claude 4.8 / Opus 4.8** and **Bedrock Invoke** requests bill correctly and do not silently drop capabilities.

- **Billing accuracy:** tier-only deployments were billing **$0** — now billed correctly; regional inference profiles resolve to regional pricing; tiered-pricing costs are coerced safely.
- **Capability correctness:** mid-conversation system messages honored for Claude 4.8+ on Bedrock; adaptive thinking/effort translated for pre-4.6 models; `@version` suffixes stripped in model lookup.
- **Translation fidelity:** `cache_control` TTL preserved on Bedrock cache points; reasoning tokens preserved through chat → responses; in-stream error events now raise real API errors instead of vanishing.

## Performance — streaming pass-through downloads

**The performance story in one line:** on pass-through routes, stop holding a large file download in memory when you can stream it through.

Large **non-JSON** pass-through downloads — batch-result files, binary / octet-stream downloads — now stream chunk-by-chunk instead of being buffered whole in memory. This covers the provider pass-through routes (`/vertex_ai/*`, `/bedrock/*`, `/openai/*`, `/anthropic/*`, and others) and custom pass-through endpoints.

```mermaid
flowchart LR
  subgraph B["Before — buffer the whole file"]
    direction LR
    U1[Upstream] -->|entire body| L1["LiteLLM<br/>holds full file in RAM<br/>(memory grows with size)"]
  end
  subgraph A["After — stream it through"]
    direction LR
    U2[Upstream] -->|chunk| L2["LiteLLM<br/>forwards chunk-by-chunk<br/>(flat memory)"] -->|chunk| C2[Client]
  end
  classDef bad fill:#fdecec,stroke:#dc2626,color:#7f1d1d;
  classDef good fill:#e8f7ee,stroke:#16a34a,color:#14532d;
  class L1 bad;
  class L2 good;
```

Before, a large batch-result file meant the proxy held the entire body in RAM before sending it on; now memory stays flat regardless of size. **JSON responses still buffer by design** — so spend logging and guardrails can inspect the body.

Two more fixes in the same spirit — don't pay for work nobody needs:

- **Prometheus** skips budget-metric DB lookups entirely when the gauges are no-ops (nothing is scraping them).
- The **complexity router** builds its semantic route index once under concurrent cold-start, instead of rebuilding it per request.

## By the numbers

Every fix, bucketed by the area it landed in.

| Area | Fixes |
|---|---|
| MCP Gateway | **50** |
| LLM Providers (AI Eng) | 27 |
| Proxy Core / Reliability | 23 |
| UI / Dashboard | 20 |
| Logging / Observability | 9 |
| Guardrails | 5 |
| **Total** | **134** |

A note on the count: these **134** are every merged `fix:` PR in the two-week window. One reported ticket usually becomes several fix PRs — the MCP hardening alone was ~50 commits behind a handful of tickets — so the PR count runs higher than the reported-ticket count.

## Next goal: 95% end-to-end test coverage

Most of the 134 fixes above were caught late — in staging or by a report. The next lever is catching them **before they merge**. We are pushing **end-to-end test coverage to 95%** across the product, and we believe this will **significantly improve release quality** — fewer regressions reaching a release, and less time spent hot-fixing after one ships.

Same lens next sprint: root causes, not symptoms.
