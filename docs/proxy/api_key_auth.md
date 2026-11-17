# 使用 Virtual Key {#use-a-virtual-key}

{/* keep-version-note */}

呼叫閘道時，將 LiteLLM Virtual Key 作為 bearer token 傳送。

## 運作方式 {#how-it-works}

LiteLLM 會在每個請求的 `Authorization` 標頭中查找 Virtual Key，以識別呼叫者。請使用為此閘道核發的金鑰；模型提供者的憑證是在閘道上另外設定的。

## 必要條件 {#prerequisites}

向您的管理員取得 Virtual Key、閘道 URL，以及可用的模型名稱。管理員可以[建立與管理 Virtual Keys](./virtual_keys.md)，並在 [Access Management](./access_management/overview.md) 中設定其權限。

## 設定 {#setup}

在您的用戶端環境中設定閘道 URL 與您的 Virtual Key：

```bash
export LITELLM_PROXY_URL="https://litellm.example.com"
export LITELLM_API_KEY="<your-virtual-key>"
```

## 測試身分驗證 {#send-the-virtual-key-in-a-request}

呼叫金鑰可用的模型。將 `my-model` 換成其設定的模型名稱：

```bash
curl "$LITELLM_PROXY_URL/v1/chat/completions" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "my-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

請求應回傳模型回應。若身分驗證失敗，請確認金鑰與閘道 URL 來自同一位管理員。

## 疑難排解 {#troubleshooting}

確認金鑰處於啟用狀態、尚未到期，且以 `Authorization: Bearer <key>` 傳送。若是模型存取被拒絕，請管理員檢查金鑰的[模型權限](./access_management/llm.md)。

## 相關指南 {#related-guides}

<a id="use-the-openai-sdk"></a>

使用 [OpenAI SDK 範例](./user_keys.md#chatcompletions) 或 [Client Setup](./client_setup/overview.md) 來設定您的應用程式。若要直接傳送身分提供者的 token，請參閱[身分提供者設定](./token_auth.md)或 [OAuth 2.0 提供者設定](./oauth2.md)。
