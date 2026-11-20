import React, {useEffect, useState} from 'react';
import {Popover} from '@base-ui/react/popover';
import {useWindowSize} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
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
  logs: icon(<>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-5 3 3 5-7" />
  </>),
  models: icon(<>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>),
  lens: icon(<>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M16 16l5 5M7 11l2.5-3 2 4 2.5-3" />
  </>),
  customers: icon(<>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2" />
  </>),
  subscriptions: icon(<>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </>),
};

// Fork deviation: menu strings are localized through useLocaleText so the
// zh-TW site shows Chinese titles and descriptions. Product names stay in English.
function getProductsMenuContent(t) {
  const home = {id: 'home', icon: 'home', title: t('首頁', 'Home'), desc: t('開始使用 LiteLLM', 'Get started with LiteLLM'), to: '/docs/'};
  const products = [
    {id: 'gateway', icon: 'gateway', title: 'AI Gateway', desc: t('路由並控制 LLM 流量', 'Route and control LLM traffic'), to: '/docs/simple_proxy'},
    {id: 'lens', icon: 'lens', title: 'LiteLLM Lens', desc: t('追蹤並偵錯您的 AI 應用程式', 'Trace and debug your AI apps'), to: '/docs/proxy/lens'},
    {id: 'customers', icon: 'customers', title: t('客戶管理', 'Customer Management'), short: t('客戶', 'Customers'), desc: t('追蹤客戶用量與預算', 'Track customer usage and budgets'), to: '/docs/proxy/customers'},
    {id: 'router', icon: 'router', title: 'Auto Router', desc: t('為每個請求選出最佳模型', 'Best model for each request'), to: '/docs/auto_router'},
    {id: 'subscriptions', icon: 'subscriptions', title: 'AI Subscriptions', desc: t('Claude、Codex、Copilot、Cursor', 'Claude, Codex, Copilot, Cursor'), to: '/docs/subscriptions'},
    {id: 'logs', icon: 'logs', title: t('記錄與可觀測性', 'Logging & Observability'), short: t('記錄', 'Logging'), desc: t('記錄、支出與回呼', 'Logs, spend, and callbacks'), to: '/docs/proxy/logging'},
    {id: 'mcp', icon: 'mcp', title: 'MCP Gateway', desc: t('為代理程式提供受控管的工具存取權', 'Give agents governed access to tools'), to: '/docs/mcp'},
    {id: 'agent', icon: 'agent', title: 'Agent Gateway', desc: t('註冊並調用 A2A 代理程式', 'Register and invoke A2A agents'), to: '/docs/a2a'},
    {id: 'sdk', icon: 'sdk', title: 'Python SDK', desc: t('透過單一介面呼叫 100+ 個 LLM', 'Call 100+ LLMs with one interface'), to: '/docs/python_sdk'},
    {id: 'models', icon: 'models', title: t('模型型錄', 'Model Catalog'), desc: t('定價與上下文視窗', 'Pricing and context windows'), to: 'https://models.litellm.ai'},
  ];
  return {home, products, allItems: [home, ...products]};
}

// Fork deviation: strip the /en locale prefix so section matching works on
// the English locale too. Ordered most-specific first.
function normalizePath(pathname) {
  return pathname.replace(/^\/en(?=\/|$)/, '') || '/';
}

const SECTION_MATCHERS = [
  ['subscriptions', ({pathname}) => normalizePath(pathname).startsWith('/docs/subscriptions')],
  ['lens', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy/lens')],
  ['customers', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy/customers') || normalizePath(pathname).startsWith('/docs/proxy/customer_management')],
  ['home', ({pathname}) => normalizePath(pathname).startsWith('/docs/self_hosted_coding_agents')],
  ['logs', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy/logging')],
  ['mcp', ({pathname}) => normalizePath(pathname).startsWith('/docs/mcp')],
  ['agent', ({pathname}) => normalizePath(pathname).startsWith('/docs/a2a')],
  ['sdk', ({pathname, hash}) => normalizePath(pathname).startsWith('/docs/python_sdk') || hash === '#litellm-python-sdk'],
  ['router', ({pathname}) => normalizePath(pathname).startsWith('/docs/auto_router')],
  ['gateway', ({pathname}) => normalizePath(pathname).startsWith('/docs/proxy') || normalizePath(pathname).startsWith('/docs/simple_proxy')],
];

function currentItem(location, allItems) {
  const hit = SECTION_MATCHERS.find(([, matches]) => matches(location));
  return allItems.find((item) => item.id === (hit ? hit[0] : 'home'));
}

function MenuLink({item, active, onNavigate}) {
  return (
    <Link className={`${styles.item} ${active ? styles.itemActive : ''}`}
      to={item.to} onClick={onNavigate} aria-current={active ? 'true' : undefined}>
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

export default function ProductsMenu({mobile, onClick}) {
  const t = useLocaleText();
  const {home: HOME, products: PRODUCTS, allItems: ALL_ITEMS} = getProductsMenuContent(t);
  const location = useLocation();
  const current = currentItem(location, ALL_ITEMS);
  const [open, setOpen] = useState(false);
  const windowSize = useWindowSize();
  const mobileSidebar = useNavbarMobileSidebar();
  const isMobile = windowSize === 'mobile';

  useEffect(() => setOpen(false), [location.pathname, location.hash, mobileSidebar.shown, windowSize]);

  if (mobile) {
    return (
      <li className={`menu__list-item ${styles.mobileProducts}`}>
        <span className={styles.mobileHeading}>{t('產品', 'Products')}</span>
        <ul className={styles.mobileList}>
          {PRODUCTS.map((item) => (
            <li key={item.id}>
              <MenuLink item={item} active={item.id === current.id} onNavigate={onClick} />
            </li>
          ))}
          <li><MenuLink item={HOME} active={current.id === HOME.id} onNavigate={onClick} /></li>
        </ul>
      </li>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={isMobile}>
      <Popover.Trigger className={styles.trigger} aria-label={`${t('產品', 'Products')}: ${current.title}`}>
        <span className={styles.triggerIcon}>{ICONS[current.icon]}</span>
        <span className={styles.triggerLabel}>
          <span className={styles.labelFull}>{current.title}</span>
          <span className={styles.labelShort}>{current.short || current.title}</span>
        </span>
        <span className={styles.mobileLabel}>{t('產品', 'Products')}</span>
        <svg className={styles.chevron} viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          <path d="M2 4.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        {isMobile && <Popover.Backdrop className={styles.backdrop} />}
        <Popover.Positioner className={styles.positioner} sideOffset={8} align="start" collisionPadding={12}>
          <Popover.Popup className={styles.panel}>
            <div className={styles.header}>
              <Popover.Title className={styles.heading}>{t('產品', 'Products')}</Popover.Title>
              <Link className={styles.home} to={HOME.to} onClick={() => setOpen(false)}>{t('首頁', 'Home')}</Link>
              <Popover.Close className={styles.close} aria-label={t('關閉產品選單', 'Close products')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </Popover.Close>
            </div>
            <nav aria-label={t('產品', 'Products')} className={styles.list}>
              {PRODUCTS.map((item) => (
                <MenuLink key={item.id} item={item} active={current.id === item.id} onNavigate={() => setOpen(false)} />
              ))}
            </nav>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
