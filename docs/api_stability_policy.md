# API 穩定性政策 {#api-stability-policy}

本頁定義 LiteLLM Proxy HTTP API 的哪些部分屬於我們致力維護的公開合約，以及哪些部分屬於私有並可能隨時變更。

## OpenAPI 規格是公開 API {#the-openapi-spec-is-the-public-api}

出現在 proxy 的 OpenAPI 規格中的每個 endpoint 都是公開的。該規格預設會在 `/openapi.json` 提供，並在 `/` 以 Swagger UI 呈現（可透過 `DOCS_URL` 設定，請參閱 [UI 設定](./proxy/ui.md)）。對於公開 endpoints，我們致力維護其行為合約：路徑與 HTTP 方法、請求與回應結構、驗證需求，以及預設行為。

新增變更不會造成破壞，可在任何版本中釋出：新增 endpoint、新增可選請求欄位，以及新增回應欄位。用戶端應忽略其無法辨識的回應欄位。若變更移除或重新命名欄位、變更預設值、收緊可呼叫 endpoint 的對象，或以其他方式要求採取行動才能維持先前行為，則屬於破壞性變更。破壞性變更會在該版本發佈時於 [版本資訊](/release_notes) 頂端的專用 `Breaking Changes` 區段中標示，並受 [發佈週期](./proxy/release_cycle.md) 的版本控制規則約束。

## 其他一切皆為私有 {#everything-else-is-private}

不在 OpenAPI 規格中的任何 endpoint 都是私有的。這些路由的存在是為了支援 LiteLLM 管理員介面或 proxy 的內部需求。在程式碼庫中，這些路由會透過路由定義上的 `include_in_schema=False` 從規格中隱藏；`/login`、`/v2/login` 和 `/fallback/login` 即為範例。私有 endpoints 可在任何版本中不經通知而變更其請求或回應結構、變更行為，或被移除，且不受上述破壞性變更流程約束。

請勿針對私有 endpoints 建立整合。如果您目前需要的功能只有私有 endpoint 能提供，請開啟一個 [GitHub issue](https://github.com/BerriAI/litellm/issues) 說明使用案例，以便透過受支援的公開 endpoint 提供。

## 檢查您版本中的公開內容 {#checking-what-is-public-on-your-version}

該規格是由執行中的 proxy 產生，因此會精確反映您部署的版本。若要列出公開路徑：

```bash
curl -s http://localhost:4000/openapi.json | jq '.paths | keys'
```

設定 `NO_DOCS` 或 `NO_OPENAPI`（請參閱 [環境變數](./proxy/config_settings.md#environment-variables---reference)）會停止 proxy 提供 Swagger UI 或 `/openapi.json`；但不會改變哪些 endpoints 屬於公開。若要查看公開介面，請從未設定這些旗標的 proxy 取得規格，或從本機執行的相同版本取得規格。

## 相關內容 {#related}

- [發佈週期](./proxy/release_cycle.md)：版本如何編號，以及 major、minor 與 patch 升版各代表什麼。
- [遷移政策](./migration_policy.md)：當 beta 功能移轉到 Enterprise 時會發生什麼。
