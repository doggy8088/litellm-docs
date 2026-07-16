---
title: 版本說明
sidebar_label: 總覽
slug: /
---

# 版本說明 {#release-notes}

LiteLLM 定期推出新版本，包含新的提供者支援、效能改進與企業功能。請使用側邊欄瀏覽所有版本。

## 最新版本 {#latest-release}

### [v1.92.0 — Claude Sonnet 5、正式版 MCP OAuth 與新提供者](/release_notes/v1.92.0/v1-92-0) {#v1920--claude-sonnet-5-production-mcp-oauth--new-providersrelease_notesv1920v1-92-0}

_2026 年 7 月 11 日_

在 Anthropic、Amazon Bedrock（包含 regional inference profiles）、Vertex AI 與 Azure AI 上提供一流的 Claude Sonnet 5 支援，具備 100 萬 token 的上下文視窗、推理、電腦使用與 PDF 輸入；在 v2 resolver 上提供可正式上線的 MCP OAuth 2.0 On-Behalf-Of arm，具備 RFC 9728 到 RFC 8414 端點探索、持久化的 Dynamic Client Registration、每個伺服器的 outbound concurrency 限制，以及用於大型工具目錄的 `mcp_tool_search` virtual tool；新增 Tencent（DeepSeek V4 flash 與 pro）和 Google Distributed Cloud Gemini 兩個提供者，用於內部部署與主權部署；加強 key、user 與 team 端點的存取控制，並以 AES-256-GCM 實作靜態憑證加密；以及透過 Redis 叢集重新連線與讀取副本啟動韌性，加快 spend 與 budget 的 hot path。

---

## 最近版本 {#recent-releases}

