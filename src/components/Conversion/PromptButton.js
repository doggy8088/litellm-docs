import React from 'react';
import clsx from 'clsx';
import useLocaleText from '@site/src/utils/useLocaleText';
import {PROMPTS} from './content';
import {IconAgent, IconCheck} from './icons';
import {track, useCopy} from './shared';
import styles from './transit.module.css';

// A small "Copy agent prompt" button for diagrams and maps: one click puts the
// prompt for that product on the clipboard, ready for Claude Code, Codex, or
// Cursor. The full prompt text lives in content.js and in the page markdown.
export default function PromptButton({id, source, label, size = 'sm', className}) {
  const t = useLocaleText();
  const prompt = PROMPTS[id];
  const [copied, copy] = useCopy();
  if (!prompt) return null;
  const resolvedLabel = label || t('複製 AI 代理提示詞', 'Copy agent prompt');
  return (
    <button
      type="button"
      className={clsx(styles.promptBtn, size === 'md' && styles.promptBtnMd, copied && styles.promptBtnDone, className)}
      title={t(
        `${prompt.title}。請貼到 Claude Code、Codex、Cursor 或任何程式設計代理中。`,
        `${prompt.title}. Paste it into Claude Code, Codex, Cursor, or any coding agent.`,
      )}
      aria-label={copied ? t('已複製提示詞', 'Prompt copied') : `${resolvedLabel}: ${prompt.title}`}
      onClick={() => {
        copy(prompt.text);
        track('docs_agent_prompt_copied', {prompt: id, source});
      }}>
      {copied ? <IconCheck size={size === 'md' ? 16 : 14} /> : <IconAgent size={size === 'md' ? 16 : 14} />}
      <span>{copied ? t('已複製', 'Copied') : resolvedLabel}</span>
    </button>
  );
}

