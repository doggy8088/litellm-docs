---
title: v1.63.0 - Anthropic 'thinking' 回應更新
slug: v1.63.0
date: 2025-03-05T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [llm translation, thinking, reasoning_content, claude-3-7-sonnet]
hide_table_of_contents: false
---

v1.63.0 修正了 Anthropic 'thinking' 回應在串流時傳回 `signature` 區塊。[Github Issue](https://github.com/BerriAI/litellm/issues/8964)

同時也將回應結構從 `signature_delta` 移至 `signature`，使其與 Anthropic 保持一致。[Anthropic Docs](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#implementing-extended-thinking)

## 差異 {#diff}

```bash
"message": {
    ...
    "reasoning_content": "The capital of France is Paris.",
    "thinking_blocks": [
        {
            "type": "thinking",
            "thinking": "The capital of France is Paris.",
-            "signature_delta": "EqoBCkgIARABGAIiQL2UoU0b1OHYi+..." # 👈 OLD FORMAT
+            "signature": "EqoBCkgIARABGAIiQL2UoU0b1OHYi+..." # 👈 KEY CHANGE
        }
    ]
}
```
