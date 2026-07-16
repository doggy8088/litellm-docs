import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Argilla {#argilla}

Argilla 是一個供 AI 工程師與領域專家協作的標註工具，可用來為他們的專案建立高品質資料集。

## 開始使用 {#getting-started}

若要將資料記錄到 Argilla，首先需要部署 Argilla 伺服器。如果您尚未部署 Argilla 伺服器，請依照 [這裡](https://docs.argilla.io/latest/getting_started/quickstart/) 的指示進行。

接著，您需要設定並建立 Argilla 資料集。

```python
import argilla as rg

client = rg.Argilla(api_url="<api_url>", api_key="<api_key>")

settings = rg.Settings(
    guidelines="These are some guidelines.",
    fields=[
        rg.ChatField(
            name="user_input",
        ),
        rg.TextField(
            name="llm_output",
        ),
    ],
    questions=[
        rg.RatingQuestion(
            name="rating",
            values=[1, 2, 3, 4, 5, 6, 7],
        ),
    ],
)

dataset = rg.Dataset(
    name="my_first_dataset",
    settings=settings,
)

dataset.create()
```

如需進一步設定，請參閱 [Argilla 文件](https://docs.argilla.io/latest/how_to_guides/dataset/)。

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
import litellm
from litellm import completion

# add env vars
os.environ["ARGILLA_API_KEY"]="argilla.apikey"
os.environ["ARGILLA_BASE_URL"]="http://localhost:6900"
os.environ["ARGILLA_DATASET_NAME"]="my_first_dataset"   
os.environ["OPENAI_API_KEY"]="sk-proj-..."

litellm.callbacks = ["argilla"]

# add argilla transformation object
litellm.argilla_transformation_object = {
    "user_input": "messages", # 👈 key= argilla field, value = either message (argilla.ChatField) | response (argilla.TextField)
    "llm_output": "response"
}

## LLM CALL ## 
response = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  callbacks: ["argilla"]
  argilla_transformation_object:
    user_input: "messages" # 👈 key= argilla field, value = either message (argilla.ChatField) | response (argilla.TextField)
    llm_output: "response"
```

</TabItem>
</Tabs>

## 範例輸出 {#example-output}

<Image img={require('../../img/argilla.png')} />

## 將取樣率加入 Argilla 請求 {#add-sampling-rate-to-argilla-calls}

若只想記錄一部分送往 Argilla 的請求，請將 `ARGILLA_SAMPLING_RATE` 加入您的環境變數。

```bash
ARGILLA_SAMPLING_RATE=0.1 # log 10% of calls to argilla
```
