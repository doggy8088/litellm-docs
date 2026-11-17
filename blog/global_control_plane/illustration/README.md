# Global Control Plane API 插圖 {#global-control-plane-api-illustration}

在安裝網站的相依套件後，從儲存庫根目錄執行 `node blog/global_control_plane/illustration/render.mjs`。這會使用網站既有的 `sharp` 相依套件，寫出自包含的 1440 × 800 SVG 與透明 PNG。設定 `COVER_REVIEW_DIR` 可將淺色、深色與行動版的檢視圖片匯出到另一個目錄。

這張扁平化、無文字的封面簡化了雲端與混合雲參考架構。一個中央 LiteLLM control plane 連接到四個獨立環境，使用與參考圖相同的提供者原生服務圖示：搭配 Aurora 與 ElastiCache 的 EKS；搭配 Azure Database for PostgreSQL 與 Azure Redis 的 AKS；搭配 Cloud SQL 與 Memorystore 的 GKE；以及搭配 PostgreSQL 與 Redis 的地端 Kubernetes。紫色連線代表管理請求；灰色的資料庫與快取連線留在各環境內部。

LiteLLM 標誌未經修改，直接沿用自 `blog/litellm_private_registry_access/illustration/assets/litellm.svg`。提供者圖示來自 `static/img/cloud_icons`；其來源記錄在該目錄的 `SOURCES.md` 中。匯出的 SVG 內嵌官方圖示圖稿，並保留其顏色與幾何形狀。線上 hero 圖在深色模式下僅將 LiteLLM 標誌改為白色。不需要任何外部圖片請求、字型或動畫相依套件。
