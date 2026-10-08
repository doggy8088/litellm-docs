---
title: Shared Responsibility Model
description: 當您自行代管閘道時，LiteLLM 負責什麼、您負責什麼，以及如何判斷問題屬於哪一方。
---

# Shared Responsibility Model {#shared-responsibility-model}

當您自行代管 LiteLLM 時，您負責執行軟體，而我們負責建置軟體。這個分工決定由誰來除錯什麼。在此，我們說明哪些問題是我們的責任、哪些是您的責任，好讓報告能送到正確的團隊。

簡單來說，我們負責本網站文件中所描述的產品行為，而您負責其執行所在的環境，以及您新增到其中的任何程式碼。

| 領域                                                                                                                      | 負責方  |
| ------------------------------------------------------------------------------------------------------------------------- | ------- |
| 文件化功能與端點的正確性                                                                                                  | LiteLLM |
| 文件化功能集中的記憶體洩漏、卡住與穩定性問題                                                                              | LiteLLM |
| 文件化的提供者轉譯、成本追蹤與路由行為                                                                                    | LiteLLM |
| 安全修補程式，以及官方 Docker 映像與 Helm chart                                                                            | LiteLLM |
| 您的執行個體可用性與其底層基礎架構                                                                                        | 您      |
| 自訂回呼、自訂防護欄、自訂驗證，以及您注入的其他程式碼                                                                    | 您      |
| 因以不同於我們建議路徑的方式部署所造成的基礎架構問題（您自己的 Dockerfile、chart 或 base image）                        | 您      |
| 在 fork 上由您自己的修補所引入、且上游不存在的錯誤                                                                          | 您      |
| 您的提供者帳戶、配額，以及提供者端中斷                                                                                     | 您      |

## 我們負責什麼 {#what-we-are-responsible-for}

我們負責產品能正常運作。本站文件中所記載的每個功能都應如文件所述般運作。若不是如此，那就是我們的錯誤，您應該 [提出 issue](https://github.com/BerriAI/litellm/issues) 或在您的企業支援管道中回報。

這項責任涵蓋的是穩定性，不只是正確性。文件化功能集中的記憶體成長、檔案描述元或連線洩漏、死結、卡住，以及吞吐量退化，都屬於我們負責診斷與修正的範圍。這也涵蓋您所互動的介面：公開 HTTP 表面受 [API 穩定性政策](./api_stability_policy.md) 規範，版本編號以及 patch 或 minor 版本升級代表什麼，已記載於 [發布週期](./proxy/release_cycle.md)，而依 [遷移政策](./migration_policy.md) 移至 Enterprise 之後的 beta 功能。我們維護 [正式版部署](./proxy/deploy.md) 中所描述的官方 Docker 映像、Helm chart 與 Terraform 模組，並為 [支援版本範圍](./enterprise.md#version-support) 提供安全修補程式。

如果您使用的是已終止支援的版本線，我們建議先升級，確保已套用最新的錯誤修正與安全修補程式。

## 您負責什麼 {#what-you-are-responsible-for}

除應用程式本身的穩定性缺陷外，您負責維持您的執行個體正常運作。這表示容量與規模調整、重新啟動與部署、健康檢查與自動擴縮，以及 Postgres、Redis、您的網路與您的調度器的健康狀態。[正式版部署最佳實務](./proxy/prod.md)、[資料庫規模調整](./proxy/db_sizing.md) 與 [Redis 規模調整](./proxy/redis_sizing.md) 說明了我們建議的設定與規模。[健康狀態端點](./proxy/health.md) 則是供您的探測使用。

您也要負責您引入閘道的任何自訂程式碼。[自訂回呼](./observability/custom_callback.md)、[自訂防護欄](./proxy/guardrails/custom_guardrail.md)、[自訂驗證](./proxy/custom_auth.md)、[自訂 SSO](./proxy/custom_sso.md)、[hooks](./proxy/call_hooks.md) 與 [plugins](./proxy/plugins.md) 都是在 proxy 程序中執行，因此該程式碼中的阻塞呼叫、無上限快取或洩漏的 client，即使 proxy 本身行為正確，也可能表現為 proxy 延遲、記憶體成長或卡住。您的 handler 邏輯，以及其效能與記憶體行為，皆由您負責。同樣地，任何包在閘道外層的東西也適用，包括 sidecar、位於前方的 proxy，以及會修改請求的新增 middleware。

使用 fork 也是同樣道理。若某個錯誤在未修改的上游相同版本中也可重現，那就明確屬於我們的除錯與修正責任。若是您的修補所引入的錯誤，則由您負責；當您 rebase 到新版時，維持那些修補可正常運作也同樣由您負責。如果您因為上游缺少某功能而先行自行修補，請建立 issue 或將修補以 pull request 送出；若那是通用的改進，我們很樂意將其加入上游。

另外，如果您的部署策略不是依照我們建議的路徑，那條路徑也由您自行維護。許多團隊會自行建置映像、撰寫自己的 chart、變更 base image 或 Python 版本、鎖定自己的相依套件集合，或自行執行 process manager 與 worker 數量。這屬於對軟體的支援性使用。但這也表示，建置失敗、缺少系統函式庫、相依套件版本不匹配、因容器記憶體限制而被 OOMKill、worker 數量設定錯誤等，都是您要負責的。請參閱：

- [正式版部署](./proxy/deploy.md)
- [Docker 快速開始](./proxy/docker_quick_start.md)
- [伺服器調校](./proxy/server_tuning.md)

## 向我們提交 issue {#filing-an-issue-with-us}

請包含：

1. LiteLLM 版本
2. 您的部署方式
3. 已遮蔽的設定
4. 精確的請求
5. 啟用 [詳細除錯記錄](./proxy/debugging.md) 後的完整錯誤或 traceback
6. 對於穩定性報告，我們建議一併提供隨時間變化的記憶體或延遲曲線、請求速率，以及 worker 與容器限制
7. 對於記憶體與延遲問題，我們建議一併提供 [Pyroscope profiling](./proxy/pyroscope_profiling.md) 結果

請將錯誤與功能請求以 [GitHub issues](https://github.com/BerriAI/litellm/issues) 提出。企業客戶也可以使用其專屬支援管道。關於服務時段與 SLA 選項，請參閱 [專業支援](./enterprise.md#professional-support)。
