import React from 'react';
import Admonition from '@theme/Admonition';
import Link from '@docusaurus/Link';
import useLocaleText, {useIsZhTw} from '@site/src/utils/useLocaleText';

const TRIAL_URL = 'https://www.litellm.ai/enterprise#trial';
const DEMO_URL = 'https://enterprise.litellm.ai/demo';

// A one-line note written inline (<EnterpriseFeature>text</EnterpriseFeature>)
// arrives as a plain string; block content separated by blank lines arrives
// already wrapped in <p> elements by MDX.
function Note({ children }) {
  if (children == null) return null;
  if (typeof children === 'string') return <p>{children}</p>;
  return children;
}

export default function EnterpriseFeature({ feature, free = false, children }) {
  const t = useLocaleText();
  const isZhTw = useIsZhTw();
  if (free) {
    return (
      <Admonition type="info" title={t('免費企業版功能', 'Free Enterprise feature')}>
        <p>
          {isZhTw ? (
            <>
              隨附於 <code>litellm[proxy]</code> 套件或任何 <code>litellm</code> Docker 映像檔中，無須企業版授權即可使用。
            </>
          ) : (
            <>
              Available with the <code>litellm[proxy]</code> package or any{' '}
              <code>litellm</code> docker image. No Enterprise license is required.
            </>
          )}
        </p>
        <Note>{children}</Note>
      </Admonition>
    );
  }

  return (
    <Admonition type="info" title={t('企業版功能', 'Enterprise feature')}>
      <p>
        {isZhTw ? (
          <>
            {feature ? `${feature}需要` : '此功能需要'} LiteLLM 企業版授權。立即開始{' '}
            <a href={TRIAL_URL}>30 天免費試用</a>或<a href={DEMO_URL}>預約展示</a>。{' '}
            <Link to="/docs/enterprise">查看企業版完整功能</Link>。
          </>
        ) : (
          <>
            {feature ? `${feature} requires` : 'This feature requires'} a LiteLLM
            Enterprise license. Start a{' '}
            <a href={TRIAL_URL}>free 30-day trial</a> or{' '}
            <a href={DEMO_URL}>book a demo</a>.{' '}
            <Link to="/docs/enterprise">See what Enterprise includes</Link>.
          </>
        )}
      </p>
      <Note>{children}</Note>
    </Admonition>
  );
}
