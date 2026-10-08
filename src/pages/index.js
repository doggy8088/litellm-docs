import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {AgentBand, SalesBand, Tiles, UseCases} from '@site/src/components/Conversion';
import LiteLLMFlow from '@site/src/components/LiteLLMFlow';
import QuickStartBox from '@site/src/components/QuickStartBox';
import useLocaleText from '@site/src/utils/useLocaleText';
import styles from './index.module.css';

const POPULAR_EN = [
  {icon: 'gateway', title: 'Gateway quickstart', text: 'Docker and Postgres, the admin UI, and your first virtual key in 5 minutes.', to: '/docs/proxy/docker_quick_start'},
  {icon: 'sdk', title: 'SDK quickstart', text: 'Run uv add litellm. Then call a provider with completion().', to: '/docs/'},
  {icon: 'agent', title: 'Connect Claude Code and Codex', text: 'Connect coding agents and OpenAI SDKs to your gateway.', to: '/docs/proxy/client_setup/overview'},
  {icon: 'mcp', title: 'Providers', text: 'OpenAI, Anthropic, Bedrock, Agent Platform, Azure, and 100+ more.', to: '/docs/providers'},
  {icon: 'budget', title: 'Keys, budgets, and costs', text: 'Virtual keys with limits for each key, team, and tag.', to: '/docs/proxy/virtual_keys'},
  {icon: 'regions', title: 'Deploy to production', text: 'Helm, Terraform, and Kubernetes on AWS, GCP, and Azure.', to: '/docs/proxy/deploy'},
];

const POPULAR_ZH = [
  {icon: 'gateway', title: 'Gateway 快速開始', text: '在 5 分鐘內完成 Docker、Postgres、管理介面與第一把虛擬金鑰設定。', to: '/docs/proxy/docker_quick_start'},
  {icon: 'sdk', title: 'SDK 快速開始', text: '執行 uv add litellm，接著以 completion() 呼叫任何提供者。', to: '/docs/'},
  {icon: 'agent', title: '連接 Claude Code 與 Codex', text: '將程式設計代理與 OpenAI SDK 連接至您的閘道。', to: '/docs/proxy/client_setup/overview'},
  {icon: 'mcp', title: '模型提供者', text: '支援 OpenAI、Anthropic、Bedrock、Agent Platform、Azure 等 100 多家提供者。', to: '/docs/providers'},
  {icon: 'budget', title: '金鑰、預算與成本', text: '為每把虛擬金鑰、團隊與標籤設定用量與預算上限。', to: '/docs/proxy/virtual_keys'},
  {icon: 'regions', title: '部署至正式環境', text: '在 AWS、GCP 與 Azure 上使用 Helm、Terraform 與 Kubernetes 部署。', to: '/docs/proxy/deploy'},
];

export default function Home() {
  const t = useLocaleText();
  const popular = t(POPULAR_ZH, POPULAR_EN);
  return (
    <Layout
      title={t('LiteLLM 技術文件', 'LiteLLM documentation')}
      description={t(
        'LiteLLM 官方文件：全球使用最廣泛的開放原始碼 AI 閘道與 Python SDK，以單一 OpenAI 相容 API 串接 100+ 家 LLM 提供者，並提供金鑰管理、預算控制、支出追蹤與防護欄。',
        'Docs for LiteLLM, the most widely used open-source AI gateway: a Python SDK and a self-hosted gateway that give 100+ LLM providers one OpenAI-compatible API, with keys, budgets, spend tracking, and guardrails.',
      )}>
      <Head>
        <link rel="alternate" type="text/markdown" href="/index.md" title="LiteLLM docs home (markdown)" />
      </Head>
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              {t('全球使用最廣泛的開放原始碼 AI 閘道。', 'The most widely used open\u2011source AI gateway.')}
            </h1>
            <p className={styles.lead}>
              {t(
                'LiteLLM 是整合所有模型、工具與代理程式的單一閘道，透過統一 API 串接 100+ 家 LLM 提供者、MCP 工具與 A2A 代理程式，並集中控管金鑰、預算及記錄每次請求的成本。',
                'LiteLLM is one gateway for all your models, tools, and agents. It gives one API to 100+ LLM providers, MCP tools, and A2A agents. It controls keys and budgets, and it records the cost of each request.',
              )}
            </p>
          </div>
        </header>

        <LiteLLMFlow copyCommand={false} agentPrompt={false} />

        <QuickStartBox source="docs-home" />

        <AgentBand source="docs-home" />

        <UseCases source="docs-home" />

        <section className={styles.section}>
          <h2 className={styles.h2}>{t('熱門指南', 'Most-read guides')}</h2>
          <Tiles items={popular} columns={3} />
        </section>

        <SalesBand source="docs-home" />
      </main>
    </Layout>
  );
}
