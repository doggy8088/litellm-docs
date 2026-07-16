import Image from '@theme/IdealImage';

# DeepEval {#deepeval}

### 什麼是 DeepEval？ {#what-is-deepeval}
[DeepEval](https://deepeval.com) 是一個針對 LLM 的開源評估框架（[Github](https://github.com/confident-ai/deepeval)）。

### 什麼是 Confident AI？ {#what-is-confident-ai}

[Confident AI](https://documentation.confident-ai.com)（***deepeval*** 平台）為團隊提供一個可觀測性平台，用於追蹤與監控 LLM 應用程式。可將其視為 LLM 應用程式的 Datadog。該平台可讓您：

- 即時偵測並除錯 LLM 應用程式中的問題
- 使用強大的篩選條件搜尋並分析歷史生成資料
- 蒐集人類對模型回應的意見回饋
- 執行評估以衡量並改善效能
- 追蹤成本與延遲以最佳化資源使用

<Image img={require('../../img/deepeval_dashboard.png')} />

### 快速開始 {#quickstart}

```python
import os
import time
import litellm


os.environ['OPENAI_API_KEY']='<your-openai-api-key>'
os.environ['CONFIDENT_API_KEY']='<your-confident-api-key>'

litellm.success_callback = ["deepeval"]
litellm.failure_callback = ["deepeval"]

try:
    response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "What's the weather like in San Francisco?"}
        ],
    )
except Exception as e:
    print(e)

print(response)
```

:::info
您可以透過登入 [Confident AI](https://app.confident-ai.com/project) 平台來取得您的 `CONFIDENT_API_KEY`。
:::

## 支援與 Deepeval 團隊聯絡 {#support--talk-with-deepeval-team}
- [Confident AI 文件 📝](https://documentation.confident-ai.com)
- [平台 🚀](https://confident-ai.com)
- [社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
- 支援 ✉️ support@confident-ai.com
