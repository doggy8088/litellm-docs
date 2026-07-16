# 除錯成本差異 {#debugging-a-cost-discrepancy}

LiteLLM 與您的提供者帳單之間的成本差異，通常來自三個面向之一：token 匯入、LiteLLM 套用的成本公式，或模型對照表中過時或錯誤的定價。本頁將說明如何判斷您屬於哪一種情況。

## 步驟 1：選擇時間範圍 {#step-1-pick-a-time-range}

先鎖定一個可看出差異的特定時間區間。

- 能用的話，請至少使用 7 天的資料。
- 優先選擇使用量穩定的區間，避免單次尖峰主導比較結果。
- 在您的提供者儀表板與 LiteLLM UI 上，設定**相同的開始與結束時間**。

![LiteLLM 儀表板日期範圍選擇器](/img/cost-discrepancy-debug/date-range-picker.png)

## 步驟 2：確認流量只經由 LiteLLM {#step-2-confirm-traffic-only-goes-through-litellm}

如果有任何請求直接打到提供者（繞過 LiteLLM），提供者就會顯示較高的使用量。這是預期行為，不是 LiteLLM 的錯誤。

繼續前請先確認：

- 所有用戶端都使用您的 LiteLLM proxy base URL。
- 沒有任何 SDK 或腳本針對您正在比較的模型，直接使用提供者 API 金鑰連到提供者。
- 在所選期間內，相關模型只透過 LiteLLM 被呼叫。

如果您不確定，請依 LiteLLM 使用的 API 金鑰或 IAM principal 篩選提供者儀表板，而不是拿整個帳戶來比較。

## 步驟 3：比較 token 類別 {#step-3-compare-token-categories}

在 LiteLLM UI 中，開啟 **Model activity**（位於 Usage analytics 下方），即可檢視每個模型的支出與 token。

![在 LiteLLM UI 中導覽至 Model activity](/img/cost-discrepancy-debug/go-to-model-activity.png)

捲動 **Model** 清單，並選取您要與提供者帳單對帳的模型。

![在 Model activity 表格中捲動至您的模型](/img/cost-discrepancy-debug/scroll-to-model.png)

在兩邊使用相同的時間範圍後，填入：

| 類別 | LiteLLM | 提供者 | 差異 |
| --- | --- | --- | --- |
| 總請求數 | — | — | — |
| 輸入 token | — | — | — |
| 輸出 token | — | — | — |
| 快取讀取 token | — | — | — |
| 快取寫入 token | — | — | — |

LiteLLM 會針對所選模型顯示各類別 token 使用量，例如 prompt、completion，以及與快取相關的 token。

![依 token 類別顯示 LiteLLM 使用量明細](/img/cost-discrepancy-debug/token-categories.png)

請將這些數字與您提供者的使用量檢視畫面（例如 AWS billing tools、Azure Monitor 或 OpenAI usage dashboard）在相同期間內的資料進行比較。

### 快取 token 回報 {#cache-token-reporting}

- **OpenAI：** 快取讀取 token 通常會包含在回報的輸入 token 數量中。
- **Anthropic：** 快取讀取 token 通常會與未快取的輸入 token 分開回報。

請比較雙方正確的欄位，避免在不同儀表板之間以不同方式解讀「輸入」。

### 為什麼使用 10% 門檻？ {#why-use-a-10-threshold}

提供者儀表板與 LiteLLM 不會在完全相同的時間戳記上為請求分桶。晚上 11:59 的一個呼叫，在兩邊可能會落入不同的每日總計。由於不同 SDK 與 API 的四捨五入方式，token 數量也可能略有差異。**低於約 10%** 的差異，通常可由邊界效應與四捨五入解釋；**高於約 10%** 的差異，通常表示有東西被計算錯誤、遺漏，或分類不同。

## 步驟 4：走對應的路徑 {#step-4-follow-the-right-path}

