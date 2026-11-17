import React from 'react';
import clsx from 'clsx';
import useLocaleText from '@site/src/utils/useLocaleText';
import {SALES_URL, TRIAL_URL, withUtm} from './content';
import {track} from './shared';
import {useSalesForm} from '../SalesForm';
import styles from './styles.module.css';

// "Talk to sales" opens the website's Enterprise request form as a dialog on
// the page (see components/SalesForm), which submits to the same Webflow form
// and Zap. The href stays the website form, for modified clicks and no-JS.
export default function SalesButton({
  kind = 'sales',
  source = 'docs',
  variant = 'primary',
  children,
  className,
}) {
  const t = useLocaleText();
  const {open} = useSalesForm();
  const url = withUtm(kind === 'trial' ? TRIAL_URL : SALES_URL, source);
  const label = children || (kind === 'trial' ? t('開始 30 天免費試用', 'Start a 30-day trial') : t('聯絡業務團隊', 'Talk to sales'));

  const cls = clsx(variant === 'primary' ? styles.btnPrimary : styles.btnSecondary, className);
  const onClick = (e) => {
    track('docs_sales_cta_clicked', {kind, source, embedded: true});
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open({intent: kind === 'trial' ? '30-day-trial' : 'talk-to-sales', source});
  };

  return (
    <a className={cls} href={url} target="_blank" rel="noopener" onClick={onClick}>
      {label}
    </a>
  );
}
