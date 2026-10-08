# 貢獻文件 {#contributing-to-documentation}

本網站使用 [Docusaurus 3](https://docusaurus.io/) 建置，這是一個現代化的靜態網站產生器。

複製文件倉庫：

```bash
git clone https://github.com/BerriAI/litellm-docs.git
cd litellm-docs
```

### 在本機執行文件的本機設定 {#local-setup-for-locally-running-docs}

安裝相依性：

```bash
npm install
```

在本機執行文件網站：

```bash
npm start
```

在此開啟文件：[http://localhost:3000/](http://localhost:3000/)。

### 進行文件變更 {#making-changes-to-docs}
- 所有文件都放在 `docs` 目錄下
- 部落格貼文都放在 `blog` 目錄下
- 如果您正在新增一個 `.md` 檔案，或編輯階層，請檢查是否需要更新 `sidebars.js`

### 驗證您的變更 {#verify-your-changes}

在開啟 PR 之前，請執行：

```bash
npm run build
```

在測試完您的變更後，請對 [github.com/BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs) 開啟 pull request。
