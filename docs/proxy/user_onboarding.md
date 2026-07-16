# 使用者上手指南 {#user-onboarding-guide}

一份逐步指南，協助管理員將使用者導入您的 LiteLLM proxy 執行個體，並幫助使用者使用其 API 金鑰開始使用。

---

## 給管理員 {#for-administrators}

### 步驟 1：建立使用者帳號 {#step-1-create-a-user-account}

您可以透過管理員 UI 或使用 API 建立使用者帳號。

#### 管理員 UI {#admin-ui}
- 前往（`/ui` 端點）
- 導覽至內部使用者區段
- 點擊「新增使用者」並填寫所需詳細資訊

#### API {#api}
```bash
curl -X POST http://localhost:4000/user/new \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{"user_email": "user@example.com"}'
```

---

### 步驟 2：授與存取權與權限 {#step-2-grant-access--permissions}

- 視需要將使用者指派到團隊（可選）
- 設定預算、速率限制與允許的模型
- 為使用者產生 API 金鑰（透過 UI 或 API）

#### **產生 API 金鑰（API 範例）** {#generate-api-key-api-example}
```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer <admin-key>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user-id>", "max_budget": 100}'
```

---

## 給終端使用者 {#for-end-users}

### 步驟 3：驗證您的 API 金鑰 {#step-3-validate-your-api-key}

在進行 LLM 請求之前，先呼叫 `/v1/models` 端點以驗證您的金鑰是否可用：

```bash
curl -X GET http://localhost:4000/v1/models \
  -H "Authorization: Bearer <your-api-key>"
```
- 如果您的金鑰有效，您將會取得可用模型清單。
- 如果無效，您將會看到 401 錯誤。

---

### 步驟 4：Hello World - 完成您的第一次 LLM 請求 {#step-4-hello-world---make-your-first-llm-call}

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 疑難排解 {#troubleshooting}
- 如果您看到 401 錯誤，請向您的管理員確認您的金鑰已啟用，且您有權存取所請求的模型。
- 使用 `/v1/models` 端點可快速檢查您的金鑰是否有效，而不會消耗 LLM token。

---

## 另請參閱 {#see-also}
- [proxy 快速上手](./quick_start.md)
- [使用者管理](./users.md)
- [金鑰管理](./virtual_keys.md)
