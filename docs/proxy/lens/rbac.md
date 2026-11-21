---
title: "存取控制與工作區篩選器"
description: "控制哪些人可以讀取 Lens 追蹤、為團隊與金鑰啟用追蹤，並依組織、團隊、專案或金鑰篩選請求。"
slug: "/proxy/lens/rbac"
---

# 存取控制與工作區篩選器 {#access-control-and-workspace-filters}

{/* keep-version-note: This overview covers existing trace permissions and upcoming workspace controls, with no verified release that includes all controls. */}

:::info 即將推出的工作區控制

這些團隊／金鑰追蹤控制與組織、團隊、專案與金鑰選擇器，是即將推出的 Gateway 與 Lens 更新的一部分。截圖顯示的是預覽版本。

:::

使用 LiteLLM 儀表板中的 Lens 來分享追蹤並檢查應用程式流量。您的 Gateway 帳號決定您可以讀取哪些追蹤。工作區篩選器會縮小這些結果；選取另一個組織、團隊、專案或金鑰並不會授予存取權。

請先[將 Lens 連接到 LiteLLM](./deployment/litellm.md)。管理員只需設定一次該連線。團隊成員不需要為每個金鑰另外輸入 Lens 整合憑證。

組織與專案選單需要已設定的實體與列出它們的權限。組織管理遵循 Gateway 的 Enterprise 授權。這些管理權限不會授予追蹤存取權。

## 瞭解階層 {#understand-the-hierarchy}

常見的流量分組方式：

```mermaid
flowchart TD
    Organization["組織"] --> Team["團隊"]
    Team --> Project["專案（選填）"]
    Project --> Key["閘道金鑰"]
    Team -. "沒有專案" .-> Key
    Key --> Traces["請求與追蹤"]
```

一個金鑰可以屬於某個團隊而不屬於專案。個人金鑰也可以沒有團隊。就組織篩選器而言，金鑰上明確設定的組織優先；否則 Lens 會使用該金鑰所屬團隊的組織。這些指派用來分組流量，但並不構成另一項權限授予。

## 誰可以讀取追蹤 {#who-can-read-traces}

Lens 使用 Gateway 現有的追蹤權限：

| 讀者 | 可見的追蹤 |
| --- | --- |
| 代理管理員或管理員檢視者 | 全部追蹤。 |
| 團隊管理員 | 自己擁有的追蹤，加上其管理或有權檢視的團隊的追蹤。 |
| 其他使用者，包括團隊成員 | 自己擁有的追蹤，加上與其分享記錄的團隊的追蹤。 |
| 組織管理員或專案擁有者 | 與上述使用者／團隊規則相同。僅憑組織或專案擁有權，並不會授予全部相關追蹤。 |
| 沒有使用者身分的非管理員金鑰 | 無法讀取追蹤；請求會傳回 `403`。 |

若要分享某個團隊的追蹤，請開啟 **Teams**，選取該團隊，再選取 **Member Permissions**。授予 `/spend/logs` 權限。團隊管理員不需要這項成員授權就能讀取該團隊的追蹤。API 與預設團隊設定請參閱[分享團隊的追蹤](./api.md#trace-access)。

專用的 Lens 追蹤金鑰會上傳遙測資料並檢查自己的傳送回條；它們不會讀取追蹤。請參閱[上傳追蹤](./api.md#upload)。

## 為團隊與金鑰啟用 Lens {#enable-lens-for-a-team-and-key}

### 設定團隊預設值 {#set-the-team-default}

開啟 **Teams**，選取您的團隊，再開啟其 **Lens** 分頁。將開關設為 **On**，即可為繼承團隊設定的金鑰啟用追蹤。**Default for team keys** 指的就是這項控制。

![團隊的 Lens 分頁顯示 On 開關與 Open Lens 按鈕。](/img/lens/rbac/team-lens-enabled.png)

### 檢查金鑰 {#check-the-key}

開啟 **Virtual Keys**，選取該金鑰，再開啟 **Lens**。**On** 會為該金鑰啟用追蹤。**Use team setting** 會移除自訂的金鑰覆寫並恢復繼承。

![金鑰的 Lens 分頁顯示追蹤為 On、自訂設定、Use team setting 與 Open Lens。](/img/lens/rbac/key-lens-enabled.png)

金鑰明確設定的 On 或 Off 優先於其團隊。若金鑰沒有覆寫，則適用團隊設定。若兩者都沒有設定值，在已設定 Lens 的情況下，追蹤預設為 On。這項控制只影響未來的收集：它不會授予讀取權限，也不會刪除已儲存的追蹤。啟用 Lens 後，請驗證追蹤是否送達。

## 在 Lens 中區分流量 {#segment-traffic-in-lens}

從金鑰的 Lens 分頁選取 **Open Lens**。Lens 會以該金鑰（及其所屬團隊，如已指派）選取開啟。左側邊欄包含 Lens 頁面；階層控制位於內容上方。

![Lens 顯示組織、團隊、專案與金鑰選擇器，團隊選單已開啟並可搜尋。](/img/lens/rbac/hierarchy-selectors.png)

| 選取 | 檢查內容 |
| --- | --- |
| **Organization** | 來自指派給該組織的金鑰的流量，包括繼承的團隊指派。 |
| **Team** | 為該團隊記錄的流量。 |
| **Project** | 來自目前指派給該專案的金鑰的流量。 |
| **Key** | 以該特定金鑰記錄的流量。 |

例如，選取您的組織、選擇一個團隊，再選取一個專案，即可比較該應用程式的流量。選取一個金鑰，即可隔離單一整合或服務。選取 **All keys** 會保留上層篩選器。變更上層會清除其下層項目與任何已開啟的追蹤；選取金鑰會填入其上層項目。**No project** 表示該金鑰沒有專案指派。

選取的篩選器以 AND 組合，且維持在您授權的資料列範圍內。不相符的組合不會傳回任何結果。追蹤詳情、span、對話記錄、分頁、複製的追蹤查詢與分享連結都會保留該選取。追蹤 SQL 使用相同範圍；請參閱[使用 SQL 查詢追蹤](./api.md#query-traces)。

這些選擇器只篩選追蹤檢視與追蹤 SQL。它們不會自動篩選 Profiles、Datasets 或 Evals，也不會授予對這些物件的存取權。

組織與專案篩選器使用目前的金鑰指派，而非歷史快照。符合超過 2,048 個金鑰的範圍需要更窄的團隊、專案或金鑰選取。組織篩選器也會在 2,048 個候選團隊處停止。Gateway 會傳回錯誤，而非靜默省略相符的金鑰。

若沒有出現任何追蹤，請檢查時間範圍、追蹤政策與連線，再依照[傳送您的第一筆追蹤](./first-trace.md)操作。
