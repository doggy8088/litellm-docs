# 受健康檢查驅動的路由 {#health-check-driven-routing}

在使用者遇到錯誤之前，將流量路由遠離不健康的部署。背景健康檢查會以可設定的間隔執行，任何失敗的部署都會主動從路由池中移除，而不是等到使用者請求已經失敗之後才處理。

## 架構 {#architecture}

<svg viewBox="0 0 860 600" xmlns="http://www.w3.org/2000/svg" style={{maxWidth: '100%', fontFamily: 'system-ui, sans-serif'}}>
  {/* Background */}
  <rect width="860" height="600" fill="#f8fafc" rx="12"/>

  {/* LEFT PANEL: Background health check loop */}
  <rect x="20" y="20" width="240" height="560" fill="#eff6ff" rx="10" stroke="#bfdbfe" strokeWidth="1.5"/>
  <text x="140" y="48" textAnchor="middle" fill="#1d4ed8" fontSize="13" fontWeight="600">背景迴圈</text>
  <text x="140" y="64" textAnchor="middle" fill="#3b82f6" fontSize="11">每 health_check_interval 秒</text>

  {/* Deployment A */}
  <rect x="40" y="82" width="200" height="50" fill="white" rx="8" stroke="#93c5fd" strokeWidth="1.5"/>
  <text x="140" y="102" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="500">部署 A</text>
  <text x="140" y="120" textAnchor="middle" fill="#64748b" fontSize="11">ahealth_check() → 200 ✓</text>

  {/* Deployment B */}
  <rect x="40" y="148" width="200" height="50" fill="white" rx="8" stroke="#fca5a5" strokeWidth="1.5"/>
  <text x="140" y="168" textAnchor="middle" fill="#991b1b" fontSize="12" fontWeight="500">部署 B</text>
  <text x="140" y="186" textAnchor="middle" fill="#64748b" fontSize="11">ahealth_check() → 401 ✗</text>

  {/* Deployment C */}
  <rect x="40" y="214" width="200" height="50" fill="white" rx="8" stroke="#fde68a" strokeWidth="1.5"/>
  <text x="140" y="234" textAnchor="middle" fill="#92400e" fontSize="12" fontWeight="500">部署 C</text>
  <text x="140" y="252" textAnchor="middle" fill="#64748b" fontSize="11">ahealth_check() → 429 ⚡</text>

  {/* ignore_transient box */}
  <rect x="40" y="282" width="200" height="68" fill="#fefce8" rx="8" stroke="#fde047" strokeWidth="1.5"/>
  <text x="140" y="302" textAnchor="middle" fill="#713f12" fontSize="11" fontWeight="600">ignore_transient_errors: true</text>
  <text x="140" y="320" textAnchor="middle" fill="#92400e" fontSize="11">429 / 408 → 忽略</text>
  <text x="140" y="338" textAnchor="middle" fill="#92400e" fontSize="11">不寫入快取</text>

  {/* allowed_fails_policy box */}
  <rect x="40" y="368" width="200" height="84" fill="#f0fdf4" rx="8" stroke="#86efac" strokeWidth="1.5"/>
  <text x="140" y="388" textAnchor="middle" fill="#166534" fontSize="11" fontWeight="600">allowed_fails_policy</text>
  <text x="140" y="406" textAnchor="middle" fill="#15803d" fontSize="11">401 → 增加計數器</text>
  <text x="140" y="424" textAnchor="middle" fill="#15803d" fontSize="11">計數器 &gt; 閾值</text>
  <text x="140" y="442" textAnchor="middle" fill="#15803d" fontSize="11">→ 觸發冷卻</text>

  {/* CENTER PANEL: Shared State */}
  <rect x="300" y="20" width="220" height="560" fill="#f5f3ff" rx="10" stroke="#c4b5fd" strokeWidth="1.5"/>
  <text x="410" y="48" textAnchor="middle" fill="#6d28d9" fontSize="13" fontWeight="600">共用狀態</text>

  {/* Health State Cache */}
  <rect x="320" y="62" width="180" height="116" fill="white" rx="8" stroke="#a78bfa" strokeWidth="1.5"/>
  <text x="410" y="84" textAnchor="middle" fill="#5b21b6" fontSize="12" fontWeight="600">DeploymentHealthCache</text>
  <text x="410" y="104" textAnchor="middle" fill="#64748b" fontSize="11">A → healthy ✓</text>
  <text x="410" y="122" textAnchor="middle" fill="#64748b" fontSize="11">B → unhealthy ✗</text>
  <text x="410" y="140" textAnchor="middle" fill="#64748b" fontSize="11">C → not written (ignored)</text>
  <text x="410" y="164" textAnchor="middle" fill="#94a3b8" fontSize="10">TTL: staleness_threshold × 1.5</text>

  {/* Cooldown Cache */}
  <rect x="320" y="196" width="180" height="104" fill="white" rx="8" stroke="#a78bfa" strokeWidth="1.5"/>
  <text x="410" y="218" textAnchor="middle" fill="#5b21b6" fontSize="12" fontWeight="600">冷卻快取</text>
  <text x="410" y="238" textAnchor="middle" fill="#64748b" fontSize="11">B → cooling down</text>
  <text x="410" y="256" textAnchor="middle" fill="#64748b" fontSize="11">(after policy threshold)</text>
  <text x="410" y="278" textAnchor="middle" fill="#94a3b8" fontSize="10">TTL: cooldown_time</text>

  {/* failed_calls counter */}
  <rect x="320" y="318" width="180" height="90" fill="white" rx="8" stroke="#a78bfa" strokeWidth="1.5"/>
  <text x="410" y="340" textAnchor="middle" fill="#5b21b6" fontSize="12" fontWeight="600">failed_calls 計數器</text>
  <text x="410" y="360" textAnchor="middle" fill="#64748b" fontSize="11">B: 2 / AuthAllowedFails: 1</text>
  <text x="410" y="378" textAnchor="middle" fill="#64748b" fontSize="11">→ 超過閾值</text>
  <text x="410" y="398" textAnchor="middle" fill="#94a3b8" fontSize="10">TTL: cooldown_time (must &gt; interval)</text>

  {/* RIGHT PANEL: Request path */}
  <rect x="560" y="20" width="280" height="560" fill="#fff7ed" rx="10" stroke="#fed7aa" strokeWidth="1.5"/>
  <text x="700" y="48" textAnchor="middle" fill="#c2410c" fontSize="13" fontWeight="600">請求路徑</text>

  {/* Incoming request */}
  <rect x="580" y="62" width="240" height="38" fill="#fff" rx="7" stroke="#fb923c" strokeWidth="1.5"/>
  <text x="700" y="85" textAnchor="middle" fill="#9a3412" fontSize="12" fontWeight="500">傳入請求</text>

  {/* All deployments */}
  <rect x="580" y="120" width="240" height="38" fill="#fff" rx="7" stroke="#fb923c" strokeWidth="1.5"/>
  <text x="700" y="143" textAnchor="middle" fill="#9a3412" fontSize="12">所有部署 [A, B, C]</text>

  <line x1="700" y1="100" x2="700" y2="120" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrow-orange)"/>

  {/* Health check filter */}
  <rect x="580" y="178" width="240" height="62" fill="#fff" rx="7" stroke="#fb923c" strokeWidth="1.5"/>
  <text x="700" y="200" textAnchor="middle" fill="#9a3412" fontSize="12" fontWeight="600">① 健康檢查篩選器</text>
  <text x="700" y="218" textAnchor="middle" fill="#64748b" fontSize="11">if policy set → bypass</text>
  <text x="700" y="234" textAnchor="middle" fill="#64748b" fontSize="11">else → 移除不健康項目</text>

  <line x1="700" y1="158" x2="700" y2="178" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrow-orange)"/>

  {/* Cooldown filter */}
  <rect x="580" y="262" width="240" height="50" fill="#fff" rx="7" stroke="#fb923c" strokeWidth="1.5"/>
  <text x="700" y="284" textAnchor="middle" fill="#9a3412" fontSize="12" fontWeight="600">② 冷卻篩選器</text>
  <text x="700" y="302" textAnchor="middle" fill="#64748b" fontSize="11">移除冷卻中的部署</text>

  <line x1="700" y1="240" x2="700" y2="262" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrow-orange)"/>

  {/* Safety net */}
  <rect x="580" y="334" width="240" height="52" fill="#fef9c3" rx="7" stroke="#fbbf24" strokeWidth="1.5"/>
  <text x="700" y="356" textAnchor="middle" fill="#713f12" fontSize="12" fontWeight="600">安全網</text>
  <text x="700" y="376" textAnchor="middle" fill="#713f12" fontSize="11">若全部移除 → 回傳全部</text>

  <line x1="700" y1="312" x2="700" y2="334" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrow-orange)"/>

  {/* Load balancer */}
  <rect x="580" y="408" width="240" height="38" fill="#fff" rx="7" stroke="#fb923c" strokeWidth="1.5"/>
  <text x="700" y="431" textAnchor="middle" fill="#9a3412" fontSize="12" fontWeight="600">③ 負載平衡器</text>

  <line x1="700" y1="386" x2="700" y2="408" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrow-orange)"/>

  {/* Selected deployment */}
  <rect x="580" y="468" width="240" height="38" fill="#dcfce7" rx="7" stroke="#4ade80" strokeWidth="1.5"/>
  <text x="700" y="491" textAnchor="middle" fill="#14532d" fontSize="12" fontWeight="600">已選取：部署 A ✓</text>

  <line x1="700" y1="446" x2="700" y2="468" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)"/>

  {/* ARROWS: left → center */}
  <line x1="240" y1="107" x2="320" y2="110" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-blue)"/>
  <line x1="240" y1="173" x2="320" y2="240" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-red)"/>
  <line x1="240" y1="173" x2="320" y2="348" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-red)"/>
  <line x1="240" y1="316" x2="320" y2="130" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-yellow)"/>

  {/* ARROWS: center → right */}
  <line x1="500" y1="120" x2="580" y2="190" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-purple)"/>
  <line x1="500" y1="248" x2="580" y2="274" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrow-purple)"/>

