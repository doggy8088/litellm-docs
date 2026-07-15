---
marp: true
theme: duotify-slide-template
paginate: true
size: 16:9
---

<style>
/* LiteLLM deck compatibility layer for the duotify theme. */
section:not(.lead) {
  display: flex !important;
  flex-direction: column;
  justify-content: flex-start !important;
  align-items: stretch;
  padding: 120px 88px 54px !important;
}
section:not(.lead) > h2 {
  position: absolute !important;
  top: 52px !important;
  left: 88px !important;
  right: 88px !important;
  min-height: 46px;
  margin: 0 !important;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--loop-line);
  font-size: 38px;
  line-height: 1.16;
  z-index: 2;
}
section:not(.lead) > h2 + * {
  margin-top: 0 !important;
}
section:not(.lead) p,
section:not(.lead) li {
  font-size: 22px;
  line-height: 1.32;
}
section:not(.lead) p {
  margin: 0 0 12px;
}
section:not(.lead) > ul:first-of-type,
section:not(.lead) > ol:first-of-type {
  position: static !important;
  margin: 0 0 14px !important;
  padding-left: 1.12em !important;
}
section:not(.lead) > ul:first-of-type li,
section:not(.lead) > ol:first-of-type li {
  margin: 0 0 7px !important;
}
section:not(.lead) blockquote {
  margin: 0 0 12px;
  padding: 8px 22px;
}
section:not(.lead) blockquote p {
  margin: 0;
}
section:not(.lead) pre {
  margin: 8px 0 12px;
  padding: 13px 18px;
}
section:not(.lead) pre code {
  font-size: 15px;
  line-height: 1.16;
}
section:not(.lead) table {
  font-size: 18px;
}
section:not(.lead) th,
section:not(.lead) td {
  padding: 7px 9px;
}
section:not(.lead) h3 {
  font-size: 24px;
  margin: 10px 0 6px;
}
section.compact p,
section.compact li,
section.references p,
section.references li {
  font-size: 20px;
}
section.compact pre code {
  font-size: 11.5px;
  line-height: 1.08;
}
section.compact pre {
  margin: 5px 0 8px;
  padding: 8px 14px;
}
section.code-dense pre code {
  font-size: 10px;
  line-height: 1.04;
}
section.code-dense pre {
  padding: 6px 12px;
}
section.compact table,
section.references table {
  font-size: 17px;
}
section.title h1 {
  font-size: 54px;
}
section.title h2 {
  font-size: 36px;
  margin-bottom: 26px;
}
section.title p {
  font-size: 25px;
}
</style>

<!-- _class: lead title -->
<!-- _paginate: false -->
<!-- _header: "" -->
<!-- _footer: "" -->

![bg right:34% contain](../static/img/logo.svg)

# LiteLLM

## 從統一模型介面到正式環境 AI Gateway

開源核心、設定、路由、負載平衡與治理實務

2026-07-15

---

## 一句話理解 LiteLLM

> **把不同 LLM 供應商與部署，收斂成一致的呼叫介面與中央治理層。**

LiteLLM 有兩種主要使用方式：

- **Python SDK**：在應用程式內直接統一模型呼叫與錯誤處理
- **AI Gateway**：集中管理驗證、模型存取、路由、預算、guardrails 與觀測性
- **共同價值**：應用程式面對穩定介面，平台團隊保留替換供應商與部署的彈性

官方目前定位為可呼叫 **100+ LLM 供應商**，並支援常見 OpenAI 相容端點。

---

## 為什麼需要一層 LLM Gateway？

直接整合多家供應商，複雜度會沿四個方向成長：

| 挑戰 | 沒有 Gateway 時 | 集中治理後 |
|---|---|---|
| 介面 | SDK、參數、錯誤格式各異 | 對應一致的 API 契約 |
| 可靠性 | 每個應用自行寫重試與切換 | 統一路由、冷卻、fallback |
| 成本 | 金鑰與帳單散落各系統 | 依 key、user、team 追蹤 |
| 治理 | 權限、限流、guardrails 重複實作 | 由平台層集中執行 |

**問題不只是「如何呼叫模型」，而是「如何穩定、安全、可稽核地營運模型」。**

---

## LiteLLM 的定位與邊界

LiteLLM 位於應用與模型供應商之間：

```text
         應用 / Agent / 開發工具
                    │
        OpenAI 相容或 LiteLLM SDK
                    ▼
           ┌─────────────────┐
           │ LiteLLM Gateway │
           └─────────────────┘
                    │
                    ├── 介面／驗證／路由／治理／觀測
                    ├── OpenAI / Azure OpenAI
                    ├── Anthropic / Google Vertex AI
                    ├── AWS Bedrock / Cohere
                    └── vLLM / Ollama / OpenAI-compatible API
```

