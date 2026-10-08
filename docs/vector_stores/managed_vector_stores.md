import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM 受管理向量儲存 {#litellm-managed-vector-stores}

將既有的提供者向量儲存（Bedrock Knowledge Base、Vertex AI Search datastore、Azure AI Search index、Milvus collection、Valkey search index、[MongoDB Vector Search index (BETA)](../providers/mongodb_vector_stores.md) 等）註冊到 LiteLLM，讓 proxy 的每個使用者都能透過一個相容 OpenAI 的 API 使用它，而無須知道提供者或持有其憑證。

受管理向量儲存是儲存在 `config.yaml` 或 LiteLLM 資料庫中的對應，包含：

| 欄位 | 必填 | 說明 |
|---|---|---|
| `vector_store_id` | 是 | 用戶端將參照的 id，通常是提供者自己的儲存 id（Knowledge Base id、datastore id、index name） |
| `custom_llm_provider` | 是 | 要路由到哪個提供者後端，例如 `bedrock`、`vertex_ai/search_api`、`azure_ai`、`milvus`、`mongodb`（BETA）、`valkey`、`gemini`、`openai`、`pg_vector` |
| `vector_store_name` | 否 | 在 UI 中顯示的人類可讀名稱 |
| `vector_store_description` | 否 | 在 UI 中顯示的說明 |
| `vector_store_metadata` | 否 | 自由格式中繼資料物件 |
| `litellm_credential_name` | 否 | 要用來驗證的 [已儲存憑證](../proxy/config_settings.md) 名稱 |
| `litellm_params` | 否 | 提供者參數，例如 Vertex AI 的 `vertex_project` 和 `vertex_location`，Bedrock 的 `aws_region_name` |

註冊不會在提供者端建立任何內容。若要在上游建立新儲存，請改用 [`POST /v1/vector_stores`](./create.md)。

## 註冊向量儲存 {#register-a-vector-store}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml showLineNumbers title="config.yaml"
vector_store_registry:
  - vector_store_name: "docs-knowledgebase"
    litellm_params:
      vector_store_id: "T37J8R4WTM"
      custom_llm_provider: "bedrock"
      aws_region_name: "us-west-2"

  - vector_store_name: "website-search"
    litellm_params:
      vector_store_id: "my-datastore_1234567890"
      custom_llm_provider: "vertex_ai/search_api"
      vertex_project: "my-gcp-project"
      vertex_location: "global"
```

`vector_store_id` 和 `custom_llm_provider` 在 `litellm_params` 中為必填；沒有它們，proxy 無法啟動。

</TabItem>
<TabItem value="api" label="Management API">

```bash showLineNumbers title="Register a Vertex AI Search datastore"
curl -X POST 'http://localhost:4000/vector_store/new' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "vector_store_id": "my-datastore_1234567890",
    "custom_llm_provider": "vertex_ai/search_api",
    "vector_store_name": "website-search",
    "litellm_params": {
      "vertex_project": "my-gcp-project",
      "vertex_location": "global"
    }
  }'
```

儲存會寫入 LiteLLM 資料庫，並可立即供直接搜尋使用；不需要重新啟動。如果 proxy 在沒有已註冊向量儲存的情況下啟動，則其第一個 UI 或 API 註冊的聊天擷取會在資料庫同步或 proxy 重新啟動後可用。回應會回傳儲存的物件，並將敏感的 `litellm_params` 值遮罩。

</TabItem>
<TabItem value="ui" label="Admin UI">

在 Admin UI 中前往 **Tools > Vector Stores > Add new vector store**，選擇提供者，並填入儲存 id 與提供者參數。UI 會呼叫相同的 `POST /vector_store/new` 端點。截圖請見 [聊天完成指南](../completion/knowledgebase.md)。

</TabItem>
</Tabs>

## 使用已註冊的儲存 {#use-a-registered-store}

透過統一端點搜尋它。LiteLLM 會從註冊資訊中解析提供者與憑證：

```bash showLineNumbers title="Unified search"
curl -X POST 'http://localhost:4000/v1/vector_stores/my-datastore_1234567890/search' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": "How do I authenticate?"}'
```

無論提供者為何，回應都是 OpenAI `vector_store.search_results.page` 形狀。所有請求參數請參見 [Search](./search.md)。

或者將它附加到聊天完成中，LiteLLM 會搜尋該儲存，並在呼叫模型之前將結果作為上下文注入：

```bash showLineNumbers title="RAG in /chat/completions"
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-5.6",
    "messages": [{"role": "user", "content": "What is LiteLLM?"}],
    "tools": [{"type": "file_search", "vector_store_ids": ["my-datastore_1234567890"]}]
  }'
