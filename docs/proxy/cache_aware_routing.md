---
title: 快取感知路由
sidebar_label: 快取感知路由
description: 讓來自同一工作階段的請求留在同一個 Kubernetes 推論 pod 上，使其能重複使用提示快取，並提供自動 pod 探索與重試路由。
---

import CacheAwareRoutingDiagram from '@site/src/components/CacheAwareRoutingDiagram';
import CrossClusterRoutingDiagram from '@site/src/components/CacheAwareRoutingDiagram/CrossCluster';

# 快取感知路由 {#cache-aware-routing}

## 總覽 {#overview}

將來自同一工作階段的請求路由到同一個推論 pod，讓伺服器可以重複使用其提示快取。這適用於由 Kubernetes 上自行託管模型所服務的多輪對話與代理程式工作負載。

LiteLLM 會探索 Kubernetes headless service 後方的 pod IP，並使用請求的工作階段 ID 來選取 pod。沒有明確工作階段 ID 的請求（包括使用 proxy 產生的工作階段 ID 的請求），會以 round robin 方式分散到各 pods。

推論伺服器必須支援並啟用 prompt 或 prefix 快取，才能重複使用快取。LiteLLM 提供工作階段親和性；它不會檢查每個 pod 快取的內容，也不保證快取命中。

<CacheAwareRoutingDiagram />

Pod 選取會在 LiteLLM 選取部署之後進行。請在部署的 `litellm_params` 中以 `kubernetes_pod_discovery` 啟用它，並保留您現有的[路由策略](../routing.md)。不需要設定額外的 `routing_strategy` 值。Pass-through 路由不使用 pod 探索。

### 工作階段親和性與重試 {#session-affinity-and-retries}

LiteLLM 使用 rendezvous hashing 為工作階段對 pods 排名。看到相同 pod IP 的 proxy workers 會為相同的工作階段選取相同的 pod，不需要共用的工作階段對 pod 對應。當 pods 新增或移除時，部分工作階段會移到不同的 pod，需要重新暖機其快取。

