import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Claude Code 外掛程式市集（Managed Skills） {#claude-code-plugin-marketplace-managed-skills}

LiteLLM AI Gateway 可作為 Claude Code 外掛程式的中央登錄中心。管理員可以治理組織內可用的外掛程式，而工程師則可以從單一來源探索並安裝已核准的外掛程式。

## 先決條件 {#prerequisites}

- LiteLLM Proxy 正在執行且已連接資料庫
- 可存取 LiteLLM UI 的管理員權限
- 外掛程式託管於 GitHub、GitLab，或任何可透過 git 存取的 URL

## 管理員指南：管理 Marketplace {#admin-guide-managing-the-marketplace}

### 步驟 1：前往 Claude Code Plugins {#step-1-navigate-to-claude-code-plugins}

在 LiteLLM Admin UI 中，點擊左側導覽選單的 **Claude Code Plugins**。

<Image img={require('../../img/claude_code_marketplace/step1_navigate_plugins.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 2：檢視外掛程式清單 {#step-2-view-the-plugins-list}

您會看到所有已註冊外掛程式的清單。您可以在此新增、啟用、停用或刪除外掛程式。

<Image img={require('../../img/claude_code_marketplace/step3_plugins_list.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 3：新增外掛程式 {#step-3-add-a-new-plugin}

點擊 **+ Add New Plugin** 以在您的 marketplace 中註冊外掛程式。

<Image img={require('../../img/claude_code_marketplace/step4_add_plugin.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 4：填入外掛程式詳細資訊 {#step-4-fill-in-plugin-details}

輸入外掛程式資訊：

- **Name**：外掛程式識別碼（kebab-case，例如 `my-plugin`）
- **Source Type**：選擇 GitHub、Git URL 或 Git Subdir
- **Repository/URL**：git 來源（例如 GitHub 的 `org/repo`）
- **Version**：語意化版本（選用）
- **Description**：外掛程式的功能
- **Category**：用於組織的外掛程式分類
- **Keywords**：搜尋詞彙

<Image img={require('../../img/claude_code_marketplace/step5_plugin_form.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 5：提交外掛程式 {#step-5-submit-the-plugin}

填寫完詳細資訊後，點擊 **Add Plugin** 來註冊它。

<Image img={require('../../img/claude_code_marketplace/step9_submit.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 6：啟用/停用外掛程式 {#step-6-enabledisable-plugins}

切換外掛程式的開啟或關閉狀態，以控制 public marketplace 中顯示的內容。只有**已啟用**的外掛程式對工程師可見。

<Image img={require('../../img/claude_code_marketplace/step11_enable_plugin.jpeg')} style={{ width: '800px', height: 'auto' }} />

## 工程師指南：安裝外掛程式 {#engineer-guide-installing-plugins}

### 步驟 1：新增 LiteLLM Marketplace {#step-1-add-the-litellm-marketplace}

將您公司的 LiteLLM marketplace 新增到 Claude Code：

```bash
claude plugin marketplace add http://your-litellm-proxy:4000/claude-code/marketplace.json
```

<Image img={require('../../img/claude_code_marketplace/step12_cli_marketplace.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 2：瀏覽可用外掛程式 {#step-2-browse-available-plugins}

列出 marketplace 中所有可用的外掛程式：

```bash
claude plugin search @litellm
```

### 步驟 3：安裝外掛程式 {#step-3-install-a-plugin}

從 marketplace 安裝任何外掛程式：

```bash
claude plugin install my-plugin@litellm
```

<Image img={require('../../img/claude_code_marketplace/step15_cli_paste.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 4：驗證安裝 {#step-4-verify-installation}

外掛程式現已安裝完成並可使用：

<Image img={require('../../img/claude_code_marketplace/step16_cli_complete.jpeg')} style={{ width: '800px', height: 'auto' }} />

## API 參考 {#api-reference}

### 公開端點（不需要驗證） {#public-endpoint-no-auth-required}

#### GET `/claude-code/marketplace.json` {#get-claude-codemarketplacejson}

回傳 Claude Code 探索用的 marketplace 目錄。

```bash
curl http://localhost:4000/claude-code/marketplace.json
```

**回應：**
```json
{
  "name": "litellm",
  "owner": {
    "name": "LiteLLM",
    "email": "support@litellm.ai"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": {
        "source": "github",
        "repo": "org/my-plugin"
      },
      "version": "1.0.0",
      "description": "My awesome plugin",
      "category": "productivity",
      "keywords": ["automation", "tools"]
    }
  ]
}
```

### 管理員端點（需要驗證） {#admin-endpoints-auth-required}

#### POST `/claude-code/plugins` {#post-claude-codeplugins}

註冊新的外掛程式。

```bash
curl -X POST http://localhost:4000/claude-code/plugins \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-plugin",
    "source": {"source": "github", "repo": "org/my-plugin"},
    "version": "1.0.0",
    "description": "My awesome plugin",
    "category": "productivity",
    "keywords": ["automation", "tools"]
  }'
```

#### GET `/claude-code/plugins` {#get-claude-codeplugins}

列出所有已註冊的外掛程式。

```bash
curl http://localhost:4000/claude-code/plugins \
  -H "Authorization: Bearer sk-..."
```

#### POST `/claude-code/plugins/{name}/enable` {#post-claude-codepluginsnameenable}

啟用外掛程式。

```bash
curl -X POST http://localhost:4000/claude-code/plugins/my-plugin/enable \
  -H "Authorization: Bearer sk-..."
```

#### POST `/claude-code/plugins/{name}/disable` {#post-claude-codepluginsnamedisable}

停用外掛程式。

```bash
curl -X POST http://localhost:4000/claude-code/plugins/my-plugin/disable \
  -H "Authorization: Bearer sk-..."
```

#### DELETE `/claude-code/plugins/{name}` {#delete-claude-codepluginsname}

刪除外掛程式。

```bash
curl -X DELETE http://localhost:4000/claude-code/plugins/my-plugin \
  -H "Authorization: Bearer sk-..."
```

## 外掛程式來源格式 {#plugin-source-formats}

<Tabs>
<TabItem value="github" label="GitHub">

```json
{
  "name": "my-plugin",
  "source": {
    "source": "github",
    "repo": "organization/repository"
  }
}
```

</TabItem>
<TabItem value="url" label="Git URL">

```json
{
  "name": "my-plugin",
  "source": {
    "source": "url",
    "url": "https://github.com/org/repo.git"
  }
}
```

GitLab、Bitbucket 或自架 git 儲存庫請使用此格式。

</TabItem>
<TabItem value="git-subdir" label="Git Subdir">

```json
{
  "name": "my-plugin",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/org/repo.git",
    "path": "plugins/my-plugin"
  }
}
```

當您的外掛程式位於 git 儲存庫的子目錄時，請使用此格式。`path` 欄位必須是以斜線分隔的相對路徑片段（僅限英數字元、點、連字號、底線）。

</TabItem>
</Tabs>

## 範例：設定內部外掛程式 Marketplace {#example-setting-up-an-internal-plugin-marketplace}

### 1. 建立內部外掛程式 {#1-create-internal-plugins}

建立您的外掛程式儲存庫結構：

```
my-company-plugin/
├── plugin.json          # Plugin manifest
├── SKILL.md            # Main skill file
├── skills/             # Additional skills
│   └── helper.md
└── README.md
```

### 2. 透過 API 註冊外掛程式 {#2-register-plugins-via-api}

```bash
# Register your internal tools plugin
curl -X POST http://localhost:4000/claude-code/plugins \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "internal-tools",
    "source": {"source": "github", "repo": "mycompany/internal-tools"},
    "version": "1.0.0",
    "description": "Internal development tools and utilities",
    "author": {"name": "Platform Team", "email": "platform@mycompany.com"},
    "category": "internal",
    "keywords": ["internal", "tools", "utilities"]
  }'
```

### 3. 在 Claude Code 中使用 {#3-use-in-claude-code}

將 marketplace URL 傳送給工程師：

```bash
# One-time setup for each engineer
claude plugin marketplace add http://litellm.internal.company.com/claude-code/marketplace.json

# Install company plugins
claude plugin install internal-tools@litellm
```

## 疑難排解 {#troubleshooting}

**外掛程式未顯示在 marketplace 中：**
- 確認外掛程式在 admin UI 中已**啟用**
- 檢查外掛程式是否具有有效的 `source` 欄位

**安裝失敗：**
- 確認工程師的電腦可以存取該 git 儲存庫
- 對於私人儲存庫，工程師需要設定適當的 git 認證

**資料庫錯誤：**
- 驗證 LiteLLM proxy 已連接到資料庫
- 檢查 proxy 記錄以取得詳細錯誤訊息