```

請求必須明確參照該儲存（頂層 `vector_store_ids` 或在 `tools` 之內）；註冊儲存本身不會改變任何聊天完成。詳細資訊、引註與串流行為： [在聊天完成中使用向量儲存](../completion/knowledgebase.md)。

### 擷取到的上下文會經過您的預呼叫防護欄 {#retrieved-context-goes-through-your-pre-call-guardrails}

儲存中的文件是不受信任的輸入：它可能帶有針對模型的指令（透過 RAG 的間接提示注入）。因此，任何在請求上執行 `pre_call` 的防護欄（`default_on: true` 在設定中，或透過請求、金鑰或團隊上的 `guardrails` 要求）也會在每個儲存的擷取內容注入提示之前先掃描該內容，每個儲存掃描一次。封鎖型防護欄會回傳與封鎖使用者自身訊息時相同的 400，錯誤中包含 `guardrail_name` 和 `guardrail_mode`，且模型絕不會被呼叫。遮罩型防護欄則會改寫注入的上下文。設定為 `during_call` 或 `post_call` 的防護欄仍會像之前一樣看到請求與回應，但不會針對擷取到的上下文執行

```json title="A blocked chunk, with the Azure Prompt Shield guardrail from the guardrails docs"
{
  "error": {
    "message": "Violated Azure Prompt Shield guardrail policy",
    "type": "invalid_request_error",
    "param": null,
    "code": "400",
    "provider_specific_fields": {
      "error": "Violated Azure Prompt Shield guardrail policy",
      "detection_message": "Attack detected: {'attackDetected': True}",
      "guardrail_name": "azure-prompt-shield",
      "guardrail_mode": "pre_call"
    }
  }
}
```

在掃描擷取到的上下文時失敗的防護欄，也會讓請求失敗，而不是將未掃描的上下文注入

## Management API 參考 {#management-api-reference}

所有端點都需要 LiteLLM key（`Authorization: Bearer ...`）。可透過 `general_settings.disable_vector_stores_for_internal_users` 與 `allow_vector_stores_for_team_admins` 限制存取；proxy 管理員一律可存取。

| 端點 | 方法 | 主體 / 參數 |
|---|---|---|
| `/vector_store/new` | POST | 上表中的欄位 |
| `/vector_store/list` | GET | `page`、`page_size`（也可作為 `/v1/vector_store/list`） |
| `/vector_store/info` | POST | `{"vector_store_id": "..."}` |
| `/vector_store/update` | POST | `vector_store_id` 加上 `custom_llm_provider`、`vector_store_name`、`vector_store_description`、`vector_store_metadata` 中的任一項 |
| `/vector_store/delete` | POST | `{"vector_store_id": "..."}` |

`GET /vector_store/list` 會回傳 `{"object": "list", "data": [...], "total_count": n, "current_page": n, "total_pages": n}`。透過 API 或 UI 註冊的儲存會標記建立該儲存之 key 的 `team_id` 與 `user_id`；以團隊建立的儲存在清單與搜尋結果中會限定於該團隊（proxy 管理員可看到全部）。

## 將 key 與團隊限制為特定儲存 {#restricting-keys-and-teams-to-specific-stores}

建立 key 或團隊時設定 `object_permission.vector_stores`，以控制其 LLM 請求可參照哪些儲存 id：

```bash showLineNumbers title="Key limited to one store"
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "object_permission": {"vector_stores": ["my-datastore_1234567890"]}
  }'
```

透過該 key 使用任何其他已註冊的 `vector_store_ids` 中的儲存 id 之請求會被拒絕。空白或未設定的清單代表該 key 不受限制，除非 [`vector_store_deny_by_default`](#deny-vector-stores-by-default) 已啟用。相同欄位也可用於團隊與使用者。

## 預設拒絕向量儲存 {#deny-vector-stores-by-default}

若沒有任何限制，proxy 接受的任何 key 都可以查詢 proxy 的提供者憑證可存取的任何儲存 id。若要讓每個儲存都必須明確允許，請開啟 `vector_store_deny_by_default`：

```yaml showLineNumbers title="config.yaml"
general_settings:
  vector_store_deny_by_default: true
```

此設定預設為 `false`。開啟後，請求透過 `/v1/rag/query` 或 `/rag/query`（`retrieval_config.vector_store_id`）、`/v1/vector_stores/{vector_store_id}/...` 路徑、頂層 `vector_store_ids`，或某個 `file_search` 工具中的 `vector_store_ids` 而參照到的每個儲存 id，都必須列於請求所解析到之每個身分的 `object_permission.vector_stores` 中。名稱多個儲存的請求需要每一個儲存都具備授權。不是字串清單的 `vector_store_ids` 值會以 `400` 拒絕

| 呼叫者 | 需要的授權 |
|---|---|
| 沒有團隊的虛擬 key | 該 key |
| 有團隊的虛擬 key | 該 key 及其團隊 |
| 沒有虛擬 key 的團隊成員（JWT 或 `lite login` session） | 請求所解析到的團隊 |
| 沒有虛擬 key 或團隊的使用者 | 該使用者 |

缺少的權限紀錄、`null` 清單，以及空清單都不授予任何權限。使用者個人授權只有在請求沒有虛擬 key 且沒有團隊時才會計入，因此它們絕不會擴大或縮小 key 或團隊請求，而使用者所屬其他團隊上的授權也會被忽略。如果某個 key 指定了一個無法載入的團隊，請求會被拒絕，而不是當成沒有團隊的 key。被拒絕的請求會在任何提供者呼叫之前以 `key_vector_store_access_denied`、`team_vector_store_access_denied` 或 `user_vector_store_access_denied` 失敗

對於團隊 key，請在兩個物件上都授予該儲存：

```bash showLineNumbers title="Team and key both grant the store"
curl -X POST 'http://localhost:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_alias": "support", "object_permission": {"vector_stores": ["YOUR_KNOWLEDGE_BASE_ID"]}}'

curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_id": "<team_id from above>", "object_permission": {"vector_stores": ["YOUR_KNOWLEDGE_BASE_ID"]}}'
```

註冊儲存不會授予其存取權，且明確授予的原生提供者儲存可以保持未註冊狀態。主金鑰不受限制。儀表板登入 session 尚未涵蓋此設定

將旗標改回 `false` 會恢復先前的行為，也就是空白或未設定的清單代表不受限制。它不會關閉既有檢查：若 `vector_stores` 清單為非空且未包含所請求的儲存，仍會被拒絕
