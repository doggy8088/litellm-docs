import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI Codex {#openai-codex}

本指南將帶您逐步完成將 OpenAI Codex 連接到 LiteLLM。將 LiteLLM 與 Codex 搭配使用可讓團隊：
- 透過 Codex 介面存取 100+ 個 LLM
- 透過熟悉的介面使用像 Gemini 這類強大的模型
- 透過 LiteLLM 內建分析追蹤支出與用量
- 使用虛擬金鑰控管模型存取

<Image img={require('../../img/litellm_codex.gif')} />

## 快速開始 {#quickstart}

:::info

需要 LiteLLM v1.66.3.dev5 以上版本

:::

請先依照 [LiteLLM 入門指南](../proxy/docker_quick_start.md) 設定 LiteLLM。

## 1. 安裝 OpenAI Codex {#1-install-openai-codex}

使用 npm 全域安裝 OpenAI Codex CLI 工具：

<Tabs>
<TabItem value="npm" label="npm">

```bash showLineNumbers
npm i -g @openai/codex
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash showLineNumbers
yarn global add @openai/codex
```

</TabItem>
</Tabs>

## 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

<Tabs>
<TabItem value="docker" label="Docker">

```bash showLineNumbers
docker run \
    -v $(pwd)/litellm_config.yaml:/app/config.yaml \
    -p 4000:4000 \
    docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml
```

</TabItem>
<TabItem value="pip" label="LiteLLM CLI">

```bash showLineNumbers
litellm --config /path/to/config.yaml
```

</TabItem>
</Tabs>

LiteLLM 現在應該已在 [http://localhost:4000](http://localhost:4000) 上執行

## 3. 設定 LiteLLM 以進行模型路由 {#3-configure-litellm-for-model-routing}

請確保您的 LiteLLM Proxy 已正確設定為路由到您想要的模型。建立一個 `litellm_config.yaml` 檔案，內容如下：

```yaml showLineNumbers
model_list:
  - model_name: o3-mini
    litellm_params:
      model: openai/o3-mini
      api_key: os.environ/OPENAI_API_KEY
  - model_name: claude-3-7-sonnet-latest
    litellm_params:
      model: anthropic/claude-3-7-sonnet-latest
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gemini-2.0-flash
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GEMINI_API_KEY

litellm_settings:
  drop_params: true
```

此設定可透過明確名稱啟用對特定 OpenAI、Anthropic 與 Gemini 模型的路由。

## 4. 設定 Codex 使用 LiteLLM Proxy {#4-configure-codex-to-use-litellm-proxy}

設定必要的環境變數，將 Codex 指向您的 LiteLLM Proxy：

```bash
# Point to your LiteLLM Proxy server
export OPENAI_BASE_URL=http://0.0.0.0:4000 

# Use your LiteLLM API key (if you've set up authentication)
export OPENAI_API_KEY="sk-1234"
```

## 5. 使用 Gemini 執行 Codex {#5-run-codex-with-gemini}

完成所有設定後，您現在可以使用 Gemini 執行 Codex：

```bash showLineNumbers
codex --model gemini-2.0-flash --full-auto
```

<Image img={require('../../img/litellm_codex.gif')} />

`--full-auto` 旗標可讓 Codex 自動產生程式碼，而無需額外提示。

## 6. 進階選項 {#6-advanced-options}

### 使用不同模型 {#using-different-models}

您可以使用 LiteLLM proxy 中設定的任何模型：

```bash
# Use Claude models
codex --model claude-3-7-sonnet-latest

# Use Google AI Studio Gemini models
codex --model gemini/gemini-2.0-flash
```

## 疑難排解 {#troubleshooting}

- 如果您遇到連線問題，請確認您的 LiteLLM Proxy 正在執行，且可透過指定的 URL 存取
- 如果您使用驗證，請確認您的 LiteLLM API 金鑰有效
- 檢查您的模型路由設定是否正確
- 若為特定模型錯誤，請確認該模型已在您的 LiteLLM 設定中正確設定

## 其他資源 {#additional-resources}

- [LiteLLM Docker 快速開始指南](../proxy/docker_quick_start.md)
- [OpenAI Codex GitHub Repository](https://github.com/openai/codex)
- [LiteLLM 虛擬金鑰與驗證](../proxy/virtual_keys.md)
