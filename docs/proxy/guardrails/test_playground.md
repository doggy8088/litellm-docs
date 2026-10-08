import Image from '@theme/IdealImage';

# 防護欄測試沙盒 {#guardrail-testing-playground}

使用互動式沙盒介面即時測試並比較多個防護欄。

<Image img={require('../../../img/guardrail_playground.png')} alt="防護欄測試沙盒" />

## 如何使用防護欄測試沙盒 {#how-to-use-the-guardrail-testing-playground}

防護欄測試沙盒可讓您快速測試並比較不同防護欄對範例輸入的行為。

### 測試防護欄的步驟 {#steps-to-test-guardrails}

1. **前往 Guardrails 區段**
   - 開啟 LiteLLM Admin UI
   - 前往 **Guardrails** 區段

2. **開啟測試沙盒**
   - 點選頁面頂端的 **Test Playground** 分頁

3. **選取要測試的防護欄**
   - 勾選您要比較的防護欄
   - 您可以選取多個防護欄，查看它們各自對同一輸入的回應方式

4. **輸入您的內容**
   - 在文字區域輸入或貼上您的測試內容
   - 這可以是您想根據防護欄驗證的提示、訊息或任何文字

5. **執行測試**
   - 點選 **Test guardrails** 按鈕（或按 Enter）

6. **檢視結果**
   - 查看每個已選取防護欄的輸出
   - 比較不同防護欄如何處理相同輸入
   - 結果會顯示該輸入是否通過或被每個防護欄封鎖

## 使用情境 {#use-cases}

這非常適合評估防護欄解決方案的 **Security Teams** 與 **LiteLLM Admins**。

這為 LiteLLM 使用者帶來以下好處：

- **比較防護欄回應**：同時在多個提供者（Lakera、Noma AI、Bedrock Guardrails 等）上測試相同提示。

- **驗證設定**：在正式部署前，確認您的防護欄能攔截您關心的威脅。
