# MAX_CALLBACKS 限制 {#max_callbacks-limit}

## 錯誤訊息 {#error-message}

```
Cannot add callback - would exceed MAX_CALLBACKS limit of 100. Current callbacks: 100
```

## 這代表什麼 {#what-this-means}

LiteLLM 會限制可註冊的 callback 數量，以避免效能下降。每個 callback 都會在每次 LLM 請求時執行，因此 callback 太多可能導致 CPU 使用量呈指數成長，並讓您的 proxy 變慢。當 callback 清單已達上限時，LiteLLM 會將此訊息記錄為警告，並略過新的 callback

預設上限為 **100 個 callbacks**。

## 您可能何時會遇到此限制 {#when-you-might-hit-this-limit}

- **大型企業部署**，有許多團隊，各自擁有自己的防護欄
- **多個記錄整合**，再加上自訂 callbacks
- **按團隊的 callback 組態**，累積後超過整個組織的上限

## 如何覆寫 {#how-to-override}

將 `LITELLM_MAX_CALLBACKS` 環境變數設為更高的限制：

```bash
# Docker
docker run -e LITELLM_MAX_CALLBACKS=200 ...

# Docker Compose
environment:
  - LITELLM_MAX_CALLBACKS=200

# Kubernetes
env:
  - name: LITELLM_MAX_CALLBACKS
    value: "200"

# Direct
export LITELLM_MAX_CALLBACKS=200
litellm --config config.yaml
```

## 建議 {#recommendations}

1. **從保守開始** - 只增加到您所需的程度即可。如果您有 150 個使用防護欄的團隊，請嘗試 `LITELLM_MAX_CALLBACKS=175` 以保留餘裕。

2. **監控效能** - 更多 callbacks 代表每個請求需要更多處理。提高限制後，請觀察 CPU 使用量與回應延遲。

3. **盡可能整併** - 如果多個團隊使用相同的防護欄，請考慮使用共用的 callback 組態，而不是每個團隊各自複製一份。

## 範例：大型企業設定 {#example-large-enterprise-setup}

對於一個有 150+ 個團隊的組織，每個團隊都有一個防護欄 callback：

```yaml
# config.yaml
litellm_settings:
  callbacks: ["prometheus", "langfuse"]  # 2 global callbacks

# Each team adds 1 guardrail callback = 150+ callbacks
# Total: 152+ callbacks needed
```

設定環境變數：

```bash
export LITELLM_MAX_CALLBACKS=200
```
