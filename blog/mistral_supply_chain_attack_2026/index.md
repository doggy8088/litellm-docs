---
slug: mistral-supply-chain-attack-may-2026
title: "安全更新：Mistral AI PyPI 供應鏈攻擊 — LiteLLM 未受影響"
date: 2026-05-12T10:00:00
authors:
  - mubashir
description: "2026 年 5 月 11 日，mistralai PyPI 套件的惡意版本被發布，作為協同供應鏈攻擊的一部分。LiteLLM 未受影響 — 我們僅透過 httpx 直接呼叫 Mistral，從不匯入 mistralai SDK。"
tags: [security, supply-chain, mistral, incident-report]
hide_table_of_contents: false
---

2026 年 5 月 11 日，來自 [Aikido Security](https://www.aikido.dev/blog/mini-shai-hulud-is-back-tanstack-compromised) 的資安研究人員發現了一起名為 **"Mini Shai-Hulud"** 的協同供應鏈攻擊，該攻擊發布了超過 170 個 npm 套件與 2 個 PyPI 套件的惡意版本，其中包括 `mistralai==2.4.6`。 

**LiteLLM 不受影響。** 我們透過 `httpx` 直接經由 HTTP 呼叫 Mistral 的 API，且在程式碼庫中的任何地方都不會匯入 `mistralai` Python SDK。

## 重點摘要； {#tldr}

- **LiteLLM 不會安裝或匯入 `mistralai` 套件。** 我們呼叫 Mistral 的 API 方式與呼叫其他所有提供者相同（透過 `httpx`）。這個遭入侵的套件在任何 LiteLLM 環境中都不會被執行。
- **這次攻擊未使任何 LiteLLM 使用者憑證面臨風險。** 惡意程式在 `import mistralai` 時執行。由於 LiteLLM 從未觸發該匯入，因此負載永遠不會執行。
- **LiteLLM 使用者無需採取任何行動。** 如果您為了自己的應用程式程式碼，已在相同環境中另外安裝 `mistralai==2.4.6`，請立即遵循 [Mistral AI 的指引](https://docs.mistral.ai/resources/security-advisories)。

{/* truncate */}

---

## 發生了什麼事 {#what-happened}

TeamPCP 將 `mistralai==2.4.6` 發布到 PyPI —— 這個版本是 Mistral AI 從未釋出的。該套件包含一個植入於 `src/mistralai/client/__init__.py` 的後門，會在 Linux 主機上於匯入時觸發。被觸發後，它會從一個硬編碼、由攻擊者控制的 IP 位址（`83.142.209.194`）下載名為 `transformers.pyz` 的檔案，並將其作為分離的背景程序執行。

此檔名刻意設計成與 Hugging Face 廣泛使用的 `transformers` 程式庫相似，以便在 ML 環境中作為掩護。

該負載是一個 **憑證竊取程式**，目標是主機上儲存的機密資料——雲端憑證、CI/CD 權杖、GitHub 存取權杖，以及 API 金鑰。研究人員也發現一個具地理封鎖的破壞性分支，在偵測到位於某些地區的系統上，有 1/6 的機率執行 `rm -rf /`。

PyPI 之後已將整個 `mistralai` 專案隔離收容。這次攻擊是更廣泛行動的一部分，該行動在 npm 與 PyPI 上波及 TanStack（42 個套件）、UiPath（65 個套件）、Guardrails AI、OpenSearch 及其他專案。

---

## 如果您使用 LiteLLM，請檢查什麼 {#what-to-check-if-you-use-litellm}

不需要任何 LiteLLM 特定的動作。如果您想要更全面檢查：

1. **確認 `mistralai` 不在您的環境中。**
   ```bash
   pip show mistralai
   ```
   如果輸出顯示版本 `2.4.6`，請立即移除並遵循 [Mistral AI 的安全公告](https://docs.mistral.ai/resources/security-advisories)。

2. **檢查您的環境中是否有 dropper。**
   在任何曾安裝過 `mistralai==2.4.6` 的 Linux 主機上，尋找 `/tmp/transformers.pyz`，以及對 `83.142.209.194` 的異常對外連線。

3. **如果您受到影響，請輪替憑證。**
   如果 `mistralai==2.4.6` 曾在您的環境中安裝並匯入，請將該主機上存在的所有機密視為已洩露：雲端憑證、API 金鑰、CI/CD 權杖與 GitHub 權杖。

---

## 我們對依賴套件安全性的更廣泛作法 {#our-broader-approach-to-dependency-security}

如果您在 LiteLLM 中發現安全問題，請透過我們的 [漏洞獎勵計畫](https://github.com/BerriAI/litellm/security) 回報。我們會對 P0（供應鏈）與 P1（未驗證的代理存取）問題支付獎金。

---

**參考資料**

- [Aikido Security — Mini Shai-Hulud Is Back](https://www.aikido.dev/blog/mini-shai-hulud-is-back-tanstack-compromised)
- [The Hacker News — Mini Shai-Hulud Worm Compromises TanStack, Mistral AI, Guardrails AI & More](https://thehackernews.com/2026/05/mini-shai-hulud-worm-compromises.html)
- [Wiz Blog — Mini Shai-Hulud Strikes Again](https://www.wiz.io/blog/mini-shai-hulud-strikes-again-tanstack-more-npm-packages-compromised)
- [Mistral AI Security Advisories](https://docs.mistral.ai/resources/security-advisories)
- [GitHub Issue #523 — mistralai/client-python](https://github.com/mistralai/client-python/issues/523)
- [SafeDep — Mass Supply Chain Attack Hits TanStack, Mistral AI](https://safedep.io/mass-npm-supply-chain-attack-tanstack-mistral/)
