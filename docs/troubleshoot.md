# 問題回報 {#issue-reporting}

回報問題時，請盡可能提供以下資訊。若無法提供全部內容也沒關係——尤其是在觸發原因可能未知的正式環境中。分享大部分資訊將有助於我們更有效地協助您。

## 1. LiteLLM 設定文件 {#1-litellm-configuration-file}

您的 `config.yaml` 文件（請遮蔽敏感資訊，例如 API 金鑰）。如果設定中未包含，請提供 worker 數量。

## 2. 初始化命令 {#2-initialization-command}

用來啟動 LiteLLM 的命令（例如 `litellm --config config.yaml --num_workers 8 --detailed_debug`）。

## 3. LiteLLM 版本 {#3-litellm-version}

- 目前版本
- 問題首次出現時的版本（若不同）
- 若曾升級，版本從 → 到的變更

## 4. 環境變數 {#4-environment-variables}

未包含在設定中的非敏感環境變數（例如 `NUM_WORKERS`、`LITELLM_LOG`、`LITELLM_MODE`）。請勿包含密碼或 API 金鑰。

## 5. 伺服器規格 {#5-server-specifications}

CPU 核心數、RAM、作業系統、執行個體/複本數等。

## 6. 資料庫與 Redis 使用情況 {#6-database-and-redis-usage}

- **資料庫：** 是否使用資料庫？（已設定 `DATABASE_URL`）、資料庫類型與版本
- **Redis：** 是否使用 Redis？Redis 版本、設定類型（Standalone/Cluster/Sentinel）。

## 7. 端點 {#7-endpoints}

您正在使用且遇到問題的端點（例如 `/chat/completions`、`/embeddings`）。

## 8. 請求範例 {#8-request-example}

造成問題的實際請求範例，包括預期回應與實際回應，以及任何錯誤訊息。

## 9. 錯誤記錄、堆疊追蹤與指標 {#9-error-logs-stack-traces-and-metrics}

完整的錯誤記錄、堆疊追蹤，以及任何可能有助於診斷問題的服務指標圖像（CPU、記憶體、請求速率等）。

---

## 支援管道 {#support-channels}

[預約示範 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)

[社群 Discord 💭](https://discord.gg/wuPM9dRgDw)
[社群 Slack 💭](https://www.litellm.ai/support)

我們的電子郵件 ✉️ ishaan@berri.ai / krrish@berri.ai

[![在 WhatsApp 上聊天](https://img.shields.io/static/v1?label=Chat%20on&message=WhatsApp&color=success&logo=WhatsApp&style=flat-square)](https://wa.link/huol9n) [![在 Discord 上聊天](https://img.shields.io/static/v1?label=Chat%20on&message=Discord&color=blue&logo=Discord&style=flat-square)](https://discord.gg/wuPM9dRgDw)
