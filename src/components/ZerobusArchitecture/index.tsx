import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useLocaleText from '@site/src/utils/useLocaleText';
import styles from './styles.module.css';

function Logo({ name }: { name: string }) {
  return (
    <img
      src={useBaseUrl(`/img/zerobus/logos/${name}.svg`)}
      className={styles.logo}
      alt=""
      role="presentation"
    />
  );
}

export default function ZerobusArchitecture() {
  const t = useLocaleText();
  return (
    <div className={styles.wrapper}>
      <div
        className={styles.diagram}
        role="img"
        aria-label={t(
          '應用程式請求透過 LiteLLM Gateway 傳送至 OpenAI、Anthropic 與 Google 等模型提供者；閘道將請求記錄傳送至 Databricks Zerobus Ingest，並寫入 Unity Catalog Delta 資料表。',
          'Application requests flow through LiteLLM Gateway to model providers such as OpenAI, Anthropic, and Google. The gateway sends request logs to Databricks Zerobus Ingest, which writes them to a Unity Catalog Delta table.',
        )}
      >
        <div className={`${styles.node} ${styles.application}`}>
          <svg className={styles.appIcon} viewBox="0 0 32 32" aria-hidden="true">
            <rect x="3" y="5" width="26" height="22" rx="3" />
            <path d="M3 11h26M9 17l-3 3 3 3m14-6 3 3-3 3m-5-7-4 10" />
            <path d="M7 8h.01M11 8h.01" />
          </svg>
          <span className={styles.label}>{t('應用程式', 'Application')}</span>
        </div>

        <div className={`${styles.arrow} ${styles.applicationArrow}`} aria-hidden="true" />

        <div className={`${styles.node} ${styles.gateway}`}>
          <span className={styles.train} aria-hidden="true">🚅</span>
          <span className={styles.label}>LiteLLM Gateway</span>
        </div>

        <div className={`${styles.arrow} ${styles.providerArrow}`} aria-hidden="true" />

        <div className={`${styles.node} ${styles.providers}`}>
          <div className={styles.providerLogos}>
            <Logo name="openai" />
            <Logo name="anthropic" />
            <Logo name="google" />
          </div>
          <span className={styles.label}>{t('模型提供者', 'Model providers')}</span>
        </div>

        <div className={styles.logArrow} aria-hidden="true">
          <span>{t('請求記錄', 'Request logs')}</span>
        </div>

        <div className={`${styles.node} ${styles.zerobus}`}>
          <Logo name="databricks" />
          <span className={styles.label}>Zerobus Ingest</span>
        </div>

        <div className={`${styles.arrow} ${styles.tableArrow}`} aria-hidden="true" />

        <div className={`${styles.node} ${styles.table}`}>
          <Logo name="databricks" />
          <span className={styles.label}>Unity Catalog<br />{t('Delta 資料表', 'Delta table')}</span>
        </div>
      </div>
    </div>
  );
}
