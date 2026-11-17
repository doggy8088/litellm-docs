# 動畫部落格封面 {#animated-blog-cover}

`request-flow-cover.gif` 是 `RequestFlowHero.js` 的部落格列表版本。文章本身保留 React 主視覺與其暫停控制項。GIF 使用 1200:630 的畫布以配合列表卡片，匯出尺寸為 960 × 504 像素。

算繪器會讀取既有的元件，取樣其 SVG 路徑，並以 20 fps 將粒子位置點陣化。快速粒子在每個 12 秒循環中完成三圈；Python 粒子完成一圈。這些時間設定用來呈現速度差異，並非基準測試數據。編碼器使用共用調色盤，並將每個解碼後的影格與其來源進行驗證。

從儲存庫根目錄，安裝一般的 Node 相依套件，並在您的 Python 環境中安裝 Pillow，然後執行：

```sh
node blog/rust_migration_rerouted/animation/render-cover.cjs
```

若 Pillow 安裝在不同的 Python 環境中，請設定 `PYTHON`。影格為暫時檔案，成功匯出後會被移除。此腳本會寫入 `blog/rust_migration_rerouted/request-flow-cover.gif`。
