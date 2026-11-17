---
title: 使用 Terraform 提供者管理 LiteLLM
sidebar_label: Terraform
description: 使用 LiteLLM Terraform 提供者在既有的閘道上管理團隊、虛擬金鑰、模型與其他資源。
---

# 使用 Terraform 提供者管理 LiteLLM {#manage-litellm-with-the-terraform-provider}

{/* keep-version-note */}

LiteLLM Terraform 提供者透過正在運行的閘道的 API 管理團隊、虛擬金鑰、模型與其他資源。請在部署閘道之後使用它。若要建立雲端基礎架構，請參閱 [Terraform 部署指南](../deploy/terraform.md)。

## 設定提供者 {#configure-the-provider}

在 `main.tf` 中宣告提供者：

```hcl title="main.tf"
terraform {
  required_providers {
    litellm = {
      source  = "BerriAI/litellm"
      version = "1.104.9" # Example: replace with your gateway's version.
    }
  }
}

provider "litellm" {}
```

提供者版本跟隨 LiteLLM 版本。請將提供者固定為您的閘道所執行的版本。請參閱[提供者版本指引](https://github.com/BerriAI/litellm/tree/main/litellm/deploy/terraform/provider#versioning) 與[已發布版本](https://registry.terraform.io/providers/BerriAI/litellm/latest)。

使用有權管理您資源的 LiteLLM API 金鑰設定閘道 URL。提供者會從環境變數讀取這兩個值。請從您的 CI 祕密儲存庫載入金鑰，以避免它出現在 Terraform 檔案中。

```bash
export LITELLM_API_BASE="https://llm.example.com"
export LITELLM_API_KEY="<your-management-api-key>"
```

將閘道連接到其資料庫。確保執行 Terraform 的機器可以連到閘道。

## 建立團隊 {#create-a-team}

將此資源加入 `main.tf` 以建立名為 `development-team` 的團隊。

```hcl
resource "litellm_team" "development" {
  team_alias = "development-team"
}
```

安裝提供者、檢視提議的變更，並套用它：

```bash
terraform init
terraform plan
terraform apply
```

該團隊會出現在 Admin UI 的 **Teams** 下。在 Terraform 中變更該資源以更新其設定。若要設定模型存取、預算、速率限制與權限，請參閱[團隊資源參考](https://registry.terraform.io/providers/BerriAI/litellm/latest/docs/resources/team)。

## 管理既有的團隊 {#manage-an-existing-team}

加入相符的資源區塊，然後從 LiteLLM 匯入團隊的 ID：

```bash
terraform import litellm_team.development '<team-id>'
terraform plan
```

請使用團隊 ID，它可能與其顯示名稱不同。在下一次套用前檢視計畫並更新您的設定。

[提供者參考](https://registry.terraform.io/providers/BerriAI/litellm/latest/docs) 列出支援的資源與資料來源，包括虛擬金鑰、模型、使用者與 MCP 伺服器。提供者原始碼與開發說明位於 [BerriAI/litellm](https://github.com/BerriAI/litellm/tree/main/litellm/deploy/terraform/provider)。
