# 政策流程建構器 {#policy-flow-builder}

Policy Flow Builder 可讓您透過**條件式執行**來設計防護欄管線。它不是讓防護欄彼此獨立執行，而是將它們串接成有順序的步驟，並控制每個防護欄**通過**、**政策檢查失敗**（內容干預）或發生**技術錯誤**（例如逾時、提供者無法連線、缺少防護欄）時會發生什麼事。

它支援兩種強大模式：**防護欄備援**（某個防護欄失敗時改用另一個防護欄）以及**重試同一個防護欄**（如果相同防護欄失敗，就再次執行它，例如處理暫時性錯誤）。透過 **`on_error`**，您可以將**技術性**失敗與**政策**失敗分開處理——例如，當主要 API 發生錯誤時切換到另一個提供者，同時仍對被標記的內容進行阻擋。

## 何時使用 Flow Builder {#when-to-use-the-flow-builder}

| 做法 | 使用情境 |
|----------|----------|
| **簡單政策** (`guardrails.add`) | 所有防護欄並行執行；任何失敗都會封鎖請求。 |
| **Flow Builder**（管線） | 防護欄依序執行；您可為每個步驟選擇動作（下一步、封鎖、允許、自訂回應）。 |

當您需要以下情況時，請使用 Flow Builder：

- **防護欄備援** — 使用 `on_fail: next` 在某個防護欄失敗時嘗試不同的防護欄（例如，快速過濾器 → 更嚴格的過濾器）
- **重試同一個防護欄** — 將同一個防護欄加入多個步驟；如果它失敗，`on_fail: next` 會移到下一個步驟，而下一個步驟也可以是同一個防護欄（適合處理暫時性的 API 錯誤或速率限制）
- **條件式路由** — 例如，若快速防護欄失敗，改執行更進階的防護欄，而不是立即封鎖
- **自訂回應** — 當防護欄失敗時，回傳特定訊息而不是通用封鎖訊息
- **資料串接** — 將修改後的資料（例如已遮罩 PII 的內容）從一個步驟傳到下一個步驟
- **細緻控制** — 每個步驟在通過與失敗時採取不同動作
- **技術錯誤路由** — 將 `on_error` 與 `on_fail` 分開設定，讓服務中斷或逾時時可以**允許**、**封鎖**、**進入下一步**，或回傳**自訂回應**，而不會將它們與內容違規混為一談

## 概念 {#concepts}

### 管線 {#pipeline}

一個管線包含：

- **模式**：`pre_call`（在 LLM 之前）或 `post_call`（在 LLM 之後）
- **步驟**：按順序排列的防護欄步驟清單

### 結果：通過、失敗與錯誤 {#outcomes-pass-fail-and-error}

每次步驟執行會產生以下三種結果之一：

| 結果 | 意義 | 常見原因 |
|--------|---------|----------------|
| **pass** | 防護欄已完成且未封鎖 | 內容被允許，或資料已被修改並回傳 |
| **fail** | 政策干預 | 防護欄觸發了干預（例如標記內容、封鎖請求） |
| **error** | 技術失敗 | 逾時、網路錯誤、防護欄未註冊，或其他非干預例外 |

`on_pass` 與 `on_fail` 分別套用於 **pass** 與 **fail**。**`on_error`** 僅套用於 **error**。如果省略 `on_error`，管線會對 error 結果使用 **`on_fail`**（向後相容）。

### 步驟動作 {#step-actions}

對於每個步驟，您可以為 **pass**、**fail**，以及（可選）**error** 選擇一個動作。允許的值為：`next`、`allow`、`block`、`modify_response`。

| 動作 | 說明 |
|--------|-------------|
| **下一步** (`next`) | 繼續到管線中的下一個 guardrail |
| **允許** (`allow`) | 停止管線並允許請求繼續 |
| **封鎖** (`block`) | 停止管線並封鎖請求 |
| **自訂回應** (`modify_response`) | 傳回自訂訊息，而非預設的封鎖 |

### 步驟選項 {#step-options}

| 欄位 | 類型 | 說明 |
|-------|------|--------------|
| `guardrail` | `string` | 要執行的 guardrail 名稱 |
| `on_pass` | `string` | 結果為 **pass** 時的動作：`next`、`allow`、`block`、`modify_response` |
| `on_fail` | `string` | 結果為 **fail**（政策介入）時的動作：`next`、`allow`、`block`、`modify_response` |
| `on_error` | `string`（選填） | 結果為 **error**（技術性）時的動作。如果省略，**error** 會使用 `on_fail`。 |
| `pass_data` | `boolean` | 將修改後的請求資料（例如已遮罩的 PII）傳遞到下一步 |
| `modify_response_message` | `string` | 使用 `modify_response` 動作時的自訂訊息 |

