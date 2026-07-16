import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 由 Qohash 提供的 Qostodian Nexus {#qostodian-nexus-by-qohash}

[Qohash](https://qohash.com/) 是零拷貝資料安全領域的先驅，也是唯一專為保護大型企業中 PB 級非結構化資料而設計的模型。企業執行數十個 AI 模型、副駕程式與自主代理程式，而它們都需要資料。Qostodian Nexus 是治理每一次互動的單一控制層。它了解您的資料。它執行您的政策。它的擴展範圍從提示檢查到 LLM 輸出資料治理，以單一控制平面與一致的政策集合，審查所有代理式、人工作業、SaaS 與 API 互動。Nexus 會使用確定性分類政策與 LLM-as-a-judge 檢查來掃描提示與回應，並回傳明確的強制執行決策（ALLOW、LOG、REDACT 或 BLOCK）。

:::info
Qostodian Nexus 不是公開提供的服務。若要詢問存取權限，請造訪 [qohash.com](https://qohash.com)。
:::

## 快速開始 {#quick-start}

### 1. 部署 Qostodian Nexus {#1-deploy-qostodian-nexus}

將 Qostodian Nexus 以容器執行，並掛載您的政策設定：

```bash
docker run --rm \
  -p 8800:8800 \
  -v $(pwd)/nexus.yaml:/etc/nexus/config.yaml \
  qohash/nexus:latest
```

驗證它已就緒：

```bash
curl -i http://localhost:8800/health
# Expected: HTTP/1.1 200 OK
```

:::note
另有其他部署選項。[聯絡 Qohash](https://qohash.com) 以取得詳細資訊。
:::

### 2. 設定 LiteLLM Proxy (config.yaml) {#2-configure-litellm-proxy-configyaml}

**請求前** — 在敏感資料到達模型之前將其阻擋：

```yaml title="config.yaml (pre-call)"
guardrails:
  - guardrail_name: "qostodian-nexus-pre-call"
    litellm_params:
      guardrail: qostodian_nexus
      api_base: http://nexus:8800
      mode: "pre_call"
      default_on: true
```

**請求後** — 在模型輸出到達呼叫端之前，將其中的敏感資料去識別化或阻擋：

```yaml title="config.yaml (post-call)"
guardrails:
  - guardrail_name: "qostodian-nexus-post-call"
    litellm_params:
      guardrail: qostodian_nexus
      api_base: http://nexus:8800
      mode: "post_call"
      default_on: true
```

### 3. 啟動 LiteLLM Gateway {#3-start-litellm-gateway}

```bash
litellm --config config.yaml
```

### 4. 測試請求 {#4-test-requests}

<Tabs>
<TabItem label="BLOCK" value="block">

送出包含信用卡號的提示（由 `BLOCK` 政策阻擋）：

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_litellm_key>" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "MASTERCARD 5555555555554444 03/2027 123"}
    ],
    "guardrails": ["qostodian-nexus-pre-call"]
  }'
```

預期：Qostodian Nexus 回傳 `BLOCK` → LiteLLM 回傳錯誤，且不會發出任何提供者請求。

</TabItem>
<TabItem label="REDACT" value="redact">

**請求前** — 在提示到達模型之前，會將敏感子字串遮罩：

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_litellm_key>" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "My credit card is 5555555555554444, please summarize this."}
    ],
    "guardrails": ["qostodian-nexus-pre-call"]
  }'
```

預期：Qostodian Nexus 回傳 `REDACT` → LiteLLM 會將已遮罩的提示轉送給提供者。回應標頭會包含 `x-qostodian-nexus-outcome-decision: REDACT`。

**請求後** — 在模型回應到達呼叫端之前，會將其中的敏感內容遮罩：

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_litellm_key>" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Return my credit card number: 5555555555554444."}
    ],
    "guardrails": ["qostodian-nexus-post-call"]
  }'
```

預期：Qostodian Nexus 回傳 `REDACT` → LiteLLM 會回傳已遮罩輸出的回應。

</TabItem>
<TabItem label="LOG" value="log">

送出包含低敏感度資料、且會觸發 `LOG` 政策的提示（請求會繼續）：

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_litellm_key>" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "My employee ID is 123456 (test) and my phone is 555-0100"}
    ],
    "guardrails": ["qostodian-nexus-pre-call", "qostodian-nexus-post-call"]
  }'
```

預期：Qostodian Nexus 回傳 `LOG` → LiteLLM 轉送至提供者，回應會正常返回並附帶決策標頭。

