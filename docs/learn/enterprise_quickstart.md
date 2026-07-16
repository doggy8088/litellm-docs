---
title: ✨ Enterprise 快速入門
sidebar_label: ✨ Enterprise 快速入門
description: 部署 LiteLLM Enterprise，端到端驗證 LLM/MCP/Agent 閘道，強制執行預算，並啟用企業控制項。
---

import NavigationCards from '@site/src/components/NavigationCards';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

如果您正使用 **Enterprise 試用版**，請使用本指南來評估 LiteLLM 作為具備企業控制項與預算強制執行的統一 **LLM、MCP 與 Agent 閘道**。

:::info

- **免費試用**：[30 天企業授權](https://www.litellm.ai/enterprise#trial)
- **與我們聯絡**：[預約示範](https://enterprise.litellm.ai/demo)
- **SSO 最多可免費供 5 位使用者使用。** 超過後則需要企業授權。
- **完整功能目錄**：[Enterprise](/docs/enterprise)

:::

## 部署 + 共用設定 {#deploy--shared-setup}

所有閘道與預算測試都共用同一個部署，以及同一個 org/team/key。請先完成本節。

### 前置條件 {#prerequisites}

- 一組 LLM 提供者 API 金鑰（OpenAI、Azure、Anthropic 等）
- **Postgres** — Admin UI、virtual keys、MCP/Agent 註冊與預算追蹤所需
- 您的 **Enterprise 授權金鑰**
- 一個部署目標：**Docker Compose**、**Kubernetes** (`kubectl`) 或 **Helm**

<Tabs>
<TabItem value="docker-compose" label="Docker Compose">

請遵循 Getting Started Tutorial 中的 [Docker Compose 分頁](/docs/proxy/docker_quick_start)。精簡步驟：

```bash
docker pull ghcr.io/berriai/litellm-database:latest
curl -O https://raw.githubusercontent.com/BerriAI/litellm/main/docker-compose.yml
```

建立 `.env`：

```bash
LITELLM_MASTER_KEY="sk-1234"
LITELLM_SALT_KEY="sk-salt-change-me"
LITELLM_LICENSE="eyJ..."
OPENAI_API_KEY="your-api-key"
```

建立 `config.yaml`：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-5.5
    litellm_params:
      model: openai/gpt-5.5
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["prometheus"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: "postgresql://llmproxy:dbpassword9090@db:5432/litellm"
  store_model_in_db: true
```

```bash
docker compose up
```

</TabItem>

<TabItem value="kubernetes" label="Kubernetes">

當您自行管理 Postgres 並希望完整掌控資源時，請使用原始 manifest 進行部署。您需要一個可從叢集存取的既有 Postgres。

#### 步驟 1. 為 `config.yaml` 建立 ConfigMap {#step-1-create-a-configmap-for-configyaml}

```yaml title="litellm-config.yaml" showLineNumbers
apiVersion: v1
kind: ConfigMap
metadata:
  name: litellm-config
data:
  config.yaml: |
    model_list:
      - model_name: gpt-5.5
        litellm_params:
          model: openai/gpt-5.5
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

#### 步驟 2. 為金鑰建立 Secret {#step-2-create-a-secret-for-keys}

```bash
kubectl create secret generic litellm-secrets \
  --from-literal=LITELLM_MASTER_KEY="sk-1234" \
  --from-literal=LITELLM_SALT_KEY="sk-salt-change-me" \
  --from-literal=LITELLM_LICENSE="eyJ..." \
  --from-literal=OPENAI_API_KEY="your-api-key" \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/litellm"
```

#### 步驟 3. 建立 `deployment.yaml` {#step-3-create-deploymentyaml}

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
          image: docker.litellm.ai/berriai/litellm-database:latest
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

#### 步驟 4. 建立 `service.yaml` {#step-4-create-serviceyaml}

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

#### 步驟 5. 啟動伺服器 {#step-5-start-the-server}

```bash
kubectl port-forward service/litellm-service 4000:4000
```

您的 LiteLLM Gateway 現已在 `http://0.0.0.0:4000` 上執行。

</TabItem>

<TabItem value="helm" label="Helm">

此 chart 已發佈至 OCI registry，因此 Helm 可直接安裝；不需要複製 repository。它可以為您 provision Postgres (`db.deployStandalone: true`)，或指向既有資料庫 (`db.useExisting`)。請參閱 [chart README](https://github.com/BerriAI/litellm/blob/main/deploy/charts/litellm-helm/README.md) 與完整的 [values.yaml](https://github.com/BerriAI/litellm/blob/main/deploy/charts/litellm-helm/values.yaml)。

#### 步驟 1. 為您的授權 + 提供者金鑰建立 Secret {#step-1-create-a-secret-for-your-license--provider-keys}

```bash
kubectl create secret generic litellm-env-secret \
  --from-literal=LITELLM_LICENSE="eyJ..." \
  --from-literal=OPENAI_API_KEY="your-api-key"
```

#### 步驟 2. 建立 `values-enterprise.yaml` {#step-2-create-values-enterpriseyaml}

將您的企業設定套用到 chart 上。`environmentSecrets` 會將上述 Secret 注入為環境變數，而 `proxy_config` 接著會以 `os.environ/<NAME>` 參照它。

```yaml title="values-enterprise.yaml" showLineNumbers
masterkey: sk-1234

environmentSecrets:
  - litellm-env-secret

db:
  deployStandalone: true

proxyConfigMap:
  create: true

proxy_config:
  model_list:
    - model_name: gpt-5.5
      litellm_params:
        model: openai/gpt-5.5
        api_key: os.environ/OPENAI_API_KEY
  litellm_settings:
    callbacks: ["prometheus"]
  general_settings:
    store_model_in_db: true
```

`db.deployStandalone: true` 會使用 Bitnami chart 與預設密碼建立單節點 Postgres。試用版這樣足夠；若要更長期使用，請以 `--set postgresql.auth.password=<pw>,postgresql.auth.postgres-password=<pw>` 覆寫它，或改用下方您自己的資料庫。

**使用您自己的資料庫** — 若要指向既有的 Postgres，而不是讓 chart 為您 provision 一個，請取代 `db` 區塊。建立一個 Secret（預設名稱 `postgres`），內含 `username` 與 `password` 金鑰；chart 會根據 `endpoint`、`database` 與那些憑證建立連線 URL。

```yaml title="values-enterprise.yaml" showLineNumbers
db:
  useExisting: true
  endpoint: my-postgres.default.svc.cluster.local
  database: litellm
  secret:
    name: litellm-db-secret
    usernameKey: username
    passwordKey: password
```

#### 步驟 3. 使用 Helm 部署 {#step-3-deploy-with-helm}

直接從 OCI registry 安裝 chart，並傳入您的企業設定值：

```bash
helm install \
  -f values-enterprise.yaml \
  mydeploy \
  oci://docker.litellm.ai/berriai/litellm-helm
```

#### 步驟 4. 將服務公開至 localhost {#step-4-expose-the-service-to-localhost}

```bash
kubectl port-forward service/mydeploy-litellm-helm 4000:4000
```

您的 LiteLLM Gateway 現已在 `http://127.0.0.1:4000` 上執行。

</TabItem>
</Tabs>

### 驗證 Enterprise 版本 {#verify-enterprise-edition}

開啟 `http://localhost:4000/` — Swagger 應在描述中顯示 **"Enterprise Edition"**。請參閱 [Enterprise 授權 FAQ](/docs/enterprise#how-do-i-set-up-and-verify-an-enterprise-license)。

在 `http://localhost:4000/ui` 開啟 Admin UI，並使用您的 master key 登入。

### 共用租戶設定 {#shared-tenant-setup}

在開始 gateway tracks 之前，請先在 Admin UI 完成這些步驟。

| 步驟 | 動作 | 原因 |
| ---- | ------ | --- |
| 1 | 建立 **Organization** 與 **Team** | Organizations 用作頂層實體（Department of Computer Science），其下包含多個 Teams（Robotics Club、Frontend Engineering team） |
| 2 | 邀請 **Internal Users** | 在 team 內新增多位使用者，並管理支出 |
| 2 | 設定 **team `max_budget`**（例如 `$10`、duration `30d`） | 及早建立硬性支出上限，如此即可在執行 LLM calls 後驗證預算強制執行與超出預算時的行為。 |
| 3 | 建立具備模型存取權的 **team 範圍 virtual key** | 讓管理員與內部使用者可存取 team 模型並強制執行預算。追蹤各個 team 的支出。 |

→ [Multi-tenant Architecture](/docs/proxy/multi_tenant_architecture) · [Virtual Keys](/docs/proxy/virtual_keys)

---

## 1. LLM 閘道 {#1-llm-gateway}

證明 LiteLLM 會透過您的 virtual key 路由 LLM requests、追蹤支出，並強制執行 RBAC。

```mermaid
flowchart TD
    APP["Client 應用程式 / SDK"]
    APP -->|"Authorization: Bearer sk-..."| PROXY["LiteLLM Gateway"]
    PROXY -->|"virtual key lookup"| KEY["Virtual Key + Team"]
    KEY -->|"model allowlist"| ROUTE["LLM Router /v1/chat/completions"]
    ROUTE -->|"litellm_params.model"| PROVIDER["提供者 API (OpenAI, Azure, Bedrock)"]
    PROXY -->|"request + token spend"| LOGS["Logs 分頁 · Spend 儀表板"]
```

### 步驟 {#steps}

1. **確認模型** `gpt-5.5`（或您的模型）出現在 `model_list`（config 或 Admin UI → Models）中。

2. **使用您的 master key 進行測試**：

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello from LiteLLM Enterprise Gateway"}]
  }'
```

3. **使用您的 team virtual key** — 使用共用設定中的金鑰重複相同請求。

4. **驗證回應** — 預期為 `200 OK`；assistant text 會以 `choices[0].message.content` 顯示。

5. **驗證記錄** — 開啟 **Logs** 分頁；確認金鑰、team、模型、延遲與支出都有顯示。

6. **驗證 team 支出** — 開啟 **Teams** 分頁 → 選取您的 team；確認支出已增加至 `max_budget`。

→ [Virtual Keys](/docs/proxy/virtual_keys)
→ [Gateway Quickstart](/docs/learn/gateway_quickstart)
→ [Role-Based Access Control](/docs/proxy/access_control)

---

## 2. MCP 閘道 {#2-mcp-gateway}

證明 LiteLLM 會註冊 MCP servers、強制執行每個金鑰的存取權限、路由工具 calls，並追蹤 MCP 成本。

```mermaid
flowchart TD
    CLIENT["Client (curl / OpenAI SDK / Cursor)"]
    CLIENT -->|"x-litellm-api-key: Bearer sk-..."| PROXY["LiteLLM MCP Gateway"]
    PROXY -->|"object_permission.mcp_servers"| PERMS["Key / Team MCP allowlist"]
    PERMS -->|"allowed server"| MCP["DeepWiki MCP Server"]
    MCP -->|"tool result"| PROXY
    PROXY -->|"mcp tool call log + cost"| LOGS["Logs 分頁 · MCP 成本追蹤"]
```

### 步驟 {#steps-1}

1. **註冊 MCP server** — Admin UI → **MCP Servers** → Add New MCP Server：

   - 名稱：`deepwiki`
   - URL：`https://mcp.deepwiki.com/mcp`
   - 傳輸：HTTP

   或新增至 `config.yaml`：

```yaml
mcp_servers:
  - server_name: deepwiki
    url: https://mcp.deepwiki.com/mcp
    transport: http
    available_on_public_internet: true
```

2. **指派給 team/key** — 在 virtual key 或 team 的 MCP Settings 中，允許 `deepwiki` server。請參閱 [MCP 權限管理](/docs/mcp_control)。

3. **列出工具** — 確認工具會出現在 Admin UI 的 **MCP Servers → MCP Tools** 下方。

4. **透過 `/v1/chat/completions` 呼叫**：

```bash
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-team-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "TLDR of BerriAI/litellm repo"}],
    "tools": [{
      "type": "mcp",
      "server_url": "litellm_proxy/deepwiki",
      "server_label": "deepwiki",
      "require_approval": "never"
    }]
  }'
```

5. **驗證回應** — 內含工具輸出與 assistant 摘要。

6. **驗證記錄** — **Logs** 分頁會顯示 MCP tool call，包含具命名空間的工具名稱與成本。

→ [MCP 總覽](/docs/mcp) · [MCP 權限管理](/docs/mcp_control) · [使用您的 MCP](/docs/mcp_usage)

---

## 3. Agent 閘道 {#3-agent-gateway}

證明 LiteLLM 會註冊 A2A agents、強制執行每個金鑰的存取權限、呼叫 agents，並追蹤歸因於 agent 的支出。

```mermaid
flowchart TD
    CLIENT["用戶端（A2A SDK / curl）"]
    CLIENT -->|"Authorization: Bearer sk-..."| PROXY["LiteLLM 代理閘道"]
    PROXY -->|"object_permission.agents"| PERMS["Key / Team 代理程式允許清單"]
    PERMS -->|"GET /v1/agents filter"| LIST["Agent 目錄"]
    PERMS -->|"POST /a2a/{agent_id}"| AGENT["下游 A2A 代理程式"]
    AGENT -->|"回應 + 巢狀 LLM 請求"| PROXY
    PROXY -->|"X-LiteLLM-Trace-Id · agent 支出"| LOGS["記錄分頁 · 代理程式成本追蹤"]
```

### 步驟 {#steps-2}

1. **部署範例代理程式** — 使用 [**使用 A2A 的多代理程式協作**](https://github.com/a2aproject/a2a-samples/tree/main/demo)（具有串流支援的簡單可部署 A2A 代理程式）。

2. **在 Admin UI 註冊** — **Agents** 分頁 → **Add Agent** → 輸入名稱與 URL。

3. **指派給 team/key** — 在虛擬金鑰的 Agent Settings 下，允許該代理程式。請參閱 [Agent Permission Management](/docs/a2a_agent_permissions)。

4. **列出代理程式**：

```bash
curl -H 'Authorization: Bearer sk-team-key' \
  'http://localhost:4000/v1/agents'
```

5. **透過 A2A SDK 呼叫**：

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

6. **驗證記錄** — **Logs** 分頁會顯示 key、team、延遲，以及歸因於代理程式的成本。成本會計入第 0 節中的 team/key 支出。

→ [Agent Gateway Overview](/docs/a2a) · [Invoking A2A Agents](/docs/a2a_invoking_agents) · [Agent Cost Tracking](/docs/a2a_cost_tracking)

---

## 4. 預算與支出 {#4-budgets--spend}

預算強制執行會透過相同的虛擬金鑰在**所有三個閘道**上運作——同一個控制平面管理 LLM、MCP 與 Agent 支出。

```mermaid
flowchart TD
    REQUEST["用戶端請求（LLM / MCP / 代理程式）"]
    REQUEST -->|"Authorization: Bearer sk-..."| PROXY["LiteLLM 企業閘道"]

    PROXY -->|"key.team_id"| TEAMS["Team（組織階層）"]
    PROXY -->|"virtual key 查詢"| KEYS["虛擬金鑰"]
    PROXY -->|"請求上的 metadata.tags"| TAGS["標籤預算（跨專案）"]

    TEAMS --> TBUDGET["Team max_budget / 每月支出上限"]
    KEYS --> KBUDGET["Key max_budget + RPM/TPM 限制"]
    TAGS --> TABUDGET["標籤預算限制"]

    TBUDGET --> ENFORCE["路由前的預算檢查"]
    KBUDGET --> ENFORCE
    TABUDGET --> ENFORCE
    ENFORCE --> ROUTES["LLM / MCP / 代理程式路由"]
    PROXY --> SPEND["支出儀表板 · GET /spend/tags"]
```

### 4a. Key 預算 + 速率限制 {#4a-key-budget--rate-limits}

1. 建立一個具有嚴格預算與 RPM 限制的測試 key：

```bash
curl -X POST 'http://localhost:4000/key/generate' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "max_budget": 0.01,
    "rpm_limit": 1,
    "team_id": "<your-team-id>"
  }'
```

2. **第一次請求** 使用新 key → `200 OK`。
3. **同一分鐘內的第二次請求** → 速率限制錯誤（超出 RPM）。
4. 在 Admin UI 的 **Virtual Keys** 下確認 key 支出。

→ [Virtual Keys](/docs/proxy/virtual_keys) · [Docker Quick Start — RPM test](/docs/proxy/docker_quick_start)

### 4b. Team 預算 {#4b-team-budget}

第 0 節中已設定 Team `max_budget`。完成第 1–3 節後：

1. 開啟 **Teams** 分頁 → 選取您的 PoC team。
2. 確認跨 LLM、MCP 與 Agent 呼叫累積的 **支出**。
3. **可選負向測試** — 將 team `max_budget` 設得非常低（例如 `$0.0001`），發出一次 LLM 呼叫，確認超出預算錯誤。

→ [Multi-tenant Architecture](/docs/proxy/multi_tenant_architecture)

### 4c. 標籤預算 {#4c-tag-budget}

1. 將 `tag_budget_config` 加到 `config.yaml`，並重新啟動 proxy：

```yaml
litellm_settings:
  tag_budget_config:
    poc:chat-app:
      max_budget: 0.000000000001
      budget_duration: 1d
```

2. 發出一個帶標籤的請求：

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Authorization: Bearer sk-team-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {"tags": ["poc:chat-app"]}
  }'
```

3. **第一次呼叫** 成功；**第二次呼叫** 使用相同標籤會因超出預算而失敗。

4. 查詢標籤支出：

```bash
curl -X GET 'http://localhost:4000/spend/tags' \
  -H 'Authorization: Bearer sk-1234'
```

**驗證：** 回應會列出 `poc:chat-app`，以及 `total_spend` 和 `log_count`。

**接著探索：** [Projects](/docs/proxy/project_management) · [Temporary budget increases](/docs/proxy/temporary_budget_increase) · [Soft budget alerts](/docs/proxy/ui_team_soft_budget_alerts) · [Spend reports](/docs/proxy/cost_tracking) · [Budget Routing](/docs/proxy/provider_budget_routing) · [Enterprise Spend Tracking](/docs/enterprise#-spend-tracking)

---

## 5. 企業控制 {#5-enterprise-controls}

在運作中的閘道與預算之上，疊加安全性與合規性。

### 稽核記錄 {#audit-logs}

透過您的 `config.yml` 的 litellm_settings 下的 `store_audit_logs: true` 啟用。透過 API 或 UI 刪除虛擬金鑰，然後檢查 **Audit Logs** 分頁。

→ [Audit Logs](/docs/proxy/multiple_admins)

### Team/key 防護欄 {#teamkey-guardrails}

1. **Guardrails** → 建立一個 guardrail（機密偵測或內容審核）
2. **Policies** → 將 guardrail 附加到 team 或 key
3. 傳送應該被封鎖的請求；確認 guardrail 觸發

→ [Guardrail Policies](/docs/proxy/guardrails/guardrail_policies)
→ [Guardrails Quick Start](/docs/proxy/guardrails/quick_start)

### Admin UI 的 SSO {#sso-for-admin-ui}

SSO 控制的是 **Admin UI 登入** — 與 API 驗證（虛擬金鑰或 JWT）分開。請在您的 IdP 中註冊此重新導向 URI：

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

**驗證：** 透過您的身分識別提供者登入 Admin UI。

**另可使用：** [Custom SSO](/docs/proxy/custom_sso) · [CLI SSO](/docs/proxy/cli_sso) · [SCIM provisioning](/docs/tutorials/scim_litellm)

→ [SSO for Admin UI](/docs/proxy/admin_ui_sso)

### JWT/OIDC 驗證 {#jwtoidc-auth}

使用您的身分識別提供者的 JWT 權杖來驗證應用程式請求，而非靜態虛擬金鑰。

→ [JWT-based Authentication](/docs/proxy/token_auth)

### 密鑰管理器 {#secret-manager}

將 LiteLLM 指向您的 secret manager，讓提供者金鑰從 vault 讀取，而不是從設定檔讀取。

→ [Secret Managers Overview](/docs/secret_managers/overview)

---

## 7. 其他企業價值 {#7-additional-enterprise-value}

<NavigationCards
columns={3}
items={[
  {
    icon: "💰",
    title: "治理與成本",
    description: "標籤預算、軟性預算提醒、支出報告，以及暫時性預算增加。",
    to: "/docs/proxy/cost_tracking",
  },
  {
    icon: "📡",
    title: "可觀測性",
    description: "以 team 為基礎的記錄、記錄匯出到 GCS/Azure Blob、每個 team 的 Langfuse 路由。",
    to: "/docs/proxy/team_logging",
  },
  {
    icon: "🌐",
    title: "AI Hub",
    description: "供您的使用者使用的可公開品牌化模型與代理程式頁面。",
    to: "/docs/proxy/ai_hub",
  },
  {
    icon: "🏗️",
    title: "多區域",
    description: "多區域部署、授權，以及 admin/worker 分離。",
    to: "/docs/proxy/multi_region",
  },
  {
    icon: "🔒",
    title: "資料安全",
    description: "SOC 2、ISO 27001、資料區域，以及合規常見問題。",
    to: "/docs/data_security",
  },
  {
    icon: "✨",
    title: "完整企業目錄",
    description: "完整功能參考、部署選項，以及支援 SLA。",
    to: "/docs/enterprise",
  },
]}
/>

---

## 8. 需要協助？ {#8-need-help}

每份 Enterprise 授權都包含一個與我們工程團隊聯繫的專屬 Slack 或 Teams 頻道。請與我們聯繫 `support@berri.ai`，我們非常樂意協助您！

請參閱 [Professional Support](/docs/enterprise#professional-support)。
