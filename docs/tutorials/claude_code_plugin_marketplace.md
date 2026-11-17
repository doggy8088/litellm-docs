import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Claude Code 外掛程式市集（Managed Skills） {#claude-code-plugin-marketplace-managed-skills}

LiteLLM AI Gateway 可作為 Claude Code 外掛程式的中央登錄中心。管理員可以治理組織內可用的外掛程式，而工程師則可以從單一來源探索並安裝已核准的外掛程式。

## 先決條件 {#prerequisites}

- LiteLLM Proxy 已連接資料庫執行中
- 可存取 LiteLLM UI 的管理員權限
- 託管於 GitHub、GitLab、任何可透過 git 存取的 URL，或位於 HTTPS 主機上的 zip 壓縮檔中的外掛程式

## 管理員指南：管理 Marketplace {#admin-guide-managing-the-marketplace}

### 步驟 1：前往 Skills {#step-1-navigate-to-skills}

在 LiteLLM 管理 UI 中，點選左側導覽選單中的 **Skills**。只有 proxy 管理員可以新增、編輯、啟用、停用或刪除外掛程式。

<Image img={require('../../img/claude_code_marketplace/step1_navigate_plugins.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 2：檢視外掛程式清單 {#step-2-view-the-plugins-list}

您會看到所有已註冊外掛程式的清單。您可以在此新增、啟用、停用或刪除外掛程式。

<Image img={require('../../img/claude_code_marketplace/step3_plugins_list.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 3：新增外掛程式 {#step-3-add-a-new-plugin}

點選 **+ Add Skill**，即可在您的 marketplace 中註冊外掛程式。

<Image img={require('../../img/claude_code_marketplace/step4_add_plugin.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 4：填入外掛程式詳細資訊 {#step-4-fill-in-plugin-details}

先貼上來源 URL。它可以是 GitHub URL、透過 HTTPS 或 SSH 的 git clone URL、指向子目錄的 `tree/<branch>/<path>` 連結，或指向 zip 檔案的 HTTPS 連結。LiteLLM 會偵測來源類型並建議名稱。接著填入名稱（kebab-case，例如 `my-plugin`）以及任何選填欄位：domain、namespace、description、category、keywords、version 和 author。

<Image img={require('../../img/claude_code_marketplace/step5_plugin_form.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 5：提交外掛程式 {#step-5-submit-the-plugin}

填妥詳細資訊後，點選 **Add Skill** 以完成註冊。

<Image img={require('../../img/claude_code_marketplace/step9_submit.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 6：啟用/停用外掛程式 {#step-6-enabledisable-plugins}

新增的外掛程式會在加入後立即啟用。切換外掛程式的開啟或關閉，以控制哪些內容會顯示在公開 marketplace 中。已啟用的外掛程式對所有人可見。已停用的外掛程式只會對透過 **Allowed Skills**（`object_permission.skills`）被授權的金鑰或團隊可見，如 [Private skills](../skills_gateway.md#private-skills) 所述。

<Image img={require('../../img/claude_code_marketplace/step11_enable_plugin.jpeg')} style={{ width: '800px', height: 'auto' }} />

## 工程師指南：安裝外掛程式 {#engineer-guide-installing-plugins}

### 步驟 1：新增 LiteLLM Marketplace {#step-1-add-the-litellm-marketplace}

將您公司的 LiteLLM marketplace 新增到 Claude Code：

```bash
claude plugin marketplace add http://your-litellm-proxy:4000/claude-code/marketplace.json
```

如果您已獲授私有外掛程式，請加入您的金鑰，它們也會顯示出來：

```bash
claude plugin marketplace add "http://your-litellm-proxy:4000/claude-code/marketplace.json?key=sk-..."
```

`?key=` 形式只有在 `claude_code_marketplace_auth_required` 關閉時才有效。若您的 proxy 要求 marketplace 需要金鑰，請依照[要求 marketplace 需要金鑰](#require-a-key-for-the-marketplace)所示，透過 `settings.json` 加入。

<Image img={require('../../img/claude_code_marketplace/step12_cli_marketplace.jpeg')} style={{ width: '800px', height: 'auto' }} />

### 步驟 2：瀏覽可用外掛程式 {#step-2-browse-available-plugins}

在 Claude Code 中執行 `/plugin`，即可從 `litellm` marketplace 瀏覽外掛程式，或從 proxy 列出它們：

```bash
curl http://your-litellm-proxy:4000/claude-code/marketplace.json
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

## 要求 marketplace 需要金鑰 {#require-a-key-for-the-marketplace}

<SinceVersion v="1.109.0" />

依預設，`GET /claude-code/marketplace.json` 會將已啟用的外掛程式提供給任何能連上 proxy 的人。若要要求 LiteLLM 金鑰，請在您的 proxy 設定中開啟 `claude_code_marketplace_auth_required`：

```yaml
general_settings:
  claude_code_marketplace_auth_required: true
```

此設定是布林值，預設為 `false`。加上引號的 `"true"`，例如來自環境變數或儲存在資料庫中的值，也會開啟它。在 `config.yaml` 中，若值不是布林值，proxy 會在啟動時停止，並出現指出該設定名稱的驗證錯誤。

開啟此設定後，端點只從標頭讀取金鑰，`Authorization: Bearer <key>` 或 `x-litellm-api-key: Bearer <key>` 皆可，且不接受 `?key=` 查詢參數。沒有金鑰、使用未知金鑰或帶有 `?key=` 參數的請求會得到 `401`，並附帶 `WWW-Authenticate: Bearer` 標頭，而 Claude Code 在您加入 marketplace 時會顯示 `HTTP 401`。`allowed_routes` 未包含 `/claude-code/marketplace.json` 的金鑰會得到 `403`。此設定也會讓 `GET /public/skill_hub` 回傳空清單，因此公開模型中心的 Skills 分頁會是空的。若您同時設定 `allow_requests_on_db_unavailable: true`，在資料庫中斷期間 proxy 無法檢查的金鑰會得到 `503`，而不是目錄。

接著，每位工程師將金鑰加入其使用者 `~/.claude/settings.json` 中 marketplace 來源的 `headers`。請避免使用專案的 `.claude/settings.json`，因為該檔案經常被提交到儲存庫：

```json
{
  "extraKnownMarketplaces": {
    "litellm": {
      "source": {
        "source": "url",
        "url": "https://<your-proxy>/claude-code/marketplace.json",
        "headers": {
          "Authorization": "Bearer <your-litellm-key>"
        }
      }
    }
  }
}
```

若您先前已用 `/plugin marketplace add` 加入 marketplace，請先在 Claude Code 中執行 `/plugin marketplace remove litellm`。然後照舊以 `/plugin install <plugin>@litellm` 安裝外掛程式。proxy 要求金鑰後，管理 UI 會在 skill 的頁面上，於 **How to Use** 下方的 **See one-time setup** 顯示相同的程式碼片段。

這樣金鑰會以明文保存在設定檔中。若要改由指令輸出標頭，請在 `https://` 的 `url` 來源上設定 Claude Code 的 [`headersHelper`](https://code.claude.com/docs/en/settings-reference#marketplace-source-types)，這需要 Claude Code v2.1.238 或更新版本。

## API 參考 {#api-reference}

### Marketplace 端點（除非要求金鑰，否則公開） {#marketplace-endpoint-public-unless-a-key-is-required}

#### GET `/claude-code/marketplace.json` {#get-claude-codemarketplacejson}

回傳供 Claude Code 探索使用的 marketplace 目錄。除非開啟 `claude_code_marketplace_auth_required`，否則此端點是公開的；開啟時需要標頭中帶有 LiteLLM 金鑰，如[要求 marketplace 需要金鑰](#require-a-key-for-the-marketplace)所述。此設定關閉時，沒有金鑰的請求會列出已啟用的外掛程式，帶有 `?key=sk-...` 的請求還會列出授權給該金鑰或其團隊的已停用外掛程式。開啟此設定時，標頭中的金鑰也有相同效果。

```bash
curl http://localhost:4000/claude-code/marketplace.json
```

開啟此設定時，請在標頭中傳送金鑰：

```bash
curl http://localhost:4000/claude-code/marketplace.json \
  -H "Authorization: Bearer sk-..."
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

### 管理端點（需要驗證） {#management-endpoints-auth-required}

以下每個寫入端點都需要 proxy 管理員金鑰，且會拒絕任何其他金鑰並回傳 `401` 或 `403`。讀取端點接受任何金鑰，並且只會回傳對其可見的外掛程式。

#### POST `/claude-code/plugins` {#post-claude-codeplugins}

註冊新的外掛程式。這只會建立；若名稱已存在，則會回傳 `409`。

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

`installation_preference` 是選填欄位，可用值為 `available`、`auto_install` 或 `required`。它需要 `archive` 來源，因此將它加到上方的 github 範例會回傳 `400`。請參閱[在 Claude Desktop 中自動安裝外掛程式](#auto-install-plugins-in-claude-desktop)。

#### GET `/claude-code/plugins` {#get-claude-codeplugins}

列出呼叫端可見的外掛程式：如果是 proxy 管理員，則顯示全部；否則顯示已啟用的外掛程式以及授權給該金鑰的外掛程式。加入 `?enabled_only=true` 可僅回傳已啟用的外掛程式。

```bash
curl http://localhost:4000/claude-code/plugins \
  -H "Authorization: Bearer sk-..."
```

#### GET `/claude-code/plugins/{name}` {#get-claude-codepluginsname}

取得單一外掛程式。若是未授權給呼叫端的已停用外掛程式，則回傳 `403`。

```bash
curl http://localhost:4000/claude-code/plugins/my-plugin \
  -H "Authorization: Bearer sk-..."
```

#### PUT `/claude-code/plugins/{name}` {#put-claude-codepluginsname}

取代既有的外掛程式。名稱來自路徑，且無法變更。這是完整取代，因此未提供的欄位會重設為預設值，若省略 `version` 與 `installation_preference`，則會清除它們。

```bash
curl -X PUT http://localhost:4000/claude-code/plugins/my-plugin \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "source": {"source": "github", "repo": "org/my-plugin"},
    "version": "1.1.0",
    "description": "My awesome plugin, now with more tools",
    "category": "productivity",
    "keywords": ["automation", "tools"]
  }'
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

## 在 Claude Desktop 中自動安裝外掛程式 {#auto-install-plugins-in-claude-desktop}

<SinceVersion v="1.107.0" />

當您的 LiteLLM proxy 同時是 Claude Desktop 的推論閘道時，第三方模式下的 Claude Desktop 可以為每位使用者安裝外掛程式，無需每位使用者各自選擇加入。在外掛程式上設定 `installation_preference`，LiteLLM 就會在該外掛程式的 `marketplace.json` 項目中以 `installationPreference` 提供它。此欄位僅能透過 API 設定，因為管理 UI 尚無對應的控制項。`GET /claude-code/plugins`、`GET /claude-code/plugins/{name}` 與 `GET /public/skill_hub` 會以 `installation_preference` 回傳它。`sha256` 必須是 zip 的 64 字元十六進位 SHA-256 摘要。下方的摘要只是範例，請換成 `shasum -a 256 my-plugin-1.0.0.zip` 的輸出。LiteLLM 只檢查摘要是否為 64 個十六進位字元，不檢查它是否與 zip 相符；而 Anthropic 的 [Claude Desktop 擴充功能文件](https://claude.com/docs/third-party/claude-desktop/extensions)指出，若一次同步中有任何封存檔下載失敗或未通過摘要檢查，Desktop 就不會從該次同步安裝任何東西，因此一個錯誤的摘要就會阻擋此 marketplace 的所有自動安裝：

```bash
curl -X POST http://localhost:4000/claude-code/plugins \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-plugin",
    "source": {
      "source": "archive",
      "url": "https://litellm.example.com/plugins/my-plugin-1.0.0.zip",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    "installation_preference": "auto_install"
  }'
```

該外掛程式在 `marketplace.json` 中的項目接著會像這樣：

```json
{
  "name": "my-plugin",
  "source": {
    "source": "archive",
    "url": "https://litellm.example.com/plugins/my-plugin-1.0.0.zip",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "version": "1.0.0",
  "installationPreference": "auto_install"
}
```

Claude Desktop 只有在 `marketplace.json` 是從其 `inferenceGatewayBaseUrl` 或 `bootstrapUrl` 來源提供時，才會採用個別外掛程式的 `installationPreference`，且僅限於 zip 位於同一來源、帶有 `sha256` 的 `archive` 來源。依據同一份 Anthropic 文件，它根本不會從 `marketplace.json` URL 列出其他來源類型，因此當 `installation_preference` 設在不是 `archive` 來源的外掛程式上，或在沒有 `sha256` 的封存檔上設定 `auto_install` 或 `required` 時，LiteLLM 會回應 400。LiteLLM 不檢查封存檔的來源，也不自行提供外掛程式 zip，因此範例中像 `/plugins/` 這樣的路徑會回傳 `404`，直到您在 ingress 將它路由到您自己的檔案伺服器、且與 proxy 位於同一來源為止。LiteLLM 也接受以 `installationPreference`（Claude Desktop 讀取的名稱）作為請求鍵，當單一請求同時以兩種拼法傳送值時，會回應 422。

Claude Desktop 2.31226.1 將個別外掛程式的 `required` 視為與 `auto_install` 相同。它會自行安裝外掛程式，但使用者仍可將它關閉或移除，且被移除的外掛程式在下一次同步時仍保持移除。Claude Desktop 中整個 marketplace 的 `required` 設定，才是阻止使用者移除外掛程式的那一個。

Claude Desktop 傳送 marketplace URL 時不會帶 `?key=`，而在 `claude_code_marketplace_auth_required` 關閉時，LiteLLM 不會讀取 Desktop 隨之傳送的 bearer token，因此 Desktop 只會看到已啟用的外掛程式。開啟此設定時，Desktop 傳送的 bearer token 必須是 LiteLLM 金鑰，否則 marketplace 會回應 `401`。請啟用自動安裝的外掛程式，而不是將它授權給金鑰或團隊。此設定關閉時，啟用會讓外掛程式變成公開的，因此它的名稱、說明、封存檔 URL 與 `sha256` 會在未經驗證的情況下出現在 `marketplace.json` 與 `GET /public/skill_hub` 中。在 Claude Desktop 自己的 marketplace 設定中，請將項目的 `installationPreference` 保持為 `available`，讓個別外掛程式的值來決定。Desktop 端的設定請參閱 [Per-plugin auto-install from a trusted origin](https://claude.com/docs/third-party/claude-desktop/extensions#per-plugin-auto-install-from-a-trusted-origin)。

:::warning 較舊的 Claude Code 版本

Claude Code 2.1.119 與更早版本會拒絕列出任何 `archive` 外掛程式的 `marketplace.json`，因此其中的每個外掛程式執行 `claude plugin marketplace add` 與 `claude plugin marketplace update` 都會失敗。2.1.120 到 2.1.223 版可以加入 marketplace，但 `claude plugin install` 對 `archive` 外掛程式會失敗。依據[外掛程式 marketplace 參考](https://code.claude.com/docs/en/plugins/marketplace-reference)，Claude Code 2.1.224 是第一個能安裝 `archive` 外掛程式的版本。LiteLLM 只在 `archive` 外掛程式上提供 `installationPreference`，因此此欄位不會帶來新的中斷。在加入 `archive` 外掛程式之前，請將此 marketplace 的每位 Claude Code 使用者升級到 2.1.224 或更新版本。Claude Code 會忽略 `installationPreference`，因此這些使用者仍以 `/plugin install` 安裝外掛程式。

:::

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
<TabItem value="archive" label="Zip Archive">

```json
{
  "name": "my-plugin",
  "source": {
    "source": "archive",
    "url": "https://bucket.s3.amazonaws.com/plugins/my-plugin.zip",
    "sha256": "<optional 64-character hex digest>"
  }
}
```

若外掛程式是以 zip 檔形式封裝於任何 HTTPS 主機上，例如 S3，請使用此格式。`url` 必須使用 HTTPS，而 `sha256` 在設定時必須是該封存檔的 64 字元十六進位摘要。

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

**外掛程式未出現在 marketplace 中：**
- 確認外掛程式在管理 UI 中已**啟用**，或已授權給您的金鑰，且您已使用 `?key=` 加入 marketplace。`?key=` 參數只有在 `claude_code_marketplace_auth_required` 關閉時才有效。開啟時，請依照[要求 marketplace 需要金鑰](#require-a-key-for-the-marketplace)所示，在 marketplace 來源的 `headers` 中傳送金鑰。
- 執行 `claude plugin marketplace update litellm` 以重新整理目錄的本機副本

**加入 marketplace 時出現 `HTTP 401`：**
- proxy 已開啟 `claude_code_marketplace_auth_required`，且標頭中沒有有效的金鑰。請依照[要求 marketplace 需要金鑰](#require-a-key-for-the-marketplace)所示，將您的 LiteLLM 金鑰加入 marketplace 來源的 `headers`。

**安裝失敗：**
- 確認 git 儲存庫可從工程師的電腦存取
- 對於私有儲存庫，工程師需要設定適當的 git 認證
- 對於 `git-subdir` 來源，請檢查 `path` 是否與儲存庫中的 skill 目錄一致；否則 Claude Code 會回報 `Subdirectory '<path>' not found`

**資料庫錯誤：**
- 驗證 LiteLLM proxy 已連接到資料庫
- 檢查 proxy 記錄以取得詳細錯誤訊息
