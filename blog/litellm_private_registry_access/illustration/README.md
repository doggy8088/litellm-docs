# Private Registry 插圖 {#private-registry-illustration}

一張靜態、透明的圖表，包含 Amazon ECR、Amazon Cognito 與 LiteLLM 圖示。實線箭頭代表從 registry 向 LiteLLM 部署拉取 artifact。虛線的 Cognito 連線代表驗證，與 artifact 傳輸分開。一個小型的套件圖形標示該次傳輸。沒有動畫，也沒有可見文字。

SVG 會隨頁面縮放。LiteLLM 在淺色模式使用其藍色標誌，在深色模式使用白色標誌。原始的 AWS 服務圖稿保留其類別顏色與比例，沒有額外的容器或卡片。

在此目錄中執行 `npm install` 與 `node render.mjs`，即可重新產生 `../cover.svg`、透明的 `../cover.png` 與 `../cover-dark.png`。頁面直接匯入 SVG；PNG 則用於 blog 中繼資料與外部渲染器。瀏覽器中不會執行任何渲染函式庫。

圖示來源請參閱 `assets/SOURCES.md`。
