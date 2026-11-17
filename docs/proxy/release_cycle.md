# 發行週期 {#release-cycle}

Litellm Proxy 具有以下發行週期：

- `1.x.x-dev.N`（nightly）：通過 ci/cd 的發行版（無需人工審查）。在 PyPI 上發布為 `1.x.x.devN`。
- `1.x.x-rc.N`（release candidate）：通過 ci/cd + [人工審查](https://github.com/BerriAI/litellm/discussions/8495#discussioncomment-12180711) + 效能測試（待定，將很快實作）+ 供早期測試者提交 issues 的 7 天期間的發行版。在 PyPI 上發布為 `1.x.xrcN`。
- `1.x.x`（stable）：已通過上述所有項目的 `rc`，之後在第二輪人工測試後升級為 stable。

在正式環境中，我們建議鎖定到最新的穩定 `1.x.x` 發行。

:::info[版本編號自 1.84.0 版起變更]

`-stable` 與 `-nightly` 後綴已取消。穩定版現在採用純粹的 PEP 440 / SemVer 2.0（例如 `1.84.0`），每週排程發行會增加 **MINOR** 元件，而 **PATCH** 保留給熱修正。Docker 會發布指向同一映像檔的裸版（`1.84.0`）與 `v`-前綴（`v1.84.0`）標籤；PyPI 使用裸版的 PEP 440 格式（`1.84.0`，絕不使用 `v1.84.0`）。以舊命名（`v1.83.x-stable` 等）發布的版本會永久保留。

請參閱 [LiteLLM 發行版本編號正在變更](/blog/cleaner-release-versions) 以取得完整的舊 → 新名稱對照。

:::

請在[此處](https://github.com/BerriAI/litellm/releases)查看我們的版本說明。

## 每週排程 {#weekly-schedule}

自 2026 年 11 月 2 日當週起，release candidate 與穩定版改為在週二上午發布，而非週六。當週發行的程式碼會在週一清晨凍結，週一則用於 QA。

每週都會針對同一條版本線執行相同的循環。下一個次要版本的每夜版（`dev`）建置會在一週內陸續推出（例如 `1.86.0.dev1`，接著 `1.86.0.dev2`），而該基底會沿用所有建置直到以穩定版釋出。週二上午會切出 release candidate（`1.86.0rc1`），並進入大約為期一週、供早期測試者與 QA 使用的期間。隔週週二，該 `rc` 會移除後綴升級為穩定版（`1.86.0rc1` 變為 `1.86.0`），其內容與該 `rc` 相同，除非有修正被回補。因此每個週二都一兼兩職：切出當週的 `rc`，同時讓前一週的 `rc` 成為穩定版。

| 日 | 發布內容 |
| --- | --- |
| 週一 | 週二發行的程式碼凍結與 QA |
| 週二上午 | 新的 `rc` 切版（`1.86.0rc1`），且前一週的 `rc` 升級為穩定版（`1.85.0`） |

如果某個 `rc` 未通過 QA，則不會升級。修正會進來，後續的 `rc` 可能會被切出，排程則從那裡繼續。

哪些穩定版本線會收到 patch 發行，請參閱 [版本支援](../enterprise/version_support.md)。該政策在 [LTS 試行](../enterprise/lts_pilot.md) 期間暫停。

## 常見問題 {#faq}

### LiteLLM 穩定版有發行排程嗎？ {#is-there-a-release-schedule-for-litellm-stable-release}

穩定版每週於週二上午發布。每次排程中的穩定版都會提升 MINOR 版本：`1.84.0` → `1.85.0` → `1.86.0`。 {/* keep-version-note */}

### 什麼情況算是 'minor' 版本提升，而什麼情況算是 'patch' 版本提升？ {#what-is-considered-a-minor-bump-vs-patch-bump}

自 `1.84.0` 開始（請參閱[版本編號部落格文章](/blog/cleaner-release-versions)）： {/* keep-version-note */}

- 'minor' 提升：例行每週排程的穩定版發布（`1.84.0` → `1.85.0`）。這是正常節奏，可能包含新的向後相容功能或資料庫表。
- 'patch' 提升：穩定版本線的熱修正（`1.84.0` → `1.84.1`）。[版本支援](../enterprise/version_support.md) 說明了哪些版本線會收到。
- 'major' 提升：會破壞向後相容性（`1.x.x` → `2.x.x`）。

### 企業支援 {#enterprise-support}

企業版與開放原始碼採用同一套版本支援政策。哪些發行線會收到 patch，以及該期間如何移動，請參閱 [版本支援](../enterprise/version_support.md)。
