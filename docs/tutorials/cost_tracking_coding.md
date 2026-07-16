import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 追蹤程式設計工具的使用量 {#track-usage-for-coding-tools}

透過 LiteLLM 追蹤像 Claude Code、Roo Code、Gemini CLI 和 OpenAI Codex 這類 AI 驅動的程式設計工具之使用量與成本。

使用 User-Agent 標頭監控每個程式設計工具的請求、成本與使用者參與指標。

<Image 
  img={require('../../img/agent_1.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

## 適用對象 {#who-this-is-for}

透過 LiteLLM 為開發人員提供程式設計工具存取權的中央 AI 平台團隊。監控工具參與度並追蹤個別使用者的使用模式。

## 您可以追蹤的內容 {#what-you-can-track}

### 摘要指標 {#summary-metrics}
- 每個程式設計工具的成本
- 每個工具的成功請求與 token 使用量

### 使用者參與指標 {#user-engagement-metrics}
- 每個 User-Agent 的每日、每週與每月活躍使用者數

## 快速開始 {#quick-start}

### 1. 將您的程式設計工具連接到 LiteLLM {#1-connect-your-coding-tool-to-litellm}

設定您的程式設計工具，透過 LiteLLM proxy 並搭配適當的 User-Agent 標頭送出請求。

**設定指南：**
- [將 LiteLLM 與 Claude Code 搭配使用](../../docs/tutorials/claude_responses_api)
- [將 LiteLLM 與 Gemini CLI 搭配使用](../../docs/tutorials/litellm_gemini_cli)
- [將 LiteLLM 與 OpenAI Codex 搭配使用](../../docs/tutorials/openai_codex)

### 2. 使用 User-Agent 標頭送出請求 {#2-send-requests-with-user-agent-headers}

請確保您的程式設計工具在 API 請求中包含可識別的 User-Agent 標頭。

### 3. 在 LiteLLM 記錄中驗證追蹤 {#3-verify-tracking-in-litellm-logs}

透過檢查記錄中預期的 User-Agent 值，確認 LiteLLM 已正確追蹤請求。

<Image 
  img={require('../../img/agent_2.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

### 4. 檢視使用量儀表板 {#4-view-usage-dashboard}

存取 LiteLLM 儀表板以檢視彙總的使用量指標與使用者參與資料。

#### 摘要指標 {#summary-metrics-1}

檢視每個程式設計工具的總成本與成功請求數。

<Image 
  img={require('../../img/agent_3.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

#### 每日、每週與每月活躍使用者 {#daily-weekly-and-monthly-active-users}

檢視每個程式設計工具的活躍使用者指標。

<Image 
  img={require('../../img/agent_4.png')}
  style={{width: '80%', display: 'block', margin: '2rem auto'}}
/>

## LiteLLM 如何識別程式設計工具 {#how-litellm-identifies-coding-tools}

LiteLLM 透過監控傳入 API 請求中的 `User-Agent` 標頭來追蹤程式設計工具（`/chat/completions`、`/responses` 等）。每個獨特的 User-Agent 都會被分開追蹤，以進行使用量分析。

### 請求範例 {#example-request}

以 `claude-cli` 作為 User-Agent 的範例：

```shell
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -H "User-Agent: claude-cli/1.0" \
  -d '{"model": "claude-3-5-sonnet-latest", "messages": [{"role": "user", "content": "Hello, how are you?"}]}' \
  http://localhost:4000/chat/completions
```
