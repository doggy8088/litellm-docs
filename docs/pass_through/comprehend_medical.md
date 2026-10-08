# Amazon Comprehend Medical {#amazon-comprehend-medical}

[Amazon Comprehend Medical](https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html) 的透傳端點 - 以原生 AWS 格式（不進行翻譯）在臨床文字中偵測實體、PHI，以及醫療本體連結。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 適用於下列同步文字操作 |
| 記錄 | ✅ | 可在所有整合中運作 |
| 終端使用者追蹤 | ❌ | [如果您需要這項功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | Comprehend Medical API 不提供 |

只要將 `https://comprehendmedical.{aws_region_name}.amazonaws.com` 替換為 `LITELLM_PROXY_BASE_URL/comprehendmedical` 即可 🚀

LiteLLM 會使用代理程式的 AWS 憑證，透過 SigV4 對轉送的請求簽章，因此用戶端只需要一組 LiteLLM 虛擬金鑰。

## 快速開始 {#quick-start}

1. 在代理環境中設定 AWS 憑證與區域

```bash showLineNumbers
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_REGION_NAME="us-east-1"
```

2. 啟動代理

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 透過代理呼叫 Comprehend Medical 操作

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/comprehendmedical/DetectEntitiesV2' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{"Text": "Patient is taking 40mg of atorvastatin daily for hyperlipidemia."}'
```

URL 中的操作名稱必須是受支援的同步文字操作之一：`DetectEntitiesV2`、`DetectPHI`、`InferICD10CM`、`InferRxNorm`，或 `InferSNOMEDCT`。其他操作（例如非同步批次作業 API）會回傳 400，並列出受支援的集合。[查看所有 Comprehend Medical 操作](https://docs.aws.amazon.com/comprehend-medical/latest/api/API_Operations.html)

## 與 AWS SDK（boto3）一起使用 {#usage-with-the-aws-sdk-boto3}

將 SDK 的 `endpoint_url` 指向 `LITELLM_PROXY_BASE_URL/comprehendmedical`。代理會依據 AWS JSON 1.1 通訊協定，從 SDK 的 `X-Amz-Target` 標頭讀取操作。

```python showLineNumbers
import boto3

client = boto3.client(
    "comprehendmedical",
    region_name="us-east-1",
    endpoint_url="http://0.0.0.0:4000/comprehendmedical",
    aws_access_key_id="placeholder",
    aws_secret_access_key="placeholder",
)
client.meta.events.register(
    "before-send.comprehendmedical.*",
    lambda request, **kwargs: request.headers.__setitem__("x-litellm-api-key", "sk-<your-litellm-api-key>"),
)

response = client.detect_phi(Text="John Smith was admitted on 2026-08-01.")
print(response["Entities"])
```

SDK 仍會使用預留的憑證在本機對請求簽章，但 LiteLLM 會捨棄該簽章，使用 `x-litellm-api-key` 標頭中的 LiteLLM 虛擬金鑰驗證呼叫，並以代理的 AWS 憑證重新為請求簽章。

## 成本追蹤 {#cost-tracking}

支出是根據請求的 `Text` 長度計算：Comprehend Medical 依每個已開始的 100 字元單位計費，最低為 1 個單位。LiteLLM 會針對每個操作套用第一級隨選價格/單位：

| 操作 | 每單位價格 |
|-------|-------|
| `DetectEntitiesV2` | $0.01 |
| `DetectPHI` | $0.0014 |
| `InferICD10CM` | $0.0005 |
| `InferRxNorm` | $0.00025 |
| `InferSNOMEDCT` | $0.0075 |

請求會以模型 `comprehendmedical/{Operation}` 與提供者 `comprehendmedical` 記錄，而支出會顯示在一般位置（SpendLogs、金鑰/團隊預算、記錄整合）。此表以外的操作會被 400 拒絕，因此沒有任何 Comprehend Medical 呼叫能繞過支出追蹤。
