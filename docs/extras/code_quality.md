# 程式碼品質 {#code-quality}

🚅 LiteLLM 遵循 [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)。

我們使用： 
- Ruff 進行 [格式化與 lint 檢查](https://github.com/BerriAI/litellm/blob/e19bb55e3b4c6a858b6e364302ebbf6633a51de5/.circleci/config.yml#L320)
- Mypy + Pyright 進行型別檢查 [1](https://github.com/BerriAI/litellm/blob/e19bb55e3b4c6a858b6e364302ebbf6633a51de5/.circleci/config.yml#L90), [2](https://github.com/BerriAI/litellm/blob/e19bb55e3b4c6a858b6e364302ebbf6633a51de5/.pre-commit-config.yaml#L4)
- Black 進行 [格式化](https://github.com/BerriAI/litellm/blob/e19bb55e3b4c6a858b6e364302ebbf6633a51de5/.circleci/config.yml#L79)
- isort 進行 [匯入排序](https://github.com/BerriAI/litellm/blob/e19bb55e3b4c6a858b6e364302ebbf6633a51de5/.pre-commit-config.yaml#L10)

如果您對如何提升程式碼品質有任何建議，歡迎開啟 issue 或 PR。
