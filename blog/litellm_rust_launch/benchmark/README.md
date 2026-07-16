# LiteLLM Rust 閘道基準測試 {#litellm-rust-gateway-benchmark}

可重現的執行環境，用於部落格文章 *Migrating LiteLLM to Rust* 中的數據。
它量測輕量 Rust 閘道相較於 LiteLLM Python 路徑、在相同本機模擬上游之下的每請求閘道轉發額外耗時。

## 量測內容 {#what-it-measures}

- 每請求額外耗時（中位數），Rust 閘道相較於 LiteLLM（Python），在 10 個並行
  用戶端連線到本機模擬上游時的結果。
- Rust 端是帶有輕量請求轉換的薄型 axum 轉發閘道。
- Python 端是由 uvicorn 提供服務的 `litellm.acompletion`（與代理程式使用的相同 ASGI 堆疊），因此會執行 LiteLLM 真實的轉換與成本路徑。

## 檔案 {#files}

- `main.rs` / `Cargo.toml` — 模擬上游、Rust 閘道，以及微秒
  解析度負載用戶端。模式：`mock`、`gateway`、`bench <url> <total> <conc>`。
- `llm_app.py` — 透過 uvicorn 的 LiteLLM（Python）請求路徑。
- `orchestrate_compare.py` — 啟動三者、執行負載測試，輸出中位數與 p95
  額外耗時，以及峰值 RSS。

## 執行 {#run}

```bash
cargo build --release
# Use a Python that has litellm + fastapi + uvicorn installed:
LITELLM_PYTHON=/path/to/venv/bin/python python3 orchestrate_compare.py
```

## 結果（參考執行） {#result-reference-run}

| | 每請求額外耗時（中位數） |
|---|---|
| Rust 閘道 | ~0.05ms |
| LiteLLM（Python） | ~7.5ms |

數值會因機器而異；重點是方法論。兩種執行環境使用相同的上游與負載資料；
唯一變數是 Python 與 Rust。
