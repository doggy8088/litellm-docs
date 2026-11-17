---
title: 連接自架分類器
sidebar_label: 自架分類器
description: 使用任何已部署的決策模型，例如 Strands Decider、vLLM 或 Cloudflare Clef，或將自架的 Laya 或 Bespoke Nimble 端點或 Databricks `ai_decide` AI Function 連接到 LiteLLM Auto Router。設定分類器、其連線與路由分層。
---

使用決策模型為 LiteLLM Auto Router 分類請求。您的分類器會為每個請求選擇一個複雜度分層，接著 LiteLLM 會呼叫指派給該分層的 completion 模型。您的應用程式會透過 chat completions API 使用一個 router 模型名稱。

如需畫面逐步說明與完整調校參考，請參閱[自訂您的分類器](./optimize_classifier.md#connect-a-self-hosted-classifier)。該指南也涵蓋使用自架的 OpenAI 相容 LLM 作為 judge，而不是 System One 分類器。

**您 `model_list` 中的任何決策模型都可以作為分類器**，包括自架的 [Strands Decider](../providers/strands_decider.md) 與 [vLLM](#vllm)，以及託管的 [Cloudflare Clef](https://developers.cloudflare.com/workers-ai/models/clef/)。請以 `deployment_name` 指名其部署，如 [使用已部署的決策模型](#use-a-deployed-decision-model) 所示，或在儀表板中的 **Decisions Model** 下選取它。Laya、Bespoke Nimble、Jev 與 Databricks `ai_decide` 也保留各自的 `provider` 設定，將在該節之後說明。它們全都使用 `classifier_type: oss_classifier` 搭配 `opensource_classifier_config`。

## 您主機上提供的內容 {#what-you-host}

您會將分類器模型部署在 System One HTTP API 後方，與 LiteLLM gateway 分開。LiteLLM 會將請求內容與分層條件傳送給它，然後使用其判定來路由 completion。本指南假設該端點已在執行。部署說明請參閱 [Laya HTTP server 指南](https://github.com/NandhaKishorM/laya/blob/main/docs/http-api.md) 或 [Nimble 專案](https://github.com/bespokelabsai/nimble#quickstart)。

| 元件 | 角色 | 執行位置 |
| --- | --- | --- |
| LiteLLM gateway | 接收用戶端請求、要求分層，然後路由 completion | 您的 gateway 部署 |
| 分類器伺服器 | 執行 Laya 或 Nimble 推論並回傳分層選擇 | 您部署並維運的伺服器 |
| completion 模型 | 在路由後產生答案 | 您設定的託管提供者或自架模型端點 |

使用 gateway 可連線的 base URL。對於位於您私人網路中的分類器，這可以是內部服務 URL。在 LiteLLM 中選取分類器會連線到該服務；它不會啟動模型伺服器。

### 請求內容與資料流程 {#request-context-and-data-flow}

分類器會接收目前的使用者請求、選取的系統文字，以及任何已設定的先前回合內容，外加分層條件。將 `classifier_context_window_size: 0` 設為略過先前回合；目前請求與選取的系統文字仍會傳送到分類器。下方 YAML 範例使用此設定。

completion 模型仍會接收產生答案所需的請求。自行託管分類器不會改變該 completion 的執行位置。關於歷史視窗與字元預算設定，請參閱[分類器內容參考](/docs/proxy/auto_routing)。

## 使用已部署的決策模型 {#use-a-deployed-decision-model}

任何提供 [`/v1/decisions`](/docs/decisions) 的 `model_list` 項目都可以為路由器分類請求。請將 `opensource_classifier_config` 中的 `deployment_name` 設為該項目的 `model_name`。LiteLLM 接著會透過該部署傳送分類器呼叫，因此該呼叫會使用該部署的端點、憑證與價格，而您只需為路由器與決策路由設定一次連線。[決策提供者清單](/docs/decisions#supported-providers) 中的每個提供者都以此方式運作，包括 Strands Decider 與 Cloudflare Clef。

<SinceVersion v="1.104.3" />

[LiteLLM #45913](https://github.com/BerriAI/litellm/pull/45913) 新增了決策分類器，backport 版本則在 v1.104.3、v1.105.0 與 v1.106.0 中提供。本頁的範例使用 v1.106.0 的名稱。在 v1.104.x 與 v1.105.x 版本上，請以 `classifier_type: jev` 與 `jev_classifier_config` 取代 `classifier_type: oss_classifier` 與 `opensource_classifier_config`，並以 `mode: evaluation` 取代決策模型的 `mode: decisions`。

對於 Strands Decider，請在您維運的伺服器上執行該模型，並將 gateway 上的 `STRANDS_DECIDER_API_BASE` 設為該伺服器的 base URL，不要包含 `/v1/systemone`。僅當伺服器需要 bearer token 時才設定 `STRANDS_DECIDER_API_KEY`。對於 Cloudflare Clef，請設定 `CLOUDFLARE_API_KEY` 與 `CLOUDFLARE_ACCOUNT_ID`。若要使用成本較低的 Clef Flash 模型，請以 `cloudflare/clef-flash` 取代 `cloudflare/clef`。

```yaml title="config.yaml"
model_list:
  - model_name: small-solver
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: large-solver
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: strands-decider
    litellm_params:
      model: strands_decider/strands-decider-2B-hobson-v19
      api_base: os.environ/STRANDS_DECIDER_API_BASE
  - model_name: clef
    litellm_params:
      model: cloudflare/clef
      api_key: os.environ/CLOUDFLARE_API_KEY
  - model_name: strands-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_default_model: large-solver
      complexity_router_config:
        classifier_type: oss_classifier
        opensource_classifier_config:
          deployment_name: strands-decider
          timeout_ms: 15000
        tiers:
          SIMPLE: small-solver
          MEDIUM: small-solver
          COMPLEX: large-solver
          REASONING: large-solver
        classifier_fallback: default_model
  - model_name: clef-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_default_model: large-solver
      complexity_router_config:
        classifier_type: oss_classifier
        opensource_classifier_config:
          deployment_name: clef
          timeout_ms: 15000
        tiers:
          SIMPLE: small-solver
          MEDIUM: small-solver
          COMPLEX: large-solver
          REASONING: large-solver
        classifier_fallback: default_model
```

連線由部署擁有，因此 `opensource_classifier_config` 會拒絕在 `deployment_name` 旁邊出現 `api_base` 與 `api_key`，而 `provider` 與 `model` 在該處也沒有效果。請將 `timeout_ms` 設為您的決策模型在 warm-up 後所需的時間。在 CPU 上執行的自架模型可能需要比預設的 3000 ms 長得多的時間。

回應標頭會顯示執行的是哪個分類器。經路由的請求會針對每個決策模型回傳 `x-litellm-complexity-router-cause: jev_classifier`，以及帶有分類器呼叫成本的 `x-litellm-classifier-cost`。支出記錄會以該部署的模型記錄分類器呼叫，例如 `strands_decider/strands-decider-2B-hobson-v19` 或 `cloudflare/clef`，並依該模型的 cost map 項目定價。Strands Decider 為自架，其 token 費率為零。

### vLLM {#vllm}

vLLM 自 [v0.32.0](https://github.com/vllm-project/vllm/releases/tag/v0.32.0) 起提供 `/v1/systemone`，由 [vllm-project/vllm#59299](https://github.com/vllm-project/vllm/pull/59299) 新增。如 vLLM 的 [Structured Decisions](https://github.com/vllm-project/vllm/blob/v0.32.0/docs/serving/online_serving/structured_decisions.md) 文件所述，它會回答 `choice`、`noul` 與 `score` 問題，支援其 [`READ_STRATEGIES`](https://github.com/vllm-project/vllm/blob/v0.32.0/vllm/entrypoints/generate/structured_decisions/strategies.py#L812) 中列出的模型架構，其中包括 Qwen3 與 Qwen3.5，並對其他模型回傳 501。路由器會以 `choice` 問題詢問分層。`provider` 不接受 `hosted_vllm`，因此請透過 `deployment_name` 連接 vLLM。此設定適用於 <SinceVersion v="1.106.0" />：

```yaml title="config.yaml"
model_list:
  - model_name: qwen-decider
    litellm_params:
      model: hosted_vllm/Qwen/Qwen3-0.6B
      api_base: http://vllm-server:8000/v1
    model_info:
      mode: decisions
  - model_name: vllm-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_default_model: large-solver
      complexity_router_config:
        classifier_type: oss_classifier
        opensource_classifier_config:
          deployment_name: qwen-decider
          timeout_ms: 15000
        tiers:
          SIMPLE: small-solver
          MEDIUM: small-solver
          COMPLEX: large-solver
          REASONING: large-solver
        classifier_fallback: default_model
```

`small-solver` 與 `large-solver` 是上方範例中的 completion 部署。LiteLLM 會在加上 `/v1/systemone` 之前，先移除 `api_base` 尾端的 `/v1`，因此您用於 vLLM chat completions 的 base URL 在此同樣適用。`mode: decisions` 會將該部署列在儀表板的 **Decisions Model** 下，您可以在該處選取 `qwen-decider`。Qwen3-0.6B 讓範例小到足以在 CPU 上執行，但在測試中它將困難的 prompt 評為 `SIMPLE` 並送給小型 solver。在將實際流量路由給它之前，請先如 [評估品質與成本](#evaluate-quality-and-cost) 所述，以您自己的 prompt 檢查您的模型所選的分層。在不支援 bf16 的 CPU 上，預設的 bf16 權重在測試中會讓第一個 `/v1/systemone` 呼叫卡住，而 `vllm serve Qwen/Qwen3-0.6B --dtype float32 --enforce-eager` 可以運作。

在 Ollama 上，Bespoke Nimble 透過 [`provider: bespoke`](#nimble-self-hosted-system-one-server) 連接。僅提供 chat completions 的模型，無論是在 Ollama 或任何 OpenAI 相容伺服器上，仍可使用 `classifier_type: llm` 作為 LLM judge 來分類請求，如 [自架的 OpenAI 相容 judge](./optimize_classifier.md#a-self-hosted-openai-compatible-judge) 所述。


## 選擇分類器 {#choose-a-classifier}

| 分類器 | 執行位置 | 分類器模型 | `opensource_classifier_config.provider` |
| --- | --- | --- | --- |
| [Laya](https://github.com/NandhaKishorM/laya) | 自架 | `english`、`multilingual` 或 `typed-decisions` | `laya` |
| [Bespoke Nimble](https://github.com/bespokelabsai/nimble) | 自架 System One 伺服器 | `nimble-latest`、`nimble`（Ollama）或 `bespokelabs/Bespoke-Nimble-9B` | `bespoke` |
| [Jev](https://docs.typesafe.ai/) | TypeSafe 的託管 API | `jev-latest` | `jev` |
| [Databricks `ai_decide`](https://docs.databricks.com/aws/en/sql/language-manual/functions/ai_decide) | 您 Databricks workspace 上的 AI Function（Beta） | `ai_decide` | `databricks` |

四者都使用 System One 判定協定。LiteLLM 會傳送一個描述您分層的 `choice` 問題給 `POST /v1/systemone`，Databricks 則是傳給 `POST /api/2.0/ai-functions/ai-decide`。將 `api_base` 設為伺服器的 base URL，不要包含 `/v1/systemone`；僅提供 `/v1/evaluate` 或 chat completions 的端點是不夠的。

:::info 可用性

本指南中的設定名稱與 Laya 支援需要包含 [backend #43626](https://github.com/BerriAI/litellm/pull/43626) 的 gateway build。**OSS Classifier** 儀表板選擇器也需要 [UI #43768](https://github.com/BerriAI/litellm/pull/43768)。兩項變更都已合併；請使用包含它們的 gateway build。Bespoke Nimble 支援需要 [Nimble #44246](https://github.com/BerriAI/litellm/pull/44246)。

Databricks serving endpoints 需要 [BerriAI/litellm#45200](https://github.com/BerriAI/litellm/pull/45200)，而 `ai_decide` AI Function 需要 [BerriAI/litellm#45722](https://github.com/BerriAI/litellm/pull/45722)。

現有的 Jev 相容設定可以保留 `classifier_type: jev` 與 `jev_classifier_config`。對於新的 router，請使用下方的標準名稱；在升級現有 router 時請參閱[移轉](#migrate-an-existing-jev-or-nimble-router)。

:::

## 將分類器連接到閘道 {#connect-the-classifier-to-the-gateway}

在 **LiteLLM gateway 環境**中設定分類器的連線變數。下方範例使用內部主機名稱；請將它們替換為您端點的 base URL。LiteLLM 會附加 `/v1/systemone`，因此請從 URL 中省略該路徑。

### 連接 Laya {#laya-self-hosted-http-server}

將 LiteLLM 指向您的 Laya HTTP 端點：

```bash
export LAYA_API_BASE="http://laya-server:8000"
# Set this only if your endpoint requires bearer authentication.
export LAYA_API_KEY="<classifier-bearer-key>"
```

使用 `provider: laya` 並選取您的端點提供的 checkpoint：`english`、`multilingual` 或 `typed-decisions`。在[完整 router 設定](#configure-the-router)中，請使用：

```yaml
opensource_classifier_config:
  provider: laya
  model: english
  timeout_ms: 15000
```

### 連接 Nimble {#nimble-self-hosted-system-one-server}

將 LiteLLM 指向您的 Nimble System One 端點：

```bash
export BESPOKE_API_BASE="http://nimble-server:8000"
# Set this only if your endpoint requires bearer authentication.
export BESPOKE_API_KEY="<classifier-bearer-key>"
```

使用 `provider: bespoke` 並將 `model` 設為您的端點提供的名稱。在[完整 router 設定](#configure-the-router)中，將分類器區塊替換為：

```yaml
opensource_classifier_config:
  provider: bespoke
  model: nimble-latest
  timeout_ms: 30000
```

對於 Ollama 端點，請使用 `model: nimble`。其他部署可能提供 `nimble-latest` 或 `bespokelabs/Bespoke-Nimble-9B`。`bespoke` 提供者與 LiteLLM 的 Nimble 搜尋整合是分開的。

### 端點與驗證設定 {#endpoint-and-authentication-settings}

- **Base URL：**使用 gateway 可連線的主機名稱與連接埠。`localhost` 指的是 gateway 自己的主機或容器。
- **憑證：**LiteLLM 會將 `LAYA_API_KEY` 或 `BESPOKE_API_KEY` 作為 bearer token 傳送。請使用您的端點接受的憑證；若端點不需要驗證，則省略它。這些設定不會在分類器伺服器上啟用驗證。
- **模型：**與您的端點提供的名稱相符。
- **逾時：**先使用上方範例，然後依分類器的回應時間進行調整。

在變更環境後重新啟動 gateway。接著您可以[在儀表板中設定 Auto Router](#configure-from-the-dashboard)或[使用 YAML](#configure-the-router)。

若要進行 router 專屬連線，請在 `opensource_classifier_config` 內設定 `api_base` 及其對應的 `api_key`。明確指定的 `api_base` 只有在它指名與 `LAYA_API_BASE` 或 `BESPOKE_API_BASE` 相同的伺服器時（忽略尾端的 `/` 或 `/v1`），才會取得 `LAYA_API_KEY` 或 `BESPOKE_API_KEY`。[LiteLLM #45260](https://github.com/BerriAI/litellm/pull/45260) 之前的版本絕不會將環境金鑰傳送給明確指定的 `api_base`。如果您的端點需要其他驗證機制，例如 Modal 的 `Modal-Key` 與 `Modal-Secret` 標頭，請使用代理程式將 bearer 憑證轉換為所需標頭。

### Jev：代管的 TypeSafe API {#jev-hosted-typesafe-api}

若要使用託管選項，請使用您的 secret manager 在 gateway 的環境中設定 `TYPESAFE_API_KEY`，並在[完整 router 設定](#configure-the-router)中使用此分類器區塊：

```yaml
opensource_classifier_config:
  provider: jev
  model: jev-latest
  timeout_ms: 3000
```

`provider: jev` 使用 TypeSafe 傳輸與環境變數。`TYPESAFE_API_BASE` 為選用，預設為 `https://api.typesafe.ai`。

若要使用 router 專屬端點，請在 `opensource_classifier_config` 內同時提供 `api_base` 及其對應的 `api_key`。明確指定的端點不會繼承 TypeSafe 環境金鑰。模型、逾時、指令與 circuit-breaker 欄位遵循 [Jev 參考](/docs/proxy/auto_routing#jev-classifier)，其範例保留已發布 build 支援的名稱。

### Databricks：ai_decide AI Function {#databricks-ai-decide}

Databricks 在您的 workspace 上以 `ai_decide` AI Function 的形式提供 OpenJev，位於 `POST /api/2.0/ai-functions/ai-decide`。該功能處於 Beta 階段，因此 workspace 管理員必須先開啟 `ai_decide` 預覽。請使用與其他 `databricks/` 模型相同的變數，將 LiteLLM 指向您的 workspace：

```bash
export DATABRICKS_API_BASE="https://<workspace-host>"
export DATABRICKS_API_KEY="<databricks-token>"
```

當 `DATABRICKS_API_KEY` 未設定時，會讀取 `DATABRICKS_TOKEN`；以 `/serving-endpoints` 結尾的 `DATABRICKS_API_BASE` 也可使用。請使用 `provider: databricks` 並設定 `model: ai_decide`，此為必填。單純的 serving endpoint 名稱（例如 `databricks-openjev-qwen35-4b`）也可使用，LiteLLM 接著會改將請求（包含 `model`）傳送到該端點的 `/invocations` 路由。在[完整 router 設定](#configure-the-router)中，請使用：

```yaml
opensource_classifier_config:
  provider: databricks
  model: ai_decide
  timeout_ms: 5000
```

LiteLLM 會將不含 `model` 欄位的 System One 請求 POST 到 `POST /api/2.0/ai-functions/ai-decide`，並將分類器呼叫記錄為 `databricks/ai_decide`。AI Function 不回報 token 使用量，因此分類器呼叫以零成本記錄，也不會回傳 `x-litellm-classifier-cost` 標頭。router 專屬的 `api_base` 需要其對應的 `api_key`，因此設定覆寫無法將 workspace token 傳送到其他主機。


## 從儀表板進行設定 {#configure-from-the-dashboard}

自 v1.104.3 起，儀表板會從您已部署的決策模型中選取分類器。請先新增決策模型，可以在 **Models + Endpoints** 下依照 [Add a decision model](/docs/decisions#add-a-decision-model) 新增，或在 `model_list` 中如 [使用已部署的決策模型](#use-a-deployed-decision-model) 所示新增。Laya、Bespoke Nimble 與 Databricks `ai_decide` 部署的運作方式與 Strands Decider 及 Clef 相同。

1. 開啟 **Models + Endpoints → Auto Router** 並建立或編輯一個 router。
2. 在 **Choose your classifier** 下，選取 **Decisions Model**。在 **Decision model** 下，挑選部署，例如 `strands-decider` 或 `clef`。清單只會顯示決策模型的部署。
3. 在 **Advanced classifier settings** 下，將 **Classifier Timeout (ms)** 設為適合該模型的值，接著在模型 warm up 後再調整。
4. 將現有的 completion 部署指派到 `SIMPLE`、`MEDIUM`、`COMPLEX` 和 `REASONING` 分層，並選擇預設模型。
5. 使用 **Test Routing** 搭配具代表性的提示，檢查分類器結果，然後儲存 router。將用戶端請求送到 router 的模型名稱，如[下方](#test-routing-and-send-a-request)所示。

 v1.104.3 之前的儀表板會改為顯示 **OSS Classifier** 以及 **OSS provider** 清單。在該處，請在 gateway 上設定上述[連線變數](#connect-the-classifier-to-the-gateway)，選擇 **Laya** 或 **Bespoke Nimble**，並將 **Classifier Model** 設為您的伺服器支援的名稱。逾時請先從 Laya 的 `15000` 或 Nimble 的 `30000` 開始。

內建 OSS 分類使用隨附的分層條件，且無需 LiteLLM 授權即可使用。自訂指令與自訂分層遵循儀表板中顯示的可用額度。

管理員可以透過管理 API 設定 `api_base` 和 `api_key` 覆寫。明確的 `api_base` 只有在它指名 `LAYA_API_BASE` 或 `BESPOKE_API_BASE` 伺服器時才會繼承環境金鑰；若伺服器需要，請提供其對應的 `api_key`。儀表板會編輯模型與分類器選項，而閘道擁有連線。儲存相同提供者會保留其已儲存的連線；變更提供者會移除先前提供者的端點與金鑰。團隊成員不能透過管理 API 提交端點或憑證覆寫。

## 以 YAML 設定路由器 {#configure-the-router}

這個完整範例使用自架的 Laya 分類器。請先在閘道上設定 [Laya 連線變數](#laya-self-hosted-http-server)。若要使用 Nimble，請以 [Nimble 設定](#nimble-self-hosted-system-one-server) 取代分類器區塊。`small-solver` 和 `large-solver` 是公開部署名稱；請將其底層模型替換為您的閘道可存取的模型：

```yaml title="config.yaml"
model_list:
  - model_name: small-solver
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: large-solver
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: decision-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_default_model: large-solver
      complexity_router_config:
        classifier_type: oss_classifier
        opensource_classifier_config:
          provider: laya
          model: english
          timeout_ms: 15000
        tiers:
          SIMPLE: small-solver
          MEDIUM: small-solver
          COMPLEX: large-solver
          REASONING: large-solver
        classifier_fallback: default_model
        classifier_context_window_size: 0
```

此範例會將分類器失敗路由至 `large-solver`，且不會將任何先前的對話輪次送入分類器。當前請求與選取的系統文字仍會送出。若省略，預設備援為 `heuristic`；預設歷史視窗為前三個使用者輪次，且在 8,000 字元的先前輪次預算內。

## 測試路由並送出請求 {#test-routing-and-send-a-request}

在設定分類器連線變數與您的 completion-provider 憑證後，啟動 LiteLLM：

```bash
litellm --config config.yaml
```

在 **Models + Endpoints → Auto Router** 中，開啟建立或編輯表單，並使用 **Test Routing** 在不呼叫 completion 模型的情況下檢視所選層級與模型。成功的備援並不能證明分類器正常運作：請檢查路由原因與分類器模型。決策模型結果對每個決策模型都使用 `cause: jev_classifier`。Laya 會回報像 `laya/english` 這樣的分類器模型；Nimble 會回報 `bespoke/<model>`，並在可用時使用伺服器回傳的模型；Databricks 則回報 `databricks/ai_decide`。

使用具有 `decision-router` 存取權的 LiteLLM 虛擬金鑰來進行 completion：

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "decision-router",
    "messages": [{"role": "user", "content": "Explain what an HTTP status code means"}]
  }'
```

如果儀表板的 **Decision model** 清單中缺少某個決策模型，請確認其部署使用的是 [提供者清單](/docs/decisions#supported-providers) 中的決策模型，且您的 gateway 帶有決策分類器 <SinceVersion v="1.104.3" />。在較舊的版本上，請確認您的閘道及其儀表板包含上述可用性說明中的變更。較舊的儀表板會將分類器標示為 **JEV Classifier**。

## 呼叫原生決策 API {#call-a-native-decision-api}

設定相符的伺服器 URL，然後使用具有提供者前綴模型存取權的 LiteLLM 虛擬金鑰。本文中名稱欄位會指定原生模型：

| 提供者 | 閘道端點 | 主體 `model` | 虛擬金鑰模型權限 |
| --- | --- | --- | --- |
| Laya | `/laya/v1/systemone` | `english` | `laya/english` |
| Bespoke Nimble | `/bespoke/v1/systemone` | `nimble-latest`（在 Ollama 上為 `nimble`） | `bespoke/nimble-latest`（在 Ollama 上為 `bespoke/nimble`） |
| Databricks `ai_decide` | `/v1/systemone`（OpenAI 格式為 `/v1/decisions`） | `databricks/ai_decide` 的 `model_list` 部署 | 該部署的模型名稱 |

以下 Laya 範例在將端點與主體模型替換為 Nimble 列後，也適用於 Nimble：

```bash
curl http://localhost:4000/laya/v1/systemone \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "english",
    "state": "My invoice has two identical charges",
    "questions": {
      "department": {
        "type": "choice",
        "instructions": "Choose the department that should help",
        "criteria": {
          "billing": "Invoices, payments, and refunds",
          "technical": "Bugs and connectivity problems"
        }
      }
    }
  }'
```

Databricks `ai_decide` 是透過 [統一決策路由](/docs/decisions) 呼叫，而不是提供者前綴路徑：`/v1/systemone` 接受 System One 主體，`/v1/decisions` 接受 OpenAI Decisions 格式。請將 AI Function 加入 `model_list`，並在請求主體中指名該部署：

```yaml
model_list:
  - model_name: databricks-decider
    litellm_params:
      model: databricks/ai_decide
      api_base: os.environ/DATABRICKS_API_BASE
      api_key: os.environ/DATABRICKS_API_KEY
```

```bash
curl http://localhost:4000/v1/systemone \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "databricks-decider",
    "state": "My invoice has two identical charges",
    "questions": {
      "department": {
        "type": "choice",
        "instructions": "Choose the department that should help",
        "criteria": {
          "billing": "Invoices, payments, and refunds",
          "technical": "Bugs and connectivity problems"
        }
      }
    }
  }'
```

LiteLLM 會拆開 Databricks 回傳的 `response` envelope，並保留其 `metadata`。AI Function 不回報 usage 或 model，因此 `usage` 為零且 `model` 為 `null`。完整部署範例請參閱 [Databricks 提供者頁面](/docs/providers/databricks#decisions-ai_decide)。


每個原生 Laya 請求都必須明確選擇 `english`、`multilingual` 或 `typed-decisions`，並且對應的 `laya/<checkpoint>` 模型必須具有權限。不支援未知名稱與自動選擇。回應會保留 Laya 的 `answers`、`usage` 和 `routing` 欄位。兩條原生路由都只支援 System One 請求；`/v1/evaluate`、聊天完成與串流未公開。Nimble 會保留其原生 `answers` 和 `usage` 回應。

## 評估品質與成本 {#evaluate-quality-and-cost}

在變更正式環境路由前，請先用代表性提示比較各層級選擇。機率描述的是所提供的選項；來自不同模型家族的信心分數不可互換為準確度估計。請使用 [評估指南](/docs/auto_router/evaluate) 衡量下游回答品質、分類器延遲、備援頻率與總成本。

Jev 呼叫可能會產生 TypeSafe 費用。自架 Nimble 或 Laya 即使沒有託管推論費用，也會有運算成本。Laya 和 Bespoke Nimble 內建目錄的 token 費率為零；基礎設施則另行付費。Jev 使用 `typesafe/<model>` 分類器記錄命名，Laya 使用 `laya/<checkpoint>`，Bespoke Nimble 使用 `bespoke/<model>`，而 Databricks 使用 `databricks/ai_decide`。Databricks `ai_decide` 以零成本記錄：Databricks 會在您的 workspace 上對 AI Functions 計費，且該函式不回報可供 LiteLLM 定價的 token 使用量。OSS 分類器名稱不會改變路由結果中的 `cause: jev_classifier` 值。

如果分類器發生備援，請檢查端點、checkpoint 名稱、憑證、模型 warm-up 與逾時。逾時也可能會打開分類器 circuit breaker，其預設恢復間隔為 30 秒。請確認伺服器接受 `/v1/systemone`，而不是將該路徑加入 `api_base`。

## 移轉現有的 Jev 或 Nimble 路由器 {#migrate-an-existing-jev-or-nimble-router}

升級到 v1.106.0 或更新版本（其中包含 [backend #43626](https://github.com/BerriAI/litellm/pull/43626)）後，請使用 `classifier_type: oss_classifier`，並將 `jev_classifier_config` 重新命名為 `opensource_classifier_config`。設定 `provider: jev` 並保留現有的模型、端點、憑證與分類器選項。例如，託管的 Jev 設定會變成：

```yaml
classifier_type: oss_classifier
opensource_classifier_config:
  provider: jev
  model: jev-latest
  timeout_ms: 3000
```

新後端仍接受 `classifier_type: jev`、`jev_classifier_config`，以及既有 YAML 與已儲存路由器使用的舊版 `provider: typesafe` 值。請只提供一個分類器設定區塊。包含分類器設定的模型管理建立與更新會寫入標準名稱；若更新未變更該設定，則會保留已儲存的值。

保留 `provider: jev` 的現有設定會繼續使用 TypeSafe 傳輸與環境變數。若要將相容的 Nimble System One 伺服器遷移到 `provider: bespoke`，請選擇 `nimble-latest`、設定 `BESPOKE_API_BASE` 與可選的 `BESPOKE_API_KEY`，並授予 `bespoke/nimble-latest` 的存取權。提供者變更會清除已儲存的 Jev 連線覆寫；管理員必須明確重新提供任何預期的覆寫。新的請求在記錄中會使用 `bespoke/<model>`，而 `cause: jev_classifier` 則保持不變。
