# 目錄結構 {#directory-structure}

當新增一個新的提供者時，您需要為該提供者建立一個目錄，並遵循以下結構：

```
litellm/llms/
└── provider_name/
    ├── completion/ # use when endpoint is equivalent to openai's `/v1/completions`
    │   ├── handler.py
    │   └── transformation.py
    ├── chat/ # use when endpoint is equivalent to openai's `/v1/chat/completions`
    │   ├── handler.py
    │   └── transformation.py
    ├── embed/ # use when endpoint is equivalent to openai's `/v1/embeddings`
    │   ├── handler.py
    │   └── transformation.py
    ├── audio_transcription/ # use when endpoint is equivalent to openai's `/v1/audio/transcriptions`
    │   ├── handler.py
    │   └── transformation.py
    └── rerank/ # use when endpoint is equivalent to cohere's `/rerank` endpoint.
        ├── handler.py
        └── transformation.py
```
