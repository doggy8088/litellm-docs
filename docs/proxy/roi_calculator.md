---
title: ROI 計算器
draft: true
description: 比較 GitHub 與 GitLab 叢集中每位工程師的交付速度、問題趨勢，以及記錄的 AI 支出
---

# ROI 計算器 {#roi-calculator}

比較您團隊的合併變更、合併時間、錯誤回報，以及 GitHub 與 GitLab 叢集中記錄的 AI 支出

ROI 計算器結合儲存庫活動與您的 LiteLLM 閘道所記錄的支出。將儲存庫帳戶連結到內部使用者，即可查看每位工程師的交付速度與每次合併變更的支出。請在管理員 UI 中開啟 **Observability > ROI Calculator**

## 連接儲存庫 {#connect-repositories}

使用已連接資料庫的閘道。**Proxy Admin** 使用者可以設定連線、連結帳戶並同步。**Proxy Admin Viewer** 使用者可以讀取報告

開啟 **Connections**，然後使用 app 或 access token 連接 **GitHub** 或 **GitLab**。選取儲存庫並選擇 **Save and sync**。您可以選取多個儲存庫，包括巢狀 GitLab 專案。**Add connection** 可讓您將 GitHub 與 GitLab 一起保持連線，包括自架執行個體。每個連線都會保留自己的憑證、儲存庫和帳戶比對

GitHub token 需要儲存庫中繼資料、pull request 和 issue 的讀取權限。GitLab token 需要 `read_api` 以及這些專案的存取權。公開儲存庫可接受空白 token，但須受提供者的匿名 API 限制約束。若沒有 GitHub token，可依名稱新增公開儲存庫

對於 GitHub Enterprise 或自我管理的 GitLab，展開 **Self-hosted instance**，並輸入其 HTTPS API URL，例如 `https://github.example.com/api/v3` 或 `https://gitlab.example.com/api/v4`。不同的主機會視為不同連線，因此 token 與使用者名稱不會在主機之間重複使用

第一次同步會讀取目前期間、前一期，以及去年同期。選擇 **Last 7 days**、**Last 28 days**，或 **Last 90 days**。每個時間窗都涵蓋所選完整 UTC 日數，並排除今天。**Previous period** 是相同長度、緊接在前的時間窗。**Same period last year** 具有相同長度，並在去年相對應日期結束，2 月 29 日會截斷為 2 月 28 日。儀表板會顯示這兩個日期範圍。變更範圍會開始同步，之後的重新整理會保留最後成功載入的範圍。**Sync now** 會重新整理所有已選取的儲存庫。自動同步預設為每日，並在閘道執行時執行。settings API 接受 `update_interval_minutes: 0` 用於手動重新整理，或至少 `5` 用於自動重新整理

重新整理間隔適用於整個工作區，包括每個已連接的提供者與已選取的儲存庫。新增或編輯連線時，會保留該間隔，除非您明確變更它

空白儲存庫也是有效的報告，合併變更為零。在有對應觀察資料之前，合併時間與每次合併變更的支出沒有值。同步失敗或取消會保留最後一份完整報告

## 設定 app 連線 {#configure-app-connections}

閘道操作人員只需為每個提供者 app 設定一次。之後使用者即可從儀表板連線，而無需貼上 access token

將 `PROXY_BASE_URL` 設為閘道的公開 URL。註冊 GitHub App，並授予唯讀的 **Metadata**、**Pull requests** 與 **Issues** 權限。啟用即將過期的使用者 access token。將其 callback URL 設為：

```text
<PROXY_BASE_URL>/roi-calculator/observed/oauth/github/callback
```

將其 setup URL 設為 `<PROXY_BASE_URL>/roi-calculator/observed/oauth/github/installed`，啟用 **Redirect on update**，並保持停用安裝期間授權。請在 app 設定中產生 private key，讓 GitHub 允許安裝，並將其安全儲存。閘道會使用 app 的 client ID 與產生的 client secret 進行授權，不需要該 private key。請設定：

```bash
LITELLM_ROI_GITHUB_CLIENT_ID=<app-client-id>
LITELLM_ROI_GITHUB_CLIENT_SECRET=<app-client-secret>
LITELLM_ROI_GITHUB_APP_SLUG=<app-url-slug>
```

對於 GitLab，請註冊一個機密 OAuth application，並使用 `read_api` 與 `read_user` 範圍，以及此 callback URL：

```text
<PROXY_BASE_URL>/roi-calculator/observed/oauth/gitlab/callback
```

設定 `LITELLM_ROI_GITLAB_CLIENT_ID` 與 `LITELLM_ROI_GITLAB_CLIENT_SECRET`。自架 app 也會使用 `LITELLM_ROI_GITHUB_URL` 或 `LITELLM_ROI_GITLAB_URL`，其值設為提供者的 base URL，不含 API 後綴。app 憑證與 `PROXY_BASE_URL` 必須在所有閘道 worker 之間保持一致

access token 與 refresh token 會使用閘道已設定的加密金鑰進行加密。授權使用 PKCE 與綁定至 HTTP-only 瀏覽器 cookie 的一次性 state。閘道會自動重新整理即將過期的憑證

## 閱讀報告 {#read-the-report}

| 指標 | 計算方式 |
| --- | --- |
| 合併變更 | 所有已選取儲存庫中，在期間內合併的 PR 或 MR |
| 交付速度 | 一個人所比對到的合併變更，以及每週變更數與前一期或年比年比較 |
| 中位合併時間 | 從開啟到合併的中位經過時間，包含夜晚與週末 |
| 新錯誤 | 在期間內開啟、且收集時帶有 `bug`、`kind:bug` 或 `type::bug` 標籤的 issue |
| 新回歸 | 在期間內開啟、且收集時帶有 `regression`、`kind:regression` 或 `type::regression` 標籤的 issue |
| 以 Revert 為標題的變更 | 標題以 `revert` 開頭的已合併 PR 或 MR |
| 每次合併變更的記錄支出 | 比對到的人在該期間的記錄閘道支出，除以其比對到的合併變更數 |

