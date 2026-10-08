# 程式碼品質 {#code-quality}

🚅 LiteLLM 遵循 [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)。

我們執行：
- 使用 Ruff 進行格式化與 linting（`make format`，`make lint-ruff`）
- 使用 basedpyright 進行型別檢查（`make lint-basedpyright`）
- 循環匯入與匯入安全性檢查（`make check-circular-imports`，`make check-import-safety`）

請從 `litellm` 儲存庫的根目錄執行 `make lint`，以執行與 CI 相同的檢查。

如果您對如何提升程式碼品質有任何建議，歡迎開啟 issue 或 PR。
