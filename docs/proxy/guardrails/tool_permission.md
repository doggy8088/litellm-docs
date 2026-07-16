import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM 工具權限防護欄 {#litellm-tool-permission-guardrail}

LiteLLM 提供 LiteLLM 工具權限防護欄，讓您透過可設定的允許／拒絕規則，控制模型可被允許呼叫哪些 **工具呼叫**。這可針對工具執行提供細緻且與提供者無關的控制（例如，OpenAI Chat Completions `tool_calls`、Anthropic Messages `tool_use`、MCP tools）。

## 快速開始 {#quick-start}

### LiteLLM UI {#litellm-ui}

#### 步驟 1：選取工具權限防護欄 {#step-1-select-tool-permission-guardrail}

開啟 LiteLLM 儀表板，點擊 **Add New Guardrail**，然後選擇 **LiteLLM Tool Permission Guardrail**。這會載入規則建構 UI。

#### 步驟 2：定義 Regex 規則 {#step-2-define-regex-rules}

1. 點擊 **Add Rule**。
2. 輸入唯一的 Rule ID。
3. 提供工具名稱的 regex（例如，`^mcp__github_.*$`）。
4. 選擇性地為工具類型新增 regex（例如，`^function$`）。
5. 選擇 **Allow** 或 **Deny**。

#### 步驟 3：限制工具引數（選用） {#step-3-restrict-tool-arguments-optional}

選取 **+ Restrict tool arguments**，以將 regex 驗證附加到巢狀路徑（點號 + `[]` 記法）。這可強制敏感參數（例如 `arguments.to[]`）符合預先核准的格式。

#### 步驟 4：選擇預設值與動作 {#step-4-choose-defaults--actions}

- 設定未命中任何規則的工具之備援決策（`default_action`）。
- 決定不允許工具的行為：**Block** 會停止請求，**Rewrite** 會移除被禁止的工具，並在回應中傳回錯誤訊息。
- 如果您想要品牌化的錯誤文案，可自訂 `violation_message_template`。
- 儲存防護欄。

### LiteLLM Config.yaml 設定 {#litellm-configyaml-setup}

```yaml
guardrails:
  - guardrail_name: "tool-permission-guardrail"
    litellm_params:
      guardrail: tool_permission
      mode: "post_call"
      rules:
        - id: "allow_bash"
          tool_name: "Bash"
          decision: "allow"
        - id: "allow_github_mcp"
          tool_name: "^mcp__github_.*$"
          decision: "allow"
        - id: "allow_aws_documentation"
          tool_name: "^mcp__aws-documentation_.*_documentation$"
          decision: "allow"
        - id: "deny_read_commands"
          tool_name: "Read"
          decision: "deny"
        - id: "mail-domain"
          tool_name: "^send_email$"
          tool_type: "^function$"
          decision: "allow"
          allowed_param_patterns:
            "to[]": "^.+@berri\\.ai$"
            "cc[]": "^.+@berri\\.ai$"
            "subject": "^.{1,120}$"
      default_action: "deny"  # Fallback when no rule matches: "allow" or "deny"
      on_disallowed_action: "block"  # How to handle disallowed tools: "block" or "rewrite"
```

#### 規則結構 {#rule-structure}

```yaml
- id: "unique_rule_id"           # Unique identifier for the rule
  tool_name: "^regex$"           # Regex for tool name (optional, at least one of name/type required)
  tool_type: "^function$"        # Regex for tool type (optional)
  decision: "allow"              # "allow" or "deny"
  allowed_param_patterns:         # Optional - regex map for argument paths (dot + [] notation)
    "path.to[].field": "^regex$"
```

#### `mode` 的支援值 {#supported-values-for-mode}

- `pre_call` 在 **LLM 呼叫前** 執行，針對 **input**
- `post_call` 在 **LLM 呼叫後** 執行，針對 **input & output**

### `on_disallowed_action` 行為 {#on_disallowed_action-behavior}

| 值 | 會發生什麼事 |
| --- | --- |
| `block` | 請求會立即被拒絕。呼叫前檢查會引發 `400` HTTP 錯誤。呼叫後檢查會引發 `GuardrailRaisedException`，因此 proxy 會回傳錯誤而不是模型輸出。當呼叫被禁止的工具時必須中止工作流程時，請使用此項。 |
| `rewrite` | LiteLLM 會在請求到達模型前（呼叫前）悄悄地從負載中移除不允許的工具，或在事後重寫模型回應／工具呼叫。防護欄會將錯誤文字插入 `message.content`/`tool_result` 項目中，讓用戶端知道該工具已被阻擋，而其餘的 completion 會繼續。當您想要優雅降級而非硬性失敗時，請使用此項。 |

### 自訂拒絕訊息 {#custom-denial-message}

當您希望防護欄回傳品牌化錯誤（例如：「這違反了我們的組織政策…」）時，請設定 `violation_message_template`。LiteLLM 會用來自被拒絕工具的占位符取代：

- `{tool_name}` – 工具／函式名稱（例如，`Read`）
- `{rule_id}` – 符合的規則 ID（或在預設動作啟動時為 `None`）
- `{default_message}` – 如果您需要附加，則為原始 LiteLLM 訊息

範例：

```yaml
guardrails:
  - guardrail_name: "tool-permission-guardrail"
    litellm_params:
      guardrail: tool_permission
      mode: "post_call"
      violation_message_template: "this violates our org policy, we don't support executing {tool_name} commands"
      rules:
        - id: "allow_bash"
          tool_name: "Bash"
          decision: "allow"
        - id: "deny_read"
          tool_name: "Read"
          decision: "deny"
      default_action: "deny"
      on_disallowed_action: "block"
```

如果請求嘗試呼叫 `Read`，proxy 現在會回傳「這違反了我們的組織政策，我們不支援執行 Read commands」而不是預設錯誤文字。若省略此欄位，則保留預設訊息。

### 2. 啟動 Proxy {#2-start-the-proxy}

```shell
litellm --config config.yaml --port 4000
```

## 範例 {#examples}

<Tabs>
<TabItem value="block" label="阻擋請求">

**阻擋請求（`on_disallowed_action: block`）**

```bash
# Test
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-master-key-here" \
  -d '{
    "model": "gpt-5-mini",
    "messages": [{"role": "user","content": "What is the weather like in Tokyo today?"}],
    "tools": [
      {
        "type":"function",
        "function": {
          "name":"get_current_weather",
          "description": "Get the current weather in a given location"
        }
      }
    ]
  }'
```

**預期回應（已拒絕）：**

```json
{
  "error":
    {
      "message": "Guardrail raised an exception, Guardrail: tool-permission-guardrail, Message: Tool 'get_current_weather' denied by default action",
      "type": "None",
      "param": "None",
      "code": "500"
    }
}
```

</TabItem>
<TabItem value="rewrite" label="重寫請求">

**重寫請求（`on_disallowed_action: rewrite`）**

```bash
# Test
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-master-key-here" \
  -d '{
    "model": "gpt-5-mini",
    "messages": [{"role": "user","content": "What is the weather like in Tokyo today?"}],
    "tools": [
      {
        "type":"function",
        "function": {
          "name":"get_current_weather",
          "description": "Get the current weather in a given location"
        }
      }
    ]
  }'
```

**預期回應（工具已移除，completion 繼續）：**

```json
{
	"id": "chatcmpl-xxxxxxxxxxxxxxx",
	"created": 1757716050,
	"model": "gpt-5-mini-2025-08-07",
	"object": "chat.completion",
	"choices": [
		{
			"finish_reason": "stop",
			"index": 0,
			"message": {
				"content": "I can’t fetch live weather — I don’t have real‑time internet access.",
				"role": "assistant",
				"annotations": []
			},
			"provider_specific_fields": {}
		}
	],
	"usage": {
		"prompt_tokens": 112,
		"total_tokens": 735,
		"completion_tokens_details": {
			"reasoning_tokens": 384,
		},
	},
	"service_tier": "default"
}
```

</TabItem>
</Tabs>

### 限制工具引數 {#constrain-tool-arguments}

有時您會想允許某個工具，但仍限制其使用方式。將 `allowed_param_patterns` 加入規則，可針對特定引數路徑強制套用 regex 模式（陣列使用點號記法與 `[]`）。

```yaml title="Only allow mail_mcp to mail @berri.ai addresses"
guardrails:
  - guardrail_name: "tool-permission-mail"
    litellm_params:
      guardrail: tool_permission
      mode: "post_call"
      rules:
        - id: "mail-domain"
          tool_name: "send_email"
          decision: "allow"
          allowed_param_patterns:
            "to[]": "^.+@berri\\.ai$"
            "cc[]": "^.+@berri\\.ai$"
            "subject": "^.{1,120}$"
      default_action: "deny"
      on_disallowed_action: "block"
```

在此範例中，LLM 仍可呼叫 `send_email`，但如果它嘗試寄信給 `@berri.ai` 以外的任何人，或產生不符合 regex 的主旨，防護欄就會阻擋該次呼叫（或依 `on_disallowed_action` 進行重寫）。只要是引數值很重要的工具，都可使用此模式——郵件寄送器、升級工作流程、工單建立等。
