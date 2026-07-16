# CompatCanary {#compatcanary}

[CompatCanary](https://github.com/CognizenOrg/compatcanary) 是一個適用於 OpenAI 相容端點的開源一致性掃描工具。它會透過 LiteLLM proxy 傳送決定性的探測，並記錄 chat completions、streaming、tool calls、structured outputs 與 Responses API 的觀察結果。

從已設定的 LiteLLM model 所公開的 Chat Completions 介面開始：

```bash
export OPENAI_API_KEY="your-litellm-key"
npx --yes compatcanary@latest scan \
  --base-url http://localhost:4000/v1 \
  --model your-model \
  --profile chat
```

使用 `--profile modern` 來包含 Responses API 探測，並使用 `--format markdown` 或 `--format json` 儲存可供審閱的證據，以利本機除錯或 CI。

請參閱 [project repository](https://github.com/CognizenOrg/compatcanary) 與 [可重現的 LiteLLM 設定及已審閱報告](https://github.com/CognizenOrg/compatcanary/blob/main/evidence/setups/litellm-1.91.1-github-models.md)。
