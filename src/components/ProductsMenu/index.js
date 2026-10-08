import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useLocaleText from '@site/src/utils/useLocaleText';
import styles from './styles.module.css';

const icon = (paths) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const ICONS = {
  home: icon(<>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </>),
  gateway: icon(<>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </>),
  mcp: icon(<>
    <path d="M9 3v4M15 3v4" />
    <path d="M6 7h12v4a6 6 0 0 1-12 0V7z" />
    <path d="M12 17v4" />
  </>),
  agent: icon(<>
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="5" cy="19" r="2.2" />
    <circle cx="19" cy="19" r="2.2" />
    <path d="M12 7.2v4.3M12 11.5l-5.6 5.4M12 11.5l5.6 5.4" />
  </>),
  router: icon(<>
    <circle cx="5" cy="12" r="2" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M7 12h3c2.5 0 3-7 7-7M10 12c3 0 3.5 7 7 7" />
  </>),
  sdk: icon(<>
    <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
  </>),
  lens: icon(<>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </>),
  logs: icon(<>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-5 3 3 5-7" />
  </>),
};

function getProductsMenuContent(t) {
  const home = {
    id: 'home',
    icon: 'home',
    title: t('首頁', 'Home'),
    desc: t('開始使用 LiteLLM', 'Get started with LiteLLM'),
    to: '/docs/',
  };

  const columns = [
    {
      heading: t('建置', 'Build'),
      items: [
        {
          id: 'gateway',
          icon: 'gateway',
          title: 'AI Gateway',
          desc: t('路由、控制並觀測 LLM 流量', 'Route, control, and observe LLM traffic'),
          to: '/docs/proxy/docker_quick_start',
        },
        {
          id: 'mcp',
          icon: 'mcp',
          title: 'MCP Gateway',
          desc: t('為代理程式提供受控管的工具存取權', 'Give agents governed access to tools'),
          to: '/docs/mcp',
        },
        {
          id: 'agent',
          icon: 'agent',
          title: 'Agent Gateway',
          desc: t('註冊並調用 A2A 代理程式', 'Register and invoke A2A agents'),
          to: '/docs/a2a',
        },
        {
          id: 'router',
          icon: 'router',
          title: 'Auto Router',
          desc: t('將每個請求傳送至最適合的模型', 'Send each request to the best model'),
          to: '/docs/auto_router',
        },
        {
          id: 'sdk',
          icon: 'sdk',
          title: 'Python SDK',
          desc: t('透過單一介面呼叫 100+ 個 LLM', 'Call 100+ LLMs with one interface'),
          to: '/docs/#litellm-python-sdk',
        },
      ],
    },
    {
      heading: t('監控', 'Monitor'),
      items: [
        {
          id: 'lens',
          icon: 'lens',
          title: 'Lens',
          desc: t('追蹤代理程式群並找出可改善之處', 'Trace agent swarms and find what to improve'),
          to: '/docs/proxy/lens',
        },
        {
          id: 'logs',
          icon: 'logs',
          title: t('AI Gateway - 記錄與可觀測性', 'AI Gateway - Logging & Observability'),
          desc: t('每個請求的記錄、支出與回呼', 'Logs, spend, and callbacks for every request'),
          to: '/docs/proxy/logging',
        },
      ],
    },
  ];

  const allItems = [home, ...columns.flatMap((c) => c.items)];
  return {home, columns, allItems};
}

function normalizePath(pathname) {
  return pathname.replace(/^\/en(?=\/|$)/, '') || '/';
}

// Ordered most-specific first: /docs/proxy/lens must win over the /docs/proxy prefix.
const SECTION_MATCHERS = [
  ['lens', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy/lens')],
  ['logs', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy/logging')],
  ['mcp', ({pathname}) => normalizePath(pathname).startsWith('/docs/mcp')],
  ['agent', ({pathname}) => normalizePath(pathname).startsWith('/docs/a2a')],
  ['sdk', ({hash}) => hash === '#litellm-python-sdk'],
  ['router', ({pathname}) => normalizePath(pathname).startsWith('/docs/auto_router')],
  ['gateway', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy')],
];

function currentItem(location, allItems) {
  const hit = SECTION_MATCHERS.find(([, matches]) => matches(location));
  return allItems.find((item) => item.id === (hit ? hit[0] : 'home'));
}

function MenuLink({item, active, onNavigate}) {
  return (
    <Link className={`${styles.item} ${active ? styles.itemActive : ''}`} to={item.to} onClick={onNavigate}>
      <span className={styles.icon}>{ICONS[item.icon]}</span>
      <span className={styles.text}>
        <span className={styles.title}>{item.title}</span>
        <span className={styles.desc}>{item.desc}</span>
      </span>
      {active && (
        <svg className={styles.check} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Link>
  );
}

export default function ProductsMenu({mobile}) {
  const t = useLocaleText();
  const {home, columns, allItems} = getProductsMenuContent(t);
  const location = useLocation();
  const current = currentItem(location, allItems);
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef();
  const close = () => {
    clearTimeout(leaveTimer.current);
    setOpen(false);
  };

  useEffect(close, [location.pathname, location.hash]);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  if (mobile) {
    return (
      <li className="menu__list-item">
        <span className="menu__link">{current.title}</span>
        <ul className="menu__list">
          {allItems.map((item) => (
            <li key={item.id} className="menu__list-item">
              <Link className={`menu__link ${item.id === current.id ? 'menu__link--active' : ''}`} to={item.to}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <div
      className={`${styles.root} ${open ? styles.open : ''}`}
      // Hover opens it for a mouse only; on touch screens a tap would fire
      // the hover and then the click, opening and closing it at once
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(leaveTimer.current);
        setOpen(true);
      }}
      // A short grace period, so a pointer cutting across the gap on its way
      // to the panel doesn't close it
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') leaveTimer.current = setTimeout(close, 200);
      }}
      onKeyDown={(e) => e.key === 'Escape' && close()}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t('產品', 'Products')}: ${current.title}`}
        onClick={() => setOpen((v) => !v)}>
        <span className={styles.triggerIcon}>{ICONS[current.icon]}</span>
        <span className={styles.triggerLabel}>{current.title}</span>
        <svg className={styles.chevron} viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          <path d="M2 4.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={styles.panel} role="menu">
        <div className={styles.home}>
          <MenuLink item={home} active={current.id === home.id} onNavigate={close} />
        </div>
        {columns.map((col) => (
          <div key={col.heading} className={styles.column}>
            <div className={styles.heading}>{col.heading}</div>
            {col.items.map((item) => (
              <MenuLink key={item.id} item={item} active={current.id === item.id} onNavigate={close} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
