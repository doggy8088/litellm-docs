import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useLocaleText from '@site/src/utils/useLocaleText';
import {GATEWAY_COMPOSE, PROMPTS} from '../Conversion/content';
import {IconAgent, IconCheck} from '../Conversion/icons';
import {track, useCopy} from '../Conversion/shared';
import styles from './styles.module.css';

// The /docs/ hero: who calls LiteLLM on the left, the LiteLLM monogram in the
// middle, and what it reaches on the right (model APIs, MCP tools, A2A
// agents). Plain HTML and SVG, so it renders without an image download and
// reads the same in light and dark mode. The connecting lines are measured
// after layout, so they follow the boxes at any width.
//
// Options for pages other than /docs/: copyCommand={false} shows the logo as a
// plain card, without the click to copy the gateway start command.
// agentPrompt={false} drops the "Copy agent prompt" button. highlight names one
// group (for example "A2A agents") to emphasize; the others fade back.

const Line = ({d, on}) => <path d={d} className={on ? styles.lineOn : undefined} />;

function Icon({children}) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const CALLERS = [
  ['Developer', '開發人員', <Icon key="d"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /></Icon>],
  ['Coding agent', '程式開發代理', <Icon key="c"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></Icon>],
  ['Your app', '您的應用程式', <Icon key="a"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></Icon>],
];

const AGENT_ICON = (
  <Icon>
    <rect x="5" y="8" width="14" height="11" rx="3" />
    <path d="M12 4v4M9 13h.01M15 13h.01" />
  </Icon>
);

// Logos are the vendors' files already in static/img/integrations
const GROUPS = [
  {
    key: 'LLM APIs',
    labelZh: 'LLM API',
    items: [['OpenAI', 'OpenAI', 'openai.svg', true], ['Anthropic', 'Anthropic', 'anthropic.svg', true], ['Gemini', 'Gemini', 'gemini.svg'], ['Amazon Bedrock', 'Amazon Bedrock', 'aws.svg', true]],
    more: ['+100', '+100', '/docs/providers'],
  },
  {
    key: 'MCP tools',
    labelZh: 'MCP 工具',
    items: [['GitHub', 'GitHub', 'github.png', true], ['Slack', 'Slack', 'slack.svg']],
    more: ['any MCP', '任何 MCP', '/docs/mcp'],
  },
  {
    key: 'A2A agents',
    labelZh: 'A2A 代理程式',
    items: [['LangChain', 'LangChain', 'langchain.png'], ['Letta', 'Letta', 'letta.svg', true], ['Your agent', '您的代理程式', null]],
    more: ['any A2A', '任何 A2A', '/docs/a2a'],
  },
];

// A soft S-curve whose control points sit far out, so lines bend gently
function curve(x1, y1, x2, y2) {
  const k = Math.max(28, (x2 - x1) * 0.55);
  return `M${x1} ${y1} C ${x1 + k} ${y1}, ${x2 - k} ${y2}, ${x2} ${y2}`;
}

