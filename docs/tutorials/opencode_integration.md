import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenCode 快速入門 {#opencode-quickstart}

本教學示範如何將 OpenCode 連接到您現有的 LiteLLM 實例，並在模型之間切換。

:::info 

此整合可讓您透過 OpenCode 使用任何 LiteLLM 支援的模型，並具備集中式驗證、用量追蹤與成本控管。

:::

<br />

### 影片導覽 {#video-walkthrough}

<iframe width="840" height="500" src="https://www.loom.com/embed/00791498f1d84e4ba6d7476bd2e1442f" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 先決條件 {#prerequisites}

- 已設定並執行中的 LiteLLM（例如：`http://localhost:4000`）
- LiteLLM API 金鑰

## 安裝 {#installation}

### 步驟 1：安裝 OpenCode {#step-1-install-opencode}

請選擇您偏好的安裝方式：

<Tabs>
<TabItem value="curl" label="單行安裝（建議）">

```bash
curl -fsSL https://opencode.ai/install | bash
```

</TabItem>
<TabItem value="npm" label="NPM">

```bash
npm install -g opencode-ai
```

</TabItem>
<TabItem value="homebrew" label="Homebrew">

```bash
brew install sst/tap/opencode
```

</TabItem>
</Tabs>

驗證安裝：

```bash
opencode --version
```

### 步驟 2：設定 LiteLLM 提供者 {#step-2-configure-litellm-provider}

建立您的 OpenCode 設定檔。您可以根據需求將其放在不同位置：

**設定位置：**
- **全域**：`~/.config/opencode/opencode.json`（適用於所有專案）
- **專案**：位於您專案根目錄中的 `opencode.json`（專案專屬設定）
- **自訂**：設定 `OPENCODE_CONFIG` 環境變數

建立 `~/.config/opencode/opencode.json`（全域設定）：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM",
      "options": {
        "baseURL": "http://localhost:4000/v1"
      },
      "models": {
        "gpt-4": {
          "name": "GPT-4"
        },
        "claude-3-5-sonnet-20241022": {
          "name": "Claude 3.5 Sonnet"
        },
        "deepseek-chat": {
          "name": "DeepSeek Chat"
        }
      }
    }
  }
}
```

:::tip
"models" 物件中的鍵（例如 "gpt-4"、"claude-3-5-sonnet-20241022"）應與您 LiteLLM 設定中的 `model_name` 值相符。"name" 欄位提供友善的顯示名稱，將在 OpenCode 中作為別名顯示。
:::

### 步驟 3：連接到 LiteLLM 提供者 {#step-3-connect-to-litellm-provider}

啟動 OpenCode：

```bash
opencode
```

新增您的 API 金鑰：

```bash
/connect
```

接著：
- **輸入提供者名稱**：`LiteLLM`（必須與您設定中的 "name" 欄位相符）
- **輸入您的 LiteLLM API 金鑰**：您的 LiteLLM 主金鑰或虛擬金鑰

### 步驟 4：在模型之間切換 {#step-4-switch-between-models}

在 OpenCode 中執行：

```bash
/models
```

從您的 LiteLLM 設定中選擇任一模型。OpenCode 會將所有請求透過您的 LiteLLM 實例進行路由。

## 進階設定 {#advanced-configuration}

### 模型參數 {#model-parameters}

您可以自訂模型參數，例如上下文限制：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM",
      "options": {
        "baseURL": "http://localhost:4000/v1"
      },
      "models": {
        "gpt-4": {
          "name": "GPT-4",
          "limit": {
            "context": 128000,
            "output": 4096
          }
        },
        "claude-3-5-sonnet-20241022": {
          "name": "Claude 3.5 Sonnet",
          "limit": {
            "context": 200000,
            "output": 8192
          }
        }
      }
    }
  }
}
```

### 多提供者設定 {#multi-provider-setup}

您可以設定多個 LiteLLM 實例，或與其他提供者混合使用：

