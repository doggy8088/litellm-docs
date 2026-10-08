---
slug: claude-code-server-side-auto-mode
title: "透過 LiteLLM 使用 Claude Code 伺服器端自動模式"
date: 2026-09-21T12:00:00
authors:
  - litellm
description: "Anthropic 正將 Claude Code 自動模式的安全分類器移至伺服器端。LiteLLM 的原生 /v1/messages 路由現在會將防護契約轉送至 Anthropic API、Bedrock InvokeModel、Bedrock Mantle 與 Vertex AI。以下說明該契約、變更內容、涵蓋哪些版本，以及如何驗證。"
tags: [announcement, claude-code, anthropic, ai-gateway]
hide_table_of_contents: true
---

*最後更新：2026 年 10 月 6 日*

Anthropic 正將 Claude Code 自動模式的安全分類器從用戶端移至 Claude API。自 2026 年 9 月 19 日發布的 Claude Code v2.1.278 起，Enterprise 方案與 Claude API 帳戶中的工作階段會要求伺服器在各自的模型請求中執行這些檢查，而 Anthropic 不會對伺服器執行的檢查收費。Anthropic 告訴我們，這項推行自 9 月 18 日開始且採漸進式推出，先從 Claude Code CLI 與 VS Code 擴充功能開始，接著在隔週於桌面應用程式與網頁版 Claude Code 推出，並且在 9 月 25 日時，自動模式會成為 Claude Code 的預設權限模式。如今，內建預設值在 Pro、Max 與 Team 方案上為 auto，在 Enterprise 方案與 Claude API 金鑰上為 Manual；依 Anthropic 的 [權限模式參考](https://code.claude.com/docs/en/permission-modes)，這些帳戶通常位於閘道之後。

伺服器端自動模式依賴 Claude Code 與 API 之間的一項契約，而有些閘道並未保留這項契約，LiteLLM 也包含在內。此修正最早於 9 月 22 日星期二的開發版釋出中推出，現在已包含在 v1.104.0 穩定版以及較早版本線的修補版中。這篇文章說明 Claude Code 對 AI 閘道的需求、LiteLLM 原本做錯了什麼、有哪些變更、哪些版本包含這項修正，以及如何確認您的部署已就緒。

{/* truncate */}

## 伺服器端自動模式需要 AI 閘道提供什麼 {#what-server-side-auto-mode-needs-from-an-ai-gateway}

Claude Code 會在 `/v1/messages` 請求本文中送出一個 `safeguards` 欄位，這是一個只包含一個 `dangerous_tool_use` 項目的陣列，承載該工作階段的權限模式，並在 `anthropic-beta` 標頭中設定 `dangerous-tool-use-2026-09-03`。API 會以一個 `safeguard_results` 欄位作回應：其中一個 `dangerous_tool_use` 項目，其 `status.type` 為 `available`，且其 `status.tool_uses` 以工具使用 ID 為鍵，每個都標記為 `evaluated`，並帶有例如 `not_flagged` 的結果。當回應以串流方式傳送時，`safeguard_results` 會出現在最後一個 `message_delta` 事件的 `delta` 中。

要讓伺服器端自動模式運作，閘道必須按原樣轉送請求標頭與本文欄位，即使是它不認識的欄位，例如 `safeguards`，並且在回傳回應與串流事件時不得遺漏 `safeguard_results` 之類的鍵，或重寫工具使用 ID。Anthropic 的 [閘道相容性指南](https://code.claude.com/docs/en/llm-gateway-protocol#feature-pass-through) 已清楚說明這點。

如果其中任何一項被遺漏或重寫，伺服器端的檢查就永遠不會送達該工作階段，而 Claude Code 會繼續使用自己的分類器請求，費用與以前相同。在第一次會採用那種方式執行動作之前，Claude Code 會暫停該動作並顯示以下通知，並標示出閘道名稱：

```text
We're changing auto mode to no longer charge for classifier requests in Claude Code. However, this session isn't eligible because your requests go through <your gateway>, which isn't compatible with this update. Nothing breaks: auto mode keeps working, and its classifier requests are billed as before. To fix it and access the new version of auto mode, ask your gateway to implement: https://code.claude.com/docs/en/auto-mode-classifier-billing
```

發生這種情況時不會有任何損壞。使用者仍會維持目前的自動模式，並持續為分類器呼叫付費。Anthropic 已告訴我們，新的 Claude Code 版本至少會保留用戶端分類器到 2026 年 10 月 23 日為止，該日期之後的版本只支援伺服器端自動模式，而且自那之後，若閘道不支援伺服器端分類器，自動模式將無法在該閘道後方使用，因此閘道有一段時間可以補上。Anthropic 的 [通知參考](https://code.claude.com/docs/en/auto-mode-classifier-billing) 說明了哪些人會看到這則通知，以及其意義。

## LiteLLM 原本做錯了什麼 {#what-litellm-was-doing-wrong}

LiteLLM 的原生 `/v1/messages` 端點會從已知 Anthropic Messages 參數的允許清單建立外送請求，因此同一個端點可作為 Claude on Bedrock、Vertex AI、Azure AI 以及非 Anthropic 模型的前端。`safeguards` 不在該清單中，因此它在請求離開代理程式之前就被悄悄丟棄了。

因此 Anthropic 收到的請求沒有 `safeguards`，也就沒有回傳任何已評估的 `safeguard_results`，而 Claude Code 便退回到付費的用戶端分類器。以 auto 模式在未套用修正的 LiteLLM 版本上執行 Claude Code v2.1.278 時，會顯示上方那則通知，裡面會包含您的代理程式位址，而且 `/status` 會將 Auto mode server 列顯示為 `Disabled`。

原始直通路由 `POST /anthropic/v1/messages` 從未受影響。它會逐字轉送本文與標頭，而在修正之前，它已經包含 `safeguards` 與完整的 beta 標頭。我們透過對修正前的建置執行 Anthropic 的閘道檢查來確認這點：直通路由通過，而原生路由失敗。

## 有哪些變更 {#what-changed}

[PR #42152](https://github.com/BerriAI/litellm/pull/42152) 於 2026 年 9 月 21 日合併到 `main`，使原生 `/v1/messages` 路由得以保留這項契約。`safeguards` 現在是可辨識的請求參數，並會照送出內容轉送。當解析出的提供者是第一方 `anthropic` 時，`anthropic-beta` 標頭會原樣轉送，而不是依 known-betas 清單進行篩選；對 Claude on Bedrock、Vertex AI 與 Azure AI 的請求仍會保留現有篩選，因為那些提供者仍會拒絕未知旗標。`safeguard_results` 已在回應與串流區塊型別中宣告，且在 JSON 回應與串流時的最後一個 `message_delta` 事件中都會原樣返回。LiteLLM 不會在這條路由上重寫工具使用 ID，因此 `safeguard_results` 項目仍會與它們所對應的工具使用相符。

當使用 `/v1/messages` 透過轉接器路徑連到非 Anthropic 模型時，`safeguards` 會在請求被轉換前移除，因此那些後端不會回傳 400。

這項修正涵蓋 LiteLLM 通往 Anthropic API 的路由。Claude Code 也會在 Amazon Bedrock 與 Google Cloud 的 Vertex AI 上要求伺服器端檢查，而 [PR #42288](https://github.com/BerriAI/litellm/pull/42288) 於 2026 年 9 月 21 日合併，也涵蓋了這些情況。在 `/v1/messages` 上，Claude on Bedrock InvokeModel（例如 `bedrock/us.anthropic.claude-sonnet-5`）與 Claude on Vertex AI 現在都會轉送 `safeguards` 與 `dangerous-tool-use-2026-09-03` beta，而 `safeguard_results` 會原樣傳回。這項變更包含於 v1.99.3、v1.100.2、v1.101.1、v1.102.1、v1.103.2 與 v1.104.0；v1.101.0 與 v1.103.0 不包含它。Claude on Bedrock Mantle（`bedrock_mantle/anthropic.claude-sonnet-5`）自 v1.104.0 起透過 Mantle 原生的 Anthropic Messages API 提供服務，且同樣會保留該契約。

Bedrock Converse 路由 `bedrock/converse/<model>` 在任何版本中都未涵蓋。LiteLLM 會透過 chat completions 轉接器翻譯它，而該轉接器會捨棄 `safeguards`，且 Bedrock 的 ConverseStream API 即使收到也不會回傳 `safeguard_results`，因此 Claude Code 在那裡仍會使用其付費分類器。在未套用修正的版本上，下面的驗證請求會在此路由上以 400 失敗，`safeguards: Extra inputs are not permitted`。請改將 Claude Code 指向 `bedrock/<inference profile>` 部署，或 v1.104.0 以上的 `bedrock_mantle/` 部署。Microsoft Foundry 另行追蹤，且不在本文涵蓋範圍內。

它最初是在 9 月 22 日星期二從 `main` 切出的 dev release 中發布，早於 Anthropic 9 月 25 日的預設變更。Dev release 是預先發布版本，會以 `-dev.N` 標籤發布到 PyPI、Docker Hub 和 GitHub releases，因此依照目前的編號，這個版本是 `v1.104.0-dev.1`（在 PyPI 上為 `litellm==1.104.0.dev1`）。Anthropic API 路由的修正現在已在 v1.104.0 穩定版中，並已回補到 v1.99.3、v1.100.2、v1.101.1、v1.102.1 和 v1.103.2。任何較早的 LiteLLM 版本上，經由原生 `/v1/messages` 端點路由的 Claude Code 會看到通知，並繼續使用用戶端分類器，直到您升級為止。若您希望在此期間使用者不要看到通知，Anthropic 說明可在 Claude Code 啟動所用的環境中設定 `CLAUDE_CODE_AUTO_MODE_SERVER=0`，這會告訴它不要向閘道要求伺服器端檢查。這只會隱藏通知：在您升級之前，Claude Code 仍會持續送出相同的付費分類器請求。

## 如何驗證您的部署 {#how-to-verify-your-deployment}

送出一個模擬 Claude Code 所送出的請求，並強制呼叫工具，讓伺服器有可供評估的內容，然後檢查回應中是否有 `safeguard_results`。模型必須是 LiteLLM 會路由到 Anthropic API、Bedrock InvokeModel、Bedrock Mantle 或 Vertex AI 的部署；請以您 proxy 上該部署的模型名稱取代 `claude-sonnet-5`。

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

在已修正的版本上，`safeguard_results` 中的工具使用 ID 會與回應內容中的 ID 相符：

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

Anthropic 與我們分享了一個閘道檢查腳本，會以非串流與串流方式送出相同請求，並檢查每個工具使用 ID 是否都已完成評估。兩種情況在已修正的版本上都會通過。您也可以直接從 Claude Code 本身進行檢查：透過您的 proxy 以 auto mode 啟動工作階段，送出提示並等待回覆，接著執行 `/status`，並查看 Auto mode server 那一列是否顯示 `Enabled`。在第一個模型回應之前，任何 proxy 上該列都會顯示 `Enabled`，因此請在收到回覆後再檢查。若在非互動模式下搭配 `-p --output-format stream-json`，上方通知會以 `system` 訊息的形式出現在 `warning` 層級，因此可用腳本化檢查去搜尋它。

如果您目前使用 `/anthropic/v1/messages` pass-through 路由，則無需採取任何動作。

---

### 常見問題 {#frequently-asked-questions}

### 這會改變 LiteLLM 處理 Bedrock、Vertex AI 或 Azure AI 的 beta headers 方式嗎？ {#does-this-change-how-litellm-handles-beta-headers-for-bedrock-vertex-ai-or-azure-ai}

當解析後的提供者不是第一方 `anthropic` 時，beta header 的過濾仍會套用，因為這些提供者會拒絕未知的 beta 標記，所以 `anthropic_beta_headers_config.json` 中的 allowlist 仍是它們的事實來源。`dangerous-tool-use-2026-09-03` 已列入上述版本中 Bedrock InvokeModel 與 Vertex AI 的 allowlist，且自 v1.104.0 起也適用於 Bedrock Mantle，這就是這些路由上伺服器端 auto mode 的運作方式。Bedrock Converse 會將其對應為無，因此不會轉送到那裡。只有發往 Anthropic API 的請求才會原封不動轉送整個 header。

### 在我升級之前，我的 Claude Code 使用者會壞掉嗎？ {#will-my-claude-code-users-be-broken-before-i-upgrade}

不會。Claude Code 會偵測伺服器的檢查未到達該工作階段，並繼續使用自己的分類器。使用者會看到通知，維持目前的體驗，並且在您升級之前，classifier 呼叫仍會持續計費。Anthropic 已告知我們，新的 Claude Code 版本會持續使用用戶端分類器直到至少 2026 年 10 月 23 日，而該日期之後的版本在 auto mode 中需要伺服器端分類器，因此請在那之前升級。

### 這在 LiteLLM OSS 中可用嗎？ {#is-this-available-in-litellm-oss}

可以。修正已包含在 LiteLLM OSS（Apache 2.0）中，且不需要任何設定。[LiteLLM Enterprise](https://litellm.ai/enterprise) 則在此基礎上增加 SSO/SCIM、air-gapped 部署、24/7 SLA 支援與進階 guardrails。

---

## 結論 {#conclusion}

置於 Claude Code 前方的 AI Gateway 必須轉送那些在設計時尚未存在的提供者合約。`safeguards` 欄位就是其中之一，而 LiteLLM 的原生 `/v1/messages` 路由現在會在送往 Anthropic API、Bedrock InvokeModel、Bedrock Mantle 和 Vertex AI 的途中原封不動地傳遞它。請升級到含有修正的版本、讓 Claude Code 不要使用 `bedrock/converse/` 部署、執行上方檢查，您的使用者就能以零成本取得伺服器端 auto mode。

## 推薦閱讀 {#recommended-reading}

- [Claude Code 與 LiteLLM AI Gateway](https://docs.litellm.ai/docs/tutorials/claude_code_gateway)
- [Claude Code：管理 Anthropic beta headers](https://docs.litellm.ai/docs/tutorials/claude_code_beta_headers)
- [Anthropic pass-through 端點](https://docs.litellm.ai/docs/pass_through/anthropic_completion)
- [Anthropic：auto mode classifier 請求費用](https://code.claude.com/docs/en/auto-mode-classifier-billing)
- [Anthropic：LLM gateway 相容性指南](https://code.claude.com/docs/en/llm-gateway-protocol#feature-pass-through)
