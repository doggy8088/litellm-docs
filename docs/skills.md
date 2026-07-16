# /skills - Anthropic Skills API {#skills---anthropic-skills-api}

| 功能 | 支援 | 
|---------|-----------|
| 成本追蹤 | ✅ |
| 記錄 | ✅ |
| 負載平衡 | ✅ |
| 支援的提供者 | `anthropic` |

:::tip

LiteLLM 遵循 [Anthropic Skills API](https://docs.anthropic.com/en/docs/build-with-claude/skills) 來建立、管理及使用可重複使用的 AI 功能。

:::

## **LiteLLM Python SDK 用法** {#litellm-python-sdk-usage}

### 快速入門 - 建立 Skill {#quick-start---create-a-skill}

```python showLineNumbers title="create_skill.py"
from litellm import create_skill
import zipfile
import os

# Create a SKILL.md file
skill_content = """---
name: test-skill
description: A custom skill for data analysis
---

# Test Skill

This skill helps with data analysis tasks.
"""

# Create skill directory and SKILL.md
os.makedirs("test-skill", exist_ok=True)
with open("test-skill/SKILL.md", "w") as f:
    f.write(skill_content)

# Create a zip file
with zipfile.ZipFile("test-skill.zip", "w") as zipf:
    zipf.write("test-skill/SKILL.md", "test-skill/SKILL.md")

# Create the skill
response = create_skill(
    display_title="My Custom Skill",
    files=[open("test-skill.zip", "rb")],
    custom_llm_provider="anthropic",
    api_key="sk-ant-..."
)

print(f"Skill created: {response.id}")
```

### 列出 Skills {#list-skills}

```python showLineNumbers title="list_skills.py"
from litellm import list_skills

response = list_skills(
    custom_llm_provider="anthropic",
    api_key="sk-ant-...",
    limit=20
)

for skill in response.data:
    print(f"{skill.display_title}: {skill.id}")
```

### 取得 Skill 詳細資料 {#get-skill-details}

```python showLineNumbers title="get_skill.py"
from litellm import get_skill

skill = get_skill(
    skill_id="skill_01...",
    custom_llm_provider="anthropic",
    api_key="sk-ant-..."
)

print(f"Skill: {skill.display_title}")
print(f"Description: {skill.description}")
```

### 刪除 Skill {#delete-a-skill}

```python showLineNumbers title="delete_skill.py"
from litellm import delete_skill

response = delete_skill(
    skill_id="skill_01...",
    custom_llm_provider="anthropic",
    api_key="sk-ant-..."
)

print(f"Deleted: {response.id}")
```

### 非同步用法 {#async-usage}

```python showLineNumbers title="async_skills.py"
from litellm import acreate_skill, alist_skills, aget_skill, adelete_skill
import asyncio

async def manage_skills():
    # Create skill
    with open("test-skill.zip", "rb") as f:
        skill = await acreate_skill(
            display_title="My Async Skill",
            files=[f],
            custom_llm_provider="anthropic",
            api_key="sk-ant-..."
        )
    
    # List skills
    skills = await alist_skills(
        custom_llm_provider="anthropic",
        api_key="sk-ant-..."
    )
    
    # Get skill
    skill_detail = await aget_skill(
        skill_id=skill.id,
        custom_llm_provider="anthropic",
        api_key="sk-ant-..."
    )
    
    # Delete skill (if no versions exist)
    # await adelete_skill(
    #     skill_id=skill.id,
    #     custom_llm_provider="anthropic",
    #     api_key="sk-ant-..."
    # )

asyncio.run(manage_skills())
```

## **LiteLLM Proxy 用法** {#litellm-proxy-usage}

LiteLLM 提供與 Anthropic 相容的 `/skills` 端點，用於管理 skills。

### 驗證 {#authentication}

Skills API 請求有兩種驗證方式：

**選項 1：使用預設 ANTHROPIC_API_KEY**

設定 `ANTHROPIC_API_KEY` 環境變數。未提供 `model` 參數的請求將使用此預設金鑰。

```yaml showLineNumbers title="config.yaml"
# No model_list needed - uses env var
# ANTHROPIC_API_KEY=sk-ant-...
```

```bash
# Request will use ANTHROPIC_API_KEY from environment
curl "http://0.0.0.0:4000/v1/skills?beta=true" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

**選項 2：指定模型以選擇憑證**

在設定中定義多個模型，並使用 `model` 參數指定要使用的憑證。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 基本用法 {#basic-usage}

以下所有範例都可搭配**任一**驗證選項使用（預設 env 金鑰或以模型為基礎的路由）。

#### 建立 Skill {#create-skill}

您可以上傳 ZIP 檔，或直接上傳 SKILL.md 檔案：

**選項 1：上傳 ZIP 檔**

```bash showLineNumbers title="create_skill_zip.sh"
curl "http://0.0.0.0:4000/v1/skills?beta=true" \
  -X POST \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02" \
  -F "display_title=My Skill" \
  -F "files[]=@test-skill.zip"
```

**選項 2：直接上傳 SKILL.md**

```bash showLineNumbers title="create_skill_md.sh"
curl "http://0.0.0.0:4000/v1/skills?beta=true" \
  -X POST \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02" \
  -F "display_title=My Skill" \
  -F "files[]=@test-skill/SKILL.md;filename=test-skill/SKILL.md"
```

#### 列出 Skills {#list-skills-1}

```bash showLineNumbers title="list_skills.sh"
curl "http://0.0.0.0:4000/v1/skills?beta=true" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

#### 取得 Skill {#get-skill}

```bash showLineNumbers title="get_skill.sh"
curl "http://0.0.0.0:4000/v1/skills/skill_01abc?beta=true" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

#### 刪除 Skill {#delete-skill}

```bash showLineNumbers title="delete_skill.sh"
curl "http://0.0.0.0:4000/v1/skills/skill_01abc?beta=true" \
  -X DELETE \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

### 以模型為基礎的路由（多帳號） {#model-based-routing-multi-account}

如果您有多個 Anthropic 帳號，可以使用以模型為基礎的路由來指定要使用的帳號：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-team-a
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY_TEAM_A
  
  - model_name: claude-team-b
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY_TEAM_B
```

接著使用 `model` 參數路由到特定帳號：

**建立具有路由的 Skill**

```bash showLineNumbers title="create_with_routing.sh"
# Route to Team A - using ZIP file
curl "http://0.0.0.0:4000/v1/skills?beta=true" \
  -X POST \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02" \
  -F "model=claude-team-a" \
  -F "display_title=Team A Skill" \
  -F "files[]=@test-skill.zip"

# Route to Team B - using direct SKILL.md upload
curl "http://0.0.0.0:4000/v1/skills?beta=true" \
  -X POST \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02" \
  -F "model=claude-team-b" \
  -F "display_title=Team B Skill" \
  -F "files[]=@test-skill/SKILL.md;filename=test-skill/SKILL.md"
```

**使用路由列出 Skills**

```bash showLineNumbers title="list_with_routing.sh"
# List Team A skills
curl "http://0.0.0.0:4000/v1/skills?beta=true&model=claude-team-a" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"

# List Team B skills
curl "http://0.0.0.0:4000/v1/skills?beta=true&model=claude-team-b" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

**使用路由取得 Skill**

```bash showLineNumbers title="get_with_routing.sh"
# Get skill from Team A
curl "http://0.0.0.0:4000/v1/skills/skill_01abc?beta=true&model=claude-team-a" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"

# Get skill from Team B
curl "http://0.0.0.0:4000/v1/skills/skill_01xyz?beta=true&model=claude-team-b" \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

**使用路由刪除 Skill**

```bash showLineNumbers title="delete_with_routing.sh"
# Delete skill from Team A
curl "http://0.0.0.0:4000/v1/skills/skill_01abc?beta=true&model=claude-team-a" \
  -X DELETE \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"

# Delete skill from Team B
curl "http://0.0.0.0:4000/v1/skills/skill_01xyz?beta=true&model=claude-team-b" \
  -X DELETE \
  -H "X-Api-Key: sk-1234" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: skills-2025-10-02"
```

## **SKILL.md 格式** {#skillmd-format}

Skills 需要一個帶有 YAML frontmatter 的 `SKILL.md` 檔案：

```markdown showLineNumbers title="SKILL.md"
---
name: test-skill
description: A brief description of what this skill does
license: MIT
allowed-tools:
  - computer_20250124
  - text_editor_20250124
---

# Test Skill

Detailed instructions for Claude on how to use this skill.

## Usage

Examples and best practices...
```

### YAML Frontmatter 要求 {#yaml-frontmatter-requirements}

| 欄位 | 必填 | 說明 |
|-------|----------|-------------|
| `name` | 是 | Skill 識別碼（僅限小寫、數字、連字號）。必須與目錄名稱相符。 |
| `description` | 是 | Skill 的簡短說明 |
| `license` | 否 | 授權類型（例如 MIT、Apache-2.0） |
| `allowed-tools` | 否 | 此 skill 可使用的 Claude 工具清單 |
| `metadata` | 否 | 額外的自訂中繼資料 |

**重要：** `name` 欄位必須與您的 skill 目錄名稱完全相符。範例來說，如果您的目錄是 `test-skill`，frontmatter 必須有 `name: test-skill`。

### 檔案結構 {#file-structure}

**選項 1：ZIP 檔結構**

Skills 必須封裝為與 skill 名稱相符的頂層目錄：

```
test-skill.zip
└── test-skill/         # Top-level folder (name must match skill name in SKILL.md)
    └── SKILL.md        # Required skill definition file
```

所有檔案都必須位於同一個頂層目錄中，且 `SKILL.md` 必須位於該目錄根目錄。

**選項 2：直接上傳 SKILL.md**

當直接上傳 `SKILL.md`（不建立 ZIP）時，您必須在 filename 參數中包含 skill 目錄路徑，以保留所需結構：

```bash
# The filename parameter must include the skill directory path
-F "files[]=@test-skill/SKILL.md;filename=test-skill/SKILL.md"
```

這會告訴 API，`SKILL.md` 屬於 `test-skill` 目錄。

**重要要求：**
- 資料夾名稱（在 ZIP 或 filename 路徑中）**必須與** SKILL.md frontmatter 中的 `name` 欄位完全相符
- `SKILL.md` 必須位於 skill 目錄根目錄（不能在子目錄中）
- 所有其他檔案都必須位於相同的 skill 目錄中

## **回應格式** {#response-format}

### Skill 物件 {#skill-object}

```json showLineNumbers
{
  "id": "skill_01abc123",
  "type": "skill",
  "name": "my-skill",
  "display_title": "My Custom Skill",
  "description": "A brief description",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "latest_version_id": "skillver_01xyz789"
}
```

### 列出 Skills 回應 {#list-skills-response}

```json showLineNumbers
{
  "data": [
    {
      "id": "skill_01abc",
      "type": "skill",
      "name": "skill-one",
      "display_title": "Skill One",
      "description": "First skill"
    },
    {
      "id": "skill_02def",
      "type": "skill",
      "name": "skill-two",
      "display_title": "Skill Two",
      "description": "Second skill"
    }
  ],
  "has_more": false,
  "first_id": "skill_01abc",
  "last_id": "skill_02def"
}
```


## **支援的提供者** {#supported-providers}

| 提供者 | 使用說明連結 |
|----------|---------------|
| Anthropic | [用法](#quick-start---create-a-skill) |
