---
type: "Documentation page"
title: "Custom Root Ui"
description: "UI Custom Root Path 💥 Use this when you want to serve LiteLLM on a custom base url path like https://localhost:4000/api/v1 :::info Requires v1.72.3 or higher. ::: Limitations:..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/custom_root_ui.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/custom_root_ui.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/custom_root_ui.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/custom_root_ui.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# UI - Custom Root Path 

💥 Use this when you want to serve LiteLLM on a custom base url path like `https://localhost:4000/api/v1` 

:::info

Requires v1.72.3 or higher.

:::

Limitations:
- This does not work in [litellm non-root](./deploy#non-root---without-internet-connection) images, as it requires write access to the UI files.

## Usage

### 1. Set `SERVER_ROOT_PATH` in your .env

👉 Set `SERVER_ROOT_PATH` in your .env and this will be set as your server root path

```
export SERVER_ROOT_PATH="/api/v1"
```

### 2. Run the Proxy

```shell
litellm proxy --config /path/to/config.yaml
```

After running the proxy you can access it on `http://0.0.0.0:4000/api/v1/` (since we set `SERVER_ROOT_PATH="/api/v1"`)

### 3. Verify Running on correct path

<Image img={require('../../img/custom_root_path.png')} />

**That's it**, that's all you need to run the proxy on a custom root path


## Demo

[Here's a demo video](https://drive.google.com/file/d/1zqAxI0lmzNp7IJH1dxlLuKqX2xi3F_R3/view?usp=sharing) of running the proxy on a custom root path
````
