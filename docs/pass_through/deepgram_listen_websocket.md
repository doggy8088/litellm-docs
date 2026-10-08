import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deepgram 即時（`/listen`）WebSocket 透傳 {#deepgram-realtime-listen-websocket-passthrough}

透過 LiteLLM proxy 串流即時音訊到 Deepgram 的即時語音轉文字 API（`wss://api.deepgram.com/v1/listen`）。proxy 會用 LiteLLM 虛擬金鑰驗證呼叫端，在伺服器端注入 Deepgram 憑證，雙向原樣轉送音訊與轉錄框架，並在 socket 關閉時將該工作階段的音訊時長記錄為支出

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 在 socket 關閉時依據 `Metadata.duration` 框架計費，乘以通道數，使用 `deepgram/streaming/<model>` 每秒價格 |
| 記錄 | ✅ | 可跨所有整合運作，每個 WebSocket 工作階段一筆 SpendLogs 資料列 |
| 串流 | ✅ | Deepgram 傳送的中繼與最終 `Results` 框架都會被轉送 |
| 防護欄 | ❌ | 音訊框架是透明位元組；不會對其執行請求或回應防護欄 |

## 端點 {#endpoints}

`ws://<proxy>/deepgram/v1/listen` 及其別名 `ws://<proxy>/deepgram/listen`。兩者都會轉送至 `<DEEPGRAM_API_BASE>/listen`（預設 `wss://api.deepgram.com/v1/listen`）

## 設定 {#configuration}

請將 Deepgram 憑證設定在兩個位置之一。proxy 會先檢查已設定的透傳部署，然後再回退到 `DEEPGRAM_API_KEY` 環境變數

<Tabs>
<TabItem value="env" label="環境變數">

```bash
export DEEPGRAM_API_KEY="your-deepgram-key"
export LITELLM_MASTER_KEY="${LITELLM_MASTER_KEY:-sk-$(openssl rand -hex 16)}"
litellm --config config.yaml --port 4000
```

</TabItem>
<TabItem value="config" label="config.yaml / Admin UI">

新增一個帶有 `use_in_pass_through: true` 的 Deepgram 部署。當您從 Admin UI 新增 Deepgram 模型時，在 Advanced Settings 下的「Use in pass through routes」切換選項也是同一個旗標，因此可以在 dashboard 中管理憑證，無需額外設定

```yaml
model_list:
  - model_name: nova-3
    litellm_params:
      model: deepgram/nova-3
      api_key: os.environ/DEEPGRAM_API_KEY
      use_in_pass_through: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

</TabItem>
</Tabs>

`DEEPGRAM_API_BASE`（選用）會覆寫上游 base URL，例如自架或區域性的 Deepgram 部署。`https://` 與 `http://` 的 base 會轉換為 `wss://` 和 `ws://`。base URL 只會從伺服器端讀取；客戶端無法選擇 proxy 的 Deepgram 金鑰要送往的目的地

## 驗證 {#authentication}

WebSocket 握手接受與其他 WebSocket 路由相同的 LiteLLM 金鑰機制：`Authorization: Bearer <litellm-key>` 標頭、`api-key: <litellm-key>` 標頭，或供無法設定標頭的瀏覽器使用的 `Sec-WebSocket-Protocol: openai-insecure-api-key.<litellm-key>` 子協定。當金鑰無效時，握手會被拒絕；若 proxy 上未設定 Deepgram 憑證，socket 會以代碼 `1011` 關閉

## 查詢參數 {#query-parameters}

`?` 之後的所有內容都會原樣轉送給 Deepgram（`encoding`、`sample_rate`、`channels`、`language`、`interim_results`、`smart_format`、`punctuate` 等，詳見 [Deepgram listen 參考文件](https://developers.deepgram.com/reference/speech-to-text-api/listen-streaming)）。如果 `model` 缺少或為空，proxy 會附加 `model=nova-3`

## 使用方式 {#usage}

<Tabs>
<TabItem value="python" label="Python（websockets）">

```python
import asyncio
import json
import os

import websockets

PROXY_URL = "ws://localhost:4000/deepgram/v1/listen?model=nova-3&encoding=linear16&sample_rate=16000&interim_results=true"
LITELLM_KEY = os.environ["LITELLM_API_KEY"]


async def main() -> None:
    async with websockets.connect(
        PROXY_URL,
        additional_headers={"Authorization": f"Bearer {LITELLM_KEY}"},
    ) as ws:

        async def send_audio() -> None:
            with open("audio.raw", "rb") as f:  # 16 kHz, 16-bit, mono PCM
                while chunk := f.read(8000):
                    await ws.send(chunk)
                    await asyncio.sleep(0.25)
            await ws.send(json.dumps({"type": "CloseStream"}))

        async def read_frames() -> None:
            async for frame in ws:
                data = json.loads(frame)
                if data.get("type") == "Results":
                    alt = data["channel"]["alternatives"][0]
                    label = "final" if data.get("is_final") else "interim"
                    print(f"[{label}] {alt['transcript']}")
                elif data.get("type") == "Metadata":
                    print(f"[metadata] duration={data['duration']}s")

        await asyncio.gather(send_audio(), read_frames())


asyncio.run(main())
```

</TabItem>
<TabItem value="websocat" label="websocat">

```bash
websocat -b \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  "ws://localhost:4000/deepgram/v1/listen?model=nova-3&encoding=linear16&sample_rate=16000" \
  < audio.raw
```

</TabItem>
<TabItem value="browser" label="瀏覽器">

```javascript
const ws = new WebSocket(
  "ws://localhost:4000/deepgram/v1/listen?model=nova-3&encoding=linear16&sample_rate=16000",
  ["openai-insecure-api-key.sk-<your-virtual-key>"],
);
ws.onmessage = (event) => console.log(JSON.parse(event.data));
// send Int16 PCM chunks with ws.send(arrayBuffer)
```

</TabItem>
</Tabs>

## 會與不會轉送的內容 {#what-is-and-is-not-forwarded}

從客戶端到 Deepgram：二進位框架（音訊）會以二進位形式送出，文字框架（`KeepAlive`、`Finalize`、`CloseStream` 控制訊息）會以文字形式送出，查詢字串則維持原樣。呼叫端的 `Authorization`、`api-key` 與其他請求標頭不會被轉送；proxy 只會將 `Authorization: Token <DEEPGRAM_API_KEY>` 傳送至上游

從 Deepgram 到客戶端：每個框架都會依接收順序逐位元組原樣轉送，包括中繼 `Results`、最終 `Results`、`UtteranceEnd`、`SpeechStarted`，以及關閉的 `Metadata` 框架。proxy 不會重塑、合併或過濾轉錄。當 Deepgram 以非正常代碼關閉連線時（例如 `1008`，表示請求無效），該代碼與原因都會傳遞給客戶端

## 成本追蹤 {#cost-tracking}

當 socket 關閉時，proxy 會讀取最後一個 `Metadata` 框架的 `duration`（Deepgram 已處理的音訊秒數），並將其乘以 [`model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中 `deepgram/streaming/<model>` 項目的 `input_cost_per_second`（`language=multi` 時為 `deepgram/streaming/<model>-multilingual`）。預錄的 `deepgram/<model>` 項目絕不會被用作替代。如果 Deepgram 從未傳送 `Metadata`（例如客戶端中斷連線），proxy 會回退到在 `Results` 框架中看到的最遠 `start + duration`。Deepgram 會按其處理的每個通道計費，因此一個 `multichannel=true&channels=2` 的立體聲工作階段，費用是其實際時長的兩倍。proxy 會以 `Metadata.channels` 中的通道數乘上時長，若無則回退到在 `Results` 框架中看到的最寬 `channel_index`，再無則回退到 `channels` 查詢參數，最後預設為一。支出會以 `call_type: pass_through_endpoint` 寫入 SpendLogs，並像任何其他路由一樣歸屬於呼叫端金鑰、團隊與使用者

```bash
curl -s "http://localhost:4000/spend/logs?api_key=$LITELLM_API_KEY" -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## 已知限制 {#known-limitations}

費用會在 socket 關閉時一次性計費，因此仍開啟中的工作階段尚未有支出資料列，且配額僅在連線時檢查一次。音訊框架不會被檢查，因此請求與回應防護欄不適用於此路由。中繼結果會原樣轉送；伺服器端不會對中繼與最終轉錄做去重。Deepgram 的 `/listen` 不會回報 token 數，因此 SpendLogs 會將音訊時長顯示為使用量指標，而 `prompt_tokens`/`completion_tokens` 會維持為零。若成本對應表中沒有某個模型的精確 `deepgram/streaming/<model>` 項目，該模型會在任何內容轉送之前被拒絕：socket 會以代碼 1008 關閉，原因為 `No streaming price for 'deepgram/streaming/<model>': add it to the model cost map to enable it`，因此請先新增該項目再使用該模型。Deepgram 的 `callback` 與 `callback_method` 查詢參數會以關閉代碼 1008 拒絕，因為 callback 傳送會將轉錄框架送往您的 URL，而不是透過此 socket 下行，這會讓該工作階段無法計量