當 LiteLLM 重試請求時，它會選取該工作階段穩定排名中的下一個 pod。在嘗試過所有 pods 之後，排名會繞回起點。重試不會將工作階段永久移到替代 pod。請透過現有的[重試設定](./reliability.md#fallbacks--retries--timeouts--cooldowns)設定重試。

親和性適用於所選的部署內。若模型群組包含多個部署，路由策略仍會先在這些部署之間選擇。冷卻與速率限制仍與設定的部署相關聯，而不是與個別探索到的 pods 相關聯。

### 探索設定 {#discovery-settings}

請在 LiteLLM proxy 上設定這些環境變數，以控制 DNS 探索快取：

| 環境變數 | 預設值 | 行為 |
| --- | --- | --- |
| `KUBERNETES_POD_DISCOVERY_REFRESH_INTERVAL_SECONDS` | `5` | 當請求在超過此間隔後到達時，刷新已快取的 pod IP。 |
| `KUBERNETES_POD_DISCOVERY_IDLE_EVICTION_SECONDS` | `300` | 在某個 service 的已快取 pod 集合閒置這麼久之後，將其移除。 |

這些設定控制 LiteLLM 的 pod 探索快取。推論伺服器控制其自身的提示快取生命週期。

暫時性的 DNS 失敗會保留先前探索到的 pod IP。權威的空 DNS 回應會清除 pod 集合。若沒有可用的 pod IP，LiteLLM 會為該請求保留設定的 service 主機名稱。

## 開始使用 {#get-started}

### 1. 透過 headless service 公開推論 pods {#1-expose-inference-pods-through-a-headless-service}

請在與其推論 pods 相同的 Kubernetes 叢集中，執行負責 pod 探索的 LiteLLM 執行個體。它必須能解析該 service 主機名稱，並直接連線到每個 pod 的服務連接埠。

對於 `gpu` 命名空間中現有的推論部署，請建立一個 headless service。將 `selector` 設定為與您 pods 的標籤相符，並使用推論伺服器監聽的連接埠：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-vllm-headless
  namespace: gpu
spec:
  clusterIP: None
  selector:
    app: vllm
  ports:
    - name: http
      port: 8000
      targetPort: 8000
```

headless service 的 DNS 回應會提供就緒的 pod IP。請在 `api_base` 中使用 pod 的服務連接埠：LiteLLM 會以 pod IP 取代主機名稱，並保留 URL 的連接埠與路徑。

### 2. 在 LiteLLM 中啟用 pod 探索 {#2-enable-pod-discovery-in-litellm}

將模型加入您的 proxy 設定。請將 `your-served-model` 換成您的推論伺服器公開的模型名稱，並在 proxy 環境中設定 `VLLM_API_KEY`。

```yaml
model_list:
  - model_name: gpu-llama
    litellm_params:
      model: openai/your-served-model
      api_base: http://my-vllm-headless.gpu.svc.cluster.local:8000/v1
      api_key: os.environ/VLLM_API_KEY
      kubernetes_pod_discovery: true
```

您也可以在 Admin UI 的 **Add Model > Advanced Settings** 中啟用 **Kubernetes pod discovery**。

### 3. 傳送穩定的工作階段 ID {#3-send-a-stable-session-id}

程式設計代理程式的 harness 可以自動提供這個。LiteLLM 可辨識來自 Claude Code、Codex 與 OpenCode 的工作階段標頭。當這些穩定的工作階段 ID 到達 proxy 時，您不需要手動加入 `litellm_session_id`。

**範例：手動設定工作階段 ID。** 在這段對話的後續請求中重複使用 `conversation-123`。

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpu-llama",
    "litellm_session_id": "conversation-123",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Help me plan a trip to Tokyo."}
    ]
  }'
```

**可辨識的工作階段 ID 來源。** LiteLLM 會從這些請求內文字段與 HTTP 標頭讀取工作階段 ID。

| 可辨識來源 | 位置與行為 |
| --- | --- |
| `litellm_session_id` | 頂層請求內文字段。在整段對話中重複使用相同的值；優先於 `metadata.session_id`。 |
| `metadata.session_id` | 請求內文 metadata 中的工作階段 ID。 |
| `x-litellm-session-id` | 明確的 LiteLLM 工作階段標頭。 |
| `x-<vendor>-session-id` | 供應商標頭，例如 Claude Code 的 `x-claude-code-session-id`。值必須至少 8 個字元，且只能使用字母、數字、連字號或底線。 |
| `session-id`、`thread-id` | Codex 標頭；需要 Codex 的 `User-Agent`。也支援舊版的 `session_id` 與 `conversation_id` 標頭。值使用與供應商工作階段標頭相同的格式。 |
| `x-session-id`、`x-parent-session-id` | OpenCode 標頭；父工作階段 ID 對子代理程式具有優先權。值使用與供應商工作階段標頭相同的格式。 |
| `x-litellm-trace-id` | 僅在未提供其他可辨識的工作階段標頭或明確的內文工作階段 ID 時，才用於 pod 親和性。 |

## 多個叢集 {#multiple-clusters}

當入口 proxy 與 GPU pods 在不同的叢集中執行時，請使用兩層架構。在 GPU 叢集 A 內執行 LiteLLM **A**，在 GPU 叢集 B 內執行 LiteLLM **B**，各自為其本機推論 pods 提供 pod 探索與工作階段親和性。再執行一個頂層 LiteLLM **C**，以部署層級的工作階段親和性路由到 A 與 B。

<CrossClusterRoutingDiagram />

在 C 上將 A 與 B 註冊為同一模型群組中的兩個部署，並在 C 的 `router_settings.optional_pre_call_checks` 中啟用 `session_affinity`。C 透過 A 與 B 的 proxy 端點連線；pod DNS 與直接 pod 連線則留在每個 GPU 叢集內。

將穩定的 `x-litellm-session-id` 標頭傳送給 C，並在 C 上啟用 `general_settings.forward_client_headers_to_llm_api: true`，將它轉送到 A 或 B。對於這個模式，請省略另外的 `x-litellm-trace-id`：C 的部署親和性讀取的是 `metadata.session_id`，而該 trace 標頭會覆寫它。

在叢集親和性 pin 有效且本機 pod 集合未變更的情況下，工作階段會回到相同的叢集與 pod，讓推論伺服器能重複使用其前綴快取。容錯移轉、親和性到期、重試或 pod 變更都可能移動工作階段，並需要重新進行快取暖機。若 C 有多個複本，請設定[部署親和性共用的 Redis](../routing.md#session-affinity-sticky-sessions)，讓它們共用叢集 pins。
