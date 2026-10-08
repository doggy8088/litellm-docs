---
title: 透過 Claude Code 與 Claude Desktop 使用 Auto Router
sidebar_label: Auto Router
description: 透過 LiteLLM auto router 路由 Claude Code 與 Claude Desktop，包含 gateway discovery 的 model-name 篩選，以及決定路由器是否可被選取的 organization allowlist 要求。
---

# 透過 Claude Code 與 Claude Desktop 使用 Auto Router {#auto-router-with-claude-code-and-claude-desktop}

LiteLLM [auto router](../proxy/auto_routing.md) 會將每個 Claude Code 請求送到可處理它的最小模型，這正是 Claude Code 工作負載大部分節省成本的來源。將 Claude 指向其中一個所需的設定，幾乎只比一般的 `ANTHROPIC_BASE_URL` 設定多一點：如果您的組織限制模型，就需要將路由器名稱加入組織的模型 allowlist；如果您希望選擇器自動探索路由器而不是明確指定名稱，則名稱中必須包含 `claude` 或 `anthropic`。

略過 allowlist 步驟後，路由器會在 Claude Desktop 模型選擇器中變成灰色，在 CLI 的 `/model` 中消失，而任何嘗試以名稱選取它的操作都會以 `Model "<name>" is restricted by your organization's settings. Using <model> instead.` 的提示，改以其他模型開始工作階段。沒有任何請求會送到您的代理伺服器，因此 LiteLLM 記錄會保持空白，問題看起來像是路由錯誤，而不是用戶端端的政策檢查。

## 將路由器命名為 Claude 可接受的名稱 {#name-the-router-so-claude-accepts-it}

關於路由器名稱，對 Claude Code 本身真正重要的只有一點，而且比看起來更嚴格：gateway model discovery（`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`，見下方）會根據您代理伺服器的 `/model` 回應，填入 `/v1/models` 選擇器，並且只保留其 `id` 的字串中任何位置包含 `claude` 或 `anthropic` 的項目，且不分大小寫；該回應中的其他內容都會被丟棄。這就是全部的篩選規則。對像 `opus`、`sonnet`、`haiku` 或 `fable` 這類家族詞沒有額外的允許，也不會檢查競爭供應商的名稱，因此 `claude-auto` 和 `claude-smart-router` 可以通過 discovery，而 `smart-router` 和純 UUID 則不行；即使名稱提到競爭對手，`claude-vs-gpt` 也同樣可以通過。

Discovery 只是用來自動填入選擇器的便利功能，不是路由器是否可用的門檻。將 `ANTHROPIC_MODEL` 指向任何 `model_name`，或在 CLI 或 Claude Desktop 中把 `ANTHROPIC_CUSTOM_MODEL_OPTION` 設成它，Claude Code 就會直接傳遞該字串，不會對其形式做任何用戶端端驗證，因此名為 `smart-router` 的路由器與 `claude-auto` 的運作方式相同。當某個名稱會被 discovery 略過時，就用這個方式，而不是為了迎合只影響選擇器的篩選規則去重新命名路由器。

唯一仍會讓您在家族詞上吃虧的地方，是下一節的 allowlist，而不是用戶端：`opus-auto` 在那裡會被視為特定的 Opus 項目，這會停用 `opus` 家族萬用字元，並且讓您仍想保留可選取的其他 Opus 版本都必須手動列出。使用 `claude` 命名可避免這個問題。

```yaml title="config.yaml" keep-model-ids
model_list:
  - model_name: claude-auto
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-sonnet-5
          COMPLEX:   claude-sonnet-5
          REASONING: claude-opus-4-8
      complexity_router_default_model: claude-sonnet-5
```

若要讓代理程式依據您的代理伺服器已提供的模型撰寫該項目，請告訴它 `run curl -fsSL https://docs.litellm.ai/skills/auto-router and follow the instructions`，並說明該路由器是給 Claude Code 使用，讓它選擇一個可接受的名稱。

