---
type: "Documentation page"
title: "Memory Issues"
description: "Memory Issue Classification & Reproduction 1. Classify the Memory Issue Select the option(s) that best describe the memory behavior observed: [ ] Memory scales with traffic (RPS..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/troubleshoot/memory_issues.md"
tags: ["docs","documentation-page"]
source_path: "docs/troubleshoot/memory_issues.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/troubleshoot/memory_issues.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/troubleshoot/memory_issues.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Memory Issue Classification & Reproduction

## 1. Classify the Memory Issue

Select the option(s) that best describe the memory behavior observed:

- [ ] Memory scales with traffic (RPS-driven)  
- [ ] Memory increases without a traffic increase  
- [ ] Memory increases after a LiteLLM upgrade  
- [ ] Memory leak (memory continuously grows over time)  
- [ ] Out of Memory (OOM) events or pod restarts

---

## 2. Can you reproduce the issue?

Before escalating, verify whether the memory or OOM issue can be reproduced in a test environment that mirrors your production deployment.  

If reproducible, provide **detailed reproduction steps** along with any relevant requests, workloads, or configuration used.  
For guidance on the type of information we’re looking for, see the [LiteLLM Troubleshooting Guide](../troubleshoot).

---

## 3. Issue Cannot Be Reproduced

If the memory or OOM issue cannot be reproduced in a test environment that mirrors production, please provide:

1. **Information from Sections 1 and 2**  
   - Memory/issue classification (Section 1)  
   - Reproduction attempts and environment details (Section 2)  

2. **Additional context** to help investigate:  
   - **Workload:** A realistic sample of requests processed before and during the spike, including any recent configuration changes.  
   - **Metrics:** Memory usage, CPU usage, P50/P99 latency, and any pod restarts or OOM events. Please include **screenshots** of the metrics whenever possible.  
   - **Logs / Alerts:** Any relevant logs or alerts captured **before and during the spike**, including OOM errors or stack traces if available.

> Providing this information allows the team to analyze patterns, correlate memory spikes or OOMs with traffic or configuration, and attempt to reproduce the issue internally. Without it, our engineers will not have enough information to investigate the problem.
````