<svg width="100%" viewBox="0 0 680 482" role="img" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', fontFamily: 'system-ui, sans-serif' }} aria-labelledby="cost-disc-flow-title">
  <title id="cost-disc-flow-title">成本差異除錯流程圖</title>
  <desc>流程圖分支到路徑 A（token 匯入），或路徑 B，並進一步分成 B1（公式問題）與 B2（模型對照表問題）。</desc>
  <defs>
    <marker id="cd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#888780" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </marker>
  </defs>

  <rect x="215" y="24" width="250" height="44" rx="8" fill="#F1EFE8" stroke="#5F5E5A" strokeWidth="0.5" />
  <text x="340" y="47" textAnchor="middle" dominantBaseline="central" fill="#444441" fontSize="14" fontWeight="500">比較提供者與 LiteLLM</text>

  <line x1="340" y1="68" x2="340" y2="104" stroke="#888780" strokeWidth="1.5" markerEnd="url(#cd-arrow)" />

  <rect x="175" y="104" width="330" height="56" rx="8" fill="#F1EFE8" stroke="#5F5E5A" strokeWidth="0.5" />
  <text x="340" y="126" textAnchor="middle" dominantBaseline="central" fill="#444441" fontSize="14" fontWeight="500">是否有任何類別偏差超過 10%？</text>
  <text x="340" y="148" textAnchor="middle" dominantBaseline="central" fill="#5F5E5A" fontSize="12">請求、輸入、輸出、快取 token</text>

  <path d="M220 132 L100 132 L100 250" fill="none" stroke="#0F6E56" strokeWidth="1.5" markerEnd="url(#cd-arrow)" />
  <text x="157" y="122" textAnchor="middle" fill="#0F6E56" fontSize="12">是</text>

  <path d="M505 132 L580 132 L580 250" fill="none" stroke="#993C1D" strokeWidth="1.5" markerEnd="url(#cd-arrow)" />
  <text x="543" y="122" textAnchor="middle" fill="#993C1D" fontSize="12">否</text>

  <rect x="40" y="250" width="220" height="56" rx="8" fill="#E1F5EE" stroke="#0F6E56" strokeWidth="0.5" />
  <text x="150" y="271" textAnchor="middle" dominantBaseline="central" fill="#085041" fontSize="14" fontWeight="500">路徑 A</text>
  <text x="150" y="291" textAnchor="middle" dominantBaseline="central" fill="#0F6E56" fontSize="12">Token 匯入問題</text>

  <rect x="420" y="250" width="220" height="56" rx="8" fill="#FAECE7" stroke="#993C1D" strokeWidth="0.5" />
  <text x="530" y="271" textAnchor="middle" dominantBaseline="central" fill="#712B13" fontSize="14" fontWeight="500">路徑 B</text>
  <text x="530" y="291" textAnchor="middle" dominantBaseline="central" fill="#993C1D" fontSize="12">數量一致，成本不同</text>

  <line x1="150" y1="306" x2="150" y2="370" stroke="#0F6E56" strokeWidth="1.5" markerEnd="url(#cd-arrow)" />

  <line x1="530" y1="306" x2="530" y2="318" stroke="#854F0B" strokeWidth="1.5" />
  <line x1="435" y1="318" x2="575" y2="318" stroke="#854F0B" strokeWidth="1.5" />
  <line x1="435" y1="318" x2="435" y2="370" stroke="#854F0B" strokeWidth="1.5" markerEnd="url(#cd-arrow)" />
  <line x1="575" y1="318" x2="575" y2="370" stroke="#854F0B" strokeWidth="1.5" markerEnd="url(#cd-arrow)" />
  <text x="448" y="312" textAnchor="middle" fill="#854F0B" fontSize="11">B1</text>
  <text x="562" y="312" textAnchor="middle" fill="#854F0B" fontSize="11">B2</text>

  <rect x="40" y="370" width="220" height="56" rx="8" fill="#E1F5EE" stroke="#0F6E56" strokeWidth="0.5" />
  <text x="150" y="391" textAnchor="middle" dominantBaseline="central" fill="#085041" fontSize="14" fontWeight="500">回報給 LiteLLM 團隊</text>
  <text x="150" y="411" textAnchor="middle" dominantBaseline="central" fill="#0F6E56" fontSize="12">端點 + 模型 + 截圖</text>

  <rect x="380" y="370" width="110" height="56" rx="8" fill="#FAEEDA" stroke="#854F0B" strokeWidth="0.5" />
  <text x="435" y="391" textAnchor="middle" dominantBaseline="central" fill="#633806" fontSize="14" fontWeight="500">B1</text>
  <text x="435" y="411" textAnchor="middle" dominantBaseline="central" fill="#854F0B" fontSize="12">修正公式</text>

  <rect x="510" y="370" width="130" height="56" rx="8" fill="#FAEEDA" stroke="#854F0B" strokeWidth="0.5" />
  <text x="575" y="391" textAnchor="middle" dominantBaseline="central" fill="#633806" fontSize="14" fontWeight="500">B2</text>
  <text x="575" y="411" textAnchor="middle" dominantBaseline="central" fill="#854F0B" fontSize="12">修正模型對照表</text>

  <path d="M150 426 L150 442 L340 442" fill="none" stroke="#888780" strokeWidth="0.5" strokeDasharray="4 3" />
  <path d="M340 442 L435 442 L435 428" fill="none" stroke="#888780" strokeWidth="0.5" strokeDasharray="4 3" />
  <path d="M340 442 L575 442 L575 428" fill="none" stroke="#888780" strokeWidth="0.5" strokeDasharray="4 3" />
  <text x="340" y="454" textAnchor="middle" fill="#5F5E5A" fontSize="11">如果兩條路徑都無法解決，</text>
  <text x="340" y="470" textAnchor="middle" fill="#5F5E5A" fontSize="11">請開立 github issue，並附上您的所有資料</text>
