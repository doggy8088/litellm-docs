# litellm-docs

[docs.litellm.ai](https://docs.litellm.ai) 的原始碼；該網站是 [LiteLLM](https://github.com/BerriAI/litellm) 的文件網站。

使用 [Docusaurus 3](https://docusaurus.io/) 建置。

## 本機開發

```bash
npm install
npm start
```

在瀏覽器開啟 <http://localhost:3000>，即可檢視支援即時重新載入的網站。

## 建置

```bash
npm run build
```

靜態網站會輸出至 `build/`。

為配合 8 GB 的 Vercel 建置機器，建置流程預設同時轉譯最多 4 個頁面並最佳化最多 2 張圖片。若在其他機器執行 `npm run build`，可設定 `DOCUSAURUS_SSR_CONCURRENCY` 覆寫頁面轉譯的並行數量。

## 部署

推送至 `main` 時，Vercel 會自動處理部署。

### Firebase Hosting

`Firebase Hosting` GitHub Actions 工作流程會建置每個 Pull Request，並將
`main` 分支部署至 Firebase Hosting 正式頻道。也可以透過
`workflow_dispatch` 手動啟動工作流程。

此 fork 會將 `vertex-ai-sprint` 專案中的 `litellm-docs-zh-tw` 部署目標
發布至下列專用 Hosting 站台：
<https://litellm-docs-zh-tw-8088.web.app>。

從其他存放庫或 fork 部署時，必須設定下列 GitHub Actions 值：

- 存放庫變數 `FIREBASE_PROJECT_ID`：目標 Firebase Project ID。
- 存放庫 secret `FIREBASE_SERVICE_ACCOUNT`：具備 Firebase Hosting 部署權限的
  完整服務帳戶 JSON 金鑰。

使用 GitHub CLI 為 fork 設定這些值：

```bash
gh variable set FIREBASE_PROJECT_ID \
  --repo OWNER/litellm-docs \
  --body FIREBASE_PROJECT_ID

gh secret set FIREBASE_SERVICE_ACCOUNT \
  --repo OWNER/litellm-docs \
  < /secure/path/firebase-service-account.json
```

請依照 Firebase Action 官方的
[服務帳戶指南](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md)
建立 JSON 金鑰並授予部署權限。工作流程會依據 `firebase.json` 的設定，
部署 `build/` 中的 Docusaurus 靜態輸出。

## 貢獻

歡迎透過 Pull Request 提交修改。若涉及實質內容變更，請先建立 issue 討論。

LiteLLM 的主要存放庫位於 <https://github.com/BerriAI/litellm>。

## 更新 Lens 整合

執行 `npm run sync:lens` 會複製 `BerriAI/litellm-lens-example` 的最新 `main` 分支，並匯入其 `docs.json` 清單所列的 README。此指令稿會加上 Docusaurus 中繼資料、改寫存放庫連結、複製圖片資產，並更新整合側邊欄；它只會取代 `docs/proxy/lens/imported/`，而本機維護的 Lens 頁面仍保留在 `docs/proxy/lens/` 中。

請隨文件更新一併檢視並提交產生的變更。每個頁面都會記錄其來源 commit，並將編輯連結指回對應的 README。建置時會直接使用已提交的頁面，不會重新抓取範例存放庫，也不需要 GitHub token、dispatch 事件或排程工作流程。

若要從本機已提交的工作目錄匯入，請執行 `npm run sync:lens -- --source-dir /path/to/litellm-lens-example`，這會匯入該工作目錄的 `HEAD`（不含未提交的變更）。