export default function LiteLLMFlow({copyCommand = true, agentPrompt = true, highlight}) {
  const t = useLocaleText();
  const ref = useRef(null);
  const [lines, setLines] = useState({w: 0, h: 0, d: []});
  const [copied, copy] = useCopy();
  const [hubCopied, copyHub] = useCopy(2200);
  const integration = useBaseUrl('/img/integrations/');
  const monoBlue = useBaseUrl('/img/brand/litellm-monogram-blue.svg');
  const monoWhite = useBaseUrl('/img/brand/litellm-monogram-white.svg');

  useEffect(() => {
    const fig = ref.current;
    if (!fig) return undefined;
    const draw = () => {
      const R = fig.getBoundingClientRect();
      const hub = fig.querySelector('[data-hub]').getBoundingClientRect();
      const cy = hub.top + hub.height / 2 - R.top;
      const hl = hub.left - R.left;
      const hr = hub.right - R.left;
      const d = [];
      fig.querySelectorAll('[data-caller]').forEach((n) => {
        const b = n.getBoundingClientRect();
        if (!b.width) return;
        d.push({d: curve(b.right - R.left, b.top + b.height / 2 - R.top, hl, cy)});
      });
      fig.querySelectorAll('[data-dest]').forEach((n) => {
        const b = n.getBoundingClientRect();
        if (!b.width) return;
        d.push({
          d: curve(hr, cy, b.left - R.left - 6, b.top + b.height / 2 - R.top),
          on: n.hasAttribute('data-on'),
        });
      });
      // The highlighted line goes last, so it draws over the others
      d.sort((a, b) => Number(Boolean(a.on)) - Number(Boolean(b.on)));
      setLines({w: R.width, h: R.height, d});
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(fig);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <figure
        ref={ref}
        className={styles.flow}
        aria-label={t(
          '開發人員、程式開發代理與應用程式呼叫 LiteLLM，進而連接 100+ 個 LLM API、MCP 工具與 A2A 代理程式。',
          'Developers, coding agents, and apps call LiteLLM, which reaches 100+ LLM APIs, MCP tools, and A2A agents.',
        )}>
        <svg className={styles.lines} width={lines.w} height={lines.h} viewBox={`0 0 ${lines.w || 1} ${lines.h || 1}`} aria-hidden="true">
          {lines.d.map((l, i) => (
            <Line key={i} d={l.d} on={l.on} />
          ))}
        </svg>

        <div className={styles.callers}>
          <span className={styles.label}>{t('呼叫來源', 'Who calls')}</span>
          {CALLERS.map(([labelEn, labelZh, icon]) => (
            <div key={labelEn} className={styles.caller} data-caller="">
              <span className={styles.icon}>{icon}</span>
              {t(labelZh, labelEn)}
            </div>
          ))}
        </div>

        <div className={styles.hubWrap}>
          {copyCommand ? (
            /* Clicking the logo copies the three commands that start the gateway */
            <button
              type="button"
              className={styles.hub}
              data-hub=""
              title={t('複製啟動 LiteLLM Gateway 的指令', 'Copy the command that starts the LiteLLM Gateway')}
              aria-label={
                hubCopied
                  ? t('已複製啟動指令', 'Start command copied')
                  : t('複製啟動 LiteLLM Gateway 的指令', 'Copy the command that starts the LiteLLM Gateway')
              }
              onClick={() => {
                copyHub(GATEWAY_COMPOSE);
                track('docs_install_copied', {kind: 'gateway', source: 'docs-index-figure'});
              }}>
              <img className={styles.monoLight} src={monoBlue} alt="" width="52" height="52" />
              <img className={styles.monoDark} src={monoWhite} alt="" width="52" height="52" />
              <span className={styles.hubName}>LiteLLM</span>
              <span className={hubCopied ? `${styles.hubHint} ${styles.hubHintOn}` : styles.hubHint} aria-live="polite">
                {hubCopied
                  ? t('已複製 Gateway 啟動指令', 'Gateway start command copied')
                  : t('複製 Gateway 啟動指令', 'Copy gateway start command')}
              </span>
            </button>
          ) : (
            <div className={styles.hub} data-hub="">
              <img className={styles.monoLight} src={monoBlue} alt="" width="52" height="52" />
              <img className={styles.monoDark} src={monoWhite} alt="" width="52" height="52" />
              <span className={styles.hubName}>LiteLLM</span>
            </div>
          )}
        </div>

        <div className={highlight ? `${styles.dests} ${styles.dim}` : styles.dests}>
          {GROUPS.map((g) => {
            const on = g.key === highlight;
            return (
              <div key={g.key} className={on ? `${styles.group} ${styles.on}` : styles.group}>
                <span className={styles.label}>{t(g.labelZh, g.key)}</span>
                <div className={styles.row} data-dest="" data-on={on ? '' : undefined}>
                  {g.items.map(([nameEn, nameZh, file, invertDark]) => {
                    const displayName = t(nameZh, nameEn);
                    return (
                      <span key={nameEn} className={styles.icon} title={displayName}>
                        {file ? (
                          <img src={integration + file} alt={displayName} width="15" height="15" className={invertDark ? styles.invertDark : undefined} />
                        ) : (
                          AGENT_ICON
                        )}
                      </span>
                    );
                  })}
                  {/* The highlighted group is the page being read, so no link to itself */}
                  {on ? (
                    <span className={styles.more}>{t(g.more[1], g.more[0])}</span>
                  ) : (
                    <Link className={styles.more} to={g.more[2]}>
                      {t(g.more[1], g.more[0])}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </figure>

      {agentPrompt && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.promptBtn}
            onClick={() => {
              copy(PROMPTS.gateway.text);
              track('docs_agent_prompt_copied', {prompt: 'gateway', source: 'docs-index-figure'});
            }}>
            {copied ? <IconCheck size={13} /> : <IconAgent size={13} />}
            {copied ? t('已複製', 'Copied') : t('複製 AI 代理提示詞', 'Copy agent prompt')}
          </button>
        </div>
      )}
    </>
  );
}