## 使用 Flow Builder（UI） {#using-the-flow-builder-ui}

1. 前往 LiteLLM 管理 UI 中的 **Policies**
2. 按一下 **+ Create New Policy** 或現有政策上的 **Edit**
3. 選取 **Flow Builder**（而非簡易表單）
4. 設計您的流程：
   - **Trigger** — 傳入的 LLM 請求（當政策符合時執行）
   - **Steps** — 新增 guardrail；依每一步設定 **ON PASS**、**ON FAIL**，以及 **ON API FAILURE** / **ON ERROR**（當 **ON API FAILURE** 未設定時，技術性錯誤會遵循 **ON FAIL**）
   - **End** — 當管線允許時，請求會繼續傳送至 LLM
5. 在步驟之間使用 **+** 來插入另一個 guardrail 步驟（用於備援、重試，或更嚴格的第二次檢查）
6. 使用 **Test Pipeline** 在儲存前執行範例訊息
7. 按一下 **Save Policy**（或 **Save**）以建立或更新政策

### 在 UI 中設定 guardrail 備援（逐步操作） {#configure-guardrail-fallbacks-in-the-ui-walkthrough}

1. 按一下 **Policies**

![管理 UI 中的 Policies 分頁](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/1333f4ae-d7df-4645-bd33-fee11c80cb96/ascreenshot_ce21e8bd79324c4685ad6c191e39d89e_text_export.jpeg)

2. 按一下 **+ Add New Policy**

![新增政策](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/353c08ab-cdb5-490f-b54f-734f77c87c45/ascreenshot_223033a61071485187e87cbb8c41081e_text_export.jpeg)

3. 按一下 **Flow Builder**

![選擇流程建構器](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/70e99d1b-fd76-4143-93f4-296b8b4c3904/ascreenshot_ef49b2e2c5dc40e39cf8da7a37f346ac_text_export.jpeg)

4. 按一下 **Continue to Builder**

![繼續前往建構器](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/3de1beaf-9c52-4f03-9100-ce4d47e41967/ascreenshot_a1d64e7e58c54b6cb8a311173ffe435a_text_export.jpeg)

5. 在第一個步驟中按一下 **guardrail search** 欄位

![選取第一個防護欄 — 搜尋欄位](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/640f699b-bdde-4e6d-a226-1fede9477b22/ascreenshot_27f14445b78b4e61872f3f95c1c9bacd_text_export.jpeg)

6. 選擇 **Test Moderation**（或您的主要 guardrail）

![選擇 Test Moderation](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/d46f7ab6-4231-44fb-b377-59f817cdfbe5/ascreenshot_e3a9f8e25ffe46ad82a73641b81d157c_text_export.jpeg)

7. 對於其中一個分支（例如 **ON API FAILURE**），將動作設為 **Next Step**，這樣當 API 發生錯誤時，流程就可以直接往下進到下一個 guardrail

![將動作設為下一步](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/3a7ddc2a-4317-417b-9341-ff6b0913e64b/ascreenshot_8878486dc12b4dddafe0c8ba4382a0fb_text_export.jpeg)

8. 對於 **ON PASS**，設定為 **Allow**（如果在允許之前還需要更多步驟，則可設定為 **Next Step**）

![將通過設為允許](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/0e31cde8-3075-4e17-b771-b2b1696db98f/ascreenshot_b4b1d232459e4941904c9fbcf90c70ca_text_export.jpeg)

9. 開啟下一個結果的搜尋/下拉選單（例如 **ON FAIL**）

![設定另一個分支 — 搜尋欄位](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/715fc3ad-f245-4ee8-bb36-cc13400d635d/ascreenshot_395fece82c124d4d826fb5d84c9c0529_text_export.jpeg)

10. 如果失敗檢查應該繼續到您的備援 guardrail，請將該分支設為 **Next Step**

![失敗或分支時 — 下一步](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/83156e9b-fc3f-4cc2-a6cb-2a13a5e77b06/ascreenshot_c61429bf7b354063afc57c40a6b45c7a_text_export.jpeg)

11. 按一下步驟之間的 **+** 來新增第二個 guardrail

![新增步驟 — 加號控制項](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/e76cff13-af73-4775-90f6-4d29cb97d401/ascreenshot_52c478e7afd5410f9f63b616c753c851_text_export.jpeg)

12. 在新步驟上開啟 guardrail 搜尋欄位

