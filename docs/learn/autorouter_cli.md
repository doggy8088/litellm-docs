---
title: lite 自動路由
sidebar_label: lite 自動路由
description: 使用 lite CLI 在本機針對您的實際 proxy 嘗試 LiteLLM 以複雜度為基礎的自動路由，並讓 Claude Code 流量經由它路由。
---

`lite autoroute` 是 `lite` 的子指令，該 [LiteLLM proxy CLI](../proxy/management_cli.md) 也提供 `lite login`、`lite up`、`lite claude` 以及 model、key 和 team 管理指令。它讓您可以在本機針對您的實際、正在執行中的 proxy 上，使用您的 key 已可存取的模型來嘗試 LiteLLM 以複雜度為基礎的自動路由。它會根據提示詞看起來有多複雜，選擇較便宜或較昂貴的 model，而不會編輯您 proxy 的 `config.yaml`，也不會讓任何 request 繞過它。它會建立一個一次性本機 proxy，把每個請求都轉送回您的實際 proxy，然後在該工作階段中將 Claude Code 指向那個本機 proxy。

:::info[預覽功能；我們想聽取您的回饋]

`lite autoroute` 仍處於早期階段且持續演進中。請在 [GitHub 上的 Autorouter 討論](https://github.com/BerriAI/litellm/discussions/32168) 中告訴我們哪些有效、哪些失敗，以及您接下來想要什麼。您的回饋會直接塑造這項功能的未來走向。

:::

如需 proxy 設定與完整設定參考，請參閱 [Auto Routing](../proxy/auto_routing.md)。

## 1. 安裝 CLI {#1-install-the-cli}

`lite autoroute start` 會在您的電腦上執行一次性 proxy，因此需要完整的 proxy 執行環境：來自 [CLI quick start](../proxy/management_cli.md#quick-start) 的精簡 `install-cli.sh` 一行指令只會安裝 `litellm[cli]`，這裡還不夠，而下方指令會以新的安裝取代它。它會透過單一 curl 指令從 `main` 安裝 `litellm[proxy]`；如果 `uv` 不存在，會自動啟動。

```bash
curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm/main/scripts/install.sh | \
  LITELLM_CLI_REF=main sh
```

## 2. 將 CLI 指向您的 proxy {#2-point-the-cli-at-your-proxy}

設定您的實際 proxy URL 與 key。autorouter 會使用這個 key，透過此 proxy 轉送每個 request。

```bash
export LITELLM_PROXY_URL=http://localhost:4000
export LITELLM_PROXY_API_KEY=sk-...
```

## 3. 設定 Autorouter {#3-configure-the-autorouter}

執行互動式精靈。它會探索您的 key 可以連到的 model 群組，並要求您將 model 指派給每個複雜度等級。

```bash
lite autoroute configure
```

## 4. 啟動 Autorouter {#4-start-the-autorouter}

啟動暫時性的本機 proxy。它會以前景模式執行並印出 proxy 的 request 記錄。按下 Ctrl-C 會停止它並還原您的 Claude Code 設定；如果程序以其他任何方式終止，`lite autoroute stop` 會負責完成該清理作業。

```bash
lite autoroute start
```

## 5. 如常執行 Claude Code {#5-run-claude-code-as-normal}

在另一個分頁中，啟動 Claude Code。autorouter 現在會自動攔截所有 Claude Code 流量，而 Claude Code 狀態列會在每次回應後顯示 `Routed to: <model>`。

```bash
claude
```

如需完整參考資料，包括從未正常關閉的狀況中復原，以及重要注意事項，請參閱 [CLI README 的 `lite autoroute` 區段](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/client/cli/README.md#qa-complexity-based-auto-routing-against-your-real-proxy)。
