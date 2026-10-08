import React, { useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import useLocaleText, { useIsZhTw } from '@site/src/utils/useLocaleText';

const CLOUD_TEXT_ZH: Record<string, string> = {
  'Clients (OpenAI SDK, LangChain, curl)': '用戶端（OpenAI SDK、LangChain、curl）',
  'Clients, routed to the nearest region': '用戶端，路由至最近的區域',
  'HTTPS, path-based routing': 'HTTPS、依路徑路由',
  'ALB or NLB via Service / Ingress': '透過 Service／Ingress 使用 ALB 或 NLB',
  'ALB Ingress, path-based routing': 'ALB Ingress、依路徑路由',
  'Global HTTPS Load Balancer': '全域 HTTPS 負載平衡器',
  'serverless NEGs, URL map': '無伺服器 NEG、URL 對應',
  'Cloud Load Balancing': 'Cloud 負載平衡',
  'via Service / Ingress': '透過 Service／Ingress',
  'GKE Ingress, path-based routing': 'GKE Ingress、依路徑路由',
  'or Front Door, TLS termination': '或 Front Door、TLS 終止',
  'AGIC, path-based routing': 'AGIC、依路徑路由',
  'writer + reader, IAM auth': '寫入節點與讀取節點、IAM 驗證',
  'multi-AZ, TLS': '跨可用區域、TLS',
  'master key, provider keys': '主金鑰、提供者金鑰',
  'writer + optional reader': '寫入節點與選用的讀取節點',
  'standalone or cluster': '獨立執行個體或叢集',
  'primary + read replica': '主要執行個體與讀取複本',
  'private IP, TLS': '私人 IP、TLS',
  'Flexible Server': '彈性伺服器',
  'Terraform on ECS Fargate': '在 ECS Fargate 上使用 Terraform',
  'EKS with Helm': '搭配 Helm 使用 EKS',
  'EKS with Helm (microservices)': '搭配 Helm 使用 EKS（微服務）',
  'Terraform on Cloud Run': '在 Cloud Run 上使用 Terraform',
  'GKE with Helm': '搭配 Helm 使用 GKE',
  'GKE with Helm (microservices)': '搭配 Helm 使用 GKE（微服務）',
  'AKS with Helm': '搭配 Helm 使用 AKS',
  'AKS with Helm (microservices)': '搭配 Helm 使用 AKS（微服務）',
  'latency or geo DNS routing': '依延遲或地理位置進行 DNS 路由',
  'latency-based routing': '依延遲路由',
  'geolocation routing policy': '地理位置路由原則',
  'performance routing, or Front Door': '效能路由或 Front Door',
  'LiteLLM instances': 'LiteLLM 執行個體',
  'regional load balancer + pods': '區域負載平衡器與 Pod',
  'Regional Redis': '區域 Redis',
  'rate limits, router state, cache': '速率限制、路由器狀態、快取',
  'PostgreSQL (primary)': 'PostgreSQL（主要）',
  'the single shared database': '單一共用資料庫',
  'reads (optional replica), writes go to primary': '從選用複本讀取，寫入主要執行個體',
  'Read replica (optional)': '讀取複本（選用）',
};

function useCloudText() {
  const isZhTw = useIsZhTw();
  return (text: string) => (isZhTw ? CLOUD_TEXT_ZH[text] ?? text : text);
}

/* ────────────────────── Shared pieces ────────────────────── */

function Icon({ file, className }: { file: string; className?: string }) {
  return (
    <img
      src={useBaseUrl(`/img/cloud_icons/${file}`)}
      className={className ?? styles.nodeIcon}
      alt=""
      role="presentation"
    />
  );
}

function Clients({ label = 'Clients (OpenAI SDK, LangChain, curl)' }: { label?: string }) {
  const cloudText = useCloudText();
  return (
    <div className={styles.clients}>
      <div className={styles.clientsIcon}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
      <span className={styles.clientsLabel}>{cloudText(label)}</span>
    </div>
  );
}

function Node({
  icon,
  title,
  subtitle,
  accent,
  small,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  accent?: 'blue' | 'green';
  small?: boolean;
}) {
  const cloudText = useCloudText();
  const cls = [
    styles.node,
    accent === 'blue' ? styles.nodeAccent : '',
    accent === 'green' ? styles.nodeGreen : '',
    small ? styles.nodeSmall : '',
  ].join(' ');
  return (
    <div className={cls}>
      <Icon file={icon} />
      <div className={styles.nodeText}>
        <span className={styles.nodeTitle}>{cloudText(title)}</span>
        {subtitle && <span className={styles.nodeSubtitle}>{cloudText(subtitle)}</span>}
      </div>
    </div>
  );
}

function ComputeNode({
  icon,
  title,
  subtitle,
  replicas,
}: {
  icon: string;
  title: string;
  subtitle: string;
  replicas: string[];
}) {
  const cloudText = useCloudText();
  return (
    <div className={styles.computeNode}>
      <div className={styles.computeHeader}>
        <Icon file={icon} />
        <div className={styles.nodeText}>
          <span className={styles.nodeTitle}>{cloudText(title)}</span>
          <span className={styles.nodeSubtitle}>{cloudText(subtitle)}</span>
        </div>
      </div>
      <div className={styles.replicaRow}>
        {replicas.map((r) => (
          <span key={r} className={styles.replicaPill}>
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

function ConnectorDown({ label }: { label?: string }) {
  const cloudText = useCloudText();
  if (!label) return <div className={styles.connectorDown} />;
  return (
    <div className={styles.connectorLabeled}>
      <span className={styles.connectorLabel}>{cloudText(label)}</span>
      <div className={styles.connectorDown} />
    </div>
  );
}

function Branch({ legs }: { legs: number }) {
  const positions =
    legs === 2 ? ['30%', '70%'] : legs === 3 ? ['20%', '50%', '80%'] : ['50%'];
  return (
    <div className={styles.branch}>
      <div className={styles.branchStem} />
      <div className={styles.branchBar} style={{ left: positions[0], right: `calc(100% - ${positions[positions.length - 1]})` }} />
      {positions.map((p) => (
        <div key={p} className={styles.branchLeg} style={{ left: p }} />
      ))}
    </div>
  );
}

/* ────────────────────── Per-cloud single-region diagrams ────────────────────── */

type CloudKey =
  | 'aws-ecs'
  | 'aws-eks'
  | 'aws-eks-micro'
  | 'gcp-cloud-run'
  | 'gcp-gke'
  | 'gcp-gke-micro'
  | 'azure-aks'
  | 'azure-aks-micro';

const MONO_PILLS = ['litellm', 'litellm', 'litellm'];
const MICRO_PILLS = ['gateway', 'backend', 'ui'];

const CLOUD_SPECS: Record<
  CloudKey,
  {
    lb: { icon: string; title: string; subtitle: string };
    compute: { icon: string; title: string; subtitle: string; pills: string[] };
    data: { icon: string; title: string; subtitle: string }[];
  }
> = {
  'aws-ecs': {
    lb: { icon: 'aws-elb.svg', title: 'Application Load Balancer', subtitle: 'HTTPS, path-based routing' },
    compute: {
      icon: 'aws-ecs.svg',
      title: 'ECS Fargate',
      subtitle: 'gateway :4000, backend :4001, ui :3000',
      pills: MICRO_PILLS,
    },
    data: [
      { icon: 'aws-rds.svg', title: 'Aurora PostgreSQL', subtitle: 'writer + reader, IAM auth' },
      { icon: 'aws-elasticache.svg', title: 'ElastiCache Redis', subtitle: 'multi-AZ, TLS' },
      { icon: 'aws-secrets-manager.svg', title: 'Secrets Manager', subtitle: 'master key, provider keys' },
    ],
  },
  'aws-eks': {
    lb: { icon: 'aws-elb.svg', title: 'Load Balancer', subtitle: 'ALB or NLB via Service / Ingress' },
    compute: { icon: 'aws-eks.svg', title: 'EKS', subtitle: 'litellm-helm chart, HPA on CPU', pills: MONO_PILLS },
    data: [
      { icon: 'aws-rds.svg', title: 'RDS PostgreSQL', subtitle: 'DATABASE_URL' },
      { icon: 'aws-elasticache.svg', title: 'ElastiCache Redis', subtitle: 'REDIS_HOST / PORT / PASSWORD' },
    ],
  },
  'aws-eks-micro': {
    lb: { icon: 'aws-elb.svg', title: 'Load Balancer', subtitle: 'ALB Ingress, path-based routing' },
    compute: {
      icon: 'aws-eks.svg',
      title: 'EKS',
      subtitle: 'litellm chart: gateway :4000, backend :4001, ui :3000',
      pills: MICRO_PILLS,
    },
    data: [
      { icon: 'aws-rds.svg', title: 'RDS PostgreSQL', subtitle: 'writer + optional reader' },
      { icon: 'aws-elasticache.svg', title: 'ElastiCache Redis', subtitle: 'standalone or cluster' },
    ],
  },
  'gcp-cloud-run': {
    lb: { icon: 'gcp-cloud-load-balancing.svg', title: 'Global HTTPS Load Balancer', subtitle: 'serverless NEGs, URL map' },
    compute: {
      icon: 'gcp-cloud-run.svg',
      title: 'Cloud Run',
      subtitle: 'gateway :4000, backend :4001, ui :3000',
      pills: MICRO_PILLS,
    },
    data: [
      { icon: 'gcp-cloud-sql.svg', title: 'Cloud SQL PostgreSQL', subtitle: 'primary + read replica' },
      { icon: 'gcp-memorystore.svg', title: 'Memorystore Redis', subtitle: 'private IP, TLS' },
    ],
  },
  'gcp-gke': {
    lb: { icon: 'gcp-cloud-load-balancing.svg', title: 'Cloud Load Balancing', subtitle: 'via Service / Ingress' },
    compute: {
      icon: 'gcp-google-kubernetes-engine.svg',
      title: 'GKE',
      subtitle: 'litellm-helm chart, HPA on CPU',
      pills: MONO_PILLS,
    },
    data: [
      { icon: 'gcp-cloud-sql.svg', title: 'Cloud SQL PostgreSQL', subtitle: 'DATABASE_URL' },
      { icon: 'gcp-memorystore.svg', title: 'Memorystore Redis', subtitle: 'REDIS_HOST / PORT / PASSWORD' },
    ],
  },
  'gcp-gke-micro': {
    lb: { icon: 'gcp-cloud-load-balancing.svg', title: 'Cloud Load Balancing', subtitle: 'GKE Ingress, path-based routing' },
    compute: {
      icon: 'gcp-google-kubernetes-engine.svg',
      title: 'GKE',
      subtitle: 'litellm chart: gateway :4000, backend :4001, ui :3000',
      pills: MICRO_PILLS,
    },
    data: [
      { icon: 'gcp-cloud-sql.svg', title: 'Cloud SQL PostgreSQL', subtitle: 'writer + optional reader' },
      { icon: 'gcp-memorystore.svg', title: 'Memorystore Redis', subtitle: 'standalone or cluster' },
    ],
  },
  'azure-aks': {
    lb: { icon: 'azure-application-gateways.svg', title: 'Application Gateway', subtitle: 'or Front Door, TLS termination' },
    compute: {
      icon: 'azure-kubernetes-services.svg',
      title: 'AKS',
      subtitle: 'litellm-helm chart, HPA on CPU',
      pills: MONO_PILLS,
    },
    data: [
      { icon: 'azure-azure-database-postgresql-server.svg', title: 'Azure Database for PostgreSQL', subtitle: 'Flexible Server' },
      { icon: 'azure-cache-redis.svg', title: 'Azure Cache for Redis', subtitle: 'REDIS_HOST / PORT / PASSWORD' },
    ],
  },
  'azure-aks-micro': {
    lb: { icon: 'azure-application-gateways.svg', title: 'Application Gateway', subtitle: 'AGIC, path-based routing' },
    compute: {
      icon: 'azure-kubernetes-services.svg',
      title: 'AKS',
      subtitle: 'litellm chart: gateway :4000, backend :4001, ui :3000',
      pills: MICRO_PILLS,
    },
    data: [
      { icon: 'azure-azure-database-postgresql-server.svg', title: 'Azure Database for PostgreSQL', subtitle: 'writer + optional reader' },
      { icon: 'azure-cache-redis.svg', title: 'Azure Cache for Redis', subtitle: 'standalone or cluster' },
    ],
  },
};

export function CloudArchitecture({ cloud }: { cloud: CloudKey }) {
  const spec = CLOUD_SPECS[cloud];
  return (
    <div className={styles.wrapper}>
      <div className={styles.diagram}>
        <Clients />
        <ConnectorDown />
        <Node icon={spec.lb.icon} title={spec.lb.title} subtitle={spec.lb.subtitle} accent="blue" />
        <ConnectorDown />
        <ComputeNode
          icon={spec.compute.icon}
          title={spec.compute.title}
          subtitle={spec.compute.subtitle}
          replicas={spec.compute.pills}
        />
        <Branch legs={spec.data.length as 2 | 3} />
        <div className={styles.dataRow}>
          {spec.data.map((d) => (
            <Node key={d.title} icon={d.icon} title={d.title} subtitle={d.subtitle} small />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── CSP selector ────────────────────── */

const CSP_TABS: {
  key: string;
  label: string;
  icon: string;
  variants: { key: CloudKey; label: string }[];
}[] = [
  {
    key: 'aws',
    label: 'AWS',
    icon: 'aws.svg',
    variants: [
      { key: 'aws-ecs', label: 'Terraform on ECS Fargate' },
      { key: 'aws-eks', label: 'EKS with Helm' },
      { key: 'aws-eks-micro', label: 'EKS with Helm (microservices)' },
    ],
  },
  {
    key: 'gcp',
    label: 'Google Cloud',
    icon: 'google-cloud.svg',
    variants: [
      { key: 'gcp-cloud-run', label: 'Terraform on Cloud Run' },
      { key: 'gcp-gke', label: 'GKE with Helm' },
      { key: 'gcp-gke-micro', label: 'GKE with Helm (microservices)' },
    ],
  },
  {
    key: 'azure',
    label: 'Azure',
    icon: 'microsoft-azure.svg',
    variants: [
      { key: 'azure-aks', label: 'AKS with Helm' },
      { key: 'azure-aks-micro', label: 'AKS with Helm (microservices)' },
    ],
  },
];

export function CloudArchitectureSelector() {
  const cloudText = useCloudText();
  const [cspKey, setCspKey] = useState('aws');
  const csp = CSP_TABS.find((t) => t.key === cspKey) ?? CSP_TABS[0];
  const [variantByCsp, setVariantByCsp] = useState<Record<string, CloudKey>>({});
  const variant = variantByCsp[csp.key] ?? csp.variants[0].key;

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist">
        {CSP_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === csp.key}
            className={`${styles.tab} ${t.key === csp.key ? styles.tabActive : ''}`}
            onClick={() => setCspKey(t.key)}
          >
            <Icon file={t.icon} className={styles.tabIcon} />
            {t.label}
          </button>
        ))}
      </div>
      {csp.variants.length > 1 && (
        <div className={styles.variantRow}>
          {csp.variants.map((v) => (
            <button
              key={v.key}
              className={`${styles.variantPill} ${v.key === variant ? styles.variantPillActive : ''}`}
              onClick={() => setVariantByCsp({ ...variantByCsp, [csp.key]: v.key })}
            >
              {cloudText(v.label)}
            </button>
          ))}
        </div>
      )}
      {csp.variants.length === 1 && (
        <div className={styles.variantRow}>
          <span className={`${styles.variantPill} ${styles.variantPillActive}`}>
            {cloudText(csp.variants[0].label)}
          </span>
        </div>
      )}
      <CloudArchitecture cloud={variant} />
    </div>
  );
}

/* ────────────────────── Multi-region diagram ────────────────────── */

function Region({
  name,
  brandIcon,
  primary,
  children,
}: {
  name: string;
  brandIcon: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const t = useLocaleText();
  return (
    <div className={`${styles.region} ${primary ? styles.regionPrimary : ''}`}>
      <div className={styles.regionHeader}>
        <Icon file={brandIcon} className={styles.regionIcon} />
        <span className={styles.regionName}>{name}</span>
        <span className={`${styles.badge} ${primary ? styles.badgeBlue : styles.badgeGreen}`}>
          {primary ? t('主要', 'primary') : t('次要', 'secondary')}
        </span>
      </div>
      {children}
    </div>
  );
}

const MULTI_REGION_SPECS = {
  aws: {
    label: 'AWS',
    brand: 'aws.svg',
    dns: { icon: 'aws-route53.svg', title: 'Route 53', subtitle: 'latency-based routing' },
    primaryRegion: 'us-east-1',
    secondaryRegion: 'eu-west-1',
  },
  gcp: {
    label: 'Google Cloud',
    brand: 'google-cloud.svg',
    dns: { icon: 'gcp-cloud-dns.svg', title: 'Cloud DNS', subtitle: 'geolocation routing policy' },
    primaryRegion: 'us-central1',
    secondaryRegion: 'europe-west1',
  },
  azure: {
    label: 'Azure',
    brand: 'microsoft-azure.svg',
    dns: {
      icon: 'azure-traffic-manager-profiles.svg',
      title: 'Traffic Manager',
      subtitle: 'performance routing, or Front Door',
    },
    primaryRegion: 'East US',
    secondaryRegion: 'West Europe',
  },
} as const;

export function MultiRegionArchitecture() {
  const t = useLocaleText();
  const [csp, setCsp] = useState<keyof typeof MULTI_REGION_SPECS>('aws');
  const spec = MULTI_REGION_SPECS[csp];
  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist">
        {(Object.keys(MULTI_REGION_SPECS) as (keyof typeof MULTI_REGION_SPECS)[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === csp}
            className={`${styles.tab} ${k === csp ? styles.tabActive : ''}`}
            onClick={() => setCsp(k)}
          >
            <Icon file={MULTI_REGION_SPECS[k].brand} className={styles.tabIcon} />
            {MULTI_REGION_SPECS[k].label}
          </button>
        ))}
      </div>
      <div className={styles.diagram}>
        <Clients label="Clients, routed to the nearest region" />
        <ConnectorDown label="latency or geo DNS routing" />
        <Node icon={spec.dns.icon} title={spec.dns.title} subtitle={spec.dns.subtitle} accent="blue" />
        <Branch legs={2} />
        <div className={styles.regionsRow}>
          <Region name={spec.primaryRegion} brandIcon={spec.brand} primary>
            <Node icon="kubernetes.svg" title="LiteLLM instances" subtitle="regional load balancer + pods" small />
            <ConnectorDown />
            <Node icon="redis.svg" title="Regional Redis" subtitle="rate limits, router state, cache" small />
            <ConnectorDown />
            <Node
              icon="postgresql.svg"
              title="PostgreSQL (primary)"
              subtitle="the single shared database"
              accent="green"
              small
            />
          </Region>
          <Region name={spec.secondaryRegion} brandIcon={spec.brand}>
            <Node icon="kubernetes.svg" title="LiteLLM instances" subtitle="regional load balancer + pods" small />
            <ConnectorDown />
            <Node icon="redis.svg" title="Regional Redis" subtitle="rate limits, router state, cache" small />
            <ConnectorDown label="reads (optional replica), writes go to primary" />
            <Node
              icon="postgresql.svg"
              title="Read replica (optional)"
              subtitle="DATABASE_URL_READ_REPLICA"
              small
            />
          </Region>
        </div>
        <div className={`${styles.callout} ${styles.calloutSuccess}`}>
          <span>
            {t(
              '一份 Enterprise 授權涵蓋所有區域。每個執行個體都會驗證相同的 LITELLM_LICENSE，並由單一共用資料庫統計使用者與團隊限制。所有執行個體也必須共用相同的 LITELLM_MASTER_KEY 與 LITELLM_SALT_KEY。',
              'One Enterprise license covers every region. Each instance validates the same LITELLM_LICENSE, and user / team limits are counted from the single shared database. All instances must also share the same LITELLM_MASTER_KEY and LITELLM_SALT_KEY.',
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
