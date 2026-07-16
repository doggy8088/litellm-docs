import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM 提示詞管理（GitOps） {#litellm-prompt-management-gitops}

將提示詞儲存為儲存在您儲存庫中的 `.prompt` 檔案，並直接與 LiteLLM 搭配使用。無需外部服務。

## 支援的整合 {#supported-integrations}

- **檔案系統**：在本機儲存 `.prompt` 檔案
- **BitBucket**：在具備團隊型存取控制的 BitBucket 儲存庫中儲存 `.prompt` 檔案
- **Gitlab**：在具備團隊型存取控制的 Gitlab 儲存庫中儲存 `.prompt` 檔案
## 快速開始 {#quick-start}

<Tabs>

<TabItem value="sdk" label="SDK">

**1. 建立 .prompt 檔案**

建立 `prompts/hello.prompt`：

```yaml
---
model: gpt-4
temperature: 0.7
---
System: You are a helpful assistant.

User: {{user_message}}
```

**2. 與 LiteLLM 一起使用**

```python
import litellm

# Set the global prompt directory
litellm.global_prompt_directory = "prompts/"

response = litellm.completion(
    model="dotprompt/gpt-4",
    prompt_id="hello",
    prompt_variables={"user_message": "What is the capital of France?"}
)
```

</TabItem>
<TabItem value="bitbucket" label="BITBUCKET">

**1. 在 BitBucket 中建立 .prompt 檔案**

在您的 BitBucket 儲存庫中建立 `prompts/hello.prompt`：

```yaml
---
model: gpt-4
temperature: 0.7
---
System: You are a helpful assistant.

User: {{user_message}}
```

**2. 設定 BitBucket 存取權限**

```python
import litellm

# Configure BitBucket access
bitbucket_config = {
    "workspace": "your-workspace",
    "repository": "your-repo",
    "access_token": "your-access-token",
    "branch": "main"
}

# Set global BitBucket configuration
litellm.set_global_bitbucket_config(bitbucket_config)
```

**3. 與 LiteLLM 一起使用**

```python
response = litellm.completion(
    model="bitbucket/gpt-4",
    prompt_id="hello",
    prompt_variables={"user_message": "What is the capital of France?"}
)
```

</TabItem>
<TabItem value="gitlab" label="GITLAB">

**1. 在 gitlab 儲存庫中建立 .prompt 檔案**

在您的 gitlab 儲存庫中建立 `prompts/hello.prompt`：

```yaml
---
model: gpt-4
temperature: 0.7
---
System: You are a helpful assistant.

User: {{user_message}}
```

**2. 設定 Gitlab 存取權限**

```python
import litellm

# Configure gitlab access
gitlab_config = {
    "workspace": "your-workspace",
    "repository": "your-repo",
    "access_token": "your-access-token",
    "branch": "main"
}

# Set global gitlab configuration
litellm.set_global_gitlab_config(gitlab_config)
```

**3. 與 LiteLLM 一起使用**

```python
response = litellm.completion(
    model="gitlab/gpt-4",
    prompt_id="hello",
    prompt_variables={"user_message": "What is the capital of France?"}
)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 建立 .prompt 檔案**

建立 `prompts/hello.prompt`：

```yaml
---
model: gpt-4
temperature: 0.7
---
System: You are a helpful assistant.

User: {{user_message}}
```

**2. 設定 config.yaml**

```yaml
model_list:
  - model_name: my-dotprompt-model
    litellm_params:
      model: dotprompt/gpt-4
      prompt_id: "hello"
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  global_prompt_directory: "./prompts"
  # Or use BitBucket for team-based prompt management
  global_bitbucket_config:
    workspace: "your-workspace"
    repository: "your-repo"
    access_token: "your-access-token"
    branch: "main"
  # Or use Gitlab for team-based prompt management
  global_gitlab_config:
    workspace: "your-workspace"
    repository: "your-repo"
    access_token: "your-access-token"
    branch: "main"
```

**3. 啟動 proxy**

```bash
litellm --config config.yaml --detailed_debug
```

**4. 測試它！**

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "my-dotprompt-model",
    "messages": [{"role": "user", "content": "IGNORED"}],
    "prompt_variables": {
        "user_message": "What is the capital of France?"
    }
}'
```

</TabItem>
</Tabs>

### .prompt 檔案格式 {#prompt-file-format}

`.prompt` 檔案使用 YAML frontmatter 作為中繼資料，並支援 Jinja2 樣板化：

```yaml
---
model: gpt-4                    # Model to use
temperature: 0.7                # Optional parameters
max_tokens: 1000
input:
  schema:
    user_message: string        # Input validation (optional)
---
System: You are a helpful {{role}} assistant.

User: {{user_message}}
```

### 進階功能 {#advanced-features}

**多角色對話：**

```yaml
---
model: gpt-4
temperature: 0.3
---
System: You are a helpful coding assistant.

User: {{user_question}}
```

**動態模型選擇：**

```yaml
---
model: "{{preferred_model}}"  # Model can be a variable
temperature: 0.7
---
System: You are a helpful assistant specialized in {{domain}}.

User: {{user_message}}
```

### API 參考 {#api-reference}

對於提示詞整合，請使用這些參數：

**檔案系統（dotprompt）：**
```
model: dotprompt/<base_model>     # required (e.g., dotprompt/gpt-4)
prompt_id: str                    # required - the .prompt filename without extension
prompt_variables: Optional[dict]  # optional - variables for template rendering
```

**BitBucket：**
```
model: bitbucket/<base_model>     # required (e.g., bitbucket/gpt-4)
prompt_id: str                    # required - the .prompt filename without extension
prompt_variables: Optional[dict]  # optional - variables for template rendering
bitbucket_config: Optional[dict]  # optional - BitBucket configuration (if not set globally)
```

**Gitlab：**
```
model: gitlab/<base_model>        # required (e.g., gitlab/gpt-4)
prompt_id: str                    # required - the .prompt filename without extension
prompt_variables: Optional[dict]  # optional - variables for template rendering
gitlab_config: Optional[dict]     # optional - Gitlab configuration (if not set globally)
```

**API 呼叫範例：**

```python
# File system integration
response = litellm.completion(
    model="dotprompt/gpt-4",
    prompt_id="hello",
    prompt_variables={"user_message": "Hello world"},
    messages=[{"role": "user", "content": "This will be ignored"}]
)

# BitBucket integration
response = litellm.completion(
    model="bitbucket/gpt-4",
    prompt_id="hello",
    prompt_variables={"user_message": "Hello world"},
    bitbucket_config={
        "workspace": "your-workspace",
        "repository": "your-repo",
        "access_token": "your-token"
    }
)

# Gitlab integration
response = litellm.completion(
    model="gitlab/gpt-4",
    prompt_id="hello",
    prompt_variables={"user_message": "Hello world"},
    gitlab_config={
        "project": "a/b/<repo_name>",
        "access_token": "your-access-token",
        "base_url": "gitlab url",
        "prompts_path": "src/prompts", # folder to point to, defaults to root
        "branch":"main"  # optional, defaults to main
    }
)
```
