---
title: 在企業版部署 LiteAdmin MCP
sidebar_label: 部署 MCP（企業版）
description: 在整合式或元件化的 LiteLLM 部署中啟用 LiteAdmin MCP，並連接 Claude Code 或 Codex。
toc_max_heading_level: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 在企業版部署 LiteAdmin MCP {#deploy-liteadmin-mcp-on-enterprise}

將 Claude Code 或 Codex 連接到您位於 `/admin/mcp` 的閘道，以管理金鑰、團隊、模型和預算

<EnterpriseFeature feature="Embedded LiteAdmin MCP" />

:::info 圖片可用性

**LiteLLM 1.106.x 及更新版本可用。** 請從 HTTPS 部署與資料庫開始。託管預設為關閉；基礎 Enterprise 授權已涵蓋此功能

:::

## 1. 啟用 MCP {#enable-the-endpoint}

保留您現有的 `DATABASE_URL`、`LITELLM_MASTER_KEY` 和 proxy 設定。請在啟用端點之前，將任何名為 `admin` 的 MCP 伺服器別名重新命名，因為該端點會保留 `/admin`

<Tabs groupId="liteadmin-deployment">
<TabItem value="unified" label="整合式 Docker" default>

將這些項目新增到您現有的 `litellm` service。請透過您的 secret store 或 Compose 環境提供授權

```yaml title="docker-compose.yml (service fragment)"
services:
  litellm:
    environment:
      LITELLM_ENABLE_ADMIN_MCP: "true"
      LITELLM_LICENSE: ${LITELLM_LICENSE}
      PROXY_BASE_URL: https://gateway.example.com
```

重新建立 service：

```bash
docker compose up -d litellm
```

將 `/admin/mcp` 導向容器現有的 port，預設為 `4000`。這適用於 unified、database 和 non-root 映像

</TabItem>
<TabItem value="componentized" label="元件化（Helm）">

對於 [`helm/litellm` chart](https://github.com/BerriAI/litellm/tree/main/helm/litellm)，將這些項目合併到 `backend.extraEnv`。重複使用現有的授權與公開 URL 項目，以避免重複

```yaml title="values.yaml (componentized chart fragment)"
backend:
  extraEnv:
    - name: LITELLM_ENABLE_ADMIN_MCP
      value: "true"
    - name: LITELLM_LICENSE
      valueFrom:
        secretKeyRef:
          name: litellm-enterprise
          key: license
    - name: PROXY_BASE_URL
      value: https://gateway.example.com
```

將 `litellm-enterprise` 和 `license` 取代為您現有的 Secret 名稱與 key，然後套用您的 Helm upgrade

該 chart 的 ingress 會將 `/admin/mcp` 路由到 backend。若使用自訂 ingress，請使用 backend service port，預設為 `4001`，並保留 path 與 `Authorization` header。gateway 元件不提供此端點

</TabItem>
</Tabs>

<details>
<summary>公開 URL 與啟動設定</summary>

將 `PROXY_BASE_URL` 設定為您的公開 HTTPS origin，以供 Host 與 Origin 檢查。若要使用獨立的 MCP hostname，請設定 `LITELLM_MCP_PUBLIC_URL=https://admin-mcp.example.com` 並連線至 `https://admin-mcp.example.com/admin/mcp`

選擇加入但授權無效或 enable-flag 值錯誤都會導致啟動失敗。若要停用 MCP，請將 `LITELLM_ENABLE_ADMIN_MCP=false` 設為 false 並重新啟動提供服務的容器

</details>

## 2. 連接用戶端 {#connect-a-client}

若要使用原生 key 驗證，請使用由 [`proxy_admin`](./access_control.md#global-proxy-roles) 擁有的個人 [virtual key](./virtual_keys.md) 進行讀寫。Viewer 與 team-admin 角色無法連線。請將 master key 保留在伺服器上

<Tabs groupId="liteadmin-enterprise-client">
<TabItem value="claude-code" label="Claude Code" default>

```bash
claude mcp add --scope user --transport http litellm-admin \
  https://gateway.example.com/admin/mcp \
  --header 'Authorization: Bearer <your-personal-proxy-admin-key>'
```

重新啟動 Claude Code，然後執行 `/mcp`。此命令會將您的 key 儲存在 Claude 的設定中，並可能保留在 shell history 中

</TabItem>
<TabItem value="codex" label="Codex">

```toml title="~/.codex/config.toml"
[mcp_servers.litellm-admin]
url = "https://gateway.example.com/admin/mcp"
bearer_token_env_var = "LITELLM_API_KEY"
```

適用於 Codex CLI：

```bash
export LITELLM_API_KEY='<your-personal-proxy-admin-key>'
codex
```

執行 `/mcp` 以檢查連線。對於 Codex 桌面版，請將相同的環境變數提供給應用程式並重新啟動

</TabItem>
</Tabs>

請將 client key 排除在版本控制之外。此端點不提供 `codex mcp login` 的瀏覽器 OAuth 登入。若使用 Claude Desktop，請使用 [本機 MCP 設定](./liteadmin_mcp.md#connect-your-client)

<details>
<summary id="native-key-authentication">自訂 key header</summary>

即使使用 `general_settings.litellm_key_header_name`，也請送出 `Authorization: Bearer ...`。LiteLLM 會在您設定的 header 下轉送相同的 key

請將憑證 header 與身分、傳輸、稽核、網路和政策 header 分開。名稱衝突會導致啟動失敗

</details>

<details>
<summary id="oauth2-proxy-authentication">OAuth2 proxy 驗證</summary>

使用 `general_settings.enable_oauth2_proxy_auth` 時，請透過您的驗證 proxy 路由 request。原始呼叫端的直接對等端必須符合 `trusted_proxy_ranges`；`oauth2_config_mappings` 中的 header 會選取具有已儲存 `proxy_admin` 角色的使用者

請設定 proxy 覆寫身分 header，使其使用已驗證使用者的值。connector 需要 bearer，但原生驗證會使用身分 header。個人 admin key 不會覆寫此模式

</details>

## 3. 驗證 {#verify-the-deployment}

請向您連接的用戶端詢問：

> 使用 LiteAdmin 列出我的團隊及其目前的預算。

確認它有呼叫 admin tool，並回傳您閘道的資料。空白的團隊清單是有效的

<details>
<summary>使用 curl 檢查</summary>

若使用原生 key 驗證，請將 `ADMIN_KEY` 設為您的個人 proxy-admin key：

```bash
curl --fail-with-body https://gateway.example.com/admin/mcp \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

預期會看到包含 admin key 的 tool catalog、沒有憑證的 `401`，以及沒有 `proxy_admin` 角色的 `403`。已停用的端點或對 gateway 元件的 request 會回傳 `404`

</details>

## 工具與回應設定 {#tool-and-response-settings}

<details>
<summary>限制工具或變更回應格式</summary>

請在 LiteLLM 或 backend 容器上設定這些變數，然後重新啟動它

| 變數 | 預設值 | 選項 |
| --- | --- | --- |
| `LITELLM_ADMIN_READ_ONLY` | `false` | `true` 會將探索與執行限制為經審核的讀取操作；需要 `proxy_admin` |
| `LITELLM_ADMIN_TOOLS` | 所有可用的經審核操作 | 以逗號分隔的 [tool names](https://github.com/BerriAI/litellm-admin-mcp/blob/main/src/litellm_admin_mcp/operations.json)，例如 `list_keys,list_teams`；與唯讀限制結合 |
| `LITELLM_ADMIN_RESPONSE_VIEW` | `full` | `full` 會以內嵌方式回傳結果；`compact` 可以回傳已儲存結果的參照 |
| `LITELLM_ADMIN_SCHEMA_MODE` | `full` | `discovery` 會將參數詳細資訊延後至 `describe_admin_tool`；執行時會驗證完整結構描述 |

在多個 worker 或副本的情況下，請保留 `full` 回應。使用 `compact` 時，請將 `read_admin_result` call 傳送到相同的 worker process；僅靠 pod affinity 並不足夠。結果會在 worker 重新啟動時到期並消失。請在重試寫入之前檢查 gateway 狀態

</details>

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查項目 |
| --- | --- |
| 啟動失敗 | 檢查啟動錯誤中的授權、enable flag，以及衝突的 header 名稱 |
| 缺少 MCP 依賴項 | 使用 LiteLLM 1.106.x 或更新版本的 unified 或 backend 映像 |
| `404` | 檢查映像版本、enable flag，以及容器重新啟動。將 `/admin/mcp` 原樣路由到 unified proxy 或 backend |
| key 模式下出現 `401` 或 `403` | 使用有效的個人 `proxy_admin` key |
| OAuth2 proxy 驗證失敗 | 檢查受信任的直接對等端、對應的身分 header，以及已儲存的使用者角色 |
| Host 或 Origin 被拒絕 | 將 `PROXY_BASE_URL` 或 `LITELLM_MCP_PUBLIC_URL` 對應到您的公開 HTTPS origin |
| 缺少工具 | 檢查工具限制與底層管理 API 的可用性 |
| 無法使用 Compact result | 使用相同的 worker process，或切換為 `full` |
| 寫入逾時 | 在重試之前檢查 gateway 狀態；connector 不會重試 tool calls |

關於模型建立，請參閱 [新增模型部署](./liteadmin_mcp.md#add-a-model-deployment)。若要執行 Slack agent worker，請依照 [LiteAdmin Slack app 設定](./liteadmin_slack.md)