</TabItem>
<TabItem label="ALLOW" value="allow">

送出良性提示（未偵測到敏感資料）：

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_litellm_key>" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Summarize the main differences between TCP and UDP."}
    ],
    "guardrails": ["qostodian-nexus-pre-call", "qostodian-nexus-post-call"]
  }'
```

預期：Qostodian Nexus 回傳 `ALLOW` → LiteLLM 會正常轉送至提供者。

</TabItem>
</Tabs>

## 決策 {#decisions}

Qostodian Nexus 會針對每個請求回傳一個決策：

| 決策 | 請求會繼續嗎？ | 說明 |
|---|---|---|
| `ALLOW` | 是 | 未偵測到政策違規 |
| `LOG` | 是 | 已記錄違規；請求會繼續並附帶結果中繼資料 |
| `REDACT` | 是（已遮罩） | 轉送前，酬載中的敏感子字串會被取代 |
| `BLOCK` | 否 | 請求失敗；不會發出任何提供者呼叫（適用於請求前） |

## 支援的參數 {#supported-parameters}

| 參數 | 類型 | 說明 |
|---|---|---|
| `guardrail` | string | 必須為 `qostodian_nexus` |
| `api_base` | string | 您的 Qostodian Nexus 執行個體基底 URL（例如 `http://nexus:8800`） |
| `mode` | string | `pre_call`（掃描提示）或 `post_call`（掃描模型輸出） |
| `default_on` | boolean | 預設將此防護欄套用至所有請求 |

LiteLLM 呼叫 Qostodian Nexus 不需要 API 金鑰。由於 Qostodian Nexus 設計為部署在您的基礎架構內，您必須使用網路控制來保護它。

## 請求識別碼 {#request-identifiers}

Qostodian Nexus 會要求每個請求都包含關聯識別碼。這些識別碼絕不會用來存取內容，它們只攜帶中繼資料，以便將偵測結果歸屬給正確的使用者、工作階段與內容。

請透過請求標頭傳遞它們：

```bash
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_litellm_key>" \
  -H "x-qostodian-nexus-identifiers-trace: trace-id" \
  -H "x-qostodian-nexus-identifiers-source: source-id" \
  -H "x-qostodian-nexus-identifiers-container: container-id" \
  -H "x-qostodian-nexus-identifiers-identity: identity@example.com" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "..."}
    ],
    "guardrails": ["qostodian-nexus-pre-call", "qostodian-nexus-post-call"]
  }'
```

| 識別碼 | 說明 |
|---|---|---|
| `trace` | 請求或工作階段的唯一 ID，用於跨事件關聯 |
| `source` | 發送請求的應用程式或整合（例如 app ID、服務名稱） |
| `container` | 對話或執行緒內容（例如 conversation ID） |
| `identity` | 端使用者身分（例如 email 或 UPN），用於使用者層級歸屬 |

這些欄位在所有部署模式中都必須提供。其效果取決於運作模式：

### Qostodian 平台 {#qostodian-platform}

[Qostodian](https://qohash.com/qostodian/) 是 Qohash 的資料安全態勢管理（DSPM）平台。它會監控您組織中的高風險非結構化資料，提供對敏感資料暴露、行為分析與治理工作流程的可見性。當 Qostodian Nexus 以連線或進階模式運作時，識別碼會轉送至 Qostodian，以便將 AI 偵測結果與跨使用者、工作階段與應用程式的更廣泛資料安全活動建立關聯。

| 模式 | 效果 |
|---|---|
| 基本獨立 | 識別碼會出現在結構化記錄輸出中，以利追蹤 |
| 基本連線 | 連接至 Qostodian 平台 — 識別碼用於顯示與歸屬 |
| 進階（平台） | 連接至 Qostodian 平台 — 識別碼可解鎖完整 DSPM 功能：活動關聯、行為輪廓分析與治理工作流程 |

## 安全指引 {#security-guidance}

Qostodian Nexus 在所有部署模式下都以 **零拷貝、資料主權式處理模型** 運作：內容會在記憶體中分析，且永遠不會持久化或傳輸給 Qohash。僅會回報中繼資料（偵測結果、政策決策、識別碼）— 提示與回應內容始終留在您的基礎架構內。

- 在正式環境中，請在 LiteLLM 與 Qostodian Nexus 之間使用 **TLS**
- 使用 mTLS（建議）或 bearer token 來 **驗證呼叫**
- **將 Qostodian Nexus 部署在客戶可控的基礎架構中**（內部部署或雲端租戶），以確保資料保留在您的安全邊界內
