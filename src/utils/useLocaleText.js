import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export function useIsZhTw() {
  const {i18n} = useDocusaurusContext();
  return i18n.currentLocale.toLowerCase() === 'zh-tw';
}

export default function useLocaleText() {
  const isZhTw = useIsZhTw();
  return (zhTw, english) => (isZhTw ? zhTw : english);
}