使用 **Engineers** 可查看個人結果，使用 **Pull requests**、**Merge requests** 或 **Merged changes** 可查看基礎變更，使用 **Quality** 可查看 issue 與 revert 訊號，使用 **Branch spend** 可查看已標記請求成本。開啟某位工程師，即可比較其各期間並檢視其合併變更

合併時間是經過時間，不是實際工作時數。30 秒的合併會顯示 `<1m`。錯誤標籤與 revert 標題是儲存庫訊號，不是量測到的失敗率或個別缺陷分數。這些比較顯示的是記錄活動的變化；它們不能證明 AI 造成了那些變化

錯誤與回歸計數會合併已啟用 issue 追蹤的儲存庫。若所選儲存庫中沒有任何一個啟用 issue 追蹤，這些計數將維持無法使用

### 連結帳戶 {#link-accounts}

開啟 **Link accounts**，選擇一個內部閘道 email，並輸入該人的目前與歷史使用者名稱，以逗號分隔。GitHub 與 GitLab 對每個已連接主機都有獨立欄位。一個 email 可以在兩個提供者上擁有多個帳戶。不同主機上相同的使用者名稱仍會被視為不同身分

公開個人檔案 email 若能明確對應到閘道使用者，便會自動比對。手動比對優先，移除比對會阻止相同的公開 email 立即再次連結。儲存後會更新報告，而不會再次抓取儲存庫活動

只有在受支援的 agent 中繼資料明確指定 requestor 時，agent 撰寫的變更才會計入某個人。未指派的 agent 變更仍會計入儲存庫總計

### 理解支出 {#understand-spend}

每個人的閘道支出只會在所選儲存庫與提供者之間計一次。選取儲存庫會改變合併變更的分母；它不會將該人的閘道使用量篩選為僅限那些儲存庫。摘要會將已連結人員的記錄支出除以比對到的合併變更數

範例來說，某人在記錄的閘道支出中有 `$120`，且有 6 次比對到的合併變更，則其每次合併變更的記錄支出為 `$20`。這是帳戶層級的比率，與 PR 直接標記的成本不同

繞過閘道的使用量不會納入計算。沒有支出記錄表示成本未知，而有記錄的零成本請求則是真正的零。沒有合併變更表示每次變更支出比率沒有分母

## 將實際請求成本歸屬到分支 {#attribute-actual-request-costs-to-branches}

若要追蹤分支的 AI 成本，請在每個 model request 上同時傳送儲存庫標記與分支標記：

```json
{
  "model": "your-gateway-model",
  "messages": [{"role": "user", "content": "Help implement this change"}],
  "metadata": {
    "tags": [
      "repo:gitlab.com/example/platform/api",
      "branch:feature/search"
    ]
  }
}
```

對於 GitHub，請使用類似 `repo:github.com/example/api` 的儲存庫標記。對於自架執行個體，請包含主機與儲存庫路徑，但不含 API 後綴。請使用 PR 或 MR 的 **source** 儲存庫與分支，包含適用時的 fork 儲存庫。GitHub 儲存庫名稱不區分大小寫。GitLab 專案路徑與分支名稱必須完全一致

相同的標記也可以透過以逗號分隔的 header 傳送：

```text
x-litellm-tags: repo:github.com/example/api,branch:feature/search
```

請將程式撰寫工具或包裝器設定為在每次請求時都傳送這兩個標記。請參閱 [Request tags](./request_tags.md) 以查看用戶端範例。標記會儲存在支出記錄的 `request_tags` 欄位中；單獨的分支中繼資料或 Git release tag 不能取代這一對標記

同步後，**Branch spend** 會顯示每個已標記分支的已記錄支出與請求數量。當某個來源儲存庫和分支在該期間內，只有一個已合併變更使用時，合併變更清單會顯示 **Tagged spend**。分支成本會包含跨使用者與金鑰的請求，且不需要 email 比對

重複的相同標籤只會將一次請求計算一次。缺少或互相衝突的儲存庫或分支標籤，會將請求排除在歸屬之外。當多個已合併變更在該期間共用同一個分支時，其成本仍會顯示在 **Branch spend** 中，而不會被計入多個 PR。請為每個變更使用唯一的分支，以便進行無歧義比對

分支成本涵蓋同一 UTC 報表視窗內保留的請求記錄，不一定涵蓋整個 PR 存續期間。於該視窗之前產生的成本不屬於該報表

## 疑難排解 {#troubleshooting}

| 您看到的情況 | 檢查項目 |
| --- | --- |
| 沒有可用的應用程式連線按鈕 | 在 gateway 上設定 provider app，或使用 token |
| 無法載入儲存庫 | 檢查 token 權限、到期時間、組織核准，以及 API URL |
| 沒有活動 | 檢查所選儲存庫與報表日期；今天不包含在內 |
| 缺少某位工程師 | 將其使用者名稱連結到既有的內部 gateway email |
| 沒有標記的分支支出 | 在每個請求上同時送出兩個精確標籤，保留支出記錄，並在報表日結束後同步 |
| 分支成本由多個變更共用 | 為每個變更使用不同的來源分支 |
| 同步失敗 | 修正 provider 存取或速率限制後重試；先前的完整報表仍可使用 |

請參閱 [Spend Tracking](./cost_tracking.md) 以了解 gateway 記帳，並參閱 [Admin UI](./ui.md) 以了解儀表板設定
