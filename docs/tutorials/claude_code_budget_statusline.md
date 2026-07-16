import Image from '@theme/IdealImage';

# Claude Code - 預算狀態列 {#claude-code---budget-status-line}

在 Claude Code 狀態列中顯示使用者剩餘的 LiteLLM 預算。狀態列會以使用者的虛擬金鑰呼叫 [`/user/info`](../proxy/virtual_keys.md#spend-tracking)，並顯示 `user_info.max_budget` 與 `user_info.spend` 之間的差額。

如果使用者沒有 `max_budget`，腳本不會輸出任何內容。

## 必要條件 {#prerequisites}

- Claude Code 已設定為使用 LiteLLM
- Claude Code 虛擬金鑰屬於具有 [`max_budget`](../proxy/users.md#internal-user) 的使用者
- 已安裝 `curl` 和 `jq`

請使用使用者虛擬金鑰，而不是 proxy master key。未提供 `user_id` 就呼叫 `/user/info` 時，會回傳與已驗證金鑰關聯的使用者。

## 1. 設定 LiteLLM 環境變數 {#1-set-litellm-environment-variables}

設定 proxy 根 URL 與 Claude Code 使用的相同虛擬金鑰：

```bash
export LITELLM_BASE_URL="http://localhost:4000"
export LITELLM_API_KEY="$ANTHROPIC_AUTH_TOKEN"
```

`LITELLM_BASE_URL` 必須指向 proxy 根，而不是 `/anthropic` 轉發端點。

## 2. 建立狀態列腳本 {#2-create-the-status-line-script}

將此腳本儲存為 `~/.claude/litellm-budget-statusline.sh`：

```bash
#!/bin/bash

BASE_URL="${LITELLM_BASE_URL:-${ANTHROPIC_BASE_URL:-}}"
API_KEY="${LITELLM_API_KEY:-${ANTHROPIC_AUTH_TOKEN:-${ANTHROPIC_API_KEY:-}}}"

[ -n "$BASE_URL" ] && [ -n "$API_KEY" ] || exit 0

BASE_URL="${BASE_URL%/}"
BASE_URL="${BASE_URL%/anthropic}"

USER_INFO=$(curl --silent --fail --max-time 2 \
  "${BASE_URL}/user/info" \
  --header "Authorization: Bearer ${API_KEY}") || exit 0

BUDGET=$(printf '%s' "$USER_INFO" | jq -r '
  if .user_info.max_budget == null then
    empty
  else
    [.user_info.max_budget, (.user_info.spend // 0)] | @tsv
  end
')

[ -n "$BUDGET" ] || exit 0

MAX_BUDGET=$(printf '%s' "$BUDGET" | cut -f1)
SPEND=$(printf '%s' "$BUDGET" | cut -f2)

awk -v max="$MAX_BUDGET" -v spend="$SPEND" 'BEGIN {
  remaining = max - spend
  if (remaining < 0) remaining = 0
  printf "LiteLLM budget: $%.2f remaining of $%.2f\n", remaining, max
}'
```

讓腳本可執行：

```bash
chmod +x ~/.claude/litellm-budget-statusline.sh
```

兩秒逾時可避免緩慢或無法使用的 proxy 延遲 Claude Code。API 錯誤以及未設定預算的使用者會讓狀態列保持空白。

## 3. 設定 Claude Code {#3-configure-claude-code}

將腳本加入 `~/.claude/settings.json`：

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/litellm-budget-statusline.sh"
  }
}
```

Claude Code 會在每次助理回應後重新整理狀態列。如需更多自訂選項，請參閱 [Claude Code 狀態列文件](https://code.claude.com/docs/en/statusline)。

## 範例 {#example}

對於最大預算為 `$100` 且已追蹤支出為 `$24.35` 的使用者，狀態列會顯示：

```text
LiteLLM budget: $75.65 remaining of $100.00
```

剩餘預算會顯示在 Claude Code 提示字元下方：

<Image img={require('../../img/claude_code_budget_statusline.png')} style={{ width: '100%', maxWidth: '900px', height: 'auto' }} />
