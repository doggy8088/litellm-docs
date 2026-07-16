import Image from '@theme/IdealImage';


# 使用者管理階層 {#user-management-hierarchy}

<Image img={require('../../img/litellm_user_heirarchy.png')} style={{ width: '100%', maxWidth: '4000px' }} />

LiteLLM 支援使用者、團隊、組織與預算的階層。

- 組織可以有多個團隊。[API Reference](https://litellm-api.up.railway.app/#/organization%20management)
- 團隊可以有多個使用者。[API Reference](https://litellm-api.up.railway.app/#/team%20management)
- 使用者可以有多個金鑰，並且可以隸屬於多個團隊。[API Reference](https://litellm-api.up.railway.app/#/budget%20management)
- 金鑰可以屬於團隊或使用者。[API Reference](https://litellm-api.up.railway.app/#/end-user%20management)

:::info

請參閱 [Access Control](./access_control) 以了解角色與權限的更多詳細資訊。
:::