![第二個步驟 — 防護欄搜尋](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/5c1c4eea-d7da-41e5-bebd-945e97562aa5/ascreenshot_cef70e9146b148b1936e721638de0783_text_export.jpeg)

13. 選擇 **Insults & Personal Attacks**（或您的備援 / 更嚴格 guardrail）

![選擇辱罵與人身攻擊](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/e796c733-351f-494f-9261-795c27f2b519/ascreenshot_f0f778d50c2146e48829ffb203c7de92_text_export.jpeg)

14. 依需要將此步驟的分支設定為 **Next Step** 或 **Block**

![第二個步驟分支 — 下一步](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/c5fad953-4f4b-47ec-ab6d-81d21b2fb7b8/ascreenshot_b515fadec0534c6a9b9d66091398d82d_text_export.jpeg)

15. 當此 guardrail 應成功完成流程時，將 **ON PASS** 設為 **Allow**

![第二個步驟 — 通過時允許](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/8210f32a-8704-41b1-97cc-7d183682a2a4/ascreenshot_23361af2b7da482a8d89025ab285a72e_text_export.jpeg)

16. 開啟您要使用 **Custom Response** 的分支（例如最後一步的 **ON FAIL**）

![自訂回應 — 開啟分支選擇器](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/98ab3a2c-f22f-4478-a146-d5d26cae9b10/ascreenshot_6a3b673654e64ce29c8c93fbf30c52ed_text_export.jpeg)

17. 選擇 **Custom Response**

![選擇自訂回應](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/a9e69e82-d517-4426-95da-034643a2388b/ascreenshot_f8ef581fbfb440cdbf145a2e9368c8e8_text_export.jpeg)

18. 按一下 **Enter custom response...** 並輸入您的訊息

![自訂回應文字欄位](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/ef0f90ba-d0bc-4220-874f-4998b2dcc5f6/ascreenshot_f3e825b57fa0478a92f56840af266e03_text_export.jpeg)

19. 視需要在 **Enter custom response...** 中確認或編輯訊息

![自訂回應 — 確認訊息](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/f9a4711d-655c-4f15-b0ea-6b7d33fe6e60/ascreenshot_5df4b465bc484d8f86a4af5a45e9ab42_text_export.jpeg)

20. 開啟 **Test Pipeline**

![Test Pipeline 面板](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/3f9ac555-66fe-43e0-a8d8-2288a5966c73/ascreenshot_b2319dae363346ebb4da5d09180b56e8_text_export.jpeg)

21. 按一下 **Run Test**

![執行測試](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/8e21e973-8193-404b-9d97-fd85be5f90b6/ascreenshot_619ca71e3be244449ca2ab01dde3cc45_text_export.jpeg)

22. 在結果中展開 **Step 1**（或第一個 guardrail 列），查看 **ERROR** / **Next Step** 與 **PASS** / **Allow** 的差異

![展開測試結果中的第一個步驟](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/b8010e20-dd9a-4e59-b0ca-1f2ba4c7b6ac/ascreenshot_da99f5761bbf44a08af4f1e1175a95fc_text_export.jpeg)

23. 展開 **Step 2**（例如 **Insults & Personal Attacks**），確認備援後的 **PASS** 和 **Allow**

