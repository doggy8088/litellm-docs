import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM AI Gateway 提示管理 {#litellm-ai-gateway-prompt-management}

使用 LiteLLM AI Gateway 來建立、管理並為您的提示進行版本控管。

## 快速開始 {#quick-start}

### 存取提示介面 {#accessing-the-prompts-interface}

1. 在您的 LiteLLM 儀表板中前往 **Experimental > Prompts**
2. 您會看到一個表格，顯示您所有現有的提示，包含以下欄位：
   - **Prompt ID**：每個提示的唯一識別碼
   - **Model**：為提示設定的 LLM 模型
   - **Created At**：提示建立時的時間戳記
   - **Updated At**：最後更新的時間戳記
   - **Type**：提示類型（例如，db）
   - **Actions**：刪除與管理提示選項（僅限管理員）

![提示表格](../../img/prompt_table.png)

## 建立提示 {#create-a-prompt}

按一下 **+ Add New Prompt** 按鈕以建立新提示。

### 步驟 1：選擇您的模型 {#step-1-select-your-model}

從頂部的下拉式選單中選擇您要使用的 LLM 模型。您可以從所有已設定的模型中選取（例如，`aws/anthropic/bedrock-claude-3-5-sonnet`、`gpt-4o` 等）。

### 步驟 2：設定開發者訊息  {#step-2-set-the-developer-message}

**Developer message** 區段可讓您為模型設定選用的系統指令。這會作為引導模型行為的系統提示。

範例：

```
Respond as jack sparrow would
```

這會指示模型以《神鬼奇航》中傑克船長的風格回應。

![新增含開發者訊息的提示](../../img/add_prompt.png)

### 步驟 3：新增提示訊息 {#step-3-add-prompt-messages}

在 **Prompt messages** 區段中，您可以新增實際的提示內容。按一下 **+ Add message** 以將額外訊息新增至您的提示範本。

### 步驟 4：在您的提示中使用變數 {#step-4-use-variables-in-your-prompts}

變數可讓您建立可在執行時自訂的動態提示。使用 `{{variable_name}}` 語法將變數插入您的提示中。

範例：

```
Give me a recipe for {{dish}}
```

UI 會自動偵測您提示中的變數，並將它們顯示在 **Detected variables** 區段。

![新增含變數的提示](../../img/add_prompt_var.png)

### 步驟 5：測試您的提示 {#step-5-test-your-prompt}

在儲存之前，您可以直接在 UI 中測試您的提示：

1. 在右側面板中填入範本變數（例如，將 `dish` 設為 `cookies`）
2. 在聊天介面中輸入訊息以測試提示
3. 助理將使用您設定的模型、開發者訊息與替換後的變數回應

![使用變數測試提示](../../img/add_prompt_use_var1.png)

結果將顯示模型使用您替換後變數的回應：

![提示測試結果](../../img/add_prompt_use_var.png)

### 步驟 6：儲存您的提示 {#step-6-save-your-prompt}

當您對提示感到滿意後，按一下右上角的 **Save** 按鈕，將其儲存到您的提示資料庫。

## 使用您的提示 {#using-your-prompts}

現在您的提示已發佈，您可以透過 LiteLLM proxy API 在應用程式中使用它。按一下 UI 中的 **Get Code** 按鈕，即可檢視為您的提示自訂的程式碼片段。

### 基本用法 {#basic-usage}

只要使用提示 ID 和模型即可呼叫提示：

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Basic Prompt Call"
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-4",
    "prompt_id": "your-prompt-id"
  }' | jq
```

</TabItem>
<TabItem value="python" label="Python">

```python showLineNumbers title="basic_prompt.py"
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

response = client.chat.completions.create(
    model="gpt-4",
    extra_body={
        "prompt_id": "your-prompt-id"
    }
)

print(response)
```

</TabItem>
<TabItem value="javascript" label="JavaScript">

```javascript showLineNumbers title="basicPrompt.js"
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: "sk-1234",
    baseURL: "http://localhost:4000"
});

async function main() {
    const response = await client.chat.completions.create({
        model: "gpt-4",
        prompt_id: "your-prompt-id"
    });
    
    console.log(response);
}

main();
```

</TabItem>
</Tabs>

### 使用自訂訊息 {#with-custom-messages}

將自訂訊息新增至您的提示：

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Prompt with Custom Messages"
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-4",
    "prompt_id": "your-prompt-id",
    "messages": [
      {
        "role": "user",
        "content": "hi"
      }
    ]
  }' | jq
```

</TabItem>
<TabItem value="python" label="Python">

```python showLineNumbers title="prompt_with_messages.py"
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "hi"}
    ],
    extra_body={
        "prompt_id": "your-prompt-id"
    }
)

print(response)
```

</TabItem>
<TabItem value="javascript" label="JavaScript">

```javascript showLineNumbers title="promptWithMessages.js"
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: "sk-1234",
    baseURL: "http://localhost:4000"
});

async function main() {
    const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "user", content: "hi" }
        ],
        prompt_id: "your-prompt-id"
    });
    
    console.log(response);
}

main();
```

