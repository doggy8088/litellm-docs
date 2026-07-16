# Gemini — Lyria（音樂生成） {#gemini--lyria-music-generation}

Google Lyria 3 預覽模型列於 LiteLLM 的 [模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中，歸類於 `gemini/` 提供者，用於中繼資料與支出追蹤。

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `gemini/` |
| 模型 | `gemini/lyria-3-clip-preview`、`gemini/lyria-3-pro-preview` |
| 提供者文件 | [Gemini API 定價 / 模型 ↗](https://ai.google.dev/gemini-api/docs/pricing) |

## 模型 {#models}

| 模型 | 備註 |
|-------|--------|
| `gemini/lyria-3-clip-preview` | 約 30 秒片段；Google 定價中的付費方案列為每首生成歌曲 |
| `gemini/lyria-3-pro-preview` | 完整歌曲；Google 定價中的付費方案列為每首生成歌曲 |

成本對照表中的輸入上下文限制：**131,072** tokens。關於模態、限制與功能，請參閱 [Google 的 Gemini API 文件 ↗](https://ai.google.dev/gemini-api/docs/models)。

## LiteLLM 行為 {#litellm-behavior}

- **成本對照表**：每首歌曲的付費定價會以 `output_cost_per_image` 儲存在那些項目中（每次生成單位的固定費用）。以 token 為基礎的完成成本可能無法反映音樂計費，直到有專屬路徑為止。
- **API 請求**：請依照 Google 文件使用 Gemini API。LiteLLM 不提供像 Veo 的 `video_generation` 那樣的獨立 `music_generation` 輔助工具。

## 驗證 {#auth}

與其他 Gemini API 模型相同：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`。
