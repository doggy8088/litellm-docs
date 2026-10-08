---
slug: september-townhall-updates
title: "9 月 Townhall 更新：583 個錯誤修復、Rust 上的 OCR，以及 83.5% 覆蓋率"
date: 2026-09-24T12:00:00
authors:
  - ishaan
  - yujonglee
  - oliver
  - mateo
description: "9 月 LiteLLM town hall 回顧：安全性與穩定性更新、預設在 Rust 上執行的 OCR、測試覆蓋率超過 80% 目標，以及 Fusion 和 liteagents 的新發布。"
tags: [townhall, security, reliability, product]
hide_table_of_contents: false
---

感謝所有參加我們 9 月 town hall 的朋友。我們介紹了產品中的安全性更新、穩定性更新與新功能，包括預設在 Rust 上執行的 OCR，以及超過我們 8 月設定的 80% 目標的測試覆蓋率。

{/* truncate */}

## 安全性 {#security}

本月我們推出了 52 項安全性修復，按類別如下：

| 類別                                         | 修復數 |
| -------------------------------------------- | ----- |
| 認證 / 秘密 / PII 強化                        | 27    |
| 一般強化（驗證、失敗即關閉）                  | 12    |
| 額度 / 預算 / 速率限制強化                    | 10    |
| 存取控制 / authz 強化                         | 3     |

安全性方面的主要工作集中在驗證：

- 可設定的密碼政策
- 封鎖在已知外洩事件中出現的密碼
- 強制 SSO 登入
- 可選擇停用使用環境變數中保存的憑證進行的登入

**主金鑰。** Wiz 發現他們掃描的 LiteLLM 實例中，有 10 分之 1 是以空白或預設的主金鑰執行。LiteLLM 現在在主金鑰未設定或仍為預設值時會拒絕啟動，因此依賴它的部署在升級時將無法開機。

**新的揭露做法，以及更多 CVE。**

