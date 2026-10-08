import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# UI - 自訂根路徑  {#ui---custom-root-path}

💥 當您想要以自訂的基礎 URL 路徑提供 LiteLLM 時，請使用這個，例如 `https://localhost:4000/api/v1`

:::info

需要 v1.72.3 或更高版本。

:::

Proxy 會在啟動時重寫 UI 檔案以使用自訂路徑，因此 UI 目錄必須可寫。[非 root 映像](./docker_image_security) 會將 UI 複製到 `/var/lib/litellm/ui`，該位置由執行階段使用者擁有，因此預設即可正常運作。在唯讀的根檔案系統上，請將 `LITELLM_UI_PATH` 指向可寫入的磁碟區（例如 Kubernetes `emptyDir`），否則 proxy 會記錄 `Cannot apply server_root_path replacements`，且 UI 資產將無法在自訂路徑下載入

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
