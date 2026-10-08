import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import useLocaleText from '@site/src/utils/useLocaleText';
import PromptButton from './PromptButton';
import SalesButton from './SalesButton';
import {CARD_GROUPS, CARD_GROUPS_ZH, PRODUCT_CARDS, PRODUCT_CARDS_ZH, USE_CASES, USE_CASES_ZH} from './content';
import {track} from './shared';
import cv from './styles.module.css';
import styles from './usecases.module.css';

// The docs home below the path picker: one section per product, each what
// the product does, then how. The visual is always
// real text (code, a small table, or log lines), so it reads the same for a
// person and for an agent reading the page's markdown.

function Visual({v}) {
  if (v.type === 'code') {
    return (
      <CodeBlock language={v.lang} className={styles.code}>
        {v.code}
      </CodeBlock>
    );
  }
  if (v.type === 'table') {
    return (
      <div className={styles.table} role="table">
        <div className={clsx(styles.tr, styles.th)} role="row" style={{'--cols': v.head.length}}>
          {v.head.map((h) => (
            <span key={h} role="columnheader">
              {h}
            </span>
          ))}
        </div>
        {v.rows.map((r) => (
          <div key={r[0]} className={styles.tr} role="row" style={{'--cols': v.head.length}}>
            {r.map((c, i) => (
              <span key={i} role="cell" className={clsx((c === 'no access' || c === '無存取權') && styles.muted)}>
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (v.type === 'chat') {
    return (
      <div className={styles.chat}>
        {v.lines.map(([who, text]) => (
          <div key={who} className={clsx(styles.msg, (who === 'You' || who === '您') && styles.msgYou)}>
            <span className={styles.who}>{who}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={styles.lines}>
      {v.lines.map((l) => (
        <div key={l.join()} className={styles.line}>
          {l.map((c, i) => (
            <span key={i} className={clsx(i === l.length - 1 && styles.lineEnd, (c === 'not allowed' || c === '不允許') && styles.muted)}>
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Row({u, source}) {
  return (
    <article className={styles.item} id={`use-${u.id}`}>
      <div className={styles.copy}>
        <p className={styles.product}>{u.product}</p>
        <h3 className={styles.problem}>{u.problem}</h3>
        <p className={styles.solution}>{u.solution}</p>
        {u.links ? (
          <div className={styles.links}>
            {u.links.map(([label, to]) => (
              <Link key={to} to={to} onClick={() => track('docs_use_case_link', {id: u.id, to, source})}>
                {label} →
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.actions}>
            {u.sales ? (
              <SalesButton source={`${source}-${u.id}`} variant="secondary" />
            ) : (
              <Link className={cv.btnSecondary} to={u.to} onClick={() => track('docs_use_case_cta', {id: u.id, source})}>
                {u.cta}
              </Link>
            )}
            {u.prompt && <PromptButton id={u.prompt} source={`${source}-${u.id}`} size="md" />}
          </div>
        )}
      </div>
      <div className={styles.visual}>
        <Visual v={u.visual} />
      </div>
    </article>
  );
}

function Card({c, source, readGuideText}) {
  return (
    <article className={clsx('lite-cardgrid__cell', styles.card)} id={`use-${c.id}`}>
      <p className={styles.product}>{c.product}</p>
      <h4 className={styles.cardProblem}>{c.problem}</h4>
      <p className={styles.cardText}>{c.text}</p>
      <div className={styles.cardVisual}>
        <Visual v={c.visual} />
      </div>
      <div className={styles.cardActions}>
        <Link className={styles.cardLink} to={c.to} onClick={() => track('docs_use_case_cta', {id: c.id, source})}>
          {readGuideText}
        </Link>
        <PromptButton id={c.prompt} source={`${source}-${c.id}`} />
      </div>
    </article>
  );
}

export default function UseCases({source = 'docs-home'}) {
  const t = useLocaleText();
  const useCases = t(USE_CASES_ZH, USE_CASES);
  const cardGroups = t(CARD_GROUPS_ZH, CARD_GROUPS);
  const productCards = t(PRODUCT_CARDS_ZH, PRODUCT_CARDS);
  const [sdk, gateway, ...rest] = useCases;
  const readGuideText = t('閱讀指南', 'Read the guide');

  return (
    <section className={styles.wrap} aria-labelledby="use-cases-title">
      <h2 id="use-cases-title" className={styles.title}>
        {t('為什麼開發人員喜愛 LiteLLM', 'Why developers love LiteLLM')}
      </h2>
      <div className={clsx(styles.list, styles.listOpen)}>
        <Row u={sdk} source={source} />
        <Row u={gateway} source={source} />
      </div>
      <div className={styles.built}>
        <h3 className={styles.moreTitle}>{t('建構於閘道之上', 'Built on the gateway')}</h3>
        <p className={styles.moreLead}>
          {t(
            '當您的應用程式呼叫閘道時，同一套部署也能為您的應用程式提供 MCP 工具與代理，並為每個請求挑選合適的模型。您可以從終端機或程式設計代理直接操作它。',
            'When your apps call the gateway, the same deployment can also give MCP tools and agents to your apps. It can select the correct model for each request. You can operate it from your terminal or from your coding agent.',
          )}
        </p>
        {cardGroups.map((g) => (
          <div key={g.title} className={styles.group}>
            <p className={styles.groupTitle}>{g.title}</p>
            <div className={clsx('lite-cardgrid', styles.cards)}>
              {g.ids.map((id) => (
                <Card key={id} c={productCards.find((c) => c.id === id)} source={source} readGuideText={readGuideText} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={clsx(styles.list, styles.listEnd)}>
        {rest.map((u) => (
          <Row key={u.id} u={u} source={source} />
        ))}
      </div>
    </section>
  );
}

