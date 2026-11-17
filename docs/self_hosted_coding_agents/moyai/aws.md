---
title: 使用 Lambda MicroVM 在 AWS 上部署 Moyai
sidebar_label: AWS 部署
description: 使用 Terraform、EC2、Lambda MicroVM 沙箱、RDS、S3 在 AWS 上部署 Moyai，並透過 LiteLLM 閘道將推論路由至 Amazon Bedrock。
---

import {GuideNav} from '@site/src/components/Moyai';
import AwsInfrastructure from './aws-infrastructure.svg';

<GuideNav active="aws" />

{/* keep-version-note */}

在私有的 EC2 主機上部署 Moyai，並在 **AWS Lambda MicroVM** 中執行代理程式工具。使用隨附的 Temporal 服務進行持久執行，並使用 LiteLLM 閘道進行 Bedrock 推論。以 EC2 IAM 角色驗證 Bedrock 請求。

來源：Moyai 的原生 Pydantic AI 與 Temporal 實作，位於 [`b73f74d`](https://github.com/BerriAI/moyai/tree/b73f74dc357004c2079018d77a4c97954c0b4f05)。操作請參閱上游的 [AWS 快速入門](https://github.com/BerriAI/moyai/blob/main/deploy/aws/README.md)，手動設定請參閱 [MicroVM 指南](https://github.com/BerriAI/moyai/blob/main/docs/aws-lambda-microvms.md)。

:::note 部署範圍
將此快速入門用於**新的單一執行個體安裝**。您會得到一個應用程式/Temporal 主機與一個 NAT 閘道，沒有自動的應用程式容錯移轉。允許對 AWS API、映像與 Slack（若啟用）的對外存取。對於 EKS，請遵循 [Helm 整合說明](https://github.com/BerriAI/moyai/blob/main/docs/aws-lambda-microvms.md#deploy-the-application-on-aws)。
:::

## 基礎架構 {#infrastructure}

<div role="region" aria-label="AWS infrastructure diagram; scroll left or right on smaller screens" tabIndex={0} style={{overflowX: 'auto'}}>
  <AwsInfrastructure style={{display: 'block', width: '100%', minWidth: 760, height: 'auto'}} />
</div>

[開啟完整尺寸的圖表](./aws-infrastructure.svg)，或在較小的螢幕上左右捲動它。

使用 Route 53 DNS 與 ACM 憑證，透過 ALB 進行 HTTPS 存取。透過 Systems Manager 存取私有 EC2 主機；它沒有公開 IP 或 SSH 入口。將對外流量透過 NAT 閘道路由，並透過應用程式 VPC 之外經 AWS 驗證的端點連接到 MicroVM。

使用 Terraform 模組，佈建私有的 ECR 儲存庫、範圍限定的 IAM 角色、Secrets Manager、CloudWatch 日誌，以及 EBS 狀態磁碟區的每日 AWS Backup 復原點。

| 邊界 | 在該處執行的內容 |
|---|---|
| 受信任的 EC2 服務 | Pydantic AI 代理程式執行、模型請求、連接憑證、API、協調程式、仲介程式與工作程式 |
| Lambda MicroVM 來賓 | 工作區工具與命令/檢查點傳輸；在此快速入門中沒有模型、資料庫或 Slack 憑證，也沒有來賓執行角色 |
| 持久狀態 | RDS 用於應用程式記錄；EBS 用於安裝金鑰與 Temporal 的資料庫；產品物件與來賓檢查點使用獨立的 S3 前綴 |

## 開始之前 {#before-you-start}

安裝 Git、[uv](https://docs.astral.sh/uv/getting-started/installation/)、AWS CLI、Terraform 1.9 或更新版本（但低於 2.0），以及具有 AMD64 Buildx 建置器的 Docker。對於本地 `uv sync`，安裝 Python 3.13、Node.js 22 或更新版本，以及 Rust 1.88 或更新版本，以建置 UI 與 AgentChat SDK。{/* keep-python-version */}

為 AMD64 建置應用程式。來賓封裝程式使用 ARM64，且至少需要 8 GiB 記憶體。

確認 **您的 AWS 區域有 Lambda MicroVM 存取權**，以及建置映像與啟動 VM 的容量。僅有 Lambda 函數存取權並不足夠。您需要一個現有的公開 Route 53 託管區域、一個未使用的主機名稱，以及佈建資源、傳遞範圍限定角色與使用 SSM Run Command 的權限。

啟用 Bedrock 模型或推論設定檔，並驗證您的帳戶可以叫用它。對於跨區域推論設定檔，請同時允許設定檔 ARN 與每個目的地模型 ARN。使用以下命令檢查設定檔：

```bash
aws bedrock get-inference-profile \
  --region YOUR_REGION \
  --inference-profile-identifier YOUR_PROFILE_ID
```

為運算、儲存、映像建置與推論編列預算。來賓暫停期間，您仍需持續支付應用程式服務的費用。

## 1. 準備簽出與 AWS 設定 {#1-prepare-the-checkout-and-aws-configuration}

```bash
git clone https://github.com/BerriAI/moyai.git
cd moyai
uv sync --frozen
export AWS_PROFILE=your-aws-profile
aws sts get-caller-identity
cp deploy/aws/terraform.tfvars.example deploy/aws/terraform.tfvars
```

從 Moyai 簽出繼續。應用程式映像與部署套件使用相同的修訂版本。編輯 `deploy/aws/terraform.tfvars`：

| 設定 | 要提供的值 |
|---|---|
| `name` | 此安裝的唯一資源前綴 |
| `region` | 您的帳戶有 MicroVM 存取權的 AWS 區域 |
| `hostname`、`route53_zone_id` | 未使用的主機名稱及其現有的公開託管區域 |
| `bedrock_model_id` | 您已啟用的模型或推論設定檔 ID，不含 `bedrock/` 前綴 |
| `bedrock_invoke_resources` | 確切允許的設定檔/模型 ARN，包括跨區域目的地 |
| `computer_lifetime`、`computer_idle_timeout` | VM 生命週期與閒置暫停時間窗（以秒為單位）；範本使用 `28800` 與 `600` |

第一次套用時，讓 `moyai_image` 保持未設定。不要將 AWS 金鑰與秘密放在 `.tfvars` 中。對於您打算保留的安裝，請在 `terraform init` 之前設定具鎖定的加密遠端 Terraform 狀態。

## 2. 佈建 AWS 基礎架構 {#2-provision-aws-infrastructure}

檢閱計畫，然後套用它來建立基礎架構、空的 ECR 儲存庫與 Secrets Manager 秘密：

```bash
terraform -chdir=deploy/aws init
terraform -chdir=deploy/aws plan -out=installation.tfplan
terraform -chdir=deploy/aws apply installation.tfplan
```

## 3. 建置並釘選應用程式映像 {#3-build-and-pin-the-application-image}

建置目前的簽出並將它推送到 ECR 儲存庫：

```bash
MOYAI_REPOSITORY=$(terraform -chdir=deploy/aws output -raw application_repository)
MOYAI_REVISION=$(git rev-parse HEAD)
MOYAI_REGION=$(terraform -chdir=deploy/aws output -json quickstart | python3 -c 'import json,sys; print(json.load(sys.stdin)["region"])')

aws ecr get-login-password --region "$MOYAI_REGION" |
  docker login --username AWS --password-stdin "${MOYAI_REPOSITORY%%/*}"
docker buildx build --platform linux/amd64 \
  --build-arg MOYAI_BUILD_SHA="$MOYAI_REVISION" \
  --tag "$MOYAI_REPOSITORY:$MOYAI_REVISION" --push .
docker logout "${MOYAI_REPOSITORY%%/*}"

aws ecr describe-images --region "$MOYAI_REGION" \
  --repository-name "${MOYAI_REPOSITORY#*/}" \
  --image-ids "imageTag=$MOYAI_REVISION" \
  --query 'imageDetails[0].imageDigest' --output text
```

將 `terraform.tfvars` 中的 `moyai_image` 釘選為儲存庫 URL，後面加上 `@` 與回傳的 `sha256:` 摘要。

```bash
terraform -chdir=deploy/aws plan -out=application.tfplan
terraform -chdir=deploy/aws apply application.tfplan
```

保留快速入門釘選的 LiteLLM 映像，除非您已測試過替代品。為 Moyai 使用其 `bedrock/<model ID>` 別名；閘道會以主機 IAM 角色驗證。

## 4. 初始化憑證 {#4-initialize-credentials}

在簽出之外建立一個檔案模式為 `0600` 的 JSON 檔案。使用 `{}` 在沒有 Slack 的情況下開始。若要啟用 Slack，請提供全部六個欄位：

```json
{
  "SLACK_CLIENT_ID": "your-client-id",
  "SLACK_CLIENT_SECRET": "your-client-secret",
  "SLACK_SIGNING_SECRET": "your-signing-secret",
  "SLACK_TEAM_ID": "T_YOUR_WORKSPACE",
  "SLACK_SESSION_USERS": "U_YOUR_TEST_USER",
  "GOOGLE_ALLOWED_DOMAINS": "example.com"
}
```

將 `GOOGLE_ALLOWED_DOMAINS` 設定為您的 Slack 使用者的電子郵件網域。空白的政策會拒絕他們。您不需要啟用 Google OAuth。

```bash
uv run python deploy/aws/quickstart.py secrets \
  --secret-file /secure/path/moyai.json
```

執行 `secrets` 以在 Secrets Manager 中產生資料庫、閘道與管理員密碼。重試時重用相同的輸入，以保留現有的憑證。若要選擇管理員密碼，請在 JSON 中將 `WORKSPACE_PASSWORD` 設定為至少 24 個字元。

## 5. 建置 MicroVM 映像並安裝 Moyai {#5-build-the-microvm-image-and-install-moyai}

```bash
uv run python deploy/aws/quickstart.py image
uv run python deploy/aws/quickstart.py install
uv run python deploy/aws/quickstart.py status
terraform -chdir=deploy/aws output -raw app_url
```

使用 `image` 建置並釘選來賓及其工具與暫停/還原掛鉤。使用 `install` 透過 SSM 在 EC2 上啟動 Docker 分割套件。主機從 Secrets Manager 讀取憑證，並將安裝金鑰保存在加密的 EBS 上。

安裝程式會從佈建的資源設定 `SANDBOX_PROVIDER=lambda`、`LAMBDA_REGION`、`LAMBDA_IMAGE`、`LAMBDA_IMAGE_VERSION` 與 `LAMBDA_CHECKPOINT_BUCKET`。對於現有的部署，請使用[手動 Lambda 設定](https://github.com/BerriAI/moyai/blob/main/docs/aws-lambda-microvms.md)。

以 `terraform -chdir=deploy/aws output -raw runtime_secret_arn` 找到執行階段秘密 ARN，然後在 Secrets Manager 中讀取 `WORKSPACE_PASSWORD`。開啟 `app_url` 並以 `admin` 登入。

檢查 `status` 是否完成安裝，然後在應用程式中測試模型執行與復原。

## 6. 驗證任務與工作區復原 {#6-verify-a-task-and-workspace-recovery}

請 Moyai 在 `/workspace` 下以唯一名稱建立一個檔案，讀取它，並儲存以供下載。檢查工具輸出、下載檔案，並確認檢查點。在同一個對話中傳送後續訊息，請 Moyai 讀取已儲存的檔案。

| 測試 | 預期結果 |
|---|---|
| 讓已完成的工作階段變成 `SUSPENDED`，然後傳送後續訊息 | 同一個 VM 會連同其檔案、記憶體與背景程序一起還原 |
| 在閒置時間窗之外保持任務進行中 | Moyai 的健康探測會在該輪次與檢查點儲存期間保持 VM 進行中 |
| 讓測試 VM 達到其生命週期限制，然後傳送後續訊息 | 新的 VM 會還原最後接受的 S3 檔案系統檢查點；RAM 與執行中的程序會消失 |
| 在保留 RDS、S3 與 EBS 的情況下重新啟動應用程式 | 您可以登入、讀取工作階段歷史，並完成後續訊息 |

在一次性的測試安裝中，在**安裝之前**將 `computer_lifetime=600` 與 `computer_idle_timeout=60` 設定好，以十分鐘的 VM 生命週期測試到期。檢查您的工作負載所依賴的檔案總和檢查碼、已安裝套件、權限、符號連結與刪除。使用[上游驗收檢查](https://github.com/BerriAI/moyai/blob/main/docs/aws-lambda-microvms.md#slack-and-checkpointrestore-acceptance)記錄 VM ID 與檢查點結果。

### 連接 Slack {#connect-slack}

在專用的 Slack 應用程式中，於您的 `app_url` 下註冊這些 URL：

| Slack 設定 | 路徑 |
|---|---|
| OAuth 重新導向 | `/oauth/slack/callback` |
| 事件 | `/hooks/slack/events` |
| 互動 | `/hooks/slack/interactions` |

透過 **Connections → Slack** 完成 OAuth，並使用請求的範圍與事件訂閱。讓已簽署的 webhook 可透過 HTTPS 到達。在一個 Slack 討論串中重複任務與復原檢查，包括構件傳遞。檢查 Moyai 是否拒絕未簽署的 Slack 事件與匿名的應用程式 API 請求。

## 限制與操作 {#limits-and-operations}

將 Lambda MicroVM 用於 shell、檔案與瀏覽器工具，以及經驗證的桌面螢幕截圖與動作。對於互動式桌面串流，請選擇 Modal。為準備好的環境建置獨立的 Lambda 映像；您無法重用 Modal 環境映像。

將 VM 生命週期設定為最多八小時，**包括暫停時間**。在閒置暫停期間，您會保留記憶體與程序，直到該期限為止。到期之後，Moyai 會從釘選的映像與 S3 檢查點，將檔案與已安裝套件還原到新的 VM 中。Moyai 不會重播缺少已接受檢查點的未完成輪次。

檢查點使用 SSE-S3（`AES256`）；不支援僅使用 SSE-KMS 的儲存貯體。保留受保留檢查點參照的來賓映像版本。

將安裝金鑰與應用程式資料庫及 S3 參照一起備份。在生產使用之前測試還原它們；每日 EBS 備份是故障一致性的。應用程式升級與設定變更請遵循[維護程序](https://github.com/BerriAI/moyai/blob/main/deploy/docker/README.md#maintenance-upgrades)。僅執行 `terraform apply` 並不會執行這些程序。

拆除時，請遵循 [AWS 清理步驟](https://github.com/BerriAI/moyai/blob/main/deploy/aws/README.md#operations-upgrades-and-teardown)，處理來賓映像、保留的 S3 物件、ECR 映像、備份與刪除保護。透過 MicroVM API 刪除來賓映像；Terraform 不管理它們。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查 |
|---|---|
| MicroVM 映像建置或啟動被拒絕 | 區域專屬的 MicroVM 存取權、映像/VM 容量、範圍限定的 IAM 權限，以及釘選映像的 `SUCCESSFUL` 狀態 |
| 安裝拒絕該映像 | `moyai_image` 必須包含 ECR 摘要，並與部署套件所用的簽出相符 |
| Bedrock 叫用被拒絕 | 模型存取權與推論設定檔所需的每個 ARN，包括目的地地區 |
| 安裝程式完成，但任務失敗 | 應用程式中的模型/工具輸出、SSM 叫用詳細資料，以及服務的 CloudWatch 日誌 |
| Slack 使用者無法登入或傳送任務 | OAuth 安裝、團隊/使用者許可清單，以及 `GOOGLE_ALLOWED_DOMAINS` |
| 工作區無法還原 | 已接受的檢查點、原始釘選的映像/版本、S3 前綴權限，以及 SSE-S3 加密 |
