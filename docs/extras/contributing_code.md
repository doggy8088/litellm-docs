# 貢獻程式碼 {#contributing-code}

## 提交 PR 前的檢查清單 {#checklist-before-submitting-a-pr}

以下是提交至 LiteLLM 的任何 PR 之核心需求：

- [ ] 簽署 [Contributor License Agreement (CLA)](#contributor-license-agreement-cla)
- [ ] 將範圍維持在盡可能獨立的範圍內 — 您的變更每次應只處理**一個特定問題**
- [ ] 遵循 [Commit and Branch Conventions](#commit-and-branch-conventions) — PR 標題會受到 CI 把關

### Proxy（後端）PR {#proxy-backend-prs}

- [ ] 新增測試 — **至少 1 個測試是硬性要求**（[詳細資訊](#2-adding-tests)）
- [ ] 確保您的 PR 通過：
  - [ ] [Unit Tests](#3-running-unit-tests) — `make test-unit`
  - [ ] [Formatting / Linting Tests](#4-running-linting-tests) — `make lint`

### UI PR {#ui-prs}

- [ ] 確保 UI 能成功建置 — `npm run build`
- [ ] 確保所有 UI 單元測試都通過 — `npm run test`
- [ ] 如果您要新增**新元件**或**新邏輯**，請加入對應測試

## 貢獻者授權協議（CLA） {#contributor-license-agreement-cla}

在向 LiteLLM 提交程式碼之前，您必須先簽署我們的 [Contributor License Agreement (CLA)](https://cla-assistant.io/BerriAI/litellm)。這是所有貢獻要合併到主儲存庫的法律要求。CLA 透過清楚定義您貢獻內容的提供條款，來同時保護您與本專案。

**重要：** 我們強烈建議您在開始進行貢獻之前就先簽署 CLA，以避免審查流程延誤。您可以在[這裡](https://cla-assistant.io/BerriAI/litellm)找到並簽署 CLA。

---

## Commit 與分支慣例 {#commit-and-branch-conventions}

LiteLLM 強制執行兩項社群規範：

- **Commits** 遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — `<type>(<scope>)!: <description>`
- **Branches** 遵循 [Conventional Branches](https://conventional-branch.github.io/) — `<type>/<description>`

強制執行發生在兩個地方：`.githooks/` 中可選用的本機 git hooks，以及 PR 標題上的必要 CI 檢查（因為 squash-merge 會使用 PR 標題作為 commit subject）。

### Commit 訊息格式 {#commit-message-format}

```
<type>(<optional scope>)!: <description>

<optional body>

<optional footer>
```

- `<type>` 為以下之一：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。
- `<scope>` 是可選的且為小寫。
- `!` 在 `:` 之前表示破壞性變更。
- `<description>` 為必填，且**必須以小寫字母開頭**（數字與符號也可以；只有 `A–Z` 會被拒絕）。

範例：

```
feat(router): add weighted round-robin strategy
fix(bedrock): decouple STS region from aws_region_name
chore(deps): bump black to 26.3.1
refactor!: drop Python 3.8 support
```

PR 標題必須遵循相同格式 — squash-merge 會使用 PR 標題作為 commit subject，而 **Conventional PR Title** 工作流程會進行驗證。

### 分支命名 {#branch-naming}

格式：`<type>/<short-description>`，其中 `<type>` 是 `feature`、`bugfix`、`hotfix`、`release`、`chore` 其中之一。

```
feature/weighted-round-robin
bugfix/streaming-empty-chunks
chore/bump-black
hotfix/auth-bypass
release/v1.45.0
```

永遠允許的分支（`pre-push` hook 會略過它們）：

- `main`
- `litellm_internal_staging`
- `dependabot/*`
- `gh-readonly-queue/*`

Tag push 與分支刪除也會被略過。

### 安裝 hooks {#installing-the-hooks}

這些 hooks 位於 `.githooks/`，且為 opt-in。每個 clone 只需執行一次：

```shell
make install-hooks
```

這會為本機儲存庫設定 `core.hooksPath=.githooks`。之後：

- `git commit` 會執行 `commit-msg`，用來驗證 subject line。
- `git push` 會執行 `pre-push`，用來驗證分支名稱。

在極少數緊急情況下，您可以針對每個指令略過任一 hook：

```shell
git commit --no-verify -m "..."
git push   --no-verify
```

解除安裝：`git config --unset core.hooksPath`。

---

## Proxy（後端） {#proxy-backend}

### 1. 建立您的本機開發環境 {#1-setting-up-your-local-dev-environment}

步驟 1：複製 repo

```shell
git clone https://github.com/BerriAI/litellm.git
```

步驟 2：安裝開發相依套件

```shell
uv sync --group dev --extra proxy
```

### 2. 新增測試 {#2-adding-tests}

- 將測試加入 [`tests/test_litellm/` 目錄](https://github.com/BerriAI/litellm/tree/main/tests/litellm)。
- 此目錄與 `litellm/` 目錄 1:1 對應，且應**只**包含 mocked tests。
- **請勿**在此目錄中加入真實的 LLM API 請求。

#### `tests/test_litellm/` 的檔案命名慣例 {#file-naming-convention-for-teststest_litellm}

測試目錄的結構與 `litellm/` 相同：

- `test_{filename}.py` 對應至 `litellm/{filename}.py`
- `litellm/proxy/test_caching_routes.py` 對應至 `litellm/proxy/caching_routes.py`

### 3. 執行單元測試 {#3-running-unit-tests}

從 `litellm` 目錄的根目錄執行下列指令：

```shell
make test-unit
```

### 4. 執行 linting 測試 {#4-running-linting-tests}

從 `litellm` 目錄的根目錄執行下列指令：

```shell
make lint
```

LiteLLM 使用 `mypy` 進行型別檢查。CI/CD 也會執行 `black` 進行格式化。

### 5. 提交 PR {#5-submit-a-pr}

- 將您的變更推送到 GitHub 上的 fork
- 從您的 fork 開啟 Pull Request

---

## UI {#ui}

### 1. 建立您的本機開發環境 {#1-setting-up-your-local-dev-environment-1}

步驟 1：複製 repo

```shell
git clone https://github.com/BerriAI/litellm.git
```

步驟 2：前往 UI 儀表板目錄

```shell
cd ui/litellm-dashboard
```

步驟 3：安裝相依套件

```shell
npm install
```

步驟 4：啟動開發伺服器

```shell
npm run dev
```

### 2. 新增測試 {#2-adding-tests-1}

如果您要新增**新元件**或**新邏輯**，您必須新增對應的測試。

### 3. 執行 UI 單元測試 {#3-running-ui-unit-tests}

```shell
npm run test
```

### 4. 建置 UI {#4-building-the-ui}

在提交您的 PR 之前，請確保 UI 可成功建置：

```shell
npm run build
```

### 5. 提交 PR {#5-submit-a-pr-1}

- 將您的變更推送到您在 GitHub 的 fork
- 從您的 fork 開啟 Pull Request

---

## 進階 {#advanced}

### 建置 LiteLLM Docker 映像檔 {#building-the-litellm-docker-image}

如果您想自行建置並執行 LiteLLM Docker image，請遵循這些指示。

步驟 1：複製 repo

```shell
git clone https://github.com/BerriAI/litellm.git
```

步驟 2：建置 Docker image

使用 `Dockerfile.non_root` 進行建置：

```shell
docker build -f docker/Dockerfile.non_root -t litellm_test_image .
```

步驟 3：執行 Docker image

請確認 `config.yaml` 存在於根目錄中。這是您的 LiteLLM proxy 設定檔。

```shell
docker run \
    -v $(pwd)/proxy_config.yaml:/app/config.yaml \
    -e DATABASE_URL="postgresql://xxxxxxxx" \
    -e LITELLM_MASTER_KEY="sk-1234" \
    -p 4000:4000 \
    litellm_test_image \
    --config /app/config.yaml --detailed_debug
```

### 在本機執行 LiteLLM Proxy {#running-the-litellm-proxy-locally}

1. 前往 `proxy/` 目錄：

```shell
cd litellm/litellm/proxy
```

2. 執行 proxy：

```shell
python3 proxy_cli.py --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```
