# 以標籤為基礎的政策附件 {#tag-based-policy-attachments}

將防護欄政策自動套用至任何具有特定標籤的金鑰或團隊。不需要逐一附加政策，只要為您的金鑰加上標籤，讓政策引擎處理其餘部分即可。

**範例：** 您的資安團隊要求所有與醫療相關的金鑰都必須執行 PII 遮罩與 PHI 偵測。將這些金鑰標記為 `health`，建立一個單一的以標籤為基礎的附件，所有符合條件的金鑰就會自動套用防護欄。

## 1. 建立包含防護欄的政策 {#1-create-a-policy-with-guardrails}

前往左側邊欄的 **Policies**。您會看到現有政策清單及其防護欄。

![Policies 清單頁面顯示現有政策與 + Add New Policy 按鈕](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/d7aa1e1f-011e-40bf-a356-6dfe9d5d54f1/ascreenshot_8db95c231a7f4a79a36c2a98ba127542_text_export.jpeg)

點擊 **+ Add New Policy**。在彈出視窗中，為您的政策輸入名稱（例如 `high-risk-policy2`）。如果想參照既有政策名稱，也可以輸入文字進行搜尋。

![建立新政策彈出視窗 — 輸入政策名稱與可選描述](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/18f1ff69-9b83-4a98-9aad-9892a104d3ff/ascreenshot_1c6b85231cad4ec695750b53bbbda52c_text_export.jpeg)

向下捲動到 **Guardrails to Add**。點擊下拉選單查看在您的 proxy 上設定的所有可用防護欄 — 選擇此政策應強制執行的項目。

![Guardrails to Add 下拉選單顯示可用防護欄，如 OAI-moderation、phi-pre-guard、pii-pre-guard](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/55cedad7-9939-44a1-8644-a184cde82ab7/ascreenshot_eab4e55b82b8411893eccb6234d60b82_text_export.jpeg)

選取防護欄後，它們會以標籤形式顯示在輸入欄位中。下方的 **Resolved Guardrails** 區段會顯示最終將套用的集合（包含任何從上層政策繼承而來的項目）。

![已選取的防護欄以標籤顯示：testing-pl、phi-pre-guard、pii-pre-guard。下方為 Resolved Guardrails 預覽。](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/c06d5b08-1c85-4715-b827-3e6864880428/ascreenshot_7a082e55f3ad425f9009346c68afae23_text_export.jpeg)

點擊 **Create Policy** 以儲存。

![點擊 Create Policy 以儲存新政策](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/7e6eae64-4bba-4d72-b226-d1308ac576a8/ascreenshot_22d0ed686c594221bbbd2f40df214d75_text_export.jpeg)

## 2. 為政策新增標籤附件 {#2-add-a-tag-attachment-for-the-policy}

建立政策後，切換到 **Attachments** 分頁。您可以在這裡定義政策套用的*位置*。

![切換到 Attachments 分頁 — 顯示附件表格與範圍文件](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/871ae6d9-16d1-44e2-baf2-7bb8a9e72087/ascreenshot_76e124619d70462ea0e2fbb46ded1ac9_text_export.jpeg)

點擊 **+ Add New Attachment**。Attachments 頁面會說明可用的範圍：Global、Teams、Keys、Models 和 **Tags**。

![Attachments 頁面顯示包含 Tags 在內的範圍類型 — 點擊 + Add New Attachment](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/d45ab8bc-fc1e-425b-8a3f-44d18df810ec/ascreenshot_425824030f3144b7ab3c0ac570349b00_text_export.jpeg)

在 **Create Policy Attachment** 彈出視窗中，先從下拉選單選取您剛建立的政策。

![從下拉選單選取要附加的政策（例如 high-risk-policy2）](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/e0dcac40-e39c-4a6a-9d9c-4bbb9ec0ee91/ascreenshot_445b19894e0b466196a13e20c8e67f2d_text_export.jpeg)

將範圍類型選為 **Specific (teams, keys, models, or tags)**。這會展開表單，顯示 Teams、Keys、Models 與 Tags 欄位。

![選取「Specific」範圍類型以顯示 Tags 欄位](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/f685e02a-e22e-4c6c-9742-d5268746214b/ascreenshot_14d63d9d06dd4fc7854cfeb5e8d9ef85_text_export.jpeg)

向下捲動到 **Tags** 欄位並輸入要比對的標籤—這裡我們輸入 `health`。您可以輸入任何字串，或使用萬用字元模式例如 `health-*` 來比對所有以 `health-` 開頭的標籤（例如 `health-team`、`health-dev`）。

![Tags 欄位輸入了 "health"。支援萬用字元，例如 prod-* 可比對 prod-us、prod-eu。](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/14581df7-732c-4ea5-b36d-58270b00e92c/ascreenshot_e734c81418f046549b61a84b9d352a29_text_export.jpeg)

## 3. 檢查附件的影響 {#3-check-the-impact-of-the-attachment}

在建立附件之前，點擊 **Estimate Impact** 預覽會有多少金鑰與團隊受到影響。這是您的爆炸半徑檢查—在套用前請確認範圍符合預期。

![點擊 Estimate Impact — 已輸入標籤 "health" 並可預覽](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/6ccb81d7-3d11-48b0-b634-fc4d738aa530/ascreenshot_2eb89e6ff13a4b12b61004660a36c30c_text_export.jpeg)

**Impact Preview** 會以內嵌方式顯示，精確說明會影響多少金鑰與團隊。在此範例中：「This attachment would affect **1 key** and **0 teams**」，並列出金鑰別名 `hi`。

