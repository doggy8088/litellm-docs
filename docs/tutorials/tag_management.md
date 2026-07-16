import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# [Beta] 根據請求中繼資料進行路由 {#beta-routing-based-on-request-metadata}

根據請求中繼資料建立路由規則。

## 設定 {#setup}

將以下內容加入您的 litellm proxy 設定 yaml 檔案。

```yaml showLineNumbers title="litellm proxy config.yaml"
router_settings:
  enable_tag_filtering: True # 👈 Key Change
```

## 1. 建立標籤 {#1-create-a-tag}

在 LiteLLM UI 中，前往 Experimental > Tag Management > Create Tag。

建立一個名為 `private-data` 的標籤，並且只選取具有此標籤的請求允許使用的模型。建立後，您會在 Tag Management 頁面看到該標籤。

<Image img={require('../../img/tag_create.png')}  style={{ width: '800px', height: 'auto' }} />

## 2. 測試標籤路由 {#2-test-tag-routing}

現在我們將測試基於標籤的路由規則。

### 2.1 無效模型 {#21-invalid-model}

此請求會失敗，因為我們送出 `tags=private-data`，但模型 `gpt-4o` 不在 `private-data` 標籤允許的模型中。

<Image img={require('../../img/tag_invalid.png')}  style={{ width: '800px', height: 'auto' }} />

<br />

以下是使用 OpenAI Python SDK 傳送相同請求的範例。
<Tabs>
<TabItem value="python" label="OpenAI Python SDK">

```python showLineNumbers
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000/v1/"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello, how are you?"}
    ],
    extra_body={
        "tags": "private-data"
    }
)
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "tags": "private-data"
}'
```

</TabItem>
</Tabs>

<br />

### 2.2 有效模型 {#22-valid-model}

此請求會成功，因為我們送出 `tags=private-data`，而模型 `us.anthropic.claude-3-7-sonnet-20250219-v1:0` 在 `private-data` 標籤允許的模型中。

<Image img={require('../../img/tag_valid.png')}  style={{ width: '800px', height: 'auto' }} />

以下是使用 OpenAI Python SDK 傳送相同請求的範例。

<Tabs>
<TabItem value="python" label="OpenAI Python SDK">

```python showLineNumbers
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000/v1/"
)

response = client.chat.completions.create(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    messages=[
        {"role": "user", "content": "Hello, how are you?"}
    ],
    extra_body={
        "tags": "private-data"
    }
)
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "tags": "private-data"
}'
```

</TabItem>
</Tabs>

## 其他標籤功能 {#additional-tag-features}
- [在請求標頭中傳送標籤](https://docs.litellm.ai/docs/proxy/tag_routing#calling-via-request-header)
- [基於標籤的路由](https://docs.litellm.ai/docs/proxy/tag_routing)
- [依標籤追蹤支出](cost_tracking#-custom-tags)
- [為虛擬金鑰、團隊設定預算](users)
