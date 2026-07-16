import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /batchPredictionJobs {#batchpredictionjobs}

LiteLLM 透過 passthrough 端點支援 Vertex AI 批次預測工作，讓您能直接透過 proxy server 建立並管理批次工作。

## 功能 {#features}

- **批次工作建立**：使用 Vertex AI 模型建立批次預測工作
- **成本追蹤**：自動計算成本並追蹤批次作業的用量
- **狀態監控**：追蹤工作狀態並擷取結果
- **模型支援**：可搭配所有受支援的 Vertex AI 模型（Gemini、Text Embedding）使用

## 成本追蹤支援 {#cost-tracking-support}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 自動計算批次作業成本 |
| 用量監控 | ✅ | 追蹤跨批次工作的 token 用量與成本 |
| 記錄 | ✅ | 已支援 |

## 快速開始 {#quick-start}

1. **在 proxy 設定中設定您的模型**：

```yaml
model_list:
  - model_name: gemini-1.5-flash
    litellm_params:
      model: vertex_ai/gemini-1.5-flash
      vertex_project: your-project-id
      vertex_location: us-central1
      vertex_credentials: path/to/service-account.json
```

2. **建立批次工作**：

```bash
curl -X POST "http://localhost:4000/v1/projects/your-project/locations/us-central1/batchPredictionJobs" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "my-batch-job",
    "model": "projects/your-project/locations/us-central1/publishers/google/models/gemini-1.5-flash",
    "inputConfig": {
      "gcsSource": {
        "uris": ["gs://my-bucket/input.jsonl"]
      },
      "instancesFormat": "jsonl"
    },
    "outputConfig": {
      "gcsDestination": {
        "outputUriPrefix": "gs://my-bucket/output/"
      },
      "predictionsFormat": "jsonl"
    }
  }'
```

3. **監控工作狀態**：

```bash
curl -X GET "http://localhost:4000/v1/projects/your-project/locations/us-central1/batchPredictionJobs/job-id" \
  -H "Authorization: Bearer your-api-key"
```

## 模型設定 {#model-configuration}

設定批次作業的模型時，請使用以下命名慣例：

- **`model_name`**：基礎模型名稱（例如，`gemini-1.5-flash`）
- **`model`**：完整的 LiteLLM 識別碼（例如，`vertex_ai/gemini-1.5-flash`）

## 支援的模型 {#supported-models}

- `gemini-1.5-flash` / `vertex_ai/gemini-1.5-flash`
- `gemini-1.5-pro` / `vertex_ai/gemini-1.5-pro`
- `gemini-2.0-flash` / `vertex_ai/gemini-2.0-flash`
- `gemini-2.0-pro` / `vertex_ai/gemini-2.0-pro`

## 進階用法 {#advanced-usage}

### 使用自訂參數的批次工作 {#batch-job-with-custom-parameters}

```bash
curl -X POST "http://localhost:4000/v1/projects/your-project/locations/us-central1/batchPredictionJobs" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "advanced-batch-job",
    "model": "projects/your-project/locations/us-central1/publishers/google/models/gemini-1.5-pro",
    "inputConfig": {
      "gcsSource": {
        "uris": ["gs://my-bucket/advanced-input.jsonl"]
      },
      "instancesFormat": "jsonl"
    },
    "outputConfig": {
      "gcsDestination": {
        "outputUriPrefix": "gs://my-bucket/advanced-output/"
      },
      "predictionsFormat": "jsonl"
    },
    "labels": {
      "environment": "production",
      "team": "ml-engineering"
    }
  }'
```

### 列出所有批次工作 {#list-all-batch-jobs}

```bash
curl -X GET "http://localhost:4000/v1/projects/your-project/locations/us-central1/batchPredictionJobs" \
  -H "Authorization: Bearer your-api-key"
```

### 取消批次工作 {#cancel-a-batch-job}

```bash
curl -X POST "http://localhost:4000/v1/projects/your-project/locations/us-central1/batchPredictionJobs/job-id:cancel" \
  -H "Authorization: Bearer your-api-key"
```

## 成本追蹤詳情 {#cost-tracking-details}

LiteLLM 為 Vertex AI 批次作業提供完整的成本追蹤：

- **Token 用量**：追蹤每個批次請求的輸入與輸出 token
- **成本計算**：根據目前 Vertex AI 定價自動計算成本
- **用量彙總**：彙總批次工作中所有請求的成本
- **即時監控**：在批次工作進行時監控成本

成本追蹤可與 `generateContent` API 無縫運作，並提供批次處理支出的詳細洞察。

## 錯誤處理 {#error-handling}

常見錯誤情境及其解決方案：

| 錯誤 | 說明 | 解決方案 |
|-------|-------------|----------|
| `INVALID_ARGUMENT` | 模型或設定無效 | 驗證模型名稱與專案設定 |
| `PERMISSION_DENIED` | 權限不足 | 檢查 Vertex AI IAM 角色 |
| `RESOURCE_EXHAUSTED` | 配額已超出 | 檢查 Vertex AI 配額與限制 |
| `NOT_FOUND` | 找不到工作或資源 | 驗證工作 ID 與專案設定 |

## 最佳實務 {#best-practices}

1. **使用適當的批次大小**：在處理效率與資源使用之間取得平衡
2. **監控工作狀態**：定期檢查工作狀態，以便及時處理失敗
3. **設定警示**：為工作完成與失敗設定監控
4. **最佳化成本**：使用成本追蹤找出最佳化機會
5. **先以小批次測試**：先用小型測試批次驗證您的設定

## 相關文件 {#related-documentation}

- [Vertex AI 提供者文件](./providers/vertex.md)
- [一般 Batches API 文件](./batches.md)
- [成本追蹤與監控](./proxy/logging)