LiteLLM **不是模型本身**，也不會消除供應商配額、資料治理或模型品質差異。

---

## 兩種導入模式：SDK 與 Gateway

| | Python SDK | AI Gateway / Proxy |
|---|---|---|
| 部署位置 | 應用程式程序內 | 獨立服務 |
| 適合情境 | 單一服務、快速整合 | 多團隊、集中治理 |
| 驗證方式 | 供應商憑證 | LiteLLM virtual key + 供應商憑證 |
| 路由 | `Router` 物件 | `config.yaml` + Router |
| 花費與預算 | 應用自行整合 | key、user、team、tag 維度 |
| 營運依賴 | Python runtime | Gateway；治理功能通常搭配 Postgres、Redis |

**起步可用 SDK；跨團隊與正式環境通常更適合 Gateway。**

---

<!-- _class: compact -->

## Gateway 請求生命週期

```text
Client
  │  Bearer virtual-key
  ▼
Authentication / model allowlist / budget / rate limit
  │
  ▼
Router：篩選健康部署 → 選擇策略 → timeout / retry
  │
  ├── success → Provider / Region / Deployment
  └── failure → cooldown → fallback
  ▼
After-call：usage、cost、logs、metrics、callbacks
```

同步請求路徑應保持精簡；花費與觀測資料則在請求完成後更新。

---

## 六個核心概念

| 概念 | 作用 |
|---|---|
| **Provider model** | 真正呼叫的模型，例如 `openai/gpt-4o` |
| **Model alias / group** | 對客戶端穩定的名稱，例如 `chat-prod` |
| **Deployment** | 同一 model group 下的一組區域、端點與憑證 |
| **Virtual key** | 控制模型存取、預算、速率與歸屬 |
| **Router** | 篩選候選部署並執行選擇、重試與 fallback |
| **Callbacks / metrics** | 將延遲、錯誤、token 與花費送至觀測系統 |

**應用只依賴 alias；平台團隊在 alias 背後調整供應商與容量。**

---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: "" -->
<!-- _footer: "" -->

# 新手上路

## 先完成單一模型呼叫，再逐步加入治理能力

---

<!-- _class: compact -->

## 新手上路一：Python SDK

安裝：

```shell
uv add litellm
```

以一致介面呼叫模型：

```python
import os
from litellm import completion
os.environ["OPENAI_API_KEY"] = "..."
response = completion(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "用三點說明 RAG"}],
)
print(response.choices[0].message.content)
```

切換供應商時，主要變更集中在 `model` 與憑證設定。

---

<!-- _class: compact -->

## 新手上路二：啟動 Gateway

安裝並啟動單一模型：

```shell
uv tool install 'litellm[proxy]'
export OPENAI_API_KEY="..."
litellm --model openai/gpt-4o
```

既有 OpenAI client 只需改 `base_url`：

```python
from openai import OpenAI
client = OpenAI(
    api_key="anything",
    base_url="http://localhost:4000",
)
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
```

---

<!-- _class: compact -->

## 最小可用的 `config.yaml`

```yaml
model_list:
  - model_name: chat-prod          # 客戶端看到的 alias
    litellm_params:
      model: openai/gpt-4o         # 真實 provider/model
      api_key: os.environ/OPENAI_API_KEY
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動與測試：

```shell
export OPENAI_API_KEY="..."
export LITELLM_MASTER_KEY="sk-change-me"
litellm --config config.yaml
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-change-me" \
  -H "Content-Type: application/json" \
  -d '{"model":"chat-prod","messages":[{"role":"user","content":"Hello"}]}'
```

---

## `config.yaml` 的四個主要區塊

| 區塊 | 典型內容 | 誰會使用 |
|---|---|---|
| `model_list` | alias、provider/model、endpoint、RPM/TPM | Router |
| `router_settings` | 策略、timeout、retry、cooldown、fallback | Router |
| `litellm_settings` | callbacks、cache、內容記錄控制 | LiteLLM runtime |
| `general_settings` | master key、database、Proxy 行為 | Gateway |

設定原則：

- 憑證以 `os.environ/NAME` 參照，不寫死於 Git
- 應用只使用穩定 alias，不直接綁定 provider deployment
- 從少量全域預設開始，再針對模型或團隊覆寫

---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: "" -->
<!-- _footer: "" -->

# 路由、可靠性與負載平衡

## 先決定候選集合，再選 deployment，最後處理失敗

---

<!-- _class: compact code-dense -->

## 進階設定：可靠性政策

```yaml
router_settings:
  routing_strategy: simple-shuffle
  timeout: 30
  num_retries: 2
  enable_pre_call_checks: true
  allowed_fails: 3
  cooldown_time: 30
  retry_policy:
    RateLimitErrorRetries: 2
    TimeoutErrorRetries: 2
    InternalServerErrorRetries: 1
  fallbacks:
    - chat-prod: [chat-backup]
  context_window_fallbacks:
    - chat-prod: [chat-long-context]
