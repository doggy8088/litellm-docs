# 貢獻 - UI {#contributing---ui}

感謝您為 LiteLLM UI 做出貢獻！本指南將協助您設定本機開發環境。

## 1. 複製儲存庫 {#1-clone-the-repo}

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm
```

## 2. 啟動 Proxy {#2-start-the-proxy}

建立設定檔（例如，`config.yaml`）：

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o

general_settings:
  master_key: sk-1234
  database_url: postgresql://<user>:<password>@<host>:<port>/<dbname>
  store_model_in_db: true
```

在 4000 埠啟動 proxy：

```bash
uv run litellm --config config.yaml --port 4000
```

UI 已預先建置於儲存庫中。請透過 `http://localhost:4000/ui` 存取。

## 3. UI 開發 {#3-ui-development}

UI 開發有兩種選項：

### 選項 A：開發模式（熱重載） {#option-a-development-mode-hot-reload}

這會在 3000 埠執行 UI，並啟用熱重載。proxy 會在 4000 埠執行。

```bash
cd ui/litellm-dashboard
npm install
npm run dev
```

**登入流程：**
1. 前往 `http://localhost:3000`
2. 您將被重新導向至 `http://localhost:4000/ui` 進行登入
3. 登入後，手動返回至 `http://localhost:3000/`
4. 您現在已完成驗證，可使用熱重載進行開發

:::note
如果您遇到重新導向迴圈或驗證問題，請清除 localhost 的瀏覽器 cookie，或改用建置模式。
:::

### 選項 B：建置模式 {#option-b-build-mode}

這會建置 UI 並將其複製到 proxy。變更後需要重新建置。

1. 在 `ui/litellm-dashboard/src/` 中進行程式碼變更

2. 建置 UI
```bash
cd ui/litellm-dashboard
npm install
npm run build
```

建置完成後，將輸出複製到 proxy：

```bash
cp -r out/* ../../litellm/proxy/_experimental/out/
```

接著重新啟動 proxy，並透過 `http://localhost:4000/ui` 存取 UI

## 4. PR 前檢查清單 {#4-pre-pr-checklist}

在提交您的 pull request 之前，請確認以下項目在本機透過 `ui/litellm-dashboard/` 通過：

**執行與您變更相關的測試：**

```bash
npx vitest run src/components/path/to/YourComponent.test.tsx
```

測試與元件共置（例如，`TeamInfo.tsx` → `TeamInfo.test.tsx`）。如果您新增新的元件，請在旁邊新增對應的 `.test.tsx` 檔案。

**執行建置：**

```bash
npm run build
```

這些會對應到 `ui_tests` 和 `ui_build` CI 檢查。

## 5. 提交 PR {#5-submitting-a-pr}

1. 為您的變更建立新的分支：
```bash
git checkout -b feat/your-feature-name
```

2. 暫存並提交您的變更：
```bash
git add .
git commit -m "feat: description of your changes"
```

3. 推送到您的 fork：
```bash
git push origin feat/your-feature-name
```

4. 依照 [PR 範本](https://github.com/BerriAI/litellm/blob/main/.github/pull_request_template.md) 在 GitHub 上建立 Pull Request
