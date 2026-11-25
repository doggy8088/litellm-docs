---
unlisted: true
---

# TypeSafe 直通已移除 {#typesafe-pass-through-removed}

TypeSafe 的 `/typesafe/...` 直通路由已在 `v1.113.0` 中移除。Jev 仍可透過統一的 `/v1/systemone` 與 `/v1/decisions` 端點使用。

請依照 [遷移指南](../decisions.md#migrate-from-typesafe-pass-through) 設定您的 Jev 部署並更新請求。其中包含使用 base64 資產或 `input_image` 部分的 JSON 圖片範例，以及必要的 `TypeSafe-Danger-Zone-Images` 標頭。
