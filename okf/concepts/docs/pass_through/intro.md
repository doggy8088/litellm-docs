---
type: "Documentation page"
title: "Intro"
description: "Why Pass Through Endpoints? These endpoints are useful for 2 scenarios: 1. Migrate existing projects to litellm proxy. E.g: If you have users already in production with Anthropi..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/pass_through/intro.md"
tags: ["docs","documentation-page"]
source_path: "docs/pass_through/intro.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/pass_through/intro.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/pass_through/intro.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Why Pass-Through Endpoints?

These endpoints are useful for 2 scenarios:

1. **Migrate existing projects** to litellm proxy. E.g: If you have users already in production with Anthropic's SDK, you just need to change the base url to get cost tracking/logging/budgets/etc. 


2. **Use provider-specific endpoints** E.g: If you want to use [Vertex AI's token counting endpoint](https://docs.litellm.ai/docs/pass_through/vertex_ai#count-tokens-api)


## How is your request handled? 

The request is passed through to the provider's endpoint. The response is then passed back to the client. **No translation is done.**

### Request Forwarding Process

1. **Request Reception**: LiteLLM receives your request at `/provider/endpoint`
2. **Authentication**: Your LiteLLM API key is validated and mapped to the provider's API key
3. **Request Transformation**: Request is reformatted for the target provider's API
4. **Forwarding**: Request is sent to the actual provider endpoint
5. **Response Handling**: Provider response is returned directly to you

### Authentication Flow

```mermaid
graph LR
    A[Client Request] --> B[LiteLLM Proxy]
    B --> C[Validate LiteLLM API Key]
    C --> D[Map to Provider API Key]
    D --> E[Forward to Provider]
    E --> F[Return Response]
```

**Key Points:**
- Use your **LiteLLM API key** in requests, not the provider's key
- LiteLLM handles the provider authentication internally
- Same authentication works across all passthrough endpoints

### Error Handling

**Provider Errors**: Forwarded directly to you with original error codes and messages

**LiteLLM Errors**: 
- `401`: Invalid LiteLLM API key
- `404`: Provider or endpoint not supported
- `500`: Internal routing/forwarding errors

### Benefits

- **Unified Authentication**: One API key for all providers
- **Centralized Logging**: All requests logged through LiteLLM
- **Cost Tracking**: Usage tracked across all endpoints
- **Access Control**: Same permissions apply to passthrough endpoints
````
