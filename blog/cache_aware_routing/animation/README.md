# 快取感知路由動畫 {#cache-aware-routing-animation}

透明的 1440 × 820 GIF，8 秒無縫循環，以 25 fps 製作。採用平面等角幾何，且沒有可見文字。Claude Code 與 Codex 的請求通過 LiteLLM 閘道，抵達執行 vLLM 的穩定 Kubernetes 推論 pod。藍色與青色的串流保有各自的 pod 指派；請求返回時，快取儲存格會閃爍。

這份圖稿沒有背景、漸層或柔和陰影。Codex 圖示使用實心藍色填色，同時保留其原始幾何形狀。其他圖示來源與授權記錄於 `assets/SOURCES.md`。

Kubernetes 叢集徽章與推論 pod 使用六角柱體。推論 pod 只顯示其 vLLM 標誌，側邊帶有快取指示器。LiteLLM 閘道維持為矩形方塊，只顯示其火車圖示。

若要算繪，請安裝 Node.js 與 Python，然後執行：

```sh
npm install
python3 -m pip install -r requirements.txt
node render.mjs
python3 encode.py .. cover
```

在 `scene.mjs` 中編輯顏色、路由座標與事件時序。`node render.mjs --keyframes` 會匯出選定的預覽影格。`encode.py` 使用單一全域調色盤、二值透明度與 disposal mode 2；它會比對每個解碼影格的透明遮罩與來源是否一致。相同的影格可以合併，而不改變總時長。

這支動畫僅供說明，並非延遲測量。每個 pod 上的三個儲存格代表快取的前綴資料。封包與脈衝時序屬於設計選擇。
