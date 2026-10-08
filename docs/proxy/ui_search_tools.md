# 搜尋工具（Admin UI） {#search-tools-admin-ui}

控制哪些團隊與虛擬金鑰可呼叫每個已設定的網路搜尋整合（`/v1/search`），並在 LiteLLM 的支出儀表板中查看團隊／金鑰層級的使用可見性。

![](/img/ui-search-tools/step-01-go-to-search-tools-tab.png)

## 步驟 1：註冊工具 {#step-1-register-tools}

**搜尋工具** 頁面 → 建立工具（名稱 + 提供者 + 認證資訊）。

![](/img/ui-search-tools/step-02-add-new-search-tool.png)

## 步驟 2：團隊允許清單 {#step-2-team-allowlist}

**團隊** → 建立／編輯團隊 → 開啟 **搜尋工具設定** → 將工具加入該團隊。

![](/img/ui-search-tools/step-03-create-or-edit-team.png)
![](/img/ui-search-tools/step-04-open-search-tool-settings.png)
![](/img/ui-search-tools/step-05-add-search-tool-to-team.png)

## 步驟 3：金鑰（可選的更嚴格清單） {#step-3-key-optional-stricter-list}

**虛擬金鑰** → 為該團隊產生／更新 → **搜尋工具設定** 必須維持在團隊清單內（如果團隊清單非空）。

![](/img/ui-search-tools/step-06-create-team-key.png)

## 步驟 4：呼叫搜尋 {#step-4-call-search}

```bash
curl -sS -X POST "http://localhost:4000/v1/search/YOUR_SEARCH_TOOL_NAME" \
  -H "Authorization: Bearer YOUR_VIRTUAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "hello world", "max_results": 5}'
```

![](/img/ui-search-tools/step-07-open-usage-team-usage.png)

## 步驟 5：查看支出 {#step-5-see-spend}

**記錄** → 篩選 **團隊 ID** + **Public model / search tool** = `search_tool_name` → **Cost** 欄位。

![](/img/ui-search-tools/step-08-select-team.png)
![](/img/ui-search-tools/step-09-see-search-tool-usage.png)

## 相關 {#related}

- [搜尋提供者與 YAML](../search/index.md)
- [Proxy 設定（`search_tools` 列）](./config_settings.md)
