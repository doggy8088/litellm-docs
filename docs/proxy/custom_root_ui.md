import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# UI - 自訂根路徑  {#ui---custom-root-path}

💥 當您想要以自訂的基礎 URL 路徑提供 LiteLLM 時，請使用這個，例如 `https://localhost:4000/api/v1` 

:::info

需要 v1.72.3 或更高版本。

:::

限制：
- 這在 [litellm non-root](./deploy#non-root---without-internet-connection) 映像檔中無法運作，因為它需要對 UI 檔案具有寫入權限。

## 使用方式 {#usage}

### 1. 在您的 .env 中設定 `SERVER_ROOT_PATH` {#1-set-server_root_path-in-your-env}

👉 在您的 .env 中設定 `SERVER_ROOT_PATH`，這會被設定為您的伺服器根路徑

```
export SERVER_ROOT_PATH="/api/v1"
```

### 2. 執行 Proxy {#2-run-the-proxy}

```shell
litellm proxy --config /path/to/config.yaml
```

執行 proxy 後，您可以在 `http://0.0.0.0:4000/api/v1/` 存取它（因為我們已設定 `SERVER_ROOT_PATH="/api/v1"`）

### 3. 驗證是否在正確的路徑上執行 {#3-verify-running-on-correct-path}

<Image img={require('../../img/custom_root_path.png')} />

**就是這樣**，這就是在自訂根路徑上執行 proxy 所需的一切

## 示範 {#demo}

[這裡有一段示範影片](https://drive.google.com/file/d/1zqAxI0lmzNp7IJH1dxlLuKqX2xi3F_R3/view?usp=sharing)，展示在自訂根路徑上執行 proxy
