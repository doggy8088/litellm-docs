# 使用 LiteLLM Proxy 搭配 Anthropic File API {#using-anthropic-file-api-with-litellm-proxy}

## 概觀 {#overview}

本教學示範如何透過 LiteLLM Proxy 使用 Claude-4 在 Anthropic 上建立並分析檔案。

## 先決條件 {#prerequisites}

- LiteLLM Proxy 正在執行
- Anthropic API 金鑰

將下列內容加入您的 `.env` 檔案：
```
ANTHROPIC_API_KEY=sk-1234
```

## 使用方式 {#usage}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: claude-opus
    litellm_params:
      model: anthropic/claude-opus-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
```

## 2. 建立檔案  {#2-create-a-file}

使用 `/anthropic` passthrough 端點來建立檔案。

```bash
curl -L -X POST 'http://0.0.0.0:4000/anthropic/v1/files' \
-H 'x-api-key: sk-1234' \
-H 'anthropic-version: 2023-06-01' \
-H 'anthropic-beta: files-api-2025-04-14' \
-F 'file=@"/path/to/your/file.csv"'
```

預期回應：

```json
{
  "created_at": "2023-11-07T05:31:56Z",
  "downloadable": false,
  "filename": "file.csv",
  "id": "file-1234",
  "mime_type": "text/csv",
  "size_bytes": 1,
  "type": "file"
}
```


## 3. 透過 `/chat/completions` 使用 Claude-4 分析檔案 {#3-analyze-the-file-with-claude-4-via-chatcompletions}

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer $LITELLM_API_KEY' \
-d '{
    "model": "claude-opus",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this sheet?"},
                {
                    "type": "file",
                    "file": {
                        "file_id": "file-1234",
                        "format": "text/csv" # 👈 IMPORTANT: This is the format of the file you want to analyze
                    }
                }
            ]
        }
    ]
}'
```
