# Harbor {#harbor}

[Harbor](https://github.com/laude-institute/harbor) 是 Terminal-Bench 的創作者所推出的框架，用於評估與最佳化代理程式和語言模型。它使用 LiteLLM 呼叫 100+ 個 LLM 提供者。

```bash
# Install
uv add harbor

# Run a benchmark with any LiteLLM-supported model
harbor run --dataset terminal-bench@2.0 \
   --agent claude-code \
   --model anthropic/claude-opus-4-1 \
   --n-concurrent 4
```

主要功能：
- 評估像 Claude Code、OpenHands、Codex CLI 這類代理程式
- 建立並分享基準測試與環境
- 在雲端提供者（Daytona、Modal）之間平行執行實驗
- 產生用於 RL 最佳化的 rollout

- [GitHub](https://github.com/laude-institute/harbor)
- [文件](https://harborframework.com/docs)
