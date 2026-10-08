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

<iframe width="840" height="500" src="https://www.loom.com/embed/00791498f1d84e4ba6d7476bd2e1442f" frameBorder="0" allowFullScreen></iframe>

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
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra"
        },
        "{{anthropic}}": {
          "name": "Claude Sonnet 5"
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
「models」物件中的鍵（例如「gpt-5.6-terra」、「claude-sonnet-5」）應與您 LiteLLM 設定中的 `model_name` 值相符。「name」欄位會提供一個友善的顯示名稱，並在 OpenCode 中顯示為別名。

如果模型接受圖片，還需要一個 `modalities` 項目；請參閱[啟用圖片與視覺輸入](#enabling-image-and-vision-input)。
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
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra",
          "limit": {
            "context": 922000,
            "output": 128000
          }
        },
        "{{anthropic}}": {
          "name": "Claude Sonnet 5",
          "limit": {
            "context": 1000000,
            "output": 128000
          }
        }
      }
    }
  }
}
```

### 啟用圖片與視覺輸入 {#enabling-image-and-vision-input}

OpenCode 不會從 `/v1/models` 端點探索模型能力。OpenAI 的
模型清單 schema 沒有模態的欄位，因此沒有任何內容可供其讀取。因此，位於自訂 `@ai-sdk/openai-compatible` 提供者底下的模型會退回為僅文字輸入。

其影響發生在用戶端，而且是靜默的：OpenCode 會檢查模型宣告的輸入模態，看到沒有
`image`，並在請求送出前**將圖片附件從請求中移除**。LiteLLM 永遠不會
收到該圖片，而模型的回應就像您什麼都沒貼上一樣。

請在 OpenCode 設定中的每個可進行視覺處理的模型上宣告 `modalities`：

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
        "{{anthropic}}": {
          "name": "Claude Sonnet 5",
          "modalities": { "input": ["text", "image"], "output": ["text"] }
        },
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra",
          "modalities": { "input": ["text", "image"], "output": ["text"] }
        },
        "deepseek-chat": {
          "name": "DeepSeek Chat"
        }
      }
    }
  }
}
```

對於像 `deepseek-chat` 這類僅文字模型，請不要啟用 `modalities`；對無法接受圖片的模型宣告 `image` 輸入，會把失敗從用戶端移到提供者端。

:::warning
在您的 LiteLLM `config.yaml` 中，於 `model_info` 下設定 `supports_vision: true` 並**不會**修正此問題。
該旗標驅動的是 LiteLLM 自身的路由與成本邏輯，而且不會在 `/v1/models` 上公開，即使公開了，OpenCode 也不會讀取它。`modalities` 在 OpenCode 設定中是唯一可以宣告此項目的地方。
:::

#### 自動路由器與其他模型群組 {#auto-router-and-other-model-groups}

對 OpenCode 來說，模型群組只是另一個模型名稱，因此即使其背後的模型具備視覺處理能力，[自動路由器](../proxy/auto_routing)
項目也需要相同的宣告：

```json
{
  "models": {
    "smart-router": {
      "name": "Smart Router",
      "modalities": { "input": ["text", "image"], "output": ["text"] }
    }
  }
}
```

只有當路由器可選擇的每個層級都接受圖片時，才宣告 `image` 輸入。若其中一個層級
僅支援文字，當路由器落到該層級時，帶有圖片的請求就會失敗。

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
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra (Production)"
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
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra (Development)"
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
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra via LiteLLM"
        },
        "{{anthropic}}": {
          "name": "Claude Sonnet 5 via LiteLLM"
        }
      }
    },
    "openai": {
      "npm": "@ai-sdk/openai",
      "name": "OpenAI Direct",
      "models": {
        "{{openai_large}}": {
          "name": "GPT-5.6 Terra (Direct)"
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
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

  # Anthropic models
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

  # DeepSeek models
  - model_name: deepseek-chat
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY
```

### 捨棄 OpenCode 專用參數 {#dropping-opencode-specific-parameters}

OpenCode 會對具備推理能力的模型（例如 `reasoningSummary`）傳送 `{{openai_large}}` 參數。此參數不受 Chat Completions API 支援，並會導致錯誤。請將 `additional_drop_params` 加到您所有會接收來自 OpenCode、且已啟用推理請求的模型項目中，於您的 `model_list`：

```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
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

**圖片與截圖會被忽略：**
- OpenCode 預設會將自訂 OpenAI 相容提供者模型視為僅文字輸入，並在傳送前移除圖片
  附件，因此送到 LiteLLM 的請求不會包含圖片。請在 OpenCode 設定中的模型上宣告
  `modalities`：
  ```json
  "{{anthropic}}": {
    "name": "Claude Sonnet 5",
    "modalities": { "input": ["text", "image"], "output": ["text"] }
  }
  ```
- 您在 LiteLLM `config.yaml` 中的 `model_info: supports_vision: true` 在此無效。請參閱
  [啟用圖片與視覺輸入](#enabling-image-and-vision-input)。

**`Unknown parameter: 'reasoningSummary'` 錯誤：**
- OpenCode 會傳送一個 Chat Completions API 不支援的 `reasoningSummary` 參數。請將 `additional_drop_params: ["reasoningSummary"]` 加到您 `litellm_params` 中每個受影響的模型項目：
  ```yaml
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
      additional_drop_params: ["reasoningSummary"]
  ```

## 提示 {#tips}

- 視需要在設定中新增更多模型——它們會顯示在 `/models` 中
- 對於不同且有不同模型需求的程式碼基底，使用專案專屬設定
- 監控您的 LiteLLM proxy 記錄，以即時查看 OpenCode 請求
