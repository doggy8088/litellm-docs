---
title: "v1.84.3 - 供非 root 映像重新裁切 Dockerfile"
slug: "v1-84-3"
date: 2026-05-27T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.84.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.3
```

</TabItem>
</Tabs>

`v1.84.3` 是 [`v1.84.2`](/release_notes/v1.84.2/v1-84-2) 的僅 Dockerfile 重新裁切版本；應用程式程式碼完全相同。它將 `npm` 還原到 `Dockerfile.non_root` builder 階段，因此 `litellm-non_root:1.84.3` 映像可以建置，而 `1.84.2` 映像則無法。

如果您是從 [`v1.84.1`](/release_notes/v1.84.1/v1-84-1) 升級，請參閱 [`v1.84.2`](/release_notes/v1.84.2/v1-84-2) 附註以了解底層程式碼變更；特別是 [host-header authentication bypass advisory](/blog/host-header-auth-bypass) 所涵蓋的路徑處理強化。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/5560f35279...v1.84.3
