import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 LM Harness、FastEval、Flask 進行 LLM 基準測試 {#benchmark-llms---lm-harness-fasteval-flask}

## LM Harness 基準測試 {#lm-harness-benchmarks}
透過 litellm proxy 的 `/completions` 端點，以快 20 倍的速度評估 LLM。 

本教學假設您使用的是 [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness/tree/big-refactor) 的 `big-refactor` 分支

注意：LM Harness 尚未更新為使用 `openai 1.0.0+`；為了處理這個問題，我們會在虛擬環境中執行 lm harness

**步驟 1：啟動本機 proxy**
請參閱支援的模型 [這裡](https://docs.litellm.ai/docs/simple_proxy)
```shell
$ litellm --model huggingface/bigcode/starcoder
```

使用自訂 API base

```shell
$ export HUGGINGFACE_API_KEY=my-api-key #[OPTIONAL]
$ litellm --model huggingface/tinyllama --api_base https://k58ory32yinf1ly0.us-east-1.aws.endpoints.huggingface.cloud
```
OpenAI 相容端點於 http://0.0.0.0:8000

**步驟 2：為 LM Harness 建立虛擬環境 + 使用 OpenAI 0.28.1**
接著我們會在新的虛擬環境中執行 lm harness，並使用 openai==0.28.1

```shell
python3 -m venv lmharness 
source lmharness/bin/activate
```

在虛擬環境中安裝 openai==0.28.01
```shell
uv add openai==0.28.01
```

**步驟 3：設定 OpenAI API Base 與金鑰**
```shell
$ export OPENAI_BASE_URL=http://0.0.0.0:8000
```

LM Harness 需要您設定一組 OpenAI API 金鑰 `OPENAI_API_SECRET_KEY` 以執行基準測試
```shell
export OPENAI_API_SECRET_KEY=anything
```

**步驟 4：執行 LM-Eval-Harness**
```shell
cd lm-evaluation-harness
```

在虛擬環境中使用 uv 新增 lm harness 依賴項
```
uv sync
```

```shell
python3 -m lm_eval \
  --model openai-completions \
  --model_args engine=davinci \
  --task crows_pairs_english_age

```
## FastEval {#fasteval}

**步驟 1：啟動本機 proxy**
請參閱支援的模型 [這裡](https://docs.litellm.ai/docs/simple_proxy)
```shell
$ litellm --model huggingface/bigcode/starcoder
```

**步驟 2：設定 OpenAI API Base 與金鑰**
```shell
$ export OPENAI_BASE_URL=http://0.0.0.0:8000
```

由於 proxy 已具備憑證，這裡可設定為任何值
```shell
export OPENAI_API_KEY=anything
```

**步驟 3：使用 FastEval 執行** 

**複製 FastEval**
```shell
# Clone this repository, make it the current working directory
git clone --depth 1 https://github.com/FastEval/FastEval.git
cd FastEval
```

**在 FastEval 上設定 API Base**

在 FastEval 上，請進行以下 **2 行程式碼變更** 以設定 `OPENAI_BASE_URL`

https://github.com/FastEval/FastEval/pull/90/files
```python
try:
    api_base = os.environ["OPENAI_BASE_URL"] #changed: read api base from .env
    if api_base == None:
        api_base = "https://api.openai.com/v1"
    response = await self.reply_two_attempts_with_different_max_new_tokens(
        conversation=conversation,
        api_base=api_base, # #changed: pass api_base
        api_key=os.environ["OPENAI_API_KEY"],
        temperature=temperature,
        max_new_tokens=max_new_tokens,
```

**執行 FastEval**
將 `-b` 設定為您要執行的基準測試。可用值為 `mt-bench`、`human-eval-plus`、`ds1000`、`cot`、`cot/gsm8k`、`cot/math`、`cot/bbh`、`cot/mmlu` 和 `custom-test-data`

由於 LiteLLM 提供相容於 OpenAI 的 proxy `-t` 和 `-m` 不需要變更
`-t` 將維持為 openai
`-m` 將維持為 gpt-3.5

```shell
./fasteval -b human-eval-plus -t openai -m gpt-3.5-turbo
```

## FLASK - 細粒度語言模型評估  {#flask---fine-grained-language-model-evaluation}
使用 litellm 在 FLASK 上評估任何 LLM https://github.com/kaistAI/FLASK 

**步驟 1：啟動本機 proxy**
```shell
$ litellm --model huggingface/bigcode/starcoder
```

**步驟 2：設定 OpenAI API Base 與金鑰**
```shell
$ export OPENAI_BASE_URL=http://0.0.0.0:8000
```

**步驟 3：使用 FLASK 執行** 

```shell
git clone https://github.com/kaistAI/FLASK
```
```shell
cd FLASK/gpt_review
```

執行評估 
```shell
python gpt4_eval.py -q '../evaluation_set/flask_evaluation.jsonl'
```

## 除錯  {#debugging}

### 對您的 proxy 發出測試請求 {#making-a-test-request-to-your-proxy}
此命令會向您的 proxy 伺服器發出測試 Completion、ChatCompletion 請求
```shell
litellm --test
```
