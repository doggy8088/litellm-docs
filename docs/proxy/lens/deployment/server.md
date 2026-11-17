---
title: "伺服器上的 Docker Compose"
description: "在一台伺服器上以持久儲存和 HTTPS 執行獨立 Lens 和 ClickHouse。"
slug: "/proxy/lens/deployment/server"
---

# 伺服器上的 Docker Compose {#docker-compose-on-a-server}

[Lens 原始碼安裝](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md) 會從公開的 Lens 儲存庫執行 Lens 和 ClickHouse 與 Keeper。安裝 Git 和 Docker Compose v2，然後在您的伺服器上依照 [本機快速入門](./local.md)。保留其原始碼提交、環境檔案和持久磁碟區。獨立發佈成品仍在驗證中

如需協助設定現有的部署，請使用 [Set it up for me](https://github.com/BerriAI/lens/blob/main/docs/setup-with-agent.md)。若要將 Lens 服務連接到現有的閘道，請使用 [Compose 整合指南](./docker-compose.md)

## 設定公開位址 {#1-configure-the-services}

將主機名稱（例如 `lens.example.com`）指向您的伺服器，並佈建其 TLS 憑證。在初始設定後，在 `deploy/lens/.env` 中設定：

```dotenv
LENS_PUBLIC_URL=https://lens.example.com
```

將主機名稱替換為您的值。這會控制瀏覽器來源、產生的追蹤位址和安全工作階段 Cookie。讓產生的管理員 token 和 ClickHouse 密碼保持不變

## 套用設定 {#2-start-the-services}

從 Lens 儲存庫根目錄：

```sh
docker compose -f deploy/lens/compose.yaml up -d --wait
```

啟動器會將 Lens 繫結到 `127.0.0.1:4318`，並讓 ClickHouse 保持在內部網路上。當反向代理在另一個容器或主機中執行時，請使用 [部署網路設定](https://github.com/BerriAI/lens/blob/main/deploy/lens/README.md#configure-a-deployment) 為它提供可連線的私密 Lens 位址

## 路由 HTTPS 流量 {#3-route-https-traffic}

將獨立 UI 和 API 路徑轉送到 Lens。對於在同一台主機上執行的 NGINX，請使用您的主機名稱和憑證路徑儲存此設定：

```nginx title="/etc/nginx/conf.d/lens.conf"
server {
    listen 443 ssl;
    server_name lens.example.com;
    ssl_certificate /etc/letsencrypt/live/lens.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lens.example.com/privkey.pem;
    client_max_body_size 16m;

    location / {
        proxy_pass http://127.0.0.1:4318;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

使用您主機的服務管理工具檢查並重新載入 NGINX。在 systemd 主機上：

```sh
sudo nginx -t && sudo systemctl reload nginx
```

允許連接埠 443 的連入 HTTPS。讓資料庫保持私密，並保留容器隨附的檔案系統、沙箱和資源設定

## 檢查安裝 {#4-check-the-installation}

使用您的主機名稱開啟 `https://lens.example.com/ui/`，並使用產生的管理員 token 登入。從代理程式的實際網路完成 [第一次追蹤檢查](../deployment.md#check-the-installation)。如果您啟用了調查，也請驗證一個有界限的調查

使用 [備份與還原 Lens](https://github.com/BerriAI/lens/blob/main/docs/backup.md)，將資料、Keeper 狀態、憑證和確切的映像保留在一起。將備份儲存在這台伺服器之外，並演練還原。支援的資料庫拓撲是一台 ClickHouse 伺服器；移至外部儲存本身並不提供複寫或自動容錯移轉
