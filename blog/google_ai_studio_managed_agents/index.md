---
slug: google-ai-studio-managed-agents
title: "LiteLLM 上的 Google AI Studio 受管代理程式"
date: 2026-05-19T10:00:00
authors:
  - sameer
  - krrish
  - ishaan
tags: [gemini, managed-agents, interactions, google-ai-studio]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Google AI Studio - 受管代理程式 {#google-ai-studio---managed-agents}

LiteLLM 現在支援 [Google AI Studio Managed Agents API](https://ai.google.dev/gemini-api/docs/agents)。透過 LiteLLM 建立、管理並執行自訂代理程式。

:::note
自 LiteLLM `v1.87.0-dev.1` 起可用。
:::

{/* truncate */}

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:v1.87.0-dev.1
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.87.0.dev1
```

</TabItem>
</Tabs>

## 概覽 {#overview}

有兩個不同的步驟：

1. **建立自訂代理程式**：/v1beta/agents 會在 Gemini 端定義您的代理程式（名稱、基礎模型、指示）。
2. **執行代理程式**：建立命名代理程式後，您可以在 /interactions 請求的 agent 欄位中指定其資源名稱來與它互動。

LiteLLM **不會**將代理程式儲存在自己的資料庫中。代理程式完全存在於 Google 端。LiteLLM 只是驗證 + 路由層。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="proxy" label="Proxy">

將您的 Gemini API 金鑰加入環境中：

```bash
export GEMINI_API_KEY="AIzaSy..."
```

**最小 `proxy_config.yaml`**：

```yaml
general_settings:
  master_key: "sk-1234"

environment_variables:
  GEMINI_API_KEY: "AIzaSy..."   # or set in shell env
```

啟動代理伺服器：

```bash
litellm --config proxy_config.yaml
```

如果未設定 `GEMINI_API_KEY`，所有受管代理程式呼叫都會因 Google 的驗證錯誤而失敗。

</TabItem>
<TabItem value="sdk" label="SDK">

```python
import os
import litellm

os.environ["GEMINI_API_KEY"] = "AIzaSy..."
```

您也可以在每次呼叫時傳入 `api_key="AIzaSy..."`，而不是設定環境變數。

</TabItem>
</Tabs>

## 1. 建立代理程式 {#1-create-an-agent}
<Tabs>
<TabItem value="proxy" label="Proxy">

```bash
curl -X POST "http://localhost:4000/v1beta/agents" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-slides-agent",
    "base_agent": "antigravity-preview-05-2026",
    "instructions": "You are a helpful assistant that creates slides.",
    "base_environment": {"env_id": "YOUR_ENVIRONMENT_ID"}
}'
```

**回應：**

```json
{
  "id": "my-slides-agent",
  "base_agent": "antigravity-preview-05-2026",
  "system_instruction": "You are a helpful assistant that creates slides."
}
```

</TabItem>
<TabItem value="sdk" label="SDK">

```python
response = litellm.interactions.agents.create(
    name="my-slides-agent",
    base_agent="antigravity-preview-05-2026",
    instructions="You are a helpful assistant that creates slides.",
    custom_llm_provider="gemini",
    base_environment={"env_id": "YOUR_ENVIRONMENT_ID"}
)
print(response.id)  # "my-slides-agent"
```

非同步版本：`litellm.interactions.agents.acreate(...)`。

</TabItem>
</Tabs>

**參數：**

| 欄位 | 必填 | 說明 |
|---|---|---|
| `name` | 是 | 唯一的代理程式識別碼，後續呼叫中用作 ID |
| `base_agent` | 是 | 要建立的基礎模型。目前 Google 僅支援 `"antigravity-preview-05-2026"` |
| `instructions` | 否 | 代理程式的系統層級指示 |
| `base_environment` | 否 | 環境設定（例如 GCS 技能來源） |

> 以相同的 `name` 呼叫建立兩次，會從 Google 回傳 `409 Conflict`。

## 2. 執行代理程式 {#2-run-an-agent}

<Tabs>
<TabItem value="proxy" label="Proxy">

```bash
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "my-slides-agent",
    "input": "Create a slide deck on the Fibonacci sequence",
    "environment": "remote" # required for agents
  }'
