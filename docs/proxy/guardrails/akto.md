# Akto {#akto}

將 [Akto](https://www.akto.io/) 用作防護欄提供者，為透過 proxy 路由的所有 LLM 流量啟用執行階段安全性。Akto 專為保護自主式與 agentic AI 系統而設計，可就地檢查每個請求與回應、為互動評分風險，並在有害動作、資料外洩與不安全行為發生前強制執行政策決策以加以阻擋。

Akto 的主要功能包括：

- **Agentic AI Discovery** - 自動探索您雲端環境中的 AI 代理程式、MCP 伺服器與 GenAI 應用程式
- **Continuous AI Red Teaming** - 執行 4,000+ 個 AI 專用探測，以在 CI/CD 中找出如提示注入、工具誤用、政策繞過與新興攻擊模式等風險
- **Runtime Guardrails** - 強制執行可設定的政策，涵蓋提示注入、越獄、敏感資料外洩、未授權工具使用、結構描述違規等更多項目
- **AI Security Posture Management** - 將風險分數、合規缺口與安全指標整合在單一檢視中，並支援 10+ 種標準，包括 OWASP GenAI、NIST AI RMF 與 MITRE ATLAS

與 akto 的整合使用**雙入口防護欄模式**：
- `akto-validate` (`pre_call`) — 在請求到達 LLM 之前，根據您的安全政策驗證請求
- `akto-ingest` (`post_call`) — 將請求與回應擷取到 Akto 以供監控與分析

## 快速開始 {#quick-start}

### 1. 取得您的 Akto 憑證 {#1-get-your-akto-credentials}

設定 Akto Guardrail API Service 並取得：
- `AKTO_GUARDRAIL_API_BASE` — 您的 Guardrail API Base URL
- `AKTO_API_KEY` — 您的 API 金鑰

### 2. 在 `config.yaml` 中設定 {#2-configure-in-configyaml}

#### 阻擋 + 擷取（建議） {#block--ingest-recommended}

同時使用下列兩個入口。這可讓您獲得：
- 請求前阻擋決策
- 對允許流量進行請求後擷取

請將這兩者維持為兩個獨立入口（`akto-validate` 與 `akto-ingest`）。

```yaml
guardrails:
  - guardrail_name: "akto-validate"
    litellm_params:
      guardrail: akto
      mode: pre_call
      akto_base_url: os.environ/AKTO_GUARDRAIL_API_BASE
      akto_api_key: os.environ/AKTO_API_KEY
      default_on: true
      unreachable_fallback: fail_closed   # optional: fail_open | fail_closed (default: fail_closed)
      guardrail_timeout: 5                # optional, default: 5
      akto_account_id: "1000000"         # optional, env fallback: AKTO_ACCOUNT_ID
      akto_vxlan_id: "0"                 # optional, env fallback: AKTO_VXLAN_ID

  - guardrail_name: "akto-ingest"
    litellm_params:
      guardrail: akto
      mode: post_call
      akto_base_url: os.environ/AKTO_GUARDRAIL_API_BASE
      akto_api_key: os.environ/AKTO_API_KEY
      default_on: true
```

#### 僅監控模式 {#monitor-only-mode}

如果您只想要記錄／擷取而不要阻擋，請只保留 `akto-ingest`。

```yaml
guardrails:
  - guardrail_name: "akto-ingest"
    litellm_params:
      guardrail: akto
      mode: post_call
      akto_base_url: os.environ/AKTO_GUARDRAIL_API_BASE
      akto_api_key: os.environ/AKTO_API_KEY
      default_on: true
```

### 3. 測試請求 {#3-test-request}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your litellm key>" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

如果請求被阻擋：

```json
{
  "error": {
    "message": "Prompt injection detected",
    "type": "None",
    "param": "None",
    "code": "403"
  }
}
```

## 運作方式 {#how-it-works}

當 LLM 請求到達時，Akto connector 會將負載交給 Akto Guardrail Engine，後者會根據您的輸入政策進行評估並回傳裁決。核准的請求會轉送至 LLM 提供者。回應會在送達呼叫端之前，經由 engine 傳回以進行輸出防護欄檢查。每一項決策都會流入 Akto 儀表板，以供監控、威脅分析與補救。

**阻擋 + 擷取模式：**
```
Request → LiteLLM → Akto guardrail check
  → Allowed  → forward to LLM → ingest response
  → Blocked  → ingest blocked marker → 403 error
```

**僅監控模式：**
```
Request → LiteLLM → forward to LLM → get response
  → Send to Akto (guardrails + ingest) → log only
```

## 事件行為 {#event-behavior}

| 入口 | LiteLLM hook | Akto 呼叫行為 |
|------|---|---|
| `akto-validate` | `pre_call` | 帶有 `guardrails=true`、`ingest_data=false` 的等待呼叫 |
| `akto-ingest` | `post_call` | 帶有 `guardrails=true`、`ingest_data=true` 的 fire-and-forget 呼叫 |

當在 `pre_call` 中被阻擋時，LiteLLM 會傳送一個帶有被阻擋中繼資料的 fire-and-forget 擷取負載，並回傳 `403`。

## 支援的參數 {#supported-parameters}

| 參數 | 環境變數 | 預設值 | 說明 |
|-----------|-------------|---------|-------------|
| `akto_base_url` | `AKTO_GUARDRAIL_API_BASE` | *必填* | Akto Guardrail API Base URL |
| `akto_api_key` | `AKTO_API_KEY` | *必填* | API 金鑰（以 `Authorization` 標頭傳送） |
| `akto_account_id` | `AKTO_ACCOUNT_ID` | `1000000` | 負載中包含的 Akto account id |
| `akto_vxlan_id` | `AKTO_VXLAN_ID` | `0` | 負載中包含的 Akto vxlan id |
| `unreachable_fallback` | — | `fail_closed` | `fail_open` 或 `fail_closed` |
| `guardrail_timeout` | — | `5` | 以秒為單位的逾時時間 |
| `default_on` | — | `true`（建議） | 預設啟用防護欄入口 |

## 錯誤處理 {#error-handling}

| 情境 | `fail_closed`（預設） | `fail_open` |
|----------|------------------------|-------------|
| Akto 無法連線 | ❌ 已阻擋（503） | ✅ 通過 |
| Akto 回傳錯誤 | ❌ 已阻擋（503） | ✅ 通過 |
| 防護欄判定否決 | ❌ 已阻擋（403） | ❌ 已阻擋（403） |

如果您想聯絡 Akto 團隊，請透過 [support@akto.io](mailto:support@akto.io) 與他們聯繫。
