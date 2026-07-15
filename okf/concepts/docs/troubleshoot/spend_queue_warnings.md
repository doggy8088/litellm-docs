---
type: "Documentation page"
title: "Spend Queue Warnings"
description: "Spend Update Queue Full Warnings Overview The \"Spend update queue is full\" warning occurs in high volume LiteLLM proxy deployments when the internal spend tracking queue reaches..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/troubleshoot/spend_queue_warnings.md"
tags: ["docs","documentation-page"]
source_path: "docs/troubleshoot/spend_queue_warnings.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/troubleshoot/spend_queue_warnings.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/troubleshoot/spend_queue_warnings.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Spend Update Queue Full Warnings

## Overview

The "Spend update queue is full" warning occurs in high-volume LiteLLM proxy deployments when the internal spend tracking queue reaches capacity. This is a protective mechanism to prevent memory issues during traffic spikes.

## Warning Message

```
WARNING:litellm.proxy.db.db_transaction_queue.spend_update_queue:Spend update queue is full. Aggregating entries to prevent memory issues.
```

## Root Cause

The spend update queue has a default maximum size of 10,000 entries (`MAX_SIZE_IN_MEMORY_QUEUE=10000`). When this limit is reached:

1. New spend tracking entries are aggregated instead of queued individually
2. This prevents memory exhaustion but may slightly delay spend updates
3. The warning indicates your deployment is processing requests faster than the database can handle spend updates

## Solutions

### 1. Increase Queue Size

Set the `MAX_SIZE_IN_MEMORY_QUEUE` environment variable to a higher value:

```bash
MAX_SIZE_IN_MEMORY_QUEUE=50000
```

**Tradeoffs:**
Higher queue sizes store more items in memory - provision at least 8GB RAM for large queues
- Recommended for deployments with consistent high traffic

### 2. Horizontal Scaling

Deploy multiple proxy instances with load balancing. This distributes the spend tracking load across multiple queues, reducing the pressure on any single instance's spend update queue.



## Related Configuration

```yaml
# Environment variables
MAX_SIZE_IN_MEMORY_QUEUE: 10000  # Default queue size
```
````