```

**重試處理短暫錯誤；cooldown 隔離不健康部署；fallback 切換 model group。**

---

## 路由的決策順序

1. **驗證與授權**：virtual key、team、model allowlist、預算與速率
2. **候選篩選**：model group、tags、健康狀態、RPM/TPM、context window
3. **選擇 deployment**：依 `simple-shuffle` 或其他 routing strategy
4. **同群組重試**：在相同 alias 的其他 deployment 中重選
5. **跨群組 fallback**：切換到備援模型或供應商
6. **事後更新**：usage、cost、cooldown 狀態、logs、metrics

![w:760](../img/router_architecture.png)

---

<!-- _class: compact -->

## 負載平衡策略怎麼選？

| 策略 | 選擇依據 | 適用情境 | 代價／注意事項 |
|---|---|---|---|
| **simple-shuffle** | RPM、TPM、weight；缺省時隨機 | 一般正式環境 | 官方預設與建議 |
| `least-busy` | 進行中請求數 | 高併發、長請求 | 需維護即時狀態 |
| `latency-based-routing` | 歷史回應時間 | 延遲敏感服務 | 需避免流量集中最快端點 |
| `usage-based-routing` | 當分鐘 TPM/RPM 使用量 | 需要精細配額分散 | Redis 操作增加延遲；官方不建議高流量預設採用 |
| `cost-based-routing` | 模型成本 | 成本優先工作負載 | 必須先定義品質與能力門檻 |

**預設從 `simple-shuffle` 開始；只有明確瓶頸與量測證據時才換策略。**

---

<!-- _class: compact code-dense -->

## 負載平衡設定範例

同一個 `model_name` 建立多個 deployment：

```yaml
model_list:
  - model_name: chat-prod
    litellm_params:
      model: azure/chat-east
      api_base: os.environ/AZURE_EAST_API_BASE
      rpm: 900
      weight: 3
  - model_name: chat-prod
    litellm_params:
      model: azure/chat-west
      api_base: os.environ/AZURE_WEST_API_BASE
      rpm: 300
      weight: 1
router_settings:
  routing_strategy: simple-shuffle
```

---

## 水平擴充：多個 Gateway instance

```text
                   ┌──────── LiteLLM Pod A ────────┐
Clients ── L7 LB ──┼──────── LiteLLM Pod B ────────┼── LLM Providers
                   └──────── LiteLLM Pod N ────────┘
                              │             │
                         Redis shared   Postgres
                         routing state  keys / spend / UI
```

- **Redis**：跨 instance 共用 RPM/TPM、cooldown、健康與部分 cache 狀態
- **Postgres**：virtual keys、使用者／團隊、模型登錄、預算與花費資料
- **Load balancer**：只判斷 Gateway pod 健康；模型 deployment 選擇交給 LiteLLM Router
- Kubernetes 應設定 `/health/liveliness` 與 `/health/readiness` probes

**多 pod 但沒有 shared state，可能得到不一致的配額與路由判斷。**

---

## 故障處理不是單一開關

| 機制 | 解決的問題 | 設計重點 |
|---|---|---|
| Timeout | Provider 停滯或回應過慢 | 配合整體 SLO，不使用過長預設值 |
| Retry | 429、timeout、5xx 等短暫錯誤 | 有界次數、保留整體 deadline |
| Cooldown | 持續失敗 deployment | 依錯誤類型設定門檻與時間 |
| Health routing | 已知不健康 deployment | 區分短暫 429 與實際故障 |
| Fallback | 群組或供應商不可用 | 明確定義品質、成本與資料區域差異 |
| Deployment order | 主站優先、備站次之 | 低 `order` 值優先，失敗後升級 |

**可靠性測試必須涵蓋 429、timeout、5xx、內容政策與長 context。**

---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: "" -->
<!-- _footer: "" -->

# 正式環境的治理與營運

## 將模型能力包裝成可控、可觀測的內部服務

---

## 治理模型：從團隊到每一次請求

```text
Team：預算、模型清單、guardrails、速率上限
└── Virtual Key：實際呼叫憑證與使用歸屬
    └── Request：model、tag、end_user、metadata