{/* 箭頭標記 */}
  <defs>
    <marker id="arrow-orange" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#fb923c"/>
    </marker>
    <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6"/>
    </marker>
    <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#ef4444"/>
    </marker>
    <marker id="arrow-yellow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#eab308"/>
    </marker>
    <marker id="arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#8b5cf6"/>
    </marker>
    <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#4ade80"/>
    </marker>
  </defs>
</svg>

## 這個問題解決了什麼？ {#what-problem-does-this-solve}

預設情況下，LiteLLM 會將流量路由到所有部署，且只有在某個部署已經讓使用者請求失敗之後，才會停止把流量送往該部署。冷卻系統是反應式的。

健康檢查驅動的路由讓這件事變成**主動式**：背景迴圈會依可設定的間隔輪詢每個部署。如果某個部署的健康檢查失敗，它會在使用者請求打到之前，立即從路由池中移除。

當您也設定 `allowed_fails_policy` 時，您可以精確控制每種錯誤類型（驗證錯誤、速率限制、逾時）需要累積多少次健康檢查失敗，才會讓部署進入冷卻。這能避免短暫雜訊造成誤判。

## 設定 {#setup}

### 步驟 1：啟用背景健康檢查 {#step-1-enable-background-health-checks}

背景健康檢查預設為關閉。請在 `general_settings` 中啟用：

