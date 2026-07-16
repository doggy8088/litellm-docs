import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 LiteLLM 將記錄寫入 Elasticsearch {#elasticsearch-logging-with-litellm}

使用 OpenTelemetry 將您的 LLM 請求、回應、成本與效能資料傳送到 Elasticsearch 進行分析與監控。

<Image img={require('../../img/elasticsearch_demo.png')} />

## 快速開始 {#quick-start}

### 1. 啟動 Elasticsearch {#1-start-elasticsearch}

```bash
# Using Docker (simplest)
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.18.2
```

### 2. 設定 OpenTelemetry Collector {#2-set-up-opentelemetry-collector}

建立 OTEL collector 設定檔 `otel_config.yaml`：

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  debug:
    verbosity: detailed
  otlphttp/elastic:
    endpoint: "http://localhost:9200"
    headers: 
      "Content-Type": "application/json"

service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [debug, otlphttp/elastic]
    traces:
      receivers: [otlp]
      exporters: [debug, otlphttp/elastic]
    logs: 
      receivers: [otlp]
      exporters: [debug, otlphttp/elastic]
```

啟動 OpenTelemetry collector：
```bash
docker run -p 4317:4317 -p 4318:4318 \
    -v $(pwd)/otel_config.yaml:/etc/otel-collector-config.yaml \
    otel/opentelemetry-collector:latest \
    --config=/etc/otel-collector-config.yaml
```

### 3. 安裝 OpenTelemetry 依賴項 {#3-install-opentelemetry-dependencies}

```bash
uv add opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
```

### 4. 設定 LiteLLM {#4-configure-litellm}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

建立 `config.yaml` 檔案：

```yaml
model_list:
  - model_name: gpt-4.1
    litellm_params:
      model: openai/gpt-4.1
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["otel"]

general_settings:
  otel: true
```

設定環境變數並啟動 proxy：
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
litellm --config config.yaml
```

</TabItem>
<TabItem value="python-sdk" label="Python SDK">

在您的 Python 程式碼中設定 OpenTelemetry：

```python
import litellm
import os

# Configure OpenTelemetry
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:4317"

# Enable OTEL logging
litellm.callbacks = ["otel"]

# Make your LLM calls
response = litellm.completion(
    model="gpt-4.1",
    messages=[{"role": "user", "content": "Hello, world!"}]
)
```

</TabItem>
</Tabs>

### 5. 測試整合 {#5-test-the-integration}

發出測試請求以驗證記錄是否正常運作：

<Tabs>
<TabItem value="curl-proxy" label="測試 Proxy">

```bash
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4.1",
    "messages": [{"role": "user", "content": "Hello from LiteLLM!"}]
  }'
```

</TabItem>
<TabItem value="python-test" label="測試 Python SDK">

```python
import litellm

response = litellm.completion(
    model="gpt-4.1",
    messages=[{"role": "user", "content": "Hello from LiteLLM!"}],
    user="test-user"
)
print("Response:", response.choices[0].message.content)
```

</TabItem>
</Tabs>

### 6. 驗證是否正常運作 {#6-verify-its-working}

```bash
# Check if traces are being created in Elasticsearch
curl "localhost:9200/_search?pretty&size=1"
```

您應該會看到帶有結構化欄位的 OpenTelemetry trace 資料，對應您的 LLM 請求。

### 7. 在 Kibana 中視覺化 {#7-visualize-in-kibana}

啟動 Kibana 以視覺化您的 LLM telemetry 資料：

```bash
docker run -d --name kibana --link elasticsearch:elasticsearch -p 5601:5601 docker.elastic.co/kibana/kibana:8.18.2
```

在 http://localhost:5601 開啟 Kibana，並為您的 LiteLLM traces 建立 index pattern：

<Image img={require('../../img/elasticsearch_demo.png')} />

## 生產環境設定 {#production-setup}

**使用 Elasticsearch Cloud：**

更新您的 `otel_config.yaml`：
```yaml
exporters:
  otlphttp/elastic:
    endpoint: "https://your-deployment.es.region.cloud.es.io"
    headers: 
      "Authorization": "Bearer your-api-key"
      "Content-Type": "application/json"
```

**Docker Compose（完整堆疊）：**
```yaml
# docker-compose.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.18.2
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
      
  otel-collector:
    image: otel/opentelemetry-collector:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel_config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"
      - "4318:4318"
    depends_on:
      - elasticsearch
      
  litellm:
    image: docker.litellm.ai/berriai/litellm:latest
    ports:
      - "4000:4000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
    command: ["--config", "/app/config.yaml"]
    volumes:
      - ./config.yaml:/app/config.yaml
    depends_on:
      - otel-collector
```

**config.yaml：**
```yaml
model_list:
  - model_name: gpt-4.1
    litellm_params:
      model: openai/gpt-4.1
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  callbacks: ["otel"]

general_settings:
  master_key: sk-1234
  otel: true
```