```

Virtual key 可承載：

- 模型 allowlist、alias 與到期日
- RPM、TPM、parallel request 限制
- `max_budget` 與 budget duration
- user、team、project、tag 等歸屬資訊
- team/key 層級 callbacks 與 guardrails

Gateway 的治理功能通常需要 **Postgres** 保存權限與花費狀態。

---

<!-- _class: compact -->

## 正式環境最佳實務：建議基準線

| 面向 | 建議 |
|---|---|
| 憑證 | Provider keys、master key、salt key 放入 Secret Manager；設定檔只引用環境變數 |
| 身分 | 應用使用短權限 virtual key；管理者才可使用 master key；Admin UI 不公開暴露 |
| 資料層 | 正式環境使用可備份、可監控的 Postgres；多 pod 使用 Redis 共用路由狀態 |
| 可用性 | 至少兩個 Gateway replicas、L7 LB、readiness/liveness、跨區 provider deployments |
| 供應鏈 | 固定映像版本與設定 revision；在 staging 驗證後逐步發布 |
| 治理 | 預設 model allowlist、budget、RPM/TPM、guardrails；例外需要可追溯核准 |
| 追蹤 | 保留 key/team/model、latency、usage、spend、fallback 與 policy decision |

以上是部署建議；實際拓樸仍需依 SLO、資料區域、法規與成本限制設計。

---

## 觀測性、安全與 guardrails

至少建立四類訊號：

- **可靠性**：成功率、429／5xx、timeout、retry、fallback、cooldown
- **效能**：端到端 latency、TTFT、stream idle、各 deployment 併發量
- **成本**：tokens、cache hit、key/team/tag spend、預算剩餘
- **安全**：驗證失敗、模型拒絕、guardrail 命中、設定與權限變更

LiteLLM 可透過 callbacks、OpenTelemetry、Prometheus 與多種觀測平台輸出資料。

> 記錄 prompt／response 前先決定資料分類、遮罩、保存期限與存取權限；不應因除錯方便而預設保存敏感內容。

---

## 建議導入路線

| 階段 | 目標 | 驗收條件 |
|---|---|---|
| 1. 介面統一 | 單一 alias、單一 provider | 應用只依賴 Gateway URL 與 alias |
| 2. 可靠性 | 第二 deployment、timeout、retry、fallback | 故障演練符合 SLO |
| 3. 治理 | virtual keys、team、budget、allowlist | 花費與權限可追蹤、可阻擋 |
| 4. 規模化 | 多 pod、Redis、Postgres、metrics | 壓測、HA、備份還原完成 |
| 5. 最佳化 | routing strategy、cache、成本政策 | 有量測基準與回滾方案 |

**先建立穩定契約與觀測，再進行智慧路由與成本最佳化。**

---

## 重要取捨與適用邊界

### 技術取捨

- Gateway 是額外網路 hop，也是新的關鍵依賴；需要容量規劃與 HA
- 統一介面不代表所有模型能力完全等價；provider-specific 參數仍需測試
- 重試與 fallback 可能增加成本、延遲，或改變資料處理區域

### 本簡報範圍

- 聚焦 Python SDK、Gateway、`config.yaml`、virtual keys、路由、負載平衡與觀測性
- 正式環境建議屬於通用架構實務，仍須依組織的 SLO、法規與成本條件驗證
- 功能與設定應依正式環境採用版本的官方文件重新確認

**導入決策應以實際壓測、故障演練與資料治理要求為準。**

---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: "" -->
<!-- _footer: "" -->

# 核心結論

- **介面層**：以 OpenAI 相容 API 或 Python SDK 隔離供應商差異
- **可靠性層**：Router 組合 deployment、策略、retry、cooldown 與 fallback
- **治理層**：以 virtual key、team、budget、rate limit、guardrail 管理使用
- **營運層**：正式環境以多 pod、Redis、Postgres、健康檢查與可觀測性支撐
- **導入策略**：先簡單、可量測，再逐步增加路由與治理控制

---

<!-- _class: references -->

## 參考資料一：產品與快速上手

查閱日期：2026-07-15

- [LiteLLM 官方文件首頁](https://docs.litellm.ai/)
- [LiteLLM GitHub 主 repo](https://github.com/BerriAI/litellm)
- [Python SDK 與 Gateway 快速上手](https://docs.litellm.ai/)
- [LiteLLM Proxy CLI Quick Start](https://docs.litellm.ai/docs/proxy/quick_start)
- [Config settings reference](https://docs.litellm.ai/docs/proxy/config_settings)
- [Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys)

本簡報中的模型名稱為設定範例；正式採用前應依供應商當下可用模型與區域重新驗證。

---

<!-- _class: references -->

## 參考資料二：路由與營運

查閱日期：2026-07-15

- [Router 與 Routing Strategies](https://docs.litellm.ai/docs/routing)
- [Proxy Load Balancing](https://docs.litellm.ai/docs/proxy/load_balancing)
- [Prometheus metrics](https://docs.litellm.ai/docs/proxy/prometheus)
- [Guardrails Quick Start](https://docs.litellm.ai/docs/proxy/guardrails/quick_start)
- [Caching](https://docs.litellm.ai/docs/proxy/caching)

圖像資產來自本 LiteLLM Docs repo：`static/img/logo.svg`、`img/router_architecture.png`。