![Impact Preview 顯示「This attachment would affect 1 key and 0 teams.」Keys: hi](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/8834d85a-2c15-48dd-8d6b-810cf11ee5c4/ascreenshot_d814b42ca9f34c23b0c2269bfa3e64fb_text_export.jpeg)

確認影響範圍無誤後，點擊 **Create Attachment** 進行儲存。

![點擊 Create Attachment 完成建立](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/4a8918f2-eedb-4f49-a53b-4e46d0387d2a/ascreenshot_b08d490d836d4f46b4e5cbb14f61377a_text_export.jpeg)

現在附件會出現在表格中，並顯示政策名稱 `high-risk-policy2` 與標籤 `health`。

![Attachments 表格顯示新附件，政策為 high-risk-policy2，標籤為 "health"](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/45867887-0aec-44a4-963b-b6cc6c302e3e/ascreenshot_981caeff98574ec89a8a53cd295e5043_text_export.jpeg)

## 4. 建立帶有該標籤的金鑰 {#4-create-a-key-with-the-tag}

前往左側邊欄的 **Virtual Keys**。點擊 **+ Create New Key**。

![Virtual Keys 頁面顯示現有金鑰 — 點擊 + Create New Key](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/4c1f9448-e590-4546-9357-6f68aa395b27/ascreenshot_4a7bc5be9e4347f3a9fe46f78d938d7c_text_export.jpeg)

輸入金鑰名稱並選擇模型。接著展開 **Optional Settings**，向下捲動到 **Tags** 欄位。

![建立新金鑰彈出視窗 — 輸入金鑰名稱](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/f84f7a2b-8057-4926-9f80-d68e437c77cf/ascreenshot_a277c8611b6e41059663b0759cd85cab_text_export.jpeg)

在 **Tags** 欄位中輸入 `health` 並按 Enter。這是政策引擎將進行比對的標籤。

![金鑰建立中的 Tags 欄位 — 輸入 "health" 以新增標籤](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/3ad3bf10-76d2-4f15-9a66-ed6c99bb25c4/ascreenshot_8a8773fb65fc49329cb1716da92b2723_text_export.jpeg)

標籤 `health` 現在會以標籤形式顯示在 Tags 欄位中。請確認您的設定看起來正確。

![Tags 欄位顯示已選取 "health" 並帶有核取記號](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/de3e58a9-6013-4d0c-882e-5517ea286684/ascreenshot_c7eef1736fce4aa894ac3b118b3800a2_text_export.jpeg)

點擊表單底部的 **Create Key**。

![點擊 Create Key 以產生帶有 health 標籤的新虛擬金鑰](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/51d419ea-ee80-4e24-8e93-b99a844881bc/ascreenshot_097d4564289943a88e30b5d2e3eab262_text_export.jpeg)

會出現一個對話框顯示您的新虛擬金鑰。點擊 **Copy Virtual Key** — 下一步測試時會需要這個金鑰。

![儲存您的金鑰對話框 — 點擊 Copy Virtual Key 將其複製到剪貼簿](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/e87a0cc1-4d12-4066-bfa2-973159808fd1/ascreenshot_7b616a7291d0497a9c61bdcdb59394d7_text_export.jpeg)

## 5. 測試金鑰並驗證政策已套用 {#5-test-the-key-and-validate-the-policy-is-applied}

前往左側邊欄的 **Playground** 以互動方式測試金鑰。

![從側邊欄前往 Playground](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/e6f8a3ee-e9e8-4107-93d1-bfca734c5ce9/ascreenshot_539bde38abe646e49148a912fff2d257_text_export.jpeg)

在 **Virtual Key Source** 下，選擇「Virtual Key」並將剛複製的金鑰貼到輸入欄位中。

![將虛擬金鑰貼到 Playground 設定中](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/a6612c4a-d499-4e54-8019-f54fde674ad9/ascreenshot_e85ebb9051554594bab0da57823fafad_text_export.jpeg)

從 **Select Model** 下拉選單選取模型。

![從下拉選單選取模型（例如 bedrock-claude-opus-4.5）](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/325e330f-3eff-4c5e-b177-21916138a2f5/ascreenshot_693478f89c034e949e08f3ed0dd05120_text_export.jpeg)

輸入訊息並按 Enter。如果某個防護欄封鎖了請求，您會在回應中看到。在此範例中，`testing-pl` 防護欄偵測到電子郵件樣式並回傳 403 錯誤—確認政策正在運作。

![防護欄生效 — 請求被封鎖並顯示「Content blocked: email pattern detected」](https://colony-recorder.s3.amazonaws.com/files/2026-02-11/2cf16809-d2e5-4eae-a7dd-6a16dfcca7ce/ascreenshot_727d7d4ed20b4a52b2b41e39fd36eccb_text_export.jpeg)

**使用 curl：**

您也可以透過命令列驗證。回應標頭會確認套用了哪些政策與防護欄：

```bash
curl -v http://localhost:4000/chat/completions \
  -H "Authorization: Bearer <your-tagged-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "say hi"}]
  }'
```

檢查回應標頭：

```
x-litellm-applied-policies: high-risk-policy2
x-litellm-applied-guardrails: pii-pre-guard,phi-pre-guard,testing-pl
x-litellm-policy-sources: high-risk-policy2=tag:health
```

| 標頭 | 它告訴您的內容 |
|--------|-------------------|
| `x-litellm-applied-policies` | 哪些政策符合這次請求 |
| `x-litellm-applied-guardrails` | 實際執行了哪些防護欄 |
| `x-litellm-policy-sources` | 每個政策為何會符合—`tag:health` 可確認是標籤 |
