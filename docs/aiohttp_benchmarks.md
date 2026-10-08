# LiteLLM v1.71.1 基準測試 {#litellm-v1711-benchmarks}

## 概覽 {#overview}

本文 प्रस्तुत了比較 LiteLLM v1.71.1 與先前 litellm 版本的效能基準測試。

**相關 PR：** [#11097](https://github.com/BerriAI/litellm/pull/11097)

## 測試方法 {#testing-methodology}

負載測試是使用以下參數進行的：
- **請求速率：** 200 RPS（每秒請求數）
- **使用者漸增：** 200 個並行使用者
- **傳輸比較：** httpx（既有）對比 aiohttp（新實作）
- **litellm 的 pod/執行個體數：** 1
- **機器規格：** 2 vCPU、4GB RAM
- **LiteLLM 設定：**
    - 針對 [fake openai endpoint](https://exampleopenaiendpoint-production.up.railway.app/) 進行測試
    - aiohttp 在 v1.71.1 時為選用，因此 aiohttp 執行時設定了 `USE_AIOHTTP_TRANSPORT="True"`。該旗標現已不存在且不再生效：aiohttp 現在是預設傳輸方式，無需任何設定。若要改用 httpx 傳輸（例如重現 httpx 基準），請設定 `DISABLE_AIOHTTP_TRANSPORT="True"` 或 `litellm.disable_aiohttp_transport = True`。啟用 HTTP/2（`LITELLM_HTTP2="True"`）也會強制使用 httpx

## 基準測試結果 {#benchmark-results}

| 指標 | httpx（現有） | aiohttp（LiteLLM v1.71.1） | 改善幅度 | 計算方式 |
|--------|------------------|-------------------|-------------|-------------|
| **RPS** | 50.2 | 224 | **+346%** ✅ | (224 - 50.2) / 50.2 × 100 = 346% |
| **中位延遲** | 2,500ms | 74ms | **-97%** ✅ | (74 - 2500) / 2500 × 100 = -97% |
| **第 95 百分位** | 5,600ms | 250ms | **-96%** ✅ | (250 - 5600) / 5600 × 100 = -96% |
| **第 99 百分位** | 6,200ms | 330ms | **-95%** ✅ | (330 - 6200) / 6200 × 100 = -95% |

## 主要改善 {#key-improvements}

- **每秒請求數提升 4.5 倍**（從 50.2 提升到 224 RPS）
- **中位回應時間減少 97%**（從 2.5 秒降至 74ms）
- **第 95 百分位延遲減少 96%**（從 5.6 秒降至 250ms）
- **第 99 百分位延遲減少 95%**（從 6.2 秒降至 330ms）
