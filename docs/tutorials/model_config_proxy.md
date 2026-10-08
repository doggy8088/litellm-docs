# 在 OpenAI 相容伺服器上自訂 Prompt 範本  {#customize-prompt-templates-on-openai-compatible-server}

**您將學到：** 如何在我們與 OpenAI 相容的伺服器上設定自訂提示模板。 
**如何做？** 我們將修改 Bedrock 上 Mistral 7B Instruct 模型的提示模板

自訂提示模板只適用於 LiteLLM 會自行建立原始文字提示的提供者（例如 Bedrock Mistral 和 Llama 文字模型）。接收聊天 `messages` 的提供者，例如 `huggingface/` 模型（包括透過 `api_base` 設定的 TGI 端點），會在伺服器端套用聊天模板，並忽略 `roles`

## 步驟 1：啟動 OpenAI 相容伺服器 {#step-1-start-openai-compatible-server}

建立一個 `config.yaml`，使用以下模型：

```yaml
model_list:
  - model_name: mistral-7b
    litellm_params:
      model: bedrock/mistral.mistral-7b-instruct-v0:2
      aws_region_name: us-east-1
```

設定 master key（否則 proxy 無法啟動），然後使用 `--detailed_debug` 啟動 proxy，如此它會記錄傳送給提供者的原始請求：

```shell
$ export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
$ litellm --config config.yaml --detailed_debug

# OpenAI compatible server running on http://0.0.0.0:4000
```

在新的 shell 中，匯出相同的 `LITELLM_MASTER_KEY` 後，送出測試請求： 
```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "mistral-7b",
    "max_tokens": 30,
    "messages": [
      {"role": "system", "content": "You are terse."},
      {"role": "user", "content": "Say hi"}
    ]
  }'
``` 

proxy 記錄會顯示 LiteLLM 以其預設 Mistral 格式建立的提示：

```shell
POST Request Sent from LiteLLM:
curl -X POST \
https://bedrock-runtime.us-east-1.amazonaws.com/model/mistral.mistral-7b-instruct-v0:2/invoke \
-d '{'prompt': '<s>[INST] \nYou are terse. [/INST]\n[INST] Say hi [/INST]\n', 'max_tokens': 30}'
```

假設我們想要改成自己的模板：
* 每個 System 和 Human 訊息開頭都加上 BOS（`<s>`）權杖
* 在 system 訊息外包一個 `<<SYS>>` 區塊
* 每個 assistant 訊息結尾都加上 EOS（`</s>`）權杖

## 步驟 2：建立自訂 Prompt 範本 {#step-2-create-custom-prompt-template}

我們的 litellm 伺服器會在 `config.yaml` 中，將提示模板作為模型的 `litellm_params` 一部分來接受。您可以在此設定中儲存 API 金鑰、備援模型、提示模板等。[查看完整設定檔](../proxy/configs.md#set-custom-prompt-templates)

更新 `config.yaml`：

```yaml
model_list:
  - model_name: mistral-7b
    litellm_params:
      model: bedrock/mistral.mistral-7b-instruct-v0:2
      aws_region_name: us-east-1
      roles:
        system:
          pre_message: "<s>[INST] <<SYS>>\n"
          post_message: "\n<</SYS>>\n [/INST]\n"
        user:
          pre_message: "<s>[INST] "
          post_message: " [/INST]\n"
        assistant:
          pre_message: ""
          post_message: "</s>"
```

## 步驟 3：執行新範本 {#step-3-run-new-template}

使用更新後的設定重新啟動 proxy：
```shell
$ litellm --config config.yaml --detailed_debug
```

送出與步驟 1 相同的 curl 請求。proxy 記錄現在會顯示我們送往 Bedrock 的自訂提示：

```shell
-d '{'prompt': '<s>[INST] <<SYS>>\nYou are terse.\n<</SYS>>\n [/INST]\n<s>[INST] Say hi [/INST]\n', 'max_tokens': 30}'
```
