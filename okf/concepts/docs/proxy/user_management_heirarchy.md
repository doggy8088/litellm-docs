---
type: "Documentation page"
title: "User Management Heirarchy"
description: "User Management Hierarchy LiteLLM supports a hierarchy of users, teams, organizations, and budgets. Organizations can have multiple teams. API Reference Teams can have multiple..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/user_management_heirarchy.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/user_management_heirarchy.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/user_management_heirarchy.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/user_management_heirarchy.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Image from '@theme/IdealImage';


# User Management Hierarchy

<Image img={require('../../img/litellm_user_heirarchy.png')} style={{ width: '100%', maxWidth: '4000px' }} />

LiteLLM supports a hierarchy of users, teams, organizations, and budgets.

- Organizations can have multiple teams. [API Reference](https://litellm-api.up.railway.app/#/organization%20management)
- Teams can have multiple users. [API Reference](https://litellm-api.up.railway.app/#/team%20management)
- Users can have multiple keys, and be on multiple teams. [API Reference](https://litellm-api.up.railway.app/#/budget%20management)
- Keys can belong to either a team or a user. [API Reference](https://litellm-api.up.railway.app/#/end-user%20management)


:::info

See [Access Control](./access_control) for more details on roles and permissions.
:::
````
