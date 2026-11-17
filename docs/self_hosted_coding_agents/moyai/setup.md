---
title: 設定 Moyai
sidebar_label: 設定
description: 在 Modal 上部署 Moyai、連接您的 LiteLLM 閘道、驗證您的第一個雲端任務，並連接 GitHub 儲存庫。
---

import Image from '@theme/IdealImage';
import {GuideNav} from '@site/src/components/Moyai';

<GuideNav active="setup" />

對於使用 EC2、Bedrock 與 Lambda MicroVM 沙箱的 AWS 安裝，請遵循 [AWS 部署指南](./aws.md)。

在 Modal 上部署 Web 應用程式與代理程式沙箱，然後在連接您的儲存庫之前驗證一個任務。本指南使用 Claude Agent SDK harness 與 `openai/gpt-6-astra` 閘道別名，這是 Moyai 的[入門指南](https://github.com/BerriAI/moyai/blob/main/docs/getting-started.md)中的組合。您的閘道必須透過 Messages API 支援該模型。

您在自己的電腦上執行安裝命令。部署之後，透過瀏覽器或 Slack 使用 Moyai；您的電腦可以離線。Modal 會為託管、沙箱與儲存收費。您的模型提供者會透過 LiteLLM 為推論收費。

## 開始之前 {#before-you-start}

- 安裝 Git、[uv](https://docs.astral.sh/uv/getting-started/installation/) 與 Python 3.12 或更新版本。在 Windows 上，使用 WSL。{/* keep-python-version */}
- 選擇一個有帳單且有部署權限的 [Modal 工作區](https://modal.com/docs/guide)。盡可能使用全新的工作區：指令碼會更新具有固定名稱的資源。
- 取得 Modal 可以到達的受保護 HTTPS [LiteLLM 閘道](/docs/proxy/quick_start)，以及一個有預算的專用虛擬金鑰。閘道管理員可以建立該金鑰；Moyai 本身不需要 master key。

:::note 工作區範圍
Moyai 是供受信任團隊使用的共用工作區。保持驗證啟用。已連接的應用程式使用其授權身分的權限；從小型儲存庫與您需要的存取權開始。
:::

## 1. 安裝 Moyai {#1-install-moyai}

```bash keep-python-version
uv python install 3.12
git clone https://github.com/BerriAI/moyai.git
cd moyai
uv sync --frozen --python 3.12
cp .env.example .env
chmod 600 .env
```

從此目錄執行其餘命令。如果您已有 `.env`，請編輯它，而不是覆寫它。將秘密保存在該檔案或您主機的秘密儲存中，永遠不要放在任務提示詞中。

**檢查：** `uv sync` 完成且 `.env` 存在。缺少 `uv` 命令表示您需要在安裝它之後重新開啟 shell。

## 2. 連接 Modal {#2-connect-modal}

```bash
uv run modal token new
```

為將擁有 Moyai 的工作區完成瀏覽器登入。在私密編輯器中開啟 `~/.modal.toml`，並將該設定檔的 `token_id` 與 `token_secret` 複製到對應的 `.env` 欄位：

```dotenv
MODAL_TOKEN_ID=<token ID for your workspace>
MODAL_TOKEN_SECRET=<secret from the same profile>
```

**檢查：** 兩個欄位都包含來自同一個設定檔的值。僅 CLI 登入並不會填入 Moyai 的 `.env`。檢查 token 的到期時間，並遵循您團隊的服務身分政策。

## 3. 設定 LiteLLM {#configure-litellm}

### 新增模型並建立金鑰 {#add-the-model-and-create-a-key}

如果您已有閘道，請向其管理員索取確切的模型別名，以及可透過 **Messages** 存取它且有預算限制的金鑰。如果管理員已完成此事，請略過以下設定。

對於新的閘道，將模型加入其設定，並將提供者金鑰儲存在閘道上：

```yaml title="LiteLLM config.yaml"
model_list:
  - model_name: openai/gpt-6-astra
    litellm_params:
      model: openai/gpt-6-astra
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  include_cost_in_streaming_usage: true
```

在 LiteLLM Admin UI 中，開啟 **Virtual Keys**，建立一個名為 `moyai` 的金鑰，授予 `openai/gpt-6-astra` 的存取權，並設定預算。API 與 UI 說明請參閱[虛擬金鑰](/docs/proxy/virtual_keys)。選擇您願意在試用上花費的預算。准入檢查可能會允許進行中的請求讓支出超過閾值。

### 設定 Moyai 的端點 {#set-moyais-endpoint}

編輯 `.env`：

```dotenv
LITELLM_API_BASE=https://your-gateway.example.com/v1
LITELLM_API_KEY=<Moyai virtual key>
AGENT_MODEL=openai/gpt-6-astra
AGENT_HARNESS=claude-agent-sdk
SESSION_TITLES_ENABLED=false
```

讓基底 URL 的結尾保留 `/v1`，不要加 `/messages`。使用可從雲端到達的位址；Modal 容器內的 `localhost` 指的是該容器本身。停用標題產生可以避免第一次執行時多一個模型相依性。

這個明確的 harness 設定讓本逐步導覽保持使用 Messages。若之後要使用自動選取，請移除 `AGENT_HARNESS`：解析為 `openai/` 的模型會選取 Codex，`anthropic/` 模型會選取 Claude Agent SDK，其他別名則使用 Claude 備援。在**新的**工作階段中選擇另一個受支援的 harness。

| Harness | 閘道端點 | 選取前檢查 |
|---|---|---|
| Claude Agent SDK | `/v1/messages` | 所選別名的 Messages API 與工具呼叫 |
| Codex | `/v1/responses` | 所選別名的 Responses API 與工具呼叫 |
| Hermes、OpenCode、Deep Agents、Tool Loop | `/v1/chat/completions` | 所選別名的 Chat Completions 與工具呼叫 |

模型選擇器中的名稱並不會授予您的金鑰存取它的權限。將 `AGENT_MODEL` 設定為您的閘道提供的別名。請參閱 [harness 相容性](https://github.com/BerriAI/moyai/blob/main/docs/harnesses.md)。

### 檢查模型連接 {#check-the-model-connection}

將您的虛擬金鑰放在 shell 變數 `LITELLM_API_KEY` 中，測試本逐步導覽使用的相同通訊協定。這會發出一個小額計費的模型請求：

```bash
curl --fail-with-body -i 'https://your-gateway.example.com/v1/messages' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "openai/gpt-6-astra",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "Reply with: connection works"}]
  }'
```

**檢查：** HTTP 200 並有模型回應。當閘道提供成本標頭時，請檢查它。這檢查的是您的本地連接；第一個雲端任務也會驗證從 Modal 的可達性。在部署之前先解決存取或通訊協定錯誤。

## 4. 部署並登入 {#4-deploy-and-sign-in}

對於第一次由 Modal 託管的部署，將 `PUBLIC_URL` 保持在其範例值，並讓 `WORKSPACE_PASSWORD`、`SESSION_SECRET` 與 `ENCRYPTION_KEY` 保持空白。指令碼會產生缺少的秘密並將它們儲存在 `.env` 中。保持 `PASSWORD_LOGIN_ENABLED=true`。第一次執行時，讓 Slack、Google OAuth 與 Temporal 保持停用。

在不印出秘密的情況下檢查必填欄位：

```bash
uv run python -c 'from app.config import Settings; s=Settings(); missing=s.missing_cloud(); print("Missing: " + ", ".join(missing) if missing else "Required fields present; credentials not tested."); raise SystemExit(bool(missing))'
```

填入任何缺少的欄位之後再部署：

```bash
uv run python deploy_modal.py
```

這會啟動計費的運算，並在您的 Modal 環境中更新 `moyai` 應用程式、`hermes-workspace-config` 秘密與 `hermes-workspace-state` 磁碟區。在對現有安裝執行它之前，請先協調停機時間。

**檢查：** 開啟印出的 `Workspace URL`。在您的私密編輯器中讀取 `WORKSPACE_PASSWORD` 並登入。第一次映像建置可能需要幾分鐘。安全地備份 `.env`，尤其是您解密已儲存連接所需的 `ENCRYPTION_KEY`。

保持一個 Web 容器。在此設定上，重新部署會中斷進行中的任務。變更 `.env` 之後，等待任務完成並重新執行部署命令；檔案值（包括空白）會覆寫 shell 變數。

## 5. 驗證任務與後續訊息 {#5-verify-a-task-and-a-follow-up}

1. 開啟 **Settings > Runtime** 並尋找 **Cloud ready**。這檢查的是必填欄位，不是憑證有效性。
2. 開始新的工作階段。在 **Context** 中，選取 **Execution > Cloud session**，並讓 **GitHub repository** 保持空白。
3. 選擇 **Claude Agent SDK** 與 **GPT-6 Astra**，或您設定的確切別名。
4. 傳送此任務：

   > 使用終端機建立 `/workspace/setup-check.txt`，內容為 `moyai setup works`。用工具將它讀回並報告內容。不要連接應用程式或發佈任何東西。

5. 等待完成。展開 **Activity** 以檢查實際的工具呼叫，然後在 **Files** 中開啟 `setup-check.txt`。
6. 在同一個聊天中傳送後續訊息：

   > 使用工具讀取 `/workspace/setup-check.txt` 並報告其內容。

**檢查：** 兩個輪次都從檔案讀到 `moyai setup works`。模擬/示範回應並不能驗證雲端執行。在連接應用程式之前先解決任何失敗。

## 6. 連接 GitHub 並開啟小型 PR {#6-connect-github-and-open-a-small-pr}

組織擁有者或有權註冊並安裝組織 GitHub App 的人，必須完成連接。不支援個人帳號安裝。

1. 以 Moyai 管理員身分，開啟 **Connections > GitHub > Connect**。註冊一個組織擁有的 App，或在連接表單中提供現有 App 的 ID 與 PEM 金鑰。
2. 檢閱 [GitHub 權限](https://github.com/BerriAI/moyai/blob/main/docs/integrations.md#shared-organization-github)。簽出與 PR 工作使用 Contents 與 Pull requests 的讀寫權限。新 App 資訊清單也會要求 Administration 寫入權限，用於規則集審查者變更；現有合適的 App 在一般 PR 工作時可以省略該權限。
3. 完成安裝，然後開啟 **Manage > Choose repositories** 並選取要公開的儲存庫。Moyai 會儲存儲存庫 ID；變更選取不需要重新部署。
4. 開始新的 **Cloud session**，在 **Context** 中選擇儲存庫，並在 **Organization connections** 下啟用 GitHub。
5. 請代理程式在變更程式碼之前，先找出並執行最小的相關測試套件。檢查命令與結果，然後請求一個帶有迴歸測試與 PR 的小型變更。

**檢查：** 開啟 PR、檢查 diff，並確認回報的檢查。請自行檢閱並合併它。已啟用的已連接應用程式寫入會在連接政策下執行，不會有每次使用都核准的提示；適當時請暫停連接或使用唯讀存取。

## 7. 檢查支出 {#track-spend}

以 Moyai 管理員身分，開啟 **Settings > Administration > Spend & usage**，依使用者、工作階段與模型檢查成本。成員可以在 **Settings > Workspace > Spend** 下看到自己的成本。在 LiteLLM Admin UI 中，開啟 **Logs > Filters** 並將 **Key Alias** 設定為 `moyai`。

<Image
  img={require('../../../img/moyai_gateway_logs.png')}
  dark={require('../../../img/moyai_gateway_logs_dark.png')}
  alt="篩選至 moyai 虛擬金鑰的 LiteLLM 請求記錄"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

Moyai 會在 `x-litellm-call-id` 與 `spend_logs_metadata.moyai_request_id` 中附加其請求 ID。使用該 ID 在兩個系統之間核對請求。對於串流成本，請在閘道上保持 `include_cost_in_streaming_usage: true`，並驗證您部署版本中的原生端點支援。[成本計算](./architecture.md#cost-accounting) 說明了遺失的收據與復原權限。請將 Modal 託管、沙箱與儲存費用包含在您的試用總計中。

## 疑難排解 {#troubleshooting}

| 症狀 | 動作 |
|---|---|
| 缺少 Modal 憑證 | 在 `.env` 中填入兩個 token 欄位；CLI 登入是分開的。檢查工作區與到期時間。 |
| 閘道 401 或 403 | 檢查虛擬金鑰、確切的模型別名，以及所選 API 的權限。 |
| 閘道 404 或通訊協定錯誤 | 確認可到達的基底以 `/v1` 結尾，以及 harness 所需的 API。 |
| 預算超支或被速率限制 | 在 LiteLLM 中檢查支出與限制。停止不需要的工作；只有在您打算花更多時才調整預算。 |
| UI 可運作，但任務失敗 | 檢查沙箱建置與閘道錯誤。**Cloud ready** 驗證的是設定存在，不是服務可運作。 |
| 任務顯示模擬/示範 | 以選取 **Cloud session** 的方式開始新的工作階段。現有的示範工作階段會保留其模式。 |
| 聊天中缺少 GitHub | 確認 App 安裝與儲存庫選取，然後開始一個在 **Context** 中啟用 GitHub 的新工作階段。 |
| 設定變更沒有效果 | 在閒置時重新部署。檢查覆寫 shell 變數的空白 `.env` 項目。 |

在錯誤報告中分享失敗的步驟與已遮蔽敏感資訊的錯誤。排除憑證與 `.env`。

## 停止或擴展部署 {#stop-or-expand-the-deployment}

關閉瀏覽器會讓服務繼續執行。停止進行中的任務，如果您不再需要它，請在 Modal 中停止 `moyai` Web 應用程式，並檢查剩餘的沙箱。保留的快照與磁碟區可能會產生儲存費用。

第一個任務運作之後，加入 [Slack](https://github.com/BerriAI/moyai/blob/main/docs/slack.md)、[其他連接](https://github.com/BerriAI/moyai/blob/main/docs/integrations.md) 或 [Google SSO](https://github.com/BerriAI/moyai/blob/main/docs/deployment.md)。在啟用 SSO 之前，先取代 BerriAI 專屬的網域範例。對於 Render、Docker、其他沙箱提供者或 Temporal，請閱讀[部署選項](https://github.com/BerriAI/moyai/blob/main/docs/deployment.md) 與[架構指南](./architecture.md)。