<Tabs>
<TabItem value="multi-litellm" label="多個 LiteLLM 實例">

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm-prod": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM Production",
      "options": {
        "baseURL": "https://your-prod-instance.com/v1"
      },
      "models": {
        "gpt-4": {
          "name": "GPT-4 (Production)"
        }
      }
    },
    "litellm-dev": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM Development",
      "options": {
        "baseURL": "http://localhost:4000/v1"
      },
      "models": {
        "gpt-4": {
          "name": "GPT-4 (Development)"
        }
      }
    }
  }
}
```

</TabItem>
<TabItem value="mixed-providers" label="混合提供者">

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM",
      "options": {
        "baseURL": "http://localhost:4000/v1"
      },
      "models": {
        "gpt-4": {
          "name": "GPT-4 via LiteLLM"
        },
        "claude-3-5-sonnet-20241022": {
          "name": "Claude 3.5 Sonnet via LiteLLM"
        }
      }
    },
    "openai": {
      "npm": "@ai-sdk/openai",
      "name": "OpenAI Direct",
      "models": {
        "gpt-4o": {
          "name": "GPT-4o (Direct)"
        }
      }
    }
  }
}
```

</TabItem>
</Tabs>

## LiteLLM 設定範例 {#example-litellm-configuration}

以下是一個與 OpenCode 搭配效果良好的 LiteLLM `config.yaml` 範例：

```yaml
model_list:
  # OpenAI models
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  # Anthropic models
  - model_name: claude-3-5-sonnet-20241022
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

  # DeepSeek models
  - model_name: deepseek-chat
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY
```

### 捨棄 OpenCode 專用參數 {#dropping-opencode-specific-parameters}

OpenCode 會對具備推理能力的模型（例如 `gpt-5`）傳送 `reasoningSummary` 參數。此參數不受 Chat Completions API 支援，並會導致錯誤。請將 `additional_drop_params` 加到您所有會接收來自 OpenCode、且已啟用推理請求的模型項目中，於您的 `model_list`：

```yaml
model_list:
  - model_name: gpt-5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY
      additional_drop_params: ["reasoningSummary"]
```

## 疑難排解 {#troubleshooting}

**OpenCode 無法連線：**
- 驗證您的 LiteLLM proxy 是否正在執行：`curl http://localhost:4000/health`
- 檢查您 OpenCode 設定中的 `baseURL` 是否與您的 LiteLLM 實例相符
- 確保 `/connect` 中的提供者名稱與您的設定完全一致

**驗證錯誤：**
- 驗證您的 LiteLLM API 金鑰是否正確
- 檢查您的 LiteLLM 實例是否已正確設定驗證
- 確保您的 API 金鑰可存取您嘗試使用的模型

**找不到模型：**
- 確保 OpenCode 設定中的模型名稱與您的 LiteLLM `model_name` 值相符
- 檢查 LiteLLM 記錄以取得詳細錯誤訊息
- 驗證模型是否已在您的 LiteLLM 實例中正確設定

**設定未載入：**
- 檢查設定檔路徑與權限
- 使用 JSON 驗證器驗證 JSON 語法
- 確保 `$schema` URL 可存取

**`Unknown parameter: 'reasoningSummary'` 錯誤：**
- OpenCode 會傳送一個 Chat Completions API 不支援的 `reasoningSummary` 參數。請將 `additional_drop_params: ["reasoningSummary"]` 加到您 `litellm_params` 中每個受影響的模型項目：
  ```yaml
  - model_name: gpt-5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY
      additional_drop_params: ["reasoningSummary"]
  ```

## 提示 {#tips}

- 視需要在設定中新增更多模型——它們會顯示在 `/models` 中
- 對於不同且有不同模型需求的程式碼基底，使用專案專屬設定
- 監控您的 LiteLLM proxy 記錄，以即時查看 OpenCode 請求
