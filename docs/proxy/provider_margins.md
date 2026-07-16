# LLM 成本的費用/價格加成 {#feeprice-margin-on-llm-costs}

對特定提供者或全域套用按百分比或固定金額的加成。這對於需要將營運額外成本加到內部使用者帳單上的企業很有幫助。

## 何時使用此功能 {#when-to-use-this-feature}

如果您的生成式 AI 平台包含各種營運與架構額外負擔，以及基礎架構成本，您可能需要具備將額外費用或加成套用到總 LLM 成本的能力。 

**常見使用情境：**
- **內部轉帳收費** - 向內部團隊收費時加入營運額外成本
- **成本回收** - 回收基礎架構、支援與平台維護成本

## 透過 UI 設定加成 {#setup-margins-via-ui}

這個操作說明示範如何新增提供者加成，並在 LiteLLM UI 中查看成本明細。

### 步驟 1：前往設定 {#step-1-navigate-to-settings}

從 LiteLLM 儀表板，按一下左側側邊欄的 **Settings**。

![點選設定](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/a9a42382-1c93-4338-8c7e-c0ebc4ee239f/ascreenshot.jpeg?tl_px=0,730&br_px=2064,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=47,292)

### 步驟 2：開啟成本追蹤 {#step-2-open-cost-tracking}

按一下 **Cost Tracking** 以存取成本設定選項。

![點選成本追蹤](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/c3ad52c0-1c8d-4be5-bd04-1e37ce186c8e/ascreenshot.jpeg?tl_px=0,730&br_px=2064,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=65,403)

### 步驟 3：選取費用/價格加成 {#step-3-select-feeprice-margin}

按一下 **Fee/Price Margin** - 此區段可讓您為 LLM 成本新增費用或加成，以利內部計費與成本回收。

![點選費用／價格利潤](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/0810c7bf-e927-4ab6-a55d-37c51d8c17af/ascreenshot.jpeg?tl_px=553,0&br_px=2618,1153&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=551,220)

### 步驟 4：新增提供者加成 {#step-4-add-provider-margin}

按一下 **+ Add Provider Margin** 以建立新的加成設定。

![點選新增提供者利潤](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/8762b7d9-74e5-45eb-acc3-be0d9c5b799d/ascreenshot.jpeg?tl_px=553,2&br_px=2618,1155&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=929,277)

### 步驟 5：選取提供者 {#step-5-select-provider}

按一下搜尋欄位以選取要套用加成的提供者。

![點選搜尋欄位](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/7ff01cdc-2749-43f3-a46f-4fd5543446e3/ascreenshot.jpeg?tl_px=507,0&br_px=2572,1153&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,177)

您可以選取 **Global (All Providers)** 將加成套用至所有提供者，或選擇像 Bedrock、OpenAI 或 Anthropic 之類的特定提供者。

![選取全域](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/c9efe187-0995-45ae-9366-290cb20835a2/ascreenshot.jpeg?tl_px=0,0&br_px=2064,1153&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=485,182)

在這個範例中，我們將選取 **Bedrock** 作為提供者。

![選取 Bedrock](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/ea1524ed-7217-4ee6-9beb-797e3ff08b3a/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1462&force_format=jpeg&q=100&width=1120.0)

### 步驟 6：選擇加成類型 {#step-6-choose-margin-type}

選取加成類型。您可以在 **Percentage-based**（例如，10% 加價）或 **Fixed Amount**（例如，每個請求 $0.001）之間選擇。

![點選百分比](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/137ffea5-0a5e-445a-809f-a85d20701c87/ascreenshot.jpeg?tl_px=0,0&br_px=2064,1153&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=355,259)

在這個範例中，我們將選取 **Fixed Amount**，為每個請求新增固定費用。

![點選固定金額](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/56828562-2bae-4f69-b68e-13b1b6a03aa6/ascreenshot.jpeg?tl_px=0,0&br_px=2064,1153&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=493,252)

### 步驟 7：輸入加成值 {#step-7-enter-margin-value}

輸入加成值。在這個範例中，我們新增的是每個請求 $25 的固定費用。

![輸入利潤值](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/80018d4b-0205-43a3-a534-9a0e39ddf139/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1462&force_format=jpeg&q=100&width=1120.0)

### 步驟 8：儲存加成 {#step-8-save-the-margin}

按一下 **Add Provider Margin** 以儲存您的設定。

![點選新增提供者利潤](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/84a5bcb8-f475-4aef-83ec-f0b3b620613f/ascreenshot.jpeg?tl_px=553,206&br_px=2618,1359&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=636,276)

### 步驟 9：在 Playground 測試加成 {#step-9-test-the-margin-in-playground}

前往 **Playground**，透過發出請求來測試您的加成設定。

![點選 Playground](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/cda7293a-2439-4301-bc44-211e6d6833a6/ascreenshot.jpeg?tl_px=0,0&br_px=2064,1153&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=37,106)

選取模型並傳送測試訊息。

![傳送測試訊息](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/48c3e28e-a01a-483c-838d-2d1643f44be7/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1462&force_format=jpeg&q=100&width=1120.0)

在訊息欄位中輸入您的提示詞並送出。

![輸入提示詞](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/88963dbe-6bad-4aac-8bd3-7f4eac0dd995/ascreenshot.jpeg?tl_px=243,730&br_px=2308,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,451)