```yaml
general_settings:
  background_health_checks: true
  health_check_interval: 60    # seconds between each full check cycle
```

### 步驟 2：啟用健康檢查路由 {#step-2-enable-health-check-routing}

```yaml
general_settings:
  background_health_checks: true
  health_check_interval: 60
  enable_health_check_routing: true  # ← route away from unhealthy deployments
```

此時，任何健康檢查失敗的部署都會立即從路由中排除，直到下一個檢查週期將其清除。

### 步驟 3：新增政策以控制多少次失敗會觸發冷卻 {#step-3-add-a-policy-to-control-how-many-failures-trigger-cooldown}

如果沒有政策，第一次健康檢查失敗就會將部署標記為不健康。如果您希望更有容錯空間（例如，只有連續 2 次驗證失敗後才採取動作），請使用 `allowed_fails_policy`：

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-5
      api_key: os.environ/ANTHROPIC_API_KEY_SECONDARY

general_settings:
  background_health_checks: true
  health_check_interval: 30
  enable_health_check_routing: true

router_settings:
  cooldown_time: 60              # how long a deployment stays in cooldown
  allowed_fails_policy:
    AuthenticationErrorAllowedFails: 1   # cooldown after 2nd auth failure
    TimeoutErrorAllowedFails: 3          # cooldown after 4th timeout
```

當設定 `allowed_fails_policy` 時，二元健康檢查過濾器會被繞過。只有冷卻系統會控制路由排除，而且只會在超過您設定的門檻後才觸發。

### 步驟 4（選用）：忽略暫時性錯誤 {#step-4-optional-ignore-transient-errors}

健康檢查回傳的 429（速率限制）和 408（逾時）通常表示部署暫時過載，而不是故障。若要完全避免這些情況影響路由：

```yaml
general_settings:
  background_health_checks: true
  health_check_interval: 30
  enable_health_check_routing: true
  health_check_ignore_transient_errors: true  # 429 and 408 never affect routing
```

啟用此設定後，只有健康檢查中的硬性失敗（401、404、5xx）會納入冷卻計算。

## 完整範例 {#full-example}

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY_SECONDARY

  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY

general_settings:
  background_health_checks: true
  health_check_interval: 30
  enable_health_check_routing: true
  health_check_ignore_transient_errors: true

router_settings:
  cooldown_time: 60
  allowed_fails_policy:
    AuthenticationErrorAllowedFails: 0   # cooldown immediately on auth failure
    TimeoutErrorAllowedFails: 2          # cooldown after 3 timeouts
    RateLimitErrorAllowedFails: 5        # cooldown after 6 rate limits (if not ignoring transients)
```


