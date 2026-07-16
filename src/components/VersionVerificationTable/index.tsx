import React, { useState } from "react";
import styles from "./styles.module.css";
import useLocaleText from "@site/src/utils/useLocaleText";

interface VersionEntry {
  version: string;
  sha256: string;
  gitCommit: string;
}

interface Props {
  entries: VersionEntry[];
}

function CopyButton({ text }: { text: string }) {
  const t = useLocaleText();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      className={styles.copyBtn}
      onClick={handleCopy}
      title={t("複製完整 SHA-256", "Copy full SHA-256")}
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}

export default function VersionVerificationTable({ entries }: Props) {
  const t = useLocaleText();
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("版本", "Version")}</th>
            <th>SHA-256</th>
            <th>{t("未發現入侵指標", "Clean of IOCs")}</th>
            <th>{t("符合 Git", "Matches Git")}</th>
            <th>{t("Git 提交", "Git Commit")}</th>
            <th>{t("狀態", "Status")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={`${entry.version}-${entry.gitCommit}`}>
              <td className={styles.version}>{entry.version}</td>
              <td>
                <span className={styles.sha}>
                  <code>{entry.sha256.slice(0, 16)}…</code>
                  <CopyButton text={entry.sha256} />
                </span>
              </td>
              <td>
                <span className={styles.badgeClean}>✔ {t("乾淨", "CLEAN")}</span>
              </td>
              <td>
                <span className={styles.badgeYes}>✔ {t("是", "YES")}</span>
              </td>
              <td>
                <a
                  className={styles.commitLink}
                  href={`https://github.com/BerriAI/litellm/commit/${entry.gitCommit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entry.gitCommit}
                </a>
              </td>
              <td>
                <span className={styles.badgeClean}>✔ {t("乾淨", "CLEAN")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