</svg>

## 路徑 A：Token 數量不符 {#path-a-token-quantity-mismatch}

如果任何類別偏差超過約 10%，LiteLLM 可能沒有正確匯入該類別（或提供者儀表板對 token 的分類不同——請先重新檢查步驟 3）。

**請提供給 LiteLLM 團隊的內容：**

1. 兩個儀表板在顯示日期範圍時的截圖。
2. 哪個類別有差異（輸入、輸出、快取讀取、快取寫入，或請求數）。
3. 使用的端點（例如 `/chat/completions`、`/responses`、`/embeddings`）。
4. 請求中傳送的模型名稱（例如 `anthropic.claude-opus-4-5`、`gpt-4o`）。

### 供維護者除錯 ingestion {#for-maintainers-debugging-ingestion}

1. 以 verbose logging 啟動 proxy，例如：
   ```bash
   litellm --config config.yaml --detailed_debug
   ```
2. 使用回報的 endpoint 和 model 重現單一請求。
3. 檢查每個 streamed chunk（若有 streaming）或最終 response body 中的原始 `usage` object。
4. 將其與標準 logging object（或該次呼叫的 UI request log）比較。
5. 原始 provider usage 與 LiteLLM 記錄或彙總之間的任何落差，都是 ingestion 可能出錯的地方。

## 路徑 B：數量一致但 cost 錯誤 {#path-b-quantities-match-but-cost-is-wrong}

如果 token 和 request 計數在約 10% 內一致，但金額不同，請聚焦於 cost 的計算方式。

### B1：公式問題 {#b1-formula-issue}

使用 provider 的 token breakdown 與公布費率（每百萬 tokens 或每 token）手動計算預期 cost。

加上 provider 適用的其他計費維度（例如 cache 建立、audio，或 tier surcharge）。如果您的手動計算與 provider 帳單一致，但與 LiteLLM 不一致，則 LiteLLM 中該 provider 或 modality 的實作可能有誤。

### B2：model map 問題 {#b2-model-map-issue}

如果公式結構與 provider 的計費方式一致，LiteLLM 的 model map 中的值可能已過時或不正確。請交叉檢查：

- [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)
- provider 目前的公開定價

檢查您確切 model id（包含 provider 前綴）的 `input_cost_per_token`、`output_cost_per_token`，以及任何與 cache 相關的定價欄位。

### 供維護者 {#for-maintainers}

1. 以使用者的 provider 報告取得權威性的 token 數量。
2. 推導出可重現 provider 明細項目的公式。
3. 將其與 LiteLLM 對同一 provider 與回應形狀的 cost 路徑進行 diff。
4. 如果公式一致但數值不同，請更新 `model_prices_and_context_window.json` 中的定價（並遵循該檔案的專案同步 / 備份規則）。
5. 如果程式碼中的公式有誤，請修正計算並使用使用者的 token breakdown 新增迴歸測試。

## 還卡住嗎？ {#still-stuck}

1. 在 [BerriAI/litellm](https://github.com/BerriAI/litellm) 開立 GitHub issue，附上您的 Step 3 比較表、endpoints，以及 model 名稱。

在 issue 中，以下資訊很有幫助：

- 可按需重現，還是間歇性發生？
- 單一 model 還是多個？
- 隨時間穩定，還是從特定 release date 或 config 變更開始？

### 供 LiteLLM 維護者 {#for-litellm-maintainers}

如果在 triage 後 Path A 和 Path B 都無法結案，**您**應該主動聯繫並**安排與客戶的通話**（support 或 engineering），並帶上 Step 3 表格和截圖——在將此問題定性之前。

## 檢查清單 {#checklist}

```
□ Same time range on both dashboards
□ Confirmed no direct-to-provider traffic for those models
□ Compared: requests, input tokens, output tokens, cache tokens
□ Noted cache reporting differences (OpenAI vs Anthropic, and so on)
□ If > ~10% delta on quantities → Path A: report with screenshots, endpoints, model names
□ If quantities match → Path B: verify formula (B1) and model map pricing (B2)
□ If neither path fits → open a GitHub issue.
```

## 另請參閱 {#see-also}

- [支出追蹤](../proxy/cost_tracking)
- [從 GitHub 同步 model pricing](../proxy/sync_models_github)