## 設定參考 {#configuration-reference}

| 設定 | 位置 | 預設值 | 說明 |
|---|---|---|---|
| `enable_health_check_routing` | `general_settings` | `false` | 將流量路由避開健康檢查失敗的部署 |
| `background_health_checks` | `general_settings` | `false` | 健康檢查路由運作必須為 `true` |
| `health_check_interval` | `general_settings` | `300` | 完整健康檢查週期之間的秒數 |
| `health_check_staleness_threshold` | `general_settings` | `interval x 2` | 快取健康狀態在被忽略前的秒數 |
| `health_check_ignore_transient_errors` | `general_settings` | `false` | 忽略健康檢查中的 429 與 408；這些永遠不會影響路由 |
| `cooldown_time` | `router_settings` | `5` | 超過門檻後，部署維持在冷卻狀態的秒數 |
| `allowed_fails_policy` | `router_settings` | `null` | 進入冷卻前，各錯誤類型的失敗門檻（如下） |

### `allowed_fails_policy` 欄位 {#allowed_fails_policy-fields}

| 欄位 | 錯誤類型 | HTTP 狀態碼 |
|---|---|---|
| `AuthenticationErrorAllowedFails` | API 金鑰錯誤 | 401 |
| `TimeoutErrorAllowedFails` | 請求逾時 | 408 |
| `RateLimitErrorAllowedFails` | 超出速率限制 | 429 |
| `BadRequestErrorAllowedFails` | 請求格式錯誤 | 400 |
| `ContentPolicyViolationErrorAllowedFails` | 內容被過濾 | 400 |

其值是指在進入冷卻前可**容忍**的失敗次數。`0` 表示第一次失敗就進入冷卻。`2` 表示第三次才進入冷卻。

## 需要注意的事項 {#things-to-keep-in-mind}

- **計數器 TTL 必須長於健康檢查間隔。** `allowed_fails_policy` 會透過對每個部署遞增一個 `failed_calls` 計數器來運作。該計數器會在 `cooldown_time` 秒後過期。如果 `cooldown_time` 比 `health_check_interval` 短，則計數器會在每個檢查週期之間重設，失敗次數永遠無法累積。使用 `allowed_fails_policy` 時，請將 `cooldown_time` 設為大於 `health_check_interval`。

  ```yaml
  router_settings:
    cooldown_time: 60       # must be > health_check_interval (30s here)

  general_settings:
    health_check_interval: 30
  ```

- **`AllowedFails: N` 表示在第 (N+1) 次失敗時進入冷卻。** 計數器檢查是 `updated_fails > allowed_fails`，因此 `0` 會在第 1 次失敗時觸發，`1` 會在第 2 次，`2` 會在第 3 次。

  | `AllowedFails` | 冷卻觸發於 |
  |---|---|
  | `0` | 第 1 次失敗 |
  | `1` | 第 2 次失敗 |
  | `2` | 第 3 次失敗 |

- **如果沒有 `allowed_fails_policy`，第一次失敗就足夠。** 第一次健康檢查失敗會立即將該部署排除在路由之外。當您希望容忍不穩定的檢查時，請使用 `allowed_fails_policy`。

- **如果所有部署都不健康，過濾器會被繞過。** 流量會持續通過，而不是完全沒有任何部署可用。請求仍會失敗，但路由器會持續嘗試。

- **健康檢查失敗與請求失敗共用相同的計數器。** 當設定 `allowed_fails_policy` 時，這兩種來源都會遞增同一個 `failed_calls` 計數器。某個部署若已有 1 次健康檢查失敗，接著又收到 1 次失敗請求，便會達到 `AllowedFails: 1` 的門檻並進入冷卻。

## 疑難排解 {#debugging}

以 `--detailed_debug` 啟動 proxy，並尋找以下記錄行：

每次健康檢查週期後（以 DEBUG 等級寫入）：
```
health_check_routing_state_updated healthy=2 unhealthy=1
```

當健康檢查失敗遞增計數器並觸發冷卻時（DEBUG 等級）：
```
checks 'should_run_cooldown_logic'
Attempting to add <deployment_id> to cooldown list
```

當安全機制因為所有部署都在冷卻中而觸發時：
```
All deployments in cooldown via health-check routing, bypassing cooldown filter
```

當安全機制因為所有部署都不健康而觸發時（二元過濾器，沒有 `allowed_fails_policy`）：
```
All deployments marked unhealthy by health checks, bypassing health filter
```
