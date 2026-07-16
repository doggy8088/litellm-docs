import React, {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import SubscribeForm from '@site/src/components/SubscribeForm';
import useLocaleText, {useIsZhTw} from '@site/src/utils/useLocaleText';
import styles from './styles.module.css';

const TABS = [
  {id: 'all', label: 'All', zhLabel: '全部'},
  {id: 'engineering', label: 'Engineering', zhLabel: '工程'},
  {id: 'ideas', label: 'Ideas', zhLabel: '觀點'},
  {id: 'security', label: 'Security', zhLabel: '安全性'},
  {id: 'infrastructure', label: 'Performance / Reliability', zhLabel: '效能／可靠性'},
];

const SECURITY_TAGS = ['security', 'incident-report'];
const INFRA_TAGS = ['performance', 'reliability', 'infrastructure'];
const IDEAS_TAGS = ['ideas', 'thesis'];

function hasTag(item, tagSet) {
  const tags = item.content?.metadata?.tags || [];
  return tags.some(t => tagSet.includes(t.label));
}

function filterItems(items, tab) {
  if (tab === 'all') return items;
  if (tab === 'security') return items.filter(i => hasTag(i, SECURITY_TAGS));
  if (tab === 'infrastructure') return items.filter(i => hasTag(i, INFRA_TAGS));
  if (tab === 'ideas') return items.filter(i => hasTag(i, IDEAS_TAGS));
  return items.filter(i =>
    !hasTag(i, SECURITY_TAGS) &&
    !hasTag(i, INFRA_TAGS) &&
    !hasTag(i, IDEAS_TAGS)
  );
}

// ── Provider marquee ──────────────────────────────────────────────────────
const PROVIDERS = [
  { name: 'OpenAI',        img: 'https://www.google.com/s2/favicons?domain=openai.com&sz=64' },
  { name: 'Anthropic',     img: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64' },
  { name: 'Google Gemini', img: 'https://www.google.com/s2/favicons?domain=ai.google.dev&sz=64' },
  { name: 'AWS Bedrock',   img: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64' },
  { name: 'Azure OpenAI',  img: 'https://www.google.com/s2/favicons?domain=azure.microsoft.com&sz=64' },
  { name: 'Mistral AI',    img: 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=64' },
  { name: 'Meta Llama',    img: 'https://www.google.com/s2/favicons?domain=meta.com&sz=64' },
  { name: 'Groq',          img: 'https://www.google.com/s2/favicons?domain=groq.com&sz=64' },
  { name: 'Hugging Face',  img: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=64' },
  { name: 'Perplexity',    img: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64' },
  { name: 'DeepSeek',      img: 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=64' },
  { name: 'Cohere',        img: 'https://www.google.com/s2/favicons?domain=cohere.com&sz=64' },
  { name: 'Together AI',   img: 'https://www.google.com/s2/favicons?domain=together.ai&sz=64' },
  { name: 'Vertex AI',     img: 'https://www.google.com/s2/favicons?domain=cloud.google.com&sz=64' },
];

const DOUBLED = [...PROVIDERS, ...PROVIDERS];

function ProviderMarquee() {
  const t = useLocaleText();
  return (
    <div className={styles.marqueeWrap}>
      <p className={styles.marqueeLabel}>{t('路由至超過 100 個提供者', 'Routing to 100+ providers')}</p>
      <div className={styles.marqueeOuter}>
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />
        <div className={styles.marqueeTrack}>
          {DOUBLED.map((p, i) => (
            <span key={i} className={styles.marqueeItem}>
              <img src={p.img} alt={p.name} width={18} height={18} className={styles.marqueeIcon} />
              <span>{p.name}</span>
              <span className={styles.marqueeSep}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Post row ──────────────────────────────────────────────────────────────
function formatDate(dateStr, isZhTw) {
  return new Date(dateStr).toLocaleDateString(isZhTw ? 'zh-TW' : 'en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function AuthorList({authors}) {
  if (!authors || authors.length === 0) return null;
  return (
    <>
      {authors.map((a, i) => (
        <React.Fragment key={a.name}>
          {i > 0 && <span className={styles.authorSep}> </span>}
          {a.url ? (
            <a href={a.url} target="_blank" rel="noopener" className={styles.authorLink}>{a.name}</a>
          ) : (
            <span className={styles.authorName}>{a.name}</span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function PostRow({post, isZhTw}) {
  const {title, permalink, date, description, authors} = post;
  return (
    <article className={styles.post}>
      <Link to={permalink} className={styles.titleLink}>
        <h2 className={styles.title}>{title}</h2>
      </Link>
      {description && <p className={styles.desc}>{description}</p>}
      <div className={styles.meta}>
        <AuthorList authors={authors} />
        {authors && authors.length > 0 && <span className={styles.metaDash}> — </span>}
        <time className={styles.date} dateTime={date}>{formatDate(date, isZhTw)}</time>
      </div>
    </article>
  );
}

function Pagination({metadata}) {
  const t = useLocaleText();
  const {previousPage, nextPage} = metadata;
  if (!previousPage && !nextPage) return null;
  return (
    <nav className={styles.pagination} aria-label={t('部落格分頁', 'Blog list pagination')}>
      {previousPage ? <Link to={previousPage} className={styles.pageLink}>&larr; {t('較新的文章', 'Newer posts')}</Link> : <span />}
      {nextPage ? <Link to={nextPage} className={styles.pageLink}>{t('較舊的文章', 'Older posts')} &rarr;</Link> : <span />}
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function BlogListPage(props) {
  const t = useLocaleText();
  const isZhTw = useIsZhTw();
  const items = props.items || [];
  const metadata = props.metadata || {};
  const [activeTab, setActiveTab] = useState('all');
  const filtered = filterItems(items, activeTab);

  return (
    <Layout
      title={t('工程部落格', 'Engineering Blog')}
      description={t(
        '我們如何打造全球使用最廣泛的開放原始碼 AI 閘道，以及在路由、可靠性與可觀測性方面的實務心得。',
        "How we build the world's most widely used open-source AI Gateway. Routing, reliability, observability, and what we learn along the way.",
      )}
    >
      <div className={styles.page}>
        {/* Hero */}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>AI Gateway</p>
          <h1 className={styles.heroTitle}>{t('工程', 'Engineering')}</h1>
          <p className={styles.heroSub}>
            {t(
              '我們如何打造全球使用最廣泛的開放原始碼 AI 閘道，以及在路由、可靠性與可觀測性方面的實務心得。',
              "How we build the world's most widely used open-source AI Gateway. Routing, reliability, observability, and what we learn along the way.",
            )}
          </p>
          <a href="https://jobs.ashbyhq.com/litellm" target="_blank" rel="noopener noreferrer" className={styles.hiringBtn}>
            {t('人才招募中', "We're hiring!")}
          </a>
          <div className={styles.subscribeSection}>
            <p className={styles.subscribeLabel}>{t('將最新文章寄到您的信箱', 'Get new posts in your inbox')}</p>
            <SubscribeForm />
          </div>
        </header>

        <ProviderMarquee />

        {/* Tabs */}
        <nav className={styles.tabs} aria-label={t('依分類篩選文章', 'Filter posts by category')}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              {t(tab.zhLabel, tab.label)}
            </button>
          ))}
        </nav>

        {/* Post list */}
        <main className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.emptyMsg}>{t('此頁沒有符合目前篩選條件的文章。', 'No posts on this page match the selected filter.')}</p>
          )}
          {filtered.map(({content}) => (
            <PostRow key={content.metadata.permalink} post={content.metadata} isZhTw={isZhTw} />
          ))}
        </main>

        <Pagination metadata={metadata} />
      </div>
    </Layout>
  );
}
