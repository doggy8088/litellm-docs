import React from 'react';
import Link from '@docusaurus/Link';
import useLocaleText from '@site/src/utils/useLocaleText';
import {IconAgent} from './icons';
import {track} from './shared';
import styles from './usecases.module.css';

// A one-line pointer for readers who would rather hand the setup to a coding
// agent: where the prompts and skills live, and where the markdown starts.
export default function AgentBand({source = 'docs-home'}) {
  const t = useLocaleText();
  return (
    <aside className={styles.agentBand}>
      <IconAgent size={18} />
      <p className={styles.agentText}>
        <strong>{t('您正在使用程式設計代理嗎？', 'Do you use a coding agent?')}</strong>{' '}
        {t('複製下方各項產品的代理提示詞。您也可以從 ', 'Copy the agent prompt of a product below. You can also start from ')}
        <Link to="/docs/agent_resources" onClick={() => track('docs_agent_band', {target: 'agent_resources', source})}>
          {t('代理資源', 'Agent resources')}
        </Link>{' '}
        {t('與 ', 'and ')}
        <Link to="https://docs.litellm.ai/llms.txt" onClick={() => track('docs_agent_band', {target: 'llms_txt', source})}>
          llms.txt
        </Link>
        {t(' 開始。', '.')}
      </p>
    </aside>
  );
}

