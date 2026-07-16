import React from "react";
import matrix from "@site/src/data/compatibility-matrix.json";
import styles from "./styles.module.css";
import useLocaleText from "@site/src/utils/useLocaleText";

/**
 * Claude Code compatibility matrix table.
 *
 * Renders the JSON published daily by the populator
 * (`tests/claude_code/cron_vm/run_daily.sh` in BerriAI/litellm) into a
 * features-by-providers grid. Each cell shows pass / fail / not_tested /
 * not_applicable; failure cells expose the upstream error on hover.
 *
 * The JSON is bundled at build time (no fetch), so the docs page works
 * offline and the matrix value at any commit is whatever the JSON
 * checked into that commit said.
 */

type CellStatus = "pass" | "fail" | "not_tested" | "not_applicable";

interface Cell {
  status: CellStatus;
  error?: string;
  reason?: string;
}

interface Feature {
  id: string;
  name: string;
  providers: Record<string, Cell>;
}

interface Matrix {
  schema_version: string;
  generated_at: string;
  litellm_version: string;
  claude_code_version: string;
  providers: string[];
  features: Feature[];
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  bedrock_invoke: "Bedrock (Invoke)",
  bedrock_converse: "Bedrock (Converse)",
  vertex_ai: "Vertex AI",
  azure: "Azure (Foundry)",
};

const STATUS_GLYPH: Record<CellStatus, string> = {
  pass: "✅",
  fail: "❌",
  not_tested: "—",
  not_applicable: "n/a",
};

const FEATURE_LABELS_ZH: Record<string, string> = {
  basic_messaging_non_streaming: "基本訊息傳送（非串流）",
  basic_messaging_streaming: "基本訊息傳送（串流）",
  tool_use: "工具使用",
  prompt_caching_5m: "提示詞快取（5 分鐘 TTL）",
  vision: "視覺",
  thinking: "思考",
  tool_use_streaming: "工具使用（串流／細粒度）",
  thinking_with_tool_use: "延伸思考與工具使用",
  pdf_input: "PDF 文件輸入",
  prompt_caching_1h: "提示詞快取（1 小時 TTL）",
  web_search: "網路搜尋（伺服器工具）",
  structured_outputs: "結構化輸出",
  count_tokens: "count_tokens 端點",
  tool_search: "工具搜尋（MCP 探索）",
  long_context_1m: "長上下文（100 萬 tokens）",
};

function cellTitle(cell: Cell, t: (zhTw: string, english: string) => string): string {
  if (cell.status === "fail" && cell.error) return cell.error;
  if (cell.status === "not_applicable" && cell.reason) return cell.reason;
  if (cell.status === "not_tested") return t("此組合尚未執行測試", "no test ran for this combination");
  return t("通過", "passing");
}

export default function ClaudeCodeCompatibilityTable(): JSX.Element {
  const t = useLocaleText();
  const m = matrix as Matrix;
  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        <span>
          litellm <code>{m.litellm_version}</code>
        </span>
        <span>
          claude code <code>{m.claude_code_version}</code>
        </span>
        <span>
          {t("產生時間", "generated")} <code>{m.generated_at}</code>
        </span>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.featureCol}>{t("功能", "Feature")}</th>
            {m.providers.map((p) => (
              <th key={p}>{PROVIDER_LABELS[p] ?? p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.features.map((feature) => (
            <tr key={feature.id}>
              <th scope="row" className={styles.featureCol}>
                {t(FEATURE_LABELS_ZH[feature.id] ?? feature.name, feature.name)}
              </th>
              {m.providers.map((p) => {
                const cell = feature.providers[p] ?? { status: "not_tested" as const };
                return (
                  <td
                    key={p}
                    className={styles[`status_${cell.status}`]}
                    title={cellTitle(cell, t)}
                  >
                    {STATUS_GLYPH[cell.status]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