```

</TabItem>
<TabItem value="sdk" label="SDK">

```python
response = litellm.interactions.create(
    agent="my-slides-agent",
    input="Create a slide deck on the Fibonacci sequence",
    environment="remote"
)
print(response)
```

非同步版本：`litellm.interactions.acreate(...)`。

</TabItem>
</Tabs>

注意：請傳入 `agent`，**不要**傳入 `model`。代理程式名稱不是 LiteLLM 模型，請不要將其放入 `model` 欄位。

另請參閱：[/interactions](/docs/interactions) 以了解完整的 Interactions API。

## 管理代理程式 {#manage-agents}

### 列出代理程式 {#list-agents}

<Tabs>
<TabItem value="proxy" label="Proxy">

```bash
curl "http://localhost:4000/v1beta/agents" \
  -H "Authorization: Bearer sk-1234"
```

**回應**
```json
{
    "agents": [
        {
            "id": "my-custom-slides-agent"
        },
        {
            "id": "my-custom-slides-agent-1"
        }
    ]
}
```

</TabItem>
<TabItem value="sdk" label="SDK">

```python
agents = litellm.interactions.agents.list()
```

</TabItem>
</Tabs>

### 取得代理程式 {#get-an-agent}

<Tabs>
<TabItem value="proxy" label="Proxy">

```bash
curl "http://localhost:4000/v1beta/agents/my-slides-agent" \
  -H "Authorization: Bearer sk-1234"
```

**回應**
```json
{
    "id": "my-custom-slides-agent",
    "base_agent": "antigravity-preview-05-2026",
    "system_instruction": "You are a helpful assistant that creates slides.",
    "base_environment": {
        "sources": [
            {
                "type": "gcs",
                "source": "gs://eap-templates/slides-skill",
                "target": "/.agents/skills/slides-skill"
            }
        ],
        "type": "remote"
    }
}
```

</TabItem>
<TabItem value="sdk" label="SDK">

```python
agent = litellm.interactions.agents.get(
    name="my-slides-agent"
)
```

</TabItem>
</Tabs>

### 刪除代理程式 {#delete-an-agent}

<Tabs>
<TabItem value="proxy" label="Proxy">

```bash
curl -X DELETE "http://localhost:4000/v1beta/agents/my-slides-agent" \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>
<TabItem value="sdk" label="SDK">

```python
litellm.interactions.agents.delete(
    name="my-slides-agent",
    custom_llm_provider="gemini",
)
```

</TabItem>
</Tabs>

### 列出代理程式版本 {#list-agent-versions}

<Tabs>
<TabItem value="proxy" label="Proxy">

```bash
curl "http://localhost:4000/v1beta/agents/my-slides-agent/versions" \
  -H "Authorization: Bearer sk-1234"
```
**回應**
```json
{
    "agentVersions": [
        {
            "agent": "antigravity-preview-05-2026",
            "base_environment": {
                "env_id": "sdsdd"
            },
            "instructions": "You are a helpful assistant that creates slides",
            "name": "agents/my-custom-slides-agent-1/versions/a7616fd3-4e3e-48e7-aea7-9ac76b4f37ab"
        }
    ]
}
```


</TabItem>
<TabItem value="sdk" label="SDK">

```python
versions = litellm.interactions.agents.list_versions(
    name="my-slides-agent",
    custom_llm_provider="gemini",
)
```

</TabItem>
</Tabs>

## 驗證 {#authentication}

| 方法 | 如何提供金鑰 |
|---|---|
| **Proxy** | 在代理伺服器的環境中設定 `GEMINI_API_KEY`（或 `GOOGLE_API_KEY`）。虛擬金鑰（`sk-...`）會對使用者在 *proxy* 進行驗證；代理伺服器會使用您的 Gemini 金鑰與 Google 溝通。 |
| **SDK** | 在環境中設定 `GEMINI_API_KEY`，或在每次呼叫時傳入 `api_key="AIzaSy..."`。 |

除了 Google AI Studio 之外，沒有其他方式可以使用受管代理程式。此 API 不支援其他提供者。

## 限制 {#limitations}

- `base_agent` 只接受 `"antigravity-preview-05-2026"`（Google 目前的限制）。
- 代理程式僅儲存在 Google 端。LiteLLM 不會將它們持續儲存到其資料庫中。如果您透過 Google 的 API 直接刪除代理程式，代理伺服器不會知道。
- 透過 `agent` 參數使用 Interactions API，目前只受 Gemini 支援。請使用 `model` 參數來呼叫其他提供者的模型。
- `GEMINI_API_KEY` / `GOOGLE_API_KEY` 必須存在於代理伺服器環境中。在 SDK 中支援透過 `api_key` 逐請求傳入金鑰，但目前代理端點尚不支援。
