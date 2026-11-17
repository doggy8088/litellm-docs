import React from 'react';
import useLocaleText from '@site/src/utils/useLocaleText';
import {ONE_CLICK} from './content';
import {track} from './shared';
import styles from './styles.module.css';

// A small, self-contained block for hosted one-click deploys. The badges are
// the providers' own images, used as published.
export default function OneClickDeploy({source = 'docs'}) {
  const t = useLocaleText();
  return (
    <div className={styles.oneClick}>
      <div className={styles.oneClickCopy}>
        <p className={styles.oneClickTitle}>{t('雲端部署選項', 'Cloud deployment options')}</p>
        <p className={styles.oneClickText}>
          {t(
            'Railway 與 Render 為您代管相同的閘道與 Postgres。若使用 AWS 與 GCP，請參閱',
            'Railway and Render host the same gateway and Postgres for you. For AWS and GCP, use the ',
          )}
          <a href="/docs/proxy/deploy/terraform">{t('Terraform 部署指南', 'Terraform deployment guide')}</a>
          {t('。凡是本指南提及 ', ". Use your deployment's URL wherever this guide says ")}
          <code>http://localhost:4000</code>
          {t(' 之處，請改用您的部署網址。', '.')}
        </p>
        <p className={styles.oneClickText}>
          {t('在 Render 上，請先登入並在部署之前，將 ', 'On Render, set ')}
          <strong>Blueprint Path</strong>
          {t(' 設定為 ', ' to ')}
          <code>litellm/deploy/render/render.yaml</code>
          {t('。', ' after signing in, before you deploy.')}
        </p>
      </div>
      <div className={styles.oneClickBadges}>
        {ONE_CLICK.map(([name, url, badge]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="nofollow noopener"
            onClick={() => track('docs_one_click_deploy', {provider: name, source})}>
            <img src={badge} alt={t(`部署至 ${name}`, `Deploy on ${name}`)} height="32" />
          </a>
        ))}
      </div>
    </div>
  );
}
