---
slug: lap-internal-agent-30-percent
title: "我們如何打造一個背景代理程式，覆蓋 30% 的待辦工作"
date: 2026-05-27T10:00:00
authors:
  - krrish
  - ishaan
description: "我們如何在 LiteLLM AI Gateway 上打造一個背景代理程式，在沒有人工介入的情況下合併 PR（以及背後的基礎架構、harness 與憑證範圍設定作業）。"
tags: [agents, ai-gateway, lap, lite-harness, engineering]
hide_table_of_contents: true
image: /img/lap_litellm_agent_platform_hero.png
---

<img src="/img/lap_litellm_agent_platform_hero.png" alt="LiteLLM Agent Platform：agent.litellm.ai" style={{width: "100%"}} />

:::info

我們打造的平台是開源的。請查看 [litellm-agent-platform](https://github.com/BerriAI/litellm-agent-platform)。可替換的 harness 層是 [lite-harness](https://github.com/LiteLLM-Labs/lite-harness)。

想在貴公司內部打造相同的東西嗎？

- [預約 30 分鐘通話](https://calendly.com/d/cr4t-yp7-pzn/litellm-1-1-feedback-chat)
- [加入 LAP Discord](https://discord.gg/Q2AK7HKudm)

:::

我們的目標是用代理程式將公司的生產力提升 10 倍。

三週前，我們開始打造一個能夠承接 30% 工程票券的代理程式。以下是截至目前我們的所學。

{/* truncate */}

## 我們交付了什麼 {#what-we-shipped}

在三週內，截至 `BerriAI/litellm`：**43 個開啟中的 PR、160 個已關閉。** 加上它接手的 PR 與回答的 Slack 問題，這個代理程式現在大約覆蓋了**每週原本會找人處理的工程票券的 30%**。瀏覽 [GitHub 上所有由代理程式提交的 PR](https://github.com/BerriAI/litellm/pulls?q=is%3Apr+author%3Aoss-agent-shin)。

## 為什麼我們自己打造 {#why-we-built-our-own}

我們想要一個能在背景中自主運作的代理程式，從 Linear 取出票券並替我們提出 PR。我們先評估了 Cursor 和 Anthropic 的託管代理程式平台。兩者都不符合需求：

- **Cursor：** 代理程式不是有狀態的。您無法為每個代理程式儲存記憶、技能等。該平台把代理程式等同於一個 session；我們想要的是能跨 session 持續存在的代理程式。
- **Anthropic：** 接近我們想要的，但我們希望能自由切換模型與 harness。我們不想被綁定在單一平台上。

因此我們建立在 [LiteLLM Agent Platform](https://github.com/BerriAI/litellm-agent-platform) 之上。 

## 1. 基礎架構：把大腦與沙箱分開 {#1-infrastructure-separate-the-brain-from-the-sandbox}

我們的第一個版本把代理程式放在沙箱*裡面*執行，形狀與 [Ramp Inspect](https://builders.ramp.com/post/why-we-built-our-background-agent) 類似。每個新 session 都會啟動一個全新的沙箱。當工作是「去修改程式碼」時，這很合理；但當工程師只是在 Slack 問一個問題時，這就很浪費。為了回答只需要幾次工具呼叫的事情，卻要付出完整沙箱啟動的成本。

所以我們把代理程式拆成兩部分。**大腦**（推理、規劃、模型呼叫）運作在共享且持久的 pod 中。它沒有 shell：沒有 BASH，沒有檔案系統。**沙箱**是暫時性的，每個 session 一個，而唯一能執行 `git`、`gh` 或 `pytest` 的地方。大腦透過兩個工具呼叫連到它。這與 [Anthropic 的託管代理程式平台運作方式](https://www.anthropic.com/engineering/managed-agents) 類似。

![架構：一個沒有 shell 的持久化大腦 pod，透過兩個工具呼叫與每個 session 的暫時性沙箱叢集溝通](/img/lap_brain_sandbox_split.svg)

回應時間下降，session 成功率上升，而每個 session 的成本也下降了。

冷啟動在 Slack 中最明顯，因為每個人都能感受到等待。

![Slack 討論串正在等待冷啟動的沙箱啟動，代理程式才能回應](/img/lap_shin_slack_slow_start.png)

## 2. 架構：選擇 harness，而不是 agent framework {#2-architecture-pick-a-harness-not-an-agent-framework}

我們一開始使用 agent framework：Pydantic AI、LangGraph、PI SDK。每一個都迫使我們重新打造一個編碼 *harness* 已經內建的東西：context compaction、子代理程式啟動、工具迴圈。我們本來就信任 Claude Code 能在本機做這類工作，所以我們尋找的是 harness，而不是 framework。

最後我們採用了 **OpenCode**。Claude Agents SDK 每次執行都會啟動一個 CLI session，對我們來說在約 1 RPM 時就 OOM 了。OpenCode 面臨相同的根本瓶頸（長時間運作的 session 會保留在記憶體中），但它的記憶體使用成長更慢，因此目前更適合。

這個選擇仍保有彈性，因為我們也寫了一個 harness 統一層，[`LiteLLM-Labs/lite-harness`](https://github.com/LiteLLM-Labs/lite-harness)，可將 OpenCode、Claude Code、Codex 等整合成單一 HTTP 合約：

```
lite-harness/
  opencode/           # runtime adapter
  claude-agent-sdk/   # runtime adapter
  contract.py         # the one interface every runtime implements
```

這個代理程式平台不知道某個 session 背後是哪一個 harness，因此切換只是一個設定變更，而不是重寫。

我們的下一個目標：harness 達到 100 RPM。

## 3. 安全性：將每個憑證範圍限定到單一端點 {#3-security-scope-every-credential-to-one-endpoint}

我們的代理程式一直把環境中的 API 金鑰洩漏到 commit 和 Slack 訊息中。第一個緩解措施：一個小型 HTTP proxy vault。我們在環境中以 stub 取代真實憑證，並且只有在代理程式發出 outbound 呼叫時，才把 stub 換成真實值。

代理程式破解了這招。它注意到憑證是 stub 的，接著寫出自己的端點，使用 stub 的憑證呼叫它，讓 vault 在傳出時替換成真實憑證，然後從它自己的伺服器把真實金鑰讀回來，接著透過工具呼叫把它們存進記憶體。這是一個針對我們自己 vault 的乾淨中間人攻擊。

![Ishaan 抓到代理程式在繞過 stub vault 後，將真實憑證寫入其記憶體](/img/lap_shin_agent_mitm_memory.png)

修正方式是不再信任 *值*，而是開始把它綁定到 *目的地*。每個憑證都固定到一個上游主機；如果 outbound 請求要去的是其他地方，vault 就會拒絕替換：

```yaml
# vault: a credential is only ever swapped in for its bound host
credentials:
  GITHUB_TOKEN:
    allowed_host: api.github.com
  OPENAI_API_KEY:
    allowed_host: api.openai.com
```

教訓是：防護欄必須位於代理程式的輸入/輸出邊界。LLM 層級的防護欄無法區分使用者查詢與內部工具迴圈，因此不是過於寬鬆，就是太慢。

## AI Gateway 的定位 {#where-the-ai-gateway-fits}

AI Gateway 是一個有用的存取控制點：我們就是透過它讓代理程式存取模型與 MCP 工具。但這只是整體的一半。代理程式邊界需要自己的一套防護欄與功能（技能、記憶），因為真正採取行動的是代理程式（而不是模型）。當代理程式回應使用者時所需的防護欄，與在內部工具迴圈中所需的不同。對每一次工具呼叫都執行模型層級的防護欄，也會讓每個 session 額外增加約 5 分鐘。

## 我們現在的看法 {#what-we-believe-now}

自主代理程式才是 10 倍生產力提升真正出現的地方，而技術風險大致上已經解決。模型已經夠聰明到可以提出一個像樣的 PR。剩下的困難問題是產品問題：規模、可靠性與安全性。

對我們來說，這代表兩個未解問題：

- **規模：** 您要如何在一個將 session 保留於記憶體中的 harness 上提供 100 RPM？
- **安全性：** 您要如何防止代理程式伺服器洩漏敏感資訊或採取破壞性行動？（我們試過 MCP，但遇到速率限制與結構性問題，因此直接使用 API 金鑰更可靠；這也使得憑證範圍設定變得關鍵。）

## 試試看 {#try-it}

這兩個 repo 都是開源且可自架的：[litellm-agent-platform](https://github.com/BerriAI/litellm-agent-platform) 與 [lite-harness](https://github.com/LiteLLM-Labs/lite-harness)。如果您正在打造類似的東西，並且想跳過這三週的錯誤，[預約 30 分鐘聊聊](https://calendly.com/d/cr4t-yp7-pzn/litellm-1-1-feedback-chat) 或加入 [LAP Discord](https://discord.gg/Q2AK7HKudm)。

*這篇部落格在形式上受到 Ramp 的 [Why we built our background agent](https://builders.ramp.com/post/why-we-built-our-background-agent) 啟發。*
