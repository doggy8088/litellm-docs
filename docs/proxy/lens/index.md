---
slug: /proxy/lens
title: LiteLLM Lens
description: 使用 LiteLLM Lens 追蹤代理程式執行並調查重複發生的失敗。
image: /img/lens/lens_hero_labeled.gif
---

# LiteLLM Lens {#litellm-lens}

<p>
  <a className="button button--primary button--sm" href="https://forms.gle/3GC1Ner4vjthGWi18">搶先體驗</a>
</p>

![代理程式群從 LiteLLM 閘道流入每次執行的一筆追蹤，而 LiteLLM Lens 則將改進回饋回去。](/img/lens/lens_hero_labeled.gif)

一旦代理程式進入正式環境，您就無法手動檢視每一筆追蹤。

LiteLLM Lens 使用 AI 代理程式分析您的代理程式追蹤並找出重複出現的問題。您指定預期行為。Lens 會調查失敗、將相似問題分組，並將每個發現連結到原始追蹤。

使用 **Lens > Traces** 手動檢查個別執行。使用 **Lens > Investigations** 依需求或按排程調查一組執行。

在設定之前，請點擊 Lens 標題旁的 **Preview sample** 以瀏覽範例追蹤、調查和連結的證據。**Exit demo** 會返回您的工作區。

## 開始使用 {#get-started}

[部署 Lens](./deployment.md)，然後[送出您的第一筆追蹤](./first-trace.md)。請從側邊欄選擇一個整合項目以取得可執行的專案。

使用[coding agent 指南](./coding-agents.md)來記錄個人的 Claude Code 或 Codex 工作階段。一旦有追蹤可用，就[執行調查](./investigations.md)或使用[API 參考文件](./api.md)。
