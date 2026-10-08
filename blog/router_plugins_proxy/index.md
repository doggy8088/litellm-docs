---
slug: router-plugins-on-the-proxy
title: "宣布 Router Plugins：自訂路由訊號"
date: 2026-07-17T12:00:00
authors:
  - krrish
description: "Router plugins 現已在 LiteLLM 上線。設定一個插件管線，以決定針對給定輸入要選擇哪些模型。插件也可以串接"
tags: [routing, complexity-router, plugins, proxy, product]
hide_table_of_contents: false
---

:::info[可用性]

Router plugins 自 **v1.94.x** 起可在 proxy 上運作。此設計仍在演進中；歡迎告訴我們您會如何使用它，以及您接下來希望看到什麼，請參閱 GitHub 上的 [autorouter 討論（#32168）](https://github.com/BerriAI/litellm/discussions/32168)。

:::

Router plugins 現已可在 LiteLLM 上使用。每個插件都會接收路由內容、加以擴充，然後在 router 做出最終決策之前將其傳給下一個插件。

這股推動力來自 [autorouter 討論（#32168）](https://github.com/BerriAI/litellm/discussions/32168)：團隊希望將自己的訊號（語言偵測、網域分類、租戶政策、預算上限）層疊到路由之上，而不必等待每一項都進入核心。這個插件擴充功能讓團隊能在維持 LiteLLM 路由核心穩定的同時完成這些變更。

{/* truncate */}

## 開始使用 {#get-started}

插件可以是任何具有 `async run` 方法的物件，該方法會接收路由內容並將其回傳。收窄 `candidate_models` 可限制 router 能選擇的內容，並寫入 `signals` 以將資訊往下游傳遞。

在 `plugins/cheap_first.py` 的 `config.yaml` 旁建立一個插件：

```python
from litellm.types.router import RoutingContext


class CheapFirst:
    async def run(self, context: RoutingContext) -> RoutingContext:
        cheaper = [m for m in context.candidate_models if "mini" in m]
        context.candidate_models = cheaper or context.candidate_models
        context.signals["cheap-first"] = {"applied": bool(cheaper)}
        return context


cheap_first_plugin = CheapFirst()
```

透過其 dotted path 從 `router_settings.plugins` 參照它。proxy 會從與 `config.yaml` 相鄰的本機檔案載入它，或使用相同語法從已安裝的 pip 套件載入：

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  plugins:
    - plugins.cheap_first.cheap_first_plugin
```

啟動 proxy 後，每一次路由決策都會經過您的插件：

```bash
litellm --config config.yaml
```

## 串接插件 {#chaining-plugins}

插件會依清單順序作為管線執行，而每一個插件都會看到前一個插件留下的修改與訊號。在 `plugins/enterprise_only.py` 中新增第二個插件，讀取 `context.metadata` 所標示的租戶，並針對企業呼叫者將候選池限制為它保留的模型；它也可以讀取上游發佈的 `cheap-first` 訊號：

```python
from litellm.types.router import RoutingContext


class EnterpriseOnly:
    ENTERPRISE = {"acme-corp", "globex"}

    async def run(self, context: RoutingContext) -> RoutingContext:
        tenant = context.metadata.get("tenant", "default")
        if tenant in self.ENTERPRISE:
            context.candidate_models = [
                m for m in context.candidate_models if "gpt-4o" in m
            ]
        # signals from earlier plugins are available here
        cheap = context.signals.get("cheap-first", {}).get("applied")
        context.signals["enterprise-only"] = {"tenant": tenant, "after_cheap": cheap}
        return context


enterprise_only_plugin = EnterpriseOnly()
```

將兩者都列在 `router_settings.plugins` 下。`cheap_first` 會先執行並縮小候選池，接著 `enterprise_only` 會接收該縮小後的候選池，並在其上套用自己的政策：

```yaml
router_settings:
  plugins:
    - plugins.cheap_first.cheap_first_plugin
    - plugins.enterprise_only.enterprise_only_plugin
```

每個插件都只會縮小範圍；如果任何插件移除了所有剩餘候選項，請求就會直接失敗，而不是悄悄回退到完整候選池，因此管線中的某項政策不會被前面的政策繞過。

## 插件在 autorouter 內部 {#plugins-inside-the-autorouter}

`router_settings.plugins` 會在全域範圍內對每一次路由決策執行該管線。您也可以將插件限定於 [complexity autorouter](/docs/proxy/auto_routing)，讓它們在 tier 選擇流程中、以該 tier 的實際候選池執行。將它們放在自動路由器模型的 `complexity_router_config.plugins` 下：

```yaml
model_list:
  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE: ["gpt-4o-mini"]
          COMPLEX: ["gpt-4o", "gpt-4o-mini"]
        default_model: gpt-4o-mini
        plugins:
          - plugins.cheap_first.cheap_first_plugin

  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

這裡 autorouter 會先將請求分類到某個 tier，接著插件會在選定部署之前先過濾該 tier 的候選池。因此，一個分類到 `["gpt-4o", "gpt-4o-mini"]` 的 `COMPLEX` 請求，仍然會經過 `cheap_first`，而後者只會保留 `gpt-4o-mini`。與全域管線相同，`default_model` 不是逃生出口：如果插件刪除了該 tier 中所有候選項，請求就會直接失敗，而不是回退到它。

當將插件與 complexity router 結合時，有兩件事要注意：啟用插件時 `session_affinity` 會停用，因此中途的政策變更仍會套用到後續回合，而不會因快取的模型固定而被略過；此外，`adaptive: true` 與 `plugins` 一起使用時會在設定驗證階段拋出錯誤，因為 bandit 選擇器目前尚未消耗經插件縮小的候選池。

若要了解完整合約、請求生命週期，以及更多關於將插件限定到 autorouter 各 tier 的內容，請參閱 [routing plugins 文件](/docs/routing_plugins)。

## 註冊您的插件 {#register-your-plugin}

我們也正透過 LiteLLM repo 根目錄的一個 `router_plugins.json`，讓插件可被探索。

以下是一個範例項目：

```json
  {
    "name": "language-detector",
    "description": "Detects the user's language and publishes a routing signal.",
    "author": "Jean Nuñez",
    "repo": "https://github.com/jeann2013/language-detector",
    "commit": "9e712819269173fc25a16f59ca3e9890f7864ac1",
    "version": "1.0.0",
    "pypi": null,
    "litellm_version": ">=1.94.0",
    "entrypoint": "litellm_plugin_language_detector.plugin.language_detector_plugin",
    "license": "MIT",
    "tags": ["language", "classification", "routing"]
  }
```

第一個社群項目是由 [Jean Nuñez](https://github.com/jeann2013) 提供的 language-detector，它會偵測使用者的語言並發佈一個路由訊號。它固定到一個經審核的 commit，目標為 litellm>=1.94.0，而其 entrypoint 為 litellm_plugin_language_detector.plugin.language_detector_plugin；只要將該字串放到 router_settings.plugins 下即可執行。若您寫了插件，請將它加入目錄，讓其他人能找到。

## 回饋 {#feedback}

如果您有任何回饋，我們很想聽聽！

請在 GitHub 上的 [autorouter 討論（#32168）](https://github.com/BerriAI/litellm/discussions/32168) 分享您的想法，或直接聯絡我（krrish@berri.ai），告訴我您認為可以如何改進！
