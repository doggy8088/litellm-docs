---
title: "伺服器上的 Docker Compose"
description: "在一台伺服器上以持久儲存和 HTTPS 執行獨立 Lens 和 ClickHouse。"
slug: "/proxy/lens/deployment/server"
---

# 伺服器上的 Docker Compose {#docker-compose-on-a-server}

安裝具備 Compose v2 的 Docker，然後在您的伺服器上執行 [v0.4.0 發行套件](https://github.com/BerriAI/lens/releases/tag/v0.4.0)。它不需要 Git，會依摘要拉取已發佈的映像，且可以在執行之前先 [驗證](./releases.md#verify-a-release)：

```sh
curl -fLO https://github.com/BerriAI/lens/releases/download/v0.4.0/lens-install-0.4.0.tar.gz
tar xzf lens-install-0.4.0.tar.gz
cd lens-0.4.0
./start
```

此指令碼會在 `deploy/lens/.env` 中產生憑證，並搭配 ClickHouse 啟動 Lens。在 `/ui/` 登入，方式是開啟 **Admin token**，將該檔案中的 `LENS_ADMIN_TOKEN` 值貼上。使用 `docker compose -f deploy/lens/compose.yaml down` 停止，並使用 `./start` 重新啟動。保留解壓縮的套件、環境檔案和持久磁碟區

如需協助設定現有的部署，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md)。若要將 Lens 服務連接到現有的閘道，請使用 [將 Lens 新增至 LiteLLM](./litellm.md#docker-compose)

## 設定公開位址 {#1-configure-the-services}

將主機名稱（例如 `lens.example.com`）指向您的伺服器，並佈建其 TLS 憑證。初始設定已將一行 `LENS_PUBLIC_URL` 寫入 `deploy/lens/.env`。請編輯該行，而不是再新增一行：

```dotenv
LENS_PUBLIC_URL=https://lens.example.com
```

將主機名稱替換為您的值。這會控制瀏覽器來源、產生的追蹤位址和安全工作階段 Cookie。讓產生的管理員 token 和 ClickHouse 密碼保持不變

## 套用設定 {#2-start-the-services}

從解壓縮的 `lens-0.4.0` 目錄：

```sh
docker compose -f deploy/lens/compose.yaml up -d --wait
```

啟動器會將 Lens 繫結到 `127.0.0.1:4318`，並讓 ClickHouse 保持在內部網路上。當反向代理在另一個容器或主機中執行時，請使用 [部署網路設定](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md#configure-a-deployment) 為它提供可連線的私密 Lens 位址

## 路由 HTTPS 流量 {#3-route-https-traffic}

將獨立 UI 和 API 路徑轉送到 Lens。此範例使用 HAProxy，與 [LiteLLM 閘道範例](../../deploy/ha/haproxy.md) 相同的 L7 代理程式，在同一台主機上執行。HAProxy 會從同一個檔案讀取憑證及其私鑰，因此請先將它們合併：

```sh
sudo mkdir -p /etc/haproxy/certs
sudo sh -c 'cat /etc/letsencrypt/live/lens.example.com/fullchain.pem \
  /etc/letsencrypt/live/lens.example.com/privkey.pem \
  > /etc/haproxy/certs/lens.example.com.pem'
sudo chmod 600 /etc/haproxy/certs/lens.example.com.pem
```

使用您的主機名稱儲存此設定，放在憑證路徑中：

```text title="/etc/haproxy/haproxy.cfg"
defaults
    mode http
    timeout connect 5s
    timeout client 300s
    timeout server 300s

frontend lens_https
    bind :443 ssl crt /etc/haproxy/certs/lens.example.com.pem
    http-request set-header X-Forwarded-Proto https
    option forwardfor
    default_backend lens

backend lens
    option httpchk GET /health/ready
    http-check expect status 200
    server lens 127.0.0.1:4318 check
```

使用您主機的服務管理工具檢查並重新載入 HAProxy。在 systemd 主機上：

```sh
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl reload haproxy
```

允許連接埠 443 的連入 HTTPS。讓資料庫保持私密，並保留容器隨附的檔案系統、沙箱和資源設定

## 檢查安裝 {#4-check-the-installation}

使用您的主機名稱開啟 `https://lens.example.com/ui/`，然後開啟 **Admin token** 並貼上產生的管理員 token。從代理程式的實際網路完成 [第一次追蹤檢查](../deployment.md#check-the-installation)。如果您啟用了調查，也請驗證一個有界限的調查

使用 [備份與還原 Lens](https://github.com/BerriAI/lens/blob/main/docs/backup.md)，將資料、Keeper 狀態、憑證和確切的映像保留在一起。將備份儲存在這台伺服器之外，並演練還原。支援的資料庫拓撲是一台 ClickHouse 伺服器；移至外部儲存本身並不提供複寫或自動容錯移轉