| 版本                                | 日期         | 重點                                                     |
| ----------------------------------- | ------------ | -------------------------------------------------------- |
| [v1.92.0](/release_notes/v1.92.0/v1-92-0)   | 2026 年 7 月 11 日 | Claude Sonnet 5、正式版 MCP OAuth（On-Behalf-Of）v2、Tencent 與 GDC 提供者 |
| [v1.91.0](/release_notes/v1.91.0/v1-91-0)   | 2026 年 7 月 4 日  | MCP OAuth 2.0 v2 resolver、Rust OCR 閘道、即時效能 |
| [v1.90.0](/release_notes/v1.90.0/v1-90-0)   | 2026 年 6 月 26 日 | 六個新提供者、OpenTelemetry v2 指標一致性、串流可靠性整體檢查 |
| [v1.89.0](/release_notes/v1.89.0/v1-89-0)   | 2026 年 6 月 10 日 | Claude Fable 5、A2A 代理程式提供者、MCP per-server controls |
| [v1.88.0](/release_notes/v1.88.0/v1-88-0)   | 2026 年 6 月 4 日  | Claude Opus 4.8、MCP access-group authorization、typed OpenTelemetry |
| [v1.87.0](/release_notes/v1.87.0/v1-87-0)   | 2026 年 5 月 23 日 | OCI Generative AI 提供者、Gemini 3.5 Flash day-0、OAuth 伺服器的 MCP UI |
| [v1.86.0](/release_notes/v1.86.0/v1-86-0)   | 2026 年 5 月 16 日 | Weighted-Routing Failover、原生 Anthropic web-search citations、OTel 標準 server spans |
| [v1.85.1](/release_notes/v1.85.1/v1-85-1)   | 2026 年 5 月 20 日 | Patch — Gemini 3.5 Flash day-0 + 跨 pod spend 修正       |
| [v1.84.1](/release_notes/v1.84.1/v1-84-1)   | 2026 年 5 月 20 日 | Patch — Gemini 3.5 Flash day-0 + 跨 pod spend 修正       |
| [v1.85.0](/release_notes/v1.85.0/v1-85-0)   | 2026 年 5 月 16 日 | 即時 GA、MCP Gateway 擴充與強化多租戶                     |
| [v1.84.0](/release_notes/v1.84.0/v1-84-0)   | 2026 年 5 月 14 日 | 可靠性強化 + 多 pod budget 準確性                         |
| [v1.83.14](/release_notes/v1.83.14/v1-83-14) | 2026 年 4 月 27 日 | GPT-5.5、Prompt Compression 與 Memory API               |
| [v1.83.10](/release_notes/v1.83.10/v1-83-10) | 2026 年 4 月 27 日 | Claude Opus 4.7、Prompt Compression 與 Multi-Window Budgets |
| [v1.82.3](/release_notes/v1.82.3/v1-82-3)   | 2026 年 3 月 16 日 | Nebius AI、gpt-5.4、Gemini 3.x、FLUX Kontext 與 116 個新模型 |
| [v1.82.0](/release_notes/v1.82.0/v1-82-0)   | 2026 年 2 月 28 日 | 即時防護欄、專案管理與 10+ 效能最佳化                    |
| [v1.81.14](/release_notes/v1.81.14/v1-81-14) | 2026 年 2 月 21 日 | 新的閘道層級防護欄與法規遵循體驗沙盒                   |
| [v1.81.12](/release_notes/v1.81.12/v1-81-12) | 2026 年 2 月 14 日 | 防護欄政策範本與動作建構器                               |
| [v1.81.9](/release_notes/v1.81.9/v1-81-9)   | 2026 年 2 月 7 日  | 控制哪些 MCP Servers 會暴露在網際網路上                |
| [v1.81.6](/release_notes/v1.81.6/v1-81-6)   | 2026 年 1 月 31 日 | Logs v2 搭配工具呼叫追蹤                                 |
| [v1.81.3](/release_notes/v1.81.3/v1-81-3)   | 2026 年 1 月 26 日 | 效能 — CPU 使用率降低 25%                                |
| [v1.81.0](/release_notes/v1.81.0/v1-81-0)          | 2026 年 1 月 18 日 | Claude Code — 跨所有提供者的 Web Search              |
| [v1.80.15](/release_notes/v1.80.15/v1-80-15)       | 2026 年 1 月 10 日 | Manus API 支援                                          |
| [v1.80.8](/release_notes/v1.80.8-stable/v1-80-8)   | 2025 年 12 月 6 日  | 介紹 A2A Agent Gateway                              |
| [v1.80.5](/release_notes/v1.80.5-stable/v1-80-5)   | 2025 年 11 月 22 日 | Gemini 3.0 支援                                         |
| [v1.80.0](/release_notes/v1.80.0-stable/v1-80-0)   | 2025 年 11 月 15 日 | 介紹 Agent Hub：註冊、發佈與分享 Agents |
| [v1.79.3](/release_notes/v1.79.3-stable/v1-79-3)   | 2025 年 11 月 8 日  | AI Gateway 內建防護欄                          |
| [v1.79.0](/release_notes/v1.79.0-stable/v1-79-0)   | 2025 年 10 月 26 日 | Search APIs                                                |
| [v1.78.5](/release_notes/v1.78.5-stable/v1-78-5)   | 2025 年 10 月 18 日 | 原生 OCR 支援                                         |
| [v1.78.0](/release_notes/v1.78.0-stable/v1-78-0)   | 2025 年 10 月 11 日 | MCP Gateway：依團隊、Key 控制工具存取              |
| [v1.77.7](/release_notes/v1.77.7-stable/v1-77-7)   | 2025 年 10 月 4 日  | 中位延遲降低 2.9 倍                                  |
| [v1.77.5](/release_notes/v1.77.5-stable/v1-77-5)   | 2025 年 9 月 29 日 | MCP OAuth 2.0 支援                                      |
| [v1.77.3](/release_notes/v1.77.3-stable/v1-77-3)   | 2025 年 9 月 21 日 | 以優先順序為基礎的速率限制                               |

---

## 持續更新 {#stay-updated}

- **GitHub**：關注 [BerriAI/litellm](https://github.com/BerriAI/litellm) repository 以接收版本通知
- **Discord**：加入我們的 [community](https://discord.com/invite/wuPM9dRgDw) 以獲得公告
- **Twitter**：追蹤 [@LiteLLM](https://twitter.com/LiteLLM)

請使用側邊欄瀏覽完整的版本歷史。
