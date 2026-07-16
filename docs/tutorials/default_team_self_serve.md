import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 為 AI 探索加入使用者 {#onboard-users-for-ai-exploration}

v1.73.0 新增了將新使用者指派給預設團隊的功能。這讓在您公司內啟用 LLM 實驗變得容易許多，讓使用者可以登入並建立 $10 金鑰以進行 AI 探索。 

### 1. 建立團隊 {#1-create-a-team}

建立一個名為 `internal exploration` 的團隊，並設定：
- `models`： 可存取特定模型（例如 `gpt-4o`、`claude-3-5-sonnet`）
- `max budget`： 團隊最高預算將確保整個團隊的支出永遠不超過某個金額。 
- `reset budget`： 將此設為每月。LiteLLM 會在每個月初重設預算。 
- `team member max budget`： 團隊成員最高預算將確保個別團隊成員的支出永遠不超過某個金額。 

<Image img={require('../../img/create_default_team.png')}  style={{ width: '600px', height: 'auto' }} />

### 2. 更新團隊成員權限 {#2-update-team-member-permissions}

點選您剛建立的團隊，並更新 `Member Permissions` 下的團隊成員權限。

這將允許所有團隊成員建立金鑰。 

<Image img={require('../../img/team_member_permissions.png')}  style={{ width: '600px', height: 'auto' }} />

### 3. 將團隊設為預設團隊 {#3-set-team-as-default-team}

前往 `Internal Users` -> `Default User Settings`，並將預設團隊設為您剛建立的團隊。 

我們也將預設模型設為 `no-default-models`。這表示使用者只能在團隊內建立金鑰。

<Image img={require('../../img/default_user_settings_with_default_team.png')}  style={{ width: '1000px', height: 'auto' }} />

### 4. 測試它！  {#4-test-it}

讓我們建立一個新使用者並進行測試。 

#### a. 建立新使用者 {#a-create-a-new-user}

建立一個電子郵件為 `test_default_team_user@xyz.com` 的新使用者。

<Image img={require('../../img/create_user.png')}  style={{ width: '600px', height: 'auto' }} />

在您點選 `Create User` 後，您會收到一個邀請連結，請先儲存起來。 

#### b. 驗證使用者已加入團隊 {#b-verify-user-is-added-to-the-team}

點選已建立的使用者，並驗證他們已加入團隊。 

我們可以看到該使用者已加入團隊，且沒有預設模型。 

<Image img={require('../../img/user_info_with_default_team.png')}  style={{ width: '1000px', height: 'auto' }} />

#### c. 以使用者身分登入  {#c-login-as-user}

現在使用 4a 的邀請連結以使用者身分登入。 

<Image img={require('../../img/new_user_login.png')}  style={{ width: '600px', height: 'auto' }} />

#### d. 驗證在未指定團隊的情況下無法建立金鑰 {#d-verify-you-cant-create-keys-without-specifying-a-team}

您應該會看到一則訊息，表示您需要選擇一個團隊。 

<Image img={require('../../img/create_key_no_team.png')}  style={{ width: '1000px', height: 'auto' }} />

#### e. 驗證在指定團隊時可以建立金鑰 {#e-verify-you-can-create-a-key-when-specifying-a-team}

<Image img={require('../../img/create_key_with_default_team.png')}  style={{ width: '1000px', height: 'auto' }} />

成功！ 

您現在應該會看到已建立的金鑰

<Image img={require('../../img/create_key_with_default_team_success.png')}  style={{ width: '600px', height: 'auto' }} />