如果 API 呼叫端已經使用非 Anthropic 的名稱，請透過宣告第二個具有相同 `complexity_router_config` 的 `model_list` 項目，並在 Claude-facing 名稱下保留兩者。`router_settings.model_group_alias` 在這裡無法運作，因為別名解析會在 auto-router 派送之後才執行，而被別名指向的請求會因 `Unmapped LLM provider` 而失敗。

## 將路由器加入您組織的 allowlist {#add-the-router-to-your-organizations-allowlist}

使用 Claude for Teams 或 Claude for Enterprise 的組織，會透過 Claude Code managed settings 中的 [`availableModels`](https://code.claude.com/docs/en/model-config#restrict-model-selection) 限制模型選擇。該清單是 allowlist，且會比對像 `sonnet` 這樣的模型家族、版本前綴或完整模型 ID，因此 gateway 託管的路由器必須以其精確的 `model_name` 列出。

```json
{
  "availableModels": ["claude-auto", "sonnet", "haiku"]
}
```

擁有者會在 claude.ai 主控台中的 **Admin Settings > Claude Code > Managed settings** 設定這項內容，這會涵蓋 Claude Desktop 和 claude.ai 工作階段。指向 LiteLLM 的終端機工作階段也需要透過 MDM 或受管理的設定檔傳遞相同清單，因為當 `ANTHROPIC_BASE_URL` 指向 Anthropic 以外的地方時，Claude Code 會略過伺服器管理的設定擷取。該檔案位於 macOS 上的 `/Library/Application Support/ClaudeCode/managed-settings.json`、Linux 和 WSL 上的 `/etc/claude-code/managed-settings.json`，以及 Windows 上的 `C:\Program Files\ClaudeCode\managed-settings.json`。

這個 allowlist 是獨立於 Enterprise 管理主控台中的 per-model 限制之外的控制項；後者管理的是 Anthropic 自己的模型，而不是自訂 gateway ID。兩者都會生效，因此只有當路由器在 `availableModels` 上，且其路由到的模型未被組織限制時，它才可被選取。

## 將 Claude 指向路由器 {#point-claude-at-the-router}

對 CLI 而言，請匯出代理伺服器 URL、虛擬金鑰以及路由器名稱。`ANTHROPIC_MODEL` 會在啟動時讀取，因此請在啟動 `claude` 之前先設定好。

```bash
export ANTHROPIC_BASE_URL=https://your-litellm-proxy.com
export ANTHROPIC_AUTH_TOKEN=sk-...
export ANTHROPIC_MODEL=claude-auto
```

若要讓路由器進入 `/model` 選擇器，而不只是進入啟動模型，請設定 `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`，Claude Code 就會根據代理伺服器的 `/v1/models` 填入選擇器。在關閉 discovery 的情況下，`ANTHROPIC_CUSTOM_MODEL_OPTION=claude-auto` 會改為新增單一項目。

對 Claude Desktop 而言，請在 **Developer > Configure Third-Party Inference** 下輸入代理伺服器 URL 與虛擬金鑰，接著在模型清單中選取路由器。[Claude Desktop 設定指南](../proxy/client_setup/claude_desktop.md) 會逐步說明對話框畫面。

## 用戶端中顯示的 context window {#context-window-shown-in-the-client}

LiteLLM 為路由器宣告的 window 與 Claude Code 實際運作的 window 是兩個不同的數字，而代理伺服器無法把其值推送到用戶端。對於 Claude Code 不認識為 Anthropic 模型之一的模型名稱，它會套用自己的預設值，而 gateway 提供的路由器名稱永遠都不是。將 `max_input_tokens` 設在路由器的 `model_info` 中，會改變 `/v1/models` 和 LiteLLM UI 回報的內容，但不會改變用戶端顯示的內容或何時進行壓縮，因此兩者不一致是預期中的情況，而不是路由器設定錯誤的跡象。

請另外設定用戶端。`CLAUDE_CODE_AUTO_COMPACT_WINDOW`，或在 `.claude/settings.json` 中的 `autoCompactWindow`，會在自動壓縮之前設定 Claude Code 目標使用的 context window，而 `autoCompactEnabled` 則會關閉壓縮。請參閱 Claude Code 的 [model configuration](https://code.claude.com/docs/en/model-config) 參考文件。

相同的分離情況也適用於任何指向路由器的 harness：它顯示的數字來自自身對於未知名稱的預設值，因此必須在 harness 中設定。代理伺服器強制執行的內容不受任何影響，因為 [context-window 檢查與升級](../proxy/auto_routing.md#context-window) 會針對路由器實際挑選的層級模型執行，而不是針對路由器名稱執行。

## 將虛擬金鑰範圍限定為路由器 {#scope-the-virtual-key-to-the-router}

請提供給 Claude 用戶端一把僅限於路由器的金鑰。

```bash
curl -X POST $LITELLM_PROXY_URL/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"models": ["claude-auto"]}'
```

模型 discovery 會列出該金鑰可觸及的所有項目，而 Claude Desktop 的 **Test connection** 接著會以所發現的其中一個模型來探測 `/v1/messages`，而不是您選取的那一個。範圍過廣的金鑰會讓這變成某個無關部署的連線失敗，讀起來就像是路由器損壞。將金鑰範圍限定為 `claude-auto` 可讓 discovery 只回傳一個模型，並讓探測請求命中路由器本身。這裡也值得檢查萬用字元路由名稱，因為 `claude-*` 在 `model_list` 中的字面項目會原封不動地發佈到 `/v1/models`，而當用戶端探測它時就會回傳 404。

## 疑難排解 {#troubleshooting}

| 症狀 | 原因 | 修正方式 |
| ------- | ----- | --- |
| Claude Desktop 或 claude.ai 模型選擇器中的 Router 呈灰色無法選取 | Router 名稱缺少於 `availableModels` 中 | 將完整且正確的 `model_name` 加入 allowlist，然後重新啟動用戶端 |
| CLI 啟動時 `Model "<name>" is restricted by your organization's settings` | 相同的 allowlist，但傳送到終端機 | 透過 MDM 或 `managed-settings.json` 部署清單；管理主控台管道無法到達 `ANTHROPIC_BASE_URL` 上的工作階段 |
| 即使 `availableModels` 已列出，Router 仍從未出現在選擇器中 | 依賴名稱缺少 `claude`/`anthropic` 的探索，因此一開始就無法被探索到 | 重新命名它，或直接使用 `ANTHROPIC_CUSTOM_MODEL_OPTION` 加入，而不要依賴探索 |
| 測試連線在命名您未曾選取的模型時失敗 | 金鑰會探索到 Router 之外的模型，而探測會選到其中一個 | 將虛擬金鑰限定在該 Router |
| 修改後 Router 從 `/v1/models` 和 Models 頁面消失 | 舊版在部署被取代時，不會重新連結記憶體中的 router 註冊表 | 重新啟動 proxy 以從資料庫重新載入，並升級到包含 [PR #34564](https://github.com/BerriAI/litellm/pull/34564) 的版本 |
| 用戶端中的 context window 看起來不正確，針對該 Router 而言 | Claude Code 對於它無法辨識的模型名稱套用了自己的預設值；proxy 值僅供參考 | 在用戶端上設定 `CLAUDE_CODE_AUTO_COMPACT_WINDOW` 或 `autoCompactWindow`。在 Router 上設定 `model_info.max_input_tokens` 只會影響 `/v1/models` 與 UI 的回報 |

## 相關 {#related}

- [自動路由](../proxy/auto_routing.md)
- [Claude Code - 降低成本](./claude_code_cut_costs.md)
- [Claude Desktop 設定](../proxy/client_setup/claude_desktop.md)
- [虛擬金鑰](../proxy/virtual_keys.md)
