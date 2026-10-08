# 為文件貢獻 {#contributing-to-documentation}

本網站是使用 [Docusaurus 3](https://docusaurus.io/) 建置的，這是一個現代化的靜態網站產生器。

複製 docs repo：

```bash
git clone https://github.com/BerriAI/litellm-docs.git
cd litellm-docs
```

### 本機執行文件的本機設定 {#local-setup-for-locally-running-docs}

安裝相依項目：

```bash
npm install
```

在本機執行 docs 網站：

```bash
npm start
```

在此開啟 docs：[http://localhost:3000/](http://localhost:3000/)。

### 對 Docs 進行變更 {#making-changes-to-docs}
- 所有文件都放在 `docs` 目錄下
- 部落格文章都放在 `blog` 目錄下
- 如果您要新增一個 `.md` 檔案或編輯階層，請確認 `sidebars.js` 是否需要更新

### 驗證您的變更 {#verify-your-changes}

在開啟 PR 之前，請執行：

```bash
npm run build
```

在測試完您的變更後，請對 [github.com/BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs) 開啟 pull request。
