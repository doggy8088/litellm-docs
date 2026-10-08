import Image from '@theme/IdealImage';

# LiteLLM 代理效能 {#litellm-proxy-performance}

本頁上的數字比較了 proxy 與直接呼叫提供者的差異。若要查看閘道容量數字（規模化下每個 pod 的請求、token 與延遲），請參閱 [基準測試](../benchmarks.md)。

### 吞吐量 - 提升 30% {#throughput---30-increase}
LiteLLM 代理程式 + 負載平衡器與原始 OpenAI API 相比，可使吞吐量**提升 30%**
<Image img={require('../../img/throughput.png')} />

### 額外延遲 - 0.00325 秒 {#latency-added---000325-seconds}
與使用原始 OpenAI API 相比，LiteLLM 代理程式會增加**0.00325 秒**延遲
<Image img={require('../../img/latency.png')} />
