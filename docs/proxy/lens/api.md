---
title: "API 參考"
description: "擷取並讀取代理程式追蹤、啟動調查，並擷取 Lens 發現結果。"
slug: "/proxy/lens/api"
---

# API 參考 {#api-reference}

## 代理程式追蹤 API {#agent-tracing-api}

所有四個端點都需要 proxy 驗證。請在 `Authorization: Bearer <key>` 標頭中傳送 proxy 金鑰。

| 端點 | 用途 |
| --- | --- |
| `POST /v1/traces` | 將 OTLP/HTTP 追蹤以 protobuf（`application/x-protobuf`）或 JSON（`application/json`）擷取。支援使用 `Content-Encoding: gzip` 的 gzip。 |
| `GET /v1/traces` | 列出追蹤摘要。選用的 `start_ms` 和 `end_ms` 為 Unix 毫秒。預設視窗為最近 24 小時。 |
| `GET /v1/traces/{trace_id}` | 讀取該追蹤的 `summary`、`agents`，以及 `spans`。接受選用的 `trace_ref`。 |
| `GET /v1/traces/{trace_id}/spans/{span_id}` | 讀取某個 span 的 `input`、`output`，以及 `attributes`。接受選用的 `trace_ref`。 |

列表回應包含 `data` 和 `next_cursor`，預設每頁 50 筆摘要。將 `next_cursor` 以 `cursor` 傳回即可讀取下一頁。讀取追蹤或其 spans 時，請使用摘要的 `trace_ref`。

```bash
curl -H "Authorization: Bearer <key>" \
  "https://<your-litellm-proxy>/v1/traces"
```

proxy 管理員與 proxy 管理員檢視者可以讀取每一筆追蹤。唯讀 proxy 管理員不能擷取追蹤。其他所有使用者（包括 SCIM 佈建的使用者）只會讀取以自己的金鑰送出的追蹤，以及每個與之共享的團隊的追蹤，如 [誰可以看見哪些追蹤](#trace-access) 所述。屬於任何使用者都不擁有的金鑰，例如團隊服務帳號金鑰，無法讀取追蹤，且會收到 403。

### 誰可以看見哪些追蹤 {#trace-access}

團隊會透過 `/spend/logs` 成員權限與其成員共享追蹤。團隊管理員一律可看見該團隊的追蹤，而一般成員只有在團隊的 `team_member_permissions` 包含 `/spend/logs` 後才看得到。可從管理介面（Teams，開啟團隊，Member Permissions 分頁）授予，或透過 API：

```bash
curl -X POST "https://<your-litellm-proxy>/team/permissions_update" \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "<team-id>", "team_member_permissions": ["/spend/logs"]}'
```

若要一次授予所有現有團隊：

```bash
curl -X POST "https://<your-litellm-proxy>/team/permissions_bulk_update" \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["/spend/logs"], "apply_to_all_teams": true}'
```

若要讓每個新團隊都共享其追蹤（包括 [SCIM](../identity_provisioning.md) 從身分識別提供者群組建立的團隊），請在 [`default_team_params`](../self_serve.md#set-default-params-for-new-teams) 中設定。接著，身分識別提供者中的群組成員資格會決定誰可以看見哪些追蹤，而不需要逐一對每個團隊操作：

```yaml
litellm_settings:
  default_team_params:
    team_member_permissions: ["/spend/logs"]
```

之後對群組的 SCIM 更新會保留該團隊的權限。相同的權限也允許成員檢視該團隊的支出記錄。`/lens` 下的調查與發現結果仍只限於 proxy 管理員。

## Lens API {#use-the-api}

在您的 LiteLLM proxy 上啟動調查並讀取發現結果。請在 `Authorization: Bearer <key>` 標頭中傳送 proxy 管理員金鑰。

| 端點 | 用途 |
| --- | --- |
| `GET /lens` | 列出 `lenses` 底下的調查，以及 `workers` 和 `tracing_enabled`。 |
| `POST /lens` | 建立調查並排入其第一次執行。請傳送 `name`、`model`，以及 `context` 或 `checks`；會回傳調查 `id` 與 `jobs`。 |
| `GET /lens/{id}` | 讀取已儲存的 `settings`、最近的 `jobs`，以及 `findings`。每個作業都包含 `status`、`stage`、`coverage`，以及 `cost`。 |
| `POST /lens/{id}/runs` | 排入另一個執行。請傳送 `{}` 以重用已儲存的設定，或傳送 `settings` 物件作為一次性覆寫。 |

```bash
curl -H "Authorization: Bearer <key>" \
  "https://<your-litellm-proxy>/lens"
```

唯讀 proxy 管理員可以預覽活動並讀取調查、發現結果與歷史紀錄。團隊與一般虛擬金鑰無法使用此 API。
