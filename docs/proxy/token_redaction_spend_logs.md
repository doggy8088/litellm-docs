---
title: Spend Logs 中的 Token 遮罩
description: 遮罩儲存的支出記錄內容中已知型態的 token 機密，且不變更提供者的請求或用戶端的回應。
---

# Spend Logs 中的 Token 遮罩 {#token-redaction-in-spend-logs}

<SinceVersion v="1.110.0" />

LiteLLM 會將儲存的支出記錄內容中已知型態的 token 機密取代為 `REDACTED_BY_LITELM`。`general_settings.redact_tokens_in_spend_logs` 旗標**預設為開啟**。未設定或設為 `true` 都會啟用遮罩。若要退出，請明確將它設為 `false`。

此設定僅適用於以 `store_prompts_in_spend_logs: true` 保留的內容。它本身不會啟用提示儲存。[退出提示儲存](./ui_logs.md#turn-off-prompt-storage-for-a-key-or-team)的金鑰或團隊仍不會儲存任何請求或回應內容。

## 設定 {#configuration}

在您的 `config.yaml` 中啟用提示儲存，並重新啟動 proxy。Token 遮罩預設即會套用，因此不需要額外的旗標。

```yaml
general_settings:
  store_prompts_in_spend_logs: true
```

若要退出並在儲存的內容中保留 token 型態的字串，請將旗標設為 `false`。

```yaml
general_settings:
  store_prompts_in_spend_logs: true
  redact_tokens_in_spend_logs: false
```

請保留您現有的模型與資料庫設定。如何啟用支出記錄內容，請參閱[請求與回應儲存](./ui_logs.md#tracking---request--response-content-in-logs-page)。

## 涵蓋的儲存內容 {#stored-content-covered}

遮罩涵蓋儲存在 `proxy_server_request` 中的請求主體與儲存的 `response` 中的字串值，包括巢狀訊息、工具結果、工具呼叫引數與 logprobs。它也涵蓋保留在儲存酬載中的壓縮摘要文字。對於即時呼叫，它涵蓋儲存在獨立 `messages` 欄位中的序列化訊息。

此設定篩選的是儲存的副本，而不是即時酬載。傳送給提供者的請求與回傳給用戶端的回應不受影響。它不會改寫已在資料庫中的記錄。

使用 `previous_response_id` 的 `/v1/responses` 後續呼叫會從支出記錄重建歷史，因此重播的回合會包含遮罩後的值；而 `redact_tokens_in_spend_logs: false` 會在新的支出記錄中保留原始值。

## Token 型態 {#token-shapes}

下表列出 `_TOKEN_SHAPES` 中的每一個型態，加上 PEM 私鑰區塊型態，來自 [PR #48968 中的實作](https://github.com/BerriAI/litellm/pull/48968)。比對區分大小寫。除非該列另有說明，長度指的是所述前綴之後的字元。

| 提供者或格式 | 比對的型態 |
| --- | --- |
| Google OAuth | `ya29.` 之後接至少 20 個字母、數字或來自 `_.~+/-` 的字元。 |
| AWS access key ID | `AKIA` 或 `ASIA` 之後接正好 16 個大寫字母或數字，然後是單字邊界。這比對的是 ID，而不是無前綴的 AWS 秘密存取金鑰。 |
| OpenAI 型態、Anthropic 與 LiteLLM 金鑰 | `sk-` 之後接字母、數字、連字號或底線。後綴最小長度為 `MINIMUM_CUSTOM_KEY_LENGTH - 3`，預設為 13，因此總長度至少為 16。環境變數 `MINIMUM_CUSTOM_KEY_LENGTH` 可變更此門檻。 |
| Stripe | `sk_live_`、`sk_test_`、`rk_live_` 或 `rk_test_` 之後接至少 24 個字母或數字。 |
| Google API 金鑰 | `AIza` 之後接正好 35 個字母、數字、連字號或底線。 |
| Databricks | `dapi` 之後接正好 32 個小寫十六進位字元，然後是單字邊界。 |
| GitHub 傳統與 OAuth token | `ghp_`、`gho_`、`ghu_`、`ghs_` 或 `ghr_` 之後接至少 36 個字母或數字。 |
| GitHub 細粒度個人存取 token | `github_pat_` 之後接正好 82 個字母、數字或底線。 |
| GitLab 個人存取 token | `glpat-` 之後接至少 20 個字母、數字、連字號或底線。 |
| Linear | `lin_api_` 之後接正好 40 個字母或數字，然後是單字邊界。 |
| Slack | `xoxa-`、`xoxb-`、`xoxp-`、`xoxo-`、`xoxs-` 或 `xoxr-` 之後接至少 10 個字母、數字或連字號。 |
| Hugging Face | `hf_` 之後接至少 34 個字母或數字。 |
| npm | `npm_` 之後接正好 36 個字母或數字，然後是單字邊界。 |
| PyPI | `pypi-AgEIcHlwaS5vcmc` 之後接至少 50 個字母、數字、連字號或底線。 |
| SendGrid | `SG.` 之後接 22 個字母、數字、連字號或底線、一個點號，然後是來自相同集合的 43 個字元。最後一段可以以 `-` 結尾。其後必須是字串結尾或 `[A-Za-z0-9_-]` 之外的字元，使用 `(?![A-Za-z0-9_-])` 而不是單字邊界。 |
| JWT | 以點號分隔的三段。標頭以 `eyJ` 開頭，之後接至少 10 個字母、數字、連字號或底線。酬載與簽章各包含至少一個來自該集合的字元。酬載不需要 `eyJ` 前綴，因此如 `e30`（`{}`）的短酬載也會比對成功。 |
| PEM 私鑰 | 從 `-----BEGIN…PRIVATE KEY-----` 到 `-----END…PRIVATE KEY-----` 的完整區塊，包括多行內容。`BEGIN` 或 `END` 與 `PRIVATE KEY` 之間的文字可以包含大寫字母、空格與連字號，如 RSA 或 EC 金鑰標頭。此型態不要求標頭與結尾標籤相符，也沒有固定的區塊長度。 |

後綴長度精確但結尾沒有單字邊界的型態，可能會比對到較長字串的對應前綴。這些是型態檢查，而不是憑證驗證。

## 運作方式 {#how-it-works}

在回應送出後的非同步支出記錄處理期間，LiteLLM 會對支出記錄內容清理器保留的每個字串執行一次 regex 掃描。比對到的子字串會在長字串為資料庫儲存而截斷之前，變成 `REDACTED_BY_LITELM`。即時訊息在 JSON 序列化後會經過同一個遮罩器。保留的壓縮摘要會在其獨立的長度限制套用之前先被遮罩。

Token 型態從前一個字元不是單字字元的位置開始，或緊接在 JSON 跳脫 `\n`、`\r` 或 `\t` 之後。單字字元包括字母、數字與底線。這個起始規則可以捕捉位於文字開頭，以及標點、空白或序列化換行之後的 token，而不會比對到嵌入在另一個單字內部的 token 前綴。PEM 區塊型態不需要這個起始規則。

這次掃描不會比對 `password`、`Basic` 或 `Bearer` 等關鍵字。沒有已知 token 型態的一般文字不會被這次掃描更動。既有的支出記錄憑證欄位遮罩與酬載截斷仍會獨立套用。

## 儲存的工具結果範例 {#stored-tool-result-example}

在 `redact_tokens_in_spend_logs: false` 時，工具結果可以在其儲存內容中保留一個合成的 GitHub token。

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_1",
  "content": "GITHUB_TOKEN=ghp_a1B2c3D4e5a1B2c3D4e5a1B2c3D4e5F6g7H8\ndone"
}
```

在預設行為下，或將旗標明確設為 `true` 時，儲存的副本會包含取代值，並保留周圍的文字。

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_1",
  "content": "GITHUB_TOKEN=REDACTED_BY_LITELM\ndone"
}
```

## 限制 {#limitations}

此旗標僅適用於支出記錄。它不會遮罩 OpenTelemetry、Langfuse 或其他記錄回呼。請分別設定那些整合。

只會偵測上述已知型態。這不是 PII 偵測，也找不到任意密碼、無前綴的機密或所有可能的提供者憑證。恰好符合 token 型態的一般文字也可能被遮罩。請將此設定作為額外的防護措施，而不是儲存內容不含機密的保證。

即時的提供者請求與用戶端回應維持不變。若要在內容到達提供者之前遮罩它，請使用獨立的請求防護欄，而不是這個支出記錄設定。
