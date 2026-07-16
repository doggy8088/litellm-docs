# 憑證使用追蹤 {#credential-usage-tracking}

當模型連結到 [可重複使用的憑證](./ui_credentials.md) 時，LiteLLM 會自動將憑證名稱作為標籤注入到使用該模型的每個請求中。這表示憑證層級的支出與用量會在不需要額外設定的情況下進行追蹤。

## 運作方式 {#how-it-works}

當您透過 `litellm_credential_name` 將模型連結到可重複使用的憑證時，經由該模型路由的每個請求都會被標記為 `Credential: <name>`（例如，`Credential: xAI`）。這個標籤會傳遞到 `DailyTagSpend`，並顯示在 Usage 頁面的 **Tag** 檢視中，您可以依憑證篩選支出與用量。

如果模型未連結任何憑證，行為不變——不會新增憑證標籤。

## 檢視憑證用量 {#viewing-credential-usage}

在 Admin UI 中，前往 **Usage → Tag**，並尋找帶有 `Credential: ` 前綴的標籤。這些標籤代表在所有使用該憑證的請求中彙總後的支出與 token 用量。

## 相關文件 {#related-documentation}

- [新增 LLM 憑證](./ui_credentials.md) - 如何建立並將可重複使用的憑證連結到模型
- [標籤預算](./tag_budgets.md) - 為標籤設定支出上限
- [標籤路由](./tag_routing.md) - 根據標籤路由請求
