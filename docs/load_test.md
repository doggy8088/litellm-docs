import Image from '@theme/IdealImage';

# LiteLLM Proxy - Locust 負載測試 {#litellm-proxy---locust-load-test}

## Locust 負載測試 LiteLLM Proxy  {#locust-load-test-litellm-proxy}

1. 將 `fake-openai-endpoint` 加入您的 proxy config.yaml，並啟動您的 litellm proxy。

LiteLLM 提供一個免費託管的 `fake-openai-endpoint`，您可以對其進行負載測試。您也可以使用 [github.com/BerriAI/example_openai_endpoint](https://github.com/BerriAI/example_openai_endpoint) 自行架設您的假 OpenAI proxy server。

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
```

2. `uv add locust`

3. 在您的本機建立一個名為 `locustfile.py` 的檔案。將 [這裡](https://github.com/BerriAI/litellm/blob/main/.github/workflows/locustfile.py) 的 litellm 負載測試內容複製過來

4. 啟動 locust
  在與步驟 2 中的 `locustfile.py` 相同目錄下執行 `locust`

  ```shell
  locust
  ```

  終端機輸出
  ```
  [2024-03-15 07:19:58,893] Starting web interface at http://0.0.0.0:8089
  [2024-03-15 07:19:58,898] Starting Locust 2.24.0
  ```

5. 在 locust 上執行負載測試

  前往 http://0.0.0.0:8089 的 locust UI

  設定 Users=100、Ramp Up Users=10、Host=您的 LiteLLM Proxy 的 Base URL

  <Image img={require('../img/locust_load_test.png')} />

6. 預期結果

  預期會看到 `/health/readiness` 的以下回應時間
  中位數 → /health/readiness 為 `150ms`

  平均值 →  /health/readiness 為 `219ms`

  <Image img={require('../img/litellm_load_test.png')} />
