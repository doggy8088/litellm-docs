import React from 'react';
import styles from './styles.module.css';
import useLocaleText from '@site/src/utils/useLocaleText';

/* ────────────────────── Shared small pieces ────────────────────── */

function InfraBox({ icon, label, color }: { icon: string; label: string; color: 'green' | 'blue' | 'orange' }) {
  const colorClass =
    color === 'green'
      ? styles.infraBoxGreen
      : color === 'blue'
        ? styles.infraBoxBlue
        : styles.infraBoxOrange;

  return (
    <div className={`${styles.infraBox} ${colorClass}`}>
      <span className={styles.infraBoxIcon}>{icon}</span>
      <span className={styles.infraBoxLabel}>{label}</span>
    </div>
  );
}

/* ────────────────────── Worker column with infra ────────────────────── */

function WorkerColumn({
  name,
  region,
  subtitle,
  nodeClass,
  badgeClass,
}: {
  name: string;
  region: string;
  subtitle: string;
  nodeClass: string;
  badgeClass: string;
}) {
  const t = useLocaleText();
  return (
    <div className={styles.workerColumn}>
      <div className={`${styles.node} ${styles.nodeWorker} ${nodeClass}`}>
        <div className={styles.nodeHeader}>
          <span className={styles.nodeTitle}>{name}</span>
          <span className={`${styles.badge} ${badgeClass}`}>{region}</span>
        </div>
        <div className={styles.nodeSubtitle}>{subtitle}</div>
        <div className={styles.nodeCaption}>{t('處理 LLM 請求', 'Handles LLM requests')}</div>
      </div>
      <div className={styles.infraStack}>
        <InfraBox icon="🗄" label={t('專屬資料庫', 'Own Database')} color="green" />
        <InfraBox icon="⚡" label={t('專屬 Redis', 'Own Redis')} color="orange" />
      </div>
    </div>
  );
}

/* ────────────────────── Architecture diagram ────────────────────── */

function ArchitectureView() {
  const t = useLocaleText();
  return (
    <div className={styles.diagram}>
      {/* User */}
      <div className={styles.userRow}>
        <div className={styles.userIcon}>&#128100;</div>
        <span className={styles.userLabel}>{t('管理員', 'Admin')}</span>
      </div>

      <div className={styles.connectorDown} />

      {/* Control Plane */}
      <div className={`${styles.node} ${styles.nodeControlPlane}`}>
        <div className={styles.nodeHeader}>
          <span className={styles.nodeTitle}>{t('控制平面', 'Control Plane')}</span>
          <span className={`${styles.badge} ${styles.badgeBlue}`}>{t('僅限管理介面', 'ADMIN UI ONLY')}</span>
        </div>
        <div className={styles.nodeSubtitle}>cp.example.com</div>
        <div className={styles.nodeCaption}>
          {t('不是路由器，不會代理 LLM 請求。', 'Not a router — does not proxy LLM requests.')}
          <br />
          {t('讓管理員切換並管理不同的工作節點。', 'Lets admins switch between workers to manage them.')}
        </div>
      </div>

      {/* Branch connector with label */}
      <div className={styles.connectorBranchLabeled}>
        <span className={styles.connectorLabel}>{t('僅供介面管理', 'UI management only')}</span>
        <div className={styles.connectorBranch}>
          <div className={`${styles.branchLeg} ${styles.branchLegLeft}`} />
          <div className={`${styles.branchLeg} ${styles.branchLegRight}`} />
        </div>
      </div>

      {/* Workers */}
      <div className={styles.workersRow}>
        <WorkerColumn
          name={t('工作節點 A', 'Worker A')}
          region={t('美國東部', 'US East')}
          subtitle="worker-a.example.com"
          nodeClass={styles.nodeWorkerA}
          badgeClass={styles.badgeGreen}
        />
        <WorkerColumn
          name={t('工作節點 B', 'Worker B')}
          region={t('歐洲西部', 'EU West')}
          subtitle="worker-b.example.com"
          nodeClass={styles.nodeWorkerB}
          badgeClass={styles.badgePurple}
        />
      </div>
    </div>
  );
}

/* ────────────────────── Main component ────────────────────── */

export default function ControlPlaneArchitecture() {
  return (
    <div className={styles.wrapper}>
      <ArchitectureView />
    </div>
  );
}