您會收到模型的回應。

![檢視回應](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/1d69ef9c-cc22-40ad-8f10-f14a359d2fb6/ascreenshot.jpeg?tl_px=553,17&br_px=2618,1170&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=549,276)

### 步驟 10：在記錄中查看成本明細 {#step-10-view-cost-breakdown-in-logs}

前往 **Logs** 以查看您這次請求的詳細成本明細。

![點選記錄](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/5cf6dd8b-0783-41ee-b23a-32f3424c2092/ascreenshot.jpeg?tl_px=0,99&br_px=2064,1252&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=32,276)

按一下展開圖示以查看請求詳細資訊。

![點選展開圖示](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/3ae2900f-1515-4bb9-a4aa-328b43f13b61/ascreenshot.jpeg?tl_px=0,12&br_px=2064,1165&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=187,277)

### 步驟 11：查看成本明細細節 {#step-11-view-cost-breakdown-details}

按一下 **Cost Breakdown** 以查看總成本如何計算，包括加成。

![點選成本明細](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/8bce9050-58ca-4860-9e18-1b704e086cf4/ascreenshot.jpeg?tl_px=392,575&br_px=2457,1728&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,276)

成本明細會顯示已新增的加成金額。在這個範例中，您可以清楚看到 **+$25.00** 的加成。

![檢視利潤金額](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/c4a65d38-a47a-4634-baf2-608447a7d711/ascreenshot.jpeg?tl_px=0,730&br_px=2064,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=388,282)

總成本反映基礎 LLM 成本加上加成，讓您完整掌握成本結構。

![檢視總成本](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-25/3b13550d-5255-4818-b3ee-3d4391991c13/ascreenshot.jpeg?tl_px=0,730&br_px=2064,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=384,323)

## 透過設定檔設定加成 {#setup-margins-via-config}

您也可以直接在您的 `config.yaml` 檔案中設定加成。

**步驟 1：將加成設定加入 config.yaml**

```yaml
# Apply margins to providers
litellm_settings:
  cost_margin_config:
    global: 0.05            # 5% global margin on all providers
    openai: 0.10            # 10% margin for OpenAI (overrides global)
    anthropic:
      fixed_amount: 0.001   # $0.001 fixed fee per request
```

**步驟 2：啟動 proxy**

```bash
litellm /path/to/config.yaml
```

加成會自動套用到已設定提供者的所有成本計算。

## 加成如何運作 {#how-margins-work}

- 加成會在折扣**之後**套用（如果有設定）
- 加成與折扣是獨立計算的
- 您可以使用：
  - **Percentage-based**：`{"openai": 0.10}` = 10% 加成
  - **Fixed amount**：`{"openai": {"fixed_amount": 0.001}}` = 每個請求 $0.001
  - **Global**：`{"global": 0.05}` = 所有提供者 5% 加成（除非存在特定提供者的加成）
- 特定提供者的加成會覆蓋全域加成
- 加成資訊會記錄在成本明細記錄中
- 加成資訊會透過回應標頭傳回：
  - `x-litellm-response-cost-margin-amount` - 以 USD 計算的新增總加成
  - `x-litellm-response-cost-margin-percent` - 套用的加成百分比

## 加成計算範例 {#margin-calculation-examples}

**範例 1：僅百分比加成**
```yaml
litellm_settings:
  cost_margin_config:
    openai: 0.10  # 10% margin
```
如果基礎成本是 $1.00，最終成本 = $1.00 x 1.10 = $1.10

**範例 2：僅固定金額**
```yaml
litellm_settings:
  cost_margin_config:
    anthropic:
      fixed_amount: 0.001  # $0.001 per request
```
如果基礎成本是 $1.00，最終成本 = $1.00 + $0.001 = $1.001

**範例 3：具有提供者覆寫的全域加成**
```yaml
litellm_settings:
  cost_margin_config:
    global: 0.05   # 5% global margin
    openai: 0.10   # 10% margin for OpenAI (overrides global)
```
- OpenAI 請求：套用 10% 加成
- 所有其他提供者：套用 5% 加成

## 含折扣的加成 {#margins-with-discounts}

加成與折扣是獨立計算的：

1. 計算基礎成本
2. 套用折扣（如果有設定）
3. 將加成套用到折扣後的成本

**範例：**
```yaml
litellm_settings:
  cost_discount_config:
    openai: 0.05  # 5% discount
  cost_margin_config:
    openai: 0.10  # 10% margin
```

如果基礎成本是 $1.00：
- 折扣後：$1.00 x 0.95 = $0.95
- 加成後：$0.95 x 1.10 = $1.045

## 支援的提供者 {#supported-providers}

您可以將加成套用到所有 LiteLLM 支援的提供者，或使用 `global` 套用到所有提供者。常見範例如下：

- `global` - 套用到所有提供者（除非存在特定提供者的加成）
- `openai` - OpenAI
- `anthropic` - Anthropic
- `vertex_ai` - Google Vertex AI
- `gemini` - Google Gemini
- `azure` - Azure OpenAI
- `bedrock` - AWS Bedrock

請參閱 [LlmProviders](https://github.com/BerriAI/litellm/blob/main/litellm/types/utils.py) 列舉中的完整提供者清單。
