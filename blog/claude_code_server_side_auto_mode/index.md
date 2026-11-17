---
slug: claude-code-server-side-auto-mode
title: "透過 LiteLLM 使用 Claude Code 伺服器端自動模式"
date: 2026-09-21T12:00:00
authors:
  - mateo
description: "Anthropic 正將 Claude Code 自動模式的安全分類器移至伺服器端。LiteLLM 的原生 /v1/messages 路由現在會將安全契約直通傳遞至 Anthropic API、Bedrock InvokeModel、Bedrock Mantle 與 Vertex AI。以下說明該契約、變更內容、哪些版本包含它，以及如何驗證。"
tags: [announcement, claude-code, anthropic, ai-gateway]
hide_table_of_contents: true
---

*最後更新：2026 年 10 月 9 日*

Anthropic 正將 Claude Code 自動模式的安全分類器從用戶端移至 Claude API。自 v2.1.278 起（2026 年 9 月 19 日發布），Enterprise 方案與 Claude API 帳戶上的工作階段會讓安全分類器在伺服器上作為模型請求的一部分執行。分類器在伺服器上執行，不會向 Anthropic 產生費用。這項推行自 9 月 18 日開始且採漸進式，先從 Claude Code CLI 與 VS Code 擴充功能開始，接著在隔週於桌面應用程式與瀏覽器中的 Claude Code 推出。9 月 25 日，自動模式將成為 Claude Code 的預設權限模式。目前，Pro、Max 與 Team 方案的預設為 auto，Enterprise 方案與 Claude API 金鑰（通常位於閘道之後的帳戶）則為 manual，依 Anthropic 的 [權限模式參考](https://code.claude.com/docs/en/permission-modes)。

伺服器端自動模式建立在 Claude Code 與 API 之間的一項契約上，而有些閘道（包括 LiteLLM）並未遵守這項契約。此修正最早出現在 9 月 22 日星期二切出的 dev 版本中，現在已包含在 v1.104.0 穩定版以及較早版本線的修補版中。本文涵蓋 Claude Code 對 AI Gateway 的需求、LiteLLM 原本做錯了什麼、有哪些變更、哪些版本包含它，以及如何驗證您的部署已就緒。

{/* truncate */}

## 伺服器端自動模式需要 AI 閘道提供什麼 {#what-server-side-auto-mode-needs-from-an-ai-gateway}

Claude Code 會在 `/v1/messages` 請求本文中送出一個 `safeguards` 欄位（一個只包含一個 `dangerous_tool_use` 項目的陣列，其中包含該工作階段的權限模式），在 `anthropic-beta` 標頭中設定 `dangerous-tool-use-2026-09-03`，而 API 會以一個 `safeguard_results` 欄位回應：一個 `dangerous_tool_use` 項目，其 `status.type` 為 `available`，且其 `status.tool_uses` 以工具使用 ID 為鍵，每個都標記為 `evaluated`，並帶有例如 `not_flagged` 的結果。在串流回應中，`safeguard_results` 會出現在最後一個 `message_delta` 事件的 `delta` 內。

要讓伺服器端自動模式運作，閘道必須按原樣直通傳遞請求標頭與本文欄位（包括它不認識的欄位，例如 `safeguards`），並回傳回應與串流事件，且不得遺漏鍵（例如 `safeguard_results`）或重寫工具使用 ID。這些都清楚載明於 Anthropic 的 [閘道相容性指南](https://code.claude.com/docs/en/llm-gateway-protocol#feature-pass-through)。

如果其中任何一項被遺漏或重寫，伺服器的檢查就永遠不會送達工作階段，而 Claude Code 會如以往一樣繼續使用自己的分類器請求。在第一次會以該方式檢查的動作之前，Claude Code 會擱置該動作，並顯示這則標示出閘道的通知：

```text
We're switching auto mode so that it no longer charges for classifier requests in Claude Code. That said this session isn't eligible as your requests go via <your gateway> and that gateway isn't compatible with the change. Nothing's broken really, auto mode continues to work as it always has and classifier requests are still charged as before. To fix it and get access to the new version of auto mode you'll need to get your gateway to implement: https://code.claude.com/docs/en/auto-mode-classifier-billing
```

不會有任何損壞。使用者會繼續使用他們目前的自動模式，並繼續為分類器呼叫付費。Anthropic 已告訴我們，新的 Claude Code 版本至少會保留用戶端分類器到 2026 年 10 月 23 日為止。該日期之後的版本只支援伺服器端自動模式，且自那時起，若閘道不支援伺服器端分類器，自動模式將無法在該閘道後方使用（因此閘道有一段時間可以補上）。Anthropic 的 [通知參考](https://code.claude.com/docs/en/auto-mode-classifier-billing) 說明了哪些人會看到這則通知，以及其意義。

## LiteLLM 原本做錯了什麼 {#what-litellm-was-doing-wrong}

LiteLLM 的原生 `/v1/messages` 端點會從已知 Anthropic Messages 參數的允許清單建構外送請求，讓同一個端點能作為 Bedrock、Vertex AI、Azure AI 與非 Anthropic 模型上的 Claude 的 proxy。`safeguards` 不在該允許清單上，因此它在請求離開 proxy 之前就被悄悄丟棄了。

Anthropic 收到一個沒有 `safeguards` 的請求，沒有回傳已評估的 `safeguard_results`，而 Claude Code 便退回到付費的用戶端分類器。以自動模式在未套用修正的 LiteLLM 版本上執行 Claude Code v2.1.278，會顯示上方那則通知（裡面包含您的 proxy 位址），且 `/status` 會將 Auto mode server 列顯示為 `Disabled`。

原始直通路由（`POST /anthropic/v1/messages`）從未受到任何影響。它只是將本文與標頭原封不動地直通傳遞，且在修正之前就已具備適當的 `safeguards` 與完整的 beta 標頭。我們透過對修正前的建置執行 Anthropic 的閘道檢查來驗證這點：直通路由通過，原生路由則失敗。

## 有哪些變更 {#what-changed}

[PR #42152](https://github.com/BerriAI/litellm/pull/42152) 於 2026 年 9 月 21 日合併到 `main`，使原生 `/v1/messages` 路由得以保留這項契約。`safeguards` 現在是可辨識的請求參數，並會照送出內容直通傳遞。當解析出的提供者是第一方 `anthropic` 時，`anthropic-beta` 標頭會原封不動地直通傳遞，而不是依已知 beta 清單進行篩選（對 Bedrock、Vertex AI 與 Azure AI 上的 Claude 的請求仍保留現有篩選，因為那些提供者仍會拒絕未知旗標）。`safeguard_results` 已在回應與串流區塊型別中宣告，且在串流時於 JSON 回應與最後一個 `message_delta` 事件中都會原封不動地傳回。LiteLLM 不會在這條路由上重寫工具使用 ID，因此 `safeguard_results` 項目仍會對應到它們所指的工具使用。

當使用 `/v1/messages` 透過轉接器路徑連到非 Anthropic 模型時，`safeguards` 會在請求被轉換前移除，因此那些後端不會傳回 400。

自 v1.107.0 起，proxy 後方的非 Claude 模型也可以被涵蓋。在 `general_settings` 中設定 `safeguards_classifier_model` 後，proxy 會自行為 `/v1/messages` 後方的每個非 Claude 模型（例如 Fireworks 上的開放模型、Gemini 部署、`openai/deployment`、在自己 Anthropic 相容端點上的 DeepSeek 等）以及 `bedrock/converse/` 模型（包括 Claude）產生自動模式判定。它會讓設定好的分類器部署對回應中的每個工具呼叫做出判定，並以與 Anthropic API 相同的方式回傳 `safeguard_results`。因此當 Claude Code 指向開放模型時，自動模式仍維持伺服器審查。設定、成本與失敗行為都依 [非 Claude 模型上的 Claude Code 自動模式](https://docs.litellm.ai/docs/claude_code_auto_mode)。

這是 LiteLLM 通往 Anthropic API 路徑的修正。Claude Code 也會在 Amazon Bedrock 與 Google Cloud 的 Vertex AI 上要求伺服器端檢查，而 [PR #42288](https://github.com/BerriAI/litellm/pull/42288)（2026 年 9 月 21 日合併）也涵蓋了這些情況。在 `/v1/messages` 上，Bedrock InvokeModel 上的 Claude（例如 `bedrock/us.anthropic.claude-sonnet-5`）與 Vertex AI 上的 Claude 現在會轉送 `safeguards` 與 `dangerous-tool-use-2026-09-03` beta，且 `safeguard_results` 會原樣傳回。這項變更包含於 v1.99.3、v1.100.2、v1.101.1、v1.102.1、v1.103.2 與 v1.104.0；v1.101.0 與 v1.103.0 不包含它。Bedrock Mantle 上的 Claude（`bedrock_mantle/anthropic.claude-sonnet-5`）自 v1.104.0 起透過 Mantle 原生的 Anthropic Messages API 提供服務，且在那裡同樣保留該契約。

Bedrock 本身不會在 Converse 路由（`bedrock/converse/<model>`）上回應。LiteLLM 會透過 chat completions 轉接器路由它，該轉接器會移除 `safeguards`，且 Bedrock 的 ConverseStream API 即使收到也不會回傳 `safeguard_results`。因此 Claude Code 在那裡會繼續使用自己的付費分類器，除非設定了 `safeguards_classifier_model`，在這種情況下 proxy 會代為回應 Converse 模型（包括 Claude）。在未套用修正的版本上，下面的驗證請求會在此路由上以 400 錯誤失敗：`safeguards: Extra inputs are not permitted`。若沒有這項設定，您需要將 Claude Code 指向 `bedrock/<inference profile>` 部署，或 v1.104.0 以上的 `bedrock_mantle/` 部署。Microsoft Foundry 另行追蹤，且不在本文涵蓋範圍內。

它最初是在 9 月 22 日星期二從 `main` 切出的 dev 版本中發布，早於 Anthropic 9 月 25 日的預設變更。Dev 版本是預先發布建置，會以 `-dev.N` 標籤發布到 PyPI、Docker Hub 與 GitHub releases，因此依照目前的編號，這個版本是 `v1.104.0-dev.1`（在 PyPI 上為 `litellm==1.104.0.dev1`）。Anthropic API 路由的修正現在已在 v1.104.0 穩定版中，並已回補到 v1.99.3、v1.100.2、v1.101.1、v1.102.1 與 v1.103.2。在任何較早的 LiteLLM 版本上，經由原生 `/v1/messages` 端點路由的 Claude Code 工作階段會看到這則通知，並會繼續使用用戶端分類器，直到您升級為止。若您希望在此期間使用者不要看到通知，Anthropic 有一份文件說明在 Claude Code 啟動所用的環境中設定 `CLAUDE_CODE_AUTO_MODE_SERVER=0`，這會告訴它不要向閘道查詢伺服器端檢查。這只會隱藏通知：在您升級之前，Claude Code 仍會持續送出相同的付費分類器請求。

## 如何驗證您的部署 {#how-to-verify-your-deployment}

送出一個與 Claude Code 所送出的完全相同的請求，並強制進行工具呼叫，讓伺服器有可供評估的內容。檢查回應中是否有 `safeguard_results`。模型必須是 LiteLLM 會路由到 Anthropic API、Bedrock InvokeModel、Bedrock Mantle 或 Vertex AI 的部署。請以您 proxy 上該部署的模型名稱取代 `claude-sonnet-5`。

```bash
curl -s "$LITELLM_PROXY_URL/v1/messages" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: dangerous-tool-use-2026-09-03" \
  -d '{
    "model": "claude-sonnet-5",
    "max_tokens": 256,
    "safeguards": [{"type": "dangerous_tool_use", "classifier_context": {"v": 1, "permission_mode": "auto"}}],
    "tools": [{"name": "Bash", "description": "Runs a shell command", "input_schema": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"]}}],
    "tool_choice": {"type": "tool", "name": "Bash"},
    "messages": [{"role": "user", "content": "Run: echo hello"}]
  }' | jq '{safeguard_results, tool_use_ids: [.content[] | select(.type == "tool_use") | .id]}'
```

在已套用修正的版本上，`safeguard_results` 中的工具使用 ID 與回應內容中的那個相符：

```json
{
  "safeguard_results": [
    {
      "type": "dangerous_tool_use",
      "status": {
        "type": "available",
        "tool_uses": {
          "toolu_01V9Z5KXn3SU71Fzr5cquHLi": {
            "type": "evaluated",
            "outcome": "not_flagged"
          }
        }
      }
    }
  ],
  "tool_use_ids": [
    "toolu_01V9Z5KXn3SU71Fzr5cquHLi"
  ]
}
```

在未修正的 proxy 上，`safeguard_results` 會回傳空白（`[]`）或缺失，因為 `safeguards` 從未送達提供者。

Anthropic 寄給我們一個閘道檢查腳本，會以非串流與串流方式送出相同請求，並驗證每個工具使用 ID 是否確實經過評估。兩種方式在已套用修正的版本上都通過。您也可以直接從 Claude Code 本身檢查。透過您的 proxy 以自動模式啟動工作階段，送出提示並等待回覆。接著執行 `/status`，並查看顯示為 `Enabled` 的 Auto mode server 列。在第一個模型回應之前，它在任何 proxy 上都會顯示 `Enabled`，因此請在收到回覆後再檢查。在非互動模式下搭配 `-p --output-format stream-json`，上述通知會以 `system` 訊息的形式出現在 `warning` 層級，因此可以被腳本以 grep 擷取。

如果您目前使用 `/anthropic/v1/messages` 直通路由，則無需採取任何動作。

---

### 常見問題 {#frequently-asked-questions}

### 這會以任何方式影響 LiteLLM 處理 Bedrock、Vertex AI 或 Azure AI 的 beta 標頭的方式嗎？ {#does-that-in-any-way-affect-how-litellm-deals-with-the-beta-headers-for-bedrock-vertex-ai-or-azure-ai}

當解析出的提供者不是第一方 `anthropic` 時，beta 標頭篩選仍會生效（因為那些提供者會拒絕未知的 beta 旗標），因此 `anthropic_beta_headers_config.json` 中的允許清單仍是它們的真實來源。`dangerous-tool-use-2026-09-03` 已列入上述版本中 Bedrock InvokeModel 與 Vertex AI 的允許清單，且自 v1.104.0 起也適用於 Bedrock Mantle（這就是這些路由上伺服器端自動模式的運作方式）。Bedrock Converse 將其對應為無，因此完全不會轉送到那裡。只有發往 Anthropic API 的請求才會將完整標頭原封不動地直通傳遞。

### 在我升級之前，我的 Claude Code 使用者會壞掉嗎？ {#will-my-claude-code-users-be-broken-before-i-upgrade}

不會。Claude Code 會偵測到伺服器端檢查未送達工作階段，並繼續使用自己的分類器。使用者會看到通知，維持目前的體驗，並且在您升級之前，分類器呼叫仍會持續計費。Anthropic 已告知我們，新的 Claude Code 版本會持續使用用戶端分類器直到至少 2026 年 10 月 23 日，且該日期之後的任何版本在自動模式上都需要伺服器端分類器，因此請在那之前升級。

### 這在 LiteLLM OSS 中可用嗎？ {#is-this-available-in-litellm-oss}

可以。此修正已包含在 LiteLLM OSS（Apache 2.0）中，且完全不需要任何設定。[LiteLLM Enterprise](https://litellm.ai/enterprise) 在此基礎上增加了 SSO/SCIM、air-gapped 部署、24/7 SLA 支援與一系列進階防護欄。

---

## 結論 {#conclusion}

置於 Claude Code 前方的 AI Gateway 必須轉送在它設計時尚不存在的提供者契約。`safeguards` 欄位就是其中之一，而 LiteLLM 的原生 `/v1/messages` 路由現在會在送往 Anthropic API、Bedrock InvokeModel、Bedrock Mantle 與 Vertex AI 的途中原封不動地傳遞它。請升級到含有修正的版本、讓 Claude Code 不要使用 `bedrock/converse/` 部署、執行上方檢查，您的使用者就能以零成本取得伺服器端自動模式。

## 推薦閱讀 {#recommended-reading}

- [Claude Code 與 LiteLLM AI Gateway](https://docs.litellm.ai/docs/tutorials/claude_code_gateway)
- [非 Claude 模型上的 Claude Code 自動模式](https://docs.litellm.ai/docs/claude_code_auto_mode)
- [Claude Code：管理 Anthropic beta 標頭](https://docs.litellm.ai/docs/tutorials/claude_code_beta_headers)
- [Anthropic 直通端點](https://docs.litellm.ai/docs/pass_through/anthropic_completion)
- [Anthropic：自動模式分類器請求費用](https://code.claude.com/docs/en/auto-mode-classifier-billing)
- [Anthropic：LLM 閘道相容性指南](https://code.claude.com/docs/en/llm-gateway-protocol#feature-pass-through)
