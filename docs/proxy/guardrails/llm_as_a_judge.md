import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LLM 作為裁判 {#llm-as-a-judge}

## 概觀 {#overview}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | 針對每個傳入請求或 LLM 回應，依加權條件以 0-100 進行評分，並封鎖或記錄低於門檻者。 |
| 提供者 | LiteLLM 原生（您代理程式上的任何 chat model，或任何提供者 model 都可作為裁判） |
| 支援的動作 | `block`（當分數低於門檻時回傳 HTTP 422），`log`（記錄判定，讓請求或回應通過） |
| 支援的模式 | `pre_call`（裁判在 LLM 接收請求訊息之前先評估它們），`during_call`（與 `pre_call` 相同，但裁判與 LLM 呼叫並行執行），`post_call`（裁判評估 LLM 回應） |
| 串流支援 | 是。失敗的判定會終止串流。 |
| API 要求 | 裁判 model 的認證資料，使用代理程式部署或提供者環境變數皆可 |

## 運作方式 {#how-it-works}

在 `post_call` 模式下，防護欄會將對話與 LLM 回應連同您的條件送至裁判 model。在 `pre_call` 與 `during_call` 模式下，它改為判定最新的請求回合，而較早的帶角色標註訊息只會作為上下文傳入，因此貼題的歷史不會掩蓋離題的新回合，而較早被拒絕的回合也不會拖垮之後有效的回合。被判定的回合是請求中連續的 `user` 訊息，其所有文字部分會合併，並取自防護欄範圍保留的訊息（`skip_system_message_in_guardrail`、`skip_tool_message_in_guardrail` 和 `scan_only_tool_results` 照常適用）；當請求不是以使用者回合結尾時（例如工具結果往返），或端點未提供防護欄任何逐訊息結構時，裁判會評估所有保留的請求文字。這會在任何回應存在之前執行，因此裁判可在不耗費主 model 代幣的情況下拒絕離題或不允許的請求（當裁判拒絕時，`during_call` 仍會並行執行主呼叫並捨棄其結果）。裁判會針對每個條件回傳判定（分數 0-100、理由、通過/失敗）以及加權總分。如果總分低於 `overall_threshold` 且 `on_failure` 為 `block`，請求會以 HTTP 422 失敗，並帶有完整判定；若為 `on_failure: log`，呼叫會繼續進行，且判定會記錄在請求的記錄中繼資料（`eval_information`）中，可在費用記錄與記錄整合中看到。

每個被判定的請求或回應都會額外產生一次對裁判 model 的 LLM 呼叫成本。

## 快速開始 {#quick-start}

### 1. 在您的 LiteLLM config.yaml 中定義 Guardrails {#1-define-guardrails-on-your-litellm-configyaml}

在 `guardrails` 區段下定義您的 guardrails：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chat-model
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: my-judge-model
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

guardrails:
  - guardrail_name: "quality-judge"
    litellm_params:
      guardrail: llm_as_a_judge
      mode: post_call
      judge_model: my-judge-model
      overall_threshold: 80
      on_failure: block
      default_on: true
      criteria:
        - name: helpfulness
          weight: 60
          description: Is the response helpful and correct?
        - name: tone
          weight: 40
          description: Is the response professional and polite?
```

條件權重總和必須為 100。`overall_threshold` 預設為 80，`on_failure` 預設為 `block`。

若要判定請求而非回應，請設定 `mode: pre_call`（或設定 `mode: [pre_call, post_call]` 以同時判定雙方），並撰寫關於請求的條件，例如 `description: Is the request about cooking or recipes?`。被拒絕的請求會回傳 HTTP 422，並附上 `"message": "LLM judge rejected request: score below threshold"` 及如下相同的 `verdicts` 負載，而主 model 絕不會被呼叫。

### 2. 啟動 LiteLLM Gateway {#2-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 3. 測試請求 {#3-test-request}

<Tabs>
<TabItem label="Blocked Request" value="blocked">

未通過條件的回應會以 HTTP 422 拒絕，並附上判定：

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chat-model",
    "messages": [{"role": "user", "content": "hi"}]
  }'
```

```json
{
  "error": {
    "message": "LLM judge rejected response: score below threshold",
    "code": "422",
    "provider_specific_fields": {
      "overall_score": 40.0,
      "threshold": 80.0,
      "verdicts": [
        {"criterion_name": "helpfulness", "score": 40, "reasoning": "...", "passed": false, "weight": 60}
      ],
      "guardrail_name": "quality-judge"
    }
  }
}
```

</TabItem>
<TabItem label="Passing Request" value="passing">

符合門檻的回應會原樣回傳。搭配 `on_failure: log` 時，即使失敗的回應也會回傳；判定會記錄在請求中繼資料的 `eval_information` 中，因此會送達費用記錄與記錄回呼。

</TabItem>
</Tabs>

## 從 Admin UI 建立 guardrail {#creating-the-guardrail-from-the-admin-ui}

可完全從儀表板建立 guardrail：Guardrails、Add New Guardrail、提供者 "LiteLLM LLM as a Judge"。裁判 model 下拉選單會從您的代理程式 model 清單填入，而條件、門檻與失敗動作會對應到上述設定欄位。以這種方式建立的 guardrail 會儲存在資料庫中，並在啟動時載入，無須在設定檔中加入項目。

<Image img={require('../../../img/llm_judge_ui_dropdown.png')} />

從 Playground 看到的被封鎖回應；裁判的拒絕會終止串流：

<Image img={require('../../../img/llm_judge_playground_blocked.png')} />

## 裁判 model 的認證資料如何解析 {#how-the-judge-models-credentials-resolve}

`judge_model` 會先根據代理程式的 Router 解析。如果名稱符合已設定的部署（精確公開名稱、例如 `anthropic/*` 的萬用字元路由，或 `model_group_alias` 項目），裁判呼叫就會透過該部署並使用其認證資料；這就是為什麼在 Admin UI 下拉選單中選取的裁判 model 可以運作，因為它們的金鑰位於部署中而非環境變數中。Router 無法提供的名稱會回退到 SDK，像任何直接的 `litellm.completion` 呼叫一樣，從環境變數解析認證資料。

Router 路徑有兩個值得注意的後果。如果裁判 model 名稱同時符合某個部署與有效的提供者 model id，會以部署為準，因此使用的是該部署的金鑰，而不是環境金鑰。透過部署的裁判呼叫也會像其他呼叫一樣，納入該部署的速率與冷卻計算，因此持續失敗的裁判可能會讓與使用者流量共用的部署進入冷卻。裁判呼叫本身會關閉重試與標準備援，因此設定的 `judge_model` 仍具權威性。

## 失敗行為 {#failure-behavior}

當裁判發生錯誤時，guardrail 採失敗開放：如果裁判呼叫失敗或回傳無法解析的判定，會記錄警告、將 guardrail 狀態記錄為 `guardrail_failed_to_respond`，並將回應傳回呼叫端。Markdown 圍欄的 JSON 判定（某些裁判 model 會產生）會正常解析，不會被視為失敗。只有成功解析且低於門檻的判定才會觸發封鎖。

## 支援的參數 {#supported-params}

```yaml
guardrails:
  - guardrail_name: string          # required, unique name
    litellm_params:
      guardrail: llm_as_a_judge     # required
      mode: pre_call | during_call | post_call  # required; pre_call and during_call judge the request, post_call judges the response
      judge_model: string           # required, proxy model name or provider model id
      criteria:                     # required, at least one entry, weights sum to 100
        - name: string
          weight: number            # percent share of the overall score
          description: string       # what the judge checks for this criterion
      overall_threshold: number     # optional, 0-100, default 80
      on_failure: block | log       # optional, default block
      default_on: boolean           # optional, run on every request without being requested per-call
```