- 對於任何未經驗證的攻擊者可到達的內容，我們會在私有分支中建立修補，並在發佈、回溯修補與揭露的同一時間公開。
- 我們產生的 CVE 比以前更多了，大多數屬於低風險與中風險。
- 這項增加來自發佈政策的變更。我們的安全態勢並未改變。
- 訂閱我們的 [GitHub security advisories](https://github.com/BerriAI/litellm/security/advisories)，以便在它們發布時收到通知。

下個月我們會參加 Patch the Planet，這是 OpenAI 與 Trail of Bits 的一項倡議，安全工程師會專注於一個專案工作一週。

## 穩定性 {#stability}

9 月我們推出了 **583 個錯誤修復**。

| 領域                          | 修復數 |
| ----------------------------- | ----- |
| Proxy Core 與穩定性          | 228   |
| 提供者與模型轉換              | 94    |
| 其他 / SDK                    | 88    |
| UI + Auth / SSO               | 57    |
| 成本、預算與可觀測性          | 43    |
| MCP Gateway                   | 39    |
| 串流 / 即時 API               | 34    |

最大宗的工作集中在 proxy core：擴充能力、穩定性，以及在相依元件失敗時決定會發生什麼事的 circuit breaker。如果 Redis 掛掉，閘道不應該一起掛掉。

- **覆蓋率。** 我們承諾在 9 月底前達到 80%，最後完成 **83.5%**；這是以測試套件涵蓋的端點與使用者流程所占比例來衡量，而不是以程式碼行數。
- **使用者流程。** 從 402 提升到 521 個已涵蓋，10 月目標是 600 個。
- **人力配置。** 現在有一位工程師專門處理成本與預算差異，因此您一旦發現就請回報。另有兩位工程師全職投入開源，目標是在年底前把 open issues 降到 100 個以下。

## 產品 {#product}

本月共有 **221 個功能性提交**。

### OCR 預設在 Rust 上執行 {#ocr-runs-on-rust-by-default}

從 `v1.102.0` 開始，OCR 預設在 Rust 上執行。`LITELLM_RUST=0` 仍然會回退到 Python。SDK 與 gateway 使用者在這次遷移中不需要做任何變更。

![OCR 基準測試：在每秒 30 個提供請求、8 MiB 上傳的情況下，顯示 Rust 能完成每一次到達，而 Python 遠遠落後，且 Rust 的 p95 延遲僅為數十毫秒，相比之下 Python 則是數秒](./rust-ocr-benchmark.png)

- 在單顆 CPU 上，中位吞吐量在 1 MiB 時從 143.6 提升到 211.7 RPS，在 8 MiB 時從 21.6 提升到 36.2 RPS。
- 這些是 proxy 開銷數據，以本機 mock provider 為基準進行測量，瓶頸在 proxy CPU。[完整方法](https://docs.litellm.ai/blog/litellm-rust-ocr)。
- `/messages` 是下一個，將以 opt-in 方式發布。
- 到 12 月 1 日前，我們希望 chat completions、messages 和 responses 都完成遷移，並可作為純 Rust 的 Axum server 部署。
- 進度公開於 [docs.litellm.ai/rust-migration](https://docs.litellm.ai/rust-migration)，目前為 5%。

### 新模型 {#new-models}

過去一個月，我們在幾乎每一家主要提供者都新增了許多新模型。

![自 2026 年 8 月 25 日至 9 月 24 日的 30 天新 AI 整合，列出 OpenAI、Anthropic、Google Gemini、xAI、Meta、Alibaba Qwen、Z.ai、Moonshot AI、Fireworks AI、Together AI、Eden AI 和 AIHubMix 之間部分已合併的模型新增項目](./new-models.png)

亮點包括 OpenAI 的 GPT-6 系列、Claude Opus 5.5 與 Claude Fable 5.1、Gemini 3.8 Flash 和 Grok 4.7，以及作為新提供者的 Eden AI。

### Fusion {#fusion}

`litellm/fusion-1` 會將您的請求平行送往一組可設定的模型，讓 judge 比較成功的回應，然後由該 judge 綜合成一個答案。它可與 Chat Completions、Anthropic Messages 和 Responses 搭配使用。

![LiteLLM fusion 模型卡：一個請求平行展開到一組模型，包括 openai/gpt-6-astra、anthropic/claude-opus-5 和 gemini/gemini-3.8-flash，最後由 judge 回傳單一回應](./fusion-1.png)

這很昂貴，而且成本與延遲都會隨著組內模型數量與您選擇的模型而增加。請將它保留給品質比成本更重要的困難問題。設定方式請參見 [fusion 文件](https://docs.litellm.ai/docs/fusion)。

### liteagents SDK {#liteagents-sdk}

liteagents 是一個 beta SDK，讓您可以在不同 agent harness 之間切換，而不必重寫您的 agent。您可以在 `ProfileOptions` 區塊中選擇 harness，不論是 Claude Agent SDK、Deep Agents 或 Pydantic AI，然後透過單一用戶端對其進行查詢。

![liteagents SDK 程式碼範例：以 ProfileOptions 區塊設定 LiteAgentClient，選擇 deepagents harness 和一個模型，然後查詢回應](./liteagents-sdk.png)

閱讀更多關於 [liteagents SDK](https://www.litellm.ai/liteagents) 的內容。

### 其他已發布功能 {#also-shipped}

- **自架。** 容器內的 PgBouncer 會在各個 worker 之間共享資料庫連線，spend writes 可移到請求路徑外的 sidecar，且 Helm 與 Terraform 現在可依每個 pod 的請求數與每秒 token 數進行 [自動擴縮](https://docs.litellm.ai/docs/proxy/deploy#scale-on-requests-and-tokens-per-pod)，而不只限於 CPU。
- **MCP Gateway。** `/mcp` 路由現在會對工具執行 [語意搜尋](https://docs.litellm.ai/docs/mcp_tool_search) 並只回傳與查詢相符的項目，因此我們不再需要為了容納內容而裁剪過長的上游目錄。[工具權限](https://docs.litellm.ai/docs/mcp_control) 會在列出與呼叫時強制執行，且 session token 使用 RS256 簽章，因此外部 gateway 可以驗證 token 來自 LiteLLM。
- **團隊管理員權限。** 預算、TPM、RPM 與核准的模型清單仍由 proxy 管理員保管，而團隊管理員則可自助管理金鑰與模型。即將推出。

## 我們正在招募 {#were-hiring}

我們正在核心閘道各處招募人才；產品回饋請聯絡 [product@berri.ai](mailto:product@berri.ai)，或透過 [recruiting@berri.ai](mailto:recruiting@berri.ai) 與我們聯繫。

感謝您使用 LiteLLM。**LiteLLM 團隊**
