import Image from '@theme/IdealImage';

# 管理路由群組 {#manage-routing-groups}

路由群組可讓您對同一個 router 中的不同模型套用不同的路由策略——例如，針對 `gpt-4o` 採用依延遲路由，而較便宜的模型則使用 simple-shuffle。您可以直接從 LiteLLM 儀表板進行管理，無需編輯您的 `proxy_config.yaml`。

關於概念概覽與完整策略參考，請參閱 [Routing Groups - Per-Model Strategies](../../routing.md#routing-groups---per-model-strategies)。

> 點擊下方任一螢幕截圖即可開啟完整的 Scribe 導覽。

## 透過 UI {#via-the-ui}

### 路由群組設定 {#routing-group-settings}

在側邊欄中前往 **General Settings**，並選取 **Routing Groups** 區段。

[![開啟路由群組設定](../../../static/img/routing-groups/access-rg-settings.png)](https://scribehow.com/viewer/Accessing_Routing_Groups_in_Settings__hxNoFOtLQeSfOvcLYgzXzA)

### 建立路由群組 {#create-a-routing-group}

點擊 **Add Routing Group**，然後填入：

- **群組名稱** — 一個唯一識別碼（例如 `anthropic-latency`）。名稱 `default` 為保留名稱。
- **Models** — 來自您模型清單中的一個或多個 `model_name`。每個模型最多只能屬於一個群組。
- **Routing strategy** — 套用到此群組的策略（例如 `latency-based-routing`、`usage-based-routing-v2` 或 `simple-shuffle`）。
- **Routing strategy args** *(optional)* — 策略專屬覆寫，例如 `ttl`、`rpm` 或 `tpm`。

點擊 **Save** 以建立群組。

[![建立路由群組](../../../static/img/routing-groups/create-rg.png)](https://scribehow.com/viewer/Create_a_New_Latency_Based_Routing_Group__y3EoV7U7QOaNdR1YrD-03w)

### 編輯路由群組 {#edit-a-routing-group}

點擊表格中的群組列以開啟，然後更新任何欄位——例如，在 **Routing strategy args** 下將 `ttl` 變更，以調整策略對延遲變化的反應速度。點擊 **Save** 以套用。

[![編輯路由群組](../../../static/img/routing-groups/update-rg.png)](https://scribehow.com/viewer/How_To_Configure_Strategy_Arguments_In_Router_Settings__u98H3SRAQKK-qHOa1Tbx9g)

### 刪除路由群組 {#delete-a-routing-group}

點擊群組列上的 **Delete** 動作並確認。原本位於已刪除群組中的模型會立即回到預設路由策略。

[![刪除路由群組](../../../static/img/routing-groups/delete-rg.png)](https://scribehow.com/viewer/How_To_Delete_A_Router_Setting__O96ij__rQj6QjOurwOqSFA)

## 透過 `proxy_config.yaml` {#via-proxy_configyaml}

您也可以在您的 proxy 設定檔中定義路由群組。透過 UI 設定的值會被儲存，並覆蓋此處定義的值。

```yaml
router_settings:
  # fallback strategy for models not in any explicit group
  routing_strategy: simple-shuffle

  routing_groups:
    - group_name: anthropic-latency
      models: [claude-sonnet, claude-opus]
      routing_strategy: latency-based-routing
      routing_strategy_args:
        ttl: 3600
```

請參閱 [Routing Groups - Per-Model Strategies](../../routing.md#routing-groups---per-model-strategies) 以取得完整 schema、多群組範例與執行階段更新行為。

## 測試請求 {#test-a-request}

設定群組後，請確認對分組模型的請求確實是由該群組的策略進行路由。LiteLLM 會記錄每個請求所選擇的 `routing_group`、`model` 與 `strategy`，因此驗證方式就是送出請求並檢查 proxy 記錄。

### 1. 送出請求 {#1-send-a-request}

將請求送至由路由群組所歸屬的 `model_name`：

```bash
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H 'Authorization: Bearer <your-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "claude-sonnet",
    "messages": [{"role": "user", "content": "ping"}]
  }'
```

![送出請求](../../../static/img/routing-groups/model-request.png)

### 2. 檢查 proxy 記錄 {#2-inspect-the-proxy-logs}

每個請求都會輸出一行包含 `routing_group=<name> model=<model> strategy=<strategy>` 的記錄。

**純文字記錄** — 直接 grep proxy stdout：

```bash
kubectl logs -n litellm -l app=litellm --tail=200 | grep routing_group=
```

**Loki (LogQL)** — 擷取並重新格式化欄位以便清楚讀取：

```logql
{namespace="litellm", pod=~"<your-litellm-pod-regex>"} |= "routing_group="
| regexp `routing_group=(?P<routing_group>\S+) model=(?P<model>\S+) strategy=(?P<strategy>\S+)`
| line_format `{{.routing_group}} {{.model}} {{.strategy}}`
```

![在記錄中驗證路由群組](../../../static/img/routing-groups/verify-rg.png)

像 `anthropic-latency claude-sonnet latency-based-routing` 這樣的一列可確認請求命中了預期的群組。若您看到的是 `default <strategy>`，則該模型並未被該群組歸屬——請檢查該群組的 **Models** 清單。

## 注意事項 {#notes}

- 每個 `model_name` 最多只能屬於**一個**路由群組。重疊會被拒絕。
- 群組名稱 `default` 為隱含備援群組所保留。
- 更新會立即生效——每個群組的狀態會在儲存時重新建置。
