---
description: 了解如何在 LiteLLM 中啟用 FIPS 模式、目前支援的範圍，以及仍在開發中的部分。
---

# FIPS 模式（開發中） {#fips-mode-work-in-progress}

<SinceVersion v="1.109.0" />

:::danger[FIPS 支援尚未完整]
FIPS 模式仍在開發中。雖然 LiteLLM 可以檢查自己是否在啟用 FIPS 的環境中執行，但並非所有加密操作都已更新為使用 FIPS 核准的演算法。啟用 FIPS 模式時，某些功能可能會失敗。

**FIPS 模式僅適用於新部署。** 在現有部署上啟用不受支援。現有的密碼、加密祕密與 token 不會被遷移。

LiteLLM 本身未取得 FIPS 140-3 認證。它仰賴底層環境提供的、經 FIPS 140-3 驗證的加密模組。
:::

## 啟用 FIPS 模式 {#enabling-fips-mode}

若要啟用 FIPS 模式，請將以下內容加入您的 LiteLLM 組態：

```yaml
general_settings:
  fips_mode: true
```

啟用後，LiteLLM 會在啟動期間檢查加密環境。在以下情況下，proxy 將拒絕啟動：

- Python 的 OpenSSL 未在啟用 FIPS 提供者的情況下執行，且 `default_properties = fips=yes`。
- `cryptography` 程式庫未使用可運作的 FIPS 提供者。
- `fips_mode` 未設定為有效的布林值，或參照了缺失的環境變數。

若有任何一項檢查失敗，LiteLLM 會擲出 `FipsModeError` 說明問題。

## 已知限制 {#known-limitations}

FIPS 支援仍在實作中，因此某些功能尚不相容於啟用 FIPS 的環境。

目前，以下操作可能會失敗：

- **管理 UI 密碼：** 密碼雜湊與驗證仍使用 `scrypt`，而它無法透過 OpenSSL FIPS 提供者取得。
- **MCP 驗證：** MCP 閘道工作階段 token 與 OAuth 橋接 token 使用 `scrypt` 衍生金鑰。
- **MCP 伺服器建立：** 某些 Python 建置（包括 Chainguard 的啟用 FIPS 的 Python）會封鎖透過 API 建立 MCP 伺服器時使用的 BLAKE2b 雜湊。

啟動檢查也有一個已知問題。它目前預期 MD5 不可使用，但某些 FIPS 環境允許 MD5 用於非安全用途。因此，即使已啟用 FIPS 提供者，該檢查仍會拒絕使用預設 `CHAINGUARD_LEGACY_ALLOWED=1` 設定的 Chainguard FIPS 映像。

**專用的 LiteLLM FIPS Docker 映像尚未提供。**

## 後續計畫 {#whats-next}

我們正在開發專用的 LiteLLM FIPS Docker 映像。可用時我們會更新此頁面。