![展開步驟 2 — 第二個防護欄結果](https://colony-recorder.s3.amazonaws.com/files/2026-04-15/cac5273c-dd4f-48a0-af58-12c428d0f0d0/ascreenshot_f74da58e280a47319a7d2fa41519f4fb_text_export.jpeg)

## 設定（YAML） {#config-yaml}

在您的 policy 設定中定義 pipeline：

```yaml showLineNumbers title="config.yaml"
guardrails:
  - guardrail_name: pii_masking
    litellm_params:
      guardrail: presidio
      mode: pre_call

  - guardrail_name: prompt_injection
    litellm_params:
      guardrail: lakera
      mode: pre_call

policies:
  my-pipeline-policy:
    description: "PII mask first, then check for prompt injection"
    guardrails:
      add:
        - pii_masking
        - prompt_injection
    pipeline:
      mode: pre_call
      steps:
        - guardrail: pii_masking
          on_pass: next
          on_fail: block
          pass_data: true
        - guardrail: prompt_injection
          on_pass: allow
          on_fail: block

policy_attachments:
  - policy: my-pipeline-policy
    scope: "*"
```

## 備援與重試 {#fallbacks-and-retries}

### guardrail 備援 {#guardrail-fallbacks}

使用 `on_fail: next` 在某個 guardrail 失敗時切換到另一個 guardrail。先執行較輕量的 guardrail；如果失敗，則升級到更嚴格或不同的提供者：

```yaml
policies:
  fallback-policy:
    guardrails:
      add:
        - fast_content_filter
        - strict_content_filter
    pipeline:
      mode: pre_call
      steps:
        - guardrail: fast_content_filter
          on_pass: allow
          on_fail: next
        - guardrail: strict_content_filter
          on_pass: allow
          on_fail: block
```

如果 `fast_content_filter` 通過 → 允許。若失敗 → 執行 `strict_content_filter`；通過 → 允許，失敗 → 封鎖。

### 重試相同的 guardrail {#retrying-the-same-guardrail}

將同一個 guardrail 作為多個步驟加入，以便在失敗時重試。適用於暫時性錯誤（API 逾時、速率限制）：

```yaml
policies:
  retry-policy:
    guardrails:
      add:
        - lakera_prompt_injection
    pipeline:
      mode: pre_call
      steps:
        - guardrail: lakera_prompt_injection
          on_pass: allow
          on_fail: next
        - guardrail: lakera_prompt_injection
          on_pass: allow
          on_fail: block
```

第一次嘗試通過 → 允許。第一次嘗試失敗 → 重新嘗試同一個 guardrail；第二次通過 → 允許，第二次失敗 → 封鎖。

## 技術錯誤與政策失敗（`on_error`） {#technical-errors-vs-policy-failures-on_error}

當您希望 **API/基礎架構問題** 與 **內容政策** 違規採取不同行為時，請使用 **`on_error`**。

- **`on_fail`** — 當 guardrail **介入** 時執行（例如：偵測到有害內容、PII）。
- **`on_error`** — 當步驟以 **錯誤** 結束時執行（逾時、連線失敗、guardrail 未載入等）。如果省略 `on_error`，**錯誤** 結果會使用 **`on_fail`**。

範例：對不良內容封鎖，但如果主要掃描器停擺，則改用第二個 guardrail，而不是封鎖每一個請求：

```yaml
policies:
  error-fallback-policy:
    guardrails:
      add:
        - primary_scanner
        - backup_scanner
    pipeline:
      mode: pre_call
      steps:
        - guardrail: primary_scanner
          on_pass: allow
          on_fail: block
          on_error: next
        - guardrail: backup_scanner
          on_pass: allow
          on_fail: block
          on_error: allow
```

如果 `primary_scanner` 發生錯誤 → 執行 `backup_scanner`。如果 `backup_scanner` 發生錯誤 → 允許該請求（若您偏好 fail-closed，請將 `on_error` 設為 `block`）。

## 範例：失敗時自訂回應 {#example-custom-response-on-fail}

改為回傳品牌化訊息，而非一般性的封鎖：

```yaml
policies:
  branded-block-policy:
    guardrails:
      add:
        - pii_detector
    pipeline:
      mode: pre_call
      steps:
        - guardrail: pii_detector
          on_pass: allow
          on_fail: modify_response
          modify_response_message: "Your message contains sensitive information. Please remove PII and try again."
```

## 測試管線（API） {#test-a-pipeline-api}

在附加之前，先用範例訊息測試 pipeline：

```bash
curl -X POST "http://localhost:4000/policies/test-pipeline" \
  -H "Authorization: Bearer <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline": {
      "mode": "pre_call",
      "steps": [
        {
          "guardrail": "pii_masking",
          "on_pass": "next",
          "on_fail": "block",
          "pass_data": true
        },
        {
          "guardrail": "prompt_injection",
          "on_pass": "allow",
          "on_fail": "block"
        }
      ]
    },
    "test_messages": [
      {"role": "user", "content": "What is 2+2?"},
      {"role": "user", "content": "My SSN is 123-45-6789"}
    ]
  }'
```

回應包含各步驟結果（通過/失敗/錯誤）、採取的動作，以及時間資訊。

## 管線與簡單 policy 的比較 {#pipeline-vs-simple-policy}

當某個 policy 具有 `pipeline` 時，pipeline 會定義執行順序與動作。`guardrails.add` 清單必須包含 pipeline 步驟中使用的所有 guardrail。

| Policy 類型 | 執行 |
|-------------|-----------|
| Simple（僅 `guardrails.add`） | 所有 guardrail 都會執行；任何失敗都會封鎖 |
| Pipeline（已存在 `pipeline`） | 依序執行步驟；動作控制流程 |

## 相關文件 {#related-docs}

- [Guardrail Policies](./guardrail_policies) — 政策基本概念、附加、繼承
- [Policy Templates](./policy_templates) — 預先建立的 policy 範本