</TabItem>
</Tabs>

### 使用提示變數 {#with-prompt-variables}

使用 `prompt_variables` 將變數傳遞給您的提示範本：

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Prompt with Variables"
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-4",
    "prompt_id": "your-prompt-id",
    "prompt_variables": {
      "dish": "cookies"
    }
  }' | jq
```

</TabItem>
<TabItem value="python" label="Python">

```python showLineNumbers title="prompt_with_variables.py"
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

response = client.chat.completions.create(
    model="gpt-4",
    extra_body={
        "prompt_id": "your-prompt-id",
        "prompt_variables": {
            "dish": "cookies"
        }
    }
)

print(response)
```

</TabItem>
<TabItem value="javascript" label="JavaScript">

```javascript showLineNumbers title="promptWithVariables.js"
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: "sk-1234",
    baseURL: "http://localhost:4000"
});

async function main() {
    const response = await client.chat.completions.create({
        model: "gpt-4",
        prompt_id: "your-prompt-id",
        prompt_variables: {
            "dish": "cookies"
        }
    });
    
    console.log(response);
}

main();
```

</TabItem>
</Tabs>

## 提示版本控管 {#prompt-versioning}

LiteLLM 會在每次您更新提示時自動為其建立版本。這讓您能保留完整的變更歷史，並在需要時回復到先前版本。

### 檢視提示詳細資料 {#view-prompt-details}

在提示表格中按一下任何提示 ID，即可檢視其詳細資料頁面。此頁面會顯示：
- **Prompt ID**：您提示的唯一識別碼
- **Version**：目前版本號碼（例如，v4）
- **Prompt Type**：儲存類型（例如，db）
- **Created At**：提示首次建立的時間
- **Last Updated**：最近一次更新的時間戳記
- **LiteLLM Parameters**：原始 JSON 設定

![提示詳細資料](../../img/edit_prompt.png)

### 更新提示 {#update-a-prompt}

若要更新現有提示：

1. 在提示表格中按一下您要更新的提示
2. 按一下右上角的 **Prompt Studio** 按鈕
3. 對以下項目進行變更：
   - 模型選擇
   - 開發者訊息（系統指令）
   - 提示訊息
   - 變數
4. 在右側聊天介面中測試您的變更
5. 按一下 **Update** 按鈕以儲存新版本

![在 Studio 中編輯提示](../../img/edit_prompt2.png)

每次按一下 **Update**，都會建立一個新版本（v1 → v2 → v3 等），同時維持相同的提示 ID。

### 檢視版本歷史 {#view-version-history}

若要檢視提示的所有版本：

1. 在 **Prompt Studio** 中開啟提示
2. 按一下右上角的 **History** 按鈕
3. 右側會開啟 **Version History** 面板

![版本歷史面板](../../img/edit_prompt3.png)

版本歷史面板會顯示：
- **Latest version**（以「Latest」徽章與「Active」狀態標示）
- 所有先前版本（v4、v3、v2、v1 等）
- 每個版本的時間戳記
- 資料庫儲存狀態（"Saved to Database"）

### 檢視並還原較舊版本 {#view-and-restore-older-versions}

若要檢視或還原較舊版本：

1. 在 **Version History** 面板中，按一下任何先前版本（例如，v2）
2. prompt studio 會載入該版本的設定
3. 您可以看到：
   - 該版本的開發者訊息
   - 該版本的提示訊息
   - 使用的模型與參數
   - 當時定義的所有變數

![檢視較舊版本](../../img/edit_prompt4.png)

所選版本會在版本歷史面板中以「Active」徽章醒目標示。

若要還原較舊版本：
1. 檢視您要還原的較舊版本
2. 按一下 **Update** 按鈕
3. 這會以較舊版本的內容建立一個新版本

### 在 API 請求中使用特定版本 {#use-specific-versions-in-api-calls}

預設情況下，API 請求會使用提示的最新版本。若要使用特定版本，請傳遞 `prompt_version` 參數：

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Use Specific Prompt Version"
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-4",
    "prompt_id": "jack-sparrow",
    "prompt_version": 2,
    "messages": [
      {
        "role": "user",
        "content": "Who are u"
      }
    ]
  }' | jq
```

</TabItem>
<TabItem value="python" label="Python">

```python showLineNumbers title="prompt_version.py"
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Who are u"}
    ],
    extra_body={
        "prompt_id": "jack-sparrow",
        "prompt_version": 2
    }
)

print(response)
```

</TabItem>
<TabItem value="javascript" label="JavaScript">

```javascript showLineNumbers title="promptVersion.js"
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: "sk-1234",
    baseURL: "http://localhost:4000"
});

async function main() {
    const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "user", content: "Who are u" }
        ],
        prompt_id: "jack-sparrow",
        prompt_version: 2
    });
    
    console.log(response);
}

main();
```

</TabItem>
</Tabs>
