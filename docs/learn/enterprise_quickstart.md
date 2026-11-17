---
title: 生產環境上線
sidebar_label: 生產環境上線
description: 以五個步驟上線 LiteLLM Enterprise。部署閘道、開放模型、MCP 工具與代理程式的存取、連接用戶端、保護驗證，並在專案與事業單位之間分攤成本。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

本指南提供為公司所有團隊上線 LiteLLM Enterprise 的五個步驟。請依序完成這些步驟。每個步驟都使用前面步驟的部署、團隊與虛擬金鑰。

1. 以關鍵部署設定[部署 LiteLLM](#step-1-deploy-litellm)。
2. 開放提供者、模型、MCP 工具與代理程式的[存取權](#step-2-give-access-to-models-mcp-tools-and-agents)。
3. [設定用戶端端點](#step-3-configure-the-client-endpoints)。
4. [實作安全的驗證](#step-4-implement-secure-authentication)。
5. [設定費用分攤](#step-5-set-up-chargeback)，並在專案與事業單位之間分攤成本。

:::info

- **免費試用**：[30 天企業授權](https://www.litellm.ai/enterprise#trial)
- **與我們聯繫**：[預約示範](https://enterprise.litellm.ai/demo)
- **您現在執行的閘道**：從[從 OSS 遷移](/docs/enterprise/moving_from_oss)開始
- **所有 Enterprise 功能**：[Enterprise 總覽](/docs/enterprise)

:::

## 步驟 1. 部署 LiteLLM {#step-1-deploy-litellm}

### 關鍵部署設定 {#critical-deployment-settings}

請在首次部署前做好這些決定。每一個決定在團隊開始使用閘道後都很難更改。

- **Postgres。** Admin UI、虛擬金鑰、MCP 與代理程式登錄，以及預算追蹤的資料都保存在 Postgres 中。參見[資料庫規模](/docs/proxy/db_sizing)。
- **Redis。** 當您執行多個執行個體或多個 worker 時，請執行 Redis 7.0 或更新版本。沒有 Redis 時，每個執行個體會各自獨立強制執行速率限制與預算。參見[哪些功能需要 Redis](/docs/proxy/redis_requirements)。
- **Salt key。** 在加入第一個模型前設定 `LITELLM_SALT_KEY`。Salt key 會加密已儲存的憑證，加入模型後絕不能更改。參見[設定 salt key](/docs/proxy/prod#set-the-salt-key)。
- **Master key。** 將 master key 保存在您的密鑰管理器中。應用程式必須使用虛擬金鑰，而不是 master key。
- **版本。** 固定確切的版本或映像摘要，並[驗證映像簽章](/docs/proxy/docker_image_security)。請使用[受支援的版本](/docs/enterprise/version_support)。
- **拓撲。** 若有多個區域，請在部署前閱讀[多區域部署](/docs/proxy/multi_region)。

完整清單請見[生產環境最佳實踐](/docs/proxy/prod)與[安全性最佳實踐](/docs/proxy/security_best_practices)。

### 前置條件 {#prerequisites}

- LLM 提供者的 API 金鑰（OpenAI、Azure、Anthropic 或其他提供者）
- 一個 Postgres 資料庫，或部署方法所建立的 Postgres 資料庫
- 您的 **Enterprise 授權金鑰**
- 部署目標：**Docker Compose**、**Kubernetes**（`kubectl`）或 **Helm**

### 部署閘道 {#deploy-the-gateway}

<Tabs>
<TabItem value="docker-compose" label="Docker Compose">

請依照[快速入門](/docs/proxy/docker_quick_start)。以下為精簡步驟：

```bash
curl -O https://raw.githubusercontent.com/BerriAI/litellm/main/litellm/deploy/compose/docker-compose.yml
```

建立 `.env`：

```bash
LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"
LITELLM_SALT_KEY="sk-salt-change-me"
LITELLM_LICENSE="eyJ..."
OPENAI_API_KEY="your-api-key"
```

建立 `config.yaml`：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["prometheus"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: "postgresql://llmproxy:dbpassword9090@db:5432/litellm"
  store_model_in_db: true
```

建立 `docker-compose.override.yml` 以掛載設定檔：

```yaml title="docker-compose.override.yml"
services:
  litellm:
    command: ["--config", "/app/config.yaml"]
    volumes:
      - ./config.yaml:/app/config.yaml:ro
```

讓下載的 Compose 檔案指向此目錄中的 `.env`，然後啟動它：

```bash
LITELLM_ENV_FILE=.env docker compose up -d
```

</TabItem>

<TabItem value="kubernetes" label="Kubernetes">

當您自行管理 Postgres 並想完全掌控資源時，可使用原始 manifest 部署。您需要一個叢集可連通的既有 Postgres。

#### 1. 為 `config.yaml` 建立 ConfigMap {#1-create-a-configmap-for-configyaml}

```yaml title="litellm-config.yaml" showLineNumbers
apiVersion: v1
kind: ConfigMap
metadata:
  name: litellm-config
data:
  config.yaml: |
    model_list:
      - model_name: {{openai_large}}
        litellm_params:
          model: openai/{{openai_large}}
          api_key: os.environ/OPENAI_API_KEY

    litellm_settings:
      callbacks: ["prometheus"]

    general_settings:
      master_key: os.environ/LITELLM_MASTER_KEY
      store_model_in_db: true
```

```bash
kubectl apply -f litellm-config.yaml
```

#### 2. 為金鑰建立 Secret {#2-create-a-secret-for-keys}

```bash
kubectl create secret generic litellm-secrets \
  --from-literal=LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>" \
  --from-literal=LITELLM_SALT_KEY="sk-salt-change-me" \
  --from-literal=LITELLM_LICENSE="eyJ..." \
  --from-literal=OPENAI_API_KEY="your-api-key" \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/litellm"
```

#### 3. 建立 `deployment.yaml` {#3-create-deploymentyaml}

```yaml title="deployment.yaml" showLineNumbers
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: litellm
  template:
    metadata:
      labels:
        app: litellm
    spec:
      containers:
        - name: litellm
          image: docker.litellm.ai/berriai/litellm:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: litellm-secrets
          args:
            - "--config"
            - "/app/proxy_config.yaml"
          volumeMounts:
            - name: config-volume
              mountPath: /app/proxy_config.yaml
              subPath: config.yaml
              readOnly: true
          livenessProbe:
            httpGet:
              path: /health/liveliness
              port: 4000
            initialDelaySeconds: 120
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: 4000
            initialDelaySeconds: 120
            periodSeconds: 15
      volumes:
        - name: config-volume
          configMap:
            name: litellm-config
```

```bash
kubectl apply -f deployment.yaml
```

#### 4. 建立 `service.yaml` {#4-create-serviceyaml}

```yaml title="service.yaml" showLineNumbers
apiVersion: v1
kind: Service
metadata:
  name: litellm-service
spec:
  selector:
    app: litellm
  ports:
    - protocol: TCP
      port: 4000
      targetPort: 4000
  type: NodePort
```

```bash
kubectl apply -f service.yaml
```

#### 5. 啟動伺服器 {#5-start-the-server}

```bash
kubectl port-forward service/litellm-service 4000:4000
```

您的 LiteLLM 閘道現已在 `http://0.0.0.0:4000` 上執行。

</TabItem>

<TabItem value="helm" label="Helm">

依照 [Helm 指南](../proxy/deploy/helm.md) 發布 chart 並建置其映像。安裝前先建立 PostgreSQL。Chart 不會建立資料庫。此範例使用 monolith 模式提供單一服務。

#### 1. 建立 Secrets {#1-create-the-secrets}

使用您的密鑰管理器在部署命名空間中建立這些 Kubernetes Secrets：

| Secret | 金鑰 |
| --- | --- |
| `litellm-masterkey` | `masterkey`：以 `sk-` 開頭的隨機金鑰 |
| `litellm-db` | `username`、`password`：PostgreSQL 憑證 |
| `litellm-env` | `LITELLM_LICENSE`、`LITELLM_SALT_KEY`、`OPENAI_API_KEY` |

升級時請保持相同的 salt，讓 LiteLLM 能讀取已儲存的提供者憑證。

#### 2. 建立 `values-enterprise.yaml` {#2-create-values-enterpriseyaml}

將映像參照與 PostgreSQL 主機名稱換成您的值。憑證請保留在上方的 Secrets 中。

```yaml title="values-enterprise.yaml" showLineNumbers
image:
  repository: registry.example.com/platform/litellm
  tag: source-f52f26d

monolith:
  enabled: true

masterKey:
  secretName: litellm-masterkey
  secretKey: masterkey

database:
  writer:
    host: my-postgres.default.svc.cluster.local
    dbname: litellm
    passwordSecret:
      name: litellm-db
      usernameKey: username
      passwordKey: password

gateway:
  envSecrets: [litellm-env]
  config:
    proxy_config:
      model_list:
        - model_name: {{openai_large}}
          litellm_params:
            model: openai/{{openai_large}}
            api_key: os.environ/OPENAI_API_KEY
      litellm_settings:
        callbacks: ["prometheus"]
      general_settings:
        store_model_in_db: true
```

將您資料庫提供者的 TLS 設定加入[驗證資料庫憑證](../proxy/prod.md#verify-the-database-server-certificate-custom-ca-eg-aws-rds)。在生產環境中使用 Redis 協調副本。Redis 設定請參見 [Helm 指南](../proxy/deploy/helm.md)。

#### 3. 使用 Helm 部署 {#3-deploy-with-helm}

使用[發布到您的登錄庫的 OCI chart](../proxy/deploy/helm.md#install-the-chart)。將 `YOUR_ORG` 換成您的登錄庫命名空間：

```bash
helm upgrade --install mydeploy oci://ghcr.io/YOUR_ORG/charts/litellm \
  --version 1.0.0 \
  -f values-enterprise.yaml --wait --timeout 30m
```

Chart 會在應用程式上線前執行資料庫遷移。若使用 Argo CD，請改用 [Argo CD 安裝方式](../proxy/deploy/helm.md#install-the-chart)。

#### 4. 將服務公開至 localhost {#4-expose-the-service-to-localhost}

```bash
kubectl port-forward service/mydeploy-litellm 4000:4000
```

開啟 `http://127.0.0.1:4000`。

</TabItem>
</Tabs>

### 驗證 Enterprise 版本 {#verify-enterprise-edition}

開啟 `http://localhost:4000/`。API 文件頁面的說明中必須顯示 **Enterprise Edition**。若未顯示，請參閱[啟用您的授權](/docs/enterprise/activate)。

開啟位於 `http://localhost:4000/ui` 的 Admin UI，並以您的 master key 登入。在步驟 4 中，您會將此登入方式換成 SSO。

---

## 步驟 2. 開放模型、MCP 工具與代理程式的存取權 {#step-2-give-access-to-models-mcp-tools-and-agents}

在此步驟中，您會將提供者、模型、MCP 伺服器與代理程式加入閘道。接著讓一個團隊能存取它們。

### 2a. 新增提供者與模型 {#2a-add-providers-and-models}

步驟 1 的部署已在 `config.yaml` 中加入 `{{openai_large}}`。若要加入更多模型，請使用 Admin UI 的 **Models** 頁面，或 `config.yaml` 中的 `model_list`。模型請使用單一資料來源。參見[模型管理](/docs/proxy/model_management)與[所有提供者](/docs/providers)。

### 2b. 建立組織、團隊與虛擬金鑰 {#2b-create-an-organization-a-team-and-a-virtual-key}

請在 Admin UI 中完成這些步驟。

| 步驟 | 動作 | 原因 |
| ---- | ------ | --- |
| 1 | 建立**組織**與**團隊** | 組織是最上層實體，例如事業單位。組織包含團隊，例如前端團隊。 |
| 2 | 邀請**內部使用者**加入團隊 | 每位使用者都能存取團隊模型，閘道會追蹤每位使用者的支出。 |
| 3 | 設定團隊的 **`max_budget`**（例如 `30d` 內 `$10`） | 預算提供硬性支出上限。在步驟 5 中，您會用它來檢視預算強制執行。 |
| 4 | 建立可存取該模型的**團隊虛擬金鑰** | 應用程式在步驟 3 中使用此金鑰。閘道會記錄金鑰與團隊的支出。 |

參見[多租戶架構](/docs/proxy/multi_tenant_architecture)與[虛擬金鑰](/docs/proxy/virtual_keys)。

### 2c. 新增 MCP 工具 {#2c-add-mcp-tools}

1. 在 Admin UI 中，前往 **MCP Servers** 並選取 **Add New MCP Server**：

   - 名稱：`deepwiki`
   - URL：`https://mcp.deepwiki.com/mcp`
   - 傳輸方式：HTTP

   或者將伺服器加入 `config.yaml`：

```yaml
mcp_servers:
  deepwiki:
    url: https://mcp.deepwiki.com/mcp
    transport: http
    available_on_public_internet: true
```

2. 在團隊或虛擬金鑰的 MCP 設定中，允許 `deepwiki` 伺服器。參見 [MCP 權限管理](/docs/mcp_control)。
3. 確認工具出現在 Admin UI 的 **MCP Servers > MCP Tools** 下。

### 2d. 新增代理程式 {#2d-add-agents}

1. 部署一個範例 A2A 代理程式，例如 [Multi-agent collaboration using A2A](https://github.com/a2aproject/a2a-samples/tree/main/demo)。此代理程式支援串流。
2. 在 Admin UI 中，前往 **Agents** 並選取 **Add Agent**。輸入代理程式的名稱與 URL。
3. 在虛擬金鑰的代理程式設定中，允許該代理程式。參見[代理程式權限管理](/docs/a2a_agent_permissions)。

```mermaid
flowchart TD
    CLIENT["用戶端（A2A SDK / curl）"]
    CLIENT -->|"Authorization: Bearer sk-..."| PROXY["LiteLLM 代理程式閘道"]
    PROXY -->|"object_permission.agents"| PERMS["金鑰 / 團隊代理程式允許清單"]
    PERMS -->|"GET /v1/agents 篩選"| LIST["代理程式目錄"]
    PERMS -->|"POST /a2a/{agent_id}"| AGENT["下游 A2A 代理程式"]
    AGENT -->|"回應 + 巢狀 LLM 呼叫"| PROXY
    PROXY -->|"X-LiteLLM-Trace-Id · 代理程式支出"| LOGS["記錄分頁 · 代理程式成本追蹤"]
```

→ [MCP 總覽](/docs/mcp) · [Agent 閘道總覽](/docs/a2a)

---

## 步驟 3. 設定用戶端端點 {#step-3-configure-the-client-endpoints}

應用程式與工具會以團隊虛擬金鑰將請求送往閘道 URL。在此步驟中，您會送出一次 LLM 請求、一次 MCP 工具呼叫與一次代理程式呼叫。接著連接您的用戶端工具。

### 3a. LLM 請求 {#3a-llm-requests}

```mermaid
flowchart TD
    APP["用戶端應用程式 / SDK"]
    APP -->|"Authorization: Bearer sk-..."| PROXY["LiteLLM 閘道"]
    PROXY -->|"虛擬金鑰查詢"| KEY["虛擬金鑰 + 團隊"]
    KEY -->|"模型允許清單"| ROUTE["LLM 路由器 /v1/chat/completions"]
    ROUTE -->|"litellm_params.model"| PROVIDER["提供者 API（OpenAI、Azure、Bedrock）"]
    PROXY -->|"請求 + token 支出"| LOGS["記錄分頁 · 支出儀表板"]
```

1. 以團隊虛擬金鑰送出請求：

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-team-key' \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hello from LiteLLM Enterprise Gateway"}]
  }'
```

2. 確認回應為 `200 OK`。助理文字位於 `choices[0].message.content`。
3. 開啟 **Logs** 頁面。確認記錄顯示金鑰、團隊、模型、延遲與支出。
4. 開啟 **Teams** 頁面並選取您的團隊。確認支出已增加。

### 3b. MCP 工具呼叫 {#3b-mcp-tool-calls}

```mermaid
flowchart TD
    CLIENT["用戶端（curl / OpenAI SDK / Cursor）"]
    CLIENT -->|"x-litellm-api-key: Bearer sk-..."| PROXY["LiteLLM MCP 閘道"]
    PROXY -->|"object_permission.mcp_servers"| PERMS["金鑰 / 團隊 MCP 允許清單"]
    PERMS -->|"允許的伺服器"| MCP["DeepWiki MCP Server"]
    MCP -->|"工具結果"| PROXY
    PROXY -->|"mcp 工具呼叫記錄 + 成本"| LOGS["記錄分頁 · MCP 成本追蹤"]
```

1. 送出使用 `deepwiki` 工具的請求：

```bash
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-team-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "TLDR of BerriAI/litellm repo"}],
    "tools": [{
      "type": "mcp",
      "server_url": "litellm_proxy/deepwiki",
      "server_label": "deepwiki",
      "require_approval": "never"
    }]
  }'
```

2. 確認回應包含工具輸出與助理的摘要。
3. 開啟 **Logs** 頁面。確認記錄顯示 MCP 工具呼叫的工具名稱與成本。

參見[使用您的 MCP](/docs/mcp_usage)。

### 3c. 代理程式呼叫 {#3c-agent-calls}

1. 列出金鑰可使用的代理程式：

```bash
curl -H 'Authorization: Bearer sk-team-key' \
  'http://localhost:4000/v1/agents'
```

2. 以 A2A SDK 呼叫代理程式：

```python showLineNumbers title="invoke_a2a_agent.py"
import httpx, asyncio
from uuid import uuid4
from a2a.client import A2ACardResolver, A2AClient
from a2a.types import MessageSendParams, SendMessageRequest

LITELLM_BASE_URL = "http://localhost:4000"
LITELLM_VIRTUAL_KEY = "sk-team-key"

async def main():
    headers = {"Authorization": f"Bearer {LITELLM_VIRTUAL_KEY}"}
    async with httpx.AsyncClient(headers=headers) as client:
        agents = (await client.get(f"{LITELLM_BASE_URL}/v1/agents")).json()
        agent_id = agents[0]["agent_id"]
        base_url = f"{LITELLM_BASE_URL}/a2a/{agent_id}"
        resolver = A2ACardResolver(httpx_client=client, base_url=base_url)
        a2a_client = A2AClient(
            httpx_client=client,
            agent_card=await resolver.get_agent_card(),
        )
        response = await a2a_client.send_message(
            SendMessageRequest(
                id=str(uuid4()),
                params=MessageSendParams(
                    message={
                        "role": "user",
                        "parts": [{"kind": "text", "text": "Hello, what can you do?"}],
                        "messageId": uuid4().hex,
                    }
                ),
            )
        )
        print(response.model_dump(mode="json", exclude_none=True, indent=2))

asyncio.run(main())
```

3. 開啟 **Logs** 頁面。確認記錄顯示金鑰、團隊、延遲與代理程式呼叫的成本。

參見[叫用 A2A 代理程式](/docs/a2a_invoking_agents)與[代理程式成本追蹤](/docs/a2a_cost_tracking)。

### 3d. 連接您的用戶端工具 {#3d-connect-your-client-tools}

程式碼工具與聊天應用程式使用閘道 URL 以及虛擬金鑰或登入權杖。每個用戶端都有設定頁面，例如 Claude Code、Codex 與 Claude Desktop。參見[用戶端設定](/docs/proxy/client_setup/overview)。

---

## 步驟 4. 實作安全的驗證 {#step-4-implement-secure-authentication}

在此步驟中，您會將共用的 master key 登入換成您的身分提供者。接著限制每個人與每個工作負載能做的事。

### Admin UI 的 SSO {#sso-for-the-admin-ui}

SSO 控制 Admin UI 的登入。API 請求使用不同的方法：虛擬金鑰或 JWT。在您的身分提供者中註冊此重新導向 URI：

```
https://<your-proxy-base-url>/sso/callback
```

<Tabs>
<TabItem value="google" label="Google">

```bash
GOOGLE_CLIENT_ID="<your-client-id>"
GOOGLE_CLIENT_SECRET="<your-client-secret>"
PROXY_BASE_URL="https://<your-proxy-base-url>"
```

</TabItem>
<TabItem value="microsoft" label="Microsoft">

```bash
MICROSOFT_CLIENT_ID="<your-client-id>"
MICROSOFT_CLIENT_SECRET="<your-client-secret>"
MICROSOFT_TENANT="<your-tenant-id>"
PROXY_BASE_URL="https://<your-proxy-base-url>"
```

</TabItem>
<TabItem value="okta" label="Okta / Generic OIDC">

```bash
GENERIC_CLIENT_ID="<your-client-id>"
GENERIC_CLIENT_SECRET="<your-client-secret>"
GENERIC_AUTHORIZATION_ENDPOINT="https://<your-idp>/oauth2/v1/authorize"
GENERIC_TOKEN_ENDPOINT="https://<your-idp>/oauth2/v1/token"
GENERIC_USERINFO_ENDPOINT="https://<your-idp>/oauth2/v1/userinfo"
PROXY_BASE_URL="https://<your-proxy-base-url>"
```

</TabItem>
</Tabs>

透過您的身分提供者登入 Admin UI。接著停用以 master key 與 `UI_PASSWORD` 的登入。參見[停用環境憑證登入](/docs/proxy/security_best_practices#disable-environment-credential-login-to-the-admin-ui)。

若要從您的身分提供者建立使用者與團隊，請使用 [SCIM 佈建](/docs/tutorials/scim_litellm)。更多選項請參見 [Admin UI 的 SSO](/docs/proxy/admin_ui_sso)、[SSO 事件掛鉤](/docs/proxy/custom_sso) 與 [CLI 登入](/docs/proxy/cli_sso)。

### API 流量的 JWT 驗證 {#jwt-authentication-for-api-traffic}

工作負載可以送出您 OIDC 提供者的 JWT，取代長期有效的虛擬金鑰。JWT 聲明可將每個請求對應到 LiteLLM 使用者、團隊與模型存取權。參見 [JWT 驗證](/docs/proxy/token_auth) 與 [JWT 到虛擬金鑰的對應](/docs/proxy/jwt_key_mapping)。

### 最小權限存取 {#least-privilege-access}

給予每個人最低限度的 [RBAC 角色](/docs/proxy/access_control)，並讓 proxy 管理員的人數保持精簡。給予每個生產工作負載自己的[服務帳戶](/docs/proxy/service_accounts)金鑰，讓您可以撤銷一個工作負載而不影響其他工作負載。若要限制網路來源，請使用 [IP 位址篩選](/docs/proxy/ip_address)。

### 密鑰管理器 {#secret-manager}

將提供者金鑰保留在您的密鑰管理器中，而不是設定檔裡。參見[密鑰管理器](/docs/secret_managers/overview)。

### 稽核記錄 {#audit-logs}

當閘道有授權時，稽核記錄預設開啟。若要關閉，請在 `litellm_settings` 中設定 `store_audit_logs: false`。若要測試，請在 API 或 Admin UI 中刪除一個虛擬金鑰。接著開啟 **Audit Logs** 頁面。參見[稽核記錄](/docs/proxy/audit_logs)。

---

## 步驟 5. 設定費用分攤 {#step-5-set-up-chargeback}

費用分攤會將每個請求的成本歸屬到送出它的事業單位或專案。LiteLLM 在租戶階層的每一層歸屬支出：組織、團隊、使用者與虛擬金鑰。專案與標籤提供更多維度。事業單位使用組織，其中的群組使用團隊。應用程式使用專案，跨團隊的成本使用標籤。

```mermaid
flowchart TD
    REQUEST["用戶端請求（LLM / MCP / Agent）"]
    REQUEST -->|"Authorization: Bearer sk-..."| PROXY["LiteLLM Enterprise 閘道"]

    PROXY -->|"key.team_id"| TEAMS["團隊（組織階層）"]
    PROXY -->|"虛擬金鑰查詢"| KEYS["虛擬金鑰"]
    PROXY -->|"請求上的 metadata.tags"| TAGS["標籤預算（跨切專案）"]

    TEAMS --> TBUDGET["團隊 max_budget / 每月支出額度"]
    KEYS --> KBUDGET["金鑰 max_budget + RPM/TPM 限制"]
    TAGS --> TABUDGET["標籤預算限制"]

    TBUDGET --> ENFORCE["路由前預算檢查"]
    KBUDGET --> ENFORCE
    TABUDGET --> ENFORCE
    ENFORCE --> ROUTES["LLM / MCP / Agent 路由"]
    PROXY --> SPEND["支出儀表板 · GET /spend/tags"]
```

相同的虛擬金鑰與相同的預算適用於 LLM、MCP 與代理程式請求。

### 5a. 團隊預算 {#5a-team-budget}

您已在步驟 2 設定團隊 `max_budget`。在步驟 3 之後：

1. 開啟 **Teams** 頁面並選取您的團隊。
2. 確認支出包含 LLM、MCP 與代理程式呼叫。
3. 選用：將團隊 `max_budget` 設為非常低的值，例如 `$0.0001`。送出一次 LLM 請求，並確認閘道傳回預算錯誤。

若要在團隊到達預算前寄電子郵件給團隊，請使用[軟性預算提醒](/docs/proxy/ui_team_soft_budget_alerts)。

### 5b. 專案 {#5b-projects}

專案將一個應用程式或使用案例的金鑰分組。專案有預算、擁有者、速率限制、模型允許清單與自己的支出檢視。參見[專案](/docs/proxy/project_management)。

### 5c. 金鑰預算與速率限制 {#5c-key-budget-and-rate-limits}

1. 建立一個預算小且有 RPM 限制的金鑰：

```bash
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "max_budget": 0.01,
    "rpm_limit": 1,
    "team_id": "<your-team-id>"
  }'
```

2. 以新金鑰送出請求。確認回應為 `200 OK`。
3. 在同一分鐘內送出第二次請求。確認閘道傳回速率限制錯誤。
4. 在 Admin UI 中開啟 **Virtual Keys**，找到該金鑰的支出。

參見[虛擬金鑰](/docs/proxy/virtual_keys)。

### 5d. 標籤預算 {#5d-tag-budget}

1. 將 `tag_budget_config` 加入 `config.yaml` 並重新啟動閘道：

```yaml
litellm_settings:
  tag_budget_config:
    poc:chat-app:
      max_budget: 0.000000000001
      budget_duration: 1d
```

2. 以該標籤送出請求：

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Authorization: Bearer sk-team-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["poc:chat-app"]}
  }'
```

3. 確認第一個請求成功。以相同標籤送出第二個請求。確認閘道傳回預算錯誤。

4. 取得每個標籤的支出：

```bash
curl -X GET 'http://localhost:4000/spend/tags' \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

確認回應顯示 `poc:chat-app` 以及 `total_spend` 與 `log_count`。

參見[請求標籤](/docs/proxy/request_tags)與[標籤預算](/docs/proxy/tag_budgets)。

### 5e. 支出報告 {#5e-spend-reports}

若要將成本送交財務部門，可透過 API 依團隊、金鑰、標籤或模型取得支出報告。參見[產生支出報告](/docs/proxy/cost_tracking#-enterprise-generate-spend-reports)。

暫時性上限可使用[暫時提高預算](/docs/proxy/temporary_budget_increase)。分層上限可使用[預算與速率限制層級](/docs/proxy/rate_limit_tiers)。

---

## 上線之後 {#after-the-rollout}

- **防護欄。** 建立一個防護欄，以原則將它附加到團隊或金鑰，並送出一個防護欄必須阻擋的請求。參見[防護欄快速入門](/docs/proxy/guardrails/quick_start)與[防護欄原則](/docs/proxy/guardrails/guardrail_policies)。
- **團隊記錄。** 將每個團隊的記錄送到它自己的可觀測性專案。參見[團隊與金鑰記錄](/docs/proxy/team_logging)。
- **AI Hub。** 在一個頁面上展示您的使用者可使用的模型、MCP 伺服器與代理程式。參見 [AI Hub](/docs/proxy/ai_hub)。
- **安全性審查。** 收集 SOC 2 Type II 報告與給您安全團隊的答覆。參見[合規與 SOC 2 Type II](/docs/enterprise/compliance)。

## 需要協助 {#get-help}

每份 Enterprise 授權都包含與 LiteLLM 工程師共用的 Slack Connect 頻道。您也可以寄電子郵件至 `support@berri.ai`。若要取得頻道，請依照[如何申請您的頻道](/docs/enterprise/support#how-to-request-your-channel)。參見[支援與 SLA](/docs/enterprise/support)。
